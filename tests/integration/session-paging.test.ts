import { afterEach, describe, expect, test, vi } from "vitest";

import { GET } from "@/app/api/diagrams/[id]/sessions/route";
import { createSession, deleteSession, listSessionPage, parseCursor, renameSession, touchSession, type SessionRow } from "@/server/chat/sessions";

import { makeDiagram, makeOwnedDiagram } from "./helpers";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
import { auth } from "@/auth";

const authMock = vi.mocked(auth) as unknown as ReturnType<typeof vi.fn>;
afterEach(() => authMock.mockReset());

async function make(d: string, kind: "diagram" | "node", n: number, tag: string = kind): Promise<SessionRow[]> {
  const out: SessionRow[] = [];
  for (let i = 0; i < n; i++) {
    out.push(await createSession(d, kind === "node" ? { kind, nodeId: "n1", nodeLabel: "WEB" } : { kind }, `${tag}${i}`));
  }
  return out;
}
const ids = (rows: { id: string }[]) => rows.map((r) => r.id);
const cur = (c: string | null) => (c ? parseCursor(c) : null);

describe("listSessionPage", () => {
  test("pages each kind separately, 50 at a time, newest first, without overlap", async () => {
    const d = await makeDiagram();
    const chats = await make(d, "diagram", 55);
    const nodes = await make(d, "node", 3);

    const p1 = await listSessionPage(d, "diagram");
    expect(p1.items).toHaveLength(50);
    expect(p1.items.every((s) => s.kind === "diagram")).toBe(true);
    expect(ids(p1.items)).toEqual(ids(chats).reverse().slice(0, 50));
    expect(p1.nextCursor).not.toBeNull();
    const p2 = await listSessionPage(d, "diagram", { cursor: cur(p1.nextCursor) });
    expect(ids(p2.items)).toEqual(ids(chats).reverse().slice(50));
    expect(p2.nextCursor).toBeNull();

    const n = await listSessionPage(d, "node");
    expect(ids(n.items)).toEqual(ids(nodes).reverse());
    expect(n.nextCursor).toBeNull();
  });

  test("no duplicates or gaps when sessions are touched, created, renamed or deleted between pages", async () => {
    const d = await makeDiagram();
    const rows = await make(d, "node", 60);
    const p1 = await listSessionPage(d, "node");
    expect(p1.items).toHaveLength(50);
    const p1Ids = new Set(ids(p1.items));
    const unloaded = rows.filter((r) => !p1Ids.has(r.id)); // 가장 오래된 10개

    // 사이에: 안 불러온 것 하나와 불러온 것 하나를 이어 가고, 새 세션을 만들고, 커서 행을 지우고, 하나 이름을 바꾼다.
    await touchSession(unloaded[3]!.id);
    await touchSession(p1.items[10]!.id);
    const [fresh] = await make(d, "node", 1, "새");
    await deleteSession(d, p1.items.at(-1)!.id);
    await renameSession(d, unloaded[0]!.id, "바뀐 이름");

    const p2 = await listSessionPage(d, "node", { cursor: cur(p1.nextCursor), since: p1.syncedAt });
    // 커서 행이 지워져도 그 자리 다음부터 이어진다. 위로 올라간 행은 이 쪽에 없다.
    expect(ids(p2.items)).toEqual(ids(unloaded.filter((r) => r.id !== unloaded[3]!.id)).reverse());
    expect(p2.items.find((r) => r.id === unloaded[0]!.id)?.title).toBe("바뀐 이름");
    // 위로 올라간 행·새 행은 changed 로 온다.
    expect(new Set(ids(p2.changed))).toEqual(new Set([unloaded[3]!.id, p1.items[10]!.id, fresh!.id]));

    const pageIds = [...ids(p1.items), ...ids(p2.items)];
    expect(new Set(pageIds).size).toBe(pageIds.length); // 쪽끼리 겹치지 않는다
    const seen = new Set([...pageIds, ...ids(p2.changed)]);
    const alive = [...rows, fresh!].filter((r) => r.id !== p1.items.at(-1)!.id);
    expect(alive.every((r) => seen.has(r.id))).toBe(true); // 빠진 행이 없다
    expect(p2.nextCursor).toBeNull();
  });
});

describe("GET /sessions (더 보기)", () => {
  const call = (id: string, q: string) => GET(new Request(`http://localhost/api/diagrams/${id}/sessions?${q}`), { params: Promise.resolve({ id }) });

  test("returns the next page with changed and syncedAt", async () => {
    const o = await makeOwnedDiagram();
    await make(o.diagramId, "diagram", 52);
    authMock.mockResolvedValue({ user: { id: o.userId } });
    const first = await listSessionPage(o.diagramId, "diagram");
    const r = await call(o.diagramId, new URLSearchParams({ kind: "diagram", cursor: first.nextCursor!, since: first.syncedAt }).toString());
    expect(r.status).toBe(200);
    const j = (await r.json()) as { items: { kind: string; nodeId: null }[]; nextCursor: null; changed: unknown[]; syncedAt: string };
    expect(j.items).toHaveLength(2);
    expect(j.items[0]).toMatchObject({ kind: "diagram", nodeId: null });
    expect(j.nextCursor).toBeNull();
    expect(j.changed).toEqual([]);
    expect(typeof j.syncedAt).toBe("string");
  });

  test("401 without login, 404 for another user's diagram, 400 for a bad kind/cursor/since", async () => {
    const o = await makeOwnedDiagram();
    const other = await makeOwnedDiagram();
    authMock.mockResolvedValue(null);
    expect((await call(o.diagramId, "kind=node")).status).toBe(401);
    authMock.mockResolvedValue({ user: { id: other.userId } });
    expect((await call(o.diagramId, "kind=node")).status).toBe(404);
    authMock.mockResolvedValue({ user: { id: o.userId } });
    expect((await call(o.diagramId, "kind=node")).status).toBe(200);
    for (const q of ["", "kind=other", "kind=node&cursor=nope", "kind=node&cursor=2026-01-01|not-a-uuid", "kind=node&since=yesterday"]) {
      expect((await call(o.diagramId, q)).status).toBe(400);
    }
  });
});
