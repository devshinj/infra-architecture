import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

const PUBLIC = [/^\/login$/, /^\/signup$/, /^\/reset(\/.*)?$/, /^\/api\/auth(\/.*)?$/];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  if (req.auth || PUBLIC.some((re) => re.test(pathname))) return NextResponse.next();
  return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
});

export const config = {
  // _next 와 정적 파일(확장자가 있는 경로)은 검사하지 않는다.
  matcher: ["/((?!_next/|favicon\.ico|.*\.(?:png|jpg|jpeg|gif|svg|webp|ico|txt|woff2?)$).*)"],
};
