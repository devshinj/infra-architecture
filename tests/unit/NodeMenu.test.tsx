import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, expect, test, vi } from "vitest";

import { Canvas, type CanvasOptions, type CanvasProps } from "@/canvas/Canvas";
import { defaultDisplayOptions } from "@/canvas/display";
import { NodeMenu } from "@/canvas/NodeMenu";

import { fx } from "../fixtures/spike";

beforeAll(() => {
  class RO {
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

test("menu item is focused on open and choosing it calls onChoose then onClose", async () => {
  const onChoose = vi.fn();
  const onClose = vi.fn();
  render(<NodeMenu x={10} y={20} onChoose={onChoose} onClose={onClose} />);
  const item = screen.getByRole("menuitem", { name: "대화에 참조 붙이기" });
  expect(item).toHaveFocus();
  await userEvent.keyboard("{Enter}");
  expect(onChoose).toHaveBeenCalledTimes(1);
  expect(onClose).toHaveBeenCalled();
});

test("has 이 노드에 대해 물어보기 item that calls onAsk, and it can be disabled", async () => {
  const onAsk = vi.fn();
  const { rerender } = render(<NodeMenu x={0} y={0} onChoose={vi.fn()} onAsk={onAsk} onClose={vi.fn()} />);
  await userEvent.keyboard("{ArrowDown}{Enter}");
  expect(onAsk).toHaveBeenCalledTimes(1);
  rerender(<NodeMenu x={0} y={0} onChoose={vi.fn()} onAsk={onAsk} askDisabled askReason="막힘" onClose={vi.fn()} />);
  expect(screen.getByRole("menuitem", { name: "이 노드에 대해 물어보기" })).toBeDisabled();
});

test("no ask item without onAsk", () => {
  render(<NodeMenu x={0} y={0} onChoose={vi.fn()} onClose={vi.fn()} />);
  expect(screen.queryByRole("menuitem", { name: "이 노드에 대해 물어보기" })).not.toBeInTheDocument();
});

test("Escape closes the menu", async () => {
  const onClose = vi.fn();
  render(<NodeMenu x={0} y={0} onChoose={vi.fn()} onClose={onClose} />);
  await userEvent.keyboard("{Escape}");
  expect(onClose).toHaveBeenCalled();
});

test("clicking outside closes the menu", () => {
  const onClose = vi.fn();
  render(<div><button>밖</button><NodeMenu x={0} y={0} onChoose={vi.fn()} onClose={onClose} /></div>);
  fireEvent.pointerDown(screen.getByText("밖"));
  expect(onClose).toHaveBeenCalled();
});

const baseProps = (): CanvasProps => {
  const state = fx("s2");
  const options: CanvasOptions = { ...defaultDisplayOptions(state), hoverLabels: true, showMissingBadges: false };
  return {
    state, pinned: {}, editMode: false, options, motion: false,
    onOptionsChange: vi.fn(), onSelect: vi.fn(), onPinnedChange: vi.fn(), onAutoArrange: vi.fn(),
    onEditModeChange: vi.fn(), onMotionChange: vi.fn(),
  };
};

test("context menu item calls onMention with the node id", async () => {
  const onMention = vi.fn();
  const { container } = render(<div style={{ width: 800, height: 600 }}><Canvas {...baseProps()} onMention={onMention} /></div>);
  await waitFor(() => expect(container.querySelectorAll(".react-flow__node-infra").length).toBeGreaterThan(0));
  const node = container.querySelector(".react-flow__node-infra") as HTMLElement;
  fireEvent.contextMenu(node);
  await userEvent.click(await screen.findByRole("menuitem", { name: "대화에 참조 붙이기" }));
  expect(onMention).toHaveBeenCalledWith(node.getAttribute("data-id"));
  expect(screen.queryByRole("menu")).not.toBeInTheDocument();
});

test("no menu when onMention is not given", async () => {
  const { container } = render(<div style={{ width: 800, height: 600 }}><Canvas {...baseProps()} /></div>);
  await waitFor(() => expect(container.querySelectorAll(".react-flow__node-infra").length).toBeGreaterThan(0));
  fireEvent.contextMenu(container.querySelector(".react-flow__node-infra") as HTMLElement);
  expect(screen.queryByRole("menu")).not.toBeInTheDocument();
});

test("context menu ask item calls onAskNode with the node id", async () => {
  const onAskNode = vi.fn();
  const { container } = render(<div style={{ width: 800, height: 600 }}><Canvas {...baseProps()} onMention={vi.fn()} onAskNode={onAskNode} /></div>);
  await waitFor(() => expect(container.querySelectorAll(".react-flow__node-infra").length).toBeGreaterThan(0));
  const node = container.querySelector(".react-flow__node-infra") as HTMLElement;
  fireEvent.contextMenu(node);
  await userEvent.click(await screen.findByRole("menuitem", { name: "이 노드에 대해 물어보기" }));
  expect(onAskNode).toHaveBeenCalledWith(node.getAttribute("data-id"));
});
