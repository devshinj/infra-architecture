import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { GET, POST } from "@/app/api/diagrams/[id]/explain/route";
import { emptyState, type DiagramState } from "@/domain/types";
import { setChatDepsForTest } from "@/server/chat/deps";
import type { ClefClient } from "@/server/llm/clef";
import type { QwenClient } from "@/server/llm/qwen";
import { createVersion } from "@/server/versions";

import { makeOwnedDiagram } from "./helpers";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
import { auth } from "@/auth";

const authMock = vi.mocked(auth) as unknown as ReturnType<typeof vi.fn>;

function sample(): DiagramState {
  const s = emptyState();
  s.nodes.lb = { id: "lb", kind: "lb_l4", label: "L4", parent: null, attrs: {} };
  s.nodes.app = { id: "app", kind: "batch_server", label: "배치", sub: "Varnishy 3", parent: null, attrs: {} };
  s.edges.e1 = { id: "e1", from: "lb", to: "app", edgeKind: "request", label: "HTTP 8080" };
  return s;
}

const ADR = { decision: "결정", reason: "이유", alternative: "대안", cost: "대가" };
const qwen: QwenClient = {
  async streamCompletion(_m, { onDelta }) {
    const text = JSON.stringify({ definition: "시험용 서버입니다.", role: "요청을 처리합니다.", adr: ADR });
    onDelta(text);
    return { text, finishReason: "stop" };
  },
};
const clef: ClefClient = {
  decide: vi.fn(async () => ({ q: { type: "score", score: 0.2 } })),
  classifyIntent: vi.fn(async () => null),
};

const url = (id: string) => `http://localhost/api/diagrams/${id}/explain`;
const post = (id: string, body: unknown) =>
  POST(new Request(url(id), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }), {
    params: Promise.resolve({ id }),
  });
const get = (id: string) => GET(new Request(url(id)), { params: Promise.resolve({ id }) });

async function setup() {
  const ids = await makeOwnedDiagram();
  await createVersion(ids.diagramId, sample(), { source: "import" });
  return ids;
}

beforeEach(() => setChatDepsForTest({ qwen, clef }));
afterEach(() => {
  setChatDepsForTest(null);
  authMock.mockReset();
});

describe("/api/diagrams/:id/explain", () => {
  test("explain route is owner-only", async () => {
    const ids = await setup();
    const other = await makeOwnedDiagram();
    const body = { targetKind: "node", targetId: "app" };

    authMock.mockResolvedValue(null);
    expect((await post(ids.diagramId, body)).status).toBe(401);
    expect((await get(ids.diagramId)).status).toBe(401);

    authMock.mockResolvedValue({ user: { id: other.userId } });
    const r404 = await post(ids.diagramId, body);
    expect(r404.status).toBe(404);
    expect(await r404.json()).toEqual({ error: "구성도를 찾을 수 없어요." });
    expect((await get(ids.diagramId)).status).toBe(404);
  });

  test("bad body is 400", async () => {
    const ids = await setup();
    authMock.mockResolvedValue({ user: { id: ids.userId } });
    for (const body of [{}, { targetKind: "zone", targetId: "app" }, { targetKind: "node" }, { targetKind: "node", targetId: "" }, { targetKind: "node", targetId: "app", instruction: 3 }]) {
      expect((await post(ids.diagramId, body)).status).toBe(400);
    }
    const bad = await POST(new Request(url(ids.diagramId), { method: "POST", headers: { "content-type": "application/json" }, body: "{nope" }), {
      params: Promise.resolve({ id: ids.diagramId }),
    });
    expect(bad.status).toBe(400);
    // 서비스 검증 오류(없는 대상, 너무 긴 요청)도 400
    expect((await post(ids.diagramId, { targetKind: "node", targetId: "ghost" })).status).toBe(400);
    expect((await post(ids.diagramId, { targetKind: "node", targetId: "app", instruction: "a".repeat(201) })).status).toBe(400);
  });

  test("post returns explanation", async () => {
    const ids = await setup();
    authMock.mockResolvedValue({ user: { id: ids.userId } });
    const res = await post(ids.diagramId, { targetKind: "node", targetId: "app" });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toMatchObject({ ok: true, explanation: { kind: "node", definitionSource: "ai" } });
    expect(typeof json.signature).toBe("string");
  });

  test("get returns signatures", async () => {
    const ids = await setup();
    authMock.mockResolvedValue({ user: { id: ids.userId } });
    expect(await (await get(ids.diagramId)).json()).toEqual({});
    const posted = await (await post(ids.diagramId, { targetKind: "edge", targetId: "e1" })).json();
    const res = await get(ids.diagramId);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ "edge:e1": posted.signature });
  });
});
