"use client";

import { useId, useState } from "react";

import { type GuideNote, NOTE_LABEL } from "@/domain/guides/types";

import styles from "./guide.module.css";

/**
 * 학습 단계 글 아래의 접힌 해설 칩(흐름 / 망 특성 / 연계 구간 / 주의). 칩마다 따로 펼친다(aria-expanded).
 * 펼친 글은 칩 줄 아래에 칩 순서대로 놓인다.
 */
export function GuideNotes({ notes }: { notes: readonly GuideNote[] }) {
  const base = useId();
  const [open, setOpen] = useState<ReadonlySet<number>>(() => new Set());
  const toggle = (i: number) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });
  if (notes.length === 0) return null;
  return (
    <div className={styles.notes}>
      <ul className={styles.noteChips} aria-label="해설">
        {notes.map((n, i) => (
          <li key={i}>
            <button
              type="button"
              className={`${styles.chip} ${styles.noteChip}`}
              aria-expanded={open.has(i)}
              aria-controls={`${base}-note-${i}`}
              onClick={() => toggle(i)}
            >
              {NOTE_LABEL[n.kind]}
            </button>
          </li>
        ))}
      </ul>
      {notes.map((n, i) => (
        <p key={i} id={`${base}-note-${i}`} className={styles.noteText} data-label={NOTE_LABEL[n.kind]} hidden={!open.has(i)}>
          {n.text}
        </p>
      ))}
    </div>
  );
}
