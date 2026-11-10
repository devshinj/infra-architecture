import "@testing-library/jest-dom/vitest";
import { act, cleanup, render } from "@testing-library/react";
import { useRef, useState } from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { GHOST_MS, GhostLayer, type GhostRequest } from "@/ui/GhostLayer";

let reduced = false;
let remove: ((nodes: string[], edges: string[]) => void) | null = null;
let rerenderSame: (() => void) | null = null;

/**
 * 캔버스 자리: 노드 a·b, 연결 e1(혼자 쓰는 조각)·e2(e1 과 함께 쓰는 조각).
 * remove 는 지울 것을 그리지 않는 상태와 유령 요청을 한 번에(같은 커밋에) 바꾼다.
 */
function Harness({ motion = true }: { motion?: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState<{ nodes: string[]; edges: string[]; req: GhostRequest | null }>({ nodes: [], edges: [], req: null });
  const [, setN] = useState(0);
  remove = (nodes, edges) => setGone((g) => ({ nodes, edges, req: { key: (g.req?.key ?? 0) + 1, nodes, edges } }));
  rerenderSame = () => setN((n) => n + 1);
  const has = (id: string) => !gone.nodes.includes(id);
  const hasEdge = (id: string) => !gone.edges.includes(id);
  return (
    <>
      <div ref={root}>
        {has("a") && (
          <div className="react-flow__node" data-id="a" style={{ transform: "translate(40px, 50px)" }}>
            <div className="node">a</div>
          </div>
        )}
        <div className="react-flow__node" data-id="b">
          <div className="node">b</div>
        </div>
        <svg className="edge-layer" width="400" height="300">
          <g className="edge-base">
            {hasEdge("e1") && <g className="edge-seg" data-edge-ids="e1"><path className="edge-line" d="M0 0L10 10" /></g>}
            <g className="edge-seg" data-edge-ids={hasEdge("e1") ? "e1 e2" : "e2"}><path className="edge-line" d="M10 10L20 20" /></g>
          </g>
          {hasEdge("e1") && <g className="edge" data-edge-id="e1"><path className="edge-arrow" d="M9 9L10 10" /><path className="edge-hit" d="M0 0L10 10" /></g>}
        </svg>
      </div>
      <GhostLayer request={gone.req} root={root} motion={motion} />
    </>
  );
}

const origRect = Element.prototype.getBoundingClientRect;
const ghosts = () => document.querySelectorAll("[data-ghost]");

beforeEach(() => {
  reduced = false;
  remove = null;
  vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "setTimeout", "clearTimeout"] });
  Element.prototype.getBoundingClientRect = function () {
    const r = { left: 100, top: 80, width: 120, height: 52 };
    return { ...r, x: r.left, y: r.top, right: r.left + r.width, bottom: r.top + r.height, toJSON: () => r } as DOMRect;
  };
  vi.stubGlobal("matchMedia", (q: string) => ({ matches: reduced && q.includes("reduce"), media: q, addEventListener() {}, removeEventListener() {} }));
});
afterEach(() => {
  cleanup();
  Element.prototype.getBoundingClientRect = origRect;
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

test("removed node and edge are captured from the screen before the commit that drops them, then fade out", () => {
  render(<Harness />);
  act(() => remove!(["a"], ["e1"]));
  // 진짜 캔버스에서는 이미 사라졌다.
  expect(document.querySelector('.react-flow__node[data-id="a"]')).toBeNull();
  expect(ghosts()).toHaveLength(2);
  const node = document.querySelector("[data-ghost] .node")!;
  expect(node).toHaveClass("node--diff-removed");
  expect(node).toHaveTextContent("a");
  const box = node.closest<HTMLElement>("[data-ghost]")!;
  expect(box.style.left).toBe("100px");
  expect(box.style.top).toBe("80px");
  // 노드는 비교 보기 모양(.node--diff-removed 의 0.75)을 한 번만 입는다: 상자는 1 에서 시작한다.
  expect(box.style.opacity).toBe("1");
  expect(box.style.transition).toContain(`${GHOST_MS}ms`);
  // 연결: 혼자 쓰는 조각과 화살표만, 누르는 자리 없이.
  const svg = document.querySelector("[data-ghost] svg.edge-layer")!;
  expect(svg.querySelectorAll(".edge-seg")).toHaveLength(1);
  expect(svg.querySelector(".edge-seg")).toHaveAttribute("data-edge-ids", "e1");
  expect(svg.querySelector(".edge-arrow")).not.toBeNull();
  expect(svg.querySelector(".edge-hit")).toBeNull();
  expect(svg).toHaveAttribute("viewBox", "0 0 400 300");
  expect(svg.closest<HTMLElement>("[data-ghost]")!.style.opacity).toBe("0.75");
  // 다음 프레임에 흐려지기 시작하고 GHOST_MS 뒤 사라진다.
  act(() => vi.advanceTimersToNextFrame());
  expect(box.style.opacity).toBe("0");
  act(() => vi.advanceTimersByTime(GHOST_MS));
  expect(ghosts()).toHaveLength(0);
});

test("the same request is not drawn again on a later render", () => {
  render(<Harness />);
  act(() => remove!(["a"], []));
  act(() => vi.advanceTimersByTime(GHOST_MS));
  expect(ghosts()).toHaveLength(0);
  act(() => rerenderSame!());
  expect(ghosts()).toHaveLength(0);
});

test("prefers-reduced-motion: reduce draws no ghost", () => {
  reduced = true;
  render(<Harness />);
  act(() => remove!(["a"], ["e1"]));
  expect(ghosts()).toHaveLength(0);
});

test("canvas motion off draws no ghost", () => {
  render(<Harness motion={false} />);
  act(() => remove!(["a"], []));
  expect(ghosts()).toHaveLength(0);
});

test("ids not on screen are skipped", () => {
  render(<Harness />);
  act(() => remove!(["zzz"], ["e9"]));
  expect(ghosts()).toHaveLength(0);
});

test("unmount cancels the pending frame and timers", () => {
  const { unmount } = render(<Harness />);
  act(() => remove!(["a"], []));
  expect(vi.getTimerCount()).toBeGreaterThan(0);
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});
