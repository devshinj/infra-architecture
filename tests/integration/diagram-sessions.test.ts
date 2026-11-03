import { readFileSync } from "node:fs";
import path from "node:path";

import { eq, sql, TransactionRollbackError } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { db } from "@/db/client";
import { chatSessions, diagramVersions, messages } from "@/db/schema";
import { POST as ASK } from "@/app/api/diagrams/[id]/ask/route";
import { POST as CHAT } from "@/app/api/diagrams/[id]/chat/route";
import { DELETE, PATCH } from "@/app/api/diagrams/[id]/sessions/[sessionId]/route";
import { setChatDepsForTest } from "@/server/chat/deps";
import type { ChatEvent } from "@/server/chat/events";
import { withDiagramLock } from "@/server/chat/lock";
import { createMessage, listMessages } from "@/server/chat/messages";
import { createSession, deleteSession, getSession, listSessions, renameSession } from "@/server/chat/sessions";
import type { ClefClient } from "@/server/llm/clef";
import type { ChatMessage, QwenClient } from "@/server/llm/qwen";
import { createVersion, listVersions } from "@/server/versions";
import { emptyState } from "@/domain/types";

import { makeDiagram, makeOwnedDiagram } from "./helpers";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
import { auth } from "@/auth";

const authMock = vi.mocked(auth) as unknown as ReturnType<typeof vi.fn>;

const structure: ClefClient = {
  async decide() {
    throw new Error("unused");
  },
  async classifyIntent() {
    return { intent: "structure_change", confidence: 0.9 };
  },
};

/** 부를 때마다 받은 메시지를 모으고, 노드 하나를 더하는 줄을 돌려준다. */
function recordingQwen(): QwenClient & { calls: ChatMessage[][] } {
  const calls: ChatMessage[][] = [];
  let n = 0;
  return {
    calls,
    async streamCompletion(m, { onDelta }) {
      // 차례 뒤 경고 문구 요청은 기록하지 않고 빈 답을 준다(코드 규칙 문구로 남는다).
      if (m.some((x) => x.content.includes("경고 목록"))) return { text: "", finishReason: "stop" };
      calls.push(m);
      n++;
      const text = [
        JSON.stringify({ op: "say", text: `그렸어요 ${n}` }),
        JSON.stringify({ op: "add_node", id: `web-${n}`, kind: "web_server", label: `WEB#${n}`, parent: null }),
      ].join("\n");
      onDelta(text);
      return { text, finishReason: "stop" };
    },
  };
}

const chat = (id: string, body: unknown) =>
  CHAT(
    new Request(`http://localhost/api/diagrams/${id}/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) },
  );
const ask = (id: string, body: unknown) =>
  ASK(
    new Request(`http://localhost/api/diagrams/${id}/ask`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) },
  );
const sessionCtx = (id: string, sessionId: string) => ({ params: Promise.resolve({ id, sessionId }) });
const rename = (id: string, sessionId: string, body: unknown) =>
  PATCH(
    new Request(`http://localhost/api/diagrams/${id}/sessions/${sessionId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
    sessionCtx(id, sessionId),
  );
const remove = (id: string, sessionId: string) =>
  DELETE(new Request(`http://localhost/api/diagrams/${id}/sessions/${sessionId}`, { method: "DELETE" }), sessionCtx(id, sessionId));

async function events(res: Response): Promise<ChatEvent[]> {
  return (await res.text()).split("\n").filter(Boolean).map((l) => JSON.parse(l) as ChatEvent);
}

const contents = (call: ChatMessage[]) => call.map((m) => m.content).join("\n");

let qwen: ReturnType<typeof recordingQwen>;
beforeEach(() => {
  qwen = recordingQwen();
  setChatDepsForTest({ qwen, clef: structure });
});
afterEach(() => {
  setChatDepsForTest(null);
  authMock.mockReset();
});

describe("0005 migration adds session kind", () => {
  const statements = readFileSync(path.resolve(process.cwd(), "src/db/migrations/0005_chat_session_kind.sql"), "utf8")
    .split("--> statement-breakpoint")
    .map((x) => x.trim())
    .filter(Boolean);

  test("replays on a DB with existing node sessions: they become kind node, nodes stay required for them", async () => {
    const d = await makeDiagram();
    let seen: { rows: { kind: string; node_id: string | null; title: string }[]; nodeless: boolean; mixed: boolean; diagram: boolean } | undefined;
    // 0004 까지의 모양으로 되돌리고(트랜잭션 안의 DDL), 그때처럼 노드 질문 세션을 넣은 뒤 0005 를 그대로 돌린다. 끝나면 되돌린다.
    await db
      .transaction(async (tx) => {
        await tx.execute(sql`alter table chat_sessions drop constraint chat_sessions_kind_node_check`);
        await tx.execute(sql`alter table chat_sessions drop column kind`);
        await tx.execute(sql`alter table chat_sessions alter column node_id set not null`);
        await tx.execute(sql`alter table chat_sessions alter column node_label set not null`);
        await tx.execute(sql`insert into chat_sessions (diagram_id, node_id, node_label, title) values (${d}, 'n1', 'WEB', '첫 질문'), (${d}, 'n2', 'DB', '둘째 질문')`);

        for (const stmt of statements) await tx.execute(sql.raw(stmt));

        const rows = await tx.execute<{ kind: string; node_id: string | null; title: string }>(
          sql`select kind, node_id, title from chat_sessions where diagram_id = ${d} order by node_id`,
        );
        // 제약 위반은 저장점 안에서 시도해 바깥 트랜잭션을 살려 둔다.
        const fails = async (q: ReturnType<typeof sql>) =>
          tx
            .transaction(async (sp) => {
              await sp.execute(q);
            })
            .then(
              () => false,
              () => true,
            );
        const nodeless = await fails(sql`insert into chat_sessions (diagram_id, kind, title) values (${d}, 'node', 'x')`);
        const mixed = await fails(sql`insert into chat_sessions (diagram_id, kind, node_id, node_label, title) values (${d}, 'diagram', 'n1', 'WEB', 'x')`);
        const diagram = !(await fails(sql`insert into chat_sessions (diagram_id, kind, title) values (${d}, 'diagram', '새 대화')`));
        seen = { rows: [...rows], nodeless, mixed, diagram };
        tx.rollback();
      })
      .catch((e: unknown) => {
        if (!(e instanceof TransactionRollbackError)) throw e;
      });

    expect(seen).toEqual({
      rows: [
        { kind: "node", node_id: "n1", title: "첫 질문" },
        { kind: "node", node_id: "n2", title: "둘째 질문" },
      ],
      nodeless: true,
      mixed: true,
      diagram: true,
    });
    // 되돌린 뒤에도 지금 스키마(제약 포함)가 그대로다.
    await expect(db.insert(chatSessions).values({ diagramId: d, kind: "node", title: "x" })).rejects.toThrow();
  });

  test("the schema rejects an unknown kind", async () => {
    const d = await makeDiagram();
    await expect(db.execute(sql`insert into chat_sessions (diagram_id, kind, title) values (${d}, 'other', 'x')`)).rejects.toThrow();
  });
});

describe("diagram chat sessions (store)", () => {
  test("createSession makes a node-less diagram session with the folded title", async () => {
    const d = await makeDiagram();
    const s = await createSession(d, { kind: "diagram" }, `  새   대화\n${"가".repeat(80)}`);
    expect(s).toMatchObject({ kind: "diagram", nodeId: null, nodeLabel: null });
    expect(s.title.startsWith("새 대화 가")).toBe(true);
    expect([...s.title]).toHaveLength(60);
    const n = await createSession(d, { kind: "node", nodeId: "n1", nodeLabel: "WEB" }, "q");
    expect((await listSessions(d)).map((x) => [x.id, x.kind])).toEqual([
      [n.id, "node"],
      [s.id, "diagram"],
    ]);
  });

  test("renameSession keeps the recent-use order and is scoped to the diagram", async () => {
    const d = await makeDiagram();
    const other = await makeDiagram();
    const s = await createSession(d, { kind: "diagram" }, "a");
    const before = (await getSession(d, s.id))!.updatedAt;
    expect(await renameSession(other, s.id, "x")).toBeNull();
    const r = await renameSession(d, s.id, "새 이름");
    expect(r).toMatchObject({ id: s.id, title: "새 이름" });
    expect(r!.updatedAt.getTime()).toBe(before.getTime());
  });

  test("deleteSession removes its messages only: other chats and the versions stay", async () => {
    const d = await makeDiagram();
    const s = await createSession(d, { kind: "diagram" }, "a");
    const keep = await createSession(d, { kind: "diagram" }, "b");
    const main = await createMessage(d, "user", "기본");
    const gone = await createMessage(d, "user", "지울 글", {}, s.id);
    await createMessage(d, "user", "다른 세션", {}, keep.id);
    await createVersion(d, emptyState(), { source: "ai", messageId: gone.id });
    await createVersion(d, emptyState(), { source: "ai", messageId: main.id });

    expect(await deleteSession(d, s.id)).toBe(true);
    expect(await deleteSession(d, s.id)).toBe(false);
    expect(await db.select().from(messages).where(eq(messages.sessionId, s.id))).toHaveLength(0);
    expect((await listMessages(d)).map((m) => m.content)).toEqual(["기본"]);
    expect((await listMessages(d, 100, keep.id)).map((m) => m.content)).toEqual(["다른 세션"]);
    // 버전은 그대로 남고, 지운 메시지를 가리키던 링크만 비워진다.
    const versions = await db.select().from(diagramVersions).where(eq(diagramVersions.diagramId, d));
    expect(versions).toHaveLength(2);
    expect(versions.map((v) => v.messageId).sort()).toEqual([main.id, null].sort());
    expect((await listVersions(d)).length).toBe(2);
  });
});

describe("POST /chat with sessions", () => {
  test("newSession creates a diagram session lazily, announces it before start, and stores both messages there", async () => {
    const ids = await makeOwnedDiagram();
    authMock.mockResolvedValue({ user: { id: ids.userId } });
    const res = await chat(ids.diagramId, { text: "  웹서버   하나\n그려줘 ", newSession: true });
    expect(res.status).toBe(200);
    const evs = await events(res);
    expect(evs[0]).toMatchObject({ t: "session", session: { kind: "diagram", nodeId: null, nodeLabel: null, title: "웹서버 하나 그려줘" } });
    expect(evs[1]!.t).toBe("start");
    expect(evs.at(-1)).toMatchObject({ t: "done", applied: 1, version: 1 });
    const id = (evs[0] as Extract<ChatEvent, { t: "session" }>).session.id;
    expect((await listMessages(ids.diagramId, 100, id)).map((m) => m.role)).toEqual(["user", "assistant"]);
    expect(await listMessages(ids.diagramId)).toHaveLength(0);
  });

  test("each chat sees only its own history; the diagram state is shared", async () => {
    const ids = await makeOwnedDiagram();
    authMock.mockResolvedValue({ user: { id: ids.userId } });
    await events(await chat(ids.diagramId, { text: "기본 대화 첫 글" }));
    const first = await events(await chat(ids.diagramId, { text: "세션 첫 글", newSession: true }));
    const sid = (first[0] as Extract<ChatEvent, { t: "session" }>).session.id;
    // 새 세션의 첫 차례에는 다른 대화 기록이 없다.
    expect(contents(qwen.calls[1]!)).not.toContain("기본 대화 첫 글");

    await events(await chat(ids.diagramId, { text: "세션 둘째 글", sessionId: sid }));
    const inSession = contents(qwen.calls[2]!);
    expect(inSession).toContain("세션 첫 글");
    expect(inSession).not.toContain("기본 대화 첫 글");

    await events(await chat(ids.diagramId, { text: "기본 대화 둘째 글" }));
    const inMain = contents(qwen.calls[3]!);
    expect(inMain).toContain("기본 대화 첫 글");
    expect(inMain).not.toContain("세션 첫 글");
    // 구성도는 하나: 세 번째 차례(세션)가 앞 두 차례의 노드 위에 더했다.
    expect(await listVersions(ids.diagramId)).toHaveLength(4);
    expect(inMain).toContain("WEB#3");
  });

  test("sessionId ownership and kind: another diagram's session 404, a node session 400, both fields 400", async () => {
    const ids = await makeOwnedDiagram();
    const other = await makeOwnedDiagram();
    const foreign = await createSession(other.diagramId, { kind: "diagram" }, "남의 것");
    const node = await createSession(ids.diagramId, { kind: "node", nodeId: "n1", nodeLabel: "WEB" }, "질문");
    const mine = await createSession(ids.diagramId, { kind: "diagram" }, "내 것");
    authMock.mockResolvedValue({ user: { id: ids.userId } });

    const r404 = await chat(ids.diagramId, { text: "x", sessionId: foreign.id });
    expect(r404.status).toBe(404);
    const r400 = await chat(ids.diagramId, { text: "x", sessionId: node.id });
    expect(r400.status).toBe(400);
    expect(await r400.json()).toEqual({ error: "메시지를 1~4000자로 입력해 주세요." });
    expect((await chat(ids.diagramId, { text: "x", sessionId: mine.id, newSession: true })).status).toBe(400);
    expect((await chat(ids.diagramId, { text: "x", sessionId: "not-a-uuid" })).status).toBe(400);
    expect(qwen.calls).toHaveLength(0);

    // 남의 사용자는 내 세션으로 보내도 404.
    authMock.mockResolvedValue({ user: { id: other.userId } });
    expect((await chat(ids.diagramId, { text: "x", sessionId: mine.id })).status).toBe(404);
  });

  test("/ask refuses a diagram session id", async () => {
    const ids = await makeOwnedDiagram();
    const s = emptyState();
    s.nodes["n1"] = { id: "n1", kind: "web_server", label: "WEB", parent: null, attrs: {} };
    await createVersion(ids.diagramId, s, { source: "import" });
    const mine = await createSession(ids.diagramId, { kind: "diagram" }, "내 것");
    authMock.mockResolvedValue({ user: { id: ids.userId } });
    const r = await ask(ids.diagramId, { nodeId: "n1", text: "x", sessionId: mine.id });
    expect(r.status).toBe(400);
  });

  test("one turn at a time across all sessions: 409 while another chat holds the lock", async () => {
    const ids = await makeOwnedDiagram();
    const mine = await createSession(ids.diagramId, { kind: "diagram" }, "내 것");
    authMock.mockResolvedValue({ user: { id: ids.userId } });
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    let entered!: () => void;
    const inside = new Promise<void>((r) => (entered = r));
    const held = withDiagramLock(ids.diagramId, async () => {
      entered();
      await gate;
    });
    await inside;
    expect((await chat(ids.diagramId, { text: "x", sessionId: mine.id })).status).toBe(409);
    expect((await chat(ids.diagramId, { text: "x", newSession: true })).status).toBe(409);
    release();
    await held;
    // 잠금을 얻지 못한 새 세션 요청은 세션을 만들지 않는다.
    expect(await listSessions(ids.diagramId)).toHaveLength(1);
  });
});

describe("PATCH/DELETE /sessions/:sessionId", () => {
  test("rename folds whitespace, validates 1-60 chars, and is scoped to the owner", async () => {
    const ids = await makeOwnedDiagram();
    const other = await makeOwnedDiagram();
    const s = await createSession(ids.diagramId, { kind: "node", nodeId: "n1", nodeLabel: "WEB" }, "질문");
    authMock.mockResolvedValue({ user: { id: ids.userId } });

    const ok = await rename(ids.diagramId, s.id, { title: "  캐시   설정  " });
    expect(ok.status).toBe(200);
    expect(await ok.json()).toMatchObject({ session: { id: s.id, kind: "node", title: "캐시 설정" } });
    for (const title of ["   ", "가".repeat(61), 3]) expect((await rename(ids.diagramId, s.id, { title })).status).toBe(400);
    expect((await rename(ids.diagramId, s.id, { title: "😀".repeat(60) })).status).toBe(200);

    authMock.mockResolvedValue({ user: { id: other.userId } });
    expect((await rename(ids.diagramId, s.id, { title: "x" })).status).toBe(404);
    const foreign = await createSession(other.diagramId, { kind: "diagram" }, "남의 것");
    authMock.mockResolvedValue({ user: { id: ids.userId } });
    expect((await rename(ids.diagramId, foreign.id, { title: "x" })).status).toBe(404);
    authMock.mockResolvedValue(null);
    expect((await rename(ids.diagramId, s.id, { title: "x" })).status).toBe(401);
  });

  test("delete removes the session and its messages (204), 404 when gone or not mine, 409 while a turn runs", async () => {
    const ids = await makeOwnedDiagram();
    const s = await createSession(ids.diagramId, { kind: "diagram" }, "a");
    await createMessage(ids.diagramId, "user", "q", {}, s.id);
    await createMessage(ids.diagramId, "user", "기본");
    authMock.mockResolvedValue({ user: { id: ids.userId } });

    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    let entered!: () => void;
    const inside = new Promise<void>((r) => (entered = r));
    const held = withDiagramLock(ids.diagramId, async () => {
      entered();
      await gate;
    });
    await inside;
    const busy = await remove(ids.diagramId, s.id);
    expect(busy.status).toBe(409);
    release();
    await held;

    const other = await makeOwnedDiagram();
    authMock.mockResolvedValue({ user: { id: other.userId } });
    expect((await remove(ids.diagramId, s.id)).status).toBe(404);

    authMock.mockResolvedValue({ user: { id: ids.userId } });
    expect((await remove(ids.diagramId, s.id)).status).toBe(204);
    expect(await getSession(ids.diagramId, s.id)).toBeNull();
    expect((await listMessages(ids.diagramId)).map((m) => m.content)).toEqual(["기본"]);
    expect((await remove(ids.diagramId, s.id)).status).toBe(404);
  });

  test("while a real turn runs in the session: delete is 409 (the turn finishes and saves), rename is allowed", async () => {
    const ids = await makeOwnedDiagram();
    const s = await createSession(ids.diagramId, { kind: "diagram" }, "a");
    authMock.mockResolvedValue({ user: { id: ids.userId } });
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    let started!: () => void;
    const inTurn = new Promise<void>((r) => (started = r));
    setChatDepsForTest({
      clef: structure,
      qwen: {
        async streamCompletion(m, { onDelta }) {
          if (m.some((x) => x.content.includes("경고 목록"))) return { text: "", finishReason: "stop" };
          started();
          await gate;
          const text = JSON.stringify({ op: "say", text: "됐어요" });
          onDelta(text);
          return { text, finishReason: "stop" };
        },
      },
    });
    const running = chat(ids.diagramId, { text: "도는 차례", sessionId: s.id });
    await inTurn;

    const busy = await remove(ids.diagramId, s.id);
    expect(busy.status).toBe(409);
    expect(await busy.json()).toEqual({ error: "다른 응답을 처리하고 있어요. 끝난 뒤 다시 보내 주세요." });
    // 이름 바꾸기는 잠금을 쓰지 않는다(차례가 쓰는 칸과 겹치지 않는다).
    expect((await rename(ids.diagramId, s.id, { title: "바뀐 이름" })).status).toBe(200);

    release();
    const evs = await events(await running);
    expect(evs.at(-1)).toMatchObject({ t: "done" });
    expect((await listMessages(ids.diagramId, 100, s.id)).map((m) => m.role)).toEqual(["user", "assistant"]);
    expect((await getSession(ids.diagramId, s.id))?.title).toBe("바뀐 이름");
  });
});
