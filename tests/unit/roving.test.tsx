import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, expect, test, vi } from "vitest";

import { Canvas, type CanvasOptions, type CanvasProps } from "@/canvas/Canvas";
import { defaultDisplayOptions } from "@/canvas/display";
import { type NavItem, readingOrder, step, tabStop } from "@/canvas/roving";

import { fx } from "../fixtures/spike";

beforeAll(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  class DM { m22 = 1; }
  vi.stubGlobal("DOMMatrixReadOnly", DM);
  vi.stubGlobal("DOMMatrix", DM);
});
afterEach(cleanup);

// ---- 순수 함수 ----
const it = (id: string, x: number, y: number, zone = false, width = 100, height = 40): NavItem => ({ id, zone, rect: { x, y, width, height } });
//  [zone z: 머리 (0,0) 폭 400]
//   a(20,40)  b(200,45)
//   c(20,120)           d(300,130)
const items = [it("z", 0, 0, true, 400, 30), it("a", 20, 40), it("b", 200, 45), it("c", 20, 120), it("d", 300, 130)];

test("reading order goes row by row (small y offsets share a row), zones before what they hold", () => {
  expect(readingOrder(items)).toEqual(["z", "a", "b", "c", "d"]);
});

test("arrows go to the nearest item in that direction, preferring ones in line; Home/End go to the ends", () => {
  const order = readingOrder(items);
  expect(step(items, order, "a", "ArrowRight")).toBe("b");
  expect(step(items, order, "a", "ArrowDown")).toBe("c");
  expect(step(items, order, "b", "ArrowDown")).toBe("d");
  expect(step(items, order, "a", "ArrowUp")).toBe("z");
  expect(step(items, order, "c", "ArrowLeft")).toBeNull(); // 그 방향에 없으면 제자리
  // 한참 아래(부채꼴 밖)에 있는 것으로는 옆으로 뛰지 않는다.
  const far = [it("p", 300, 0), it("q", 0, 400)];
  expect(step(far, readingOrder(far), "p", "ArrowLeft")).toBeNull();
  expect(step(far, readingOrder(far), "p", "ArrowDown")).toBe("q");
  expect(step(items, order, "d", "Home")).toBe("z");
  expect(step(items, order, "a", "End")).toBe("d");
});

test("the single tab stop is the selection, else the last focused item, else the first node in reading order", () => {
  const order = readingOrder(items);
  expect(tabStop(items, order, null, null)).toBe("a"); // 첫 노드(영역 z 가 아니다)
  expect(tabStop(items, order, null, "c")).toBe("c");
  expect(tabStop(items, order, "d", "c")).toBe("d");
  expect(tabStop(items, order, "gone", "gone")).toBe("a");
  expect(tabStop([it("z", 0, 0, true)], ["z"], null, null)).toBe("z");
  expect(tabStop([], [], null, null)).toBeNull();
});

// ---- 캔버스 ----
const baseProps = (): CanvasProps => {
  const state = fx("s2");
  const options: CanvasOptions = { ...defaultDisplayOptions(state), hoverLabels: true, showMissingBadges: true };
  return {
    state, pinned: {}, editMode: false, options, motion: false,
    onOptionsChange: vi.fn(), onSelect: vi.fn(), onPinnedChange: vi.fn(), onAutoArrange: vi.fn(), onEditModeChange: vi.fn(), onMotionChange: vi.fn(),
    onBadgeClick: vi.fn(), onWarnBadgeClick: vi.fn(),
  };
};
const ui = (p: CanvasProps) => <div style={{ width: 800, height: 600 }}><Canvas {...p} /></div>;
const wrappers = (c: HTMLElement) => [...c.querySelectorAll<HTMLElement>(".react-flow__node")];
const stops = (c: HTMLElement) => wrappers(c).filter((w) => w.getAttribute("tabindex") === "0");
const ready = async (c: HTMLElement) => waitFor(() => expect(c.querySelector(".react-flow__node-infra")).not.toBeNull());

test("the canvas is one tab stop: one wrapper has tabindex 0, the rest -1, and fold buttons and badges are not tab stops", async () => {
  const p = baseProps();
  const { container } = render(ui(p));
  await ready(container);
  expect(stops(container)).toHaveLength(1);
  expect(stops(container)[0]).toHaveClass("react-flow__node-infra");
  for (const w of wrappers(container)) if (w.getAttribute("tabindex") !== "0") expect(w).toHaveAttribute("tabindex", "-1");
  for (const b of container.querySelectorAll(".group__toggle, button.node__badge")) expect(b).toHaveAttribute("tabindex", "-1");
});

test("the selected node is the tab stop", async () => {
  const p = baseProps();
  p.options = { ...p.options, selectedId: "was-1" };
  const { container } = render(ui(p));
  await ready(container);
  expect(stops(container).map((w) => w.dataset.id)).toEqual(["was-1"]);
});

test("arrows move focus between items and the focused item becomes the tab stop; Home/End reach the ends", async () => {
  const p = baseProps();
  const { container } = render(ui(p));
  await ready(container);
  const first = stops(container)[0];
  first.focus();
  const ev = new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true });
  first.dispatchEvent(ev);
  expect(ev.defaultPrevented).toBe(true); // 페이지가 스크롤되지 않는다
  const moved = document.activeElement as HTMLElement;
  expect(moved).not.toBe(first);
  expect(moved).toHaveClass("react-flow__node");
  await waitFor(() => expect(stops(container)).toEqual([moved]));
  fireEvent.keyDown(moved, { key: "End" });
  const last = document.activeElement as HTMLElement;
  fireEvent.keyDown(last, { key: "Home" });
  const home = document.activeElement as HTMLElement;
  expect(home).not.toBe(last);
  expect(p.onSelect).not.toHaveBeenCalled();
  expect(p.onPinnedChange).not.toHaveBeenCalled();
});

test("in edit mode arrows move focus from an unselected node, and move only the selected node", async () => {
  const p = { ...baseProps(), editMode: true };
  p.options = { ...p.options, selectedId: "was-1" };
  const { container } = render(ui(p));
  await ready(container);
  const other = wrappers(container).find((w) => w.classList.contains("react-flow__node-infra") && w.dataset.id !== "was-1")!;
  other.focus();
  const before = other.style.transform;
  // 어느 쪽이든 옆에 무언가 있는 방향으로: 포커스만 옮겨 가고 노드는 그대로다.
  for (const key of ["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"]) if (document.activeElement === other) fireEvent.keyDown(other, { key });
  expect(other.style.transform).toBe(before);
  expect(document.activeElement).not.toBe(other);
  const sel = wrappers(container).find((w) => w.dataset.id === "was-1")!;
  sel.focus();
  const at = sel.style.transform;
  fireEvent.keyDown(sel, { key: "ArrowRight" });
  await waitFor(() => expect(sel.style.transform).not.toBe(at));
  expect(document.activeElement).toBe(sel);
});

test("zones are named and described; Space folds the focused zone, Enter still clears the selection", async () => {
  const p = baseProps();
  p.options = { ...p.options, selectedId: "was-1" };
  const { container } = render(ui(p));
  await ready(container);
  const zone = container.querySelector<HTMLElement>('.react-flow__node-zone[data-id="was-pair"]')!;
  const label = p.state.groups["was-pair"].label;
  expect(zone).toHaveAttribute("aria-label", label);
  expect(document.getElementById(zone.getAttribute("aria-describedby")!)?.textContent).toMatch(/^영역입니다\. Space 로 접고, Enter 로 선택을 풉니다\./);
  expect(zone.querySelector(".group__toggle")).toHaveAccessibleName(`${label} 접기`);
  zone.focus();
  const space = new KeyboardEvent("keydown", { key: " ", bubbles: true, cancelable: true });
  zone.dispatchEvent(space);
  expect(space.defaultPrevented).toBe(true);
  expect(p.onOptionsChange).toHaveBeenCalledWith(expect.objectContaining({ collapsed: new Set([...p.options.collapsed, "was-pair"]) }));
  expect(p.onSelect).not.toHaveBeenCalled();
  fireEvent.keyDown(zone, { key: "Enter" });
  expect(p.onSelect).toHaveBeenCalledWith(null);
});
