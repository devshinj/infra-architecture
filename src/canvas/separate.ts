// 서로 다른 선이 minGap 보다 가깝게 나란히 지나는 안쪽 토막을 밀어 띄운다. layout 을 불러오지 않는다(불러오기 고리 끊기).
import { END_TRIM, isHorizontal, isVertical, pathSegments, rectHit, segmentsCross, trimmedRange, type PathSeg } from "./geometry";

type Pt = { x: number; y: number };
interface Rect { x: number; y: number; width: number; height: number }

/** 민 토막이 끝점이 아닌 상자 곁으로 이보다 가까이 붙지 않는다(외부 열 길찾기의 air 와 같다). */
const AIR = 4;
/** 전체를 다시 훑는 횟수 위쪽 한계. 받아들인 밀기는 평행 길이를 늘 줄이므로 그 전에 멈춘다. */
const MAX_ROUNDS = 8;

type Axis = "x" | "y";
const orient = (s: PathSeg): { ax: Axis; al: Axis } | null => (isVertical(s) ? { ax: "x", al: "y" } : isHorizontal(s) ? { ax: "y", al: "x" } : null);
const lo = (s: PathSeg, k: Axis): number => Math.min(s.a[k], s.b[k]);
const hi = (s: PathSeg, k: Axis): number => Math.max(s.a[k], s.b[k]);

/** 두 토막이 0.5 < 간격 < minGap 으로 나란한 길이(END_TRIM 뺀 구간끼리 겹친 길이, 1px 이하는 0). */
function parallelLen(u: PathSeg, v: PathSeg, minGap: number): number {
  const ou = orient(u);
  const ov = orient(v);
  if (!ou || !ov || ou.ax !== ov.ax) return 0;
  const gap = Math.abs(u.a[ou.ax] - v.a[ou.ax]);
  if (gap <= 0.5 || gap >= minGap) return 0;
  const ru = trimmedRange(u, ou.al);
  const rv = trimmedRange(v, ou.al);
  if (!ru || !rv) return 0;
  const o = Math.min(ru[1], rv[1]) - Math.max(ru[0], rv[0]);
  return o > 1 ? o : 0;
}

/** 두 토막이 0.5px 안에서 같은 자리를 함께 지나는지(공유 조각). */
function sharesWith(u: PathSeg, v: PathSeg): boolean {
  const ou = orient(u);
  const ov = orient(v);
  if (!ou || !ov || ou.ax !== ov.ax || Math.abs(u.a[ou.ax] - v.a[ou.ax]) > 0.5) return false;
  return Math.min(hi(u, ou.al), hi(v, ou.al)) - Math.max(lo(u, ou.al), lo(v, ou.al)) > 1;
}

interface Box { x1: number; y1: number; x2: number; y2: number }
const boxOf = (pts: Pt[]): Box => ({
  x1: Math.min(...pts.map((p) => p.x)),
  y1: Math.min(...pts.map((p) => p.y)),
  x2: Math.max(...pts.map((p) => p.x)),
  y2: Math.max(...pts.map((p) => p.y)),
});
const near = (a: Box, b: Box, d: number): boolean => a.x1 <= b.x2 + d && b.x1 <= a.x2 + d && a.y1 <= b.y2 + d && b.y1 <= a.y2 + d;

/** 한 선이 다른 모든 선과 이루는 값: 평행 길이·교차 수·공유 조각을 같이 쓰는 선·지나는 상자. */
interface Stats { par: number; cross: number; shared: Set<string>; through: Set<string> }

/**
 * 서로 다른 선의 안쪽 토막(첫·마지막 토막 빼고)이 0.5 < 간격 < minGap 으로 나란하면 한쪽을 수직 방향으로 밀어 간격을 minGap 으로
 * 맞춘다. 앞뒤 토막은 늘이거나 줄여 이어 직교를 지키고, 끝점은 그대로다. 공유 조각(0.5px 안) 쌍은 건드리지 않는다.
 * 민 선이 끝점이 아닌 상자를 새로 지나거나 상자 곁 AIR 안으로 붙거나, 교차가 늘거나, 다른 선과 새 공유 조각을 만들거나,
 * 그 선의 평행 길이가 줄지 않으면 그 밀기는 버린다. 바꾼 것을 새 Map 으로 돌려준다(입력은 그대로).
 */
export function separateParallels(
  edges: Map<string, Pt[]>,
  ends: Map<string, [string, string]>,
  boxes: Map<string, Rect>,
  minGap: number,
): Map<string, Pt[]> {
  const lines = new Map([...edges].map(([id, pts]) => [id, pts.map((p) => ({ ...p }))]));
  const segs = new Map([...lines].map(([id, pts]) => [id, pathSegments(pts)]));
  const bbox = new Map([...lines].map(([id, pts]) => [id, boxOf(pts)]));
  const ids = [...lines.keys()];

  const statsOf = (id: string, mine: PathSeg[], box: Box): Stats => {
    const st: Stats = { par: 0, cross: 0, shared: new Set(), through: new Set() };
    for (const other of ids) {
      if (other === id || !near(box, bbox.get(other)!, minGap)) continue;
      for (const u of mine) {
        for (const v of segs.get(other)!) {
          st.par += parallelLen(u, v, minGap);
          if (segmentsCross(u, v)) st.cross++;
          if (sharesWith(u, v)) st.shared.add(other);
        }
      }
    }
    const [f, t] = ends.get(id) ?? [];
    for (const [bid, r] of boxes) if (bid !== f && bid !== t && mine.some((s) => rectHit(s, r))) st.through.add(bid);
    return st;
  };

  /** id 의 k 번 토막(점 k → k+1)을 축 ax 좌표 c 로 옮긴 점 목록. 직교·끝점·앞뒤 토막 방향을 못 지키면 null. */
  const shifted = (pts: Pt[], k: number, ax: Axis, c: number): Pt[] | null => {
    if (k < 1 || k + 2 > pts.length - 1) return null; // 첫·마지막 토막은 노드에 닿는다
    const out = pts.map((p) => ({ ...p }));
    out[k]![ax] = c;
    out[k + 1]![ax] = c;
    const al: Axis = ax === "x" ? "y" : "x";
    for (const [p, q, isEnd] of [[k - 1, k, k - 1 === 0], [k + 2, k + 1, k + 2 === pts.length - 1]] as const) {
      // 앞뒤 토막은 민 축을 따라 달려야(민 토막과 직각이어야) 늘이고 줄여 이을 수 있다.
      if (Math.abs(pts[p]![al] - pts[q]![al]) >= 0.5) return null;
      const before = pts[q]![ax] - pts[p]![ax];
      const after = out[q]![ax] - out[p]![ax];
      // 방향이 뒤집히거나 너무 짧아지면 안 된다. 노드에 닿는 끝 토막은 END_TRIM(원래 더 짧았으면 그 길이)을 남긴다.
      if (Math.sign(before) !== Math.sign(after) || Math.abs(after) < (isEnd ? Math.min(Math.abs(before), END_TRIM) : 1)) return null;
    }
    return out;
  };

  const tryMove = (id: string, k: number, ax: Axis, c: number): boolean => {
    const pts = lines.get(id)!;
    const next = shifted(pts, k, ax, c);
    if (!next) return false;
    const [f, t] = ends.get(id) ?? [];
    const moved = { a: next[k]!, b: next[k + 1]! };
    const old = { a: pts[k]!, b: pts[k + 1]! };
    for (const [bid, r] of boxes) if (bid !== f && bid !== t && rectHit(moved, r, -AIR) && !rectHit(old, r, -AIR)) return false;
    const oldStats = statsOf(id, segs.get(id)!, boxOf([...pts, ...next]));
    const nextSegs = pathSegments(next);
    const newStats = statsOf(id, nextSegs, boxOf([...pts, ...next]));
    const subset = (a: Set<string>, b: Set<string>) => [...a].every((x) => b.has(x));
    if (newStats.par >= oldStats.par - 0.5 || newStats.cross > oldStats.cross || !subset(newStats.shared, oldStats.shared) || !subset(newStats.through, oldStats.through)) {
      return false;
    }
    lines.set(id, next);
    segs.set(id, nextSegs);
    bbox.set(id, boxOf(next));
    return true;
  };

  for (let round = 0; round < MAX_ROUNDS; round++) {
    let movedAny = false;
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const [ia, ib] = [ids[i]!, ids[j]!];
        if (!near(bbox.get(ia)!, bbox.get(ib)!, minGap)) continue;
        // 토막 번호는 밀어도 바뀌지 않으므로, 쌍마다 지금 모양으로 다시 본다.
        for (const u0 of segs.get(ia)!) {
          for (const v0 of segs.get(ib)!) {
            const u = segs.get(ia)!.find((s) => s.k === u0.k);
            const v = segs.get(ib)!.find((s) => s.k === v0.k);
            if (!u || !v || parallelLen(u, v, minGap) === 0) continue;
            const { ax } = orient(u)!;
            const cu = u.a[ax];
            const cv = v.a[ax];
            const side = Math.sign(cu - cv);
            // 덜 미는 것부터: 상대에게서 멀어지는 쪽(minGap − 간격), 그다음 상대를 넘어 반대쪽(minGap + 간격).
            const moves: [string, number, number][] = [
              [ia, u.k, cv + side * minGap],
              [ib, v.k, cu - side * minGap],
              [ia, u.k, cv - side * minGap],
              [ib, v.k, cu + side * minGap],
            ];
            moves.sort((p, q) => Math.abs(p[2] - (p[0] === ia ? cu : cv)) - Math.abs(q[2] - (q[0] === ia ? cu : cv)));
            if (moves.some(([id, k, c]) => tryMove(id, k, ax, c))) movedAny = true;
          }
        }
      }
    }
    if (!movedAny) break;
  }
  return lines;
}
