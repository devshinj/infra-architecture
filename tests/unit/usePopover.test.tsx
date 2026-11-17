import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { usePopover } from "@/canvas/usePopover";

afterEach(cleanup);

function Harness() {
  const { open, setOpen, root, trigger } = usePopover("input");
  return (
    <div>
      <div ref={root}>
        <button ref={trigger} onClick={() => setOpen((o) => !o)}>
          열기
        </button>
        {open && (
          <div role="dialog" aria-label="팝">
            <label>
              <input type="checkbox" />
              <span>글자</span>
            </label>
          </div>
        )}
      </div>
      <main tabIndex={-1} data-testid="outside">
        바깥
      </main>
    </div>
  );
}

const openIt = () => {
  render(<Harness />);
  fireEvent.click(screen.getByRole("button", { name: "열기" }));
  expect(screen.getByRole("dialog")).toBeInTheDocument();
};

test("a focusout caused by pressing a non-focusable element inside keeps the popover open", () => {
  openIt();
  const label = screen.getByText("글자");
  fireEvent.mouseDown(label);
  // 브라우저는 포커스 불가 글자를 누르면 가장 가까운 포커스 가능 조상(바깥 main)으로 포커스를 옮긴다.
  fireEvent.focusOut(screen.getByRole("checkbox"), { relatedTarget: screen.getByTestId("outside") });
  expect(screen.getByRole("dialog")).toBeInTheDocument();
});

test("pointer press is over after mouseup: a later keyboard focusout closes again", () => {
  openIt();
  fireEvent.mouseDown(screen.getByText("글자"));
  fireEvent.mouseUp(screen.getByText("글자"));
  fireEvent.focusOut(screen.getByRole("checkbox"), { relatedTarget: screen.getByTestId("outside") });
  expect(screen.queryByRole("dialog")).toBeNull();
});

test("a focusout without any pointer press (keyboard) closes the popover", () => {
  openIt();
  fireEvent.focusOut(screen.getByRole("checkbox"), { relatedTarget: screen.getByTestId("outside") });
  expect(screen.queryByRole("dialog")).toBeNull();
});

test("pressing outside still closes", () => {
  openIt();
  fireEvent.mouseDown(screen.getByTestId("outside"));
  expect(screen.queryByRole("dialog")).toBeNull();
});
