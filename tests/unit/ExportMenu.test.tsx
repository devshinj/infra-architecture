import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { EXPORT_BUSY_MESSAGE, EXPORT_DONE_MESSAGE, EXPORT_EMPTY_REASON, EXPORT_FAILED_MESSAGE, ExportMenu } from "@/canvas/ExportMenu";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const trigger = () => screen.getByRole("button", { name: /이미지로 내보내기|이미지를 만드는 중/ });

test("opens a menu of PNG/SVG × dark/light, focuses the first item, and moves with arrow keys", () => {
  render(<ExportMenu disabled={false} onExport={vi.fn(() => Promise.resolve())} />);
  expect(trigger()).toHaveAttribute("aria-haspopup", "menu");
  fireEvent.click(trigger());
  const menu = screen.getByRole("menu", { name: "이미지로 내보내기" });
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
  expect(screen.getByRole("status", { hidden: true })).toBeEmptyDOMElement();
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
