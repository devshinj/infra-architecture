import { afterEach, expect, test, vi } from "vitest";

import { HEALTH_TIMEOUT_MS, checkHealth } from "@/server/health";

afterEach(() => vi.useRealTimers());

test("DB 가 답하면 ok", async () => {
  expect(await checkHealth(async () => {})).toEqual({ status: "ok" });
});

test("DB 가 오류를 내면 down — 오류 내용은 내보내지 않는다", async () => {
  const error = vi.spyOn(console, "error").mockImplementation(() => {});
  const result = await checkHealth(async () => {
    throw new Error("password authentication failed for user secret-user");
  });
  expect(result).toEqual({ status: "down" });
  expect(JSON.stringify(result)).not.toContain("secret-user");
  expect(error).toHaveBeenCalled();
  error.mockRestore();
});

test("DB 가 정해진 시간 안에 답하지 않으면 down", async () => {
  vi.useFakeTimers();
  const error = vi.spyOn(console, "error").mockImplementation(() => {});
  const pending = checkHealth(() => new Promise<void>(() => {}));
  await vi.advanceTimersByTimeAsync(HEALTH_TIMEOUT_MS + 1);
  expect(await pending).toEqual({ status: "down" });
  error.mockRestore();
});

test("라우트: ok 는 200, down 은 503, 캐시하지 않는다", async () => {
  vi.resetModules();
  const ping = vi.fn(async () => {});
  vi.doMock("@/server/health", async (orig) => ({
    ...(await orig<typeof import("@/server/health")>()),
    pingDb: ping,
  }));
  const { GET } = await import("@/app/api/health/route");
  const ok = await GET();
  expect(ok.status).toBe(200);
  expect(await ok.json()).toEqual({ status: "ok" });
  expect(ok.headers.get("cache-control")).toBe("no-store");

  ping.mockRejectedValueOnce(new Error("down"));
  const error = vi.spyOn(console, "error").mockImplementation(() => {});
  const down = await GET();
  expect(down.status).toBe(503);
  expect(await down.json()).toEqual({ status: "down" });
  error.mockRestore();
  vi.doUnmock("@/server/health");
});
