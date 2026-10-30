import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { useCamera, type CameraInput, type Viewport } from "@/canvas/useCamera";
import type { Rect } from "@/canvas/layout";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const box = (x: number, y: number): Rect => ({ x, y, width: 100, height: 50 });
const SIZE = { width: 1000, height: 600 };

/** A fake React Flow camera: setViewport updates what getViewport returns. */
function rig(initial: Partial<CameraInput> = {}) {
  let vp: Viewport = { x: 0, y: 0, zoom: 1 };
  const setViewport = vi.fn((v: Viewport, opts: { duration: number }) => {
    void opts;
    vp = v;
  });
  const getViewport = vi.fn(() => vp);
  const base: CameraInput = {
    boardKey: "b1",
    rects: { a: box(0, 0) },
    size: SIZE,
    insets: { left: 0, right: 0 },
    streaming: false,
    reducedMotion: false,
    getViewport,
    setViewport,
    ...initial,
  };
  const hook = renderHook((p: CameraInput) => useCamera(p), { initialProps: base });
  let props = base;
  const update = (patch: Partial<CameraInput>) => {
    props = { ...props, ...patch };
    hook.rerender(props);
  };
  const durations = () => setViewport.mock.calls.map((c) => c[1].duration);
  return { hook, update, setViewport, durations, vp: () => vp, setVp: (v: Viewport) => (vp = v), props: () => props };
}

test("version switch fits immediately", () => {
  const r = rig();
  expect(r.setViewport).toHaveBeenCalledTimes(1); // first board
  r.setViewport.mockClear();
  r.update({ boardKey: "b2", rects: { a: box(0, 0), z: box(5000, 0) } });
  expect(r.setViewport).toHaveBeenCalledTimes(1);
  expect(r.durations()).toEqual([0]);
});

test("no fit when new nodes are already visible", () => {
  const r = rig({ rects: { a: box(0, 0), b: box(3000, 0) } });
  r.setViewport.mockClear();
  r.setVp({ x: 0, y: 0, zoom: 1 });
  r.update({ streaming: true });
  act(() => vi.advanceTimersByTime(1000));
  r.update({ rects: { ...r.props().rects, c: box(200, 200) } });
  act(() => vi.advanceTimersByTime(1000));
  expect(r.setViewport).not.toHaveBeenCalled();
});

test("camera fits at most every 600ms during streaming, never zooms in, final fit at done", () => {
  const r = rig({ rects: { a: box(0, 0) } });
  // Start the turn zoomed out so a fresh fit would want to zoom in.
  r.setVp({ x: 0, y: 0, zoom: 0.5 });
  r.setViewport.mockClear();
  r.update({ streaming: true });
  act(() => vi.advanceTimersByTime(1000));

  r.update({ rects: { ...r.props().rects, b: box(2400, 0) } }); // off-screen → fit now
  expect(r.setViewport).toHaveBeenCalledTimes(1);
  expect(r.durations()).toEqual([450]);
  expect(r.vp().zoom).toBeLessThanOrEqual(0.5);

  act(() => vi.advanceTimersByTime(100));
  r.update({ rects: { ...r.props().rects, c: box(4000, 0) } });
  act(() => vi.advanceTimersByTime(100));
  r.update({ rects: { ...r.props().rects, d: box(4000, 1500) } });
  expect(r.setViewport).toHaveBeenCalledTimes(1); // throttled
  act(() => vi.advanceTimersByTime(399));
  expect(r.setViewport).toHaveBeenCalledTimes(1);
  act(() => vi.advanceTimersByTime(1)); // 600ms after the last fit: the batched changes fit once
  expect(r.setViewport).toHaveBeenCalledTimes(2);
  act(() => vi.advanceTimersByTime(2000));
  expect(r.setViewport).toHaveBeenCalledTimes(2);

  // Later fits never zoom in past the zoom in effect.
  const before = r.vp().zoom;
  r.update({ rects: { ...r.props().rects, e: box(-3000, 0) } });
  expect(r.setViewport).toHaveBeenCalledTimes(3);
  expect(r.vp().zoom).toBeLessThanOrEqual(before);

  // Turn ends: one smooth full fit, zoom-in allowed up to 1.
  r.update({ streaming: false, rects: { a: box(0, 0) } });
  expect(r.setViewport).toHaveBeenCalledTimes(4);
  expect(r.durations()[3]).toBe(600);
  expect(r.vp().zoom).toBe(1);
});

test("user pan stops auto fit for the turn", () => {
  const r = rig();
  r.setViewport.mockClear();
  r.update({ streaming: true });
  act(() => vi.advanceTimersByTime(1000));
  act(() => r.hook.result.current.onMoveStart(null)); // programmatic move: ignored
  r.update({ rects: { ...r.props().rects, b: box(5000, 0) } });
  expect(r.setViewport).toHaveBeenCalledTimes(1);
  r.setViewport.mockClear();

  act(() => r.hook.result.current.onMoveStart(new MouseEvent("mousedown")));
  act(() => vi.advanceTimersByTime(1000));
  r.update({ rects: { ...r.props().rects, c: box(9000, 0) } });
  act(() => vi.advanceTimersByTime(1000));
  r.update({ streaming: false });
  act(() => vi.advanceTimersByTime(1000));
  expect(r.setViewport).not.toHaveBeenCalled();

  // The next turn auto-fits again.
  r.update({ streaming: true });
  act(() => vi.advanceTimersByTime(1000));
  r.update({ rects: { ...r.props().rects, d: box(-9000, 0) } });
  expect(r.setViewport).toHaveBeenCalledTimes(1);
});

test("reduced motion uses duration 0", () => {
  const r = rig({ reducedMotion: true });
  r.setViewport.mockClear();
  r.update({ streaming: true });
  act(() => vi.advanceTimersByTime(1000));
  r.update({ rects: { ...r.props().rects, b: box(5000, 0) } });
  r.update({ streaming: false });
  expect(r.durations()).toEqual([0, 0]);
});

test("fits into the area left between the insets", () => {
  const r = rig({ insets: { left: 300, right: 100 }, rects: { a: box(0, 0) } });
  // centre of the box (50, 25) lands at the centre of the visible strip (300 + 600/2, 300).
  const v = r.vp();
  expect(50 * v.zoom + v.x).toBeCloseTo(600);
  expect(25 * v.zoom + v.y).toBeCloseTo(300);
});

test("does nothing until the canvas has a size", () => {
  const r = rig({ size: { width: 0, height: 0 } });
  expect(r.setViewport).not.toHaveBeenCalled();
  r.update({ size: SIZE });
  expect(r.setViewport).toHaveBeenCalledTimes(1);
});
