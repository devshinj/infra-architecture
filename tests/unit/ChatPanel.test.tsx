import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";

import { ChatPanel, type ChatPanelProps } from "@/ui/chat/ChatPanel";

afterEach(cleanup);

const base = (o: Partial<ChatPanelProps> = {}): ChatPanelProps => ({
  lines: [],
  busy: false,
  phase: null,
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

test("progress label follows phase", () => {
  const { rerender } = render(<ChatPanel {...base({ busy: true, phase: "thinking" })} />);
  expect(screen.getByText("구성 검토 중…")).toBeInTheDocument();
  rerender(<ChatPanel {...base({ busy: true, phase: "drawing" })} />);
  expect(screen.getByText("그리는 중…")).toBeInTheDocument();
  rerender(<ChatPanel {...base({ busy: true, phase: "answering" })} />);
  expect(screen.getByText("답변 작성 중…")).toBeInTheDocument();
  rerender(<ChatPanel {...base({ busy: false, phase: null })} />);
  expect(screen.queryByText("답변 작성 중…")).not.toBeInTheDocument();
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

test("checking phase label", () => {
  render(<ChatPanel {...base({ busy: true, phase: "checking" })} />);
  expect(screen.getByText("위험 요소 점검 중…")).toBeInTheDocument();
});

test("warning line click selects node", async () => {
  const onSelectNode = vi.fn();
  render(
    <ChatPanel
      {...base({
        onSelectNode,
        lines: [
          { id: "w1", kind: "warning", text: "주의: 1대뿐이에요.", nodeId: "web-1", level: "warn" },
          { id: "w2", kind: "warning", text: "확인해 보세요: 보일 수 있어요.", nodeId: "db-1", level: "check" },
        ],
      })}
    />,
  );
  await userEvent.click(screen.getByRole("button", { name: "주의: 1대뿐이에요." }));
  expect(onSelectNode).toHaveBeenCalledWith("web-1");
  expect(screen.getByRole("button", { name: "확인해 보세요: 보일 수 있어요." }).closest("[data-kind]")).toHaveAttribute("data-level", "check");
});
