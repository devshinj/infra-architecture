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
  id: "t1", key: "internal-net", name: "업무망", aliases: [], description: "", grade: "internal", separated: false,
  source: "seed", edited: false, hidden: false, ...o,
});
const types = [
  row({ id: "t1", key: "internal-net", name: "업무망", grade: "internal", separated: true }),
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
  expect(fns.addNetworkTypeAction).toHaveBeenCalledWith({ name: "실험망", aliases: ["랩", "테스트망"], description: "", grade: "internal", separated: false });
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

test("기관 규칙 고치기에서는 두 종류를 바꿀 수 없고, 방식·근거만 바꿔 같은 짝으로 저장한다", async () => {
  const user = userEvent.setup();
  fns.upsertNetworkRuleAction.mockResolvedValue({ ok: true, rules: [] });
  render(
    <NetworkKnowledgePage
      initialTypes={types}
      initialRules={[{ id: "r1", a: "dmz", b: "internal-net", method: "firewall", note: "" }]}
    />,
  );
  await user.click(screen.getByRole("button", { name: /규칙 고치기/ }));
  const form = screen.getByRole("form", { name: "기관 규칙 고치기" });
  expect(within(form).getByLabelText("종류 하나")).toBeDisabled();
  expect(within(form).getByLabelText("다른 종류")).toBeDisabled();
  expect(within(form).getByText("종류를 바꾸려면 이 규칙을 지우고 새로 추가해 주세요.")).toBeInTheDocument();
  await user.selectOptions(within(form).getByLabelText("연결 방식"), "network_link");
  await user.type(within(form).getByLabelText("근거"), "지침 2조");
  await user.click(within(form).getByRole("button", { name: "저장" }));
  expect(fns.upsertNetworkRuleAction).toHaveBeenCalledWith({ a: "dmz", b: "internal-net", method: "network_link", note: "지침 2조" });
});

test("기관 규칙 추가에서는 두 종류를 고를 수 있다", async () => {
  const user = userEvent.setup();
  render(<NetworkKnowledgePage initialTypes={types} initialRules={[]} />);
  await user.click(screen.getByRole("button", { name: "기관 규칙 추가" }));
  const form = screen.getByRole("form", { name: "기관 규칙 추가" });
  expect(within(form).getByLabelText("종류 하나")).toBeEnabled();
  expect(within(form).queryByText("종류를 바꾸려면 이 규칙을 지우고 새로 추가해 주세요.")).toBeNull();
});

test("망분리 대상: 목록에 표시가 붙고, 체크를 바꿔 저장하면 separated 를 보낸다", async () => {
  const user = userEvent.setup();
  fns.updateNetworkTypeAction.mockResolvedValue({ ok: true, type: row({ id: "t2", key: "dmz", name: "DMZ", grade: "boundary", edited: true, separated: true }) });
  render(<NetworkKnowledgePage initialTypes={types} initialRules={[]} />);
  expect(within(screen.getByRole("button", { name: /업무망/ })).getByText("망분리 대상")).toBeInTheDocument();
  expect(within(screen.getByRole("button", { name: /DMZ/ })).queryByText("망분리 대상")).toBeNull();

  await user.click(screen.getByRole("button", { name: /DMZ/ }));
  const form = screen.getByRole("form", { name: "DMZ 편집" });
  const box = within(form).getByRole("checkbox", { name: /망분리 대상/ });
  expect(box).not.toBeChecked();
  await user.click(box);
  await user.click(within(form).getByRole("button", { name: "저장" }));
  expect(fns.updateNetworkTypeAction).toHaveBeenCalledWith("t2", expect.objectContaining({ separated: true }));
  expect(await within(screen.getByRole("button", { name: /DMZ/ })).findByText("망분리 대상")).toBeInTheDocument();
});

test("기본 제공 짝 규칙: 쓰는 종류끼리의 규칙만 표로 보이고, 같은 짝에 기관 규칙이 있으면 그렇게 알린다", () => {
  const seedTypes = [
    row({ id: "s1", key: "server-farm", name: "서버팜" }),
    row({ id: "s2", key: "storage-net", name: "스토리지망" }),
    row({ id: "s3", key: "internet", name: "인터넷망", grade: "external" }),
    row({ id: "s4", key: "backup-net", name: "백업망", hidden: true }),
  ];
  const { rerender } = render(<NetworkKnowledgePage initialTypes={seedTypes} initialRules={[]} />);
  const table = screen.getByRole("table", { name: "기본 제공 짝 규칙" });
  const direct = within(table).getByRole("row", { name: /서버팜 ↔ 스토리지망/ });
  expect(within(direct).getByText("직접 연결(사이에 통제 장비 없음)")).toBeInTheDocument();
  expect(within(table).getByRole("row", { name: /인터넷망 ↔ 서버팜/ })).toBeInTheDocument();
  // 쓰지 않는(숨긴) 종류가 낀 규칙은 보이지 않는다.
  expect(within(table).queryByRole("row", { name: /백업망/ })).toBeNull();
  // 등급 규칙 표에는 망분리 대상일 때만 맞는 줄이 따로 있다.
  expect(within(screen.getByRole("table", { name: "기본 등급 규칙" })).getByRole("row", { name: /내부 ↔ 외부 \(둘 중 하나가 망분리 대상\).*망연계 필요/ })).toBeInTheDocument();

  rerender(
    <NetworkKnowledgePage
      key="with-rule"
      initialTypes={seedTypes}
      initialRules={[{ id: "r1", a: "server-farm", b: "storage-net", method: "firewall", note: "사내 표준" }]}
    />,
  );
  const overridden = within(screen.getByRole("table", { name: "기본 제공 짝 규칙" })).getByRole("row", { name: /서버팜 ↔ 스토리지망/ });
  expect(within(overridden).getByText(/기관 규칙이 먼저/)).toBeInTheDocument();
});

test("종류 편집: 다른 종류를 골라도 입력이 남고 「수정 중」이 붙는다, 닫기·Esc 도 같다", async () => {
  const user = userEvent.setup();
  render(<NetworkKnowledgePage initialTypes={types} initialRules={[]} />);
  await user.click(screen.getByRole("button", { name: /업무망/ }));
  await user.type(within(screen.getByRole("form", { name: "업무망 편집" })).getByLabelText("설명"), "사내 업무용");
  await user.click(screen.getByRole("button", { name: /DMZ/ }));
  expect(within(screen.getByRole("button", { name: /업무망/ })).getByText("수정 중")).toBeInTheDocument();
  expect(within(screen.getByRole("form", { name: "DMZ 편집" })).getByLabelText("설명")).toHaveValue("");

  await user.click(within(screen.getByRole("form", { name: "DMZ 편집" })).getByLabelText("이름"));
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("form")).toBeNull();
  expect(screen.getByRole("button", { name: /DMZ/ })).toHaveFocus();

  await user.click(screen.getByRole("button", { name: /업무망/ }));
  expect(within(screen.getByRole("form", { name: "업무망 편집" })).getByLabelText("설명")).toHaveValue("사내 업무용");
  await user.click(screen.getByRole("button", { name: "닫기" }));
  expect(screen.getByRole("button", { name: /업무망/ })).toHaveFocus();
});

test("저장 결과와 오류는 편집 판 안에 보인다(페이지 맨 위가 아니라)", async () => {
  const user = userEvent.setup();
  fns.updateNetworkTypeAction
    .mockResolvedValueOnce({ ok: false, error: "이름을 입력해 주세요" })
    .mockResolvedValueOnce({ ok: true, type: row({ id: "t2", key: "dmz", name: "DMZ2", grade: "boundary", edited: true }) });
  render(<NetworkKnowledgePage initialTypes={types} initialRules={[]} />);
  await user.click(screen.getByRole("button", { name: /DMZ/ }));
  const form = screen.getByRole("form", { name: "DMZ 편집" });
  await user.click(within(form).getByRole("button", { name: "저장" }));
  expect(await within(form).findByRole("alert")).toHaveTextContent("이름을 입력해 주세요");
  await user.click(within(form).getByRole("button", { name: "저장" }));
  const saved = screen.getByRole("form", { name: "DMZ2 편집" });
  expect(await within(saved).findByText("저장했어요.")).toBeInTheDocument();
  expect(within(saved).queryByRole("alert")).toBeNull();
  expect(within(screen.getByRole("button", { name: /DMZ2/ })).queryByText("수정 중")).toBeNull();
});

test("망 종류 검색: 이름·다른 이름으로 거르고, 맞는 게 없는 등급은 접는다", async () => {
  const user = userEvent.setup();
  render(<NetworkKnowledgePage initialTypes={[...types.slice(0, 3), row({ id: "t5", key: "lab", name: "실험망", aliases: ["테스트망"] })]} initialRules={[]} />);
  await user.type(screen.getByRole("searchbox", { name: "망 종류 검색" }), "테스트");
  expect(screen.getByRole("button", { name: /실험망/ })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /업무망/ })).toBeNull();
  expect(screen.queryByRole("heading", { name: "경계" })).toBeNull();
  await user.clear(screen.getByRole("searchbox", { name: "망 종류 검색" }));
  await user.type(screen.getByRole("searchbox", { name: "망 종류 검색" }), "없는이름");
  expect(screen.getByText("맞는 종류가 없어요.")).toBeInTheDocument();
});

test("기관 규칙 고치기 판은 그 줄 바로 아래에 열리고, Esc 로 닫으면 고치기 버튼으로 초점이 돌아간다", async () => {
  const user = userEvent.setup();
  render(
    <NetworkKnowledgePage
      initialTypes={types}
      initialRules={[
        { id: "r1", a: "dmz", b: "internal-net", method: "firewall", note: "" },
        { id: "r2", a: "dmz", b: "partner", method: "firewall", note: "" },
      ]}
    />,
  );
  const edit = screen.getByRole("button", { name: "DMZ ↔ 업무망 규칙 고치기" });
  await user.click(edit);
  const form = screen.getByRole("form", { name: "기관 규칙 고치기" });
  const items = within(form.closest("ul")!).getAllByRole("listitem");
  expect(items[1]).toContainElement(form);
  expect(within(form).getByLabelText("연결 방식")).toHaveFocus();
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("form", { name: "기관 규칙 고치기" })).toBeNull();
  expect(edit).toHaveFocus();
});
