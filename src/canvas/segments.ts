import { EDGE_KINDS, type EdgeKind } from "@/domain/catalog";

export const BASE_SPEED = 90; // px/s

export interface Segment {
  key: string;
  d: string;
  length: number;
  edgeKind: EdgeKind;
  edgeIds: string[];
  startMs: number;
}
export interface Bundle {
  id: string;
  periodMs: number;
  offsetMs: number;
  segments: Segment[];
  junctions: { x: number; y: number }[];
}
interface Pt {
  x: number;
  y: number;
}
interface InEdge {
  id: string;
  edgeKind: EdgeKind;
  points: Pt[];
}
interface Piece {
  key: string;
  a: Pt;
  b: Pt;
  length: number;
  edgeIds: string[];
}
interface Seg {
  key: string;
  pts: Pt[];
  length: number;
  edgeIds: string[];
  kind: EdgeKind;
  preds: Seg[];
  startMs: number;
}

const GAP_MS = 1200;
const STAGGER_MS = 350;
const MAX_ITER = 10;

const speedOf = (k: EdgeKind) => EDGE_KINDS.find((e) => e.kind === k)!.speedFactor;
const r5 = (n: number) => Math.round(n * 2) / 2 + 0; // + 0 turns -0 into 0
const rp = (p: Pt): Pt => ({ x: r5(p.x), y: r5(p.y) });
const pk = (p: Pt) => `${p.x},${p.y}`;

/** Split edges into straight pieces keyed by rounded endpoints; unshared keys include the edge id. */
function piecesOf(edges: InEdge[], shared: boolean) {
  const pieces = new Map<string, Piece>();
  const seqs = new Map<string, Piece[]>();
  for (const e of edges) {
    const seq: Piece[] = [];
    for (let i = 0; i + 1 < e.points.length; i++) {
      const a = rp(e.points[i]);
      const b = rp(e.points[i + 1]);
      if (a.x === b.x && a.y === b.y) continue;
      const key = `${shared ? "" : `${e.id}|`}${pk(a)}>${pk(b)}`;
      let piece = pieces.get(key);
      if (!piece) {
        piece = { key, a, b, length: Math.hypot(b.x - a.x, b.y - a.y), edgeIds: [] };
        pieces.set(key, piece);
      }
      if (!piece.edgeIds.includes(e.id)) piece.edgeIds.push(e.id);
      seq.push(piece);
    }
    seqs.set(e.id, seq);
  }
  return { pieces, seqs };
}

function buildSegs(edges: InEdge[], shared: boolean): Seg[] {
  const { pieces, seqs } = piecesOf(edges, shared);
  const inCount = new Map<string, number>();
  const outCount = new Map<string, number>();
  for (const p of pieces.values()) {
    inCount.set(pk(p.b), (inCount.get(pk(p.b)) ?? 0) + 1);
    outCount.set(pk(p.a), (outCount.get(pk(p.a)) ?? 0) + 1);
  }
  const isJunction = (pt: string) => (inCount.get(pt) ?? 0) >= 2 || (outCount.get(pt) ?? 0) >= 2;
  const setKey = (p: Piece) => [...p.edgeIds].sort().join("\u0000");

  const kindOf = new Map(edges.map((e) => [e.id, e.edgeKind]));
  const segByKey = new Map<string, Seg>();
  for (const e of edges) {
    const out: Seg[] = [];
    let run: Piece[] = [];
    const flush = () => {
      if (!run.length) return;
      const key = run[0].key;
      let seg = segByKey.get(key);
      if (!seg) {
        const ids = run[0].edgeIds;
        const moving = ids.map((i) => kindOf.get(i)!).filter((k) => speedOf(k) > 0);
        const kind: EdgeKind = moving.length
          ? moving.reduce((m, k) => (speedOf(k) < speedOf(m) ? k : m))
          : "aux";
        seg = {
          key,
          pts: [run[0].a, ...run.map((p) => p.b)],
          length: run.reduce((s, p) => s + p.length, 0),
          edgeIds: [...ids],
          kind,
          preds: [],
          startMs: 0,
        };
        segByKey.set(key, seg);
      }
      out.push(seg);
      run = [];
    };
    for (const piece of seqs.get(e.id)!) {
      const last = run[run.length - 1];
      // never merge across a fork/join point or across a change of edge set
      if (last && (setKey(last) !== setKey(piece) || isJunction(pk(piece.a)))) flush();
      run.push(piece);
    }
    flush();
    for (let i = 1; i < out.length; i++) {
      if (!out[i].preds.includes(out[i - 1])) out[i].preds.push(out[i - 1]);
    }
  }
  return [...segByKey.values()];
}

/** Forward pass then backward pull-up. Returns false on a cycle or non-convergence. */
function assignStarts(segs: Seg[], speed: number): boolean {
  const dur = (s: Seg) => (s.length / speed) * 1000;
  const timed = segs.filter((s) => s.kind !== "aux");
  for (const s of segs) s.startMs = 0;
  const state = new Map<Seg, 1 | 2>();
  let cyclic = false;
  const visit = (s: Seg): void => {
    if (state.get(s) === 2) return;
    if (state.get(s) === 1) {
      cyclic = true;
      return;
    }
    state.set(s, 1);
    let start = 0;
    for (const p of s.preds) {
      if (p.kind === "aux") continue;
      visit(p);
      start = Math.max(start, p.startMs + dur(p));
    }
    s.startMs = start;
    state.set(s, 2);
  };
  timed.forEach(visit);
  if (cyclic) return false;

  for (let i = 0; i < MAX_ITER; i++) {
    let changed = false;
    for (const s of timed) {
      for (const p of s.preds) {
        if (p.kind === "aux") continue;
        const want = s.startMs - dur(p);
        if (want > p.startMs + 1e-9) {
          p.startMs = want;
          changed = true;
        }
      }
    }
    if (!changed) return true;
  }
  return false;
}

const toD = (pts: Pt[]) => pts.map((p, i) => `${i ? "L" : "M"} ${p.x} ${p.y}`).join(" ");

export function buildSegmentBundles(edges: InEdge[]): Bundle[] {
  // edges sharing at least one piece belong to the same bundle
  const parent = edges.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const owner = new Map<string, number>();
  edges.forEach((e, i) => {
    for (let j = 0; j + 1 < e.points.length; j++) {
      const k = `${pk(rp(e.points[j]))}>${pk(rp(e.points[j + 1]))}`;
      const o = owner.get(k);
      if (o === undefined) owner.set(k, i);
      else parent[find(i)] = find(o);
    }
  });
  const groups = new Map<number, InEdge[]>();
  edges.forEach((e, i) => {
    const r = find(i);
    if (!groups.has(r)) groups.set(r, []);
    groups.get(r)!.push(e);
  });

  const bundles: Bundle[] = [];
  for (const group of groups.values()) {
    let segs = buildSegs(group, true);
    if (!segs.length) continue;
    const factors = group.map((e) => speedOf(e.edgeKind)).filter((f) => f > 0);
    const speed = factors.length ? BASE_SPEED * Math.min(...factors) : 0;
    if (speed > 0 && !assignStarts(segs, speed)) {
      segs = buildSegs(group, false); // independent per-edge timing
      assignStarts(segs, speed);
    }
    const endMs =
      speed > 0
        ? Math.max(
            0,
            ...segs.filter((s) => s.kind !== "aux").map((s) => s.startMs + (s.length / speed) * 1000),
          )
        : 0;
    const periodMs = endMs + GAP_MS;
    const idx = bundles.length;

    const ins = new Map<string, number>();
    const outs = new Map<string, number>();
    for (const s of segs) {
      const a = pk(s.pts[0]);
      const b = pk(s.pts[s.pts.length - 1]);
      outs.set(a, (outs.get(a) ?? 0) + 1);
      ins.set(b, (ins.get(b) ?? 0) + 1);
    }
    const junctions: Pt[] = [];
    for (const pt of new Set([...ins.keys(), ...outs.keys()])) {
      if ((ins.get(pt) ?? 0) >= 2 || (outs.get(pt) ?? 0) >= 2) {
        const [x, y] = pt.split(",").map(Number);
        junctions.push({ x, y });
      }
    }
    bundles.push({
      id: `b${idx}`,
      periodMs,
      offsetMs: (idx * STAGGER_MS) % periodMs,
      segments: segs.map((s) => ({
        key: s.key,
        d: toD(s.pts),
        length: s.length,
        edgeKind: s.kind,
        edgeIds: s.edgeIds,
        startMs: s.startMs,
      })),
      junctions,
    });
  }
  return bundles;
}
