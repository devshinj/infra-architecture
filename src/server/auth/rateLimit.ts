import { and, count, eq, gt, inArray, lt } from "drizzle-orm";

import { db } from "@/db/client";
import { authAttempts } from "@/db/schema";
import { env } from "@/env";

/**
 * 로그인·재설정 횟수 제한. 기록은 DB(auth_attempts)에 두어 서버를 다시 켜도, 여러 대여도 이어진다.
 *  - 로그인: 같은 아이디 15분에 실패 10번, 같은 IP 15분에 실패 30번이면 막는다(맞는 비밀번호여도 확인하지 않는다).
 *  - 재설정 요청: 같은 주소 1시간에 3번(계정이 있든 없든 센다 — 막힘 자체로 가입 여부가 드러나지 않게).
 *  - 가입: 같은 IP 1시간에 계정 5개(만들어진 계정만 센다 — 입력 실수는 세지 않는다).
 *  - IP 를 모르면("unknown") IP 한도는 세지 않는다. 모르는 요청이 한 통에 묶이면 한 사람이 모두를 막을 수 있다.
 * 기록을 먼저 넣고 센다(claimAttempt). 그래서 동시에 몰려도 통과하는 수는 남은 한도를 넘지 못한다.
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

async function countRecent(key: string, limit: Limit): Promise<number> {
  const since = new Date(Date.now() - limit.windowMs);
  const [row] = await db
    .select({ n: count() })
    .from(authAttempts)
    .where(and(eq(authAttempts.key, key), gt(authAttempts.at, since)));
  return row?.n ?? 0;
}

export type Claim = {
  /** 한도를 넘었다. 이때는 남긴 기록이 없다(막힌 시도는 세지 않는다). */
  limited: boolean;
  /** 이번에 넣은 기록을 지운다 — 세지 않을 시도(성공한 로그인, 만들지 못한 가입)에 부른다. */
  release: () => Promise<void>;
};

const NO_RELEASE = async () => {};

/**
 * 시도를 먼저 기록하고 그 뒤에 센다. 한도를 넘으면 방금 넣은 기록을 지우고 `limited`.
 * "세고 → 일하고 → 기록" 순서면 동시에 온 요청이 모두 세기를 통과하지만, 이 순서면 각 요청이 먼저 들어온 기록을 함께 세므로
 * 통과하는 수가 남은 한도를 넘지 못한다. 통과한 기록은 그대로 두면 실패 기록이 된다.
 */
export async function claimAttempt(...entries: { key: string; limit: Limit }[]): Promise<Claim> {
  if (entries.length === 0) return { limited: false, release: NO_RELEASE };
  const rows = await db
    .insert(authAttempts)
    .values(entries.map(({ key }) => ({ key })))
    .returning({ id: authAttempts.id });
  const ids = rows.map((r) => r.id);
  const release = async () => {
    await db.delete(authAttempts).where(inArray(authAttempts.id, ids));
  };
  for (const { key, limit } of entries) {
    if ((await countRecent(key, limit)) > limit.max) {
      await release();
      return { limited: true, release: NO_RELEASE };
    }
  }
  await db.delete(authAttempts).where(lt(authAttempts.at, new Date(Date.now() - KEEP_MS)));
  return { limited: false, release };
}

export async function clearAttempts(key: string): Promise<void> {
  await db.delete(authAttempts).where(eq(authAttempts.key, key));
}

/** 요청한 쪽 IP 를 알 수 없을 때의 값. 이 값으로는 IP 한도를 세지 않는다. */
export const UNKNOWN_IP = "unknown";

/**
 * 요청한 쪽 IP.
 *  - `hops`(TRUSTED_PROXY_HOPS)를 주면 x-forwarded-for 를 오른쪽에서 그만큼 센다. 오른쪽 값은 우리 프록시가 붙인 것이라 믿을 수 있고,
 *    왼쪽 값은 요청한 쪽이 꾸밀 수 있다. 값이 그보다 적으면 맨 왼쪽. 0 이면 프록시가 없다는 뜻이라 헤더를 믿지 않는다.
 *  - 설정이 없으면(null) 첫 값을 믿는다(프록시가 헤더를 덮어쓰는 구성에서만 안전하다 — 덧붙이는 프록시라면 hops 를 넣는다).
 */
export function clientIp(headers: Headers, hops: number | null = env.TRUSTED_PROXY_HOPS ?? null): string {
  if (hops === 0) return UNKNOWN_IP;
  const forwarded = (headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  const picked = hops === null ? forwarded[0] : forwarded[Math.max(0, forwarded.length - hops)];
  return picked || headers.get("x-real-ip")?.trim() || UNKNOWN_IP;
}
