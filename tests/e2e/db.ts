import path from "node:path";

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

import { ensureTestDatabase, testDatabaseUrl } from "../test-db";

/** E2E 가 쓰는 이 폴더 전용 테스트 DB(통합 테스트와 같은 DB, 다른 worktree 와는 다르다). */
export const E2E_DB_URL = testDatabaseUrl();

/** DB 가 없으면 만들고 마이그레이션한다. */
export async function prepareE2eDb(url: string = E2E_DB_URL): Promise<void> {
  await ensureTestDatabase(url);
  const admin = postgres(url, { max: 1, onnotice: () => {} });
  try {
    await migrate(drizzle(admin), { migrationsFolder: path.resolve(process.cwd(), "src/db/migrations") });
  } finally {
    await admin.end();
  }
}
