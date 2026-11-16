import { alongCandidates, clusterByEnd, labelBox, NODE_RING, tooClose, type Box } from "./edgeLabels";
import type { Layout, Rect } from "./layout";
import { rectHit, zoneHeadPill } from "./geometry";

type Pt = { x: number; y: number };

/** 자기 줄기 식구로 보는 겹침 거리(px): 이 안으로 나란히 겹치는 토막을 가진 선. */
const FAMILY = 0.5;

export interface RestingLabelInput { id: string; label: string; from: string; to: string; points: Pt[]; egress?: boolean }
export interface RestingLabelGroup { text: string; edgeIds: string[] }
export interface PlacedRestingLabel { edgeIds: string[]; text: string; x: number; y: number }
export interface RestingPlacement { placed: PlacedRestingLabel[]; blocked: string[] }

type Layouts = Pick<Layout, "nodes" | "groups" | "edges">;

const toBox = (r: Rect): Box => ({ x1: r.x, y1: r.y, x2: r.x + r.width, y2: r.y + r.height });
const ring = (r: Rect): Box => ({ x1: r.x - NODE_RING, y1: r.y - NODE_RING, x2: r.x + r.width + NODE_RING, y2: r.y + r.height + NODE_RING });
const asRect = (b: Box): Rect => ({ x: b.x1, y: b.y1, width: b.x2 - b.x1, height: b.y2 - b.y1 });

/** 평소 화면에 보이는 이름 묶음. 출구선은 뺀다. 같은 이름·같은 끝 선은 "<이름> ×N" 하나. */
function groupsOf(items: RestingLabelInput[]): { members: RestingLabelInput[]; sharedEnd: Map<string, string>; text: string }[] {
  const shown = items.filter((i) => i.label && !i.egress && i.points.length >= 2);
  return clusterByEnd(shown).map((c) => {
    const members = [...c.members].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    return { members, sharedEnd: c.sharedEnd, text: members.length > 1 ? `${members[0].label} ×${members.length}` : members[0].label };
  });
}

export function restingLabelGroups(items: RestingLabelInput[]): RestingLabelGroup[] {
  return groupsOf(items).map((g) => ({ text: g.text, edgeIds: g.members.map((m) => m.id) }));
}

interface Seg { a: Pt; b: Pt }
const segsOf = (pts: Pt[]): Seg[] => pts.slice(1).map((b, i) => ({ a: pts[i], b }));

/** 두 토막이 FAMILY 안으로 나란히 겹치는지(겹친 길이가 FAMILY 를 넘는지). */
function overlaps(s: Seg, t: Seg): boolean {
  const dx = s.b.x - s.a.x;
  const dy = s.b.y - s.a.y;
  const l = Math.hypot(dx, dy);
  if (l < 1e-9) return false;
  const ux = dx / l;
  const uy = dy / l;
  const off = (p: Pt) => Math.abs((p.x - s.a.x) * uy - (p.y - s.a.y) * ux);
  if (off(t.a) > FAMILY || off(t.b) > FAMILY) return false;
  const pa = (t.a.x - s.a.x) * ux + (t.a.y - s.a.y) * uy;
  const pb = (t.b.x - s.a.x) * ux + (t.b.y - s.a.y) * uy;
  return Math.min(l, Math.max(pa, pb)) - Math.max(0, Math.min(pa, pb)) > FAMILY;
}

interface Obstacles { rings: Box[]; pills: Box[]; edges: { id: string; segs: Seg[] }[] }

function obstaclesOf(layout: Layouts, groupLabels: Record<string, string>): Obstacles {
  // 안에 아무것도 없는(접힌·빈) 영역은 노드 상자처럼 하나로 그려진다. 펼친 영역은 이름 알약만 막는다.
  const hasChild = new Set<string>();
  for (const x of [...Object.values(layout.nodes), ...Object.values(layout.groups)]) if (x.parent !== null) hasChild.add(x.parent);
  const rings = [...Object.values(layout.nodes).map(ring), ...Object.values(layout.groups).filter((g) => !hasChild.has(g.id)).map(ring)];
  const pills: Box[] = [];
  for (const g of Object.values(layout.groups)) {
    const label = groupLabels[g.id];
    if (hasChild.has(g.id) && label !== undefined) pills.push(toBox(zoneHeadPill(g, label)));
  }
  return { rings, pills, edges: layout.edges.map((e) => ({ id: e.id, segs: segsOf(e.points) })) };
}

/** 이름 상자가 노드 고리·알약·남의 이름·자기 줄기 식구가 아닌 선과 겹치지 않는지. */
function fits(box: Box, own: Pt[], o: Obstacles, taken: Box[]): boolean {
  if (o.rings.some((r) => tooClose(box, r)) || o.pills.some((p) => tooClose(box, p)) || taken.some((t) => tooClose(box, t))) return false;
  const mine = segsOf(own);
  const rect = asRect(box);
  return !o.edges.some((e) => {
    if (!e.segs.some((s) => rectHit(s, rect, 0))) return false;
    return !e.segs.some((t) => mine.some((s) => overlaps(s, t)));
  });
}

function mid(pts: Pt[]): Pt {
  let left = pts.slice(1).reduce((t, b, i) => t + Math.hypot(b.x - pts[i].x, b.y - pts[i].y), 0) / 2;
  for (let i = 1; i < pts.length; i++) {
    const l = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    if (l > 0 && left <= l) return { x: pts[i - 1].x + ((pts[i].x - pts[i - 1].x) * left) / l, y: pts[i - 1].y + ((pts[i].y - pts[i - 1].y) * left) / l };
    left -= l;
  }
  return pts[pts.length - 1];
}

function centerOf(layout: Layouts, id: string): Pt | undefined {
  const r: Rect | undefined = layout.nodes[id] ?? layout.groups[id];
  return r ? { x: r.x + r.width / 2, y: r.y + r.height / 2 } : undefined;
}

/**
 * 평소 화면 이름 자리. 묶음마다 함께 쓰는 끝 노드 가운데에 가장 가까운 선을 대표로 삼아, preferred → 제 선을 따라
 * 가까운 순서로 후보를 보고 노드 고리·알약·앞서 놓은 이름·자기 줄기 식구 아닌 선과 겹치지 않는 첫 자리에 둔다.
 * 자리가 없으면 첫 후보에 두고 blocked 에 그 선 id 를 넣는다. 이름은 결과에서 빠지지 않는다.
 */
export function placeRestingLabels(layout: Layouts, items: RestingLabelInput[], groupLabels: Record<string, string>, preferred?: ReadonlyMap<string, Pt>): RestingPlacement {
  const o = obstaclesOf(layout, groupLabels);
  const plans = groupsOf(items).map((g) => {
    const dist = (i: RestingLabelInput) => {
      const c = centerOf(layout, g.sharedEnd.get(i.id) ?? i.from);
      const m = mid(i.points);
      return c ? Math.hypot(m.x - c.x, m.y - c.y) : 0;
    };
    const rep = g.members.reduce((a, b) => (dist(b) < dist(a) ? b : a));
    return { rep, text: g.text, edgeIds: [rep.id, ...g.members.map((m) => m.id).filter((id) => id !== rep.id)] };
  });
  plans.sort((a, b) => (a.text < b.text ? -1 : a.text > b.text ? 1 : 0) || (a.rep.id < b.rep.id ? -1 : 1));

  const taken: Box[] = [];
  const placed: PlacedRestingLabel[] = [];
  const blocked: string[] = [];
  for (const p of plans) {
    const pref = preferred?.get(p.rep.id);
    const cands = [...(pref ? [pref] : []), ...alongCandidates(p.rep.points)];
    const boxAt = (c: Pt) => labelBox({ text: p.text, x: c.x, y: c.y, anchor: "middle" });
    const at = cands.find((c) => fits(boxAt(c), p.rep.points, o, taken));
    if (!at) blocked.push(p.rep.id);
    const c = at ?? cands[0];
    taken.push(boxAt(c));
    placed.push({ edgeIds: p.edgeIds, text: p.text, x: c.x, y: c.y });
  }
  return { placed, blocked };
}

/** 놓인 이름 가운데 「지킬 것」을 어긴 것의 edgeIds[0]. 측정용. */
export function labelViolates(layout: Layouts, groupLabels: Record<string, string>, placed: PlacedRestingLabel[]): string[] {
  const o = obstaclesOf(layout, groupLabels);
  const byId = new Map(layout.edges.map((e) => [e.id, e.points]));
  const boxes = placed.map((p) => labelBox({ text: p.text, x: p.x, y: p.y, anchor: "middle" }));
  const bad: string[] = [];
  placed.forEach((p, i) => {
    const own = byId.get(p.edgeIds[0]);
    if (!own) return;
    if (!fits(boxes[i], own, o, boxes.filter((_, j) => j !== i))) bad.push(p.edgeIds[0]);
  });
  return bad;
}
