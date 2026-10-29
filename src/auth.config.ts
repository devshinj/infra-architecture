import type { NextAuthConfig } from "next-auth";

// 미들웨어(Edge)에서도 불러오므로 DB·bcrypt 를 가져오지 않는다.
export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  trustHost: true, // 호스트는 배포 환경(프록시)이 정한다. 재설정 링크는 APP_URL 만 쓴다.
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
} satisfies NextAuthConfig;
