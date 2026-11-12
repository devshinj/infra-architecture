import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";

import { CLARIFY_AUTO, type ClarifyQuestion } from "@/domain/clarify";
import { ChatPanel, type ChatPanelProps } from "@/ui/chat/ChatPanel";
import { ClarifyCard } from "@/ui/chat/ClarifyCard";
import { messagesToLines } from "@/ui/chat/lines";
import type { ChatLine } from "@/ui/chat/useChatTurn";

afterEach(cleanup);

const QUESTIONS: ClarifyQuestion[] = [
  { key: "call_mode", label: "통화 방식", question: "실시간 영상·음성은 어떤 방식인가요?", choices: ["1:1 통화(단말끼리 직접)", "다자간(미디어 서버 경유)"] },
  { key: "llm_serving", label: "LLM 위치", question: "LLM 은 어디에서 돌리나요?", choices: ["외부 LLM API", "사내 서빙(GPU 서버)"] },
];

test("질문마다 선택지와 '알아서 정해 줘'가 있고, 모두 골라야 그릴 수 있다", async () => {
  const onSubmit = vi.fn();
  render(<ClarifyCard questions={QUESTIONS} disabled={false} onSubmit={onSubmit} />);
  const groups = screen.getAllByRole("group");
  expect(groups).toHaveLength(2);
  expect(within(groups[0]).getAllByRole("radio")).toHaveLength(3);
  expect(within(groups[0]).getByRole("radio", { name: CLARIFY_AUTO })).toBeInTheDocument();
  const go = screen.getByRole("button", { name: "이대로 그리기" });
  expect(go).toBeDisabled();

  await userEvent.click(within(groups[0]).getByRole("radio", { name: "다자간(미디어 서버 경유)" }));
  expect(go).toBeDisabled();
  await userEvent.click(within(groups[1]).getByRole("radio", { name: CLARIFY_AUTO }));
  expect(go).toBeEnabled();
  await userEvent.click(go);
  expect(onSubmit).toHaveBeenCalledWith("통화 방식: 다자간(미디어 서버 경유) · LLM 위치: 알아서 정해 줘", {
    call_mode: "다자간(미디어 서버 경유)",
    llm_serving: CLARIFY_AUTO,
  });
});

test("지난 질문이면 고르지 못한다", () => {
  render(<ClarifyCard questions={QUESTIONS} disabled onSubmit={vi.fn()} />);
  for (const r of screen.getAllByRole("radio")) expect(r).toBeDisabled();
  expect(screen.getByRole("button", { name: "이대로 그리기" })).toBeDisabled();
});

const panel = (lines: ChatLine[], o: Partial<ChatPanelProps> = {}): ChatPanelProps => ({
  lines,
  busy: false,
  onSend: vi.fn(),
  onStop: vi.fn(),
  health: { qwen: "ok", clef: "ok" },
  mentionRef: { current: null },
  ...o,
});
const clarifyLine = (id: string): ChatLine => ({ id, kind: "clarify", text: "", clarify: [QUESTIONS[0]], turn: `t-${id}` });

test("대화 패널: 마지막 줄의 되묻기만 고를 수 있고, 고르면 요약 글과 답을 함께 보낸다", async () => {
  const onSend = vi.fn();
  const lines: ChatLine[] = [
    { id: "u1", kind: "user", text: "화상회의 붙여 줘" },
    clarifyLine("old"),
    { id: "u2", kind: "user", text: "아니, DB 부터 넣어 줘" },
    clarifyLine("new"),
  ];
  render(<ChatPanel {...panel(lines, { onSend })} />);
  const cards = document.querySelectorAll('[data-kind="clarify"]');
  expect(cards).toHaveLength(2);
  for (const r of within(cards[0] as HTMLElement).getAllByRole("radio")) expect(r).toBeDisabled();
  const open = within(cards[1] as HTMLElement);
  await userEvent.click(open.getByRole("radio", { name: "1:1 통화(단말끼리 직접)" }));
  await userEvent.click(open.getByRole("button", { name: "이대로 그리기" }));
  expect(onSend).toHaveBeenCalledWith("통화 방식: 1:1 통화(단말끼리 직접)", { choices: { call_mode: "1:1 통화(단말끼리 직접)" } });
});

test("대화 패널: 차례가 도는 동안에는 되묻기도 고르지 못한다", () => {
  render(<ChatPanel {...panel([clarifyLine("c")], { busy: true })} />);
  for (const r of screen.getAllByRole("radio")) expect(r).toBeDisabled();
});

test("저장된 되묻기 메시지는 안내 글과 선택 카드로 되살아나고 요약 칩은 없다", () => {
  const says = ["그리기 전에 정해 주세요."];
  const lines = messagesToLines([
    { id: "m1", role: "user", content: "화상회의 붙여 줘", meta: {} },
    {
      id: "m2",
      role: "assistant",
      content: says.join("\n"),
      meta: { intent: "structure_change", applied: 0, changed: 0, skipped: 0, version: null, status: "complete", says, clarify: { questions: [QUESTIONS[0]], text: "화상회의 붙여 줘" } },
    },
  ]);
  expect(lines.map((l) => l.kind)).toEqual(["user", "progress", "clarify"]);
  expect(lines[2].clarify).toEqual([QUESTIONS[0]]);
});
