// "AI 설명" 배지: AI 가 만들었고 사람이 아직 확인하지 않은 정의에만 붙는다(용어 사전·설명 패널 공통).
// 기본 제공(seed) 항목은 검수 전이어도 붙지 않는다. 뜻은 화면 읽기용 숨긴 글로만 들려준다(title 과 겹쳐 두 번 읽히지 않게).

export const AI_BADGE = "AI 설명";
export const AI_BADGE_SR = " (사람이 아직 확인하지 않았어요)";
/** 흐름 탭: AI 가 만든 흐름에 붙는 같은 뜻의 배지(숨긴 글은 AI_BADGE_SR 을 같이 쓴다). */
export const AI_SUGGEST_BADGE = "AI 제안";

/** AI 가 만들었고 아직 검수하지 않은 항목인지. */
export const isUnreviewedAi = (t: { source?: "seed" | "ai" | "user"; reviewed?: boolean }): boolean => t.source === "ai" && t.reviewed === false;
/** AI 가 스스로 판단해 붙인 망 종류·넣은 망연계 노드에 붙는 같은 뜻의 배지(숨긴 글은 AI_BADGE_SR 을 같이 쓴다). */
export const AI_GUESS_BADGE = "AI 추정";
