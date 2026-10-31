import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { EDGE_KINDS } from "@/domain/catalog";
import { Legend } from "@/ui/canvas/Legend";

const KEY = "infrasketch.legendOpen";
beforeEach(() => window.localStorage.clear());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

test("legend is collapsed by default and toggles with aria-expanded", async () => {
  const user = userEvent.setup();
  render(<Legend hideAux={false} />);
  const btn = screen.getByRole("button", { name: /범례/ });
  expect(btn).toHaveAttribute("aria-expanded", "false");
  expect(screen.queryByText("연결 범례")).toBeNull();
  await user.click(btn);
  expect(btn).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByText("연결 범례")).toBeInTheDocument();
  await user.click(btn);
  expect(btn).toHaveAttribute("aria-expanded", "false");
});

test("legend lists four edge kinds from catalog plus dot, junction and arrow rows", async () => {
  render(<Legend hideAux={false} />);
  await userEvent.click(screen.getByRole("button", { name: /범례/ }));
  const list = screen.getByRole("list");
  for (const k of EDGE_KINDS) expect(within(list).getByText(k.label)).toBeInTheDocument();
  expect(within(list).getByText("움직이는 금색 점: 요청이 흘러가는 방향")).toBeInTheDocument();
  expect(within(list).getByText("작은 점: 여러 연결이 한 줄로 합쳐지는 곳")).toBeInTheDocument();
  expect(within(list).getByText("화살표: 연결이 향하는 쪽")).toBeInTheDocument();
  expect(within(list).getAllByRole("listitem")).toHaveLength(7);
  expect(screen.queryByText("숨김")).toBeNull();
});

test("aux row shows 숨김 when hideAux", async () => {
  render(<Legend hideAux />);
  await userEvent.click(screen.getByRole("button", { name: /범례/ }));
  const aux = screen.getByText("보조(관리·모니터링)").closest("li") as HTMLElement;
  expect(within(aux).getByText("숨김")).toBeInTheDocument();
});

test("Esc closes and returns focus to the button", async () => {
  const user = userEvent.setup();
  render(<Legend hideAux={false} />);
  const btn = screen.getByRole("button", { name: /범례/ });
  await user.click(btn);
  await user.keyboard("{Escape}");
  expect(btn).toHaveAttribute("aria-expanded", "false");
  expect(btn).toHaveFocus();
});

test("open state persists in localStorage and survives storage errors", async () => {
  const user = userEvent.setup();
  const { unmount } = render(<Legend hideAux={false} />);
  await user.click(screen.getByRole("button", { name: /범례/ }));
  expect(window.localStorage.getItem(KEY)).toBe("1");
  unmount();
  render(<Legend hideAux={false} />);
  expect(await screen.findByText("연결 범례")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: /범례/ }));
  expect(window.localStorage.getItem(KEY)).toBe("0");
  cleanup();

  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  render(<Legend hideAux={false} />);
  const btn = screen.getByRole("button", { name: /범례/ });
  await user.click(btn);
  expect(btn).toHaveAttribute("aria-expanded", "true");
});

test("hidden on an empty diagram", () => {
  render(<Legend hideAux={false} empty />);
  expect(screen.queryByRole("button", { name: /범례/ })).toBeNull();
});
