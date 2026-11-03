// "AI 설명" 배지: AI 가 만들었고 사람이 아직 확인하지 않은 정의에만 붙는다(용어 사전·설명 패널 공통).
// 기본 제공(seed) 항목은 검수 전이어도 붙지 않는다. 뜻은 화면 읽기용 숨긴 글로만 들려준다(title 과 겹쳐 두 번 읽히지 않게).

export const AI_BADGE = "AI 설명";
export const AI_BADGE_SR = " (사람이 아직 확인하지 않았어요)";

/** AI 가 만들었고 아직 검수하지 않은 항목인지. */
export const isUnreviewedAi = (t: { source?: "seed" | "ai"; reviewed?: boolean }): boolean => t.source === "ai" && t.reviewed === false;
