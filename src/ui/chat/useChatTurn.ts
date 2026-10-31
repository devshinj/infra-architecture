"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { Command } from "@/domain/commands";
import type { Warning } from "@/domain/types";
import type { ChatEvent, MessageMeta } from "@/server/chat/events";

import { keepsCard, summaryText, warningsChip } from "./lines";

/** 진행 카드의 단계. 답변 모드는 한 단계(`답변 작성 중`)뿐이다. */
export type CardStep = "review" | "drawing" | "checking";
export interface ProgressCard {
  mode: "build" | "answer";
  step: CardStep;
  /** 이번 차례에 적용된 변경 수(cmd 이벤트마다 1. 빈 영역 정리도 cmd 로 와서 구별하지 않는다). */
  changes: number;
  /** 끝난 카드는 접힌 한 줄이 된다. */
  end?: "done" | "aborted";
  nodes?: number;
  edges?: number;
}

export interface ChatLine {
  /** React key. Initial lines use the server message id; progress lines are client-only. */
  id: string;
  /**
   * card: 진행 카드 · progress: AI 안내(say) · summary/warning: 차례 끝 칩(warning 은 `주의 N` 하나).
   * system: 안내 글(차례 밖이면 가운데 작은 글).
   */
  kind: "user" | "assistant" | "system" | "progress" | "error" | "warning" | "card" | "summary";
  text: string;
  meta?: MessageMeta;
  /** 같은 값의 줄은 한 AI 메시지로 묶인다(차례 id 또는 assistant 메시지 id). */
  turn?: string;
  /** 시각(ms). AI 메시지 머리 줄에 HH:mm 으로 보인다. */
  at?: number;
  /** kind "card" */
  card?: ProgressCard;
}

type DoneEvent = Extract<ChatEvent, { t: "done" }>;

export interface UseChatTurnArgs {
  diagramId: string;
  initial: ChatLine[];
  onCommand(cmd: Command): void;
  onDone(e: DoneEvent): void;
  onOpenHistory(): void;
  /** 대화로 재정렬을 요청함(`relayout`): 자동 정렬 버튼과 같은 동작을 한다. */
  onRelayout?(): void;
  /** The stream ended without `done` (user abort, network cut, error after commands): the saved version may differ from the canvas. */
  onInterrupted?(): void;
}

const GENERIC_ERROR = "응답을 받지 못했어요. 다시 시도해 주세요.";
const LOGIN_REQUIRED = "로그인이 필요해요. 다시 로그인해 주세요.";

let seq = 0;
const nextId = (p: string) => `${p}-${++seq}`;

const isAbort = (e: unknown) => typeof e === "object" && e !== null && (e as { name?: string }).name === "AbortError";

const ANSWER_INTENTS = new Set(["question", "other"]);

export function useChatTurn(args: UseChatTurnArgs) {
  const [lines, setLines] = useState<ChatLine[]>(args.initial);
  const [busy, setBusy] = useState(false);
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
      // 서버 응답 전에 내 말풍선과 진행 카드를 바로 띄운다.
      const turn = nextId("t");
      const at = Date.now();
      const cardId = nextId("c");
      const pushT = (line: Omit<ChatLine, "id" | "turn" | "at">) => push({ ...line, turn, at });
      push({ kind: "user", text: trimmed, at });
      push({ id: cardId, kind: "card", text: "", card: { mode: "build", step: "review", changes: 0 }, turn, at });
      const patchCard = (fn: (c: ProgressCard) => ProgressCard) =>
        setLines((ls) => ls.map((l) => (l.id === cardId && l.card ? { ...l, card: fn(l.card) } : l)));
      const removeCard = () => setLines((ls) => ls.filter((l) => l.id !== cardId));

      let answerId: string | null = null;
      let gotDone = false;
      let cmds = 0;
      let errored = false;
      let intent: string | null = null;
      /** done 없이 끝남: 그린 게 있으면 중단됨으로 남기고, 없으면 카드를 치운다. */
      const endWithoutDone = (aborted: boolean) => (aborted || cmds > 0 ? patchCard((c) => ({ ...c, end: "aborted" })) : removeCard());
      let warnings: Warning[] = []; // done 앞에 오지만 요약 칩 다음에 둔다
      const pushWarnings = () => {
        const chip = warningsChip(warnings);
        if (chip) pushT(chip);
        warnings = [];
      };

      const handle = (ev: ChatEvent) => {
        const a = argsRef.current;
        switch (ev.t) {
          case "start":
            intent = ev.intent;
            if (ev.intent && ANSWER_INTENTS.has(ev.intent)) patchCard((c) => ({ ...c, mode: "answer" }));
            break;
          case "status": {
            const p = ev.phase;
            patchCard((c) => (p === "answering" ? { ...c, mode: "answer" } : { ...c, step: p === "thinking" ? "review" : p }));
            break;
          }
          case "say":
            pushT({ kind: "progress", text: ev.text });
            break;
          case "cmd": {
            cmds++;
            patchCard((c) => ({ ...c, step: c.step === "review" ? "drawing" : c.step, changes: c.changes + 1 }));
            a.onCommand(ev.cmd);
            break;
          }
          case "answer": {
            if (answerId === null) {
              const id = nextId("a");
              answerId = id;
              setLines((ls) => [...ls, { id, kind: "assistant", text: ev.delta, turn, at }]);
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
          case "relayout":
            a.onRelayout?.();
            break;
          case "done": {
            gotDone = true;
            if (keepsCard(ev)) {
              const end = ev.status === "aborted" ? "aborted" : "done";
              patchCard((c) => ({ ...c, end, nodes: ev.nodes, edges: ev.edges }));
            } else removeCard();
            const s = summaryText(ev, answerId !== null, intent);
            if (s) pushT({ kind: "summary", text: s });
            pushWarnings();
            a.onDone(ev);
            break;
          }
          case "error":
            errored = true;
            pushT({ kind: "error", text: ev.message || GENERIC_ERROR });
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
          removeCard();
          pushT({ kind: "error", text: msg });
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
        if (!gotDone) {
          endWithoutDone(false);
          if (!errored) pushT({ kind: "error", text: GENERIC_ERROR });
        }
      } catch (e) {
        if (ctrl.signal.aborted || isAbort(e)) {
          if (!gotDone) endWithoutDone(true); // done 뒤의 중단은 완료 카드를 바꾸지 않는다
          pushT({ kind: "system", text: "중단했어요." });
          pushWarnings();
        } else {
          endWithoutDone(false);
          pushT({ kind: "error", text: GENERIC_ERROR });
        }
      } finally {
        runningRef.current = false;
        abortRef.current = null;
        setBusy(false);
        if (!gotDone && (ctrl.signal.aborted || cmds > 0)) argsRef.current.onInterrupted?.();
      }
    },
    [push],
  );

  const stop = useCallback(() => abortRef.current?.abort(), []);

  return { lines, busy, send, stop, pushLine: push };
}
