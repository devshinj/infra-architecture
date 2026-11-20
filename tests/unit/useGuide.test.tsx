import "@testing-library/jest-dom/vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

const nav = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => nav }));
vi.mock("@/app/(app)/actions", () => ({ startGuideAction: vi.fn(), quitGuideAction: vi.fn() }));

import { quitGuideAction, startGuideAction } from "@/app/(app)/actions";
import type { GuideView } from "@/domain/guides/view";
import type { ChatLine } from "@/ui/chat/useChatTurn";
import { useGuide, type UseGuideArgs } from "@/ui/guide/useGuide";

afterEach(cleanup);
beforeEach(() => {
  nav.push.mockReset();
  vi.mocked(startGuideAction).mockReset();
  vi.mocked(quitGuideAction).mockReset();
});

const VIEW: GuideView = { guideId: "shop", title: "대형 쇼핑몰", env: "onprem", envChoices: ["onprem", "cloud"], step: 0, total: 12, status: "active", current: { goal: "입구", example: "방화벽 넣어 줘" } };
const L0: ChatLine[] = [{ id: "u0", kind: "user", text: "시작" }];
const L1: ChatLine[] = [...L0, { id: "a1-guide", kind: "guide", text: "", guide: { kind: "step", step: 1 }, turn: "a1" }];
const L2: ChatLine[] = [...L1, { id: "u2", kind: "user", text: "다음" }];

function setup(initial: Partial<UseGuideArgs> = {}) {
  const replaceLines = vi.fn();
  const props: UseGuideArgs = { diagramId: "d", initial: VIEW, serverLines: L0, busy: false, replaceLines, ...initial };
  const hook = renderHook((p: UseGuideArgs) => useGuide(p), { initialProps: props });
  return { ...hook, replaceLines, props };
}

test("a guide event takes the view and reloads the chat from the next server render", () => {
  // 가이드 이벤트는 그 차례가 도는 동안(busy) 온다.
  const { result, rerender, replaceLines, props } = setup({ busy: true });
  expect(result.current.learning).toBe(true);
  const next = { ...VIEW, step: 1, current: { goal: "L4", example: "L4 두 대" } };
  act(() => result.current.onEvent(next));
  expect(result.current.view).toEqual(next);
  // 차례가 끝나도 아직 같은 서버 줄이면(새로 그리기 전) 바꾸지 않는다.
  rerender({ ...props, busy: false });
  expect(replaceLines).not.toHaveBeenCalled();
  rerender({ ...props, serverLines: L1, busy: false });
  expect(replaceLines).toHaveBeenCalledTimes(1);
  expect(replaceLines).toHaveBeenCalledWith(L1);
  // 한 번만: 다음 서버 그리기는 대화를 바꾸지 않는다.
  rerender({ ...props, serverLines: L2, busy: false });
  expect(replaceLines).toHaveBeenCalledTimes(1);
});

test("a refresh that lands during the next turn does not wipe that turn; the reload waits for the array after it", () => {
  const { result, rerender, replaceLines, props } = setup({ busy: true });
  act(() => result.current.onEvent({ ...VIEW, step: 1 }));
  // 가이드 차례 끝. 그 차례의 새로 그리기가 오기 전에 다음 차례(질문 등)를 보낸다.
  rerender({ ...props, busy: false });
  rerender({ ...props, busy: true });
  // 가이드 차례의 새로 그리기(L1)가 다음 차례 도중에 온다: 기다린다.
  rerender({ ...props, serverLines: L1, busy: true });
  expect(replaceLines).not.toHaveBeenCalled();
  // 다음 차례가 끝났다: L1 에는 그 차례의 답이 없으니 바꾸지 않는다(살아 있는 답을 지우지 않는다).
  rerender({ ...props, serverLines: L1, busy: false });
  expect(replaceLines).not.toHaveBeenCalled();
  // 그 차례 끝의 새로 그리기(L2)가 오면 그것으로 바꾼다.
  rerender({ ...props, serverLines: L2, busy: false });
  expect(replaceLines).toHaveBeenCalledTimes(1);
  expect(replaceLines).toHaveBeenCalledWith(L2);
});

test("a new server view replaces the local one; done and quit are not learning", () => {
  const { result, rerender, props } = setup();
  rerender({ ...props, initial: { ...VIEW, status: "done", current: null, step: 12 } });
  expect(result.current.view?.status).toBe("done");
  expect(result.current.learning).toBe(false);
  rerender({ ...props, initial: null });
  expect(result.current.view).toBeNull();
  expect(result.current.learning).toBe(false);
});

test("restore result moves the card to that version's step", () => {
  const { result } = setup({ initial: { ...VIEW, step: 4 } });
  act(() => result.current.onRestored({ ...VIEW, step: 1 }));
  expect(result.current.view?.step).toBe(1);
  act(() => result.current.onRestored(undefined));
  expect(result.current.view?.step).toBe(1);
});

test("quit stops learning and reloads the chat to show the server notice", async () => {
  vi.mocked(quitGuideAction).mockResolvedValue({ ok: true });
  const { result, rerender, replaceLines, props } = setup();
  let err: string | void = "x";
  await act(async () => {
    err = await result.current.quit();
  });
  expect(err).toBeUndefined();
  expect(quitGuideAction).toHaveBeenCalledWith("d");
  expect(result.current.learning).toBe(false);
  rerender({ ...props, serverLines: L1 });
  expect(replaceLines).toHaveBeenCalledWith(L1);
});

test("a failed quit returns the error and keeps learning", async () => {
  vi.mocked(quitGuideAction).mockResolvedValue({ ok: false, error: "다른 작업이 진행 중이에요." });
  const { result, rerender, replaceLines, props } = setup();
  let err: string | void;
  await act(async () => {
    err = await result.current.quit();
  });
  expect(err!).toBe("다른 작업이 진행 중이에요.");
  expect(result.current.learning).toBe(true);
  rerender({ ...props, serverLines: L1 });
  expect(replaceLines).not.toHaveBeenCalled();
});

test("rebuild starts the same guide with the other env and opens it", async () => {
  vi.mocked(startGuideAction).mockResolvedValue({ ok: true, projectId: "p", diagramId: "d2" });
  const { result } = setup({ initial: { ...VIEW, status: "done", current: null, step: 12 } });
  await act(async () => {
    await result.current.rebuild("cloud");
  });
  expect(startGuideAction).toHaveBeenCalledWith("shop", "cloud");
  expect(nav.push).toHaveBeenCalledWith("/p/p/d/d2");
  vi.mocked(startGuideAction).mockResolvedValue({ ok: false, error: "이 주제에는 그 환경이 없어요." });
  let err: string | void;
  await act(async () => {
    err = await result.current.rebuild("cloud");
  });
  expect(err!).toBe("이 주제에는 그 환경이 없어요.");
});
