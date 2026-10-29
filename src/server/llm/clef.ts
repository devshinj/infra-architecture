export type Intent = "structure_change" | "question" | "missing_info_answer" | "history" | "other";

export interface ClefClient {
  decide(
    state: unknown,
    questions: Record<string, unknown>,
    signal?: AbortSignal,
  ): Promise<Record<string, any>>;
  classifyIntent(
    input: string,
    context: { lastAssistant?: string },
  ): Promise<{ intent: Intent; confidence: number } | null>;
}

export const INTENT_MIN_CONFIDENCE = 0.6;

const INTENTS: readonly Intent[] = [
  "structure_change",
  "question",
  "missing_info_answer",
  "history",
  "other",
];
const TIMEOUT_MS = 30_000;
const RATE_DELAY = 1000;
const RESTART_DELAYS = [5000, 15000, 45000];
const MAX_RETRIES = 3;

const INTENT_QUESTION = {
  intent: {
    type: "choice",
    instructions: "인프라 구성도 도구에서 사용자가 입력한 문장의 의도",
    criteria: {
      structure_change: "구성도에 노드/연결/영역을 추가·삭제·수정해 달라는 요청",
      question: "용어·구성에 대한 질문이나 설명 요청",
      missing_info_answer: "IP·스펙·hostname 같은 빠진 정보에 대한 답",
      history: "이전 버전으로 되돌리기나 변경 이력 요청",
      other: "그 밖의 대화",
    },
  },
};

function abortError(): Error {
  return new DOMException("The operation was aborted.", "AbortError");
}

class ClefHttpError extends Error {
  constructor(readonly status: number) {
    super(`Clef request failed (status ${status})`);
  }
}

export function createClefClient(
  cfg: { url: string; key: string; maxConcurrency: number } | null,
  deps: {
    fetch?: typeof fetch;
    sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
  } = {},
): ClefClient {
  const doFetch = deps.fetch ?? fetch;
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

  // FIFO 세마포어: 대기 중인 호출은 시작하기 전까지 슬롯을 차지하지 않는다.
  const limit = Math.max(1, cfg?.maxConcurrency ?? 1);
  let active = 0;
  const waiters: Array<() => void> = [];
  async function acquire(signal?: AbortSignal): Promise<void> {
    if (signal?.aborted) throw abortError();
    if (active < limit) {
      active++;
      return;
    }
    await new Promise<void>((resolve, reject) => {
      const onAbort = () => {
        const i = waiters.indexOf(grant);
        if (i >= 0) waiters.splice(i, 1);
        reject(abortError());
      };
      const grant = () => {
        signal?.removeEventListener("abort", onAbort);
        resolve();
      };
      waiters.push(grant);
      signal?.addEventListener("abort", onAbort, { once: true });
    });
  }
  function release(): void {
    const next = waiters.shift();
    if (next) next(); // 슬롯을 그대로 넘긴다
    else active--;
  }

  async function post(body: unknown, signal?: AbortSignal): Promise<Record<string, any>> {
    const c = cfg!;
    const timeout = AbortSignal.timeout(TIMEOUT_MS);
    const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
    const res = await doFetch(`${c.url}/v1/systemone`, {
      method: "POST",
      headers: { Authorization: `Bearer ${c.key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: combined,
    });
    if (!res.ok) throw new ClefHttpError(res.status);
    const json = (await res.json()) as { answers?: Record<string, any> };
    return json.answers ?? {};
  }

  async function decide(
    state: unknown,
    questions: Record<string, unknown>,
    signal?: AbortSignal,
  ): Promise<Record<string, any>> {
    if (!cfg) throw new Error("Clef is not configured");
    const body = { model: "Cloudflare/clef-flash", state, questions };
    await acquire(signal);
    try {
      for (let retry = 0; ; retry++) {
        if (signal?.aborted) throw abortError();
        const restartDelay = RESTART_DELAYS[Math.min(retry, RESTART_DELAYS.length - 1)]!;
        let delay: number;
        let failure: Error;
        try {
          return await post(body, signal);
        } catch (e) {
          if (signal?.aborted) throw abortError();
          if (e instanceof ClefHttpError) {
            if (e.status === 429) delay = RATE_DELAY;
            else if (e.status === 502 || e.status === 503 || e.status === 504) delay = restartDelay;
            else throw e;
            failure = e;
          } else {
            // 연결 오류·타임아웃은 503 과 같게 취급한다. 원인 메시지는 주소를 담을 수 있어 버린다.
            delay = restartDelay;
            failure = new Error("Clef request failed (connection error or timeout)");
          }
        }
        if (retry >= MAX_RETRIES) throw failure;
        await sleep(delay, signal);
      }
    } finally {
      release();
    }
  }

  async function classifyIntent(
    input: string,
    context: { lastAssistant?: string },
  ): Promise<{ intent: Intent; confidence: number } | null> {
    if (!cfg) return null;
    try {
      const prev = (context.lastAssistant ?? "").slice(0, 300);
      const state = `직전 AI 메시지: ${prev}\n사용자: ${input}`;
      const answers = await decide(state, INTENT_QUESTION);
      const a = answers?.intent;
      if (!a || a.type !== "choice") return null;
      if (!INTENTS.includes(a.choice)) return null;
      const conf = Number(a.confidence);
      if (!Number.isFinite(conf)) return null;
      return { intent: a.choice as Intent, confidence: Math.min(1, Math.max(0, conf)) };
    } catch {
      return null;
    }
  }

  return { decide, classifyIntent };
}
