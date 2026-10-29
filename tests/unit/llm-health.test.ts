import { beforeEach, describe, expect, test, vi } from "vitest";

import { llmConfig } from "@/server/llm/config";
import { checkLlmHealth, resetHealthCacheForTest } from "@/server/llm/health";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });

const full = llmConfig({
  QWEN_CODER_KEY: "k",
  QWEN_API_URL: "http://q/v1",
  QWEN_MODEL: "m1",
  CLEF_API_KEY: "c",
  CLEF_API_URL: "http://clef",
});

beforeEach(() => resetHealthCacheForTest());

describe("checkLlmHealth", () => {
  test("missing key → qwen missing, clef ok", async () => {
    const fetchMock = vi.fn(async () => json({}));
    const r = await checkLlmHealth({
      fetch: fetchMock as unknown as typeof fetch,
      config: llmConfig({ CLEF_API_KEY: "c" }),
    });
    expect(r).toEqual({ qwen: "missing", clef: "ok" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("ok when /models lists the model", async () => {
    const f = vi.fn(async (u: string | URL | Request) =>
      String(u).endsWith("/models") ? json({ data: [{ id: "m1" }] }) : json({})
    );
    const r = await checkLlmHealth({ fetch: f as unknown as typeof fetch, config: full });
    expect(r).toEqual({ qwen: "ok", clef: "ok" });
    expect(String(f.mock.calls[0][0])).toBe("http://q/v1/models");
  });

  test("down when model absent / clef non-200, and when fetch throws", async () => {
    const f = vi.fn(async (u: string | URL | Request) =>
      String(u).endsWith("/models") ? json({ data: [{ id: "other" }] }) : json({}, 503)
    );
    expect(await checkLlmHealth({ fetch: f as unknown as typeof fetch, config: full })).toEqual({
      qwen: "down",
      clef: "down",
    });
    resetHealthCacheForTest();
    const boom = vi.fn(async () => {
      throw new DOMException("timeout", "TimeoutError");
    });
    expect(await checkLlmHealth({ fetch: boom as unknown as typeof fetch, config: full })).toEqual({
      qwen: "down",
      clef: "down",
    });
  });

  test("caches for 60s", async () => {
    const f = vi.fn(async () => json({ data: [{ id: "m1" }] }));
    let t = 1000;
    const deps = { fetch: f as unknown as typeof fetch, config: full, now: () => t };
    await checkLlmHealth(deps);
    t += 59_000;
    await checkLlmHealth(deps);
    expect(f).toHaveBeenCalledTimes(2);
    t += 2_000;
    await checkLlmHealth(deps);
    expect(f).toHaveBeenCalledTimes(4);
  });
});
