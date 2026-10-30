import { applyNodeChanges, Background, ReactFlow, ReactFlowProvider, useReactFlow, useStore, type Node, type NodeChange } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { categoryOf } from "@/domain/catalog";
import { computeMissing } from "@/domain/missing";
import type { DiagramState } from "@/domain/types";
import { mergeWarnings, warningsByNode } from "@/domain/warnings";

import "./canvas.css";
import { EdgeLayerPortal } from "./EdgeLayer";
import type { GroupBoxData } from "./GroupBox";
import type { NodeCardData, NodeVisualState } from "./NodeCard";
import { outermostCollapsedAncestor, type DisplayGraph, type DisplayOptions } from "./display";
import type { Layout, Rect } from "./layout";
import { NodeMenu } from "./NodeMenu";
import { nodeTypes } from "./nodeTypes";
import { prefersReducedMotion, unionRect, useCamera, type Insets, type Viewport } from "./useCamera";
import { useDiagramView } from "./useDiagramView";

export type CanvasOptions = DisplayOptions & { hoverLabels: boolean; showMissingBadges: boolean };
export type DiffMarks = { added: Set<string>; removed: Set<string>; changed: Set<string> };
type Pinned = Record<string, { x: number; y: number }>;

export interface CanvasProps {
  state: DiagramState;
  pinned: Pinned;
  editMode: boolean;
  options: CanvasOptions;
  onOptionsChange(o: CanvasOptions): void;
  onSelect(id: string | null): void;
  onPinnedChange(p: Pinned): void;
  onAutoArrange(): void;
  /** 자동 정렬 버튼을 막는다(이력 보기·비교). 편집 모드와는 상관없다. */
  autoArrangeDisabled?: boolean;
  /** 바뀔 때마다 새 배치가 나온 뒤 화면 전체를 한 번 맞춘다(자동 정렬·대화 재정렬). */
  fitRequest?: number;
  motion: boolean;
  /** Toolbar toggles; the parent owns editMode / motion. */
  onEditModeChange(v: boolean): void;
  onMotionChange(v: boolean): void;
  /** Compare mode: ids to outline as added / removed (ghost) / changed. Only nodes are marked. */
  diffMarks?: DiffMarks;
  /** Changes when the shown diagram version/mode changes; the view is re-fitted. */
  fitKey?: string;
  /** A chat turn is assembling the diagram: the camera follows calmly (see useCamera). */
  streaming?: boolean;
  /** Pixels covered by floating panels on each side; fits frame the strip between them. */
  cameraInsets?: Insets;
  /** Right-click menu "대화에 참조 붙이기" on nodes and zones. Omit to turn the menu off. */
  onMention?(id: string): void;
  /**
   * 위치 보기: 바뀔 때마다(token) 그 노드(연결이면 양 끝)로 카메라를 옮기고 은빛 링으로 잠깐 강조한다.
   * 선택은 바꾸지 않는다. 접힌 영역 안이면 그려진 바깥 영역으로 간다.
   */
  focusRequest?: { id: string; token: number };
  /** Click on a node's missing-info badge (open the 구성 정보 card at that node). */
  onBadgeClick?(nodeId: string): void;
  /** Click on a node's warning badge (select the node → 설명 탭 주의할 점). */
  onWarnBadgeClick?(nodeId: string): void;
}

export const FAR_ZOOM = 0.6;
/** 위치 보기 강조 시간(은빛 링 2회). canvas.css 의 node-pulse 와 맞춘다. */
export const PULSE_MS = 1600;
const NO_INSETS: Insets = { left: 0, right: 0 };
const LAYOUT_FAILED_MESSAGE = "구성도를 배치하지 못했어요. 새로고침하거나 구성을 다시 확인해 주세요.";
const EMPTY_MESSAGE = "아직 구성도가 비어 있어요. 오른쪽 대화에서 만들고 싶은 서비스를 설명하거나, 샘플을 불러와 보세요.";

type ToggleKey = "hideAux" | "busSimplify" | "hoverLabels" | "mergeDuplicates" | "showMissingBadges";
const CLEANUP_TOGGLES: { key: ToggleKey; label: string }[] = [
  { key: "hideAux", label: "보조 연결 숨김" },
  { key: "busSimplify", label: "이벤트 버스 단순화" },
  { key: "hoverLabels", label: "연결 라벨: 마우스 올릴 때만" },
  { key: "mergeDuplicates", label: "중복 선 병합" },
  { key: "showMissingBadges", label: "빠진 정보 숫자" },
];

/** The id actually drawn for `id`: itself, or its outermost collapsed ancestor group. */
const drawnId = (state: DiagramState, collapsed: Set<string>, id: string | null): string | null =>
  id === null ? null : (outermostCollapsedAncestor(state, collapsed, id) ?? id);

export function Canvas(props: CanvasProps) {
  const { state, pinned, editMode, options, onOptionsChange, onAutoArrange, autoArrangeDisabled = false, motion } = props;
  const view = useDiagramView(state, pinned, options);
  const empty = Object.keys(state.nodes).length === 0 && Object.keys(state.groups).length === 0;
  const flip = (key: ToggleKey) => onOptionsChange({ ...options, [key]: !options[key] });

  return (
    <div className="canvas">
      <div className="canvas__toolbar" role="toolbar" aria-label="캔버스 도구">
        <button type="button" aria-pressed={editMode} onClick={() => props.onEditModeChange(!editMode)}>
          편집 모드
        </button>
        <button type="button" disabled={autoArrangeDisabled} onClick={onAutoArrange}>
          자동 정렬
        </button>
        <button type="button" aria-pressed={motion} onClick={() => props.onMotionChange(!motion)}>
          움직임
        </button>
        {CLEANUP_TOGGLES.map((t) => (
          <button key={t.key} type="button" aria-pressed={options[t.key]} onClick={() => flip(t.key)}>
            {t.label}
          </button>
        ))}
      </div>
      {empty ? (
        <p className="canvas__empty">{EMPTY_MESSAGE}</p>
      ) : !view.layout && view.layoutFailed ? (
        <p className="canvas__empty" role="alert">{LAYOUT_FAILED_MESSAGE}</p>
      ) : (
        view.layout && (
          <ReactFlowProvider>
            <Flow {...props} layout={view.layout} settled={view.settled} display={view.display} appearing={view.appearing} updated={view.updated} />
          </ReactFlowProvider>
        )
      )}
    </div>
  );
}

interface FlowProps extends CanvasProps {
  layout: Layout;
  settled: boolean;
  display: DisplayGraph;
  appearing: Set<string>;
  updated: Set<string>;
}

function Flow({ state, pinned, editMode, options, onOptionsChange, onSelect, onPinnedChange, motion, layout, settled, fitRequest, display, appearing, updated, diffMarks, fitKey, streaming = false, cameraInsets = NO_INSETS, focusRequest, onMention, onBadgeClick, onWarnBadgeClick }: FlowProps) {
  const far = useStore((s) => s.transform[2] < FAR_ZOOM);
  const selected = drawnId(state, options.collapsed, options.selectedId);
  const missingByNode = useMemo(() => computeMissing(state).byNode, [state]);
  const warnByNode = useMemo(() => warningsByNode(mergeWarnings(state).active), [state]);
  // 위치 보기 강조: 강조할 그려진 노드 id 와 토큰(같은 노드를 다시 눌러도 링이 처음부터 돈다).
  const [pulse, setPulse] = useState<{ ids: Set<string>; token: number } | null>(null);

  const computed = useMemo<Node[]>(() => {
    const neighbors = new Set<string>();
    if (selected !== null) {
      const selEdge = display.edges.find((e) => e.id === selected || e.sourceEdgeIds.includes(selected));
      if (selEdge) {
        neighbors.add(selEdge.from);
        neighbors.add(selEdge.to);
      } else {
        neighbors.add(selected);
        for (const e of display.edges) {
          if (e.from === selected) neighbors.add(e.to);
          if (e.to === selected) neighbors.add(e.from);
        }
      }
    }
    const toggleGroup = (id: string) => {
      const collapsed = new Set(options.collapsed);
      if (collapsed.has(id)) collapsed.delete(id);
      else collapsed.add(id);
      onOptionsChange({ ...options, collapsed });
    };
    const out: Node[] = [];
    for (const lg of Object.values(layout.groups)) {
      const g = display.groups[lg.id];
      if (!g) continue;
      const data: GroupBoxData = { label: g.label, groupKind: g.groupKind, collapsed: g.collapsed, hiddenCount: g.hiddenCount, selected: g.id === selected, onToggle: () => toggleGroup(g.id) };
      out.push({
        id: g.id,
        type: "zone",
        position: { x: lg.x, y: lg.y },
        data,
        zIndex: 0,
        draggable: false,
        selectable: false,
        width: lg.width,
        height: lg.height,
        style: { width: lg.width, height: lg.height },
      });
    }
    for (const ln of Object.values(layout.nodes)) {
      const n = display.nodes[ln.id];
      if (!n) continue;
      let visual: NodeVisualState = "normal";
      if (ln.id === selected) visual = "selected";
      else if (selected !== null && !neighbors.has(ln.id)) visual = "dimmed";
      else if (appearing.has(ln.id)) visual = "appearing";
      else if (updated.has(ln.id)) visual = "updated";
      const az = n.attrs.az;
      const diff = diffMarks?.removed.has(ln.id) ? "removed" : diffMarks?.added.has(ln.id) ? "added" : diffMarks?.changed.has(ln.id) ? "changed" : undefined;
      const data: NodeCardData = {
        label: ln.displayLabel,
        fullLabel: n.label,
        sub: ln.displaySub,
        category: categoryOf(n.kind),
        state: visual,
        ...(az !== undefined && az !== null ? { az: String(az) } : {}),
        ...(diff ? { diff } : {}),
        ...(pulse?.ids.has(ln.id) ? { pulse: pulse.token } : {}),
      };
      // 비교 모드에서는 배지를 모두 숨긴다.
      const missing = diffMarks || !options.showMissingBadges ? 0 : (missingByNode[ln.id] ?? 0);
      const warn = diffMarks ? 0 : (warnByNode[ln.id] ?? 0);
      if (missing > 0 || warn > 0) {
        data.badges = { ...(missing > 0 ? { missing } : {}), ...(warn > 0 ? { warn } : {}) };
        if (missing > 0 && onBadgeClick) data.onBadgeClick = () => onBadgeClick(ln.id);
        if (warn > 0 && onWarnBadgeClick) data.onWarnBadgeClick = () => onWarnBadgeClick(ln.id);
      }
      out.push({
        id: n.id,
        type: "infra",
        position: { x: ln.x, y: ln.y },
        data,
        zIndex: 10,
        draggable: editMode,
        width: ln.width,
        height: ln.height,
        style: { width: ln.width, height: ln.height },
      });
    }
    return out;
  }, [layout, display, selected, appearing, updated, editMode, options, onOptionsChange, diffMarks, missingByNode, warnByNode, onBadgeClick, onWarnBadgeClick, pulse]);

  const [nodes, setNodes] = useState<Node[]>(computed);
  useEffect(() => setNodes(computed), [computed]);

  // Camera: fit on board change, follow new nodes calmly while a turn streams (see useCamera).
  const { getViewport, setViewport } = useReactFlow();
  const width = useStore((s) => s.width);
  const height = useStore((s) => s.height);
  const bounds = useMemo(() => unionRect([...Object.values(layout.nodes), ...Object.values(layout.groups)]), [layout]);
  const applyViewport = useCallback((v: Viewport, o: { duration: number }) => void setViewport(v, o), [setViewport]);
  const camera = useCamera({
    boardKey: fitKey ?? "",
    rects: layout.nodes,
    bounds,
    size: { width, height },
    insets: cameraInsets,
    streaming,
    fitRequest,
    settled,
    reducedMotion: prefersReducedMotion(),
    getViewport,
    setViewport: applyViewport,
  });
  // 위치 보기. 프로그램 이동이라 onMoveStart 에 null 이벤트로 와서 사용자 이동으로 치지 않는다.
  // 다시 마운트돼도(빈 캔버스 → 그림) 이미 처리한 옛 요청으로 움직이지 않는다.
  const focusToken = focusRequest?.token;
  const handledFocus = useRef(focusToken);
  useEffect(() => {
    if (!focusRequest || handledFocus.current === focusRequest.token) return;
    handledFocus.current = focusRequest.token;
    const collapsed = options.collapsed;
    const edge = state.edges[focusRequest.id];
    const ends = edge ? [edge.from, edge.to] : [focusRequest.id];
    const ids = new Set<string>();
    const rects: Rect[] = [];
    for (const end of ends) {
      const d = drawnId(state, collapsed, end);
      const r = d === null ? undefined : (layout.nodes[d] ?? layout.groups[d]);
      if (!r || d === null) continue;
      rects.push(r);
      if (layout.nodes[d]) ids.add(d);
    }
    const target = unionRect(rects);
    if (!target) return;
    camera.focus(target);
    setPulse({ ids, token: focusRequest.token });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 새 요청(토큰)일 때만 움직인다
  }, [focusToken]);
  useEffect(() => {
    if (!pulse) return;
    const t = setTimeout(() => setPulse(null), PULSE_MS);
    return () => clearTimeout(t);
  }, [pulse]);
  const wrap = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const closeMenu = useCallback(() => {
    setMenu(null);
    wrap.current?.focus({ preventScroll: true });
  }, []);
  useEffect(() => {
    if (!onMention) setMenu(null);
  }, [onMention]);
  const onNodesChange = useCallback((changes: NodeChange[]) => setNodes((ns) => applyNodeChanges(changes, ns)), []);

  return (
    <div ref={wrap} tabIndex={-1} className="canvas__flow" data-zoom={far ? "far" : "near"}>
      <ReactFlow
        nodes={nodes}
        edges={[]}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        nodesDraggable={editMode}
        nodesConnectable={false}
        elementsSelectable
        deleteKeyCode={null}
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        onNodeClick={(_, node) => {
          if (node.type === "zone") onSelect(null);
          else if (node.type === "infra") onSelect(node.id === selected ? null : node.id);
        }}
        onPaneClick={() => onSelect(null)}
        onNodeContextMenu={(e, node) => {
          if (!onMention) return;
          e.preventDefault();
          const r = wrap.current?.getBoundingClientRect();
          setMenu({ id: node.id, x: e.clientX - (r?.left ?? 0), y: e.clientY - (r?.top ?? 0) });
        }}
        onMoveStart={(e) => {
          setMenu(null);
          camera.onMoveStart(e);
        }}
        onNodeDragStop={(_, node) => {
          if (editMode && node.type === "infra") onPinnedChange({ ...pinned, [node.id]: { x: node.position.x, y: node.position.y } });
        }}
      >
        <Background />
        <EdgeLayerPortal
          layout={layout}
          edges={display.edges}
          selectedId={selected}
          hoverLabels={options.hoverLabels}
          motion={motion}
          appearing={appearing}
          nodeCount={Object.keys(state.nodes).length}
          onSelect={onSelect}
        />
      </ReactFlow>
      {menu && onMention && <NodeMenu x={menu.x} y={menu.y} onChoose={() => onMention(menu.id)} onClose={closeMenu} />}
    </div>
  );
}
