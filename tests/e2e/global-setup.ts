import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { E2E_DB_URL, prepareE2eDb } from "./db";
import { startFakeLlm } from "./fake-llm";

export { E2E_DB_URL };

export default async function globalSetup() {
  await prepareE2eDb(E2E_DB_URL);
  const admin = postgres(E2E_DB_URL, { max: 1, onnotice: () => {} });
  try {
    await drizzle(admin).execute(sql`TRUNCATE users, auth_attempts CASCADE`);
  } finally {
    await admin.end();
  }
  const fake = await startFakeLlm();
  return async () => {
    await new Promise<void>((resolve) => {
      fake.closeAllConnections();
      fake.close(() => resolve());
    });
  };
}
