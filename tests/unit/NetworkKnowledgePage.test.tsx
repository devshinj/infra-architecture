import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

const fns = {
  addNetworkTypeAction: vi.fn(),
  updateNetworkTypeAction: vi.fn(),
  resetNetworkTypeAction: vi.fn(),
  setNetworkTypeHiddenAction: vi.fn(),
  deleteNetworkTypeAction: vi.fn(),
  countNetworkTypeUsageAction: vi.fn(),
  upsertNetworkRuleAction: vi.fn(),
  deleteNetworkRuleAction: vi.fn(),
};
vi.mock("@/app/(app)/actions", () => ({
  addNetworkTypeAction: (...a: unknown[]) => fns.addNetworkTypeAction(...a),
  updateNetworkTypeAction: (...a: unknown[]) => fns.updateNetworkTypeAction(...a),
  resetNetworkTypeAction: (...a: unknown[]) => fns.resetNetworkTypeAction(...a),
  setNetworkTypeHiddenAction: (...a: unknown[]) => fns.setNetworkTypeHiddenAction(...a),
  deleteNetworkTypeAction: (...a: unknown[]) => fns.deleteNetworkTypeAction(...a),
  countNetworkTypeUsageAction: (...a: unknown[]) => fns.countNetworkTypeUsageAction(...a),
  upsertNetworkRuleAction: (...a: unknown[]) => fns.upsertNetworkRuleAction(...a),
  deleteNetworkRuleAction: (...a: unknown[]) => fns.deleteNetworkRuleAction(...a),
}));

import type { NetTypeRow } from "@/server/network";
import { NetworkKnowledgePage } from "@/ui/network/NetworkKnowledgePage";

beforeEach(() => Object.values(fns).forEach((f) => f.mockReset()));
afterEach(cleanup);

const row = (o: Partial<NetTypeRow>): NetTypeRow => ({
  id: "t1", key: "internal-net", name: "업무망", aliases: [], description: "", grade: "internal",
  source: "seed", edited: false, hidden: false, ...o,
});
const types = [
  row({ id: "t1", key: "internal-net", name: "업무망", grade: "internal" }),
  row({ id: "t2", key: "dmz", name: "DMZ", grade: "boundary", edited: true }),
  row({ id: "t3", key: "internet", name: "인터넷", grade: "external", hidden: true }),
  row({ id: "t4", key: "partner", name: "협력사망", grade: "external", source: "user" }),
];

test("등급별 묶음과 기본 제공 표시", () => {
  render(<NetworkKnowledgePage initialTypes={types} initialRules={[]} />);
  expect(screen.getByRole("heading", { name: "망 지식" })).toBeInTheDocument();
  for (const g of ["폐쇄", "내부", "경계", "외부"]) expect(screen.getByRole("heading", { name: g })).toBeInTheDocument();
  const internal = within(screen.getByRole("button", { name: /업무망/ }));
  expect(internal.getByText("기본 제공")).toBeInTheDocument();
  expect(within(screen.getByRole("button", { name: /DMZ/ })).getByText("사용자가 고침")).toBeInTheDocument();
  expect(within(screen.getByRole("button", { name: /협력사망/ })).getByText("직접 추가")).toBeInTheDocument();
  expect(within(screen.getByRole("button", { name: /인터넷/ })).getByText("쓰지 않음")).toBeInTheDocument();
});

test("사용자 종류 추가 → addNetworkTypeAction 호출", async () => {
  const user = userEvent.setup();
  fns.addNetworkTypeAction.mockResolvedValue({ ok: true, type: row({ id: "t9", key: "lab", name: "실험망", source: "user", grade: "internal" }) });
  render(<NetworkKnowledgePage initialTypes={types} initialRules={[]} />);
  await user.click(screen.getByRole("button", { name: "종류 추가" }));
  const form = screen.getByRole("form", { name: "종류 추가" });
  await user.type(within(form).getByLabelText("이름"), "실험망");
  await user.type(within(form).getByLabelText("다른 이름(쉼표로 구분)"), "랩, 테스트망");
  await user.selectOptions(within(form).getByLabelText("등급"), "internal");
  await user.click(within(form).getByRole("button", { name: "저장" }));
  expect(fns.addNetworkTypeAction).toHaveBeenCalledWith({ name: "실험망", aliases: ["랩", "테스트망"], description: "", grade: "internal" });
  expect(await screen.findByRole("button", { name: /실험망/ })).toBeInTheDocument();
});

test("기본 제공은 지우기 대신 쓰지 않음, 고친 항목만 되돌리기", async () => {
  const user = userEvent.setup();
  render(<NetworkKnowledgePage initialTypes={types} initialRules={[]} />);
  await user.click(screen.getByRole("button", { name: /업무망/ }));
  let form = screen.getByRole("form", { name: "업무망 편집" });
  expect(within(form).getByRole("button", { name: "쓰지 않음" })).toBeInTheDocument();
  expect(within(form).queryByRole("button", { name: "지우기" })).not.toBeInTheDocument();
  expect(within(form).queryByRole("button", { name: "기본값으로 되돌리기" })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: /DMZ/ }));
  form = screen.getByRole("form", { name: "DMZ 편집" });
  expect(within(form).getByRole("button", { name: "기본값으로 되돌리기" })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: /인터넷/ }));
  form = screen.getByRole("form", { name: "인터넷 편집" });
  expect(within(form).getByRole("button", { name: "다시 쓰기" })).toBeInTheDocument();
});

test("사용 중인 종류 지우기 확인에 구성도 수", async () => {
  const user = userEvent.setup();
  fns.countNetworkTypeUsageAction.mockResolvedValue({ ok: true, count: 3 });
  fns.deleteNetworkTypeAction.mockResolvedValue({ ok: true, rules: [] });
  render(<NetworkKnowledgePage initialTypes={types} initialRules={[]} />);
  await user.click(screen.getByRole("button", { name: /협력사망/ }));
  await user.click(screen.getByRole("button", { name: "지우기" }));
  expect(fns.countNetworkTypeUsageAction).toHaveBeenCalledWith("t4");
  const dlg = await screen.findByRole("alertdialog");
  expect(within(dlg).getByText(/구성도 3곳의 망이 이 종류를 써요/)).toBeInTheDocument();
  await user.click(within(dlg).getByRole("button", { name: "삭제" }));
  expect(fns.deleteNetworkTypeAction).toHaveBeenCalledWith("t4");
  expect(screen.queryByRole("button", { name: /협력사망/ })).not.toBeInTheDocument();
});

test("기관 규칙 추가: 두 종류·방식·근거", async () => {
  const user = userEvent.setup();
  fns.upsertNetworkRuleAction.mockResolvedValue({
    ok: true,
    rules: [{ id: "r1", a: "dmz", b: "internal-net", method: "network_link", note: "보안 지침 3조" }],
  });
  render(<NetworkKnowledgePage initialTypes={types} initialRules={[]} />);
  // 기본 등급 규칙 표는 읽기 전용
  expect(screen.getByRole("table", { name: "기본 등급 규칙" })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "기관 규칙 추가" }));
  const form = screen.getByRole("form", { name: "기관 규칙 추가" });
  await user.selectOptions(within(form).getByLabelText("종류 하나"), "internal-net");
  await user.selectOptions(within(form).getByLabelText("다른 종류"), "dmz");
  await user.selectOptions(within(form).getByLabelText("연결 방식"), "network_link");
  await user.type(within(form).getByLabelText("근거"), "보안 지침 3조");
  await user.click(within(form).getByRole("button", { name: "저장" }));
  expect(fns.upsertNetworkRuleAction).toHaveBeenCalledWith({ a: "internal-net", b: "dmz", method: "network_link", note: "보안 지침 3조" });
  expect(await screen.findByText(/보안 지침 3조/)).toBeInTheDocument();
});

test("쓰지 않는 종류를 가리키는 기관 규칙을 고쳐도 그 종류가 보이고 그대로 저장된다", async () => {
  const user = userEvent.setup();
  fns.upsertNetworkRuleAction.mockResolvedValue({ ok: true, rules: [] });
  render(
    <NetworkKnowledgePage
      initialTypes={types}
      initialRules={[{ id: "r1", a: "dmz", b: "internet", method: "firewall", note: "" }]}
    />,
  );
  await user.click(screen.getByRole("button", { name: /규칙 고치기/ }));
  const form = screen.getByRole("form", { name: "기관 규칙 고치기" });
  expect(within(form).getByLabelText("다른 종류")).toHaveDisplayValue("인터넷 (쓰지 않음)");
  await user.click(within(form).getByRole("button", { name: "저장" }));
  expect(fns.upsertNetworkRuleAction).toHaveBeenCalledWith({ a: "dmz", b: "internet", method: "firewall", note: "" });
});
