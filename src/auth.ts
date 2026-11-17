import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { authConfig } from "./auth.config";
import { attemptLogin, currentSessionVersion } from "./server/auth/password";
import { clientIp } from "./server/auth/rateLimit";
import { keepIfCurrent } from "./server/auth/session";

/** 로그인 횟수 제한에 걸렸다. loginAction 이 code 를 보고 "잠시 후에" 문구를 고른다. */
export class LoginRateLimited extends CredentialsSignin {
  code = "rate_limited";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    /**
     * 서버(Node)에서 로그인을 확인할 때마다 계정의 세션 번호와 맞춰 본다. 비밀번호를 재설정해 번호가 오르면
     * 그 전에 열린 로그인은 null(로그아웃)이 된다. 미들웨어(Edge)는 auth.config 의 jwt 만 써서 DB 를 보지 않는다 —
     * 그래서 끊긴 로그인도 미들웨어는 통과하고, 화면·API 의 auth() 가 막는다.
     */
    async jwt(params) {
      const token = await authConfig.callbacks.jwt(params);
      if (params.user) return token; // 막 로그인했다.
      return keepIfCurrent(token, currentSessionVersion);
    },
  },
  providers: [
    Credentials({
      credentials: { username: {}, password: {} },
      async authorize(credentials, request) {
        const username = String(credentials?.username ?? "");
        const password = String(credentials?.password ?? "");
        if (!username || !password) return null;
        const result = await attemptLogin(username, password, clientIp(request.headers));
        if (!result.ok) {
          if (result.reason === "rate_limited") throw new LoginRateLimited();
          return null;
        }
        const { user } = result;
        return { id: user.id, name: user.username, sessionVersion: user.sessionVersion };
      },
    }),
  ],
});
