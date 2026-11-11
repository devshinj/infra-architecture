"use client";

import { Fragment, useEffect, useRef, useState, useTransition } from "react";

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
import { NETWORK_RULE_SEED } from "@/domain/network-seed";
import type { NetTypeRow } from "@/server/network";
import { Button } from "@/ui/Button";
import { closeOnEscape, useNotesPanel } from "@/ui/useNotesPanel";

import { type Dialog, DialogView, GENERIC_ERROR } from "../dialogs";
import styles from "./knowledge.module.css";

const GRADES = Object.keys(GRADE_LABELS) as NetGrade[];
const METHODS = Object.keys(METHOD_LABELS) as LinkMethod[];
const gradeLabel = (g: NetGrade | "*") => (g === "*" ? "모든 등급" : GRADE_LABELS[g]);

const sourceLabel = (t: NetTypeRow) => (t.source === "user" ? "직접 추가" : t.edited ? "사용자가 고침" : "기본 제공");

type TypeDraft = { name: string; aliases: string; description: string; grade: NetGrade; separated: boolean };
type RuleDraft = { id?: string; a: string; b: string; method: LinkMethod; note: string };
/** 안내 한 줄이 뜨는 자리: 종류 편집 판 또는 기관 규칙. 누른 자리 가까이에 보여야 스크롤한 뒤에도 보인다. */
type Where = "type" | "rule";
type Message = { where: Where; text: string };

const NEW = "new";
const EMPTY_TYPE: TypeDraft = { name: "", aliases: "", description: "", grade: "internal", separated: false };
const toTypeDraft = (t: NetTypeRow): TypeDraft => ({
  name: t.name,
  aliases: t.aliases.join(", "),
  description: t.description,
  grade: t.grade,
  separated: t.separated,
});
const sameDraft = (a: TypeDraft, b: TypeDraft) => (Object.keys(a) as (keyof TypeDraft)[]).every((k) => a[k] === b[k]);
const toInput = (d: TypeDraft) => ({ name: d.name, aliases: splitAliases(d.aliases), description: d.description, grade: d.grade, separated: d.separated });

const splitAliases = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

export function NetworkKnowledgePage({ initialTypes, initialRules }: { initialTypes: NetTypeRow[]; initialRules: NetworkRuleRow[] }) {
  const [types, setTypes] = useState(initialTypes);
  const [rules, setRules] = useState(initialRules);
  const [selected, setSelected] = useState<string | null>(null);
  // 고치던 입력은 종류마다(새 종류는 NEW) 남긴다. 다른 종류를 골라도, 닫아도 사라지지 않고 목록에 「수정 중」이 붙는다.
  const [typeDrafts, setTypeDrafts] = useState<Record<string, TypeDraft>>({});
  const [ruleDraft, setRuleDraft] = useState<RuleDraft | null>(null);
  const [q, setQ] = useState("");
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [error, setError] = useState<Message | null>(null);
  const [notice, setNotice] = useState<Message | null>(null);
  const [pending, start] = useTransition();
  const { rootRef, panelRef, returnTo } = useNotesPanel(selected);
  // 기관 규칙 판을 연 버튼: 닫거나 저장하면 초점을 거기로 돌려준다.
  const ruleTrigger = useRef<HTMLElement | null>(null);

  const nameOf = (key: string) => types.find((t) => t.key === key)?.name ?? key;
  const current = types.find((t) => t.id === selected) ?? null;

  const replaceType = (t: NetTypeRow) => setTypes((all) => all.map((x) => (x.id === t.id ? t : x)));
  const dropDraft = (key: string) =>
    setTypeDrafts((m) => {
      const rest = { ...m };
      delete rest[key];
      return rest;
    });
  const editingType = (t: NetTypeRow) => {
    const d = typeDrafts[t.id];
    return !!d && !sameDraft(d, toTypeDraft(t));
  };

  const say = (where: Where, text: string | void) => setNotice(text ? { where, text } : null);
  const fail = (where: Where, text: string) => {
    setNotice(null);
    setError({ where, text });
  };
  const clearMessages = () => {
    setError(null);
    setNotice(null);
  };

  /** 서버 액션 하나를 돌리고, 성공하면 apply 로 화면 상태를 바꾼다. 결과 안내는 where 자리에 한 줄로 보인다. */
  const attempt = <T extends object>(where: Where, call: () => Promise<ActionResult<T>>, apply: (r: T) => string | void) =>
    start(async () => {
      try {
        const r = await call();
        if (!r.ok) return fail(where, r.error);
        setError(null);
        say(where, apply(r));
      } catch {
        fail(where, GENERIC_ERROR);
      }
    });

  const selectType = (id: string) => {
    setSelected(id);
    clearMessages();
  };
  const closeType = () => {
    const prev = selected;
    setSelected(null);
    clearMessages();
    returnTo(prev);
  };

  const openRule = (draft: RuleDraft, trigger: HTMLElement) => {
    ruleTrigger.current = trigger;
    setRuleDraft(draft);
    clearMessages();
  };
  const closeRule = () => {
    setRuleDraft(null);
    setError(null);
    ruleTrigger.current?.focus();
  };

  // 지우기 확인에 보일 구성도 수는 확인 창을 열 때 센다(구성도를 모두 훑으므로 목록에는 싣지 않는다).
  const askDeleteType = (t: NetTypeRow) =>
    start(async () => {
      try {
        const r = await countNetworkTypeUsageAction(t.id);
        if (!r.ok) return fail("type", r.error);
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
            dropDraft(t.id);
            setSelected(null);
          },
        });
      } catch {
        fail("type", GENERIC_ERROR);
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
        setError(null);
        say("rule", "기관 규칙을 지웠어요.");
      },
    });

  const usable = types.filter((t) => !t.hidden);
  // 기본 제공 짝 규칙: 쓰는 종류끼리의 것만 보인다. 같은 짝에 기관 규칙이 있으면 기관 규칙이 먼저다.
  const usableKeys = new Set(usable.map((t) => t.key));
  const baseRules = NETWORK_RULE_SEED.filter((r) => usableKeys.has(r.a) && usableKeys.has(r.b));
  const overridden = (a: string, b: string) => rules.some((r) => r.a === a && r.b === b);

  // 검색: 이름과 다른 이름. 찾는 중에는 맞는 종류가 없는 등급을 접는다.
  const needle = q.trim().toLowerCase();
  const matches = (t: NetTypeRow) => !needle || [t.name, ...t.aliases].some((s) => s.toLowerCase().includes(needle));
  const grouped = GRADES.map((g) => ({ g, list: types.filter((t) => t.grade === g && matches(t)) })).filter(
    ({ list }) => !needle || list.length > 0,
  );

  const typeDraft = selected === NEW ? (typeDrafts[NEW] ?? EMPTY_TYPE) : current ? (typeDrafts[current.id] ?? toTypeDraft(current)) : null;
  const setTypeField = <K extends keyof TypeDraft>(k: K, v: TypeDraft[K]) => {
    if (!selected || !typeDraft) return;
    setNotice(null);
    setTypeDrafts((m) => ({ ...m, [selected]: { ...(m[selected] ?? typeDraft), [k]: v } }));
  };
  const typeError = error?.where === "type" ? error.text : null;
  const typeNotice = notice?.where === "type" ? notice.text : null;

  const ruleForm = (draft: RuleDraft) => (
    <RuleForm
      key={draft.id ?? NEW}
      draft={draft}
      options={types}
      pending={pending}
      error={error?.where === "rule" ? error.text : null}
      onCancel={closeRule}
      onSave={(d) =>
        attempt(
          "rule",
          () => upsertNetworkRuleAction({ a: d.a, b: d.b, method: d.method, note: d.note }),
          (r) => {
            setRules(r.rules);
            setRuleDraft(null);
            ruleTrigger.current?.focus();
            return "기관 규칙을 저장했어요.";
          },
        )
      }
    />
  );

  return (
    <div className={styles.page} ref={rootRef}>
      <h1 className={styles.title}>망 지식</h1>
      <p className={styles.lead}>
        구성도의 망 영역이 어떤 종류인지, 두 종류 사이에 보통 어떤 연결이 필요한지를 적어 두는 곳이에요. 대화에서 연결 방식을 알려 줄 때 이 내용을 써요.
      </p>
      <nav className={styles.jump} aria-label="이 화면 안에서 이동">
        <a href="#net-types">망 종류</a>
        <a href="#net-rules">연결 규칙</a>
      </nav>

      <section className={styles.section} aria-labelledby="net-types">
        <div className={styles.body}>
          <div className={styles.listCol}>
            <div className={styles.sectionHead}>
              <h2 id="net-types">망 종류</h2>
              <div className={styles.headTools}>
                <input
                  type="search"
                  className={styles.search}
                  placeholder="이름·다른 이름"
                  aria-label="망 종류 검색"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
                <Button onClick={() => selectType(NEW)}>종류 추가</Button>
              </div>
            </div>
            <div className={styles.groups}>
              {grouped.length === 0 && <p className={styles.empty}>맞는 종류가 없어요.</p>}
              {grouped.map(({ g, list }) => (
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
                            data-row-id={t.id}
                            aria-current={t.id === selected}
                            onClick={() => selectType(t.id)}
                          >
                            <span className={styles.head}>
                              <strong>{t.name}</strong>
                              <span className={styles.badge}>{sourceLabel(t)}</span>
                              {t.separated && <span className={styles.badge}>망분리 대상</span>}
                              {t.hidden && <span className={styles.badge}>쓰지 않음</span>}
                              {editingType(t) && <span className={styles.badge}>수정 중</span>}
                            </span>
                            {t.aliases.length > 0 && <span className={styles.meta}>다른 이름: {t.aliases.join(", ")}</span>}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>
          </div>

          {/* 주기 판: 넓은 화면에서는 화면 위에 붙어 목록을 내려도 따라온다(sticky). 길면 판 안에서 스크롤한다. */}
          <div className={styles.notesCol} ref={panelRef}>
            {!typeDraft && <p className={styles.notesEmpty}>종류를 고르면 여기서 이름·다른 이름·등급을 고칠 수 있어요.</p>}
            {selected === NEW && typeDraft && (
              <TypeForm
                label="종류 추가"
                draft={typeDraft}
                onChange={setTypeField}
                pending={pending}
                error={typeError}
                notice={typeNotice}
                onClose={closeType}
                onSave={(d) =>
                  attempt(
                    "type",
                    () => addNetworkTypeAction(toInput(d)),
                    (r) => {
                      setTypes((all) => [...all, r.type]);
                      dropDraft(NEW);
                      setSelected(r.type.id);
                      return "추가했어요.";
                    },
                  )
                }
              />
            )}
            {current && typeDraft && (
              <TypeForm
                label={`${current.name} 편집`}
                draft={typeDraft}
                onChange={setTypeField}
                pending={pending}
                error={typeError}
                notice={typeNotice}
                onClose={closeType}
                onSave={(d) =>
                  attempt(
                    "type",
                    () => updateNetworkTypeAction(current.id, toInput(d)),
                    (r) => {
                      replaceType(r.type);
                      dropDraft(current.id);
                      return "저장했어요.";
                    },
                  )
                }
                extra={
                  <>
                    {current.source === "seed" && current.edited && (
                      <Button
                        disabled={pending}
                        onClick={() =>
                          attempt("type", () => resetNetworkTypeAction(current.id), (r) => {
                            replaceType(r.type);
                            dropDraft(current.id);
                            return "기본값으로 되돌렸어요.";
                          })
                        }
                      >
                        기본값으로 되돌리기
                      </Button>
                    )}
                    {current.source === "seed" && (
                      <Button
                        disabled={pending}
                        onClick={() =>
                          attempt("type", () => setNetworkTypeHiddenAction(current.id, !current.hidden), (r) => {
                            replaceType(r.type);
                            return r.type.hidden ? "쓰지 않음으로 바꿨어요." : "다시 쓰도록 바꿨어요.";
                          })
                        }
                      >
                        {current.hidden ? "다시 쓰기" : "쓰지 않음"}
                      </Button>
                    )}
                    {current.source === "user" && (
                      <Button variant="danger" disabled={pending} onClick={() => askDeleteType(current)}>
                        지우기
                      </Button>
                    )}
                  </>
                }
              />
            )}
          </div>
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
              <tr key={`${r.a}-${r.b}-${r.when ?? ""}`}>
                <td>{gradeLabel(r.a)} ↔ {gradeLabel(r.b)}{r.when === "separated" ? " (둘 중 하나가 망분리 대상)" : ""}</td>
                <td>{METHOD_LABELS[r.method]}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3 className={styles.grade}>기본 제공 짝 규칙</h3>
        <p className={styles.meta}>등급 규칙과 다르게 보는 짝이에요. 일반 지식 수준이라 기관마다 다를 수 있고, 같은 짝에 기관 규칙을 등록하면 기관 규칙을 따라요.</p>
        {baseRules.length === 0 ? (
          <p className={styles.empty}>쓰는 종류 사이에 기본 제공 짝 규칙이 없어요.</p>
        ) : (
          <table className={styles.table} aria-label="기본 제공 짝 규칙">
            <thead>
              <tr><th scope="col">종류 짝</th><th scope="col">보통 필요한 연결</th><th scope="col">까닭</th></tr>
            </thead>
            <tbody>
              {baseRules.map((r) => (
                <tr key={`${r.a}--${r.b}`}>
                  <td>{nameOf(r.a)} ↔ {nameOf(r.b)}</td>
                  <td>{METHOD_LABELS[r.method]}{overridden(r.a, r.b) ? " (기관 규칙이 먼저)" : ""}</td>
                  <td>{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className={styles.sectionHead}>
          <h3 className={styles.grade}>기관 규칙</h3>
          <div className={styles.headTools}>
            <span className={styles.notice} role="status">{notice?.where === "rule" ? notice.text : null}</span>
            <Button
              disabled={usable.length < 2}
              onClick={(e) => openRule({ a: usable[0]?.key ?? "", b: usable[1]?.key ?? "", method: "firewall", note: "" }, e.currentTarget)}
            >
              기관 규칙 추가
            </Button>
          </div>
        </div>
        {/* 판은 누른 자리에 연다: 추가는 머리 줄 바로 아래, 고치기는 그 규칙 줄 바로 아래. */}
        {ruleDraft && !ruleDraft.id && ruleForm(ruleDraft)}
        {rules.length === 0 ? (
          <p className={styles.empty}>등록한 기관 규칙이 없어요. 기본 제공 짝 규칙과 기본 등급 규칙을 따라요.</p>
        ) : (
          <ul className={styles.list}>
            {rules.map((r) => (
              <Fragment key={r.id}>
                <li className={styles.ruleRow}>
                  <span className={styles.ruleText}>
                    <strong>{nameOf(r.a)} ↔ {nameOf(r.b)}</strong>
                    <span className={styles.meta}>{METHOD_LABELS[r.method]}{r.note ? ` · 근거: ${r.note}` : ""}</span>
                  </span>
                  <Button
                    aria-label={`${nameOf(r.a)} ↔ ${nameOf(r.b)} 규칙 고치기`}
                    aria-expanded={ruleDraft?.id === r.id}
                    onClick={(e) => openRule({ id: r.id, a: r.a, b: r.b, method: r.method, note: r.note ?? "" }, e.currentTarget)}
                  >
                    고치기
                  </Button>
                  <Button variant="danger" aria-label={`${nameOf(r.a)} ↔ ${nameOf(r.b)} 규칙 지우기`} onClick={() => askDeleteRule(r)}>
                    지우기
                  </Button>
                </li>
                {ruleDraft?.id === r.id && <li className={styles.ruleEdit}>{ruleForm(ruleDraft)}</li>}
              </Fragment>
            ))}
          </ul>
        )}
      </section>
      {dialog && <DialogView dialog={dialog} onClose={() => setDialog(null)} />}
    </div>
  );
}

function TypeForm({ label, draft: d, onChange: set, pending, error, notice, onSave, onClose, extra }: {
  label: string;
  draft: TypeDraft;
  onChange<K extends keyof TypeDraft>(k: K, v: TypeDraft[K]): void;
  pending: boolean;
  error: string | null;
  notice: string | null;
  onSave(d: TypeDraft): void;
  onClose(): void;
  extra?: React.ReactNode;
}) {
  return (
    <form
      className={`${styles.form} ${styles.notes} ticks`}
      aria-label={label}
      onKeyDown={closeOnEscape(onClose)}
      onSubmit={(e) => { e.preventDefault(); onSave(d); }}
    >
      <div className={styles.panelHead}>
        <h2 className={styles.panelTitle} tabIndex={-1} data-panel-title="">{label}</h2>
        <Button variant="quiet" size="sm" onClick={onClose}>닫기</Button>
      </div>
      <label>이름<input value={d.name} onChange={(e) => set("name", e.target.value)} /></label>
      <label>다른 이름(쉼표로 구분)<input value={d.aliases} onChange={(e) => set("aliases", e.target.value)} /></label>
      <label>설명<textarea value={d.description} onChange={(e) => set("description", e.target.value)} /></label>
      <label>
        등급
        <select value={d.grade} onChange={(e) => set("grade", e.target.value as NetGrade)}>
          {GRADES.map((g) => <option key={g} value={g}>{GRADE_LABELS[g]}</option>)}
        </select>
      </label>
      <label className={styles.check}>
        <input type="checkbox" checked={d.separated} onChange={(e) => set("separated", e.target.checked)} />
        <span>
          망분리 대상
          <span className={styles.meta}> — 규정이나 방침으로 인터넷 같은 바깥 망과 떼어 놓는 망이에요. 켜면 외부 망과는 망연계가 기본이 돼요.</span>
        </span>
      </label>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <div className={styles.actions}>
        <Button type="submit" variant="primary" disabled={pending}>저장</Button>
        {extra}
        <span className={styles.notice} role="status">{notice}</span>
      </div>
    </form>
  );
}

function RuleForm({ draft, options, pending, error, onSave, onCancel }: {
  draft: RuleDraft;
  options: NetTypeRow[];
  pending: boolean;
  error: string | null;
  onSave(d: RuleDraft): void;
  onCancel(): void;
}) {
  const [d, setD] = useState(draft);
  const set = <K extends keyof RuleDraft>(k: K, v: RuleDraft[K]) => setD((x) => ({ ...x, [k]: v }));
  const ref = useRef<HTMLFormElement>(null);
  // 연 자리에서 바로 고르게: 처음 고칠 수 있는 칸에 초점(고치기면 종류 둘은 잠겨 있어 연결 방식부터).
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>("select:not(:disabled), input")?.focus();
  }, []);
  // 쓰지 않는 종류는 고를 수 없지만, 이 규칙이 이미 가리키는 종류는 보여야 한다(안 그러면 다른 값이 보인다).
  const shown = options.filter((t) => !t.hidden || t.key === d.a || t.key === d.b);
  // 고칠 때는 두 종류를 바꾸지 못한다(바꾸면 새 규칙이 생기고 옛 규칙이 남는다). 방식·근거만 고친다.
  const editing = !!draft.id;
  const typeSelect = (label: string, k: "a" | "b") => (
    <label>
      {label}
      <select value={d[k]} disabled={editing} onChange={(e) => set(k, e.target.value)}>
        {shown.map((t) => <option key={t.key} value={t.key}>{t.hidden ? `${t.name} (쓰지 않음)` : t.name}</option>)}
      </select>
    </label>
  );
  return (
    <form
      ref={ref}
      className={styles.form}
      aria-label={draft.id ? "기관 규칙 고치기" : "기관 규칙 추가"}
      onKeyDown={closeOnEscape(onCancel)}
      onSubmit={(e) => { e.preventDefault(); onSave(d); }}
    >
      {typeSelect("종류 하나", "a")}
      {typeSelect("다른 종류", "b")}
      {editing && <p className={styles.meta}>종류를 바꾸려면 이 규칙을 지우고 새로 추가해 주세요.</p>}
      <label>
        연결 방식
        <select value={d.method} onChange={(e) => set("method", e.target.value as LinkMethod)}>
          {METHODS.map((m) => <option key={m} value={m}>{METHOD_LABELS[m]}</option>)}
        </select>
      </label>
      <label>근거<input value={d.note} maxLength={100} placeholder="예: 정보보안 지침 3조" onChange={(e) => set("note", e.target.value)} /></label>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <div className={styles.actions}>
        <Button type="submit" variant="primary" disabled={pending || d.a === d.b}>저장</Button>
        <Button disabled={pending} onClick={onCancel}>닫기</Button>
      </div>
      {d.a === d.b && <p className={styles.meta}>서로 다른 두 종류를 골라 주세요.</p>}
    </form>
  );
}
