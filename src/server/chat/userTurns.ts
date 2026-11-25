/** 한 사용자가 동시에 돌릴 수 있는 차례(구성도 대화·학습·노드 질문) 수. */
export const MAX_USER_TURNS = 2;

// 차례 하나는 LLM 을 몇 초~몇 분 부르고 잠금용 DB 연결도 하나 쥔다. 구성도 잠금은 구성도마다 따로라서,
// 구성도를 여러 개 열어 동시에 보내면 한 계정이 LLM 과 DB 연결을 끝없이 쓸 수 있다. 그래서 계정마다 센다.
// 서버 프로세스 안에서만 센다(DB 연결을 더 쓰지 않는다). 서버가 여러 대면 대수만큼 한도가 늘어난다.
// 라우트마다 모듈이 따로 올라와도 같은 표를 보게 globalThis 에 둔다.
const store = globalThis as typeof globalThis & { __infraSketchUserTurns?: Map<string, number> };
const running = (store.__infraSketchUserTurns ??= new Map<string, number>());

/**
 * 사용자의 차례 자리를 하나 잡고 fn 을 돌린다. 이미 MAX_USER_TURNS 개가 돌고 있으면 돌리지 않고 `{ ok: false }`.
 * fn 이 던져도 자리는 돌려준다.
 */
export async function withUserTurnSlot<T>(userId: string, fn: () => Promise<T>): Promise<{ ok: true; value: T } | { ok: false }> {
  const count = running.get(userId) ?? 0;
  if (count >= MAX_USER_TURNS) return { ok: false };
  running.set(userId, count + 1);
  try {
    return { ok: true, value: await fn() };
  } finally {
    const left = (running.get(userId) ?? 1) - 1;
    if (left > 0) running.set(userId, left);
    else running.delete(userId);
  }
}
