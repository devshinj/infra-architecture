import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { startBundleMotion } from "@/canvas/motion";
import type { Bundle } from "@/canvas/segments";

const L = 180;
const mkBundle = (edgeKind: "request" | "async"): Bundle => ({
  id: "b0",
  periodMs: 4000,
  offsetMs: 300,
  junctions: [],
  segments: [{ key: "k1", d: "M 0 0 L 180 0", length: L, edgeKind, edgeIds: ["e1"], startMs: 500 }],
});

const calls: { el: Element; frames: Keyframe[]; opts: KeyframeAnimationOptions }[] = [];
let rafCb: FrameRequestCallback | null = null;
const cancelled: number[] = [];

beforeEach(() => {
  calls.length = 0;
  rafCb = null;
  // @ts-expect-error jsdom lacks these
  SVGElement.prototype.animate = function (this: Element, frames: Keyframe[], opts: KeyframeAnimationOptions) {
    calls.push({ el: this, frames, opts });
    return { cancel: vi.fn() };
  };
  // @ts-expect-error jsdom lacks these
  SVGElement.prototype.getPointAtLength = (n: number) => ({ x: n, y: 0 });
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => ((rafCb = cb), 7));
  vi.stubGlobal("cancelAnimationFrame", (id: number) => cancelled.push(id));
  vi.spyOn(performance, "now").mockReturnValue(0);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

test("comet: three dash layers with keyframe window, delay = offset, duration = period", () => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg") as SVGSVGElement;
  const stop = startBundleMotion(svg, mkBundle("request"), "comet");
  expect(calls).toHaveLength(3);
  const speed = 90;
  for (const [i, len] of [34, 16, 4].entries()) {
    const c = calls[i];
    expect(c.el.getAttribute("stroke-dasharray")).toBe(`${len} ${L + 200}`);
    const t0 = 500 / 4000;
    const t1 = (500 + ((L + len) / speed) * 1000) / 4000;
    expect(c.frames).toEqual([
      { offset: 0, strokeDashoffset: len },
      { offset: t0, strokeDashoffset: len },
      { offset: t1, strokeDashoffset: -L },
      { offset: 1, strokeDashoffset: -L },
    ]);
    expect(c.opts.delay).toBe(300);
    expect(c.opts.duration).toBe(4000);
    expect(c.opts.iterations).toBe(Infinity);
  }
  stop();
  expect(svg.querySelectorAll("path")).toHaveLength(0);
});

test("capsule phase matches comet timing: hidden before offset, then (t - offset - start) * speed", () => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg") as SVGSVGElement;
  const stop = startBundleMotion(svg, mkBundle("async"), "capsule");
  const speed = 90 * 0.75;
  const lead = svg.querySelectorAll("rect")[0];

  rafCb!(299); // before the delay
  expect(lead.getAttribute("visibility")).toBe("hidden");

  rafCb!(300 + 500 + 1000); // 1s into the segment window
  expect(lead.getAttribute("visibility")).toBe("visible");
  expect(lead.getAttribute("transform")).toBe(`translate(${speed} 0) rotate(0)`);

  rafCb!(300 + 4000 + 500 + 1000); // next period, same phase
  expect(lead.getAttribute("transform")).toBe(`translate(${speed} 0) rotate(0)`);

  stop();
  expect(cancelled).toContain(7);
});
