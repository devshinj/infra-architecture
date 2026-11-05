import { describe, expect, test, vi } from "vitest";

import type { Flow, FlowOp } from "@/domain/flows";
import { emptyState, type DiagramState } from "@/domain/types";
import { buildFlowSuggestMessages, FLOW_SUGGEST_PROMPT } from "@/server/chat/prompt";
import { FLOW_SUGGEST_BUSY_MESSAGE, FLOW_SUGGEST_FAIL_MESSAGE, suggestFlows, type FlowSuggestRepo } from "@/server/flowSuggest";
import type { ChatMessage, QwenClient } from "@/server/llm/qwen";
import { NotFoundError } from "@/server/projects";

function sample(): DiagramState {
  const s = emptyState();
  s.nodes.web = { id: "web", kind: "web_server", label: "웹", parent: null, attrs: {} };
  s.nodes.was = { id: "was", kind: "was", label: "WAS", parent: null, attrs: {} };
  s.nodes.db = { id: "db", kind: "db_rdb", label: "DB", parent: null, attrs: {} };
  s.edges.e1 = { id: "e1", from: "web", to: "was", edgeKind: "request" };
  s.edges.e2 = { id: "e2", from: "was", to: "db", edgeKind: "request" };
  return s;
}

const flowLine = (id: string, steps: [string, string][] = [["e1", "web"], ["e2", "was"]]) =>
  JSON.stringify({
    op: "add_flow",
    id,
    name: `흐름 ${id}`,
    origin: "user",
    result: "결과를 돌려준다",
    steps: steps.map(([edge, from]) => ({ edge, from, short: "요청", text: "요청을 보낸다" })),
  });

const existing = (id: string): Flow => ({ id, name: "있던 흐름", origin: "user", steps: [{ edge: "e1", from: "web", short: "요청", text: "요청" }] });

/** 메모리 저장소. 잠금은 busy 면 실패한다. */
function fakeRepo(opts: { suggestedAt?: Date | null; flows?: Flow[]; busy?: boolean; state?: DiagramState } = {}) {
  const store = { suggestedAt: opts.suggestedAt ?? null, flows: [...(opts.flows ?? [])], ops: [] as FlowOp[] };
  const repo: FlowSuggestRepo = {
    async getOwnedDiagram(userId) {
      if (userId !== "u") throw new NotFoundError();
    },
    async withLock(_d, fn) {
      if (opts.busy) return { ok: false };
      return { ok: true, value: await fn() };
    },
    async getSuggestedAt() {
      return store.suggestedAt;
    },
    async markSuggested(_d, at) {
      store.suggestedAt = at;
    },
    async getLatestState() {
      return { state: opts.state ?? sample() };
    },
    async listFlows() {
      return store.flows;
    },
    applyFlowOps: vi.fn(async (_d, _s, ops: FlowOp[]) => {
      store.ops.push(...ops);
      let saved = 0;
      const rejected: { id: string; reason: string }[] = [];
      for (const op of ops) {
        if (op.op !== "add_flow") continue;
        if (store.flows.some((f) => f.id === op.id)) rejected.push({ id: op.id, reason: "exists" });
        else {
          store.flows.push({ id: op.id, name: op.name, origin: op.origin, steps: op.steps });
          saved++;
        }
      }
      return { saved, rejected };
    }),
  };
  return { repo, store };
}

function fakeQwen(reply: string | ((i: number) => string)) {
  const calls: ChatMessage[][] = [];
  const qwen: QwenClient = {
    streamCompletion: vi.fn(async (messages: ChatMessage[], { onDelta }) => {
      calls.push(messages);
      const text = typeof reply === "function" ? reply(calls.length - 1) : reply;
      onDelta(text);
      return { text, finishReason: "stop" };
    }),
  };
  return { qwen, calls };
}

const NOW = new Date("2026-11-05T00:00:00Z");
const deps = (repo: FlowSuggestRepo, qwen: QwenClient | null) => ({ repo, qwen, now: () => NOW });

describe("suggestFlows", () => {
  test("auto skips when flowsSuggestedAt set", async () => {
    const { repo } = fakeRepo({ suggestedAt: new Date(0) });
    const { qwen, calls } = fakeQwen(flowLine("a"));
    expect(await suggestFlows("u", "d", { auto: true }, deps(repo, qwen))).toEqual({ ok: true, saved: 0 });
    expect(calls).toHaveLength(0);
  });

  test("auto skips when flows exist", async () => {
    const { repo, store } = fakeRepo({ flows: [existing("old")] });
    const { qwen, calls } = fakeQwen(flowLine("a"));
    expect(await suggestFlows("u", "d", { auto: true }, deps(repo, qwen))).toEqual({ ok: true, saved: 0 });
    expect(calls).toHaveLength(0);
    expect(store.suggestedAt).toBeNull();
  });

  test("auto runs once on a fresh diagram and stamps flowsSuggestedAt", async () => {
    const { repo, store } = fakeRepo();
    const { qwen } = fakeQwen([flowLine("a"), flowLine("b", [["e2", "was"]]), flowLine("c", [["e1", "web"]])].join("\n"));
    expect(await suggestFlows("u", "d", { auto: true }, deps(repo, qwen))).toEqual({ ok: true, saved: 3 });
    expect(store.suggestedAt).toEqual(NOW);
  });

  test("button runs even when flows exist and appends", async () => {
    const { repo, store } = fakeRepo({ suggestedAt: new Date(0), flows: [existing("old")] });
    const { qwen, calls } = fakeQwen([flowLine("a"), flowLine("b")].join("\n"));
    expect(await suggestFlows("u", "d", { auto: false }, deps(repo, qwen))).toEqual({ ok: true, saved: 2 });
    expect(store.flows.map((f) => f.id)).toEqual(["old", "a", "b"]);
    expect(store.suggestedAt).toEqual(NOW);
    // 모델에게 이미 있는 흐름을 알려 준다.
    expect(calls[0]![0]).toEqual({ role: "system", content: FLOW_SUGGEST_PROMPT });
    expect(calls[0]![1]!.content).toContain("흐름 old");
  });

  test("invalid lines dropped", async () => {
    const { repo, store } = fakeRepo({ flows: [existing("old")] });
    const lines = [
      "그냥 글",
      JSON.stringify({ op: "say", text: "안녕" }),
      JSON.stringify({ op: "add_node", id: "x", kind: "was", label: "x", parent: null }),
      JSON.stringify({ op: "add_flow", id: "Bad Id", name: "x", origin: "user", steps: [] }),
      flowLine("ghost", [["nope", "web"]]), // 없는 연결
      flowLine("backward", [["e1", "was"], ["e1", "db"]]), // 시작 노드가 틀림
      flowLine("old"), // 이미 있는 id
      flowLine("ok"),
      flowLine("ok"), // 같은 id 두 번
    ];
    const { qwen } = fakeQwen(lines.join("\n"));
    expect(await suggestFlows("u", "d", { auto: false }, deps(repo, qwen))).toEqual({ ok: true, saved: 1 });
    expect(store.ops.map((o) => o.id)).toEqual(["ok"]);
  });

  test("keeps at most 5 flows", async () => {
    const { repo, store } = fakeRepo();
    const { qwen } = fakeQwen(["a", "b", "c", "d", "e", "f", "g"].map((id) => flowLine(id)).join("\n"));
    expect(await suggestFlows("u", "d", { auto: false }, deps(repo, qwen))).toEqual({ ok: true, saved: 5 });
    expect(store.ops.map((o) => o.id)).toEqual(["a", "b", "c", "d", "e"]);
  });

  test("zero valid → failure message after one retry, still stamped", async () => {
    const { repo, store } = fakeRepo();
    const { qwen, calls } = fakeQwen(JSON.stringify({ op: "say", text: "못 해요" }));
    expect(await suggestFlows("u", "d", { auto: true }, deps(repo, qwen))).toEqual({ ok: false, message: FLOW_SUGGEST_FAIL_MESSAGE });
    expect(calls).toHaveLength(2);
    expect(store.suggestedAt).toEqual(NOW);
    expect(repo.applyFlowOps).not.toHaveBeenCalled();
  });

  test("retry succeeds on the second answer", async () => {
    const { repo } = fakeRepo();
    const { qwen, calls } = fakeQwen((i) => (i === 0 ? "깨진 글" : flowLine("a")));
    expect(await suggestFlows("u", "d", { auto: false }, deps(repo, qwen))).toEqual({ ok: true, saved: 1 });
    expect(calls).toHaveLength(2);
  });

  test("busy lock → busy message, model not called", async () => {
    const { repo } = fakeRepo({ busy: true });
    const { qwen, calls } = fakeQwen(flowLine("a"));
    expect(await suggestFlows("u", "d", { auto: false }, deps(repo, qwen))).toEqual({ ok: false, message: FLOW_SUGGEST_BUSY_MESSAGE });
    expect(calls).toHaveLength(0);
  });

  test("diagram with no connections fails without calling the model or stamping", async () => {
    const s = emptyState();
    const { repo, store } = fakeRepo({ state: s });
    const { qwen, calls } = fakeQwen(flowLine("a"));
    expect(await suggestFlows("u", "d", { auto: true }, deps(repo, qwen))).toEqual({ ok: false, message: FLOW_SUGGEST_FAIL_MESSAGE });
    expect(calls).toHaveLength(0);
    expect(store.suggestedAt).toBeNull();
  });

  test("not owner → NotFoundError", async () => {
    const { repo } = fakeRepo();
    const { qwen } = fakeQwen(flowLine("a"));
    await expect(suggestFlows("x", "d", { auto: false }, deps(repo, qwen))).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("buildFlowSuggestMessages", () => {
  test("system prompt + current state + existing flows", () => {
    const msgs = buildFlowSuggestMessages(sample(), [existing("old")]);
    expect(msgs[0]).toEqual({ role: "system", content: FLOW_SUGGEST_PROMPT });
    expect(msgs[1]!.content).toContain("연결 e1: web -> was");
    expect(msgs[1]!.content).toContain('흐름 old [user] "있던 흐름": e1');
    expect(buildFlowSuggestMessages(sample())[1]!.content).toContain("이미 있는 흐름:\n없음");
  });

  test("prompt states the rules", () => {
    for (const s of ["add_flow", "3~5", "12자", "result", "origin"]) expect(FLOW_SUGGEST_PROMPT).toContain(s);
  });
});
