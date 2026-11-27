import postgres from "postgres";

import { env } from "@/env";

/** 잠금(또는 풀의 자리)을 다시 잡아 보는 간격. */
const LOCK_RETRY_MS = 25;

/**
 * 사용자가 보낸 말(대화·노드 질문)이 잠금을 기다려 주는 시간.
 * 잠깐 쥐는 일(흐름 제안·필드 저장 등)은 이 안에 끝나고, 도는 중인 대화 차례(몇 초)는 그대로 "바쁨"으로 돌려준다.
 */
export const USER_TURN_LOCK_WAIT_MS = 400;

/** 잠금 전용 연결이 DB 에서 보이는 이름(pg_stat_activity.application_name). */
export const LOCK_APP_NAME = "infrasketch-lock";

/** 쓰지 않는 잠금 연결을 닫기까지의 시간. */
const IDLE_CLOSE_MS = 20_000;

/** 연결 하나짜리 클라이언트. 한 번에 한 차례만 쥔다. */
type LockClient = { sql: postgres.Sql; idleTimer?: ReturnType<typeof setTimeout> };
type LockPool = { free: LockClient[]; inUse: number; max: number; warnedAt: number };

// 라우트마다 모듈이 따로 올라와도, 개발 서버가 다시 읽어도 풀은 프로세스에 하나만 둔다(src/db/client.ts 와 같은 이유).
const holder = globalThis as typeof globalThis & { __infrasketchLockPool?: LockPool };

function makeClient(): LockClient {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL 이 설정되지 않았습니다");
  // 잠금은 세션(연결)에 걸리므로 쥐고 있는 동안 연결이 닫히면 안 된다. 차례가 도는 몇 분 동안은 쿼리가 없어서
  // postgres.js 의 idle_timeout·max_lifetime 을 켜면 쥔 채로 닫힌다 — 둘 다 끄고, 돌려받은 뒤에만 직접 닫는다(release).
  // max 1 이라 모든 쿼리가 한 연결로 가고, 연결이 끊기면 다음 쿼리에서 다시 붙는다(그때 잠금은 이미 풀려 있다).
  return { sql: postgres(url, { max: 1, max_lifetime: 0, onnotice: () => {}, connection: { application_name: LOCK_APP_NAME } }) };
}

function release(pool: LockPool, client: LockClient): void {
  pool.inUse--;
  pool.free.push(client);
  client.idleTimer = setTimeout(() => {
    const at = pool.free.indexOf(client);
    if (at < 0) return; // 그사이 다시 빌려 갔다.
    pool.free.splice(at, 1);
    client.sql.end({ timeout: 5 }).catch(() => {});
  }, IDLE_CLOSE_MS);
  client.idleTimer.unref?.(); // 이 타이머 때문에 프로세스가 살아 있지 않게.
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * 구성도 하나에 대화 차례 하나만 돌게 한다.
 * advisory lock 은 세션 단위라 잠금·해제가 같은 연결에서 일어나야 한다. 그래서 잠금 전용 연결을 하나 빌려 쥐고 있다가 돌려준다.
 *  - 공용 풀(src/db/client.ts)의 연결을 붙잡지 않아, 동시 차례가 많아도 일반 쿼리가 굶지 않는다.
 *  - 전용 연결 수에는 천장(DB_LOCK_POOL_MAX)이 있다. 호출마다 연결을 새로 열기만 하면 한 계정이 요청을 몰아 보내 DB 연결을 바닥낼 수 있다.
 *    다 쓰이고 있으면 연결을 더 열지 않고 `{ ok: false }`(바쁨)로 돌려준다.
 *  - 해제 쿼리가 실패해 잠금이 연결에 남아도, 그 연결을 다음에 빌릴 때 먼저 모두 풀고, 쓰지 않으면 연결째 닫힌다.
 */
export async function withDiagramLock<T>(
  diagramId: string,
  fn: () => Promise<T>,
  opts: { waitMs?: number } = {},
): Promise<{ ok: true; value: T } | { ok: false }> {
  const pool = (holder.__infrasketchLockPool ??= { free: [], inUse: 0, max: env.DB_LOCK_POOL_MAX, warnedAt: 0 });
  const key = `chat:${diagramId}`;
  // waitMs 가 있으면 그동안 짧게 다시 잡아 본다. 자동 흐름 제안처럼 잠깐(수십 ms) 쥐었다 놓는 일과
  // 사용자가 보낸 말이 겹쳤을 때 "다른 응답을 처리하고 있어요"로 돌려보내지 않으려는 것이다.
  const deadline = Date.now() + (opts.waitMs ?? 0);

  while (pool.inUse >= pool.max) {
    if (Date.now() >= deadline) {
      warnExhausted(pool);
      return { ok: false };
    }
    await sleep(LOCK_RETRY_MS);
  }
  pool.inUse++;
  let client = pool.free.pop() ?? makeClient();
  clearTimeout(client.idleTimer);
  try {
    // 앞서 이 연결을 쓴 차례가 해제에 실패했다면 잠금이 남아 있다. 지금은 이 연결을 나만 쓰므로 모두 풀어도 된다.
    try {
      await client.sql`select pg_advisory_unlock_all()`;
    } catch {
      // 쉬는 동안 DB 쪽에서 끊긴 연결(DB 재시작 등)은 첫 쿼리가 그 오류로 실패한다. 버리고 새 연결로 한 번만 다시 한다.
      client.sql.end({ timeout: 5 }).catch(() => {});
      client = makeClient();
      await client.sql`select pg_advisory_unlock_all()`;
    }
    const { sql } = client;
    let locked = false;
    for (;;) {
      const [row] = await sql<{ locked: boolean }[]>`select pg_try_advisory_lock(hashtext(${key})) as locked`;
      locked = row?.locked === true;
      if (locked || Date.now() >= deadline) break;
      await sleep(LOCK_RETRY_MS);
    }
    if (!locked) return { ok: false };
    try {
      return { ok: true, value: await fn() };
    } finally {
      try {
        await sql`select pg_advisory_unlock(hashtext(${key}))`;
      } catch (err) {
        // 연결이 끊겼으면 잠금도 함께 풀렸다. 살아 있는데 실패했다면 다음에 빌릴 때 푼다.
        console.error("chat lock unlock failed", err instanceof Error ? err.message : err);
      }
    }
  } finally {
    release(pool, client);
  }
}

/** 전용 연결이 바닥났다고 남긴다(1분에 한 번). 자주 보이면 DB_LOCK_POOL_MAX 를 올리거나 누가 몰아 보내는지 본다. */
function warnExhausted(pool: LockPool): void {
  const now = Date.now();
  if (now - pool.warnedAt < 60_000) return;
  pool.warnedAt = now;
  console.warn("[lock] 잠금 전용 연결이 모두 쓰이고 있어 요청을 바쁨으로 돌려보냈습니다", { max: pool.max });
}
