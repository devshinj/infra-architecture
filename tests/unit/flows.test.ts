import { describe, expect, test } from "vitest";

import type { NodeKind } from "@/domain/catalog";
import { asksStepText, checkFlow, crossingNote, flowsThrough, keepStepText, planFlowOps, shortLabel, stepEnd, type Flow, type FlowOp, type FlowStep } from "@/domain/flows";
import { emptyState, type DiagramState } from "@/domain/types";

const n = (id: string, kind: NodeKind, label: string, parent: string | null) => ({ id, kind, label, parent, attrs: {} });
const e = (id: string, from: string, to: string, direction?: "one_way" | "two_way") =>
  ({ id, from, to, edgeKind: "request" as const, ...(direction ? { direction } : {}) });
const step = (edge: string, from: string): FlowStep => ({ edge, from, short: edge, text: edge });

// 브라우저 → 방화벽 → 웹 → WAS → 망연계 → 인증(인터넷망), WAS → DB
const build = (): DiagramState => ({
  ...emptyState(),
  groups: {
    biz: { id: "biz", groupKind: "network_zone", label: "업무망", parent: null },
    net: { id: "net", groupKind: "network_zone", label: "인터넷망", parent: null },
  },
  nodes: {
    browser: n("browser", "client_web", "브라우저", null),
    fw: n("fw", "firewall", "방화벽", "biz"),
    web: n("web", "web_server", "웹", "biz"),
    was: n("was", "was", "WAS", "biz"),
    link: n("link", "network_link", "망연계", null),
    auth: n("auth", "external_api", "인증", "net"),
    db: n("db", "db_rdb", "DB", "biz"),
  },
  edges: {
    e1: e("e1", "browser", "fw", "one_way"),
    e2: e("e2", "fw", "web"),
    e3: e("e3", "web", "was"),
    e4: e("e4", "was", "link", "one_way"),
    e5: e("e5", "link", "auth", "two_way"),
    e6: e("e6", "was", "db"),
  },
});

const signup = (): Flow => ({
  id: "signup", name: "가입", origin: "user",
  steps: [step("e1", "browser"), step("e2", "fw"), step("e3", "web"), step("e4", "was"), step("e5", "link")],
});

test("valid signup flow has no problems", () => {
  expect(checkFlow(build(), signup())).toEqual([]);
  expect(stepEnd(build(), step("e5", "link"))).toBe("auth");
});

test("step pointing to deleted edge → missing_edge", () => {
  const f = signup();
  f.steps[2] = step("gone", "web");
  expect(checkFlow(build(), f)).toContainEqual({ kind: "missing_edge", step: 2 });
});

test("from not an endpoint → bad_start", () => {
  const f = signup();
  f.steps[1] = step("e2", "was");
  expect(checkFlow(build(), f)).toContainEqual({ kind: "bad_start", step: 1 });
});

test("branch from earlier node allowed", () => {
  const f = signup();
  f.steps.push(step("e6", "was"));
  expect(checkFlow(build(), f)).toEqual([]);
});

test("unreachable start → disconnected", () => {
  const f: Flow = { id: "x", name: "x", origin: "user", steps: [step("e1", "browser"), step("e3", "web")] };
  expect(checkFlow(build(), f)).toEqual([{ kind: "disconnected", step: 1 }]);
});

test("one_way edge traversed backwards → against_direction", () => {
  const f: Flow = { id: "x", name: "x", origin: "user", steps: [step("e1", "fw")] };
  expect(checkFlow(build(), f)).toEqual([{ kind: "against_direction", step: 0 }]);
});

test("two_way either way ok", () => {
  const s = build();
  const mk = (...steps: FlowStep[]): Flow => ({ id: "x", name: "x", origin: "user", steps });
  expect(checkFlow(s, mk(step("e5", "auth")))).toEqual([]);
  expect(checkFlow(s, mk(step("e5", "link")))).toEqual([]);
});

test("flowsThrough returns flows touching node, ignoring missing steps", () => {
  const s = build();
  const a = signup();
  const b: Flow = { id: "b", name: "b", origin: "user", steps: [step("gone", "db"), step("e6", "was")] };
  const c: Flow = { id: "c", name: "c", origin: "user", steps: [step("gone", "db")] };
  expect(flowsThrough(s, [a, b, c], "db").map((f) => f.id)).toEqual(["b"]);
  expect(flowsThrough(s, [a, b, c], "e4").map((f) => f.id)).toEqual(["signup"]);
  expect(flowsThrough(s, [a, b, c], "browser").map((f) => f.id)).toEqual(["signup"]);
});

test("shortLabel truncates at 12 code points", () => {
  expect(shortLabel("휴대폰 본인 인증 요청 보냄")).toBe("휴대폰 본인 인증 요…");
  expect(shortLabel("열두글자까지는그대로요")).toBe("열두글자까지는그대로요");
  expect(shortLabel("😀".repeat(13))).toBe("😀".repeat(11) + "…");
});

test("crossingNote names zones and the boundary node", () => {
  const s = build();
  expect(crossingNote(s, step("e4", "was"))).toBe("업무망에서 망 밖으로 넘어가요(망연계 거침)");
  expect(crossingNote(s, step("e5", "link"))).toBe("망 밖에서 인터넷망으로 넘어가요(망연계 거침)");
  expect(crossingNote(s, step("e1", "browser"))).toBe("망 밖에서 업무망으로 넘어가요(방화벽 거침)");
  expect(crossingNote(s, step("e2", "fw"))).toBeNull();
});

const before: Flow[] = [
  { id: "order", name: "주문하기", origin: "user", steps: [
    { edge: "e1", from: "user", short: "주문 요청", text: "주문 정보를 보낸다" },
    { edge: "e2", from: "was", short: "주문 저장", text: "WAS가 주문을 저장한다" },
  ] },
];

test("keepStepText: 원래 있던 단계(같은 연결·시작 노드)는 원래 글을 쓰고, 새 단계는 그대로 둔다", () => {
  const op = keepStepText({ op: "update_flow", id: "order", steps: [
    { edge: "e1", from: "user", short: "로그인 요청", text: "다른 글" },
    { edge: "e9", from: "was", short: "캐시 조회", text: "캐시를 먼저 본다" },
    { edge: "e2", from: "was", short: "DB 조회", text: "다른 글" },
  ] }, before);
  expect(op).toEqual({ op: "update_flow", id: "order", steps: [
    { edge: "e1", from: "user", short: "주문 요청", text: "주문 정보를 보낸다" },
    { edge: "e9", from: "was", short: "캐시 조회", text: "캐시를 먼저 본다" },
    { edge: "e2", from: "was", short: "주문 저장", text: "WAS가 주문을 저장한다" },
  ] });
});

test("keepStepText: 시작 노드가 다르거나, 단계가 없거나, 다른 명령이면 건드리지 않는다", () => {
  const flipped = { op: "update_flow" as const, id: "order", steps: [{ edge: "e1", from: "fw", short: "새 글", text: "새 글" }] };
  expect(keepStepText(flipped, before)).toEqual(flipped);
  const rename = { op: "update_flow" as const, id: "order", name: "주문 결제" };
  expect(keepStepText(rename, before)).toBe(rename);
  const add = { op: "add_flow" as const, id: "new", name: "새 흐름", origin: "user" as const, steps: [{ edge: "e1", from: "user", short: "x", text: "x" }] };
  expect(keepStepText(add, before)).toBe(add);
  const unknown = { op: "update_flow" as const, id: "nope", steps: [{ edge: "e1", from: "user", short: "x", text: "x" }] };
  expect(keepStepText(unknown, before)).toBe(unknown);
});

test("asksStepText: 단계 글을 고쳐 달라는 요청만", () => {
  expect(asksStepText("회원가입 흐름 단계 설명을 더 쉽게 바꿔 줘")).toBe(true);
  expect(asksStepText("2단계 문구 고쳐 줘")).toBe(true);
  expect(asksStepText("주문하기 흐름에 캐시 조회 단계도 넣어 줘")).toBe(false);
  expect(asksStepText("가입할 때 외부 인증도 거치게 회원가입 흐름 고쳐 줘")).toBe(false);
});

describe("planFlowOps", () => {
  const add = (id: string, steps: FlowStep[] = [step("e1", "browser")]): FlowOp => ({ op: "add_flow", id, name: id, origin: "user", steps });

  test("모두 통과하면 바꿀 흐름 수", () => {
    const r = planFlowOps(build(), [signup()], [add("a"), { op: "update_flow", id: "signup", name: "새 이름" }, { op: "remove_flow", id: "a" }]);
    expect(r).toEqual({ ok: true, changed: 3 });
  });

  test("거절은 명령 순서(index)와 applyFlowOps 와 같은 이유", () => {
    const r = planFlowOps(build(), [signup()], [
      add("signup"),
      { op: "update_flow", id: "ghost", name: "x" },
      add("b", [step("e9", "browser")]),
      { op: "update_flow", id: "signup", steps: [] },
      add("c", Array.from({ length: 21 }, () => step("e1", "browser"))),
      { op: "remove_flow", id: "ghost" },
    ]);
    expect(r).toEqual({
      ok: false,
      rejected: [
        { index: 0, reason: "exists" },
        { index: 1, reason: "not_found" },
        { index: 2, reason: "missing_edge" },
        { index: 3, reason: "no_steps" },
        { index: 4, reason: "too_many_steps" },
        { index: 5, reason: "not_found" },
      ],
    });
  });

  test("앞에서 만든 흐름을 뒤에서 고칠 수 있고, 거절한 명령은 뒤에 영향을 주지 않는다", () => {
    expect(planFlowOps(build(), [], [add("a"), { op: "update_flow", id: "a", name: "b" }])).toEqual({ ok: true, changed: 2 });
    const r = planFlowOps(build(), [], [add("a", [step("e9", "browser")]), { op: "remove_flow", id: "a" }]);
    expect(r).toEqual({ ok: false, rejected: [{ index: 0, reason: "missing_edge" }, { index: 1, reason: "not_found" }] });
  });

  test("흐름 상한", () => {
    const many: Flow[] = Array.from({ length: 20 }, (_, i) => ({ ...signup(), id: `f-${i}` }));
    expect(planFlowOps(build(), many, [add("x")])).toEqual({ ok: false, rejected: [{ index: 0, reason: "too_many_flows" }] });
  });
});
