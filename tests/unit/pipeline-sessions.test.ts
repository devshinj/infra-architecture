import { beforeEach, expect, test, vi } from "vitest";

// DB 없이 runChatTurn 이 어느 대화 기록으로 프롬프트를 만드는지만 본다.
const store = vi.hoisted(() => ({
  history: {} as Record<string, { role: "user" | "assistant"; content: string }[]>,
  listCalls: [] as (string | null)[],
  created: [] as { content: string; sessionId: string | null }[],
  sessions: {} as Record<string, { kind: "diagram" | "node" }>,
  touched: [] as string[],
}));

vi.mock("@/server/projects", async (orig) => ({
  ...(await orig<typeof import("@/server/projects")>()),
  getOwnedDiagram: vi.fn(async () => ({})),
}));
vi.mock("@/server/versions", () => ({ getLatestState: vi.fn(async () => null), createVersion: vi.fn() }));
vi.mock("@/server/chat/lock", () => ({ USER_TURN_LOCK_WAIT_MS: 0, withDiagramLock: async (_id: string, fn: () => Promise<unknown>) => ({ ok: true, value: await fn() }) }));
vi.mock("@/server/chat/messages", () => ({
  listMessages: vi.fn(async (_d: string, _limit: number, sessionId: string | null) => {
    store.listCalls.push(sessionId);
    return (store.history[sessionId ?? "main"] ?? []).map((m, i) => ({ id: `${i}`, ...m, meta: {}, createdAt: new Date() }));
  }),
  createMessage: vi.fn(async (_d: string, _role: string, content: string, _meta: unknown, sessionId: string | null = null) => {
    store.created.push({ content, sessionId });
    return { id: `m${store.created.length}`, createdAt: new Date() };
  }),
}));
vi.mock("@/server/flows", () => ({ listFlows: vi.fn(async () => []), applyFlowOps: vi.fn(async () => ({ saved: 0, rejected: [] })) }));
vi.mock("@/server/chat/sessions", () => ({
  getSession: vi.fn(async (_d: string, id: string) => (store.sessions[id] ? { id, ...store.sessions[id] } : null)),
  createSession: vi.fn(async () => ({ id: "fresh", kind: "diagram", nodeId: null, nodeLabel: null, title: "t", updatedAt: new Date(0) })),
  touchSession: vi.fn(async (id: string) => {
    store.touched.push(id);
  }),
}));

import type { ChatEvent } from "@/server/chat/events";
import { runChatTurn, type ChatSessionTarget } from "@/server/chat/pipeline";
import type { ClefClient } from "@/server/llm/clef";
import type { ChatMessage, QwenClient } from "@/server/llm/qwen";
import { NotFoundError, ValidationError } from "@/server/projects";

const clef: ClefClient = {
  async decide() {
    throw new Error("unused");
  },
  async classifyIntent() {
    return { intent: "structure_change", confidence: 0.9 };
  },
};

function qwen(): QwenClient & { calls: ChatMessage[][] } {
  const calls: ChatMessage[][] = [];
  return {
    calls,
    async streamCompletion(m, { onDelta }) {
      calls.push(m);
      const text = JSON.stringify({ op: "say", text: "알겠어요" });
      onDelta(text);
      return { text, finishReason: "stop" };
    },
  };
}

async function turn(session: ChatSessionTarget | undefined, q = qwen()) {
  const events: ChatEvent[] = [];
  await runChatTurn({ userId: "u", diagramId: "d", text: "이번 글", session, signal: new AbortController().signal, emit: (e) => events.push(e) }, { qwen: q, clef });
  return { events, prompt: q.calls[0]!.map((m) => m.content).join("\n") };
}

beforeEach(() => {
  store.history = {
    main: [
      { role: "user", content: "기본 대화 옛 글" },
      { role: "assistant", content: "기본 대화 옛 답" },
    ],
    c1: [
      { role: "user", content: "세션 옛 글" },
      { role: "assistant", content: "세션 옛 답" },
    ],
  };
  store.listCalls = [];
  store.created = [];
  store.sessions = { c1: { kind: "diagram" }, n1: { kind: "node" } };
  store.touched = [];
});

test("기본 대화 reads only session-less history and stores messages without a session", async () => {
  const { prompt } = await turn(undefined);
  expect(store.listCalls).toEqual([null]);
  expect(prompt).toContain("기본 대화 옛 글");
  expect(prompt).not.toContain("세션 옛 글");
  expect(store.created.map((m) => m.sessionId)).toEqual([null, null]);
  expect(store.touched).toEqual([]);
});

test("a diagram chat session reads only its own history, stores there, and is touched", async () => {
  const { prompt, events } = await turn({ id: "c1" });
  expect(store.listCalls).toEqual(["c1"]);
  expect(prompt).toContain("세션 옛 답");
  expect(prompt).not.toContain("기본 대화 옛");
  expect(store.created.map((m) => m.sessionId)).toEqual(["c1", "c1"]);
  expect(events.some((e) => e.t === "session")).toBe(false);
  expect(store.touched).toEqual(["c1"]);
});

test("a new diagram chat has no history, announces the session first, and stores into it", async () => {
  const { prompt, events } = await turn("new");
  expect(store.listCalls).toEqual([]);
  expect(prompt).not.toContain("옛");
  expect(events[0]).toMatchObject({ t: "session", session: { id: "fresh", kind: "diagram", nodeId: null } });
  expect(events[1]!.t).toBe("start");
  expect(store.created.map((m) => m.sessionId)).toEqual(["fresh", "fresh"]);
  expect(store.touched).toEqual(["fresh"]);
});

test("unknown session is NotFoundError, a node session is ValidationError, before any turn", async () => {
  await expect(turn({ id: "nope" })).rejects.toBeInstanceOf(NotFoundError);
  await expect(turn({ id: "n1" })).rejects.toBeInstanceOf(ValidationError);
  expect(store.created).toEqual([]);
});
