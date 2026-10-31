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
