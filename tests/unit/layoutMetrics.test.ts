import { expect, test } from "vitest";

import type { Layout, LaidOutNode } from "@/canvas/layout";
// ELK 적재가 느려 파일 맨 위에서 불러 수집 단계에서 적재한다(tokens.test.ts 주석 참고).
import { measureLayout } from "@/canvas/layoutMetrics";

const line = (id: string, ...pts: [number, number][]) => ({ id, points: pts.map(([x, y]) => ({ x, y })) });
const lay = (edges: Layout["edges"], nodes: Record<string, LaidOutNode> = {}): Layout => ({ nodes, groups: {}, edges, width: 200, height: 100 });
const ends: Record<string, [string, string]> = { a: ["n1", "n2"], b: ["n3", "n4"] };

test("parallel lines 12px apart over 100px count as 100 parallel px", () => {
  const m = measureLayout(lay([line("a", [0, 0], [0, 116]), line("b", [12, 0], [12, 116])]), ends);
  expect(m.parallelPx).toBe(100);
  expect(m.sharedPx).toBe(0);
});

test("lines 16px apart are not parallel", () => {
  const m = measureLayout(lay([line("a", [0, 0], [0, 116]), line("b", [16, 0], [16, 116])]), ends);
  expect(m.parallelPx).toBe(0);
});

test("identical segments count as shared, not parallel", () => {
  const m = measureLayout(lay([line("a", [0, 0], [0, 116]), line("b", [0, 0], [0, 116])]), ends);
  expect(m.sharedPx).toBeGreaterThan(0);
  expect(m.parallelPx).toBe(0);
});

test("perpendicular crossing counts once", () => {
  const m = measureLayout(lay([line("a", [0, 50], [100, 50]), line("b", [50, 0], [50, 100])]), ends);
  expect(m.crossings).toBe(1);
});

test("edge through a non-endpoint node is counted", () => {
  const node = (id: string, x: number): LaidOutNode => ({ id, x, y: 40, width: 20, height: 20, parent: null, displayLabel: id });
  const nodes = { n1: node("n1", 0), n2: node("n2", 180), mid: node("mid", 90) };
  const m = measureLayout(lay([line("a", [10, 50], [190, 50])], nodes), { a: ["n1", "n2"] });
  expect(m.throughNode).toBe(1);
});
