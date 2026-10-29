import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { users } from "@/db/schema";

import { hashPassword } from "./password";

export type SignupInput = { username: string; password: string; email: string };
export type SignupResult =
  | { ok: true; userId: string }
  | { ok: false; field: "username" | "email" | "password"; message: string };

const USERNAME = /^[a-z0-9_]{3,32}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function signup(input: SignupInput): Promise<SignupResult> {
  const { username, password } = input;
  const email = input.email.trim().toLowerCase();

  if (!USERNAME.test(username)) {
    return {
      ok: false,
      field: "username",
      message: "아이디는 영문 소문자·숫자·밑줄 3~32자로 입력해 주세요",
    };
  }
  if (!EMAIL.test(email)) {
    return { ok: false, field: "email", message: "이메일 형식이 올바르지 않습니다" };
  }
  if (password.length < 8) {
    return { ok: false, field: "password", message: "비밀번호는 8자 이상이어야 합니다" };
  }

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
