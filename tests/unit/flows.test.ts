import { expect, test } from "vitest";

import type { NodeKind } from "@/domain/catalog";
import { checkFlow, crossingNote, flowsThrough, shortLabel, stepEnd, type Flow, type FlowStep } from "@/domain/flows";
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
