"use client";

import { useState } from "react";

import { CLARIFY_AUTO, choicesSummary, type ClarifyQuestion } from "@/domain/clarify";
import { Button } from "@/ui/Button";

import styles from "./chat.module.css";

export interface ClarifyCardProps {
  questions: ClarifyQuestion[];
  /** 지난 질문(이미 답했거나 뒤에 다른 말이 이어진 것)이거나 차례가 도는 중이면 고르지 못한다. */
  disabled: boolean;
  /** 모두 고른 뒤 `이대로 그리기`. summary 는 내 말풍선에 남길 한 줄이다. */
  onSubmit(summary: string, choices: Record<string, string>): void;
}

/**
 * 그리기 전에 되묻는 카드. 질문마다 선택지와 `알아서 정해 줘` 가운데 하나를 고르고, 모두 고르면 그린다.
 * 선택지는 라디오 묶음이라 화살표 키로 옮긴다.
 */
export function ClarifyCard({ questions, disabled, onSubmit }: ClarifyCardProps) {
  const [picked, setPicked] = useState<Record<string, string>>({});
  const ready = questions.every((q) => picked[q.key] !== undefined);
  const submit = () => {
    if (disabled || !ready) return;
    // 질문 차례대로 남긴다.
    const choices = Object.fromEntries(questions.map((q) => [q.key, picked[q.key]]));
    onSubmit(choicesSummary(choices), choices);
  };
  return (
    <div className={styles.clarify} data-kind="clarify">
      {questions.map((q) => (
        <fieldset key={q.key} className={styles.clarifyQuestion} disabled={disabled}>
          <legend className={styles.clarifyLegend}>{q.question}</legend>
          <div className={styles.clarifyChoices}>
            {[...q.choices, CLARIFY_AUTO].map((c) => (
              <label key={c} className={styles.clarifyChoice} data-checked={picked[q.key] === c || undefined} data-auto={c === CLARIFY_AUTO || undefined}>
                <input
                  type="radio"
                  className={styles.clarifyRadio}
                  name={`clarify-${q.key}`}
                  value={c}
                  checked={picked[q.key] === c}
                  onChange={() => setPicked((p) => ({ ...p, [q.key]: c }))}
                />
                <span>{c}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <div>
        <Button size="sm" disabled={disabled || !ready} onClick={submit}>
          이대로 그리기
        </Button>
      </div>
    </div>
  );
}
