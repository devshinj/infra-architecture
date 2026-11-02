import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";

import { SessionPicker } from "@/ui/chat/SessionPicker";
import type { SessionSummary } from "@/ui/chat/useSessions";

afterEach(cleanup);

const today = (h: number, m: number) => {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};
const s = (id: string, nodeId: string, nodeLabel: string, title: string, updatedAt: string): SessionSummary => ({ id, nodeId, nodeLabel, title, updatedAt });
const names: Record<string, string> = { n1: "API 서버", n2: "주문 DB" };
const labelOf = (id: string) => names[id] ?? null;

test("shows 구성도 대화 alone and disabled with no sessions", () => {
  render(<SessionPicker sessions={[]} active="main" labelOf={labelOf} onSelect={vi.fn()} />);
  const btn = screen.getByRole("button", { name: "구성도 대화" });
  expect(btn).toBeDisabled();
  expect(btn.querySelector("svg")).toBeNull();
});

test("lists sessions newest first with node name and title", async () => {
  const onSelect = vi.fn();
  const sessions = [
    s("a", "n2", "주문 DB", "백업은 어떻게 해요?", "2026-03-04T10:00:00Z"),
    s("b", "n1", "API 서버", "왜 두 대예요?", today(9, 5)),
  ];
  render(<SessionPicker sessions={sessions} active="main" labelOf={labelOf} onSelect={onSelect} />);
  await userEvent.click(screen.getByRole("button", { name: "구성도 대화" }));
  const items = screen.getAllByRole("menuitem");
  expect(items.map((i) => i.textContent)).toEqual(["구성도 대화", "API 서버 · 왜 두 대예요?09:05", "주문 DB · 백업은 어떻게 해요?3/4"]);
  await userEvent.click(items[1]!);
  expect(onSelect).toHaveBeenCalledWith("b");
  expect(screen.queryByRole("menu")).not.toBeInTheDocument();
});

test("the button shows the active session as node name · title", () => {
  render(<SessionPicker sessions={[s("b", "n1", "API", "왜 두 대예요?", today(9, 5))]} active="b" labelOf={labelOf} onSelect={vi.fn()} />);
  expect(screen.getByRole("button", { name: "API 서버 · 왜 두 대예요?" })).toBeEnabled();
});

test("deleted node shows (지워짐)", async () => {
  render(<SessionPicker sessions={[s("c", "gone", "캐시", "만료 시간은?", today(8, 0))]} active="main" labelOf={labelOf} onSelect={vi.fn()} />);
  await userEvent.click(screen.getByRole("button", { name: "구성도 대화" }));
  expect(screen.getAllByRole("menuitem")[1]).toHaveTextContent("캐시 (지워짐) · 만료 시간은?");
});

test("Esc closes and returns focus", async () => {
  render(<SessionPicker sessions={[s("b", "n1", "API 서버", "왜?", today(9, 5))]} active="main" labelOf={labelOf} onSelect={vi.fn()} />);
  const btn = screen.getByRole("button", { name: "구성도 대화" });
  await userEvent.click(btn);
  expect(screen.getAllByRole("menuitem")[0]).toHaveFocus();
  await userEvent.keyboard("{Escape}");
  expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  expect(btn).toHaveFocus();
});

test("the pending new session is the first session row with aria-current, and choosing it is a no-op", async () => {
  const onSelect = vi.fn();
  const pending = s("new", "n1", "API 서버", "왜 두 대예요?", today(9, 5));
  const sessions = [s("a", "n2", "주문 DB", "백업은 어떻게 해요?", "2026-03-04T10:00:00Z")];
  render(<SessionPicker sessions={sessions} active="new" labelOf={labelOf} onSelect={onSelect} pending={pending} />);
  await userEvent.click(screen.getByRole("button", { name: "API 서버 · 왜 두 대예요?" }));
  const items = screen.getAllByRole("menuitem");
  expect(items.map((i) => i.textContent)).toEqual(["구성도 대화", "API 서버 · 왜 두 대예요?09:05", "주문 DB · 백업은 어떻게 해요?3/4"]);
  expect(items[1]).toHaveAttribute("aria-current", "true");
  expect(items.filter((i) => i.hasAttribute("aria-current"))).toHaveLength(1);
  await userEvent.click(items[1]!);
  expect(onSelect).not.toHaveBeenCalled();
});
