import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { users } from "@/db/schema";

import { hashPassword } from "./password";
import { checkEmail, checkNewPassword, checkUsername, normalizeEmail, normalizeUsername } from "./rules";

export type SignupInput = { username: string; password: string; email: string };
export type SignupResult =
  | { ok: true; userId: string }
  | { ok: false; field: "username" | "email" | "password"; message: string };

export async function signup(input: SignupInput): Promise<SignupResult> {
  const { password } = input;
  const username = normalizeUsername(input.username);
  const email = normalizeEmail(input.email);

  // 화면이 미리 보여 주는 안내·확인과 같은 규칙(rules.ts)을 쓴다.
  const usernameError = checkUsername(username);
  if (usernameError) return { ok: false, field: "username", message: usernameError };
  const emailError = checkEmail(email);
  if (emailError) return { ok: false, field: "email", message: emailError };
  const passwordError = checkNewPassword(password);
  if (passwordError) return { ok: false, field: "password", message: passwordError };

  const [sameName] = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1);
  if (sameName) return { ok: false, field: "username", message: "이미 쓰는 아이디입니다" };
  const [sameEmail] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (sameEmail) return { ok: false, field: "email", message: "이미 가입된 이메일입니다" };

  const passwordHash = await hashPassword(password);
  try {
    const [row] = await db.insert(users).values({ username, email, passwordHash }).returning({ id: users.id });
    return { ok: true, userId: row.id };
  } catch (e) {
    // 동시 가입으로 unique 제약에 걸린 경우.
    const code = (e as { code?: string; cause?: { code?: string } }).code ?? (e as { cause?: { code?: string } }).cause?.code;
    if (code === "23505") return { ok: false, field: "username", message: "이미 쓰는 아이디입니다" };
    throw e;
  }
}
