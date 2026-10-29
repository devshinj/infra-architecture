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
  samples: [{ id: "s1", title: "샘플 하나" }],
  onImportSample: vi.fn(),
  history: { versions: [], onView: vi.fn(), onRestore: vi.fn(), onCompare: vi.fn() },
  chat: { lines: [], busy: false, phase: null, onSend: vi.fn(), onStop: vi.fn(), health: null, mentionRef: { current: null } },
});

test("chat tab shows the sample buttons only for an empty diagram", async () => {
  const p = { ...props(null), state: emptyState() };
  render(<RightPanel {...p} />);
  expect(screen.getByText("또는 샘플로 시작하기")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "샘플 하나 불러오기" }));
  expect(p.onImportSample).toHaveBeenCalledWith("s1");
});

test("selecting activates 설명 and clearing returns to the previous tab", () => {
  const { rerender } = render(<RightPanel {...props(null)} />);
  expect(screen.getByRole("tab", { name: "대화" })).toHaveAttribute("aria-selected", "true");
  rerender(<RightPanel {...props("was-1")} />);
  expect(screen.getByRole("tab", { name: "설명" })).toHaveAttribute("aria-selected", "true");
  rerender(<RightPanel {...props(null)} />);
  expect(screen.getByRole("tab", { name: "대화" })).toHaveAttribute("aria-selected", "true");
});

test("selecting another node while on 이력 switches back to 설명 and deselect restores the first tab", async () => {
  const { rerender } = render(<RightPanel {...props(null)} />);
  rerender(<RightPanel {...props("was-1")} />);
  await userEvent.click(screen.getByRole("tab", { name: "이력" }));
  expect(screen.getByRole("tab", { name: "이력" })).toHaveAttribute("aria-selected", "true");
  rerender(<RightPanel {...props("was-2")} />);
  expect(screen.getByRole("tab", { name: "설명" })).toHaveAttribute("aria-selected", "true");
  rerender(<RightPanel {...props(null)} />);
  expect(screen.getByRole("tab", { name: "대화" })).toHaveAttribute("aria-selected", "true");
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

test("chat tab hides samples when the diagram has nodes", () => {
  render(<RightPanel {...props(null)} />);
  expect(screen.queryByText("또는 샘플로 시작하기")).not.toBeInTheDocument();
});
