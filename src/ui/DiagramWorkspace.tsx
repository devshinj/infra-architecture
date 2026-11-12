"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

import {
  clearPinnedAction,
  confirmAssumptionAction,
  getVersionAction,
  importSampleAction,
  listVersionsAction,
  removeNoLinkAction,
  restoreVersionAction,
  saveFieldsAction,
  savePinnedAction,
  setWarningIgnoredAction,
} from "@/app/(app)/actions";
import { Canvas, type CanvasOptions, type DiffMarks } from "@/canvas/Canvas";
import { defaultDisplayOptions } from "@/canvas/display";
import { applyCommand } from "@/domain/apply";
import { assumptionChangeMessage, confirmAssumption } from "@/domain/assumptions";
import { isFlowCommand } from "@/domain/commands";
import { diffStates } from "@/domain/diff";
import { checkFlow } from "@/domain/flows";
import type { NetworkKnowledge } from "@/domain/network";
import type { DiagramState } from "@/domain/types";

import styles from "./app.module.css";
import { Button } from "./Button";
import type { VersionRow } from "./HistoryPanel";
import { ELSEWHERE_BUSY, type LlmHealth } from "./chat/ChatPanel";
import type { MentionInputHandle } from "./chat/MentionInput";
import type { ChecklistDrafts, ChecklistExpanded, MissingChecklistProps } from "./chat/MissingChecklist";
import { type ChatLine, type SendOptions, useChatTurn } from "./chat/useChatTurn";
import { NEW_SESSION, type SessionKey, type SessionPaging, type SessionSummary, useSessions } from "./chat/useSessions";
import { type CardMeasure, InfoCard } from "./canvas/InfoCard";
import { Legend, legendPlacement } from "./canvas/Legend";
import { FlyLayer, useFly } from "./FlyLayer";
import { GhostLayer, type GhostRequest } from "./GhostLayer";
import type { ExplanationProps } from "./explain/Explanation";
import { type TargetKind, useExplanations } from "./explain/useExplanations";
import type { FlowPanelProps } from "./flows/FlowPanel";
import { useFlows } from "./flows/useFlows";
import { MOBILE_VIEWS, MobileTabBar, type MobileView, mobileTabId } from "./MobileTabBar";
import { PANEL_DEFAULT, PANEL_MAX, PANEL_MIN, PANEL_MIN_COMPACT, PanelResizer } from "./PanelResizer";
import { PANEL_GAP, useShell } from "./Shell";
import { RIGHT_PANEL_BODY_ID, RightPanel, type Tab } from "./RightPanel";
import { NetworkKnowledgeProvider } from "./network/NetworkKnowledgeContext";
import { PARTIAL_UNDO } from "./NodeInfo";
import { REMOTE_CHANGED, REMOTE_LOAD, useRemoteChanges } from "./useRemoteChanges";

/** 비어 있는 구성도 대화 세션의 안내. */
const NEW_CHAT_HINT = "새 대화예요. 구성도는 그대로 이어서 바꾸고, 대화 기록만 따로 쌓여요.";

type Pinned = Record<string, { x: number; y: number }>;
type Mode =
  | { kind: "live" }
  | { kind: "view"; number: number; state: DiagramState }
  | { kind: "compare"; number: number; state: DiagramState; marks: DiffMarks };

export interface DiagramWorkspaceProps {
  diagramId: string;
  name: string;
  /** 이미지로 내보낼 때 파일 이름에 쓰는 프로젝트 이름. */
  projectName?: string;
  latest: { number: number; state: DiagramState };
  initialPinned: Pinned;
  samples: { id: string; title: string }[];
  /** Saved conversation (Task 10 maps server messages to lines). */
  initialChat?: ChatLine[];
  /** 노드 질문 세션 목록(최근에 이어간 순). */
  initialSessions?: SessionSummary[];
  /** 무리마다 다음 쪽 커서(없으면 더 없음)와 마지막으로 맞춘 시각. 없으면 더 불러올 것이 없다. */
  initialPaging?: SessionPaging;
  /** 계정 공통 망 지식. 없으면(못 읽음) 망 종류·연결 방식 예상 없이 지금처럼 그린다. */
  knowledge?: NetworkKnowledge | null;
}

/** Compare view draws current ∪ old so removed nodes appear as ghosts beside the live ones. */
const unionState = (old: DiagramState, cur: DiagramState): DiagramState => ({
  groups: { ...old.groups, ...cur.groups },
  nodes: { ...old.nodes, ...cur.nodes },
  edges: { ...old.edges, ...cur.edges },
  assumptions: cur.assumptions,
});

const hasId = (s: DiagramState, id: string) => id in s.nodes || id in s.edges || id in s.groups;

const PANEL_WIDTH_KEY = "infrasketch.panelWidth";

const MISSING_BADGES_KEY = "infrasketch.showMissingBadges";
/** 좁은 화면에서 마지막으로 본 구성도와 아래 탭 `{ diagramId, view }`(이번 탭 세션 동안). 같은 구성도를 다시 열 때만 되살린다. */
export const MOBILE_VIEW_KEY = "infrasketch.mobileView";
/** 이보다 좁은 작업 영역(사이드바·패널이 함께 뜨는 태블릿 너비)은 패널을 PANEL_MIN_COMPACT 까지 줄여 캔버스 띠를 넓힌다. */
const COMPACT_WIDTH = 900;
const CANVAS_ID = "workspace-canvas";

/** 구성 정보 카드의 접힌 줄 높이·카드 너비(재기 전 기본값, infoCard.module.css 와 맞춘다). */
const CARD_LINE_HEIGHT = 42;
const CARD_WIDTH = 300;

// showMissingBadges 는 브라우저 설정이라 여기서는 항상 끈 값이고, 실제 값은 아래 showMissing 상태가 덮어쓴다.
const optionsFor = (state: DiagramState): CanvasOptions => ({ ...defaultDisplayOptions(state), hoverLabels: true, showMissingBadges: false });

const NO_SESSIONS: SessionSummary[] = [];

/** 스스로 쓴 버전을 받아 오기를 기다리는 가장 긴 시간. 그동안은 Claude Code 변경을 묻지 않는다(넘으면 다시 묻는다). */
const OWN_WRITE_MS = 5000;

/**
 * 흐름 보기를 풀지 않을 Esc: 입력칸(글 지우기 등 입력칸 몫), 열린 메뉴·대화상자·목록 안(그것을 닫는 몫),
 * 떠 있는 이름 말풍선(NameTooltip 은 Esc 를 막지 않고 말풍선만 닫는다).
 */
function escapeBelongsElsewhere(e: KeyboardEvent): boolean {
  const t = e.target;
  if (t instanceof HTMLElement) {
    if (t.isContentEditable || t.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])')) return true;
    if (t.closest('[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"], [aria-modal="true"]')) return true;
  }
  return document.querySelector('[role="tooltip"]') !== null;
}

export function DiagramWorkspace({ diagramId, name, projectName, latest, initialPinned, samples, initialChat = [], initialSessions = NO_SESSIONS, initialPaging, knowledge = null }: DiagramWorkspaceProps) {
  const router = useRouter();
  const [current, setCurrent] = useState(latest);
  const [pinned, setPinned] = useState<Pinned>(initialPinned);
  const [options, setOptions] = useState<CanvasOptions>(() => optionsFor(latest.state));
  const [editMode, setEditMode] = useState(false);
  const [motion, setMotion] = useState(true);
  const [mode, setMode] = useState<Mode>({ kind: "live" });
  // 캔버스 판 번호: 가져오기·복원 등으로 새 판이 오면 바뀌어 화면을 다시 맞춘다. 대화가 끝나고 저장된 판을
  // 받아올 때는 같은 판이므로 그대로 둔다(끝날 때 맞춤·사용자 이동을 덮지 않게).
  const [board, setBoard] = useState(0);
  // 자동 정렬(버튼·대화)마다 바뀌어, 새 배치가 나오면 화면을 한 번 맞춘다.
  const [arranged, setArranged] = useState(0);
  /** 전체 보기 요청(단축키 F · 구성을 바꾼 차례 뒤): Canvas 의 `전체 보기` 버튼과 같은 맞춤. */
  const [fitAll, setFitAll] = useState(0);
  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [busy, startBusy] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const shown = useMemo<DiagramState>(() => {
    if (mode.kind === "view") return mode.state;
    if (mode.kind === "compare") return unionState(mode.state, current.state);
    return current.state;
  }, [mode, current.state]);

  const live = mode.kind === "live";

  // 대화 패널 너비: 첫 렌더는 기본값(하이드레이션 일치), 마운트 뒤 localStorage 를 읽는다. 캔버스는 다시 맞추지 않는다.
  const workspaceRef = useRef<HTMLDivElement>(null);
  const [panelWidth, setPanelWidth] = useState(PANEL_DEFAULT);
  const [workspaceW, setWorkspaceW] = useState(0);
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PANEL_WIDTH_KEY);
      const n = raw === null ? NaN : Number(raw);
      if (Number.isFinite(n) && n >= PANEL_MIN_COMPACT && n <= PANEL_MAX) setPanelWidth(Math.round(n));
    } catch {
      /* 저장소를 못 읽으면 기본 너비 */
    }
  }, []);
  useEffect(() => {
    const el = workspaceRef.current;
    if (!el) return;
    const measure = () => setWorkspaceW(el.clientWidth);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // 떠 있는 패널이 가리는 좌우 폭(패널 바깥 여백 + 너비 + 안쪽 숨 쉴 여백). 캔버스 맞춤은 그 사이 띠에 한다.
  // 사이드바를 접거나 패널 너비를 바꿔도 카메라는 움직이지 않고, 다음 맞춤부터 새 값을 쓴다.
  // 좁은 화면(narrow)은 패널이 캔버스 위에 뜨지 않고 아래 탭으로 갈마든다: 캔버스는 양옆 여백만 비운다.
  const { sidebarExtent, narrow } = useShell();
  const insetLeft = sidebarExtent + PANEL_GAP;
  // 태블릿 너비는 패널을 조금 더 줄일 수 있게 한다(사이드바·패널 사이 캔버스 띠가 카드 하나도 못 담지 않게).
  const panelMin = workspaceW > 0 && workspaceW <= COMPACT_WIDTH ? PANEL_MIN_COMPACT : PANEL_MIN;
  // 보이는 캔버스 띠가 360px 보다 좁아지지 않게 최대를 줄인다(너비를 모르면 줄이지 않는다).
  const panelMax = workspaceW > 0 ? Math.max(panelMin, Math.min(PANEL_MAX, workspaceW - insetLeft - 2 * PANEL_GAP - 360)) : PANEL_MAX;
  const shownPanelWidth = Math.max(panelMin, Math.min(panelWidth, panelMax));
  const insetRight = narrow ? PANEL_GAP : PANEL_GAP + shownPanelWidth + PANEL_GAP;
  // 아래: 접힌 구성 정보 카드 줄(+ 위아래 여백)은 늘 비운다. 카드가 열려 있으면 위치 보기가 카드를 피한다.
  const [cardOpen, setCardOpen] = useState(false);
  const [cardSize, setCardSize] = useState<CardMeasure | null>(null);
  const onCardMeasure = useCallback(
    (m: CardMeasure) => setCardSize((p) => (p && p.width === m.width && p.height === m.height && p.lineHeight === m.lineHeight ? p : m)),
    [],
  );
  // 범례: 좁아서 카드와 가로로 겹치면 카드 접힌 줄(열려 있으면 열린 카드) 위로 올리고, 카메라 바닥도 그만큼 비운다.
  const [legendWidth, setLegendWidth] = useState(0);
  const { bottom: legendBottom, insetBottom } = legendPlacement({
    canvasWidth: workspaceW,
    insetLeft,
    insetRight,
    cardWidth: cardSize?.width || CARD_WIDTH,
    legendWidth,
    gap: PANEL_GAP,
    cardLine: cardSize?.lineHeight || CARD_LINE_HEIGHT,
    cardOpen,
    cardHeight: cardSize?.height || 0,
  });
  const cardW = cardOpen ? (cardSize?.width || CARD_WIDTH) + PANEL_GAP : 0;
  const cardH = cardOpen ? PANEL_GAP + (cardSize?.height || 0) + PANEL_GAP : 0;
  const cameraInsets = useMemo(
    () => ({ left: insetLeft, right: insetRight, bottom: insetBottom, ...(cardW > 0 ? { card: { width: cardW, height: cardH } } : {}) }),
    [insetLeft, insetRight, insetBottom, cardW, cardH],
  );
  const changePanelWidth = (w: number) => {
    setPanelWidth(w);
    try {
      window.localStorage.setItem(PANEL_WIDTH_KEY, String(w));
    } catch {
      /* 저장 실패는 이번 방문에만 영향 */
    }
  };
  // 빠진 정보 숫자 배지: 기본 끔. 첫 렌더는 기본값, 마운트 뒤 localStorage 를 읽는다.
  const [showMissing, setShowMissing] = useState(false);
  useEffect(() => {
    try {
      if (window.localStorage.getItem(MISSING_BADGES_KEY) === "1") setShowMissing(true);
    } catch {
      /* 저장소를 못 읽으면 끈 채로 */
    }
  }, []);
  const canvasOptions = useMemo<CanvasOptions>(() => ({ ...options, showMissingBadges: showMissing }), [options, showMissing]);
  const changeOptions = useCallback(
    (o: CanvasOptions) => {
      setOptions(o);
      if (o.showMissingBadges === showMissing) return;
      setShowMissing(o.showMissingBadges);
      try {
        window.localStorage.setItem(MISSING_BADGES_KEY, o.showMissingBadges ? "1" : "0");
      } catch {
        /* 저장 실패는 이번 방문에만 영향 */
      }
    },
    [showMissing],
  );
  const [tab, setTab] = useState<Tab>("대화");
  // 좁은 화면의 아래 탭: 구성도(캔버스)냐 패널이냐. 패널이면 보이는 탭은 tab 이다. 넓은 화면에서는 CSS 가 이 값을 쓰지 않는다.
  const [panelShown, setPanelShown] = useState(false);
  const mobileView: MobileView = panelShown ? tab : "구성도";
  /** 패널 탭을 연다. 좁은 화면이면 아래 탭도 그 패널로 옮긴다(넓은 화면은 패널이 늘 보여 탭만 바뀐다). */
  const showTab = useCallback((t: Tab) => {
    setTab(t);
    setPanelShown(true);
  }, []);
  // 아래 탭 막대에서 고른 패널 탭: RightPanel 이 손으로 고른 것처럼 처리한다(선택이 풀려도 그 탭에 남고, 이력이면 목록을 불러온다).
  const [tabRequest, setTabRequest] = useState<{ tab: Tab; token: number } | null>(null);
  const chooseView = (v: MobileView) => {
    if (v === "구성도") return setPanelShown(false);
    setTabRequest((r) => ({ tab: v, token: (r?.token ?? 0) + 1 }));
    showTab(v);
  };
  // 마지막 아래 탭을 이번 탭 세션 동안 기억한다(좁은 화면에서만 읽고 쓴다). 다른 구성도를 열면 늘 구성도 탭부터.
  const restoredView = useRef(false);
  useEffect(() => {
    if (!narrow) return;
    if (!restoredView.current) {
      restoredView.current = true;
      try {
        const raw = window.sessionStorage.getItem(MOBILE_VIEW_KEY);
        const saved = raw ? (JSON.parse(raw) as { diagramId?: unknown; view?: unknown }) : null;
        const view = saved?.view as MobileView;
        if (saved?.diagramId === diagramId && view !== mobileView && MOBILE_VIEWS.includes(view)) {
          chooseView(view);
          return;
        }
      } catch {
        /* 저장소를 못 읽으면 구성도부터 */
      }
    }
    try {
      window.sessionStorage.setItem(MOBILE_VIEW_KEY, JSON.stringify({ diagramId, view: mobileView }));
    } catch {
      /* 저장 실패는 이번 화면에만 영향 */
    }
    // chooseView 는 매 렌더 새로 만들어지지만 상태 setter 만 쓴다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [narrow, mobileView, diagramId]);
  // 대화 차례의 add_node: 진행 카드의 현재 단계 점에서 그 노드로 빛점이 날아간다(배치가 끝나 좌표가 나오면).
  // 좁은 화면은 대화와 캔버스가 한 화면에 함께 보이지 않아 날리지 않는다.
  const fly = useFly({ motion, chatVisible: tab === "대화" && !narrow });
  const clearFly = fly.clear;
  // 바깥(Claude Code)에서 받은 새 버전의 지운 노드·연결을 잠깐 유령으로 보인다(GhostLayer 가 그 커밋 직전 화면을 뜬다).
  const [ghostRequest, setGhostRequest] = useState<GhostRequest | null>(null);
  useEffect(() => clearFly(), [diagramId, board, clearFly]); // 다른 구성도·새 판: 기다리던 빛점을 버린다
  const fail = (e: unknown) => setError(e instanceof Error ? e.message : "처리하지 못했어요");
  const run = (fn: () => Promise<void>) =>
    startBusy(async () => {
      setError(null);
      try {
        await fn();
      } catch (e) {
        fail(e);
      }
    });

  const loadVersions = useCallback(() => {
    listVersionsAction(diagramId).then((v) => setVersions(v as VersionRow[]), fail);
  }, [diagramId]);

  // Live chat: each server-applied command is replayed on the live state so nodes appear one by one.
  const adoptAfterChat = useRef(false);
  /** 구성을 바꾼 차례가 끝났다: 그 버전을 받을 때 선택을 풀고 화면을 한 번 맞춘다(onDone 이 켜고 채택이 끈다). */
  const fitAfterTurn = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  useEffect(() => { adoptAfterChat.current = false; }, [current.number]);
  // 브라우저가 스스로 쓴 버전(대화·되돌리기·가져오기·폼 저장 등)을 받아 오는 중: 그동안은 Claude Code 변경을 묻지 않는다.
  // 그 버전을 바깥 변경으로 오해해 한 번 더 불러오거나 안내를 띄우지 않게. 새 버전을 받으면(아래 effect) 또는 OWN_WRITE_MS 뒤 풀린다.
  const ownWriteUntil = useRef(0);
  const markOwnWrite = () => {
    ownWriteUntil.current = Date.now() + OWN_WRITE_MS;
  };
  useEffect(() => {
    ownWriteUntil.current = 0;
  }, [current.number]);
  const refreshFromServer = () => {
    adoptAfterChat.current = true;
    markOwnWrite();
    router.refresh();
    loadVersions();
  };
  // 다음 채택이 바깥(Claude Code) 변경을 불러온 것인가: 그때만 나타남·사라짐 효과를 낸다.
  // "poll" 은 물어서 저절로, "load" 는 [불러오기]를 눌러서. 저절로 온 것은 이력 보기·비교 중이면 현재로 돌아올 때까지 미룬다.
  const remoteAdopt = useRef<null | "poll" | "load">(null);
  // Import/restore bring a new board: stop treating the next adoption as the after-chat refresh.
  const expectNewBoard = () => {
    adoptAfterChat.current = false;
    remoteAdopt.current = null;
    markOwnWrite();
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  // After an interrupt the server saves the aborted version a moment later: refresh once more.
  const refreshAfterInterrupt = () => {
    refreshFromServer();
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(refreshFromServer, 1500);
  };
  // 흐름: 차례가 끝나면 다시 불러오고, 처음 그린 차례 뒤 흐름이 없으면 자동 제안한다(아래 useFlows 가 채운다).
  const afterTurnRef = useRef<(e: { changed: number } | undefined) => Promise<void>>(async () => {});
  // 대화 세션: 구성도 대화(main)와 노드 질문 세션. 새로고침하면 구성도 대화로 연다.
  const sessions = useSessions({ diagramId, initial: initialSessions, paging: initialPaging });
  const chat = useChatTurn({
    diagramId,
    initial: initialChat,
    onSession: sessions.upsert,
    onSessionLines: sessions.setLines,
    onCommand: (cmd) => {
      // 흐름 명령은 구성도를 바꾸지 않는다(서버가 흐름 저장소에 저장한다).
      if (isFlowCommand(cmd)) return;
      // 서버와 같게: 지식에 없는 종류가 붙은 망에는 AI 가 종류를 다시 붙일 수 있다.
      const opts = knowledge ? { netTypes: knowledge.types } : {};
      const next = applyCommand(current.state, cmd, opts).state;
      setCurrent((c) => ({ number: c.number, state: applyCommand(c.state, cmd, opts).state }));
      // 선택한 노드·연결·영역을 대화가 지우면(빈 영역 정리 포함) 선택을 푼다: 흐림이 남지 않게.
      setOptions((o) => (o.selectedId !== null && !hasId(next, o.selectedId) ? { ...o, selectedId: null } : o));
      if (cmd.op === "add_node" && live && !current.state.nodes[cmd.id]) fly.queue(cmd.id);
    },
    // 차례가 끝나도 빛점은 비우지 않는다: 출발점은 queue 때 잡아 두어, done 뒤 배치에서도 마지막 노드로 날 수 있다.
    onDone: (e) => {
      // 구성을 바꾼 차례: 서버 버전을 받은 뒤(아래 채택) 선택을 풀고 새 배치가 끝나면 화면을 다시 맞춘다.
      // 스트림이 멈출 때의 맞춤은 최종 배치 전이라, 받은 뒤 배치가 바뀌면 새 노드가 화면 밖에 남았다.
      if (e?.version != null && (e.changed ?? e.applied) > 0) fitAfterTurn.current = true;
      refreshFromServer();
      void afterTurnRef.current(e);
    },
    onOpenHistory: () => {
      showTab("이력");
      loadVersions();
    },
    onInterrupted: () => {
      fly.clear();
      refreshAfterInterrupt();
    },
    onRelayout: () => onAutoArrange(),
  });
  // The server re-renders with a newer version after import/restore/chat: adopt it, but never mid-turn
  // (it would wipe the commands already streamed); the done-refresh brings the newer version later.
  // 물어서 저절로 온 바깥 변경은 이력 보기·비교 중이면 미룬다(보던 화면에서 끌어내지 않는다). 현재로 돌아오면 그때 받는다.
  const deferRemote = remoteAdopt.current === "poll" && !live;
  if (!chat.busy && latest.number !== current.number && !deferRemote) {
    // 바깥 변경: 지워질 노드·연결은 GhostLayer 가 이 커밋 직전 화면에서 떠서 유령으로, 새 노드는 대화와 같은 나타나는 효과로.
    if (remoteAdopt.current) {
      remoteAdopt.current = null;
      if (live) {
        const { added, removed } = diffStates(current.state, latest.state);
        const nodes = [...removed].filter((id) => id in current.state.nodes);
        const edges = [...removed].filter((id) => id in current.state.edges);
        if (nodes.length > 0 || edges.length > 0) setGhostRequest({ key: latest.number, nodes, edges });
        for (const id of added) if (latest.state.nodes[id]) fly.queue(id);
      }
    }
    setCurrent(latest);
    if (!adoptAfterChat.current) setBoard((n) => n + 1);
    const refit = adoptAfterChat.current && fitAfterTurn.current;
    fitAfterTurn.current = false;
    // 전체가 보이게(전체 보기와 같은 맞춤: 읽을 수 있는 줌 바닥 없이). 자동 정렬 맞춤은 큰 구성도면 윗줄만 보여 새 노드가 밖에 남는다.
    if (refit) setFitAll((n) => n + 1);
    setOptions((o) =>
      adoptAfterChat.current
        ? { ...optionsFor(latest.state), selectedId: !refit && o.selectedId !== null && hasId(latest.state, o.selectedId) ? o.selectedId : null, collapsed: o.collapsed }
        : optionsFor(latest.state),
    );
    setMode({ kind: "live" });
  }
  const locked = chat.busy;
  // 도는 차례의 세션(가짜 훅처럼 모르면 구성도 대화로 친다).
  const runningKey = chat.busy ? (chat.runningKey ?? "main") : null;
  // 구성도를 바꾸는 차례(기본 대화·구성도 대화 세션). 노드 질문 차례는 구성도를 바꾸지 않는다.
  const mainTurn = chat.busy && !chat.runningAsk;

  // 설명: 대화가 끝나거나 구성도를 열면 낡은 노드를 차례로 만든다. 이력 보기·비교에서는 멈춘다.
  const explanations = useExplanations({ diagramId, state: shown, live, busy: chat.busy, selectedId: options.selectedId });
  const selId = options.selectedId;
  const selKind: TargetKind | null = selId === null ? null : shown.nodes[selId] ? "node" : shown.edges[selId] ? "edge" : null;
  const nodeLabel = (id: string) => shown.nodes[id]?.label ?? id;
  const selectionLabel =
    selId === null ? null : selKind === "node" ? nodeLabel(selId) : selKind === "edge" ? `${nodeLabel(shown.edges[selId]!.from)} → ${nodeLabel(shown.edges[selId]!.to)} 연결` : null;
  let explain: ExplanationProps | undefined;
  if (selId !== null && selKind !== null) {
    const { rewrite, retry } = explanations;
    explain = {
      ...explanations.get(selKind, selId),
      terms: explanations.terms,
      target: selKind,
      busy: locked,
      ...(live ? { onRewrite: (instruction: string) => rewrite(selKind, selId, instruction), onRetry: () => retry(selKind, selId) } : {}),
    };
  }
  const mentionRef = useRef<MentionInputHandle>(null);

  // 흐름 보기: 흐름을 켜면 노드 선택을 풀고 캔버스에 그 흐름 단계를 밝힌다. 노드를 고르거나 Esc 를 누르면 푼다.
  const flowsHook = useFlows({ diagramId, live, busy: chat.busy, versionKey: current.number });
  afterTurnRef.current = flowsHook.afterTurn;
  const { activeKey: activeFlowKey, setActive: setActiveFlow } = flowsHook;

  // 열어 둔 구성도: Claude Code 가 바꾼 것을 몇 초 안에 알아챈다. 입력 중·대화상자·이력 보기 중에는 끼어들지 않고 안내만 띄운다.
  const remotePaused = () => {
    if (mode.kind !== "live") return true;
    if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return true;
    const a = document.activeElement;
    if (!(a instanceof HTMLElement) || !workspaceRef.current?.contains(a)) return false;
    return a.isContentEditable || a.matches('input, textarea, [contenteditable]:not([contenteditable="false"])');
  };
  const remote = useRemoteChanges({
    diagramId,
    // 받아 오는 중인 버전(latest)까지는 이미 가진 것으로 친다.
    version: Math.max(current.number, latest.number),
    paused: remotePaused,
    busy: () => chat.busy || Date.now() < ownWriteUntil.current,
    onVersion: () => {
      remoteAdopt.current = mode.kind === "live" ? "poll" : "load";
      refreshFromServer();
    },
    onFlows: () => void flowsHook.refresh(),
  });
  const activateFlow = useCallback(
    (key: string | null) => {
      setActiveFlow(key);
      if (key !== null) setOptions((o) => (o.selectedId === null ? o : { ...o, selectedId: null }));
    },
    [setActiveFlow],
  );
  /** 캔버스·패널의 선택. 노드·연결을 고르면 흐름 보기를 푼다. */
  const onSelect = (id: string | null) => {
    if (id !== null) setActiveFlow(null);
    setOptions((o) => ({ ...o, selectedId: id }));
  };
  useEffect(() => {
    if (activeFlowKey === null) return;
    const onKey = (e: KeyboardEvent) => {
      // 대화상자·메뉴가 먼저 받은 Esc, 입력칸·열린 메뉴/대화상자 안의 Esc, 떠 있는 이름 말풍선을 닫는 Esc 는 건너뛴다.
      if (e.key === "Escape" && !e.defaultPrevented && !escapeBelongsElsewhere(e)) setActiveFlow(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [activeFlowKey, setActiveFlow]);
  // 단축키: / 대화 입력칸, F 전체 보기, Esc 선택 풀기. 입력칸·대화상자·메뉴·말풍선이 받은 키, 조합 키, 한글 조합 중인 키는 건너뛴다.
  // Esc 는 한 번에 한 단계: 흐름을 보고 있으면 위 처리(흐름 닫기)가 먼저다.
  const shortcut = useRef<(e: KeyboardEvent) => void>(() => {});
  shortcut.current = (e) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.isComposing || escapeBelongsElsewhere(e)) return;
    if (e.key === "/") {
      e.preventDefault();
      skipToChat();
    } else if (e.code === "KeyF" && !e.shiftKey) {
      e.preventDefault();
      setFitAll((n) => n + 1);
    } else if (e.key === "Escape" && activeFlowKey === null && options.selectedId !== null) {
      onSelect(null);
    }
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => shortcut.current(e);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  // 이전 버전을 보는 중에는 끊김을 그 버전 그림으로 다시 잰다(서버는 최신 구성도로 잰다). 비교는 현재 상태 그대로다.
  const viewState = mode.kind === "view" ? mode.state : null;
  const shownFlows = useMemo(
    () => (viewState ? flowsHook.flows.map((f) => ({ ...f, problems: checkFlow(viewState, f) })) : flowsHook.flows),
    [viewState, flowsHook.flows],
  );
  const activeFlow = activeFlowKey === null ? null : (shownFlows.find((f) => f.id === activeFlowKey) ?? null);
  // 캔버스 단계 표시: 번호는 단계 순서(1..k), 지금 그림에 없는 연결의 단계는 빼되 번호는 그대로 둔다.
  const canvasFlow = useMemo(
    () =>
      activeFlow
        ? { steps: activeFlow.steps.flatMap((st, i) => (shown.edges[st.edge] ? [{ edge: st.edge, n: i + 1, short: st.short }] : [])) }
        : null,
    [activeFlow, shown.edges],
  );

  // 설명 탭의 점: 구성도를 보는 중에 고른 항목의 설명을 아직 안 봤을 때만. 한 번 본 항목은 다시 골라도 찍지 않는다.
  const [seenExplain, setSeenExplain] = useState<ReadonlySet<string>>(() => new Set());
  useEffect(() => {
    if (mobileView !== "설명" || selId === null || seenExplain.has(selId)) return;
    setSeenExplain((s) => new Set(s).add(selId));
  }, [mobileView, selId, seenExplain]);
  const explainWaiting = selId !== null && !panelShown && !seenExplain.has(selId);

  const activeSummary = sessions.active === "main" ? null : sessions.summaryOf(sessions.active);
  /** 보고 있는 노드 질문 세션(구성도 대화면 null). */
  const activeSession = activeSummary?.kind === "node" ? activeSummary : null;
  /** 구성도를 바꾸는 대화(기본 대화 또는 구성도 대화 세션)를 보는 중. */
  const inDiagramChat = sessions.active === "main" || activeSummary?.kind === "diagram";
  // 마지막으로 쓴(본) 구성도 대화. 아직 보내지 않은 새 대화 초안은 치지 않는다(떠나면 사라진다).
  const [lastDiagram, setLastDiagram] = useState<SessionKey>("main");
  useEffect(() => {
    if (inDiagramChat && sessions.active !== NEW_SESSION) setLastDiagram(sessions.active);
  }, [inDiagramChat, sessions.active]);
  // 그 세션이 지워졌으면 기본 대화.
  const lastDiagramKey =
    lastDiagram === "main" || sessions.sessions.some((s) => s.id === lastDiagram && s.kind === "diagram") ? lastDiagram : "main";
  /**
   * 구성도를 바꾸는 차례가 갈 대화: 지금 보는 구성도 대화, 노드 질문 세션을 보고 있으면 마지막으로 쓴 구성도 대화
   * (없거나 지워졌으면 기본 대화). 참조·가정 칩·넘겨주기처럼 구성도 대화에 글을 보내는 곳이 모두 이 규칙을 따른다.
   */
  const diagramKey = inDiagramChat ? sessions.active : lastDiagramKey;
  /** 노드 질문 세션을 보고 있으면 diagramKey 의 구성도 대화로 옮긴다. */
  const toDiagramChat = () => {
    if (!inDiagramChat) sessions.select(diagramKey);
  };
  // Attach a node/group to the chat input: open the 대화 tab, then insert once the input has rendered.
  const [pendingMention, setPendingMention] = useState<{ id: string; label: string } | null>(null);
  // 참조는 지금 보는 구성도 대화(기본 대화 또는 구성도 대화 세션)에 붙인다. 노드 질문 세션을 보고 있었으면 기본 대화로 바꾼다.
  const onMention = (id: string) => {
    if (!live) return;
    const label = shown.nodes[id]?.label ?? shown.groups[id]?.label ?? id;
    showTab("대화");
    toDiagramChat();
    setPendingMention({ id, label });
  };
  useEffect(() => {
    if (!pendingMention || tab !== "대화" || !inDiagramChat) return;
    const m = pendingMention;
    setPendingMention(null);
    mentionRef.current?.insertMention(m);
    mentionRef.current?.focus();
  }, [pendingMention, tab, inDiagramChat]);

  // 대화로 건너뛰기: 대화 탭을 열고(좁은 화면이면 아래 탭도 대화로) 입력 칸에 포커스를 둔다. 입력 칸이 막혀 있으면
  // (이전 버전 보기 등) 대화 패널 본문으로 간다.
  const [skipPending, setSkipPending] = useState(false);
  const skipToChat = () => {
    showTab("대화");
    setSkipPending(true);
  };
  useEffect(() => {
    if (!skipPending || tab !== "대화") return;
    setSkipPending(false);
    mentionRef.current?.focus();
    if (document.activeElement?.tagName === "TEXTAREA") return;
    const body = document.getElementById(RIGHT_PANEL_BODY_ID);
    if (!body) return;
    if (!body.hasAttribute("tabindex")) body.setAttribute("tabindex", "-1");
    body.focus();
  }, [skipPending, tab]);

  // AI server health: once on mount, again whenever a new error line shows up. A failed fetch counts as down.
  const [health, setHealth] = useState<LlmHealth | null>(null);
  const errorLines = (chat.errors ?? 0) + chat.lines.filter((l) => l.kind === "error").length;
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/llm/health");
        const j = (await r.json()) as Partial<LlmHealth>;
        if (!r.ok || typeof j.qwen !== "string") throw new Error("bad health");
        if (alive) setHealth({ qwen: j.qwen, clef: typeof j.clef === "string" ? j.clef : "down" });
      } catch {
        if (alive) setHealth({ qwen: "down", clef: "down" });
      }
    })();
    return () => {
      alive = false;
    };
  }, [errorLines]);
  /** 지금 구성도의 노드 이름. 노드가 없으면 null(지워진 노드의 세션). */
  const labelOf = (nodeId: string) => current.state.nodes[nodeId]?.label ?? null;
  /** 차례 밖의 줄(가정 확정 실패 등)을 그 구성도 대화에 쌓는다. */
  const lineSeq = useRef(0);
  const pushDiagramLine = (line: Omit<ChatLine, "id">) => {
    if (diagramKey === "main") return chat.pushLine(line);
    lineSeq.current += 1;
    const id = `w-${lineSeq.current}`;
    sessions.setLines(diagramKey, (ls) => [...ls, { id, ...line }]);
  };
  /** 구성도 대화(diagramKey)로만 보낸다. 구조를 바꾸는 가정 변경처럼 질문 세션으로 가면 안 되는 차례가 쓴다. */
  const sendMain = (text: string, opts?: SendOptions) => {
    if (!live || chat.busy) return;
    setEditMode(false);
    adoptAfterChat.current = false;
    remoteAdopt.current = null;
    // 덧붙일 것이 없으면 예전처럼 글(과 보낼 곳)만 넘긴다.
    const rest = opts ? [opts] : [];
    if (diagramKey === "main") return void (opts ? chat.send(text, undefined, opts) : chat.send(text));
    if (diagramKey === NEW_SESSION) {
      // 새 구성도 대화의 첫 메시지: 서버가 세션을 만들고 id 를 준다. 앞서 실패한 첫 메시지 줄은 비우고 다시 시작한다.
      sessions.startNewDiagram(text);
      return void chat.send(text, { kind: "diagram", sessionId: null }, ...rest);
    }
    if (activeSummary) sessions.upsert({ ...activeSummary, updatedAt: new Date().toISOString() });
    void chat.send(text, { kind: "diagram", sessionId: diagramKey }, ...rest);
  };
  /** `새 대화`: 새 구성도 대화를 열고 입력칸으로 간다. 서버 세션은 첫 메시지를 보낼 때 만든다. */
  const newChat = () => {
    if (!live || runningKey === NEW_SESSION) return;
    sessions.startNewDiagram();
    skipToChat();
  };
  // 대화 패널의 보내기: 질문 세션을 보고 있으면 그 세션으로, 아니면 보고 있는 구성도 대화로.
  const sendChat = (text: string, opts?: SendOptions) => {
    if (inDiagramChat) return opts ? sendMain(text, opts) : sendMain(text);
    if (!live || chat.busy) return;
    // 질문 세션: 노드가 지금 구성도에 있을 때만 이어 묻는다. 새 세션은 서버가 id 를 줄 때까지 sessionId 없이 보낸다.
    if (!activeSession || labelOf(activeSession.nodeId) === null) return;
    const isNew = sessions.active === NEW_SESSION;
    // 첫 질문이 세션 id 를 받기 전에 실패했으면 초안에 실패한 말풍선이 남아 있다: 비우고 다시 시작한다.
    if (isNew) sessions.startNew({ nodeId: activeSession.nodeId, nodeLabel: activeSession.nodeLabel, text });
    else sessions.upsert({ ...activeSession, updatedAt: new Date().toISOString() });
    void chat.send(text, { kind: "ask", nodeId: activeSession.nodeId, sessionId: isNew ? null : activeSession.id });
  }; // no history view/compare/restore, edit mode or sample import while the AI answers

  /** 노드에 대해 묻기(설명 패널·우클릭 메뉴가 부른다): 대화 탭으로 가서 새 질문 세션의 첫 차례를 시작한다. */
  const startAsk = (nodeId: string, text: string): boolean => {
    const label = labelOf(nodeId);
    const t = text.trim();
    if (!live || chat.busy || label === null || !t) return false;
    showTab("대화");
    sessions.startNew({ nodeId, nodeLabel: label, text: t });
    void chat.send(t, { kind: "ask", nodeId, sessionId: null });
    return true;
  };

  // Confirm first (the model cannot overwrite confirmed assumptions), then ask the AI to adjust the structure.
  const confirmKey = async (key: string, value: string): Promise<boolean> => {
    try {
      markOwnWrite();
      const r = await confirmAssumptionAction(diagramId, key, value);
      if (!r.ok) {
        pushDiagramLine({ kind: "error", text: r.error });
        return false;
      }
      setCurrent((c) => ({ number: c.number, state: confirmAssumption(c.state, key, value) }));
      refreshFromServer();
      return true;
    } catch {
      pushDiagramLine({ kind: "error", text: "가정을 확정하지 못했어요. 다시 시도해 주세요." });
      return false;
    }
  };
  const onChooseAssumption = async (key: string, value: string) => {
    if (!live || chat.busy) return;
    // 구조를 다시 맞추는 차례라 질문 세션이 아니라 구성도 대화(diagramKey)로 보낸다. 확정 실패 줄도 보이게 먼저 옮겨 간다.
    toDiagramChat();
    if (!(await confirmKey(key, value))) return;
    sendMain(assumptionChangeMessage(key, value));
  };
  const onConfirmAssumption = (key: string) => {
    const a = current.state.assumptions[key];
    if (!live || chat.busy || !a) return;
    toDiagramChat(); // 실패 줄이 보이게
    void confirmKey(key, a.value);
  };

  // 망연계 거절 기억 지우기(가정 칩): 서버에 지우고 화면에서도 뺀다. 그 구간의 망연계 안내가 다시 보인다.
  const onRemoveNoLink = async (key: string) => {
    if (!live || chat.busy || !current.state.assumptions[key]) return;
    toDiagramChat(); // 실패 줄이 보이게
    try {
      markOwnWrite();
      const r = await removeNoLinkAction(diagramId, key);
      if (!r.ok) {
        pushDiagramLine({ kind: "error", text: r.error });
        return;
      }
      setCurrent((c) => {
        const assumptions = { ...c.state.assumptions };
        delete assumptions[key];
        return { number: c.number, state: { ...c.state, assumptions } };
      });
      refreshFromServer();
    } catch {
      pushDiagramLine({ kind: "error", text: "망연계 없음 기억을 지우지 못했어요. 다시 시도해 주세요." });
    }
  };

  // 구성 정보 카드(캔버스 왼쪽 아래). 초안·카드 펼침(위)·블록 펼침은 여기 둔다: 카드를 접으면 내용이 내려간다.
  const [checklistDrafts, setChecklistDrafts] = useState<ChecklistDrafts>({});
  const [checklistExpanded, setChecklistExpanded] = useState<ChecklistExpanded>({});
  // 배지 클릭: 카드를 펼치고 그 노드 블록을 펼쳐 첫 칸에 포커스한다. 새 토큰이면 같은 노드도 다시 간다.
  const [focus, setFocus] = useState<{ id: string; token: number } | null>(null);
  const seq = useRef(0);
  // 대화의 주의 N 칩: 카드를 펼치고 주의 절로 스크롤한다.
  const [warnScroll, setWarnScroll] = useState(0);
  // 위치 보기: 캔버스가 그 노드로 이동해 강조한다(선택은 하지 않는다).
  const [focusRequest, setFocusRequest] = useState<{ id: string; token: number } | undefined>(undefined);
  // Canvas 의 노드 계산 deps 에 들어가므로 정체성을 고정한다(setter·ref 만 쓴다).
  // 위치 보기와 같은 길로 카메라도 그 노드로 옮긴다(열린 카드를 피해 가운데에 둔다).
  const onBadgeClick = useCallback((id: string) => {
    seq.current += 1;
    setCardOpen(true);
    setFocus({ id, token: seq.current });
    setFocusRequest({ id, token: seq.current });
  }, []);
  const changeCardOpen = (o: boolean) => {
    setCardOpen(o);
    if (!o) setFocus(null); // 다시 펼쳐도 옛 대상으로 뛰지 않는다
  };
  // 대화의 주의 칩: 카드는 캔버스에 있으므로 좁은 화면이면 구성도 탭으로 간다.
  const openWarnings = () => {
    setPanelShown(false);
    setCardOpen(true);
    setWarnScroll((n) => n + 1);
  };
  const locate = (id: string) => {
    seq.current += 1;
    setFocusRequest({ id, token: seq.current });
  };
  // 경고 배지·카드 주의 항목: 그 노드를 고른다(설명 탭의 주의할 점으로 간다). Canvas memo deps 라 고정한다.
  // 이미 선택된 노드면 selectedId 가 그대로라 RightPanel 이 탭을 바꾸지 않으므로 직접 설명 탭으로 보낸다.
  const selectedRef = useRef<string | null>(options.selectedId);
  useEffect(() => {
    selectedRef.current = options.selectedId;
  });
  const selectNode = useCallback(
    (id: string) => {
      if (selectedRef.current === id) setTab("설명");
      setActiveFlow(null);
      setOptions((o) => ({ ...o, selectedId: id }));
    },
    [setActiveFlow],
  );
  // 노드의 경고 배지: 그 노드의 주의할 점(설명 탭)을 보려는 것이라 좁은 화면이면 설명 탭으로 간다.
  // 넓은 화면은 이전처럼 선택만 하고(설명 탭으로 가는 것은 RightPanel 이 한다), 선택이 풀리면 앞 탭으로 돌아간다.
  const narrowRef = useRef(narrow);
  useEffect(() => {
    narrowRef.current = narrow;
  });
  const onWarnBadge = useCallback(
    (id: string) => {
      selectNode(id);
      if (narrowRef.current) showTab("설명");
    },
    [selectNode, showTab],
  );
  // 카드 주의 항목: 선택에 더해 카메라도 그 노드로 옮긴다(열린 카드를 피해 가운데에 둔다). 같은 항목을 다시 눌러도 새 토큰으로 다시 간다.
  const onSelectWarning = useCallback(
    (id: string) => {
      selectNode(id);
      seq.current += 1;
      setFocusRequest({ id, token: seq.current });
    },
    [selectNode],
  );

  // 질문 입력 포커스: 우클릭 메뉴로 오면 그 노드의 설명 탭에서 입력칸이 포커스를 받는다(설명 탭을 떠나면 잊는다).
  const [askFocus, setAskFocus] = useState<{ id: string; token: number } | null>(null);
  useEffect(() => {
    if (tab !== "설명") setAskFocus(null);
  }, [tab]);
  const askLocked = !live || chat.busy;
  const askReason = !live ? "이전 버전을 보는 중에는 대화할 수 없어요." : chat.busy ? ELSEWHERE_BUSY : undefined;
  const onAskFromMenu = (id: string) => {
    if (askLocked) return;
    selectNode(id);
    showTab("설명");
    seq.current += 1;
    setAskFocus({ id, token: seq.current });
  };

  // Form save = one version (source form); adopt it through the same server-state path as assumptions.
  const saveFields: MissingChecklistProps["onSave"] = async (input) => {
    try {
      markOwnWrite();
      const r = await saveFieldsAction(diagramId, input);
      if (!r.ok) return { ok: false, message: r.error };
      if (r.number !== null) refreshFromServer();
      return { ok: true };
    } catch {
      return { ok: false, message: "저장하지 못했어요. 다시 시도해 주세요." };
    }
  };

  // 의도된 구성 / 다시 경고 = 한 버전. 체크리스트와 같은 서버 상태 채택 경로를 쓴다.
  const [warnSaving, setWarnSaving] = useState(false);
  const [warnError, setWarnError] = useState<string | null>(null);
  useEffect(() => setWarnError(null), [options.selectedId]); // 오류 문구는 그 선택에만 붙는다
  const onIgnoreWarning = async (id: string, ignored: boolean) => {
    if (!live || chat.busy || warnSaving) return;
    setWarnSaving(true);
    setWarnError(null);
    try {
      markOwnWrite();
      const r = await setWarningIgnoredAction(diagramId, id, ignored);
      if (!r.ok) setWarnError(r.error);
      else if (r.number !== null) refreshFromServer();
    } catch {
      setWarnError("저장하지 못했어요. 다시 시도해 주세요.");
    } finally {
      setWarnSaving(false);
    }
  };

  // 망 종류 확인·바꾸기, AI 추정 망연계 맞아요·아니에요 = 한 버전. 폼 저장과 같은 서버 상태 채택 경로를 쓴다.
  const onZoneTypeSaved = (n: number | null) => {
    if (n !== null) refreshFromServer();
  };
  const onLinkGuessSaved = (n: number | null, partial: boolean) => {
    if (n !== null) refreshFromServer();
    // 되돌리면 노드가 사라져 설명 탭의 안내도 함께 사라진다: 구성도 대화에도 한 줄 남긴다.
    if (partial) pushDiagramLine({ kind: "system", text: PARTIAL_UNDO });
  };

  const enter = (next: Mode, state: DiagramState) => {
    setMode(next);
    setEditMode(false);
    setOptions(optionsFor(state));
  };
  const backToLive = () => {
    setMode({ kind: "live" });
    setOptions(optionsFor(current.state));
  };

  const view = (number: number) =>
    !locked &&
    run(async () => {
      const state = await getVersionAction(diagramId, number);
      if (!state) return;
      enter({ kind: "view", number, state }, state);
      setPanelShown(false); // 좁은 화면: 그 버전 그림을 보러 구성도 탭으로
    });

  const compare = (number: number) =>
    !locked &&
    run(async () => {
      const old = await getVersionAction(diagramId, number);
      if (!old) return;
      const marks = diffStates(old, current.state);
      enter({ kind: "compare", number, state: old, marks }, unionState(old, current.state));
      setPanelShown(false);
    });

  const restore = (number: number) =>
    !locked &&
    run(async () => {
      expectNewBoard();
      await restoreVersionAction(diagramId, number);
      loadVersions();
    });

  // 결과 줄의 되돌리기: 이 차례가 만든 버전(v) 직전으로. 이력의 되돌리기와 같이 새 버전을 만들고, 대화에 한 줄 남긴다.
  const undoTurn = (v: number) =>
    !locked &&
    run(async () => {
      expectNewBoard();
      await restoreVersionAction(diagramId, v - 1);
      loadVersions();
      pushDiagramLine({ kind: "system", text: `방금 바꾼 것을 되돌렸어요. v${v - 1} 구성으로 돌아갔어요.` });
    });

  const importSample = (sampleId: string) =>
    !locked &&
    run(async () => {
      expectNewBoard();
      await importSampleAction(diagramId, sampleId);
      await clearPinnedAction(diagramId);
      setPinned({});
      loadVersions();
    });

  const onPinnedChange = (p: Pinned) => {
    setPinned(p);
    savePinnedAction(diagramId, p).then((r) => (r.ok ? setError(null) : setError(r.error)), fail);
  };
  // 고정 위치를 풀고 자동 배치한 뒤 화면을 맞춘다(버튼·대화 재정렬 공통). 버튼은 이력 보기·비교 중에 막힌다.
  const onAutoArrange = () => {
    setPinned({});
    setArranged((n) => n + 1);
    clearPinnedAction(diagramId).catch(fail);
  };

  const chatLines = sessions.active === "main" ? chat.lines : sessions.linesOf(sessions.active);

  const flowsLocked = !live || chat.busy;
  const flowPanel: FlowPanelProps = {
    flows: shownFlows,
    state: shown,
    activeKey: activeFlowKey,
    onActivate: activateFlow,
    // 단계: 그 연결로 카메라를 옮긴다. 좁은 화면은 캔버스가 가려져 있어 구성도 탭으로 간다.
    onFocusStep: (edgeId) => {
      locate(edgeId);
      if (narrow) setPanelShown(false);
    },
    onSuggest: () => void flowsHook.suggest(),
    suggesting: flowsHook.suggesting,
    error: flowsHook.error,
    onRename: flowsHook.rename,
    onDelete: flowsHook.remove,
    onConfirm: (key) => void flowsHook.confirm(key),
    // 끊긴 흐름: 구성도 대화로 고쳐 달라고 보낸다.
    onRepair: (flowName) => {
      if (flowsLocked) return;
      showTab("대화");
      toDiagramChat();
      sendMain(`"${flowName}" 흐름을 지금 구성에 맞게 다시 맞춰 줘`);
    },
    onRemoveStep: flowsHook.removeStep,
    disabled: flowsLocked,
  };

  const banner =
    mode.kind === "view"
      ? `v${mode.number} 보는 중`
      : mode.kind === "compare"
        ? `v${mode.number}과 현재 비교 중`
        : null;

  return (
    <NetworkKnowledgeProvider value={knowledge}>
      <div
        ref={workspaceRef}
        className={styles.workspace}
        data-workspace=""
        data-mview={panelShown ? "panel" : "canvas"}
        style={{ "--canvas-inset-left": `${insetLeft}px`, "--canvas-inset-right": `${insetRight}px` } as React.CSSProperties}
      >
        {/* 구성도 화면의 첫 Tab 칸: 캔버스 도구·노드를 건너뛰어 대화 입력으로. 포커스를 받을 때만 보인다. */}
        <button type="button" className={styles.skipLink} onClick={skipToChat}>
          대화로 건너뛰기
        </button>
        <section id={CANVAS_ID} className={styles.center} aria-label={name} {...(narrow ? { role: "tabpanel", "aria-labelledby": mobileTabId("구성도") } : {})}>
          {/* 화면에 보이는 구성도 제목이 없어 보조기기용 제목만 둔다. */}
          <h1 className={styles.srOnly}>{name}</h1>
          {/* 노드·연결을 고르면 오른쪽 패널이 설명으로 바뀐다(좁은 화면은 탭에 점만). 포커스는 캔버스에 남으므로 보조기기에 알린다. */}
          <p className={styles.srOnly} aria-live="polite" data-selection-announce="">
            {selectionLabel ? `${selectionLabel} 선택됨. 설명 탭에서 볼 수 있어요.` : ""}
          </p>
          {banner && (
            <div className={styles.banner} role="status">
              <span>{banner}</span>
              <Button size="sm" onClick={backToLive}>현재로 돌아가기</Button>
              {mode.kind === "compare" && (
                <div className={styles.legend} aria-label="범례">
                  <span><i className={`${styles.swatch} ${styles.swAdded}`} />추가 {mode.marks.added.size}</span>
                  <span><i className={`${styles.swatch} ${styles.swRemoved}`} />삭제 {mode.marks.removed.size}</span>
                  <span><i className={`${styles.swatch} ${styles.swChanged}`} />변경 {mode.marks.changed.size}</span>
                </div>
              )}
            </div>
          )}
          {/* 좁은 화면에서 대화 탭에 있어도 보이게 오류 띠와 같은 자리에 띄운다(app.module.css .alertBanner). */}
          {remote.pending && (
            <div className={`${styles.banner} ${styles.alertBanner}`} role="status">
              <span>{REMOTE_CHANGED}</span>
              <Button size="sm" onClick={remote.load}>{REMOTE_LOAD}</Button>
            </div>
          )}
          {/* 좁은 화면은 어느 탭에서든 보이게 위 막대 바로 밑에 띄운다(app.module.css .alertBanner). */}
          {error && <div className={`${styles.banner} ${styles.alertBanner}`} role="alert">{error}</div>}
          <div className={styles.canvasWrap}>
            <Canvas
              state={shown}
              knowledge={knowledge}
              pinned={live ? pinned : {}}
              editMode={live && !locked && editMode}
              options={canvasOptions}
              motion={motion}
              fitKey={`${board}:${mode.kind}:${mode.kind === "live" ? "" : mode.number}`}
              streaming={live && mainTurn}
              cameraInsets={cameraInsets}
              onOptionsChange={changeOptions}
              onSelect={onSelect}
              flow={canvasFlow}
              askDisabled={askLocked}
              {...(askReason ? { askReason } : {})}
              onPinnedChange={live ? onPinnedChange : () => {}}
              onAutoArrange={onAutoArrange}
              autoArrangeDisabled={!live}
              fitRequest={arranged}
              fitAllSignal={fitAll}
              onEditModeChange={(v) => live && !locked && setEditMode(v)}
              onMotionChange={setMotion}
              onWarnBadgeClick={onWarnBadge}
              samples={samples}
              onImportSample={importSample}
              importing={busy || locked}
              onPlaced={fly.placed}
              diagramName={name}
              {...(projectName !== undefined ? { projectName } : {})}
              {...(focusRequest ? { focusRequest } : {})}
              {...(live ? { onMention, onBadgeClick, onAskNode: onAskFromMenu } : {})}
              {...(mode.kind === "compare" ? { diffMarks: mode.marks } : {})}
            />
            <InfoCard
              state={mode.kind === "view" ? mode.state : current.state}
              readOnly={!live}
              busy={locked}
              open={cardOpen}
              onOpenChange={changeCardOpen}
              scrollToWarnings={warnScroll}
              onChooseAssumption={(k, v) => void onChooseAssumption(k, v)}
              onConfirmAssumption={onConfirmAssumption}
              {...(live ? { onRemoveNoLink: (k: string) => void onRemoveNoLink(k) } : {})}
              onSelectWarning={onSelectWarning}
              onMeasure={onCardMeasure}
              {...(live ? { zoneType: { diagramId, onSaved: onZoneTypeSaved } } : {})}
              checklist={{
                focusId: focus?.id ?? null,
                ...(focus ? { focusToken: focus.token } : {}),
                onFocusHandled: () => setFocus(null),
                onSave: saveFields,
                drafts: checklistDrafts,
                onDraftsChange: setChecklistDrafts,
                expanded: checklistExpanded,
                onExpandedChange: setChecklistExpanded,
                onLocate: locate,
              }}
            />
            <Legend hideAux={canvasOptions.hideAux} empty={Object.keys(shown.nodes).length === 0} onMeasure={setLegendWidth} {...(legendBottom !== undefined ? { bottom: legendBottom } : {})} />
          </div>
        </section>
        {!narrow && <PanelResizer width={shownPanelWidth} min={panelMin} max={panelMax} defaultWidth={PANEL_DEFAULT} onChange={changePanelWidth} offset={PANEL_GAP} />}
        <div className={styles.panelDock} style={{ "--panel-width": `${shownPanelWidth}px` } as React.CSSProperties}>
          <RightPanel
            state={shown}
            selectedId={options.selectedId}
            onSelect={onSelect}
            onMention={onMention}
            mentionDisabled={!live}
            tab={tab}
            onTabChange={setTab}
            warningState={mode.kind === "compare" ? current.state : shown}
            onHistoryOpen={loadVersions}
            live={live}
            flows={flowPanel}
            {...(narrow ? { externalTabs: { tabIdOf: mobileTabId, request: tabRequest } } : {})}
            {...(explain ? { explain } : {})}
            {...(selKind === "node"
              ? {
                  ask: {
                    disabled: askLocked,
                    ...(askReason ? { disabledReason: askReason } : {}),
                    onAsk: (text: string) => startAsk(selId!, text),
                    ...(askFocus?.id === selId ? { focusToken: askFocus.token, onFocusHandled: () => setAskFocus(null) } : {}),
                  },
                }
              : {})}
            {...(live ? { cautions: { onIgnoreWarning, ignoreDisabled: locked || warnSaving, ignoreError: warnError } } : {})}
            {...(live ? { linkGuess: { diagramId, disabled: locked, onSaved: onLinkGuessSaved } } : {})}
            history={{
              versions,
              onView: view,
              onRestore: restore,
              onCompare: compare,
              viewing: mode.kind === "live" ? null : mode.number,
              disabled: locked,
            }}
            chat={{
              lines: chatLines === "loading" ? [] : chatLines,
              loading: chatLines === "loading",
              busy: chat.busy && runningKey === sessions.active,
              elsewhereBusy: chat.busy && runningKey !== sessions.active,
              picker: {
                sessions: sessions.sessions,
                active: sessions.active,
                labelOf,
                onSelect: sessions.select,
                pending: sessions.pending,
                onNew: newChat,
                newDisabled: !live || runningKey === NEW_SESSION,
                onRename: sessions.rename,
                onDelete: sessions.remove,
                deleteDisabled: chat.busy,
                more: sessions.more,
                onMore: sessions.loadMore,
              },
              ...(activeSession ? { ask: { nodeId: activeSession.nodeId, nodeLabel: labelOf(activeSession.nodeId) } } : {}),
              ...(activeSummary?.kind === "diagram" ? { emptyHint: NEW_CHAT_HINT } : {}),
              handoffTo: diagramKey,
              onSend: sendChat,
              onStop: chat.stop,
              onOpenWarnings: openWarnings,
              turnActions: { latest: current.number, disabled: locked || busy || !live, onCompare: (v) => compare(v - 1), onUndo: undoTurn },
              health,
              mentionRef,
              ...(live ? {} : { disabledReason: "이전 버전을 보는 중에는 대화할 수 없어요." }),
            }}
          />
        </div>
        {narrow && (
          <MobileTabBar
            current={mobileView}
            onChange={chooseView}
            controls={(v) => (v === "구성도" ? CANVAS_ID : RIGHT_PANEL_BODY_ID)}
            explainWaiting={explainWaiting}
          />
        )}
        <FlyLayer ref={fly.layerRef} />
        <GhostLayer request={ghostRequest} root={workspaceRef} motion={motion} />
      </div>
    </NetworkKnowledgeProvider>
  );
}
