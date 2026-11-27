import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { users } from "@/db/schema";

import { attemptKey, claimAttempt, clearAttempts, LIMITS, UNKNOWN_IP, type Limit } from "./rateLimit";
import { normalizeUsername } from "./rules";

const COST = 12;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, COST);
}

export async function verifyCredentials(
  username: string,
  password: string,
): Promise<VerifiedUser | null> {
  // 가입 때와 같이 맞춘다(" Jae" 로 입력해도 jae 로 로그인).
  const [user] = await db.select().from(users).where(eq(users.username, normalizeUsername(username))).limit(1);
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  return ok ? { id: user.id, username: user.username, sessionVersion: user.sessionVersion } : null;
}

export type VerifiedUser = { id: string; username: string; sessionVersion: number };
export type LoginResult = { ok: true; user: VerifiedUser } | { ok: false; reason: "credentials" | "rate_limited" };

/**
 * 로그인 한 번(횟수 제한 포함). 막혀 있으면 비밀번호를 확인하지 않는다(bcrypt 를 아끼고, 맞는지도 알려 주지 않는다).
 * 실패는 아이디·IP 둘 다에 세고, 성공하면 그 아이디의 실패 기록만 지운다(IP 는 같은 곳의 다른 아이디 대입을 막으려 남긴다).
 * 기록을 먼저 넣고 세므로(claimAttempt) 한꺼번에 보내도 한도를 넘겨 확인받지 못한다. IP 를 모르면 IP 한도는 세지 않는다.
 */
export async function attemptLogin(username: string, password: string, ip: string): Promise<LoginResult> {
  const userKey = attemptKey.loginUser(normalizeUsername(username));
  const entries: { key: string; limit: Limit }[] = [{ key: userKey, limit: LIMITS.loginUser }];
  if (ip !== UNKNOWN_IP) entries.push({ key: attemptKey.loginIp(ip), limit: LIMITS.loginIp });
  const claim = await claimAttempt(...entries);
  if (claim.limited) return { ok: false, reason: "rate_limited" };

  let user: VerifiedUser | null;
  try {
    user = await verifyCredentials(username, password);
  } catch (e) {
    await claim.release(); // 확인하지 못한 시도는 실패로 세지 않는다.
    throw e;
  }
  if (!user) return { ok: false, reason: "credentials" }; // 넣어 둔 기록이 실패 기록으로 남는다.
  await claim.release();
  await clearAttempts(userKey);
  return { ok: true, user };
}

/** 지금 계정의 세션 번호. 계정이 지워졌으면 null. */
export async function currentSessionVersion(userId: string): Promise<number | null> {
  const [row] = await db.select({ v: users.sessionVersion }).from(users).where(eq(users.id, userId)).limit(1);
  return row ? row.v : null;
}
