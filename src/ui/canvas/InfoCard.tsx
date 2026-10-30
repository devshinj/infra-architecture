"use client";

import { useEffect, useMemo, useRef } from "react";

import { computeMissing } from "@/domain/missing";
import type { DiagramState, Warning } from "@/domain/types";
import { mergeWarnings } from "@/domain/warnings";

import { AssumptionChips } from "../chat/AssumptionChips";
import { MissingChecklist, type MissingChecklistProps } from "../chat/MissingChecklist";
import styles from "./infoCard.module.css";

export interface InfoCardProps {
  /** 보여 줄 상태(이력 보기면 그 버전, 비교면 현재 상태). */
  state: DiagramState;
  /** 이력 보기·비교: 저장·확정·고르기를 숨긴다. */
  readOnly: boolean;
  /** AI 차례 중: 버튼은 남기되 누를 수 없다. */
  busy: boolean;
  open: boolean;
  onOpenChange(open: boolean): void;
  /** 바뀌면(펼친 상태에서) 주의 절로 스크롤한다. 대화의 `주의 N` 칩이 올린다. */
  scrollToWarnings?: number;
  checklist: Omit<MissingChecklistProps, "state" | "busy" | "readOnly">;
  onChooseAssumption(key: string, value: string): void;
  onConfirmAssumption(key: string): void;
  /** 주의 항목 클릭: 그 노드를 선택한다(설명 탭 → 주의할 점). */
  onSelectWarning(nodeId: string): void;
}

const LEVEL_LABEL: Record<Warning["level"], string> = { warn: "경고", check: "확인 필요" };

function Count({ n }: { n: number }) {
  return (
    <span className={styles.num} data-zero={n === 0 || undefined}>
      {n}
    </span>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg className={styles.chevron} data-open={open || undefined} width={12} height={12} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.75 7.5 6 4.25 9.25 7.5" />
    </svg>
  );
}

/**
 * 캔버스 왼쪽 아래의 구성 정보 카드. 접히면 한 줄(채워야 할 정보·주의·미확정 가정 수),
 * 펼치면 위로 열려 가정 → 채워야 할 정보 → 주의 세 절을 보인다.
 */
export function InfoCard({ state, readOnly, busy, open, onOpenChange, scrollToWarnings, checklist, onChooseAssumption, onConfirmAssumption, onSelectWarning }: InfoCardProps) {
  const miss = useMemo(() => computeMissing(state), [state]);
  const missing = miss.count;
  const warnings = useMemo(() => mergeWarnings(state).active, [state]);
  const assumptionCount = Object.keys(state.assumptions).length;
  const unconfirmed = Object.values(state.assumptions).filter((a) => !a.confirmed).length;
  const warningsRef = useRef<HTMLElement>(null);

  // 주의 N 칩: 새 토큰이 오면 한 번만 주의 절로 간다(접었다 펴도 다시 뛰지 않는다).
  const handled = useRef(scrollToWarnings);
  useEffect(() => {
    if (!open || scrollToWarnings === handled.current) return;
    handled.current = scrollToWarnings;
    // nearest: 카드 안에서만 움직이고 바깥(셸)은 끌어 올리지 않는다.
    warningsRef.current?.scrollIntoView?.({ block: "nearest" });
  }, [open, scrollToWarnings]);

  if (Object.keys(state.nodes).length === 0 && assumptionCount === 0) return null;

  return (
    <aside className={styles.card} data-open={open || undefined} aria-label="구성 정보">
      <button type="button" className={styles.toggle} aria-expanded={open} aria-controls="info-card-body" aria-label={`구성 정보 ${open ? "접기" : "펼치기"}`} onClick={() => onOpenChange(!open)}>
        <span className={styles.line}>
          <span className={styles.title}>구성 정보</span>
          <span className={styles.sep} aria-hidden="true"> · </span>
          <span>채워야 할 정보 <Count n={missing} /></span>
          <span className={styles.sep} aria-hidden="true"> · </span>
          <span>주의 <Count n={warnings.length} /></span>
          <span className={styles.sep} aria-hidden="true"> · </span>
          <span>미확정 가정 <Count n={unconfirmed} /></span>
        </span>
        <Chevron open={open} />
      </button>
      {open && (
        <div id="info-card-body" className={styles.body}>
          <section className={styles.section} aria-label="가정">
            <h3 className={styles.heading}>가정</h3>
            {assumptionCount > 0 ? (
              <AssumptionChips assumptions={state.assumptions} busy={busy} readOnly={readOnly} onChoose={onChooseAssumption} onConfirm={onConfirmAssumption} />
            ) : (
              <p className={styles.empty}>AI 가 세운 가정이 없어요.</p>
            )}
          </section>
          <section className={styles.section} aria-label="채워야 할 정보">
            <h3 className={styles.heading}>
              채워야 할 정보 <Count n={missing} />
            </h3>
            {miss.items.length > 0 ? (
              <MissingChecklist {...checklist} state={state} busy={busy} readOnly={readOnly} />
            ) : (
              <p className={styles.empty}>모든 정보가 채워졌어요.</p>
            )}
          </section>
          <section ref={warningsRef} className={styles.section} aria-label="주의">
            <h3 className={styles.heading}>
              주의 <Count n={warnings.length} />
            </h3>
            {warnings.length > 0 ? (
              <ul className={styles.warnings}>
                {warnings.map((w) => (
                  <li key={w.id}>
                    <button type="button" className={styles.warning} data-level={w.level} onClick={() => onSelectWarning(w.nodeId)}>
                      <span className={styles.level}>{LEVEL_LABEL[w.level]}</span>
                      <span className={styles.warnText}>{w.text}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.empty}>지금 걸린 주의할 점이 없어요.</p>
            )}
          </section>
        </div>
      )}
    </aside>
  );
}
