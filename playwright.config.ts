import { defineConfig, devices } from "@playwright/test";

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
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
