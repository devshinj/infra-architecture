import { NextResponse } from "next/server";

import { checkHealth, pingDb } from "@/server/health";

// 컨테이너·프록시 헬스체크용. 로그인 없이 열고(middleware-paths 의 PUBLIC), 매번 DB 에 묻는다.
export const dynamic = "force-dynamic";

export async function GET() {
  const health = await checkHealth(pingDb);
  return NextResponse.json(health, {
    status: health.status === "ok" ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
