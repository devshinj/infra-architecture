import { useEffect, useMemo, useRef, useState } from "react";

import { diffStates } from "@/domain/diff";
import type { DiagramState } from "@/domain/types";

import { buildDisplayGraph, type DisplayGraph, type DisplayOptions } from "./display";
import { elbowRoute } from "./elbow";
import { layoutDiagram, type Layout } from "./layout";

export const APPEARING_MS = 600;
export const UPDATED_MS = 3000;

type Pinned = Record<string, { x: number; y: number }>;

export interface DiagramView {
  layout: Layout | null;
  /** True when the layout engine rejected; with no previous layout the canvas has nothing to draw. */
  layoutFailed: boolean;
  /** True once `layout` was computed for the current state, options and pins (false while ELK runs). */
  settled: boolean;
  display: DisplayGraph;
  /** 선택과 상관없는 배치(선택 때문에만 보이는 보조 연결 없음). 이미지 내보내기가 쓴다. */
  baseLayout: Layout | null;
  /** baseLayout 을 만든 선택과 상관없는 표시 그래프. */
  baseDisplay: DisplayGraph | null;
  appearing: Set<string>;
  updated: Set<string>;
}

/** Display graph + async ELK layout (previous layout kept until the next is ready) + change markers. */
export function useDiagramView(state: DiagramState, pinned: Pinned, opts: DisplayOptions): DiagramView {
  // Callers often pass fresh option/pinned objects every render; key on content so layout is not redone endlessly.
  const collapsedKey = JSON.stringify([...opts.collapsed].sort());
  const pinnedKey = JSON.stringify(pinned);
  const { hideAux, busSimplify, mergeDuplicates, selectedId, keepEdges, ...rest } = opts;
  const keepKey = keepEdges ? [...keepEdges].sort().join(" ") : "";
  // Positions never depend on the selection: layout is built from a selection-free display graph.
  // 흐름 단계 때문에 남긴 보조 연결(keepEdges)도 선택처럼 배치에는 넣지 않는다.
  /* eslint-disable react-hooks/exhaustive-deps */
  const layoutDisplay = useMemo(
    () => buildDisplayGraph(state, { ...rest, hideAux, busSimplify, mergeDuplicates, selectedId: null }),
    [state, hideAux, busSimplify, mergeDuplicates, collapsedKey],
  );
  const display = useMemo(
    () => buildDisplayGraph(state, opts),
    [state, hideAux, busSimplify, mergeDuplicates, selectedId, collapsedKey, keepKey],
  );
  /* eslint-enable react-hooks/exhaustive-deps */
  const [base, setBase] = useState<{ layout: Layout; display: DisplayGraph; pinnedKey: string } | null>(null);
  const baseLayout = base?.layout ?? null;
  const [layoutFailed, setLayoutFailed] = useState(false);
  const [appearing, setAppearing] = useState<Set<string>>(() => new Set());
  const [updated, setUpdated] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    let cancelled = false;
    layoutDiagram(layoutDisplay, JSON.parse(pinnedKey) as Pinned)
      .then((l) => {
        if (cancelled) return;
        setBase({ layout: l, display: layoutDisplay, pinnedKey });
        setLayoutFailed(false);
      })
      .catch((err) => {
        console.error("layout failed", err);
        if (!cancelled) setLayoutFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [layoutDisplay, pinnedKey]);

  // Edges revealed only by the selection (aux) are drawn as degraded elbows between laid-out boxes.
  const layout = useMemo<Layout | null>(() => {
    if (!baseLayout) return null;
    const have = new Set(baseLayout.edges.map((e) => e.id));
    const pairKey = (e: { from: string; to: string; edgeKind: string }) => `${e.edgeKind === "aux"}:${e.from}>${e.to}`;
    const pairs = new Set(layoutDisplay.edges.map(pairKey));
    const rect = (id: string) => baseLayout.nodes[id] ?? baseLayout.groups[id];
    const extra = display.edges.flatMap((e) => {
      if (have.has(e.id) || pairs.has(pairKey(e))) return [];
      const a = rect(e.from);
      const b = rect(e.to);
      return a && b ? [{ id: e.id, points: elbowRoute(a, b), degraded: true }] : [];
    });
    return extra.length ? { ...baseLayout, edges: [...baseLayout.edges, ...extra] } : baseLayout;
  }, [baseLayout, layoutDisplay, display]);

  const prev = useRef(state);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    if (prev.current === state) return;
    const { added, changed } = diffStates(prev.current, state);
    prev.current = state;
    const mark = (ids: Set<string>, set: typeof setAppearing, ms: number) => {
      if (ids.size === 0) return;
      set((cur) => new Set([...cur, ...ids]));
      timers.current.push(
        setTimeout(() => set((cur) => new Set([...cur].filter((id) => !ids.has(id)))), ms),
      );
    };
    mark(added, setAppearing, APPEARING_MS);
    mark(changed, setUpdated, UPDATED_MS);
  }, [state]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const settled = base !== null && base.display === layoutDisplay && base.pinnedKey === pinnedKey;
  return { layout, layoutFailed, settled, display, baseLayout, baseDisplay: base?.display ?? null, appearing, updated };
}
