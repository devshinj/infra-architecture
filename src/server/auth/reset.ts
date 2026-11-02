import { createHash, randomBytes } from "node:crypto";

import { and, eq, gt, isNull } from "drizzle-orm";

import { db } from "@/db/client";
import { passwordResetTokens, users } from "@/db/schema";
import { env } from "@/env";

import { sendMail } from "./mailer";
import { hashPassword } from "./password";
import { checkNewPassword, MESSAGES, RESET_TTL_HOURS } from "./rules";

const TTL_MS = RESET_TTL_HOURS * 60 * 60 * 1000;

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

export async function requestPasswordReset(email: string): Promise<void> {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email.trim().toLowerCase()))
    .limit(1);
  if (!user) return; // 존재 여부를 드러내지 않는다.

  const token = randomBytes(32).toString("base64url");
  await db.insert(passwordResetTokens).values({
    tokenHash: sha256(token),
    userId: user.id,
    expiresAt: new Date(Date.now() + TTL_MS),
  });

  const link = `${env.APP_URL}/reset/${token}`;
  if (!env.SMTP_HOST) {
    console.info("[reset-link]", link);
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

/** reason 이 "token" 이면 비밀번호를 다시 입력해도 소용없다 — 화면은 새 링크를 받도록 안내한다. */
export type ResetResult =
  | { ok: true }
  | { ok: false; reason: "password" | "token"; message: string };

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<ResetResult> {
  const passwordError = checkNewPassword(newPassword);
  if (passwordError) return { ok: false, reason: "password", message: passwordError };
  const invalid: ResetResult = { ok: false, reason: "token", message: MESSAGES.resetLinkExpired };
  const passwordHash = await hashPassword(newPassword);

  // 한 번만 쓰이도록 usedAt 갱신을 조건부 UPDATE 로 먼저 선점한다.
  return db.transaction(async (tx) => {
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
    if (!claimed) return invalid;
    await tx.update(users).set({ passwordHash }).where(eq(users.id, claimed.userId));
    return { ok: true } as const;
  });
}
