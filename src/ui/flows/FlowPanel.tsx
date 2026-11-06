"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { crossingNote, type FlowOrigin } from "@/domain/flows";
import type { DiagramState } from "@/domain/types";
import type { StoredFlow } from "@/server/flows";

import { type Dialog, DialogView, RowMenu, type RowMenuItem } from "../dialogs";
import { AI_BADGE_SR, AI_SUGGEST_BADGE, isUnreviewedAi } from "../glossary/aiBadge";
import { useNetworkKnowledge } from "../network/NetworkKnowledgeContext";

import styles from "./flows.module.css";

export interface FlowPanelProps {
  /** 흐름 목록(끊김 problems 포함). */
  flows: StoredFlow[];
  /** 경계 넘김 문장을 계산할 상태(지금 보이는 그림). */
  state: DiagramState;
  /** 보고 있는 흐름. */
  activeKey: string | null;
  /** 흐름을 켠다(같은 흐름을 다시 누르면 null 로 끈다). */
  onActivate(key: string | null): void;
  /** 단계를 눌렀다: 그 연결로 카메라를 옮긴다. */
  onFocusStep(edgeId: string): void;
  onSuggest(): void;
  suggesting: boolean;
  /** 제안·맞아요 실패 문구. */
  error?: string | null;
  /** 이름 바꾸기·삭제. 실패하면 대화상자에 보일 오류 글을 돌려준다. */
  onRename(key: string, name: string): Promise<string | void>;
  onDelete(key: string): Promise<string | void>;
  onConfirm(key: string): void;
  /** 끊긴 흐름을 대화로 다시 맞춘다(흐름 이름을 넘긴다). */
  onRepair(name: string): void;
  /** 끊긴 단계 하나(0부터 센 번호)를 지운다. 실패하면 대화상자에 보일 오류 글을 돌려준다. */
  onRemoveStep(key: string, index: number): Promise<string | void>;
  /** 이력 보기·비교 중이거나 대화 차례 중: 바꾸는 동작(제안·이름·삭제·맞아요·다시 맞추기)을 막는다. 보기는 된다. */
  disabled: boolean;
}

const EMPTY = '아직 흐름이 없어요. "흐름 제안받기"를 누르면 AI가 주요 흐름을 만들어 드려요.';
const GROUPS: { origin: FlowOrigin; title: string }[] = [
  { origin: "user", title: "사용자 행동" },
  { origin: "system", title: "시스템·네트워크" },
];

type Action = "rename" | "delete" | "confirm";

/** ①…⑳ (흐름 하나의 단계는 최대 20개). 넘으면 숫자로. */
export const stepMark = (i: number) => (i < 20 ? String.fromCodePoint(0x2460 + i) : `${i + 1}.`);

const menuRootId = (key: string) => `flow-${key}`;

/**
 * 흐름 탭: 맨 위 `흐름 제안받기`, 사용자 행동·시스템·네트워크 두 묶음.
 * 행을 고르면 그 흐름을 캔버스에 켜고 아래에 단계(①… 설명 + 경계 넘김)와 결과를 보인다.
 * 행의 ⋯ 메뉴로 이름 바꾸기·삭제·맞아요(AI 제안 표시를 지운다). 대화상자는 SessionPicker 와 같은 길을 쓴다.
 */
export function FlowPanel({ flows, state, activeKey, onActivate, onFocusStep, onSuggest, suggesting, error, onRename, onDelete, onConfirm, onRepair, onRemoveStep, disabled }: FlowPanelProps) {
  const knowledge = useNetworkKnowledge() ?? undefined;
  // 행 메뉴는 하나만 열린다. 바깥을 누르면 닫는다(Esc·방향키는 RowMenu 가 맡는다).
  const [menu, setMenu] = useState<string | null>(null);
  useEffect(() => {
    if (menu === null) return;
    const onDown = (e: PointerEvent) => {
      const at = (e.target as Element | null)?.closest?.("[data-menu-root]");
      if (at?.getAttribute("data-menu-root") !== menuRootId(menu)) setMenu(null);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [menu]);

  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [returnTo, setReturnTo] = useState<string | null>(null);
  const closeDialog = () => {
    setDialog(null);
    // 대화상자를 닫으면 그 행의 ⋯ 버튼으로(지워졌으면 제안 버튼으로) 포커스를 돌린다.
    const key = returnTo;
    setTimeout(() => {
      const btn = key ? document.querySelector<HTMLElement>(`[data-menu-root="${CSS.escape(menuRootId(key))}"] button`) : null;
      (btn ?? document.querySelector<HTMLElement>("[data-flow-suggest]"))?.focus();
    }, 0);
  };

  const act = (a: Action, f: StoredFlow) => {
    setMenu(null);
    if (a === "confirm") return onConfirm(f.id);
    setReturnTo(f.id);
    if (a === "rename") {
      setDialog({
        kind: "name",
        title: "흐름 이름 바꾸기",
        placeholder: f.name,
        submit: "바꾸기",
        pendingLabel: "바꾸는 중…",
        initial: f.name,
        run: (name) => onRename(f.id, name),
      });
    } else {
      setDialog({
        kind: "delete",
        title: "흐름 삭제",
        message: `‘${f.name}’ 흐름을 삭제할까요? 구성도는 그대로예요. 되돌릴 수 없어요.`,
        run: () => onDelete(f.id),
      });
    }
  };

  const askRemoveStep = (f: StoredFlow, index: number) => {
    setReturnTo(f.id);
    setDialog({
      kind: "delete",
      title: "단계 지우기",
      message: `"${f.name}"의 ${index + 1}단계를 지울까요?`,
      run: () => onRemoveStep(f.id, index),
    });
  };

  const row = (f: StoredFlow) => {
    const active = f.id === activeKey;
    const broken = f.problems.length > 0;
    const ai = isUnreviewedAi({ source: f.source, reviewed: f.reviewed });
    const items: RowMenuItem<Action>[] = [
      { action: "rename", label: "이름 바꾸기", disabled },
      { action: "delete", label: "삭제", danger: true, disabled },
      ...(ai ? [{ action: "confirm" as const, label: "맞아요", disabled }] : []),
    ];
    const stepsId = `flow-steps-${f.id}`;
    return (
      <li key={f.id} className={styles.item} data-active={active || undefined}>
        <div className={styles.row}>
          <button
            type="button"
            className={styles.rowBtn}
            aria-expanded={active}
            {...(active ? { "aria-controls": stepsId } : {})}
            onClick={() => onActivate(active ? null : f.id)}
          >
            <span className={styles.name}>{f.name}</span>
            {ai && (
              <>
                <span className={styles.badge}>{AI_SUGGEST_BADGE}</span>
                <span className={styles.srOnly}>{AI_BADGE_SR}</span>
              </>
            )}
            {broken && <span className={styles.broken}>끊김</span>}
          </button>
          <RowMenu
            id={menuRootId(f.id)}
            label={`${f.name} 메뉴`}
            open={menu === f.id}
            onOpenChange={(v) => setMenu(v ? f.id : null)}
            buttonRef={() => {}}
            buttonClassName={styles.menuBtn}
            items={items}
            onSelect={(a) => act(a, f)}
          />
        </div>
        {broken && (
          <button type="button" className={styles.repair} aria-label={`${f.name} 흐름 다시 맞추기`} disabled={disabled} onClick={() => onRepair(f.name)}>
            흐름 다시 맞추기
          </button>
        )}
        {active && (
          <div className={styles.detail}>
            {f.summary && <p className={styles.summary}>{f.summary}</p>}
            <ol id={stepsId} className={styles.steps} aria-label={`${f.name} 단계`}>
              {f.steps.map((s, i) => {
                const note = crossingNote(state, s, knowledge);
                const missing = f.problems.some((p) => p.step === i);
                // 연결이 사라진 단계도 키보드로 닿아 "끊김"을 읽을 수 있게 disabled 대신 aria-disabled 로 둔다.
                const gone = !state.edges[s.edge];
                return (
                  <li key={i} className={styles.step}>
                    <button
                      type="button"
                      className={styles.stepBtn}
                      aria-disabled={gone || undefined}
                      onClick={() => {
                        if (!gone) onFocusStep(s.edge);
                      }}
                    >
                      <span className={styles.mark} aria-hidden="true">{stepMark(i)}</span>
                      <span className={styles.srOnly}>{i + 1}단계 </span>
                      <span className={styles.stepText}>
                        {s.text}
                        {missing && <span className={styles.broken}>끊김</span>}
                        {note && <span className={styles.note}>{note}</span>}
                      </span>
                    </button>
                    {missing && (
                      <button
                        type="button"
                        className={styles.removeStep}
                        aria-label={`${i + 1}단계 지우기`}
                        disabled={disabled}
                        onClick={() => askRemoveStep(f, i)}
                      >
                        이 단계 지우기
                      </button>
                    )}
                  </li>
                );
              })}
            </ol>
            {f.result && <p className={styles.result}>{f.result}</p>}
          </div>
        )}
      </li>
    );
  };

  return (
    <div className={styles.panel} data-scroll-root="">
      <div className={styles.top}>
        <button type="button" className={styles.suggest} data-flow-suggest="" disabled={disabled || suggesting} onClick={onSuggest}>
          {suggesting ? "만드는 중…" : "흐름 제안받기"}
        </button>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
      </div>
      {flows.length === 0 ? (
        <p className={styles.empty}>{EMPTY}</p>
      ) : (
        GROUPS.map(({ origin, title }) => {
          const rows = flows.filter((f) => f.origin === origin);
          if (rows.length === 0) return null;
          const headId = `flow-group-${origin}`;
          return (
            <section key={origin} className={styles.group} aria-labelledby={headId}>
              <h3 id={headId} className={styles.heading}>
                {title}
              </h3>
              <ul className={styles.list}>{rows.map(row)}</ul>
            </section>
          );
        })
      )}
      {/* 오른쪽 패널은 유리 칠(backdrop-filter)이라 고정 위치 자식을 가둔다: 대화상자는 body 에 그린다. */}
      {dialog && typeof document !== "undefined" && createPortal(<DialogView dialog={dialog} onClose={closeDialog} />, document.body)}
    </div>
  );
}
