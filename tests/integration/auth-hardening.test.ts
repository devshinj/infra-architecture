import bcrypt from "bcryptjs";
import { eq, like } from "drizzle-orm";
import { afterEach, describe, expect, test, vi } from "vitest";

import { db } from "@/db/client";
import { authAttempts, passwordResetTokens, users } from "@/db/schema";
import { createMcpKey, listMcpKeys, verifyMcpKey } from "@/server/mcpKeys";
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

describe("가입 횟수 제한", () => {
  const account = (i: number) => ({ username: `bulk${i}`, password: "password1", email: `bulk${i}@b.co` });

  test("같은 IP 에서 1시간에 계정 5개까지 만들고, 그 뒤는 만들지 않는다(다른 IP 는 그대로)", async () => {
    for (let i = 0; i < LIMITS.signupIp.max; i++) expect((await signup(account(i), { ip: "10.7.7.7" })).ok).toBe(true);
    expect(await signup(account(99), { ip: "10.7.7.7" })).toEqual({ ok: false, field: "form", message: MESSAGES.tooManyAttempts });
    expect(await db.select().from(users).where(eq(users.username, "bulk99"))).toHaveLength(0);
    // 막힌 IP 에는 이미 쓰는 아이디인지도 알려 주지 않는다.
    expect(await signup(account(0), { ip: "10.7.7.7" })).toMatchObject({ ok: false, field: "form" });
    expect((await signup(account(99), { ip: "10.7.7.8" })).ok).toBe(true);
  });

  test("입력 실수·중복은 세지 않는다", async () => {
    expect((await signup(account(0), { ip: "10.7.7.7" })).ok).toBe(true);
    for (let i = 0; i < LIMITS.signupIp.max + 2; i++) {
      expect(await signup(account(0), { ip: "10.7.7.7" })).toMatchObject({ ok: false, field: "username" });
      expect(await signup({ ...account(50), password: "short" }, { ip: "10.7.7.7" })).toMatchObject({ ok: false, field: "password" });
    }
    expect(await db.select().from(authAttempts).where(eq(authAttempts.key, "signup:ip:10.7.7.7"))).toHaveLength(1);
  });

  test("IP 를 모르면(unknown) 세지 않는다", async () => {
    for (let i = 0; i < LIMITS.signupIp.max + 1; i++) expect((await signup(account(i), { ip: "unknown" })).ok).toBe(true);
    expect(await db.select().from(authAttempts)).toHaveLength(0);
  });

  test("한꺼번에 몰려도 한도보다 많이 만들지 않는다", async () => {
    const results = await Promise.all(Array.from({ length: LIMITS.signupIp.max + 5 }, (_, i) => signup(account(i), { ip: "10.7.7.7" })));
    // 서로 자리를 잡고 있는 동안에는 한도 안의 요청도 막힐 수 있다 — 넘치지만 않으면 된다.
    const made = results.filter((r) => r.ok).length;
    expect(made).toBeLessThanOrEqual(LIMITS.signupIp.max);
    expect(await db.select().from(users).where(like(users.username, "bulk%"))).toHaveLength(made);
    // 만들지 못한 요청의 자리는 돌려준다 — 남은 기록은 만든 계정 수와 같고, 남은 한도만큼은 이어서 만들 수 있다.
    expect(await db.select().from(authAttempts).where(eq(authAttempts.key, "signup:ip:10.7.7.7"))).toHaveLength(made);
    for (let i = made; i < LIMITS.signupIp.max; i++) expect((await signup(account(100 + i), { ip: "10.7.7.7" })).ok).toBe(true);
    expect(await signup(account(200), { ip: "10.7.7.7" })).toMatchObject({ ok: false, field: "form" });
  });
});

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

  test("한꺼번에 틀려도 비밀번호 확인까지 가는 수는 한도를 넘지 않는다", async () => {
    await makeUser();
    const results = await Promise.all(
      Array.from({ length: LIMITS.loginUser.max * 3 }, (_, i) => attemptLogin("jae", "wrong", `10.0.2.${i}`)),
    );
    const checked = results.filter((r) => !r.ok && r.reason === "credentials").length;
    expect(checked).toBeLessThanOrEqual(LIMITS.loginUser.max);
    // 막힌 시도는 기록을 남기지 않는다.
    expect(await db.select().from(authAttempts).where(eq(authAttempts.key, "login:user:jae"))).toHaveLength(checked);
    expect(await db.select().from(authAttempts).where(like(authAttempts.key, "login:ip:%"))).toHaveLength(checked);
  }, 30_000);

  test("IP 를 모르는(unknown) 로그인은 IP 한도를 세지 않는다 — 한 통에 묶여 모두가 막히지 않게", async () => {
    await makeUser();
    for (let i = 0; i < LIMITS.loginIp.max + 1; i++) await attemptLogin(`nobody${i}`, "wrong", "unknown");
    expect(await db.select().from(authAttempts).where(eq(authAttempts.key, "login:ip:unknown"))).toHaveLength(0);
    expect((await attemptLogin("jae", "password1", "unknown")).ok).toBe(true);
  });

  test("성공한 로그인은 IP 기록도 남기지 않는다", async () => {
    await makeUser();
    expect((await attemptLogin("jae", "password1", "10.0.3.1")).ok).toBe(true);
    expect(await db.select().from(authAttempts)).toHaveLength(0);
  });

  test("clientIp: 설정이 없으면 x-forwarded-for 첫 값, 없으면 x-real-ip, 그것도 없으면 unknown", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" }), null)).toBe("1.2.3.4");
    expect(clientIp(new Headers({ "x-real-ip": "5.6.7.8" }), null)).toBe("5.6.7.8");
    expect(clientIp(new Headers(), null)).toBe("unknown");
  });

  test("clientIp: 믿는 프록시 수를 주면 오른쪽에서 센다(왼쪽 값은 요청한 쪽이 꾸밀 수 있다)", () => {
    const forged = new Headers({ "x-forwarded-for": "9.9.9.9, 1.2.3.4, 10.0.0.1" });
    expect(clientIp(forged, 1)).toBe("10.0.0.1");
    expect(clientIp(forged, 2)).toBe("1.2.3.4");
    // 값이 프록시 수보다 적으면 맨 왼쪽.
    expect(clientIp(new Headers({ "x-forwarded-for": "1.2.3.4" }), 2)).toBe("1.2.3.4");
    expect(clientIp(new Headers({ "x-real-ip": "5.6.7.8" }), 1)).toBe("5.6.7.8");
    expect(clientIp(new Headers(), 1)).toBe("unknown");
  });

  test("clientIp: 프록시가 없다고(0) 하면 헤더를 믿지 않는다", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "1.2.3.4", "x-real-ip": "5.6.7.8" }), 0)).toBe("unknown");
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

  test("한꺼번에 몰려도 한도보다 많이 받아 주지 않는다", async () => {
    await makeUser();
    vi.spyOn(console, "info").mockImplementation(() => {});
    const results = await Promise.all(Array.from({ length: LIMITS.resetEmail.max * 3 }, () => requestPasswordReset("a@b.co")));
    const accepted = results.filter((r) => r === "ok").length;
    expect(accepted).toBeLessThanOrEqual(LIMITS.resetEmail.max);
    expect(await db.select().from(passwordResetTokens)).toHaveLength(accepted);
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

  test("쓸 수 없는 링크면 비밀번호를 해시하지 않는다(로그인 없이 CPU 를 묶지 못하게)", async () => {
    await makeUser();
    const token = await resetToken();
    expect((await resetPassword(token, "newpass12")).ok).toBe(true);
    const hash = vi.spyOn(bcrypt, "hash");
    expect(await resetPassword(token, "again1234")).toMatchObject({ ok: false, reason: "token" });
    expect(await resetPassword("nope", "again1234")).toMatchObject({ ok: false, reason: "token" });
    expect(hash).not.toHaveBeenCalled();
  });

  test("그 계정의 MCP 키를 모두 지우고 몇 개 지웠는지 알려 준다(다른 계정 키는 그대로)", async () => {
    const userId = await makeUser();
    const otherId = await makeUser("other", "c@d.co");
    const mine = await createMcpKey(userId, "노트북");
    await createMcpKey(userId, "데스크톱");
    const theirs = await createMcpKey(otherId, "남의 것");

    expect(await resetPassword(await resetToken(), "newpass12")).toEqual({ ok: true, revokedKeys: 2 });
    expect(await listMcpKeys(userId)).toHaveLength(0);
    expect(await verifyMcpKey(mine.key)).toBeNull();
    expect(await verifyMcpKey(theirs.key)).toBe(otherId);
  });

  test("키가 없던 계정은 지운 수가 0", async () => {
    await makeUser();
    expect(await resetPassword(await resetToken(), "newpass12")).toEqual({ ok: true, revokedKeys: 0 });
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
