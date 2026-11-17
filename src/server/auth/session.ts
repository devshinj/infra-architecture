import type { JWT } from "next-auth/jwt";

/**
 * 로그인 토큰이 아직 유효한지: 토큰에 담긴 세션 번호(sv, 없으면 0)가 계정의 지금 번호와 같아야 한다.
 * 계정이 지워졌거나(null) 비밀번호를 재설정해 번호가 올랐으면 null — Auth.js 는 그 로그인을 끊는다.
 */
export async function keepIfCurrent(token: JWT, lookup: (userId: string) => Promise<number | null>): Promise<JWT | null> {
  if (!token.sub) return token;
  const current = await lookup(token.sub);
  return current !== null && current === (token.sv ?? 0) ? token : null;
}
