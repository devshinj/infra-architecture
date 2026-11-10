import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { POLL_MS, useRemoteChanges, type UseRemoteChangesInput } from "@/ui/useRemoteChanges";

type Head = { version: number; mcpVersion: number; flows: { count: number; updatedAt: string | null } };

let head: Head;
let visibility: DocumentVisibilityState;
const fetchImpl = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(async () => Response.json(head));

beforeEach(() => {
  vi.useFakeTimers();
  head = { version: 1, mcpVersion: 0, flows: { count: 0, updatedAt: null } };
  visibility = "visible";
  fetchImpl.mockClear();
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => visibility });
});
afterEach(() => {
  vi.useRealTimers();
  delete (document as { visibilityState?: unknown }).visibilityState;
});

/** Claude Code 가 새 버전 n 을 만들었다. */
const claudeWrote = (n: number) => {
  head = { ...head, version: n, mcpVersion: n };
};

async function setup(over: Partial<UseRemoteChangesInput> = {}) {
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
  await act(async () => {}); // 붙자마자 묻는 첫 물음이 끝나게
  return { ...hook, props, onVersion, onFlows };
}

const tick = () => act(async () => { await vi.advanceTimersByTimeAsync(POLL_MS); });

test("asks the head route right away, then every 3 seconds", async () => {
  await setup();
  expect(POLL_MS).toBe(3000);
  expect(fetchImpl).toHaveBeenCalledTimes(1);
  expect(fetchImpl.mock.calls[0]![0]).toBe("/api/diagrams/d1/head");
  await act(async () => { await vi.advanceTimersByTimeAsync(POLL_MS - 1); });
  expect(fetchImpl).toHaveBeenCalledTimes(1);
  await act(async () => { await vi.advanceTimersByTimeAsync(1); });
  expect(fetchImpl).toHaveBeenCalledTimes(2);
  await tick();
  expect(fetchImpl).toHaveBeenCalledTimes(3);
});

test("does not ask while the tab is hidden", async () => {
  visibility = "hidden";
  await setup();
  await tick();
  await tick();
  expect(fetchImpl).not.toHaveBeenCalled();
  visibility = "visible";
  await tick();
  expect(fetchImpl).toHaveBeenCalledTimes(1);
});

test("does not ask while busy; a busy function is read at every poll and after the answer", async () => {
  await setup({ busy: true });
  await tick();
  expect(fetchImpl).not.toHaveBeenCalled();

  fetchImpl.mockClear();
  let busy = false;
  const { onVersion } = await setup({ busy: () => busy });
  expect(fetchImpl).toHaveBeenCalledTimes(1);
  busy = true;
  await tick();
  expect(fetchImpl).toHaveBeenCalledTimes(1);
  // 묻는 사이에 바빠졌으면(스스로 쓰기 시작) 답을 버린다.
  busy = false;
  claudeWrote(2);
  fetchImpl.mockImplementationOnce(async () => {
    busy = true;
    return Response.json(head);
  });
  await tick();
  expect(onVersion).not.toHaveBeenCalled();
});

test("a newer Claude Code version calls onVersion once", async () => {
  const { onVersion, result } = await setup();
  await tick();
  expect(onVersion).not.toHaveBeenCalled();
  claudeWrote(2);
  await tick();
  expect(onVersion).toHaveBeenCalledTimes(1);
  expect(result.current.pending).toBe(false);
  // 불러오는 동안(아직 version 이 1) 같은 버전으로 다시 부르지 않는다.
  await tick();
  expect(onVersion).toHaveBeenCalledTimes(1);
});

test("the browser's own newer version is not treated as a Claude Code change", async () => {
  const { onVersion, result } = await setup({ paused: true });
  head = { ...head, version: 5 }; // 대화·되돌리기·폼 저장: mcpVersion 은 그대로
  await tick();
  expect(onVersion).not.toHaveBeenCalled();
  expect(result.current.pending).toBe(false);
});

test("a version already being adopted is not asked for again", async () => {
  const { onVersion } = await setup({ version: 3 });
  claudeWrote(3);
  await tick();
  expect(onVersion).not.toHaveBeenCalled();
});

test("does not adopt while typing", async () => {
  const { onVersion, result, rerender, props } = await setup({ paused: true });
  claudeWrote(2);
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
  const { onVersion, result } = await setup({ paused: () => typing });
  claudeWrote(3);
  await tick();
  expect(result.current.pending).toBe(true);
  expect(onVersion).not.toHaveBeenCalled();
  typing = false;
  await tick();
  expect(onVersion).toHaveBeenCalledTimes(1);
  expect(result.current.pending).toBe(false);
});

test("a change of the flows key calls onFlows", async () => {
  head = { ...head, flows: { count: 2, updatedAt: "2026-11-10T00:00:00.000Z" } };
  const { onFlows, onVersion } = await setup(); // 처음 본 키는 기준으로만 삼는다
  expect(onFlows).not.toHaveBeenCalled();
  await tick();
  expect(onFlows).not.toHaveBeenCalled();
  // 지우기: 행이 사라져 count 만 줄어든다.
  head = { ...head, flows: { count: 1, updatedAt: "2026-11-10T00:00:00.000Z" } };
  await tick();
  expect(onFlows).toHaveBeenCalledTimes(1);
  head = { ...head, flows: { count: 1, updatedAt: "2026-11-10T00:00:05.000Z" } };
  await tick();
  expect(onFlows).toHaveBeenCalledTimes(2);
  expect(onVersion).not.toHaveBeenCalled();
});

test("a failed head request is ignored", async () => {
  fetchImpl.mockImplementationOnce(async () => new Response("{}", { status: 500 }));
  claudeWrote(2);
  const { onVersion, onFlows, result } = await setup();
  expect(fetchImpl).toHaveBeenCalledTimes(1);
  expect(onVersion).not.toHaveBeenCalled();
  expect(onFlows).not.toHaveBeenCalled();
  expect(result.current.pending).toBe(false);
});
