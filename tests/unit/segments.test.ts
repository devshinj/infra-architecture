import { describe, expect, test } from "vitest";
import { buildSegmentBundles } from "@/canvas/segments";

const p = (x: number, y: number) => ({ x, y });

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
});
