import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

const hookState = vi.hoisted(() => ({ busy: false, onCommand: null as null | ((c: unknown) => void), badgeFns: [] as unknown[], warnFns: [] as unknown[], lines: [] as unknown[], insets: [] as unknown[], focus: [] as unknown[], turn: null as null | { onDone(): void; onInterrupted(): void } }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/app/(app)/actions", () => ({
  clearPinnedAction: vi.fn(), getVersionAction: vi.fn(), importSampleAction: vi.fn(),
  listVersionsAction: vi.fn(async () => []), restoreVersionAction: vi.fn(), savePinnedAction: vi.fn(),
  saveFieldsAction: vi.fn(async () => ({ ok: true, number: 2 })),
  setWarningIgnoredAction: vi.fn(async () => ({ ok: true, number: 2 })),
  listTermsAction: vi.fn(async () => []),
}));
vi.mock("@/canvas/Canvas", () => ({
  Canvas: ({ state, fitKey, cameraInsets, focusRequest, onMention, onBadgeClick, onWarnBadgeClick, onSelect }: { state: { nodes: object }; fitKey?: string; cameraInsets?: unknown; focusRequest?: unknown; onMention?: (id: string) => void; onBadgeClick?: (id: string) => void; onWarnBadgeClick?: (id: string) => void; onSelect: (id: string | null) => void }) => {
    hookState.insets.push(cameraInsets);
    hookState.focus.push(focusRequest);
    hookState.badgeFns.push(onBadgeClick);
    hookState.warnFns.push(onWarnBadgeClick);
    return (
    <div>
      <div data-testid="n">{Object.keys(state.nodes).join(",")}</div>
      <div data-testid="fit">{fitKey}</div>
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
  useChatTurn: (a: { onCommand: (c: unknown) => void; onDone(): void; onInterrupted(): void }) => {
    hookState.onCommand = a.onCommand;
    hookState.turn = a;
    return { lines: hookState.lines, busy: hookState.busy, send: vi.fn(), stop: vi.fn() };
  },
}));

import { getVersionAction, listVersionsAction, saveFieldsAction, setWarningIgnoredAction } from "@/app/(app)/actions";
import { emptyState } from "@/domain/types";
import { DiagramWorkspace } from "@/ui/DiagramWorkspace";
import { ShellProvider } from "@/ui/Shell";

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

const cardToggle = () => screen.getByRole("button", { name: /^구성 정보 (펼치기|접기)$/ });
const two = () => ({ number: 1, state: { ...emptyState(), nodes: Object.fromEntries([web("a"), web("b")]) } });

test("badge click opens card at that node block and focuses first input", async () => {
  hookState.busy = false;
  render(ui(two() as never));
  fireEvent.click(screen.getByRole("tab", { name: "설명" }));
  expect(cardToggle()).toHaveAttribute("aria-expanded", "false");
  fireEvent.click(screen.getByRole("button", { name: "배지a" }));
  // 대화 탭으로 가지 않는다.
  expect(screen.getByRole("tab", { name: "설명" })).toHaveAttribute("aria-selected", "true");
  expect(cardToggle()).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByRole("button", { name: "a 항목 접기" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "b 항목 펼치기" })).toBeInTheDocument();
  expect(within(screen.getByRole("group", { name: "a" })).getByRole("textbox", { name: "호스트명" })).toHaveFocus();
  // 카드를 접고 같은 배지를 다시 눌러도 다시 펼쳐진다.
  fireEvent.click(cardToggle());
  expect(cardToggle()).toHaveAttribute("aria-expanded", "false");
  fireEvent.click(screen.getByRole("button", { name: "배지a" }));
  expect(cardToggle()).toHaveAttribute("aria-expanded", "true");
  expect(within(screen.getByRole("group", { name: "a" })).getByRole("textbox", { name: "호스트명" })).toHaveFocus();
  // 저장은 saveFieldsAction 으로 간다.
  fireEvent.change(within(screen.getByRole("group", { name: "a" })).getByRole("textbox", { name: "호스트명" }), { target: { value: "web-01" } });
  await act(async () => {
    fireEvent.click(within(screen.getByRole("group", { name: "a" })).getByRole("button", { name: "저장" }));
  });
  expect(saveFieldsAction).toHaveBeenCalledWith("d", { targetKind: "node", targetId: "a", values: { hostname: "web-01" }, unknown: [] });
});

test("title click sends focus request without selecting", () => {
  hookState.busy = false;
  hookState.focus.length = 0;
  render(ui(two() as never));
  fireEvent.click(cardToggle());
  fireEvent.click(screen.getByRole("button", { name: "b 위치 보기" }));
  expect(hookState.focus.at(-1)).toEqual({ id: "b", token: expect.any(Number) });
  const first = (hookState.focus.at(-1) as { token: number }).token;
  // 선택하지 않으니 설명 탭으로 가지 않는다.
  expect(screen.getByRole("tab", { name: "대화" })).toHaveAttribute("aria-selected", "true");
  // 같은 노드를 다시 눌러도 새 토큰으로 다시 보낸다.
  fireEvent.click(screen.getByRole("button", { name: "b 위치 보기" }));
  expect((hookState.focus.at(-1) as { token: number }).token).toBeGreaterThan(first);
});

test("drafts and expanded blocks survive tab switch and card collapse", () => {
  hookState.busy = false;
  render(ui(two() as never));
  fireEvent.click(cardToggle());
  fireEvent.click(screen.getByRole("button", { name: "a 항목 펼치기" }));
  fireEvent.change(within(screen.getByRole("group", { name: "a" })).getByRole("textbox", { name: "호스트명" }), { target: { value: "web-01" } });
  // 노드를 고르면 설명 탭으로 간다. 카드는 캔버스에 있어 그대로다.
  fireEvent.click(screen.getByRole("button", { name: "선택b" }));
  expect(screen.getByRole("tab", { name: "설명" })).toHaveAttribute("aria-selected", "true");
  expect(within(screen.getByRole("group", { name: "a" })).getByRole("textbox", { name: "호스트명" })).toHaveValue("web-01");
  // 카드를 접었다 펴도 펼침과 초안이 남는다.
  fireEvent.click(cardToggle());
  expect(screen.queryByRole("group", { name: "a" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "선택해제" }));
  fireEvent.click(cardToggle());
  expect(screen.getByRole("button", { name: "a 항목 접기" })).toBeInTheDocument();
  expect(within(screen.getByRole("group", { name: "a" })).getByRole("textbox", { name: "호스트명" })).toHaveValue("web-01");
  expect(screen.getByRole("textbox", { name: "호스트명" })).not.toHaveFocus();
});

test("주의 N chip opens the card at the warnings section", () => {
  hookState.busy = false;
  hookState.lines = [{ id: "w1", kind: "warning", text: "주의 1", turn: "t" }];
  render(ui(solo(1) as never));
  expect(cardToggle()).toHaveAttribute("aria-expanded", "false");
  vi.mocked(Element.prototype.scrollIntoView).mockClear();
  fireEvent.click(screen.getByRole("button", { name: "주의 1" }));
  expect(cardToggle()).toHaveAttribute("aria-expanded", "true");
  expect(vi.mocked(Element.prototype.scrollIntoView).mock.contexts.at(-1)).toBe(screen.getByRole("region", { name: "주의" }));
  hookState.lines = [];
});

test("read-only card in history view", async () => {
  hookState.busy = false;
  const row = (number: number) => ({ number, source: "ai", status: "complete", restoredFrom: null, createdAt: new Date(0) });
  vi.mocked(listVersionsAction).mockResolvedValue([row(1), row(2)] as never);
  vi.mocked(getVersionAction).mockResolvedValue({ ...emptyState(), nodes: Object.fromEntries([web("a")]), assumptions: { scale: { key: "scale", value: "중규모(일 1만 명)", confirmed: false } } } as never);
  render(ui({ number: 2, state: { ...emptyState(), nodes: Object.fromEntries([web("a"), web("b")]) } } as never));
  await act(async () => {
    fireEvent.click(screen.getByRole("tab", { name: "이력" }));
  });
  fireEvent.click(await screen.findByRole("button", { name: /v1/ }));
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "이 버전 보기" }));
  });
  fireEvent.click(cardToggle());
  // 보는 버전의 내용이다(노드 a 만, 가정 하나).
  expect(screen.queryByRole("group", { name: "b" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "a 항목 펼치기" }));
  expect(screen.queryByRole("button", { name: "저장" })).not.toBeInTheDocument();
  expect(within(screen.getByRole("region", { name: "가정" })).queryByRole("button")).not.toBeInTheDocument();
  expect(within(screen.getByRole("region", { name: "가정" })).getByText(/규모: 중규모/)).toBeInTheDocument();
  vi.mocked(listVersionsAction).mockResolvedValue([]);
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

test("warn badge or card warning item for the already selected node still opens 설명", () => {
  hookState.busy = false;
  render(ui(solo(1) as never));
  fireEvent.click(screen.getByRole("button", { name: "선택b" }));
  expect(screen.getByRole("tab", { name: "설명" })).toHaveAttribute("aria-selected", "true");
  fireEvent.click(screen.getByRole("tab", { name: "대화" }));
  fireEvent.click(cardToggle());
  fireEvent.click(within(screen.getByRole("region", { name: "주의" })).getByRole("button", { name: /1대뿐/ }));
  expect(screen.getByRole("tab", { name: "설명" })).toHaveAttribute("aria-selected", "true");
  expect(screen.getByRole("heading", { name: "주의할 점" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("tab", { name: "대화" }));
  fireEvent.click(screen.getByRole("button", { name: "경고배지b" }));
  expect(screen.getByRole("tab", { name: "설명" })).toHaveAttribute("aria-selected", "true");
  expect(screen.getByRole("heading", { name: "주의할 점" })).toBeInTheDocument();
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
// 떠 있는 패널의 너비(패널을 감싼 자리 잡기 상자의 인라인 너비).
const panelCols = (c: HTMLElement) => (within(c).getByRole("complementary", { name: "오른쪽 패널" }).parentElement as HTMLElement).style.width;

test("width is saved and restored from localStorage after mount", () => {
  window.localStorage.clear();
  const first = render(ui(mk(1, ["a"])));
  expect(panelCols(first.container)).toBe("360px");
  fireEvent.keyDown(screen.getByRole("separator", { name: "대화 패널 너비" }), { key: "ArrowLeft" });
  expect(window.localStorage.getItem(KEY)).toBe("376");
  expect(panelCols(first.container)).toBe("376px");
  first.unmount();
  window.localStorage.setItem(KEY, "500");
  const second = render(ui(mk(1, ["a"])));
  expect(panelCols(second.container)).toBe("500px");
  window.localStorage.clear();
});

test("fit padding accounts for floating panels", () => {
  window.localStorage.clear();
  hookState.insets.length = 0;
  render(ui(mk(1, ["a"])));
  // 왼쪽: 여백 12 + 사이드바 240 + 여백 12, 오른쪽: 여백 12 + 패널 360 + 여백 12
  expect(hookState.insets.at(-1)).toEqual({ left: 264, right: 384 });
  fireEvent.keyDown(screen.getByRole("separator", { name: "대화 패널 너비" }), { key: "ArrowLeft" });
  expect(hookState.insets.at(-1)).toEqual({ left: 264, right: 400 });
  cleanup();
  // 접힌 사이드바(레일 56)
  window.localStorage.setItem("infrasketch.sidebarCollapsed", "1");
  render(<ShellProvider>{ui(mk(1, ["a"]))}</ShellProvider>);
  expect(hookState.insets.at(-1)).toEqual({ left: 80, right: 400 });
  // 캔버스 도구 모음이 패널에 가리지 않게 같은 값을 CSS 변수로 넘긴다.
  const ws = screen.getByRole("complementary", { name: "오른쪽 패널" }).closest("[data-workspace]") as HTMLElement;
  expect(ws.style.getPropertyValue("--canvas-inset-left")).toBe("80px");
  expect(ws.style.getPropertyValue("--canvas-inset-right")).toBe("400px");
  window.localStorage.clear();
});

test("invalid stored value is ignored", () => {
  for (const bad of ["abc", "100", "9999", ""]) {
    window.localStorage.setItem(KEY, bad);
    const r = render(ui(mk(1, ["a"])));
    expect(panelCols(r.container)).toBe("360px");
    r.unmount();
  }
  window.localStorage.clear();
});

test("sample import after an interrupted turn refits the canvas at once", async () => {
  hookState.busy = false;
  const props = { diagramId: "d", name: "n", initialPinned: {}, samples: [{ id: "s", title: "샘플" }] };
  const { rerender } = render(<DiagramWorkspace {...props} latest={mk(1, []) as never} />);
  act(() => hookState.turn!.onInterrupted()); // no new version arrives for this turn
  const before = screen.getByTestId("fit").textContent;
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "샘플 불러오기" }));
  });
  rerender(<DiagramWorkspace {...props} latest={mk(2, ["x"]) as never} />);
  expect(screen.getByTestId("n")).toHaveTextContent("x");
  expect(screen.getByTestId("fit").textContent).not.toBe(before);
});

test("restore while live refits the canvas at once, even after a turn that saved nothing", async () => {
  hookState.busy = false;
  const row = (number: number) => ({ number, source: "ai", status: "complete", restoredFrom: null, createdAt: new Date(0) });
  vi.mocked(listVersionsAction).mockResolvedValue([row(1), row(2)] as never);
  const { rerender } = render(ui(mk(2, ["a"])));
  act(() => hookState.turn!.onDone()); // the turn ends without a new version
  const before = screen.getByTestId("fit").textContent;
  await act(async () => {
    fireEvent.click(screen.getByRole("tab", { name: "이력" }));
  });
  fireEvent.click(await screen.findByRole("button", { name: /v1/ }));
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "이 버전으로 되돌리기" }));
  });
  rerender(ui(mk(3, ["a"])));
  expect(screen.getByTestId("fit").textContent).not.toBe(before);
  vi.mocked(listVersionsAction).mockResolvedValue([]);
});
