import { env as appEnv, parseEnv } from "@/env";

export function normalizeQwenBaseUrl(raw: string): string {
  let url = raw.trim();
  if (!/^https?:\/\//i.test(url)) url = `http://${url}`;
  url = url.replace(/\/+$/, "");
  url = url.replace(/\/chat\/completions$/, "");
  return url.replace(/\/+$/, "");
}

export type LlmConfig = {
  qwen: { baseUrl: string; key: string; model: string } | null;
  clef: { url: string; key: string; maxConcurrency: number } | null;
};

// raw 를 주면 그 값으로 파싱한다(테스트용). 없으면 앱 env 를 쓴다.
export function llmConfig(raw?: Record<string, string | undefined>): LlmConfig {
  const e = raw
    ? parseEnv({ DATABASE_URL: "x", AUTH_SECRET: "x", ...raw })
    : appEnv;
  return {
    qwen:
      e.QWEN_CODER_KEY && e.QWEN_API_URL
        ? {
            baseUrl: normalizeQwenBaseUrl(e.QWEN_API_URL),
            key: e.QWEN_CODER_KEY,
            model: e.QWEN_MODEL,
          }
        : null,
    clef: e.CLEF_API_KEY
      ? {
          url: e.CLEF_API_URL.replace(/\/+$/, ""),
          key: e.CLEF_API_KEY,
          maxConcurrency: e.CLEF_MAX_CONCURRENCY,
        }
      : null,
  };
}
