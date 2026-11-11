import "@testing-library/jest-dom/vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { ShellProvider, useShell } from "@/ui/Shell";
import { ShellMain } from "@/ui/ShellMain";

afterEach(cleanup);

let setNav: (v: boolean) => void = () => {};
function Probe() {
  setNav = useShell().setNavigating;
  return null;
}

test("while navigating to another diagram the main area shows the workspace skeleton over the current page", () => {
  render(
    <ShellProvider>
      <Probe />
      <ShellMain>
        <p>지금 화면</p>
      </ShellMain>
    </ShellProvider>,
  );
  const main = screen.getByRole("main");
  expect(main).not.toHaveAttribute("data-navigating");
  expect(screen.queryByRole("status")).not.toBeInTheDocument();

  act(() => setNav(true));
  expect(main).toHaveAttribute("data-navigating");
  expect(screen.getByRole("status")).toHaveTextContent("구성도를 불러오는 중");
  // 지금 화면은 감출 뿐 그대로 남는다(이동이 끝나면 새 화면으로 바뀐다).
  expect(screen.getByText("지금 화면")).toBeInTheDocument();

  act(() => setNav(false));
  expect(main).not.toHaveAttribute("data-navigating");
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});
