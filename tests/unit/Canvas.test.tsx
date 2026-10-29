import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, expect, test, vi } from "vitest";

import * as layoutMod from "@/canvas/layout";
import { Canvas, type CanvasOptions, type CanvasProps } from "@/canvas/Canvas";
import { defaultDisplayOptions } from "@/canvas/display";
import { emptyState } from "@/domain/types";

import { fx } from "../fixtures/spike";

beforeAll(() => {
  class RO {
    constructor(private cb: ResizeObserverCallback) {}
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal("ResizeObserver", RO);
  class DM {
    m22 = 1;
    
  }
  vi.stubGlobal("DOMMatrixReadOnly", DM);
  vi.stubGlobal("DOMMatrix", DM);
});
afterEach(cleanup);

vi.mock("@/canvas/layout", async (orig) => {
  const m = await orig<typeof import("@/canvas/layout")>();
  return { ...m, layoutDiagram: vi.fn(m.layoutDiagram) };
});

const baseProps = (state = fx("s2")): CanvasProps => {
  const options: CanvasOptions = { ...defaultDisplayOptions(state), hoverLabels: true };
  return {
    state, pinned: {}, editMode: false, options, motion: false,
    onOptionsChange: vi.fn(), onSelect: vi.fn(), onPinnedChange: vi.fn(), onAutoArrange: vi.fn(),
    onEditModeChange: vi.fn(), onMotionChange: vi.fn(),
  };
};

test("renders a node per displayed node and selects on click", async () => {
  const props = baseProps();
  const { container } = render(<div style={{ width: 800, height: 600 }}><Canvas {...props} /></div>);
  await waitFor(() => expect(container.querySelectorAll(".react-flow__node-infra").length).toBeGreaterThan(0));
  const first = container.querySelector(".react-flow__node-infra") as HTMLElement;
  fireEvent.click(first);
  expect(props.onSelect).toHaveBeenCalledWith(first.getAttribute("data-id"));
});

test("empty diagram shows guidance", () => {
  render(<Canvas {...baseProps(emptyState())} />);
  expect(screen.getByText(/아직 구성도가 비어 있어요/)).toBeInTheDocument();
});

test("toolbar: auto-arrange only in edit mode, cleanup toggle updates options", () => {
  const props = baseProps(emptyState());
  const { rerender } = render(<Canvas {...props} />);
  expect(screen.getByRole("button", { name: "자동 정렬" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "보조 연결 숨김" }));
  expect(props.onOptionsChange).toHaveBeenCalledWith(expect.objectContaining({ hideAux: false }));
  rerender(<Canvas {...props} editMode />);
  fireEvent.click(screen.getByRole("button", { name: "자동 정렬" }));
  expect(props.onAutoArrange).toHaveBeenCalled();
});

test("selecting a node inside a collapsed group highlights the group and keeps its neighbours undimmed", async () => {
  const state = fx("s2");
  const props = baseProps(state);
  props.options = { ...props.options, collapsed: new Set(["was-pair"]), selectedId: "was-1" };
  const { container } = render(<div style={{ width: 800, height: 600 }}><Canvas {...props} /></div>);
  await waitFor(() => expect(container.querySelector('.react-flow__node-zone[data-id="was-pair"] .group--selected')).not.toBeNull());
  expect(container.querySelector('.react-flow__node[data-id="web-1"] .node--dimmed')).toBeNull();
  expect(container.querySelector('.react-flow__node[data-id="db-proxy"] .node--dimmed')).toBeNull();
});

test("a rejected layout shows a message instead of a blank canvas", async () => {
  vi.mocked(layoutMod.layoutDiagram).mockRejectedValueOnce(new Error("elk"));
  vi.spyOn(console, "error").mockImplementation(() => {});
  render(<div style={{ width: 800, height: 600 }}><Canvas {...baseProps()} /></div>);
  expect(await screen.findByText("구성도를 배치하지 못했어요. 새로고침하거나 구성을 다시 확인해 주세요.")).toBeInTheDocument();
});
