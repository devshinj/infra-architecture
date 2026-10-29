import { describe, expect, test } from "vitest";

import { readFileSync } from "node:fs";

import { isPublicPath } from "@/middleware-paths";

// Next 는 matcher 를 전체 경로에 앵커된 정규식으로 쓴다.
// middleware.ts 를 직접 import 하면 next-auth 가 따라오므로, 소스의 matcher 리터럴을 그대로 꺼내 쓴다.
const source = readFileSync("src/middleware.ts", "utf8");
const literal = /matcher:\s*\[(".*")\]/.exec(source)![1];
const pattern: string = JSON.parse(literal);
const matcher = new RegExp(`^${pattern}$`);
const protectedPath = (p: string) => matcher.test(p) && !isPublicPath(p);

describe("middleware matcher", () => {
  test.each(["/projects/xpng", "/apitxt", "/signup-foo", "/_nextfoo", "/", "/projects/1"])(
    "%s is protected",
    (p) => expect(protectedPath(p)).toBe(true),
  );
  test.each([
    "/login", "/signup", "/reset", "/reset/abc", "/api/auth/session",
    "/_next/static/x.js", "/favicon.ico", "/logo.png",
  ])("%s is public", (p) => expect(protectedPath(p)).toBe(false));
});
