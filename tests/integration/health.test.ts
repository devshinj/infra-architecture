import { expect, test } from "vitest";

import { checkHealth, pingDb } from "@/server/health";

test("테스트 DB 에 닿으면 ok", async () => {
  expect(await checkHealth(pingDb)).toEqual({ status: "ok" });
});
