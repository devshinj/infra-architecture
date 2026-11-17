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

// 묶음 경계에서 합친 연결(asg → db, a1·a2 가 보냄).
const mergedEdge = { id: "e1", from: "asg", to: "db", edgeKind: "request" as const, sourceEdgeIds: ["e1", "e2"], origins: { e1: "a1", e2: "a2" } };

test("a merged group edge is incident to each sending member, and its target lights every member", () => {
  const member = emphasisOf([mergedEdge], "a1")!;
  expect([...member.edges]).toEqual(["e1"]);
  expect(member.nodes.has("a2")).toBe(false);
  const target = emphasisOf([mergedEdge], "db")!;
  expect([...target.nodes].sort()).toEqual(["a1", "a2", "asg", "db"]);
  // 원래 연결 하나를 고르면 그 연결을 보낸 구성원만, 합친 연결 자체면 구성원 모두.
  expect([...emphasisOf([mergedEdge], "e2")!.nodes].sort()).toEqual(["a2", "asg", "db"]);
});

test("flow emphasis lights the member a merged step actually leaves from", () => {
  expect([...flowEmphasis([mergedEdge], ["e2"]).nodes].sort()).toEqual(["a2", "asg", "db"]);
});

import { zoneEmphasis } from "@/canvas/emphasis";

test("zoneEmphasis lights everything inside the zone, crossing edges and their outside ends", () => {
  // vpc ⊃ subnet ⊃ a, vpc ⊃ b, 바깥 c·d. a-b 안끼리, b-c 경계 넘음, c-d 바깥끼리.
  const tree: Record<string, string | null> = { vpc: null, subnet: "vpc", empty: "vpc", a: "subnet", b: "vpc", c: null, d: null };
  const up = (id: string) => tree[id] ?? null;
  const es = [de("in", "a", "b"), de("cross", "c", "b"), de("out", "c", "d")];
  const em = zoneEmphasis(es, up, Object.keys(tree), "vpc");
  expect([...em.nodes].sort()).toEqual(["a", "b", "c", "empty", "subnet", "vpc"]);
  expect([...em.edges].sort()).toEqual(["cross", "in"]);
});

test("zoneEmphasis lights the members behind a merged bundle edge", () => {
  const tree: Record<string, string | null> = { zone: null, pair: null, m1: "pair", m2: "pair", x: "zone" };
  const merged: DisplayEdge = { ...de("pair-x", "pair", "x", ["s1", "s2"]), origins: { s1: "m1", s2: "m2" } };
  const em = zoneEmphasis([merged], (id) => tree[id] ?? null, Object.keys(tree), "zone");
  expect([...em.nodes].sort()).toEqual(["m1", "m2", "pair", "x", "zone"]);
});
