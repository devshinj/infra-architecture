import type { NextConfig } from "next";

/**
 * 모든 응답에 붙이는 헤더.
 *  - 다른 사이트가 이 화면을 틀(iframe) 안에 넣지 못하게 한다(클릭 가로채기). 옛 브라우저용 X-Frame-Options 와 함께 둔다.
 *  - 내용 종류를 추측하지 않게 하고(nosniff), 다른 사이트로 나갈 때 경로를 넘기지 않는다(구성도 주소에 id 가 들어 있다).
 * 스크립트·스타일을 막는 CSP 와 HSTS 는 여기 없다 — CSP 는 깨지는 곳을 먼저 조사해야 하고, HTTPS 는 앞단 프록시가 맡는다.
 */
const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  // `next dev` 는 .next-dev, 빌드는 .next, E2E 는 NEXT_DIST_DIR=.next-e2e 를 쓴다.
  // 그래서 빌드가 돌고 있는 개발 서버의 폴더를 덮어쓰지 않는다. NODE_ENV 는 Next CLI 가 설정을 읽기 전에 정한다(dev → development).
  distDir: process.env.NEXT_DIST_DIR || (process.env.NODE_ENV === "development" ? ".next-dev" : ".next"),
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
