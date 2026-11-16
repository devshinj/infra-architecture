import { describe, expect, it } from "vitest";
import { branchSpot, farEnd, nextTrunk, trunkColor } from "@/canvas/trunk";

const at = { x: 0, y: 0 };
const click = (segKey: string, edgeIds: string[]) => ({ segKey, edgeIds, at });
const abc = { segKey: "s1", edgeIds: ["a", "b", "c"], at };

describe("nextTrunk", () => {
  it("expands a shared piece", () => {
    expect(nextTrunk(null, click("s1", ["a", "b", "c"]))).toEqual({ trunk: abc, select: null });
  });
  it("same segKey keeps current", () => {
    const r = nextTrunk(abc, { segKey: "s1", edgeIds: ["a", "b", "c"], at: { x: 9, y: 9 } });
    expect(r.trunk).toBe(abc);
    expect(r.select).toBeNull();
  });
  it("narrows to a subset", () => {
    const r = nextTrunk(abc, click("s2", ["b", "c"]));
    expect(r.trunk?.edgeIds).toEqual(["b", "c"]);
    expect(r.select).toBeNull();
  });
  it("single member of trunk selects it", () => {
    expect(nextTrunk(abc, click("s3", ["a"]))).toEqual({ trunk: null, select: "a" });
  });
  it("outside piece expands anew", () => {
    const r = nextTrunk(abc, click("s4", ["d", "e"]));
    expect(r.trunk?.edgeIds).toEqual(["d", "e"]);
  });
  it("single edge with no trunk selects", () => {
    expect(nextTrunk(null, click("s5", ["a"]))).toEqual({ trunk: null, select: "a" });
  });
});

describe("farEnd", () => {
  const pts = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }];
  it("near source gives to", () => expect(farEnd(pts, { x: 20, y: 0 }, "f", "t")).toBe("t"));
  it("near target gives from", () => expect(farEnd(pts, { x: 100, y: 80 }, "f", "t")).toBe("f"));
  it("exact middle gives to", () => expect(farEnd(pts, { x: 100, y: 0 }, "f", "t")).toBe("t"));
});

describe("trunkColor", () => {
  it("cycles 0..5", () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7].map(trunkColor)).toEqual([0, 1, 2, 3, 4, 5, 0, 1]);
  });
});

describe("branchSpot", () => {
  const pts = [{ x: 0, y: 0 }, { x: 200, y: 0 }];
  const segs = [
    { edgeIds: ["a", "b"], pts: [{ x: 0, y: 0 }, { x: 50, y: 0 }] },
    { edgeIds: ["a"], pts: [{ x: 50, y: 0 }, { x: 150, y: 0 }] },
    { edgeIds: ["b"], pts: [{ x: 150, y: 0 }, { x: 200, y: 0 }] },
  ];
  it("walks toward the far end, offset 14 into the first single piece", () => {
    // click near start: far end is the target side
    expect(branchSpot(pts, { x: 10, y: 0 }, segs, "a")).toEqual({ x: 64, y: 0 });
    expect(branchSpot(pts, { x: 10, y: 0 }, segs, "b")).toEqual({ x: 150 + 14, y: 0 });
  });
  it("walks toward the start when click is near the target", () => {
    expect(branchSpot(pts, { x: 190, y: 0 }, segs, "a")).toEqual({ x: 150 - 14, y: 0 });
  });
  it("null when none", () => {
    expect(branchSpot(pts, { x: 10, y: 0 }, segs, "z")).toBeNull();
  });
});

describe("branchSpot with a cornered branch piece", () => {
  // edge a: (0,0)->(100,0)->(100,100)->(200,100); trunk for a,b first, then a alone turns the corner
  const pts = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 200, y: 100 }];
  const segs = [
    { edgeIds: ["a", "b"], pts: [{ x: 0, y: 0 }, { x: 60, y: 0 }] },
    { edgeIds: ["a"], pts: [{ x: 60, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }] },
    { edgeIds: ["a", "b"], pts: [{ x: 100, y: 100 }, { x: 200, y: 100 }] },
  ];
  it("click on source half: enters at the source-side end of the cornered piece", () => {
    expect(branchSpot(pts, { x: 10, y: 0 }, segs, "a")).toEqual({ x: 74, y: 0 });
  });
  it("click on target half: enters at the target-side end, not the far end", () => {
    expect(branchSpot(pts, { x: 190, y: 100 }, segs, "a")).toEqual({ x: 100, y: 86 });
  });
});
