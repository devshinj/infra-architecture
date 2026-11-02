import ELK from "elkjs/lib/elk.bundled.js";
import type { ElkExtendedEdge, ElkNode } from "elkjs/lib/elk-api";

import type { DNode } from "@/domain/types";

import type { DisplayGraph } from "./display";
import { elbowRoute } from "./elbow";
import { textWidth, truncate } from "./text";

export const NODE = { height: 52, minWidth: 132, maxWidth: 240, padLeft: 42 /* 테두리 양쪽 2+안쪽 왼쪽 10+아이콘 22+사이 8 (canvas.css .node) */, padRight: 18 /* 안쪽 오른쪽 여백(배지 자리) */, gap: 28, layerGap: 52 };
export const GROUP_PAD = { top: 30, side: 12, bottom: 12 }; // top 은 이름 머리 공간

export interface Rect { x: number; y: number; width: number; height: number }
export interface LaidOutNode extends Rect { id: string; parent: string | null; displayLabel: string; displaySub?: string }
export interface LaidOutGroup extends Rect { id: string; parent: string | null }
// degraded: no clear route was found, so the edge is a plain elbow that may cross other shapes.
export interface LaidOutEdge { id: string; points: { x: number; y: number }[]; labelAt?: { x: number; y: number }; degraded?: boolean }
export interface Layout { nodes: Record<string, LaidOutNode>; groups: Record<string, LaidOutGroup>; edges: LaidOutEdge[]; width: number; height: number }

type Pt = { x: number; y: number };

const EMPTY_GROUP = { width: 160, height: 56 };
export const LABEL_PX = 14;
export const SUB_PX = 11;
const ROOT = "__root";
const CHANNEL_MARGIN = 24; // main 오른쪽 끝 ↔ 첫 통로, 마지막 통로 ↔ 외부 열
const CHANNEL_STEP = 12; // 통로끼리 간격 (spacing.edgeEdge)
export const CONTENT_WIDTH = NODE.maxWidth - NODE.padLeft - NODE.padRight;

const elk = new ELK();

const BASE_OPTIONS: Record<string, string> = {
  "elk.algorithm": "layered",
  "elk.hierarchyHandling": "INCLUDE_CHILDREN",
  "elk.edgeRouting": "ORTHOGONAL",
  "elk.spacing.nodeNode": String(NODE.gap),
  "elk.layered.spacing.nodeNodeBetweenLayers": String(NODE.layerGap),
  "elk.spacing.edgeNode": "18",
  "elk.spacing.edgeEdge": "12",
  "elk.layered.mergeEdges": "true",
  "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
  // Keep edges that leave a group apart; merged they share one line and you cannot tell which goes where.
  "elk.layered.mergeHierarchyEdges": "false",
};
// 나란히 놓는 영역(이중화 묶음·쿠버네티스 클러스터)의 자식 노드는 이름의 숫자 순서(#1, #2, …)로 놓는다.
const ROW_GROUP_KINDS: ReadonlySet<string> = new Set(["redundancy_group", "k8s_cluster"]);

/**
 * 끝에 숫자가 붙은 이름("웹 서버 #3", "API 2", "웹 서버 1")을 접두어별로 묶어 숫자 순서로 놓은 id 목록을 돌려준다.
 * 접두어가 같은 것이 2개 이상일 때만 묶음이 된다. 숫자가 없거나 접두어가 다른 이름("Aurora Writer", "주 DB")은 묶음에 들지 않는다.
 */
export function numberedClasses(items: { id: string; label: string }[]): string[][] {
  const by = new Map<string, { id: string; n: number }[]>();
  for (const it of items) {
    const m = /^(.*?)[\s#]*(\d+)\s*$/.exec(it.label);
    if (!m) continue;
    const key = m[1]!.trim();
    by.set(key, [...(by.get(key) ?? []), { id: it.id, n: Number(m[2]) }]);
  }
  return [...by.values()]
    .filter((c) => c.length > 1)
    .map((c) => c.map((x, i) => [x, i] as const).sort((a, b) => a[0].n - b[0].n || a[1] - b[1]).map(([x]) => x.id));
}

/** items 중 숫자로 끝나는 같은 접두어 묶음끼리만 숫자 순서로 바꾼다. 나머지 자리는 그대로다. */
function sortNumbered<T extends { id: string }>(items: T[], labelOf: (id: string) => string): T[] {
  const out = [...items];
  const byId = new Map(items.map((it) => [it.id, it]));
  for (const cls of numberedClasses(items.map((i) => ({ id: i.id, label: labelOf(i.id) })))) {
    const slots = items.map((it, i) => [it.id, i] as const).filter(([id]) => cls.includes(id)).map(([, i]) => i);
    cls.forEach((id, k) => (out[slots[k]!] = byId.get(id)!));
  }
  return out;
}

/** 서로 다른 두 연결의 토막이 같은 선 위에서 겹치는 쌍: "연결id|연결id". */
function overlapPairs(edges: Map<string, Pt[]>): Set<string> {
  const segs = [...edges].flatMap(([id, pts]) => pts.slice(1).map((b, i) => ({ id, a: pts[i]!, b })));
  const out = new Set<string>();
  for (let i = 0; i < segs.length; i++) {
    for (let j = i + 1; j < segs.length; j++) {
      const u = segs[i]!;
      const v = segs[j]!;
      if (u.id === v.id) continue;
      let o = 0;
      if (Math.abs(u.a.x - u.b.x) < 0.01 && Math.abs(v.a.x - v.b.x) < 0.01 && Math.abs(u.a.x - v.a.x) <= 1) {
        o = Math.min(Math.max(u.a.y, u.b.y), Math.max(v.a.y, v.b.y)) - Math.max(Math.min(u.a.y, u.b.y), Math.min(v.a.y, v.b.y));
      } else if (Math.abs(u.a.y - u.b.y) < 0.01 && Math.abs(v.a.y - v.b.y) < 0.01 && Math.abs(u.a.y - v.a.y) <= 1) {
        o = Math.min(Math.max(u.a.x, u.b.x), Math.max(v.a.x, v.b.x)) - Math.max(Math.min(u.a.x, u.b.x), Math.min(v.a.x, v.b.x));
      }
      if (o > 1) out.add(u.id < v.id ? `${u.id}|${v.id}` : `${v.id}|${u.id}`);
    }
  }
  return out;
}

const NODE_SHRINK = 1;
/** 연결의 어느 토막이 끝점이 아닌 노드를 가로지르는지: "연결id|노드id" 집합. */
export function crossings(nodeRects: Map<string, Rect>, ends: Map<string, [string, string]>, edges: Map<string, Pt[]>): Set<string> {
  const out = new Set<string>();
  for (const [eid, pts] of edges) {
    const [from, to] = ends.get(eid)!;
    for (let i = 1; i < pts.length; i++) {
      const x1 = Math.min(pts[i]!.x, pts[i - 1]!.x);
      const x2 = Math.max(pts[i]!.x, pts[i - 1]!.x);
      const y1 = Math.min(pts[i]!.y, pts[i - 1]!.y);
      const y2 = Math.max(pts[i]!.y, pts[i - 1]!.y);
      for (const [nid, r] of nodeRects) {
        if (nid === from || nid === to) continue;
        if (x1 < r.x + r.width - NODE_SHRINK && x2 > r.x + NODE_SHRINK && y1 < r.y + r.height - NODE_SHRINK && y2 > r.y + NODE_SHRINK) out.add(`${eid}|${nid}`);
      }
    }
  }
  return out;
}

const GROUP_PADDING = `[top=${GROUP_PAD.top},left=${GROUP_PAD.side},bottom=${GROUP_PAD.bottom},right=${GROUP_PAD.side}]`;

/** AZ 칩 너비: 글자 `AZ <az>`(11px) + 양쪽 안쪽 여백 3 + 양쪽 테두리 1 + 보조 글자와의 사이 6 (canvas.css .node__az · .node__subrow). */
export function azChipWidth(az: string): number {
  return textWidth(`AZ ${az}`, SUB_PX) + 2 * 3 + 2 * 1 + 6;
}

const azOf = (n: DNode): string | undefined => (n.attrs.az !== undefined && n.attrs.az !== null ? String(n.attrs.az) : undefined);

function nodeWidth(label: string, sub: string | undefined, az: string | undefined): number {
  // 보조 줄은 보조 글자와 AZ 칩이 나눠 쓴다.
  const subRow = (sub ? textWidth(sub, SUB_PX) : 0) + (az !== undefined ? azChipWidth(az) : 0);
  const text = Math.max(textWidth(label, LABEL_PX), subRow);
  return Math.min(NODE.maxWidth, Math.max(NODE.minWidth, text + NODE.padLeft + NODE.padRight));
}

function pathMidpoint(points: Pt[]): Pt | undefined {
  if (points.length === 0) return undefined;
  const segs = points.slice(1).map((p, i) => Math.hypot(p.x - points[i].x, p.y - points[i].y));
  let half = segs.reduce((a, b) => a + b, 0) / 2;
  for (let i = 0; i < segs.length; i++) {
    if (half <= segs[i] && segs[i] > 0) {
      const t = half / segs[i];
      return { x: points[i].x + (points[i + 1].x - points[i].x) * t, y: points[i].y + (points[i + 1].y - points[i].y) * t };
    }
    half -= segs[i];
  }
  return points[points.length - 1];
}

interface ElkRun { rects: Map<string, Rect>; edges: Map<string, Pt[]> }

function translate(run: ElkRun, dx: number, dy: number): void {
  for (const r of run.rects.values()) {
    r.x += dx;
    r.y += dy;
  }
  for (const pts of run.edges.values()) {
    for (const p of pts) {
      p.x += dx;
      p.y += dy;
    }
  }
}

const segmentRect = (a: Pt, b: Pt): Rect => ({ x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), width: Math.abs(a.x - b.x), height: Math.abs(a.y - b.y) });
const touches = (a: Rect, b: Rect): boolean => a.x <= b.x + b.width && b.x <= a.x + a.width && a.y <= b.y + b.height && b.y <= a.y + a.height;

/** opts.reorder=false 는 이름 순서로 자리 바꾸기를 끈다(비교·시험용). */
export async function layoutDiagram(g: DisplayGraph, pinned: Record<string, { x: number; y: number }>, opts: { reorder?: boolean } = {}): Promise<Layout> {
  const groups = Object.values(g.groups);
  const nodes = Object.values(g.nodes);
  const parentOf = (id: string): string | null => {
    const p = (g.nodes[id] ?? g.groups[id])?.parent ?? null;
    return p !== null && g.groups[p] ? p : null;
  };
  const topOf = (id: string): string => {
    let t = id;
    for (let p = parentOf(t); p !== null; p = parentOf(t)) t = p;
    return t;
  };
  const depth = (id: string): number => {
    let d = 0;
    for (let p = parentOf(id); p !== null; p = parentOf(p)) d++;
    return d;
  };
  const filled = new Set<string>();
  for (const x of [...groups, ...nodes]) {
    const p = parentOf(x.id);
    if (p !== null && !g.groups[p].collapsed) filled.add(p);
  }

  // Members of a redundancy group sit in one row. An edge between two direct children of the same
  // redundancy group would push them into different ELK layers, so it is left out of ELK and drawn
  // afterwards as a short horizontal connector.
  const rowEdge = (from: string, to: string): boolean => {
    const p = parentOf(from);
    return p !== null && p === parentOf(to) && g.groups[p].groupKind === "redundancy_group" && !!g.nodes[from] && !!g.nodes[to];
  };

  const edgeById = new Map(g.edges.map((e) => [e.id, e]));

  // One ELK run over the hierarchy under `tops`. Each edge sits in the lowest common ancestor container
  // of its endpoints; ELK returns its sections relative to that container, so the container's absolute
  // offset is added back.
  async function runElk(tops: Set<string>): Promise<ElkRun> {
    const inRun = (id: string) => tops.has(topOf(id));
    const containerOf = (id: string): string => parentOf(id) ?? ROOT;
    const elkById = new Map<string, ElkNode>();
    const root: ElkNode = { id: ROOT, layoutOptions: { ...BASE_OPTIONS, "elk.direction": "DOWN" }, children: [], edges: [] };
    elkById.set(ROOT, root);
    // Parents before children; input order otherwise (stable model order for ELK).
    for (const grp of groups.filter((x) => inRun(x.id)).sort((a, b) => depth(a.id) - depth(b.id))) {
      // Collapsed and empty groups are plain boxes. ELK lays a whole INCLUDE_CHILDREN hierarchy out in its
      // root's direction and ignores a per-group direction, so the catalog's innerDirection is not passed;
      // a redundancy group's side-by-side row comes from `rowEdge` below.
      const n: ElkNode = filled.has(grp.id)
        ? {
            id: grp.id,
            layoutOptions: { ...BASE_OPTIONS, "elk.padding": GROUP_PADDING },
            children: [],
            edges: [],
          }
        : { id: grp.id, width: EMPTY_GROUP.width, height: EMPTY_GROUP.height };
      elkById.set(grp.id, n);
      elkById.get(containerOf(grp.id))!.children!.push(n);
    }
    for (const node of nodes.filter((x) => inRun(x.id))) {
      const n: ElkNode = { id: node.id, width: nodeWidth(node.label, node.sub, azOf(node)), height: NODE.height };
      elkById.set(node.id, n);
      elkById.get(containerOf(node.id))!.children!.push(n);
    }
    // 나란히 놓는 영역의 자식은 숫자로 끝나는 같은 이름끼리 숫자 순서로 ELK 에 넣는다.
    for (const grp of groups) {
      const n = elkById.get(grp.id);
      if (!n?.children || !ROW_GROUP_KINDS.has(grp.groupKind)) continue;
      n.children = sortNumbered(n.children, (id) => (g.nodes[id] ?? g.groups[id])?.label ?? id);
    }
    const chain = (id: string): string[] => {
      const out: string[] = [];
      for (let c: string | null = containerOf(id); c !== null; c = c === ROOT ? null : containerOf(c)) out.push(c);
      return out;
    };
    const edgeContainer = new Map<string, string>();
    for (const e of g.edges) {
      if (!inRun(e.from) || !inRun(e.to) || rowEdge(e.from, e.to)) continue;
      const toChain = new Set(chain(e.to));
      const lca = chain(e.from).find((c) => toChain.has(c)) ?? ROOT;
      edgeContainer.set(e.id, lca);
      elkById.get(lca)!.edges!.push({ id: e.id, sources: [e.from], targets: [e.to] });
    }

    const result = await elk.layout(root);
    const rects = new Map<string, Rect>();
    const laid = new Map<string, ElkExtendedEdge>();
    const walk = (n: ElkNode, x: number, y: number) => {
      rects.set(n.id, { x, y, width: n.width ?? 0, height: n.height ?? 0 });
      for (const e of n.edges ?? []) laid.set(e.id, e);
      for (const c of n.children ?? []) walk(c, x + (c.x ?? 0), y + (c.y ?? 0));
    };
    walk(result, 0, 0);
    // ELK 는 INCLUDE_CHILDREN 계층 안에서 입력 순서(considerModelOrder·forceNodeModelOrder)를 지키지 않고,
    // 안쪽 영역에 그 옵션을 주면 오류가 난다. 그래서 나란히 놓인 "숫자로 끝나는 같은 이름" 노드는 ELK 가
    // 놓은 뒤 같은 줄 안에서 숫자 순서로 자리를 바꾼다. 바꾼 뒤 어느 연결이든 끝점이 아닌 노드를 새로
    // 가로지르게 되면 그 줄은 ELK 순서와 원래 경로를 그대로 둔다.
    const ends = new Map<string, [string, string]>();
    const elkPoints = new Map<string, Pt[]>();
    for (const [id, container] of edgeContainer) {
      const off = rects.get(container)!;
      const pts: Pt[] = [];
      for (const s of laid.get(id)?.sections ?? []) {
        for (const p of [s.startPoint, ...(s.bendPoints ?? []), s.endPoint]) {
          const q = { x: p.x + off.x, y: p.y + off.y };
          const last = pts[pts.length - 1];
          if (!last || Math.abs(last.x - q.x) > 0.01 || Math.abs(last.y - q.y) > 0.01) pts.push(q);
        }
      }
      const de = edgeById.get(id)!;
      ends.set(id, [de.from, de.to]);
      elkPoints.set(id, pts);
    }

    interface Move { ids: string[]; xs: number[] } // ids[k] 를 xs[k] 로 옮긴다
    const candidates: Move[] = [];
    for (const grp of groups) {
      if (!ROW_GROUP_KINDS.has(grp.groupKind) || !rects.has(grp.id)) continue;
      const kids = [...groups, ...nodes].filter((x) => x.parent === grp.id && rects.has(x.id));
      if (kids.length < 2 || kids.some((k) => !g.nodes[k.id])) continue; // 안쪽 영역이 섞여 있으면 건드리지 않는다.
      const rows = new Map<number, string[]>();
      for (const k of kids) {
        const y = Math.round(rects.get(k.id)!.y);
        rows.set(y, [...(rows.get(y) ?? []), k.id]);
      }
      for (const ids of rows.values()) {
        const left = [...ids].sort((a, b) => rects.get(a)!.x - rects.get(b)!.x);
        for (const cls of numberedClasses(left.map((id) => ({ id, label: g.nodes[id].label })))) {
          const at = cls.map((id) => left.indexOf(id)).sort((a, b) => a - b);
          const cur = at.map((i) => left[i]!);
          if (cur.every((id, i) => id === cls[i])) continue;
          const first = rects.get(cur[0]!)!;
          const last = rects.get(cur[cur.length - 1]!)!;
          if (at[at.length - 1]! - at[0]! === at.length - 1) {
            // 이웃해 있으면 같은 폭 안에서 간격을 고르게 다시 놓는다.
            const sumW = cls.reduce((t, id) => t + rects.get(id)!.width, 0);
            const gap = (last.x + last.width - first.x - sumW) / (cls.length - 1);
            let x = first.x;
            candidates.push({ ids: cls, xs: cls.map((id) => { const v = x; x += rects.get(id)!.width + gap; return v; }) });
          } else {
            // 사이에 다른 이름이 끼어 있으면 그 노드는 두고, 묶음이 차지하던 자리의 가운데에 맞춰 바꿔 넣는다.
            candidates.push({ ids: cls, xs: cls.map((id, k) => { const slot = rects.get(cur[k]!)!; return slot.x + slot.width / 2 - rects.get(id)!.width / 2; }) });
          }
        }
      }
    }

    interface Built { rects: Map<string, Rect>; edges: Map<string, Pt[]> }
    const build = (moves: Move[]): Built => {
      const rs = new Map([...rects].map(([k, r]) => [k, { ...r }]));
      const dxOf = new Map<string, number>();
      for (const m of moves) {
        m.ids.forEach((id, k) => {
          const r = rs.get(id)!;
          if (Math.abs(r.x - m.xs[k]!) > 0.01) dxOf.set(id, m.xs[k]! - r.x);
          r.x = m.xs[k]!;
        });
      }
      const es = new Map<string, Pt[]>();
      for (const [id, orig] of elkPoints) {
        const [from, to] = ends.get(id)!;
        if (!dxOf.has(from) && !dxOf.has(to)) {
          es.set(id, orig);
          continue;
        }
        // 자리가 바뀐 노드에 닿는 끝 구간(세로)을 노드를 따라 옮긴다. 옮길 수 없으면 꺾은선으로 다시 그린다.
        const pts = orig.map((q) => ({ ...q }));
        const both = dxOf.has(from) && dxOf.has(to);
        let ok = pts.length >= (both ? 4 : 3);
        const slide = (nodeId: string, a: number, b: number) => {
          const dx = dxOf.get(nodeId);
          if (dx === undefined || !ok) return;
          if (Math.abs(pts[a]!.x - pts[b]!.x) > 0.01) return void (ok = false);
          pts[a]!.x += dx;
          pts[b]!.x += dx;
        };
        slide(to, pts.length - 1, pts.length - 2);
        slide(from, 0, 1);
        // 옮기고 나면 이웃한 두 점이 겹칠 수 있다. 길이가 0인 토막은 그리지 못하므로 뺀다.
        es.set(
          id,
          ok ? pts.filter((q, i) => i === 0 || Math.abs(q.x - pts[i - 1]!.x) > 0.01 || Math.abs(q.y - pts[i - 1]!.y) > 0.01) : elbowRoute(rs.get(from)!, rs.get(to)!),
        );
      }
      return { rects: rs, edges: es };
    };
    const nodeRectsOf = (m: Map<string, Rect>) => new Map([...m].filter(([k]) => g.nodes[k]));

    let built = build([]);
    if (opts.reorder !== false && candidates.length > 0) {
      const base = crossings(nodeRectsOf(built.rects), ends, built.edges);
      const overlaps = (m: Map<string, Rect>): number => {
        const rs = [...nodeRectsOf(m).values()];
        let n = 0;
        for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) if (rs[i]!.x < rs[j]!.x + rs[j]!.width && rs[j]!.x < rs[i]!.x + rs[i]!.width && rs[i]!.y < rs[j]!.y + rs[j]!.height && rs[j]!.y < rs[i]!.y + rs[i]!.height) n++;
        return n;
      };
      const baseOverlaps = overlaps(built.rects);
      const baseLines = overlapPairs(built.edges);
      const accepted: Move[] = [];
      for (const c of candidates) {
        const trial = build([...accepted, c]);
        const now = crossings(nodeRectsOf(trial.rects), ends, trial.edges);
        if ([...now].every((k) => base.has(k)) && overlaps(trial.rects) <= baseOverlaps && [...overlapPairs(trial.edges)].every((k) => baseLines.has(k))) {
          accepted.push(c);
          built = trial;
        }
      }
    }
    for (const [k, r] of built.rects) rects.set(k, r);
    const edges = built.edges;
    rects.delete(ROOT);
    return { rects, edges };
  }

  // Top-level external service groups form a lane right of the main flow. ELK uses one direction for a
  // whole INCLUDE_CHILDREN hierarchy (a RIGHT root would turn the main flow sideways), so main and each
  // lane group are laid out DOWN on their own, the lane is stacked beside main, and the edges between
  // them are routed here through vertical channels in the gap.
  const laneIds = groups.filter((x) => x.parent === null && x.groupKind === "external_service").map((x) => x.id);
  const laneSet = new Set(laneIds);
  const mainTops = new Set([...groups, ...nodes].filter((x) => parentOf(x.id) === null && !laneSet.has(x.id)).map((x) => x.id));
  const main = await runElk(mainTops);
  const rects = new Map(main.rects);
  const points = new Map(main.edges);

  const inLane = (id: string) => laneSet.has(topOf(id));
  const cross = g.edges.filter((e) => inLane(e.from) !== inLane(e.to));
  const mainRight = Math.max(0, ...[...main.rects.values()].map((r) => r.x + r.width));
  if (laneIds.length > 0) {
    const laneX = mainRight + 2 * CHANNEL_MARGIN + Math.max(0, cross.length - 1) * CHANNEL_STEP;
    // Stack lane groups top→down, each near the highest main node it talks to.
    const wantY = (laneTop: string): number => {
      const ys = cross
        .flatMap((e) => (topOf(e.from) === laneTop ? [e.to] : topOf(e.to) === laneTop ? [e.from] : []))
        .map((id) => main.rects.get(id)!.y);
      return ys.length > 0 ? Math.min(...ys) : 0;
    };
    const lane = await Promise.all(laneIds.map(async (id) => ({ id, run: await runElk(new Set([id])), want: wantY(id) })));
    lane.sort((a, b) => a.want - b.want);
    let nextY = 0;
    for (const { id, run, want } of lane) {
      const r = run.rects.get(id)!;
      const y = Math.max(nextY, want - GROUP_PAD.top);
      translate(run, laneX - r.x, y - r.y);
      nextY = y + r.height + NODE.gap;
      for (const [k, v] of run.rects) rects.set(k, v);
      for (const [k, v] of run.edges) points.set(k, v);
    }
  }

  // Edges that could not get a clear route; drawn as plain elbows and flagged on the result.
  const degraded = new Set<string>();

  // Redundancy row connectors: facing borders on a line inside both members' vertical ranges, in the
  // edge's own direction. If another member sits between the two, the connector dips into the group's
  // bottom padding instead. If ELK still put the two in different rows (an outside edge into only one
  // member can do that), there is no straight line and a plain elbow is used.
  for (const e of g.edges) {
    if (!rowEdge(e.from, e.to)) continue;
    const a = rects.get(e.from)!;
    const b = rects.get(e.to)!;
    const [l, r] = a.x <= b.x ? [a, b] : [b, a];
    const lo = Math.max(l.y, r.y);
    const hi = Math.min(l.y + l.height, r.y + r.height);
    if (hi - lo < 1 || r.x < l.x + l.width) {
      points.set(e.id, elbowRoute(a, b));
      degraded.add(e.id);
      continue;
    }
    const between = [...rects.entries()].some(
      ([id, m]) => g.nodes[id] && m !== l && m !== r && m.x >= l.x + l.width && m.x + m.width <= r.x && m.y < l.y + l.height && m.y + m.height > l.y,
    );
    let pts: Pt[];
    if (!between) {
      const cy = (lo + hi) / 2;
      pts = [{ x: l.x + l.width, y: cy }, { x: r.x, y: cy }];
    } else {
      const dip = Math.max(l.y + l.height, r.y + r.height) + GROUP_PAD.bottom / 2;
      const lx = l.x + l.width / 2;
      const rx = r.x + r.width / 2;
      pts = [{ x: lx, y: l.y + l.height }, { x: lx, y: dip }, { x: rx, y: dip }, { x: rx, y: r.y + r.height }];
    }
    points.set(e.id, a === l ? pts : pts.reverse());
  }

  if (laneIds.length > 0) {
    // Hand-routed runs avoid nodes (with a little air) and every group's name band.
    const nodeBoxes = new Map(nodes.map((n) => [n.id, rects.get(n.id)!] as const));
    const air = (r: Rect): Rect => ({ x: r.x - 4, y: r.y - 4, width: r.width + 8, height: r.height + 8 });
    const nameBands = groups.map((x) => rects.get(x.id)!).map((r) => ({ x: r.x, y: r.y, width: r.width, height: GROUP_PAD.top }));
    const obstacles: Rect[] = [...[...nodeBoxes.values()].map(air), ...nameBands];
    // Horizontal runs additionally keep off group bottom borders and off other edges' horizontal runs,
    // so a line never hides along a border or merges with an unrelated line.
    const band = (a: Pt, b: Pt): Rect => ({ x: Math.min(a.x, b.x), y: a.y - 4, width: Math.abs(a.x - b.x), height: 8 });
    const rowBlockers: Rect[] = [
      ...obstacles,
      ...groups.map((x) => rects.get(x.id)!).map((r) => band({ x: r.x, y: r.y + r.height }, { x: r.x + r.width, y: r.y + r.height })),
      ...[...points.values()].flatMap((pts) => pts.slice(1).flatMap((q, i) => (Math.abs(q.y - pts[i].y) < 0.5 ? [band(pts[i], q)] : []))),
    ];
    const clear = (a: Pt, b: Pt, blockers: Rect[]): boolean => blockers.every((o) => !touches(segmentRect(a, b), o));
    const span = Math.max(...[...rects.values()].map((r) => r.y + r.height)) + NODE.layerGap;

    // Main side: the nearest row below the node (else above it) reachable by a clear vertical stub and a
    // clear horizontal run to the channel; null if there is none.
    const exitRow = (m: Rect, channelX: number): { y: number; from: Pt } | null => {
      const x = m.x + m.width / 2;
      for (let d = 8; d <= span; d += 2) {
        for (const dir of [1, -1] as const) {
          const y0 = dir === 1 ? m.y + m.height : m.y;
          const y = y0 + dir * d;
          if (clear({ x, y: y0 + dir * 5 }, { x, y }, obstacles) && clear({ x, y }, { x: channelX, y }, rowBlockers)) {
            rowBlockers.push(band({ x, y }, { x: channelX, y }));
            return { y, from: { x, y: y0 } };
          }
        }
      }
      return null;
    };
    // Lane side: enter the node's left side at its centre line (crossing only its group's side border).
    // Several edges on one node spread over its height.
    const entries = new Map<string, number>();
    for (const e of cross) {
      const id = inLane(e.from) ? e.from : e.to;
      entries.set(id, (entries.get(id) ?? 0) + 1);
    }
    const used = new Map<string, number>();
    const entryY = (id: string, t: Rect): number => {
      const n = entries.get(id)!;
      const k = used.get(id) ?? 0;
      used.set(id, k + 1);
      return t.y + t.height / 2 + (k - (n - 1) / 2) * Math.min(8, (t.height - 8) / Math.max(1, n - 1));
    };
    // If something sits left of the lane node, come in from above instead: a row in the gap above its
    // lane group (only ~NODE.gap tall, so it can run out), then straight down into the node's top.
    // null if neither works.
    const laneRoute = (laneId: string, channelX: number): Pt[] | null => {
      const t = nodeBoxes.get(laneId) ?? rects.get(laneId)!;
      const y = entryY(laneId, t);
      const others = [...nodeBoxes.entries()].filter(([id]) => id !== laneId).map(([, r]) => air(r));
      if (clear({ x: channelX, y }, { x: t.x - 1, y }, [...others, ...nameBands, ...rowBlockers.filter((r) => r.height === 8)])) {
        rowBlockers.push(band({ x: channelX, y }, { x: t.x, y }));
        return [{ x: channelX, y }, { x: t.x, y }];
      }
      const top = rects.get(topOf(laneId))!;
      const tx = t.x + t.width / 2;
      for (let ry = top.y - 8; ry >= top.y - NODE.gap + 4; ry -= 2) {
        if (clear({ x: channelX, y: ry }, { x: tx, y: ry }, rowBlockers) && clear({ x: tx, y: ry }, { x: tx, y: t.y - 5 }, others)) {
          rowBlockers.push(band({ x: channelX, y: ry }, { x: tx, y: ry }));
          return [{ x: channelX, y: ry }, { x: tx, y: ry }, { x: tx, y: t.y }];
        }
      }
      return null;
    };

    [...cross]
      .sort((a, b) => rects.get(inLane(a.from) ? a.to : a.from)!.y - rects.get(inLane(b.from) ? b.to : b.from)!.y)
      .forEach((e, i) => {
        const fromLane = inLane(e.from);
        const mainId = fromLane ? e.to : e.from;
        const laneId = fromLane ? e.from : e.to;
        const channelX = mainRight + CHANNEL_MARGIN + i * CHANNEL_STEP;
        const exit = exitRow(rects.get(mainId)!, channelX);
        const into = exit && laneRoute(laneId, channelX);
        if (!exit || !into) {
          // Never throw on arbitrary diagrams: fall back to an elbow and flag it.
          degraded.add(e.id);
          points.set(e.id, elbowRoute(rects.get(e.from)!, rects.get(e.to)!));
          return;
        }
        const pts = [exit.from, { x: exit.from.x, y: exit.y }, { x: channelX, y: exit.y }, ...into];
        points.set(e.id, fromLane ? pts.reverse() : pts);
      });
    // Edges between two different lane groups (rare): a plain elbow.
    for (const e of g.edges) if (!points.has(e.id)) points.set(e.id, elbowRoute(rects.get(e.from)!, rects.get(e.to)!));
  }

  const out: Layout = { nodes: {}, groups: {}, edges: [], width: 0, height: 0 };
  for (const grp of groups) out.groups[grp.id] = { id: grp.id, parent: parentOf(grp.id), ...rects.get(grp.id)! };
  for (const n of nodes) {
    const pin = pinned[n.id];
    const ln: LaidOutNode = {
      id: n.id,
      parent: parentOf(n.id),
      ...rects.get(n.id)!,
      ...(pin ? { x: pin.x, y: pin.y } : {}),
      displayLabel: truncate(n.label, CONTENT_WIDTH, LABEL_PX),
    };
    // 칩이 같은 줄에 있으면 그만큼 덜 써서, CSS 가 말풍선 없이 자르는 일이 없게 한다.
    if (n.sub !== undefined) {
      const az = azOf(n);
      ln.displaySub = truncate(n.sub, CONTENT_WIDTH - (az !== undefined ? azChipWidth(az) : 0), SUB_PX);
    }
    out.nodes[n.id] = ln;
  }

  // A zone always wraps what is inside it: every zone holding a pinned node (directly or deeper) is
  // re-fitted to its children's bounding box plus GROUP_PAD, innermost first, so it can grow or shrink.
  // Other zones and unpinned nodes keep their ELK boxes; membership never changes.
  const refit = new Set<string>();
  for (const n of nodes) {
    if (!pinned[n.id]) continue;
    for (let p = parentOf(n.id); p !== null; p = parentOf(p)) refit.add(p);
  }
  for (const id of [...refit].sort((a, b) => depth(b) - depth(a))) {
    const kids = [...Object.values(out.nodes), ...Object.values(out.groups)].filter((r) => r.parent === id);
    if (kids.length === 0) continue;
    const x1 = Math.min(...kids.map((r) => r.x));
    const y1 = Math.min(...kids.map((r) => r.y));
    const x2 = Math.max(...kids.map((r) => r.x + r.width));
    const y2 = Math.max(...kids.map((r) => r.y + r.height));
    Object.assign(out.groups[id], {
      x: x1 - GROUP_PAD.side,
      y: y1 - GROUP_PAD.top,
      width: x2 - x1 + 2 * GROUP_PAD.side,
      height: y2 - y1 + GROUP_PAD.top + GROUP_PAD.bottom,
    });
  }

  // Pinned nodes keep their stored position; their edges (and edges of re-fitted zones) are redrawn as elbows.
  const rectOf = (id: string): Rect => out.nodes[id] ?? out.groups[id];
  const moved = (id: string) => !!pinned[id] || refit.has(id);
  for (const e of g.edges) {
    let pts = moved(e.from) || moved(e.to) ? elbowRoute(rectOf(e.from), rectOf(e.to)) : (points.get(e.id) ?? []);
    if (pts.length < 2) {
      // ELK returned no route for this edge.
      pts = elbowRoute(rectOf(e.from), rectOf(e.to));
      degraded.add(e.id);
    }
    const le: LaidOutEdge = { id: e.id, points: pts };
    if (degraded.has(e.id)) le.degraded = true;
    if (e.label !== undefined) {
      const mid = pathMidpoint(pts);
      if (mid) le.labelAt = mid;
    }
    out.edges.push(le);
  }

  for (const r of [...Object.values(out.nodes), ...Object.values(out.groups)]) {
    out.width = Math.max(out.width, r.x + r.width);
    out.height = Math.max(out.height, r.y + r.height);
  }
  for (const p of out.edges.flatMap((e) => e.points)) {
    out.width = Math.max(out.width, p.x);
    out.height = Math.max(out.height, p.y);
  }
  return out;
}
