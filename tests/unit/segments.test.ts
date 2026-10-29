import { describe, expect, test } from "vitest";
import { buildDisplayGraph, defaultDisplayOptions } from "@/canvas/display";
import { layoutDiagram } from "@/canvas/layout";
import { buildSegmentBundles, type Segment } from "@/canvas/segments";
import { fx } from "../fixtures/spike";

const p = (x: number, y: number) => ({ x, y });

const pts = (d: string) =>
  d.split(/[ML]/).filter(Boolean).map((t) => {
    const [x, y] = t.trim().split(/\s+/).map(Number);
    return { x, y };
  });
const ends = (s: Segment) => {
  const q = pts(s.d);
  return { a: q[0], b: q[q.length - 1] };
};

describe("buildSegmentBundles", () => {
  test("fan-out shares the trunk once and both branches start when the trunk ends", () => {
    const [b] = buildSegmentBundles([
      { id: "a", edgeKind: "request", points: [p(0, 0), p(0, 90), p(-90, 90), p(-90, 180)] },
      { id: "b", edgeKind: "request", points: [p(0, 0), p(0, 90), p(90, 90), p(90, 180)] },
    ]);
    const trunk = b.segments.find((s) => s.edgeIds.length === 2)!;
    expect(trunk.length).toBe(90);
    const branches = b.segments.filter((s) => s.edgeIds.length === 1);
    expect(branches.map((s) => s.startMs)).toEqual([1000, 1000]);
    expect(b.junctions).toEqual([{ x: 0, y: 90 }]);
  });

  test("fan-in: branches of different length arrive at the join together", () => {
    const [b] = buildSegmentBundles([
      { id: "a", edgeKind: "request", points: [p(-180, 0), p(-180, 90), p(0, 90), p(0, 180)] },
      { id: "b", edgeKind: "request", points: [p(90, 0), p(90, 90), p(0, 90), p(0, 180)] },
    ]);
    const ends = b.segments
      .filter((s) => s.edgeIds.length === 1)
      .map((s) => s.startMs + (s.length / 90) * 1000);
    expect(Math.abs(ends[0] - ends[1])).toBeLessThan(1);
    const tail = b.segments.find((s) => s.edgeIds.length === 2)!;
    expect(Math.abs(tail.startMs - ends[0])).toBeLessThan(1);
  });

  test("unrelated edges are separate bundles with staggered offsets", () => {
    const bundles = buildSegmentBundles([
      { id: "a", edgeKind: "request", points: [p(0, 0), p(0, 90)] },
      { id: "b", edgeKind: "request", points: [p(200, 0), p(200, 90)] },
    ]);
    expect(bundles.map((b) => b.id)).toEqual(["b0", "b1"]);
    expect(bundles.map((b) => b.offsetMs)).toEqual([0, 350]);
  });

  test("replication bundle uses half speed", () => {
    const [b] = buildSegmentBundles([
      { id: "a", edgeKind: "replication", points: [p(0, 0), p(0, 90), p(-90, 90)] },
      { id: "b", edgeKind: "replication", points: [p(0, 0), p(0, 90), p(90, 90)] },
    ]);
    const branches = b.segments.filter((s) => s.edgeIds.length === 1);
    expect(branches.map((s) => s.startMs)).toEqual([2000, 2000]);
  });

  test("aux-only bundle starts everything at 0 with a 1200ms period", () => {
    const [b] = buildSegmentBundles([
      { id: "a", edgeKind: "aux", points: [p(0, 0), p(0, 90), p(90, 90)] },
    ]);
    expect(b.segments.every((s) => s.startMs === 0)).toBe(true);
    expect(b.periodMs).toBe(1200);
  });

  test("path d is rounded to 0.5 and a lone edge becomes one segment", () => {
    const [b] = buildSegmentBundles([
      { id: "a", edgeKind: "request", points: [p(0.2, 0), p(0, 90.3), p(-90, 90)] },
    ]);
    expect(b.segments).toHaveLength(1);
    expect(b.segments[0].d).toBe("M 0 0 L 0 90.5 L -90 90");
  });

  test("unequal diamond: no segment starts before its predecessor ends, fork branches start together", () => {
    // trunk 90, branch a 450, branch b 270, shared tail 90
    const [b] = buildSegmentBundles([
      { id: "a", edgeKind: "request", points: [p(0, 0), p(0, 90), p(-180, 90), p(-180, 180), p(0, 180), p(0, 270)] },
      { id: "b", edgeKind: "request", points: [p(0, 0), p(0, 90), p(90, 90), p(90, 180), p(0, 180), p(0, 270)] },
    ]);
    expect(b.segments).toHaveLength(4);
    for (const pr of b.segments) {
      for (const sc of b.segments) {
        const e = ends(pr);
        const st = ends(sc);
        if (e.b.x === st.a.x && e.b.y === st.a.y) {
          expect(sc.startMs).toBeGreaterThanOrEqual(pr.startMs + (pr.length / 90) * 1000 - 1);
        }
      }
    }
    // Rule: fork simultaneity beats join arrival; the tail starts at the latest arrival.
    const branches = b.segments.filter((s) => s.edgeIds.length === 1);
    expect(branches.map((s) => s.startMs)).toEqual([1000, 1000]);
    const tail = b.segments.find((s) => s.edgeIds.length === 2 && s.length === 90 && ends(s).a.y === 180)!;
    expect(tail.startMs).toBe(6000);
  });

  test("cyclic segment graph falls back to independent per-edge timing", () => {
    const [b] = buildSegmentBundles([
      { id: "a", edgeKind: "request", points: [p(0, 0), p(0, 90), p(90, 90)] },
      { id: "b", edgeKind: "request", points: [p(0, 90), p(90, 90), p(0, 0), p(0, 90)] },
    ]);
    expect(b.segments.every((s) => s.edgeIds.length === 1)).toBe(true);
    const a = b.segments.filter((s) => s.edgeIds[0] === "a").sort((x, y) => x.startMs - y.startMs);
    expect(a.map((s) => s.startMs)).toEqual([0, 1000]);
    const bb = b.segments.filter((s) => s.edgeIds[0] === "b").sort((x, y) => x.startMs - y.startMs);
    expect(bb[0].startMs).toBe(0);
    expect(bb[1].startMs).toBeCloseTo(1000);
  });

  test("partially overlapping vertical spans share the overlap as one segment", () => {
    const bundles = buildSegmentBundles([
      { id: "a", edgeKind: "request", points: [p(0, 0), p(0, 100)] },
      { id: "b", edgeKind: "request", points: [p(0, 40), p(0, 160)] },
    ]);
    expect(bundles).toHaveLength(1);
    const shared = bundles[0].segments.filter((s) => s.edgeIds.length === 2);
    expect(shared).toHaveLength(1);
    expect(shared[0].d).toBe("M 0 40 L 0 100");
    expect(shared[0].length).toBe(60);
  });

  test("a long straight edge and a polyline share the common trunk", () => {
    const bundles = buildSegmentBundles([
      { id: "a", edgeKind: "request", points: [p(0, 0), p(0, 200)] },
      { id: "b", edgeKind: "request", points: [p(0, 0), p(0, 90), p(90, 90)] },
    ]);
    expect(bundles).toHaveLength(1);
    const shared = bundles[0].segments.find((s) => s.edgeIds.length === 2)!;
    expect(shared.d).toBe("M 0 0 L 0 90");
  });

  test("near-collinear lines (0.2px apart) still share", () => {
    const bundles = buildSegmentBundles([
      { id: "a", edgeKind: "request", points: [p(0, 0), p(0, 100)] },
      { id: "b", edgeKind: "request", points: [p(0.2, 50), p(0.2, 150)] },
    ]);
    expect(bundles).toHaveLength(1);
    expect(bundles[0].segments.some((s) => s.edgeIds.length === 2)).toBe(true);
  });
});

function legs(d: string) {
  const q = pts(d);
  return q.slice(1).map((b, i) => ({ a: q[i], b }));
}

test.each(["s1", "s2", "s3", "s4", "s5"])("fixture %s: no collinear overlap across bundles", async (id) => {
  const st = fx(id);
  const g = buildDisplayGraph(st, defaultDisplayOptions(st));
  const l = await layoutDiagram(g, {});
  const kind = new Map(g.edges.map((e) => [e.id, e.edgeKind]));
  const bundles = buildSegmentBundles(
    l.edges.map((e) => ({ id: e.id, edgeKind: kind.get(e.id)!, points: e.points })),
  );
  const all = bundles.flatMap((b, bi) => b.segments.flatMap((s) => legs(s.d).map((lg) => ({ bi, ...lg }))));
  const bad: string[] = [];
  for (let i = 0; i < all.length; i++) {
    for (let j = i + 1; j < all.length; j++) {
      const u = all[i];
      const v = all[j];
      if (u.bi === v.bi) continue;
      const vu = u.a.x === u.b.x && v.a.x === v.b.x;
      const hu = u.a.y === u.b.y && v.a.y === v.b.y;
      if (vu && Math.abs(u.a.x - v.a.x) <= 1) {
        const o = Math.min(Math.max(u.a.y, u.b.y), Math.max(v.a.y, v.b.y)) - Math.max(Math.min(u.a.y, u.b.y), Math.min(v.a.y, v.b.y));
        if (o > 1) bad.push(`v x=${u.a.x} overlap ${o}`);
      } else if (hu && Math.abs(u.a.y - v.a.y) <= 1) {
        const o = Math.min(Math.max(u.a.x, u.b.x), Math.max(v.a.x, v.b.x)) - Math.max(Math.min(u.a.x, u.b.x), Math.min(v.a.x, v.b.x));
        if (o > 1) bad.push(`h y=${u.a.y} overlap ${o}`);
      }
    }
  }
  expect(bad).toEqual([]);
});
