import { productionChecks } from "./env";

/** Node 에서만 부른다(process.exit 을 쓴다). src/env 를 불러오면서 필수 값(DATABASE_URL 등)도 함께 검사된다. */
export function checkProductionEnv(): void {
  const { errors, warnings } = productionChecks(process.env);
  for (const w of warnings) console.warn(`[env] ${w}`);
  if (errors.length === 0) return;
  for (const e of errors) console.error(`[env] ${e}`);
  console.error("[env] 운영 설정이 맞지 않아 서버를 켜지 않습니다.");
  process.exit(1);
}
