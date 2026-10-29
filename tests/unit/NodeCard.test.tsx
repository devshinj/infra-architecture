import "@testing-library/jest-dom/vitest";
import { ReactFlowProvider } from "@xyflow/react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

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
  wrap(<NodeCard data={{ label: "DB", fullLabel: "DB", category: "data", state: "normal", badge: { kind: "missing", count: 3 } }} {...rfProps} />);
  expect(screen.getByText("3")).toBeInTheDocument();
});

test("badge is a button with an accessible label", () => {
  const onBadgeClick = vi.fn();
  wrap(<NodeCard data={{ label: "DB", fullLabel: "DB", category: "data", state: "normal", badge: { kind: "missing", count: 3 }, onBadgeClick }} {...rfProps} />);
  const btn = screen.getByRole("button", { name: "빠진 정보 3개" });
  fireEvent.click(btn);
  expect(onBadgeClick).toHaveBeenCalledOnce();
});

test("warn badge shows exclamation, az shown next to sub", () => {
  wrap(<NodeCard data={{ label: "A", fullLabel: "A", sub: "10.0.0.1", category: "compute", state: "updated", badge: { kind: "warn" }, az: "a" }} {...rfProps} />);
  expect(screen.getByText("!")).toBeInTheDocument();
  expect(screen.getByText("AZ a")).toBeInTheDocument();
  expect(screen.getByTitle("A")).toHaveClass("node--updated");
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
