"use client";

import { useEffect, useState } from "react";

import { setZoneTypeAction } from "@/app/(app)/actions";
import { GRADE_LABELS, type NetGrade } from "@/domain/network";
import type { ZoneType } from "@/domain/types";
import { Button } from "@/ui/Button";

import { AI_BADGE_SR, AI_GUESS_BADGE } from "../glossary/aiBadge";
import { useNetworkKnowledge } from "./NetworkKnowledgeContext";
import styles from "./network.module.css";

export interface ZoneTypePickerProps {
  diagramId: string;
  groupId: string;
  value: ZoneType | undefined;
  /** 이력 보기·비교: 지금 종류와 추정 표시만 보이고 단추는 없다. */
  readOnly?: boolean;
  /** AI 차례 중: 보이되 누를 수 없다. */
  disabled?: boolean;
  /** 망 이름(화면 읽기 이름표). 없으면 id. */
  label?: string;
  /** 저장했다(바뀐 것이 없으면 null). 부모가 최신 버전을 다시 불러온다. */
  onSaved(number: number | null): void;
}

const GRADES = Object.keys(GRADE_LABELS) as NetGrade[];
const SAVE_FAILED = "저장하지 못했어요. 다시 시도해 주세요.";

/**
 * 망 영역 하나의 망 종류 확인·고르기. AI 추정이면 `AI 추정` 표시와 `맞아요`(그대로 확정)를 두고,
 * 등급별로 묶은 목록에서 골라 `바꾸기`(종류가 없으면 `정하기`)로 저장한다. 망 지식이 없으면 그리지 않는다.
 */
export function ZoneTypePicker({ diagramId, groupId, value, readOnly = false, disabled = false, label, onSaved }: ZoneTypePickerProps) {
  const knowledge = useNetworkKnowledge();
  const current = value && knowledge?.types[value.key] ? value.key : "";
  const [draft, setDraft] = useState(current);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 서버에서 종류가 바뀌어 오면 고르던 값도 따라간다.
  useEffect(() => setDraft(current), [current]);

  if (!knowledge) return null;
  const name = label ?? groupId;
  const guessed = !!value && value.source === "ai" && !value.confirmed && current !== "";
  const types = Object.values(knowledge.types);

  const save = async (key: string | null) => {
    setSaving(true);
    setError(null);
    try {
      const r = await setZoneTypeAction(diagramId, groupId, key);
      if (r.ok) onSaved(r.number);
      else setError(r.error);
    } catch {
      setError(SAVE_FAILED);
    } finally {
      setSaving(false);
    }
  };

  const off = disabled || saving;
  return (
    <div className={styles.picker} role="group" aria-label={`${name} 망 종류`}>
      <div className={styles.row}>
        {readOnly ? (
          <span className={styles.current}>{current ? knowledge.types[current]!.name : "모름"}</span>
        ) : (
          <select className={styles.select} aria-label={`${name} 망 종류 고르기`} value={draft} disabled={off} onChange={(e) => setDraft(e.target.value)}>
            <option value="">모름</option>
            {GRADES.map((g) => {
              const list = types.filter((t) => t.grade === g);
              return list.length === 0 ? null : (
                <optgroup key={g} label={GRADE_LABELS[g]}>
                  {list.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.name}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>
        )}
        {guessed && (
          <>
            <span className={styles.badge}>{AI_GUESS_BADGE}</span>
            <span className={styles.srOnly}>{AI_BADGE_SR}</span>
          </>
        )}
      </div>
      {!readOnly && (
        <div className={styles.row}>
          {guessed && (
            <Button size="sm" disabled={off} onClick={() => void save(current)}>
              맞아요
            </Button>
          )}
          <Button size="sm" disabled={off || draft === current} onClick={() => void save(draft || null)}>
            {current ? "바꾸기" : "정하기"}
          </Button>
        </div>
      )}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
