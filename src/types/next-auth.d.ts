import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"];
  }
  /** authorize 가 돌려주는 사용자. sessionVersion 은 로그인 토큰에 sv 로 담긴다. */
  interface User {
    sessionVersion?: number;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    /** 로그인할 때의 계정 세션 번호(users.session_version). 이 칸이 없는 옛 토큰은 0 으로 본다. */
    sv?: number;
  }
}
