"use client";

import type { KeyboardEvent as ReactKeyboardEvent } from "react";

import { usePopover } from "@/canvas/usePopover";

import styles from "./chat.module.css";
import { NEW_SESSION, type SessionKey, type SessionSummary } from "./useSessions";

export interface SessionPickerProps {
  /** 질문 세션들(순서는 상관없다, 최신순으로 보인다). */
  sessions: SessionSummary[];
  active: SessionKey;
  /** 지금 구성도의 노드 이름. 노드가 지워졌으면 null. */
  labelOf(nodeId: string): string | null;
  onSelect(key: SessionKey): void;
  /** 서버가 아직 id 를 주지 않은 새 질문 세션(고른 상태일 때 버튼 글에 쓴다). */
  pending?: SessionSummary | null;
}

const MAIN_LABEL = "구성도 대화";

const pad = (n: number) => String(n).padStart(2, "0");
/** 오늘이면 HH:mm, 아니면 M/D. */
function when(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const today = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  return today ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : `${d.getMonth() + 1}/${d.getDate()}`;
}

/** 노드 이름(지금 이름, 지워졌으면 만들 때 이름 + ` (지워짐)`) · 제목. 노드 이름 뒤에 조사를 붙이지 않는다. */
function sessionName(s: SessionSummary, labelOf: (nodeId: string) => string | null): string {
  const name = labelOf(s.nodeId) ?? `${s.nodeLabel} (지워짐)`;
  return `${name} · ${s.title}`;
}

const Chevron = () => (
  <svg className={styles.sessionChevron} width="8" height="8" viewBox="0 0 8 8" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1.5 3 4 5.5 6.5 3" />
  </svg>
);

/**
 * 대화 탭 맨 위 `구성도 대화 ▾`: 구성도 대화와 노드 질문 세션 사이를 오간다.
 * 질문 세션이 하나도 없으면 글자만 보이고 누를 수 없다.
 */
export function SessionPicker({ sessions, active, labelOf, onSelect, pending = null }: SessionPickerProps) {
  const { open, setOpen, root, trigger } = usePopover('[role="menuitem"]');
  const current = active === NEW_SESSION ? pending : (sessions.find((s) => s.id === active) ?? null);
  const label = active === "main" || !current ? MAIN_LABEL : sessionName(current, labelOf);
  const canOpen = sessions.length > 0 || active !== "main";
  const sorted = [...sessions].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));

  const move = (e: ReactKeyboardEvent<HTMLUListElement>) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const items = [...e.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]')];
    const at = items.indexOf(document.activeElement as HTMLElement);
    items[(at + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]?.focus();
  };
  const choose = (key: SessionKey) => {
    setOpen(false);
    trigger.current?.focus();
    if (key !== active) onSelect(key);
  };

  return (
    <div ref={root} className={styles.sessionBar}>
      <button
        ref={trigger}
        type="button"
        className={styles.sessionBtn}
        disabled={!canOpen}
        {...(canOpen ? { "aria-haspopup": "menu" as const, "aria-expanded": open } : {})}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.sessionLabel}>{label}</span>
        {canOpen && <Chevron />}
      </button>
      {open && (
        <ul className={styles.sessionList} role="menu" aria-label="대화 고르기" onKeyDown={move}>
          <li role="none">
            <button type="button" role="menuitem" className={styles.sessionItem} {...(active === "main" ? { "aria-current": "true" as const } : {})} onClick={() => choose("main")}>
              <span className={styles.sessionLabel}>{MAIN_LABEL}</span>
            </button>
          </li>
          {active === NEW_SESSION && pending && (
            <li role="none">
              <button type="button" role="menuitem" className={styles.sessionItem} aria-current="true" onClick={() => choose(NEW_SESSION)}>
                <span className={styles.sessionLabel}>{sessionName(pending, labelOf)}</span>
                <time className={styles.sessionTime} dateTime={pending.updatedAt}>
                  {when(pending.updatedAt)}
                </time>
              </button>
            </li>
          )}
          {sorted.map((s) => (
            <li key={s.id} role="none">
              <button type="button" role="menuitem" className={styles.sessionItem} {...(active === s.id ? { "aria-current": "true" as const } : {})} onClick={() => choose(s.id)}>
                <span className={styles.sessionLabel}>{sessionName(s, labelOf)}</span>
                <time className={styles.sessionTime} dateTime={s.updatedAt}>
                  {when(s.updatedAt)}
                </time>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
