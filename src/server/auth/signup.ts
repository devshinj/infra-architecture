import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { users } from "@/db/schema";

import { hashPassword } from "./password";
import { attemptKey, claimAttempt, LIMITS, UNKNOWN_IP } from "./rateLimit";
import { checkEmail, checkNewPassword, checkUsername, MESSAGES, normalizeEmail, normalizeUsername } from "./rules";

export type SignupInput = { username: string; password: string; email: string };
export type SignupResult =
  | { ok: true; userId: string }
  | { ok: false; field: "username" | "email" | "password" | "form"; message: string };

/**
 * 계정을 만든다. `ip` 를 주면 그 IP 에서 만든 계정 수를 센다(LIMITS.signupIp): 한도를 넘으면 만들지 않고 `form` 오류로 돌려준다.
 * IP 를 모르는 요청(프록시 헤더 없음 — 로컬 개발·테스트)은 세지 않는다. 한꺼번에 온 요청이 서로 자리를 잡고 있는 동안에는
 * 한도 안의 요청도 잠깐 막힐 수 있다(넘치는 쪽이 아니라 모자란 쪽으로 틀린다).
 */
export async function signup(input: SignupInput, opts: { ip?: string } = {}): Promise<SignupResult> {
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

  // 막힌 IP 에는 아이디·메일이 쓰이는지도 알려 주지 않는다(중복 확인보다 먼저 본다).
  // 자리를 먼저 잡아 두고(한꺼번에 보내도 한도를 못 넘는다), 계정을 만들지 못하면 돌려준다 — 만든 계정만 센다.
  const claim = opts.ip && opts.ip !== UNKNOWN_IP ? await claimAttempt({ key: attemptKey.signupIp(opts.ip), limit: LIMITS.signupIp }) : null;
  if (claim?.limited) return { ok: false, field: "form", message: MESSAGES.tooManyAttempts };

  let result: SignupResult | undefined;
  try {
    result = await createAccount(username, email, password);
    return result;
  } finally {
    if (!result?.ok) await claim?.release();
  }
}

async function createAccount(username: string, email: string, password: string): Promise<SignupResult> {
  const [sameName] = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1);
  if (sameName) return { ok: false, field: "username", message: MESSAGES.usernameTaken };
  const [sameEmail] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (sameEmail) return { ok: false, field: "email", message: MESSAGES.emailTaken };

  const passwordHash = await hashPassword(password);
  try {
    const [row] = await db.insert(users).values({ username, email, passwordHash }).returning({ id: users.id });
    return { ok: true, userId: row.id };
  } catch (e) {
    // 동시 가입으로 unique 제약에 걸린 경우.
    const code = (e as { code?: string; cause?: { code?: string } }).code ?? (e as { cause?: { code?: string } }).cause?.code;
    if (code === "23505") return { ok: false, field: "username", message: MESSAGES.usernameTaken };
    throw e;
  }
}
