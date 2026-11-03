import { eq } from "drizzle-orm";
import { describe, expect, test, vi } from "vitest";

import { db } from "@/db/client";
import { chatSessions, explanations } from "@/db/schema";
import type { NodeExplanation } from "@/domain/explain";
import { signatureOf } from "@/domain/explain";
import { emptyState, type DiagramState } from "@/domain/types";
import { HANDOFF_REPLY, NODE_GONE_MESSAGE, runAskTurn } from "@/server/chat/ask";
import type { ChatEvent } from "@/server/chat/events";
import { listMessages } from "@/server/chat/messages";
import { runChatTurn, TIMEOUT_MESSAGE, type ChatDeps } from "@/server/chat/pipeline";
import { ASK_PROMPT } from "@/server/chat/prompt";
import { getSession } from "@/server/chat/sessions";
import { addAiTerm } from "@/server/glossary";
import type { ClefClient, Intent } from "@/server/llm/clef";
import type { ChatMessage, QwenClient } from "@/server/llm/qwen";
import { NotFoundError, ValidationError } from "@/server/projects";
import { createVersion } from "@/server/versions";

import { makeOwnedDiagram } from "./helpers";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/server/explain", async (orig) => {
  const m = await orig<typeof import("@/server/explain")>();
  return { ...m, cachedNodeExplanation: vi.fn(m.cachedNodeExplanation) };
});
import { cachedNodeExplanation } from "@/server/explain";
import { auth } from "@/auth";
import { GET } from "@/app/api/diagrams/[id]/sessions/[sessionId]/route";

const BUSY = "다른 응답을 처리하고 있어요. 끝난 뒤 다시 보내 주세요.";

function abortError() {
  return new DOMException("The operation was aborted.", "AbortError");
}

function fakeQwen(text: string, opts: { chunk?: number; gate?: Promise<void> } = {}): QwenClient & { calls: ChatMessage[][] } {
  const calls: ChatMessage[][] = [];
  return {
    calls,
    async streamCompletion(messages, { signal, onDelta }) {
      calls.push(messages);
      if (opts.gate) await opts.gate;
      const size = opts.chunk ?? 7;
      for (let i = 0; i < text.length; i += size) {
        if (signal.aborted) throw abortError();
        onDelta(text.slice(i, i + size));
        await new Promise((r) => setImmediate(r));
      }
      if (signal.aborted) throw abortError();
      return { text, finishReason: "stop" };
    },
  };
}

function fakeClef(result: { intent: Intent; confidence: number } | null | "throw"): ClefClient & { calls: unknown[] } {
  const calls: unknown[] = [];
  return {
    calls,
    async decide() {
      throw new Error("not used");
    },
    async classifyIntent(input, context) {
      calls.push({ input, context });
      if (result === "throw") throw new Error("clef down");
      return result;
    },
  };
}

const neverQwen: QwenClient = {
  async streamCompletion() {
    throw new Error("qwen must not be called");
  },
};

const question = fakeClef({ intent: "question", confidence: 0.9 });

function sample(): DiagramState {
  const s = emptyState();
  s.nodes["was-1"] = { id: "was-1", kind: "was", label: "WAS#1", sub: "Tomcat 10", parent: null, attrs: { sw: "Tomcat" } };
  s.nodes["db-1"] = { id: "db-1", kind: "db_rdb", label: "DB", parent: null, attrs: {} };
  s.edges["e-was-1-db-1"] = { id: "e-was-1-db-1", from: "was-1", to: "db-1", edgeKind: "request", label: "TCP 3306" };
  return s;
}

async function seeded() {
  const ids = await makeOwnedDiagram();
  await createVersion(ids.diagramId, sample(), { source: "import" });
  return ids;
}

async function ask(
  ids: { userId: string; diagramId: string },
  input: { nodeId?: string; sessionId?: string | null; text: string },
  deps: ChatDeps,
  opts: { signal?: AbortSignal; onEvent?: (e: ChatEvent) => void } = {},
) {
  const events: ChatEvent[] = [];
  const result = await runAskTurn(
    {
      ...ids,
      nodeId: input.nodeId ?? "was-1",
      sessionId: input.sessionId ?? null,
      text: input.text,
      signal: opts.signal ?? new AbortController().signal,
      emit(e) {
        events.push(e);
        opts.onEvent?.(e);
      },
    },
    deps,
  );
  return { events, result };
}

const of = <T extends ChatEvent["t"]>(events: ChatEvent[], t: T) =>
  events.filter((e): e is Extract<ChatEvent, { t: T }> => e.t === t);

const sessionsOf = (diagramId: string) => db.select().from(chatSessions).where(eq(chatSessions.diagramId, diagramId));

describe("runAskTurn", () => {
  test("first question creates a session and streams an answer", async () => {
    const ids = await seeded();
    const qwen = fakeQwen("<think>음</think>WAS#1 은 Tomcat 으로 요청을 처리해요.");
    const { events, result } = await ask(ids, { text: "이건 뭐 하는 거야?" }, { qwen, clef: question });
    expect(result).toEqual({ status: "ok" });

    const types = events.map((e) => e.t);
    expect(types[0]).toBe("session");
    expect(types[1]).toBe("start");
    expect(types.at(-1)).toBe("done");
    expect(types).toContain("answer");
    expect(of(events, "status").map((e) => e.phase)).toContain("answering");

    const [row] = await sessionsOf(ids.diagramId);
    expect(row).toMatchObject({ nodeId: "was-1", nodeLabel: "WAS#1", title: "이건 뭐 하는 거야?" });
    expect(events[0]).toEqual({
      t: "session",
      session: { id: row!.id, kind: "node", nodeId: "was-1", nodeLabel: "WAS#1", title: "이건 뭐 하는 거야?", updatedAt: expect.any(String) },
    });
    expect(events[1]).toMatchObject({ t: "start", intent: "question" });

    const shown = of(events, "answer").map((e) => e.delta).join("");
    expect(shown).toBe("WAS#1 은 Tomcat 으로 요청을 처리해요.");
    const msgs = qwen.calls[0]!;
    expect(msgs[0]).toEqual({ role: "system", content: ASK_PROMPT });
    expect(msgs).toHaveLength(2);
    expect(msgs[1]!.content).toContain("대상 노드:");
    expect(msgs[1]!.content).toContain("설명:\n없음");
    expect(msgs[1]!.content).toContain("질문: 이건 뭐 하는 거야?");

    const stored = await listMessages(ids.diagramId, 100, row!.id);
    expect(stored.map((m) => [m.role, m.content])).toEqual([
      ["user", "이건 뭐 하는 거야?"],
      ["assistant", "WAS#1 은 Tomcat 으로 요청을 처리해요."],
    ]);
    expect(stored[1]!.meta).toMatchObject({ intent: "question", status: "complete", version: null, applied: 0 });
    expect(events.at(-1)).toEqual({
      t: "done",
      version: null,
      status: "complete",
      applied: 0,
      skipped: 0,
      missing: expect.any(Number),
      nodes: 2,
      edges: 1,
      assistantMessageId: stored[1]!.id,
    });
    // 구성도 대화 기록에는 없다.
    expect(await listMessages(ids.diagramId)).toEqual([]);
    expect((await getSession(ids.diagramId, row!.id))!.updatedAt.getTime()).toBeGreaterThanOrEqual(row!.createdAt.getTime());
  });

  test("cached node explanation is passed to the model", async () => {
    const ids = await seeded();
    const data: NodeExplanation = {
      kind: "node",
      term: "Tomcat",
      definition: "Tomcat은 자바 웹 서버입니다.",
      definitionSource: "glossary",
      reviewed: true,
      role: "요청을 처리합니다.",
      adr: { decision: "둔다", reason: "필요", alternative: "없음", cost: "운영" },
    };
    await db.insert(explanations).values({
      diagramId: ids.diagramId,
      targetKind: "node",
      targetId: "was-1",
      signature: signatureOf(sample(), "node", "was-1")!,
      data,
    });
    const qwen = fakeQwen("답");
    await ask(ids, { text: "뭐야?" }, { qwen, clef: question });
    expect(qwen.calls[0]![1]!.content).toContain("정의: Tomcat은 자바 웹 서버입니다.");
  });

  async function insertExplanation(diagramId: string, signature: string) {
    const data: NodeExplanation = {
      kind: "node",
      term: "Tomcat",
      definition: "저장된 Tomcat 정의입니다.",
      definitionSource: "ai",
      reviewed: false,
      role: "요청을 처리합니다.",
      adr: { decision: "둔다", reason: "필요", alternative: "없음", cost: "운영" },
    };
    await db.insert(explanations).values({ diagramId, targetKind: "node", targetId: "was-1", signature, data });
  }

  test("stale cached explanation is not used", async () => {
    const ids = await seeded();
    const old = sample();
    old.nodes["was-1"]!.attrs = { sw: "Jetty" };
    await insertExplanation(ids.diagramId, signatureOf(old, "node", "was-1")!);
    const qwen = fakeQwen("답");
    await ask(ids, { text: "뭐야?" }, { qwen, clef: question });
    const user = qwen.calls[0]![1]!.content;
    expect(user).toContain("설명:\n없음");
    expect(user).not.toContain("저장된 Tomcat 정의입니다.");
  });

  test("glossary definition overlays the cached explanation like the panel", async () => {
    const ids = await seeded();
    await insertExplanation(ids.diagramId, signatureOf(sample(), "node", "was-1")!);
    await addAiTerm(ids.userId, { term: "Tomcat", category: "WAS", definition: "사전에 고쳐 둔 Tomcat 정의입니다." });
    const qwen = fakeQwen("답");
    await ask(ids, { text: "뭐야?" }, { qwen, clef: question });
    const user = qwen.calls[0]![1]!.content;
    expect(user).toContain("정의: 사전에 고쳐 둔 Tomcat 정의입니다.");
    expect(user).toContain("역할: 요청을 처리합니다.");
  });

  test("turn time cap aborts with the timeout error and keeps the session", async () => {
    const ids = await seeded();
    const hang: QwenClient = {
      async streamCompletion(_m, { signal }) {
        return new Promise((_r, reject) => signal.addEventListener("abort", () => reject(abortError()), { once: true }));
      },
    };
    const { events } = await ask(ids, { text: "오래 걸리는 질문" }, { qwen: hang, clef: question, turnTimeoutMs: 50 });
    expect(of(events, "error")).toEqual([{ t: "error", message: TIMEOUT_MESSAGE }]);
    expect(events.at(-1)).toMatchObject({ t: "done", status: "aborted", version: null });
    const [row] = await sessionsOf(ids.diagramId);
    const stored = await listMessages(ids.diagramId, 100, row!.id);
    expect(stored[0]).toMatchObject({ role: "user", content: "오래 걸리는 질문" });
    expect(stored[1]).toMatchObject({ role: "assistant", meta: { status: "aborted" } });
  });

  test("follow-up reuses the session and passes session history only", async () => {
    const ids = await seeded();
    // 구성도 대화 기록 한 건(질문 세션에 섞이면 안 된다)
    await runChatTurn(
      { ...ids, text: "구성도 질문", signal: new AbortController().signal, emit() {} },
      { qwen: fakeQwen("구성도 답"), clef: question },
    );
    const first = await ask(ids, { text: "첫 질문" }, { qwen: fakeQwen("첫 답"), clef: question });
    const sessionId = (first.events[0] as Extract<ChatEvent, { t: "session" }>).session.id;

    const qwen = fakeQwen("둘째 답");
    const clef = fakeClef({ intent: "question", confidence: 0.9 });
    const second = await ask(ids, { sessionId, text: "둘째 질문" }, { qwen, clef });
    expect(second.result).toEqual({ status: "ok" });
    expect(of(second.events, "session")).toEqual([]);
    expect(second.events[0]!.t).toBe("start");
    const msgs = qwen.calls[0]!;
    expect(msgs.slice(1, -1)).toEqual([
      { role: "user", content: "첫 질문" },
      { role: "assistant", content: "첫 답" },
    ]);
    expect(msgs.at(-1)!.content).toContain("질문: 둘째 질문");
    expect(clef.calls[0]).toEqual({ input: "둘째 질문", context: { lastAssistant: "첫 답", openItems: [] } });

    expect(await sessionsOf(ids.diagramId)).toHaveLength(1);
    const stored = await listMessages(ids.diagramId, 100, sessionId);
    expect(stored.map((m) => m.content)).toEqual(["첫 질문", "첫 답", "둘째 질문", "둘째 답"]);
  });

  test("main chat history excludes ask messages", async () => {
    const ids = await seeded();
    await ask(ids, { text: "질문 세션 글" }, { qwen: fakeQwen("질문 세션 답"), clef: question });
    const qwen = fakeQwen("구성도 답");
    await runChatTurn({ ...ids, text: "구성도 질문", signal: new AbortController().signal, emit() {} }, { qwen, clef: question });
    const all = JSON.stringify(qwen.calls[0]);
    expect(all).not.toContain("질문 세션 글");
    expect(all).not.toContain("질문 세션 답");
    expect(qwen.calls[0]!.slice(1, -1)).toEqual([]);
  });

  test("structure_change request hands off without calling qwen", async () => {
    const ids = await seeded();
    const { events, result } = await ask(
      ids,
      { text: "WAS 하나 더 추가해 줘" },
      { qwen: neverQwen, clef: fakeClef({ intent: "structure_change", confidence: 0.9 }) },
    );
    expect(result).toEqual({ status: "ok" });
    expect(of(events, "say")).toEqual([{ t: "say", text: HANDOFF_REPLY }]);
    expect(of(events, "handoff")).toEqual([{ t: "handoff", text: "WAS 하나 더 추가해 줘" }]);
    expect(of(events, "answer")).toEqual([]);
    expect(events.at(-1)).toMatchObject({ t: "done", status: "complete", version: null, applied: 0 });
    const sessionId = (events[0] as Extract<ChatEvent, { t: "session" }>).session.id;
    const stored = await listMessages(ids.diagramId, 100, sessionId);
    expect(stored[1]).toMatchObject({
      role: "assistant",
      content: HANDOFF_REPLY,
      meta: { intent: "structure_change", handoff: true, says: [HANDOFF_REPLY] },
    });
  });

  test("handoff reply meta carries the handed-off text", async () => {
    const ids = await seeded();
    const { events } = await ask(
      ids,
      { text: "WAS 하나 더 추가해 줘" },
      { qwen: neverQwen, clef: fakeClef({ intent: "structure_change", confidence: 0.9 }) },
    );
    const sessionId = (events[0] as Extract<ChatEvent, { t: "session" }>).session.id;
    const stored = await listMessages(ids.diagramId, 100, sessionId);
    expect(stored[1]!.meta).toMatchObject({ handoff: true, handoffText: "WAS 하나 더 추가해 줘" });
  });

  test("explanation lookup failure does not abort the turn", async () => {
    const ids = await seeded();
    vi.mocked(cachedNodeExplanation).mockRejectedValueOnce(new Error("db down"));
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const qwen = fakeQwen("답이에요.");
    const { events, result } = await ask(ids, { text: "뭐야?" }, { qwen, clef: question });
    expect(result).toEqual({ status: "ok" });
    expect(of(events, "answer").map((e) => e.delta).join("")).toBe("답이에요.");
    expect(of(events, "error")).toEqual([]);
    expect(err).toHaveBeenCalled();
    err.mockRestore();
  });

  test("clef failure falls back to answering", async () => {
    for (const clef of [fakeClef("throw"), fakeClef(null), fakeClef({ intent: "structure_change", confidence: 0.1 })]) {
      const ids = await seeded();
      const qwen = fakeQwen("답이에요.");
      const { events, result } = await ask(ids, { text: "뭐야?" }, { qwen, clef });
      expect(result).toEqual({ status: "ok" });
      expect(qwen.calls).toHaveLength(1);
      expect(of(events, "handoff")).toEqual([]);
      expect(of(events, "answer").map((e) => e.delta).join("")).toBe("답이에요.");
      expect(events.at(-1)).toMatchObject({ t: "done", status: "complete" });
    }
  });

  test("gone node returns gone and creates no session", async () => {
    const ids = await seeded();
    const { events, result } = await ask(ids, { nodeId: "nope", text: "뭐야?" }, { qwen: neverQwen, clef: question });
    expect(result).toEqual({ status: "gone" });
    expect(events).toEqual([{ t: "error", message: NODE_GONE_MESSAGE }]);
    expect(await sessionsOf(ids.diagramId)).toEqual([]);
    expect(await listMessages(ids.diagramId)).toEqual([]);

    // 이어 묻기도 노드가 없으면 같다(세션 메시지가 늘지 않는다).
    const first = await ask(ids, { text: "첫 질문" }, { qwen: fakeQwen("답"), clef: question });
    const sessionId = (first.events[0] as Extract<ChatEvent, { t: "session" }>).session.id;
    const s = sample();
    delete s.nodes["was-1"];
    delete s.edges["e-was-1-db-1"];
    await createVersion(ids.diagramId, s, { source: "import" });
    const again = await ask(ids, { sessionId, text: "또" }, { qwen: neverQwen, clef: question });
    expect(again.result).toEqual({ status: "gone" });
    expect(await listMessages(ids.diagramId, 100, sessionId)).toHaveLength(2);
  });

  test("busy while a main turn holds the lock", async () => {
    const ids = await seeded();
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const mainQwen = fakeQwen("답", { gate });
    const main = runChatTurn({ ...ids, text: "구성도 질문", signal: new AbortController().signal, emit() {} }, { qwen: mainQwen, clef: question });
    await vi.waitFor(() => expect(mainQwen.calls).toHaveLength(1));
    const { events, result } = await ask(ids, { text: "뭐야?" }, { qwen: neverQwen, clef: question });
    expect(result).toEqual({ status: "busy" });
    expect(events).toEqual([{ t: "error", message: BUSY }]);
    expect(await sessionsOf(ids.diagramId)).toEqual([]);
    release();
    await main;
  });

  test("main chat is busy while an ask turn holds the lock", async () => {
    const ids = await seeded();
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const askQwen = fakeQwen("답", { gate });
    const asking = ask(ids, { text: "뭐야?" }, { qwen: askQwen, clef: question });
    await vi.waitFor(() => expect(askQwen.calls).toHaveLength(1));
    const events: ChatEvent[] = [];
    const result = await runChatTurn({ ...ids, text: "구성도 질문", signal: new AbortController().signal, emit: (e) => events.push(e) }, { qwen: neverQwen, clef: question });
    expect(result).toEqual({ status: "busy" });
    expect(events).toEqual([{ t: "error", message: BUSY }]);
    release();
    await asking;
  });

  test("aborted first question keeps the session and user message", async () => {
    const ids = await seeded();
    const ctrl = new AbortController();
    let n = 0;
    const { events } = await ask(
      ids,
      { text: "길게 설명해 줘" },
      { qwen: fakeQwen("첫 문장이에요. 둘째 문장이에요. 셋째 문장이에요.", { chunk: 3 }), clef: question },
      {
        signal: ctrl.signal,
        onEvent(e) {
          if (e.t === "answer" && ++n === 2) ctrl.abort();
        },
      },
    );
    expect(events.at(-1)).toMatchObject({ t: "done", status: "aborted", version: null });
    const [row] = await sessionsOf(ids.diagramId);
    expect(row).toBeDefined();
    const stored = await listMessages(ids.diagramId, 100, row!.id);
    expect(stored[0]).toMatchObject({ role: "user", content: "길게 설명해 줘" });
    expect(stored[1]).toMatchObject({ role: "assistant", meta: { status: "aborted" } });
  });

  test("another user's diagram or session is not found", async () => {
    const a = await seeded();
    const b = await seeded();
    await expect(ask({ userId: b.userId, diagramId: a.diagramId }, { text: "x" }, { qwen: neverQwen, clef: question })).rejects.toBeInstanceOf(
      NotFoundError,
    );
    const first = await ask(a, { text: "첫 질문" }, { qwen: fakeQwen("답"), clef: question });
    const sessionId = (first.events[0] as Extract<ChatEvent, { t: "session" }>).session.id;
    // b 가 자기 구성도에 a 의 세션 id 를 넣어도 찾지 못한다.
    await expect(ask(b, { sessionId, text: "x" }, { qwen: neverQwen, clef: question })).rejects.toBeInstanceOf(NotFoundError);
  });

  test("sessionId with a different nodeId is rejected", async () => {
    const ids = await seeded();
    const first = await ask(ids, { text: "첫 질문" }, { qwen: fakeQwen("답"), clef: question });
    const sessionId = (first.events[0] as Extract<ChatEvent, { t: "session" }>).session.id;
    await expect(ask(ids, { sessionId, nodeId: "db-1", text: "x" }, { qwen: neverQwen, clef: question })).rejects.toBeInstanceOf(
      ValidationError,
    );
    expect(await listMessages(ids.diagramId, 100, sessionId)).toHaveLength(2);
  });
});

describe("GET /api/diagrams/:id/sessions/:sessionId", () => {
  const authMock = vi.mocked(auth) as unknown as ReturnType<typeof vi.fn>;
  const get = (id: string, sessionId: string) =>
    GET(new Request(`http://localhost/api/diagrams/${id}/sessions/${sessionId}`), { params: Promise.resolve({ id, sessionId }) });

  test("returns the session and its messages oldest first; 404 for others", async () => {
    const ids = await seeded();
    const first = await ask(ids, { text: "첫 질문" }, { qwen: fakeQwen("첫 답"), clef: question });
    const sessionId = (first.events[0] as Extract<ChatEvent, { t: "session" }>).session.id;

    authMock.mockResolvedValue(null);
    expect((await get(ids.diagramId, sessionId)).status).toBe(401);

    authMock.mockResolvedValue({ user: { id: ids.userId } });
    const res = await get(ids.diagramId, sessionId);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { session: Record<string, unknown>; messages: Record<string, unknown>[] };
    expect(body.session).toMatchObject({ id: sessionId, diagramId: ids.diagramId, nodeId: "was-1", nodeLabel: "WAS#1", title: "첫 질문" });
    expect(typeof body.session.updatedAt).toBe("string");
    expect(body.messages.map((m) => [m.role, m.content])).toEqual([
      ["user", "첫 질문"],
      ["assistant", "첫 답"],
    ]);
    expect(Object.keys(body.messages[0]!).sort()).toEqual(["content", "createdAt", "id", "meta", "role"]);

    expect((await get(ids.diagramId, "not-a-uuid")).status).toBe(404);
    const other = await seeded();
    expect((await get(other.diagramId, sessionId)).status).toBe(404); // 다른 구성도의 세션
    authMock.mockResolvedValue({ user: { id: other.userId } });
    expect((await get(ids.diagramId, sessionId)).status).toBe(404); // 남의 구성도
    authMock.mockReset();
  });
});
