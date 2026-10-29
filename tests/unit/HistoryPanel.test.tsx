import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";

import { HistoryPanel } from "@/ui/HistoryPanel";

afterEach(cleanup);

const versions = [
  { number: 2, source: "ai" as const, status: "aborted" as const, restoredFrom: null, createdAt: new Date() },
  { number: 1, source: "import" as const, status: "complete" as const, restoredFrom: null, createdAt: new Date() },
];
const mk = () => ({ onView: vi.fn(), onRestore: vi.fn(), onCompare: vi.fn() });

test("HistoryPanel labels sources and aborted status", () => {
  render(<HistoryPanel versions={versions} {...mk()} />);
  expect(screen.getByText("중단됨")).toBeInTheDocument();
  expect(screen.getByText("가져오기")).toBeInTheDocument();
  expect(screen.getByText("AI")).toBeInTheDocument();
});

test("selecting a version reveals view / restore / compare actions", async () => {
  const h = mk();
  render(<HistoryPanel versions={versions} {...h} />);
  expect(screen.queryByRole("button", { name: "이 버전 보기" })).toBeNull();
  await userEvent.click(screen.getByRole("button", { name: /v1/ }));
  await userEvent.click(screen.getByRole("button", { name: "이 버전 보기" }));
  await userEvent.click(screen.getByRole("button", { name: "이 버전으로 되돌리기" }));
  await userEvent.click(screen.getByRole("button", { name: "현재와 비교" }));
  expect(h.onView).toHaveBeenCalledWith(1);
  expect(h.onRestore).toHaveBeenCalledWith(1);
  expect(h.onCompare).toHaveBeenCalledWith(1);
});

test("disabled prop disables view, restore and compare", async () => {
  render(<HistoryPanel versions={versions} {...mk()} disabled />);
  await userEvent.click(screen.getByText("가져오기"));
  expect(screen.getByRole("button", { name: "이 버전 보기" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "이 버전으로 되돌리기" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "현재와 비교" })).toBeDisabled();
});
