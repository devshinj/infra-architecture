/**
 * 건너뛴 AI 줄을 이유별로 센다. 대화 경로(서버 로그)와 점검 스크립트가 함께 쓴다.
 * 키에는 사용자 글을 넣지 않는다. 표본 줄은 모델 출력이며 점검 스크립트만 남긴다.
 */

export type SkipKind = "empty_say" | "unknown_op" | "invalid" | "apply" | "bad_json";

const KEY_MAX = 100;
const SAMPLE_MAX = 120;
const SAMPLE_COUNT = 3;

/** 같은 원인끼리 묶이도록 만든 키. apply 오류("endpoint x not found")는 id 를 지운다. */
export function skipKey(kind: SkipKind, op = "", detail = ""): string {
  const d = kind === "apply" ? detail.replace(/^(\w+) \S+/, "$1 …") : detail;
  return [kind, op, d].filter(Boolean).join(" ").slice(0, KEY_MAX);
}

export interface SkipTally {
  add(key: string, sample?: string): void;
  total(): number;
  counts(): Record<string, number>;
  samples(): string[];
}

export function createSkipTally(): SkipTally {
  const counts: Record<string, number> = {};
  const samples: string[] = [];
  let total = 0;
  return {
    add(key, sample) {
      counts[key] = (counts[key] ?? 0) + 1;
      total++;
      if (sample !== undefined && samples.length < SAMPLE_COUNT) samples.push(sample.slice(0, SAMPLE_MAX));
    },
    total: () => total,
    counts: () => ({ ...counts }),
    samples: () => [...samples],
  };
}
