import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";

import { RightPanel, type RightPanelProps } from "@/ui/RightPanel";

import { emptyState } from "@/domain/types";

import { fx } from "../fixtures/spike";

// 설명 탭(NodeInfo)이 망연계 맞아요·아니에요 서버 액션을 불러온다: 서버 모듈을 들이지 않게 막는다.
vi.mock("@/app/(app)/actions", () => ({ confirmLinkGuessAction: vi.fn(), rejectLinkGuessAction: vi.fn() }));

afterEach(cleanup);

const props = (selectedId: string | null): RightPanelProps => ({
  state: fx("s2"),
  selectedId,
  onSelect: vi.fn(),
  history: { versions: [], onView: vi.fn(), onRestore: vi.fn(), onCompare: vi.fn() },
  chat: { lines: [], busy: false, onSend: vi.fn(), onStop: vi.fn(), health: null, mentionRef: { current: null } },
});

test("no sample list in chat; greeting only for an empty diagram", () => {
  const { rerender } = render(<RightPanel {...props(null)} state={emptyState()} />);
  expect(screen.queryByText("또는 샘플로 시작하기")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /불러오기/ })).not.toBeInTheDocument();
  expect(screen.getByText(/안녕하세요, InfraSketch예요/)).toBeInTheDocument();
  rerender(<RightPanel {...props(null)} />);
  expect(screen.queryByText(/안녕하세요, InfraSketch예요/)).not.toBeInTheDocument();
});

test("no greeting while viewing an old empty version (chat disabled)", () => {
  render(<RightPanel {...props(null)} state={emptyState()} live={false} />);
  expect(screen.queryByText(/안녕하세요, InfraSketch예요/)).not.toBeInTheDocument();
});

test("selecting activates 설명 and clearing returns to the previous tab", () => {
  const { rerender } = render(<RightPanel {...props(null)} />);
  expect(screen.getByRole("tab", { name: "대화" })).toHaveAttribute("aria-selected", "true");
  rerender(<RightPanel {...props("was-1")} />);
  expect(screen.getByRole("tab", { name: "설명" })).toHaveAttribute("aria-selected", "true");
  rerender(<RightPanel {...props(null)} />);
  expect(screen.getByRole("tab", { name: "대화" })).toHaveAttribute("aria-selected", "true");
});

test("selecting another node while on 이력 switches back to 설명 and deselect stays on the manually chosen tab", async () => {
  const { rerender } = render(<RightPanel {...props(null)} />);
  rerender(<RightPanel {...props("was-1")} />);
  await userEvent.click(screen.getByRole("tab", { name: "이력" }));
  expect(screen.getByRole("tab", { name: "이력" })).toHaveAttribute("aria-selected", "true");
  rerender(<RightPanel {...props("was-2")} />);
  expect(screen.getByRole("tab", { name: "설명" })).toHaveAttribute("aria-selected", "true");
  rerender(<RightPanel {...props(null)} />);
  expect(screen.getByRole("tab", { name: "이력" })).toHaveAttribute("aria-selected", "true");
});

test("manual tab choice after selecting keeps that tab when the selection clears", async () => {
  const { rerender } = render(<RightPanel {...props(null)} />);
  rerender(<RightPanel {...props("was-1")} />);
  await userEvent.click(screen.getByRole("tab", { name: "이력" }));
  rerender(<RightPanel {...props(null)} />);
  expect(screen.getByRole("tab", { name: "이력" })).toHaveAttribute("aria-selected", "true");
});

test("controlled mode: selection change notifies the parent outside render, no console.error", () => {
  const err = vi.spyOn(console, "error").mockImplementation(() => {});
  const onTabChange = vi.fn();
  const { rerender } = render(<RightPanel {...props(null)} tab="이력" onTabChange={onTabChange} />);
  rerender(<RightPanel {...props("was-1")} tab="이력" onTabChange={onTabChange} />);
  expect(onTabChange).toHaveBeenLastCalledWith("설명");
  rerender(<RightPanel {...props("was-1")} tab="설명" onTabChange={onTabChange} />);
  rerender(<RightPanel {...props(null)} tab="설명" onTabChange={onTabChange} />);
  expect(onTabChange).toHaveBeenLastCalledWith("이력");
  expect(err).not.toHaveBeenCalled();
  err.mockRestore();
});

test("흐름 tab present and switches", async () => {
  const onTabChange = vi.fn();
  const flows = {
    flows: [{ id: "db", name: "DB 조회", origin: "system" as const, steps: [{ edge: "e-was-1-db-proxy", from: "was-1", short: "조회", text: "조회해요" }], source: "user" as const, reviewed: true, problems: [] }],
    state: fx("s2"),
    activeKey: null,
    onActivate: vi.fn(),
    onFocusStep: vi.fn(),
    onSuggest: vi.fn(),
    suggesting: false,
    onRename: vi.fn(async () => undefined),
    onDelete: vi.fn(async () => undefined),
    onConfirm: vi.fn(),
    onRepair: vi.fn(),
    onRemoveStep: vi.fn(async () => undefined),
    disabled: false,
  };
  const { rerender } = render(<RightPanel {...props(null)} flows={flows} onTabChange={onTabChange} />);
  expect(screen.getAllByRole("tab").map((t) => t.textContent)).toEqual(["대화", "설명", "이력", "흐름"]);
  await userEvent.click(screen.getByRole("tab", { name: "흐름" }));
  expect(screen.getByRole("tab", { name: "흐름" })).toHaveAttribute("aria-selected", "true");
  expect(onTabChange).toHaveBeenLastCalledWith("흐름");
  expect(screen.getByRole("button", { name: "흐름 제안받기" })).toBeInTheDocument();
  // 설명 탭의 흐름 칩: 흐름 탭으로 가서 그 흐름을 켠다. 선택이 풀려도 흐름 탭에 남는다.
  rerender(<RightPanel {...props("was-1")} flows={flows} onTabChange={onTabChange} />);
  expect(screen.getByRole("tab", { name: "설명" })).toHaveAttribute("aria-selected", "true");
  await userEvent.click(screen.getByRole("button", { name: "DB 조회" }));
  expect(flows.onActivate).toHaveBeenCalledWith("db");
  expect(screen.getByRole("tab", { name: "흐름" })).toHaveAttribute("aria-selected", "true");
  rerender(<RightPanel {...props(null)} flows={flows} onTabChange={onTabChange} />);
  expect(screen.getByRole("tab", { name: "흐름" })).toHaveAttribute("aria-selected", "true");
});

// ---- 펼친 줄기 ----
const trunk = () => ({
  edges: [
    { id: "e-web-1-was-pair", from: "웹 1", to: "WAS 묶음", label: "HTTP", color: 0 },
    { id: "e-web-2-was-pair", from: "웹 2", to: "WAS 묶음", color: 1 },
  ],
  onPick: vi.fn(),
});

test("펼친 줄기는 선택처럼 설명 탭을 열어 선 목록을 보이고, 풀면 앞 탭으로 돌아간다", async () => {
  const t = trunk();
  const { rerender } = render(<RightPanel {...props(null)} />);
  expect(screen.getByRole("tab", { name: "대화" })).toHaveAttribute("aria-selected", "true");
  rerender(<RightPanel {...props(null)} trunk={t} />);
  expect(screen.getByRole("tab", { name: "설명" })).toHaveAttribute("aria-selected", "true");
  expect(screen.getByRole("heading", { name: "이 줄기의 선 2개" })).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "웹 2 → WAS 묶음" }));
  expect(t.onPick).toHaveBeenCalledWith("e-web-2-was-pair");
  rerender(<RightPanel {...props(null)} />);
  expect(screen.getByRole("tab", { name: "대화" })).toHaveAttribute("aria-selected", "true");
});

test("고른 노드에서 곧바로 줄기를 펼치면 설명 탭에 남고, 펼침이 풀리면 처음 탭으로 돌아간다", () => {
  const { rerender } = render(<RightPanel {...props(null)} />);
  rerender(<RightPanel {...props("was-1")} />);
  expect(screen.getByRole("tab", { name: "설명" })).toHaveAttribute("aria-selected", "true");
  // 펼치면 선택이 풀린다(부모가 보장): 선택이 null 이 되어도 펼침이 있으니 설명 탭에 머문다.
  rerender(<RightPanel {...props(null)} trunk={trunk()} />);
  expect(screen.getByRole("tab", { name: "설명" })).toHaveAttribute("aria-selected", "true");
  expect(screen.getByRole("heading", { name: "이 줄기의 선 2개" })).toBeInTheDocument();
  rerender(<RightPanel {...props(null)} />);
  expect(screen.getByRole("tab", { name: "대화" })).toHaveAttribute("aria-selected", "true");
});
