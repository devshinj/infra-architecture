import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
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

test("MCP 로 만든 버전은 'Claude Code에서' 와 요약을 보여준다", () => {
  const rows = [{ number: 4, source: "mcp" as const, via: "mcp" as const, summary: "Redis 추가", status: "complete" as const, restoredFrom: null, createdAt: new Date() }];
  render(<HistoryPanel versions={rows} {...mk()} />);
  expect(screen.getByText("Claude Code에서")).toBeInTheDocument();
  expect(screen.getByText("Redis 추가")).toBeInTheDocument();
});

test("Claude Code 에서 되돌린 버전은 '되돌리기 · Claude Code에서' 와 원본 번호를 보여준다", () => {
  const rows = [{ number: 5, source: "restore" as const, via: "mcp" as const, summary: null, status: "complete" as const, restoredFrom: 3, createdAt: new Date() }];
  render(<HistoryPanel versions={rows} {...mk()} />);
  expect(screen.getByText("되돌리기 · Claude Code에서")).toBeInTheDocument();
  expect(screen.getByText("v3에서")).toBeInTheDocument();
});

test("the latest version is marked 지금, times are relative with the full stamp kept for hover", () => {
  const now = Date.now();
  const rows = [
    { number: 3, source: "ai" as const, status: "complete" as const, restoredFrom: null, createdAt: new Date(now - 30_000) },
    { number: 2, source: "ai" as const, status: "complete" as const, restoredFrom: null, createdAt: new Date(now - 5 * 60_000) },
    { number: 1, source: "import" as const, status: "complete" as const, restoredFrom: null, createdAt: new Date(now - 3 * 86_400_000) },
  ];
  render(<HistoryPanel versions={rows} {...mk()} />);
  const [v3, v2, v1] = screen.getAllByRole("listitem");
  expect(within(v3!).getByText("지금")).toBeInTheDocument();
  expect(within(v2!).queryByText("지금")).toBeNull();
  expect(within(v3!).getByText("방금")).toBeInTheDocument();
  expect(within(v2!).getByText("5분 전")).toBeInTheDocument();
  expect(within(v1!).getByText("3일 전")).toBeInTheDocument();
  const t = within(v2!).getByText("5분 전");
  expect(t.tagName).toBe("TIME");
  expect(t).toHaveAttribute("title", new Date(now - 5 * 60_000).toLocaleString("ko-KR"));
});
