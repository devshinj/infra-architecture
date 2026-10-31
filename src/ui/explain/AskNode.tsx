"use client";

import { useEffect, useId, useRef, useState } from "react";

import styles from "../panel.module.css";

export interface AskNodeProps {
  nodeId: string;
  nodeLabel: string;
  disabled: boolean;
  /** 막혔을 때 입력 아래에 보이는 안내. */
  disabledReason?: string;
  onAsk(text: string): void;
  /** 바뀔 때마다 입력칸에 포커스한다(우클릭 메뉴가 올린다). */
  focusToken?: number;
}

/** 노드 설명 맨 아래 한 줄 입력: 보내면 그 노드에 대한 새 질문 세션이 열린다. */
export function AskNode({ nodeId, nodeLabel, disabled, disabledReason, onAsk, focusToken }: AskNodeProps) {
  const [text, setText] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  const reasonId = `${id}-reason`;

  // 다른 노드로 옮기면 쓰던 글을 비운다(질문이 엉뚱한 노드로 가지 않게).
  useEffect(() => setText(""), [nodeId]);
  useEffect(() => {
    if (focusToken !== undefined) input.current?.focus();
  }, [focusToken]);

  const canSend = !disabled && text.trim() !== "";
  const send = () => {
    if (!canSend) return;
    onAsk(text.trim());
    setText("");
  };

  return (
    <section className={styles.section} aria-label={`${nodeLabel} 질문`}>
      <label htmlFor={id} className={styles.heading}>이 노드에 대해 물어보기</label>
      <div className={styles.ask}>
        <input
          ref={input}
          id={id}
          className={styles.askInput}
          value={text}
          disabled={disabled}
          placeholder="예: 이 서버는 왜 두 대예요?"
          aria-describedby={disabled && disabledReason ? reasonId : undefined}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
            e.preventDefault();
            send();
          }}
        />
        <button type="button" className={styles.askSend} aria-label="질문 보내기" disabled={!canSend} onClick={send}>
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <path d="M2.5 8h10M8.5 3.5 13 8l-4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      {disabled && disabledReason && <p id={reasonId} className={styles.askReason}>{disabledReason}</p>}
    </section>
  );
}
