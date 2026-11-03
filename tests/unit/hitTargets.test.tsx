import "@testing-library/jest-dom/vitest";
import { cleanup, render, waitFor } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeAll, expect, test, vi } from "vitest";

import { Canvas, type CanvasOptions, type CanvasProps } from "@/canvas/Canvas";
import { defaultDisplayOptions } from "@/canvas/display";
import { NodeCard } from "@/canvas/NodeCard";

import { fx } from "../fixtures/spike";
import { rfProps } from "./rfProps";

beforeAll(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  class DM { m22 = 1; }
  vi.stubGlobal("DOMMatrixReadOnly", DM);
  vi.stubGlobal("DOMMatrix", DM);
});
afterEach(cleanup);

const css = () => readFileSync(join(process.cwd(), "src/canvas/canvas.css"), "utf8");

test("fold buttons and badges get an invisible hit area of at least 24 screen px, counter-scaled by the canvas zoom", () => {
  const c = css();
  expect(c).toContain(".group__toggle, button.node__badge { --hit: max(100%, calc(24px / var(--zoom, 1))); }");
  expect(c).toMatch(/\.group__toggle::before, button\.node__badge::before \{\s*content: ""; position: absolute;[^}]*width: var\(--hit\); height: var\(--hit\);/);
  // 보이는 모양은 그대로: 배지 16px, 접기 단추의 글자·테두리 규칙은 바뀌지 않는다.
  expect(c).toMatch(/\.node__badge \{[^}]*width: 16px;\s*height: 16px;/);
  // 접기 단추가 ::before 의 기준이 된다.
  expect(c).toMatch(/\.group__toggle \{\s*position: relative;/);
});

test("paired badges widen only outward from the line between them, so their hit areas never overlap", () => {
  const c = css();
  expect(c).toContain("button.node__badge--pair::before { left: auto; right: -1px; transform: none; }");
  expect(c).toContain("button.node__badge--pair-end::before { left: -1px; transform: none; }");
  render(<NodeCard data={{ label: "A", fullLabel: "A", category: "compute", state: "normal", badges: { missing: 2, warn: 1 } }} {...rfProps} />);
  expect(document.querySelector(".node__badge--warn")).toHaveClass("node__badge--pair");
  expect(document.querySelector(".node__badge--missing")).toHaveClass("node__badge--pair-end");
  cleanup();
  render(<NodeCard data={{ label: "A", fullLabel: "A", category: "compute", state: "normal", badges: { missing: 2 } }} {...rfProps} />);
  expect(document.querySelector(".node__badge--missing")).not.toHaveClass("node__badge--pair-end");
});

test("the flow wrapper carries the current zoom as --zoom", async () => {
  const state = fx("s2");
  const options: CanvasOptions = { ...defaultDisplayOptions(state), hoverLabels: true, showMissingBadges: false };
  const props: CanvasProps = {
    state, pinned: {}, editMode: false, options, motion: false,
    onOptionsChange: vi.fn(), onSelect: vi.fn(), onPinnedChange: vi.fn(), onAutoArrange: vi.fn(), onEditModeChange: vi.fn(), onMotionChange: vi.fn(),
  };
  const { container } = render(<div style={{ width: 800, height: 600 }}><Canvas {...props} /></div>);
  // React Flow 뷰포트의 scale 과 같은 값.
  await waitFor(() => {
    const zoom = (container.querySelector(".canvas__flow") as HTMLElement | null)?.style.getPropertyValue("--zoom");
    const scale = /scale\(([\d.e-]+)\)/.exec((container.querySelector(".react-flow__viewport") as HTMLElement | null)?.style.transform ?? "")?.[1];
    expect(zoom).toBeTruthy();
    expect(Number(zoom)).toBeCloseTo(Number(scale), 6);
  });
});
