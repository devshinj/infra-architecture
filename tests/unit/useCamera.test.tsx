import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { fitViewport, focusViewport, useCamera, type CameraInput, type Viewport } from "@/canvas/useCamera";
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

test("a fit request fits at once, waiting until the new layout is settled", () => {
  const r = rig({ fitRequest: 0, settled: true });
  r.setViewport.mockClear();
  // 고정 위치를 풀어 배치가 다시 도는 동안(settled false)은 옛 배치에 맞추지 않는다.
  r.update({ fitRequest: 1, settled: false });
  expect(r.setViewport).not.toHaveBeenCalled();
  r.update({ settled: true, rects: { a: box(3000, 900) } });
  expect(r.setViewport).toHaveBeenCalledTimes(1);
  expect(r.durations()).toEqual([0]);
  expect(r.vp()).toEqual(fitViewport(box(3000, 900), SIZE, { left: 0, right: 0 }, 2));
  // 이미 배치가 같으면(고정 위치가 없던 경우) 바로 맞춘다.
  r.setViewport.mockClear();
  r.update({ fitRequest: 2 });
  expect(r.setViewport).toHaveBeenCalledTimes(1);
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

test("first board while streaming never zooms past 1", () => {
  const r = rig({ streaming: true, rects: { a: box(0, 0) } });
  expect(r.setViewport).toHaveBeenCalledTimes(1);
  expect(r.vp().zoom).toBeLessThanOrEqual(1);
});

test("unmount with a pending fit cancels it", () => {
  const r = rig();
  r.update({ streaming: true });
  r.update({ rects: { ...r.props().rects, b: box(5000, 0) } }); // throttled → timer
  r.setViewport.mockClear();
  r.hook.unmount();
  act(() => vi.advanceTimersByTime(2000));
  expect(r.setViewport).not.toHaveBeenCalled();
});

test("a quick streaming true→false→true flip fits once at the end and drops the pending fit", () => {
  const r = rig();
  r.update({ streaming: true });
  r.update({ rects: { ...r.props().rects, b: box(5000, 0) } }); // throttled → timer
  r.setViewport.mockClear();
  r.update({ streaming: false });
  r.update({ streaming: true });
  act(() => vi.advanceTimersByTime(2000));
  expect(r.durations()).toEqual([600]);
});

test("focus centres the rect in the strip, keeps zoom but at least 0.8, 500ms (0 when reduced)", () => {
  const r = rig({ insets: { left: 200, right: 300 } });
  r.setViewport.mockClear();
  r.setVp({ x: 0, y: 0, zoom: 1.2 });
  act(() => r.hook.result.current.focus(box(1000, 400)));
  // 띠 너비 500, 가운데 x = 200 + 250. 노드 가운데 (1050, 425).
  expect(r.setViewport).toHaveBeenLastCalledWith({ x: 450 - 1050 * 1.2, y: 300 - 425 * 1.2, zoom: 1.2 }, { duration: 500 });
  r.setVp({ x: 0, y: 0, zoom: 0.5 });
  r.update({ reducedMotion: true });
  act(() => r.hook.result.current.focus(box(1000, 400)));
  expect(r.setViewport).toHaveBeenLastCalledWith({ x: 450 - 1050 * 0.8, y: 300 - 425 * 0.8, zoom: 0.8 }, { duration: 0 });
});

test("focus during a turn is not a user move: the final fit still runs", () => {
  const r = rig();
  r.update({ streaming: true });
  act(() => r.hook.result.current.focus(box(500, 500)));
  r.hook.result.current.onMoveStart(null); // React Flow reports programmatic moves with a null event
  r.setViewport.mockClear();
  r.update({ streaming: false });
  expect(r.durations()).toEqual([600]);
});

test("board and final fits keep a bottom margin of at least the collapsed card footprint", () => {
  const tall: Rect = { x: 0, y: 0, width: 100, height: 2000 };
  const v = fitViewport(tall, SIZE, { left: 0, right: 0, bottom: 66 }, 2);
  expect((tall.y + tall.height) * v.zoom + v.y).toBeLessThanOrEqual(SIZE.height - 66 + 0.001);
  const r = rig({ rects: { a: tall }, insets: { left: 0, right: 0, bottom: 66 } });
  const first = r.vp();
  expect((tall.y + tall.height) * first.zoom + first.y).toBeLessThanOrEqual(SIZE.height - 66 + 0.001);
  r.update({ streaming: true });
  r.update({ streaming: false });
  const fin = r.vp();
  expect((tall.y + tall.height) * fin.zoom + fin.y).toBeLessThanOrEqual(SIZE.height - 66 + 0.001);
});

test("focus with the card open lands right of the card on a wide strip, above it on a narrow one", () => {
  const r = box(1000, 400); // centre (1050, 425)
  const card = { width: 312, height: 400 }; // 열린 카드가 차지하는 폭(사이 여백 포함)·높이(위아래 여백 포함)
  // 넓음: 카드 오른쪽 512..1100(588px)의 가운데 806, 세로는 0..734 의 가운데 367.
  const wide = focusViewport(r, { width: 1400, height: 800 }, { left: 200, right: 300, bottom: 66, card }, 1);
  expect(1050 + wide.x).toBeCloseTo(806);
  expect(425 + wide.y).toBeCloseTo(367);
  // 좁음: 카드 오른쪽이 188px 라 띠 200..700 의 가운데 450, 카드 위 0..400 의 가운데 200.
  const narrow = focusViewport(r, { width: 1000, height: 800 }, { left: 200, right: 300, bottom: 66, card }, 1);
  expect(1050 + narrow.x).toBeCloseTo(450);
  expect(425 + narrow.y).toBeCloseTo(200);
  // 카드가 닫혀 있으면 아래 여백만 뺀 띠의 가운데.
  const closed = focusViewport(r, { width: 1400, height: 800 }, { left: 200, right: 300, bottom: 66 }, 1);
  expect(1050 + closed.x).toBeCloseTo(650);
  expect(425 + closed.y).toBeCloseTo(367);
});
