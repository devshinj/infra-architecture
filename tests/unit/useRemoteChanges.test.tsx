import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { POLL_MS, useRemoteChanges, type UseRemoteChangesInput } from "@/ui/useRemoteChanges";

type Head = { version: number; flows: { count: number; updatedAt: string | null } };

let head: Head;
let visibility: DocumentVisibilityState;
const fetchImpl = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(async () => Response.json(head));

beforeEach(() => {
  vi.useFakeTimers();
  head = { version: 1, flows: { count: 0, updatedAt: null } };
  visibility = "visible";
  fetchImpl.mockClear();
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => visibility });
});
afterEach(() => {
  vi.useRealTimers();
  delete (document as { visibilityState?: unknown }).visibilityState;
});

function setup(over: Partial<UseRemoteChangesInput> = {}) {
  const onVersion = vi.fn();
  const onFlows = vi.fn();
  const props: UseRemoteChangesInput = {
    diagramId: "d1",
    version: 1,
    paused: false,
    busy: false,
    onVersion,
    onFlows,
    fetchImpl: fetchImpl as unknown as typeof fetch,
    ...over,
  };
  const hook = renderHook((p: UseRemoteChangesInput) => useRemoteChanges(p), { initialProps: props });
  return { ...hook, props, onVersion, onFlows };
}

const tick = () => act(async () => { await vi.advanceTimersByTimeAsync(POLL_MS); });

test("asks the head route every 3 seconds", async () => {
  setup();
  expect(POLL_MS).toBe(3000);
  await act(async () => { await vi.advanceTimersByTimeAsync(POLL_MS - 1); });
  expect(fetchImpl).not.toHaveBeenCalled();
  await act(async () => { await vi.advanceTimersByTimeAsync(1); });
  expect(fetchImpl).toHaveBeenCalledTimes(1);
  expect(fetchImpl.mock.calls[0]![0]).toBe("/api/diagrams/d1/head");
  await tick();
  expect(fetchImpl).toHaveBeenCalledTimes(2);
});

test("does not ask while the tab is hidden", async () => {
  visibility = "hidden";
  setup();
  await tick();
  await tick();
  expect(fetchImpl).not.toHaveBeenCalled();
  visibility = "visible";
  await tick();
  expect(fetchImpl).toHaveBeenCalledTimes(1);
});

test("does not ask during a chat turn", async () => {
  setup({ busy: true });
  await tick();
  expect(fetchImpl).not.toHaveBeenCalled();
});

test("a newer version calls onVersion once", async () => {
  const { onVersion, result } = setup();
  await tick();
  expect(onVersion).not.toHaveBeenCalled();
  head = { ...head, version: 2 };
  await tick();
  expect(onVersion).toHaveBeenCalledTimes(1);
  expect(result.current.pending).toBe(false);
  // 불러오는 동안(아직 version 이 1) 같은 버전으로 다시 부르지 않는다.
  await tick();
  expect(onVersion).toHaveBeenCalledTimes(1);
});

test("does not adopt while typing", async () => {
  const { onVersion, result, rerender, props } = setup({ paused: true });
  head = { ...head, version: 2 };
  await tick();
  expect(onVersion).not.toHaveBeenCalled();
  expect(result.current.pending).toBe(true);
  // [불러오기]
  act(() => result.current.load());
  expect(onVersion).toHaveBeenCalledTimes(1);
  // 버전을 따라잡으면 안내가 사라진다.
  rerender({ ...props, paused: true, version: 2 });
  expect(result.current.pending).toBe(false);
});

test("paused can be a function read at poll time; once unpaused the next poll adopts", async () => {
  let typing = true;
  const { onVersion, result } = setup({ paused: () => typing });
  head = { ...head, version: 3 };
  await tick();
  expect(result.current.pending).toBe(true);
  expect(onVersion).not.toHaveBeenCalled();
  typing = false;
  await tick();
  expect(onVersion).toHaveBeenCalledTimes(1);
  expect(result.current.pending).toBe(false);
});

test("a change of the flows key calls onFlows", async () => {
  const { onFlows, onVersion } = setup();
  head = { version: 1, flows: { count: 2, updatedAt: "2026-11-10T00:00:00.000Z" } };
  await tick(); // 처음 본 키는 기준으로만 삼는다
  expect(onFlows).not.toHaveBeenCalled();
  await tick();
  expect(onFlows).not.toHaveBeenCalled();
  // 지우기: 행이 사라져 count 만 줄어든다.
  head = { version: 1, flows: { count: 1, updatedAt: "2026-11-10T00:00:00.000Z" } };
  await tick();
  expect(onFlows).toHaveBeenCalledTimes(1);
  head = { version: 1, flows: { count: 1, updatedAt: "2026-11-10T00:00:05.000Z" } };
  await tick();
  expect(onFlows).toHaveBeenCalledTimes(2);
  expect(onVersion).not.toHaveBeenCalled();
});

test("a failed head request is ignored", async () => {
  fetchImpl.mockImplementationOnce(async () => new Response("{}", { status: 500 }));
  const { onVersion, onFlows, result } = setup();
  await tick();
  expect(onVersion).not.toHaveBeenCalled();
  expect(onFlows).not.toHaveBeenCalled();
  expect(result.current.pending).toBe(false);
});
