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
  expect(screen.getByRole("menuitem", { name: "이 노드에 대해 물어보기" })).toHaveAttribute("aria-disabled", "true");
});

test("disabled ask item stays in the arrow-key order, is described by its reason and does nothing when activated", async () => {
  const onAsk = vi.fn();
  const onClose = vi.fn();
  render(<NodeMenu x={0} y={0} onChoose={vi.fn()} onAsk={onAsk} askDisabled askReason="다른 대화가 답하는 중이에요." onClose={onClose} />);
  await userEvent.keyboard("{ArrowDown}");
  const item = screen.getByRole("menuitem", { name: "이 노드에 대해 물어보기" });
  expect(item).toHaveFocus();
  expect(item).not.toBeDisabled();
  expect(item).toHaveAccessibleDescription("다른 대화가 답하는 중이에요.");
  await userEvent.keyboard("{Enter}");
  await userEvent.click(item);
  expect(onAsk).not.toHaveBeenCalled();
  expect(onClose).not.toHaveBeenCalled();
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

test("ArrowUp wraps, ArrowDown wraps, and a disabled item is still reachable", async () => {
  const { rerender } = render(<NodeMenu x={0} y={0} onChoose={vi.fn()} onAsk={vi.fn()} onClose={vi.fn()} />);
  const [first, second] = screen.getAllByRole("menuitem");
  expect(first).toHaveFocus();
  await userEvent.keyboard("{ArrowUp}");
  expect(second).toHaveFocus();
  await userEvent.keyboard("{ArrowDown}");
  expect(first).toHaveFocus();
  rerender(<NodeMenu x={0} y={0} onChoose={vi.fn()} onAsk={vi.fn()} askDisabled onClose={vi.fn()} />);
  await userEvent.keyboard("{ArrowDown}");
  expect(second).toHaveFocus();
});

test("zones get no ask item in the canvas menu", async () => {
  const { container } = render(<div style={{ width: 800, height: 600 }}><Canvas {...baseProps()} onMention={vi.fn()} onAskNode={vi.fn()} /></div>);
  const zone = await waitFor(() => {
    const z = container.querySelector(".react-flow__node-zone");
    expect(z).not.toBeNull();
    return z as HTMLElement;
  });
  fireEvent.contextMenu(zone);
  expect(await screen.findByRole("menuitem", { name: "대화에 참조 붙이기" })).toBeInTheDocument();
  expect(screen.queryByRole("menuitem", { name: "이 노드에 대해 물어보기" })).not.toBeInTheDocument();
});

test("the hidden reason is not a child of the menu", () => {
  render(<NodeMenu x={0} y={0} onChoose={vi.fn()} onAsk={vi.fn()} askDisabled askReason="막힘" onClose={vi.fn()} />);
  const menu = screen.getByRole("menu");
  expect(menu.querySelector(".node-menu__reason")).toBeNull();
  expect(screen.getByRole("menuitem", { name: "이 노드에 대해 물어보기" })).toHaveAccessibleDescription("막힘");
});
