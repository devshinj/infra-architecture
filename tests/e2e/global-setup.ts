import path from "node:path";

import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

export const E2E_DB_URL = process.env.DATABASE_URL_TEST || "postgres://postgres:postgres@localhost:5433/infrasketch_test";

export default async function globalSetup() {
  if (!/_test(\?|$)/.test(E2E_DB_URL)) {
    throw new Error(`E2E 는 이름이 _test 로 끝나는 DB 에서만 돈다: ${E2E_DB_URL}`);
  }
  const admin = postgres(E2E_DB_URL, { max: 1, onnotice: () => {} });
  try {
    const db = drizzle(admin);
    await migrate(db, { migrationsFolder: path.resolve(process.cwd(), "src/db/migrations") });
    await db.execute(sql`TRUNCATE users CASCADE`);
  } finally {
    await admin.end();
  }
}
