import { expect, test } from "vitest";

import { buildDisplayGraph, defaultDisplayOptions, initialCollapsed } from "@/canvas/display";
import { applyCommands } from "@/domain/apply";
import type { Command } from "@/domain/commands";
import { emptyState } from "@/domain/types";
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

test("> 40 nodes starts with non-root groups collapsed", () => {
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
