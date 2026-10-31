import "@testing-library/jest-dom/vitest";
import { ReactFlowProvider } from "@xyflow/react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { GroupBox } from "@/canvas/GroupBox";
import { NodeCard } from "@/canvas/NodeCard";

import { rfProps } from "./rfProps";

afterEach(cleanup);

const wrap = (ui: React.ReactElement) => render(<ReactFlowProvider>{ui}</ReactFlowProvider>);

test("selected node shows accent ring outside and full label in title", () => {
  wrap(<NodeCard data={{ label: "주문결제…", fullLabel: "주문결제통합서버", category: "compute", state: "selected" }} {...rfProps} />);
  const el = screen.getByTitle("주문결제통합서버");
  expect(el).toHaveClass("node--selected");
});

test("missing badge shows count", () => {
  wrap(<NodeCard data={{ label: "DB", fullLabel: "DB", category: "data", state: "normal", badges: { missing: 3 } }} {...rfProps} />);
  expect(screen.getByText("3")).toBeInTheDocument();
});

test("badge is a button with an accessible label", () => {
  const onBadgeClick = vi.fn();
  wrap(<NodeCard data={{ label: "DB", fullLabel: "DB", category: "data", state: "normal", badges: { missing: 3 }, onBadgeClick }} {...rfProps} />);
  const btn = screen.getByRole("button", { name: "빠진 정보 3개" });
  fireEvent.click(btn);
  expect(onBadgeClick).toHaveBeenCalledOnce();
});

test("badge button blocks RF drag/pan/keys and is keyboard activatable", async () => {
  const onBadgeClick = vi.fn();
  wrap(<NodeCard data={{ label: "DB", fullLabel: "DB", category: "data", state: "normal", badges: { missing: 2 }, onBadgeClick }} {...rfProps} />);
  const btn = screen.getByRole("button", { name: "빠진 정보 2개" });
  expect(btn).toHaveClass("nodrag", "nopan", "nokey");
  btn.focus();
  await userEvent.keyboard("{Enter}");
  expect(onBadgeClick).toHaveBeenCalledOnce();
});

test("warn badge shows exclamation, az shown next to sub", () => {
  wrap(<NodeCard data={{ label: "A", fullLabel: "A", sub: "10.0.0.1", category: "compute", state: "updated", badges: { warn: 1 }, az: "a" }} {...rfProps} />);
  expect(screen.getByText("!")).toBeInTheDocument();
  expect(screen.getByText("AZ a")).toBeInTheDocument();
  expect(screen.getByTitle("A")).toHaveClass("node--updated");
});

test("warn badge is a nodrag button with label", () => {
  const onWarnBadgeClick = vi.fn();
  wrap(<NodeCard data={{ label: "DB", fullLabel: "DB", category: "data", state: "normal", badges: { warn: 2 }, onWarnBadgeClick }} {...rfProps} />);
  const btn = screen.getByRole("button", { name: "경고 2개" });
  expect(btn).toHaveTextContent("!");
  expect(btn).toHaveClass("nodrag", "nopan", "nokey", "node__badge--warn");
  expect(btn).not.toHaveClass("node__badge--pair");
  fireEvent.click(btn);
  expect(onWarnBadgeClick).toHaveBeenCalledOnce();
});

test("collapsed group shows hidden count and expand action", () => {
  const onToggle = vi.fn();
  wrap(<GroupBox data={{ label: "내부 구역", groupKind: "subnet_private", collapsed: true, hiddenCount: 7, onToggle }} {...rfProps} />);
  const btn = screen.getByRole("button", { name: "펼치기 · 노드 7개" });
  expect(btn).toBeInTheDocument();
  fireEvent.click(btn);
  expect(onToggle).toHaveBeenCalledOnce();
});

test("expanded group shows fold button", () => {
  wrap(<GroupBox data={{ label: "VPC", groupKind: "vpc", collapsed: false, hiddenCount: 0, onToggle: vi.fn() }} {...rfProps} />);
  expect(screen.getByRole("button", { name: "접기" })).toBeInTheDocument();
});

test("node uses its category color variable on the card root", () => {
  wrap(<NodeCard data={{ label: "DB", fullLabel: "DB", category: "data", state: "normal" }} {...rfProps} />);
  expect(screen.getByTitle("DB").style.getPropertyValue("--cat")).toBe("var(--cat-data)");
});

test("group box exposes its tint token", () => {
  wrap(<GroupBox data={{ label: "VPC", groupKind: "vpc", collapsed: false, hiddenCount: 0, onToggle: () => {} }} {...rfProps} />);
  const box = document.querySelector("[data-group-kind='vpc']") as HTMLElement;
  expect(box.style.getPropertyValue("--tint")).toBe("var(--zone-tint-vpc)");
});

// ---- 잘린 이름 말풍선 (P3E Task 3) ----
const LONG = "결제승인처리배치서버클러스터";
const truncatedData = { label: "결제승인처리배치서…", fullLabel: LONG, category: "compute" as const, state: "normal" as const, truncated: true };
// 실제 화면처럼 React Flow 노드 래퍼(포커스를 받는 쪽) 안에 카드를 넣는다.
const inWrapper = (data: React.ComponentProps<typeof NodeCard>["data"], extra: Partial<typeof rfProps> = {}) => {
  render(
    <ReactFlowProvider>
      <div className="react-flow__node" tabIndex={0} data-testid="rf-wrapper">
        <NodeCard data={data} {...rfProps} {...extra} />
      </div>
    </ReactFlowProvider>,
  );
  return screen.getByTestId("rf-wrapper");
};
const hoverCard = () => fireEvent.mouseEnter(document.querySelector(".node") as HTMLElement);
const wait = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

describe("name tooltip", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  test("tooltip appears after 300ms only when truncated", () => {
    inWrapper(truncatedData);
    hoverCard();
    wait(299);
    expect(screen.queryByRole("tooltip")).toBeNull();
    wait(1);
    expect(screen.getByRole("tooltip")).toHaveTextContent(LONG);
    fireEvent.mouseLeave(document.querySelector(".node") as HTMLElement);
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  test("untruncated node never shows a tooltip", () => {
    inWrapper({ label: "DB", fullLabel: "DB", category: "data", state: "normal" });
    hoverCard();
    wait(1000);
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  test("sub-only truncation also shows tooltip with full sub", () => {
    inWrapper({ label: "API", fullLabel: "API", sub: "10.0.0.1, 10.0.0.…", fullSub: "10.0.0.1, 10.0.0.2, 10.0.0.3", category: "compute", state: "normal", truncated: true });
    hoverCard();
    wait(300);
    const tip = screen.getByRole("tooltip");
    expect(tip).toHaveTextContent("API");
    expect(tip).toHaveTextContent("10.0.0.1, 10.0.0.2, 10.0.0.3");
  });

  test("tooltip opens on keyboard focus of the node wrapper and closes on Esc", () => {
    const wrapper = inWrapper(truncatedData);
    fireEvent.focusIn(wrapper);
    wait(300);
    const tip = screen.getByRole("tooltip");
    expect(document.querySelector(".node")).toHaveAttribute("aria-describedby", tip.id);
    fireEvent.keyDown(wrapper, { key: "Escape" });
    expect(screen.queryByRole("tooltip")).toBeNull();
    // Esc 뒤 다시 포커스를 옮겨야 다시 뜬다.
    fireEvent.focusOut(wrapper);
    fireEvent.focusIn(wrapper);
    wait(300);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    fireEvent.focusOut(wrapper);
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  test("hover is cancelled when the pointer leaves before 300ms", () => {
    inWrapper(truncatedData);
    hoverCard();
    wait(200);
    fireEvent.mouseLeave(document.querySelector(".node") as HTMLElement);
    wait(500);
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  test("no tooltip while the node is being dragged", () => {
    inWrapper(truncatedData, { dragging: true });
    hoverCard();
    wait(500);
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  test("truncated node has no title attribute, untruncated keeps it", () => {
    inWrapper(truncatedData);
    expect(document.querySelector(".node")).not.toHaveAttribute("title");
    cleanup();
    inWrapper({ label: "DB", fullLabel: "DB", category: "data", state: "normal" });
    expect(document.querySelector(".node")).toHaveAttribute("title", "DB");
  });
});
