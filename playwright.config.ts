import { defineConfig, devices } from "@playwright/test";

import { FAKE_CLEF_KEY, FAKE_PORT, FAKE_QWEN_KEY } from "./tests/e2e/fake-config";

const PORT = 3100;
const DB_URL = process.env.DATABASE_URL_TEST || "postgres://postgres:postgres@localhost:5433/infrasketch_test";

export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  use: {
    baseURL: `http://localhost:${PORT}`,
  },
  webServer: {
    command: `npx next build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/login`,
    reuseExistingServer: false,
    timeout: 300_000,
    env: {
      DATABASE_URL: DB_URL,
      AUTH_SECRET: "e2e-only-secret-not-for-production",
      APP_URL: `http://localhost:${PORT}`,
      QWEN_API_URL: `http://127.0.0.1:${FAKE_PORT}/v1`,
      QWEN_CODER_KEY: FAKE_QWEN_KEY,
      CLEF_API_URL: `http://127.0.0.1:${FAKE_PORT}`,
      CLEF_API_KEY: FAKE_CLEF_KEY,
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
