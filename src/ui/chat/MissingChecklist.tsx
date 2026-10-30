"use client";

import { type Dispatch, type SetStateAction, useEffect, useMemo, useRef, useState } from "react";

import { computeMissing, type MissingItem } from "@/domain/missing";
import type { DiagramState } from "@/domain/types";

import styles from "./chat.module.css";

export interface SaveFieldsDraft {
  targetKind: "node" | "edge";
  targetId: string;
  values: Record<string, string>;
  unknown: string[];
}

export interface MissingChecklistProps {
  state: DiagramState;
  busy: boolean;
  /** 이 대상 블록을 펼쳐 보이고 첫 칸에 포커스한다. */
  focusId: string | null;
  /** 같은 focusId 를 다시 가리킬 때 바꾼다(배지를 다시 눌렀을 때). */
  focusToken?: number;
  onSave(input: SaveFieldsDraft): Promise<{ ok: true } | { ok: false; message: string }>;
  /** 초안과 펼침은 부모가 들고 있다: 탭을 옮겨 이 컴포넌트가 내려가도 남는다. */
  drafts: ChecklistDrafts;
  onDraftsChange: Dispatch<SetStateAction<ChecklistDrafts>>;
  open: boolean;
  onOpenChange(open: boolean): void;
}

// 대상별 초안. 모름은 사용자가 건드린 칸만 담고, 나머지는 서버 상태를 따른다.
export type ChecklistDraft = { values: Record<string, string>; unknown: Record<string, boolean> };
export type ChecklistDrafts = Record<string, ChecklistDraft>;
type Draft = ChecklistDraft;
type Block = { targetKind: "node" | "edge"; targetId: string; title: string; items: MissingItem[] };

const EMPTY: Draft = { values: {}, unknown: {} };

const without = <T,>(rec: Record<string, T>, id: string): Record<string, T> => {
  if (!(id in rec)) return rec;
  const next = { ...rec };
  delete next[id];
  return next;
};

function blocksOf(state: DiagramState, items: MissingItem[]): Block[] {
  const map = new Map<string, Block>();
  const nameOf = (id: string) => state.nodes[id]?.label ?? state.groups[id]?.label ?? id;
  for (const it of items) {
    let b = map.get(it.targetId);
    if (!b) {
      const edge = it.targetKind === "edge" ? state.edges[it.targetId] : undefined;
      const title = edge ? `${nameOf(edge.from)} → ${nameOf(edge.to)}` : nameOf(it.targetId);
      b = { targetKind: it.targetKind, targetId: it.targetId, title, items: [] };
      map.set(it.targetId, b);
    }
    b.items.push(it);
  }
  return [...map.values()];
}

export function MissingChecklist({ state, busy, focusId, focusToken, onSave, drafts, onDraftsChange: setDrafts, open, onOpenChange }: MissingChecklistProps) {
  const { items, count } = useMemo(() => computeMissing(state), [state]);
  const blocks = useMemo(() => blocksOf(state, items), [state, items]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [pendingFocus, setPendingFocus] = useState<string | null>(null);
  const blockRefs = useRef<Record<string, HTMLElement | null>>({});

  // 사라진 대상의 초안·오류만 버린다.
  const targetKey = blocks.map((b) => b.targetId).join("\n");
  useEffect(() => {
    const alive = new Set(targetKey ? targetKey.split("\n") : []);
    const keep = <T,>(rec: Record<string, T>) => {
      const ids = Object.keys(rec);
      return ids.every((id) => alive.has(id)) ? rec : Object.fromEntries(ids.filter((id) => alive.has(id)).map((id) => [id, rec[id]!]));
    };
    setDrafts(keep);
    setErrors(keep);
  }, [targetKey, setDrafts]);

  useEffect(() => {
    if (focusId === null) return;
    onOpenChange(true);
    setPendingFocus(focusId);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 대상·토큰이 바뀔 때만 펼친다
  }, [focusId, focusToken]);

  useEffect(() => {
    if (!open || pendingFocus === null) return;
    setPendingFocus(null);
    const el = blockRefs.current[pendingFocus];
    if (!el) return;
    el.scrollIntoView?.({ block: "nearest" });
    const first = el.querySelector<HTMLInputElement>('input[type="text"]:not(:disabled)') ?? el.querySelector<HTMLInputElement>("input");
    first?.focus();
  }, [open, pendingFocus]);

  if (items.length === 0) return null;

  const draftOf = (id: string) => drafts[id] ?? EMPTY;
  const isUnknown = (b: Block, it: MissingItem) => draftOf(b.targetId).unknown[it.key] ?? it.unknown;
  const patch = (id: string, fn: (d: Draft) => Draft) => setDrafts((all) => ({ ...all, [id]: fn(all[id] ?? EMPTY) }));

  const save = async (b: Block) => {
    const d = draftOf(b.targetId);
    const values: Record<string, string> = {};
    const unknown: string[] = [];
    for (const it of b.items) {
      if (isUnknown(b, it)) {
        unknown.push(it.key);
        continue;
      }
      const v = (d.values[it.key] ?? "").trim();
      if (v) values[it.key] = v;
    }
    setSaving(true);
    setErrors((all) => without(all, b.targetId));
    try {
      const r = await onSave({ targetKind: b.targetKind, targetId: b.targetId, values, unknown });
      if (r.ok) setDrafts((all) => without(all, b.targetId));
      else setErrors((all) => ({ ...all, [b.targetId]: r.message }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={styles.missing} aria-label="빠진 정보">
      <button type="button" className={styles.missingHead} aria-expanded={open} onClick={() => onOpenChange(!open)}>
        채워야 할 정보 (<span className={styles.missingCount}>{count}</span>)
      </button>
      {open && (
        <div className={styles.missingBody}>
          {blocks.map((b) => {
            const d = draftOf(b.targetId);
            const err = errors[b.targetId];
            return (
              <div
                key={b.targetId}
                ref={(el) => {
                  blockRefs.current[b.targetId] = el;
                }}
                className={styles.missingBlock}
                role="group"
                aria-label={b.title}
              >
                <p className={styles.missingTitle}>{b.title}</p>
                {b.items.map((it) => {
                  const id = `missing-${b.targetId}-${it.key}`;
                  const unk = isUnknown(b, it);
                  return (
                    <div key={it.key} className={styles.missingRow}>
                      <label htmlFor={id} className={styles.missingLabel}>
                        {it.label}
                      </label>
                      <input
                        id={id}
                        type="text"
                        className={styles.missingInput}
                        value={d.values[it.key] ?? ""}
                        disabled={unk}
                        onChange={(e) => {
                          const v = e.target.value;
                          patch(b.targetId, (x) => ({ ...x, values: { ...x.values, [it.key]: v } }));
                        }}
                      />
                      <label className={styles.missingUnknown}>
                        <input
                          type="checkbox"
                          aria-label={`${it.label} 모름`}
                          checked={unk}
                          onChange={(e) => {
                            const v = e.target.checked;
                            patch(b.targetId, (x) => ({ ...x, unknown: { ...x.unknown, [it.key]: v } }));
                          }}
                        />
                        모름
                      </label>
                    </div>
                  );
                })}
                <div className={styles.actions}>
                  <button type="button" className={styles.btn} disabled={busy || saving} onClick={() => void save(b)}>
                    저장
                  </button>
                </div>
                {err && (
                  <p className={styles.missingError} role="alert">
                    {err}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
