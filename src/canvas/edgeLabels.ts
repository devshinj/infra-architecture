import type { Rect } from "./layout";

type Pt = { x: number; y: number };

/** 같은 이름 선들이 함께 지나는 앞부분이 이 길이(px) 이상이어야 그 위에 이름을 둔다. */
export const MIN_TRUNK = 12;
/** 함께 지나는 앞부분이 없을 때 노드 상자 변에서 이름까지 띄우는 거리(px). */
export const LABEL_OFFSET = 14;
/** 같은 점으로 보는 거리(px). */
const SAME = 0.5;

export interface PlacedLabel { text: string; x: number; y: number; edgeIds: string[] }

export interface IncidentEdge { id: string; label?: string; points: Pt[]; labelAt?: Pt; from: string; to: string }

interface Run { x: number; y: number; dx: number; dy: number; len: number }

const same = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y) <= SAME;

/** 꺾은선을 길이 0 인 칸을 빼고, 같은 방향으로 이어지는 칸은 하나로 합친 토막들로 바꾼다. */
function runs(pts: Pt[]): Run[] {
  const out: Run[] = [];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if (len <= 1e-9) continue;
    const dx = (b.x - a.x) / len;
    const dy = (b.y - a.y) / len;
    const last = out[out.length - 1];
    if (last && Math.abs(last.dx - dx) < 1e-6 && Math.abs(last.dy - dy) < 1e-6) last.len += len;
    else out.push({ x: a.x, y: a.y, dx, dy, len });
  }
  return out;
}

/** 같은 점에서 시작하는 두 꺾은선이 함께 지나는 앞부분 길이. */
function commonPrefix(a: Run[], b: Run[]): number {
  let total = 0;
  for (let i = 0; i < a.length && i < b.length; i++) {
    if (Math.abs(a[i].dx - b[i].dx) > 1e-6 || Math.abs(a[i].dy - b[i].dy) > 1e-6) break;
    total += Math.min(a[i].len, b[i].len);
    // 길이가 다르면 짧은 쪽이 여기서 꺾으므로 함께 가는 길은 여기서 끝난다.
    if (Math.abs(a[i].len - b[i].len) > SAME) break;
  }
  return total;
}

/** 토막들을 따라 시작점에서 s 만큼 간 점. */
function pointAt(rs: Run[], s: number): Pt {
  let left = s;
  for (const r of rs) {
    if (left <= r.len) return { x: r.x + r.dx * left, y: r.y + r.dy * left };
    left -= r.len;
  }
  const r = rs[rs.length - 1];
  return { x: r.x + r.dx * r.len, y: r.y + r.dy * r.len };
}

const round = (n: number) => Math.round(n * 100) / 100;

/** 고른 노드 쪽 끝에서 시작하도록 맞춘 points. 방향은 from/to 로, 둘 다 아니면 상자에 가까운 끝으로 고른다. */
function fromSelected(selectedId: string, rect: Rect, e: IncidentEdge): Pt[] {
  if (e.from === selectedId) return e.points;
  if (e.to === selectedId) return [...e.points].reverse();
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  const first = e.points[0];
  const last = e.points[e.points.length - 1];
  return Math.hypot(first.x - cx, first.y - cy) <= Math.hypot(last.x - cx, last.y - cy) ? e.points : [...e.points].reverse();
}

type Side = "top" | "right" | "bottom" | "left";
const SIDES: Side[] = ["top", "right", "bottom", "left"];

/** 점이 가장 가까이 놓인 상자 변. */
function sideOf(p: Pt, r: Rect): Side {
  const d: Record<Side, number> = {
    top: Math.abs(p.y - r.y),
    right: Math.abs(p.x - (r.x + r.width)),
    bottom: Math.abs(p.y - (r.y + r.height)),
    left: Math.abs(p.x - r.x),
  };
  return SIDES.reduce((best, s) => (d[s] < d[best] ? s : best), SIDES[0]);
}

function besideNode(rect: Rect, starts: Pt[]): Pt {
  const count = new Map<Side, Pt[]>();
  for (const p of starts) {
    const s = sideOf(p, rect);
    count.set(s, [...(count.get(s) ?? []), p]);
  }
  // 가장 많은 변. 같으면 위·오른쪽·아래·왼쪽 순서로 앞의 것.
  const side = SIDES.reduce((best, s) => ((count.get(s)?.length ?? 0) > (count.get(best)?.length ?? 0) ? s : best), SIDES[0]);
  const on = count.get(side)!;
  const mx = round(on.reduce((a, p) => a + p.x, 0) / on.length);
  const my = round(on.reduce((a, p) => a + p.y, 0) / on.length);
  switch (side) {
    case "top":
      return { x: mx, y: rect.y - LABEL_OFFSET };
    case "right":
      return { x: rect.x + rect.width + LABEL_OFFSET, y: my };
    case "bottom":
      return { x: mx, y: rect.y + rect.height + LABEL_OFFSET };
    case "left":
      return { x: rect.x - LABEL_OFFSET, y: my };
  }
}

/** 고른 노드에 이어진 연결의 이름 배치. 같은 이름(글자 그대로)은 하나로 합치고 2개 이상이면 "<이름> ×N". */
export function mergedLabels(selectedId: string, selectedRect: Rect, incident: IncidentEdge[]): PlacedLabel[] {
  const groups = new Map<string, IncidentEdge[]>();
  for (const e of incident) {
    if (!e.label || e.points.length < 2) continue;
    groups.set(e.label, [...(groups.get(e.label) ?? []), e]);
  }
  const out: PlacedLabel[] = [];
  for (const [text, es] of groups) {
    if (es.length === 1) {
      const at = es[0].labelAt;
      if (at) out.push({ text, x: at.x, y: at.y, edgeIds: [es[0].id] });
      continue;
    }
    const lines = es.map((e) => fromSelected(selectedId, selectedRect, e));
    const starts = lines.map((l) => l[0]);
    const rs = lines.map(runs);
    let trunk = 0;
    if (starts.every((p) => same(p, starts[0])) && rs.every((r) => r.length > 0)) {
      trunk = Math.min(...rs.slice(1).map((r) => commonPrefix(rs[0], r)));
    }
    const at = trunk >= MIN_TRUNK ? pointAt(rs[0], trunk / 2) : besideNode(selectedRect, starts);
    out.push({ text: `${text} ×${es.length}`, x: round(at.x), y: round(at.y), edgeIds: es.map((e) => e.id) });
  }
  return out;
}
