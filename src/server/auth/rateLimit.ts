import { and, count, eq, gt, lt } from "drizzle-orm";

import { db } from "@/db/client";
import { authAttempts } from "@/db/schema";

/**
 * 로그인·재설정 횟수 제한. 기록은 DB(auth_attempts)에 두어 서버를 다시 켜도, 여러 대여도 이어진다.
 *  - 로그인: 같은 아이디 15분에 실패 10번, 같은 IP 15분에 실패 30번이면 막는다(맞는 비밀번호여도 확인하지 않는다).
 *  - 재설정 요청: 같은 주소 1시간에 3번(계정이 있든 없든 센다 — 막힘 자체로 가입 여부가 드러나지 않게).
 *  - 가입: 같은 IP 1시간에 계정 5개(만들어진 계정만 센다 — 입력 실수는 세지 않는다). IP 를 모르면("unknown") 세지 않는다.
 * 세기와 기록이 한 묶음(트랜잭션)은 아니라 동시에 몰린 요청 몇 개는 넘칠 수 있다. 무차별 대입을 늦추는 데는 충분하다.
 */
export type Limit = { max: number; windowMs: number };

const MINUTE = 60_000;
export const LIMITS = {
  loginUser: { max: 10, windowMs: 15 * MINUTE },
  loginIp: { max: 30, windowMs: 15 * MINUTE },
  resetEmail: { max: 3, windowMs: 60 * MINUTE },
  signupIp: { max: 5, windowMs: 60 * MINUTE },
} as const satisfies Record<string, Limit>;

/** 가장 긴 창(1시간)보다 넉넉히 지난 기록은 지운다. */
const KEEP_MS = 24 * 60 * MINUTE;

export const attemptKey = {
  loginUser: (username: string) => `login:user:${username}`,
  loginIp: (ip: string) => `login:ip:${ip}`,
  resetEmail: (email: string) => `reset:email:${email}`,
  signupIp: (ip: string) => `signup:ip:${ip}`,
};

export async function isLimited(key: string, limit: Limit): Promise<boolean> {
  const since = new Date(Date.now() - limit.windowMs);
  const [row] = await db
    .select({ n: count() })
    .from(authAttempts)
    .where(and(eq(authAttempts.key, key), gt(authAttempts.at, since)));
  return (row?.n ?? 0) >= limit.max;
}

export async function recordAttempt(...keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  await db.insert(authAttempts).values(keys.map((key) => ({ key })));
  await db.delete(authAttempts).where(lt(authAttempts.at, new Date(Date.now() - KEEP_MS)));
}

export async function clearAttempts(key: string): Promise<void> {
  await db.delete(authAttempts).where(eq(authAttempts.key, key));
}

/**
 * 요청한 쪽 IP. 사내 배포는 프록시 뒤라 x-forwarded-for 의 첫 값을 믿는다(프록시 없이 바로 열면 꾸며 낼 수 있다 — 그래도 아이디별 제한은 남는다).
 * 알 수 없으면 "unknown" 하나로 묶는다.
 */
export const UNKNOWN_IP = "unknown";

export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || UNKNOWN_IP;
}
