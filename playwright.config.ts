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
      NEXT_DIST_DIR: ".next-e2e", // never overwrite the .next a running `next dev` uses
      DATABASE_URL: DB_URL,
      AUTH_SECRET: "e2e-only-secret-not-for-production",
      APP_URL: `http://localhost:${PORT}`,
      // 앞단 프록시가 없다. 이 값이 없으면 Next 가 붙이는 x-forwarded-for(::1)로 모든 가입이 한 IP 로 세어져,
      // 여섯 번째 가입부터 "같은 IP 1시간 5개" 제한에 걸린다.
      TRUSTED_PROXY_HOPS: "0",
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
