import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";

import { AskNode, type AskNodeProps } from "@/ui/explain/AskNode";

afterEach(cleanup);

const ui = (p: Partial<AskNodeProps> = {}) => <AskNode nodeId="a" nodeLabel="웹 서버" disabled={false} onAsk={vi.fn()} {...p} />;

test("Enter sends trimmed text and clears", async () => {
  const onAsk = vi.fn();
  render(ui({ onAsk }));
  const input = screen.getByLabelText("이 노드에 대해 물어보기");
  await userEvent.type(input, "  왜 두 대예요?  {Enter}");
  expect(onAsk).toHaveBeenCalledWith("왜 두 대예요?");
  expect(input).toHaveValue("");
});

test("send button sends, and empty text does not send", async () => {
  const onAsk = vi.fn();
  render(ui({ onAsk }));
  const send = screen.getByRole("button", { name: "질문 보내기" });
  expect(send).toBeDisabled();
  await userEvent.type(screen.getByRole("textbox"), "   {Enter}");
  expect(onAsk).not.toHaveBeenCalled();
  await userEvent.type(screen.getByRole("textbox"), "x");
  await userEvent.click(send);
  expect(onAsk).toHaveBeenCalledWith("x");
});

test("disabled shows reason", () => {
  render(ui({ disabled: true, disabledReason: "다른 대화가 답하는 중이에요." }));
  expect(screen.getByRole("textbox")).toBeDisabled();
  expect(screen.getByRole("textbox")).toHaveAccessibleDescription("다른 대화가 답하는 중이에요.");
  expect(screen.getByRole("button", { name: "질문 보내기" })).toBeDisabled();
});

test("focusToken focuses the input", () => {
  const { rerender } = render(ui());
  expect(screen.getByRole("textbox")).not.toHaveFocus();
  rerender(ui({ focusToken: 1 }));
  expect(screen.getByRole("textbox")).toHaveFocus();
});

test("Enter while composing (isComposing or keyCode 229) does not send", () => {
  const onAsk = vi.fn();
  render(ui({ onAsk }));
  const input = screen.getByRole("textbox");
  fireEvent.change(input, { target: { value: "가나" } });
  fireEvent.keyDown(input, { key: "Enter", isComposing: true });
  fireEvent.keyDown(input, { key: "Enter", keyCode: 229 });
  expect(onAsk).not.toHaveBeenCalled();
  expect(input).toHaveValue("가나");
  fireEvent.keyDown(input, { key: "Enter" });
  expect(onAsk).toHaveBeenCalledWith("가나");
});

test("re-rendering with the same focusToken does not pull focus back", () => {
  const { rerender } = render(<div><button>밖</button>{ui({ focusToken: 1 })}</div>);
  expect(screen.getByRole("textbox")).toHaveFocus();
  screen.getByText("밖").focus();
  rerender(<div><button>밖</button>{ui({ focusToken: 1 })}</div>);
  expect(screen.getByText("밖")).toHaveFocus();
});

test("keeps the text when onAsk does not accept the question", async () => {
  const onAsk = vi.fn(() => false);
  render(ui({ onAsk }));
  await userEvent.type(screen.getByRole("textbox"), "질문{Enter}");
  expect(onAsk).toHaveBeenCalled();
  expect(screen.getByRole("textbox")).toHaveValue("질문");
});

test("calls onFocusHandled once after focusing", () => {
  const onFocusHandled = vi.fn();
  const { rerender } = render(ui({ focusToken: 1, onFocusHandled }));
  expect(onFocusHandled).toHaveBeenCalledTimes(1);
  rerender(ui({ focusToken: 1, onFocusHandled }));
  expect(onFocusHandled).toHaveBeenCalledTimes(1);
});
