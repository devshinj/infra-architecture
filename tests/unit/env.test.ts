import { expect, test } from "vitest";

import { parseEnv } from "@/env";

test("requires DATABASE_URL and AUTH_SECRET", () => {
  expect(() => parseEnv({ AUTH_SECRET: "x" })).toThrow(/DATABASE_URL/);
});

test("SMTP is optional and port is numeric", () => {
  const e = parseEnv({ DATABASE_URL: "postgres://a", AUTH_SECRET: "x", SMTP_PORT: "587" });
  expect(e.SMTP_PORT).toBe(587);
  expect(e.SMTP_HOST).toBeUndefined();
  expect(e.APP_URL).toBe("http://localhost:3000");
});

test("empty-string optional values are treated as absent", () => {
  const e = parseEnv({ DATABASE_URL: "postgres://a", AUTH_SECRET: "x", SMTP_PORT: "", SMTP_HOST: "" });
  expect(e.SMTP_PORT).toBeUndefined();
  expect(e.SMTP_HOST).toBeUndefined();
});

test("empty-string required value fails", () => {
  expect(() => parseEnv({ DATABASE_URL: "", AUTH_SECRET: "x" })).toThrow(/DATABASE_URL/);
});
