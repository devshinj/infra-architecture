import path from "node:path";

import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { afterAll, beforeAll, beforeEach } from "vitest";

import { ensureTestDatabase, testDatabaseUrl } from "../test-db";

// 이 폴더(worktree) 전용 테스트 DB. 서버는 DATABASE_URL_TEST(없으면 docker-compose.yml 의 db_test)이고 이름은 폴더마다 다르다.
// 이름이 _test 로 끝나지 않으면 testDatabaseUrl 이 거절한다.
const url = testDatabaseUrl();

// src/db/client.ts 가 처음 쓰일 때 이 주소를 읽는다.
process.env.DATABASE_URL = url;

const admin = postgres(url, { max: 1 });

beforeAll(async () => {
  await ensureTestDatabase(url);
  await migrate(drizzle(admin), {
    migrationsFolder: path.resolve(process.cwd(), "src/db/migrations"),
  });
});

beforeEach(async () => {
  await drizzle(admin).execute(sql`TRUNCATE users, auth_attempts CASCADE`);
});

afterAll(async () => {
  await admin.end();
});
