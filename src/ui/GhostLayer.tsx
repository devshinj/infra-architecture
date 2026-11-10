"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, type RefObject } from "react";

import { prefersReducedMotion } from "@/canvas/useCamera";

/** 지워진 노드·연결이 보였다 사라지는 시간. */
export const GHOST_MS = 1000;
/** 처음 보이는 진하기: 비교 보기의 지운 노드(.node--diff-removed)와 같다. */
const GHOST_OPACITY = 0.75;

type Shot = { el: Element; rect: DOMRect; scale: number; svg?: { width: string; height: string } };

export interface GhostLayerHandle {
  /**
   * 지워지기 직전 화면에서 그 노드·연결의 모습을 떠 둔다(캔버스가 새 상태를 그리기 전, 렌더 중에 부른다).
   * 다음 커밋 뒤 비교 보기 유령 모양으로 GHOST_MS 동안 흐려지며 사라진다.
   */
  capture(root: HTMLElement | null, removed: { nodes: string[]; edges: string[] }): void;
}

const cssEscape = (s: string) => (typeof CSS !== "undefined" && CSS.escape ? CSS.escape(s) : s.replace(/["\\]/g, "\\$&"));

/** 노드: React Flow 노드 칸을 통째로 떠서 비교 보기의 지운 노드 모양(점선 테두리)을 입힌다. */
function shootNode(root: HTMLElement, id: string): Shot | null {
  const wrap = root.querySelector<HTMLElement>(`.react-flow__node[data-id="${cssEscape(id)}"]`);
  if (!wrap) return null;
  const rect = wrap.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return null;
  const el = wrap.cloneNode(true) as HTMLElement;
  el.removeAttribute("data-id");
  el.querySelector(".node")?.classList.add("node--diff-removed");
  const w = wrap.offsetWidth;
  return { el, rect, scale: w > 0 ? rect.width / w : 1 };
}

/** 연결: 그 연결만 지나는 바닥 조각과 화살표·이름을 떠서, 같은 크기의 svg 에 담는다. */
function shootEdges(root: HTMLElement, ids: string[]): Shot | null {
  const svg = root.querySelector<SVGSVGElement>("svg.edge-layer");
  if (!svg || ids.length === 0) return null;
  const gone = new Set(ids);
  const parts: Element[] = [];
  for (const seg of svg.querySelectorAll(".edge-seg[data-edge-ids]")) {
    const segIds = (seg.getAttribute("data-edge-ids") ?? "").split(" ").filter(Boolean);
    // 남는 연결과 함께 쓰는 조각은 그대로 남으므로 뜨지 않는다.
    if (segIds.length > 0 && segIds.every((i) => gone.has(i))) parts.push(seg.cloneNode(true) as Element);
  }
  for (const id of ids) {
    const g = svg.querySelector(`.edge[data-edge-id="${cssEscape(id)}"]`);
    if (!g) continue;
    const c = g.cloneNode(true) as Element;
    c.querySelectorAll(".edge-hit").forEach((h) => h.remove());
    parts.push(c);
  }
  if (parts.length === 0) return null;
  const rect = svg.getBoundingClientRect();
  const width = svg.getAttribute("width") ?? String(rect.width);
  const height = svg.getAttribute("height") ?? String(rect.height);
  const out = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  out.setAttribute("class", "edge-layer");
  out.setAttribute("viewBox", `0 0 ${width} ${height}`);
  for (const p of parts) out.appendChild(p);
  return { el: out, rect, scale: 1, svg: { width, height } };
}

/** 캔버스 위의 고정 레이어. 포인터를 받지 않고 화면 읽기에서도 숨긴다. 움직임은 opacity 전환뿐이다. */
export const GhostLayer = forwardRef<GhostLayerHandle>(function GhostLayer(_, ref) {
  const layer = useRef<HTMLDivElement>(null);
  const waiting = useRef(new Map<string, Shot>());
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

  useImperativeHandle(ref, () => ({
    capture(root, removed) {
      if (!root) return;
      for (const id of removed.nodes) {
        if (waiting.current.has(`n:${id}`)) continue;
        const s = shootNode(root, id);
        if (s) waiting.current.set(`n:${id}`, s);
      }
      const edgeKey = `e:${[...removed.edges].sort().join(" ")}`;
      if (removed.edges.length > 0 && !waiting.current.has(edgeKey)) {
        const s = shootEdges(root, removed.edges);
        if (s) waiting.current.set(edgeKey, s);
      }
    },
  }));

  // 커밋마다: 떠 둔 모습이 있으면 띄우고 흐리게 한 뒤 지운다.
  useLayoutEffect(() => {
    const host = layer.current;
    if (!host || waiting.current.size === 0) return;
    const shots = [...waiting.current.values()];
    waiting.current.clear();
    for (const s of shots) {
      const box = document.createElement("div");
      box.setAttribute("data-ghost", "");
      Object.assign(box.style, {
        position: "absolute",
        left: `${s.rect.left}px`,
        top: `${s.rect.top}px`,
        width: `${s.rect.width / s.scale}px`,
        height: `${s.rect.height / s.scale}px`,
        transform: s.scale === 1 ? "" : `scale(${s.scale})`,
        transformOrigin: "0 0",
        opacity: String(GHOST_OPACITY),
        transition: `opacity ${GHOST_MS}ms ease`,
        pointerEvents: "none",
      });
      if (s.svg) {
        s.el.setAttribute("width", String(s.rect.width));
        s.el.setAttribute("height", String(s.rect.height));
      } else {
        // React Flow 가 준 자리(transform)는 버리고 상자 왼쪽 위에 둔다.
        Object.assign((s.el as HTMLElement).style, { position: "absolute", left: "0px", top: "0px", transform: "none" });
      }
      box.appendChild(s.el);
      host.appendChild(box);
      // 붙인 다음 프레임에 0 으로 바꿔야 전환이 돈다.
      requestAnimationFrame(() => {
        box.style.opacity = "0";
      });
      const t = setTimeout(() => {
        box.remove();
        timers.current.delete(t);
      }, GHOST_MS);
      timers.current.add(t);
    }
  });

  useEffect(() => {
    const ts = timers.current;
    const host = layer.current;
    return () => {
      ts.forEach(clearTimeout);
      ts.clear();
      host?.replaceChildren();
    };
  }, []);

  return <div ref={layer} data-ghost-layer="" aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 30, pointerEvents: "none", overflow: "hidden" }} />;
});

/**
 * 바깥에서 받은 새 버전의 지운 노드·연결을 잠깐 유령으로 보인다.
 * 캔버스 `움직임`이 꺼졌거나 prefers-reduced-motion: reduce 면 그리지 않는다.
 */
export function useGhosts({ motion }: { motion: boolean }): {
  layerRef: RefObject<GhostLayerHandle | null>;
  capture(root: HTMLElement | null, removed: { nodes: string[]; edges: string[] }): void;
} {
  const layerRef = useRef<GhostLayerHandle>(null);
  const motionRef = useRef(motion);
  motionRef.current = motion;
  const capture = useCallback((root: HTMLElement | null, removed: { nodes: string[]; edges: string[] }) => {
    if (!motionRef.current || prefersReducedMotion()) return;
    if (removed.nodes.length === 0 && removed.edges.length === 0) return;
    layerRef.current?.capture(root, removed);
  }, []);
  return { layerRef, capture };
}
