import { GUIDE_MIN_CONFIDENCE, GUIDE_QUESTION_WINS, type GuideEnv, type GuideStep } from "./types";

/** 소문자로 바꾸고 공백·문장부호를 없앤다. "두 대" → "두대". */
export function normalizeUtterance(text: string): string {
  return text.toLowerCase().replace(/[\s\p{P}\p{S}]+/gu, "");
}

/** 묶음마다 하나 이상이 글에 들어 있으면 true. 빈 목록은 false. */
export function keywordMatch(text: string, keywords: string[][]): boolean {
  if (keywords.length === 0) return false;
  const t = normalizeUtterance(text);
  return keywords.every((group) => group.some((k) => t.includes(normalizeUtterance(k))));
}

/** pattern 의 모든 조각이 들어 있는 첫 항목의 reply. */
export function findConflict(text: string, step: GuideStep): string | null {
  const t = normalizeUtterance(text);
  const hit = step.conflicts?.find(
    (c) => c.pattern.length > 0 && c.pattern.every((p) => t.includes(normalizeUtterance(p))),
  );
  return hit ? hit.reply : null;
}

const QUESTION_WORDS = ["뭐야", "뭔가요", "무엇", "왜", "어떻게", "차이", "알려줘"];

export function looksLikeQuestion(text: string): boolean {
  if (/[?？]\s*$/.test(text.trim())) return true;
  const t = normalizeUtterance(text);
  return QUESTION_WORDS.some((w) => t.includes(w));
}

const ENV_KEYWORDS: Record<GuideEnv, string[]> = {
  onprem: ["온프레미스", "온프렘", "idc", "사내", "자체"],
  cloud: ["클라우드", "aws", "cloud"],
};

/** 환경 키워드로 환경을 읽는다. 질문이거나 모호하면 null. */
export function readEnv(text: string, available: GuideEnv[]): GuideEnv | null {
  if (looksLikeQuestion(text)) return null;
  const t = normalizeUtterance(text);
  const named = (Object.keys(ENV_KEYWORDS) as GuideEnv[]).filter((e) => ENV_KEYWORDS[e].some((k) => t.includes(k)));
  // 환경이 하나뿐인 주제는 그 환경이 불렸으면 다른 낱말("사내", "자체")이 섞여도 그쪽이다.
  if (available.length === 1 && named.includes(available[0])) return available[0];
  if (named.length > 1) return null;
  if (named.length === 1) return available.includes(named[0]) ? named[0] : null;
  return available.length === 1 ? available[0] : null;
}

export type StepVerdict =
  | { kind: "match" }
  | { kind: "miss" }
  | { kind: "question" }
  | { kind: "conflict"; reply: string };

export function decideStep(
  text: string,
  step: GuideStep,
  clef: { match: number | null; question: number | null },
  threshold = GUIDE_MIN_CONFIDENCE,
): StepVerdict {
  const reply = findConflict(text, step);
  if (reply !== null) return { kind: "conflict", reply };
  if (clef.match !== null) {
    if (clef.question !== null && clef.question >= GUIDE_QUESTION_WINS) return { kind: "question" };
    if (clef.match >= threshold) return { kind: "match" };
    if (clef.question !== null && clef.question >= threshold) return { kind: "question" };
    // Clef 가 확신하지 못해도 이 단계의 키워드가 다 들어 있으면 받는다(카드의 예시 문장도 기준에 못 미칠 때가 있다).
    if (keywordMatch(text, step.keywords)) return { kind: "match" };
    return { kind: "miss" };
  }
  if (keywordMatch(text, step.keywords)) return { kind: "match" };
  if (looksLikeQuestion(text)) return { kind: "question" };
  return { kind: "miss" };
}
