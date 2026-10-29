import postgres from "postgres";

/**
 * 구성도 하나에 대화 차례 하나만 돌게 한다.
 * advisory lock 은 세션 단위라 잠금·해제가 같은 연결에서 일어나야 하므로, 차례마다 전용 연결을 하나 연다.
 * 공용 풀의 연결을 붙잡지 않아 동시 차례가 많아도 일반 쿼리가 굶지 않고,
 * 해제 쿼리가 실패해도 연결을 닫으면 잠금이 풀린다.
 */
export async function withDiagramLock<T>(
  diagramId: string,
  fn: () => Promise<T>,
): Promise<{ ok: true; value: T } | { ok: false }> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL 이 설정되지 않았습니다");
  const sql = postgres(url, { max: 1, onnotice: () => {} });
  const key = `chat:${diagramId}`;
  try {
    const [row] = await sql<{ locked: boolean }[]>`select pg_try_advisory_lock(hashtext(${key})) as locked`;
    if (!row?.locked) return { ok: false };
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
