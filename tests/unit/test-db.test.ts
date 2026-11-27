import path from "node:path";

import { expect, test } from "vitest";

import { TEST_DB_FALLBACK, testDatabaseUrl } from "../test-db";

const dbName = (url: string) => new URL(url).pathname.slice(1);

test("폴더마다 다른 테스트 DB 이름을 쓴다", () => {
  const a = testDatabaseUrl(undefined, path.resolve("/work/infra-architecture"));
  const b = testDatabaseUrl(undefined, path.resolve("/work/infra-hardening"));
  const c = testDatabaseUrl(undefined, path.resolve("/other/infra-hardening"));
  expect(dbName(a)).toMatch(/^infrasketch_infra_architecture_[0-9a-f]{6}_test$/);
  expect(dbName(b)).toMatch(/^infrasketch_infra_hardening_[0-9a-f]{6}_test$/);
  // 이름이 같은 폴더라도 경로가 다르면 다르다.
  expect(new Set([a, b, c]).size).toBe(3);
  // 같은 폴더면 늘 같다.
  expect(testDatabaseUrl(undefined, path.resolve("/work/infra-hardening"))).toBe(b);
});

test("서버·계정은 DATABASE_URL_TEST 를 따르고, 없으면 5433 의 개발용 테스트 DB 서버", () => {
  const fallback = new URL(testDatabaseUrl(undefined, "/w/x"));
  expect(fallback.host).toBe(new URL(TEST_DB_FALLBACK).host);
  const ci = new URL(testDatabaseUrl("postgres://ci:pw@db.internal:5432/sketch_test?sslmode=disable", "/w/x"));
  expect(ci.host).toBe("db.internal:5432");
  expect(ci.username).toBe("ci");
  expect(ci.search).toBe("?sslmode=disable");
  expect(dbName(ci.toString())).toMatch(/^sketch_x_[0-9a-f]{6}_test$/);
});

test("이름이 _test 로 끝나지 않는 DB 는 거절한다(개발·운영 DB 를 지우지 않게)", () => {
  expect(() => testDatabaseUrl("postgres://u:p@localhost:5432/infrasketch", "/w/x")).toThrow(/_test/);
});

test("Postgres 이름 한도(63자) 안에 들고 쓸 수 있는 글자만 쓴다", () => {
  const url = testDatabaseUrl(undefined, path.resolve("/w/아주-긴-폴더 이름 Feature.Branch-with-many-words-2026"));
  const name = dbName(url);
  expect(name.length).toBeLessThanOrEqual(63);
  expect(name).toMatch(/^[a-z0-9_]+_test$/);
});
