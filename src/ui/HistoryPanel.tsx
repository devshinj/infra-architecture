"use client";

import { useState } from "react";

import styles from "./panel.module.css";

export type VersionRow = {
  number: number;
  source: "import" | "restore" | "ai" | "form";
  status: "complete" | "aborted";
  restoredFrom: number | null;
  createdAt: Date;
};

export interface HistoryPanelProps {
  versions: VersionRow[];
  onView(number: number): void;
  onRestore(number: number): void;
  onCompare(number: number): void;
  /** Version number currently being viewed/compared, if any. */
  viewing?: number | null;
  /** True while the AI answers: every action is visibly disabled. */
  disabled?: boolean;
}

const SOURCE_LABEL: Record<VersionRow["source"], string> = { import: "가져오기", restore: "되돌리기", ai: "AI", form: "직접 입력" };

export function HistoryPanel({ versions, onView, onRestore, onCompare, viewing = null, disabled = false }: HistoryPanelProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const latest = versions.reduce((m, v) => Math.max(m, v.number), 0);
  if (versions.length === 0) return <p className={styles.empty}>아직 변경 이력이 없어요.</p>;

  return (
    <ul className={styles.versions}>
      {versions.map((v) => {
        const open = selected === v.number;
        return (
          <li key={v.number} className={styles.version} data-viewing={viewing === v.number || undefined}>
            <button type="button" className={styles.versionRow} aria-expanded={open} onClick={() => setSelected(open ? null : v.number)}>
              <span className={styles.versionNo}>v{v.number}</span>
              <span>{SOURCE_LABEL[v.source]}</span>
              {v.source === "restore" && v.restoredFrom !== null && <span className={styles.relText}>v{v.restoredFrom}에서</span>}
              {v.status === "aborted" && <span className={styles.badge}>중단됨</span>}
              <time className={styles.time} dateTime={new Date(v.createdAt).toISOString()}>
                {new Date(v.createdAt).toLocaleString("ko-KR")}
              </time>
            </button>
            {open && (
              <div className={styles.actions}>
                <button type="button" disabled={disabled} onClick={() => onView(v.number)}>이 버전 보기</button>
                <button type="button" disabled={disabled || v.number === latest} onClick={() => onRestore(v.number)}>이 버전으로 되돌리기</button>
                <button type="button" disabled={disabled || v.number === latest} onClick={() => onCompare(v.number)}>현재와 비교</button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
