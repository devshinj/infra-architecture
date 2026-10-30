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
