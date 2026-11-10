import "@testing-library/jest-dom/vitest";
import { act, cleanup, render } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { GHOST_MS, GhostLayer, useGhosts } from "@/ui/GhostLayer";

let reduced = false;
let fire: ((removed: { nodes: string[]; edges: string[] }) => void) | null = null;

/** 캔버스 자리: 노드 a·b, 연결 e1(a 혼자 쓰는 조각)·e2(e1 과 함께 쓰는 조각). */
function Harness({ motion = true }: { motion?: boolean }) {
  const g = useGhosts({ motion });
  const [, setN] = useState(0);
  fire = (removed) => {
    g.capture(document.getElementById("root"), removed);
    setN((n) => n + 1);
  };
  return (
    <>
      <div id="root">
        <div className="react-flow__node" data-id="a" style={{ transform: "translate(40px, 50px)" }}>
          <div className="node">a</div>
        </div>
        <div className="react-flow__node" data-id="b">
          <div className="node">b</div>
        </div>
        <svg className="edge-layer" width="400" height="300">
          <g className="edge-base">
            <g className="edge-seg" data-edge-ids="e1"><path className="edge-line" d="M0 0L10 10" /></g>
            <g className="edge-seg" data-edge-ids="e1 e2"><path className="edge-line" d="M10 10L20 20" /></g>
          </g>
          <g className="edge" data-edge-id="e1"><path className="edge-arrow" d="M9 9L10 10" /><path className="edge-hit" d="M0 0L10 10" /></g>
        </svg>
      </div>
      <GhostLayer ref={g.layerRef} />
    </>
  );
}

const origRect = Element.prototype.getBoundingClientRect;
const ghosts = () => document.querySelectorAll("[data-ghost]");

beforeEach(() => {
  reduced = false;
  fire = null;
  vi.useFakeTimers({ toFake: ["requestAnimationFrame", "setTimeout", "clearTimeout"] });
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

test("removed node and edge show as compare-view ghosts, fade, then disappear", () => {
  render(<Harness />);
  act(() => fire!({ nodes: ["a"], edges: ["e1"] }));
  const all = ghosts();
  expect(all).toHaveLength(2);
  const node = document.querySelector("[data-ghost] .node")!;
  expect(node).toHaveClass("node--diff-removed");
  expect(node).toHaveTextContent("a");
  const box = node.closest<HTMLElement>("[data-ghost]")!;
  expect(box.style.left).toBe("100px");
  expect(box.style.top).toBe("80px");
  expect(box.style.opacity).toBe("0.75");
  expect(box.style.transition).toContain(`${GHOST_MS}ms`);
  // 연결: 혼자 쓰는 조각과 화살표만, 누르는 자리 없이.
  const svg = document.querySelector("[data-ghost] svg.edge-layer")!;
  expect(svg.querySelectorAll(".edge-seg")).toHaveLength(1);
  expect(svg.querySelector(".edge-seg")).toHaveAttribute("data-edge-ids", "e1");
  expect(svg.querySelector(".edge-arrow")).not.toBeNull();
  expect(svg.querySelector(".edge-hit")).toBeNull();
  expect(svg).toHaveAttribute("viewBox", "0 0 400 300");
  // 다음 프레임에 흐려지기 시작하고 GHOST_MS 뒤 사라진다.
  act(() => vi.advanceTimersToNextFrame());
  expect(box.style.opacity).toBe("0");
  act(() => vi.advanceTimersByTime(GHOST_MS));
  expect(ghosts()).toHaveLength(0);
  // 진짜 캔버스는 건드리지 않는다.
  expect(document.querySelector('.react-flow__node[data-id="a"]')).not.toBeNull();
});

test("prefers-reduced-motion: reduce draws no ghost", () => {
  reduced = true;
  render(<Harness />);
  act(() => fire!({ nodes: ["a"], edges: ["e1"] }));
  expect(ghosts()).toHaveLength(0);
});

test("canvas motion off draws no ghost", () => {
  render(<Harness motion={false} />);
  act(() => fire!({ nodes: ["a"], edges: [] }));
  expect(ghosts()).toHaveLength(0);
});

test("ids not on screen are skipped", () => {
  render(<Harness />);
  act(() => fire!({ nodes: ["zzz"], edges: ["e9"] }));
  expect(ghosts()).toHaveLength(0);
});
