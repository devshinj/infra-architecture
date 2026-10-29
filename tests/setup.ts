import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

// src/env.ts evaluates `env = parseEnv(process.env)` at import time.
// Bare environments (fresh clone, CI without .env) need fallbacks so that
// importing the module does not throw; individual tests pass their own raw
// objects to parseEnv and are unaffected by these.
process.env.DATABASE_URL ||= "postgres://test:test@localhost:5432/test";
process.env.AUTH_SECRET ||= "test-secret";
