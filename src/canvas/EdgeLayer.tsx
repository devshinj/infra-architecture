import { ViewportPortal } from "@xyflow/react";
import { useEffect, useMemo, useRef, useState } from "react";

import { EDGE_KINDS } from "@/domain/catalog";

import "./edges.css";
import type { DisplayEdge } from "./display";
import { mergedLabels } from "./edgeLabels";
import { emphasisOf } from "./emphasis";
import type { Layout, Rect } from "./layout";
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
}

const MANY_NODES = 40;
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

export function EdgeLayer({ layout, edges, selectedId, selectedRect, hoverId, onHover, hoverLabels, motion, appearing, nodeCount, onSelect }: EdgeLayerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const byId = useMemo(() => new Map(edges.map((e) => [e.id, e])), [edges]);
  const laid = useMemo(() => layout.edges.filter((e) => byId.has(e.id) && e.points.length >= 2), [layout.edges, byId]);
  const bundles = useMemo(
    () => buildSegmentBundles(laid.map((e) => ({ id: e.id, edgeKind: byId.get(e.id)!.edgeKind, points: e.points }))),
    [laid, byId],
  );

  // 선택 기준 강조(흐림 22%)와 호버 기준 강조(흐림 45%). 호버는 선택이 없을 때만.
  const sel = useMemo(() => emphasisOf(edges, selectedId), [edges, selectedId]);
  const hov = useMemo(() => (selectedId === null ? emphasisOf(edges, hoverId) : null), [edges, selectedId, hoverId]);
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

  // 노드·접힌 영역을 고르면 이어진 연결의 같은 이름을 하나로 합친다(연결을 고르거나 호버일 때는 연결마다 그대로).
  const merged = useMemo(() => {
    if (!sel || selectedId === null || !selectedRect || edges.some((e) => e.id === selectedId || e.sourceEdgeIds.includes(selectedId))) return [];
    const incidentLaid = emphLaid.map((l) => {
      const e = byId.get(l.id)!;
      return { id: l.id, points: l.points, from: e.from, to: e.to, ...(e.label ? { label: e.label } : {}), ...(l.labelAt ? { labelAt: l.labelAt } : {}) };
    });
    return mergedLabels(selectedId, selectedRect, incidentLaid).filter((p) => p.edgeIds.length > 1);
  }, [sel, selectedId, selectedRect, edges, emphLaid, byId]);
  const mergedIds = useMemo(() => new Set(merged.flatMap((p) => p.edgeIds)), [merged]);

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
        const showLabel = !!e.label && !!l.labelAt && !mergedIds.has(e.id) && shown;
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
          </g>
        );
      })}

      {/* 5. 고른 노드에 이어진 같은 이름을 하나로 합친 이름 */}
      {merged.length > 0 && (
        <g className="edge-labels-merged">
          {merged.map((p) => (
            <text key={p.edgeIds.join(" ")} className="edge-label edge-label--merged" x={p.x} y={p.y}>
              {p.text}
            </text>
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
