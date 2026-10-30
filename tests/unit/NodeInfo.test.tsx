import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";

import { emptyState } from "@/domain/types";
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

test("edge label marked 모름 shows 모름, not 미입력", () => {
  const s = fx("s2");
  s.edges["e-was-1-db-proxy"] = { ...s.edges["e-was-1-db-proxy"], label: undefined, unknown: ["label"] };
  render(<NodeInfo state={s} selectedId="e-was-1-db-proxy" onSelect={vi.fn()} />);
  expect(screen.getByText("모름")).toBeInTheDocument();
  expect(screen.queryByText("미입력")).not.toBeInTheDocument();
});

test("whitespace-only attr counts as empty like the badge does", () => {
  const s = fx("s2");
  s.nodes["was-1"] = { ...s.nodes["was-1"], attrs: { ...s.nodes["was-1"].attrs, ram: "   " }, unknown: ["ram"] };
  render(<NodeInfo state={s} selectedId="was-1" onSelect={vi.fn()} />);
  expect(screen.getByText("모름")).toBeInTheDocument();
});

const solo = (kind: string, attrs: Record<string, string>, unknown?: string[]) => ({
  ...emptyState(),
  nodes: { n1: { id: "n1", kind, label: "대상", parent: null, attrs, ...(unknown ? { unknown } : {}) } },
}) as never;

test("기타 정보 lists required keys outside the spec and server sections", () => {
  render(<NodeInfo state={solo("db_rdb", { version: "8.0" }, ["replication"])} selectedId="n1" onSelect={vi.fn()} />);
  const sec = screen.getByRole("heading", { name: "기타 정보" }).closest("section")!;
  expect(within(sec).getByText("복제 방식")).toBeInTheDocument();
  expect(within(sec).getByText("모름")).toBeInTheDocument();
  expect(within(sec).getByText("버전")).toBeInTheDocument();
  expect(within(sec).getByText("8.0")).toBeInTheDocument();
  expect(within(sec).queryByText("CPU")).not.toBeInTheDocument();
});

test("기타 정보 for a queue shows brokers and version as 미입력 when empty", () => {
  render(<NodeInfo state={solo("queue", {})} selectedId="n1" onSelect={vi.fn()} />);
  const sec = screen.getByRole("heading", { name: "기타 정보" }).closest("section")!;
  expect(within(sec).getByText("브로커 수")).toBeInTheDocument();
  expect(within(sec).getAllByText("미입력")).toHaveLength(2);
});

test("기타 정보 is omitted when every required key is already in the other sections", () => {
  render(<NodeInfo state={solo("web_server", {})} selectedId="n1" onSelect={vi.fn()} />);
  expect(screen.queryByRole("heading", { name: "기타 정보" })).not.toBeInTheDocument();
});
