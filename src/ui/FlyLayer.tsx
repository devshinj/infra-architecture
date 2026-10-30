"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, type RefObject } from "react";

import { prefersReducedMotion } from "@/canvas/useCamera";

export type Point = { x: number; y: number };
/** 노드의 지금 화면 중심(px). 접힌 영역 안·화면 밖이면 null. */
export type Locate = (id: string) => Point | null;

/** 날아가는 시간·끝 페이드·동시에 날 수 있는 수·빛점 지름. */
export const FLY_MS = 500;
export const FADE_MS = 100;
export const MAX_DOTS = 3;
const DOT = 6;
/** 위로 휘는 정도: 두 점 거리의 비율, 최대 px. */
const BEND = 0.2;
const BEND_MAX = 80;

/** 진행 카드의 현재 단계 점에 붙는 표시. 출발점은 마지막(가장 최근) 표시다. */
export const FLY_ORIGIN_ATTR = "data-fly-origin";

const inside = (p: Point, r: DOMRect) => p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom;

/** 진행 카드 현재 단계 점의 화면 중심. 카드가 없거나(대화 탭이 아님) 대화 목록 밖으로 스크롤됐으면 null. */
export function flyOrigin(): Point | null {
  if (typeof document === "undefined") return null;
  const all = document.querySelectorAll<HTMLElement>(`[${FLY_ORIGIN_ATTR}]`);
  const el = all[all.length - 1];
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return null;
  const p = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  const log = el.closest('[role="log"]');
  if (log && !inside(p, log.getBoundingClientRect())) return null;
  return p;
}

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/** 2차 곡선 위의 점: 조절점은 두 점의 가운데에서 위로 거리의 20%(최대 80px). */
function along(from: Point, to: Point, t: number): Point {
  const dist = Math.hypot(to.x - from.x, to.y - from.y);
  const c = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 - Math.min(BEND_MAX, dist * BEND) };
  const u = 1 - t;
  return { x: u * u * from.x + 2 * u * t * c.x + t * t * to.x, y: u * u * from.y + 2 * u * t * c.y + t * t * to.y };
}

export interface FlyLayerHandle {
  /** 빛점 하나를 날린다. 이미 MAX_DOTS 개가 날고 있으면 건너뛰고 false. `to` 는 프레임마다 다시 읽는다(카메라가 움직여도 노드를 따라간다). */
  launch(from: Point, to: () => Point | null): boolean;
}

/** 패널·캔버스 위의 고정 레이어. 포인터를 받지 않고 화면 읽기에서도 숨긴다. 단색 원(글로우·그림자 없음). */
export const FlyLayer = forwardRef<FlyLayerHandle>(function FlyLayer(_, ref) {
  const layer = useRef<HTMLDivElement>(null);
  const running = useRef(new Set<{ el: HTMLElement; raf: number }>());

  useImperativeHandle(ref, () => ({
    launch(from, to) {
      const host = layer.current;
      if (!host || running.current.size >= MAX_DOTS) return false;
      const el = document.createElement("span");
      el.setAttribute("data-fly-dot", "");
      Object.assign(el.style, {
        position: "absolute",
        left: "0px",
        top: "0px",
        width: `${DOT}px`,
        height: `${DOT}px`,
        borderRadius: "50%",
        background: "var(--fly-dot)",
        pointerEvents: "none",
        willChange: "transform, opacity",
      });
      const place = (p: Point, opacity: number) => {
        el.style.transform = `translate(${p.x - DOT / 2}px, ${p.y - DOT / 2}px)`;
        el.style.opacity = String(opacity);
      };
      let last = to() ?? from;
      place(from, 1);
      host.appendChild(el);
      const job = { el, raf: 0 };
      running.current.add(job);
      const t0 = performance.now();
      const tick = (now: number) => {
        const k = Math.min(1, Math.max(0, (now - t0) / FLY_MS));
        last = to() ?? last;
        const left = FLY_MS - (now - t0);
        place(along(from, last, ease(k)), left < FADE_MS ? Math.max(0, left / FADE_MS) : 1);
        if (k >= 1) {
          el.remove();
          running.current.delete(job);
          return;
        }
        job.raf = requestAnimationFrame(tick);
      };
      job.raf = requestAnimationFrame(tick);
      return true;
    },
  }));

  useEffect(() => {
    const jobs = running.current;
    return () => {
      for (const j of jobs) {
        cancelAnimationFrame(j.raf);
        j.el.remove();
      }
      jobs.clear();
    };
  }, []);

  return <div ref={layer} data-fly-layer="" aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 60, pointerEvents: "none", overflow: "hidden" }} />;
});

export interface FlyOptions {
  /** 캔버스 `움직임` 토글. */
  motion: boolean;
  /** 오른쪽 패널이 대화 탭이라 진행 카드가 보인다. */
  chatVisible: boolean;
}

/**
 * 대화 차례의 add_node 를 빛점으로 잇는다. queue(id) 는 명령이 올 때 출발점을 잡아 두고,
 * placed(locate) 는 캔버스 배치가 끝날 때마다 불려 기다리던 노드마다 한 번만 날린다(좌표를 모르면 버린다).
 */
export function useFly({ motion, chatVisible }: FlyOptions): {
  layerRef: RefObject<FlyLayerHandle | null>;
  queue(id: string): void;
  placed(locate: Locate): void;
  /** 기다리던 출발점을 버린다(차례 끝·중단·구성도 바뀜): 나중 배치에서 끝난 카드에서 날지 않게. */
  clear(): void;
} {
  const layerRef = useRef<FlyLayerHandle>(null);
  const pending = useRef(new Map<string, Point>());
  const opts = useRef({ motion, chatVisible });
  useEffect(() => {
    opts.current = { motion, chatVisible };
  });
  const queue = useCallback((id: string) => {
    const { motion: m, chatVisible: v } = opts.current;
    if (!m || !v || prefersReducedMotion()) return;
    const from = flyOrigin();
    if (from) pending.current.set(id, from);
  }, []);
  const placed = useCallback((locate: Locate) => {
    const waiting = [...pending.current];
    pending.current.clear();
    for (const [id, from] of waiting) {
      if (!locate(id)) continue;
      layerRef.current?.launch(from, () => locate(id));
    }
  }, []);
  const clear = useCallback(() => pending.current.clear(), []);
  return { layerRef, queue, placed, clear };
}
