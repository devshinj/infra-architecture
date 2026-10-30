import "@testing-library/jest-dom/vitest";
import { act, cleanup, render, screen, within } from "@testing-library/react";
import { createRef } from "react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";

import { ChatPanel, type ChatPanelProps } from "@/ui/chat/ChatPanel";
import type { MentionInputHandle } from "@/ui/chat/MentionInput";
import type { ChatLine } from "@/ui/chat/useChatTurn";

afterEach(cleanup);

const base = (o: Partial<ChatPanelProps> = {}): ChatPanelProps => ({
  lines: [],
  busy: false,
  onSend: vi.fn(),
  onStop: vi.fn(),
  health: { qwen: "ok", clef: "ok" },
  mentionRef: { current: null },
  ...o,
});

test("health banner shows when AI is down", () => {
  const { rerender } = render(<ChatPanel {...base()} />);
  expect(screen.queryByText(/AI 서버에 연결할 수 없어요/)).not.toBeInTheDocument();
  rerender(<ChatPanel {...base({ health: { qwen: "down", clef: "ok" } })} />);
  expect(screen.getByText("AI 서버에 연결할 수 없어요. 잠시 뒤 다시 시도하거나 관리자에게 문의해 주세요.")).toBeInTheDocument();
  rerender(<ChatPanel {...base({ health: null })} />);
  expect(screen.queryByText(/AI 서버에 연결할 수 없어요/)).not.toBeInTheDocument();
});

test("send is disabled while busy and stop is shown", async () => {
  const p = base({ busy: true });
  render(<ChatPanel {...p} />);
  expect(screen.getByRole("button", { name: "보내기" })).toBeDisabled();
  expect(screen.getByRole("textbox")).toBeDisabled();
  await userEvent.click(screen.getByRole("button", { name: "중단" }));
  expect(p.onStop).toHaveBeenCalled();
});

test("stop is hidden when idle, send enables once there is text", async () => {
  const p = base();
  render(<ChatPanel {...p} />);
  expect(screen.queryByRole("button", { name: "중단" })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "보내기" })).toBeDisabled();
  await userEvent.type(screen.getByRole("textbox"), "안녕");
  await userEvent.click(screen.getByRole("button", { name: "보내기" }));
  expect(p.onSend).toHaveBeenCalledWith("안녕");
});

test("disabledReason blocks typing and sending and is shown", () => {
  render(<ChatPanel {...base({ disabledReason: "이전 버전을 보는 중에는 대화할 수 없어요." })} />);
  expect(screen.getByText("이전 버전을 보는 중에는 대화할 수 없어요.")).toBeInTheDocument();
  expect(screen.getByRole("textbox")).toBeDisabled();
  expect(screen.getByRole("button", { name: "보내기" })).toBeDisabled();
});

test("log is a live region; mention tokens render as labels", () => {
  render(<ChatPanel {...base({ lines: [{ id: "1", kind: "user", text: "@[API 서버](node:n1) 늘려줘" }] })} />);
  const log = screen.getByRole("log");
  expect(log).toHaveAttribute("aria-live", "polite");
  expect(log).toHaveTextContent("API 서버 늘려줘");
  expect(log).not.toHaveTextContent("node:n1");
});

test("warning chip selects node", async () => {
  const onSelectNode = vi.fn();
  render(
    <ChatPanel
      {...base({
        onSelectNode,
        lines: [
          { id: "w1", kind: "warning", text: "주의: 1대뿐이에요.", nodeId: "web-1", level: "warn", turn: "t" },
          { id: "w2", kind: "warning", text: "확인해 보세요: 보일 수 있어요.", nodeId: "db-1", level: "check", turn: "t" },
        ],
      })}
    />,
  );
  await userEvent.click(screen.getByRole("button", { name: "주의: 1대뿐이에요." }));
  expect(onSelectNode).toHaveBeenCalledWith("web-1");
  expect(screen.getByRole("button", { name: "확인해 보세요: 보일 수 있어요." }).closest("[data-kind]")).toHaveAttribute("data-level", "check");
});

const T = { turn: "t1", at: new Date("2026-10-30T14:07:00").getTime() };
const card = (c: NonNullable<ChatLine["card"]>): ChatLine => ({ id: "c", kind: "card", text: "", card: c, ...T });
const steps = () => within(screen.getByRole("list", { name: "진행 단계" })).getAllByRole("listitem");

test("own bubble sits apart from the AI message with its header", () => {
  render(<ChatPanel {...base({ lines: [{ id: "u", kind: "user", text: "쇼핑몰 그려줘" }, card({ mode: "build", step: "review", changes: 0 })], busy: true })} />);
  const own = screen.getByText("쇼핑몰 그려줘");
  expect(own).toHaveAttribute("data-kind", "user");
  const ai = screen.getByRole("group", { name: "InfraSketch 메시지" });
  expect(ai).not.toContainElement(own);
  expect(within(ai).getByText("InfraSketch")).toBeInTheDocument();
  expect(within(ai).getByText("IS")).toBeInTheDocument();
  expect(within(ai).getByText("14:07")).toBeInTheDocument();
});

test("progress card steps and node count update", () => {
  const { rerender } = render(<ChatPanel {...base({ busy: true, lines: [card({ mode: "build", step: "review", changes: 0 })] })} />);
  expect(steps().map((li) => li.textContent)).toEqual(["구성 검토", "그리는 중 (변경 0개)", "위험 요소 점검", "완료"]);
  expect(steps()[0]).toHaveAttribute("aria-current", "step");
  rerender(<ChatPanel {...base({ busy: true, lines: [card({ mode: "build", step: "drawing", changes: 4 })] })} />);
  expect(steps()[1]).toHaveTextContent("그리는 중 (변경 4개)");
  expect(steps()[1]).toHaveAttribute("aria-current", "step");
  expect(steps()[0]).toHaveAttribute("data-state", "done");
  rerender(<ChatPanel {...base({ busy: true, lines: [card({ mode: "build", step: "checking", changes: 6 })] })} />);
  expect(steps().map((li) => li.getAttribute("data-state"))).toEqual(["done", "done", "current", "todo"]);
  rerender(<ChatPanel {...base({ lines: [card({ mode: "build", step: "checking", changes: 6, end: "done", nodes: 6, edges: 5 })] })} />);
  expect(screen.queryByRole("list", { name: "진행 단계" })).not.toBeInTheDocument();
  expect(screen.getByText("완료 · 노드 6 · 연결 5")).toBeInTheDocument();
});

test("answer mode shows single step", () => {
  render(<ChatPanel {...base({ busy: true, lines: [card({ mode: "answer", step: "review", changes: 0 })] })} />);
  expect(steps().map((li) => li.textContent)).toEqual(["답변 작성 중"]);
  expect(steps()[0]).toHaveAttribute("aria-current", "step");
});

test("aborted shows 중단됨", () => {
  render(<ChatPanel {...base({ lines: [card({ mode: "build", step: "drawing", changes: 2, end: "aborted" })] })} />);
  expect(within(screen.getByRole("log")).getByText("중단됨")).toBeInTheDocument();
  expect(screen.queryByRole("list", { name: "진행 단계" })).not.toBeInTheDocument();
});

test("summary, missing and warning chips under the message", () => {
  render(
    <ChatPanel
      {...base({
        onSelectNode: vi.fn(),
        onOpenChecklist: vi.fn(),
        lines: [
          card({ mode: "build", step: "checking", changes: 3, end: "done", nodes: 3, edges: 1 }),
          { id: "p", kind: "progress", text: "웹 서버를 놓을게요", ...T },
          { id: "s", kind: "summary", text: "노드 3 · 연결 1 · 적용 2 · 건너뜀 1", ...T },
          { id: "m", kind: "missing", text: "빠진 정보 6개가 있어요", ...T },
          { id: "w", kind: "warning", text: "주의: 1대뿐이에요.", nodeId: "web-1", level: "warn", ...T },
        ],
      })}
    />,
  );
  const ai = screen.getByRole("group", { name: "InfraSketch 메시지" });
  const chips = within(ai).getByRole("list", { name: "이번 차례 결과" });
  expect(within(chips).getAllByRole("listitem").map((li) => li.textContent)).toEqual([
    "노드 3 · 연결 1 · 적용 2 · 건너뜀 1",
    "빠진 정보 6개가 있어요",
    "주의: 1대뿐이에요.",
  ]);
  // 본문(say)은 칩 위에 있다.
  const body = within(ai).getByText("웹 서버를 놓을게요");
  expect(body.compareDocumentPosition(chips) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(screen.getAllByRole("group", { name: "InfraSketch 메시지" })).toHaveLength(1);
});

test("missing chip opens checklist", async () => {
  const onOpenChecklist = vi.fn();
  render(<ChatPanel {...base({ onOpenChecklist, lines: [{ id: "m", kind: "missing", text: "빠진 정보 6개가 있어요", ...T }] })} />);
  await userEvent.click(screen.getByRole("button", { name: "빠진 정보 6개가 있어요" }));
  expect(onOpenChecklist).toHaveBeenCalledTimes(1);
});

test("system lines outside a turn stay a small centered note", () => {
  render(<ChatPanel {...base({ lines: [{ id: "s", kind: "system", text: "v2 로 되돌렸어요." }] })} />);
  expect(screen.getByText("v2 로 되돌렸어요.")).toHaveAttribute("data-kind", "system");
  expect(screen.queryByRole("group", { name: "InfraSketch 메시지" })).not.toBeInTheDocument();
});

test("focus moves to 중단 when a turn starts and back to the input when it ends", async () => {
  const mentionRef = createRef<MentionInputHandle>();
  const p = base({ mentionRef });
  const { rerender } = render(<ChatPanel {...p} />);
  await userEvent.type(screen.getByRole("textbox"), "안녕{Enter}");
  expect(p.onSend).toHaveBeenCalledWith("안녕");
  rerender(<ChatPanel {...p} busy />);
  expect(screen.getByRole("button", { name: "중단" })).toHaveFocus();
  rerender(<ChatPanel {...p} busy={false} />);
  expect(screen.getByRole("textbox")).toHaveFocus();
});

test("focus is not stolen back when the user moved elsewhere during the turn", async () => {
  const mentionRef = createRef<MentionInputHandle>();
  const p = base({ mentionRef });
  const { rerender } = render(
    <>
      <button type="button">바깥</button>
      <ChatPanel {...p} />
    </>,
  );
  await userEvent.type(screen.getByRole("textbox"), "안녕{Enter}");
  rerender(
    <>
      <button type="button">바깥</button>
      <ChatPanel {...p} busy />
    </>,
  );
  act(() => screen.getByRole("button", { name: "바깥" }).focus());
  rerender(
    <>
      <button type="button">바깥</button>
      <ChatPanel {...p} busy={false} />
    </>,
  );
  expect(screen.getByRole("button", { name: "바깥" })).toHaveFocus();
});

test("card is not live; only step changes are announced", () => {
  const { rerender } = render(<ChatPanel {...base({ busy: true, lines: [card({ mode: "build", step: "drawing", changes: 1 })] })} />);
  const list = screen.getByRole("list", { name: "진행 단계" });
  expect(list.closest("[aria-live]")).toHaveAttribute("aria-live", "off");
  const status = screen.getByRole("status");
  expect(status).toHaveTextContent(/^그리는 중$/);
  rerender(<ChatPanel {...base({ busy: true, lines: [card({ mode: "build", step: "drawing", changes: 7 })] })} />);
  expect(status).toHaveTextContent(/^그리는 중$/);
  rerender(<ChatPanel {...base({ busy: true, lines: [card({ mode: "build", step: "checking", changes: 7 })] })} />);
  expect(status).toHaveTextContent(/^위험 요소 점검$/);
  rerender(<ChatPanel {...base({ lines: [card({ mode: "build", step: "checking", changes: 7, end: "done", nodes: 3, edges: 2 })] })} />);
  expect(status).toHaveTextContent(/^완료$/);
});
