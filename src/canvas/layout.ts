import ELK from "elkjs/lib/elk.bundled.js";
import type { ElkExtendedEdge, ElkNode } from "elkjs/lib/elk-api";

import { GROUP_KINDS } from "@/domain/catalog";
import type { DisplayGraph } from "./display";
import { elbowRoute } from "./elbow";
import { textWidth, truncate } from "./text";

export const NODE = { height: 44, minWidth: 132, maxWidth: 220, padLeft: 38 /* 아이콘 */, padRight: 18 /* 배지 자리 */, gap: 28, layerGap: 52 };
export const GROUP_PAD = { top: 30, side: 12, bottom: 12 }; // top 은 이름 머리 공간

export interface Rect { x: number; y: number; width: number; height: number }
export interface LaidOutNode extends Rect { id: string; parent: string | null; displayLabel: string; displaySub?: string }
export interface LaidOutGroup extends Rect { id: string; parent: string | null }
export interface LaidOutEdge { id: string; points: { x: number; y: number }[]; labelAt?: { x: number; y: number } }
export interface Layout { nodes: Record<string, LaidOutNode>; groups: Record<string, LaidOutGroup>; edges: LaidOutEdge[]; width: number; height: number }

type Pt = { x: number; y: number };

const EMPTY_GROUP = { width: 160, height: 56 };
const LABEL_PX = 12;
const SUB_PX = 9.5;
const ROOT = "__root";
const CHANNEL_MARGIN = 24; // main 오른쪽 끝 ↔ 첫 통로, 마지막 통로 ↔ 외부 열
const CHANNEL_STEP = 12; // 통로끼리 간격 (spacing.edgeEdge)
const ROW_SEARCH = 400;
const CONTENT_WIDTH = NODE.maxWidth - NODE.padLeft - NODE.padRight;

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
const GROUP_PADDING = `[top=${GROUP_PAD.top},left=${GROUP_PAD.side},bottom=${GROUP_PAD.bottom},right=${GROUP_PAD.side}]`;
const INNER_DIRECTION = new Map<string, string>(GROUP_KINDS.map((k) => [k.kind, k.innerDirection]));

function nodeWidth(label: string, sub: string | undefined): number {
  const text = Math.max(textWidth(label, LABEL_PX), sub ? textWidth(sub, SUB_PX) : 0);
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

export async function layoutDiagram(g: DisplayGraph, pinned: Record<string, { x: number; y: number }>): Promise<Layout> {
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
      // root's direction; the catalog's inner direction is still passed as the group's option.
      const n: ElkNode = filled.has(grp.id)
        ? {
            id: grp.id,
            layoutOptions: { ...BASE_OPTIONS, "elk.direction": INNER_DIRECTION.get(grp.groupKind) ?? "DOWN", "elk.padding": GROUP_PADDING },
            children: [],
            edges: [],
          }
        : { id: grp.id, width: EMPTY_GROUP.width, height: EMPTY_GROUP.height };
      elkById.set(grp.id, n);
      elkById.get(containerOf(grp.id))!.children!.push(n);
    }
    for (const node of nodes.filter((x) => inRun(x.id))) {
      const n: ElkNode = { id: node.id, width: nodeWidth(node.label, node.sub), height: NODE.height };
      elkById.set(node.id, n);
      elkById.get(containerOf(node.id))!.children!.push(n);
    }
    const chain = (id: string): string[] => {
      const out: string[] = [];
      for (let c: string | null = containerOf(id); c !== null; c = c === ROOT ? null : containerOf(c)) out.push(c);
      return out;
    };
    const edgeContainer = new Map<string, string>();
    for (const e of g.edges) {
      if (!inRun(e.from) || !inRun(e.to)) continue;
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
    const edges = new Map<string, Pt[]>();
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
      edges.set(id, pts);
    }
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

  if (laneIds.length > 0) {
    const inLane = (id: string) => laneSet.has(topOf(id));
    const cross = g.edges.filter((e) => inLane(e.from) !== inLane(e.to));
    const mainRight = Math.max(0, ...[...main.rects.values()].map((r) => r.x + r.width));
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

    // Hand-routed rows avoid nodes (with a little air) and every group's name band.
    const obstacles: Rect[] = [
      ...nodes.map((n) => rects.get(n.id)!).map((r) => ({ x: r.x - 4, y: r.y - 4, width: r.width + 8, height: r.height + 8 })),
      ...groups.map((x) => rects.get(x.id)!).map((r) => ({ x: r.x, y: r.y, width: r.width, height: GROUP_PAD.top })),
    ];
    // Horizontal runs additionally keep off group bottom borders and off other edges' horizontal runs,
    // so a line never hides along a border or merges with an unrelated line.
    const band = (a: Pt, b: Pt): Rect => ({ x: Math.min(a.x, b.x), y: a.y - 4, width: Math.abs(a.x - b.x), height: 8 });
    const rowBlockers: Rect[] = [
      ...obstacles,
      ...groups.map((x) => rects.get(x.id)!).map((r) => band({ x: r.x, y: r.y + r.height }, { x: r.x + r.width, y: r.y + r.height })),
      ...[...points.values()].flatMap((pts) => pts.slice(1).flatMap((q, i) => (Math.abs(q.y - pts[i].y) < 0.5 ? [band(pts[i], q)] : []))),
    ];
    const clear = (a: Pt, b: Pt, blockers: Rect[]): boolean => blockers.every((o) => !touches(segmentRect(a, b), o));
    // Nearest row below (dir 1) or above (dir -1) a node edge reachable by a clear vertical stub and a
    // clear horizontal run to the channel.
    const row = (x: number, y0: number, dir: 1 | -1, channelX: number): number => {
      let y = y0 + (dir * NODE.layerGap) / 2;
      for (let d = 8; d <= ROW_SEARCH; d += 2) {
        const c = y0 + dir * d;
        if (clear({ x, y: y0 + dir * 5 }, { x, y: c }, obstacles) && clear({ x, y: c }, { x: channelX, y: c }, rowBlockers)) {
          y = c;
          break;
        }
      }
      rowBlockers.push(band({ x, y }, { x: channelX, y }));
      return y;
    };
    [...cross]
      .sort((a, b) => rects.get(a.from)!.y - rects.get(b.from)!.y)
      .forEach((e, i) => {
        const s = rects.get(e.from)!;
        const t = rects.get(e.to)!;
        const channelX = mainRight + CHANNEL_MARGIN + i * CHANNEL_STEP;
        const sx = s.x + s.width / 2;
        const tx = t.x + t.width / 2;
        const y1 = row(sx, s.y + s.height, 1, channelX);
        const y2 = row(tx, t.y, -1, channelX);
        points.set(e.id, [
          { x: sx, y: s.y + s.height },
          { x: sx, y: y1 },
          { x: channelX, y: y1 },
          { x: channelX, y: y2 },
          { x: tx, y: y2 },
          { x: tx, y: t.y },
        ]);
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
    if (n.sub !== undefined) ln.displaySub = truncate(n.sub, CONTENT_WIDTH, SUB_PX);
    out.nodes[n.id] = ln;
  }

  // Pinned nodes keep their stored position; their edges are redrawn as elbows.
  const rectOf = (id: string): Rect => out.nodes[id] ?? out.groups[id];
  for (const e of g.edges) {
    const pts = pinned[e.from] || pinned[e.to] ? elbowRoute(rectOf(e.from), rectOf(e.to)) : (points.get(e.id) ?? []);
    const le: LaidOutEdge = { id: e.id, points: pts };
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
