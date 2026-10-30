import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

const hookState = vi.hoisted(() => ({ busy: false, onCommand: null as null | ((c: unknown) => void), badgeFns: [] as unknown[], warnFns: [] as unknown[], lines: [] as unknown[] }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/app/(app)/actions", () => ({
  clearPinnedAction: vi.fn(), getVersionAction: vi.fn(), importSampleAction: vi.fn(),
  listVersionsAction: vi.fn(async () => []), restoreVersionAction: vi.fn(), savePinnedAction: vi.fn(),
  saveFieldsAction: vi.fn(async () => ({ ok: true, number: 2 })),
  setWarningIgnoredAction: vi.fn(async () => ({ ok: true, number: 2 })),
  listTermsAction: vi.fn(async () => []),
}));
vi.mock("@/canvas/Canvas", () => ({
  Canvas: ({ state, onMention, onBadgeClick, onWarnBadgeClick, onSelect }: { state: { nodes: object }; onMention?: (id: string) => void; onBadgeClick?: (id: string) => void; onWarnBadgeClick?: (id: string) => void; onSelect: (id: string | null) => void }) => {
    hookState.badgeFns.push(onBadgeClick);
    hookState.warnFns.push(onWarnBadgeClick);
    return (
    <div>
      <div data-testid="n">{Object.keys(state.nodes).join(",")}</div>
      {onMention && <button onClick={() => onMention("a")}>멘션a</button>}
      {onBadgeClick && <button onClick={() => onBadgeClick("a")}>배지a</button>}
      {onWarnBadgeClick && <button onClick={() => onWarnBadgeClick("b")}>경고배지b</button>}
      <button onClick={() => onSelect("b")}>선택b</button>
      <button onClick={() => onSelect(null)}>선택해제</button>
    </div>
    );
  },
}));
vi.mock("@/ui/chat/useChatTurn", () => ({
  useChatTurn: (a: { onCommand: (c: unknown) => void }) => {
    hookState.onCommand = a.onCommand;
    return { lines: hookState.lines, busy: hookState.busy, phase: null, send: vi.fn(), stop: vi.fn() };
  },
}));

import { saveFieldsAction, setWarningIgnoredAction } from "@/app/(app)/actions";
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
  hookState.warnFns.length = 0;
  render(ui(mk(1, ["a"])));
  fireEvent.click(screen.getByRole("button", { name: "선택b" }));
  fireEvent.click(screen.getByRole("tab", { name: "설명" }));
  fireEvent.click(screen.getByRole("button", { name: "배지a" }));
  expect(hookState.badgeFns.length).toBeGreaterThan(2);
  expect(new Set(hookState.badgeFns).size).toBe(1);
  expect(new Set(hookState.warnFns).size).toBe(1);
  expect(hookState.warnFns[0]).toBeTypeOf("function");
});

const solo = (n: number, ignored?: string[]) => ({
  number: n,
  state: { ...emptyState(), nodes: Object.fromEntries([web("b")]), ...(ignored ? { ignoredWarnings: ignored } : {}) },
});
const caution = () => screen.getByRole("heading", { name: "주의할 점" }).closest("section")!;

test("ignore saves via action and the warning moves to the ignored list after adoption", async () => {
  hookState.busy = false;
  const { rerender } = render(ui(solo(1) as never));
  fireEvent.click(screen.getByRole("button", { name: "선택b" }));
  await act(async () => {
    fireEvent.click(within(caution()).getByRole("button", { name: "의도된 구성" }));
  });
  expect(setWarningIgnoredAction).toHaveBeenCalledWith("d", "spof:b", true);
  rerender(ui(solo(2, ["spof:b"]) as never));
  expect(within(caution()).getByRole("heading", { name: "의도된 구성으로 표시함" })).toBeInTheDocument();
  expect(within(caution()).getByRole("button", { name: "다시 경고" })).toBeEnabled();
  expect(within(caution()).queryByRole("button", { name: "의도된 구성" })).not.toBeInTheDocument();
});

test("ignore buttons are disabled during a chat turn and action errors show as an alert", async () => {
  hookState.busy = true;
  const { rerender } = render(ui(solo(1) as never));
  fireEvent.click(screen.getByRole("button", { name: "선택b" }));
  expect(within(caution()).getByRole("button", { name: "의도된 구성" })).toBeDisabled();
  hookState.busy = false;
  rerender(ui(solo(1) as never));
  vi.mocked(setWarningIgnoredAction).mockResolvedValueOnce({ ok: false, error: "경고를 찾을 수 없어요" });
  await act(async () => {
    fireEvent.click(within(caution()).getByRole("button", { name: "의도된 구성" }));
  });
  expect(within(caution()).getByRole("alert")).toHaveTextContent("경고를 찾을 수 없어요");
  // 선택이 바뀌면 오류 문구는 지운다.
  fireEvent.click(screen.getByRole("button", { name: "선택해제" }));
  fireEvent.click(screen.getByRole("button", { name: "선택b" }));
  expect(within(caution()).queryByRole("alert")).not.toBeInTheDocument();
});

test("warn badge or chat warning line for the already selected node still opens 설명", () => {
  hookState.busy = false;
  hookState.lines = [{ id: "w1", kind: "warning", text: "주의: b 1대뿐", nodeId: "b", level: "warn" }];
  render(ui(solo(1) as never));
  fireEvent.click(screen.getByRole("button", { name: "선택b" }));
  expect(screen.getByRole("tab", { name: "설명" })).toHaveAttribute("aria-selected", "true");
  fireEvent.click(screen.getByRole("tab", { name: "대화" }));
  fireEvent.click(screen.getByRole("button", { name: "주의: b 1대뿐" }));
  expect(screen.getByRole("tab", { name: "설명" })).toHaveAttribute("aria-selected", "true");
  expect(screen.getByRole("heading", { name: "주의할 점" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("tab", { name: "대화" }));
  fireEvent.click(screen.getByRole("button", { name: "경고배지b" }));
  expect(screen.getByRole("tab", { name: "설명" })).toHaveAttribute("aria-selected", "true");
  expect(screen.getByRole("heading", { name: "주의할 점" })).toBeInTheDocument();
  hookState.lines = [];
});

test("selecting a node shows its explanation in 설명", async () => {
  hookState.busy = false;
  const posts: unknown[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      if (url === "/api/diagrams/d/explain" && (init?.method ?? "GET") === "GET") return new Response("{}", { status: 200 });
      if (url === "/api/diagrams/d/explain") {
        const body = JSON.parse(String(init!.body)) as { targetId: string };
        posts.push(body);
        const explanation = {
          kind: "node", term: "서버", definition: `${body.targetId} 의 정의`, definitionSource: "glossary", reviewed: true,
          role: "역할", adr: { decision: "결정", reason: "이유", alternative: "대안", cost: "대가" },
        };
        return new Response(JSON.stringify({ ok: true, explanation, signature: "x" }), { status: 200 });
      }
      return new Response(JSON.stringify({ qwen: "ok", clef: "ok" }), { status: 200 });
    }),
  );
  try {
    render(ui({ number: 1, state: { ...emptyState(), nodes: Object.fromEntries([web("a"), web("b")]) } } as never));
    fireEvent.click(screen.getByRole("button", { name: "선택b" }));
    expect(screen.getByRole("tab", { name: "설명" })).toHaveAttribute("aria-selected", "true");
    expect(await screen.findByText("b 의 정의")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "이 구성에서의 역할" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "다시 쓰기" })).toBeEnabled();
  } finally {
    vi.unstubAllGlobals();
  }
});

// ---- 대화 패널 너비 ----
const KEY = "infrasketch.panelWidth";
const panelCols = (c: HTMLElement) => (c.firstElementChild as HTMLElement).style.gridTemplateColumns;

test("width is saved and restored from localStorage after mount", () => {
  window.localStorage.clear();
  const first = render(ui(mk(1, ["a"])));
  expect(panelCols(first.container)).toBe("minmax(0, 1fr) 360px");
  fireEvent.keyDown(screen.getByRole("separator", { name: "대화 패널 너비" }), { key: "ArrowLeft" });
  expect(window.localStorage.getItem(KEY)).toBe("376");
  expect(panelCols(first.container)).toBe("minmax(0, 1fr) 376px");
  first.unmount();
  window.localStorage.setItem(KEY, "500");
  const second = render(ui(mk(1, ["a"])));
  expect(panelCols(second.container)).toBe("minmax(0, 1fr) 500px");
  window.localStorage.clear();
});

test("invalid stored value is ignored", () => {
  for (const bad of ["abc", "100", "9999", ""]) {
    window.localStorage.setItem(KEY, bad);
    const r = render(ui(mk(1, ["a"])));
    expect(panelCols(r.container)).toBe("minmax(0, 1fr) 360px");
    r.unmount();
  }
  window.localStorage.clear();
});
