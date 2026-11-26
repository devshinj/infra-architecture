import { expect, test } from "vitest";

import { parseEnv, productionChecks } from "@/env";

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

test("proxy hops and reset-link log are optional switches", () => {
  const base = { DATABASE_URL: "postgres://a", AUTH_SECRET: "x" };
  expect(parseEnv(base).TRUSTED_PROXY_HOPS).toBeUndefined();
  expect(parseEnv(base).RESET_LINK_LOG).toBe(false);
  expect(parseEnv({ ...base, TRUSTED_PROXY_HOPS: "0" }).TRUSTED_PROXY_HOPS).toBe(0);
  expect(parseEnv({ ...base, TRUSTED_PROXY_HOPS: "2", RESET_LINK_LOG: "1" })).toMatchObject({ TRUSTED_PROXY_HOPS: 2, RESET_LINK_LOG: true });
  expect(parseEnv({ ...base, RESET_LINK_LOG: "true" }).RESET_LINK_LOG).toBe(true);
  expect(parseEnv({ ...base, RESET_LINK_LOG: "0" }).RESET_LINK_LOG).toBe(false);
  expect(() => parseEnv({ ...base, TRUSTED_PROXY_HOPS: "-1" })).toThrow(/TRUSTED_PROXY_HOPS/);
});

const SECRET = "s".repeat(32);

test("production checks: a short secret or a missing APP_URL stops the server", () => {
  const ok = { AUTH_SECRET: SECRET, APP_URL: "https://sketch.example", SMTP_HOST: "smtp.example", TRUSTED_PROXY_HOPS: "1" };
  expect(productionChecks(ok)).toEqual({ errors: [], warnings: [] });

  const short = productionChecks({ ...ok, AUTH_SECRET: "s".repeat(31) });
  expect(short.errors).toHaveLength(1);
  expect(short.errors[0]).toContain("AUTH_SECRET");

  const noUrl = productionChecks({ ...ok, APP_URL: "" });
  expect(noUrl.errors).toHaveLength(1);
  expect(noUrl.errors[0]).toContain("APP_URL");

  expect(productionChecks({}).errors).toHaveLength(2);
});

test("production checks: no mail server or no proxy setting is only a warning", () => {
  const { errors, warnings } = productionChecks({ AUTH_SECRET: SECRET, APP_URL: "https://sketch.example" });
  expect(errors).toEqual([]);
  expect(warnings).toHaveLength(2);
  expect(warnings.join(" ")).toContain("SMTP_HOST");
  expect(warnings.join(" ")).toContain("TRUSTED_PROXY_HOPS");
  // 링크를 로그로 받겠다고 켰으면 메일 서버 경고는 하지 않는다.
  expect(productionChecks({ AUTH_SECRET: SECRET, APP_URL: "https://sketch.example", RESET_LINK_LOG: "1" }).warnings).toHaveLength(1);
});
