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
import { ASSUMPTION_LABELS, confirmAssumption } from "@/domain/assumptions";
import { diffStates } from "@/domain/diff";
import type { DiagramState } from "@/domain/types";

import styles from "./app.module.css";
import type { VersionRow } from "./HistoryPanel";
import { type LlmHealth } from "./chat/ChatPanel";
import type { MentionInputHandle } from "./chat/MentionInput";
import { type ChecklistDrafts, MissingChecklist, type MissingChecklistProps } from "./chat/MissingChecklist";
import { type ChatLine, useChatTurn } from "./chat/useChatTurn";
import { PANEL_DEFAULT, PANEL_MAX, PANEL_MIN, PanelResizer } from "./PanelResizer";
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

const PANEL_WIDTH_KEY = "infrasketch.panelWidth";

const optionsFor = (state: DiagramState): CanvasOptions => ({ ...defaultDisplayOptions(state), hoverLabels: true });

export function DiagramWorkspace({ diagramId, name, latest, initialPinned, samples, initialChat = [] }: DiagramWorkspaceProps) {
  const router = useRouter();
  const [current, setCurrent] = useState(latest);
  const [pinned, setPinned] = useState<Pinned>(initialPinned);
  const [options, setOptions] = useState<CanvasOptions>(() => optionsFor(latest.state));
  const [editMode, setEditMode] = useState(false);
  const [motion, setMotion] = useState(true);
  const [mode, setMode] = useState<Mode>({ kind: "live" });
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
  // 캔버스가 360px 보다 좁아지지 않게 최대를 줄인다(너비를 모르면 줄이지 않는다).
  const panelMax = workspaceW > 0 ? Math.max(PANEL_MIN, Math.min(PANEL_MAX, workspaceW - 360)) : PANEL_MAX;
  const shownPanelWidth = Math.min(panelWidth, panelMax);
  const changePanelWidth = (w: number) => {
    setPanelWidth(w);
    try {
      window.localStorage.setItem(PANEL_WIDTH_KEY, String(w));
    } catch {
      /* 저장 실패는 이번 방문에만 영향 */
    }
  };
  const [tab, setTab] = useState<Tab>("대화");
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
  // After an interrupt the server saves the aborted version a moment later: refresh once more.
  const refreshAfterInterrupt = () => {
    refreshFromServer();
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(refreshFromServer, 1500);
  };
  const chat = useChatTurn({
    diagramId,
    initial: initialChat,
    onCommand: (cmd) => setCurrent((c) => ({ number: c.number, state: applyCommand(c.state, cmd).state })),
    onDone: refreshFromServer,
    onOpenHistory: () => {
      setTab("이력");
      loadVersions();
    },
    onInterrupted: refreshAfterInterrupt,
    getState: () => current.state,
  });
  // The server re-renders with a newer version after import/restore/chat: adopt it, but never mid-turn
  // (it would wipe the commands already streamed); the done-refresh brings the newer version later.
  if (!chat.busy && latest.number !== current.number) {
    setCurrent(latest);
    setOptions((o) => (adoptAfterChat.current ? { ...optionsFor(latest.state), selectedId: o.selectedId, collapsed: o.collapsed } : optionsFor(latest.state)));
    setMode({ kind: "live" });
  }
  const locked = chat.busy;
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
    if (await confirmKey(key, value)) sendChat(`가정 변경: ${ASSUMPTION_LABELS[key] ?? key} → ${value}. 이 가정에 맞게 구성을 조정해 줘.`);
  };
  const onConfirmAssumption = (key: string) => {
    const a = current.state.assumptions[key];
    if (!live || chat.busy || !a) return;
    void confirmKey(key, a.value);
  };

  // Badge click: open the 대화 tab checklist at that node. A fresh token re-triggers the same node.
  const [focus, setFocus] = useState<{ id: string; token: number } | null>(null);
  const focusSeq = useRef(0);
  // Drafts and the expanded state live here: the 대화 tab (and the checklist) unmounts on tab switches.
  const [checklistDrafts, setChecklistDrafts] = useState<ChecklistDrafts>({});
  const [checklistOpen, setChecklistOpen] = useState(false);
  // Canvas 의 노드 계산 deps 에 들어가므로 정체성을 고정한다(setter·ref 만 쓴다).
  const onBadgeClick = useCallback((id: string) => {
    setTab("대화");
    focusSeq.current += 1;
    setFocus({ id, token: focusSeq.current });
  }, []);
  // 경고 배지·대화 경고 줄: 그 노드를 고른다(설명 탭의 주의할 점으로 간다). Canvas memo deps 라 고정한다.
  // 이미 선택된 노드면 selectedId 가 그대로라 RightPanel 이 탭을 바꾸지 않으므로 직접 설명 탭으로 보낸다.
  const selectedRef = useRef<string | null>(options.selectedId);
  useEffect(() => {
    selectedRef.current = options.selectedId;
  });
  const selectNode = useCallback((id: string) => {
    if (selectedRef.current === id) {
      setTab("설명");
      setFocus(null); // onTabChange 와 같이: 대화로 돌아와도 옛 대상으로 뛰지 않는다
    }
    setOptions((o) => ({ ...o, selectedId: id }));
  }, []);
  const onTabChange = (t: Tab) => {
    setTab(t);
    if (t !== "대화") setFocus(null); // coming back to 대화 must not jump to the old target again
  };

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
      await restoreVersionAction(diagramId, number);
      loadVersions();
    });

  const importSample = (sampleId: string) =>
    !locked &&
    run(async () => {
      await importSampleAction(diagramId, sampleId);
      await clearPinnedAction(diagramId);
      setPinned({});
      loadVersions();
    });

  const onPinnedChange = (p: Pinned) => {
    setPinned(p);
    savePinnedAction(diagramId, p).then((r) => (r.ok ? setError(null) : setError(r.error)), fail);
  };
  const onAutoArrange = () => {
    setPinned({});
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
      style={{ gridTemplateColumns: `minmax(0, 1fr) ${shownPanelWidth}px` }}
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
            options={options}
            motion={motion}
            fitKey={`${current.number}:${mode.kind}:${mode.kind === "live" ? "" : mode.number}`}
            onOptionsChange={setOptions}
            onSelect={(id) => setOptions((o) => ({ ...o, selectedId: id }))}
            onPinnedChange={live ? onPinnedChange : () => {}}
            onAutoArrange={onAutoArrange}
            onEditModeChange={(v) => live && !locked && setEditMode(v)}
            onMotionChange={setMotion}
            onWarnBadgeClick={selectNode}
            {...(live ? { onMention, onBadgeClick } : {})}
            {...(mode.kind === "compare" ? { diffMarks: mode.marks } : {})}
          />
        </div>
      </section>
      <PanelResizer width={shownPanelWidth} min={PANEL_MIN} max={panelMax} defaultWidth={PANEL_DEFAULT} onChange={changePanelWidth} />
      <RightPanel
        state={shown}
        selectedId={options.selectedId}
        onSelect={(id) => setOptions((o) => ({ ...o, selectedId: id }))}
        onMention={onMention}
        mentionDisabled={!live}
        samples={samples}
        onImportSample={importSample}
        importing={busy || locked}
        tab={tab}
        onTabChange={onTabChange}
        warningState={mode.kind === "compare" ? current.state : shown}
        onHistoryOpen={loadVersions}
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
          phase: chat.phase,
          onSend: sendChat,
          onStop: chat.stop,
          onSelectNode: selectNode,
          assumptions: current.state.assumptions,
          onChooseAssumption,
          onConfirmAssumption,
          checklist: (
            <MissingChecklist
              state={current.state}
              busy={locked || !live}
              focusId={focus?.id ?? null}
              {...(focus ? { focusToken: focus.token } : {})}
              onSave={saveFields}
              drafts={checklistDrafts}
              onDraftsChange={setChecklistDrafts}
              open={checklistOpen}
              onOpenChange={setChecklistOpen}
            />
          ),
          health,
          mentionRef,
          ...(live ? {} : { disabledReason: "이전 버전을 보는 중에는 대화할 수 없어요." }),
        }}
      />
    </div>
  );
}
