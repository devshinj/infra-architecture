import { describe, expect, test } from "vitest";

import { labelBox, NODE_RING, ROW_GAP, tooClose } from "@/canvas/edgeLabels";
import type { LaidOutGroup, LaidOutNode } from "@/canvas/layout";
import { zoneHeadPill } from "@/canvas/layoutMetrics";
import { placeRestingLabels, restingLabelGroups, type RestingLabelInput } from "@/canvas/restingLabels";

const node = (id: string, x: number, y: number, parent: string | null = null): LaidOutNode => ({ id, x, y, width: 40, height: 40, parent, displayLabel: id });
const item = (id: string, from: string, to: string, pts: [number, number][], label = "NFS", egress?: boolean): RestingLabelInput => ({
  id, label, from, to, points: pts.map(([x, y]) => ({ x, y })), egress,
});
const lay = (items: RestingLabelInput[], nodes: Record<string, LaidOutNode>, groups: Record<string, LaidOutGroup> = {}) => ({
  nodes, groups, edges: items.map((i) => ({ id: i.id, points: i.points })) as never,
});
const boxOf = (p: { text: string; x: number; y: number }) => labelBox({ ...p, anchor: "middle" });
const ringBox = (n: LaidOutNode) => ({ x1: n.x - NODE_RING, y1: n.y - NODE_RING, x2: n.x + n.width + NODE_RING, y2: n.y + n.height + NODE_RING });
const gap = (a: ReturnType<typeof boxOf>, b: ReturnType<typeof boxOf>) => Math.max(b.x1 - a.x2, a.x1 - b.x2, b.y1 - a.y2, a.y1 - b.y2);

describe("restingLabelGroups", () => {
  test("같은 이름이 같은 끝을 쓰면 x N 하나, 끝이 다르면 따로, 출구선은 뺀다", () => {
    const g = restingLabelGroups([
      item("c", "a", "z", [[0, 0], [100, 0]]),
      item("a", "b", "z", [[0, 0], [100, 0]]),
      item("b", "d", "z", [[0, 0], [100, 0]]),
      item("x", "p", "q", [[0, 0], [100, 0]]),
      item("e", "p", "z", [[0, 0], [100, 0]], "NFS", true),
    ]);
    expect(g).toContainEqual({ text: "NFS ×3", edgeIds: ["a", "b", "c"] });
    expect(g).toContainEqual({ text: "NFS", edgeIds: ["x"] });
    expect(g).toHaveLength(2);
  });
});

describe("placeRestingLabels", () => {
  test("노드 상자와 ROW_GAP 미만으로 붙지 않는다", () => {
    const nodes = { a: node("a", 0, 80), b: node("b", 300, 80), m: node("m", 140, 80) };
    const it = item("e", "a", "b", [[40, 100], [300, 100]]);
    const { placed, blocked } = placeRestingLabels(lay([it], nodes), [it], {});
    expect(blocked).toEqual([]);
    const b = boxOf(placed[0]);
    for (const n of Object.values(nodes)) expect(tooClose(b, ringBox(n))).toBe(false);
  });

  test("남의 선을 비키되 줄기 식구와는 겹쳐도 된다", () => {
    const nodes = { a: node("a", 0, 80), b: node("b", 300, 80) };
    const it = item("e", "a", "b", [[40, 100], [300, 100]]);
    const cross = item("x", "c", "d", [[170, 0], [170, 200]], "");
    const family = item("f", "a", "b", [[40, 100], [300, 100]], "");
    const { placed } = placeRestingLabels(lay([it, cross, family], nodes), [it], {});
    const b = boxOf(placed[0]);
    expect(b.x1 <= 170 && 170 <= b.x2).toBe(false);
    const around = placeRestingLabels(lay([it, family], nodes), [it], {});
    expect(around.placed[0].x).toBeCloseTo(170, 0);
  });

  test("같은 자리를 원하는 두 이름은 ROW_GAP 이상 떨어진다", () => {
    const nodes = { a: node("a", 0, 0), b: node("b", 300, 0), c: node("c", 0, 100), d: node("d", 300, 100) };
    const i1 = item("e1", "a", "b", [[40, 20], [300, 20]], "TCP 1");
    const i2 = item("e2", "c", "d", [[40, 120], [300, 120]], "TCP 2");
    const pref = new Map([["e1", { x: 170, y: 70 }], ["e2", { x: 170, y: 70 }]]);
    const { placed } = placeRestingLabels(lay([i1, i2], nodes), [i1, i2], {}, pref);
    expect(gap(boxOf(placed[0]), boxOf(placed[1]))).toBeGreaterThanOrEqual(ROW_GAP - 1e-6);
  });

  test("펼친 영역 이름 알약과 붙지 않는다", () => {
    const groups = { z: { id: "z", x: 0, y: 0, width: 400, height: 200, parent: null } };
    const nodes = { n: node("n", 300, 140, "z"), p: node("p", 500, 0), q: node("q", 500, 100) };
    const it = item("e", "p", "q", [[-60, 15], [200, 15]]);
    const { placed } = placeRestingLabels(lay([it], nodes, groups), [it], { z: "공개 서브넷" });
    const pill = zoneHeadPill(groups.z, "공개 서브넷");
    const pb = { x1: pill.x, y1: pill.y, x2: pill.x + pill.width, y2: pill.y + pill.height };
    expect(tooClose(boxOf(placed[0]), pb)).toBe(false);
  });

  test("묶음은 함께 쓰는 끝에 가장 가까운 선에 이름을 달고 preferred 가 합법이면 그대로 쓴다", () => {
    const nodes = { s: node("s", 0, 0), t1: node("t1", 400, 0), t2: node("t2", 400, 200) };
    const near = item("b", "s", "t1", [[40, 20], [400, 20]]);
    const far = item("a", "s", "t2", [[40, 20], [220, 20], [220, 220], [400, 220]]);
    const r = placeRestingLabels(lay([near, far], nodes), [far, near], {});
    expect(r.placed).toHaveLength(1);
    expect(r.placed[0].edgeIds).toEqual(["b", "a"]);
    const pref = new Map([["b", { x: 250, y: 20 }]]);
    const r2 = placeRestingLabels(lay([near, far], nodes), [far, near], {}, pref);
    expect(r2.placed[0]).toMatchObject({ x: 250, y: 20 });
  });

  test("자리가 없으면 첫 후보에 두고 blocked 에 든다", () => {
    const nodes = { a: node("a", 0, 0), b: node("b", 60, 0) };
    const it = item("e", "a", "b", [[40, 20], [60, 20]], "아주 긴 이름의 연결");
    const r = placeRestingLabels(lay([it], nodes), [it], {});
    expect(r.blocked).toEqual(["e"]);
    expect(r.placed).toHaveLength(1);
  });
});
