import { expect, test } from "vitest";

import type { Layout, Rect } from "@/canvas/layout";
import { measureLayout } from "@/canvas/layoutMetrics";
import { separateParallels } from "@/canvas/separate";

type Pt = { x: number; y: number };
const P = (pts: [number, number][]): Pt[] => pts.map(([x, y]) => ({ x, y }));

const layoutOf = (edges: Map<string, Pt[]>): Layout => ({
  nodes: {},
  groups: {},
  edges: [...edges].map(([id, points]) => ({ id, points })),
  width: 500,
  height: 400,
  labels: [],
  labelBlocked: [],
});
const endsOf = (edges: Map<string, Pt[]>): Map<string, [string, string]> => new Map([...edges.keys()].map((id) => [id, [`${id}-from`, `${id}-to`]]));
const measure = (edges: Map<string, Pt[]>) => measureLayout(layoutOf(edges), Object.fromEntries(endsOf(edges)), 16);
const orthogonal = (pts: Pt[]): boolean => pts.slice(1).every((b, i) => Math.abs(b.x - pts[i]!.x) < 0.01 || Math.abs(b.y - pts[i]!.y) < 0.01);

// A 의 안쪽 세로 토막(x=100, y 40→160)과 B 의 안쪽 세로 토막(x=108, y 50→150)이 8px 로 나란하다. 가로 토막끼리는 x 가 겹치지 않는다.
const A = P([[0, 0], [0, 40], [100, 40], [100, 160], [0, 160], [0, 200]]);
const B = P([[400, 0], [400, 50], [108, 50], [108, 150], [300, 150], [300, 200]]);

test("8px 로 나란한 두 안쪽 세로 토막을 16px 이상 띄우고, 끝점은 그대로이며 직교를 지킨다", () => {
  const input = new Map([["a", A], ["b", B]]);
  expect(measure(input).parallelPx).toBeGreaterThan(0);
  const out = separateParallels(input, endsOf(input), new Map(), 16);
  const a = out.get("a")!;
  const b = out.get("b")!;
  expect(Math.abs(a[2]!.x - b[2]!.x)).toBeGreaterThanOrEqual(16);
  for (const [id, pts] of out) {
    const orig = input.get(id)!;
    expect(pts.length).toBe(orig.length);
    expect(pts[0]).toEqual(orig[0]);
    expect(pts.at(-1)).toEqual(orig.at(-1));
    expect(orthogonal(pts)).toBe(true);
  }
  const m = measure(out);
  expect(m.parallelPx).toBe(0);
  expect(m.crossings).toBeLessThanOrEqual(measure(input).crossings);
  // 입력은 바꾸지 않는다.
  expect(input.get("a")).toEqual(A);
  expect(input.get("b")).toEqual(B);
});

test("같은 자리(0px)를 함께 지나는 공유 토막은 건드리지 않는다", () => {
  const input = new Map([
    ["a", A],
    ["b", P([[400, 0], [400, 50], [100, 50], [100, 150], [300, 150], [300, 200]])],
  ]);
  const out = separateParallels(input, endsOf(input), new Map(), 16);
  expect(out).toEqual(input);
});

test("어느 쪽으로 밀어도 노드 상자를 지나게 되면 그대로 둔다", () => {
  const input = new Map([["a", A], ["b", B]]);
  // a 를 92·124 로, b 를 116·84 로 밀면 모두 상자를 지난다.
  const boxes = new Map<string, Rect>([
    ["left", { x: 80, y: 60, width: 15, height: 80 }],
    ["right", { x: 112, y: 60, width: 18, height: 80 }],
  ]);
  const out = separateParallels(input, endsOf(input), boxes, 16);
  expect(out).toEqual(input);
});

test("어느 쪽으로 밀어도 다른 선과 교차가 늘면 그대로 두고, 교차는 입력보다 늘지 않는다", () => {
  const input = new Map([
    ["a", A],
    ["b", B],
    // a 를 92 로, b 를 84 로 밀면 c 의 가로 토막(y=100, x 20→95)을 가로지른다.
    ["c", P([[20, 300], [20, 100], [95, 100]])],
    // b 를 116 으로, a 를 124 로 밀면 d 의 가로 토막(y=100, x 113→200)을 가로지른다.
    ["d", P([[113, 100], [200, 100], [200, 300]])],
  ]);
  const before = measure(input);
  const out = separateParallels(input, endsOf(input), new Map(), 16);
  expect(out).toEqual(input);
  expect(measure(out).crossings).toBeLessThanOrEqual(before.crossings);
});

test("처음·마지막 토막(노드에 닿는 끝)은 밀지 않는다", () => {
  // 두 선 모두 세로 토막이 첫 토막이다.
  const input = new Map([
    ["a", P([[100, 0], [100, 200], [0, 200]])],
    ["b", P([[108, 0], [108, 200], [300, 200]])],
  ]);
  const out = separateParallels(input, endsOf(input), new Map(), 16);
  expect(out).toEqual(input);
});
