import { ViewportPortal } from "@xyflow/react";
import { useEffect, useMemo, useRef, useState } from "react";

import { EDGE_KINDS } from "@/domain/catalog";

import "./edges.css";
import type { DisplayEdge } from "./display";
import type { Layout } from "./layout";
import { startBundleMotion, type MotionKind } from "./motion";
import { buildSegmentBundles, type Bundle } from "./segments";

export interface EdgeLayerProps {
  layout: Layout;
  edges: DisplayEdge[];
  selectedId: string | null;
  hoverLabels: boolean;
  motion: boolean;
  appearing: Set<string>;
  /** Number of nodes in the diagram; above 40 only bundles touching the selection animate. */
  nodeCount: number;
  /** Click on an edge's hit path selects it (by edge id). */
  onSelect?(id: string): void;
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

export function EdgeLayer({ layout, edges, selectedId, hoverLabels, motion, appearing, nodeCount, onSelect }: EdgeLayerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const byId = useMemo(() => new Map(edges.map((e) => [e.id, e])), [edges]);
  const laid = useMemo(() => layout.edges.filter((e) => byId.has(e.id) && e.points.length >= 2), [layout.edges, byId]);
  const bundles = useMemo(
    () => buildSegmentBundles(laid.map((e) => ({ id: e.id, edgeKind: byId.get(e.id)!.edgeKind, points: e.points }))),
    [laid, byId],
  );

  const incident = useMemo(() => {
    const s = new Set<string>();
    const selEdge = selectedId === null ? undefined : edges.find((e) => e.id === selectedId || e.sourceEdgeIds.includes(selectedId));
    if (selEdge) s.add(selEdge.id);
    else if (selectedId !== null) for (const e of edges) if (e.from === selectedId || e.to === selectedId) s.add(e.id);
    return s;
  }, [edges, selectedId]);
  const isSelectedEdge = (e: DisplayEdge) => selectedId !== null && (e.id === selectedId || e.sourceEdgeIds.includes(selectedId));
  const isDim = (ids: string[]) => selectedId !== null && !ids.some((i) => incident.has(i));

  // Which bundles animate. Over 40 nodes only the ones touching the selection; 
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

  const junctionDim = (b: Bundle) => isDim(b.segments.flatMap((s) => s.edgeIds));

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
                className={`edge-seg${isDim(s.edgeIds) ? " edge--dim" : ""}${degraded ? " edge--degraded" : ""}`}
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
              className={`edge-junction${junctionDim(b) ? " edge--dim" : ""}`}
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
        const showLabel = !!e.label && !!l.labelAt && (!hoverLabels || hovered === e.id || incident.has(e.id));
        return (
          <g key={e.id} className={`edge${dim ? " edge--dim" : ""}${isSelectedEdge(e) ? " edge--selected" : ""}`} data-edge-id={e.id} data-edge-kind={e.edgeKind}>
            {d && <path className={`edge-arrow edge-arrow--${e.edgeKind}`} d={d} />}
            <path
              className="edge-hit"
              d={toD(l.points)}
              onClick={(ev) => {
                ev.stopPropagation();
                onSelect?.(e.id);
              }}
              onMouseEnter={() => setHovered(e.id)}
              onMouseLeave={() => setHovered((h) => (h === e.id ? null : h))}
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
