"use client";

import { useState, useTransition } from "react";

import { setTermReviewedAction, updateTermAction, type ActionResult } from "@/app/(app)/actions";

import type { GlossaryItem } from "@/domain/glossary-types";

import styles from "./glossary.module.css";

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
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const needle = q.trim().toLowerCase();
  const shown = items.filter(
    (t) =>
      (!unreviewedOnly || !t.reviewed) &&
      (!needle || [t.term, t.fullName, t.definition].some((s) => s.toLowerCase().includes(needle))),
  );
  const selected = items.find((t) => t.id === selectedId) ?? null;

  const draft = selected ? (drafts[selected.id] ?? toDraft(selected)) : null;
  // 저장된 값과 다른 입력이 남은 항목. 입력은 항목별로 보존한다.
  const editing = (t: GlossaryItem) => {
    const d = drafts[t.id];
    return !!d && FIELDS.some(([k]) => d[k] !== t[k]);
  };
  const setField = (id: string, base: Draft, key: FieldKey, value: string) =>
    setDrafts((m) => ({ ...m, [id]: { ...(m[id] ?? base), [key]: value } }));

  const select = (t: GlossaryItem) => {
    setSelectedId(t.id);
    setError(null);
  };

  const apply = (r: ActionResult<{ term: GlossaryItem }>, clearDraft: boolean) => {
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setError(null);
    setItems((all) => all.map((t) => (t.id === r.term.id ? r.term : t)));
    if (clearDraft) {
      setDrafts((m) => {
        const rest = { ...m };
        delete rest[r.term.id];
        return rest;
      });
    }
  };

  const attempt = (call: () => Promise<ActionResult<{ term: GlossaryItem }>>, clearDraft: boolean) =>
    start(async () => {
      try {
        apply(await call(), clearDraft);
      } catch {
        setError("처리하지 못했어요. 잠시 후 다시 시도해 주세요.");
      }
    });
  const save = () => {
    if (selected && draft) attempt(() => updateTermAction(selected.id, draft), true);
  };
  const toggleReviewed = () => {
    if (selected) attempt(() => setTermReviewedAction(selected.id, !selected.reviewed), false);
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
                    {editing(t) && <span className={styles.badge}>수정 중</span>}
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
                  <textarea value={draft[key]} onChange={(e) => setField(selected.id, draft, key, e.target.value)} />
                ) : (
                  <input value={draft[key]} onChange={(e) => setField(selected.id, draft, key, e.target.value)} />
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
