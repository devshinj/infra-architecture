import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";

import { RightPanel, type RightPanelProps } from "@/ui/RightPanel";

import { emptyState } from "@/domain/types";

import { fx } from "../fixtures/spike";

afterEach(cleanup);

const props = (selectedId: string | null): RightPanelProps => ({
  state: fx("s2"),
  selectedId,
  onSelect: vi.fn(),
  history: { versions: [], onView: vi.fn(), onRestore: vi.fn(), onCompare: vi.fn() },
  chat: { lines: [], busy: false, onSend: vi.fn(), onStop: vi.fn(), health: null, mentionRef: { current: null } },
});

test("no sample list in chat; greeting only for an empty diagram", () => {
  const { rerender } = render(<RightPanel {...props(null)} state={emptyState()} />);
  expect(screen.queryByText("또는 샘플로 시작하기")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /불러오기/ })).not.toBeInTheDocument();
  expect(screen.getByText(/안녕하세요, InfraSketch예요/)).toBeInTheDocument();
  rerender(<RightPanel {...props(null)} />);
  expect(screen.queryByText(/안녕하세요, InfraSketch예요/)).not.toBeInTheDocument();
});

test("selecting activates 설명 and clearing returns to the previous tab", () => {
  const { rerender } = render(<RightPanel {...props(null)} />);
  expect(screen.getByRole("tab", { name: "대화" })).toHaveAttribute("aria-selected", "true");
  rerender(<RightPanel {...props("was-1")} />);
  expect(screen.getByRole("tab", { name: "설명" })).toHaveAttribute("aria-selected", "true");
  rerender(<RightPanel {...props(null)} />);
  expect(screen.getByRole("tab", { name: "대화" })).toHaveAttribute("aria-selected", "true");
});

test("selecting another node while on 이력 switches back to 설명 and deselect stays on the manually chosen tab", async () => {
  const { rerender } = render(<RightPanel {...props(null)} />);
  rerender(<RightPanel {...props("was-1")} />);
  await userEvent.click(screen.getByRole("tab", { name: "이력" }));
  expect(screen.getByRole("tab", { name: "이력" })).toHaveAttribute("aria-selected", "true");
  rerender(<RightPanel {...props("was-2")} />);
  expect(screen.getByRole("tab", { name: "설명" })).toHaveAttribute("aria-selected", "true");
  rerender(<RightPanel {...props(null)} />);
  expect(screen.getByRole("tab", { name: "이력" })).toHaveAttribute("aria-selected", "true");
});

test("manual tab choice after selecting keeps that tab when the selection clears", async () => {
  const { rerender } = render(<RightPanel {...props(null)} />);
  rerender(<RightPanel {...props("was-1")} />);
  await userEvent.click(screen.getByRole("tab", { name: "이력" }));
  rerender(<RightPanel {...props(null)} />);
  expect(screen.getByRole("tab", { name: "이력" })).toHaveAttribute("aria-selected", "true");
});

test("controlled mode: selection change notifies the parent outside render, no console.error", () => {
  const err = vi.spyOn(console, "error").mockImplementation(() => {});
  const onTabChange = vi.fn();
  const { rerender } = render(<RightPanel {...props(null)} tab="이력" onTabChange={onTabChange} />);
  rerender(<RightPanel {...props("was-1")} tab="이력" onTabChange={onTabChange} />);
  expect(onTabChange).toHaveBeenLastCalledWith("설명");
  rerender(<RightPanel {...props("was-1")} tab="설명" onTabChange={onTabChange} />);
  rerender(<RightPanel {...props(null)} tab="설명" onTabChange={onTabChange} />);
  expect(onTabChange).toHaveBeenLastCalledWith("이력");
  expect(err).not.toHaveBeenCalled();
  err.mockRestore();
});
