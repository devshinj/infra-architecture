import OpenAI from "openai";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface QwenClient {
  streamCompletion(
    messages: ChatMessage[],
    opts: { signal: AbortSignal; onDelta(text: string): void },
  ): Promise<{ text: string; finishReason: string | null }>;
}

const RETRY_DELAYS = [2000, 4000, 8000];

function abortError(): Error {
  return new DOMException("The operation was aborted.", "AbortError");
}

function isRetryable(err: unknown): boolean {
  if (err instanceof OpenAI.APIUserAbortError) return false;
  if (err instanceof OpenAI.APIConnectionError) return true;
  if (err instanceof OpenAI.APIError) {
    const s = err.status;
    return s === 429 || (typeof s === "number" && s >= 500 && s <= 599);
  }
  return false;
}

export function createQwenClient(
  cfg: { baseUrl: string; key: string; model: string },
  deps: {
    fetch?: typeof fetch;
    sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
  } = {},
): QwenClient {
  const sleep =
    deps.sleep ??
    ((ms: number, signal?: AbortSignal) =>
      new Promise<void>((resolve, reject) => {
        if (signal?.aborted) return reject(abortError());
        const onAbort = () => {
          clearTimeout(timer);
          reject(abortError());
        };
        const timer = setTimeout(() => {
          signal?.removeEventListener("abort", onAbort);
          resolve();
        }, ms);
        signal?.addEventListener("abort", onAbort, { once: true });
      }));
  const openai = new OpenAI({
    apiKey: cfg.key,
    baseURL: cfg.baseUrl,
    fetch: deps.fetch,
    maxRetries: 0,
    timeout: 120_000,
  });

  async function attempt(
    messages: ChatMessage[],
    signal: AbortSignal,
    onDelta: (t: string) => void,
  ): Promise<{ text: string; finishReason: string | null }> {
    for (let retry = 0; ; retry++) {
      if (signal.aborted) throw abortError();
      let received = false;
      let text = "";
      let finishReason: string | null = null;
      try {
        const params = {
          model: cfg.model,
          messages,
          stream: true,
          temperature: 0.3,
          max_tokens: 16000,
          chat_template_kwargs: { enable_thinking: false },
        } as unknown as OpenAI.Chat.ChatCompletionCreateParamsStreaming;
        const stream = await openai.chat.completions.create(params, { signal });
        for await (const chunk of stream) {
          received = true;
          const choice = chunk.choices?.[0];
          if (!choice) continue;
          if (choice.finish_reason) finishReason = choice.finish_reason;
          const delta = choice.delta?.content;
          if (delta) {
            text += delta;
            onDelta(delta);
          }
          if (signal.aborted) throw abortError();
        }
        return { text, finishReason };
      } catch (err) {
        if (signal.aborted || err instanceof OpenAI.APIUserAbortError) throw abortError();
        if (!received && isRetryable(err) && retry < RETRY_DELAYS.length) {
          await sleep(RETRY_DELAYS[retry]!, signal);
          if (signal.aborted) throw abortError();
          continue;
        }
        throw err;
      }
    }
  }

  return {
    async streamCompletion(messages, { signal, onDelta }) {
      const first = await attempt(messages, signal, onDelta);
      if (first.text.trim() !== "") return first;
      return attempt(messages, signal, onDelta);
    },
  };
}
