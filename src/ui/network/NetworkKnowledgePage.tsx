"use client";

import { useState, useTransition } from "react";

import {
  addNetworkTypeAction,
  countNetworkTypeUsageAction,
  deleteNetworkRuleAction,
  deleteNetworkTypeAction,
  resetNetworkTypeAction,
  setNetworkTypeHiddenAction,
  updateNetworkTypeAction,
  upsertNetworkRuleAction,
  type ActionResult,
  type NetworkRuleRow,
} from "@/app/(app)/actions";
import { GRADE_LABELS, GRADE_RULES, METHOD_LABELS, type LinkMethod, type NetGrade } from "@/domain/network";
import type { NetTypeRow } from "@/server/network";

import { type Dialog, DialogView, GENERIC_ERROR } from "../dialogs";
import styles from "./knowledge.module.css";

const GRADES = Object.keys(GRADE_LABELS) as NetGrade[];
const METHODS = Object.keys(METHOD_LABELS) as LinkMethod[];
const gradeLabel = (g: NetGrade | "*") => (g === "*" ? "모든 등급" : GRADE_LABELS[g]);

const sourceLabel = (t: NetTypeRow) => (t.source === "user" ? "직접 추가" : t.edited ? "사용자가 고침" : "기본 제공");

type TypeDraft = { name: string; aliases: string; description: string; grade: NetGrade };
type RuleDraft = { id?: string; a: string; b: string; method: LinkMethod; note: string };

const splitAliases = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

export function NetworkKnowledgePage({ initialTypes, initialRules }: { initialTypes: NetTypeRow[]; initialRules: NetworkRuleRow[] }) {
  const [types, setTypes] = useState(initialTypes);
  const [rules, setRules] = useState(initialRules);
  const [selected, setSelected] = useState<string | null>(null);
  const [ruleDraft, setRuleDraft] = useState<RuleDraft | null>(null);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const nameOf = (key: string) => types.find((t) => t.key === key)?.name ?? key;
  const current = types.find((t) => t.id === selected) ?? null;

  const replaceType = (t: NetTypeRow) => setTypes((all) => all.map((x) => (x.id === t.id ? t : x)));

  /** 서버 액션 하나를 돌리고, 성공하면 apply 로 화면 상태를 바꾼다. 실패는 한 줄 안내로 보인다. */
  const attempt = <T extends object>(call: () => Promise<ActionResult<T>>, apply: (r: T) => void) =>
    start(async () => {
      try {
        const r = await call();
        if (!r.ok) return setError(r.error);
        setError(null);
        apply(r);
      } catch {
        setError(GENERIC_ERROR);
      }
    });

  // 지우기 확인에 보일 구성도 수는 확인 창을 열 때 센다(구성도를 모두 훑으므로 목록에는 싣지 않는다).
  const askDeleteType = (t: NetTypeRow) =>
    start(async () => {
      try {
        const r = await countNetworkTypeUsageAction(t.id);
        if (!r.ok) return setError(r.error);
        setError(null);
        setDialog({
          kind: "delete",
          title: `${t.name} 지우기`,
          message: `${r.count > 0 ? `구성도 ${r.count}곳의 망이 이 종류를 써요. ` : ""}이 종류를 쓰는 기관 규칙도 함께 지워져요. 지울까요?`,
          run: async () => {
            const d = await deleteNetworkTypeAction(t.id);
            if (!d.ok) return d.error;
            setTypes((all) => all.filter((x) => x.id !== t.id));
            setRules(d.rules);
            setSelected(null);
          },
        });
      } catch {
        setError(GENERIC_ERROR);
      }
    });

  const askDeleteRule = (r: NetworkRuleRow) =>
    setDialog({
      kind: "delete",
      title: "기관 규칙 지우기",
      message: `${nameOf(r.a)} ↔ ${nameOf(r.b)} 규칙을 지울까요?`,
      run: async () => {
        const d = await deleteNetworkRuleAction(r.id);
        if (!d.ok) return d.error;
        setRules(d.rules);
        setRuleDraft(null);
      },
    });

  const usable = types.filter((t) => !t.hidden);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>망 지식</h1>
      <p className={styles.lead}>
        구성도의 망 영역이 어떤 종류인지, 두 종류 사이에 보통 어떤 연결이 필요한지를 적어 두는 곳이에요. 대화에서 연결 방식을 알려 줄 때 이 내용을 써요.
      </p>
      {error && <p className={styles.error} role="alert">{error}</p>}

      <section className={styles.section} aria-labelledby="net-types">
        <div className={styles.sectionHead}>
          <h2 id="net-types">망 종류</h2>
          <button type="button" className={styles.btn} onClick={() => { setSelected("new"); setError(null); }}>종류 추가</button>
        </div>
        <div className={styles.body}>
          <div className={styles.groups}>
            {GRADES.map((g) => {
              const list = types.filter((t) => t.grade === g);
              return (
                <section key={g} aria-labelledby={`grade-${g}`}>
                  <h3 id={`grade-${g}`} className={styles.grade}>{GRADE_LABELS[g]}</h3>
                  {list.length === 0 ? (
                    <p className={styles.empty}>이 등급의 종류가 없어요.</p>
                  ) : (
                    <ul className={styles.list}>
                      {list.map((t) => (
                        <li key={t.id}>
                          <button
                            type="button"
                            className={`${styles.item} ${t.hidden ? styles.dim : ""}`}
                            aria-current={t.id === selected}
                            onClick={() => { setSelected(t.id); setError(null); }}
                          >
                            <span className={styles.head}>
                              <strong>{t.name}</strong>
                              <span className={styles.badge}>{sourceLabel(t)}</span>
                              {t.hidden && <span className={styles.badge}>쓰지 않음</span>}
                            </span>
                            {t.aliases.length > 0 && <span className={styles.meta}>다른 이름: {t.aliases.join(", ")}</span>}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>

          {selected === "new" && (
            <TypeForm
              key="new"
              label="종류 추가"
              initial={{ name: "", aliases: "", description: "", grade: "internal" }}
              pending={pending}
              onCancel={() => setSelected(null)}
              onSave={(d) =>
                attempt(
                  () => addNetworkTypeAction({ name: d.name, aliases: splitAliases(d.aliases), description: d.description, grade: d.grade }),
                  (r) => {
                    setTypes((all) => [...all, r.type]);
                    setSelected(r.type.id);
                  },
                )
              }
            />
          )}
          {current && (
            <TypeForm
              key={`${current.id}:${current.name}:${current.aliases.join(",")}:${current.description}:${current.grade}`}
              label={`${current.name} 편집`}
              initial={{ name: current.name, aliases: current.aliases.join(", "), description: current.description, grade: current.grade }}
              pending={pending}
              onSave={(d) =>
                attempt(
                  () => updateNetworkTypeAction(current.id, { name: d.name, aliases: splitAliases(d.aliases), description: d.description, grade: d.grade }),
                  (r) => replaceType(r.type),
                )
              }
              extra={
                <>
                  {current.source === "seed" && current.edited && (
                    <button type="button" className={styles.btn} disabled={pending} onClick={() => attempt(() => resetNetworkTypeAction(current.id), (r) => replaceType(r.type))}>
                      기본값으로 되돌리기
                    </button>
                  )}
                  {current.source === "seed" && (
                    <button
                      type="button"
                      className={styles.btn}
                      disabled={pending}
                      onClick={() => attempt(() => setNetworkTypeHiddenAction(current.id, !current.hidden), (r) => replaceType(r.type))}
                    >
                      {current.hidden ? "다시 쓰기" : "쓰지 않음"}
                    </button>
                  )}
                  {current.source === "user" && (
                    <button type="button" className={`${styles.btn} ${styles.danger}`} disabled={pending} onClick={() => askDeleteType(current)}>
                      지우기
                    </button>
                  )}
                </>
              }
            />
          )}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="net-rules">
        <div className={styles.sectionHead}>
          <h2 id="net-rules">연결 규칙</h2>
        </div>
        <h3 className={styles.grade}>기본 등급 규칙</h3>
        <table className={styles.table} aria-label="기본 등급 규칙">
          <thead>
            <tr><th scope="col">등급 짝</th><th scope="col">보통 필요한 연결</th></tr>
          </thead>
          <tbody>
            {GRADE_RULES.map((r) => (
              <tr key={`${r.a}-${r.b}`}>
                <td>{gradeLabel(r.a)} ↔ {gradeLabel(r.b)}</td>
                <td>{METHOD_LABELS[r.method]}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className={styles.sectionHead}>
          <h3 className={styles.grade}>기관 규칙</h3>
          <button
            type="button"
            className={styles.btn}
            disabled={usable.length < 2}
            onClick={() => { setRuleDraft({ a: usable[0]?.key ?? "", b: usable[1]?.key ?? "", method: "firewall", note: "" }); setError(null); }}
          >
            기관 규칙 추가
          </button>
        </div>
        {rules.length === 0 ? (
          <p className={styles.empty}>등록한 기관 규칙이 없어요. 기본 등급 규칙을 따라요.</p>
        ) : (
          <ul className={styles.list}>
            {rules.map((r) => (
              <li key={r.id} className={styles.ruleRow}>
                <span className={styles.ruleText}>
                  <strong>{nameOf(r.a)} ↔ {nameOf(r.b)}</strong>
                  <span className={styles.meta}>{METHOD_LABELS[r.method]}{r.note ? ` · 근거: ${r.note}` : ""}</span>
                </span>
                <button type="button" className={styles.btn} aria-label={`${nameOf(r.a)} ↔ ${nameOf(r.b)} 규칙 고치기`} onClick={() => setRuleDraft({ id: r.id, a: r.a, b: r.b, method: r.method, note: r.note ?? "" })}>
                  고치기
                </button>
                <button type="button" className={`${styles.btn} ${styles.danger}`} aria-label={`${nameOf(r.a)} ↔ ${nameOf(r.b)} 규칙 지우기`} onClick={() => askDeleteRule(r)}>
                  지우기
                </button>
              </li>
            ))}
          </ul>
        )}
        {ruleDraft && (
          <RuleForm
            key={ruleDraft.id ?? "new"}
            draft={ruleDraft}
            options={usable}
            pending={pending}
            onCancel={() => setRuleDraft(null)}
            onSave={(d) =>
              attempt(
                () => upsertNetworkRuleAction({ a: d.a, b: d.b, method: d.method, note: d.note }),
                (r) => {
                  setRules(r.rules);
                  setRuleDraft(null);
                },
              )
            }
          />
        )}
      </section>
      {dialog && <DialogView dialog={dialog} onClose={() => setDialog(null)} />}
    </div>
  );
}

function TypeForm({ label, initial, pending, onSave, onCancel, extra }: {
  label: string;
  initial: TypeDraft;
  pending: boolean;
  onSave(d: TypeDraft): void;
  onCancel?(): void;
  extra?: React.ReactNode;
}) {
  const [d, setD] = useState(initial);
  const set = <K extends keyof TypeDraft>(k: K, v: TypeDraft[K]) => setD((x) => ({ ...x, [k]: v }));
  return (
    <form className={styles.form} aria-label={label} onSubmit={(e) => { e.preventDefault(); onSave(d); }}>
      <label>이름<input value={d.name} onChange={(e) => set("name", e.target.value)} /></label>
      <label>다른 이름(쉼표로 구분)<input value={d.aliases} onChange={(e) => set("aliases", e.target.value)} /></label>
      <label>설명<textarea value={d.description} onChange={(e) => set("description", e.target.value)} /></label>
      <label>
        등급
        <select value={d.grade} onChange={(e) => set("grade", e.target.value as NetGrade)}>
          {GRADES.map((g) => <option key={g} value={g}>{GRADE_LABELS[g]}</option>)}
        </select>
      </label>
      <div className={styles.actions}>
        <button type="submit" className={styles.btn} disabled={pending}>저장</button>
        {onCancel && <button type="button" className={styles.btn} disabled={pending} onClick={onCancel}>닫기</button>}
        {extra}
      </div>
    </form>
  );
}

function RuleForm({ draft, options, pending, onSave, onCancel }: {
  draft: RuleDraft;
  options: NetTypeRow[];
  pending: boolean;
  onSave(d: RuleDraft): void;
  onCancel(): void;
}) {
  const [d, setD] = useState(draft);
  const set = <K extends keyof RuleDraft>(k: K, v: RuleDraft[K]) => setD((x) => ({ ...x, [k]: v }));
  const typeSelect = (label: string, k: "a" | "b") => (
    <label>
      {label}
      <select value={d[k]} onChange={(e) => set(k, e.target.value)}>
        {options.map((t) => <option key={t.key} value={t.key}>{t.name}</option>)}
      </select>
    </label>
  );
  return (
    <form className={styles.form} aria-label={draft.id ? "기관 규칙 고치기" : "기관 규칙 추가"} onSubmit={(e) => { e.preventDefault(); onSave(d); }}>
      {typeSelect("종류 하나", "a")}
      {typeSelect("다른 종류", "b")}
      <label>
        연결 방식
        <select value={d.method} onChange={(e) => set("method", e.target.value as LinkMethod)}>
          {METHODS.map((m) => <option key={m} value={m}>{METHOD_LABELS[m]}</option>)}
        </select>
      </label>
      <label>근거<input value={d.note} maxLength={100} placeholder="예: 정보보안 지침 3조" onChange={(e) => set("note", e.target.value)} /></label>
      <div className={styles.actions}>
        <button type="submit" className={styles.btn} disabled={pending || d.a === d.b}>저장</button>
        <button type="button" className={styles.btn} disabled={pending} onClick={onCancel}>닫기</button>
      </div>
      {d.a === d.b && <p className={styles.meta}>서로 다른 두 종류를 골라 주세요.</p>}
    </form>
  );
}
