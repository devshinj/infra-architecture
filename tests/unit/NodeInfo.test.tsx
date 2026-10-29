import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";

import { NodeInfo } from "@/ui/NodeInfo";

import { fx } from "../fixtures/spike";

afterEach(cleanup);

test("NodeInfo shows missing values as 미입력 and connected node chips", async () => {
  const s = fx("s2");
  const onSelect = vi.fn();
  render(<NodeInfo state={s} selectedId="was-1" onSelect={onSelect} />);
  expect(screen.getAllByText("미입력").length).toBeGreaterThan(0);
  await userEvent.click(screen.getByRole("button", { name: /DB 중계/ }));
  expect(onSelect).toHaveBeenCalledWith(expect.stringMatching(/proxy/));
});

test("NodeInfo shows the Korean kind name and relation direction", () => {
  render(<NodeInfo state={fx("s2")} selectedId="was-1" onSelect={vi.fn()} />);
  expect(screen.getByText("WAS", { selector: "[data-testid=kind]" })).toBeInTheDocument();
  expect(screen.getAllByText(/← 동기 요청 · HTTP\/AJP/)).toHaveLength(2);
  expect(screen.getByText(/→ 동기 요청 · TCP 1521/)).toBeInTheDocument();
});

test("NodeInfo shows an edge's kind, ends and label", () => {
  render(<NodeInfo state={fx("s2")} selectedId="e-was-1-db-proxy" onSelect={vi.fn()} />);
  expect(screen.getByText("동기 요청")).toBeInTheDocument();
  expect(screen.getByText("TCP 1521")).toBeInTheDocument();
});

test("NodeInfo copy-link button calls onMention for a node and a group, and is hidden for an edge", async () => {
  const s = fx("s2");
  const onMention = vi.fn();
  const { rerender } = render(<NodeInfo state={s} selectedId="was-1" onSelect={vi.fn()} onMention={onMention} />);
  await userEvent.click(screen.getByRole("button", { name: "노드 링크 복사" }));
  expect(onMention).toHaveBeenCalledWith("was-1");
  const groupId = Object.keys(s.groups)[0];
  if (groupId) {
    rerender(<NodeInfo state={s} selectedId={groupId} onSelect={vi.fn()} onMention={onMention} />);
    await userEvent.click(screen.getByRole("button", { name: "노드 링크 복사" }));
    expect(onMention).toHaveBeenLastCalledWith(groupId);
  }
  rerender(<NodeInfo state={s} selectedId="e-was-1-db-proxy" onSelect={vi.fn()} onMention={onMention} />);
  expect(screen.queryByRole("button", { name: "노드 링크 복사" })).not.toBeInTheDocument();
});

test("NodeInfo copy-link button is disabled when mentioning is off", () => {
  render(<NodeInfo state={fx("s2")} selectedId="was-1" onSelect={vi.fn()} onMention={vi.fn()} mentionDisabled />);
  expect(screen.getByRole("button", { name: "노드 링크 복사" })).toBeDisabled();
});

test("unknown attr shows 모름", () => {
  const s = fx("s2");
  s.nodes["was-1"] = { ...s.nodes["was-1"], attrs: { ...s.nodes["was-1"].attrs, ram: null }, unknown: ["ram"] };
  render(<NodeInfo state={s} selectedId="was-1" onSelect={vi.fn()} />);
  expect(screen.getByText("모름")).toBeInTheDocument();
});
