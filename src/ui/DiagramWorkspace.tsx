"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

import {
  clearPinnedAction,
  confirmAssumptionAction,
  getVersionAction,
  importSampleAction,
  listVersionsAction,
  restoreVersionAction,
  saveFieldsAction,
  savePinnedAction,
  setWarningIgnoredAction,
} from "@/app/(app)/actions";
import { Canvas, type CanvasOptions, type DiffMarks } from "@/canvas/Canvas";
import { defaultDisplayOptions } from "@/canvas/display";
import { applyCommand } from "@/domain/apply";
import { assumptionChangeMessage, confirmAssumption } from "@/domain/assumptions";
import { diffStates } from "@/domain/diff";
import type { DiagramState } from "@/domain/types";

import styles from "./app.module.css";
import type { VersionRow } from "./HistoryPanel";
import { type LlmHealth } from "./chat/ChatPanel";
import type { MentionInputHandle } from "./chat/MentionInput";
import type { ChecklistDrafts, ChecklistExpanded, MissingChecklistProps } from "./chat/MissingChecklist";
import { type ChatLine, useChatTurn } from "./chat/useChatTurn";
import { type CardMeasure, InfoCard } from "./canvas/InfoCard";
import { Legend } from "./canvas/Legend";
import { FlyLayer, useFly } from "./FlyLayer";
import type { ExplanationProps } from "./explain/Explanation";
import { type TargetKind, useExplanations } from "./explain/useExplanations";
import { PANEL_DEFAULT, PANEL_MAX, PANEL_MIN, PanelResizer } from "./PanelResizer";
import { PANEL_GAP, useShell } from "./Shell";
import { RightPanel, type Tab } from "./RightPanel";

type Pinned = Record<string, { x: number; y: number }>;
type Mode =
  | { kind: "live" }
  | { kind: "view"; number: number; state: DiagramState }
  | { kind: "compare"; number: number; state: DiagramState; marks: DiffMarks };

export interface DiagramWorkspaceProps {
  diagramId: string;
  name: string;
  latest: { number: number; state: DiagramState };
  initialPinned: Pinned;
  samples: { id: string; title: string }[];
  /** Saved conversation (Task 10 maps server messages to lines). */
  initialChat?: ChatLine[];
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

/** 구성 정보 카드의 접힌 줄 높이·카드 너비(재기 전 기본값, infoCard.module.css 와 맞춘다). */
const CARD_LINE_HEIGHT = 42;
const CARD_WIDTH = 300;

// showMissingBadges 는 브라우저 설정이라 여기서는 항상 끈 값이고, 실제 값은 아래 showMissing 상태가 덮어쓴다.
const optionsFor = (state: DiagramState): CanvasOptions => ({ ...defaultDisplayOptions(state), hoverLabels: true, showMissingBadges: false });

export function DiagramWorkspace({ diagramId, name, latest, initialPinned, samples, initialChat = [] }: DiagramWorkspaceProps) {
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
      if (Number.isFinite(n) && n >= PANEL_MIN && n <= PANEL_MAX) setPanelWidth(Math.round(n));
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
  const { sidebarExtent } = useShell();
  const insetLeft = sidebarExtent + PANEL_GAP;
  // 보이는 캔버스 띠가 360px 보다 좁아지지 않게 최대를 줄인다(너비를 모르면 줄이지 않는다).
  const panelMax = workspaceW > 0 ? Math.max(PANEL_MIN, Math.min(PANEL_MAX, workspaceW - insetLeft - 2 * PANEL_GAP - 360)) : PANEL_MAX;
  const shownPanelWidth = Math.min(panelWidth, panelMax);
  const insetRight = PANEL_GAP + shownPanelWidth + PANEL_GAP;
  // 아래: 접힌 구성 정보 카드 줄(+ 위아래 여백)은 늘 비운다. 카드가 열려 있으면 위치 보기가 카드를 피한다.
  const [cardOpen, setCardOpen] = useState(false);
  const [cardSize, setCardSize] = useState<CardMeasure | null>(null);
  const onCardMeasure = useCallback(
    (m: CardMeasure) => setCardSize((p) => (p && p.width === m.width && p.height === m.height && p.lineHeight === m.lineHeight ? p : m)),
    [],
  );
  const insetBottom = PANEL_GAP + (cardSize?.lineHeight || CARD_LINE_HEIGHT) + PANEL_GAP;
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
  // 대화 차례의 add_node: 진행 카드의 현재 단계 점에서 그 노드로 빛점이 날아간다(배치가 끝나 좌표가 나오면).
  const fly = useFly({ motion, chatVisible: tab === "대화" });
  const clearFly = fly.clear;
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
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  useEffect(() => { adoptAfterChat.current = false; }, [current.number]);
  const refreshFromServer = () => {
    adoptAfterChat.current = true;
    router.refresh();
    loadVersions();
  };
  // Import/restore bring a new board: stop treating the next adoption as the after-chat refresh.
  const expectNewBoard = () => {
    adoptAfterChat.current = false;
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  // After an interrupt the server saves the aborted version a moment later: refresh once more.
  const refreshAfterInterrupt = () => {
    refreshFromServer();
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(refreshFromServer, 1500);
  };
  const chat = useChatTurn({
    diagramId,
    initial: initialChat,
    onCommand: (cmd) => {
      const next = applyCommand(current.state, cmd).state;
      setCurrent((c) => ({ number: c.number, state: applyCommand(c.state, cmd).state }));
      // 선택한 노드·연결·영역을 대화가 지우면(빈 영역 정리 포함) 선택을 푼다: 흐림이 남지 않게.
      setOptions((o) => (o.selectedId !== null && !hasId(next, o.selectedId) ? { ...o, selectedId: null } : o));
      if (cmd.op === "add_node" && live && !current.state.nodes[cmd.id]) fly.queue(cmd.id);
    },
    // 차례가 끝나도 빛점은 비우지 않는다: 출발점은 queue 때 잡아 두어, done 뒤 배치에서도 마지막 노드로 날 수 있다.
    onDone: refreshFromServer,
    onOpenHistory: () => {
      setTab("이력");
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
  if (!chat.busy && latest.number !== current.number) {
    setCurrent(latest);
    if (!adoptAfterChat.current) setBoard((n) => n + 1);
    setOptions((o) =>
      adoptAfterChat.current
        ? { ...optionsFor(latest.state), selectedId: o.selectedId !== null && hasId(latest.state, o.selectedId) ? o.selectedId : null, collapsed: o.collapsed }
        : optionsFor(latest.state),
    );
    setMode({ kind: "live" });
  }
  const locked = chat.busy;

  // 설명: 대화가 끝나거나 구성도를 열면 낡은 노드를 차례로 만든다. 이력 보기·비교에서는 멈춘다.
  const explanations = useExplanations({ diagramId, state: shown, live, busy: chat.busy, selectedId: options.selectedId });
  const selId = options.selectedId;
  const selKind: TargetKind | null = selId === null ? null : shown.nodes[selId] ? "node" : shown.edges[selId] ? "edge" : null;
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

  // Attach a node/group to the chat input: open the 대화 tab, then insert once the input has rendered.
  const [pendingMention, setPendingMention] = useState<{ id: string; label: string } | null>(null);
  const onMention = (id: string) => {
    if (!live) return;
    const label = shown.nodes[id]?.label ?? shown.groups[id]?.label ?? id;
    setTab("대화");
    setPendingMention({ id, label });
  };
  useEffect(() => {
    if (!pendingMention || tab !== "대화") return;
    const m = pendingMention;
    setPendingMention(null);
    mentionRef.current?.insertMention(m);
    mentionRef.current?.focus();
  }, [pendingMention, tab]);

  // AI server health: once on mount, again whenever a new error line shows up. A failed fetch counts as down.
  const [health, setHealth] = useState<LlmHealth | null>(null);
  const errorLines = chat.lines.filter((l) => l.kind === "error").length;
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
  const sendChat = (text: string) => {
    if (!live || chat.busy) return;
    setEditMode(false);
    adoptAfterChat.current = false;
    void chat.send(text);
  }; // no history view/compare/restore, edit mode or sample import while the AI answers

  // Confirm first (the model cannot overwrite confirmed assumptions), then ask the AI to adjust the structure.
  const confirmKey = async (key: string, value: string): Promise<boolean> => {
    try {
      const r = await confirmAssumptionAction(diagramId, key, value);
      if (!r.ok) {
        chat.pushLine({ kind: "error", text: r.error });
        return false;
      }
      setCurrent((c) => ({ number: c.number, state: confirmAssumption(c.state, key, value) }));
      refreshFromServer();
      return true;
    } catch {
      chat.pushLine({ kind: "error", text: "가정을 확정하지 못했어요. 다시 시도해 주세요." });
      return false;
    }
  };
  const onChooseAssumption = async (key: string, value: string) => {
    if (!live || chat.busy) return;
    if (await confirmKey(key, value)) sendChat(assumptionChangeMessage(key, value));
  };
  const onConfirmAssumption = (key: string) => {
    const a = current.state.assumptions[key];
    if (!live || chat.busy || !a) return;
    void confirmKey(key, a.value);
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
  const openWarnings = () => {
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
  const selectNode = useCallback((id: string) => {
    if (selectedRef.current === id) setTab("설명");
    setOptions((o) => ({ ...o, selectedId: id }));
  }, []);
  // 카드 주의 항목: 선택에 더해 카메라도 그 노드로 옮긴다(열린 카드를 피해 가운데에 둔다). 같은 항목을 다시 눌러도 새 토큰으로 다시 간다.
  const onSelectWarning = useCallback(
    (id: string) => {
      selectNode(id);
      seq.current += 1;
      setFocusRequest({ id, token: seq.current });
    },
    [selectNode],
  );

  // Form save = one version (source form); adopt it through the same server-state path as assumptions.
  const saveFields: MissingChecklistProps["onSave"] = async (input) => {
    try {
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
      const r = await setWarningIgnoredAction(diagramId, id, ignored);
      if (!r.ok) setWarnError(r.error);
      else if (r.number !== null) refreshFromServer();
    } catch {
      setWarnError("저장하지 못했어요. 다시 시도해 주세요.");
    } finally {
      setWarnSaving(false);
    }
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
      if (state) enter({ kind: "view", number, state }, state);
    });

  const compare = (number: number) =>
    !locked &&
    run(async () => {
      const old = await getVersionAction(diagramId, number);
      if (!old) return;
      const marks = diffStates(old, current.state);
      enter({ kind: "compare", number, state: old, marks }, unionState(old, current.state));
    });

  const restore = (number: number) =>
    !locked &&
    run(async () => {
      expectNewBoard();
      await restoreVersionAction(diagramId, number);
      loadVersions();
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

  const banner =
    mode.kind === "view"
      ? `v${mode.number} 보는 중`
      : mode.kind === "compare"
        ? `v${mode.number}과 현재 비교 중`
        : null;

  return (
    <div
      ref={workspaceRef}
      className={styles.workspace}
      data-workspace=""
      style={{ "--canvas-inset-left": `${insetLeft}px`, "--canvas-inset-right": `${insetRight}px` } as React.CSSProperties}
    >
      <section className={styles.center} aria-label={name}>
        {banner && (
          <div className={styles.banner} role="status">
            <span>{banner}</span>
            <button type="button" onClick={backToLive}>현재로 돌아가기</button>
            {mode.kind === "compare" && (
              <div className={styles.legend} aria-label="범례">
                <span><i className={`${styles.swatch} ${styles.swAdded}`} />추가 {mode.marks.added.size}</span>
                <span><i className={`${styles.swatch} ${styles.swRemoved}`} />삭제 {mode.marks.removed.size}</span>
                <span><i className={`${styles.swatch} ${styles.swChanged}`} />변경 {mode.marks.changed.size}</span>
              </div>
            )}
          </div>
        )}
        {error && <div className={styles.banner} role="alert">{error}</div>}
        <div className={styles.canvasWrap}>
          <Canvas
            state={shown}
            pinned={live ? pinned : {}}
            editMode={live && !locked && editMode}
            options={canvasOptions}
            motion={motion}
            fitKey={`${board}:${mode.kind}:${mode.kind === "live" ? "" : mode.number}`}
            streaming={live && chat.busy}
            cameraInsets={cameraInsets}
            onOptionsChange={changeOptions}
            onSelect={(id) => setOptions((o) => ({ ...o, selectedId: id }))}
            onPinnedChange={live ? onPinnedChange : () => {}}
            onAutoArrange={onAutoArrange}
            autoArrangeDisabled={!live}
            fitRequest={arranged}
            onEditModeChange={(v) => live && !locked && setEditMode(v)}
            onMotionChange={setMotion}
            onWarnBadgeClick={selectNode}
            samples={samples}
            onImportSample={importSample}
            importing={busy || locked}
            onPlaced={fly.placed}
            {...(focusRequest ? { focusRequest } : {})}
            {...(live ? { onMention, onBadgeClick } : {})}
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
            onSelectWarning={onSelectWarning}
            onMeasure={onCardMeasure}
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
          <Legend hideAux={canvasOptions.hideAux} empty={Object.keys(shown.nodes).length === 0} />
        </div>
      </section>
      <PanelResizer width={shownPanelWidth} min={PANEL_MIN} max={panelMax} defaultWidth={PANEL_DEFAULT} onChange={changePanelWidth} offset={PANEL_GAP} />
      <div className={styles.panelDock} style={{ width: shownPanelWidth }}>
        <RightPanel
          state={shown}
          selectedId={options.selectedId}
          onSelect={(id) => setOptions((o) => ({ ...o, selectedId: id }))}
          onMention={onMention}
          mentionDisabled={!live}
          tab={tab}
          onTabChange={setTab}
          warningState={mode.kind === "compare" ? current.state : shown}
          onHistoryOpen={loadVersions}
          live={live}
          {...(explain ? { explain } : {})}
          {...(live ? { cautions: { onIgnoreWarning, ignoreDisabled: locked || warnSaving, ignoreError: warnError } } : {})}
          history={{
            versions,
            onView: view,
            onRestore: restore,
            onCompare: compare,
            viewing: mode.kind === "live" ? null : mode.number,
            disabled: locked,
          }}
          chat={{
            lines: chat.lines,
            busy: chat.busy,
            onSend: sendChat,
            onStop: chat.stop,
            onOpenWarnings: openWarnings,
            health,
            mentionRef,
            ...(live ? {} : { disabledReason: "이전 버전을 보는 중에는 대화할 수 없어요." }),
          }}
        />
      </div>
      <FlyLayer ref={fly.layerRef} />
    </div>
  );
}
