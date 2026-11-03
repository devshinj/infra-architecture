import { beforeEach, expect, test, vi } from "vitest";

// DB 없이 출력 한도(finish_reason "length")로 끊긴 차례의 이어 쓰기만 본다.
const store = vi.hoisted(() => ({
  versions: [] as { status: string; nodes: number; edges: number }[],
  created: [] as { role: string; content: string; meta: Record<string, unknown> }[],
}));

vi.mock("@/server/projects", async (orig) => ({
  ...(await orig<typeof import("@/server/projects")>()),
  getOwnedDiagram: vi.fn(async () => ({})),
}));
vi.mock("@/server/versions", () => ({
  getLatestState: vi.fn(async () => null),
  createVersion: vi.fn(async (_d: string, state: { nodes: object; edges: object }, opts: { status: string }) => {
    store.versions.push({ status: opts.status, nodes: Object.keys(state.nodes).length, edges: Object.keys(state.edges).length });
    return { number: store.versions.length };
  }),
}));
vi.mock("@/server/chat/lock", () => ({ withDiagramLock: async (_id: string, fn: () => Promise<unknown>) => ({ ok: true, value: await fn() }) }));
vi.mock("@/server/chat/messages", () => ({
  listMessages: vi.fn(async () => []),
  createMessage: vi.fn(async (_d: string, role: string, content: string, meta: Record<string, unknown>) => {
    store.created.push({ role, content, meta });
    return { id: `m${store.created.length}`, createdAt: new Date() };
  }),
}));
vi.mock("@/server/chat/warnings", () => ({
  checkWarnings: vi.fn(async () => ({ warnings: [], fresh: [] })),
}));

import type { ChatEvent } from "@/server/chat/events";
import { MAX_CONTINUATIONS, runChatTurn } from "@/server/chat/pipeline";
import { CONTINUE_NOTE } from "@/server/chat/prompt";
import type { ClefClient, Intent } from "@/server/llm/clef";
import type { ChatMessage, QwenClient } from "@/server/llm/qwen";

const clefFor = (intent: Intent): ClefClient => ({
  async decide() {
    throw new Error("unused");
  },
  async classifyIntent() {
    return { intent, confidence: 0.9 };
  },
});

const j = (o: unknown) => JSON.stringify(o);
const node = (id: string) => j({ op: "add_node", id, kind: "was", label: id, parent: null });
const edge = (from: string, to: string) => j({ op: "add_edge", id: `e-${from}-${to}`, from, to, edge_kind: "request" });

/** 부를 때마다 parts 의 다음 응답을 낸다. 끝이 "length" 면 마지막 줄이 끊긴 것처럼 보낸다. */
function fakeQwen(
  parts: { text: string; finish: "stop" | "length"; onStart?: () => void }[],
): QwenClient & { calls: ChatMessage[][] } {
  const calls: ChatMessage[][] = [];
  return {
    calls,
    async streamCompletion(m, { signal, onDelta }) {
      const part = parts[calls.length];
      calls.push(m);
      if (!part) throw new Error("unexpected call");
      part.onStart?.();
      if (signal.aborted) throw new DOMException("The operation was aborted.", "AbortError");
      for (let i = 0; i < part.text.length; i += 9) onDelta(part.text.slice(i, i + 9));
      return { text: part.text, finishReason: part.finish };
    },
  };
}

async function turn(q: QwenClient, intent: Intent = "structure_change", ctrl = new AbortController()) {
  const events: ChatEvent[] = [];
  await runChatTurn(
    { userId: "u", diagramId: "d", text: "크게 그려 줘", signal: ctrl.signal, emit: (e) => events.push(e) },
    { qwen: q, clef: clefFor(intent) },
  );
  return events;
}

const lastUser = (m: ChatMessage[]) => m.findLast((x) => x.role === "user")!.content;

beforeEach(() => {
  store.versions = [];
  store.created = [];
});

test("a length stop continues with the applied state, streams all commands in one turn, and saves one version", async () => {
  const q = fakeQwen([
    // 1: 노드 둘 + 끊긴 셋째 줄(펼쳐 쓴 객체 중간에서 끊김)
    { text: `${j({ op: "say", text: "그립니다" })}\n${node("a")}\n${node("b")}\n{\n "op": "add_node",\n "id": "c",\n "lab`, finish: "length" },
    // 2: 이어서 노드 c + 끊긴 줄
    { text: `${node("c")}\n${edge("a", "b")}\n{"op":"add_edge","id":"e-b-`, finish: "length" },
    // 3: 남은 연결로 끝
    { text: `${edge("b", "c")}\n`, finish: "stop" },
  ]);
  const events = await turn(q);
  expect(q.calls).toHaveLength(1 + MAX_CONTINUATIONS);
  // 이어 쓰기 요청은 지금까지 반영한 상태와 이어 쓰기 지시를 담는다.
  const second = lastUser(q.calls[1]!);
  expect(second).toContain(CONTINUE_NOTE);
  expect(second).toContain("노드 a ");
  expect(second).toContain("노드 b ");
  expect(second).not.toContain("노드 c ");
  expect(lastUser(q.calls[2]!)).toContain("연결 e-a-b");
  expect(lastUser(q.calls[0]!)).not.toContain(CONTINUE_NOTE);

  const cmds = events.filter((e) => e.t === "cmd").map((e) => (e as { cmd: { id: string } }).cmd.id);
  expect(cmds).toEqual(["a", "b", "c", "e-a-b", "e-b-c"]);
  // 끊긴 꼬리는 건너뜀으로 세지 않는다.
  expect(events.filter((e) => e.t === "skip")).toEqual([]);
  expect(events.filter((e) => e.t === "status" && e.part)).toEqual([
    { t: "status", phase: "drawing", part: { n: 2, of: 3 } },
    { t: "status", phase: "drawing", part: { n: 3, of: 3 } },
  ]);
  expect(store.versions).toEqual([{ status: "complete", nodes: 3, edges: 2 }]);
  expect(events.at(-1)).toMatchObject({ t: "done", status: "complete", applied: 5, skipped: 0, version: 1, nodes: 3, edges: 2 });
  expect(store.created.at(-1)?.meta).toMatchObject({ applied: 5, status: "complete", says: ["그립니다"] });
});

test("continuation stops after the cap; the last cut-off line counts as skipped", async () => {
  const cut = (id: string) => ({ text: `${node(id)}\n{"op":"add_node","id":"x-${id}`, finish: "length" as const });
  const q = fakeQwen([cut("a"), cut("b"), cut("c"), cut("d")]);
  const events = await turn(q);
  expect(q.calls).toHaveLength(1 + MAX_CONTINUATIONS);
  expect(events.filter((e) => e.t === "cmd")).toHaveLength(3);
  expect(events.filter((e) => e.t === "skip")).toHaveLength(1);
  expect(store.versions).toHaveLength(1);
  expect(events.at(-1)).toMatchObject({ t: "done", status: "complete", applied: 3, skipped: 1 });
});

test("stopping during a continuation aborts the turn and keeps what was drawn as one aborted version", async () => {
  const ctrl = new AbortController();
  const q = fakeQwen([
    { text: `${node("a")}\n${node("b")}\n`, finish: "length" },
    { text: `${node("c")}\n`, finish: "length", onStart: () => ctrl.abort() },
    { text: `${node("d")}\n`, finish: "stop" },
  ]);
  const events = await turn(q, "structure_change", ctrl);
  expect(q.calls).toHaveLength(2);
  expect(events.filter((e) => e.t === "cmd")).toHaveLength(2);
  expect(store.versions).toEqual([{ status: "aborted", nodes: 2, edges: 0 }]);
  expect(events.at(-1)).toMatchObject({ t: "done", status: "aborted", applied: 2 });
});

test("an answer turn cut by length is not continued", async () => {
  const q = fakeQwen([
    { text: "긴 답", finish: "length" },
    { text: "더", finish: "stop" },
  ]);
  const events = await turn(q, "question");
  expect(q.calls).toHaveLength(1);
  expect(events.some((e) => e.t === "status" && e.part)).toBe(false);
  expect(store.versions).toEqual([]);
});

test("a normal stop makes exactly one call", async () => {
  const q = fakeQwen([{ text: `${node("a")}\n`, finish: "stop" }]);
  await turn(q);
  expect(q.calls).toHaveLength(1);
  expect(store.versions).toEqual([{ status: "complete", nodes: 1, edges: 0 }]);
});
