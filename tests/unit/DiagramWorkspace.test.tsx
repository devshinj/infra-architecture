import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

const hookState = vi.hoisted(() => ({ busy: false, onCommand: null as null | ((c: unknown) => void), badgeFns: [] as unknown[] }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/app/(app)/actions", () => ({
  clearPinnedAction: vi.fn(), getVersionAction: vi.fn(), importSampleAction: vi.fn(),
  listVersionsAction: vi.fn(async () => []), restoreVersionAction: vi.fn(), savePinnedAction: vi.fn(),
  saveFieldsAction: vi.fn(async () => ({ ok: true, number: 2 })),
}));
vi.mock("@/canvas/Canvas", () => ({
  Canvas: ({ state, onMention, onBadgeClick, onSelect }: { state: { nodes: object }; onMention?: (id: string) => void; onBadgeClick?: (id: string) => void; onSelect: (id: string | null) => void }) => {
    hookState.badgeFns.push(onBadgeClick);
    return (
    <div>
      <div data-testid="n">{Object.keys(state.nodes).join(",")}</div>
      {onMention && <button onClick={() => onMention("a")}>멘션a</button>}
      {onBadgeClick && <button onClick={() => onBadgeClick("a")}>배지a</button>}
      <button onClick={() => onSelect("b")}>선택b</button>
      <button onClick={() => onSelect(null)}>선택해제</button>
    </div>
    );
  },
}));
vi.mock("@/ui/chat/useChatTurn", () => ({
  useChatTurn: (a: { onCommand: (c: unknown) => void }) => {
    hookState.onCommand = a.onCommand;
    return { lines: [], busy: hookState.busy, phase: null, send: vi.fn(), stop: vi.fn() };
  },
}));

import { saveFieldsAction } from "@/app/(app)/actions";
import { emptyState } from "@/domain/types";
import { DiagramWorkspace } from "@/ui/DiagramWorkspace";

afterEach(cleanup);
// jsdom 에는 scrollIntoView 가 없다: 테스트마다 끼우고 원래대로 돌려 둔다.
const origScroll = Object.getOwnPropertyDescriptor(Element.prototype, "scrollIntoView");
beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(() => {
  if (origScroll) Object.defineProperty(Element.prototype, "scrollIntoView", origScroll);
  else delete (Element.prototype as { scrollIntoView?: unknown }).scrollIntoView;
});

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

const web = (id: string) => [id, { id, kind: "web_server", label: id, parent: null, attrs: {} }];

test("badge click opens the chat tab checklist at that node", async () => {
  hookState.busy = false;
  const latest = { number: 1, state: { ...emptyState(), nodes: Object.fromEntries([web("a"), web("b")]) } };
  render(<DiagramWorkspace diagramId="d" name="n" latest={latest as never} initialPinned={{}} samples={[]} />);
  fireEvent.click(screen.getByRole("tab", { name: "설명" }));
  fireEvent.click(screen.getByRole("button", { name: "배지a" }));
  expect(screen.getByRole("tab", { name: "대화" })).toHaveAttribute("aria-selected", "true");
  expect(screen.getByRole("button", { name: /채워야 할 정보/ })).toHaveAttribute("aria-expanded", "true");
  const a = screen.getByRole("group", { name: "a" });
  const host = within(a).getByRole("textbox", { name: "호스트명" });
  expect(host).toHaveFocus();
  // 접고 같은 배지를 다시 눌러도 다시 펼쳐진다.
  fireEvent.click(screen.getByRole("button", { name: /채워야 할 정보/ }));
  fireEvent.click(screen.getByRole("button", { name: "배지a" }));
  expect(screen.getByRole("button", { name: /채워야 할 정보/ })).toHaveAttribute("aria-expanded", "true");
  // 저장은 saveFieldsAction 으로 간다.
  fireEvent.change(within(screen.getByRole("group", { name: "a" })).getByRole("textbox", { name: "호스트명" }), { target: { value: "web-01" } });
  await act(async () => {
    fireEvent.click(within(screen.getByRole("group", { name: "a" })).getByRole("button", { name: "저장" }));
  });
  expect(saveFieldsAction).toHaveBeenCalledWith("d", { targetKind: "node", targetId: "a", values: { hostname: "web-01" }, unknown: [] });
});

test("drafts survive leaving the 대화 tab", () => {
  hookState.busy = false;
  const latest = { number: 1, state: { ...emptyState(), nodes: Object.fromEntries([web("a"), web("b")]) } };
  render(<DiagramWorkspace diagramId="d" name="n" latest={latest as never} initialPinned={{}} samples={[]} />);
  fireEvent.click(screen.getByRole("button", { name: /채워야 할 정보/ }));
  fireEvent.change(within(screen.getByRole("group", { name: "a" })).getByRole("textbox", { name: "호스트명" }), { target: { value: "web-01" } });
  // 노드를 고르면 설명 탭으로 가고 체크리스트는 내려간다.
  fireEvent.click(screen.getByRole("button", { name: "선택b" }));
  expect(screen.getByRole("tab", { name: "설명" })).toHaveAttribute("aria-selected", "true");
  expect(screen.queryByRole("button", { name: /채워야 할 정보/ })).not.toBeInTheDocument();
  // 선택을 풀면 대화로 돌아오고, 펼침과 초안이 그대로다.
  fireEvent.click(screen.getByRole("button", { name: "선택해제" }));
  expect(screen.getByRole("tab", { name: "대화" })).toHaveAttribute("aria-selected", "true");
  expect(screen.getByRole("button", { name: /채워야 할 정보/ })).toHaveAttribute("aria-expanded", "true");
  expect(within(screen.getByRole("group", { name: "a" })).getByRole("textbox", { name: "호스트명" })).toHaveValue("web-01");
});

test("onBadgeClick keeps its identity across workspace re-renders (Canvas memo deps)", () => {
  hookState.busy = false;
  hookState.badgeFns.length = 0;
  render(ui(mk(1, ["a"])));
  fireEvent.click(screen.getByRole("button", { name: "선택b" }));
  fireEvent.click(screen.getByRole("tab", { name: "설명" }));
  fireEvent.click(screen.getByRole("button", { name: "배지a" }));
  expect(hookState.badgeFns.length).toBeGreaterThan(2);
  expect(new Set(hookState.badgeFns).size).toBe(1);
});
