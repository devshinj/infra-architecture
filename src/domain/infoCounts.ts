// 구성 정보 카드의 접힌 줄 숫자(채워야 할 정보·주의·미확정 가정)와, 두 상태 사이의 변화 한 줄.
// 되돌리기 안내가 "무엇이 돌아갔나"를 보여 줄 때 쓴다(카드와 같은 계산).

import { computeMissing } from "./missing";
import type { NetworkKnowledge } from "./network";
import type { DiagramState } from "./types";
import { mergeWarnings } from "./warnings";

export interface InfoCounts {
  missing: number;
  warnings: number;
  unconfirmed: number;
}

export function infoCounts(state: DiagramState, knowledge?: NetworkKnowledge): InfoCounts {
  return {
    missing: computeMissing(state, knowledge).count,
    warnings: mergeWarnings(state, knowledge).active.length,
    unconfirmed: Object.values(state.assumptions).filter((a) => !a.confirmed).length,
  };
}

const LABELS: readonly [keyof InfoCounts, string][] = [
  ["missing", "채워야 할 정보"],
  ["warnings", "주의"],
  ["unconfirmed", "미확정 가정"],
];

/** "채워야 할 정보 55 → 53 · 주의 12 → 5" — 바뀐 숫자만 카드 순서로. 하나도 안 바뀌면 그대로라고 한다. */
export function infoChangeText(before: InfoCounts, after: InfoCounts): string {
  const parts = LABELS.filter(([k]) => before[k] !== after[k]).map(([k, label]) => `${label} ${before[k]} → ${after[k]}`);
  return parts.length > 0 ? parts.join(" · ") : "구성 정보 숫자는 그대로예요";
}
