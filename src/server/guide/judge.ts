import { noulProbability, type ClefClient } from "@/server/llm/clef";

/** Clef 판정 전체(대기열 대기 포함)의 상한. 재시도는 하지 않는다. 넘으면 키워드 판정으로 간다. */
export const GUIDE_CLEF_CAP_MS = 3000;

// 문구는 짧게 둔다(긴 Clef 문구는 확신도를 떨어뜨렸다).
const QUESTIONS = {
  match: { type: "noul", instructions: "사용자의 말이 이번 단계 목표를 그리도록 요청하는가" },
  question: { type: "noul", instructions: "사용자의 말이 무언가를 묻는 질문인가" },
} as const;

/**
 * 학습자의 말이 이번 단계 목표를 요청하는지, 질문인지 Clef 에 한 번에 묻는다(noul 둘, "예" 확률 0~1).
 * capMs 안에 끝나지 않거나 실패하면 둘 다 null 이다. 클라이언트가 signal 을 늦게 따르더라도 상한에서 끝낸다.
 */
export async function askClef(
  clef: ClefClient,
  text: string,
  goal: string,
  signal: AbortSignal,
): Promise<{ match: number | null; question: number | null }> {
  const stage = new AbortController();
  const handle = setTimeout(() => stage.abort(), GUIDE_CLEF_CAP_MS);
  const combined = AbortSignal.any([signal, stage.signal]);
  const ended = new Promise<never>((_resolve, reject) => {
    const onAbort = () => reject(new DOMException("The operation was aborted.", "AbortError"));
    if (combined.aborted) onAbort();
    else combined.addEventListener("abort", onAbort, { once: true });
  });
  ended.catch(() => {});
  try {
    const answers = await Promise.race([
      clef.decide({ 사용자_말: text, 이번_단계_목표: goal }, QUESTIONS, combined, { capMs: GUIDE_CLEF_CAP_MS, maxRetries: 0 }),
      ended,
    ]);
    return { match: noulProbability(answers?.match), question: noulProbability(answers?.question) };
  } catch {
    return { match: null, question: null };
  } finally {
    clearTimeout(handle);
    stage.abort(); // 남은 리스너·요청 정리
  }
}
