import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { EXPORT_BUSY_MESSAGE, EXPORT_DONE_MESSAGE, EXPORT_EMPTY_REASON, EXPORT_FAILED_MESSAGE, ExportMenu } from "@/canvas/ExportMenu";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const trigger = () => screen.getByRole("button", { name: /^(이미지 저장|이미지를 만드는 중…)$/ });

test("opens a menu of PNG/SVG × dark/light, focuses the first item, and moves with arrow keys", () => {
  render(<ExportMenu disabled={false} onExport={vi.fn(() => Promise.resolve())} />);
  expect(trigger()).toHaveAttribute("aria-haspopup", "menu");
  fireEvent.click(trigger());
  const menu = screen.getByRole("menu", { name: "이미지 저장" });
  expect(trigger()).toHaveAttribute("aria-expanded", "true");
  const items = within(menu).getAllByRole("menuitem");
  expect(items.map((i) => i.getAttribute("aria-label"))).toEqual([
    "PNG 어두운 바탕(화면과 같음)",
    "PNG 흰 바탕(문서용)",
    "SVG 어두운 바탕(화면과 같음)",
    "SVG 흰 바탕(문서용)",
  ]);
  expect(within(menu).getAllByRole("group")).toHaveLength(2);
  expect(items[0]).toHaveFocus();
  fireEvent.keyDown(menu, { key: "ArrowDown" });
  expect(items[1]).toHaveFocus();
  fireEvent.keyDown(menu, { key: "ArrowUp" });
  fireEvent.keyDown(menu, { key: "ArrowUp" });
  expect(items[3]).toHaveFocus();
});

test("Esc closes the menu and returns focus to the button", () => {
  render(<ExportMenu disabled={false} onExport={vi.fn(() => Promise.resolve())} />);
  fireEvent.click(trigger());
  fireEvent.keyDown(document, { key: "Escape" });
  expect(screen.queryByRole("menu")).toBeNull();
  expect(trigger()).toHaveFocus();
});

test("choosing an item closes the menu, shows progress, then a short success note", async () => {
  vi.useFakeTimers();
  let resolve!: () => void;
  const onExport = vi.fn(() => new Promise<void>((r) => (resolve = r)));
  render(<ExportMenu disabled={false} onExport={onExport} />);
  fireEvent.click(trigger());
  fireEvent.click(screen.getByRole("menuitem", { name: "SVG 흰 바탕(문서용)" }));
  expect(onExport).toHaveBeenCalledWith("svg", "light");
  expect(screen.queryByRole("menu")).toBeNull();
  expect(screen.getByRole("status")).toHaveTextContent(EXPORT_BUSY_MESSAGE);
  expect(trigger()).toHaveAttribute("aria-busy", "true");
  expect(trigger()).toHaveFocus();
  // 만드는 동안 다시 눌러도 메뉴가 열리지 않는다.
  fireEvent.click(trigger());
  expect(screen.queryByRole("menu")).toBeNull();
  await act(async () => resolve());
  expect(screen.getByRole("status")).toHaveTextContent(EXPORT_DONE_MESSAGE);
  act(() => vi.advanceTimersByTime(3000));
  // 알림 자리(role=status)는 비어도 남아 있다(다음 '만드는 중'을 읽어 주게).
  expect(screen.getByRole("status")).toBeEmptyDOMElement();
  expect(screen.getByRole("status")).toHaveClass("canvas__export-note--empty");
});

test("the live region exists before the first export so '만드는 중' is announced", () => {
  render(<ExportMenu disabled={false} onExport={vi.fn(() => new Promise<void>(() => {}))} />);
  const status = screen.getByRole("status");
  expect(status).toBeEmptyDOMElement();
  fireEvent.click(trigger());
  fireEvent.click(screen.getByRole("menuitem", { name: "PNG 흰 바탕(문서용)" }));
  expect(screen.getByRole("status")).toBe(status);
  expect(status).toHaveTextContent(EXPORT_BUSY_MESSAGE);
  expect(status).not.toHaveClass("canvas__export-note--empty");
});

test("reopening the menu clears the previous note so they do not overlap", async () => {
  render(<ExportMenu disabled={false} onExport={vi.fn(() => Promise.reject(new Error("x")))} />);
  fireEvent.click(trigger());
  await act(async () => fireEvent.click(screen.getByRole("menuitem", { name: "SVG 어두운 바탕(화면과 같음)" })));
  expect(await screen.findByRole("alert")).toBeInTheDocument();
  fireEvent.click(trigger());
  expect(screen.getByRole("menu")).toBeInTheDocument();
  expect(screen.queryByRole("alert")).toBeNull();
  expect(screen.getByRole("status")).toBeEmptyDOMElement();
});

test("an open menu closes when the button becomes blocked", () => {
  const { rerender } = render(<ExportMenu disabled={false} onExport={vi.fn()} />);
  fireEvent.click(trigger());
  expect(screen.getByRole("menu")).toBeInTheDocument();
  rerender(<ExportMenu disabled onExport={vi.fn()} />);
  expect(screen.queryByRole("menu")).toBeNull();
  expect(trigger()).toHaveAttribute("aria-expanded", "false");
});

test("no accessible name in the export UI contains '보내기' (the chat send button)", () => {
  render(<ExportMenu disabled={false} onExport={vi.fn()} />);
  fireEvent.click(trigger());
  const named = [trigger(), screen.getByRole("menu"), ...screen.getAllByRole("menuitem"), ...screen.getAllByRole("group")];
  for (const el of named) {
    const name = el.getAttribute("aria-label") ?? el.textContent ?? "";
    expect(name, name).not.toContain("보내기");
  }
});

test("a failed export shows a Korean alert", async () => {
  render(<ExportMenu disabled={false} onExport={vi.fn(() => Promise.reject(new Error("x")))} />);
  fireEvent.click(trigger());
  await act(async () => fireEvent.click(screen.getByRole("menuitem", { name: "PNG 어두운 바탕(화면과 같음)" })));
  expect(await screen.findByRole("alert")).toHaveTextContent(EXPORT_FAILED_MESSAGE);
  expect(trigger()).not.toHaveAttribute("aria-busy");
});

test("disabled with the reason when there is nothing to export", () => {
  render(<ExportMenu disabled onExport={vi.fn()} />);
  expect(trigger()).toBeDisabled();
  expect(trigger()).toHaveAccessibleDescription(EXPORT_EMPTY_REASON);
  expect(trigger()).toHaveAttribute("title", EXPORT_EMPTY_REASON);
});
