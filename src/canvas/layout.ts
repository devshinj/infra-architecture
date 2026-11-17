import ELK from "elkjs/lib/elk.bundled.js";
import type { ElkExtendedEdge, ElkNode } from "elkjs/lib/elk-api";

import type { DNode } from "@/domain/types";

import type { DisplayGraph } from "./display";
import { LABEL_LINE, labelBox, NODE_RING, ROW_GAP } from "./edgeLabels";
import { elbowRoute } from "./elbow";
import { countCrossings, segmentsCross } from "./geometry";
import { separateParallels } from "./separate";
import { placeRestingLabels, restingLabelGroups, type PlacedRestingLabel, type RestingLabelInput } from "./restingLabels";
import { textWidth, truncate } from "./text";

export const NODE = { height: 52, minWidth: 132, maxWidth: 240, padLeft: 42 /* 테두리 양쪽 2+안쪽 왼쪽 10+아이콘 22+사이 8 (canvas.css .node) */, padRight: 18 /* 안쪽 오른쪽 여백(배지 자리) */, gap: 28, layerGap: 52 };
export const GROUP_PAD = { top: 30, side: 12, bottom: 12 }; // top 은 이름 머리 공간

export interface Rect { x: number; y: number; width: number; height: number }
export interface LaidOutNode extends Rect { id: string; parent: string | null; displayLabel: string; displaySub?: string }
export interface LaidOutGroup extends Rect { id: string; parent: string | null }
// degraded: no clear route was found, so the edge is a plain elbow that may cross other shapes.
export interface LaidOutEdge { id: string; points: { x: number; y: number }[]; labelAt?: { x: number; y: number }; degraded?: boolean }
// labels: 평소 화면 이름(같은 글자·같은 끝 묶음은 "<이름> ×N" 하나, 출구선 빼고). labelBlocked: 「지킬 것」을 지킬 자리가
// 없어 겹친 채 놓인 이름의 edgeIds[0]. 이름을 단 선(labels[i].edgeIds[0])의 labelAt 은 그 이름 자리다.
export interface Layout {
  nodes: Record<string, LaidOutNode>;
  groups: Record<string, LaidOutGroup>;
  edges: LaidOutEdge[];
  width: number;
  height: number;
  labels: PlacedRestingLabel[];
  labelBlocked: string[];
}

type Pt = { x: number; y: number };

const EMPTY_GROUP = { width: 160, height: 56 };
// 접힌 영역 상자 폭의 위쪽 한계.
export const COLLAPSED_MAX_WIDTH = 320;
const GROUP_NAME_PX = 11;

/** 영역 머리 접기 단추에 보이는 글(보조기기용 영역 이름은 빼고). GroupBox 가 그대로 쓴다. */
export function groupToggleLabel(collapsed: boolean, hiddenCount: number): string {
  return collapsed ? `펼치기 · 노드 ${hiddenCount}개` : "접기";
}

/** 접기 단추의 보이는 폭 어림값: 11px 글 + 좌우 안쪽 여백 12 + 테두리 2. */
export function groupToggleWidth(collapsed: boolean, hiddenCount: number): number {
  return textWidth(groupToggleLabel(collapsed, hiddenCount), GROUP_NAME_PX) + 12 + 2;
}

// 접힌 영역은 이름 알약과 "펼치기 · 노드 N개" 단추가 한 줄에 들어갈 만큼 넓힌다(보이는 글만 잰다).
export function collapsedGroupWidth(label: string, hiddenCount: number): number {
  const head = 20 + 18 + textWidth(label, GROUP_NAME_PX);
  return Math.min(COLLAPSED_MAX_WIDTH, Math.max(EMPTY_GROUP.width, head + 8 + groupToggleWidth(true, hiddenCount)));
}
export const LABEL_PX = 14;
export const SUB_PX = 11;
const ROOT = "__root";
const CHANNEL_MARGIN = 24; // main 오른쪽 끝 ↔ 첫 통로, 마지막 통로 ↔ 외부 열
const CHANNEL_STEP = 16; // 통로끼리 간격 (spacing.edgeEdge)
const LINE_GAP = 16; // 공유 조각이 아닌 서로 다른 선이 나란히 지날 때 띄울 최소 간격
// 이름 있는 외부 연결의 가로 토막을 상자에서 띄우는 최소 거리: 이름 상자 반 높이 + ROW_GAP + 선택 고리(17px).
const LABEL_ROOM = NODE_RING + ROW_GAP + LABEL_LINE / 2;
const GAP_ROUNDS = 4; // 붐비는 외부 연결 줄·막힌 이름을 위해 틈을 벌리는 횟수(한 번에 LINE_GAP)
const END_GAP_TRIM = 8; // 이보다 짧게 나란한 것은 붐빈다고 보지 않는다(선 끝 모임, layoutMetrics 의 END_TRIM 과 같다)
const ROW_GAP_TIGHT = 5; // LINE_GAP 줄이 다음 층까지 밀려날 때 외부 연결의 가로 토막이 다른 가로 토막과 띄우는 간격(예전 값, 6px 부터 붙는다)
export const CONTENT_WIDTH = NODE.maxWidth - NODE.padLeft - NODE.padRight;

const elk = new ELK();

const BASE_OPTIONS: Record<string, string> = {
  "elk.algorithm": "layered",
  "elk.hierarchyHandling": "INCLUDE_CHILDREN",
  "elk.edgeRouting": "ORTHOGONAL",
  "elk.spacing.nodeNode": String(NODE.gap),
  "elk.layered.spacing.nodeNodeBetweenLayers": String(NODE.layerGap),
  "elk.spacing.edgeNode": "18",
  "elk.spacing.edgeEdge": "16",
  "elk.layered.spacing.edgeEdgeBetweenLayers": "16",
  "elk.spacing.portPort": "16",
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

/** 세로 구간(lo ≤ y ≤ hi). */
type Span = { lo: number; hi: number };
/** 겹치는 구간을 하나로 합친다(같은 틈을 두 번 벌리지 않게). */
function mergeSpans(spans: Span[]): Span[] {
  const out: Span[] = [];
  for (const sp of [...spans].sort((a, b) => a.lo - b.lo)) {
    const last = out.at(-1);
    if (last && sp.lo <= last.hi) last.hi = Math.max(last.hi, sp.hi);
    else out.push({ ...sp });
  }
  return out;
}

const cloneRun = (run: ElkRun): ElkRun => ({
  rects: new Map([...run.rects].map(([k, r]) => [k, { ...r }])),
  edges: new Map([...run.edges].map(([k, pts]) => [k, pts.map((p) => ({ ...p }))])),
});

/**
 * span 안에서 어느 노드(isNode)도 가로지르지 않는 첫 y 를 골라 그 아래를 dy 만큼 내려 틈을 넓힌다: y 보다 아래에서
 * 시작하는 상자와 선의 점은 내려가고, y 를 걸친 영역은 그만큼 길어진다. 위아래 순서가 그대로라 교차·꺾임이 바뀌지 않는다.
 * 그런 y 가 없으면 false.
 */
function openGap(run: ElkRun, span: Span, dy: number, isNode: (id: string) => boolean): boolean {
  const boxes = [...run.rects].filter(([id]) => isNode(id)).map(([, r]) => r);
  let y = Math.ceil(span.lo);
  while (y <= span.hi && boxes.some((r) => r.y - 2 < y && r.y + r.height + 2 > y)) y++;
  if (y > span.hi) return false;
  for (const r of run.rects.values()) {
    if (r.y >= y) r.y += dy;
    else if (r.y + r.height > y) r.height += dy;
  }
  for (const pts of run.edges.values()) for (const p of pts) if (p.y > y) p.y += dy;
  return true;
}

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

  // 평소 화면 이름 글자(같은 글자·같은 끝 묶음은 "<이름> ×N"): 선 id → 글자. 출구선은 없다. 묶기는 이름·끝만 보므로 배치 전에는
  // 점 자리에 길이 1 짜리 자리표를 준다.
  const restingText = new Map(
    restingLabelGroups(
      g.edges.filter((e) => e.label).map((e) => ({ id: e.id, label: e.label!, from: e.from, to: e.to, egress: e.egress, points: [{ x: 0, y: 0 }, { x: 0, y: 1 }] })),
    ).flatMap((grp) => grp.edgeIds.map((id) => [id, grp.text] as const)),
  );
  // 이름 있는 이중화 묶음 안 가로 연결(rowEdge)은 두 구성원 사이가 짧아 이름이 노드 고리에 붙는다. 그 묶음의 노드 간격을 이름 상자 폭 +
  // 양쪽 (NODE_RING + ROW_GAP) 이상으로 넓힌다(ELK 는 INCLUDE_CHILDREN 에서도 영역별 elk.spacing.nodeNode 를 따른다).
  // 구성원이 고정 노드면 넓히지 않는다(그 이름은 labelBlocked 에 들 수 있다).
  const rowSpacing = new Map<string, number>();
  for (const e of g.edges) {
    const text = restingText.get(e.id);
    if (text === undefined || !rowEdge(e.from, e.to) || pinned[e.from] || pinned[e.to]) continue;
    const box = labelBox({ text, x: 0, y: 0, anchor: "middle" });
    const need = Math.ceil(box.x2 - box.x1 + 2 * (NODE_RING + ROW_GAP)) + 1;
    const p = parentOf(e.from)!;
    rowSpacing.set(p, Math.max(rowSpacing.get(p) ?? NODE.gap, need));
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
      // root's direction and ignores a per-group direction, so the catalog's innerDirection is not passed;
      // a redundancy group's side-by-side row comes from `rowEdge` below.
      const n: ElkNode = filled.has(grp.id)
        ? {
            id: grp.id,
            layoutOptions: {
              ...BASE_OPTIONS,
              "elk.padding": GROUP_PADDING,
              ...(rowSpacing.has(grp.id) ? { "elk.spacing.nodeNode": String(rowSpacing.get(grp.id)) } : {}),
            },
            children: [],
            edges: [],
          }
        : { id: grp.id, width: g.groups[grp.id].collapsed ? collapsedGroupWidth(g.groups[grp.id].label, g.groups[grp.id].hiddenCount) : EMPTY_GROUP.width, height: EMPTY_GROUP.height };
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
  const inLane = (id: string) => laneSet.has(topOf(id));
  const cross = g.edges.filter((e) => inLane(e.from) !== inLane(e.to));
  const laneRuns = await Promise.all(laneIds.map(async (id) => ({ id, run: await runElk(new Set([id])) })));

  // 고정 노드가 없을 때만 노드를 옮기는 틈 벌리기·선 띄우기를 한다.
  const noPins = Object.keys(pinned).length === 0;
  const edgeEnds = new Map(g.edges.map((e) => [e.id, [e.from, e.to] as [string, string]]));
  const shapeBoxesOf = (rs: Map<string, Rect>) => new Map([...rs].filter(([id]) => g.nodes[id] || (g.groups[id] && !filled.has(id))));
  // 펼친(내용이 있는) 영역 상자.
  const zonesOf = (rs: Map<string, Rect>) => groups.filter((x) => filled.has(x.id)).map((x) => rs.get(x.id)!);

  // 본 흐름(main) 배치 한 벌에서 외부 열을 쌓고 모든 선을 그린다. 외부 연결 줄이 붐비면 아래에서 그 틈을 벌린
  // 본 흐름으로 다시 부른다(openGap). crowd 는 벌릴 자리(y), crowdPx 는 다른 선과 16px 미만으로 나란한 외부 연결 길이.
  type Routed = { rects: Map<string, Rect>; points: Map<string, Pt[]>; degraded: Set<string>; crowd: Span[]; crowdPx: number; score: number[] };
  // roomFor: 평소 화면 이름이 막혀 상자에서 LABEL_ROOM 떨어진 줄로 다시 그릴 외부 연결.
  const route = (base: ElkRun, roomFor: ReadonlySet<string> = new Set()): Routed => {
  const rects = new Map(base.rects);
  const points = new Map(base.edges);
  const crowd: Span[] = [];
  let crowdPx = 0;
  let laneScore: number[] = [0, 0, 0];
  const mainRight = Math.max(0, ...[...base.rects.values()].map((r) => r.x + r.width));
  if (laneIds.length > 0) {
    const laneX = mainRight + 2 * CHANNEL_MARGIN + Math.max(0, cross.length - 1) * CHANNEL_STEP;
    // Stack lane groups top→down, each near the highest main node it talks to.
    const wantY = (laneTop: string): number => {
      const ys = cross
        .flatMap((e) => (topOf(e.from) === laneTop ? [e.to] : topOf(e.to) === laneTop ? [e.from] : []))
        .map((id) => base.rects.get(id)!.y);
      return ys.length > 0 ? Math.min(...ys) : 0;
    };
    const lane = laneRuns.map(({ id, run }) => ({ id, run: cloneRun(run), want: wantY(id) }));
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
  // 외부 연결을 그린 결과(외부 열이 있을 때). 붐비는 줄 찾기에 쓴다.
  let laneRun: { routes: Map<string, Pt[]>; degraded: Set<string> } | null = null;
  // 선이 지나면 안 되는 상자: 노드와 접힌·빈 영역.
  const shapeBoxes = shapeBoxesOf(rects);

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
    const borderBands = groups.map((x) => rects.get(x.id)!).map((r) => band({ x: r.x, y: r.y + r.height }, { x: r.x + r.width, y: r.y + r.height }));
    const clear = (a: Pt, b: Pt, blockers: Rect[]): boolean => blockers.every((o) => !touches(segmentRect(a, b), o));
    const span = Math.max(...[...rects.values()].map((r) => r.y + r.height)) + NODE.layerGap;
    const inside = (v: number, a: number, b: number): boolean => v > Math.min(a, b) + 1 && v < Math.max(a, b) - 1;
    // Lane side: enter the node's left side at its centre line (crossing only its group's side border).
    // Several edges on one node spread over its height.
    const entries = new Map<string, number>();
    for (const e of cross) {
      const id = inLane(e.from) ? e.from : e.to;
      entries.set(id, (entries.get(id) ?? 0) + 1);
    }

    // 외부 연결을 모두 그린다. wide 이면 다른 선과 LINE_GAP 을 먼저 지키고, 안 되면 그 줄만 예전 간격(ROW_GAP_TIGHT)을 쓴다.
    // wide 가 아니면 예전 길찾기 그대로다(가로 간격 ROW_GAP_TIGHT, 세로 토막은 노드 가운데, 들어가는 줄 8px 간격).
    const routeLanes = (wide: boolean): { routes: Map<string, Pt[]>; degraded: Set<string> } => {
      const gaps = wide ? [LINE_GAP, ROW_GAP_TIGHT] : [ROW_GAP_TIGHT];
      const routes = new Map<string, Pt[]>();
      const failed = new Set<string>();
      // 이미 그린 선의 가로 토막과 세로 토막. 세로 토막의 nodes 는 그 선이 닿는 노드다.
      const rowsDrawn: { x1: number; x2: number; y: number }[] = [];
      const cols: { x: number; y1: number; y2: number; nodes: string[] }[] = [];
      const drawn = (pts: Pt[], nodeIds: string[]): void => {
        pts.slice(1).forEach((q, i) => {
          const p = pts[i]!;
          if (Math.abs(q.y - p.y) < 0.5 && Math.abs(q.x - p.x) > 1) rowsDrawn.push({ x1: Math.min(q.x, p.x), x2: Math.max(q.x, p.x), y: q.y });
          else if (Math.abs(q.x - p.x) < 0.5 && Math.abs(q.y - p.y) > 1) cols.push({ x: q.x, y1: Math.min(q.y, p.y), y2: Math.max(q.y, p.y), nodes: nodeIds });
        });
      };
      for (const [id, pts] of points) {
        const de = edgeById.get(id);
        drawn(pts, de ? [de.from, de.to] : []);
      }
      // 가로 토막(xa→xb, y)이 다른 선의 가로 토막과 gap 미만으로 붙지 않는지(정확히 gap 은 된다).
      const rowFree = (xa: number, xb: number, y: number, gap: number): boolean =>
        rowsDrawn.every((h) => h.x2 < Math.min(xa, xb) || h.x1 > Math.max(xa, xb) || Math.abs(h.y - y) >= gap);
      const clearRow = (a: Pt, b: Pt, gap: number): boolean => clear(a, b, obstacles) && clear(a, b, borderBands) && rowFree(a.x, b.x, a.y, gap);
      // 세로 토막(x, ya→yb)이 다른 선의 세로 토막과 LINE_GAP 이상 떨어지는지. 같은 노드(node)에 닿는 선과는 겹쳐도 된다(공유 조각).
      const colClear = (x: number, ya: number, yb: number, node: string): boolean =>
        !wide ||
        cols.every((c) => {
          if (Math.min(c.y2, Math.max(ya, yb)) - Math.max(c.y1, Math.min(ya, yb)) <= 1) return true;
          const gap = Math.abs(c.x - x);
          return gap >= LINE_GAP || (gap <= 0.5 && c.nodes.includes(node));
        });
      // 세로 토막(x, ya→yb)이 가로지르는 다른 선의 가로 토막 수와, 가로 토막(xa→xb, y)이 가로지르는 세로 토막 수
      const stubCrossings = (x: number, ya: number, yb: number): number => rowsDrawn.filter((h) => inside(x, h.x1, h.x2) && inside(h.y, ya, yb)).length;
      const runCrossings = (xa: number, xb: number, y: number): number => cols.filter((c) => inside(c.x, xa, xb) && inside(y, c.y1, c.y2)).length;

      // 세로 토막의 x 후보: 노드 가운데, 같은 노드에서 나가는 선이 이미 쓰는 세로줄(가까운 순), 그다음 가운데에서 2px 씩.
      // 가운데를 비킬 때는 통로 쪽(오른쪽)을 먼저 본다: 왼쪽으로 비키면 오른쪽으로 가는 가로 토막이 같은 노드의 가운데
      // 세로줄(그 노드의 다른 선)을 가로지른다.
      const stubXs = (id: string, m: Rect): number[] => {
        const c = m.x + m.width / 2;
        if (!wide) return [c];
        const own = cols.filter((k) => k.nodes.includes(id) && k.x > m.x && k.x < m.x + m.width && (Math.abs(k.y1 - m.y - m.height) < 0.5 || Math.abs(k.y2 - m.y) < 0.5));
        const out = [c, ...[...new Set(own.map((k) => k.x))].sort((a, b) => Math.abs(a - c) - Math.abs(b - c))];
        for (let k = 2; c - k >= m.x + 8 || c + k <= m.x + m.width - 8; k += 2) {
          if (c + k <= m.x + m.width - 8) out.push(c + k);
          if (c - k >= m.x + 8) out.push(c - k);
        }
        return out;
      };
      // Main side: the nearest row below the node (else above it) reachable by a clear vertical stub and a
      // clear horizontal run to the channel; null if there is none. 가로 토막은 다른 선의 가로 토막과 gap 이상,
      // 세로 토막은 다른 선의 세로 토막과 LINE_GAP 이상 띄운다. stub·n 은 세로 토막만의, 세로·가로 토막 모두의 교차 수.
      type Exit = { x: number; y: number; y0: number; stub: number; n: number };
      const exitRowFrom = (mainId: string, m: Rect, channelX: number, gap: number, from: number, dirs: readonly (1 | -1)[] = [1, -1]): Exit | null => {
        const xs = stubXs(mainId, m);
        for (let d = from; d <= span; d += 2) {
          for (const dir of dirs) {
            const y0 = dir === 1 ? m.y + m.height : m.y;
            const y = y0 + dir * d;
            // 이 줄에 닿는 세로 토막 자리 가운데 교차가 가장 적은 곳(같으면 앞 후보). 예전 길찾기는 가운데 하나뿐이다.
            let found: Exit | null = null;
            for (const x of xs) {
              if (!colClear(x, y0, y, mainId) || !clear({ x, y: y0 + dir * 5 }, { x, y }, obstacles) || !clearRow({ x, y }, { x: channelX, y }, gap)) continue;
              const stub = stubCrossings(x, y0, y);
              const n = stub + runCrossings(x, channelX, y);
              if (!found || n < found.n) found = { x, y, y0, stub, n };
              if (n === 0) break;
            }
            if (found) return found;
          }
        }
        return null;
      };
      // roomFor 의 연결은 이름이 노드 고리에 붙지 않게, 예전 줄(8px~)과 같은 쪽(아래·위)에서 상자와 LABEL_ROOM 이상 떨어진 줄을 먼저
      // 본다. 쪽을 바꾸면 뒤에 그리는 외부 연결과 엇갈린다. 그런 줄이 없거나 다른 선을 더 가로지르면 예전 줄을 쓴다.
      const exitRow = (e: { id: string }, mainId: string, m: Rect, channelX: number, gap: number): Exit | null => {
        const near = exitRowFrom(mainId, m, channelX, gap, 8);
        if (!near || !roomFor.has(e.id)) return near;
        const room = exitRowFrom(mainId, m, channelX, gap, LABEL_ROOM, [near.y > near.y0 ? 1 : -1]);
        return room && room.n <= near.n ? room : near;
      };
      const used = new Map<string, number>();
      const entryY = (id: string, t: Rect): number => {
        const n = entries.get(id)!;
        const k = used.get(id) ?? 0;
        used.set(id, k + 1);
        return t.y + t.height / 2 + (k - (n - 1) / 2) * Math.min(wide ? LINE_GAP : 8, (t.height - 8) / Math.max(1, n - 1));
      };
      // If something sits left of the lane node, come in from above instead: a row in the gap above its
      // lane group (only ~NODE.gap tall, so it can run out), then straight down into the node's top.
      // null if neither works. 줄마다 gaps 를 차례로 본다(LINE_GAP 이 안 되면 같은 줄을 예전 간격으로).
      const laneRoute = (laneId: string, channelX: number): Pt[] | null => {
        const t = nodeBoxes.get(laneId) ?? rects.get(laneId)!;
        const y = entryY(laneId, t);
        const others = [...nodeBoxes.entries()].filter(([id]) => id !== laneId).map(([, r]) => air(r));
        const a = { x: channelX, y };
        const b = { x: t.x - 1, y };
        if (clear(a, b, others) && clear(a, b, nameBands) && clear(a, b, borderBands)) {
          for (const gap of gaps) if (rowFree(a.x, b.x, y, gap)) return [{ x: channelX, y }, { x: t.x, y }];
        }
        const top = rects.get(topOf(laneId))!;
        const tx = t.x + t.width / 2;
        for (const gap of gaps) {
          for (let ry = top.y - 8; ry >= top.y - NODE.gap + 4; ry -= 2) {
            const colOk = gap === ROW_GAP_TIGHT || colClear(tx, ry, t.y, laneId);
            if (colOk && clearRow({ x: channelX, y: ry }, { x: tx, y: ry }, gap) && clear({ x: tx, y: ry }, { x: tx, y: t.y - 5 }, others)) {
              return [{ x: channelX, y: ry }, { x: tx, y: ry }, { x: tx, y: t.y }];
            }
          }
        }
        return null;
      };

      // 위 노드부터. 같은 높이면 통로에 가까운(오른쪽) 노드부터: 그 선이 노드 가까운 줄을 먼저 쓰고 왼쪽 노드의 선이
      // 그 아래 줄로 지나가야 오른쪽 노드의 세로 토막이 왼쪽 선을 가로지르지 않는다.
      const mainOf = (e: { from: string; to: string }) => rects.get(inLane(e.from) ? e.to : e.from)!;
      [...cross]
        .sort((a, b) => mainOf(a).y - mainOf(b).y || mainOf(b).x - mainOf(a).x)
        .forEach((e, i) => {
          const fromLane = inLane(e.from);
          const mainId = fromLane ? e.to : e.from;
          const laneId = fromLane ? e.from : e.to;
          const channelX = mainRight + CHANNEL_MARGIN + i * CHANNEL_STEP;
          // 다른 선과 LINE_GAP 이상 띄운 줄을 먼저 찾는다. 노드 사이 한 층에 외부 연결이 몰려 그 줄이 모자라면, 줄은
          // 다른 선의 가로 토막을 넘어 다음 층까지 내려가 선을 더 가로지른다. 그럴 때만 예전 간격(ROW_GAP_TIGHT)의 줄을 쓴다.
          const m = rects.get(mainId)!;
          const roomy = wide ? exitRow(e, mainId, m, channelX, LINE_GAP) : null;
          const tight = exitRow(e, mainId, m, channelX, ROW_GAP_TIGHT);
          const spilled = !!roomy && !!tight && roomy.stub > tight.stub && roomy.n > tight.n;
          const exit = roomy && !spilled ? roomy : tight; // tight 이면 이 연결의 가로 토막은 다른 선과 16px 미만으로 붙을 수 있다
          const into = exit && laneRoute(laneId, channelX);
          if (!exit || !into) {
            // Never throw on arbitrary diagrams: fall back to an elbow and flag it.
            failed.add(e.id);
            routes.set(e.id, elbowRoute(rects.get(e.from)!, rects.get(e.to)!));
            return;
          }
          const pts = [{ x: exit.x, y: exit.y0 }, { x: exit.x, y: exit.y }, { x: channelX, y: exit.y }, ...into];
          drawn(pts, [mainId]);
          routes.set(e.id, fromLane ? pts.reverse() : pts);
        });
      return { routes, degraded: failed };
    };

    // 두 가지로 그려 보고, 16px 쪽이 예전 길찾기보다 꺾은선(degraded)·상자 관통·교차 가운데 하나라도 늘면 예전 쪽을 쓴다.
    // 선이 노드를 지나거나 교차가 느는 것은 16px 규칙보다 나쁘다(16px 규칙의 정해진 예외, 기준선이 지킨다).
    const laneEnds = new Map(cross.map((e) => [e.id, [e.from, e.to] as [string, string]]));
    const segsOf = (pts: Pt[]) => pts.slice(1).map((b, i) => ({ a: pts[i]!, b }));
    const fixedSegs = [...points.values()].flatMap(segsOf);
    const score = (run: { routes: Map<string, Pt[]>; degraded: Set<string> }): number[] => {
      const lanes = [...run.routes.values()].map(segsOf);
      let n = 0;
      lanes.forEach((ls, i) => {
        for (const u of ls) {
          for (const v of fixedSegs) if (segmentsCross(u, v)) n++;
          for (const other of lanes.slice(i + 1)) for (const v of other) if (segmentsCross(u, v)) n++;
        }
      });
      return [run.degraded.size, crossings(shapeBoxes, laneEnds, run.routes).size, n];
    };
    const roomyRun = routeLanes(true);
    const oldRun = routeLanes(false);
    const [rs, os] = [score(roomyRun), score(oldRun)];
    const run = rs.every((v, i) => v <= os[i]!) ? roomyRun : oldRun;
    laneScore = run === roomyRun ? rs : os;
    for (const [id, pts] of run.routes) points.set(id, pts);
    for (const id of run.degraded) degraded.add(id);
    laneRun = run;
    // Edges between two different lane groups (rare): a plain elbow.
    for (const e of g.edges) if (!points.has(e.id)) points.set(e.id, elbowRoute(rects.get(e.from)!, rects.get(e.to)!));
  }

  if (laneRun) {
    const run = laneRun;
    // 붐비는 외부 연결 줄: 본 흐름 안의 가로 토막이 다른 선의 가로 토막과 16px 미만으로 나란하면, 그 선이 나온 노드
    // 바로 아래(위로 나갔으면 바로 위)를 벌릴 자리로 적는다. 외부 열 쪽(통로 오른쪽)은 보지 않는다. 외부 연결이 LINE_GAP 줄을
    // 못 찾아 ROW_GAP_TIGHT 로 물러선 줄이 여기 걸리면, 아래(layoutDiagram)에서 그 틈을 openGap 으로 벌려 다시 그려 보고
    // 나빠지지 않을 때만 받는다. 띄우기(separateParallels) 전에 잰다: 띄우기로 붐빔이 가려지면 교차를 줄이던 틈 벌리기가 빠진다.
    const rowsOf = (pts: Pt[]) =>
      pts.slice(1).map((b, i) => ({ a: pts[i]!, b })).filter((u) => Math.abs(u.a.y - u.b.y) < 0.5 && Math.abs(u.a.x - u.b.x) > 1);
    const others = [...points].map(([id, pts]) => ({ id, rows: rowsOf(pts) }));
    for (const id of run.routes.keys()) {
      const pts = points.get(id)!;
      if (run.degraded.has(id)) continue;
      const e = edgeById.get(id)!;
      const mainId = inLane(e.from) ? e.to : e.from;
      const m = rects.get(mainId)!;
      for (const u of rowsOf(pts)) {
        const [ua, ub] = [Math.min(u.a.x, u.b.x), Math.max(u.a.x, u.b.x)];
        if (ua >= mainRight) continue;
        let px = 0;
        const near: number[] = [u.a.y];
        for (const o of others) {
          if (o.id === id) continue;
          for (const v of o.rows) {
            const gap = Math.abs(v.a.y - u.a.y);
            if (gap <= 0.5 || gap >= LINE_GAP) continue;
            const ov = Math.min(ub, Math.max(v.a.x, v.b.x)) - Math.max(ua, Math.min(v.a.x, v.b.x));
            if (ov <= END_GAP_TRIM) continue;
            px = Math.max(px, ov);
            near.push(v.a.y);
          }
        }
        if (px === 0) continue;
        crowdPx += px;
        // 벌릴 자리: 노드와 붐비는 줄들 사이(아래로 나갔으면 노드 바닥 ~ 가장 아래 줄, 위로 나갔으면 가장 위 줄 ~ 노드 위).
        crowd.push(u.a.y > m.y + m.height ? { lo: m.y + m.height + 1, hi: Math.max(...near) - 1 } : { lo: Math.min(...near) + 1, hi: m.y - 1 });
      }
    }
  }

  // 모든 선을 그린 뒤, 서로 다른 선이 LINE_GAP 미만으로 나란한 안쪽 토막을 밀어 띄운다(노드 통과·교차가 늘면 밀지 않는다).
  // 이름 자리는 이 뒤(assemble)에서 정하고, 틈 벌리기·외부 연결 다시 그리기도 모두 route 를 거치므로 어느 배치든 띄운 뒤에 이름을 놓는다.
  // 붐빔(crowd)은 위에서 띄우기 전 모양으로 쟀다. 고정 노드가 있으면 하지 않는다(그 선은 assemble 에서 꺾은선으로 다시 그린다).
  // 펼친 영역 테두리도 넘겨, 민 선이 테두리에 붙거나 영역 밖·남의 영역으로 넘어가지 않게 한다.
  if (noPins) {
    for (const [id, pts] of separateParallels(points, edgeEnds, shapeBoxes, LINE_GAP, zonesOf(rects))) points.set(id, pts);
  }

  return { rects, points, degraded, crowd: mergeSpans(crowd), crowdPx, score: laneScore };
  };

  // 외부 연결 줄이 노드 사이 한 틈에 몰려 16px 를 못 지키면, 그 틈 아래 전체를 LINE_GAP 만큼 내려 틈을 넓히고 다시 그린다.
  // 위아래 순서는 그대로 두고 늘리기만 하므로 본 흐름 선의 교차·꺾임은 그대로다. 외부 연결이 꺾은선이 되거나 교차가
  // 늘면 받아들이지 않는다. 사용자가 옮겨 둔(고정) 노드가 있으면 그 자리와 어긋나므로 하지 않는다(noPins).
  let best = route(cloneRun(main));
  let bestBase = cloneRun(main);
  if (laneIds.length > 0 && noPins) {
    // 한 번에 LINE_GAP 씩 벌려 보고, 교차·꺾은선이 처음보다 늘지 않은 것 가운데 붐빔이 가장 적은 것을 쓴다.
    const first = best;
    let base = cloneRun(main);
    let cur = best;
    for (let round = 0; round < GAP_ROUNDS && cur.crowd.length > 0; round++) {
      const next = cloneRun(base);
      // 아래 자리부터 벌려야 위 자리의 y 가 그대로다.
      const opened = [...cur.crowd].sort((a, b) => b.lo - a.lo).filter((sp) => openGap(next, sp, LINE_GAP, (id) => !!g.nodes[id])).length;
      if (opened === 0) break;
      const cand = route(next);
      const notWorse = cand.degraded.size <= first.degraded.size && cand.score.every((v, i) => v <= first.score[i]!);
      if (!notWorse) break;
      if (cand.crowdPx < best.crowdPx) {
        best = cand;
        bestBase = next;
      }
      cur = cand;
      base = next;
    }
  }

  const groupLabels = Object.fromEntries(groups.map((x) => [x.id, x.label]));
  // 배치 한 벌(route 결과)에서 마지막 Layout 을 만든다: 고정 노드, 영역 다시 맞추기, 고정 노드 선의 꺾은선, 평소 화면 이름.
  const assemble = (routed: Routed): Layout => {
    const { rects, points } = routed;
    const degraded = new Set(routed.degraded);
    const out: Layout = { nodes: {}, groups: {}, edges: [], width: 0, height: 0, labels: [], labelBlocked: [] };
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
    const finalPts = new Map<string, Pt[]>();
    for (const e of g.edges) {
      let pts = moved(e.from) || moved(e.to) ? elbowRoute(rectOf(e.from), rectOf(e.to)) : (points.get(e.id) ?? []);
      if (pts.length < 2) {
        // ELK returned no route for this edge.
        pts = elbowRoute(rectOf(e.from), rectOf(e.to));
        degraded.add(e.id);
      }
      finalPts.set(e.id, pts);
    }
    // 고정 노드가 있으면 route 안의 띄우기가 빠졌으므로, 최종 선 위에서 한 번 더 한다(노드는 그대로, 최종 상자·영역 기준).
    if (!noPins) {
      const finalRects = new Map<string, Rect>([...Object.entries(out.nodes), ...Object.entries(out.groups)].map(([id, r]) => [id, r]));
      for (const [id, pts] of separateParallels(finalPts, edgeEnds, shapeBoxesOf(finalRects), LINE_GAP, zonesOf(finalRects))) finalPts.set(id, pts);
    }
    const items: RestingLabelInput[] = [];
    for (const e of g.edges) {
      const pts = finalPts.get(e.id)!;
      const le: LaidOutEdge = { id: e.id, points: pts };
      if (degraded.has(e.id)) le.degraded = true;
      if (e.label !== undefined) {
        const mid = pathMidpoint(pts);
        if (mid) le.labelAt = mid;
      }
      out.edges.push(le);
      if (e.label) items.push({ id: e.id, label: e.label, from: e.from, to: e.to, points: pts, egress: e.egress });
    }

    // 평소 화면 이름을 마지막 선 위에 놓는다(선 가운데부터 제 선을 따라 「지킬 것」을 지키는 첫 자리).
    const { placed, blocked } = placeRestingLabels(out, items, groupLabels);
    out.labels = placed;
    out.labelBlocked = blocked;
    for (const p of placed) {
      const le = out.edges.find((e) => e.id === p.edgeIds[0]);
      if (le) le.labelAt = { x: p.x, y: p.y };
    }

    for (const r of [...Object.values(out.nodes), ...Object.values(out.groups)]) {
      out.width = Math.max(out.width, r.x + r.width);
      out.height = Math.max(out.height, r.y + r.height);
    }
    for (const p of out.edges.flatMap((e) => e.points)) {
      out.width = Math.max(out.width, p.x);
      out.height = Math.max(out.height, p.y);
    }
    // 이름이 구성도 밖으로 나가면 그만큼 넓힌다(화면 맞춤·내보낸 그림이 이름을 자르지 않게).
    for (const p of out.labels) {
      const b = labelBox({ text: p.text, x: p.x, y: p.y, anchor: "middle" });
      out.width = Math.max(out.width, b.x2);
      out.height = Math.max(out.height, b.y2);
    }
    return out;
  };

  let out = assemble(best);
  const degradedOf = (l: Layout) => l.edges.filter((e) => e.degraded).length;
  // 외부 연결의 이름이 막혔으면(외부 열 줄이 상자 바로 곁을 지남) 그 연결만 상자에서 LABEL_ROOM 떨어진 줄로 다시 그려 본다. 막힌 이름이
  // 줄고, 노드 통과 0 이고, 교차·꺾은선·붐빔이 늘지 않을 때만 쓴다. 이름이 막히지 않은 연결은 예전 줄 그대로다.
  let roomFor: ReadonlySet<string> = new Set();
  const crossIds = new Set(cross.map((e) => e.id));
  const laneBlocked = new Set(out.labelBlocked.filter((id) => crossIds.has(id)));
  if (laneBlocked.size > 0) {
    const r = route(cloneRun(bestBase), laneBlocked);
    const cand = assemble(r);
    const ok = throughNodes(cand) === 0 && edgeCrossings(cand.edges) <= edgeCrossings(out.edges) && degradedOf(cand) <= degradedOf(out) && r.crowdPx <= best.crowdPx;
    if (ok && cand.labelBlocked.length < out.labelBlocked.length) {
      out = cand;
      roomFor = laneBlocked;
    }
  }
  // 그래도 이름을 놓을 자리가 없으면(labelBlocked) 막힌 이름 자리를 담는 가로 틈을 LINE_GAP 씩 벌려 다시 그려 본다. 노드 통과 0 이고
  // 교차·꺾은선이 처음보다 늘지 않은 것 가운데 막힌 이름이 가장 적은 것을 쓴다. 고정 노드가 있으면 하지 않는다.
  if (out.labelBlocked.length > 0 && noPins) {
    const firstCross = edgeCrossings(out.edges);
    const firstDegraded = degradedOf(out);
    let base = bestBase;
    let cur = out;
    for (let round = 0; round < GAP_ROUNDS && cur.labelBlocked.length > 0; round++) {
      const next = cloneRun(base);
      const spans = mergeSpans(cur.labels.filter((p) => cur.labelBlocked.includes(p.edgeIds[0])).map((p) => ({ lo: p.y, hi: p.y + NODE.layerGap })));
      const opened = spans.sort((a, b) => b.lo - a.lo).filter((sp) => openGap(next, sp, LINE_GAP, (id) => !!g.nodes[id])).length;
      if (opened === 0) break;
      const cand = assemble(route(next, roomFor));
      const ok = throughNodes(cand) === 0 && edgeCrossings(cand.edges) <= firstCross && degradedOf(cand) <= firstDegraded;
      if (!ok) break;
      if (cand.labelBlocked.length < out.labelBlocked.length) out = cand;
      cur = cand;
      base = next;
    }
  }
  return out;

  /** 끝점이 아닌 노드(또는 접힌·빈 영역) 상자를 지나는 (선, 상자) 수. */
  function throughNodes(l: Layout): number {
    const boxes = new Map<string, Rect>([...Object.entries(l.nodes), ...Object.entries(l.groups).filter(([id]) => !filled.has(id))]);
    return crossings(boxes, edgeEnds, new Map(l.edges.map((e) => [e.id, e.points]))).size;
  }
}

/** 서로 다른 두 선의 가로·세로 토막이 서로의 안쪽(양 끝 1px 제외)에서 만나는 점 수(layoutMetrics 의 crossings 와 같은 셈, geometry.ts). */
function edgeCrossings(edges: LaidOutEdge[]): number {
  return countCrossings(edges.map((e) => e.points));
}
