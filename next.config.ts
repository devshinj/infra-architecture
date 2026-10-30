import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  // `next dev` 는 .next-dev, 빌드는 .next, E2E 는 NEXT_DIST_DIR=.next-e2e 를 쓴다.
  // 그래서 빌드가 돌고 있는 개발 서버의 폴더를 덮어쓰지 않는다. NODE_ENV 는 Next CLI 가 설정을 읽기 전에 정한다(dev → development).
  distDir: process.env.NEXT_DIST_DIR || (process.env.NODE_ENV === "development" ? ".next-dev" : ".next"),
};

export default nextConfig;
