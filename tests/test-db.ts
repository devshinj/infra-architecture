import { createHash } from "node:crypto";
import path from "node:path";

import postgres from "postgres";

/**
 * 통합·E2E 테스트 DB. worktree(폴더)마다 이름을 따로 써서, 한쪽 실행의 TRUNCATE 가 다른 쪽 데이터를 지우지 않게 한다.
 * 서버는 DATABASE_URL_TEST(없으면 docker-compose.yml 의 db_test, 5433)이고, DB 이름 끝 `_test` 앞에 폴더 이름과 경로 해시를 붙인다.
 *   infrasketch_test → infrasketch_infra_hardening_3fa2c1_test
 */
export const TEST_DB_FALLBACK = "postgres://postgres:postgres@localhost:5433/infrasketch_test";

/** Postgres 이름 한도(63바이트) 안에 들도록 폴더 이름을 줄인다. */
const SLUG_MAX = 24;

export function testDatabaseUrl(base: string | undefined = process.env.DATABASE_URL_TEST, cwd: string = process.cwd()): string {
  const url = new URL(base || TEST_DB_FALLBACK);
  const name = decodeURIComponent(url.pathname.replace(/^\//, ""));
  if (!/_test$/.test(name)) {
    throw new Error(`테스트는 이름이 _test 로 끝나는 DB 에서만 돈다: ${name || "(이름 없음)"}`);
  }
  const dir = path.resolve(cwd);
  const slug = path.basename(dir).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, SLUG_MAX) || "dir";
  const hash = createHash("sha1").update(dir.toLowerCase()).digest("hex").slice(0, 6);
  url.pathname = `/${name.replace(/_test$/, `_${slug}_${hash}_test`)}`;
  return url.toString();
}

/** 테스트 DB 가 없으면 만든다(같은 서버의 postgres DB 로 붙어서). 이미 있으면 그대로 둔다. */
export async function ensureTestDatabase(url: string): Promise<void> {
  const target = new URL(url);
  const name = decodeURIComponent(target.pathname.replace(/^\//, ""));
  if (!/^[a-z0-9_]+_test$/.test(name)) throw new Error(`만들 수 없는 테스트 DB 이름: ${name}`);
  const server = new URL(url);
  server.pathname = "/postgres";
  const admin = postgres(server.toString(), { max: 1, onnotice: () => {} });
  try {
    const found = await admin`select 1 from pg_database where datname = ${name}`;
    if (found.length > 0) return;
    try {
      await admin.unsafe(`create database "${name}"`);
    } catch (err) {
      // 다른 실행이 같은 순간에 만들었으면 괜찮다(42P04 duplicate_database).
      if ((err as { code?: string }).code !== "42P04") throw err;
    }
  } finally {
    await admin.end();
  }
}
