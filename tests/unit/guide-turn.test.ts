import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

// DB 없이 학습 차례 한 번(runGuideTurn)이 무엇을 저장하고 어떤 이벤트를 보내는지 본다.
const store = vi.hoisted(() => ({
  versions: [] as { state: import("@/domain/types").DiagramState; opts: Record<string, unknown> }[],
  messages: [] as { role: string; content: string; meta: import("@/server/chat/events").MessageMeta }[],
  runs: [] as import("@/server/guide/runs").GuideRun[],
  flowCalls: [] as { ops: { id: string }[] }[],
  explainCalls: [] as string[][],
}));

vi.mock("@/db/client", () => ({ db: { transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn({}) } }));
vi.mock("@/server/versions", () => ({
  createVersion: vi.fn(async (_d: string, state: import("@/domain/types").DiagramState, opts: Record<string, unknown>) => {
    store.versions.push({ state, opts });
    return { id: `v${store.versions.length}`, number: store.versions.length };
  }),
}));
vi.mock("@/server/chat/messages", () => ({
  createMessage: vi.fn(async (_d: string, role: string, content: string, meta: import("@/server/chat/events").MessageMeta = {}) => {
    store.messages.push({ role, content, meta });
    return { id: `m${store.messages.length}`, createdAt: new Date() };
  }),
}));
vi.mock("@/server/flows", () => ({
  saveGuideFlows: vi.fn(async (_d: string, _s: unknown, ops: { id: string }[]) => {
    store.flowCalls.push({ ops });
    return { saved: ops.length, rejected: [] };
  }),
}));
vi.mock("@/server/explain", () => ({
  saveAuthoredExplanations: vi.fn(async (_d: string, _s: unknown, explains: Record<string, unknown>) => {
    store.explainCalls.push(Object.keys(explains));
    return Object.keys(explains).length;
  }),
}));
vi.mock("@/server/guide/runs", async (orig) => ({
  ...(await orig<typeof import("@/server/guide/runs")>()),
  saveGuideRun: vi.fn(async (run: import("@/server/guide/runs").GuideRun) => {
    store.runs.push(run);
  }),
}));

import { buildGuideState, confirmEnvironment } from "@/domain/guides/apply";
import type { Guide, GuideStep, GuideVariant } from "@/domain/guides/types";
import { emptyState, type DiagramState } from "@/domain/types";
import type { ChatEvent } from "@/server/chat/events";
import { askClef } from "@/server/guide/judge";
import { GUIDE_BROKEN_MESSAGE, type GuideRun } from "@/server/guide/runs";
import { runGuideTurn } from "@/server/guide/turn";
import type { ClefAnswers, ClefClient } from "@/server/llm/clef";

const ADR = { decision: "둔다", reason: "막는다", alternative: "없음", cost: "적다" };

const S0: GuideStep = {
  id: "entry",
  goal: "외부 방화벽과 웹",
  example: "앞에 방화벽을 둬 줘",
  keywords: [["방화벽"]],
  conflicts: [{ pattern: ["방화벽", "세 대"], reply: "방화벽은 한 대로 시작해요." }],
  commands: [
    { op: "add_group", id: "dmz", group_kind: "dmz", label: "DMZ", parent: null },
    { op: "add_node", id: "fw", kind: "firewall", label: "외부 방화벽", parent: "dmz" },
    { op: "add_node", id: "web", kind: "web_server", label: "WEB", parent: "dmz" },
    { op: "add_edge", from: "fw", to: "web", edge_kind: "request", label: "HTTPS" },
    { op: "set_assumption", key: "scale", value: "작게" },
    { op: "add_flow", id: "visit", name: "방문", origin: "user", steps: [{ edge: "e-fw-web", from: "fw", short: "요청", text: "방화벽이 웹으로 보낸다." }] },
  ],
  say: "방화벽과 웹을 뒀어요.",
  notes: [{ kind: "net", text: "DMZ 는 처음 받는 구역이에요." }],
  miss: "방화벽을 말해 보세요.",
  explains: {
    "group:dmz": { role: "받는다", adr: ADR, boundary: "인터넷" },
    "node:fw": { role: "막는다", adr: ADR },
    "node:web": { role: "보인다", adr: ADR },
    "edge:e-fw-web": { flow: "요청", method: "HTTPS", why: "암호화", firewall: "443" },
  },
};
const S1: GuideStep = {
  id: "was",
  goal: "WAS",
  example: "WAS 를 붙여 줘",
  keywords: [["was"]],
  commands: [
    { op: "add_node", id: "was", kind: "was", label: "WAS", parent: "dmz" },
    { op: "add_edge", from: "web", to: "was", edge_kind: "request", label: "AJP" },
  ],
  say: "WAS 를 붙였어요.",
  miss: "WAS 를 말해 보세요.",
  explains: { "node:was": { role: "처리한다", adr: ADR } },
};
const ONPREM: GuideVariant = { environment: "사내 IDC", steps: [S0, S1], outro: "다 만들었어요.", otherEnv: [{ from: "L4", to: "ALB" }] };
const CLOUD: GuideVariant = { environment: "클라우드(AWS)", steps: [S0], outro: "끝" };
const GUIDE: Guide = { id: "mini", title: "작은 대본", intro: "", learns: [], envIntro: "어느 환경으로 만들까요?", variants: { onprem: ONPREM, cloud: CLOUD } };
const BROKEN: Guide = {
  ...GUIDE,
  id: "broken",
  variants: { onprem: { ...ONPREM, steps: [{ ...S0, commands: [{ op: "add_node", id: "x", kind: "was", label: "X", parent: "nope" }] }] } },
};
const guides = (id: string) => [GUIDE, BROKEN].find((g) => g.id === id);

const clefSays = (match: number, question: number): ClefClient & { calls: unknown[][] } => {
  const calls: unknown[][] = [];
  return {
    calls,
    async decide(...args) {
      calls.push(args);
      return { match: { type: "noul", noul: match }, question: { type: "noul", noul: question } } as ClefAnswers;
    },
    async classifyIntent() {
      throw new Error("unused");
    },
  };
};
const clefDown: ClefClient = {
  async decide() {
    throw new Error("down");
  },
  async classifyIntent() {
    throw new Error("unused");
  },
};
const clefHangs: ClefClient = {
  decide: () => new Promise<ClefAnswers>(() => {}),
  async classifyIntent() {
    throw new Error("unused");
  },
};

const RUN: GuideRun = { diagramId: "d", guideId: "mini", env: "onprem", step: 0, stepVersions: [], envVersion: 1, marks: [], status: "active" };
const ENV_STATE = confirmEnvironment(emptyState(), "사내 IDC").state;

async function turn(text: string, o: { run?: GuideRun; state?: DiagramState; clef?: ClefClient } = {}) {
  const events: ChatEvent[] = [];
  const outcome = await runGuideTurn(
    {
      userId: "u",
      diagramId: "d",
      text,
      userMessageId: "um",
      state: o.state ?? ENV_STATE,
      knowledge: null,
      run: o.run ?? RUN,
      signal: new AbortController().signal,
      emit: (e) => events.push(e),
    },
    { clef: o.clef ?? clefDown, guides },
  );
  return { events, outcome };
}

const types = (events: ChatEvent[]) => events.map((e) => e.t);
const ofType = <T extends ChatEvent["t"]>(events: ChatEvent[], t: T) => events.filter((e): e is Extract<ChatEvent, { t: T }> => e.t === t);

beforeEach(() => {
  store.versions = [];
  store.messages = [];
  store.runs = [];
  store.flowCalls = [];
  store.explainCalls = [];
  vi.spyOn(console, "info").mockImplementation(() => {});
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("runGuideTurn", () => {
  test("env is confirmed from text and the first step card is sent", async () => {
    const { events, outcome } = await turn("온프레미스로 할게요", { run: { ...RUN, env: null, envVersion: null }, state: emptyState() });
    expect(outcome).toEqual({ handled: true });
    expect(types(events)).toEqual(["start", "cmd", "say", "guide", "done"]);
    expect(ofType(events, "cmd")[0]!.cmd).toEqual({ op: "set_assumption", key: "environment", value: "사내 IDC" });
    const text = "온프레미스로 진행합니다. 위 카드의 이번 단계를 말로 요청해 보세요.";
    expect(ofType(events, "say")[0]!.text).toBe(text);
    expect(store.versions).toHaveLength(1);
    expect(store.versions[0]!.opts).toMatchObject({ source: "ai", messageId: "um", summary: "학습: 환경 온프레미스" });
    expect(store.versions[0]!.state.assumptions.environment).toEqual({ key: "environment", value: "사내 IDC", confirmed: true });
    expect(store.runs.at(-1)).toMatchObject({ env: "onprem", envVersion: 1, step: 0, status: "active" });
    expect(store.messages).toHaveLength(1);
    expect(store.messages[0]).toMatchObject({ role: "assistant", content: text });
    expect(store.messages[0]!.meta.guide).toBeUndefined();
    const view = ofType(events, "guide")[0]!.view;
    expect(view).toMatchObject({ env: "onprem", step: 0, total: 2, status: "active", current: { goal: S0.goal, example: S0.example } });
    // 환경 가정만 바꾼 차례라 평소 변경 없는 차례처럼 버전 없이 끝낸다.
    expect(events.at(-1)).toMatchObject({ t: "done", version: null, status: "complete", applied: 1, changed: 0, assistantMessageId: "m1" });
  });

  test("unreadable env asks again", async () => {
    const { events, outcome } = await turn("글쎄요 잘 모르겠어요", { run: { ...RUN, env: null, envVersion: null }, state: emptyState() });
    expect(outcome).toEqual({ handled: true });
    expect(types(events)).toEqual(["start", "say", "guide", "done"]);
    expect(ofType(events, "say")[0]!.text).toBe(GUIDE.envIntro);
    expect(store.versions).toEqual([]);
    expect(store.runs).toEqual([]);
    expect(store.messages[0]).toMatchObject({ content: GUIDE.envIntro, meta: { guide: { kind: "env", envChoices: ["onprem", "cloud"] } } });
    expect(events.at(-1)).toMatchObject({ t: "done", version: null, applied: 0, changed: 0 });
  });

  test("a matching step draws, versions, saves flows and explanations, and advances", async () => {
    const clef = clefSays(0.9, 0.1);
    const { events, outcome } = await turn("입구에 막는 장비를 놓아 줘", { clef });
    expect(outcome).toEqual({ handled: true });
    // Clef 에는 짧은 noul 질문 둘을 한 번에, 상한 3초·재시도 없이 묻는다.
    expect(clef.calls).toHaveLength(1);
    const [input, questions, , opts] = clef.calls[0]!;
    expect(input).toEqual({ 사용자_말: "입구에 막는 장비를 놓아 줘", 이번_단계_목표: S0.goal });
    expect(Object.keys(questions as object)).toEqual(["match", "question"]);
    expect(opts).toEqual({ capMs: 3000, maxRetries: 0 });

    expect(store.versions).toHaveLength(1);
    const v = store.versions[0]!;
    expect(v.opts).toMatchObject({ source: "ai", messageId: "um", summary: `학습 1단계: ${S0.goal}` });
    expect(Object.keys(v.state.nodes).sort()).toEqual(["fw", "web"]);
    expect(v.state.assumptions.scale).toEqual({ key: "scale", value: "작게", confirmed: true });
    expect(store.flowCalls).toEqual([{ ops: [expect.objectContaining({ op: "add_flow", id: "visit" })] }]);
    expect(store.explainCalls).toEqual([Object.keys(S0.explains)]);

    const step = store.messages.find((m) => m.meta.guide);
    expect(step).toMatchObject({ role: "assistant", content: S0.say, meta: { guide: { kind: "step", step: 1, notes: S0.notes }, version: 1, applied: 6, changed: 4, nodes: 2, edges: 1, flows: 1 } });
    expect(store.runs.at(-1)).toMatchObject({ step: 1, stepVersions: [1], status: "active" });
    expect(ofType(events, "guide")[0]!.view).toMatchObject({ step: 1, current: { goal: S1.goal } });
    expect(events.at(-1)).toMatchObject({ t: "done", version: 1, status: "complete", applied: 6, changed: 4, flows: 1, skipped: 0, nodes: 2, edges: 1 });
  });

  test("a miss sends the step's miss text and draws nothing", async () => {
    const { events, outcome } = await turn("오늘 날씨 좋네요", { clef: clefSays(0.1, 0.2) });
    expect(outcome).toEqual({ handled: true });
    expect(types(events)).toEqual(["start", "say", "guide", "done"]);
    expect(ofType(events, "say")[0]!.text).toBe(S0.miss);
    expect(store.versions).toEqual([]);
    expect(store.runs).toEqual([]);
    expect(store.messages[0]).toMatchObject({ content: S0.miss, meta: { guide: { kind: "miss", step: 1 }, version: null, changed: 0 } });
    expect(events.at(-1)).toMatchObject({ t: "done", version: null, applied: 0 });
  });

  test("a conflict sends its reply", async () => {
    const clef = clefSays(0.9, 0.1);
    const { events } = await turn("방화벽을 세 대 둬 줘", { clef });
    // 충돌은 Clef 보다 먼저 본다.
    expect(clef.calls).toEqual([]);
    expect(ofType(events, "say")[0]!.text).toBe("방화벽은 한 대로 시작해요.");
    expect(store.versions).toEqual([]);
    expect(store.messages[0]).toMatchObject({ meta: { guide: { kind: "miss", step: 1 } } });
  });

  test("a question is handed back as intent question", async () => {
    const { events, outcome } = await turn("DMZ 는 왜 나누나요", { clef: clefSays(0.1, 0.9) });
    expect(outcome).toEqual({ handled: false, intent: "question" });
    expect(events).toEqual([]);
    expect(store.messages).toEqual([]);
    expect(store.versions).toEqual([]);
  });

  test("the last step marks the run done and sends the outro with rebuild envs", async () => {
    const state = buildGuideState(ONPREM, 1).state;
    const { events } = await turn(S1.example, { run: { ...RUN, step: 1, stepVersions: [2] }, state });
    expect(store.versions[0]!.opts).toMatchObject({ summary: `학습 2단계: ${S1.goal}` });
    // 두 단계 설명을 합쳐 현재 서명으로 다시 저장한다.
    expect(store.explainCalls).toEqual([[...Object.keys(S0.explains), ...Object.keys(S1.explains)]]);
    expect(store.runs.at(-1)).toMatchObject({ step: 2, stepVersions: [2, 1], status: "done" });
    expect(store.messages.map((m) => m.meta.guide?.kind ?? null)).toEqual(["step", "done"]);
    expect(store.messages[1]).toMatchObject({
      content: ONPREM.outro,
      meta: { guide: { kind: "done", outro: ONPREM.outro, otherEnv: ONPREM.otherEnv, rebuild: ["cloud"] } },
    });
    expect(ofType(events, "guide")[0]!.view).toMatchObject({ status: "done", step: 2, current: null });
    expect(events.at(-1)).toMatchObject({ t: "done", version: 1, assistantMessageId: "m2" });
  });

  test("a rejected guide command quits the run", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { events, outcome } = await turn(S0.example, { run: { ...RUN, guideId: "broken" } });
    expect(outcome).toEqual({ handled: true });
    expect(types(events)).toEqual(["start", "error", "guide", "done"]);
    expect(ofType(events, "error")[0]!.message).toBe(GUIDE_BROKEN_MESSAGE);
    expect(store.versions).toEqual([]);
    expect(store.runs.at(-1)).toMatchObject({ status: "quit", step: 0 });
    expect(store.messages[0]).toMatchObject({ content: GUIDE_BROKEN_MESSAGE, meta: { guide: { kind: "quit", step: 1 } } });
    expect(ofType(events, "guide")[0]!.view.status).toBe("quit");
    expect(events.at(-1)).toMatchObject({ t: "done", version: null });
  });

  test("a hanging clef falls back to keywords within the cap", async () => {
    vi.useFakeTimers();
    let settled = false;
    const p = turn(S0.example, { clef: clefHangs }).finally(() => {
      settled = true;
    });
    await vi.advanceTimersByTimeAsync(2999);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    const { outcome } = await p;
    expect(outcome).toEqual({ handled: true });
    expect(store.versions).toHaveLength(1);
    expect(store.runs.at(-1)).toMatchObject({ step: 1 });
  });

  test("same text twice does not apply the step twice", async () => {
    await turn(S0.example);
    // 잠금 안에서 저장된 진행 상태·버전을 다시 읽은 것처럼 다음 차례에 넘긴다.
    const second = await turn(S0.example, { run: store.runs.at(-1)!, state: store.versions.at(-1)!.state });
    expect(store.versions).toHaveLength(1);
    expect(ofType(second.events, "say")[0]!.text).toBe(S1.miss);
    expect(store.messages.at(-1)!.meta.guide).toEqual({ kind: "miss", step: 2 });
  });

  test("the event order is cmd…, say, guide, done", async () => {
    const { events } = await turn(S0.example);
    // 작은 대본의 WEB 한 대는 코드 규칙 경고를 낸다. 새 경고는 단계 글 앞에 온다.
    expect(types(events)).toEqual(["start", "status", "cmd", "cmd", "cmd", "cmd", "cmd", "warnings", "say", "guide", "done"]);
    expect(events[1]).toEqual({ t: "status", phase: "drawing" });
    expect(ofType(events, "cmd").map((e) => e.cmd.op)).toEqual(["add_group", "add_node", "add_node", "add_edge", "set_assumption"]);
  });
});

describe("askClef", () => {
  test("askClef reads both noul answers and gives nulls when the call fails", async () => {
    const signal = new AbortController().signal;
    expect(await askClef(clefSays(0.7, 0.2), "말", "목표", signal)).toEqual({ match: 0.7, question: 0.2 });
    expect(await askClef(clefDown, "말", "목표", signal)).toEqual({ match: null, question: null });
  });
});
