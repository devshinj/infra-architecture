import postgres from "postgres";

/** 잠금을 다시 잡아 보는 간격. */
const LOCK_RETRY_MS = 25;

/**
 * 사용자가 보낸 말(대화·노드 질문)이 잠금을 기다려 주는 시간.
 * 잠깐 쥐는 일(흐름 제안·필드 저장 등)은 이 안에 끝나고, 도는 중인 대화 차례(몇 초)는 그대로 "바쁨"으로 돌려준다.
 */
export const USER_TURN_LOCK_WAIT_MS = 400;

/**
 * 구성도 하나에 대화 차례 하나만 돌게 한다.
 * advisory lock 은 세션 단위라 잠금·해제가 같은 연결에서 일어나야 하므로, 차례마다 전용 연결을 하나 연다.
 * 공용 풀의 연결을 붙잡지 않아 동시 차례가 많아도 일반 쿼리가 굶지 않고,
 * 해제 쿼리가 실패해도 연결을 닫으면 잠금이 풀린다.
 */
export async function withDiagramLock<T>(
  diagramId: string,
  fn: () => Promise<T>,
  opts: { waitMs?: number } = {},
): Promise<{ ok: true; value: T } | { ok: false }> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL 이 설정되지 않았습니다");
  const sql = postgres(url, { max: 1, onnotice: () => {} });
  const key = `chat:${diagramId}`;
  try {
    // waitMs 가 있으면 그동안 짧게 다시 잡아 본다. 자동 흐름 제안처럼 잠깐(수십 ms) 쥐었다 놓는 일과
    // 사용자가 보낸 말이 겹쳤을 때 "다른 응답을 처리하고 있어요"로 돌려보내지 않으려는 것이다.
    const deadline = Date.now() + (opts.waitMs ?? 0);
    let locked = false;
    for (;;) {
      const [row] = await sql<{ locked: boolean }[]>`select pg_try_advisory_lock(hashtext(${key})) as locked`;
      locked = row?.locked === true;
      if (locked || Date.now() >= deadline) break;
      await new Promise((r) => setTimeout(r, LOCK_RETRY_MS));
    }
    if (!locked) return { ok: false };
    try {
      return { ok: true, value: await fn() };
    } finally {
      try {
        await sql`select pg_advisory_unlock(hashtext(${key}))`;
      } catch (err) {
        // 연결을 닫으면 어차피 풀린다.
        console.error("chat lock unlock failed", err);
      }
    }
  } finally {
    await sql.end({ timeout: 5 });
  }
}
