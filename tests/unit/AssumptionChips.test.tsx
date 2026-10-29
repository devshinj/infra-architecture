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
