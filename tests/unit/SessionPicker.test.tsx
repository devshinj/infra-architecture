import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, expect, test, vi } from "vitest";

import { SessionPicker, type SessionPickerProps } from "@/ui/chat/SessionPicker";
import type { MoreState, SessionSummary } from "@/ui/chat/useSessions";

afterEach(cleanup);

const today = (h: number, m: number) => {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};
const s = (id: string, nodeId: string, nodeLabel: string, title: string, updatedAt: string): SessionSummary => ({ id, kind: "node", nodeId, nodeLabel, title, updatedAt });
const c = (id: string, title: string, updatedAt: string): SessionSummary => ({ id, kind: "diagram", nodeId: null, nodeLabel: null, title, updatedAt });
const names: Record<string, string> = { n1: "API 서버", n2: "주문 DB" };
const labelOf = (id: string) => names[id] ?? null;

const picker = (p: Partial<SessionPickerProps> & Pick<SessionPickerProps, "sessions">) =>
  render(<SessionPicker active="main" labelOf={labelOf} onSelect={vi.fn()} {...p} />);
const items = () => screen.getAllByRole("button").filter((b) => b.hasAttribute("data-session-item"));
const group = (name: string) => screen.getByRole("region", { name });

test("shows 기본 대화 alone and disabled with no sessions", () => {
  picker({ sessions: [] });
  const btn = screen.getByRole("button", { name: "기본 대화" });
  expect(btn).toBeDisabled();
  expect(btn.querySelector("svg")).toBeNull();
});

test("two groups: 구성도 대화 (기본 대화 first, then diagram chats newest first) and 노드 질문 (newest first)", async () => {
  const onSelect = vi.fn();
  const sessions = [
    s("a", "n2", "주문 DB", "백업은 어떻게 해요?", "2026-03-04T10:00:00Z"),
    c("x", "결제 붙이기", "2026-03-05T10:00:00Z"),
    s("b", "n1", "API 서버", "왜 두 대예요?", today(9, 5)),
    c("y", "DR 구성", today(8, 30)),
  ];
  picker({ sessions, onSelect, onRename: vi.fn(), onDelete: vi.fn() });
  await userEvent.click(screen.getByRole("button", { name: "기본 대화" }));
  expect(screen.getByRole("dialog", { name: "대화 고르기" })).toBeInTheDocument();
  const inGroup = (name: string) => within(group(name)).getAllByRole("button").filter((b) => b.hasAttribute("data-session-item")).map((i) => i.textContent);
  expect(inGroup("구성도 대화")).toEqual(["기본 대화", "DR 구성08:30", "결제 붙이기3/5"]);
  expect(inGroup("노드 질문")).toEqual(["API 서버 · 왜 두 대예요?09:05", "주문 DB · 백업은 어떻게 해요?3/4"]);
  expect(items()[0]).toHaveAttribute("aria-current", "true");
  // 기본 대화는 이름을 바꾸거나 지울 수 없다(행 메뉴가 없다).
  expect(screen.queryByRole("button", { name: "기본 대화 메뉴" })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "DR 구성 메뉴" })).toBeInTheDocument();
  await userEvent.click(within(group("노드 질문")).getAllByRole("button")[0]!);
  expect(onSelect).toHaveBeenCalledWith("b");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("no 노드 질문 group without node sessions", async () => {
  picker({ sessions: [c("x", "결제", today(9, 0))] });
  await userEvent.click(screen.getByRole("button", { name: "기본 대화" }));
  expect(screen.queryByRole("region", { name: "노드 질문" })).not.toBeInTheDocument();
});

test("the button shows the active session: node name · title, or the diagram chat's title", () => {
  const { unmount } = picker({ sessions: [s("b", "n1", "API", "왜 두 대예요?", today(9, 5))], active: "b" });
  expect(screen.getByRole("button", { name: "API 서버 · 왜 두 대예요?" })).toBeEnabled();
  unmount();
  picker({ sessions: [c("x", "결제 붙이기", today(9, 5))], active: "x" });
  expect(screen.getByRole("button", { name: "결제 붙이기" })).toBeEnabled();
});

test("deleted node shows (지워짐)", async () => {
  picker({ sessions: [s("c", "gone", "캐시", "만료 시간은?", today(8, 0))] });
  await userEvent.click(screen.getByRole("button", { name: "기본 대화" }));
  expect(within(group("노드 질문")).getAllByRole("button")[0]).toHaveTextContent("캐시 (지워짐) · 만료 시간은?");
});

test("Esc closes and returns focus; ↑↓ move between rows", async () => {
  picker({ sessions: [s("b", "n1", "API 서버", "왜?", today(9, 5)), c("x", "결제", today(9, 0))] });
  const btn = screen.getByRole("button", { name: "기본 대화" });
  await userEvent.click(btn);
  expect(items()[0]).toHaveFocus();
  await userEvent.keyboard("{ArrowDown}");
  expect(items()[1]).toHaveFocus();
  await userEvent.keyboard("{ArrowUp}{ArrowUp}");
  expect(items().at(-1)).toHaveFocus();
  await userEvent.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(btn).toHaveFocus();
});

test("the pending new question session is the first 노드 질문 row with aria-current, and choosing it is a no-op", async () => {
  const onSelect = vi.fn();
  const pending = s("new", "n1", "API 서버", "왜 두 대예요?", today(9, 5));
  picker({ sessions: [s("a", "n2", "주문 DB", "백업은 어떻게 해요?", "2026-03-04T10:00:00Z")], active: "new", onSelect, pending });
  await userEvent.click(screen.getByRole("button", { name: "API 서버 · 왜 두 대예요?" }));
  const rows = within(group("노드 질문")).getAllByRole("button").filter((b) => b.hasAttribute("data-session-item"));
  expect(rows.map((i) => i.textContent)).toEqual(["API 서버 · 왜 두 대예요?09:05", "주문 DB · 백업은 어떻게 해요?3/4"]);
  expect(rows[0]).toHaveAttribute("aria-current", "true");
  expect(items().filter((i) => i.hasAttribute("aria-current"))).toHaveLength(1);
  await userEvent.click(rows[0]!);
  expect(onSelect).not.toHaveBeenCalled();
});

test("a pending new diagram chat shows as 새 대화 under 구성도 대화 and on the button", async () => {
  const pending = c("new", "새 대화", today(9, 5));
  picker({ sessions: [], active: "new", pending });
  await userEvent.click(screen.getByRole("button", { name: "새 대화", expanded: false }));
  const rows = within(group("구성도 대화")).getAllByRole("button").filter((b) => b.hasAttribute("data-session-item"));
  expect(rows.map((r) => r.textContent)).toEqual(["기본 대화", "새 대화09:05"]);
  expect(rows[1]).toHaveAttribute("aria-current", "true");
});

test("새 대화 button calls onNew and can be disabled", async () => {
  const onNew = vi.fn();
  const { rerender } = picker({ sessions: [], onNew });
  await userEvent.click(screen.getByRole("button", { name: "새 대화" }));
  expect(onNew).toHaveBeenCalledTimes(1);
  rerender(<SessionPicker sessions={[]} active="main" labelOf={labelOf} onSelect={vi.fn()} onNew={onNew} newDisabled />);
  expect(screen.getByRole("button", { name: "새 대화" })).toBeDisabled();
});

test("rename from the row menu (keyboard): opens a name dialog with the title, saves, and returns focus to the picker", async () => {
  const onRename = vi.fn(async () => undefined);
  picker({ sessions: [c("x", "결제 붙이기", today(9, 0))], onRename, onDelete: vi.fn() });
  const btn = screen.getByRole("button", { name: "기본 대화" });
  await userEvent.click(btn);
  screen.getByRole("button", { name: "결제 붙이기 메뉴" }).focus();
  await userEvent.keyboard("{ArrowDown}");
  const menu = screen.getByRole("menu", { name: "결제 붙이기 메뉴" });
  expect(within(menu).getByRole("menuitem", { name: "이름 바꾸기" })).toHaveFocus();
  // 메뉴 안의 Esc 는 메뉴만 닫는다.
  await userEvent.keyboard("{Escape}");
  expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  expect(screen.getByRole("dialog", { name: "대화 고르기" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "결제 붙이기 메뉴" })).toHaveFocus();
  await userEvent.keyboard("{ArrowDown}{Enter}");

  const dialog = screen.getByRole("dialog", { name: "대화 이름 바꾸기" });
  expect(screen.queryByRole("dialog", { name: "대화 고르기" })).not.toBeInTheDocument();
  const input = within(dialog).getByRole("textbox", { name: "이름" });
  expect(input).toHaveValue("결제 붙이기");
  expect(input).toHaveFocus();
  await userEvent.clear(input);
  await userEvent.type(input, "PG 연동{Enter}");
  await waitFor(() => expect(screen.queryByRole("dialog", { name: "대화 이름 바꾸기" })).not.toBeInTheDocument());
  expect(onRename).toHaveBeenCalledWith("x", "PG 연동");
  await waitFor(() => expect(btn).toHaveFocus());
});

test("rename shows the returned error and stays open", async () => {
  const onRename = vi.fn(async () => "대화 이름은 1~60자로 입력해 주세요.");
  picker({ sessions: [s("b", "n1", "API 서버", "왜?", today(9, 5))], onRename, onDelete: vi.fn() });
  await userEvent.click(screen.getByRole("button", { name: "기본 대화" }));
  await userEvent.click(screen.getByRole("button", { name: "API 서버 · 왜? 메뉴" }));
  await userEvent.click(screen.getByRole("menuitem", { name: "이름 바꾸기" }));
  await userEvent.type(screen.getByRole("textbox", { name: "이름" }), "!{Enter}");
  expect(await screen.findByRole("alert")).toHaveTextContent("대화 이름은 1~60자로 입력해 주세요.");
  expect(screen.getByRole("dialog", { name: "대화 이름 바꾸기" })).toBeInTheDocument();
});

test("delete asks first (cancel is focused), deletes on confirm, and Esc cancels", async () => {
  const onDelete = vi.fn(async () => undefined);
  picker({ sessions: [c("x", "결제 붙이기", today(9, 0))], onRename: vi.fn(), onDelete });
  const btn = screen.getByRole("button", { name: "기본 대화" });
  await userEvent.click(btn);
  await userEvent.click(screen.getByRole("button", { name: "결제 붙이기 메뉴" }));
  await userEvent.click(screen.getByRole("menuitem", { name: "삭제" }));
  let confirm = screen.getByRole("alertdialog", { name: "대화 삭제" });
  expect(confirm).toHaveTextContent("‘결제 붙이기’ 대화를 삭제할까요? 이 대화의 메시지가 모두 지워져요. 구성도와 버전 이력은 그대로예요.");
  expect(within(confirm).getByRole("button", { name: "취소" })).toHaveFocus();
  await userEvent.keyboard("{Escape}");
  expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  expect(onDelete).not.toHaveBeenCalled();
  await waitFor(() => expect(btn).toHaveFocus());

  await userEvent.click(btn);
  await userEvent.click(screen.getByRole("button", { name: "결제 붙이기 메뉴" }));
  await userEvent.click(screen.getByRole("menuitem", { name: "삭제" }));
  confirm = screen.getByRole("alertdialog", { name: "대화 삭제" });
  await userEvent.click(within(confirm).getByRole("button", { name: "삭제" }));
  await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
  expect(onDelete).toHaveBeenCalledWith("x");
});

test("delete is disabled while a turn runs; rename still works", async () => {
  picker({ sessions: [c("x", "결제", today(9, 0))], onRename: vi.fn(), onDelete: vi.fn(), deleteDisabled: true });
  await userEvent.click(screen.getByRole("button", { name: "기본 대화" }));
  await userEvent.click(screen.getByRole("button", { name: "결제 메뉴" }));
  expect(screen.getByRole("menuitem", { name: "삭제" })).toBeDisabled();
  expect(screen.getByRole("menuitem", { name: "이름 바꾸기" })).toBeEnabled();
});

function DeletingHarness(p: { newDisabled?: boolean; fallbackFocus?(): void }) {
  const [sessions, setSessions] = useState<SessionSummary[]>([c("x", "결제", today(9, 0))]);
  return (
    <SessionPicker
      sessions={sessions}
      active="main"
      labelOf={labelOf}
      onSelect={vi.fn()}
      onNew={vi.fn()}
      onRename={vi.fn()}
      onDelete={async (id) => setSessions((ss) => ss.filter((s) => s.id !== id))}
      {...p}
    />
  );
}
const deleteOnly = async () => {
  await userEvent.click(screen.getByRole("button", { name: "기본 대화" }));
  await userEvent.click(screen.getByRole("button", { name: "결제 메뉴" }));
  await userEvent.click(screen.getByRole("menuitem", { name: "삭제" }));
  await userEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "삭제" }));
  await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
};

test("deleting the last session disables the picker, so focus goes to 새 대화", async () => {
  render(<DeletingHarness />);
  await deleteOnly();
  expect(screen.getByRole("button", { name: "기본 대화" })).toBeDisabled();
  await waitFor(() => expect(screen.getByRole("button", { name: "새 대화" })).toHaveFocus());
});

test("…and to the fallback (chat input) when 새 대화 is disabled too", async () => {
  const fallbackFocus = vi.fn();
  render(<DeletingHarness newDisabled fallbackFocus={fallbackFocus} />);
  await deleteOnly();
  await waitFor(() => expect(fallbackFocus).toHaveBeenCalled());
});

// ---- 무리마다 `더 보기` ----
function PagingHarness({ fail = false }: { fail?: boolean }) {
  const [sessions, setSessions] = useState<SessionSummary[]>([c("x", "결제", today(9, 0)), s("b", "n1", "API 서버", "왜?", today(9, 5))]);
  const [more, setMore] = useState<Record<"diagram" | "node", MoreState>>({ diagram: "none", node: "idle" });
  const onMore = async (kind: "diagram" | "node") => {
    setMore((m) => ({ ...m, [kind]: "loading" }));
    await Promise.resolve();
    if (fail) {
      setMore((m) => ({ ...m, [kind]: "error" }));
      return [];
    }
    setSessions((ss) => [...ss, s("o1", "n2", "주문 DB", "옛 질문", "2026-03-04T10:00:00Z"), s("o2", "n2", "주문 DB", "더 옛 질문", "2026-03-01T10:00:00Z")]);
    setMore((m) => ({ ...m, [kind]: "none" }));
    return ["o1", "o2"];
  };
  return <SessionPicker sessions={sessions} active="main" labelOf={labelOf} onSelect={vi.fn()} onRename={vi.fn()} onDelete={vi.fn()} more={more} onMore={onMore} />;
}

test("a group with more sessions ends with 더 보기; keyboard loads the next page, focuses the first new row and announces it", async () => {
  render(<PagingHarness />);
  await userEvent.click(screen.getByRole("button", { name: "기본 대화" }));
  expect(within(group("구성도 대화")).queryByRole("button", { name: /더 보기/ })).not.toBeInTheDocument();
  const moreBtn = within(group("노드 질문")).getByRole("button", { name: "노드 질문 더 보기" });
  // ↑↓ 로 닿는다(마지막 줄).
  await userEvent.keyboard("{ArrowUp}");
  expect(moreBtn).toHaveFocus();
  await userEvent.keyboard("{Enter}");
  await waitFor(() => expect(within(group("노드 질문")).queryByRole("button", { name: /더 보기/ })).not.toBeInTheDocument());
  const rows = within(group("노드 질문")).getAllByRole("button").filter((b) => b.hasAttribute("data-session-item"));
  expect(rows.map((r) => r.textContent)).toEqual(["API 서버 · 왜?09:05", "주문 DB · 옛 질문3/4", "주문 DB · 더 옛 질문3/1"]);
  await waitFor(() => expect(rows[1]).toHaveFocus());
  expect(screen.getByRole("status")).toHaveTextContent("노드 질문 2개를 더 불러왔어요.");
  // 불러온 옛 세션도 행 메뉴가 있다.
  expect(screen.getByRole("button", { name: "주문 DB · 옛 질문 메뉴" })).toBeInTheDocument();
});

test("a failed page shows 다시 불러오기 and keeps focus there", async () => {
  render(<PagingHarness fail />);
  await userEvent.click(screen.getByRole("button", { name: "기본 대화" }));
  await userEvent.click(screen.getByRole("button", { name: "노드 질문 더 보기" }));
  const retry = await screen.findByRole("button", { name: "노드 질문 다시 불러오기" });
  expect(retry).toHaveFocus();
});
