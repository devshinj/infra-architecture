import { beforeEach, expect, test, vi } from "vitest";

const requestPasswordReset = vi.hoisted(() => vi.fn(async () => {}));
vi.mock("@/server/auth/reset", () => ({ requestPasswordReset, resetPassword: vi.fn() }));
vi.mock("@/server/auth/signup", () => ({ signup: vi.fn() }));
vi.mock("@/auth", () => ({ signIn: vi.fn() }));
vi.mock("next-auth", () => ({ AuthError: class AuthError extends Error {} }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

import { requestResetAction } from "@/server/auth/actions";
import { MESSAGES } from "@/server/auth/rules";

const form = (email: string) => {
  const data = new FormData();
  data.set("email", email);
  return data;
};

beforeEach(() => requestPasswordReset.mockClear());

test("a malformed email is a field error and nothing is looked up", async () => {
  expect(await requestResetAction({}, form("nope"))).toEqual({ errors: { email: MESSAGES.emailInvalid } });
  expect(requestPasswordReset).not.toHaveBeenCalled();
});

test("a valid email is normalized, requested, and echoed back for the done screen", async () => {
  expect(await requestResetAction({}, form("  A@B.co "))).toEqual({ done: true, email: "a@b.co" });
  expect(requestPasswordReset).toHaveBeenCalledWith("a@b.co");
});
