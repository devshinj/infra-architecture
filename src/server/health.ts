import { sql } from "drizzle-orm";

import { db } from "@/db/client";

/** DB 가 이 시간 안에 답하지 않으면 내려간 것으로 본다. 컨테이너 헬스체크(5초)보다 짧아야 한다. */
export const HEALTH_TIMEOUT_MS = 3_000;

export type Health = { status: "ok" | "down" };

/** 공용 풀로 한 줄을 묻는다. 연결이 없으면 새로 연다. */
export async function pingDb(): Promise<void> {
  await db.execute(sql`select 1`);
}

/**
 * 앱이 요청을 받을 수 있는지: DB 에 닿으면 ok. AI 서버는 보지 않는다(꺼져 있어도 앱은 쓸 수 있다).
 * 공개 주소라 오류 내용은 돌려주지 않고 서버 로그에만 남긴다.
 */
export async function checkHealth(ping: () => Promise<void>): Promise<Health> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`DB 가 ${HEALTH_TIMEOUT_MS}ms 안에 답하지 않았다`)), HEALTH_TIMEOUT_MS);
  });
  try {
    await Promise.race([ping(), timeout]);
    return { status: "ok" };
  } catch (err) {
    console.error("[health] DB 확인 실패", err);
    return { status: "down" };
  } finally {
    clearTimeout(timer);
  }
}
