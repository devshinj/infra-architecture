import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

const fns = { createMcpKeyAction: vi.fn(), deleteMcpKeyAction: vi.fn() };
vi.mock("@/app/(app)/actions", () => ({
  createMcpKeyAction: (...a: unknown[]) => fns.createMcpKeyAction(...a),
  deleteMcpKeyAction: (...a: unknown[]) => fns.deleteMcpKeyAction(...a),
}));

import type { McpKeyRow } from "@/app/(app)/actions";
import { McpKeysPage } from "@/ui/mcp/McpKeysPage";

const RAW = "isk_" + "A".repeat(43);

beforeEach(() => Object.values(fns).forEach((f) => f.mockReset()));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const keys: McpKeyRow[] = [
  { id: "k1", name: "내 노트북", prefix: "isk_abcd", createdAt: "2026-11-01T00:00:00.000Z", lastUsedAt: null },
  { id: "k2", name: "회사 PC", prefix: "isk_wxyz", createdAt: "2026-11-02T00:00:00.000Z", lastUsedAt: "2026-11-05T00:00:00.000Z" },
];

test("목록에 이름·앞 8글자·마지막 사용을 보인다", () => {
  render(<McpKeysPage initialKeys={keys} />);
  expect(screen.getByRole("heading", { name: "Claude Code 연결" })).toBeInTheDocument();
  const row = within(screen.getByText("내 노트북").closest("tr")!);
  expect(row.getByText("isk_abcd")).toBeInTheDocument();
  expect(row.getByText("아직 안 씀")).toBeInTheDocument();
  expect(within(screen.getByText("회사 PC").closest("tr")!).queryByText("아직 안 씀")).toBeNull();
});

test("빈 이름이면 안내 문구를 보이고 만들지 않는다", async () => {
  const user = userEvent.setup();
  render(<McpKeysPage initialKeys={[]} />);
  await user.click(screen.getByRole("button", { name: "키 만들기" }));
  expect(screen.getByRole("alert")).toHaveTextContent("키 이름을 적어 주세요.");
  expect(fns.createMcpKeyAction).not.toHaveBeenCalled();
});

test("만들면 키와 설정 예가 보이고, 닫으면 키 원문이 DOM 에서 사라진다", async () => {
  const user = userEvent.setup();
  fns.createMcpKeyAction.mockResolvedValue({ ok: true, id: "k9", key: RAW, prefix: "isk_AAAA" });
  render(<McpKeysPage initialKeys={[]} />);
  await user.type(screen.getByLabelText("키 이름"), "새 키");
  await user.click(screen.getByRole("button", { name: "키 만들기" }));

  expect(fns.createMcpKeyAction).toHaveBeenCalledWith("새 키");
  expect(await screen.findByText(RAW)).toBeInTheDocument();
  expect(screen.getByText("이 창을 닫으면 다시 볼 수 없어요. 지금 복사해 두세요.")).toBeInTheDocument();
  expect(
    screen.getByText(
      `claude mcp add --transport http infrasketch ${window.location.origin}/api/mcp --header "Authorization: Bearer ${RAW}"`,
    ),
  ).toBeInTheDocument();
  expect(screen.getByText("새 키")).toBeInTheDocument(); // 목록에도 추가
  // 키가 틀렸거나 지워졌을 때 다시 등록하는 법도 설정 예 옆에 있다.
  expect(screen.getByText(/'키가 맞지 않아요' 오류가 나면/)).toHaveTextContent("claude mcp remove infrasketch");

  await user.click(screen.getByRole("button", { name: "닫기" }));
  expect(document.body.innerHTML).not.toContain(RAW);
});

test("만든 뒤 안내가 나오고 제목으로 포커스가 가며, 닫으면 이름칸으로 돌아간다. 다시 그려도 원문은 없다", async () => {
  const user = userEvent.setup();
  fns.createMcpKeyAction.mockResolvedValue({ ok: true, id: "k9", key: RAW, prefix: "isk_AAAA" });
  const { unmount } = render(<McpKeysPage initialKeys={[]} />);
  await user.type(screen.getByLabelText("키 이름"), "x");
  await user.click(screen.getByRole("button", { name: "키 만들기" }));
  await screen.findByText(RAW);
  expect(screen.getAllByRole("status")[0]).toHaveTextContent("키를 만들었어요. 이 창을 닫으면 다시 볼 수 없어요.");
  expect(screen.getByRole("heading", { name: /키를 만들었어요/ })).toHaveFocus();
  await user.click(screen.getByRole("button", { name: "닫기" }));
  expect(screen.getByLabelText("키 이름")).toHaveFocus();
  expect(document.body.innerHTML).not.toContain(RAW);
  unmount();
  render(<McpKeysPage initialKeys={[{ ...keys[0], id: "k9", prefix: "isk_AAAA" }]} />);
  expect(document.body.innerHTML).not.toContain(RAW);
});

test("빈 이름 오류는 입력칸과 이어진다", async () => {
  const user = userEvent.setup();
  render(<McpKeysPage initialKeys={[]} />);
  await user.click(screen.getByRole("button", { name: "키 만들기" }));
  const input = screen.getByLabelText("키 이름");
  expect(input).toHaveAttribute("aria-invalid", "true");
  expect(input).toHaveAccessibleDescription("키 이름을 적어 주세요.");
});

test("방금 만든 키를 지우면 키 패널도 사라진다", async () => {
  const user = userEvent.setup();
  fns.createMcpKeyAction.mockResolvedValue({ ok: true, id: "k9", key: RAW, prefix: "isk_AAAA" });
  fns.deleteMcpKeyAction.mockResolvedValue({ ok: true });
  render(<McpKeysPage initialKeys={[]} />);
  await user.type(screen.getByLabelText("키 이름"), "새 키");
  await user.click(screen.getByRole("button", { name: "키 만들기" }));
  await screen.findByText(RAW);
  await user.click(screen.getByRole("button", { name: "새 키 지우기" }));
  await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "삭제" }));
  await vi.waitFor(() => expect(screen.queryByText(RAW)).toBeNull());
  await vi.waitFor(() => expect(screen.getByLabelText("키 이름")).toHaveFocus());
});

test("복사 버튼은 clipboard 로 쓰고, 실패하면 직접 복사 안내를 보인다", async () => {
  const user = userEvent.setup();
  fns.createMcpKeyAction.mockResolvedValue({ ok: true, id: "k9", key: RAW, prefix: "isk_AAAA" });
  render(<McpKeysPage initialKeys={[]} />);
  await user.type(screen.getByLabelText("키 이름"), "x");
  await user.click(screen.getByRole("button", { name: "키 만들기" }));
  await screen.findByText(RAW);

  const original = Object.getOwnPropertyDescriptor(navigator, "clipboard");
  const write = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", { value: { writeText: write }, configurable: true });
  await user.click(screen.getByRole("button", { name: "키 복사" }));
  expect(write).toHaveBeenCalledWith(RAW);

  write.mockRejectedValue(new Error("denied"));
  await user.click(screen.getByRole("button", { name: "설정 예 복사" }));
  expect(await screen.findByText("직접 선택해 복사해 주세요")).toBeInTheDocument();
  if (original) Object.defineProperty(navigator, "clipboard", original);
  else delete (navigator as unknown as Record<string, unknown>).clipboard;
});

test("서버가 거절하면 그 문구를 보인다", async () => {
  const user = userEvent.setup();
  fns.createMcpKeyAction.mockResolvedValue({ ok: false, error: "키는 10개까지 만들 수 있어요." });
  render(<McpKeysPage initialKeys={[]} />);
  await user.type(screen.getByLabelText("키 이름"), "x");
  await user.click(screen.getByRole("button", { name: "키 만들기" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("키는 10개까지 만들 수 있어요.");
});

test("지우기 확인 뒤 행이 사라진다", async () => {
  const user = userEvent.setup();
  fns.deleteMcpKeyAction.mockResolvedValue({ ok: true });
  render(<McpKeysPage initialKeys={keys} />);
  await user.click(screen.getByRole("button", { name: "내 노트북 지우기" }));
  const dlg = screen.getByRole("alertdialog");
  await user.click(within(dlg).getByRole("button", { name: "삭제" }));
  expect(fns.deleteMcpKeyAction).toHaveBeenCalledWith("k1");
  await vi.waitFor(() => expect(screen.queryByText("내 노트북")).toBeNull());
  expect(screen.getByText("회사 PC")).toBeInTheDocument();
  await vi.waitFor(() => expect(screen.getByRole("button", { name: "회사 PC 지우기" })).toHaveFocus());
});
