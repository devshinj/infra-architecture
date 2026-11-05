import { expect, test } from "vitest";

import type { GroupKind, NodeKind } from "@/domain/catalog";
import { emptyState, type DiagramState, type DNode, type Warning } from "@/domain/types";
import { evaluateRules, mergeWarnings, RULES, warningsByNode } from "@/domain/warnings";

const node = (id: string, kind: NodeKind, label: string, parent: string | null = null): DNode => ({ id, kind, label, parent, attrs: {} });
const build = (
  nodes: DNode[],
  groups: [string, GroupKind, string | null][] = [],
  edges: [string, string, string, "request" | "async" | "aux"][] = [],
): DiagramState => ({
  ...emptyState(),
  nodes: Object.fromEntries(nodes.map((n) => [n.id, n])),
  groups: Object.fromEntries(groups.map(([id, groupKind, parent]) => [id, { id, groupKind, label: id, parent }])),
  edges: Object.fromEntries(edges.map(([id, from, to, edgeKind]) => [id, { id, from, to, edgeKind }])),
});
const ids = (s: DiagramState) => evaluateRules(s).map((w) => w.id);

test("db in public subnet warns", () => {
  const s = build([node("db", "db_rdb", "주 DB", "inner")], [["pub", "subnet_public", null], ["inner", "vpc", "pub"]]);
  expect(ids(s)).toContain("db_public:db");
});

test("db in private subnet does not", () => {
  const s = build([node("db", "db_rdb", "주 DB", "priv")], [["priv", "subnet_private", null]]);
  expect(ids(s)).not.toContain("db_public:db");
});

test("group parent cycle does not hang", () => {
  const s = build([node("db", "db_rdb", "DB", "a")], [["a", "vpc", "b"], ["b", "vpc", "a"]]);
  expect(() => evaluateRules(s)).not.toThrow();
});

test("spof for a lone was, none inside redundancy_group", () => {
  expect(ids(build([node("w", "was", "WAS")]))).toContain("spof:w");
  const grouped = build([node("w", "was", "WAS", "r")], [["r", "redundancy_group", null]]);
  expect(ids(grouped)).not.toContain("spof:w");
});

test("confirmed 이중화 없음 turns spof off", () => {
  const s = build([node("w", "was", "WAS")]);
  s.assumptions.redundancy = { key: "redundancy", value: "이중화 없음", confirmed: false };
  expect(ids(s)).toContain("spof:w");
  s.assumptions.redundancy.confirmed = true;
  expect(ids(s)).not.toContain("spof:w");
});

test("spof fires for a lone node whatever the redundancy assumption value is (only a confirmed 이중화 없음 turns it off)", () => {
  for (const confirmed of [false, true]) {
    const s = build([node("w", "was", "WAS")]);
    s.assumptions.redundancy = { key: "redundancy", value: "웹/WAS/DB 이중화 및 멀티 AZ", confirmed };
    expect(ids(s)).toContain("spof:w");
  }
  // 이중화 그룹 안이면 가정과 상관없이 없다.
  const grouped = build([node("w", "was", "WAS", "r")], [["r", "redundancy_group", null]]);
  grouped.assumptions.redundancy = { key: "redundancy", value: "전 구간 이중화", confirmed: true };
  expect(ids(grouped)).not.toContain("spof:w");
});

test("db_proxy and cache are single points of failure too", () => {
  const s = build([node("p", "db_proxy", "DB 프록시"), node("c", "cache", "Redis"), node("l", "lb_l4", "L4")]);
  s.assumptions.redundancy = { key: "redundancy", value: "핵심 구간 이중화", confirmed: false };
  expect(ids(s)).toEqual(expect.arrayContaining(["spof:p", "spof:c", "spof:l"]));
});

test("client to k8s_ingress or bastion is a legitimate entry, no no_firewall", () => {
  for (const kind of ["k8s_ingress", "bastion"] as const) {
    const s = build([node("c", "client_web", "사용자"), node("t", kind, "진입점")], [], [["e1", "c", "t", "request"]]);
    expect(evaluateRules(s).some((x) => x.rule === "no_firewall")).toBe(false);
  }
});

test("client to was directly warns with edge id, client to lb does not", () => {
  const direct = build([node("c", "client_web", "사용자"), node("w", "was", "WAS")], [], [["e1", "c", "w", "request"]]);
  const w = evaluateRules(direct).find((x) => x.rule === "no_firewall")!;
  expect(w).toMatchObject({ id: "no_firewall:e1", nodeId: "w", edgeId: "e1" });
  const viaLb = build([node("c", "client_web", "사용자"), node("l", "lb_l4", "LB")], [], [["e1", "c", "l", "request"]]);
  expect(evaluateRules(viaLb).some((x) => x.rule === "no_firewall")).toBe(false);
});

test("cache without any db warns, with db does not", () => {
  expect(ids(build([node("c", "cache", "Redis")]))).toContain("cache_without_db:c");
  expect(ids(build([node("c", "cache", "Redis"), node("d", "db_nosql", "Mongo")]))).not.toContain("cache_without_db:c");
});

test("labels are filled into the template", () => {
  const s = build([node("db", "db_rdb", "주 DB", "pub")], [["pub", "dmz", null]]);
  expect(evaluateRules(s).find((w) => w.id === "db_public:db")!.text).toBe("주 DB이(가) 공개 구역에 있어요.");
  const e = build([node("c", "client_web", "사용자"), node("w", "was", "WAS")], [], [["e1", "c", "w", "async"]]);
  expect(evaluateRules(e).find((w) => w.rule === "no_firewall")!.text).toBe("사용자에서 WAS(으)로 바로 들어와요.");
});

test("db_exposed is Clef-only and exports instructions", () => {
  expect(RULES.find((r) => r.rule === "db_exposed")!.instructions).toContain("방화벽 없이 직접 접근");
  expect(ids(build([node("d", "db_rdb", "DB", "priv")], [["priv", "subnet_private", null]])).some((i) => i.startsWith("db_exposed"))).toBe(false);
});

const stored = (id: string, rule: string, nodeId: string, text: string): Warning => ({ id, rule, nodeId, level: "warn", text, guide: "g" });

test("stored qwen text wins for code rules that still fire", () => {
  const s = build([node("w", "was", "WAS")]);
  s.warnings = [stored("spof:w", "spof", "w", "큐웬 문구")];
  expect(mergeWarnings(s).active.find((w) => w.id === "spof:w")!.text).toBe("큐웬 문구");
});

test("stale code warning in state is dropped when the rule no longer fires", () => {
  const s = build([node("w", "was", "WAS", "r")], [["r", "redundancy_group", null]]);
  s.warnings = [stored("spof:w", "spof", "w", "옛 문구")];
  expect(mergeWarnings(s).active).toEqual([]);
});

test("db_exposed kept only while its node exists", () => {
  const s = build([node("d", "db_rdb", "DB", "r")], [["r", "redundancy_group", null]]);
  s.warnings = [stored("db_exposed:d", "db_exposed", "d", "노출"), stored("db_exposed:gone", "db_exposed", "gone", "없음")];
  expect(mergeWarnings(s).active.map((w) => w.id)).toEqual(["db_exposed:d"]);
});

test("ignored warnings are hidden", () => {
  const s = build([node("w", "was", "WAS")]);
  s.ignoredWarnings = ["spof:w"];
  const m = mergeWarnings(s);
  expect(m.active).toEqual([]);
  expect(m.ignored.map((w) => w.id)).toEqual(["spof:w"]);
});

test("warningsByNode counts active only", () => {
  const s = build([node("w", "was", "WAS"), node("d", "db_rdb", "DB")]);
  s.ignoredWarnings = ["spof:d"];
  expect(warningsByNode(mergeWarnings(s).active)).toEqual({ w: 1 });
});

// 업무망(WAS)·인터넷망(API)·망 밖(망연계)
const zoned = (edges: [string, string, string, "request" | "async" | "aux"][]) =>
  build(
    [node("was", "was", "WAS", "biz"), node("api", "external_api", "API", "net"), node("link", "network_link", "망연계")],
    [["biz", "network_zone", null], ["net", "network_zone", null]],
    edges,
  );

test("network_direct warns on WAS(업무망) → API(인터넷망) direct edge", () => {
  const s = zoned([["e", "was", "api", "request"]]);
  const w = evaluateRules(s).find((x) => x.rule === "network_direct");
  expect(w).toMatchObject({ id: "network_direct:e", nodeId: "api", edgeId: "e", level: "warn", text: "WAS에서 API(으)로 망을 바로 넘어가요." });
  expect(w?.guide).toBe("서로 다른 망 사이 통신은 방화벽·망연계 솔루션·VPN 을 거치게 그리세요.");
  expect(RULES.find((r) => r.rule === "network_direct")?.patternId).toBeTruthy();
});

test("no warning through network_link", () => {
  const s = zoned([["a", "was", "link", "request"], ["b", "link", "api", "request"]]);
  expect(ids(s).some((i) => i.startsWith("network_direct"))).toBe(false);
});
