import { describe, expect, test } from "vitest";

import {
  checkEmail,
  checkNewPassword,
  checkUsername,
  MESSAGES,
  normalizeEmail,
  normalizeUsername,
} from "@/server/auth/rules";

describe("checkUsername", () => {
  test.each(["abc", "jae_01", "a".repeat(32)])("accepts %s", (v) => {
    expect(checkUsername(v)).toBeNull();
  });

  test("empty, too short, too long and symbols are rejected", () => {
    expect(checkUsername("")).toBe(MESSAGES.usernameRequired);
    expect(checkUsername("ab")).toBe(MESSAGES.usernameInvalid);
    expect(checkUsername("a".repeat(33))).toBe(MESSAGES.usernameInvalid);
    expect(checkUsername("bad name")).toBe(MESSAGES.usernameInvalid);
    expect(checkUsername("한글이름")).toBe(MESSAGES.usernameInvalid);
  });

  test("uppercase and surrounding spaces are normalized, not rejected", () => {
    expect(normalizeUsername("  Jae_01 ")).toBe("jae_01");
    expect(checkUsername(" Jae ")).toBeNull();
    expect(checkUsername("   ")).toBe(MESSAGES.usernameRequired);
  });
});

describe("checkEmail", () => {
  test("trims and lowercases before checking", () => {
    expect(normalizeEmail("  A@B.Co ")).toBe("a@b.co");
    expect(checkEmail("  A@B.Co ")).toBeNull();
  });

  test("empty and malformed", () => {
    expect(checkEmail("   ")).toBe(MESSAGES.emailRequired);
    expect(checkEmail("nope")).toBe(MESSAGES.emailInvalid);
    expect(checkEmail("a@b")).toBe(MESSAGES.emailInvalid);
  });
});

describe("checkNewPassword", () => {
  test("8 characters is the minimum", () => {
    expect(checkNewPassword("")).toBe(MESSAGES.passwordRequired);
    expect(checkNewPassword("1234567")).toBe(MESSAGES.passwordShort);
    expect(checkNewPassword("12345678")).toBeNull();
  });

  test("bcrypt's 72-byte limit is enforced in UTF-8 bytes, not characters", () => {
    expect(checkNewPassword("a".repeat(72))).toBeNull();
    expect(checkNewPassword("a".repeat(73))).toBe(MESSAGES.passwordLong);
    expect(checkNewPassword("가".repeat(24))).toBeNull(); // 72 bytes
    expect(checkNewPassword("가".repeat(25))).toBe(MESSAGES.passwordLong); // 75 bytes, 25 chars
  });
});
