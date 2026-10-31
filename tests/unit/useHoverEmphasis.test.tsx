import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { useHoverEmphasis } from "@/canvas/useHoverEmphasis";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const tick = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

test("hover applies after 120ms", () => {
  const { result } = renderHook(() => useHoverEmphasis());
  act(() => result.current.enter("a"));
  tick(119);
  expect(result.current.hoverId).toBeNull();
  tick(1);
  expect(result.current.hoverId).toBe("a");
});

test("leave before delay cancels", () => {
  const { result } = renderHook(() => useHoverEmphasis());
  act(() => result.current.enter("a"));
  tick(60);
  act(() => result.current.leave("a"));
  tick(200);
  expect(result.current.hoverId).toBeNull();
});

test("entering another id restarts the delay for that id", () => {
  const { result } = renderHook(() => useHoverEmphasis());
  act(() => result.current.enter("a"));
  tick(100);
  act(() => result.current.enter("b"));
  tick(100);
  expect(result.current.hoverId).toBeNull();
  tick(20);
  expect(result.current.hoverId).toBe("b");
});

test("leave clears an applied hover and reset clears everything", () => {
  const { result } = renderHook(() => useHoverEmphasis());
  act(() => result.current.enter("a"));
  tick(120);
  act(() => result.current.leave("a"));
  tick(120);
  expect(result.current.hoverId).toBeNull();
  act(() => result.current.enter("b"));
  tick(120);
  expect(result.current.hoverId).toBe("b");
  act(() => result.current.reset());
  expect(result.current.hoverId).toBeNull();
});

test("leave clears only after the same delay", () => {
  const { result } = renderHook(() => useHoverEmphasis());
  act(() => result.current.enter("a"));
  tick(120);
  act(() => result.current.leave("a"));
  tick(119);
  expect(result.current.hoverId).toBe("a");
  tick(1);
  expect(result.current.hoverId).toBeNull();
});

test("moving to an adjacent node keeps the emphasis until the next one applies", () => {
  const { result } = renderHook(() => useHoverEmphasis());
  act(() => result.current.enter("a"));
  tick(120);
  // React Flow 는 leave(a) 를 enter(b) 보다 먼저 보낸다: 그 사이에 강조가 풀렸다 다시 걸리지 않는다.
  act(() => result.current.leave("a"));
  act(() => result.current.enter("b"));
  for (let i = 0; i < 119; i += 17) {
    tick(17);
    expect(result.current.hoverId).toBe("a");
  }
  tick(1);
  expect(result.current.hoverId).toBe("b");
});

test("unmount cancels a pending hover", () => {
  const { result, unmount } = renderHook(() => useHoverEmphasis());
  act(() => result.current.enter("a"));
  expect(vi.getTimerCount()).toBe(1);
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});
