// E2E 서버를 켜기 전에 돈다(playwright.config.ts 의 webServer.command).
// Playwright 는 webServer 를 globalSetup 보다 먼저 켜므로, 처음 쓰는 폴더에서도 서버가 없는 DB 에 붙지 않게 여기서 만든다.
import { prepareE2eDb } from "./db";

prepareE2eDb(process.env.DATABASE_URL).then(
  () => process.exit(0),
  (err) => {
    console.error("[e2e] 테스트 DB 를 준비하지 못했다", err);
    process.exit(1);
  },
);
