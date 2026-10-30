"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { Command } from "@/domain/commands";
import { computeMissing, missingReminder } from "@/domain/missing";
import type { DiagramState, Warning, WarningLevel } from "@/domain/types";
import type { ChatEvent, MessageMeta } from "@/server/chat/events";

import { warningLine } from "./lines";

export interface ChatLine {
  /** React key. Initial lines use the server message id; progress lines are client-only. */
  id: string;
  kind: "user" | "assistant" | "system" | "progress" | "error" | "warning";
  text: string;
  meta?: MessageMeta;
  /** kind "warning": 클릭하면 이 노드를 선택한다. */
  nodeId?: string;
  level?: WarningLevel;
}

export type ChatPhase = "thinking" | "drawing" | "answering" | "checking";
type DoneEvent = Extract<ChatEvent, { t: "done" }>;

export interface UseChatTurnArgs {
  diagramId: string;
  initial: ChatLine[];
  onCommand(cmd: Command): void;
  onDone(e: DoneEvent): void;
  onOpenHistory(): void;
  /** Live canvas state; used to compute the reminder when the user aborts (no `done` arrives). */
  getState?(): DiagramState;
  /** The stream ended without `done` (user abort, network cut, error after commands): the saved version may differ from the canvas. */
  onInterrupted?(): void;
}

const GENERIC_ERROR = "응답을 받지 못했어요. 다시 시도해 주세요.";
const LOGIN_REQUIRED = "로그인이 필요해요. 다시 로그인해 주세요.";

let seq = 0;
const nextId = (p: string) => `${p}-${++seq}`;

const isAbort = (e: unknown) => typeof e === "object" && e !== null && (e as { name?: string }).name === "AbortError";

function summary(e: DoneEvent, hadAnswer: boolean): string | null {
  if (e.version === null && e.applied === 0 && e.status === "complete") return hadAnswer ? null : "변경 사항이 없어요.";
  const base = `노드 ${e.nodes} · 연결 ${e.edges} · 적용 ${e.applied} · 건너뜀 ${e.skipped}`;
  return e.status === "aborted" ? `중단됨 · ${base}` : base;
}

export function useChatTurn(args: UseChatTurnArgs) {
  const [lines, setLines] = useState<ChatLine[]>(args.initial);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<ChatPhase | null>(null);
  const argsRef = useRef(args);
  useEffect(() => {
    argsRef.current = args;
  });
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => () => abortRef.current?.abort(), []); // unmount frees the server lock
  const runningRef = useRef(false);

  const push = useCallback((line: Omit<ChatLine, "id"> & { id?: string }) => {
    setLines((ls) => [...ls, { id: nextId("l"), ...line }]);
  }, []);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || runningRef.current) return;
      runningRef.current = true;
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setBusy(true);
      setPhase(null);
      push({ kind: "user", text: trimmed });

      let answerId: string | null = null;
      let gotDone = false;
      let cmds = 0;
      let errored = false;
      let warnings: Warning[] = []; // done 앞에 오지만 요약·빠진 정보 안내 줄 다음에 둔다
      const pushWarnings = () => {
        for (const w of warnings) push(warningLine(w));
        warnings = [];
      };

      const handle = (ev: ChatEvent) => {
        const a = argsRef.current;
        switch (ev.t) {
          case "status":
            setPhase(ev.phase);
            break;
          case "say":
            push({ kind: "progress", text: ev.text });
            break;
          case "cmd":
            cmds++;
            a.onCommand(ev.cmd);
            break;
          case "answer": {
            if (answerId === null) {
              const id = nextId("a");
              answerId = id;
              setLines((ls) => [...ls, { id, kind: "assistant", text: ev.delta }]);
            } else {
              const id = answerId;
              setLines((ls) => ls.map((l) => (l.id === id ? { ...l, text: l.text + ev.delta } : l)));
            }
            break;
          }
          case "warnings":
            warnings = ev.items;
            break;
          case "open_history":
            a.onOpenHistory();
            break;
          case "done": {
            gotDone = true;
            const s = summary(ev, answerId !== null);
            if (s) push({ kind: "system", text: s });
            if (ev.applied > 0 && ev.missing > 0) push({ kind: "system", text: missingReminder(ev.missing) });
            pushWarnings();
            a.onDone(ev);
            break;
          }
          case "error":
            errored = true;
            push({ kind: "error", text: ev.message || GENERIC_ERROR });
            break;
          default:
            break; // start, skip: nothing to show
        }
      };

      try {
        const res = await fetch(`/api/diagrams/${encodeURIComponent(argsRef.current.diagramId)}/chat`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ text: trimmed }),
          signal: ctrl.signal,
        });
        if (!res.ok || !res.body) {
          let msg = GENERIC_ERROR;
          if (res.status === 401) msg = LOGIN_REQUIRED;
          else {
            try {
              const j = (await res.json()) as { error?: unknown };
              if (typeof j.error === "string" && j.error) msg = j.error;
            } catch {
              /* keep generic */
            }
          }
          push({ kind: "error", text: msg });
          return;
        }
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        const feed = (line: string) => {
          if (!line.trim()) return;
          let ev: ChatEvent;
          try {
            ev = JSON.parse(line) as ChatEvent;
          } catch {
            return; // malformed line: ignore
          }
          handle(ev);
        };
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          let i: number;
          while ((i = buf.indexOf("\n")) >= 0) {
            feed(buf.slice(0, i));
            buf = buf.slice(i + 1);
          }
        }
        buf += dec.decode();
        feed(buf);
        if (!gotDone && !errored) push({ kind: "error", text: GENERIC_ERROR });
      } catch (e) {
        if (ctrl.signal.aborted || isAbort(e)) {
          push({ kind: "system", text: "중단했어요." });
          // The server stores meta.missing for an aborted turn; mirror the reload view from live state.
          const st = cmds > 0 ? argsRef.current.getState?.() : undefined;
          const n = st ? computeMissing(st).count : 0;
          if (n > 0) push({ kind: "system", text: missingReminder(n) });
          pushWarnings();
        }
        else push({ kind: "error", text: GENERIC_ERROR });
      } finally {
        runningRef.current = false;
        abortRef.current = null;
        setBusy(false);
        setPhase(null);
        if (!gotDone && (ctrl.signal.aborted || cmds > 0)) argsRef.current.onInterrupted?.();
      }
    },
    [push],
  );

  const stop = useCallback(() => abortRef.current?.abort(), []);

  return { lines, busy, phase, send, stop, pushLine: push };
}
