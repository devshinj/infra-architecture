import { createHash, randomBytes } from "node:crypto";

import { and, eq, gt, isNull } from "drizzle-orm";

import { db } from "@/db/client";
import { passwordResetTokens, users } from "@/db/schema";
import { env } from "@/env";

import { sendMail } from "./mailer";
import { hashPassword } from "./password";

const TTL_MS = 60 * 60 * 1000;

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
  await sendMail(email, "InfraSketch 비밀번호 재설정", `아래 링크에서 비밀번호를 재설정하세요 (1시간 안에 유효):\n${link}`);
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<{ ok: boolean; message?: string }> {
  if (newPassword.length < 8) return { ok: false, message: "비밀번호는 8자 이상이어야 합니다" };
  const invalid = { ok: false, message: "만료되었거나 이미 사용한 링크입니다" };
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
    return { ok: true };
  });
}
