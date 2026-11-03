import type { Layout } from "./layout";

/**
 * 캔버스 층 순서(React Flow 노드 래퍼의 z-index).
 * 영역은 바깥 0 에서 안쪽으로 한 겹마다 1씩 올린다: 바깥 영역이 DOM 에서 나중에 와도 안쪽 영역의 머리(접기 단추)를 가리지 않는다.
 * 연결선 층(canvas.css 의 .react-flow__viewport-portal)은 모든 영역 위, 노드는 그 위다.
 */
export const ZONE_Z_MAX = 8;
export const EDGE_Z = 9;
export const NODE_Z = 10;

/** 영역 `id` 의 z-index: 바깥 영역 수(깊이). ZONE_Z_MAX 에서 멈춘다(연결선·노드보다 위로 가지 않게). */
export function zoneZ(groups: Layout["groups"], id: string): number {
  let depth = 0;
  let p = groups[id]?.parent ?? null;
  // 부모 고리가 잘못 이어져 있어도 끝나도록 영역 수만큼만 오른다.
  for (let guard = Object.keys(groups).length; p !== null && guard > 0; guard--) {
    depth++;
    p = groups[p]?.parent ?? null;
  }
  return Math.min(depth, ZONE_Z_MAX);
}
