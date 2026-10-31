import { ViewportPortal } from "@xyflow/react";
import { useEffect, useMemo, useRef, useState } from "react";

import { EDGE_KINDS } from "@/domain/catalog";

import "./edges.css";
import type { DisplayEdge } from "./display";
import { emphasisOf } from "./emphasis";
import type { Layout } from "./layout";
import { startBundleMotion, type MotionKind } from "./motion";
import { buildSegmentBundles, type Bundle } from "./segments";

export interface EdgeLayerProps {
  layout: Layout;
  edges: DisplayEdge[];
  selectedId: string | null;
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
type Pt = { x: number; y: number };

const motionOf = (kind: string) => EDGE_KINDS.find((e) => e.kind === kind)!.motion;
const toD = (pts: Pt[]) => pts.map((p, i) => `${i ? "L" : "M"} ${p.x} ${p.y}`).join(" ");

/** Open chevron (two lines) whose tip is the last point, pointing along the last non-zero step. */
function arrowD(points: Pt[]): string | null {
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
  const { size: s, spread } = ARROW;
  const f = (n: number) => Math.round(n * 100) / 100;
  return `M${f(tip.x - s * Math.cos(ang - spread))},${f(tip.y - s * Math.sin(ang - spread))} L${tip.x},${tip.y} L${f(tip.x - s * Math.cos(ang + spread))},${f(tip.y - s * Math.sin(ang + spread))}`;
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

export function EdgeLayer({ layout, edges, selectedId, hoverId, onHover, hoverLabels, motion, appearing, nodeCount, onSelect }: EdgeLayerProps) {
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
  const isFaded = (ids: string[]) => hov !== null && !ids.some((i) => hov.edges.has(i));

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

  const bundleEdgeIds = (b: Bundle) => b.segments.flatMap((s) => s.edgeIds);
  const junctionDim = (b: Bundle) => isDim(bundleEdgeIds(b));
  const junctionFaded = (b: Bundle) => isFaded(bundleEdgeIds(b));

  return (
    <svg ref={svgRef} className="edge-layer" width={layout.width} height={layout.height} aria-hidden="true">
      {bundles.map((b) => (
        <g key={b.id} data-bundle={b.id}>
          {b.segments.map((s) => {
            const appear = s.edgeIds.some((i) => appearing.has(i));
            const degraded = s.edgeIds.every((i) => laid.find((l) => l.id === i)?.degraded);
            const cls = (extra: string) => `edge-line ${extra}${appear ? " edge-line--appear" : ""}`;
            const style = appear ? ({ "--len": s.length } as React.CSSProperties) : undefined;
            return (
              <g
                key={s.key}
                className={`edge-seg${isDim(s.edgeIds) ? " edge--dim" : ""}${isFaded(s.edgeIds) ? " edge--faded" : ""}${degraded ? " edge--degraded" : ""}`}
                data-seg-shared={s.edgeIds.length > 1 ? "true" : undefined}
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
                <g data-motion-seg={s.key} />
              </g>
            );
          })}
          {b.junctions.map((j) => (
            <circle
              key={`${j.x},${j.y}`}
              className={`edge-junction${junctionDim(b) ? " edge--dim" : ""}${junctionFaded(b) ? " edge--faded" : ""}`}
              data-junction=""
              cx={j.x}
              cy={j.y}
              r={2}
            />
          ))}
        </g>
      ))}

      {laid.map((l) => {
        const e = byId.get(l.id)!;
        const d = arrowD(l.points);
        const dim = isDim([e.id]);
        const faded = isFaded([e.id]);
        const showLabel = !!e.label && !!l.labelAt && (!hoverLabels || hovered === e.id || incident.has(e.id));
        return (
          <g key={e.id} className={`edge${dim ? " edge--dim" : ""}${faded ? " edge--faded" : ""}${isSelectedEdge(e) ? " edge--selected" : ""}`} data-edge-id={e.id} data-edge-kind={e.edgeKind}>
            {d && <path className={`edge-arrow edge-arrow--${e.edgeKind}`} d={d} />}
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
