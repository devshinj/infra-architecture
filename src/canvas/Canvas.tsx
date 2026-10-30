import { applyNodeChanges, Background, ReactFlow, ReactFlowProvider, useReactFlow, useStore, type Node, type NodeChange } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";

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
  /** 빈 화면의 `샘플 불러오기` 목록. 비었거나 onImportSample 이 없으면 버튼을 그리지 않는다. */
  samples?: { id: string; title: string }[];
  onImportSample?(sampleId: string): void;
  importing?: boolean;
  /**
   * 배치가 끝날 때마다(settled) 노드의 화면 중심을 묻는 함수를 넘긴다(대화의 빛점 도착점).
   * 접힌 영역 안이거나 보이는 캔버스 띠(패널이 가린 곳 제외) 밖이면 null. 함수는 늘 최신 배치·카메라로 계산한다.
   */
  onPlaced?(locate: (id: string) => { x: number; y: number } | null): void;
}

export const FAR_ZOOM = 0.6;
/** 위치 보기 강조 시간(은빛 링 2회). canvas.css 의 node-pulse 와 맞춘다. */
export const PULSE_MS = 1600;
const NO_INSETS: Insets = { left: 0, right: 0 };
const LAYOUT_FAILED_MESSAGE = "구성도를 배치하지 못했어요. 새로고침하거나 구성을 다시 확인해 주세요.";
const EMPTY_MESSAGE = "아직 구성도가 비어 있어요. 오른쪽 대화에서 만들고 싶은 서비스를 설명해 보세요.";

type ToggleKey = "hideAux" | "busSimplify" | "hoverLabels" | "mergeDuplicates" | "showMissingBadges";
/** `보기` 팝오버의 옵션. 내부 키는 그대로이고 표시 문구만 사용자 말로 쓴다. */
const VIEW_OPTIONS: { key: ToggleKey; label: string; desc: string }[] = [
  { key: "hideAux", label: "보조 연결 숨기기", desc: "관리·모니터링 선을 감춰요" },
  { key: "busSimplify", label: "메시지 연결 단순화", desc: "큐·스트림을 거치는 연결을 묶어서 보여요" },
  { key: "mergeDuplicates", label: "중복 연결 합치기", desc: "같은 두 곳 사이의 여러 선을 하나로 보여요" },
  { key: "hoverLabels", label: "연결 이름은 마우스를 올릴 때만", desc: "캔버스를 깔끔하게 보여요" },
  { key: "showMissingBadges", label: "빠진 정보 숫자", desc: "노드마다 채워야 할 정보 개수를 보여요" },
];

/** The id actually drawn for `id`: itself, or its outermost collapsed ancestor group. */
const drawnId = (state: DiagramState, collapsed: Set<string>, id: string | null): string | null =>
  id === null ? null : (outermostCollapsedAncestor(state, collapsed, id) ?? id);

/**
 * 버튼 + 팝오버 공통 동작: 열면 첫 항목에 포커스, Esc 는 닫고 포커스를 버튼으로 돌리며, 바깥 누름은 닫는다.
 * 샘플 불러오기와 보기 옵션이 함께 쓴다.
 */
function usePopover(firstItem: string) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    root.current?.querySelector<HTMLElement>(firstItem)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      trigger.current?.focus();
    };
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as globalThis.Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open, firstItem]);
  return { open, setOpen, root, trigger };
}

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const Icon = ({ children }: { children: React.ReactNode }) => (
  <svg className="canvas__tool-icon" width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" focusable="false" {...stroke}>
    {children}
  </svg>
);
const IconEye = () => <Icon><path d="M1.5 8s2.4-4.5 6.5-4.5S14.5 8 14.5 8 12.1 12.5 8 12.5 1.5 8 1.5 8Z" /><circle cx="8" cy="8" r="1.8" /></Icon>;
const IconMove = () => <Icon><path d="M8 1.5v13M1.5 8h13M8 1.5 6.2 3.3M8 1.5l1.8 1.8M8 14.5l-1.8-1.8M8 14.5l1.8-1.8M1.5 8l1.8-1.8M1.5 8l1.8 1.8M14.5 8l-1.8-1.8M14.5 8l-1.8 1.8" /></Icon>;
const IconArrange = () => <Icon><rect x="2" y="2" width="5" height="4" rx="1" /><rect x="9" y="2" width="5" height="4" rx="1" /><rect x="5.5" y="10" width="5" height="4" rx="1" /><path d="M4.5 6v2h7V6M8 8v2" /></Icon>;
const IconFit = () => <Icon><path d="M2 5.5V2h3.5M10.5 2H14v3.5M14 10.5V14h-3.5M5.5 14H2v-3.5" /></Icon>;
const IconFlow = () => <Icon><path d="M1.5 8h3l2-4 3 8 2-4h3" /></Icon>;
const IconChevron = () => <svg className="canvas__tool-chevron" width="8" height="8" viewBox="0 0 8 8" aria-hidden="true" focusable="false" {...stroke}><path d="M1.5 3 4 5.5 6.5 3" /></svg>;

/** `보기 ▾`: 누르면 `보기 옵션` 팝오버가 열린다. 항목마다 체크와 한 줄 설명. */
function ViewMenu({ options, onFlip }: { options: CanvasOptions; onFlip(key: ToggleKey): void }) {
  const { open, setOpen, root, trigger } = usePopover('input[type="checkbox"]');
  return (
    <div ref={root} className="canvas__view">
      <button ref={trigger} type="button" className="canvas__tool" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <IconEye />
        <span>보기</span>
        <IconChevron />
      </button>
      {open && (
        <div className="canvas__pop" role="dialog" aria-label="보기 옵션">
          {VIEW_OPTIONS.map((o) => (
            <label key={o.key} className="canvas__opt">
              <input type="checkbox" checked={options[o.key]} aria-labelledby={`view-opt-name-${o.key}`} aria-describedby={`view-opt-${o.key}`} onChange={() => onFlip(o.key)} />
              <span className="canvas__opt-text">
                <span id={`view-opt-name-${o.key}`} className="canvas__opt-name">{o.label}</span>
                <span id={`view-opt-${o.key}`} className="canvas__opt-desc">{o.desc}</span>
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

/** 빈 화면의 작은 텍스트 버튼 + 팝오버 목록. Esc·바깥 클릭으로 닫고, 고르면 닫으며 가져온다. */
function SamplePicker({ samples, onImport, disabled }: { samples: { id: string; title: string }[]; onImport(id: string): void; disabled: boolean }) {
  const { open, setOpen, root, trigger } = usePopover('[role="menuitem"]');
  const move = (e: ReactKeyboardEvent<HTMLUListElement>) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const items = [...e.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]')];
    const at = items.indexOf(document.activeElement as HTMLElement);
    items[(at + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]?.focus();
  };
  return (
    <div ref={root} className="canvas__samples">
      <button ref={trigger} type="button" className="canvas__sample-btn" aria-haspopup="menu" aria-expanded={open} disabled={disabled} onClick={() => setOpen((v) => !v)}>
        샘플 불러오기
      </button>
      {open && (
        <ul className="canvas__sample-list" role="menu" aria-label="샘플" onKeyDown={move}>
          {samples.map((s) => (
            <li key={s.id} role="none">
              <button
                type="button"
                role="menuitem"
                className="node-menu__item"
                onClick={() => {
                  setOpen(false);
                  onImport(s.id);
                }}
              >
                {s.title}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Canvas(props: CanvasProps) {
  const { state, pinned, editMode, options, onOptionsChange, onAutoArrange, autoArrangeDisabled = false, motion } = props;
  const view = useDiagramView(state, pinned, options);
  const empty = Object.keys(state.nodes).length === 0 && Object.keys(state.groups).length === 0;
  // 전체 보기: 카메라의 화면 맞춤 요청(fitRequest)을 올린다. 부모 요청과 합쳐 어느 쪽이든 늘기만 한다.
  const [fitTick, setFitTick] = useState(0);
  const flip = (key: ToggleKey) => onOptionsChange({ ...options, [key]: !options[key] });

  return (
    <div className="canvas">
      <div className="canvas__toolbar" role="toolbar" aria-label="캔버스 도구">
        <div className="canvas__group" role="group" aria-label="보기">
          <ViewMenu options={options} onFlip={flip} />
        </div>
        <span className="canvas__sep" role="separator" aria-orientation="vertical" />
        <div className="canvas__group" role="group" aria-label="편집">
          <button type="button" className="canvas__tool" aria-pressed={editMode} onClick={() => props.onEditModeChange(!editMode)}>
            <IconMove />
            <span>위치 옮기기</span>
          </button>
          <button type="button" className="canvas__tool" disabled={autoArrangeDisabled} onClick={onAutoArrange}>
            <IconArrange />
            <span>자동 정렬</span>
          </button>
        </div>
        <span className="canvas__sep" role="separator" aria-orientation="vertical" />
        <div className="canvas__group" role="group" aria-label="화면">
          <button type="button" className="canvas__tool" onClick={() => setFitTick((n) => n + 1)}>
            <IconFit />
            <span>전체 보기</span>
          </button>
          <button type="button" className="canvas__tool" aria-pressed={motion} onClick={() => props.onMotionChange(!motion)}>
            <IconFlow />
            <span>흐름 표시</span>
          </button>
        </div>
      </div>
      {empty ? (
        <div className="canvas__empty">
          <p>{EMPTY_MESSAGE}</p>
          {props.samples && props.samples.length > 0 && props.onImportSample && (
            <SamplePicker samples={props.samples} onImport={props.onImportSample} disabled={props.importing ?? false} />
          )}
        </div>
      ) : !view.layout && view.layoutFailed ? (
        <p className="canvas__empty" role="alert">{LAYOUT_FAILED_MESSAGE}</p>
      ) : (
        view.layout && (
          <ReactFlowProvider>
            <Flow {...props} fitRequest={(props.fitRequest ?? 0) + fitTick} layout={view.layout} settled={view.settled} display={view.display} appearing={view.appearing} updated={view.updated} />
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

function Flow({ state, pinned, editMode, options, onOptionsChange, onSelect, onPinnedChange, motion, layout, settled, fitRequest, display, appearing, updated, diffMarks, fitKey, streaming = false, cameraInsets = NO_INSETS, focusRequest, onMention, onBadgeClick, onWarnBadgeClick, onPlaced }: FlowProps) {
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
  const { getViewport, setViewport, flowToScreenPosition } = useReactFlow();
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
  // 빛점 도착점: 배치가 끝나면 알린다. locate 는 날아가는 동안 프레임마다 불리므로 최신 값을 ref 로 읽는다.
  const latest = useRef({ layout, display, cameraInsets, onPlaced });
  useEffect(() => {
    latest.current = { layout, display, cameraInsets, onPlaced };
  });
  const locate = useCallback(
    (id: string) => {
      const { layout: l, display: d, cameraInsets: ins } = latest.current;
      const r = l.nodes[id];
      const box = wrap.current?.getBoundingClientRect();
      if (!r || !d.nodes[id] || !box) return null;
      const p = flowToScreenPosition({ x: r.x + r.width / 2, y: r.y + r.height / 2 });
      const visible = p.x >= box.left + ins.left && p.x <= box.right - ins.right && p.y >= box.top && p.y <= box.bottom - (ins.bottom ?? 0);
      return visible ? p : null;
    },
    [flowToScreenPosition],
  );
  useEffect(() => {
    if (settled) latest.current.onPlaced?.(locate);
  }, [layout, settled, locate]);
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
