import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

const REDIS_TERM = vi.hoisted(() => ({
  key: "redis",
  term: "Redis",
  definition: "메모리 저장소",
  aliases: ["elasticache"],
  reviewed: false,
  why: "빠르게 읽으려고",
  compare: "",
}));

vi.mock("@/app/(app)/actions", () => ({
  listTermsAction: vi.fn(async () => [REDIS_TERM]),
}));

import { listTermsAction } from "@/app/(app)/actions";
import { signatureOf, type EdgeExplanation, type NodeExplanation } from "@/domain/explain";
import { emptyState, type DiagramState } from "@/domain/types";
import { useExplanations } from "@/ui/explain/useExplanations";

const FAIL = "설명을 만들지 못했어요. 다시 시도해 주세요.";

const node = (id: string) => ({ id, kind: "server", label: id, parent: null, attrs: {} });
/** a·b·c(·d) 노드와 a→b 연결 e1. */
const mkState = (ids = ["a", "b", "c"]): DiagramState =>
  ({
    ...emptyState(),
    nodes: Object.fromEntries(ids.map((id) => [id, node(id)])),
    edges: { e1: { id: "e1", from: "a", to: "b", edgeKind: "http" } },
  }) as unknown as DiagramState;

const nodeEx = (text: string, o: Partial<NodeExplanation> = {}): NodeExplanation => ({
  kind: "node",
  term: "서버",
  definition: text,
  definitionSource: "glossary",
  reviewed: true,
  role: "역할",
  adr: { decision: "결정", reason: "이유", alternative: "대안", cost: "대가" },
  ...o,
});
const edgeEx: EdgeExplanation = { kind: "edge", flow: "요청", method: "HTTP", why: "왜", firewall: "80" };

type Post = { body: { targetKind: string; targetId: string; instruction?: string }; signal: AbortSignal; resolve(v: unknown, status?: number): void };

function fake(stored: Record<string, string>) {
  const posts: Post[] = [];
  const fetchImpl = vi.fn((url: string, init?: RequestInit) => {
    if ((init?.method ?? "GET") === "GET") {
      expect(url).toBe("/api/diagrams/d1/explain");
      return Promise.resolve(new Response(JSON.stringify(stored), { status: 200 }));
    }
    expect(url).toBe("/api/diagrams/d1/explain");
    return new Promise<Response>((resolve, reject) => {
      const signal = init!.signal!;
      signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
      posts.push({
        body: JSON.parse(String(init!.body)),
        signal,
        resolve: (v, status = 200) => resolve(new Response(JSON.stringify(v), { status })),
      });
    });
  });
  return { posts, fetchImpl: fetchImpl as unknown as typeof fetch };
}

const ok = (state: DiagramState, kind: "node" | "edge", id: string, explanation: unknown) => ({ ok: true, explanation, signature: signatureOf(state, kind, id) });

type Props = { state: DiagramState; live: boolean; busy: boolean; selectedId: string | null };

function setup(stored: Record<string, string>, initial: Partial<Props> = {}) {
  const f = fake(stored);
  const state = initial.state ?? mkState();
  const hook = renderHook((p: Props) => useExplanations({ diagramId: "d1", fetchImpl: f.fetchImpl, ...p }), {
    initialProps: { state, live: true, busy: false, selectedId: null, ...initial },
  });
  return { ...hook, ...f, state };
}

/** 지금 진행 중인 POST 를 응답하고 다음 요청이 시작될 때까지 기다린다. */
async function answer(p: Post, v: unknown, status?: number) {
  await act(async () => {
    p.resolve(v, status);
  });
}

const flush = () => act(async () => {});

beforeEach(() => vi.mocked(listTermsAction).mockClear());
afterEach(() => vi.unstubAllGlobals());

test("only stale targets are queued", async () => {
  const s = mkState();
  const { posts, result } = setup({ "node:a": signatureOf(s, "node", "a")! }, { state: s });
  await waitFor(() => expect(posts).toHaveLength(1));
  expect(posts[0]!.body).toEqual({ targetKind: "node", targetId: "b" });
  expect(result.current.get("node", "b").status).toBe("loading");
  expect(result.current.get("node", "a").status).toBe("idle");
  await answer(posts[0]!, ok(s, "node", "b", nodeEx("b 정의")));
  expect(result.current.get("node", "b")).toMatchObject({ status: "ready", data: { definition: "b 정의" } });
  await waitFor(() => expect(posts).toHaveLength(2));
  expect(posts[1]!.body).toEqual({ targetKind: "node", targetId: "c" });
  await answer(posts[1]!, ok(s, "node", "c", nodeEx("c 정의")));
  await flush();
  // a 는 저장 서명과 같고, 연결은 선택되지 않았다.
  expect(posts).toHaveLength(2);
  expect(result.current.terms).toEqual([REDIS_TERM]);
});

test("clicked node jumps the queue without duplicates", async () => {
  const s = mkState(["a", "b", "c", "d"]);
  const { posts, rerender } = setup({}, { state: s });
  await waitFor(() => expect(posts).toHaveLength(1));
  expect(posts[0]!.body.targetId).toBe("a");
  // 진행 중인 a 를 다시 눌러도 다시 넣지 않는다. d 를 누르면 맨 앞으로 간다.
  rerender({ state: s, live: true, busy: false, selectedId: "a" });
  rerender({ state: s, live: true, busy: false, selectedId: "d" });
  await flush();
  expect(posts).toHaveLength(1);
  await answer(posts[0]!, ok(s, "node", "a", nodeEx("a")));
  await waitFor(() => expect(posts).toHaveLength(2));
  expect(posts[1]!.body.targetId).toBe("d");
  await answer(posts[1]!, ok(s, "node", "d", nodeEx("d")));
  await waitFor(() => expect(posts).toHaveLength(3));
  expect(posts[2]!.body.targetId).toBe("b");
  await answer(posts[2]!, ok(s, "node", "b", nodeEx("b")));
  await waitFor(() => expect(posts).toHaveLength(4));
  expect(posts[3]!.body.targetId).toBe("c");
  await answer(posts[3]!, ok(s, "node", "c", nodeEx("c")));
  await flush();
  expect(posts.map((p) => p.body.targetId)).toEqual(["a", "d", "b", "c"]);
});

test("selected up-to-date node without client data is still fetched (cache hit)", async () => {
  const s = mkState(["a"]);
  const { posts, rerender, result } = setup({ "node:a": signatureOf(s, "node", "a")! }, { state: s });
  await flush();
  expect(posts).toHaveLength(0);
  rerender({ state: s, live: true, busy: false, selectedId: "a" });
  await waitFor(() => expect(posts).toHaveLength(1));
  await answer(posts[0]!, ok(s, "node", "a", nodeEx("a 정의")));
  expect(result.current.get("node", "a").status).toBe("ready");
  await flush();
  expect(posts).toHaveLength(1);
});

test("no new requests while busy, resumes after", async () => {
  const s = mkState(["a", "b"]);
  const { posts, rerender } = setup({}, { state: s, busy: true });
  await flush();
  expect(posts).toHaveLength(0);
  rerender({ state: s, live: true, busy: false, selectedId: null });
  await waitFor(() => expect(posts).toHaveLength(1));
  // 대화가 시작돼도 진행 중인 1건은 그대로 둔다.
  rerender({ state: s, live: true, busy: true, selectedId: null });
  expect(posts[0]!.signal.aborted).toBe(false);
  await answer(posts[0]!, ok(s, "node", "a", nodeEx("a")));
  await flush();
  expect(posts).toHaveLength(1);
  // 대화가 끝나 상태가 바뀌면 큐를 다시 계산한다: a 의 서명이 바뀌어 다시 요청한다.
  const next = { ...s, nodes: { ...s.nodes, a: { ...s.nodes.a!, label: "a2" } } } as DiagramState;
  rerender({ state: next, live: true, busy: false, selectedId: null });
  await waitFor(() => expect(posts).toHaveLength(2));
  expect(posts[1]!.body.targetId).toBe("a");
});

test("failed target shows the error and the queue continues", async () => {
  const s = mkState(["a", "b"]);
  const { posts, result } = setup({}, { state: s });
  await waitFor(() => expect(posts).toHaveLength(1));
  await answer(posts[0]!, { ok: false, message: FAIL, partial: { definition: "사전 정의" } });
  expect(result.current.get("node", "a")).toEqual({ status: "error", message: FAIL, partial: { definition: "사전 정의" } });
  await waitFor(() => expect(posts).toHaveLength(2));
  expect(posts[1]!.body.targetId).toBe("b");
  // HTTP 오류도 같은 문구로 보인다.
  await answer(posts[1]!, { error: "서버 오류" }, 500);
  expect(result.current.get("node", "b")).toMatchObject({ status: "error", message: FAIL });
  await flush();
  expect(posts).toHaveLength(2); // 자동 재시도 없음
  act(() => result.current.retry("node", "a"));
  await waitFor(() => expect(posts).toHaveLength(3));
  expect(posts[2]!.body).toEqual({ targetKind: "node", targetId: "a" });
  expect(result.current.get("node", "a").status).toBe("loading");
  await answer(posts[2]!, ok(s, "node", "a", nodeEx("a")));
  expect(result.current.get("node", "a").status).toBe("ready");
});

test("edge explained only when selected", async () => {
  const s = mkState(["a", "b"]);
  const { posts, rerender, result } = setup({ "node:a": signatureOf(s, "node", "a")!, "node:b": signatureOf(s, "node", "b")! }, { state: s });
  await flush();
  expect(posts).toHaveLength(0);
  expect(result.current.get("edge", "e1").status).toBe("idle");
  rerender({ state: s, live: true, busy: false, selectedId: "e1" });
  await waitFor(() => expect(posts).toHaveLength(1));
  expect(posts[0]!.body).toEqual({ targetKind: "edge", targetId: "e1" });
  await answer(posts[0]!, ok(s, "edge", "e1", edgeEx));
  expect(result.current.get("edge", "e1")).toMatchObject({ status: "ready", data: edgeEx });
});

test("rewrite posts instruction and replaces the entry", async () => {
  const s = mkState(["a"]);
  const { posts, result } = setup({}, { state: s });
  await waitFor(() => expect(posts).toHaveLength(1));
  await answer(posts[0]!, ok(s, "node", "a", nodeEx("처음")));
  const rewrite = result.current.rewrite;
  act(() => result.current.rewrite("node", "a", "더 쉽게"));
  await waitFor(() => expect(posts).toHaveLength(2));
  expect(posts[1]!.body).toEqual({ targetKind: "node", targetId: "a", instruction: "더 쉽게" });
  expect(result.current.get("node", "a").status).toBe("loading");
  const before = vi.mocked(listTermsAction).mock.calls.length;
  await answer(posts[1]!, ok(s, "node", "a", nodeEx("다시 쓴 글", { definitionSource: "ai", term: "새용어" })));
  expect(result.current.get("node", "a")).toMatchObject({ status: "ready", data: { definition: "다시 쓴 글" } });
  // 새 AI 용어가 생겼을 수 있으니 용어 목록을 다시 받는다.
  await waitFor(() => expect(vi.mocked(listTermsAction).mock.calls.length).toBe(before + 1));
  // 콜백 정체성은 그대로다.
  expect(result.current.rewrite).toBe(rewrite);
});

test("paused in history view", async () => {
  const s = mkState(["a", "b"]);
  const { posts, rerender, result } = setup({}, { state: s });
  await waitFor(() => expect(posts).toHaveLength(1));
  rerender({ state: s, live: false, busy: false, selectedId: "b" });
  await answer(posts[0]!, ok(s, "node", "a", nodeEx("a 정의")));
  await flush();
  expect(posts).toHaveLength(1);
  // 캐시에 있는 것만 보인다.
  expect(result.current.get("node", "a")).toMatchObject({ status: "ready" });
  expect(result.current.get("node", "b").status).toBe("idle");
  rerender({ state: s, live: true, busy: false, selectedId: "b" });
  await waitFor(() => expect(posts).toHaveLength(2));
});

test("unmount aborts the in-flight request", async () => {
  const { posts, unmount } = setup({});
  await waitFor(() => expect(posts).toHaveLength(1));
  unmount();
  expect(posts[0]!.signal.aborted).toBe(true);
});

test("glossary definition shows at once while loading and on error without partial", async () => {
  const s = mkState(["a", "b", "c"]);
  s.nodes.a = { ...s.nodes.a!, attrs: { sw: "Redis 7.2" } };
  // 별칭으로도 찾는다(서버 findTerm 과 같은 순서).
  s.nodes.b = { ...s.nodes.b!, sub: "ElastiCache" };
  const { posts, result } = setup({}, { state: s });
  await waitFor(() => expect(result.current.terms).toHaveLength(1));
  await waitFor(() => expect(posts).toHaveLength(1));
  const glossary = { term: "Redis", definition: "메모리 저장소", definitionSource: "glossary", reviewed: false, why: "빠르게 읽으려고" };
  expect(result.current.get("node", "a")).toEqual({ status: "loading", partial: glossary });
  expect(result.current.get("node", "b")).toEqual({ status: "loading", partial: glossary });
  // 사전에 없는 노드·연결은 그대로.
  expect(result.current.get("node", "c")).toEqual({ status: "loading" });
  await answer(posts[0]!, { error: "서버 오류" }, 500);
  expect(result.current.get("node", "a")).toEqual({ status: "error", message: FAIL, partial: glossary });
});

