"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

import {
  clearPinnedAction,
  getVersionAction,
  importSampleAction,
  listVersionsAction,
  restoreVersionAction,
  savePinnedAction,
} from "@/app/(app)/actions";
import { Canvas, type CanvasOptions, type DiffMarks } from "@/canvas/Canvas";
import { defaultDisplayOptions } from "@/canvas/display";
import { applyCommand } from "@/domain/apply";
import { diffStates } from "@/domain/diff";
import type { DiagramState } from "@/domain/types";

import styles from "./app.module.css";
import type { VersionRow } from "./HistoryPanel";
import { type ChatLine, useChatTurn } from "./chat/useChatTurn";
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
  });
  // The server re-renders with a newer version after import/restore/chat: adopt it, but never mid-turn
  // (it would wipe the commands already streamed); the done-refresh brings the newer version later.
  if (!chat.busy && latest.number !== current.number) {
    setCurrent(latest);
    setOptions((o) => (adoptAfterChat.current ? { ...optionsFor(latest.state), selectedId: o.selectedId, collapsed: o.collapsed } : optionsFor(latest.state)));
    setMode({ kind: "live" });
  }
  const locked = chat.busy; // no history view/compare/restore, edit mode or sample import while the AI answers

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
    <div className={styles.workspace}>
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
            {...(mode.kind === "compare" ? { diffMarks: mode.marks } : {})}
          />
        </div>
      </section>
      <RightPanel
        state={shown}
        selectedId={options.selectedId}
        onSelect={(id) => setOptions((o) => ({ ...o, selectedId: id }))}
        samples={samples}
        onImportSample={importSample}
        importing={busy || locked}
        tab={tab}
        onTabChange={setTab}
        onHistoryOpen={loadVersions}
        history={{
          versions,
          onView: view,
          onRestore: restore,
          onCompare: compare,
          viewing: mode.kind === "live" ? null : mode.number,
        }}
      />
    </div>
  );
}
