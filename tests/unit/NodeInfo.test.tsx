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

const risky = (o: { ignored?: string[] } = {}) => ({
  ...emptyState(),
  nodes: {
    c: { id: "c", kind: "client_web", label: "사용자", parent: null, attrs: {} },
    w: { id: "w", kind: "web_server", label: "웹", parent: null, attrs: {} },
  },
  edges: { e1: { id: "e1", from: "c", to: "w", edgeKind: "request" } },
  warnings: [{ id: "db_exposed:w", rule: "db_exposed", nodeId: "w", level: "check", text: "외부에서 보일 수 있어요.", guide: "내부에 두세요." }],
  ...(o.ignored ? { ignoredWarnings: o.ignored } : {}),
}) as never;

const cautionSection = () => screen.getByRole("heading", { name: "주의할 점" }).closest("section")!;

test("주의할 점 lists text, guide and level", () => {
  render(<NodeInfo state={risky()} selectedId="w" onSelect={vi.fn()} />);
  const sec = cautionSection();
  expect(within(sec).getByText("웹이(가) 1대뿐이라 멈추면 서비스도 멈춰요.")).toBeInTheDocument();
  expect(within(sec).getByText("같은 역할 서버를 2대 이상 두고 이중화 묶음(VIP)으로 묶으세요.")).toBeInTheDocument();
  expect(within(sec).getByText("외부에서 보일 수 있어요.")).toBeInTheDocument();
  expect(within(sec).getAllByText("경고")).toHaveLength(2); // spof, no_firewall
  expect(within(sec).getAllByText("확인 필요")).toHaveLength(1);
  // 콜백이 없으면(이력 보기 등) 버튼을 숨긴다.
  expect(within(sec).queryByRole("button", { name: "의도된 구성" })).not.toBeInTheDocument();
});

test("no 주의할 점 section without warnings", () => {
  render(<NodeInfo state={risky()} selectedId="c" onSelect={vi.fn()} />);
  expect(screen.queryByRole("heading", { name: "주의할 점" })).not.toBeInTheDocument();
});

test("의도된 구성 calls onIgnoreWarning(id, true)", async () => {
  const onIgnoreWarning = vi.fn();
  render(<NodeInfo state={risky()} selectedId="w" onSelect={vi.fn()} onIgnoreWarning={onIgnoreWarning} />);
  const item = screen.getByText("웹이(가) 1대뿐이라 멈추면 서비스도 멈춰요.").closest("li")!;
  await userEvent.click(within(item).getByRole("button", { name: "의도된 구성" }));
  expect(onIgnoreWarning).toHaveBeenCalledWith("spof:w", true);
});

test("ignore buttons are disabled while busy and an error is shown as an alert", () => {
  render(<NodeInfo state={risky()} selectedId="w" onSelect={vi.fn()} onIgnoreWarning={vi.fn()} ignoreDisabled ignoreError="경고를 찾을 수 없어요" />);
  for (const b of screen.getAllByRole("button", { name: "의도된 구성" })) expect(b).toBeDisabled();
  expect(screen.getByRole("alert")).toHaveTextContent("경고를 찾을 수 없어요");
});

test("ignored list shows 다시 경고", async () => {
  const onIgnoreWarning = vi.fn();
  render(<NodeInfo state={risky({ ignored: ["spof:w"] })} selectedId="w" onSelect={vi.fn()} onIgnoreWarning={onIgnoreWarning} />);
  const sec = cautionSection();
  const sub = within(sec).getByRole("heading", { name: "의도된 구성으로 표시함" });
  const ignoredList = sub.nextElementSibling as HTMLElement;
  expect(within(ignoredList).getByText("웹이(가) 1대뿐이라 멈추면 서비스도 멈춰요.")).toBeInTheDocument();
  await userEvent.click(within(ignoredList).getByRole("button", { name: "다시 경고" }));
  expect(onIgnoreWarning).toHaveBeenCalledWith("spof:w", false);
  expect(within(sec).getAllByRole("button", { name: "의도된 구성" })).toHaveLength(2);
});

test("edge selection shows its warning", () => {
  render(<NodeInfo state={risky()} selectedId="e1" onSelect={vi.fn()} onIgnoreWarning={vi.fn()} />);
  const sec = cautionSection();
  expect(within(sec).getByText("사용자에서 웹(으)로 바로 들어와요.")).toBeInTheDocument();
  expect(within(sec).queryByText(/1대뿐/)).not.toBeInTheDocument();
  expect(within(sec).getByRole("button", { name: "의도된 구성" })).toBeInTheDocument();
});

test("warningState (compare view) decides 주의할 점 instead of the drawn state", () => {
  const cur = { ...emptyState(), nodes: { w: { id: "w", kind: "web_server", label: "웹", parent: null, attrs: {} } }, ignoredWarnings: ["spof:w"] } as never;
  render(<NodeInfo state={risky()} warningState={cur} selectedId="w" onSelect={vi.fn()} />);
  const sec = cautionSection();
  expect(within(sec).getByRole("heading", { name: "의도된 구성으로 표시함" })).toBeInTheDocument();
  expect(within(sec).queryByText("외부에서 보일 수 있어요.")).not.toBeInTheDocument();
  expect(within(sec).queryByText("경고")).not.toBeInTheDocument();
});

test("NodeInfo forwards explain: node explanation precedes 스펙 and 주의할 점, edge shows edge slots", () => {
  const { container, rerender } = render(<NodeInfo state={fx("s2")} selectedId="was-1" onSelect={vi.fn()} explain={{ status: "loading", terms: [] }} />);
  const heads = [...container.querySelectorAll("h3")].map((h) => h.textContent);
  expect(heads.indexOf("정의")).toBeGreaterThanOrEqual(0);
  expect(heads.indexOf("정의")).toBeLessThan(heads.indexOf("스펙 · SW"));
  expect(heads).not.toContain("주의할 점");
  rerender(<NodeInfo state={fx("s2")} selectedId="e-was-1-db-proxy" onSelect={vi.fn()} explain={{ status: "loading", terms: [] }} />);
  expect(screen.getByText("방화벽 규칙")).toBeInTheDocument();
});

test("explanation precedes 주의할 점 when warnings exist", () => {
  const { container } = render(<NodeInfo state={risky()} selectedId="w" onSelect={vi.fn()} explain={{ status: "loading", terms: [] }} />);
  const heads = [...container.querySelectorAll("h3")].map((h) => h.textContent);
  expect(heads).toContain("주의할 점");
  expect(heads.indexOf("결정 기록(ADR)")).toBeLessThan(heads.indexOf("주의할 점"));
});
