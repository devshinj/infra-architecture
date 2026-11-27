import { afterEach, describe, expect, test, vi } from "vitest";

import { isResetTokenUsable, requestPasswordReset, resetPassword } from "@/server/auth/reset";
import { signup } from "@/server/auth/signup";
import { verifyCredentials } from "@/server/auth/password";
import { MESSAGES } from "@/server/auth/rules";

afterEach(() => vi.restoreAllMocks());

describe("auth", () => {
  test("signup then verify", async () => {
    const r = await signup({ username: "jae", password: "password1", email: "a@b.co" });
    expect(r.ok).toBe(true);
    expect(await verifyCredentials("jae", "password1")).toMatchObject({ username: "jae" });
    expect(await verifyCredentials("jae", "wrong")).toBeNull();
  });

  test("duplicate username is a field error", async () => {
    await signup({ username: "jae", password: "password1", email: "a@b.co" });
    expect(
      await signup({ username: "jae", password: "password1", email: "c@d.co" }),
    ).toMatchObject({ ok: false, field: "username", message: MESSAGES.usernameTaken });
  });

  test("duplicate email and invalid input are field errors", async () => {
    await signup({ username: "jae", password: "password1", email: "a@b.co" });
    expect(
      await signup({ username: "other", password: "password1", email: "a@b.co" }),
    ).toMatchObject({ ok: false, field: "email" });
    expect(
      await signup({ username: "Bad Name", password: "password1", email: "x@y.co" }),
    ).toMatchObject({ ok: false, field: "username" });
    expect(
      await signup({ username: "okname", password: "short", email: "x@y.co" }),
    ).toMatchObject({ ok: false, field: "password" });
    expect(
      await signup({ username: "okname", password: "password1", email: "nope" }),
    ).toMatchObject({ ok: false, field: "email" });
  });

  test("reset token: single use, logged when no SMTP", async () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    await signup({ username: "jae", password: "password1", email: "a@b.co" });
    await requestPasswordReset("a@b.co");
    const token = String(spy.mock.calls[0][1]).split("/reset/")[1];
    expect(await isResetTokenUsable(token)).toBe(true);
    expect(await resetPassword(token, "short")).toMatchObject({ ok: false, reason: "password" });
    expect((await resetPassword(token, "newpass12")).ok).toBe(true);
    expect(await isResetTokenUsable(token)).toBe(false);
    expect(await resetPassword(token, "again1234")).toMatchObject({ ok: false, reason: "token" });
    expect(await verifyCredentials("jae", "newpass12")).not.toBeNull();
  });

  test("운영에서 SMTP 가 없으면 링크를 로그에 찍지 않는다(RESET_LINK_LOG 로 켠 때만)", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    await signup({ username: "jae", password: "password1", email: "a@b.co" });
    vi.stubEnv("NODE_ENV", "production");
    try {
      await requestPasswordReset("a@b.co");
      expect(info).not.toHaveBeenCalled();
      expect(error).toHaveBeenCalledTimes(1);
      expect(JSON.stringify(error.mock.calls)).not.toContain("/reset/");
      expect(JSON.stringify(error.mock.calls)).toContain("RESET_LINK_LOG");
    } finally {
      vi.unstubAllEnvs();
    }
  });

  test("unknown email does not throw and sends nothing", async () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    await requestPasswordReset("nobody@x.co");
    expect(spy).not.toHaveBeenCalled();
  });

  test("unknown token and too-short new password are rejected", async () => {
    expect((await resetPassword("nope", "newpass12")).ok).toBe(false);
    expect(await isResetTokenUsable("nope")).toBe(false);
  });
});

describe("reset link log opt-in", () => {
  test("RESET_LINK_LOG 를 켜면 운영에서도 링크를 찍는다", async () => {
    vi.resetModules();
    vi.doMock("@/env", async (orig) => ({ env: { ...(await orig<typeof import("@/env")>()).env, RESET_LINK_LOG: true } }));
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const { signup: su } = await import("@/server/auth/signup");
    const { requestPasswordReset: req } = await import("@/server/auth/reset");
    await su({ username: "jae", password: "password1", email: "a@b.co" });
    vi.stubEnv("NODE_ENV", "production");
    try {
      await req("a@b.co");
      expect(String(info.mock.calls[0][1])).toContain("/reset/");
    } finally {
      vi.unstubAllEnvs();
      vi.doUnmock("@/env");
    }
  });
});

describe("reset mail failure", () => {
  test("a failing mailer does not leak through requestPasswordReset", async () => {
    vi.resetModules();
    vi.doMock("@/env", async (orig) => ({ env: { ...(await orig<typeof import("@/env")>()).env, SMTP_HOST: "smtp.invalid" } }));
    vi.doMock("@/server/auth/mailer", () => ({ sendMail: vi.fn().mockRejectedValue(new Error("smtp down")) }));
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { signup: su } = await import("@/server/auth/signup");
    const { requestPasswordReset: req } = await import("@/server/auth/reset");
    await su({ username: "jae", password: "password1", email: "a@b.co" });
    await expect(req("a@b.co")).resolves.toBe("ok");
    expect(errSpy).toHaveBeenCalled();
    expect(JSON.stringify(errSpy.mock.calls)).not.toContain("/reset/");
    vi.doUnmock("@/env");
    vi.doUnmock("@/server/auth/mailer");
  });
});
