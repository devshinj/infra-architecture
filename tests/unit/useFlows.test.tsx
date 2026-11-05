import { act, renderHook, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";

vi.mock("@/app/(app)/actions", () => ({
  renameFlowAction: vi.fn(async () => ({ ok: true })),
  deleteFlowAction: vi.fn(async () => ({ ok: true })),
  confirmFlowAction: vi.fn(async () => ({ ok: true })),
  removeFlowStepAction: vi.fn(async () => ({ ok: true })),
}));

import { confirmFlowAction, deleteFlowAction, removeFlowStepAction } from "@/app/(app)/actions";
import type { StoredFlow } from "@/server/flows";
import { useFlows } from "@/ui/flows/useFlows";

const stored = (id: string): StoredFlow => ({
  id,
  name: id,
  origin: "user",
  steps: [{ edge: "e1", from: "a", short: "s", text: "t" }],
  source: "ai",
  reviewed: false,
  problems: [],
});

/** GET 은 list() 를, POST suggest 는 saved 를 돌려준다. 부른 것을 모두 남긴다. */
function fake(list: () => StoredFlow[], post: () => Response = () => Response.json({ saved: 3 })) {
  const calls: { url: string; method: string; body?: unknown }[] = [];
  const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    calls.push({ url, method, ...(init?.body ? { body: JSON.parse(String(init.body)) } : {}) });
    if (method === "GET") return Response.json({ flows: list() });
    return post();
  });
  return { fetchImpl: fetchImpl as unknown as typeof fetch, calls };
}

const gets = (calls: { method: string }[]) => calls.filter((c) => c.method === "GET").length;
const posts = <T extends { method: string }>(calls: T[]) => calls.filter((c) => c.method === "POST");

test("auto-suggest once after done with changed>0 and no flows", async () => {
  let list: StoredFlow[] = [];
  const { fetchImpl, calls } = fake(() => list, () => {
    list = [stored("login")];
    return Response.json({ saved: 1 });
  });
  const { result } = renderHook(() => useFlows({ diagramId: "d1", live: true, busy: false, versionKey: 1, fetchImpl }));
  await waitFor(() => expect(gets(calls)).toBe(1));
  // 구성을 안 바꾼 차례는 제안하지 않는다.
  await act(async () => {
    await result.current.afterTurn({ changed: 0 });
  });
  expect(posts(calls)).toHaveLength(0);
  await act(async () => {
    await result.current.afterTurn({ changed: 3 });
  });
  expect(posts(calls)).toEqual([{ url: "/api/diagrams/d1/flows/suggest", method: "POST", body: { auto: true } }]);
  // 제안 뒤 다시 불러온다.
  await waitFor(() => expect(result.current.flows.map((f) => f.id)).toEqual(["login"]));
  expect(result.current.suggesting).toBe(false);
});

test("not when flows exist", async () => {
  const { fetchImpl, calls } = fake(() => [stored("login")]);
  const { result } = renderHook(() => useFlows({ diagramId: "d1", live: true, busy: false, versionKey: 1, fetchImpl }));
  await waitFor(() => expect(result.current.flows).toHaveLength(1));
  await act(async () => {
    await result.current.afterTurn({ changed: 5 });
  });
  expect(posts(calls)).toHaveLength(0);
  // 차례가 끝나면 다시 불러온다.
  expect(gets(calls)).toBe(2);
});

test("refetch on versionKey change", async () => {
  const { fetchImpl, calls } = fake(() => []);
  const { rerender } = renderHook((p: { v: number }) => useFlows({ diagramId: "d1", live: true, busy: false, versionKey: p.v, fetchImpl }), { initialProps: { v: 1 } });
  await waitFor(() => expect(gets(calls)).toBe(1));
  expect(calls[0]!.url).toBe("/api/diagrams/d1/flows");
  rerender({ v: 1 });
  rerender({ v: 2 });
  await waitFor(() => expect(gets(calls)).toBe(2));
});

test("manual suggest shows the server message on failure", async () => {
  const { fetchImpl, calls } = fake(() => [], () => Response.json({ error: "지금은 구성도를 그리는 중이에요." }, { status: 409 }));
  const { result } = renderHook(() => useFlows({ diagramId: "d1", live: true, busy: false, versionKey: 1, fetchImpl }));
  await waitFor(() => expect(gets(calls)).toBe(1));
  await act(async () => {
    await result.current.suggest();
  });
  expect(posts(calls)[0]!.body).toEqual({});
  expect(result.current.error).toBe("지금은 구성도를 그리는 중이에요.");
});

test("mutations are blocked while busy or not live; delete drops the active flow", async () => {
  const { fetchImpl } = fake(() => [stored("login")]);
  const { result, rerender } = renderHook((p: { busy: boolean }) => useFlows({ diagramId: "d1", live: true, busy: p.busy, versionKey: 1, fetchImpl }), { initialProps: { busy: true } });
  await waitFor(() => expect(result.current.flows).toHaveLength(1));
  await act(async () => {
    await result.current.confirm("login");
  });
  expect(confirmFlowAction).not.toHaveBeenCalled();
  rerender({ busy: false });
  act(() => result.current.setActive("login"));
  expect(result.current.activeKey).toBe("login");
  await act(async () => {
    expect(await result.current.remove("login")).toBeUndefined();
  });
  expect(deleteFlowAction).toHaveBeenCalledWith("d1", "login");
  expect(result.current.activeKey).toBeNull();
});

test("removeStep calls the action and refreshes; blocked while busy or not live; returns the server message", async () => {
  const { fetchImpl, calls } = fake(() => [stored("login")]);
  const action = vi.mocked(removeFlowStepAction);
  action.mockClear();
  const { result, rerender } = renderHook((p: { busy: boolean; live: boolean }) => useFlows({ diagramId: "d1", live: p.live, busy: p.busy, versionKey: 1, fetchImpl }), {
    initialProps: { busy: true, live: true },
  });
  await waitFor(() => expect(gets(calls)).toBe(1));
  let err: string | void = undefined;
  await act(async () => {
    err = await result.current.removeStep("login", 1);
  });
  expect(err).toBeTruthy();
  rerender({ busy: false, live: false });
  await act(async () => {
    err = await result.current.removeStep("login", 1);
  });
  expect(err).toBeTruthy();
  expect(action).not.toHaveBeenCalled();
  rerender({ busy: false, live: true });
  await act(async () => {
    err = await result.current.removeStep("login", 1);
  });
  expect(err).toBeUndefined();
  expect(action).toHaveBeenCalledWith("d1", "login", 1);
  expect(gets(calls)).toBe(2);
  action.mockResolvedValueOnce({ ok: false, error: "마지막 단계는 지울 수 없어요. 흐름을 통째로 지워 주세요." });
  await act(async () => {
    err = await result.current.removeStep("login", 0);
  });
  expect(err).toBe("마지막 단계는 지울 수 없어요. 흐름을 통째로 지워 주세요.");
});
