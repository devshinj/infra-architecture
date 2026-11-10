// /api/mcp 는 로그인 세션 대신 라우트가 직접 키(Authorization: Bearer)를 확인한다.
const PUBLIC = [/^\/login$/, /^\/signup$/, /^\/reset(\/.*)?$/, /^\/api\/auth(\/.*)?$/, /^\/api\/mcp$/];

export function isPublicPath(pathname: string): boolean {
  return PUBLIC.some((re) => re.test(pathname));
}

export type AuthDecision = "next" | "unauthorized" | "redirect-login";

/** 미로그인 요청 처리: API 는 401 JSON, 화면은 /login 으로 보낸다. */
export function authDecision(pathname: string, authed: boolean): AuthDecision {
  if (authed || isPublicPath(pathname)) return "next";
  return pathname.startsWith("/api/") ? "unauthorized" : "redirect-login";
}
