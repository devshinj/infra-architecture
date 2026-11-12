import type { Rect } from "./layout";
import type { Insets } from "./useCamera";

/** 화면 밖에 있을 수 있는 묶음(오른쪽 외부 서비스 열의 영역 등). */
export interface OffscreenTarget {
  id: string;
  label: string;
  /** 안에 든 노드 수(접혀 있으면 숨은 노드 수). */
  count: number;
  rect: Rect;
}

export interface OffscreenHint {
  side: "left" | "right";
  text: string;
  /** 표시 가운데의 화면 y(px). 보이는 띠 안으로 맞춘다. */
  y: number;
  /** 누르면 맞출 곳(흐름 좌표). */
  rect: Rect;
  ids: string[];
}

/** 띠 가장자리에서 이만큼(px) 안쪽까지 들어와야 "보인다"고 친다. 조금만 비치는 묶음도 표시를 남긴다. */
export const PEEK_PX = 24;
/** 표시 가운데가 띠 위·아래 끝에서 떨어질 최소 거리(px). */
const EDGE_PAD = 28;

const unite = (rs: Rect[]): Rect => {
  const x1 = Math.min(...rs.map((r) => r.x));
  const y1 = Math.min(...rs.map((r) => r.y));
  const x2 = Math.max(...rs.map((r) => r.x + r.width));
  const y2 = Math.max(...rs.map((r) => r.y + r.height));
  return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
};

/**
 * 보이는 띠(양옆 판 사이) 밖으로 나간 묶음을 쪽마다 하나의 표시로 모은다.
 * 묶음이 띠 안으로 PEEK_PX 넘게 들어와 있으면 보이는 것으로 친다. 표시 글은 묶음이 하나면 「{이름} {노드 수}」,
 * 여럿이면 「외부 서비스 {노드 수}」. 높이는 묶음들 가운데를 띠 안으로 맞춘 값이다.
 */
export function offscreenHints(
  targets: OffscreenTarget[],
  transform: { x: number; y: number; zoom: number },
  size: { width: number; height: number },
  insets: Insets,
): OffscreenHint[] {
  if (size.width <= 0 || size.height <= 0) return [];
  const left = insets.left;
  const right = size.width - insets.right;
  const top = insets.top ?? 0;
  const bottom = size.height - (insets.bottom ?? 0);
  if (right - left < 2 * PEEK_PX) return [];
  const sides: Record<"left" | "right", OffscreenTarget[]> = { left: [], right: [] };
  for (const t of targets) {
    const sx1 = t.rect.x * transform.zoom + transform.x;
    const sx2 = (t.rect.x + t.rect.width) * transform.zoom + transform.x;
    if (sx1 > right - PEEK_PX) sides.right.push(t);
    else if (sx2 < left + PEEK_PX) sides.left.push(t);
  }
  const out: OffscreenHint[] = [];
  for (const side of ["left", "right"] as const) {
    const ts = sides[side];
    if (ts.length === 0) continue;
    const rect = unite(ts.map((t) => t.rect));
    const count = ts.reduce((n, t) => n + t.count, 0);
    const name = ts.length === 1 ? ts[0]!.label : "외부 서비스";
    const cy = (rect.y + rect.height / 2) * transform.zoom + transform.y;
    const y = Math.min(Math.max(cy, top + EDGE_PAD), Math.max(top + EDGE_PAD, bottom - EDGE_PAD));
    out.push({ side, text: `${name} ${count}`, y, rect, ids: ts.map((t) => t.id) });
  }
  return out;
}
