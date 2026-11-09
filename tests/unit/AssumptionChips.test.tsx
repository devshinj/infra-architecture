import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";

import { AssumptionChips } from "@/ui/chat/AssumptionChips";

afterEach(cleanup);

const A = {
  scale: { key: "scale", value: "중규모(일 1만 명)", confirmed: false },
  environment: { key: "environment", value: "사내 IDC", confirmed: true },
  zeta: { key: "zeta", value: "z", confirmed: false },
  alpha: { key: "alpha", value: "a", confirmed: false },
};

const setup = (o: { busy?: boolean } = {}) => {
  const onChoose = vi.fn();
  const onConfirm = vi.fn();
  render(<AssumptionChips assumptions={A} busy={o.busy ?? false} onChoose={onChoose} onConfirm={onConfirm} />);
  return { onChoose, onConfirm };
};

test("chip shows value and opens choices; choosing calls onChoose", async () => {
  const { onChoose } = setup();
  const chip = screen.getByRole("button", { name: /규모: 중규모/ });
  expect(chip).toHaveAttribute("aria-expanded", "false");
  await userEvent.click(chip);
  expect(chip).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByRole("button", { name: /중규모\(일 1만 명\)현재/ })).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "대규모(일 10만 명 이상)" }));
  expect(onChoose).toHaveBeenCalledWith("scale", "대규모(일 10만 명 이상)");
  expect(chip).toHaveAttribute("aria-expanded", "false");
});

test("이대로 확정 calls onConfirm; Escape closes", async () => {
  const { onConfirm } = setup();
  await userEvent.click(screen.getByRole("button", { name: /규모:/ }));
  await userEvent.click(screen.getByRole("button", { name: "이대로 확정" }));
  expect(onConfirm).toHaveBeenCalledWith("scale");
  await userEvent.click(screen.getByRole("button", { name: /규모:/ }));
  await userEvent.keyboard("{Escape}");
  expect(screen.queryByRole("button", { name: "이대로 확정" })).not.toBeInTheDocument();
});

test("confirmed chip shows 확정", () => {
  setup();
  expect(screen.getByRole("button", { name: /환경: 사내 IDC.*확정/ })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /규모: 중규모/ })).not.toHaveTextContent("확정");
});

test("order: labelled keys first, others alphabetical; unknown key has only confirm", async () => {
  setup();
  const names = screen.getAllByRole("button").map((b) => b.textContent ?? "");
  expect(names[0]).toMatch(/^환경/);
  expect(names[1]).toMatch(/^규모/);
  expect(names[2]).toMatch(/^alpha/);
  expect(names[3]).toMatch(/^zeta/);
  await userEvent.click(screen.getByRole("button", { name: /alpha: a/ }));
  expect(screen.getByRole("button", { name: "이대로 확정" })).toBeInTheDocument();
  expect(screen.getAllByRole("button")).toHaveLength(5);
});

test("busy disables chips", () => {
  setup({ busy: true });
  for (const b of screen.getAllByRole("button")) expect(b).toBeDisabled();
});

test("AssumptionChips: no_link 가정은 망 이름 짝으로 보인다", () => {
  const groups = {
    "admin-net": { id: "admin-net", groupKind: "network_zone" as const, label: "행정망", parent: null },
    "gcloud-internet": { id: "gcloud-internet", groupKind: "network_zone" as const, label: "GCloud 인터넷망", parent: null },
  };
  const assumptions = {
    "no_link:admin-net--gcloud-internet": { key: "no_link:admin-net--gcloud-internet", value: "망연계 없이 통신(사용자 확인)", confirmed: true },
    "no_link:admin-net--gone": { key: "no_link:admin-net--gone", value: "망연계 없이 통신", confirmed: false },
  };
  render(<AssumptionChips assumptions={assumptions} groups={groups} busy={false} onChoose={vi.fn()} onConfirm={vi.fn()} />);
  expect(screen.getByText("망연계 없음: 행정망 ↔ GCloud 인터넷망")).toBeInTheDocument();
  // 사라진 망은 id 그대로 쓴다.
  expect(screen.getByText("망연계 없음: 행정망 ↔ gone")).toBeInTheDocument();
  // 선택지 칩(펼치는 단추)은 없다.
  expect(screen.queryByRole("button", { name: /망연계 없음/ })).not.toBeInTheDocument();
  expect(screen.queryByText(/no_link:/)).not.toBeInTheDocument();
});

test("AssumptionChips: no_link 가정은 지우기 단추로 지운다(이력 보기·바쁠 때는 못 지운다)", async () => {
  const groups = {
    "admin-net": { id: "admin-net", groupKind: "network_zone" as const, label: "행정망", parent: null },
    "gcloud-internet": { id: "gcloud-internet", groupKind: "network_zone" as const, label: "GCloud 인터넷망", parent: null },
  };
  const key = "no_link:admin-net--gcloud-internet";
  const assumptions = { [key]: { key, value: "망연계 없이 통신(사용자 확인)", confirmed: true } };
  const onRemoveNoLink = vi.fn();
  const name = "행정망 ↔ GCloud 인터넷망 망연계 없음 기억 지우기";
  const { rerender } = render(<AssumptionChips assumptions={assumptions} groups={groups} busy={false} onChoose={vi.fn()} onConfirm={vi.fn()} onRemoveNoLink={onRemoveNoLink} />);
  await userEvent.click(screen.getByRole("button", { name }));
  expect(onRemoveNoLink).toHaveBeenCalledWith(key);
  rerender(<AssumptionChips assumptions={assumptions} groups={groups} busy onChoose={vi.fn()} onConfirm={vi.fn()} onRemoveNoLink={onRemoveNoLink} />);
  expect(screen.getByRole("button", { name })).toBeDisabled();
  rerender(<AssumptionChips assumptions={assumptions} groups={groups} busy={false} readOnly onChoose={vi.fn()} onConfirm={vi.fn()} onRemoveNoLink={onRemoveNoLink} />);
  expect(screen.queryByRole("button", { name })).not.toBeInTheDocument();
  expect(screen.getByText("망연계 없음: 행정망 ↔ GCloud 인터넷망")).toBeInTheDocument();
});
