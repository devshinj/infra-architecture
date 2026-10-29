import type { EdgeKind } from "@/domain/catalog";
import type { DiagramState, DNode, Group } from "@/domain/types";

export interface DisplayOptions {
  hideAux: boolean;
  busSimplify: boolean;
  mergeDuplicates: boolean;
  collapsed: Set<string>;
  selectedId: string | null;
}

export interface DisplayEdge {
  id: string;
  from: string;
  to: string;
  edgeKind: EdgeKind;
  label?: string;
  sourceEdgeIds: string[];
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
  interface Work { id: string; from: string; to: string; edgeKind: EdgeKind; label?: string; ids: string[] }
  let work: Work[] = [];
  for (const e of Object.values(state.edges)) {
    const from = resolve(e.from);
    const to = resolve(e.to);
    if (opts.hideAux && e.edgeKind === "aux") {
      const sel = opts.selectedId;
      const touched = sel !== null && (e.from === sel || e.to === sel || from === sel || to === sel);
      if (!touched) continue;
    }
    work.push({ id: e.id, from, to, edgeKind: e.edgeKind, label: e.label, ids: [e.id] });
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
      const key = `${w.from}\u0000${w.to}`;
      const existing = byPair.get(key);
      if (existing) existing.ids.push(...w.ids);
      else {
        const copy = { ...w, ids: [...w.ids] };
        byPair.set(key, copy);
        out.push(copy);
      }
    }
    work = out;
  }

  // (5) self-loops
  const edges: DisplayEdge[] = work
    .filter((w) => w.from !== w.to)
    .map((w) => {
      const d: DisplayEdge = { id: w.id, from: w.from, to: w.to, edgeKind: w.edgeKind, sourceEdgeIds: w.ids };
      if (w.label !== undefined) d.label = w.label;
      return d;
    });

  return { groups, nodes, edges };
}

