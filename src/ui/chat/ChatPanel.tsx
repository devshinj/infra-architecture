"use client";

import { type ReactNode, type RefObject, useLayoutEffect, useRef, useState } from "react";

import type { Assumption } from "@/domain/types";

import { AssumptionChips } from "./AssumptionChips";
import styles from "./chat.module.css";
import { MentionInput, type MentionInputHandle } from "./MentionInput";
import type { ChatLine, ChatPhase } from "./useChatTurn";

export type LlmHealth = { qwen: string; clef: string };

export interface ChatPanelProps {
  lines: ChatLine[];
  busy: boolean;
  phase: ChatPhase | null;
  onSend(text: string): void;
  onStop(): void;
  health: LlmHealth | null;
  disabledReason?: string;
  mentionRef: RefObject<MentionInputHandle | null>;
  /** Rendered under the conversation (sample list for an empty diagram). */
  footer?: ReactNode;
  /** Assumption chips above the conversation; omitted = no chips. */
  assumptions?: Record<string, Assumption>;
  onChooseAssumption?(key: string, value: string): void;
  onConfirmAssumption?(key: string): void;
  /** 빠진 정보 체크리스트. 가정 칩과 함께 대화 위쪽에 둔다. */
  checklist?: ReactNode;
}

const PHASE_LABEL: Record<ChatPhase, string> = { thinking: "구성 검토 중…", drawing: "그리는 중…", answering: "답변 작성 중…", checking: "위험 요소 점검 중…" };
const PLACEHOLDER = "만들고 싶은 서비스나 바꾸고 싶은 점을 말해 주세요. 노드를 오른쪽 클릭하면 참조를 붙일 수 있어요.";
const DOWN = "AI 서버에 연결할 수 없어요. 잠시 뒤 다시 시도하거나 관리자에게 문의해 주세요.";
const NEAR_BOTTOM = 40;

const TOKEN = /@\[([^\]]*)\]\(node:([^)]+)\)/g;

/** Shows `@[라벨](node:id)` tokens as an inline reference label. */
function renderText(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(TOKEN)) {
    const at = m.index ?? 0;
    if (at > last) out.push(text.slice(last, at));
    out.push(
      <span key={at} className={styles.ref}>
        {m[1]}
      </span>,
    );
    last = at + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function ChatPanel({ lines, busy, phase, onSend, onStop, health, disabledReason, mentionRef, footer, assumptions, onChooseAssumption, onConfirmAssumption, checklist }: ChatPanelProps) {
  const list = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const [hasContent, setHasContent] = useState(false);

  useLayoutEffect(() => {
    const el = list.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [lines]);

  const blocked = busy || !!disabledReason;
  const down = health !== null && health.qwen !== "ok";

  return (
    <div className={styles.chat}>
      {down && (
        <div className={styles.notice} role="status">
          {DOWN}
        </div>
      )}
      {(assumptions || checklist) && (
        <div className={styles.top}>
          {assumptions && (
            <AssumptionChips
              assumptions={assumptions}
              busy={blocked}
              onChoose={(k, v) => onChooseAssumption?.(k, v)}
              onConfirm={(k) => onConfirmAssumption?.(k)}
            />
          )}
          {checklist}
        </div>
      )}
      <div
        ref={list}
        className={styles.log}
        role="log"
        aria-live="polite"
        aria-label="대화 내용"
        tabIndex={0}
        onScroll={(e) => {
          const el = e.currentTarget;
          stick.current = el.scrollHeight - el.scrollTop - el.clientHeight <= NEAR_BOTTOM;
        }}
      >
        {lines.map((l) => (
          <p key={l.id} className={`${styles.line} ${styles[l.kind]}`} data-kind={l.kind}>
            {renderText(l.text)}
          </p>
        ))}
        {footer}
      </div>
      <div className={styles.phase} aria-live="polite">
        {busy && phase ? PHASE_LABEL[phase] : ""}
      </div>
      <div className={styles.composer}>
        {disabledReason && <p className={styles.reason}>{disabledReason}</p>}
        <MentionInput
          ref={mentionRef}
          placeholder={PLACEHOLDER}
          canSend={!blocked}
          disabled={!!disabledReason}
          onSend={onSend}
          onContentChange={setHasContent}
        />
        <div className={styles.actions}>
          {busy && (
            <button type="button" className={styles.btn} onClick={onStop}>
              중단
            </button>
          )}
          <button type="button" className={styles.btn} disabled={blocked || !hasContent} onClick={() => mentionRef.current?.submit()}>
            보내기
          </button>
        </div>
      </div>
    </div>
  );
}
