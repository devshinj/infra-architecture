import { expect, test } from "vitest";

import nextConfig from "../../next.config";

test("모든 경로에 보안 헤더를 붙이고 X-Powered-By 는 뺀다", async () => {
  expect(nextConfig.poweredByHeader).toBe(false);
  const rules = await nextConfig.headers!();
  expect(rules).toHaveLength(1);
  expect(rules[0].source).toBe("/:path*");
  const headers = Object.fromEntries(rules[0].headers.map((h) => [h.key, h.value]));
  expect(headers).toEqual({
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Frame-Options": "DENY",
    "Content-Security-Policy": "frame-ancestors 'none'",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  });
});
