import { ViewportPortal } from "@xyflow/react";
import { useEffect, useMemo, useRef, useState } from "react";

import { EDGE_KINDS } from "@/domain/catalog";
import { shortLabel } from "@/domain/flows";

import "./edges.css";
import type { DisplayEdge } from "./display";
import { boundaryDotAt, labelBox, mergedLabels, stepLabels, tagSpots, type Box } from "./edgeLabels";
import { emphasisOf, type Emphasis } from "./emphasis";
import type { Layout, Rect } from "./layout";
import { textWidth } from "./text";
import { startBundleMotion, type MotionKind } from "./motion";
import { buildSegmentBundles, type Bundle } from "./segments";

export interface EdgeLayerProps {
  layout: Layout;
  edges: DisplayEdge[];
  selectedId: string | null;
  /** 고른 노드(또는 접힌 영역)의 상자. 있으면 그 노드에 이어진 같은 이름을 하나로 합쳐 그린다. */
  selectedRect?: Rect;
  /** 선택이 없을 때 마우스를 올린 노드/연결 id. 선택이 있으면 무시한다. */
  hoverId: string | null;
  /** 연결선(클릭 영역)에 마우스가 들어오면 그 id, 나가면 null. */
  onHover?(id: string | null): void;
  hoverLabels: boolean;
  motion: boolean;
  appearing: Set<string>;
  /** Number of nodes in the diagram; above 40 only bundles touching the selection animate. */
  nodeCount: number;
  /** Click on an edge's hit path selects it (by edge id); clicking the selected edge again passes null. */
  onSelect?(id: string | null): void;
  /**
   * 흐름을 보는 중이면 그 단계들(표시 연결 id 로 맞춘 것). 있으면 선택 대신 이것으로 강조하고 호버는 쓰지 않는다.
   * 같은 표시 연결에 여러 단계가 걸리면 가장 작은 번호 하나만 쓴다.
   */
  flowSteps?: { displayEdgeId: string; n: number; short: string }[];
  /** 망 경계를 넘는 표시 연결 id. 평소엔 작은 점, 고른 대상에 닿았거나 흐름 단계면 "망 넘음" 표시를 단다. */
  crossing?: ReadonlySet<string>;
  /** 접힌 영역 상자. 단계 글자·"망 넘음" 표시가 노드 상자처럼 피한다. */
  collapsedRects?: Rect[];
}

const MANY_NODES = 40;
/** 망 경계 점 반지름. */
const DOT_R = 3;
/** 망 경계 표시: 글자 크기, 알약 안쪽 좌우 여백, 높이, 알약과 전달물 글자 사이, 글자 둘레 테두리 몫. */
const TAG = { font: 11, padX: 6, height: 16, gap: 4, halo: 3 };
const TAG_PILL = "망 넘음";
const PAYLOAD_TEXT: Record<NonNullable<DisplayEdge["payload"]>, string> = { api: "API", file: "파일" };
const DIRECTION_TEXT: Record<NonNullable<DisplayEdge["direction"]>, string> = { one_way: "→", two_way: "↔" };

/** "API ↔", "파일 →", "API", "↔"; 둘 다 없으면 null. */
function tagDetail(e: DisplayEdge): string | null {
  const parts = [e.payload ? PAYLOAD_TEXT[e.payload] : null, e.direction ? DIRECTION_TEXT[e.direction] : null].filter((s): s is string => s !== null);
  return parts.length > 0 ? parts.join(" ") : null;
}
const ARROW = { size: 5, spread: 0.5 };
/** 강조 겹선의 화살표 크기. */
const EMPH_ARROW = 6.5;
/** 갈림점이 겹선 위에 있다고 보는 거리(px). */
const ON_PATH = 0.75;
type Pt = { x: number; y: number };

const motionOf = (kind: string) => EDGE_KINDS.find((e) => e.kind === kind)!.motion;
const toD = (pts: Pt[]) => pts.map((p, i) => `${i ? "L" : "M"} ${p.x} ${p.y}`).join(" ");

/** Open chevron (two lines) whose tip is the last point, pointing along the last non-zero step. */
function arrowD(points: Pt[], s: number = ARROW.size): string | null {
  const tip = points[points.length - 1];
  if (!tip) return null;
  let prev: Pt | undefined;
  for (let i = points.length - 2; i >= 0; i--) {
    if (points[i].x !== tip.x || points[i].y !== tip.y) {
      prev = points[i];
      break;
    }
  }
  if (!prev) return null;
  const ang = Math.atan2(tip.y - prev.y, tip.x - prev.x);
  const { spread } = ARROW;
  const f = (n: number) => Math.round(n * 100) / 100;
  return `M${f(tip.x - s * Math.cos(ang - spread))},${f(tip.y - s * Math.sin(ang - spread))} L${tip.x},${tip.y} L${f(tip.x - s * Math.cos(ang + spread))},${f(tip.y - s * Math.sin(ang + spread))}`;
}

/** 점 p 가 꺾은선 pts 위(ON_PATH 이내)에 있는지. */
function onPolyline(p: Pt, pts: Pt[]): boolean {
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len2 = dx * dx + dy * dy;
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2));
    if (Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy)) <= ON_PATH) return true;
  }
  return false;
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

export function EdgeLayer({ layout, edges, selectedId, selectedRect, hoverId, onHover, hoverLabels, motion, appearing, nodeCount, onSelect, flowSteps, crossing, collapsedRects }: EdgeLayerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const byId = useMemo(() => new Map(edges.map((e) => [e.id, e])), [edges]);
  const laid = useMemo(() => layout.edges.filter((e) => byId.has(e.id) && e.points.length >= 2), [layout.edges, byId]);
  const bundles = useMemo(
    () => buildSegmentBundles(laid.map((e) => ({ id: e.id, edgeKind: byId.get(e.id)!.edgeKind, points: e.points }))),
    [laid, byId],
  );

  // 흐름 단계: 표시 연결마다 가장 작은 번호 하나(설명도 그 단계 것). 번호 차례로 둔다. 배치에 없는 연결은 뺀다.
  const steps = useMemo(() => {
    if (!flowSteps) return null;
    const best = new Map<string, { displayEdgeId: string; n: number; short: string }>();
    for (const s of flowSteps) {
      if (!byId.has(s.displayEdgeId)) continue;
      const cur = best.get(s.displayEdgeId);
      if (!cur || s.n < cur.n) best.set(s.displayEdgeId, s);
    }
    return [...best.values()].sort((a, b) => a.n - b.n);
  }, [flowSteps, byId]);
  const stepIds = useMemo(() => new Set(steps?.map((s) => s.displayEdgeId) ?? []), [steps]);

  // 선택 기준 강조(흐림 22%)와 호버 기준 강조(흐림 45%). 호버는 선택이 없을 때만.
  // 흐름을 보는 동안은 흐름 단계가 선택 강조 자리를 쓰고(같은 겹선·빛), 호버는 쓰지 않는다.
  // 단계는 이미 표시 연결 id 로 맞춰 와 있으므로 연결 집합만 쓴다(노드 흐림은 Canvas 가 한다).
  const sel = useMemo<Emphasis | null>(() => (steps ? { nodes: new Set(), edges: stepIds } : emphasisOf(edges, selectedId)), [edges, selectedId, steps, stepIds]);
  const hov = useMemo(() => (selectedId === null && !steps ? emphasisOf(edges, hoverId) : null), [edges, selectedId, hoverId, steps]);
  const incident = useMemo(() => sel?.edges ?? new Set<string>(), [sel]);
  const isSelectedEdge = (e: DisplayEdge) => selectedId !== null && (e.id === selectedId || e.sourceEdgeIds.includes(selectedId));
  const isDim = (ids: string[]) => sel !== null && !ids.some((i) => sel.edges.has(i));
  // 고른 동안 이어진 선이 지나는 바닥은 겹선 아래로 흐린다(움직임은 따로 남는다).
  const isUnder = (ids: string[]) => sel !== null && ids.some((i) => sel.edges.has(i));
  // 새로 그려지는 선은 흐리지 않는다.
  const isFaded = (ids: string[]) => hov !== null && !ids.some((i) => hov.edges.has(i) || appearing.has(i));

  // 강조 겹선을 그릴 표시 연결: 고르면 고른 쪽, 아니면 호버 쪽. 배치에 있는 것만.
  const emphMode: "select" | "hover" | null = sel ? "select" : hov ? "hover" : null;
  const emphSet = sel?.edges ?? hov?.edges ?? null;
  const emphLaid = useMemo(() => (emphSet ? laid.filter((l) => emphSet.has(l.id)) : []), [laid, emphSet]);

  // 노드·접힌 영역을 고르면 이어진 연결의 같은 이름을 하나로 합치고, 이름끼리·노드와 겹치지 않게 둔다
  // (연결을 고르거나 호버일 때는 연결마다 그대로). 따로 그리는 것은 합친 이름과 제자리에서 비킨 하나뿐인 이름이다.
  const merged = useMemo(() => {
    if (steps || !sel || selectedId === null || !selectedRect || edges.some((e) => e.id === selectedId || e.sourceEdgeIds.includes(selectedId))) return [];
    const incidentLaid = emphLaid.map((l) => {
      const e = byId.get(l.id)!;
      return { id: l.id, points: l.points, from: e.from, to: e.to, ...(e.label ? { label: e.label } : {}), ...(l.labelAt ? { labelAt: l.labelAt } : {}) };
    });
    return mergedLabels(selectedId, selectedRect, incidentLaid)
      .map((p) => {
        const at = layout.edges.find((l) => l.id === p.edgeIds[0])?.labelAt;
        // mergedLabels 는 좌표를 0.01 로 반올림하므로 그보다 작은 차이는 제자리로 본다.
        const off = (a: number, b: number) => Math.abs(a - b) > 0.01;
        return { ...p, moved: p.edgeIds.length === 1 && (!at || off(at.x, p.x) || off(at.y, p.y)) };
      })
      .filter((p) => p.edgeIds.length > 1 || p.moved);
  }, [steps, sel, selectedId, selectedRect, edges, emphLaid, byId, layout.edges]);
  const mergedIds = useMemo(() => new Set(merged.flatMap((p) => p.edgeIds)), [merged]);

  // 망 경계 점: 경계를 넘는 연결의 가운데(이름 자리, 없으면 선 가운데). 이름이 있으면 이름 글자 옆으로 비킨다.
  const dots = useMemo(() => {
    const out = new Map<string, Pt>();
    if (!crossing || crossing.size === 0) return out;
    for (const l of laid) {
      if (!crossing.has(l.id)) continue;
      const at = boundaryDotAt(l.points, DOT_R, l.labelAt, byId.get(l.id)!.label);
      if (at) out.set(l.id, at);
    }
    return out;
  }, [crossing, laid, byId]);
  const dotBoxes = useMemo<Box[]>(() => [...dots.values()].map((p) => ({ x1: p.x - DOT_R, y1: p.y - DOT_R, x2: p.x + DOT_R, y2: p.y + DOT_R })), [dots]);
  const nodeRects = useMemo(() => [...Object.values(layout.nodes), ...(collapsedRects ?? [])], [layout.nodes, collapsedRects]);

  // 흐름 단계 글자 "n. 짧은 설명": 서로·노드·경계 점과 겹치지 않게 제 선을 따라 비키고, 자리가 없으면 번호만.
  const stepPlaced = useMemo(() => {
    if (!steps) return [];
    const items = steps.flatMap((s) => {
      const l = laid.find((x) => x.id === s.displayEdgeId);
      if (!l) return [];
      const short = shortLabel(s.short.trim());
      return [{ text: short ? `${s.n}. ${short}` : `${s.n}`, points: l.points, ...(l.labelAt ? { labelAt: l.labelAt } : {}), id: s.displayEdgeId }];
    });
    return stepLabels(items, nodeRects, dotBoxes);
  }, [steps, laid, nodeRects, dotBoxes]);

  // "망 넘음" 표시: 흐름을 보는 중이면 단계 연결, 아니면 고른 대상에 닿은 연결 가운데 경계를 넘는 것.
  const tags = useMemo(() => {
    const on = steps ? [...stepIds] : selectedId !== null && sel ? [...sel.edges] : [];
    const items = on.flatMap((id) => {
      const l = laid.find((x) => x.id === id);
      if (!l || !dots.has(id)) return [];
      const detail = tagDetail(byId.get(id)!);
      const pill = textWidth(TAG_PILL, TAG.font) + 2 * TAG.padX;
      const width = pill + (detail ? TAG.gap + textWidth(detail, TAG.font) + TAG.halo : 0);
      return [{ text: TAG_PILL, width, height: TAG.height, points: l.points, labelAt: dots.get(id)!, id, pill, detail }];
    });
    // 고른 동안 보이는 연결 이름(제자리 이름·합친 이름)도 가리지 않는다.
    const shownNames: Box[] = [];
    if (!steps && sel) {
      for (const l of laid) {
        const e = byId.get(l.id)!;
        if (sel.edges.has(l.id) && e.label && l.labelAt && !mergedIds.has(l.id)) shownNames.push(labelBox({ text: e.label, x: l.labelAt.x, y: l.labelAt.y, anchor: "middle" }));
      }
      for (const p of merged) shownNames.push(labelBox(p));
    }
    const spots = tagSpots(items, nodeRects, stepPlaced, [...dotBoxes, ...shownNames]);
    return items.map((it, i) => ({ id: it.id, pill: it.pill, width: it.width, detail: it.detail, x: spots[i].x, y: spots[i].y }));
  }, [steps, stepIds, selectedId, sel, laid, dots, byId, nodeRects, stepPlaced, dotBoxes, merged, mergedIds]);

  // Which bundles animate. Over 40 nodes only the ones touching the selection; with fewer, every bundle animates.
  const restrictTo = nodeCount > MANY_NODES ? incident : null;
  const active = useMemo(
    () =>
      motion
        ? bundles.filter((b) => !restrictTo || b.segments.some((s) => s.edgeIds.some((i) => restrictTo.has(i))))
        : [],
    [bundles, motion, restrictTo],
  );

  // Restart the lights only when geometry, timing or the active set really change, not when the
  // parent hands us new but equal arrays.
  const activeRef = useRef(active);
  activeRef.current = active;
  const signature = active
    .map((b) => `${b.id}@${b.periodMs}/${b.offsetMs}:${b.segments.map((s) => `${s.key}=${s.d}#${s.startMs}~${s.edgeKind}`).join(";")}`)
    .join("|");

  useEffect(() => {
    const svg = svgRef.current;
    const bs = activeRef.current;
    if (!svg || bs.length === 0 || prefersReducedMotion()) return;
    const stops: Array<() => void> = [];
    for (const b of bs) {
      const kinds = new Set<MotionKind>();
      for (const s of b.segments) {
        const m = motionOf(s.edgeKind);
        if (m !== "none") kinds.add(m);
      }
      for (const k of kinds) stops.push(startBundleMotion(svg, b, k));
    }
    return () => stops.forEach((stop) => stop());
  }, [signature]);

  const isDegraded = (ids: string[]) => ids.every((i) => laid.find((l) => l.id === i)?.degraded);
  const bundleEdgeIds = (b: Bundle) => b.segments.flatMap((s) => s.edgeIds);
  // 고른 동안 갈림점은 겹선의 점 위에 있을 때만 흐리지 않는다.
  const junctionDim = (j: Pt) => sel !== null && !emphLaid.some((l) => onPolyline(j, l.points));
  const junctionFaded = (b: Bundle) => isFaded(bundleEdgeIds(b));

  return (
    <svg ref={svgRef} className="edge-layer" width={layout.width} height={layout.height} aria-hidden="true">
      {/* 1. 바닥: 묶음·조각·갈림점 */}
      <g className="edge-base">
        {bundles.map((b) => (
          <g key={b.id} data-bundle={b.id}>
            {b.segments.map((s) => {
              const appear = s.edgeIds.some((i) => appearing.has(i));
              const degraded = isDegraded(s.edgeIds);
              const cls = (extra: string) => `edge-line ${extra}${appear ? " edge-line--appear" : ""}`;
              const style = appear ? ({ "--len": s.length } as React.CSSProperties) : undefined;
              return (
                <g
                  key={s.key}
                  className={`edge-seg${isDim(s.edgeIds) ? " edge--dim" : ""}${isUnder(s.edgeIds) ? " edge--under" : ""}${isFaded(s.edgeIds) ? " edge--faded" : ""}${degraded ? " edge--degraded" : ""}`}
                  data-seg-shared={s.edgeIds.length > 1 ? "true" : undefined}
                  data-edge-ids={s.edgeIds.join(" ")}
                  data-edge-kind={s.edgeKind}
                >
                  <path className={cls(`edge-line--${s.edgeKind}`)} d={s.d} style={style} />
                  {s.edgeKind === "replication" && (
                    <path
                      className={cls("edge-line--replication-core")}
                      d={s.d}
                      style={{ ...style, stroke: "var(--bg-canvas)" }}
                    />
                  )}
                </g>
              );
            })}
            {b.junctions.map((j) => (
              <circle
                key={`${j.x},${j.y}`}
                className={`edge-junction${junctionDim(j) ? " edge--dim" : ""}${junctionFaded(b) ? " edge--faded" : ""}`}
                data-junction=""
                cx={j.x}
                cy={j.y}
                r={2}
              />
            ))}
          </g>
        ))}
      </g>

      {/* 2. 강조 겹선: 이어진 표시 연결마다 하나, 제 종류 모양 그대로 굵게 */}
      {emphMode && emphLaid.length > 0 && (
        <g className="edge-emph" data-mode={emphMode}>
          {emphLaid.map((l) => {
            const kind = byId.get(l.id)!.edgeKind;
            const d = toD(l.points);
            const arrow = arrowD(l.points, EMPH_ARROW);
            return (
              <g key={l.id} data-emph-edge={l.id}>
                {emphMode === "select" && <path className="edge-emph__glow" d={d} />}
                <path className={`edge-emph__line edge-line edge-line--${kind}`} d={d} />
                {kind === "replication" && <path className="edge-emph__core edge-line edge-line--replication-core" d={d} />}
                {arrow && <path className={`edge-emph__arrow edge-arrow edge-arrow--${kind}`} d={arrow} />}
              </g>
            );
          })}
        </g>
      )}

      {/* 3. 움직임: 조각마다 하나. 흐림은 바닥과 같되 이어진 선이 지나는 조각은 흐리지 않는다. */}
      <g className="edge-motion">
        {bundles.flatMap((b) =>
          b.segments.map((s) => (
            <g
              key={s.key}
              className={`edge-motion__seg${isDim(s.edgeIds) ? " edge--dim" : ""}${isFaded(s.edgeIds) ? " edge--faded" : ""}${isDegraded(s.edgeIds) ? " edge--degraded" : ""}`}
              data-motion-seg={s.key}
            />
          )),
        )}
      </g>

      {/* 4. 연결마다 화살표·누르는 자리·이름 */}
      {laid.map((l) => {
        const e = byId.get(l.id)!;
        const d = arrowD(l.points);
        const dim = isDim([e.id]);
        const faded = isFaded([e.id]);
        // 겹선 화살표가 있는 연결(선택·호버 모두)의 바닥 화살표는 그 아래로 흐린다.
        const arrowUnder = emphLaid.some((x) => x.id === e.id);
        // 고른 동안 이어지지 않은 선의 이름은 마우스를 올렸을 때만 보인다(흐린 선에 같은 이름이 남지 않게).
        // 합친 이름에 들어간 선은 따로 그리지 않는다.
        const shown = incident.has(e.id) || (sel ? hoverLabels && hovered === e.id : !hoverLabels || hovered === e.id);
        // 흐름을 보는 동안 단계 연결은 제 이름 대신 단계 글자를 단다.
        const showLabel = !!e.label && !!l.labelAt && !mergedIds.has(e.id) && !stepIds.has(e.id) && shown;
        const dot = dots.get(e.id);
        return (
          <g key={e.id} className={`edge${dim ? " edge--dim" : ""}${faded ? " edge--faded" : ""}${isSelectedEdge(e) ? " edge--selected" : ""}`} data-edge-id={e.id} data-edge-kind={e.edgeKind}>
            {d && <path className={`edge-arrow edge-arrow--${e.edgeKind}${arrowUnder ? " edge--under" : ""}`} d={d} />}
            <path
              className="edge-hit"
              d={toD(l.points)}
              onClick={(ev) => {
                ev.stopPropagation();
                onSelect?.(isSelectedEdge(e) ? null : e.id);
              }}
              onMouseEnter={() => {
                setHovered(e.id);
                onHover?.(e.id);
              }}
              onMouseLeave={() => {
                setHovered((h) => (h === e.id ? null : h));
                onHover?.(null);
              }}
            />
            {showLabel && (
              <text className="edge-label" x={l.labelAt!.x} y={l.labelAt!.y}>
                {e.label}
              </text>
            )}
            {/* 망 경계 점: 평소 모습이라 내보낸 그림에도 남는다. 이름 글자보다 위에 그린다. */}
            {dot && <circle className="edge-boundary-dot" cx={dot.x} cy={dot.y} r={DOT_R} />}
          </g>
        );
      })}

      {/* 5. 고른 노드에 이어진 같은 이름을 하나로 합친 이름, 겹쳐서 제자리에서 비킨 이름 */}
      {merged.length > 0 && (
        <g className="edge-labels-merged">
          {merged.map((p) => (
            // .edge-label 의 text-anchor(middle)를 이기도록 인라인으로 준다.
            <text key={p.edgeIds.join(" ")} className={`edge-label ${p.moved ? "edge-label--moved" : "edge-label--merged"}`} x={p.x} y={p.y} data-anchor={p.anchor} style={{ textAnchor: p.anchor }}>
              {p.text}
            </text>
          ))}
        </g>
      )}

      {/* 6. 흐름 단계 글자 "n. 짧은 설명"(화면 장치: 내보내기에서 걷는다) */}
      {stepPlaced.length > 0 && (
        <g className="edge-steps">
          {stepPlaced.map((p) => (
            <text key={p.edgeIds[0]} className="edge-step-label" x={p.x} y={p.y} data-step-edge={p.edgeIds[0]}>
              {p.text}
            </text>
          ))}
        </g>
      )}

      {/* 7. "망 넘음" 표시: 알약 + 전달물·방향(화면 장치: 내보내기에서 걷는다) */}
      {tags.length > 0 && (
        <g className="edge-boundary-tags">
          {tags.map((t) => (
            <g key={t.id} className="edge-boundary-tag" data-tag-edge={t.id} transform={`translate(${t.x - t.width / 2} ${t.y})`}>
              <rect className="edge-boundary-tag__pill" x={0} y={-TAG.height / 2} width={t.pill} height={TAG.height} rx={TAG.height / 2} />
              <text className="edge-boundary-tag__pill-text" x={t.pill / 2} y={0}>
                {TAG_PILL}
              </text>
              {t.detail && (
                <text className="edge-boundary-tag__detail" x={t.pill + TAG.gap} y={0}>
                  {t.detail}
                </text>
              )}
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}

/** EdgeLayer inside React Flow's viewport so it pans and zooms with the nodes. */
export function EdgeLayerPortal(props: EdgeLayerProps) {
  return (
    <ViewportPortal>
      <EdgeLayer {...props} />
    </ViewportPortal>
  );
}
