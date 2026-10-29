import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";

import { RightPanel, type RightPanelProps } from "@/ui/RightPanel";

import { fx } from "../fixtures/spike";

afterEach(cleanup);

const props = (selectedId: string | null): RightPanelProps => ({
  state: fx("s2"),
  selectedId,
  onSelect: vi.fn(),
  samples: [{ id: "s1", title: "샘플 하나" }],
  onImportSample: vi.fn(),
  history: { versions: [], onView: vi.fn(), onRestore: vi.fn(), onCompare: vi.fn() },
});

test("chat tab shows the empty guidance and sample buttons", async () => {
  const p = props(null);
  render(<RightPanel {...p} />);
  expect(screen.getByText(/AI 대화는 곧 연결됩니다/)).toBeInTheDocument();
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
