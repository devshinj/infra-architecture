import { afterEach, describe, expect, test, vi } from "vitest";

import { requestPasswordReset, resetPassword } from "@/server/auth/reset";
import { signup } from "@/server/auth/signup";
import { verifyCredentials } from "@/server/auth/password";

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
    ).toMatchObject({ ok: false, field: "username", message: "이미 쓰는 아이디입니다" });
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
    expect((await resetPassword(token, "newpass12")).ok).toBe(true);
    expect((await resetPassword(token, "again1234")).ok).toBe(false);
    expect(await verifyCredentials("jae", "newpass12")).not.toBeNull();
  });

  test("unknown email does not throw and sends nothing", async () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    await requestPasswordReset("nobody@x.co");
    expect(spy).not.toHaveBeenCalled();
  });

  test("unknown token and too-short new password are rejected", async () => {
    expect((await resetPassword("nope", "newpass12")).ok).toBe(false);
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
    await expect(req("a@b.co")).resolves.toBeUndefined();
    expect(errSpy).toHaveBeenCalled();
    expect(JSON.stringify(errSpy.mock.calls)).not.toContain("/reset/");
    vi.doUnmock("@/env");
    vi.doUnmock("@/server/auth/mailer");
  });
});
