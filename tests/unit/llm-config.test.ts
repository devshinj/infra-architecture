import { describe, expect, test } from "vitest";

import { parseEnv } from "@/env";
import { llmConfig, normalizeQwenBaseUrl } from "@/server/llm/config";

describe("normalizeQwenBaseUrl", () => {
  test.each([
    ["192.168.102.107:8000/v1/chat/completions", "http://192.168.102.107:8000/v1"],
    ["https://open-llm.cudo.co.kr:8877/v1/", "https://open-llm.cudo.co.kr:8877/v1"],
    ["http://192.168.102.105:8000/v1", "http://192.168.102.105:8000/v1"],
  ])("normalizes %s", (raw, out) => expect(normalizeQwenBaseUrl(raw)).toBe(out));
});

describe("llmConfig", () => {
  const base = { DATABASE_URL: "x", AUTH_SECRET: "x" };

  test("missing key → qwen/clef null, parseEnv still passes with defaults", () => {
    const e = parseEnv(base);
    expect(e.QWEN_MODEL).toBe("qwen3.8-flash-next");
    expect(e.CLEF_API_URL).toBe("http://192.168.102.105:30000");
    expect(e.CLEF_MAX_CONCURRENCY).toBe(2);
    expect(llmConfig({})).toEqual({ qwen: null, clef: null });
  });

  test("empty strings count as absent", () => {
    expect(llmConfig({ QWEN_CODER_KEY: "", QWEN_API_URL: "" }).qwen).toBeNull();
  });

  test("builds normalized config", () => {
    const c = llmConfig({
      QWEN_CODER_KEY: "k",
      QWEN_API_URL: "10.0.0.1:8000/v1/chat/completions",
      CLEF_API_KEY: "c",
      CLEF_MAX_CONCURRENCY: "3",
    });
    expect(c.qwen).toEqual({
      baseUrl: "http://10.0.0.1:8000/v1",
      key: "k",
      model: "qwen3.8-flash-next",
    });
    expect(c.clef).toEqual({
      url: "http://192.168.102.105:30000",
      key: "c",
      maxConcurrency: 3,
    });
  });
});
