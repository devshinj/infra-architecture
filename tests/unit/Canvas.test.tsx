import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, expect, test, vi } from "vitest";

import * as layoutMod from "@/canvas/layout";
import { Canvas, type CanvasOptions, type CanvasProps } from "@/canvas/Canvas";
import { defaultDisplayOptions } from "@/canvas/display";
import { emptyState } from "@/domain/types";

import { fx } from "../fixtures/spike";

beforeAll(() => {
  class RO {
    constructor(private cb: ResizeObserverCallback) {}
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal("ResizeObserver", RO);
  class DM {
    m22 = 1;
    
  }
  vi.stubGlobal("DOMMatrixReadOnly", DM);
  vi.stubGlobal("DOMMatrix", DM);
});
afterEach(cleanup);

vi.mock("@/canvas/layout", async (orig) => {
  const m = await orig<typeof import("@/canvas/layout")>();
  return { ...m, layoutDiagram: vi.fn(m.layoutDiagram) };
});

const baseProps = (state = fx("s2")): CanvasProps => {
  const options: CanvasOptions = { ...defaultDisplayOptions(state), hoverLabels: true, showMissingBadges: false };
  return {
    state, pinned: {}, editMode: false, options, motion: false,
    onOptionsChange: vi.fn(), onSelect: vi.fn(), onPinnedChange: vi.fn(), onAutoArrange: vi.fn(),
    onEditModeChange: vi.fn(), onMotionChange: vi.fn(),
  };
};

test("renders a node per displayed node and selects on click", async () => {
  const props = baseProps();
  const { container } = render(<div style={{ width: 800, height: 600 }}><Canvas {...props} /></div>);
  await waitFor(() => expect(container.querySelectorAll(".react-flow__node-infra").length).toBeGreaterThan(0));
  const first = container.querySelector(".react-flow__node-infra") as HTMLElement;
  fireEvent.click(first);
  expect(props.onSelect).toHaveBeenCalledWith(first.getAttribute("data-id"));
});

test("empty diagram shows guidance", () => {
  render(<Canvas {...baseProps(emptyState())} />);
  expect(screen.getByText(/아직 구성도가 비어 있어요/)).toBeInTheDocument();
});

test("canvas empty state offers 샘플 불러오기", async () => {
  const onImportSample = vi.fn();
  const samples = [{ id: "s1", title: "샘플 하나" }, { id: "s2", title: "샘플 둘" }];
  const { rerender } = render(<Canvas {...baseProps(emptyState())} samples={samples} onImportSample={onImportSample} />);
  const open = screen.getByRole("button", { name: "샘플 불러오기" });
  expect(open).toHaveAttribute("aria-expanded", "false");
  fireEvent.click(open);
  expect(open).toHaveAttribute("aria-expanded", "true");
  fireEvent.keyDown(document, { key: "Escape" });
  expect(screen.queryByRole("menuitem", { name: "샘플 하나" })).not.toBeInTheDocument();
  fireEvent.click(open);
  fireEvent.mouseDown(document.body);
  expect(screen.queryByRole("menuitem", { name: "샘플 하나" })).not.toBeInTheDocument();
  fireEvent.click(open);
  fireEvent.click(screen.getByRole("menuitem", { name: "샘플 둘" }));
  expect(onImportSample).toHaveBeenCalledWith("s2");
  expect(screen.queryByRole("menuitem", { name: "샘플 둘" })).not.toBeInTheDocument();
  rerender(<Canvas {...baseProps(emptyState())} samples={samples} onImportSample={onImportSample} importing />);
  expect(screen.getByRole("button", { name: "샘플 불러오기" })).toBeDisabled();
  rerender(<Canvas {...baseProps(emptyState())} />);
  expect(screen.queryByRole("button", { name: "샘플 불러오기" })).not.toBeInTheDocument();
});

test("auto arrange button enabled outside edit mode", () => {
  const props = baseProps(emptyState());
  const { rerender } = render(<Canvas {...props} />);
  fireEvent.click(screen.getByRole("button", { name: "자동 정렬" }));
  expect(props.onAutoArrange).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: "보조 연결 숨김" }));
  expect(props.onOptionsChange).toHaveBeenCalledWith(expect.objectContaining({ hideAux: false }));
  rerender(<Canvas {...props} editMode />);
  fireEvent.click(screen.getByRole("button", { name: "자동 정렬" }));
  expect(props.onAutoArrange).toHaveBeenCalledTimes(2);
  // 이력 보기·비교 화면처럼 정렬할 수 없는 곳에서는 막는다.
  rerender(<Canvas {...props} autoArrangeDisabled />);
  expect(screen.getByRole("button", { name: "자동 정렬" })).toBeDisabled();
});

test("selecting a node inside a collapsed group highlights the group and keeps its neighbours undimmed", async () => {
  const state = fx("s2");
  const props = baseProps(state);
  props.options = { ...props.options, collapsed: new Set(["was-pair"]), selectedId: "was-1" };
  const { container } = render(<div style={{ width: 800, height: 600 }}><Canvas {...props} /></div>);
  await waitFor(() => expect(container.querySelector('.react-flow__node-zone[data-id="was-pair"] .group--selected')).not.toBeNull());
  expect(container.querySelector('.react-flow__node[data-id="web-1"] .node--dimmed')).toBeNull();
  expect(container.querySelector('.react-flow__node[data-id="db-proxy"] .node--dimmed')).toBeNull();
});

test("a rejected layout shows a message instead of a blank canvas", async () => {
  vi.mocked(layoutMod.layoutDiagram).mockRejectedValueOnce(new Error("elk"));
  vi.spyOn(console, "error").mockImplementation(() => {});
  render(<div style={{ width: 800, height: 600 }}><Canvas {...baseProps()} /></div>);
  expect(await screen.findByText("구성도를 배치하지 못했어요. 새로고침하거나 구성을 다시 확인해 주세요.")).toBeInTheDocument();
});

const withMissing = (p: CanvasProps): CanvasProps => ({ ...p, options: { ...p.options, showMissingBadges: true } });

test("missing badges hidden by default", async () => {
  const { container } = render(<div style={{ width: 800, height: 600 }}><Canvas {...baseProps()} /></div>);
  await waitFor(() => expect(container.querySelectorAll(".react-flow__node-infra").length).toBeGreaterThan(0));
  expect(container.querySelector(".node__badge")).toBeNull();
});

test("toggle shows them and is remembered", async () => {
  const props = baseProps();
  render(<div style={{ width: 800, height: 600 }}><Canvas {...props} /></div>);
  const btn = screen.getByRole("button", { name: "빠진 정보 숫자" });
  expect(btn).toHaveAttribute("aria-pressed", "false");
  fireEvent.click(btn);
  expect(props.onOptionsChange).toHaveBeenCalledWith(expect.objectContaining({ showMissingBadges: true }));
});

test("missing badge shows count and calls onBadgeClick without selecting", async () => {
  const props = { ...withMissing(baseProps()), onBadgeClick: vi.fn() };
  const { container } = render(<div style={{ width: 800, height: 600 }}><Canvas {...props} /></div>);
  const badge = await waitFor(() => {
    const b = container.querySelector('.react-flow__node[data-id="was-1"] .node__badge');
    expect(b).not.toBeNull();
    return b as HTMLElement;
  });
  expect(badge).toHaveTextContent("6");
  fireEvent.click(badge);
  expect(props.onBadgeClick).toHaveBeenCalledWith("was-1");
  expect(props.onSelect).not.toHaveBeenCalled();
});

test("no badge in compare mode", async () => {
  const props = { ...baseProps(), diffMarks: { added: new Set<string>(), removed: new Set<string>(), changed: new Set(["was-1"]) } };
  const { container } = render(<div style={{ width: 800, height: 600 }}><Canvas {...props} /></div>);
  await waitFor(() => expect(container.querySelectorAll(".react-flow__node-infra").length).toBeGreaterThan(0));
  expect(container.querySelector(".node__badge")).toBeNull();
});

const exposed = (nodeId: string) => ({ id: `db_exposed:${nodeId}`, rule: "db_exposed", nodeId, level: "warn" as const, text: "외부에서 보여요", guide: "g" });
const nodeEl = (c: HTMLElement, id: string) => c.querySelector(`.react-flow__node[data-id="${id}"]`) as HTMLElement | null;

test("warn and missing badges side by side", async () => {
  const props = withMissing(baseProps({ ...fx("s2"), warnings: [exposed("was-1")] }));
  const { container } = render(<div style={{ width: 800, height: 600 }}><Canvas {...props} /></div>);
  const node = await waitFor(() => {
    const n = nodeEl(container, "was-1");
    expect(n).not.toBeNull();
    expect(n!.querySelector(".node__badge--warn")).not.toBeNull();
    return n!;
  });
  const badges = [...node.querySelectorAll(".node__badge")];
  expect(badges.map((b) => b.getAttribute("aria-label"))).toEqual(["경고 1개", "빠진 정보 6개"]);
  expect(badges[0]).toHaveClass("node__badge--pair");
});

test("warn badge unaffected", async () => {
  const props = baseProps({ ...fx("s2"), warnings: [exposed("was-1")] });
  const { container } = render(<div style={{ width: 800, height: 600 }}><Canvas {...props} /></div>);
  await waitFor(() => expect(nodeEl(container, "was-1")?.querySelector(".node__badge--warn") ?? null).not.toBeNull());
  expect([...nodeEl(container, "was-1")!.querySelectorAll(".node__badge")].map((b) => b.getAttribute("aria-label"))).toEqual(["경고 1개"]);
  expect(nodeEl(container, "was-1")!.querySelector(".node__badge--warn")).not.toHaveClass("node__badge--pair");
});

test("warn badge selects the node", async () => {
  const onWarnBadgeClick = vi.fn();
  const props = { ...baseProps({ ...fx("s2"), warnings: [exposed("was-1")] }), onWarnBadgeClick };
  const { container } = render(<div style={{ width: 800, height: 600 }}><Canvas {...props} /></div>);
  const badge = await waitFor(() => {
    const b = nodeEl(container, "was-1")?.querySelector(".node__badge--warn") ?? null;
    expect(b).not.toBeNull();
    return b as HTMLElement;
  });
  fireEvent.click(badge);
  expect(onWarnBadgeClick).toHaveBeenCalledWith("was-1");
});

test("no badges in compare mode", async () => {
  const props = { ...baseProps({ ...fx("s2"), warnings: [exposed("was-1")] }), diffMarks: { added: new Set<string>(), removed: new Set<string>(), changed: new Set<string>() } };
  const { container } = render(<div style={{ width: 800, height: 600 }}><Canvas {...props} /></div>);
  await waitFor(() => expect(container.querySelectorAll(".react-flow__node-infra").length).toBeGreaterThan(0));
  expect(container.querySelector(".node__badge")).toBeNull();
});

test("ignored warning has no badge", async () => {
  const props = baseProps({ ...fx("s2"), warnings: [exposed("was-1")], ignoredWarnings: ["db_exposed:was-1"] });
  props.options = { ...props.options, showMissingBadges: true };
  const { container } = render(<div style={{ width: 800, height: 600 }}><Canvas {...props} /></div>);
  await waitFor(() => expect(nodeEl(container, "was-1")?.querySelector(".node__badge") ?? null).not.toBeNull());
  expect(container.querySelector(".node__badge--warn")).toBeNull();
});

test("clicking the selected node again clears selection", async () => {
  const props = baseProps();
  props.options = { ...props.options, selectedId: "was-1" };
  const { container } = render(<div style={{ width: 800, height: 600 }}><Canvas {...props} /></div>);
  await waitFor(() => expect(nodeEl(container, "was-1")).not.toBeNull());
  fireEvent.click(nodeEl(container, "was-1")!);
  expect(props.onSelect).toHaveBeenCalledWith(null);
  fireEvent.click(nodeEl(container, "web-1")!);
  expect(props.onSelect).toHaveBeenLastCalledWith("web-1");
});

test("clicking a group background clears selection, the fold button does not", async () => {
  const props = baseProps();
  props.options = { ...props.options, selectedId: "was-1" };
  const { container } = render(<div style={{ width: 800, height: 600 }}><Canvas {...props} /></div>);
  const zone = await waitFor(() => {
    const z = container.querySelector('.react-flow__node-zone[data-id="was-pair"]');
    expect(z).not.toBeNull();
    return z as HTMLElement;
  });
  fireEvent.click(zone);
  expect(props.onSelect).toHaveBeenCalledWith(null);
  vi.mocked(props.onSelect).mockClear();
  fireEvent.click(zone.querySelector(".group__toggle")!);
  expect(props.onOptionsChange).toHaveBeenCalled();
  expect(props.onSelect).not.toHaveBeenCalled();
});

test("drag end does not toggle", async () => {
  const props = { ...baseProps(), editMode: true };
  props.options = { ...props.options, selectedId: "was-1" };
  const { container } = render(<div style={{ width: 800, height: 600 }}><Canvas {...props} /></div>);
  await waitFor(() => expect(nodeEl(container, "was-1")).not.toBeNull());
  const el = nodeEl(container, "was-1")!;
  const win = el.ownerDocument.defaultView as unknown as typeof globalThis;
  const fire = (target: EventTarget, type: string, x: number, y: number) => {
    const ev = new win.MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0, buttons: type === "mouseup" ? 0 : 1 });
    Object.defineProperty(ev, "view", { value: win });
    target.dispatchEvent(ev);
  };
  fire(el, "mousedown", 10, 10);
  fire(win.document, "mousemove", 60, 60);
  fire(win.document, "mousemove", 80, 80);
  fire(win.document, "mouseup", 80, 80);
  fireEvent.click(el);
  expect(props.onSelect).not.toHaveBeenCalled();
});

test("canvas centers and pulses on focus request", async () => {
  // jsdom 은 크기가 0 이라 카메라가 움직이지 않는다: 캔버스 크기와 움직임 줄이기를 흉내 낸다.
  const ow = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");
  const oh = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", { configurable: true, get: () => 800 });
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", { configurable: true, get: () => 600 });
  vi.stubGlobal("matchMedia", (q: string) => ({ matches: q.includes("reduce"), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
  try {
    const props = { ...baseProps(), cameraInsets: { left: 100, right: 200 } };
    const { container, rerender } = render(<Canvas {...props} />);
    await waitFor(() => expect(nodeEl(container, "was-1")).not.toBeNull());
    const vpEl = container.querySelector(".react-flow__viewport") as HTMLElement;
    const parse = () => {
      const m = /translate\(([-\d.e]+)px, ?([-\d.e]+)px\) scale\(([-\d.e]+)\)/.exec(vpEl.style.transform)!;
      return { x: Number(m[1]), y: Number(m[2]), zoom: Number(m[3]) };
    };
    await waitFor(() => expect(vpEl.style.transform).toMatch(/translate/));
    rerender(<Canvas {...props} focusRequest={{ id: "was-1", token: 1 }} />);
    const node = nodeEl(container, "was-1")!;
    const pos = /translate\(([-\d.]+)px, ?([-\d.]+)px\)/.exec(node.style.transform)!;
    const w = parseFloat(node.style.width), h = parseFloat(node.style.height);
    await waitFor(() => {
      const v = parse();
      expect(v.zoom).toBeGreaterThanOrEqual(0.8);
      // 노드 가운데가 패널 사이 띠(100..600)의 가운데 350, 높이 600 의 가운데 300 에 온다.
      expect((Number(pos[1]) + w / 2) * v.zoom + v.x).toBeCloseTo(350, 0);
      expect((Number(pos[2]) + h / 2) * v.zoom + v.y).toBeCloseTo(300, 0);
    });
    expect(node.querySelector(".node--pulse")).not.toBeNull();
    expect(container.querySelectorAll(".node--pulse")).toHaveLength(1);
    expect(props.onSelect).not.toHaveBeenCalled();
    // 1.6초 뒤 강조가 사라진다.
    await waitFor(() => expect(container.querySelector(".node--pulse")).toBeNull(), { timeout: 2500 });
  } finally {
    if (ow) Object.defineProperty(HTMLElement.prototype, "offsetWidth", ow);
    if (oh) Object.defineProperty(HTMLElement.prototype, "offsetHeight", oh);
    vi.unstubAllGlobals();
    vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
    class DM { m22 = 1; }
    vi.stubGlobal("DOMMatrixReadOnly", DM);
    vi.stubGlobal("DOMMatrix", DM);
  }
});

test("onPlaced locates drawn nodes on screen, not hidden or off-strip ones", async () => {
  const props = baseProps(fx("s2"));
  props.options = { ...props.options, collapsed: new Set(["was-pair"]) };
  let locate: ((id: string) => { x: number; y: number } | null) | null = null;
  props.onPlaced = (l) => {
    locate = l;
  };
  const orig = Element.prototype.getBoundingClientRect;
  let box = { left: -1e6, top: -1e6, width: 2e6, height: 2e6 };
  Element.prototype.getBoundingClientRect = function (this: Element) {
    const r = this.classList.contains("canvas__flow") ? box : { left: 0, top: 0, width: 0, height: 0 };
    return { ...r, x: r.left, y: r.top, right: r.left + r.width, bottom: r.top + r.height, toJSON: () => r } as DOMRect;
  };
  try {
    render(<div style={{ width: 800, height: 600 }}><Canvas {...props} /></div>);
    await waitFor(() => expect(locate).not.toBeNull());
    const p = locate!("web-1");
    expect(p).not.toBeNull();
    expect(Number.isFinite(p!.x) && Number.isFinite(p!.y)).toBe(true);
    expect(locate!("was-1")).toBeNull(); // 접힌 영역 안
    expect(locate!("nope")).toBeNull();
    box = { left: 1e7, top: 1e7, width: 10, height: 10 }; // 화면 밖
    expect(locate!("web-1")).toBeNull();
  } finally {
    Element.prototype.getBoundingClientRect = orig;
  }
});
