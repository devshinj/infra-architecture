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
