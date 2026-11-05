import type { Rect } from "./layout";
import { textWidth } from "./text";

type Pt = { x: number; y: number };

/** 같은 이름 선들이 함께 지나는 앞부분이 이 길이(px) 이상이어야 그 위에 이름을 둔다. */
export const MIN_TRUNK = 12;
/** 함께 지나는 앞부분이 없을 때 노드 상자 변에서 이름까지 띄우는 거리(px). */
export const LABEL_OFFSET = 14;
/** 선택 고리가 노드 상자 밖으로 나오는 폭(outline-offset 4px + 굵기 1.5px). 이름 상자는 이 안에 들지 않는다. */
export const NODE_RING = 6;
/** 이름 한 줄의 높이(11px 글자 + 둘레 테두리). */
export const LABEL_LINE = 14;
/** 이름 상자끼리, 이름과 선택 고리 사이에 두는 틈. */
export const ROW_GAP = 4;
/** 같은 변에 쌓는 이름 줄 간격. */
export const ROW_PITCH = LABEL_LINE + ROW_GAP;
/** 연결 이름 글자 크기(edges.css .edge-label)와 글자 둘레 테두리(stroke 3px) 몫. */
const LABEL_FONT = 11;
const LABEL_HALO = 3;
/** 공유 구간·제 선을 따라 비킬 자리를 찾는 걸음(px). */
const SLIDE_STEP = 2;
/** 변 옆에 쌓을 수 있는 줄 수 상한. */
const MAX_ROWS = 40;
/** 같은 점으로 보는 거리(px). */
const SAME = 0.5;

/** 글자를 x 의 어느 쪽에 둘지(SVG text-anchor). 변 옆 이름은 노드 바깥으로 뻗게 start/end 를 쓴다. */
export type LabelAnchor = "start" | "middle" | "end";

export interface PlacedLabel { text: string; x: number; y: number; anchor: LabelAnchor; edgeIds: string[] }

export interface IncidentEdge { id: string; label?: string; points: Pt[]; labelAt?: Pt; from: string; to: string }

export interface Box { x1: number; y1: number; x2: number; y2: number }

/** 이름이 그려지는 상자(글자 폭 어림 + 테두리). 글자는 세로 가운데(dominant-baseline: central)에 놓인다. */
export function labelBox(p: Pick<PlacedLabel, "text" | "x" | "y" | "anchor">): Box {
  const w = textWidth(p.text, LABEL_FONT) + LABEL_HALO;
  const x1 = p.anchor === "start" ? p.x - LABEL_HALO / 2 : p.anchor === "end" ? p.x - w + LABEL_HALO / 2 : p.x - w / 2;
  return { x1, y1: p.y - LABEL_LINE / 2, x2: x1 + w, y2: p.y + LABEL_LINE / 2 };
}

/** 두 상자가 ROW_GAP 보다 가까운지(ROW_GAP 만큼 떨어져 맞닿는 것은 괜찮다). */
function tooClose(a: Box, b: Box): boolean {
  const g = ROW_GAP - 1e-6;
  return a.x1 < b.x2 + g && b.x1 < a.x2 + g && a.y1 < b.y2 + g && b.y1 < a.y2 + g;
}

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

const totalLength = (rs: Run[]) => rs.reduce((a, r) => a + r.len, 0);

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

/** 점 p 를 토막들 위에 내렸을 때 시작점에서의 거리. */
function arcOf(rs: Run[], p: Pt): number {
  let best = 0;
  let bestD = Infinity;
  let acc = 0;
  for (const r of rs) {
    const t = Math.max(0, Math.min(r.len, (p.x - r.x) * r.dx + (p.y - r.y) * r.dy));
    const d = Math.hypot(p.x - (r.x + r.dx * t), p.y - (r.y + r.dy * t));
    if (d < bestD) {
      bestD = d;
      best = acc + t;
    }
    acc += r.len;
  }
  return best;
}

/** from..to 안에서 center 에 가까운 순서로 SLIDE_STEP 마다 놓은 거리들(center 먼저). */
function slides(center: number, from: number, to: number): number[] {
  const out = [center];
  for (let k = 1; ; k++) {
    const up = center + k * SLIDE_STEP;
    const down = center - k * SLIDE_STEP;
    if (up > to && down < from) break;
    if (up <= to) out.push(up);
    if (down >= from) out.push(down);
  }
  return out;
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

/** 위·아래 변 옆 이름의 가운데까지 거리: LABEL_OFFSET 이되, 이름 상자가 선택 고리에서 ROW_GAP 만큼 떨어지게. */
const VERTICAL_OFFSET = Math.max(LABEL_OFFSET, NODE_RING + ROW_GAP + LABEL_LINE / 2);

type Beside = Pt & { anchor: LabelAnchor; side: Side };

function besideNode(rect: Rect, starts: Pt[]): Beside {
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
      return { x: mx, y: rect.y - VERTICAL_OFFSET, anchor: "middle", side };
    case "right":
      return { x: rect.x + rect.width + LABEL_OFFSET, y: my, anchor: "start", side };
    case "bottom":
      return { x: mx, y: rect.y + rect.height + VERTICAL_OFFSET, anchor: "middle", side };
    case "left":
      return { x: rect.x - LABEL_OFFSET, y: my, anchor: "end", side };
  }
}

/** 변 옆 이름의 줄 후보: 위·아래 변은 바깥으로 한 줄씩, 왼쪽·오른쪽 변은 변을 따라 아래·위로 번갈아. */
function rows(at: Beside): Pt[] {
  const out: Pt[] = [];
  for (let k = 0; k < MAX_ROWS; k++) {
    if (at.side === "bottom") out.push({ x: at.x, y: at.y + k * ROW_PITCH });
    else if (at.side === "top") out.push({ x: at.x, y: at.y - k * ROW_PITCH });
    else out.push({ x: at.x, y: at.y + Math.ceil(k / 2) * (k % 2 === 1 ? 1 : -1) * ROW_PITCH });
  }
  return out;
}

/** 이름 하나를 놓을 계획: 차례(하나뿐인 이름 → 변 옆 → 공유 구간 → 공유 구간에 못 둔 것의 변 옆), 같은 차례는 글자 순. */
interface Plan { group: number; rank: number; text: string; anchor: LabelAnchor; edgeIds: string[]; candidates: Pt[] }

/**
 * 고른 노드에 이어진 연결의 이름 배치. 같은 이름(글자 그대로)은 하나로 합치고 2개 이상이면 "<이름> ×N".
 * 이름 상자끼리, 그리고 선택 고리까지 넓힌 노드 상자와 ROW_GAP 보다 가까이 두지 않는다: 변 옆 이름은 한 줄씩 쌓고,
 * 공유 구간 위 이름은 그 구간을 따라 비키고(안 되면 나가는 변 옆 줄로), 하나뿐인 이름은 제 선을 따라 비킨다.
 */
export function mergedLabels(selectedId: string, selectedRect: Rect, incident: IncidentEdge[]): PlacedLabel[] {
  const groups = new Map<string, IncidentEdge[]>();
  for (const e of incident) {
    if (!e.label || e.points.length < 2) continue;
    groups.set(e.label, [...(groups.get(e.label) ?? []), e]);
  }
  const plans: Plan[] = [];
  let group = 0;
  for (const [label, es] of groups) {
    group++;
    if (es.length === 1) {
      const at = es[0].labelAt;
      if (!at) continue;
      const rs = runs(es[0].points);
      const along = rs.length > 0 ? slides(arcOf(rs, at), 0, totalLength(rs)).slice(1).map((s) => pointAt(rs, s)) : [];
      plans.push({ group, rank: 0, text: label, anchor: "middle", edgeIds: [es[0].id], candidates: [at, ...along] });
      continue;
    }
    const lines = es.map((e) => fromSelected(selectedId, selectedRect, e));
    const starts = lines.map((l) => l[0]);
    const rs = lines.map(runs);
    let trunk = 0;
    if (starts.every((p) => same(p, starts[0])) && rs.every((r) => r.length > 0)) {
      trunk = Math.min(...rs.slice(1).map((r) => commonPrefix(rs[0], r)));
    }
    const text = `${label} ×${es.length}`;
    const edgeIds = es.map((e) => e.id);
    const side = besideNode(selectedRect, starts);
    if (trunk >= MIN_TRUNK) {
      plans.push({ group, rank: 2, text, anchor: "middle", edgeIds, candidates: slides(trunk / 2, 0, trunk).map((s) => pointAt(rs[0], s)) });
      plans.push({ group, rank: 3, text, anchor: side.anchor, edgeIds, candidates: rows(side) });
    } else {
      plans.push({ group, rank: 1, text, anchor: side.anchor, edgeIds, candidates: rows(side) });
    }
  }

  const ring: Box = {
    x1: selectedRect.x - NODE_RING,
    y1: selectedRect.y - NODE_RING,
    x2: selectedRect.x + selectedRect.width + NODE_RING,
    y2: selectedRect.y + selectedRect.height + NODE_RING,
  };
  const placed = new Map<number, PlacedLabel>();
  const boxes: Box[] = [];
  const queue = [...plans].sort((a, b) => a.rank - b.rank || (a.text < b.text ? -1 : a.text > b.text ? 1 : 0) || a.group - b.group);
  for (const plan of queue) {
    if (placed.has(plan.group)) continue;
    // 겹침은 반올림하기 전 자리로 잰다. 반올림이 노드 쪽으로 0.005 당기면 딱 ROW_GAP 인 첫 줄이 한 줄 밀려나기 때문이다.
    const make = (c: Pt): PlacedLabel => ({ text: plan.text, x: c.x, y: c.y, anchor: plan.anchor, edgeIds: plan.edgeIds });
    let chosen: PlacedLabel | null = null;
    for (const c of plan.candidates) {
      const p = make(c);
      const b = labelBox(p);
      if (!tooClose(b, ring) && !boxes.some((o) => tooClose(b, o))) {
        chosen = p;
        break;
      }
    }
    // 공유 구간에 둘 곳이 없으면 같은 무리의 변 옆 계획(rank 3)에 넘긴다.
    if (!chosen && plan.rank === 2) continue;
    // 후보가 모두 막히면 첫 후보에 둔다(이름이 사라지는 것보다 낫다).
    chosen ??= make(plan.candidates[0]);
    placed.set(plan.group, chosen);
    boxes.push(labelBox(chosen));
  }
  // 내보내는 좌표만 0.01 로 반올림한다.
  return [...placed.entries()].sort((a, b) => a[0] - b[0]).map(([, p]) => ({ ...p, x: round(p.x), y: round(p.y) }));
}

/** 선을 따라 놓는 글자 하나(흐름 단계 글자·망 경계 표시). width 가 있으면 글자 대신 그 폭의 가운데 맞춤 상자로 잰다. */
interface AlongItem { text: string; points: Pt[]; labelAt?: Pt; id?: string; width?: number; height?: number }

const ringOf = (r: Rect): Box => ({ x1: r.x - NODE_RING, y1: r.y - NODE_RING, x2: r.x + r.width + NODE_RING, y2: r.y + r.height + NODE_RING });

function boxOf(item: AlongItem, text: string, c: Pt): Box {
  if (item.width === undefined) return labelBox({ text, x: c.x, y: c.y, anchor: "middle" });
  const h = item.height ?? LABEL_LINE;
  return { x1: c.x - item.width / 2, y1: c.y - h / 2, x2: c.x + item.width / 2, y2: c.y + h / 2 };
}

/** 자리 후보: labelAt(없으면 선 가운데)에서 시작해 제 선을 따라 가까운 순서로. */
function alongCandidates(points: Pt[], labelAt?: Pt): Pt[] {
  const rs = runs(points);
  if (rs.length === 0) return labelAt ? [labelAt] : points.slice(0, 1);
  const total = totalLength(rs);
  const center = labelAt ? arcOf(rs, labelAt) : total / 2;
  const along = slides(center, 0, total).map((s) => pointAt(rs, s));
  return labelAt ? [labelAt, ...along.slice(1)] : along;
}

/**
 * 차례대로 하나씩, 막힌 상자(노드 고리·점·앞서 놓은 글자)와 ROW_GAP 보다 가까이 두지 않는 첫 후보에 둔다.
 * 긴 글자가 들어갈 곳이 없으면 shorter 가 준 짧은 글자로 다시 찾고, 그래도 없으면 첫 후보에 짧은 글자를 둔다.
 */
function placeAlong(items: AlongItem[], blocked: Box[], shorter: (text: string) => string | null): PlacedLabel[] {
  const taken = [...blocked];
  const out: PlacedLabel[] = [];
  for (const item of items) {
    if (item.points.length < 2 && !item.labelAt) continue;
    const cands = alongCandidates(item.points, item.labelAt);
    if (cands.length === 0) continue;
    const short = shorter(item.text);
    const texts = short !== null && short !== item.text ? [item.text, short] : [item.text];
    let chosen: { text: string; at: Pt } | null = null;
    for (const text of texts) {
      const at = cands.find((c) => {
        const b = boxOf(item, text, c);
        return !taken.some((o) => tooClose(b, o));
      });
      if (at) {
        chosen = { text, at };
        break;
      }
    }
    chosen ??= { text: texts[texts.length - 1], at: cands[0] };
    taken.push(boxOf(item, chosen.text, chosen.at));
    out.push({ text: chosen.text, x: round(chosen.at.x), y: round(chosen.at.y), anchor: "middle", edgeIds: item.id ? [item.id] : [] });
  }
  return out;
}

/** "3. 결과 저장" → "3". 번호 꼴이 아니면 null. */
const stepNumberOnly = (text: string): string | null => /^(\d+)\. /.exec(text)?.[1] ?? null;

/**
 * 흐름 단계 글자("n. 짧은 설명") 배치. 입력 차례 그대로 하나씩, 제 선을 따라 비켜 서로와, avoid 노드 상자(+선택 고리)와,
 * obstacles(망 경계 점 등)와 ROW_GAP 이상 떨어뜨린다. 들어갈 곳이 없으면 번호만 남긴다. 결과는 입력과 같은 차례다.
 */
export function stepLabels(steps: { text: string; points: Pt[]; labelAt?: Pt; id?: string }[], avoid: Rect[], obstacles: Box[] = []): PlacedLabel[] {
  return placeAlong(steps, [...avoid.map(ringOf), ...obstacles], stepNumberOnly);
}

/**
 * 망 경계 표시(알약+전달물·방향) 자리. 폭·높이는 그리는 쪽이 준다. 노드 상자·obstacles·이미 놓은 글자(placed)를 피해 제 선을 따라 둔다.
 * 들어갈 곳이 없으면 첫 후보(연결 가운데)에 둔다. 결과는 입력과 같은 차례이고 text 는 그대로 돌려준다.
 */
export function tagSpots(
  tags: { text: string; width: number; height: number; points: Pt[]; labelAt?: Pt; id?: string }[],
  avoid: Rect[],
  placed: PlacedLabel[],
  obstacles: Box[] = [],
): PlacedLabel[] {
  return placeAlong(tags, [...avoid.map(ringOf), ...obstacles, ...placed.map(labelBox)], () => null);
}

/**
 * 망 경계 점 자리: 연결 가운데(labelAt, 없으면 선 가운데). 그 자리에 연결 이름이 있으면 이름 상자와 ROW_GAP 떨어질 때까지 제 선을 따라 비킨다
 * (점이 이름 글자를 가리지 않게. 이름은 내보낸 그림에 늘 들어간다). 비킬 곳이 없으면 가운데에 둔다.
 */
export function boundaryDotAt(points: Pt[], radius: number, labelAt?: Pt, label?: string): Pt | null {
  const cands = alongCandidates(points, labelAt);
  if (cands.length === 0) return null;
  const blocked = label && labelAt ? [labelBox({ text: label, x: labelAt.x, y: labelAt.y, anchor: "middle" })] : [];
  const item: AlongItem = { text: "", points, width: 2 * radius, height: 2 * radius };
  const at = cands.find((c) => !blocked.some((o) => tooClose(boxOf(item, "", c), o))) ?? cands[0];
  return { x: round(at.x), y: round(at.y) };
}
