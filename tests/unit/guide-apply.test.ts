import { describe, expect, test } from "vitest";

import { applyGuideStep, buildGuideState, confirmEnvironment, stepFlowIds } from "@/domain/guides/apply";
import type { Guide, GuideStep, GuideVariant } from "@/domain/guides/types";
import { guideView } from "@/domain/guides/view";
import { emptyState } from "@/domain/types";

const step = (id: string, commands: GuideStep["commands"]): GuideStep => ({
  id, goal: "목표", example: "예시", keywords: [["예시"]], commands, say: "말", miss: "미스", explains: {},
});

const VARIANT: GuideVariant = {
  environment: "사내 IDC",
  outro: "끝",
  steps: [
    step("s0", [
      { op: "add_group", id: "biz", group_kind: "network_zone", label: "업무망", parent: null },
      { op: "set_zone_type", id: "biz", type: "business-net" },
      { op: "set_assumption", key: "redundancy", value: "이중화" },
    ]),
    step("s1", [
      { op: "add_node", id: "web", kind: "web_server", label: "WEB", parent: "biz" },
      { op: "add_node", id: "was", kind: "was", label: "WAS", parent: "biz" },
      { op: "add_edge", from: "web", to: "was", edge_kind: "request", label: "AJP" },
      { op: "add_flow", id: "login", name: "로그인", origin: "system", steps: [{ edge: "e-web-was", from: "web", short: "호출", text: "WEB 이 WAS 를 부른다." }] },
    ]),
  ],
};
const GUIDE: Guide = { id: "g", title: "대본", intro: "", learns: [], envIntro: "", variants: { onprem: VARIANT } };

describe("applyGuideStep", () => {
  test("applyGuideStep confirms assumptions and zone types it sets", () => {
    const r = applyGuideStep(emptyState(), VARIANT.steps[0]!);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.assumptions.redundancy).toEqual({ key: "redundancy", value: "이중화", confirmed: true });
    expect(r.state.groups.biz!.netType).toEqual({ key: "business-net", source: "user", confirmed: true });
    expect(r.emitted).toHaveLength(3);
  });

  test("applyGuideStep returns flow ops instead of touching state", () => {
    const a = applyGuideStep(emptyState(), VARIANT.steps[0]!);
    if (!a.ok) throw new Error(a.error);
    const r = applyGuideStep(a.state, VARIANT.steps[1]!);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.flowOps.map((o) => o.op)).toEqual(["add_flow"]);
    expect(r.emitted.map((c) => c.op)).toEqual(["add_node", "add_node", "add_edge"]);
    expect(Object.keys(r.state.edges)).toEqual(["e-web-was"]);
  });

  test("applyGuideStep fails on a rejected command", () => {
    const bad = step("bad", [{ op: "add_node", id: "x", kind: "was", label: "X", parent: "nope" }]);
    const r = applyGuideStep(emptyState(), bad);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("#0");
  });
});

describe("confirmEnvironment", () => {
  test("confirmEnvironment overwrites a confirmed value", () => {
    const first = confirmEnvironment(emptyState(), "사내 IDC");
    expect(first.state.assumptions.environment).toEqual({ key: "environment", value: "사내 IDC", confirmed: true });
    const second = confirmEnvironment(first.state, "클라우드(AWS)");
    expect(second.state.assumptions.environment).toEqual({ key: "environment", value: "클라우드(AWS)", confirmed: true });
    expect(second.cmd).toEqual({ op: "set_assumption", key: "environment", value: "클라우드(AWS)" });
  });
});

describe("buildGuideState / stepFlowIds", () => {
  test("buildGuideState applies steps up to the index and throws on rejection", () => {
    const { state, flowOps } = buildGuideState(VARIANT, 1);
    expect(Object.keys(state.groups)).toEqual(["biz"]);
    expect(state.assumptions.environment!.value).toBe("사내 IDC");
    expect(flowOps).toEqual([]);
    expect(buildGuideState(VARIANT, 2).flowOps).toHaveLength(1);
    const broken: GuideVariant = { ...VARIANT, steps: [VARIANT.steps[1]!] };
    expect(() => buildGuideState(broken, 1)).toThrow();
  });

  test("stepFlowIds lists flows from a step on", () => {
    expect(stepFlowIds(VARIANT, 0)).toEqual(["login"]);
    expect(stepFlowIds(VARIANT, 1)).toEqual(["login"]);
    expect(stepFlowIds(VARIANT, 2)).toEqual([]);
  });
});

describe("guideView", () => {
  test("guideView hides current before env and after done", () => {
    const run = { guideId: "g", env: null, step: 0, status: "active" as const };
    const pre = guideView(run, GUIDE);
    expect(pre).toMatchObject({ guideId: "g", title: "대본", env: null, envChoices: ["onprem"], step: 0, total: 0, current: null });
    const mid = guideView({ ...run, env: "onprem" }, GUIDE);
    expect(mid.total).toBe(2);
    expect(mid.current).toEqual({ goal: "목표", example: "예시" });
    expect(guideView({ ...run, env: "onprem", step: 2, status: "done" }, GUIDE).current).toBeNull();
    expect(guideView({ ...run, env: "onprem", step: 1, status: "quit" }, GUIDE).current).toBeNull();
    expect(guideView({ ...run, env: "onprem", step: 2 }, GUIDE).current).toBeNull();
  });
});

