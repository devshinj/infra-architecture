// 배치·측정·이름 자리가 함께 쓰는 작은 기하 함수. layout·layoutMetrics·restingLabels 를 불러오지 않는다(불러오기 고리 끊기).
import { textWidth } from "./text";

type Pt = { x: number; y: number };
interface Rect { x: number; y: number; width: number; height: number }

/** 영역 이름 글자 크기(배율 1 의 캔버스 px). canvas.css 의 .group__name 바닥값과 같다. */
export const NAME_PX = 11;
const HEAD_H = 30; // .group__head 높이
const HEAD_PAD = 10; // .group__head 왼쪽 안쪽 여백
const PILL_PAD = 18; // .group__name 좌우 안쪽 여백 합

/** 펼친 영역 머리 칸에서 이름 알약이 차지하는 자리(어림값). */
export function zoneHeadPill(g: Rect, label: string): Rect {
  return { x: g.x + HEAD_PAD, y: g.y, width: PILL_PAD + textWidth(label, NAME_PX), height: HEAD_H };
}

// 끝점이 아닌 상자 안쪽(가장자리 2px 안쪽)을 지나는지
export function rectHit(s: { a: Pt; b: Pt }, r: Rect, pad = 2): boolean {
  return (
    Math.max(s.a.x, s.b.x) > r.x + pad &&
    Math.min(s.a.x, s.b.x) < r.x + r.width - pad &&
    Math.max(s.a.y, s.b.y) > r.y + pad &&
    Math.min(s.a.y, s.b.y) < r.y + r.height - pad
  );
}

/** 선의 첫 점과 마지막 점에서 이만큼은 노드 옆이라 나란해도 세지 않는다. */
export const END_TRIM = 8;

type Seg = { a: Pt; b: Pt };

/** 꺾은선의 한 토막. from·to 는 평행 길이로 셀 수 있는 구간(토막 시작점으로부터 거리, 선 양 끝 END_TRIM 제외), k 는 토막 번호(점 k → k+1). */
export interface PathSeg extends Seg {
  from: number;
  to: number;
  k: number;
}

const len = (a: Pt, b: Pt): number => Math.hypot(a.x - b.x, a.y - b.y);

/** 길이가 0 인 토막은 뺀다. */
export function pathSegments(pts: Pt[]): PathSeg[] {
  const total = pts.slice(1).reduce((t, b, i) => t + len(pts[i]!, b), 0);
  const out: PathSeg[] = [];
  let at = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]!;
    const b = pts[i]!;
    const l = len(a, b);
    if (l > 0.01) out.push({ a, b, from: Math.max(0, END_TRIM - at), to: Math.min(l, total - END_TRIM - at), k: i - 1 });
    at += l;
  }
  return out;
}

/** 토막에서 평행 길이로 셀 수 있는 구간을 축(k) 좌표 [작은 값, 큰 값] 으로 돌려준다. 없으면 null. */
export function trimmedRange(s: PathSeg, k: "x" | "y"): [number, number] | null {
  if (s.to <= s.from) return null;
  const l = len(s.a, s.b);
  const p = (d: number): number => s.a[k] + ((s.b[k] - s.a[k]) * d) / l;
  const [x, y] = [p(s.from), p(s.to)];
  return [Math.min(x, y), Math.max(x, y)];
}

export const isVertical = (s: Seg): boolean => Math.abs(s.a.x - s.b.x) < 0.5;
export const isHorizontal = (s: Seg): boolean => Math.abs(s.a.y - s.b.y) < 0.5;
const inside = (v: number, a: number, b: number): boolean => v > Math.min(a, b) + 1 && v < Math.max(a, b) - 1;

/** 가로 토막과 세로 토막이 서로의 안쪽(양 끝 1px 제외)에서 만나는지. 나란한 두 토막은 만나지 않는다고 본다. */
export function segmentsCross(u: Seg, v: Seg): boolean {
  const [h, w] = isHorizontal(u) && isVertical(v) ? [u, v] : isVertical(u) && isHorizontal(v) ? [v, u] : [null, null];
  return !!h && !!w && inside(w.a.x, h.a.x, h.b.x) && inside(h.a.y, w.a.y, w.b.y);
}

/** 서로 다른 두 선(꺾은선)의 토막이 만나는 점 수. 배치(layout)·측정(layoutMetrics)·띄우기(separate)가 같은 셈을 쓴다. */
export function countCrossings(lines: Pt[][]): number {
  const segs = lines.map((pts) => pts.slice(1).map((b, i) => ({ a: pts[i]!, b })));
  let n = 0;
  for (let i = 0; i < segs.length; i++) {
    for (let j = i + 1; j < segs.length; j++) {
      for (const u of segs[i]!) for (const v of segs[j]!) if (segmentsCross(u, v)) n++;
    }
  }
  return n;
}
