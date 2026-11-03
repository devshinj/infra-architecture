import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

const hookState = vi.hoisted(() => ({ send: vi.fn(), busy: false, onCommand: null as null | ((c: unknown) => void), badgeFns: [] as unknown[], warnFns: [] as unknown[], lines: [] as unknown[], insets: [] as unknown[], focus: [] as unknown[], turn: null as null | { onDone(): void; onInterrupted(): void; onRelayout?(): void; onSessionLines?(key: string, fn: (ls: { id: string; kind: string; text: string }[]) => { id: string; kind: string; text: string }[]): void }, pushLine: vi.fn(), pinned: [] as unknown[], fitRequest: [] as unknown[], placed: null as null | ((locate: (id: string) => { x: number; y: number } | null) => void) }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/app/(app)/actions", () => ({
  clearPinnedAction: vi.fn(async () => undefined), getVersionAction: vi.fn(), importSampleAction: vi.fn(),
  listVersionsAction: vi.fn(async () => []), restoreVersionAction: vi.fn(), savePinnedAction: vi.fn(),
  saveFieldsAction: vi.fn(async () => ({ ok: true, number: 2 })),
  setWarningIgnoredAction: vi.fn(async () => ({ ok: true, number: 2 })),
  listTermsAction: vi.fn(async () => []),
  confirmAssumptionAction: vi.fn(async () => ({ ok: true })),
}));
vi.mock("@/canvas/Canvas", () => ({
  Canvas: ({ state, pinned, fitRequest, onAutoArrange, fitKey, cameraInsets, focusRequest, onMention, onAskNode, onBadgeClick, onWarnBadgeClick, onSelect, onImportSample, onPlaced }: {onAskNode?: (id: string) => void;  onPlaced?: (l: (id: string) => { x: number; y: number } | null) => void; onImportSample?: (id: string) => void; state: { nodes: object }; pinned: unknown; fitRequest?: unknown; onAutoArrange(): void; fitKey?: string; cameraInsets?: unknown; focusRequest?: unknown; onMention?: (id: string) => void; onBadgeClick?: (id: string) => void; onWarnBadgeClick?: (id: string) => void; onSelect: (id: string | null) => void }) => {
    hookState.insets.push(cameraInsets);
    hookState.placed = onPlaced ?? null;
    hookState.pinned.push(pinned);
    hookState.fitRequest.push(fitRequest);
    hookState.focus.push(focusRequest);
    hookState.badgeFns.push(onBadgeClick);
    hookState.warnFns.push(onWarnBadgeClick);
    return (
    <div>
      <div data-testid="n">{Object.keys(state.nodes).join(",")}</div>
      <div data-testid="fit">{fitKey}</div>
      {onMention && <button onClick={() => onMention("a")}>멘션a</button>}
      {onAskNode && <button onClick={() => onAskNode("a")}>메뉴로 묻기a</button>}
      {onBadgeClick && <button onClick={() => onBadgeClick("a")}>배지a</button>}
      {onWarnBadgeClick && <button onClick={() => onWarnBadgeClick("b")}>경고배지b</button>}
      <button onClick={() => onSelect("b")}>선택b</button>
      <button onClick={() => onSelect("a")}>선택a</button>
      <button onClick={() => onSelect("e1")}>선택e1</button>
      <button onClick={onAutoArrange}>자동정렬</button>
      {onImportSample && <button onClick={() => onImportSample("s")}>샘플 불러오기</button>}
      <button onClick={() => onSelect(null)}>선택해제</button>
    </div>
    );
  },
}));
vi.mock("@/ui/chat/useChatTurn", () => ({
  useChatTurn: (a: { onCommand: (c: unknown) => void; onDone(): void; onInterrupted(): void; onRelayout?(): void }) => {
    hookState.onCommand = a.onCommand;
    hookState.turn = a;
    return { lines: hookState.lines, busy: hookState.busy, send: hookState.send, stop: vi.fn(), pushLine: hookState.pushLine };
  },
}));

import { readFileSync } from "node:fs";

import { clearPinnedAction, confirmAssumptionAction, getVersionAction, importSampleAction, listVersionsAction, saveFieldsAction, setWarningIgnoredAction } from "@/app/(app)/actions";
import { emptyState } from "@/domain/types";
import { DiagramWorkspace } from "@/ui/DiagramWorkspace";
import { ShellProvider } from "@/ui/Shell";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
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

test("relayout event clears pins and re-lays out", () => {
  hookState.busy = false;
  vi.mocked(clearPinnedAction).mockClear();
  hookState.pinned.length = 0;
  hookState.fitRequest.length = 0;
  render(<DiagramWorkspace diagramId="d" name="n" latest={mk(1, ["a"]) as never} initialPinned={{ a: { x: 5, y: 5 } }} samples={[]} />);
  expect(hookState.pinned.at(-1)).toEqual({ a: { x: 5, y: 5 } });
  const before = hookState.fitRequest.at(-1) as number;
  act(() => hookState.turn!.onRelayout!());
  expect(hookState.pinned.at(-1)).toEqual({});
  expect(clearPinnedAction).toHaveBeenCalledWith("d");
  // 화면 맞춤 요청이 새로 간다.
  const after = hookState.fitRequest.at(-1) as number;
  expect(after).not.toBe(before);
  // 버튼도 같은 동작을 한다.
  fireEvent.click(screen.getByRole("button", { name: "자동정렬" }));
  expect(clearPinnedAction).toHaveBeenCalledTimes(2);
  expect(hookState.fitRequest.at(-1)).not.toBe(after);
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

test("warning item selects the node and moves the camera", () => {
  hookState.busy = false;
  render(ui(solo(1) as never));
  fireEvent.click(screen.getByRole("tab", { name: "대화" }));
  fireEvent.click(cardToggle());
  const before = hookState.focus.at(-1) as { id: string; token: number } | undefined;
  fireEvent.click(within(screen.getByRole("region", { name: "주의" })).getByRole("button", { name: /1대뿐/ }));
  const after = hookState.focus.at(-1) as { id: string; token: number };
  expect(after.id).toBe("b");
  expect(after.token).toBeGreaterThan(before?.token ?? 0);
  expect(screen.getByRole("tab", { name: "설명" })).toHaveAttribute("aria-selected", "true");
  expect(screen.getByRole("heading", { name: "주의할 점" })).toBeInTheDocument();
  // 카드는 열린 채로 둔다.
  expect(cardToggle()).toHaveAttribute("aria-expanded", "true");
});

test("same warning clicked twice refocuses", () => {
  hookState.busy = false;
  render(ui(solo(1) as never));
  fireEvent.click(cardToggle());
  const item = () => within(screen.getByRole("region", { name: "주의" })).getByRole("button", { name: /1대뿐/ });
  fireEvent.click(item());
  const first = hookState.focus.at(-1) as { id: string; token: number };
  fireEvent.click(item());
  const second = hookState.focus.at(-1) as { id: string; token: number };
  expect(second.id).toBe("b");
  expect(second.token).toBeGreaterThan(first.token);
});

test("node warning badge does not move the camera", () => {
  hookState.busy = false;
  render(ui(solo(1) as never));
  const before = hookState.focus.at(-1);
  fireEvent.click(screen.getByRole("button", { name: "경고배지b" }));
  expect(hookState.focus.at(-1)).toBe(before);
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
const panelCols = (c: HTMLElement) => (within(c).getByRole("complementary", { name: "오른쪽 패널" }).parentElement as HTMLElement).style.getPropertyValue("--panel-width");

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
  // 아래: 여백 12 + 접힌 구성 정보 카드 줄 42 + 여백 12
  expect(hookState.insets.at(-1)).toEqual({ left: 264, right: 384, bottom: 66 });
  fireEvent.keyDown(screen.getByRole("separator", { name: "대화 패널 너비" }), { key: "ArrowLeft" });
  expect(hookState.insets.at(-1)).toEqual({ left: 264, right: 400, bottom: 66 });
  // 카드를 펼치면 카메라가 피할 장애물(카드 폭 300 + 여백 12)이 함께 간다.
  fireEvent.click(screen.getByRole("button", { name: "구성 정보 펼치기" }));
  expect(hookState.insets.at(-1)).toMatchObject({ left: 264, right: 400, bottom: 66, card: { width: 312 } });
  fireEvent.click(screen.getByRole("button", { name: "구성 정보 접기" }));
  expect(hookState.insets.at(-1)).toEqual({ left: 264, right: 400, bottom: 66 });
  cleanup();
  // 접힌 사이드바(레일 56)
  window.localStorage.setItem("infrasketch.sidebarCollapsed", "1");
  render(<ShellProvider>{ui(mk(1, ["a"]))}</ShellProvider>);
  expect(hookState.insets.at(-1)).toEqual({ left: 80, right: 400, bottom: 66 });
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

test("add_node during a turn flies a dot from the progress card to the placed node, only on the 대화 tab", () => {
  hookState.busy = true;
  hookState.lines = [{ id: "c", kind: "card", text: "", card: { mode: "build", step: "drawing", changes: 1 }, turn: "t1", at: 0 }];
  vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  const orig = Element.prototype.getBoundingClientRect;
  Element.prototype.getBoundingClientRect = function (this: Element) {
    const r = this.hasAttribute("data-fly-origin")
      ? { left: 900, top: 200, width: 12, height: 12 }
      : this.getAttribute("role") === "log"
        ? { left: 800, top: 0, width: 400, height: 800 }
        : { left: 0, top: 0, width: 0, height: 0 };
    return { ...r, x: r.left, y: r.top, right: r.left + r.width, bottom: r.top + r.height, toJSON: () => r } as DOMRect;
  };
  try {
    render(ui(mk(1, ["a"])));
    act(() => hookState.onCommand!({ op: "add_node", id: "b", kind: "server", label: "b", parent: null }));
    act(() => hookState.placed!(() => ({ x: 300, y: 400 })));
    expect(document.querySelectorAll("[data-fly-dot]")).toHaveLength(1);
    // 대화 탭이 아니면 출발점이 없다
    fireEvent.click(screen.getByRole("tab", { name: "설명" }));
    act(() => hookState.onCommand!({ op: "add_node", id: "c", kind: "server", label: "c", parent: null }));
    act(() => hookState.placed!(() => ({ x: 300, y: 400 })));
    expect(document.querySelectorAll("[data-fly-dot]")).toHaveLength(1);
  } finally {
    Element.prototype.getBoundingClientRect = orig;
    vi.unstubAllGlobals();
    hookState.lines = [];
    hookState.busy = false;
  }
});

test("missing-info badge click also moves the camera to that node (same path as 위치 보기)", () => {
  hookState.busy = false;
  hookState.focus.length = 0;
  render(ui(two() as never));
  fireEvent.click(screen.getByRole("button", { name: "배지a" }));
  expect(cardToggle()).toHaveAttribute("aria-expanded", "true");
  expect(hookState.focus.at(-1)).toEqual({ id: "a", token: expect.any(Number) });
  const first = (hookState.focus.at(-1) as { token: number }).token;
  fireEvent.click(screen.getByRole("button", { name: "배지a" }));
  expect((hookState.focus.at(-1) as { token: number }).token).toBeGreaterThan(first);
  // 선택하지 않는다(설명 탭으로 가지 않는다).
  expect(screen.getByRole("tab", { name: "대화" })).toHaveAttribute("aria-selected", "true");
});

test("a selection that the chat removed or the adopted state no longer has is cleared", () => {
  hookState.busy = true;
  const { rerender } = render(ui(two() as never));
  fireEvent.click(screen.getByRole("button", { name: "선택b" }));
  expect(screen.getByRole("tab", { name: "설명" })).toHaveAttribute("aria-selected", "true");
  // 대화가 선택된 노드를 지우면 선택이 풀린다(흐림이 남지 않는다).
  act(() => hookState.onCommand!({ op: "remove_node", id: "b" }));
  expect(screen.getByTestId("n")).toHaveTextContent(/^a$/);
  expect(screen.getByRole("tab", { name: "대화" })).toHaveAttribute("aria-selected", "true");
  // 대화 뒤 저장된 판을 받을 때도 없는 선택은 버린다.
  hookState.busy = false;
  fireEvent.click(screen.getByRole("button", { name: "선택b" }));
  act(() => hookState.turn!.onDone());
  rerender(ui(mk(2, ["a"]) as never));
  expect(screen.getByRole("tab", { name: "대화" })).toHaveAttribute("aria-selected", "true");
});

test("queued fly dots survive turn done (post-done settle launches them) but are dropped on interrupt", () => {
  for (const [end, expected] of [["onDone", 1], ["onInterrupted", 0]] as const) {
    hookState.busy = true;
    hookState.lines = [{ id: "c", kind: "card", text: "", card: { mode: "build", step: "drawing", changes: 1 }, turn: "t1", at: 0 }];
    vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
    const orig = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function (this: Element) {
      const r = this.hasAttribute("data-fly-origin")
        ? { left: 900, top: 200, width: 12, height: 12 }
        : this.getAttribute("role") === "log"
          ? { left: 800, top: 0, width: 400, height: 800 }
          : { left: 0, top: 0, width: 0, height: 0 };
      return { ...r, x: r.left, y: r.top, right: r.left + r.width, bottom: r.top + r.height, toJSON: () => r } as DOMRect;
    };
    try {
      render(ui(mk(1, ["a"])));
      act(() => hookState.onCommand!({ op: "add_node", id: "b", kind: "server", label: "b", parent: null }));
      act(() => hookState.turn![end]());
      act(() => hookState.placed!(() => ({ x: 300, y: 400 })));
      expect(document.querySelectorAll("[data-fly-dot]")).toHaveLength(expected);
    } finally {
      cleanup();
      Element.prototype.getBoundingClientRect = orig;
      vi.unstubAllGlobals();
      hookState.lines = [];
      hookState.busy = false;
    }
  }
});

test("question sessions: picking one shows its saved lines; a canvas mention returns to 구성도 대화", async () => {
  hookState.busy = false;
  hookState.lines = [];
  const session = { id: "s1", kind: "node" as const, nodeId: "a", nodeLabel: "a", title: "왜 두 대예요?", updatedAt: new Date().toISOString() };
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) =>
      url.endsWith("/sessions/s1")
        ? Response.json({ session, messages: [{ id: "u1", role: "user", content: "왜 두 대예요?", meta: {}, createdAt: session.updatedAt }] })
        : Response.json({ qwen: "ok", clef: "ok" }),
    ),
  );
  try {
    render(<DiagramWorkspace diagramId="d" name="n" latest={mk(1, ["a"]) as never} initialPinned={{}} samples={[]} initialSessions={[session]} />);
    pickSession("a · 왜 두 대예요?");
    expect(await screen.findByText("왜 두 대예요?", { selector: "p" })).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveAttribute("placeholder", "이 노드에 대해 더 물어보기");
    fireEvent.click(screen.getByRole("button", { name: "멘션a" }));
    expect(screen.getByRole("button", { name: "기본 대화" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "a 참조 제거" })).toBeInTheDocument();
  } finally {
    vi.unstubAllGlobals();
  }
});

/** 대화 고르기를 펼쳐 이름이 name 으로 시작하는 세션 행을 누른다. */
const pickSession = (name: string) => {
  fireEvent.click(screen.getAllByRole("button").find((b) => b.getAttribute("aria-haspopup") === "dialog")!);
  const list = screen.getByRole("dialog", { name: "대화 고르기" });
  const row = within(list)
    .getAllByRole("button")
    .find((b) => b.hasAttribute("data-session-item") && (b.textContent ?? "").startsWith(name));
  fireEvent.click(row!);
};

const stubFetch = () => vi.stubGlobal("fetch", vi.fn(async (url: string) => (String(url).includes("/explain") ? new Response("{}", { status: 200 }) : Response.json({ qwen: "ok", clef: "ok" }))));

test("ask from explanation opens chat tab with a new session", () => {
  stubFetch();
  hookState.busy = false;
  hookState.lines = [];
  render(ui(two() as never));
  fireEvent.click(screen.getByRole("button", { name: "선택b" }));
  fireEvent.change(screen.getByLabelText("이 노드에 대해 물어보기"), { target: { value: "왜 두 대예요?" } });
  fireEvent.click(screen.getByRole("button", { name: "질문 보내기" }));
  expect(screen.getByRole("tab", { name: "대화" })).toHaveAttribute("aria-selected", "true");
  expect(screen.getByRole("textbox")).toHaveAttribute("placeholder", "이 노드에 대해 더 물어보기");
  expect(screen.getByRole("button", { name: /^b · / })).toBeInTheDocument();
});

test("menu ask selects node, opens 설명 and focuses the ask input", () => {
  stubFetch();
  hookState.busy = false;
  render(ui(two() as never));
  expect(screen.getByRole("tab", { name: "대화" })).toHaveAttribute("aria-selected", "true");
  fireEvent.click(screen.getByRole("button", { name: "메뉴로 묻기a" }));
  expect(screen.getByRole("tab", { name: "설명" })).toHaveAttribute("aria-selected", "true");
  expect(screen.getByLabelText("이 노드에 대해 물어보기")).toHaveFocus();
});

test("ask input is disabled with the reason while another turn runs", () => {
  stubFetch();
  hookState.busy = true;
  try {
    render(ui(two() as never));
    fireEvent.click(screen.getByRole("button", { name: "선택b" }));
    expect(screen.getByLabelText("이 노드에 대해 물어보기")).toBeDisabled();
    expect(screen.getByText("다른 대화가 답하는 중이에요.", { selector: "p" })).toBeInTheDocument();
  } finally {
    hookState.busy = false;
  }
});

test("menu-ask focus is spent once: reselecting the node or going a→b→a does not refocus the input", () => {
  stubFetch();
  hookState.busy = false;
  render(ui(two() as never));
  fireEvent.click(screen.getByRole("button", { name: "메뉴로 묻기a" }));
  expect(screen.getByLabelText("이 노드에 대해 물어보기")).toHaveFocus();
  (document.activeElement as HTMLElement).blur(); // 캔버스를 누르면 포커스가 입력칸을 떠난다
  fireEvent.click(screen.getByRole("button", { name: "선택b" }));
  expect(screen.getByLabelText("이 노드에 대해 물어보기")).not.toHaveFocus();
  fireEvent.click(screen.getByRole("button", { name: "선택a" }));
  expect(screen.getByLabelText("이 노드에 대해 물어보기")).not.toHaveFocus();
});

test("an edge gets no ask input", () => {
  stubFetch();
  hookState.busy = false;
  const s = two() as { number: number; state: { edges: object } };
  s.state.edges = { e1: { id: "e1", from: "a", to: "b", edgeKind: "request" } };
  render(ui(s as never));
  fireEvent.click(screen.getByRole("button", { name: "선택e1" }));
  expect(screen.getByRole("heading", { name: "연결선" })).toBeInTheDocument();
  expect(screen.queryByLabelText("이 노드에 대해 물어보기")).not.toBeInTheDocument();
});

test("choosing an assumption while a question session is open goes to the main chat, not /ask", async () => {
  hookState.busy = false;
  hookState.lines = [];
  hookState.send.mockClear();
  const session = { id: "s1", kind: "node" as const, nodeId: "a", nodeLabel: "a", title: "왜 두 대예요?", updatedAt: new Date().toISOString() };
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => (String(url).endsWith("/sessions/s1") ? Response.json({ session, messages: [] }) : Response.json({ qwen: "ok", clef: "ok" }))),
  );
  const latest = { number: 1, state: { ...emptyState(), nodes: Object.fromEntries([web("a")]), assumptions: { scale: { key: "scale", value: "중규모(일 1만 명)", confirmed: false } } } };
  render(<DiagramWorkspace diagramId="d" name="n" latest={latest as never} initialPinned={{}} samples={[]} initialSessions={[session]} />);
  pickSession("a · 왜 두 대예요?");
  await screen.findByRole("button", { name: /a · 왜 두 대예요\?/ });
  fireEvent.click(cardToggle());
  fireEvent.click(screen.getByRole("button", { name: /^규모: 중규모/ }));
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "대규모(일 10만 명 이상)" }));
  });
  expect(hookState.send).toHaveBeenCalledTimes(1);
  expect(hookState.send.mock.calls[0]![0]).toMatch(/^가정 변경:/);
  // 질문 세션 옵션(kind: "ask")이 없는 구성도 대화 전송이다.
  expect(hookState.send.mock.calls[0]![1]).toBeUndefined();
  expect(screen.getByRole("button", { name: "기본 대화" })).toBeInTheDocument();
});

const askSession = { id: "s1", kind: "node" as const, nodeId: "a", nodeLabel: "a", title: "왜 두 대예요?", updatedAt: new Date().toISOString() };
const assumptionLatest = () => ({ number: 1, state: { ...emptyState(), nodes: Object.fromEntries([web("a")]), assumptions: { scale: { key: "scale", value: "중규모(일 1만 명)", confirmed: false } } } });
const openAskSession = async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => (String(url).endsWith("/sessions/s1") ? Response.json({ session: askSession, messages: [] }) : Response.json({ qwen: "ok", clef: "ok" }))),
  );
  render(<DiagramWorkspace diagramId="d" name="n" latest={assumptionLatest() as never} initialPinned={{}} samples={[]} initialSessions={[askSession]} />);
  pickSession("a · 왜 두 대예요?");
  await screen.findByRole("button", { name: /a · 왜 두 대예요\?/ });
};

test("a failed assumption confirm while a question session is shown switches to 구성도 대화 so the error line is visible", async () => {
  hookState.busy = false;
  hookState.lines = [];
  hookState.pushLine.mockClear();
  vi.mocked(confirmAssumptionAction).mockResolvedValueOnce({ ok: false, error: "확정하지 못했어요" } as never);
  await openAskSession();
  fireEvent.click(cardToggle());
  fireEvent.click(screen.getByRole("button", { name: /^규모: 중규모/ }));
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "대규모(일 10만 명 이상)" }));
  });
  expect(hookState.pushLine).toHaveBeenCalledWith({ kind: "error", text: "확정하지 못했어요" });
  expect(screen.getByRole("button", { name: "기본 대화" })).toBeInTheDocument();
  expect(hookState.send).not.toHaveBeenCalled();
});

test("a first question that failed leaves no old lines when it is asked again from the new draft", async () => {
  hookState.busy = false;
  hookState.lines = [];
  hookState.send.mockReset();
  stubFetch();
  hookState.send.mockImplementation(async (text: string, target: { sessionId: string | null }) => {
    const key = target.sessionId ?? "new";
    const retry = hookState.send.mock.calls.length > 1;
    hookState.turn!.onSessionLines!(key, (ls) => [
      ...ls,
      { id: `u-${text}`, kind: "user", text },
      retry ? { id: "ans", kind: "assistant", text: "답이에요" } : { id: "err", kind: "error", text: "다른 응답을 처리하고 있어요" },
    ]);
  });
  render(ui(two() as never));
  fireEvent.click(screen.getByRole("button", { name: "선택b" }));
  fireEvent.change(screen.getByLabelText("이 노드에 대해 물어보기"), { target: { value: "첫 질문" } });
  fireEvent.click(screen.getByRole("button", { name: "질문 보내기" }));
  expect(await screen.findByText("다른 응답을 처리하고 있어요")).toBeInTheDocument();
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "다시 질문" } });
  fireEvent.click(screen.getByRole("button", { name: "보내기" }));
  expect(await screen.findByText("답이에요")).toBeInTheDocument();
  expect(screen.getByText("다시 질문")).toBeInTheDocument();
  expect(screen.queryByText("첫 질문", { selector: "p" })).not.toBeInTheDocument();
  expect(screen.queryByText("다른 응답을 처리하고 있어요")).not.toBeInTheDocument();
});

// ---- 제목·랜드마크 (접근성 점검) ----
test("the workspace has a single h1 with the diagram name", () => {
  hookState.busy = false;
  render(<DiagramWorkspace diagramId="d" name="운영 구성도" latest={mk(1, ["a"]) as never} initialPinned={{}} samples={[]} />);
  const h1 = screen.getAllByRole("heading", { level: 1 });
  expect(h1).toHaveLength(1);
  expect(h1[0]).toHaveTextContent("운영 구성도");
});

// ── 좁은 화면(휴대폰): 아래 탭 막대로 구성도·대화·설명·이력을 한 화면씩 본다 ──
const stubNarrow = () =>
  vi.stubGlobal("matchMedia", (q: string) => ({ matches: q === "(max-width: 640px)", media: q, addEventListener() {}, removeEventListener() {} }));
const narrowUi = (latest: ReturnType<typeof mk> | ReturnType<typeof two>) => <ShellProvider>{ui(latest as never)}</ShellProvider>;
const bottomTabs = () => screen.getByRole("tablist", { name: "작업 화면" });
const bottomTab = (name: string | RegExp) => within(bottomTabs()).getByRole("tab", { name });
const mview = () => (document.querySelector("[data-workspace]") as HTMLElement).getAttribute("data-mview");

test("narrow: one bottom tablist with 4 tabs replaces the panel tabs; 구성도 first, choice is persisted", () => {
  hookState.busy = false;
  window.sessionStorage.clear();
  stubNarrow();
  render(narrowUi(two()));
  expect(within(bottomTabs()).getAllByRole("tab").map((t) => t.textContent)).toEqual(["구성도", "대화", "설명", "이력"]);
  expect(screen.getAllByRole("tablist")).toHaveLength(1); // 패널 안 탭 줄은 그리지 않는다
  expect(screen.queryByRole("separator", { name: "대화 패널 너비" })).toBeNull();
  expect(bottomTab("구성도")).toHaveAttribute("aria-selected", "true");
  expect(bottomTab("구성도")).toHaveAttribute("aria-controls", "workspace-canvas");
  expect(mview()).toBe("canvas");
  fireEvent.click(bottomTab("대화"));
  expect(bottomTab("대화")).toHaveAttribute("aria-selected", "true");
  expect(mview()).toBe("panel");
  expect(screen.getByRole("tabpanel", { name: "대화" })).toHaveAttribute("id", "right-panel-body");
  expect(JSON.parse(window.sessionStorage.getItem("infrasketch.mobileView")!)).toEqual({ diagramId: "d", view: "대화" });
  // 로빙 tabindex + 방향키
  expect(bottomTab("대화")).toHaveAttribute("tabindex", "0");
  expect(bottomTab("구성도")).toHaveAttribute("tabindex", "-1");
  fireEvent.keyDown(bottomTab("대화"), { key: "ArrowRight" });
  expect(bottomTab(/^설명/)).toHaveAttribute("aria-selected", "true");
  expect(bottomTab(/^설명/)).toHaveFocus();
  fireEvent.keyDown(bottomTab(/^설명/), { key: "Home" });
  expect(bottomTab("구성도")).toHaveAttribute("aria-selected", "true");
  expect(mview()).toBe("canvas");
  expect(JSON.parse(window.sessionStorage.getItem("infrasketch.mobileView")!)).toEqual({ diagramId: "d", view: "구성도" });
  window.sessionStorage.clear();
});

test("narrow: the last bottom tab is restored from sessionStorage (이력 loads versions)", () => {
  hookState.busy = false;
  window.sessionStorage.setItem("infrasketch.mobileView", JSON.stringify({ diagramId: "d", view: "이력" }));
  vi.mocked(listVersionsAction).mockClear();
  stubNarrow();
  render(narrowUi(two()));
  expect(bottomTab("이력")).toHaveAttribute("aria-selected", "true");
  expect(mview()).toBe("panel");
  expect(listVersionsAction).toHaveBeenCalled();
  window.sessionStorage.clear();
});

test("narrow: selecting a node on the canvas stays on 구성도 and marks 설명; choosing 설명 shows it", () => {
  hookState.busy = false;
  window.sessionStorage.clear();
  stubNarrow();
  render(narrowUi(two()));
  expect(bottomTab(/^설명/)).toHaveTextContent(/^설명$/);
  fireEvent.click(screen.getByRole("button", { name: "선택b" }));
  expect(bottomTab("구성도")).toHaveAttribute("aria-selected", "true");
  expect(mview()).toBe("canvas");
  expect(bottomTab(/^설명/)).toHaveAccessibleName("설명, 고른 항목의 설명 있음");
  fireEvent.click(bottomTab(/^설명/));
  expect(mview()).toBe("panel");
  expect(bottomTab("설명")).toHaveAttribute("aria-selected", "true");
  // 선택을 풀어도 손으로 고른 설명 탭에 남는다
  fireEvent.click(screen.getByRole("button", { name: "선택해제" }));
  expect(bottomTab("설명")).toHaveAttribute("aria-selected", "true");
});

test("narrow: programmatic tab switches also switch the bottom tab (history, mention, warn badge, ask menu, warnings chip)", () => {
  hookState.busy = false;
  window.sessionStorage.clear();
  stubNarrow();
  render(narrowUi(two()));
  // 대화가 이력을 연다
  act(() => (hookState.turn as unknown as { onOpenHistory(): void }).onOpenHistory());
  expect(bottomTab("이력")).toHaveAttribute("aria-selected", "true");
  expect(mview()).toBe("panel");
  // 캔버스 메뉴의 참조 붙이기 → 대화
  fireEvent.click(bottomTab("구성도"));
  fireEvent.click(screen.getByRole("button", { name: "멘션a" }));
  expect(bottomTab("대화")).toHaveAttribute("aria-selected", "true");
  // 노드의 경고 배지 → 그 노드의 주의할 점(설명)
  fireEvent.click(bottomTab("구성도"));
  fireEvent.click(screen.getByRole("button", { name: "경고배지b" }));
  expect(bottomTab("설명")).toHaveAttribute("aria-selected", "true");
  expect(mview()).toBe("panel");
  // 우클릭 메뉴 ‘질문하기’ → 설명 탭의 질문 칸
  fireEvent.click(bottomTab("구성도"));
  fireEvent.click(screen.getByRole("button", { name: "메뉴로 묻기a" }));
  expect(bottomTab("설명")).toHaveAttribute("aria-selected", "true");
  expect(mview()).toBe("panel");
});

test("wide screens keep the panel's own tabs, the resizer and no bottom bar", () => {
  hookState.busy = false;
  vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  render(<ShellProvider>{ui(two() as never)}</ShellProvider>);
  expect(screen.queryByRole("tablist", { name: "작업 화면" })).toBeNull();
  expect(screen.getByRole("separator", { name: "대화 패널 너비" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "경고배지b" }));
  expect(screen.getByRole("tab", { name: "설명" })).toHaveAttribute("aria-selected", "true");
  // 넓은 화면은 예전처럼 선택이 풀리면 앞 탭(대화)으로 돌아간다
  fireEvent.click(screen.getByRole("button", { name: "선택해제" }));
  expect(screen.getByRole("tab", { name: "대화" })).toHaveAttribute("aria-selected", "true");
});

test("narrow: a different diagram always starts on 구성도 (the stored tab belongs to the diagram it was saved for)", () => {
  hookState.busy = false;
  window.sessionStorage.setItem("infrasketch.mobileView", JSON.stringify({ diagramId: "other", view: "이력" }));
  stubNarrow();
  render(narrowUi(two()));
  expect(bottomTab("구성도")).toHaveAttribute("aria-selected", "true");
  expect(mview()).toBe("canvas");
  expect(JSON.parse(window.sessionStorage.getItem("infrasketch.mobileView")!)).toEqual({ diagramId: "d", view: "구성도" });
  window.sessionStorage.clear();
});

test("narrow: the 설명 dot does not come back for an item whose explanation was already viewed", () => {
  hookState.busy = false;
  window.sessionStorage.clear();
  stubNarrow();
  render(narrowUi(two()));
  fireEvent.click(screen.getByRole("button", { name: "선택b" }));
  expect(bottomTab(/^설명/)).toHaveAccessibleName("설명, 고른 항목의 설명 있음");
  fireEvent.click(bottomTab(/^설명/));
  fireEvent.click(bottomTab("구성도"));
  expect(bottomTab(/^설명/)).toHaveAccessibleName("설명");
  // 다른 노드는 아직 안 봤으니 점이 찍히고, 본 노드로 돌아오면 다시 찍지 않는다
  fireEvent.click(screen.getByRole("button", { name: "선택a" }));
  expect(bottomTab(/^설명/)).toHaveAccessibleName("설명, 고른 항목의 설명 있음");
  fireEvent.click(screen.getByRole("button", { name: "선택b" }));
  expect(bottomTab(/^설명/)).toHaveAccessibleName("설명");
});

test("narrow: the canvas tabpanel is labelled by its 구성도 tab", () => {
  hookState.busy = false;
  window.sessionStorage.clear();
  stubNarrow();
  render(narrowUi(two()));
  expect(screen.getByRole("tabpanel", { name: "구성도" })).toHaveAttribute("id", "workspace-canvas");
});

test("chat placeholder drops the right-click hint on phones only", () => {
  hookState.busy = false;
  window.sessionStorage.clear();
  stubNarrow();
  render(narrowUi(two()));
  fireEvent.click(bottomTab("대화"));
  expect(screen.getByRole("textbox", { name: "메시지 입력" })).toHaveAttribute("placeholder", "만들고 싶은 서비스나 바꾸고 싶은 점을 말해 주세요.");
  cleanup();
  vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  render(<ShellProvider>{ui(two() as never)}</ShellProvider>);
  expect(screen.getByRole("textbox", { name: "메시지 입력" })).toHaveAttribute(
    "placeholder",
    "만들고 싶은 서비스나 바꾸고 싶은 점을 말해 주세요. 노드를 오른쪽 클릭하면 참조를 붙일 수 있어요.",
  );
});

test("narrow: an error alert stays visible on panel tabs (fixed under the top bar)", async () => {
  hookState.busy = false;
  window.sessionStorage.clear();
  stubNarrow();
  vi.mocked(importSampleAction).mockRejectedValueOnce(new Error("가져오지 못했어요"));
  render(narrowUi(mk(1, [])));
  fireEvent.click(screen.getByRole("button", { name: "샘플 불러오기" }));
  const alert = await screen.findByRole("alert");
  expect(alert).toHaveTextContent("가져오지 못했어요");
  fireEvent.click(bottomTab("대화"));
  expect(mview()).toBe("panel");
  expect(alert.className).toMatch(/alertBanner/);
  // CSS: 패널 탭에서도 숨긴 캔버스 안의 오류 띠는 다시 보이고 위 막대 밑에 고정된다
  const css = readFileSync("src/ui/app.module.css", "utf8");
  const rule = css.match(/\.workspace\[data-mview="panel"\] \.alertBanner \{([^}]*)\}/)?.[1] ?? "";
  expect(rule).toContain("visibility: visible");
  expect(rule).toContain("position: fixed");
  expect(rule).toContain("top: calc(var(--topbar-h)");
});

// ── 대화로 건너뛰기 ──
test("the first tab stop of the workspace skips to the chat input (from another panel tab too)", () => {
  hookState.busy = false;
  render(ui(mk(1, ["a"])));
  const skip = screen.getByRole("button", { name: "대화로 건너뛰기" });
  const ws = document.querySelector("[data-workspace]") as HTMLElement;
  const focusables = ws.querySelectorAll('button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])');
  expect(focusables[0]).toBe(skip);
  fireEvent.click(screen.getByRole("tab", { name: "설명" }));
  fireEvent.click(skip);
  expect(screen.getByRole("tab", { name: "대화" })).toHaveAttribute("aria-selected", "true");
  expect(screen.getByRole("textbox")).toHaveFocus();
});

test("narrow: 대화로 건너뛰기 also switches the bottom tab to 대화", () => {
  hookState.busy = false;
  window.sessionStorage.clear();
  stubNarrow();
  render(narrowUi(two()));
  expect(bottomTab("구성도")).toHaveAttribute("aria-selected", "true");
  fireEvent.click(screen.getByRole("button", { name: "대화로 건너뛰기" }));
  expect(bottomTab("대화")).toHaveAttribute("aria-selected", "true");
  expect(mview()).toBe("panel");
  expect(screen.getByRole("textbox")).toHaveFocus();
  window.sessionStorage.clear();
});

// ---- 구성도 대화 세션 ----
const newChatButton = () => screen.getAllByRole("button", { name: "새 대화" }).find((b) => !b.hasAttribute("aria-expanded"))!;
type TurnWithSession = { onSession(s: unknown): void };

test("새 대화 opens an empty diagram chat; its first message creates the session via /chat, then mentions and follow-ups stay there", async () => {
  stubFetch();
  hookState.busy = false;
  hookState.lines = [{ id: "m1", kind: "user", text: "기본 대화 글" }];
  hookState.send.mockReset();
  try {
    render(ui(two() as never));
    expect(screen.getByText("기본 대화 글")).toBeInTheDocument();
    fireEvent.click(newChatButton());
    expect(screen.getByRole("button", { name: "새 대화", expanded: false })).toBeInTheDocument();
    expect(screen.queryByText("기본 대화 글")).not.toBeInTheDocument();
    expect(screen.getByText(/^새 대화예요\./)).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveAttribute("placeholder", expect.stringContaining("만들고 싶은 서비스"));

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "결제 붙여 줘" } });
    fireEvent.click(screen.getByRole("button", { name: "보내기" }));
    expect(hookState.send).toHaveBeenLastCalledWith("결제 붙여 줘", { kind: "diagram", sessionId: null });
    expect(screen.getByRole("button", { name: "결제 붙여 줘", expanded: false })).toBeInTheDocument();

    act(() =>
      (hookState.turn as unknown as TurnWithSession).onSession({ id: "c1", kind: "diagram", nodeId: null, nodeLabel: null, title: "결제 붙여 줘", updatedAt: new Date().toISOString() }),
    );
    // 참조는 지금 보는 구성도 대화에 붙는다(기본 대화로 옮기지 않는다).
    fireEvent.click(screen.getByRole("button", { name: "멘션a" }));
    expect(screen.getByRole("button", { name: "결제 붙여 줘", expanded: false })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "a 참조 제거" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "보내기" }));
    expect(hookState.send).toHaveBeenLastCalledWith(expect.stringContaining("@[a](node:a)"), { kind: "diagram", sessionId: "c1" });

    // 기본 대화로 돌아가면 그 기록이 보인다.
    pickSession("기본 대화");
    expect(screen.getByText("기본 대화 글")).toBeInTheDocument();
  } finally {
    hookState.lines = [];
  }
});

test("choosing an assumption while a diagram chat session is open sends there", async () => {
  hookState.busy = false;
  hookState.lines = [];
  hookState.send.mockReset();
  const chatSession = { id: "c1", kind: "diagram" as const, nodeId: null, nodeLabel: null, title: "결제 대화", updatedAt: new Date().toISOString() };
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => (String(url).endsWith("/sessions/c1") ? Response.json({ session: chatSession, messages: [] }) : Response.json({ qwen: "ok", clef: "ok" }))),
  );
  render(<DiagramWorkspace diagramId="d" name="n" latest={assumptionLatest() as never} initialPinned={{}} samples={[]} initialSessions={[chatSession]} />);
  pickSession("결제 대화");
  await screen.findByRole("button", { name: "결제 대화", expanded: false });
  fireEvent.click(cardToggle());
  fireEvent.click(screen.getByRole("button", { name: /^규모: 중규모/ }));
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "대규모(일 10만 명 이상)" }));
  });
  expect(hookState.send).toHaveBeenCalledTimes(1);
  expect(hookState.send.mock.calls[0]![0]).toMatch(/^가정 변경:/);
  expect(hookState.send.mock.calls[0]![1]).toEqual({ kind: "diagram", sessionId: "c1" });
  expect(screen.getByRole("button", { name: "결제 대화", expanded: false })).toBeInTheDocument();
});


test("from a node session, mentions go to the last diagram chat used, or 기본 대화 once that chat is deleted", async () => {
  hookState.busy = false;
  hookState.lines = [];
  const chatSession = { id: "c1", kind: "diagram" as const, nodeId: null, nodeLabel: null, title: "결제 대화", updatedAt: new Date().toISOString() };
  const nodeSession = { id: "s1", kind: "node" as const, nodeId: "a", nodeLabel: "a", title: "왜 두 대예요?", updatedAt: new Date().toISOString() };
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      const u = String(url);
      if (init?.method === "DELETE") return new Response(null, { status: 204 });
      if (u.endsWith("/sessions/c1")) return Response.json({ session: chatSession, messages: [] });
      if (u.endsWith("/sessions/s1")) return Response.json({ session: nodeSession, messages: [] });
      return Response.json({ qwen: "ok", clef: "ok" });
    }),
  );
  render(<DiagramWorkspace diagramId="d" name="n" latest={mk(1, ["a"]) as never} initialPinned={{}} samples={[]} initialSessions={[chatSession, nodeSession]} />);
  const trigger = () => screen.getAllByRole("button").find((b) => b.getAttribute("aria-haspopup") === "dialog")!;
  pickSession("결제 대화");
  await screen.findByRole("button", { name: "결제 대화", expanded: false });
  pickSession("a · 왜 두 대예요?");
  await screen.findByPlaceholderText("이 노드에 대해 더 물어보기");
  fireEvent.click(screen.getByRole("button", { name: "멘션a" }));
  expect(trigger()).toHaveTextContent("결제 대화");
  expect(screen.getByRole("button", { name: "a 참조 제거" })).toBeInTheDocument();

  // 결제 대화를 지운 뒤 노드 질문에서 참조하면 기본 대화로 간다.
  pickSession("a · 왜 두 대예요?");
  fireEvent.click(trigger());
  fireEvent.click(screen.getByRole("button", { name: "결제 대화 메뉴" }));
  fireEvent.click(screen.getByRole("menuitem", { name: "삭제" }));
  await act(async () => {
    fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "삭제" }));
  });
  await vi.waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
  expect(trigger()).toHaveTextContent("a · 왜 두 대예요?");
  fireEvent.click(screen.getByRole("button", { name: "멘션a" }));
  expect(trigger()).toHaveTextContent("기본 대화");
});
