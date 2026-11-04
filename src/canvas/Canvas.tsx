import { applyNodeChanges, Background, ReactFlow, ReactFlowProvider, useReactFlow, useStore, type Node, type NodeChange } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";

import { categoryOf } from "@/domain/catalog";
import { computeMissing } from "@/domain/missing";
import type { DiagramState } from "@/domain/types";
import { mergeWarnings, warningsByNode } from "@/domain/warnings";

import { canvasAriaLabels, zoneDescription } from "./ariaLabels";
import "./canvas.css";
import { EdgeLayerPortal } from "./EdgeLayer";
import { emphasisOf, litZones } from "./emphasis";
import { ExportMenu } from "./ExportMenu";
import { exportDiagramImage, exportFileName, type ExportBackground, type ExportFormat } from "./exportImage";
import type { GroupBoxData } from "./GroupBox";
import type { NodeCardData, NodeVisualState } from "./NodeCard";
import { outermostCollapsedAncestor, type DisplayGraph, type DisplayOptions } from "./display";
import type { Layout, Rect } from "./layout";
import { NodeMenu } from "./NodeMenu";
import { nodeTypes } from "./nodeTypes";
import { NAV_KEYS, navItems, readingOrder, step, tabStop } from "./roving";
import { NODE_Z, zoneZ } from "./stacking";
import { prefersReducedMotion, unionRect, useCamera, type Insets, type Viewport } from "./useCamera";
import { useDiagramView } from "./useDiagramView";
import { moveMenuFocus, usePopover } from "./usePopover";
import { useHoverEmphasis } from "./useHoverEmphasis";
import { ZoneNameLayerPortal, type ZoneName } from "./ZoneNameLayer";

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
  /** 우클릭 메뉴 "이 노드에 대해 물어보기"(노드 전용, 구역에는 없다). 없으면 항목을 두지 않는다. */
  onAskNode?(id: string): void;
  askDisabled?: boolean;
  askReason?: string;
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
  /** 이미지로 내보낼 때 파일 이름(`<프로젝트>-<구성도>.png`)에 쓴다. */
  projectName?: string;
  diagramName?: string;
}

export const FAR_ZOOM = 0.6;
/** 위치 보기 강조 시간(은빛 링 2회). canvas.css 의 node-pulse 와 맞춘다. */
export const PULSE_MS = 1600;
const NO_INSETS: Insets = { left: 0, right: 0 };
/** 도구 모음 아래 숨 쉴 틈(화면 px). 맞춤은 도구 모음 아래 끝 + 이만큼부터 쓴다. */
const TOOLBAR_GAP = 8;
const LAYOUT_FAILED_MESSAGE = "구성도를 배치하지 못했어요. 새로고침하거나 구성을 다시 확인해 주세요.";
const EMPTY_MESSAGE = "아직 구성도가 비어 있어요. 오른쪽 대화에서 만들고 싶은 서비스를 설명해 보세요.";
const EXPORT_LAYOUT_FAILED_REASON = "구성도를 배치하지 못해 저장할 그림이 없어요.";
const EXPORT_LAYOUT_PENDING_REASON = "구성도를 그리는 중이에요. 잠시 뒤 다시 해 보세요.";

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
  return (
    <div ref={root} className="canvas__samples">
      <button ref={trigger} type="button" className="canvas__sample-btn" aria-haspopup="menu" aria-expanded={open} disabled={disabled} onClick={() => setOpen((v) => !v)}>
        샘플 불러오기
      </button>
      {open && (
        <ul className="canvas__sample-list" role="menu" aria-label="샘플" onKeyDown={moveMenuFocus}>
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
  // 전체 보기: 구성도 전체를 담는 맞춤 요청(fitAllRequest). 자동 정렬 등 부모의 fitRequest 는 읽을 수 있는 줌 규칙을 따른다.
  const [fitTick, setFitTick] = useState(0);
  const flip = (key: ToggleKey) => onOptionsChange({ ...options, [key]: !options[key] });
  // 이미지로 내보내기: 화면에 그려진 뷰포트를 복제해 구성도 전체를 찍는다(exportImage.ts).
  const rootRef = useRef<HTMLDivElement>(null);
  // 떠 있는 도구 모음이 가리는 위쪽 띠: 화면 맞춤이 맨 윗줄 노드를 그 밑에 두지 않게 카메라 위쪽 여백으로 준다.
  // 좁은 화면에서는 두 줄로 접히므로 크기가 바뀔 때마다 다시 잰다. 첫 맞춤 전에 값이 있도록 레이아웃 효과에서 잰다.
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [toolbarBottom, setToolbarBottom] = useState(0);
  useLayoutEffect(() => {
    const el = toolbarRef.current;
    if (!el) return;
    const measure = () => setToolbarBottom(el.offsetHeight > 0 ? el.offsetTop + el.offsetHeight : 0);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const parentInsets = props.cameraInsets ?? NO_INSETS;
  const insets = useMemo<Insets>(() => (toolbarBottom > 0 ? { ...parentInsets, top: Math.max(parentInsets.top ?? 0, toolbarBottom + TOOLBAR_GAP) } : parentInsets), [parentInsets, toolbarBottom]);
  // 다시 배치하는 중(settled 아님)에는 화면과 배치가 어긋날 수 있어 막는다.
  const exportBlocked = empty || !view.settled || !view.baseLayout || !view.baseDisplay;
  const onExport = async (format: ExportFormat, background: ExportBackground) => {
    const viewport = rootRef.current?.querySelector<HTMLElement>(".react-flow__viewport");
    if (!viewport || !view.baseLayout || !view.baseDisplay) throw new Error("캔버스가 아직 그려지지 않았어요");
    // 선택과 상관없는 배치를 쓴다: 선택 때문에만 보이는 보조 연결은 그림에 넣지 않는다.
    await exportDiagramImage({
      viewport,
      layout: view.baseLayout,
      edges: view.baseDisplay.edges,
      format,
      background,
      fileName: exportFileName(props.projectName, props.diagramName, format),
    });
  };

  return (
    <div ref={rootRef} className="canvas">
      <div ref={toolbarRef} className="canvas__toolbar" role="toolbar" aria-label="캔버스 도구">
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
        <span className="canvas__sep" role="separator" aria-orientation="vertical" />
        <div className="canvas__group" role="group" aria-label="이미지">
          <ExportMenu disabled={exportBlocked} {...(empty ? {} : { disabledReason: view.layoutFailed ? EXPORT_LAYOUT_FAILED_REASON : EXPORT_LAYOUT_PENDING_REASON })} onExport={onExport} />
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
            <Flow {...props} cameraInsets={insets} fitAllRequest={fitTick} layout={view.layout} settled={view.settled} layoutFailed={view.layoutFailed} display={view.display} appearing={view.appearing} updated={view.updated} />
          </ReactFlowProvider>
        )
      )}
    </div>
  );
}

/**
 * 캔버스 줌을 래퍼의 CSS 변수 --zoom 으로 둔다. canvas.css 가 작은 단추(접기·배지)의 누르는 자리를 화면에서 24px 이상으로
 * 넓히는 데 쓴다. 줌이 바뀔 때 Flow 전체를 다시 그리지 않게 이 컴포넌트만 구독한다.
 */
function ZoomVar({ target }: { target: React.RefObject<HTMLDivElement | null> }) {
  const zoom = useStore((s) => s.transform[2]);
  useLayoutEffect(() => {
    target.current?.style.setProperty("--zoom", String(zoom));
  }, [zoom, target]);
  return null;
}

interface FlowProps extends CanvasProps {
  /** 전체 보기 요청(Canvas 의 도구 모음). */
  fitAllRequest: number;
  layout: Layout;
  settled: boolean;
  layoutFailed: boolean;
  display: DisplayGraph;
  appearing: Set<string>;
  updated: Set<string>;
}

function Flow({ state, pinned, editMode, options, onOptionsChange, onSelect, onPinnedChange, motion, layout, settled, layoutFailed, fitRequest, fitAllRequest, display, appearing, updated, diffMarks, fitKey, streaming = false, cameraInsets = NO_INSETS, focusRequest, onMention, onAskNode, askDisabled, askReason, onBadgeClick, onWarnBadgeClick, onPlaced }: FlowProps) {
  const far = useStore((s) => s.transform[2] < FAR_ZOOM);
  const selected = drawnId(state, options.collapsed, options.selectedId);
  const missingByNode = useMemo(() => computeMissing(state).byNode, [state]);
  const warnByNode = useMemo(() => warningsByNode(mergeWarnings(state).active), [state]);
  // 마우스 강조: 지연 뒤 hoverId 가 되고, 위치 옮기기 드래그 중에는 받지 않는다.
  const hover = useHoverEmphasis();
  const dragging = useRef(false);
  const edgeHover = useRef<string | null>(null);
  const known = useMemo(() => new Set([...Object.keys(display.nodes), ...Object.keys(display.groups)]), [display]);
  // 선택이 있거나 대상이 사라졌으면 호버는 없는 것으로 친다(노드가 다시 만들어지지 않게 선택 중엔 늘 null).
  const hoverId = selected === null && emphasisOf(display.edges, hover.hoverId, known) !== null ? hover.hoverId : null;
  // 고른 노드(또는 영역)의 상자: 연결 이름을 합칠 때 그 변 옆에 둔다.
  const selectedRect: Rect | undefined = selected === null ? undefined : (layout.nodes[selected] ?? layout.groups[selected]);
  // 보드가 바뀌면(fitKey) 호버를 푼다(사라진 노드는 mouseleave 를 보내지 않는다).
  const resetHover = hover.reset;
  useEffect(() => {
    edgeHover.current = null;
    resetHover();
  }, [fitKey, resetHover]);
  // 위치 보기 강조: 강조할 그려진 노드 id 와 토큰(같은 노드를 다시 눌러도 링이 처음부터 돈다).
  const [pulse, setPulse] = useState<{ ids: Set<string>; token: number } | null>(null);
  const toggleGroup = useCallback(
    (id: string) => {
      const collapsed = new Set(options.collapsed);
      if (collapsed.has(id)) collapsed.delete(id);
      else collapsed.add(id);
      onOptionsChange({ ...options, collapsed });
    },
    [options, onOptionsChange],
  );
  // 키보드 이동(roving.ts): 캔버스는 Tab 한 칸이다. tabindex 0 은 한 곳(선택 → 마지막 포커스 → 읽는 순서 첫 노드)뿐이고,
  // 안에서는 화살표·Home·End 로 옮겨 다닌다.
  const nav = useMemo(() => navItems(layout, display), [layout, display]);
  const order = useMemo(() => readingOrder(nav), [nav]);
  const [lastFocus, setLastFocus] = useState<string | null>(null);
  const stop = tabStop(nav, order, selected, lastFocus);
  // 노드 목록(computed)은 stop 으로 다시 만들지 않는다(화살표마다 노드 전부를 새로 만들게 된다): 만들 때의 값만 읽고,
  // stop 이 바뀌면 아래 효과가 tabindex 가 달라진 두 노드만 고친다.
  const stopRef = useRef(stop);
  stopRef.current = stop;
  const descId = useId();
  const zoneDesc = { open: `${descId}-zone`, collapsed: `${descId}-zone-collapsed` };

  // 선택이 있으면 선택 기준으로만 흐리고, 호버는 선택이 없을 때만 쓴다.
  const sel = useMemo(() => emphasisOf(display.edges, selected), [display, selected]);
  // 고르면 이어진 노드가 없는 영역도 흐린다(호버는 영역을 흐리지 않는다: 선택보다 약하게). 영역 상자와 이름 알약이 함께 쓴다.
  const lit = useMemo(() => {
    const parentOf = (id: string): string | null => (display.nodes[id] ?? display.groups[id])?.parent ?? null;
    return sel ? litZones(parentOf, sel, selected) : null;
  }, [display, sel, selected]);

  const computed = useMemo<Node[]>(() => {
    const hov = emphasisOf(display.edges, hoverId, known);
    const out: Node[] = [];
    for (const lg of Object.values(layout.groups)) {
      const g = display.groups[lg.id];
      if (!g) continue;
      const data: GroupBoxData = { label: g.label, groupKind: g.groupKind, collapsed: g.collapsed, hiddenCount: g.hiddenCount, selected: g.id === selected, dimmed: lit !== null && !lit.has(g.id), onToggle: () => toggleGroup(g.id) };
      out.push({
        id: g.id,
        type: "zone",
        position: { x: lg.x, y: lg.y },
        data,
        // 안쪽 영역일수록 위(stacking.ts): 바깥 영역이 안쪽 영역의 접기 단추를 가리지 않는다.
        zIndex: zoneZ(layout.groups, g.id),
        ariaLabel: g.label,
        domAttributes: { tabIndex: g.id === stopRef.current ? 0 : -1, "aria-describedby": g.collapsed ? zoneDesc.collapsed : zoneDesc.open },
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
      // 위치 보기로 강조 중인 노드는 흐리지 않는다(흐린 노드 안에서는 링이 보이지 않는다).
      else if (sel && !sel.nodes.has(ln.id) && !pulse?.ids.has(ln.id)) visual = "dimmed";
      else if (appearing.has(ln.id)) visual = "appearing";
      else if (updated.has(ln.id)) visual = "updated";
      else if (hov && !hov.nodes.has(ln.id) && !pulse?.ids.has(ln.id)) visual = "faded";
      const az = n.attrs.az;
      const diff = diffMarks?.removed.has(ln.id) ? "removed" : diffMarks?.added.has(ln.id) ? "added" : diffMarks?.changed.has(ln.id) ? "changed" : undefined;
      const data: NodeCardData = {
        label: ln.displayLabel,
        fullLabel: n.label,
        sub: ln.displaySub,
        category: categoryOf(n.kind),
        state: visual,
        ...(az !== undefined && az !== null ? { az: String(az) } : {}),
        ...(ln.displayLabel !== n.label || ln.displaySub !== n.sub ? { truncated: true, ...(n.sub !== undefined ? { fullSub: n.sub } : {}) } : {}),
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
        // 키보드 포커스를 받는 래퍼의 이름표: 화면에서 잘려도 전체 이름(과 보조 글자)을 읽어 준다.
        ariaLabel: n.sub ? `${n.label} · ${n.sub}` : n.label,
        domAttributes: { tabIndex: n.id === stopRef.current ? 0 : -1 },
        // React Flow 의 선택을 화면 선택과 맞춘다(편집 모드 화살표 옮기기는 React Flow 가 선택한 노드에만 한다).
        selected: ln.id === selected,
        zIndex: NODE_Z,
        draggable: editMode,
        width: ln.width,
        height: ln.height,
        style: { width: ln.width, height: ln.height },
      });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- zoneDesc 는 useId 에서 나와 바뀌지 않는다
  }, [layout, display, selected, sel, lit, appearing, updated, editMode, options, toggleGroup, diffMarks, missingByNode, warnByNode, onBadgeClick, onWarnBadgeClick, pulse, hoverId, known]);

  // 영역 이름 알약(연결선 위 층): 영역 노드와 같은 배치·흐림(lit)에서 만든다. 호버·등장 효과로는 다시 만들지 않는다.
  const zoneNames = useMemo<ZoneName[]>(() => {
    const out: ZoneName[] = [];
    for (const lg of Object.values(layout.groups)) {
      const g = display.groups[lg.id];
      if (!g) continue;
      out.push({ id: g.id, x: lg.x, y: lg.y, width: lg.width, label: g.label, groupKind: g.groupKind, collapsed: g.collapsed, hiddenCount: g.hiddenCount, ...(lit !== null && !lit.has(g.id) ? { dimmed: true } : {}) });
    }
    return out;
  }, [layout, display, lit]);

  const [nodes, setNodes] = useState<Node[]>(computed);
  useEffect(() => setNodes(computed), [computed]);
  useEffect(() => {
    setNodes((ns) => {
      let changed = false;
      const out = ns.map((n) => {
        const want = n.id === stop ? 0 : -1;
        if (n.domAttributes?.tabIndex === want) return n;
        changed = true;
        return { ...n, domAttributes: { ...n.domAttributes, tabIndex: want } };
      });
      return changed ? out : ns;
    });
  }, [stop]);

  // Camera: fit on board change, follow new nodes calmly while a turn streams (see useCamera).
  const { getViewport, setViewport, flowToScreenPosition, getNode, getNodes } = useReactFlow();
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
    fitAllRequest,
    settled,
    layoutFailed,
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
      const visible = p.x >= box.left + ins.left && p.x <= box.right - ins.right && p.y >= box.top + (ins.top ?? 0) && p.y <= box.bottom - (ins.bottom ?? 0);
      return visible ? p : null;
    },
    [flowToScreenPosition],
  );
  useEffect(() => {
    if (settled) latest.current.onPlaced?.(locate);
  }, [layout, settled, locate]);
  const [menu, setMenu] = useState<{ id: string; zone: boolean; x: number; y: number } | null>(null);
  // 노드·영역(이름 알약 포함)에서 오른쪽 단추: 누른 자리에 메뉴를 연다.
  const openMenu = (id: string, zone: boolean, e: React.MouseEvent) => {
    if (!onMention) return;
    e.preventDefault();
    const r = wrap.current?.getBoundingClientRect();
    setMenu({ id, zone, x: e.clientX - (r?.left ?? 0), y: e.clientY - (r?.top ?? 0) });
  };
  const closeMenu = useCallback(() => {
    setMenu(null);
    wrap.current?.focus({ preventScroll: true });
  }, []);
  useEffect(() => {
    if (!onMention) setMenu(null);
  }, [onMention]);
  const onNodesChange = useCallback((changes: NodeChange[]) => setNodes((ns) => applyNodeChanges(changes, ns)), []);
  const ariaLabelConfig = useMemo(() => canvasAriaLabels(editMode), [editMode]);
  // 키보드: React Flow 는 Enter·Space·Esc 를 자기 선택에만 쓰므로 화면 선택(onSelect)으로 잇는다(클릭과 같다).
  // 편집 모드 화살표 옮기기는 React Flow 가 하고, 키를 놓을 때 실제로 움직인 노드만 한 번에 고정 위치로 저장한다.
  // 캡처 단계에서 받아 React Flow 가 첫 칸을 옮기기 전의 시작 위치를 적는다.
  const keyMove = useRef<Map<string, { x: number; y: number }> | null>(null);
  // 캔버스 안 노드·영역에 키보드 포커스가 있는가(사라진 노드에서 포커스를 되찾을지 가른다).
  const focusInside = useRef(false);
  useEffect(() => {
    keyMove.current = null;
  }, [selected]);
  const focusItem = (id: string) => {
    for (const el of wrap.current?.querySelectorAll<HTMLElement>(".react-flow__node") ?? []) {
      if (el.dataset.id === id) return el.focus();
    }
  };
  const onFlowKeyDownCapture = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const el = e.target as HTMLElement;
    const id = el.classList.contains("react-flow__node") ? el.dataset.id : undefined;
    if (!id) return;
    const infra = el.classList.contains("react-flow__node-infra");
    // 화살표는 포커스를 옮긴다. 노드를 옮기는 것은 편집 모드에서 선택한 노드에 있을 때뿐이다(React Flow 가 옮긴다).
    // Alt·Ctrl·Cmd 와 함께 누른 키는 브라우저·보조기기 단축키라 가로채지 않는다.
    const plain = !e.altKey && !e.ctrlKey && !e.metaKey;
    if (plain && NAV_KEYS.has(e.key) && !(e.key.startsWith("Arrow") && editMode && infra && getNode(id)?.selected)) {
      e.preventDefault();
      const next = step(nav, order, id, e.key);
      if (next !== null && next !== id) focusItem(next);
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      if (e.key === " ") e.preventDefault();
      if (e.repeat) return;
      // 영역: Space 는 접고 펴고, Enter 는 클릭처럼 선택을 푼다.
      if (!infra && e.key === " ") toggleGroup(id);
      else onSelect(infra && id !== selected ? id : null);
    } else if (e.key === "Escape") {
      if (selected !== null) onSelect(null);
    } else if (e.key.startsWith("Arrow") && editMode && infra && keyMove.current === null && getNode(id)?.selected) {
      // 함께 선택된 노드가 모두 같이 움직이므로 모두의 시작 위치를 적는다.
      keyMove.current = new Map(getNodes().filter((n) => n.selected && n.type === "infra").map((n) => [n.id, { ...n.position }]));
    }
  };
  const onFlowKeyUp = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const starts = keyMove.current;
    if (!e.key.startsWith("Arrow") || starts === null) return;
    keyMove.current = null;
    if (!editMode) return;
    const next = { ...pinned };
    let moved = false;
    for (const [id, from] of starts) {
      const p = getNode(id)?.position;
      if (!p || (p.x === from.x && p.y === from.y)) continue;
      next[id] = { x: p.x, y: p.y };
      moved = true;
    }
    if (moved) onPinnedChange(next);
  };
  // 캔버스 밖으로 포커스가 나가면 옮기던 상태를 버린다(나중에 다른 곳에서 키를 놓아도 저장하지 않는다).
  const onFlowBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as globalThis.Node | null)) keyMove.current = null;
    // 포커스가 캔버스 밖 다른 곳으로 갔으면 되찾지 않는다. 받는 곳이 없으면(포커스 받은 노드가 지워져 빠졌거나 빈 곳을 눌렀거나)
    // 그 노드가 아직 붙어 있을 때만 나간 것으로 친다.
    const rel = e.relatedTarget as globalThis.Node | null;
    if (rel && !e.currentTarget.contains(rel)) focusInside.current = false;
    else if (!rel) {
      const el = e.target as HTMLElement;
      queueMicrotask(() => {
        if (el.isConnected) focusInside.current = false;
      });
    }
  };
  // 포커스를 받은 노드·영역이 다음에 Tab 으로 들어올 곳이 된다(선택이 없을 때).
  const onFlowFocus = (e: React.FocusEvent<HTMLDivElement>) => {
    const el = e.target as HTMLElement;
    const id = el.classList.contains("react-flow__node") ? el.dataset.id : undefined;
    if (id) focusInside.current = true;
    if (id && id !== lastFocus) setLastFocus(id);
  };
  // 포커스 받은 노드가 사라지면(지워지거나 영역이 접혀) 포커스를 캔버스 안에 남긴다: 접혀 숨었으면 그 접힌 영역, 아니면 Tab 칸.
  // React Flow 는 노드 래퍼를 다음 그리기에서 붙이므로 다음 프레임에 옮긴다.
  useEffect(() => {
    if (!focusInside.current || lastFocus === null || order.includes(lastFocus)) return;
    const a = document.activeElement;
    if (a && a !== document.body && !wrap.current?.contains(a)) return;
    const shown = drawnId(state, options.collapsed, lastFocus);
    const target = shown !== null && order.includes(shown) ? shown : tabStop(nav, order, selected, null);
    if (target === null) return;
    let tries = 0;
    let raf = 0;
    const go = () => {
      for (const el of wrap.current?.querySelectorAll<HTMLElement>(".react-flow__node") ?? []) if (el.dataset.id === target) return el.focus();
      if (++tries < 5) raf = requestAnimationFrame(go);
    };
    go();
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 보이는 것이 바뀔 때만 본다
  }, [order]);

  return (
    <div ref={wrap} tabIndex={-1} className="canvas__flow" data-zoom={far ? "far" : "near"} onKeyDownCapture={onFlowKeyDownCapture} onKeyUp={onFlowKeyUp} onBlur={onFlowBlur} onFocus={onFlowFocus}>
      <div id={zoneDesc.open} hidden>{zoneDescription(false)}</div>
      <div id={zoneDesc.collapsed} hidden>{zoneDescription(true)}</div>
      <ReactFlow
        nodes={nodes}
        edges={[]}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        nodesDraggable={editMode}
        nodesConnectable={false}
        elementsSelectable
        deleteKeyCode={null}
        ariaLabelConfig={ariaLabelConfig}
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        onNodeClick={(_, node) => {
          if (node.type === "zone") onSelect(null);
          else if (node.type === "infra") onSelect(node.id === selected ? null : node.id);
        }}
        onPaneClick={() => onSelect(null)}
        onNodeContextMenu={(e, node) => openMenu(node.id, node.type === "zone", e)}
        onMoveStart={(e) => {
          setMenu(null);
          camera.onMoveStart(e);
        }}
        onNodeMouseEnter={(_, node) => {
          if (node.type === "infra" && !dragging.current) hover.enter(node.id);
        }}
        onNodeMouseLeave={(_, node) => {
          if (node.type === "infra") hover.leave(node.id);
        }}
        onNodeDragStart={() => {
          dragging.current = true;
          hover.reset();
        }}
        onNodeDragStop={(_, node) => {
          dragging.current = false;
          if (editMode && node.type === "infra") onPinnedChange({ ...pinned, [node.id]: { x: node.position.x, y: node.position.y } });
        }}
      >
        <Background />
        <ZoomVar target={wrap} />
        <EdgeLayerPortal
          layout={layout}
          edges={display.edges}
          selectedId={selected}
          {...(selectedRect ? { selectedRect } : {})}
          hoverId={hoverId}
          onHover={(id) => {
            if (id !== null) {
              if (dragging.current) return;
              edgeHover.current = id;
              hover.enter(id);
            } else if (edgeHover.current !== null) {
              hover.leave(edgeHover.current);
              edgeHover.current = null;
            }
          }}
          hoverLabels={options.hoverLabels}
          motion={motion}
          appearing={appearing}
          nodeCount={Object.keys(state.nodes).length}
          onSelect={onSelect}
        />
        {/* 영역 이름표는 연결선 층 위(stacking.ts): 영역 머리를 지나는 선이 이름 뒤로 지나간다. 누르면 영역 머리를 누른 것과 같다. */}
        <ZoneNameLayerPortal
          zones={zoneNames}
          onPillClick={(id) => {
            // 영역 머리를 누르면 영역 래퍼가 포커스를 받았다(다음 Tab 이 돌아올 곳). 알약도 같게 한다.
            for (const el of wrap.current?.querySelectorAll<HTMLElement>(".react-flow__node-zone") ?? []) if (el.dataset.id === id) el.focus({ preventScroll: true });
            onSelect(null);
          }}
          onPillContextMenu={(id, e) => openMenu(id, true, e)}
        />
      </ReactFlow>
      {menu && onMention && (
        <NodeMenu
          x={menu.x}
          y={menu.y}
          onChoose={() => onMention(menu.id)}
          {...(onAskNode && !menu.zone ? { onAsk: () => onAskNode(menu.id), askDisabled: askDisabled ?? false, ...(askReason ? { askReason } : {}) } : {})}
          onClose={closeMenu}
        />
      )}
    </div>
  );
}
