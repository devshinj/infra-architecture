import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { PanelResizer } from "@/ui/PanelResizer";

afterEach(cleanup);

const setup = (width = 400) => {
  const onChange = vi.fn();
  render(<PanelResizer width={width} min={320} max={720} defaultWidth={360} onChange={onChange} />);
  return { onChange, sep: screen.getByRole("separator", { name: "대화 패널 너비" }) };
};

test("separator has aria values", () => {
  const { sep } = setup(400);
  expect(sep).toHaveAttribute("aria-orientation", "vertical");
  expect(sep).toHaveAttribute("aria-valuemin", "320");
  expect(sep).toHaveAttribute("aria-valuemax", "720");
  expect(sep).toHaveAttribute("aria-valuenow", "400");
  expect(sep).toHaveAttribute("tabindex", "0");
});

test("drag changes width within 320–720", () => {
  const { sep, onChange } = setup(400);
  fireEvent.pointerDown(sep, { clientX: 1000, pointerId: 1 });
  expect(document.body.style.userSelect).toBe("none");
  fireEvent.pointerMove(sep, { clientX: 950, pointerId: 1 });
  expect(onChange).toHaveBeenLastCalledWith(450); // 왼쪽으로 끌면 넓어진다
  fireEvent.pointerMove(sep, { clientX: 0, pointerId: 1 });
  expect(onChange).toHaveBeenLastCalledWith(720);
  fireEvent.pointerMove(sep, { clientX: 2000, pointerId: 1 });
  expect(onChange).toHaveBeenLastCalledWith(320);
  fireEvent.pointerUp(sep, { pointerId: 1 });
  expect(document.body.style.userSelect).toBe("");
  onChange.mockClear();
  fireEvent.pointerMove(sep, { clientX: 900, pointerId: 1 });
  expect(onChange).not.toHaveBeenCalled();
});

test("keyboard arrows step 16, shift 64, home/end", () => {
  const { sep, onChange } = setup(400);
  fireEvent.keyDown(sep, { key: "ArrowLeft" });
  expect(onChange).toHaveBeenLastCalledWith(416);
  fireEvent.keyDown(sep, { key: "ArrowRight" });
  expect(onChange).toHaveBeenLastCalledWith(384);
  fireEvent.keyDown(sep, { key: "ArrowLeft", shiftKey: true });
  expect(onChange).toHaveBeenLastCalledWith(464);
  fireEvent.keyDown(sep, { key: "ArrowRight", shiftKey: true });
  expect(onChange).toHaveBeenLastCalledWith(336);
  fireEvent.keyDown(sep, { key: "Home" });
  expect(onChange).toHaveBeenLastCalledWith(320);
  fireEvent.keyDown(sep, { key: "End" });
  expect(onChange).toHaveBeenLastCalledWith(720);
});

test("double click resets", () => {
  const { sep, onChange } = setup(500);
  fireEvent.doubleClick(sep);
  expect(onChange).toHaveBeenLastCalledWith(360);
});
