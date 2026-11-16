import type { DiagramState } from "@/domain/types";
import { buildDisplayGraph, defaultDisplayOptions, type DisplayGraph } from "./display";
import { labelViolates, type PlacedRestingLabel, type RestingLabelInput } from "./restingLabels";
import { countCrossings, END_TRIM, isHorizontal, isVertical, NAME_PX, pathSegments, rectHit, trimmedRange, zoneHeadPill, type PathSeg } from "./geometry";
import { layoutDiagram, type Layout, type Rect } from "./layout";

/** 배치 읽기 쉬움을 재는 값. 단계마다 이 값이 나빠지지 않았는지 회귀 시험이 지킨다. */
export interface LayoutMetrics {
  crossings: number; // 두 선이 서로의 안쪽에서 직각으로 만나는 점 수(양 끝 1px 제외)
  sharedPx: number; // 간격 0.5px 이하로 겹친 길이
  parallelPx: number; // 서로 다른 선이 0.5 < 간격 < minGap 으로 나란한 길이(각 선 양 끝 END_TRIM 제외)
  throughNode: number; // 끝점이 아닌 노드(또는 접힌 영역) 상자 안쪽을 지나는 선 수
  bends: number; // 꺾임 수 합
  aspect: number; // width / height
  zoneHeadCrossings: number; // 펼친 영역의 이름 알약 자리를 지나는 선 수(알약 하나당 선 하나 한 번, 그 영역이 끝점인 선 제외)
  labelViolations: number; // 평소 화면 이름 가운데 「지킬 것」을 어긴 수(labels 를 줘야 잰다)
  labelMissing: number; // 이름이 있고 출구선이 아닌데 평소 화면 이름에 빠진 선 수(labels 를 줘야 잰다)
}

// 알약 자리·상자 관통·선 끝 덜기(END_TRIM)·교차 셈은 geometry.ts 에 있다(restingLabels·separate 와 함께 쓰며 불러오기 고리를 끊는다).
// 예전 불러오는 곳을 위해 다시 내보낸다.
export { END_TRIM, NAME_PX, rectHit, zoneHeadPill };

type Seg = PathSeg;
const isV = isVertical;
const isH = isHorizontal;
const lo = (s: Seg, k: "x" | "y"): number => Math.min(s.a[k], s.b[k]);
const hi = (s: Seg, k: "x" | "y"): number => Math.max(s.a[k], s.b[k]);
const segsOf = pathSegments;

/**
 * groupLabels: 영역 id → 이름. 배치에는 영역 이름이 없어 알약 자리를 재려면 따로 받는다. 이름을 모르는 영역은
 * zoneHeadCrossings 에서 빠진다.
 * zoneHeadCrossings 는 기하로만 잰 값이다: 화면에서는 이름 알약을 연결선 위 층(ZoneNameLayer)에 그려 이 선들이 알약 뒤로 지나간다.
 */
export function measureLayout(
  layout: Layout,
  ends: Record<string, [string, string]>,
  minGap = 16,
  groupLabels?: Record<string, string>,
  labels?: { placed: PlacedRestingLabel[]; items: RestingLabelInput[] },
): LayoutMetrics {
  const E = layout.edges.map((e) => ({ id: e.id, pts: e.points, segs: segsOf(e.points) }));
  const crossings = countCrossings(E.map((e) => e.pts));
  let sharedPx = 0;
  let parallelPx = 0;
  for (let i = 0; i < E.length; i++) {
    for (let j = i + 1; j < E.length; j++) {
      for (const u of E[i].segs) {
        for (const v of E[j].segs) {
          const [ax, al] = isV(u) && isV(v) ? (["x", "y"] as const) : isH(u) && isH(v) ? (["y", "x"] as const) : [null, null];
          if (!ax || !al) continue;
          const gap = Math.abs(u.a[ax] - v.a[ax]);
          if (gap >= minGap) continue;
          if (gap <= 0.5) {
            const ov = Math.min(hi(u, al), hi(v, al)) - Math.max(lo(u, al), lo(v, al));
            if (ov > 1) sharedPx += ov;
            continue;
          }
          const ru = trimmedRange(u, al);
          const rv = trimmedRange(v, al);
          if (!ru || !rv) continue;
          const ov = Math.min(ru[1], rv[1]) - Math.max(ru[0], rv[0]);
          if (ov > 1) parallelPx += ov;
        }
      }
    }
  }

  // 노드와, 안에 아무것도 없는(접힌·빈) 영역은 상자 하나로 그려진다.
  const hasChild = new Set<string>();
  for (const x of [...Object.values(layout.nodes), ...Object.values(layout.groups)]) if (x.parent !== null) hasChild.add(x.parent);
  const boxes = new Map<string, Rect>(Object.entries(layout.nodes));
  for (const g of Object.values(layout.groups)) if (!hasChild.has(g.id)) boxes.set(g.id, g);

  let throughNode = 0;
  let bends = 0;
  for (const e of E) {
    const [f, t] = ends[e.id] ?? [];
    bends += Math.max(0, e.pts.length - 2);
    const hit = new Set<string>();
    for (const s of e.segs) for (const [id, r] of boxes) if (id !== f && id !== t && rectHit(s, r)) hit.add(id);
    throughNode += hit.size;
  }

  // 안에 무언가 있는(펼친) 영역의 이름 알약만 본다. 접힌 영역은 위 상자로 이미 센다.
  const pills: [string, Rect][] = [];
  for (const g of Object.values(layout.groups)) {
    const label = groupLabels?.[g.id];
    if (hasChild.has(g.id) && label !== undefined) pills.push([g.id, zoneHeadPill(g, label)]);
  }
  let zoneHeadCrossings = 0;
  for (const e of E) {
    const [f, t] = ends[e.id] ?? [];
    for (const [id, r] of pills) if (id !== f && id !== t && e.segs.some((s) => rectHit(s, r, 0))) zoneHeadCrossings++;
  }

  let labelViolations = 0;
  let labelMissing = 0;
  if (labels) {
    labelViolations = labelViolates(layout, groupLabels ?? {}, labels.placed).length;
    const named = new Set(labels.placed.flatMap((p) => p.edgeIds));
    labelMissing = labels.items.filter((i) => i.label && !i.egress && !named.has(i.id)).length;
  }

  return {
    crossings,
    sharedPx: Math.round(sharedPx),
    parallelPx: Math.round(parallelPx),
    throughNode,
    bends,
    aspect: layout.width / layout.height,
    zoneHeadCrossings,
    labelViolations,
    labelMissing,
  };
}

export interface MeasuredView {
  layout: Layout;
  ends: Record<string, [string, string]>; // 표시 연결의 [from, to]
  groupLabels: Record<string, string>; // 표시 영역 id → 이름
  labels: { placed: PlacedRestingLabel[]; items: RestingLabelInput[] }; // 평소 화면 이름(measureLayout 의 labels 로 넘긴다)
}

/** 표시 그래프를 배치하고, 잴 때 필요한 연결 끝·영역 이름·평소 화면 이름을 함께 돌려준다. */
export async function viewLayout(g: DisplayGraph): Promise<MeasuredView> {
  const layout = await layoutDiagram(g, {});
  const pointsOf = new Map(layout.edges.map((e) => [e.id, e.points]));
  const items: RestingLabelInput[] = g.edges
    .filter((e) => e.label)
    .map((e) => ({ id: e.id, label: e.label!, from: e.from, to: e.to, points: pointsOf.get(e.id) ?? [], egress: e.egress }));
  return {
    layout,
    ends: Object.fromEntries(g.edges.map((e) => [e.id, [e.from, e.to] as [string, string]])),
    groupLabels: Object.fromEntries(Object.values(g.groups).map((x) => [x.id, x.label])),
    labels: { placed: layout.labels, items },
  };
}

/** 기본 화면(노드 40개를 넘으면 접힌 화면)의 배치. */
export function defaultViewLayout(state: DiagramState): Promise<MeasuredView> {
  return viewLayout(buildDisplayGraph(state, defaultDisplayOptions(state)));
}
