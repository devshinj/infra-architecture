import { createHash, randomBytes } from "node:crypto";

import { and, eq, gt, isNull, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { mcpKeys, passwordResetTokens, users } from "@/db/schema";
import { env } from "@/env";

import { sendMail } from "./mailer";
import { hashPassword } from "./password";
import { attemptKey, claimAttempt, clearAttempts, LIMITS } from "./rateLimit";
import { checkNewPassword, MESSAGES, RESET_TTL_HOURS } from "./rules";

const TTL_MS = RESET_TTL_HOURS * 60 * 60 * 1000;

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

/** 메일 보내기를 응답 뒤로 미루는 함수(Next 의 after). 주지 않으면 그 자리에서 기다린다(테스트). */
export type Defer = (task: () => Promise<void>) => void;

/**
 * 재설정 링크를 만든다. "limited" 면 이 주소로 너무 자주 요청했다(계정이 있든 없든 같은 기준).
 * 계정이 있을 때만 하는 메일 발송은 defer 로 응답 뒤에 보내, 응답 시간으로 가입 여부가 드러나지 않게 한다.
 */
export async function requestPasswordReset(email: string, defer?: Defer): Promise<"ok" | "limited"> {
  const address = email.trim().toLowerCase();
  const claim = await claimAttempt({ key: attemptKey.resetEmail(address), limit: LIMITS.resetEmail });
  if (claim.limited) return "limited";

  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, address)).limit(1);
  if (!user) return "ok"; // 존재 여부를 드러내지 않는다.

  const token = randomBytes(32).toString("base64url");
  await db.insert(passwordResetTokens).values({
    tokenHash: sha256(token),
    userId: user.id,
    expiresAt: new Date(Date.now() + TTL_MS),
  });

  const deliver = () => deliverResetLink(address, `${env.APP_URL}/reset/${token}`);
  if (defer) defer(deliver);
  else await deliver();
  return "ok";
}

async function deliverResetLink(email: string, link: string): Promise<void> {
  if (!env.SMTP_HOST) {
    // 링크는 그 계정에 들어갈 수 있는 열쇠다. 운영 로그에는 남기지 않고, 메일 서버 없이 쓰겠다고 켠 때(RESET_LINK_LOG)만 찍는다.
    if (process.env.NODE_ENV !== "production" || env.RESET_LINK_LOG) console.info("[reset-link]", link);
    else console.error("[reset-mail] SMTP 설정이 없어 재설정 메일을 보내지 못했습니다. 메일 서버 없이 쓰려면 RESET_LINK_LOG=1 을 넣으세요.");
    return;
  }
  try {
    await sendMail(email, "InfraSketch 비밀번호 재설정", `아래 링크에서 새 비밀번호를 정해 주세요. 링크는 ${RESET_TTL_HOURS}시간 동안 쓸 수 있어요.\n${link}`);
  } catch (e) {
    // 발송 실패가 계정 존재 여부로 드러나지 않게 삼킨다. 링크·토큰은 기록하지 않는다.
    console.error("[reset-mail] 발송 실패:", e instanceof Error ? e.message : "unknown");
  }
}

/** 링크를 열었을 때 쓸 수 있는 토큰인지 미리 본다(선점하지 않는다). 새 비밀번호를 다 입력한 뒤에야 만료를 알게 되지 않도록. */
export async function isResetTokenUsable(token: string): Promise<boolean> {
  const [row] = await db
    .select({ userId: passwordResetTokens.userId })
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.tokenHash, sha256(token)),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, new Date()),
      ),
    )
    .limit(1);
  return Boolean(row);
}

/**
 * reason 이 "token" 이면 비밀번호를 다시 입력해도 소용없다 — 화면은 새 링크를 받도록 안내한다.
 * revokedKeys 는 함께 지운 MCP 키 수(화면이 다시 만들라고 안내한다).
 */
export type ResetResult =
  | { ok: true; revokedKeys: number }
  | { ok: false; reason: "password" | "token"; message: string };

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<ResetResult> {
  const passwordError = checkNewPassword(newPassword);
  if (passwordError) return { ok: false, reason: "password", message: passwordError };
  const invalid: ResetResult = { ok: false, reason: "token", message: MESSAGES.resetLinkExpired };
  // 해시(bcrypt)는 느리다. 로그인 없이 부르는 길이라, 쓸 수 있는 링크일 때만 돌린다.
  // 이 조회와 아래 UPDATE 사이에 다른 요청이 링크를 쓰면 UPDATE 가 걸러 낸다.
  if (!(await isResetTokenUsable(token))) return invalid;
  const passwordHash = await hashPassword(newPassword);

  // 한 번만 쓰이도록 usedAt 갱신을 조건부 UPDATE 로 먼저 선점한다.
  const result = await db.transaction(async (tx) => {
    const [claimed] = await tx
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(
        and(
          eq(passwordResetTokens.tokenHash, sha256(token)),
          isNull(passwordResetTokens.usedAt),
          gt(passwordResetTokens.expiresAt, new Date()),
        ),
      )
      .returning({ userId: passwordResetTokens.userId });
    if (!claimed) return null;
    // 세션 번호를 올려 다른 기기에 열린 로그인을 끊고, 같은 계정에 남은 다른 재설정 링크도 못 쓰게 한다.
    const [user] = await tx
      .update(users)
      .set({ passwordHash, sessionVersion: sql`${users.sessionVersion} + 1` })
      .where(eq(users.id, claimed.userId))
      .returning({ username: users.username });
    await tx
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(and(eq(passwordResetTokens.userId, claimed.userId), isNull(passwordResetTokens.usedAt)));
    // 재설정은 계정을 되찾는 일이다. 그 전에 누가 만들어 둔 MCP 키로 구성도를 계속 읽고 고치지 못하게 모두 지운다.
    const revoked = await tx.delete(mcpKeys).where(eq(mcpKeys.userId, claimed.userId)).returning({ id: mcpKeys.id });
    return { username: user?.username ?? "", revokedKeys: revoked.length };
  });
  if (result === null) return invalid;
  // 새 비밀번호로는 바로 로그인할 수 있게, 그 아이디의 로그인 실패 기록을 지운다.
  if (result.username) await clearAttempts(attemptKey.loginUser(result.username));
  return { ok: true, revokedKeys: result.revokedKeys };
}
