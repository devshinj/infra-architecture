import { afterEach, expect, test, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

test("평소(로컬·E2E 의 next start)에는 standalone 이 아니다", async () => {
  vi.stubEnv("NEXT_OUTPUT", "");
  const { default: config } = await import("../../next.config");
  expect(config.output).toBeUndefined();
});

test("Docker 빌드(NEXT_OUTPUT=standalone)에서만 standalone 으로 낸다", async () => {
  vi.stubEnv("NEXT_OUTPUT", "standalone");
  const { default: config } = await import("../../next.config");
  expect(config.output).toBe("standalone");
});
