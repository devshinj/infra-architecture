import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "./auth.config";
import { authDecision } from "./middleware-paths";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const decision = authDecision(req.nextUrl.pathname, !!req.auth);
  if (decision === "next") return NextResponse.next();
  if (decision === "unauthorized") {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
});

export const config = {
  // _next 와 정적 파일(확장자가 있는 경로)은 검사하지 않는다.
  matcher: ["/((?!_next/|favicon\\.ico$|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|txt|woff2?)$).*)"],
};
