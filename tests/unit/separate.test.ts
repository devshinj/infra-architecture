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

test("펼친 영역 테두리 곁 4px 안으로 붙는 밀기는 버리고 다른 쪽을 민다", () => {
  const input = new Map([["a", A], ["b", B]]);
  // 영역 왼쪽 테두리가 x=90. a 를 92 로 밀면 테두리에 2px 로 붙는다. b 를 116 으로 미는 것은 괜찮다.
  const zones: Rect[] = [{ x: 90, y: -100, width: 510, height: 500 }];
  const out = separateParallels(input, endsOf(input), new Map(), 16, zones);
  expect(out.get("a")).toEqual(A);
  expect(out.get("b")![2]!.x - A[2]!.x).toBeGreaterThanOrEqual(16);
});

test("선을 펼친 영역 밖으로(테두리 너머로) 미는 밀기는 버린다", () => {
  // a·b 모두 영역(x -50~110) 안이다. b 를 116 으로 밀면 영역 오른쪽 테두리(x=110)를 넘는다.
  const a = P([[10, 0], [10, 40], [100, 40], [100, 160], [10, 160], [10, 200]]);
  const b = P([[30, 0], [30, 80], [108, 80], [108, 120], [30, 120], [30, 200]]);
  const input = new Map([["a", a], ["b", b]]);
  // a 를 92 로, b 를 84 로 밀면 이 노드 상자를 지난다. a 를 124 로 밀어도 테두리를 넘는다.
  const boxes = new Map<string, Rect>([["n", { x: 80, y: 85, width: 15, height: 30 }]]);
  const zones: Rect[] = [{ x: -50, y: -50, width: 160, height: 400 }];
  const out = separateParallels(input, endsOf(input), boxes, 16, zones);
  expect(out).toEqual(input);
});

test("다른 선과 공유 조각을 함께 쓰는 토막은 밀지 않는다(줄기를 가르지 않는다)", () => {
  // a 와 b 는 x=100(y 40→60)과 y=40 을 함께 지난다. c 는 x=108 로 둘 곁 8px 를 지난다. a 만 왼쪽으로 밀면(교차·상자 문제 없음)
  // 줄기가 갈라진다.
  const b = P([[-50, 0], [-50, 40], [100, 40], [100, 60], [300, 60], [300, 100]]);
  const c = P([[400, 0], [400, 20], [108, 20], [108, 150], [300, 150], [300, 200]]);
  const input = new Map([["a", A], ["b", b], ["c", c]]);
  const out = separateParallels(input, endsOf(input), new Map(), 16);
  expect(out.get("a")).toEqual(A);
  expect(out.get("b")).toEqual(b);
  expect(out.get("c")![2]!.x - 100).toBeGreaterThanOrEqual(16);
});

test("소수 좌표에서도 민 간격을 재면 16px 이상이다", () => {
  // 504.32 + 16 은 부동소수로 520.3199999… 라 그대로 두면 간격이 16 보다 조금 작다.
  const a = P([[600, 0], [600, 40], [512.32, 40], [512.32, 160], [600, 160], [600, 200]]);
  const b = P([[504.32, 0], [504.32, 200], [300, 200]]);
  const input = new Map([["a", a], ["b", b]]);
  const out = separateParallels(input, endsOf(input), new Map(), 16);
  expect(Math.abs(out.get("a")![2]!.x - 504.32)).toBeGreaterThanOrEqual(16);
  expect(measure(out).parallelPx).toBe(0);
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
