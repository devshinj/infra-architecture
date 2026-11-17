import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";

import { buildDisplayGraph, defaultDisplayOptions, initialCollapsed, redundancyGroupIds, visibleBoxCount } from "@/canvas/display";
import { applyCommands } from "@/domain/apply";
import type { Command } from "@/domain/commands";
import { emptyState, type DiagramState } from "@/domain/types";
import { fx, synth } from "../fixtures/spike";

test("bus simplify turns pub/sub pairs into one service→bus edge", () => {
  const s3 = fx("s3");
  const kafka = Object.values(s3.nodes).find((n) => n.kind === "stream")!.id;
  const g = buildDisplayGraph(s3, { ...defaultDisplayOptions(s3) });
  const busEdges = g.edges.filter((e) => e.to === kafka || e.from === kafka);
  expect(busEdges.length).toBeGreaterThan(0);
  expect(busEdges.every((e) => e.to === kafka && e.edgeKind === "async" && e.label === "이벤트")).toBe(true);
  expect(new Set(busEdges.map((e) => e.from)).size).toBe(busEdges.length);
  expect(busEdges.some((e) => e.sourceEdgeIds.length > 1)).toBe(true);
});

test("aux hidden unless an endpoint is selected", () => {
  const s3 = fx("s3");
  const aux = Object.values(s3.edges).filter((e) => e.edgeKind === "aux");
  expect(aux.length).toBeGreaterThan(0);
  const base = defaultDisplayOptions(s3);
  const hidden = buildDisplayGraph(s3, base);
  expect(hidden.edges.some((e) => e.edgeKind === "aux")).toBe(false);

  const sel = aux[0].from;
  const shown = buildDisplayGraph(s3, { ...base, selectedId: sel });
  expect(shown.edges.some((e) => e.edgeKind === "aux" && (e.from === sel || e.to === sel))).toBe(true);

  const all = buildDisplayGraph(s3, { ...base, hideAux: false });
  expect(all.edges.filter((e) => e.edgeKind === "aux").length).toBeGreaterThan(0);
});

test("duplicate edges merge and keep all source ids", () => {
  const s = applyCommands(emptyState(), [
    { op: "add_node", id: "a", kind: "was", label: "A", parent: null },
    { op: "add_node", id: "b", kind: "db_rdb", label: "B", parent: null },
    { op: "add_edge", from: "a", to: "b", edge_kind: "request", label: "x" },
    { op: "add_edge", from: "a", to: "b", edge_kind: "replication" },
  ] as Command[]).state;
  const opts = defaultDisplayOptions(s);
  const merged = buildDisplayGraph(s, opts);
  expect(merged.edges).toHaveLength(1);
  expect(merged.edges[0].edgeKind).toBe("request");
  expect(merged.edges[0].sourceEdgeIds).toHaveLength(2);
  expect(buildDisplayGraph(s, { ...opts, mergeDuplicates: false }).edges).toHaveLength(2);
});

test("collapsed group re-targets edges and counts hidden nodes", () => {
  const s2 = fx("s2");
  const pair = Object.values(s2.groups).find((g) => g.groupKind === "redundancy_group")!.id;
  const g = buildDisplayGraph(s2, { ...defaultDisplayOptions(s2), collapsed: new Set([pair]) });
  expect(g.groups[pair].collapsed).toBe(true);
  expect(g.groups[pair].hiddenCount).toBe(2);
  expect(g.edges.some((e) => e.to === pair || e.from === pair)).toBe(true);
  expect(g.edges.some((e) => e.from === e.to)).toBe(false);
  const hiddenIds = Object.values(s2.nodes).filter((n) => n.parent === pair).map((n) => n.id);
  for (const id of hiddenIds) expect(g.nodes[id]).toBeUndefined();
});

test("nested collapsed ancestor hides inner groups and counts all nodes", () => {
  const s = synth(3);
  const g = buildDisplayGraph(s, { ...defaultDisplayOptions(s), collapsed: new Set(["vpc", "sub"]) });
  expect(Object.keys(g.groups)).toEqual(["vpc"]);
  expect(g.groups.vpc.hiddenCount).toBe(3);
  expect(Object.keys(g.nodes)).toHaveLength(0);
  expect(g.edges).toHaveLength(0);
});

test("aux edge of a node inside a collapsed group stays visible when that node is selected", () => {
  const s = applyCommands(emptyState(), [
    { op: "add_group", id: "mon", group_kind: "vpc", label: "Mon", parent: null },
    { op: "add_node", id: "prom", kind: "monitoring", label: "Prometheus", parent: "mon" },
    { op: "add_node", id: "was", kind: "was", label: "WAS", parent: null },
    { op: "add_edge", from: "prom", to: "was", edge_kind: "aux" },
  ] as Command[]).state;
  const base = { ...defaultDisplayOptions(s), collapsed: new Set(["mon"]) };
  expect(buildDisplayGraph(s, base).edges).toHaveLength(0);
  const g = buildDisplayGraph(s, { ...base, selectedId: "prom" });
  expect(g.edges).toHaveLength(1);
  expect(g.edges[0].from).toBe("mon");
});

test("does not mutate input state", () => {
  const s2 = fx("s2");
  const before = JSON.stringify(s2);
  buildDisplayGraph(s2, { ...defaultDisplayOptions(s2), collapsed: new Set(Object.keys(s2.groups)) });
  expect(JSON.stringify(s2)).toBe(before);
});

test("> 40 nodes starts with the deepest non-root group collapsed", () => {
  const big = synth(45);
  expect(initialCollapsed(big).size).toBeGreaterThan(0);
  expect([...initialCollapsed(big)]).toEqual(["sub"]);
  expect(initialCollapsed(fx("s2")).size).toBe(0);
  expect(defaultDisplayOptions(big).collapsed.has("sub")).toBe(true);
});

test("aux never merges with a request edge; non-aux representative is order-independent", () => {
  const mk = (order: Command[]) =>
    applyCommands(emptyState(), [
      { op: "add_node", id: "x", kind: "was", label: "X", parent: null },
      { op: "add_node", id: "y", kind: "db_rdb", label: "Y", parent: null },
      ...order,
    ] as Command[]).state;
  const aux: Command = { op: "add_edge", id: "a-aux", from: "x", to: "y", edge_kind: "aux" };
  const req: Command = { op: "add_edge", id: "z-req", from: "x", to: "y", edge_kind: "request" };
  const req2: Command = { op: "add_edge", id: "b-req", from: "x", to: "y", edge_kind: "replication" } as Command;
  for (const order of [[aux, req], [req, aux]]) {
    const s = mk(order);
    const g = buildDisplayGraph(s, { ...defaultDisplayOptions(s), selectedId: "x" });
    expect(g.edges.map((e) => [e.id, e.edgeKind]).sort()).toEqual([["a-aux", "aux"], ["z-req", "request"]]);
  }
  const a = buildDisplayGraph(mk([req, req2]), defaultDisplayOptions(emptyState()));
  const b = buildDisplayGraph(mk([req2, req]), defaultDisplayOptions(emptyState()));
  expect(a.edges.map((e) => e.id)).toEqual(["b-req"]);
  expect(b.edges.map((e) => e.id)).toEqual(["b-req"]);
});

test("display edge carries payload/direction", () => {
  const s = applyCommands(emptyState(), [
    { op: "add_node", id: "a", kind: "was", label: "A", parent: null },
    { op: "add_node", id: "b", kind: "db_rdb", label: "B", parent: null },
    { op: "add_edge", id: "e1", from: "a", to: "b", edge_kind: "request", payload: "file", direction: "one_way" },
    { op: "add_edge", id: "e2", from: "a", to: "b", edge_kind: "request", payload: "api" },
  ] as Command[]).state;
  const plain = buildDisplayGraph(s, { ...defaultDisplayOptions(s), mergeDuplicates: false });
  expect(plain.edges.find((e) => e.id === "e1")).toMatchObject({ payload: "file", direction: "one_way" });
  const merged = buildDisplayGraph(s, { ...defaultDisplayOptions(s), mergeDuplicates: true });
  expect(merged.edges).toHaveLength(1);
  expect(merged.edges[0]).toMatchObject({ id: "e1", payload: "file", direction: "one_way" });
});

test("keepEdges keeps a hidden aux edge (flow step) while hideAux is on", () => {
  const { state } = applyCommands(fx("s2"), [{ op: "add_edge", from: "was-1", to: "db-proxy", edge_kind: "aux" }]);
  const aux = Object.values(state.edges).find((e) => e.edgeKind === "aux")!;
  const opts = defaultDisplayOptions(state);
  expect(buildDisplayGraph(state, opts).edges.some((e) => e.id === aux.id)).toBe(false);
  expect(buildDisplayGraph(state, { ...opts, keepEdges: new Set([aux.id]) }).edges.some((e) => e.id === aux.id)).toBe(true);
});

// ── 이중화 묶음 경계 합치기 · 출구선 ──
const pool = (extra: Command[] = []) =>
  applyCommands(emptyState(), [
    { op: "add_group", id: "asg", group_kind: "redundancy_group", label: "API 묶음", parent: null },
    { op: "add_node", id: "a1", kind: "app_server", label: "API #1", parent: "asg" },
    { op: "add_node", id: "a2", kind: "app_server", label: "API #2", parent: "asg" },
    { op: "add_node", id: "db", kind: "db_rdb", label: "DB", parent: null },
    { op: "add_node", id: "nat", kind: "nat", label: "NAT", parent: null },
    { op: "add_edge", id: "e1", from: "a1", to: "db", edge_kind: "request", label: "TCP 3306" },
    { op: "add_edge", id: "e2", from: "a2", to: "db", edge_kind: "request", label: "TCP 3306" },
    ...extra,
  ]).state;

test("members of an expanded redundancy group sending to the same outside target merge into one group→target edge", () => {
  const s = pool();
  const g = buildDisplayGraph(s, defaultDisplayOptions(s));
  const toDb = g.edges.filter((e) => e.to === "db");
  expect(toDb).toEqual([expect.objectContaining({ id: "e1", from: "asg", to: "db", label: "TCP 3306", sourceEdgeIds: ["e1", "e2"], origins: { e1: "a1", e2: "a2" } })]);
});

test("no group merge for a single sender, an inside target, a collapsed group, aux edges, or with merging off", () => {
  const single = pool([{ op: "remove_edge", id: "e2" }]);
  expect(buildDisplayGraph(single, defaultDisplayOptions(single)).edges.map((e) => [e.from, e.to])).toEqual([["a1", "db"]]);
  const inside = pool([
    { op: "add_node", id: "a3", kind: "app_server", label: "API #3", parent: "asg" },
    { op: "add_edge", id: "i1", from: "a1", to: "a3", edge_kind: "request" },
    { op: "add_edge", id: "i2", from: "a2", to: "a3", edge_kind: "request" },
  ]);
  const gi = buildDisplayGraph(inside, defaultDisplayOptions(inside));
  expect(gi.edges.filter((e) => e.to === "a3").map((e) => e.from).sort()).toEqual(["a1", "a2"]);
  const s = pool();
  const collapsed = buildDisplayGraph(s, { ...defaultDisplayOptions(s), collapsed: new Set(["asg"]) });
  expect(collapsed.edges.find((e) => e.to === "db")?.origins).toBeUndefined();
  const aux = pool([
    { op: "add_edge", id: "x1", from: "a1", to: "nat", edge_kind: "aux" },
    { op: "add_edge", id: "x2", from: "a2", to: "nat", edge_kind: "aux" },
  ]);
  const ga = buildDisplayGraph(aux, { ...defaultDisplayOptions(aux), hideAux: false });
  expect(ga.edges.filter((e) => e.to === "nat").map((e) => e.from).sort()).toEqual(["a1", "a2"]);
  expect(buildDisplayGraph(s, { ...defaultDisplayOptions(s), mergeDuplicates: false }).edges.map((e) => e.from).sort()).toEqual(["a1", "a2"]);
});

test("edges touching a NAT gateway are egress lines, including a merged group edge", () => {
  const s = pool([
    { op: "add_node", id: "pg", kind: "external_pg", label: "PG", parent: null },
    { op: "add_edge", id: "n1", from: "a1", to: "nat", edge_kind: "request" },
    { op: "add_edge", id: "n2", from: "a2", to: "nat", edge_kind: "request" },
    { op: "add_edge", id: "n3", from: "nat", to: "pg", edge_kind: "request" },
  ]);
  const g = buildDisplayGraph(s, defaultDisplayOptions(s));
  const egress = g.edges.filter((e) => e.egress).map((e) => `${e.from}>${e.to}`).sort();
  expect(egress).toEqual(["asg>nat", "nat>pg"]);
  expect(g.edges.find((e) => e.to === "db")?.egress).toBeUndefined();
});

// 처음 접기(배치 가독성 4단계): 노드가 40개를 넘으면 가장 깊은 영역부터 접어 보이는 상자를 40개 이하로 만든다.
const layoutFixture = (name: string): DiagramState =>
  JSON.parse(readFileSync(join(process.cwd(), `tests/fixtures/layout/${name}.json`), "utf8")) as DiagramState;

test.each([
  ["state-50", 40],
  ["state-100", 32],
  ["state-200", 21],
] as const)("%s 는 처음에 상자 %i개로 열리고 맨 바깥 영역은 펼쳐 있다", (name, boxes) => {
  const st = layoutFixture(name);
  const collapsed = initialCollapsed(st);
  expect(visibleBoxCount(st, collapsed)).toBe(boxes);
  for (const id of collapsed) expect(st.groups[id].parent).not.toBeNull();
  // 같은 입력에는 같은 결과.
  expect([...initialCollapsed(st)]).toEqual([...collapsed]);
});

test("state-50 은 이중화 묶음만 접히고 망·서브넷은 펼쳐 있다", () => {
  const st = layoutFixture("state-50");
  const kinds = new Set([...initialCollapsed(st)].map((id) => st.groups[id].groupKind));
  expect([...kinds]).toEqual(["redundancy_group"]);
});

test("40개 이하면 접지 않고, 노드가 하나뿐인 영역은 접지 않는다", () => {
  expect(initialCollapsed(layoutFixture("state-25")).size).toBe(0);
  // 맨 바깥 영역 하나 안에: 노드 하나짜리 영역 20개 + 노드 30개짜리 영역 하나.
  const cmds: Command[] = [{ op: "add_group", id: "top", group_kind: "vpc", label: "VPC", parent: null }, { op: "add_group", id: "big", group_kind: "subnet_private", label: "큰 구역", parent: "top" }];
  for (let i = 0; i < 20; i++) cmds.push({ op: "add_group", id: `one${i}`, group_kind: "subnet_private", label: `구역 ${i}`, parent: "top" }, { op: "add_node", id: `a${i}`, kind: "app_server", label: `A${i}`, parent: `one${i}` });
  for (let i = 0; i < 30; i++) cmds.push({ op: "add_node", id: `b${i}`, kind: "app_server", label: `B${i}`, parent: "big" });
  const st = applyCommands(emptyState(), cmds).state;
  expect([...initialCollapsed(st)]).toEqual(["big"]);
  expect(visibleBoxCount(st, initialCollapsed(st))).toBe(21);
});

test("영역 없이 노드만 많으면 접을 것이 없어 그대로 둔다", () => {
  const cmds: Command[] = Array.from({ length: 45 }, (_, i) => ({ op: "add_node", id: `n${i}`, kind: "app_server", label: `N${i}`, parent: null }) as Command);
  const st = applyCommands(emptyState(), cmds).state;
  expect(initialCollapsed(st).size).toBe(0);
  expect(visibleBoxCount(st, new Set())).toBe(45);
});

test("redundancyGroupIds 는 이중화 묶음만 고른다", () => {
  const st = layoutFixture("state-50");
  const ids = redundancyGroupIds(st);
  expect(ids).toHaveLength(10);
  expect(ids.every((id) => st.groups[id].groupKind === "redundancy_group")).toBe(true);
});
