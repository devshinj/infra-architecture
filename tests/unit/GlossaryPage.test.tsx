import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

const updateTermAction = vi.fn();
const setTermReviewedAction = vi.fn();
vi.mock("@/app/(app)/actions", () => ({
  updateTermAction: (...a: unknown[]) => updateTermAction(...a),
  setTermReviewedAction: (...a: unknown[]) => setTermReviewedAction(...a),
}));

import type { GlossaryItem } from "@/ui/glossary/GlossaryPage";
import { GlossaryPage } from "@/ui/glossary/GlossaryPage";

beforeEach(() => {
  updateTermAction.mockReset();
  setTermReviewedAction.mockReset();
});
afterEach(cleanup);

const item = (o: Partial<GlossaryItem>): GlossaryItem => ({
  id: "1",
  key: "k",
  term: "Redis",
  fullName: "Remote Dictionary Server",
  category: "캐시",
  definition: "메모리에 데이터를 두는 저장소입니다.",
  why: "",
  compare: "",
  source: "seed",
  reviewed: false,
  ...o,
});
const items = [
  item({ id: "1", term: "Redis" }),
  item({ id: "2", term: "Nginx", fullName: "", category: "웹 서버", definition: "요청을 받아 넘기는 서버입니다.", reviewed: true, source: "ai" }),
];

test("search and unreviewed filter", async () => {
  render(<GlossaryPage initial={items} />);
  expect(screen.getByRole("heading", { name: "용어 사전" })).toBeInTheDocument();
  expect(screen.getAllByRole("listitem")).toHaveLength(2);
  await userEvent.type(screen.getByRole("searchbox", { name: "용어 검색" }), "nginx");
  expect(screen.getAllByRole("listitem")).toHaveLength(1);
  expect(screen.getByText("Nginx")).toBeInTheDocument();
  await userEvent.clear(screen.getByRole("searchbox", { name: "용어 검색" }));
  await userEvent.click(screen.getByRole("checkbox", { name: "미검수만" }));
  const rows = screen.getAllByRole("listitem");
  expect(rows).toHaveLength(1);
  expect(within(rows[0]!).getByText("Redis")).toBeInTheDocument();
  expect(within(rows[0]!).getByText("미검수")).toBeInTheDocument();
  expect(within(rows[0]!).getByText("초기")).toBeInTheDocument();
});

test("edit saves and shows errors", async () => {
  updateTermAction.mockResolvedValueOnce({ ok: false, error: "정의은(는) 120자 이내로 입력해 주세요" });
  render(<GlossaryPage initial={items} />);
  await userEvent.click(screen.getByRole("button", { name: /Redis/ }));
  const def = screen.getByLabelText("정의");
  await userEvent.clear(def);
  await userEvent.type(def, "새 정의");
  await userEvent.click(screen.getByRole("button", { name: "저장" }));
  expect(updateTermAction).toHaveBeenCalledWith("1", expect.objectContaining({ term: "Redis", definition: "새 정의" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("120자");

  updateTermAction.mockResolvedValueOnce({ ok: true, term: { ...items[0]!, definition: "새 정의" } });
  await userEvent.click(screen.getByRole("button", { name: "저장" }));
  expect(await screen.findByText("새 정의", { selector: "p" })).toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

test("검수 완료 toggles badge", async () => {
  setTermReviewedAction.mockResolvedValueOnce({ ok: true, term: { ...items[0]!, reviewed: true } });
  render(<GlossaryPage initial={items} />);
  await userEvent.click(screen.getByRole("button", { name: /Redis/ }));
  expect(screen.getByText("미검수")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "검수 완료" }));
  expect(setTermReviewedAction).toHaveBeenCalledWith("1", true);
  expect(await screen.findByRole("button", { name: "검수 취소" })).toBeInTheDocument();
  expect(screen.queryByText("미검수")).not.toBeInTheDocument();
});
