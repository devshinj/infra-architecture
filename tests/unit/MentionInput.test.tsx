import "@testing-library/jest-dom/vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { afterEach, expect, test, vi } from "vitest";

import { MentionInput, type MentionInputHandle } from "@/ui/chat/MentionInput";

afterEach(cleanup);

function setup(canSend = true) {
  const ref = createRef<MentionInputHandle>();
  const onSend = vi.fn();
  render(<MentionInput ref={ref} placeholder="입력" canSend={canSend} onSend={onSend} />);
  return { ref, onSend, box: screen.getByRole("textbox") };
}

test("insertMention adds a chip and serializes to @[label](node:id)", async () => {
  const { ref, onSend, box } = setup();
  act(() => ref.current!.insertMention({ id: "n1", label: "API 서버" }));
  expect(screen.getByText("API 서버")).toBeInTheDocument();
  await userEvent.type(box, "를 늘려줘{Enter}");
  expect(onSend).toHaveBeenCalledWith("@[API 서버](node:n1) 를 늘려줘");
  expect(screen.queryByText("API 서버")).not.toBeInTheDocument(); // cleared after send
});

test("same node is not added twice and brackets in labels are stripped", async () => {
  const { ref, onSend, box } = setup();
  act(() => {
    ref.current!.insertMention({ id: "n1", label: "a[1]" });
    ref.current!.insertMention({ id: "n1", label: "a[1]" });
  });
  expect(screen.getAllByRole("listitem")).toHaveLength(1);
  await userEvent.type(box, "{Enter}");
  expect(onSend).toHaveBeenCalledWith("@[a 1](node:n1)");
});

test("Backspace at the start removes one whole chip; the x button removes a chip", async () => {
  const { ref, box } = setup();
  act(() => {
    ref.current!.insertMention({ id: "a", label: "하나" });
    ref.current!.insertMention({ id: "b", label: "둘" });
  });
  box.focus();
  await userEvent.keyboard("{Backspace}");
  expect(screen.queryByText("둘")).not.toBeInTheDocument();
  expect(screen.getByText("하나")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "하나 참조 제거" }));
  expect(screen.queryByText("하나")).not.toBeInTheDocument();
});

test("Enter sends, Shift+Enter inserts newline", async () => {
  const { onSend, box } = setup();
  await userEvent.type(box, "첫줄{Shift>}{Enter}{/Shift}둘째줄");
  expect(onSend).not.toHaveBeenCalled();
  expect(box).toHaveValue("첫줄\n둘째줄");
  await userEvent.keyboard("{Enter}");
  expect(onSend).toHaveBeenCalledWith("첫줄\n둘째줄");
});

test("empty input and canSend=false do not send", async () => {
  const a = setup();
  await userEvent.type(a.box, "{Enter}   {Enter}");
  expect(a.onSend).not.toHaveBeenCalled();
  cleanup();
  const b = setup(false);
  await userEvent.type(b.box, "안녕{Enter}");
  expect(b.onSend).not.toHaveBeenCalled();
  expect(b.box).toHaveValue("안녕");
});
