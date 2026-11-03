import type { DisplayGraph } from "./display";
import type { Layout, Rect } from "./layout";

/**
 * 캔버스 키보드 이동(roving tabindex): 캔버스는 Tab 한 칸이고, 안에서는 화살표로 노드·영역 사이를 옮겨 다닌다.
 * 영역은 머리 줄(이름·접기 단추)을 자리로 친다: 영역 전체의 가운데는 안쪽 노드와 겹쳐 방향을 흐린다.
 */
export interface NavItem { id: string; rect: Rect; zone: boolean }

/** 영역 머리 줄 높이(canvas.css .group__head). */
export const ZONE_HEAD_PX = 30;
/** 위쪽 끝이 이만큼 안에서 어긋난 것들은 같은 줄로 읽는다. */
export const ROW_TOLERANCE = 12;
/** 화살표 방향 부채꼴의 여유(flow px): 옆으로 이만큼은 진행 거리와 상관없이 받아 준다. */
export const CONE_SLACK = 40;
export const NAV_KEYS = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End"]);

/** 화면에 그려진 영역과 노드(접힌 영역 안은 빠진다). */
export function navItems(layout: Layout, display: DisplayGraph): NavItem[] {
  const out: NavItem[] = [];
  for (const g of Object.values(layout.groups)) {
    if (!display.groups[g.id]) continue;
    out.push({ id: g.id, zone: true, rect: { x: g.x, y: g.y, width: g.width, height: Math.min(g.height, ZONE_HEAD_PX) } });
  }
  for (const n of Object.values(layout.nodes)) {
    if (!display.nodes[n.id]) continue;
    out.push({ id: n.id, zone: false, rect: { x: n.x, y: n.y, width: n.width, height: n.height } });
  }
  return out;
}

/** 읽는 순서: 위에서 아래로 줄을 나누고(ROW_TOLERANCE), 줄 안에서는 왼쪽에서 오른쪽. 영역은 안쪽 것보다 먼저 온다. */
export function readingOrder(items: NavItem[]): string[] {
  const sorted = [...items].sort((a, b) => a.rect.y - b.rect.y || a.rect.x - b.rect.x || Number(b.zone) - Number(a.zone));
  const out: string[] = [];
  let row: NavItem[] = [];
  const flush = () => {
    row.sort((a, b) => a.rect.x - b.rect.x || Number(b.zone) - Number(a.zone));
    for (const it of row) out.push(it.id);
    row = [];
  };
  for (const it of sorted) {
    if (row.length > 0 && it.rect.y - row[0].rect.y > ROW_TOLERANCE) flush();
    row.push(it);
  }
  flush();
  return out;
}

/**
 * Tab 으로 캔버스에 들어올 때 받을 곳(tabindex 0 하나): 선택한 것, 아니면 마지막으로 포커스가 있던 것,
 * 아니면 읽는 순서로 첫 노드(노드가 없으면 첫 영역).
 */
export function tabStop(items: NavItem[], order: string[], selected: string | null, last: string | null): string | null {
  const has = new Set(order);
  if (selected !== null && has.has(selected)) return selected;
  if (last !== null && has.has(last)) return last;
  const zones = new Set(items.filter((i) => i.zone).map((i) => i.id));
  return order.find((id) => !zones.has(id)) ?? order[0] ?? null;
}

const gap = (a1: number, a2: number, b1: number, b2: number) => Math.max(0, Math.max(a1, b1) - Math.min(a2, b2));

/**
 * `from` 에서 `key` 로 갈 곳. Home·End 는 읽는 순서의 처음·끝. 화살표는 그 방향에 있는 것(가까운 변이 출발점 가운데를
 * 넘어선 것: 출발점을 품은 넓은 영역 머리는 옆으로 가지 않는다)이면서 옆으로 어긋난 틈이 진행 틈 + CONE_SLACK 을
 * 넘지 않는 것 중, 진행 방향 틈 + 옆으로 어긋난 틈(겹치면 0)의 2배가 가장 작은 것. 그 방향에 없으면 null(제자리).
 */
export function step(items: NavItem[], order: string[], from: string, key: string): string | null {
  if (key === "Home") return order[0] ?? null;
  if (key === "End") return order[order.length - 1] ?? null;
  const src = items.find((i) => i.id === from);
  if (!src) return order[0] ?? null;
  const s = src.rect;
  const scx = s.x + s.width / 2;
  const scy = s.y + s.height / 2;
  let best: string | null = null;
  let bestCost = Infinity;
  for (const it of items) {
    if (it.id === from) continue;
    const r = it.rect;
    let ahead: number;
    let side: number;
    if (key === "ArrowRight" || key === "ArrowLeft") {
      if (key === "ArrowRight" ? r.x < scx : r.x + r.width > scx) continue;
      ahead = key === "ArrowRight" ? r.x - (s.x + s.width) : s.x - (r.x + r.width);
      side = gap(s.y, s.y + s.height, r.y, r.y + r.height);
    } else if (key === "ArrowDown" || key === "ArrowUp") {
      if (key === "ArrowDown" ? r.y < scy : r.y + r.height > scy) continue;
      ahead = key === "ArrowDown" ? r.y - (s.y + s.height) : s.y - (r.y + r.height);
      side = gap(s.x, s.x + s.width, r.x, r.x + r.width);
    } else return null;
    // 그 방향 부채꼴(45° + 여유) 밖은 넘긴다: 왼쪽으로 갔는데 한참 아래 노드로 뛰지 않게.
    if (side > Math.max(0, ahead) + CONE_SLACK) continue;
    const cost = Math.max(0, ahead) + 2 * side;
    if (cost < bestCost) {
      bestCost = cost;
      best = it.id;
    }
  }
  return best;
}
