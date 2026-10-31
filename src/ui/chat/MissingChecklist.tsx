"use client";

import { type Dispatch, type SetStateAction, useEffect, useMemo, useRef, useState } from "react";

import { CategoryIcon } from "@/canvas/icons";
import { type Category, NODE_KINDS } from "@/domain/catalog";
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
  /** 이력 보기·비교: 입력을 막고 저장 버튼을 숨긴다. */
  readOnly?: boolean;
  /** 이 대상 블록을 펼쳐 보이고 첫 칸에 포커스한다. */
  focusId: string | null;
  /** 같은 focusId 를 다시 가리킬 때 바꾼다(배지를 다시 눌렀을 때). */
  focusToken?: number;
  /** 포커스 요청을 처리했다: 부모가 요청을 지워 다시 마운트돼도 포커스를 빼앗지 않게 한다. */
  onFocusHandled?(): void;
  onSave(input: SaveFieldsDraft): Promise<{ ok: true } | { ok: false; message: string }>;
  /** 초안과 블록 펼침은 부모가 들고 있다: 카드를 접어 이 컴포넌트가 내려가도 남는다. */
  drafts: ChecklistDrafts;
  onDraftsChange: Dispatch<SetStateAction<ChecklistDrafts>>;
  expanded: ChecklistExpanded;
  onExpandedChange: Dispatch<SetStateAction<ChecklistExpanded>>;
  /** 블록 제목(`<이름> 위치 보기`) 클릭: 캔버스가 그 대상으로 이동해 강조한다. 선택은 하지 않는다. */
  onLocate?(targetId: string): void;
}

// 대상별 초안. 모름은 사용자가 건드린 칸만 담고, 나머지는 서버 상태를 따른다.
export type ChecklistDraft = { values: Record<string, string>; unknown: Record<string, boolean> };
export type ChecklistDrafts = Record<string, ChecklistDraft>;
/** 대상별 블록 펼침. 없으면 접힘이다. */
export type ChecklistExpanded = Record<string, boolean>;
type Draft = ChecklistDraft;
type Block = { targetKind: "node" | "edge"; targetId: string; title: string; category: Category | null; items: MissingItem[] };

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
      const node = it.targetKind === "node" ? state.nodes[it.targetId] : undefined;
      const category = node ? (NODE_KINDS.find((k) => k.kind === node.kind)?.category ?? null) : null;
      b = { targetKind: it.targetKind, targetId: it.targetId, title, category, items: [] };
      map.set(it.targetId, b);
    }
    b.items.push(it);
  }
  return [...map.values()];
}

/** 연결 블록의 머리 아이콘: 두 점을 잇는 선. */
function EdgeIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" aria-hidden="true">
      <circle cx="3.5" cy="8" r="1.75" />
      <circle cx="12.5" cy="8" r="1.75" />
      <path d="M5.25 8h5.5" />
    </svg>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg className={styles.chevron} data-open={open || undefined} width={12} height={12} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4.5 2.75 7.75 6 4.5 9.25" />
    </svg>
  );
}

export function MissingChecklist({ state, busy, readOnly = false, focusId, focusToken, onFocusHandled, onSave, drafts, onDraftsChange: setDrafts, expanded, onExpandedChange: setExpanded, onLocate }: MissingChecklistProps) {
  const { items } = useMemo(() => computeMissing(state), [state]);
  const blocks = useMemo(() => blocksOf(state, items), [state, items]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [pendingFocus, setPendingFocus] = useState<string | null>(null);
  const blockRefs = useRef<Record<string, HTMLElement | null>>({});

  // 사라진 대상의 초안·펼침·오류만 버린다. 이력 보기(읽기 전용)는 옛 상태라 지금 초안을 건드리지 않는다.
  const targetKey = blocks.map((b) => b.targetId).join("\n");
  useEffect(() => {
    if (readOnly) return;
    const alive = new Set(targetKey ? targetKey.split("\n") : []);
    const keep = <T,>(rec: Record<string, T>) => {
      const ids = Object.keys(rec);
      return ids.every((id) => alive.has(id)) ? rec : Object.fromEntries(ids.filter((id) => alive.has(id)).map((id) => [id, rec[id]!]));
    };
    setDrafts(keep);
    setExpanded(keep);
    setErrors(keep);
  }, [targetKey, readOnly, setDrafts, setExpanded]);

  useEffect(() => {
    if (focusId === null) return;
    setExpanded((e) => (e[focusId] ? e : { ...e, [focusId]: true }));
    setPendingFocus(focusId);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 대상·토큰이 바뀔 때만 펼친다
  }, [focusId, focusToken]);

  useEffect(() => {
    if (pendingFocus === null || !expanded[pendingFocus]) return;
    setPendingFocus(null);
    const el = blockRefs.current[pendingFocus];
    if (!el) return;
    el.scrollIntoView?.({ block: "nearest" });
    const first = el.querySelector<HTMLInputElement>('input[type="text"]:not(:disabled)') ?? el.querySelector<HTMLInputElement>("input");
    first?.focus();
    onFocusHandled?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 펼침·대상이 바뀔 때만 포커스한다
  }, [expanded, pendingFocus]);

  if (items.length === 0) return null;

  // 읽기 전용이면 저장된 상태만 보인다(지금 버전의 초안은 섞지 않는다).
  const draftOf = (id: string) => (readOnly ? EMPTY : (drafts[id] ?? EMPTY));
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
    <div className={styles.checklist}>
      {blocks.map((b) => {
        const d = draftOf(b.targetId);
        const err = errors[b.targetId];
        const open = !!expanded[b.targetId];
        // 남은 개수: 서버 상태 기준으로 모름이 아닌 빈 칸.
        const left = b.items.filter((it) => !it.unknown).length;
        const bodyId = `missing-body-${b.targetId}`;
        return (
          <div
            key={b.targetId}
            ref={(el) => {
              blockRefs.current[b.targetId] = el;
            }}
            className={styles.missingBlock}
            data-open={open || undefined}
            role="group"
            aria-label={b.title}
          >
            <div className={styles.blockHead}>
              <button
                type="button"
                className={styles.blockToggle}
                aria-expanded={open}
                aria-controls={bodyId}
                aria-label={`${b.title} 항목 ${open ? "접기" : "펼치기"}`}
                onClick={() => setExpanded((e) => ({ ...e, [b.targetId]: !open }))}
              >
                <Chevron open={open} />
              </button>
              <span className={styles.blockIcon} style={b.category ? ({ "--cat": `var(--cat-${b.category})` } as React.CSSProperties) : undefined}>
                {b.category ? <CategoryIcon category={b.category} /> : <EdgeIcon />}
              </span>
              {onLocate ? (
                <button type="button" className={styles.blockTitle} aria-label={`${b.title} 위치 보기`} onClick={() => onLocate(b.targetId)}>
                  {b.title}
                </button>
              ) : (
                <span className={styles.blockTitle}>{b.title}</span>
              )}
              <span className={styles.blockCount} data-zero={left === 0 || undefined}>
                {left}
              </span>
            </div>
            {open && (
              <div id={bodyId} className={styles.blockBody}>
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
                        disabled={unk || readOnly}
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
                          disabled={readOnly}
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
                {!readOnly && (
                  <div className={styles.actions}>
                    <button type="button" className={styles.btn} disabled={busy || saving} onClick={() => void save(b)}>
                      저장
                    </button>
                  </div>
                )}
                {err && (
                  <p className={styles.missingError} role="alert">
                    {err}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
