import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";

import { confirmLinkGuessAction, rejectLinkGuessAction } from "@/app/(app)/actions";
import { type DiagramState, emptyState } from "@/domain/types";
import { NodeInfo } from "@/ui/NodeInfo";
import { NetworkKnowledgeProvider } from "@/ui/network/NetworkKnowledgeContext";

import { fx } from "../fixtures/spike";

vi.mock("@/app/(app)/actions", () => ({
  confirmLinkGuessAction: vi.fn(async () => ({ ok: true, number: 5 })),
  rejectLinkGuessAction: vi.fn(async () => ({ ok: true, number: 6, partial: false })),
}));

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

const named = (kind: string, label: string, attrs: Record<string, string>) => ({
  ...emptyState(),
  nodes: { n1: { id: "n1", kind, label, parent: null, attrs } },
}) as never;

test("관리형 노드는 비어 있는 서버 칸(CPU·RAM·IP 등)과 AZ 를 미입력으로 늘어놓지 않고 운영 정보로 보인다", () => {
  render(<NodeInfo state={named("db_rdb", "주문 DB", { managed: "yes", sw: "MySQL", multi_az: "yes" })} selectedId="n1" onSelect={vi.fn()} />);
  for (const label of ["CPU", "RAM", "디스크", "OS", "호스트명", "IP", "VIP", "AZ"]) expect(screen.queryByText(label)).not.toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "서버 정보" })).not.toBeInTheDocument();
  const sec = screen.getByRole("heading", { name: "운영 정보" }).closest("section")!;
  expect(within(sec).getByText("클라우드 관리형")).toBeInTheDocument();
  expect(within(sec).queryByText(/이름으로 판단/)).not.toBeInTheDocument();
  expect(within(sec).getByText("Multi-AZ")).toBeInTheDocument();
  expect(within(sec).getByText("예")).toBeInTheDocument();
  expect(screen.getByText("MySQL")).toBeInTheDocument();
});

test("관리형 노드라도 적힌 서버 칸은 보이고, Multi-AZ 가 비어 있으면 미입력이다", () => {
  render(<NodeInfo state={named("cache", "캐시", { managed: "yes", az: "2a" })} selectedId="n1" onSelect={vi.fn()} />);
  const sec = screen.getByRole("heading", { name: "운영 정보" }).closest("section")!;
  expect(within(sec).getByText("2a")).toBeInTheDocument();
  const multi = within(sec).getByText("Multi-AZ").closest("div")!;
  expect(within(multi).getByText("미입력")).toBeInTheDocument();
});

test("관리형 칸이 없으면 제품명으로 알아보고 그렇다고 밝힌다; 아니오면 서버로 본다", () => {
  const { rerender } = render(<NodeInfo state={named("lb_l7", "ALB", {})} selectedId="n1" onSelect={vi.fn()} />);
  const sec = screen.getByRole("heading", { name: "운영 정보" }).closest("section")!;
  expect(within(sec).getByText(/이름으로 판단/)).toBeInTheDocument();
  expect(within(sec).queryByText("Multi-AZ")).not.toBeInTheDocument();
  expect(screen.queryByText("CPU")).not.toBeInTheDocument();
  // 관리형 LB 는 SW 를 묻지 않으므로 빈 SW 줄과 스펙 절이 없다. 묻는 칸(포트·방화벽 규칙)은 비어 있으면 미입력이다.
  expect(screen.queryByRole("heading", { name: "스펙 · SW" })).not.toBeInTheDocument();
  expect(within(screen.getByRole("heading", { name: "기타 정보" }).closest("section")!).getAllByText("미입력")).toHaveLength(2);
  rerender(<NodeInfo state={named("lb_l7", "ALB", { managed: "no" })} selectedId="n1" onSelect={vi.fn()} />);
  expect(screen.getByRole("heading", { name: "서버 정보" })).toBeInTheDocument();
  expect(screen.getByText("CPU")).toBeInTheDocument();
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
  expect(within(sec).getByText("웹이 1대뿐이라 멈추면 서비스도 멈춰요.")).toBeInTheDocument();
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
  const item = screen.getByText("웹이 1대뿐이라 멈추면 서비스도 멈춰요.").closest("li")!;
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
  expect(within(ignoredList).getByText("웹이 1대뿐이라 멈추면 서비스도 멈춰요.")).toBeInTheDocument();
  await userEvent.click(within(ignoredList).getByRole("button", { name: "다시 경고" }));
  expect(onIgnoreWarning).toHaveBeenCalledWith("spof:w", false);
  expect(within(sec).getAllByRole("button", { name: "의도된 구성" })).toHaveLength(2);
});

test("edge selection shows its warning", () => {
  render(<NodeInfo state={risky()} selectedId="e1" onSelect={vi.fn()} onIgnoreWarning={vi.fn()} />);
  const sec = cautionSection();
  expect(within(sec).getByText("사용자에서 웹으로 바로 들어와요.")).toBeInTheDocument();
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
  expect(heads.indexOf("왜 이렇게 짰나요")).toBeLessThan(heads.indexOf("주의할 점"));
});

test("edge info shows 전달물 API and 방향 양방향", () => {
  const s = fx("s2");
  s.edges["e-was-1-db-proxy"] = { ...s.edges["e-was-1-db-proxy"], payload: "api", direction: "two_way" };
  render(<NodeInfo state={s} selectedId="e-was-1-db-proxy" onSelect={vi.fn()} />);
  expect(screen.getByText("전달물")).toBeInTheDocument();
  expect(screen.getByText("API")).toBeInTheDocument();
  expect(screen.getByText("방향")).toBeInTheDocument();
  expect(screen.getByText("양방향")).toBeInTheDocument();
});

test("lists flows through node and click activates", async () => {
  const s = fx("s2");
  const through = { id: "db", name: "DB 조회", origin: "system" as const, steps: [{ edge: "e-was-1-db-proxy", from: "was-1", short: "조회", text: "조회해요" }] };
  // 지금 구성에 없는 연결만 가진 흐름은 지나는 흐름으로 치지 않는다.
  const broken = { id: "gone", name: "끊긴 흐름", origin: "user" as const, steps: [{ edge: "nope", from: "was-1", short: "x", text: "x" }] };
  const onOpen = vi.fn();
  const { rerender } = render(<NodeInfo state={s} selectedId="was-1" onSelect={vi.fn()} flows={{ list: [through, broken], onOpen }} />);
  const section = screen.getByRole("region", { name: "이 노드를 지나는 흐름" });
  expect(within(section).queryByRole("button", { name: "끊긴 흐름" })).not.toBeInTheDocument();
  await userEvent.click(within(section).getByRole("button", { name: "DB 조회" }));
  expect(onOpen).toHaveBeenCalledWith("db");
  rerender(<NodeInfo state={s} selectedId="e-was-1-db-proxy" onSelect={vi.fn()} flows={{ list: [through, broken], onOpen }} />);
  expect(within(screen.getByRole("region", { name: "이 연결이 들어간 흐름" })).getByRole("button", { name: "DB 조회" })).toBeInTheDocument();
  // 지나는 흐름이 없으면 절이 없다.
  rerender(<NodeInfo state={s} selectedId="was-1" onSelect={vi.fn()} flows={{ list: [broken], onOpen }} />);
  expect(screen.queryByRole("region", { name: "이 노드를 지나는 흐름" })).not.toBeInTheDocument();
});

// AI 가 스스로 넣은 망연계: 방화벽 → 망연계 → WAS (방화벽 → WAS 를 대신했다).
const guessState = (): DiagramState => ({
  ...emptyState(),
  nodes: {
    fw: { id: "fw", kind: "firewall", label: "방화벽", parent: null, attrs: {} },
    nl: { id: "nl", kind: "network_link", label: "망연계", parent: null, attrs: {}, guess: { replaced: [{ from: "fw", to: "was", edgeKind: "request", id: "e-old" }] } },
    was: { id: "was", kind: "was", label: "WAS", parent: null, attrs: {} },
  },
  edges: {
    a: { id: "a", from: "fw", to: "nl", edgeKind: "request" },
    b: { id: "b", from: "nl", to: "was", edgeKind: "request" },
  },
});

test("NodeInfo: guess 노드에 AI 추정·맞아요·아니에요, 아니에요 누르면 rejectLinkGuessAction, partial 이면 안내 문장", async () => {
  vi.mocked(rejectLinkGuessAction).mockClear();
  const onSaved = vi.fn();
  vi.mocked(rejectLinkGuessAction).mockResolvedValueOnce({ ok: true, number: 6, partial: true });
  render(<NodeInfo state={guessState()} selectedId="nl" onSelect={vi.fn()} linkGuess={{ diagramId: "d1", onSaved }} />);
  const g = screen.getByRole("group", { name: "AI 추정 망연계" });
  expect(within(g).getByText("AI 추정")).toBeInTheDocument();
  expect(within(g).getByRole("button", { name: "맞아요" })).toBeInTheDocument();
  await userEvent.click(within(g).getByRole("button", { name: "아니에요" }));
  expect(rejectLinkGuessAction).toHaveBeenCalledWith("d1", "nl");
  expect(onSaved).toHaveBeenCalledWith(6, true);
  expect(await screen.findByRole("status")).toHaveTextContent("주변 연결이 바뀌어 일부만 되돌렸어요.");
});

test("NodeInfo: 깔끔하게 되돌리면 안내 문장이 없다, 맞아요는 confirmLinkGuessAction", async () => {
  vi.mocked(confirmLinkGuessAction).mockClear();
  const onSaved = vi.fn();
  const { rerender } = render(<NodeInfo state={guessState()} selectedId="nl" onSelect={vi.fn()} linkGuess={{ diagramId: "d1", onSaved }} />);
  await userEvent.click(screen.getByRole("button", { name: "아니에요" }));
  expect(onSaved).toHaveBeenCalledWith(6, false);
  expect(screen.queryByText("주변 연결이 바뀌어 일부만 되돌렸어요.")).not.toBeInTheDocument();
  rerender(<NodeInfo state={guessState()} selectedId="nl" onSelect={vi.fn()} linkGuess={{ diagramId: "d1", onSaved }} />);
  await userEvent.click(screen.getByRole("button", { name: "맞아요" }));
  expect(confirmLinkGuessAction).toHaveBeenCalledWith("d1", "nl");
  expect(onSaved).toHaveBeenLastCalledWith(5, false);
});

test("NodeInfo: 저장 실패 문구, 대화 중에는 단추를 막는다", async () => {
  vi.mocked(confirmLinkGuessAction).mockResolvedValueOnce({ ok: false, error: "다른 대화가 돌고 있어요." });
  const { rerender } = render(<NodeInfo state={guessState()} selectedId="nl" onSelect={vi.fn()} linkGuess={{ diagramId: "d1", onSaved: vi.fn() }} />);
  await userEvent.click(screen.getByRole("button", { name: "맞아요" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("다른 대화가 돌고 있어요.");
  rerender(<NodeInfo state={guessState()} selectedId="nl" onSelect={vi.fn()} linkGuess={{ diagramId: "d1", disabled: true, onSaved: vi.fn() }} />);
  expect(screen.getByRole("button", { name: "맞아요" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "아니에요" })).toBeDisabled();
});

test("NodeInfo: 이력 보기(linkGuess 없음)는 AI 추정 표시만, 추정 아닌 노드는 표시 없음", () => {
  const { rerender } = render(<NodeInfo state={guessState()} selectedId="nl" onSelect={vi.fn()} />);
  expect(screen.getByText("AI 추정")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "맞아요" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "아니에요" })).not.toBeInTheDocument();
  rerender(<NodeInfo state={guessState()} selectedId="fw" onSelect={vi.fn()} linkGuess={{ diagramId: "d1", onSaved: vi.fn() }} />);
  expect(screen.queryByText("AI 추정")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "맞아요" })).not.toBeInTheDocument();
});

test("연결 is one section: a row per connection with the other node as a chip, no separate 연결된 노드 list", async () => {
  const onSelect = vi.fn();
  render(<NodeInfo state={fx("s2")} selectedId="was-1" onSelect={onSelect} onMention={vi.fn()} />);
  expect(screen.queryByRole("heading", { name: "연관관계" })).not.toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "연결된 노드" })).not.toBeInTheDocument();
  const sec = screen.getByRole("heading", { name: "연결" }).closest("section")!;
  const rows = within(sec).getAllByRole("listitem");
  expect(rows.length).toBeGreaterThan(0);
  for (const row of rows) expect(within(row).queryAllByRole("button").length + (row.querySelector("span") ? 1 : 0)).toBeGreaterThan(0);
  await userEvent.click(within(sec).getByRole("button", { name: /DB 중계/ }));
  expect(onSelect).toHaveBeenCalledWith(expect.stringMatching(/proxy/));
  // 노드 링크 복사는 이름 줄(header) 안의 조용한 단추다.
  expect(screen.getByRole("button", { name: "노드 링크 복사" }).closest("header")).not.toBeNull();
});

// ---- 영역 고르기 ----
function zoneState(): DiagramState {
  const s = emptyState();
  s.groups.net = { id: "net", groupKind: "network_zone", label: "업무망", parent: null, netType: { key: "admin", source: "ai", confirmed: false } };
  s.groups.sub = { id: "sub", groupKind: "subnet_private", label: "DB 구역", parent: "net" };
  s.nodes.was = { id: "was", kind: "was", label: "업무 WAS", parent: "net", attrs: {} };
  s.nodes.db = { id: "db", kind: "db_rdb", label: "업무 DB", parent: "sub", attrs: {} };
  s.nodes.user = { id: "user", kind: "client_web", label: "직원 PC", parent: null, attrs: {} };
  s.edges.e1 = { id: "e1", from: "user", to: "was", edgeKind: "request", label: "HTTPS" };
  s.edges.e2 = { id: "e2", from: "was", to: "db", edgeKind: "request" };
  return s;
}
const ZONE_KNOWLEDGE = {
  types: { admin: { key: "admin", name: "행정망", aliases: [], description: "행정기관 업무용 내부망입니다.", grade: "internal" as const, separated: true } },
  rules: [],
};

test("a selected zone shows its net type with the AI guess badge, members and crossing edges", async () => {
  const onSelect = vi.fn();
  render(
    <NetworkKnowledgeProvider value={ZONE_KNOWLEDGE}>
      <NodeInfo state={zoneState()} selectedId="net" onSelect={onSelect} />
    </NetworkKnowledgeProvider>,
  );
  expect(screen.getByRole("heading", { level: 2, name: "업무망" })).toBeInTheDocument();
  const net = screen.getByRole("region", { name: "망 종류" });
  expect(net).toHaveTextContent("행정망");
  expect(net).toHaveTextContent("내부");
  expect(net).toHaveTextContent("행정기관 업무용 내부망입니다.");
  expect(net).toHaveTextContent("AI 추정");

  const members = screen.getByRole("region", { name: "안에 든 것" });
  await userEvent.click(within(members).getByRole("button", { name: "DB 구역" }));
  expect(onSelect).toHaveBeenLastCalledWith("sub");
  await userEvent.click(within(members).getByRole("button", { name: "업무 WAS" }));
  expect(onSelect).toHaveBeenLastCalledWith("was");

  // 안끼리(was→db)는 경계를 넘지 않는다. 줄을 누르면 그 연결을 고른다.
  const crossing = screen.getByRole("region", { name: "경계를 넘는 연결" });
  expect(within(crossing).getAllByRole("button")).toHaveLength(1);
  await userEvent.click(within(crossing).getByRole("button", { name: /직원 PC → 업무 WAS/ }));
  expect(onSelect).toHaveBeenLastCalledWith("e1");
  expect(crossing).toHaveTextContent("들어옴 · 동기 요청 · HTTPS");
  // 화살표는 글자가 아니라 선으로 그린 SVG 다(글꼴에서 ">" 처럼 보이지 않게). 보조기기에는 숨긴다.
  expect(crossing.textContent).not.toMatch(/[←]/);
  const arrows = crossing.querySelectorAll("svg");
  expect(arrows.length).toBeGreaterThanOrEqual(2);
  for (const a of arrows) expect(a).toHaveAttribute("aria-hidden", "true");
});

test("a confirmed net type has no AI badge and a zone without net type, members or links says so", () => {
  const s = zoneState();
  s.groups.net!.netType = { key: "admin", source: "ai", confirmed: true };
  const { rerender } = render(
    <NetworkKnowledgeProvider value={ZONE_KNOWLEDGE}>
      <NodeInfo state={s} selectedId="net" onSelect={vi.fn()} />
    </NetworkKnowledgeProvider>,
  );
  expect(screen.getByRole("region", { name: "망 종류" })).not.toHaveTextContent("AI 추정");
  const lonely = emptyState();
  lonely.groups.z = { id: "z", groupKind: "dmz", label: "DMZ", parent: null };
  rerender(<NodeInfo state={lonely} selectedId="z" onSelect={vi.fn()} />);
  expect(screen.queryByRole("region", { name: "망 종류" })).toBeNull();
  expect(screen.getByText("안에 든 것이 없어요.")).toBeInTheDocument();
  expect(screen.getByText("영역 밖과 이어진 연결이 없어요.")).toBeInTheDocument();
});

test("a selected zone shows its explanation with the boundary section and a zone question box", () => {
  render(
    <NodeInfo
      state={zoneState()}
      selectedId="net"
      onSelect={vi.fn()}
      explain={{
        status: "ready",
        terms: [],
        data: {
          kind: "group", term: "망", definition: "망은 함께 쓰는 네트워크입니다.", definitionSource: "ai", reviewed: false,
          role: "업무 서버를 묶습니다.", boundary: "직원 PC 의 요청만 들어옵니다.", adr: { decision: "a", reason: "b", alternative: "c", cost: "d" },
        },
      }}
      ask={{ disabled: false, onAsk: vi.fn() }}
    />,
  );
  expect(screen.getByRole("heading", { name: "이 구성에서의 역할" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "경계에서 드나드는 것" })).toBeInTheDocument();
  expect(screen.getByText("직원 PC 의 요청만 들어옵니다.")).toBeInTheDocument();
  expect(screen.getByLabelText("이 영역에 대해 물어보기")).toBeInTheDocument();
});
