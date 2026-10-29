import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, expect, test, vi } from "vitest";

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
