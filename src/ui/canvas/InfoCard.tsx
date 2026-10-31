"use client";

import { useEffect, useId, useLayoutEffect, useMemo, useRef } from "react";

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
  /** 카드 크기(px): 카메라가 접힌 줄 높이만큼 아래를 비우고, 열린 카드는 위치 보기에서 피한다. */
  onMeasure?(m: CardMeasure): void;
}

export type CardMeasure = { width: number; height: number; lineHeight: number };

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
export function InfoCard({ state, readOnly, busy, open, onOpenChange, scrollToWarnings, checklist, onChooseAssumption, onConfirmAssumption, onSelectWarning, onMeasure }: InfoCardProps) {
  const miss = useMemo(() => computeMissing(state), [state]);
  const missing = miss.count;
  const warnings = useMemo(() => mergeWarnings(state).active, [state]);
  const assumptionCount = Object.keys(state.assumptions).length;
  const unconfirmed = Object.values(state.assumptions).filter((a) => !a.confirmed).length;
  const warningsRef = useRef<HTMLElement>(null);
  const warnHeadRef = useRef<HTMLHeadingElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const countsId = useId();
  const hidden = Object.keys(state.nodes).length === 0 && assumptionCount === 0;

  // 주의 N 칩: 새 토큰이 오면 한 번만 주의 절로 가서 첫 항목(없으면 제목)에 포커스한다(접었다 펴도 다시 뛰지 않는다).
  const handled = useRef(scrollToWarnings);
  useEffect(() => {
    if (!open || scrollToWarnings === handled.current) return;
    handled.current = scrollToWarnings;
    // nearest: 카드 안에서만 움직이고 바깥(셸)은 끌어 올리지 않는다.
    warningsRef.current?.scrollIntoView?.({ block: "nearest" });
    const first = warningsRef.current?.querySelector<HTMLButtonElement>("button") ?? warnHeadRef.current;
    first?.focus({ preventScroll: true });
  }, [open, scrollToWarnings]);

  // 크기 알림: 펼침·내용·줄바꿈으로 바뀌면 다시 잰다.
  useLayoutEffect(() => {
    const el = cardRef.current;
    const t = toggleRef.current;
    if (!el || !t || !onMeasure) return;
    const report = () => onMeasure({ width: el.offsetWidth, height: el.offsetHeight, lineHeight: t.offsetHeight });
    report();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(report);
    ro.observe(el);
    ro.observe(t);
    return () => ro.disconnect();
  }, [onMeasure, hidden, open]);

  if (hidden) return null;

  // Escape: 카드 안에서 누르면 접고 접기 줄로 포커스를 돌린다(가정 대안 메뉴가 열려 있으면 메뉴가 먼저 닫힌다).
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Escape" || !open) return;
    e.preventDefault();
    onOpenChange(false);
    toggleRef.current?.focus();
  };

  return (
    <aside ref={cardRef} className={styles.card} data-open={open || undefined} aria-label="구성 정보" onKeyDown={onKeyDown}>
      <button
        ref={toggleRef}
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        aria-controls="info-card-body"
        aria-label={`구성 정보 ${open ? "접기" : "펼치기"}`}
        aria-describedby={countsId}
        onClick={() => onOpenChange(!open)}
      >
        {/* 좁으면 항목 사이에서 줄을 바꾼다(숫자를 말줄임으로 자르지 않는다). */}
        <span id={countsId} className={styles.line}>
          <span className={styles.title}>구성 정보</span>{" "}
          <span className={styles.seg}>· 채워야 할 정보 <Count n={missing} /></span>{" "}
          <span className={styles.seg}>· 주의 <Count n={warnings.length} /></span>{" "}
          <span className={styles.seg}>· 미확정 가정 <Count n={unconfirmed} /></span>
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
            <h3 ref={warnHeadRef} tabIndex={-1} className={styles.heading}>
              주의 <Count n={warnings.length} />
            </h3>
            {warnings.length > 0 ? (
              <ul className={styles.warnings}>
                {warnings.map((w) => (
                  <li key={w.id}>
                    <button type="button" className={styles.warning} data-level={w.level} aria-label={`${state.nodes[w.nodeId]?.label ?? w.nodeId}으로 가기: ${w.text}`} onClick={() => onSelectWarning(w.nodeId)}>
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
