import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

const hookState = vi.hoisted(() => ({ busy: false, onCommand: null as null | ((c: unknown) => void) }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/app/(app)/actions", () => ({
  clearPinnedAction: vi.fn(), getVersionAction: vi.fn(), importSampleAction: vi.fn(),
  listVersionsAction: vi.fn(async () => []), restoreVersionAction: vi.fn(), savePinnedAction: vi.fn(),
}));
vi.mock("@/canvas/Canvas", () => ({
  Canvas: ({ state, onMention }: { state: { nodes: object }; onMention?: (id: string) => void }) => (
    <div>
      <div data-testid="n">{Object.keys(state.nodes).join(",")}</div>
      {onMention && <button onClick={() => onMention("a")}>멘션a</button>}
    </div>
  ),
}));
vi.mock("@/ui/chat/useChatTurn", () => ({
  useChatTurn: (a: { onCommand: (c: unknown) => void }) => {
    hookState.onCommand = a.onCommand;
    return { lines: [], busy: hookState.busy, phase: null, send: vi.fn(), stop: vi.fn() };
  },
}));

import { emptyState } from "@/domain/types";
import { DiagramWorkspace } from "@/ui/DiagramWorkspace";

afterEach(cleanup);

const mk = (n: number, ids: string[]) => ({
  number: n,
  state: { ...emptyState(), nodes: Object.fromEntries(ids.map((id) => [id, { id, kind: "server", label: id, parent: null, attrs: {} }])) },
});
const ui = (latest: ReturnType<typeof mk>) => (
  <DiagramWorkspace diagramId="d" name="n" latest={latest as never} initialPinned={{}} samples={[]} />
);

test("newer server state is not adopted while busy, then adopted after", () => {
  hookState.busy = true;
  const { rerender } = render(ui(mk(1, ["a"])));
  act(() => hookState.onCommand!({ op: "add_node", id: "b", kind: "server", label: "b", parent: null }));
  expect(screen.getByTestId("n")).toHaveTextContent("a,b");
  rerender(ui(mk(2, ["a", "x"])));
  expect(screen.getByTestId("n")).toHaveTextContent("a,b");
  hookState.busy = false;
  rerender(ui(mk(2, ["a", "x"])));
  expect(screen.getByTestId("n")).toHaveTextContent("a,x");
});

test("canvas mention opens the 대화 tab and inserts a chip for the node", () => {
  hookState.busy = false;
  render(ui(mk(1, ["a"])));
  fireEvent.click(screen.getByRole("tab", { name: "설명" }));
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "멘션a" }));
  expect(screen.getByRole("tab", { name: "대화" })).toHaveAttribute("aria-selected", "true");
  expect(screen.getByRole("button", { name: "a 참조 제거" })).toBeInTheDocument();
  expect(screen.getByRole("textbox")).toHaveFocus();
});
