import { applyNodeChanges, Background, ReactFlow, ReactFlowProvider, useStore, type Node, type NodeChange } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useMemo, useState } from "react";

import { categoryOf } from "@/domain/catalog";
import type { DiagramState } from "@/domain/types";

import "./canvas.css";
import { EdgeLayerPortal } from "./EdgeLayer";
import type { GroupBoxData } from "./GroupBox";
import type { NodeCardData, NodeVisualState } from "./NodeCard";
import { outermostCollapsedAncestor, type DisplayGraph, type DisplayOptions } from "./display";
import type { Layout } from "./layout";
import { nodeTypes } from "./nodeTypes";
import { useDiagramView } from "./useDiagramView";

export type CanvasOptions = DisplayOptions & { hoverLabels: boolean };
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
  motion: boolean;
  /** Toolbar toggles; the parent owns editMode / motion. */
  onEditModeChange(v: boolean): void;
  onMotionChange(v: boolean): void;
}

export const FAR_ZOOM = 0.6;
const EMPTY_MESSAGE = "아직 구성도가 비어 있어요. 오른쪽 대화에서 만들고 싶은 서비스를 설명하거나, 샘플을 불러와 보세요.";

type ToggleKey = "hideAux" | "busSimplify" | "hoverLabels" | "mergeDuplicates";
const CLEANUP_TOGGLES: { key: ToggleKey; label: string }[] = [
  { key: "hideAux", label: "보조 연결 숨김" },
  { key: "busSimplify", label: "이벤트 버스 단순화" },
  { key: "hoverLabels", label: "연결 라벨: 마우스 올릴 때만" },
  { key: "mergeDuplicates", label: "중복 선 병합" },
];

/** The id actually drawn for `id`: itself, or its outermost collapsed ancestor group. */
const drawnId = (state: DiagramState, collapsed: Set<string>, id: string | null): string | null =>
  id === null ? null : (outermostCollapsedAncestor(state, collapsed, id) ?? id);

export function Canvas(props: CanvasProps) {
  const { state, pinned, editMode, options, onOptionsChange, onAutoArrange, motion } = props;
  const view = useDiagramView(state, pinned, options);
  const empty = Object.keys(state.nodes).length === 0 && Object.keys(state.groups).length === 0;
  const flip = (key: ToggleKey) => onOptionsChange({ ...options, [key]: !options[key] });

  return (
    <div className="canvas">
      <div className="canvas__toolbar" role="toolbar" aria-label="캔버스 도구">
        <button type="button" aria-pressed={editMode} onClick={() => props.onEditModeChange(!editMode)}>
          편집 모드
        </button>
        <button type="button" disabled={!editMode} onClick={onAutoArrange}>
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
      ) : (
        view.layout && (
          <ReactFlowProvider>
            <Flow {...props} layout={view.layout} display={view.display} appearing={view.appearing} updated={view.updated} />
          </ReactFlowProvider>
        )
      )}
    </div>
  );
}

interface FlowProps extends CanvasProps {
  layout: Layout;
  display: DisplayGraph;
  appearing: Set<string>;
  updated: Set<string>;
}

function Flow({ state, pinned, editMode, options, onOptionsChange, onSelect, onPinnedChange, motion, layout, display, appearing, updated }: FlowProps) {
  const far = useStore((s) => s.transform[2] < FAR_ZOOM);
  const selected = drawnId(state, options.collapsed, options.selectedId);

  const computed = useMemo<Node[]>(() => {
    const neighbors = new Set<string>();
    if (selected !== null) {
      neighbors.add(selected);
      for (const e of display.edges) {
        if (e.from === selected) neighbors.add(e.to);
        if (e.to === selected) neighbors.add(e.from);
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
      const data: NodeCardData = {
        label: ln.displayLabel,
        fullLabel: n.label,
        sub: ln.displaySub,
        category: categoryOf(n.kind),
        state: visual,
        ...(az !== undefined && az !== null ? { az: String(az) } : {}),
      };
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
  }, [layout, display, selected, appearing, updated, editMode, options, onOptionsChange]);

  const [nodes, setNodes] = useState<Node[]>(computed);
  useEffect(() => setNodes(computed), [computed]);
  const onNodesChange = useCallback((changes: NodeChange[]) => setNodes((ns) => applyNodeChanges(changes, ns)), []);

  return (
    <div className="canvas__flow" data-zoom={far ? "far" : "near"}>
      <ReactFlow
        nodes={nodes}
        edges={[]}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        nodesDraggable={editMode}
        nodesConnectable={false}
        elementsSelectable
        deleteKeyCode={null}
        fitView
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        onNodeClick={(_, node) => {
          if (node.type === "infra") onSelect(node.id);
        }}
        onPaneClick={() => onSelect(null)}
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
        />
      </ReactFlow>
    </div>
  );
}
