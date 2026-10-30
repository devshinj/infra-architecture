"use client";

import { useEffect, useRef, useState } from "react";

import { ASSUMPTION_CHOICES, ASSUMPTION_LABELS } from "@/domain/assumptions";
import type { Assumption } from "@/domain/types";

import styles from "./chat.module.css";

export interface AssumptionChipsProps {
  assumptions: Record<string, Assumption>;
  busy: boolean;
  onChoose(key: string, value: string): void;
  onConfirm(key: string): void;
  /** 이력 보기·비교: 값만 보이고 고르기·확정은 없다. */
  readOnly?: boolean;
}

const labelOf = (key: string) => ASSUMPTION_LABELS[key] ?? key;

/** Known keys in label order first, then any others alphabetically. */
function orderedKeys(assumptions: Record<string, Assumption>): string[] {
  const keys = Object.keys(assumptions);
  const known = Object.keys(ASSUMPTION_LABELS).filter((k) => keys.includes(k));
  const other = keys.filter((k) => !(k in ASSUMPTION_LABELS)).sort();
  return [...known, ...other];
}

export function AssumptionChips({ assumptions, busy, onChoose, onConfirm, readOnly = false }: AssumptionChipsProps) {
  const [open, setOpen] = useState<string | null>(null);
  const root = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    const onDown = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  useEffect(() => {
    if (busy) setOpen(null);
  }, [busy]);

  const keys = orderedKeys(assumptions);
  if (keys.length === 0) return null;

  return (
    <ul
      ref={root}
      className={styles.assumptions}
      aria-label="AI가 세운 가정"
      onKeyDown={(e) => {
        // 열린 대안 메뉴의 Escape 는 메뉴만 닫는다(감싼 구성 정보 카드까지 접지 않는다).
        if (e.key === "Escape" && open !== null) {
          e.stopPropagation();
          setOpen(null);
        }
      }}
    >
      {keys.map((key) => {
        const a = assumptions[key]!;
        const isOpen = open === key;
        const choices = ASSUMPTION_CHOICES[key] ?? [];
        if (readOnly)
          return (
            <li key={key} className={styles.assumptionItem}>
              <span className={`${styles.assumptionChip} ${styles.assumptionStatic} ${a.confirmed ? styles.assumptionConfirmed : ""}`}>
                {labelOf(key)}: {a.value}
                {a.confirmed && <span className={styles.assumptionMark}>확정</span>}
              </span>
            </li>
          );
        return (
          <li key={key} className={styles.assumptionItem}>
            <button
              type="button"
              className={`${styles.assumptionChip} ${a.confirmed ? styles.assumptionConfirmed : ""}`}
              aria-expanded={isOpen}
              disabled={busy}
              onClick={() => setOpen(isOpen ? null : key)}
            >
              {labelOf(key)}: {a.value}
              {a.confirmed && <span className={styles.assumptionMark}>확정</span>}
            </button>
            {isOpen && (
              <div className={styles.assumptionMenu} role="group" aria-label={`${labelOf(key)} 대안`}>
                {choices.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={styles.assumptionChoice}
                    disabled={busy}
                    onClick={() => {
                      setOpen(null);
                      onChoose(key, c);
                    }}
                  >
                    {c}
                    {c === a.value && <span className={styles.assumptionMark}>현재</span>}
                  </button>
                ))}
                <button
                  type="button"
                  className={styles.assumptionChoice}
                  disabled={busy}
                  onClick={() => {
                    setOpen(null);
                    onConfirm(key);
                  }}
                >
                  이대로 확정
                </button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
