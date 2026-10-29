export type Intent = "structure_change" | "question" | "missing_info_answer" | "history" | "other";

export interface ClefAnswer {
  type?: string;
  choice?: string;
  confidence?: number;
  probabilities?: Record<string, number>;
  [key: string]: unknown;
}

export type ClefAnswers = Record<string, ClefAnswer | undefined>;

export interface ClefClient {
  decide(
    state: unknown,
    questions: Record<string, unknown>,
    signal?: AbortSignal,
  ): Promise<ClefAnswers>;
  classifyIntent(
    input: string,
    context: { lastAssistant?: string },
    signal?: AbortSignal,
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
// classifyIntent 는 매 대화 턴 앞에서 돌므로 대기열·재시도를 포함해 3초 안에 끝낸다.
const CLASSIFY_CAP_MS = 3000;

interface RunOpts {
  maxRetries: number;
  retryOn429Only: boolean;
  timeoutMs: number; // 요청 1건의 제한
  capMs?: number; // 대기열 대기·재시도를 포함한 전체 제한
  signal?: AbortSignal;
}

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
    classifyCapMs?: number;
  } = {},
): ClefClient {
  const doFetch = deps.fetch ?? fetch;
  const baseUrl = cfg?.url.replace(/\/+$/, "");
  const classifyCap = deps.classifyCapMs ?? CLASSIFY_CAP_MS;
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

  async function post(
    body: unknown,
    timeoutMs: number,
    signal?: AbortSignal,
  ): Promise<ClefAnswers> {
    const c = cfg!;
    const timeout = AbortSignal.timeout(timeoutMs);
    const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
    const res = await doFetch(`${baseUrl}/v1/systemone`, {
      method: "POST",
      headers: { Authorization: `Bearer ${c.key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: combined,
    });
    if (!res.ok) throw new ClefHttpError(res.status);
    const json = (await res.json()) as { answers?: ClefAnswers };
    return json.answers ?? {};
  }

  async function run(
    state: unknown,
    questions: Record<string, unknown>,
    opts: RunOpts,
  ): Promise<ClefAnswers> {
    if (!cfg) throw new Error("Clef is not configured");
    const body = { model: "Cloudflare/clef-flash", state, questions };
    const started = Date.now();
    const signals: AbortSignal[] = [];
    if (opts.signal) signals.push(opts.signal);
    if (opts.capMs !== undefined) signals.push(AbortSignal.timeout(opts.capMs));
    const signal = signals.length > 1 ? AbortSignal.any(signals) : signals[0];
    await acquire(signal);
    try {
      for (let retry = 0; ; retry++) {
        if (signal?.aborted) throw abortError();
        const restartDelay = RESTART_DELAYS[Math.min(retry, RESTART_DELAYS.length - 1)]!;
        let delay: number;
        let failure: Error;
        try {
          return await post(body, opts.timeoutMs, signal);
        } catch (e) {
          if (signal?.aborted) throw abortError();
          if (e instanceof ClefHttpError) {
            if (e.status === 429) delay = RATE_DELAY;
            else if (!opts.retryOn429Only && (e.status === 502 || e.status === 503 || e.status === 504))
              delay = restartDelay;
            else throw e;
            failure = e;
          } else if (opts.retryOn429Only) {
            throw new Error("Clef request failed (connection error or timeout)");
          } else {
            // 연결 오류·타임아웃은 503 과 같게 취급한다. 원인 메시지는 주소를 담을 수 있어 버린다.
            delay = restartDelay;
            failure = new Error("Clef request failed (connection error or timeout)");
          }
        }
        if (retry >= opts.maxRetries) throw failure;
        if (opts.capMs !== undefined && Date.now() - started + delay >= opts.capMs) throw failure;
        await sleep(delay, signal);
      }
    } finally {
      release();
    }
  }

  function decide(
    state: unknown,
    questions: Record<string, unknown>,
    signal?: AbortSignal,
  ): Promise<ClefAnswers> {
    return run(state, questions, {
      maxRetries: MAX_RETRIES,
      retryOn429Only: false,
      timeoutMs: TIMEOUT_MS,
      signal,
    });
  }

  async function classifyIntent(
    input: string,
    context: { lastAssistant?: string },
    signal?: AbortSignal,
  ): Promise<{ intent: Intent; confidence: number } | null> {
    if (!cfg) return null;
    try {
      const prev = (context.lastAssistant ?? "").slice(0, 300);
      const state = `직전 AI 메시지: ${prev}\n사용자: ${input}`;
      const answers = await run(state, INTENT_QUESTION, {
        maxRetries: 1,
        retryOn429Only: true,
        timeoutMs: classifyCap,
        capMs: classifyCap,
        signal,
      });
      const a = answers?.intent;
      if (!a || a.type !== "choice") return null;
      if (!INTENTS.includes(a.choice as Intent)) return null;
      const conf = Number(a.confidence);
      if (!Number.isFinite(conf)) return null;
      return { intent: a.choice as Intent, confidence: Math.min(1, Math.max(0, conf)) };
    } catch {
      return null;
    }
  }

  return { decide, classifyIntent };
}
