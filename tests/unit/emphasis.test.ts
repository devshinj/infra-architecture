import { expect, test } from "vitest";

import type { DisplayEdge } from "@/canvas/display";
import { emphasisOf } from "@/canvas/emphasis";

const de = (id: string, from: string, to: string, sourceEdgeIds = [id]): DisplayEdge => ({ id, from, to, edgeKind: "request", sourceEdgeIds });
const edges = [de("e1", "a", "b"), de("e2", "b", "c"), de("e3", "d", "e"), de("bus", "x", "y", ["src1", "src2"])];

test("node emphasis includes neighbors and incident edges", () => {
  const em = emphasisOf(edges, "b")!;
  expect([...em.nodes].sort()).toEqual(["a", "b", "c"]);
  expect([...em.edges].sort()).toEqual(["e1", "e2"]);
});

test("edge emphasis includes both endpoints", () => {
  const em = emphasisOf(edges, "e3")!;
  expect([...em.nodes].sort()).toEqual(["d", "e"]);
  expect([...em.edges]).toEqual(["e3"]);
});

test("bundled edge id resolves through sourceEdgeIds", () => {
  const em = emphasisOf(edges, "src2")!;
  expect([...em.nodes].sort()).toEqual(["x", "y"]);
  expect([...em.edges]).toEqual(["bus"]);
});

test("null id gives null", () => {
  expect(emphasisOf(edges, null)).toBeNull();
});

test("a node without edges is emphasized alone", () => {
  const em = emphasisOf(edges, "lonely")!;
  expect([...em.nodes]).toEqual(["lonely"]);
  expect(em.edges.size).toBe(0);
});

test("unknown hover id gives no emphasis when node ids are known", () => {
  expect(emphasisOf(edges, "gone", new Set(["a", "b"]))).toBeNull();
  expect(emphasisOf(edges, "a", new Set(["a", "b"]))).not.toBeNull();
  expect(emphasisOf(edges, "src1", new Set())).not.toBeNull();
});

import { litZones } from "@/canvas/emphasis";

const parents: Record<string, string | null> = { a: "subnet", subnet: "vpc", vpc: null, b: null, other: "vpc2", vpc2: null };
const parentOf = (id: string) => parents[id] ?? null;

test("lit zones are ancestors of emphasized nodes", () => {
  const lit = litZones(parentOf, { nodes: new Set(["a"]), edges: new Set() }, null);
  expect([...lit].sort()).toEqual(["a", "subnet", "vpc"].sort());
  expect(lit.has("vpc2")).toBe(false);
});

test("a selected zone and its ancestors stay lit", () => {
  const lit = litZones(parentOf, { nodes: new Set(["b"]), edges: new Set() }, "subnet");
  expect(lit.has("subnet")).toBe(true);
  expect(lit.has("vpc")).toBe(true);
  expect(lit.has("vpc2")).toBe(false);
});

test("collapsed zone that is an edge endpoint is lit", () => {
  const lit = litZones(parentOf, { nodes: new Set(["vpc2"]), edges: new Set() }, null);
  expect(lit.has("vpc2")).toBe(true);
});

import { flowEmphasis } from "@/canvas/emphasis";

test("flowEmphasis maps merged source ids to the display edge", () => {
  const em = flowEmphasis(edges, ["src1", "e1", "src2", "gone"]);
  expect([...em.edges].sort()).toEqual(["bus", "e1"]);
});

test("nodes are step endpoints", () => {
  const em = flowEmphasis(edges, ["e1", "e2"]);
  expect([...em.nodes].sort()).toEqual(["a", "b", "c"]);
  expect(em.nodes.has("d")).toBe(false);
  // 단계가 하나도 맞지 않으면 빈 강조(모두 흐림)다.
  const none = flowEmphasis(edges, ["gone"]);
  expect(none.nodes.size + none.edges.size).toBe(0);
});
