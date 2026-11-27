/**
 * 서버를 켤 때 한 번 돈다. 운영 설정이 위험하면(짧은 AUTH_SECRET, 빠진 APP_URL) 이유를 적고 켜지 않는다.
 * 빌드 중(`next build`)과 Edge(미들웨어)에서는 하지 않는다.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NODE_ENV !== "production" || process.env.NEXT_PHASE === "phase-production-build") return;
  const { checkProductionEnv } = await import("./instrumentation-node");
  checkProductionEnv();
}
