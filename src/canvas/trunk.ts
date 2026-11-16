import { LABEL_OFFSET } from "@/canvas/edgeLabels";

type Pt = { x: number; y: number };

export interface TrunkClick {
  segKey: string;
  edgeIds: string[]; // 누른 조각을 지나는 표시 연결
  at: Pt;
}
export interface TrunkSelection {
  segKey: string;
  edgeIds: string[];
  at: Pt;
}
export interface TrunkStep {
  trunk: TrunkSelection | null;
  select: string | null;
}

/** 줄기 조각을 눌렀을 때 다음 상태. 한 연결만 지나는 조각이면 그 연결을 고른다. */
export function nextTrunk(cur: TrunkSelection | null, click: TrunkClick): TrunkStep {
  if (click.edgeIds.length === 1) return { trunk: null, select: click.edgeIds[0] };
  if (cur && cur.segKey === click.segKey) return { trunk: cur, select: null };
  return { trunk: { segKey: click.segKey, edgeIds: [...click.edgeIds], at: click.at }, select: null };
}

/** 꺾은선 위 p 까지의 길이(가장 가까운 선분에 내린 발 기준)와 전체 길이. */
function arcAt(points: Pt[], p: Pt): { s: number; total: number } {
  let acc = 0;
  let best = Infinity;
  let bestS = 0;
  for (let i = 0; i + 1 < points.length; i++) {
    const a = points[i];
    const b = points[i + 1];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const t = len ? Math.max(0, Math.min(1, ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / (len * len))) : 0;
    const d = Math.hypot(a.x + t * (b.x - a.x) - p.x, a.y + t * (b.y - a.y) - p.y);
    if (d < best) {
      best = d;
      bestS = acc + t * len;
    }
    acc += len;
  }
  return { s: bestS, total: acc };
}

/** 누른 점이 출발 쪽 절반이면 도착(to), 도착 쪽 절반이면 출발(from), 정확히 가운데면 to. */
export function farEnd(points: Pt[], at: Pt, from: string, to: string): string {
  const { s, total } = arcAt(points, at);
  return s * 2 > total ? from : to;
}

export const TRUNK_COLOR_COUNT = 6;
export function trunkColor(i: number): number {
  return ((i % TRUNK_COLOR_COUNT) + TRUNK_COLOR_COUNT) % TRUNK_COLOR_COUNT;
}

function pointAlong(pts: Pt[], dist: number): Pt {
  let left = dist;
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if (left <= len && len > 0) return { x: a.x + ((b.x - a.x) * left) / len, y: a.y + ((b.y - a.y) * left) / len };
    left -= len;
  }
  return pts[pts.length - 1];
}

/**
 * 누른 점에서 먼 끝 쪽으로 가며 처음 만나는, `edgeId` 한 연결만 지나는 조각의 들어서는 끝에서
 * LABEL_OFFSET 만큼 들어간 점. 없으면 null.
 */
export function branchSpot(
  points: Pt[],
  at: Pt,
  segments: { edgeIds: string[]; pts: Pt[] }[],
  edgeId: string,
): Pt | null {
  const { s: clickS, total } = arcAt(points, at);
  const forward = clickS * 2 <= total; // 먼 끝이 도착 쪽이면 앞으로
  let best: { entry: number; pts: Pt[] } | null = null;
  for (const seg of segments) {
    if (seg.edgeIds.length !== 1 || seg.edgeIds[0] !== edgeId || seg.pts.length < 2) continue;
    const sa = arcAt(points, seg.pts[0]).s;
    const sb = arcAt(points, seg.pts[seg.pts.length - 1]).s;
    const lowFirst = sa <= sb;
    const lowS = Math.min(sa, sb);
    const highS = Math.max(sa, sb);
    // 먼 쪽에 있는 조각만(누른 점을 지난 것)
    if (forward ? highS < clickS : lowS > clickS) continue;
    // 가는 방향으로 들어서는 끝이 시작점이 되게 방향을 맞춘다
    const wantLowFirst = forward;
    const oriented = lowFirst === wantLowFirst ? seg.pts : [...seg.pts].reverse();
    const entry = forward ? Math.max(lowS, clickS) : Math.min(highS, clickS);
    const dist = Math.abs(entry - clickS);
    if (!best || dist < Math.abs(best.entry - clickS)) best = { entry, pts: oriented };
  }
  return best ? pointAlong(best.pts, LABEL_OFFSET) : null;
}
