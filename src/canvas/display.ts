import type { EdgeKind } from "@/domain/catalog";
import type { DiagramState, DNode, EdgeDirection, EdgeMedium, EdgePayload, Group } from "@/domain/types";

import type { MarkedMedium } from "./mediumMark";

export interface DisplayOptions {
  hideAux: boolean;
  busSimplify: boolean;
  mergeDuplicates: boolean;
  collapsed: Set<string>;
  selectedId: string | null;
  /** 보조 연결 숨김 중에도 남길 원래 연결 id(흐름을 보는 동안 그 단계 연결). */
  keepEdges?: ReadonlySet<string>;
}

export interface DisplayEdge {
  id: string;
  from: string;
  to: string;
  edgeKind: EdgeKind;
  label?: string;
  payload?: EdgePayload;
  /** 표지를 다는 통신 수단. 보통의 IP 통신("ip")은 싣지 않는다. */
  medium?: MarkedMedium;
  direction?: EdgeDirection;
  sourceEdgeIds: string[];
  /**
   * 밖으로 나가는 출구선(NAT 게이트웨이에 닿는 연결). 평소에는 보조선처럼 흐리고 가늘게, 이름은 고르거나 올렸을 때만 보인다.
   * 고르거나 흐름에 들면 강조 겹선이 평소 모양으로 밝힌다.
   */
  egress?: true;
  /** 묶음 경계에서 합친 연결: 원래 연결 id → 그 연결이 실제로 나온 묶음 안 노드. 강조가 구성원 노드를 밝히는 데 쓴다. */
  origins?: Record<string, string>;
}

export interface DisplayGroup extends Group {
  collapsed: boolean;
  hiddenCount: number;
}

export interface DisplayGraph {
  groups: Record<string, DisplayGroup>;
  nodes: Record<string, DNode>;
  edges: DisplayEdge[];
}

/** 연결 id(표시 연결 id 또는 묶인 원래 연결 id)가 그려지는 표시 연결. 없으면 undefined. */
export function displayEdgeFor(edges: DisplayEdge[], id: string): DisplayEdge | undefined {
  return edges.find((e) => e.id === id || e.sourceEdgeIds.includes(id));
}

const NODE_THRESHOLD = 40;
const BUS_LABEL = "이벤트";

export function initialCollapsed(state: DiagramState): Set<string> {
  if (Object.keys(state.nodes).length <= NODE_THRESHOLD) return new Set();
  return new Set(
    Object.values(state.groups)
      .filter((g) => g.parent !== null)
      .map((g) => g.id),
  );
}

export const defaultDisplayOptions = (state: DiagramState): DisplayOptions => ({
  hideAux: true,
  busSimplify: true,
  mergeDuplicates: true,
  collapsed: initialCollapsed(state),
  selectedId: null,
});

const isBus = (n: DNode | undefined): boolean => n !== undefined && (n.kind === "stream" || n.kind === "queue");
/** 안에서 밖으로 나가는 길목(NAT 게이트웨이). 여기 닿는 연결은 출구선으로 낮춰 그린다. */
const isEgressNode = (n: DNode | undefined): boolean => n !== undefined && n.kind === "nat";

/** Outermost collapsed ancestor of an id (the one actually drawn), or null if visible as itself. */
export function outermostCollapsedAncestor(state: DiagramState, collapsed: Set<string>, id: string): string | null {
  let found: string | null = null;
  const seen = new Set<string>();
  let p = (state.nodes[id] ?? state.groups[id])?.parent ?? null;
  while (p !== null && !seen.has(p)) {
    seen.add(p);
    if (collapsed.has(p) && state.groups[p]) found = p;
    p = state.groups[p]?.parent ?? null;
  }
  return found;
}

export function buildDisplayGraph(state: DiagramState, opts: DisplayOptions): DisplayGraph {
  const parentOf = (id: string): string | null => (state.nodes[id] ?? state.groups[id])?.parent ?? null;

  const collapsedAncestor = (id: string): string | null => outermostCollapsedAncestor(state, opts.collapsed, id);

  const groups: Record<string, DisplayGroup> = {};
  for (const g of Object.values(state.groups)) {
    if (collapsedAncestor(g.id) !== null) continue;
    groups[g.id] = { ...g, collapsed: opts.collapsed.has(g.id), hiddenCount: 0 };
  }
  const nodes: Record<string, DNode> = {};
  for (const n of Object.values(state.nodes)) {
    const anc = collapsedAncestor(n.id);
    if (anc === null) nodes[n.id] = n;
    else groups[anc].hiddenCount += 1;
  }

  const resolve = (id: string): string => collapsedAncestor(id) ?? id;

  // (1) re-target, (2) aux hiding
  interface Work { id: string; from: string; to: string; edgeKind: EdgeKind; label?: string; payload?: EdgePayload; direction?: EdgeDirection; medium?: EdgeMedium; ids: string[]; origins?: Record<string, string> }
  let work: Work[] = [];
  for (const e of Object.values(state.edges)) {
    const from = resolve(e.from);
    const to = resolve(e.to);
    if (opts.hideAux && e.edgeKind === "aux") {
      const sel = opts.selectedId;
      const touched = sel !== null && (e.from === sel || e.to === sel || from === sel || to === sel);
      if (!touched && !opts.keepEdges?.has(e.id)) continue;
    }
    work.push({ id: e.id, from, to, edgeKind: e.edgeKind, label: e.label, payload: e.payload, direction: e.direction, medium: e.medium, ids: [e.id] });
  }

  // (3) bus simplification (aux edges are left alone)
  if (opts.busSimplify) {
    const out: Work[] = [];
    const byPair = new Map<string, Work>();
    for (const w of work) {
      const fromBus = isBus(nodes[w.from]);
      const toBus = isBus(nodes[w.to]);
      if (w.edgeKind === "aux" || fromBus === toBus) {
        out.push(w);
        continue;
      }
      const other = fromBus ? w.to : w.from;
      const bus = fromBus ? w.from : w.to;
      const key = `${other}\u0000${bus}`;
      const existing = byPair.get(key);
      if (existing) existing.ids.push(...w.ids);
      else {
        const merged: Work = { id: w.id, from: other, to: bus, edgeKind: "async", label: BUS_LABEL, ids: [...w.ids] };
        byPair.set(key, merged);
        out.push(merged);
      }
    }
    work = out;
  }

  // (4) duplicate merge
  if (opts.mergeDuplicates) {
    const out: Work[] = [];
    const byPair = new Map<string, Work>();
    for (const w of work) {
      // Aux edges never merge with non-aux ones; among non-aux the smallest id is the (order-independent) representative.
      const key = `${w.edgeKind === "aux" ? "aux" : "main"}\u0000${w.from}\u0000${w.to}`;
      const existing = byPair.get(key);
      if (existing) {
        existing.ids.push(...w.ids);
        if (w.id < existing.id) {
          existing.id = w.id;
          existing.edgeKind = w.edgeKind;
          existing.label = w.label;
          existing.payload = w.payload;
          existing.direction = w.direction;
          existing.medium = w.medium;
        }
      } else {
        const copy = { ...w, ids: [...w.ids] };
        byPair.set(key, copy);
        out.push(copy);
      }
    }
    work = out;
  }

  // (4b) 이중화 묶음 경계 합치기: 펼친 redundancy_group 의 구성원 2대 이상이 묶음 밖의 같은 대상으로 같은 종류의 연결을
  // 보내면 "묶음 → 대상" 한 줄로 합친다(API #1·#2 → RDS 가 묶음 아래 경계에서 한 줄로 나간다). 보조 연결은 합치지 않는다.
  // 어느 구성원에서 나온 연결인지는 origins 에 남겨, 고르거나 흐름을 볼 때 그 구성원을 밝힌다.
  if (opts.mergeDuplicates) {
    const memberOf = (id: string): string | null => {
      const p = nodes[id]?.parent ?? null;
      const g = p !== null ? groups[p] : undefined;
      return g && !g.collapsed && g.groupKind === "redundancy_group" ? g.id : null;
    };
    const within = (id: string, groupId: string): boolean => {
      const seen = new Set<string>();
      for (let cur: string | null = id; cur !== null && !seen.has(cur); cur = parentOf(cur)) {
        if (cur === groupId) return true;
        seen.add(cur);
      }
      return false;
    };
    const byKey = new Map<string, Work[]>();
    for (const w of work) {
      const g = w.edgeKind === "aux" ? null : memberOf(w.from);
      if (g === null || within(w.to, g)) continue;
      const key = `${g}\u0000${w.to}\u0000${w.edgeKind}`;
      byKey.set(key, [...(byKey.get(key) ?? []), w]);
    }
    const replaced = new Map<Work, Work | null>();
    for (const [key, ws] of byKey) {
      if (new Set(ws.map((w) => w.from)).size < 2) continue;
      const rep = ws.reduce((a, b) => (b.id < a.id ? b : a));
      const origins: Record<string, string> = {};
      for (const w of ws) for (const id of w.ids) origins[id] = w.from;
      const merged: Work = { ...rep, from: key.split("\u0000")[0]!, ids: ws.flatMap((w) => w.ids), origins };
      ws.forEach((w, i) => replaced.set(w, i === 0 ? merged : null));
    }
    if (replaced.size > 0) work = work.flatMap((w) => (replaced.has(w) ? (replaced.get(w) ? [replaced.get(w)!] : []) : [w]));
  }

  // (5) self-loops
  const edges: DisplayEdge[] = work
    .filter((w) => w.from !== w.to)
    .map((w) => {
      const d: DisplayEdge = { id: w.id, from: w.from, to: w.to, edgeKind: w.edgeKind, sourceEdgeIds: w.ids };
      if (w.label !== undefined) d.label = w.label;
      if (w.payload !== undefined) d.payload = w.payload;
      if (w.direction !== undefined) d.direction = w.direction;
      if (w.medium !== undefined && w.medium !== "ip") d.medium = w.medium;
      if (w.origins) d.origins = w.origins;
      const ends = [nodes[w.from], nodes[w.to], ...Object.values(w.origins ?? {}).map((id) => nodes[id])];
      if (w.edgeKind !== "aux" && ends.some(isEgressNode)) d.egress = true;
      return d;
    });

  return { groups, nodes, edges };
}

