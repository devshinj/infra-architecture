import type { DiagramState } from "@/domain/types";
import { buildDisplayGraph, defaultDisplayOptions, type DisplayGraph } from "./display";
import { layoutDiagram, type Layout, type Rect } from "./layout";
import { textWidth } from "./text";

/** 배치 읽기 쉬움을 재는 값. 단계마다 이 값이 나빠지지 않았는지 회귀 시험이 지킨다. */
export interface LayoutMetrics {
  crossings: number; // 두 선이 서로의 안쪽에서 직각으로 만나는 점 수(양 끝 1px 제외)
  sharedPx: number; // 간격 0.5px 이하로 겹친 길이
  parallelPx: number; // 서로 다른 선이 0.5 < 간격 < minGap 으로 나란한 길이(각 선 양 끝 END_TRIM 제외)
  throughNode: number; // 끝점이 아닌 노드(또는 접힌 영역) 상자 안쪽을 지나는 선 수
  bends: number; // 꺾임 수 합
  aspect: number; // width / height
  zoneHeadCrossings: number; // 펼친 영역의 이름 알약 자리를 지나는 선 수(알약 하나당 선 하나 한 번, 그 영역이 끝점인 선 제외)
}

/** 선의 첫 점과 마지막 점에서 이만큼은 노드 옆이라 나란해도 세지 않는다. */
export const END_TRIM = 8;

/** 영역 이름 글자 크기(배율 1 의 캔버스 px). canvas.css 의 .group__name 바닥값과 같다. */
export const NAME_PX = 11;
const HEAD_H = 30; // .group__head 높이
const HEAD_PAD = 10; // .group__head 왼쪽 안쪽 여백
const PILL_PAD = 18; // .group__name 좌우 안쪽 여백 합

/** 펼친 영역 머리 칸에서 이름 알약이 차지하는 자리(어림값). */
export function zoneHeadPill(g: Rect, label: string): Rect {
  return { x: g.x + HEAD_PAD, y: g.y, width: PILL_PAD + textWidth(label, NAME_PX), height: HEAD_H };
}

type Pt = { x: number; y: number };
interface Seg {
  a: Pt;
  b: Pt;
  from: number; // 이 마디 안에서 평행 길이로 셀 수 있는 구간의 시작(마디 시작점으로부터 거리)
  to: number; // 끝
}

const len = (a: Pt, b: Pt): number => Math.hypot(a.x - b.x, a.y - b.y);
const isV = (s: Seg): boolean => Math.abs(s.a.x - s.b.x) < 0.5;
const isH = (s: Seg): boolean => Math.abs(s.a.y - s.b.y) < 0.5;
const lo = (s: Seg, k: "x" | "y"): number => Math.min(s.a[k], s.b[k]);
const hi = (s: Seg, k: "x" | "y"): number => Math.max(s.a[k], s.b[k]);

function segsOf(pts: Pt[]): Seg[] {
  const total = pts.slice(1).reduce((t, b, i) => t + len(pts[i], b), 0);
  const out: Seg[] = [];
  let at = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const l = len(a, b);
    if (l > 0.01) out.push({ a, b, from: Math.max(0, END_TRIM - at), to: Math.min(l, total - END_TRIM - at) });
    at += l;
  }
  return out;
}

/** 마디에서 평행 길이로 셀 수 있는 구간을 축(k) 좌표 [작은 값, 큰 값] 으로 돌려준다. 없으면 null. */
function trimmedRange(s: Seg, k: "x" | "y"): [number, number] | null {
  if (s.to <= s.from) return null;
  const l = len(s.a, s.b);
  const p = (d: number): number => s.a[k] + ((s.b[k] - s.a[k]) * d) / l;
  const [x, y] = [p(s.from), p(s.to)];
  return [Math.min(x, y), Math.max(x, y)];
}

// 끝점이 아닌 상자 안쪽(가장자리 2px 안쪽)을 지나는지
const rectHit = (s: Seg, r: Rect, shrink = 2): boolean =>
  hi(s, "x") > r.x + shrink && lo(s, "x") < r.x + r.width - shrink && hi(s, "y") > r.y + shrink && lo(s, "y") < r.y + r.height - shrink;

/**
 * groupLabels: 영역 id → 이름. 배치에는 영역 이름이 없어 알약 자리를 재려면 따로 받는다. 이름을 모르는 영역은
 * zoneHeadCrossings 에서 빠진다.
 */
export function measureLayout(
  layout: Layout,
  ends: Record<string, [string, string]>,
  minGap = 16,
  groupLabels?: Record<string, string>,
): LayoutMetrics {
  const E = layout.edges.map((e) => ({ id: e.id, pts: e.points, segs: segsOf(e.points) }));
  let crossings = 0;
  let sharedPx = 0;
  let parallelPx = 0;
  for (let i = 0; i < E.length; i++) {
    for (let j = i + 1; j < E.length; j++) {
      for (const u of E[i].segs) {
        for (const v of E[j].segs) {
          const [h, w] = isH(u) && isV(v) ? [u, v] : isV(u) && isH(v) ? [v, u] : [null, null];
          if (h && w) {
            const x = w.a.x;
            const y = h.a.y;
            if (x > lo(h, "x") + 1 && x < hi(h, "x") - 1 && y > lo(w, "y") + 1 && y < hi(w, "y") - 1) crossings++;
            continue;
          }
          const [ax, al] = isV(u) && isV(v) ? (["x", "y"] as const) : isH(u) && isH(v) ? (["y", "x"] as const) : [null, null];
          if (!ax || !al) continue;
          const gap = Math.abs(u.a[ax] - v.a[ax]);
          if (gap >= minGap) continue;
          if (gap <= 0.5) {
            const ov = Math.min(hi(u, al), hi(v, al)) - Math.max(lo(u, al), lo(v, al));
            if (ov > 1) sharedPx += ov;
            continue;
          }
          const ru = trimmedRange(u, al);
          const rv = trimmedRange(v, al);
          if (!ru || !rv) continue;
          const ov = Math.min(ru[1], rv[1]) - Math.max(ru[0], rv[0]);
          if (ov > 1) parallelPx += ov;
        }
      }
    }
  }

  // 노드와, 안에 아무것도 없는(접힌·빈) 영역은 상자 하나로 그려진다.
  const hasChild = new Set<string>();
  for (const x of [...Object.values(layout.nodes), ...Object.values(layout.groups)]) if (x.parent !== null) hasChild.add(x.parent);
  const boxes = new Map<string, Rect>(Object.entries(layout.nodes));
  for (const g of Object.values(layout.groups)) if (!hasChild.has(g.id)) boxes.set(g.id, g);

  let throughNode = 0;
  let bends = 0;
  for (const e of E) {
    const [f, t] = ends[e.id] ?? [];
    bends += Math.max(0, e.pts.length - 2);
    const hit = new Set<string>();
    for (const s of e.segs) for (const [id, r] of boxes) if (id !== f && id !== t && rectHit(s, r)) hit.add(id);
    throughNode += hit.size;
  }

  // 안에 무언가 있는(펼친) 영역의 이름 알약만 본다. 접힌 영역은 위 상자로 이미 센다.
  const pills: [string, Rect][] = [];
  for (const g of Object.values(layout.groups)) {
    const label = groupLabels?.[g.id];
    if (hasChild.has(g.id) && label !== undefined) pills.push([g.id, zoneHeadPill(g, label)]);
  }
  let zoneHeadCrossings = 0;
  for (const e of E) {
    const [f, t] = ends[e.id] ?? [];
    for (const [id, r] of pills) if (id !== f && id !== t && e.segs.some((s) => rectHit(s, r, 0))) zoneHeadCrossings++;
  }

  return { crossings, sharedPx: Math.round(sharedPx), parallelPx: Math.round(parallelPx), throughNode, bends, aspect: layout.width / layout.height, zoneHeadCrossings };
}

export interface MeasuredView {
  layout: Layout;
  ends: Record<string, [string, string]>; // 표시 연결의 [from, to]
  groupLabels: Record<string, string>; // 표시 영역 id → 이름
}

/** 표시 그래프를 배치하고, 잴 때 필요한 연결 끝과 영역 이름을 함께 돌려준다. */
export async function viewLayout(g: DisplayGraph): Promise<MeasuredView> {
  const layout = await layoutDiagram(g, {});
  return {
    layout,
    ends: Object.fromEntries(g.edges.map((e) => [e.id, [e.from, e.to] as [string, string]])),
    groupLabels: Object.fromEntries(Object.values(g.groups).map((x) => [x.id, x.label])),
  };
}

/** 기본 화면(노드 40개를 넘으면 접힌 화면)의 배치. */
export function defaultViewLayout(state: DiagramState): Promise<MeasuredView> {
  return viewLayout(buildDisplayGraph(state, defaultDisplayOptions(state)));
}
