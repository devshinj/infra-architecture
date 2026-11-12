"use client";

import { useState } from "react";

import { Button } from "./Button";
import styles from "./panel.module.css";

export type VersionRow = {
  number: number;
  source: "import" | "restore" | "ai" | "form" | "mcp";
  status: "complete" | "aborted";
  restoredFrom: number | null;
  via?: "mcp" | null;
  summary?: string | null;
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

const SOURCE_LABEL: Record<VersionRow["source"], string> = { import: "가져오기", restore: "되돌리기", ai: "AI", form: "직접 입력", mcp: "MCP로" };

/**
 * 되돌려진 버전들: 그 버전 뒤의 되돌리기 가운데 마지막 것이 그 버전보다 앞 버전으로 갔으면(restoredFrom < v) 그 버전의
 * 변경은 지금 구성에 없다. 그 뒤 다시 그 버전 이후로 되돌렸으면(restoredFrom ≥ v) 되살아난 것으로 본다.
 * 대화의 차례 요약 줄을 흐리게 하는 데 쓴다(새로고침 뒤에도 이력에서 다시 계산된다).
 */
export function undoneVersions(versions: VersionRow[]): Set<number> {
  const restores = versions.filter((v) => v.source === "restore" && v.restoredFrom !== null).sort((a, b) => a.number - b.number);
  const out = new Set<number>();
  for (const v of versions) {
    if (v.source === "restore") continue;
    const last = restores.filter((r) => r.number > v.number).at(-1);
    if (last && last.restoredFrom! < v.number) out.add(v.number);
  }
  return out;
}

/** 이력 시각: 가까운 것은 상대 시각(방금 · N분 전 · N시간 전 · N일 전), 30일이 넘으면 날짜. 전체 시각은 title 로. */
export function relativeTime(at: Date, now: number = Date.now()): string {
  const s = Math.max(0, Math.round((now - at.getTime()) / 1000));
  if (s < 60) return "방금";
  if (s < 3600) return `${Math.floor(s / 60)}분 전`;
  if (s < 86_400) return `${Math.floor(s / 3600)}시간 전`;
  if (s < 30 * 86_400) return `${Math.floor(s / 86_400)}일 전`;
  return at.toLocaleDateString("ko-KR");
}

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
              <span>{v.source === "restore" && v.via === "mcp" ? "되돌리기 · MCP로" : SOURCE_LABEL[v.source]}</span>
              {v.source === "restore" && v.restoredFrom !== null && <span className={styles.relText}>v{v.restoredFrom}에서</span>}
              {v.summary && (
                <span className={`${styles.relText} ${styles.versionSummary}`} title={v.summary}>
                  {v.summary}
                </span>
              )}
              {v.status === "aborted" && <span className={styles.badge}>중단됨</span>}
              {v.number === latest && <span className={styles.now}>지금</span>}
              <time className={styles.time} dateTime={new Date(v.createdAt).toISOString()} title={new Date(v.createdAt).toLocaleString("ko-KR")}>
                {relativeTime(new Date(v.createdAt))}
              </time>
            </button>
            {open && (
              <div className={styles.actions}>
                <Button size="sm" disabled={disabled} onClick={() => onView(v.number)}>이 버전 보기</Button>
                <Button size="sm" disabled={disabled || v.number === latest} onClick={() => onRestore(v.number)}>이 버전으로 되돌리기</Button>
                <Button size="sm" disabled={disabled || v.number === latest} onClick={() => onCompare(v.number)}>현재와 비교</Button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
