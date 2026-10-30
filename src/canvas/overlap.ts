import { GROUP_PAD, type Layout, type Rect } from "./layout";

/** 나란히 놓인 경고 배지 중심이 노드 오른쪽 위 모서리에서 왼쪽으로 떨어진 거리(canvas.css .node__badge--pair). */
export const PAIR_BADGE_OFFSET = 18;

const grow = (r: Rect, d: number): Rect => ({ x: r.x - d, y: r.y - d, width: r.width + 2 * d, height: r.height + 2 * d });

// Strict intersection: rects that only touch along an edge do not collide.
const intersects = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

const strictlyInside = (inner: Rect, outer: Rect): boolean =>
  inner.x > outer.x && inner.y > outer.y && inner.x + inner.width < outer.x + outer.width && inner.y + inner.height < outer.y + outer.height;

function circleHitsRect(cx: number, cy: number, r: number, b: Rect): boolean {
  if (r <= 0) return false;
  const nx = Math.max(b.x, Math.min(cx, b.x + b.width));
  const ny = Math.max(b.y, Math.min(cy, b.y + b.height));
  return (cx - nx) ** 2 + (cy - ny) ** 2 < r * r;
}

export function findOverlaps(l: Layout, opts: { ring: number; badge: number } = { ring: 4, badge: 8 }): string[] {
  const out: string[] = [];
  const nodes = Object.values(l.nodes);
  const groups = Object.values(l.groups);

  const ancestors = (parent: string | null): Set<string> => {
    const s = new Set<string>();
    let p = parent;
    while (p !== null && !s.has(p) && l.groups[p]) {
      s.add(p);
      p = l.groups[p].parent;
    }
    return s;
  };

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (intersects(grow(nodes[i], opts.ring), grow(nodes[j], opts.ring))) out.push(`${nodes[i].id}×${nodes[j].id}`);
    }
  }

  for (const n of nodes) {
    const anc = ancestors(n.parent);
    const ringed = grow(n, opts.ring);
    for (const g of groups) {
      if (anc.has(g.id)) {
        const band: Rect = { x: g.x, y: g.y, width: g.width, height: GROUP_PAD.top };
        if (intersects(n, band)) out.push(`${n.id}×${g.id}`);
      } else if (intersects(ringed, g) && !strictlyInside(ringed, g)) {
        out.push(`${n.id}×${g.id}`);
      }
    }
  }

  // 모서리 배지(빠진 정보·경고 단독)와 그 왼쪽에 나란히 놓이는 경고 배지(PAIR_BADGE_OFFSET) 두 원을 본다.
  for (const n of nodes) {
    const cy = n.y;
    for (const cx of [n.x + n.width, n.x + n.width - PAIR_BADGE_OFFSET]) {
      for (const m of nodes) {
        if (m.id !== n.id && circleHitsRect(cx, cy, opts.badge, m)) out.push(`${n.id}×${m.id}`);
      }
    }
  }

  return out;
}
