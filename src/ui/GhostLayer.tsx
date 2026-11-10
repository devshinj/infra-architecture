"use client";

import { Component, createRef, type RefObject } from "react";

import { prefersReducedMotion } from "@/canvas/useCamera";

/** 지워진 노드·연결이 보였다 사라지는 시간. */
export const GHOST_MS = 1000;
/** 연결 유령의 처음 진하기. 노드는 비교 보기의 지운 노드(.node--diff-removed, 0.75)를 그대로 입혀 상자는 1로 둔다. */
const EDGE_GHOST_OPACITY = 0.75;

/** 이번 커밋에서 지워질 노드·연결. key 가 바뀔 때만 한 번 뜬다(같은 요청을 다시 그려도 다시 뜨지 않는다). */
export interface GhostRequest {
  key: number;
  nodes: string[];
  edges: string[];
}

export interface GhostLayerProps {
  request: GhostRequest | null;
  /** 노드·연결을 찾을 작업 화면. */
  root: RefObject<HTMLElement | null>;
  /** 캔버스 `움직임`. 꺼졌거나 prefers-reduced-motion: reduce 면 그리지 않는다. */
  motion: boolean;
}

type Shot = { el: Element; rect: DOMRect; scale: number; edge: boolean };

const cssEscape = (s: string) => (typeof CSS !== "undefined" && CSS.escape ? CSS.escape(s) : s.replace(/["\\]/g, "\\$&"));

/** 노드: React Flow 노드 칸을 통째로 떠서 비교 보기의 지운 노드 모양(점선 테두리·0.75)을 입힌다. */
function shootNode(root: HTMLElement, id: string): Shot | null {
  const wrap = root.querySelector<HTMLElement>(`.react-flow__node[data-id="${cssEscape(id)}"]`);
  if (!wrap) return null;
  const rect = wrap.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return null;
  const el = wrap.cloneNode(true) as HTMLElement;
  el.removeAttribute("data-id");
  el.querySelector(".node")?.classList.add("node--diff-removed");
  const w = wrap.offsetWidth;
  return { el, rect, scale: w > 0 ? rect.width / w : 1, edge: false };
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
  if (rect.width === 0 && rect.height === 0) return null;
  const out = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  out.setAttribute("class", "edge-layer");
  out.setAttribute("viewBox", `0 0 ${svg.getAttribute("width") ?? rect.width} ${svg.getAttribute("height") ?? rect.height}`);
  out.setAttribute("width", String(rect.width));
  out.setAttribute("height", String(rect.height));
  for (const p of parts) out.appendChild(p);
  return { el: out, rect, scale: 1, edge: true };
}

/**
 * 캔버스 위의 고정 레이어. 바깥(Claude Code)에서 받은 새 버전이 지운 노드·연결을 비교 보기 유령 모양으로
 * GHOST_MS 동안 흐려지며 사라지게 한다. 움직임은 opacity 전환뿐이고, 포인터를 받지 않으며 화면 읽기에서도 숨긴다.
 *
 * 지워지기 직전 모습은 getSnapshotBeforeUpdate 에서 뜬다: 그 커밋이 화면을 바꾸기 전에 불리므로(렌더 중 부수 효과 없이)
 * 캔버스가 새 상태를 그리기 전의 노드·연결을 읽을 수 있다. 버려진 렌더는 커밋되지 않아 낡은 모습이 남지 않는다.
 */
export class GhostLayer extends Component<GhostLayerProps> {
  private layer = createRef<HTMLDivElement>();
  private timers = new Set<ReturnType<typeof setTimeout>>();
  private frames = new Set<number>();

  getSnapshotBeforeUpdate(prev: GhostLayerProps): Shot[] | null {
    const req = this.props.request;
    const root = this.props.root.current;
    if (!req || req.key === prev.request?.key || !root) return null;
    if (!this.props.motion || prefersReducedMotion()) return null;
    const shots: Shot[] = [];
    for (const id of req.nodes) {
      const s = shootNode(root, id);
      if (s) shots.push(s);
    }
    const e = shootEdges(root, req.edges);
    if (e) shots.push(e);
    return shots.length ? shots : null;
  }

  componentDidUpdate(_prev: GhostLayerProps, _state: unknown, shots: Shot[] | null) {
    const host = this.layer.current;
    if (!host || !shots) return;
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
        opacity: String(s.edge ? EDGE_GHOST_OPACITY : 1),
        transition: `opacity ${GHOST_MS}ms ease`,
        pointerEvents: "none",
      });
      // React Flow 가 준 자리(transform)는 버리고 상자 왼쪽 위에 둔다.
      if (!s.edge) Object.assign((s.el as HTMLElement).style, { position: "absolute", left: "0px", top: "0px", transform: "none" });
      box.appendChild(s.el);
      host.appendChild(box);
      // 붙인 다음 프레임에 0 으로 바꿔야 전환이 돈다.
      const f = requestAnimationFrame(() => {
        this.frames.delete(f);
        box.style.opacity = "0";
      });
      this.frames.add(f);
      const t = setTimeout(() => {
        this.timers.delete(t);
        box.remove();
      }, GHOST_MS);
      this.timers.add(t);
    }
  }

  componentWillUnmount() {
    this.frames.forEach(cancelAnimationFrame);
    this.frames.clear();
    this.timers.forEach(clearTimeout);
    this.timers.clear();
    this.layer.current?.replaceChildren();
  }

  render() {
    return <div ref={this.layer} data-ghost-layer="" aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 30, pointerEvents: "none", overflow: "hidden" }} />;
  }
}
