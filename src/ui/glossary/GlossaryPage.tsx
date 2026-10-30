"use client";

import { useState, useTransition } from "react";

import { setTermReviewedAction, updateTermAction, type ActionResult } from "@/app/(app)/actions";

import styles from "./glossary.module.css";

export interface GlossaryItem {
  id: string;
  key: string;
  term: string;
  fullName: string;
  category: string;
  definition: string;
  why: string;
  compare: string;
  source: "seed" | "ai";
  reviewed: boolean;
}

const FIELDS = [
  ["term", "용어", false],
  ["fullName", "정식 명칭", false],
  ["category", "분류", false],
  ["definition", "정의", true],
  ["why", "필요한 이유", true],
  ["compare", "비교", true],
] as const;
type FieldKey = (typeof FIELDS)[number][0];
type Draft = Record<FieldKey, string>;

const toDraft = (t: GlossaryItem): Draft => ({
  term: t.term,
  fullName: t.fullName,
  category: t.category,
  definition: t.definition,
  why: t.why,
  compare: t.compare,
});

export function GlossaryPage({ initial }: { initial: GlossaryItem[] }) {
  const [items, setItems] = useState(initial);
  const [q, setQ] = useState("");
  const [unreviewedOnly, setUnreviewedOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const needle = q.trim().toLowerCase();
  const shown = items.filter(
    (t) =>
      (!unreviewedOnly || !t.reviewed) &&
      (!needle || [t.term, t.fullName, t.definition].some((s) => s.toLowerCase().includes(needle))),
  );
  const selected = items.find((t) => t.id === selectedId) ?? null;

  const select = (t: GlossaryItem) => {
    setSelectedId(t.id);
    setDraft(toDraft(t));
    setError(null);
  };

  const apply = (r: ActionResult<{ term: GlossaryItem }>, resetDraft: boolean) => {
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setError(null);
    setItems((all) => all.map((t) => (t.id === r.term.id ? r.term : t)));
    if (resetDraft) setDraft(toDraft(r.term));
  };

  const save = () => {
    if (selected && draft) start(async () => apply(await updateTermAction(selected.id, draft), true));
  };
  const toggleReviewed = () => {
    if (selected) start(async () => apply(await setTermReviewedAction(selected.id, !selected.reviewed), false));
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>용어 사전</h1>
      <div className={styles.tools}>
        <input
          type="search"
          className={styles.search}
          placeholder="용어 검색"
          aria-label="용어 검색"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <label>
          <input type="checkbox" checked={unreviewedOnly} onChange={(e) => setUnreviewedOnly(e.target.checked)} />
          미검수만
        </label>
      </div>
      <div className={styles.body}>
        {shown.length === 0 ? (
          <p className={styles.empty}>맞는 용어가 없어요.</p>
        ) : (
          <ul className={styles.list}>
            {shown.map((t) => (
              <li key={t.id}>
                <button type="button" className={styles.item} aria-current={t.id === selectedId} onClick={() => select(t)}>
                  <span className={styles.head}>
                    <strong>{t.term}</strong>
                    {t.category && <span className={styles.meta}>{t.category}</span>}
                    {!t.reviewed && <span className={styles.badge}>미검수</span>}
                    <span className={styles.meta}>{t.source === "seed" ? "초기" : "AI"}</span>
                  </span>
                  <p className={styles.snippet}>{t.definition}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
        {selected && draft && (
          <form
            className={styles.form}
            aria-label={`${selected.term} 편집`}
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            {FIELDS.map(([key, label, multiline]) => (
              <label key={key}>
                {label}
                {multiline ? (
                  <textarea value={draft[key]} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} />
                ) : (
                  <input value={draft[key]} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} />
                )}
              </label>
            ))}
            {error && <p className={styles.error} role="alert">{error}</p>}
            <div className={styles.actions}>
              <button type="submit" disabled={pending}>저장</button>
              <button type="button" disabled={pending} onClick={toggleReviewed}>
                {selected.reviewed ? "검수 취소" : "검수 완료"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
