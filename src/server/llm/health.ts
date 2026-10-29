import { llmConfig, type LlmConfig } from "./config";

export type LlmHealth = {
  qwen: "ok" | "missing" | "down";
  clef: "ok" | "missing" | "down";
};

const TTL_MS = 60_000;
const TIMEOUT_MS = 5_000;
let cache: { at: number; value: LlmHealth } | null = null;

export function resetHealthCacheForTest(): void {
  cache = null;
}

async function probe(
  f: typeof fetch,
  url: string,
  headers: Record<string, string>
): Promise<Response | null> {
  try {
    return await f(url, { headers, signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch {
    return null;
  }
}

export async function checkLlmHealth(
  deps: { fetch?: typeof fetch; config?: LlmConfig; now?: () => number } = {}
): Promise<LlmHealth> {
  const now = (deps.now ?? Date.now)();
  if (cache && now - cache.at < TTL_MS) return cache.value;

  const f = deps.fetch ?? fetch;
  const cfg = deps.config ?? llmConfig();

  const qwen = (async (): Promise<LlmHealth["qwen"]> => {
    if (!cfg.qwen) return "missing";
    const model = cfg.qwen.model;
    const res = await probe(f, `${cfg.qwen.baseUrl}/models`, {
      Authorization: `Bearer ${cfg.qwen.key}`,
    });
    if (!res || res.status !== 200) return "down";
    try {
      const body = (await res.json()) as { data?: { id?: unknown }[] };
      const ok = Array.isArray(body.data) && body.data.some((m) => m.id === model);
      return ok ? "ok" : "down";
    } catch {
      return "down";
    }
  })();
  const clef = (async (): Promise<LlmHealth["clef"]> => {
    if (!cfg.clef) return "missing";
    const res = await probe(f, `${cfg.clef.url}/health`, {});
    return res && res.ok ? "ok" : "down";
  })();

  const value = { qwen: await qwen, clef: await clef };
  cache = { at: now, value };
  return value;
}
