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

test("chat has no assumption chips, checklist or missing chip; warnings collapse to one 주의 N chip that opens the card", async () => {
  const onOpenWarnings = vi.fn();
  render(
    <ChatPanel
      {...base({
        onOpenWarnings,
        lines: [
          card({ mode: "build", step: "checking", changes: 3, end: "done", nodes: 3, edges: 1 }),
          { id: "p", kind: "progress", text: "웹 서버를 놓을게요", ...T },
          { id: "s", kind: "summary", text: "노드 3 · 연결 1 · 적용 2 · 건너뜀 1", ...T },
          { id: "w", kind: "warning", text: "주의 2", ...T },
        ],
      })}
    />,
  );
  const ai = screen.getByRole("group", { name: "InfraSketch 메시지" });
  const chips = within(ai).getByRole("list", { name: "이번 차례 결과" });
  expect(within(chips).getAllByRole("listitem").map((li) => li.textContent)).toEqual(["노드 3 · 연결 1 · 적용 2 · 건너뜀 1", "주의 2"]);
  // 본문(say)은 칩 위에 있다.
  const body = within(ai).getByText("웹 서버를 놓을게요");
  expect(body.compareDocumentPosition(chips) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(screen.getAllByRole("group", { name: "InfraSketch 메시지" })).toHaveLength(1);
  // 가정 칩·체크리스트·빠진 정보 칩은 대화창에 없다.
  expect(screen.queryByRole("list", { name: "AI가 세운 가정" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /채워야 할 정보/ })).not.toBeInTheDocument();
  expect(screen.queryByText(/빠진 정보/)).not.toBeInTheDocument();
  await userEvent.click(within(chips).getByRole("button", { name: "주의 2" }));
  expect(onOpenWarnings).toHaveBeenCalledTimes(1);
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

const GREETING = "안녕하세요, InfraSketch예요. 만들고 싶은 서비스를 말씀해 주시면 인프라 구성도를 바로 그려 드릴게요.";
const EXAMPLES = ["결제와 카카오 로그인이 붙는 쇼핑몰", "사내 IDC에 WEB-WAS-DB 이중화", "AWS EKS 위 MSA와 Kafka", "하루 10만 명이 쓰는 예약 서비스"];

test("empty diagram shows greeting, guide and example chips", () => {
  render(<ChatPanel {...base({ emptyDiagram: true })} />);
  const g = screen.getByRole("group", { name: "InfraSketch 메시지" });
  expect(within(g).getByText("InfraSketch")).toBeInTheDocument();
  expect(within(g).getByText("IS")).toBeInTheDocument();
  expect(within(g).getByText(GREETING)).toBeInTheDocument();
  expect(within(g).getByText("이렇게 말하면 더 정확해요")).toBeInTheDocument();
  for (const t of ["무엇을 만드는지 (예: 쇼핑몰, 예약 서비스)", "어디에 올리는지 (클라우드, 사내 IDC)", "대략 사용자 수 (예: 하루 1만 명)", "붙일 외부 서비스 (결제, 소셜 로그인, 문자)"]) {
    expect(within(g).getByText(t)).toBeInTheDocument();
  }
  for (const e of EXAMPLES) expect(within(g).getByRole("button", { name: e })).toBeInTheDocument();
});

test("chip fills the input without sending", async () => {
  const p = base({ emptyDiagram: true, mentionRef: createRef<MentionInputHandle>() });
  render(<ChatPanel {...p} />);
  await userEvent.click(screen.getByRole("button", { name: EXAMPLES[2]! }));
  const box = screen.getByRole("textbox");
  expect(box).toHaveValue(EXAMPLES[2]);
  expect(box).toHaveFocus();
  expect(p.onSend).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "보내기" })).toBeEnabled();
});

test("greeting disappears after the first message and when the diagram has nodes", () => {
  const line: ChatLine = { id: "1", kind: "user", text: "쇼핑몰" };
  const { rerender } = render(<ChatPanel {...base({ emptyDiagram: true })} />);
  expect(screen.getByText(GREETING)).toBeInTheDocument();
  rerender(<ChatPanel {...base({ emptyDiagram: true, lines: [line] })} />);
  expect(screen.queryByText(GREETING)).not.toBeInTheDocument();
  rerender(<ChatPanel {...base({ emptyDiagram: false })} />);
  expect(screen.queryByText(GREETING)).not.toBeInTheDocument();
  rerender(<ChatPanel {...base()} />);
  expect(screen.queryByText(GREETING)).not.toBeInTheDocument();
});
