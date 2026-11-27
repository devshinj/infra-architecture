import { expect, test } from "vitest";

import { MCP_RATE, takeMcpRequest } from "@/server/mcp/rate";

test("창(1분) 안에서 한도까지만 받고, 넘으면 남은 시간을 알려 준다", () => {
  const t0 = 1_000_000;
  for (let i = 0; i < MCP_RATE.max; i++) expect(takeMcpRequest("rate-a", t0 + i)).toEqual({ ok: true });
  expect(takeMcpRequest("rate-a", t0 + 30_000)).toEqual({ ok: false, retryAfterS: 30 });
  // 다른 계정은 따로 센다.
  expect(takeMcpRequest("rate-b", t0 + 30_000)).toEqual({ ok: true });
  // 창이 지나면 다시 받는다.
  expect(takeMcpRequest("rate-a", t0 + MCP_RATE.windowMs)).toEqual({ ok: true });
});
