import { eq } from "drizzle-orm";
import { afterEach, describe, expect, test, vi } from "vitest";

import { db } from "@/db/client";
import { authAttempts, passwordResetTokens, users } from "@/db/schema";
import { attemptLogin, currentSessionVersion } from "@/server/auth/password";
import { clientIp, LIMITS } from "@/server/auth/rateLimit";
import { isResetTokenUsable, requestPasswordReset, resetPassword } from "@/server/auth/reset";
import { MESSAGES } from "@/server/auth/rules";
import { signup } from "@/server/auth/signup";

afterEach(() => vi.restoreAllMocks());

async function makeUser(username = "jae", email = "a@b.co") {
  const r = await signup({ username, password: "password1", email });
  if (!r.ok) throw new Error("signup failed");
  return r.userId;
}

/** 재설정 링크를 받아 토큰만 꺼낸다(SMTP 가 없으면 링크를 console.info 로 남긴다). */
async function resetToken(email = "a@b.co"): Promise<string> {
  const spy = vi.spyOn(console, "info").mockImplementation(() => {});
  expect(await requestPasswordReset(email)).toBe("ok");
  const link = String(spy.mock.calls.at(-1)?.[1]);
  spy.mockRestore();
  return link.split("/reset/")[1];
}

describe("로그인 횟수 제한", () => {
  test("같은 아이디로 10번 틀리면 맞는 비밀번호도 막고, 막힌 시도는 세지 않는다", async () => {
    await makeUser();
    for (let i = 0; i < LIMITS.loginUser.max; i++) {
      expect(await attemptLogin("jae", "wrong", `10.0.0.${i}`)).toEqual({ ok: false, reason: "credentials" });
    }
    expect(await attemptLogin("jae", "password1", "10.0.1.1")).toEqual({ ok: false, reason: "rate_limited" });
    expect(await attemptLogin(" JAE ", "password1", "10.0.1.1")).toEqual({ ok: false, reason: "rate_limited" });
    const rows = await db.select().from(authAttempts).where(eq(authAttempts.key, "login:user:jae"));
    expect(rows).toHaveLength(LIMITS.loginUser.max);
  });

  test("성공하면 그 아이디의 실패 기록만 지운다", async () => {
    await makeUser();
    await attemptLogin("jae", "wrong", "10.0.0.1");
    await attemptLogin("jae", "wrong", "10.0.0.1");
    expect((await attemptLogin("jae", "password1", "10.0.0.1")).ok).toBe(true);
    expect(await db.select().from(authAttempts).where(eq(authAttempts.key, "login:user:jae"))).toHaveLength(0);
    expect(await db.select().from(authAttempts).where(eq(authAttempts.key, "login:ip:10.0.0.1"))).toHaveLength(2);
  });

  test("같은 IP 에서 여러 아이디로 30번 틀리면 그 IP 를 막는다", async () => {
    await makeUser();
    for (let i = 0; i < LIMITS.loginIp.max; i++) await attemptLogin(`nobody${i}`, "wrong", "10.9.9.9");
    expect(await attemptLogin("jae", "password1", "10.9.9.9")).toEqual({ ok: false, reason: "rate_limited" });
    expect((await attemptLogin("jae", "password1", "10.9.9.8")).ok).toBe(true);
  });

  test("창이 지난 실패는 세지 않는다", async () => {
    await makeUser();
    const old = new Date(Date.now() - LIMITS.loginUser.windowMs - 1000);
    await db.insert(authAttempts).values(Array.from({ length: LIMITS.loginUser.max }, () => ({ key: "login:user:jae", at: old })));
    expect((await attemptLogin("jae", "password1", "10.0.0.1")).ok).toBe(true);
  });

  test("clientIp 는 x-forwarded-for 첫 값, 없으면 x-real-ip, 그것도 없으면 unknown", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" }))).toBe("1.2.3.4");
    expect(clientIp(new Headers({ "x-real-ip": "5.6.7.8" }))).toBe("5.6.7.8");
    expect(clientIp(new Headers())).toBe("unknown");
  });
});

describe("재설정 요청", () => {
  test("같은 주소는 1시간에 3번까지 — 없는 주소도 똑같이 센다", async () => {
    await makeUser();
    vi.spyOn(console, "info").mockImplementation(() => {});
    for (const email of ["a@b.co", "nobody@x.co"]) {
      for (let i = 0; i < LIMITS.resetEmail.max; i++) expect(await requestPasswordReset(email)).toBe("ok");
      expect(await requestPasswordReset(` ${email.toUpperCase()} `)).toBe("limited");
    }
  });

  test("defer 를 주면 메일 발송은 그 함수에 맡기고 바로 돌아온다", async () => {
    await makeUser();
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    const tasks: Array<() => Promise<void>> = [];
    expect(await requestPasswordReset("a@b.co", (t) => tasks.push(t))).toBe("ok");
    expect(spy).not.toHaveBeenCalled();
    expect(tasks).toHaveLength(1);
    await tasks[0]();
    expect(String(spy.mock.calls[0][1])).toContain("/reset/");
  });

  test("없는 주소는 defer 도 부르지 않는다", async () => {
    const tasks: unknown[] = [];
    expect(await requestPasswordReset("nobody@x.co", (t) => tasks.push(t))).toBe("ok");
    expect(tasks).toHaveLength(0);
  });
});

describe("비밀번호 재설정 뒤", () => {
  test("세션 번호가 오르고, 남은 다른 링크는 못 쓰고, 로그인 실패 기록이 지워진다", async () => {
    const userId = await makeUser();
    expect(await currentSessionVersion(userId)).toBe(0);
    const first = await resetToken();
    const second = await resetToken();
    for (let i = 0; i < LIMITS.loginUser.max; i++) await attemptLogin("jae", "wrong", "10.0.0.1");

    expect((await resetPassword(second, "newpass12")).ok).toBe(true);
    expect(await currentSessionVersion(userId)).toBe(1);
    expect(await isResetTokenUsable(first)).toBe(false);
    expect(await resetPassword(first, "other1234")).toMatchObject({ ok: false, reason: "token" });
    expect((await attemptLogin("jae", "newpass12", "10.0.0.2")).ok).toBe(true);
    const rows = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
    expect(rows.every((r) => r.usedAt !== null)).toBe(true);
  });

  test("지워진 계정의 세션 번호는 null", async () => {
    const userId = await makeUser();
    await db.delete(users).where(eq(users.id, userId));
    expect(await currentSessionVersion(userId)).toBeNull();
  });
});

describe("가입 이메일 중복", () => {
  test("이미 쓰이는 이메일이라고 말하지 않는다", async () => {
    await makeUser();
    const r = await signup({ username: "other", password: "password1", email: "a@b.co" });
    expect(r).toMatchObject({ ok: false, field: "email", message: MESSAGES.emailTaken });
    expect(MESSAGES.emailTaken).not.toMatch(/이미 (가입|쓰)/);
  });
});
