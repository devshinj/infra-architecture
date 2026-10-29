import path from "node:path";

import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { afterAll, beforeAll, beforeEach } from "vitest";

// docker-compose.yml 의 db_test 와 같은 주소. DATABASE_URL_TEST 가 없으면 이것을 쓴다.
const FALLBACK = "postgres://postgres:postgres@localhost:5433/infrasketch_test";
const url = process.env.DATABASE_URL_TEST || FALLBACK;

if (!/_test(\?|$)/.test(url)) {
  throw new Error(`통합 테스트는 이름이 _test 로 끝나는 DB 에서만 돈다: ${url}`);
}

// src/db/client.ts 가 처음 쓰일 때 이 주소를 읽는다.
process.env.DATABASE_URL = url;

const admin = postgres(url, { max: 1 });

beforeAll(async () => {
  await migrate(drizzle(admin), {
    migrationsFolder: path.resolve(process.cwd(), "src/db/migrations"),
  });
});

beforeEach(async () => {
  await drizzle(admin).execute(sql`TRUNCATE users CASCADE`);
});

afterAll(async () => {
  await admin.end();
});
