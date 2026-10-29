import { describe, expect, test } from "vitest";

import { createClefClient, INTENT_MIN_CONFIDENCE } from "@/server/llm/clef";

const cfg = { url: "http://clef.test", key: "k-secret", maxConcurrency: 2 };

const ok = (answers: object) =>
  new Response(JSON.stringify({ answers }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
const err = (status: number) => new Response("{}", { status });
const choice = (id: string, confidence = 0.9) => ({
  intent: { type: "choice", choice: id, confidence, probabilities: {} },
});

/** Clef 요청 본문 중 테스트가 보는 부분. */
interface ClefBody {
  model: string;
  state: string;
  questions: Record<string, { type: string; options?: unknown; instructions?: string; criteria?: Record<string, string> }>;
}

function setup(
  responses: Array<(init?: RequestInit) => Response | Promise<Response>>,
  maxConcurrency = 2,
  classifyCapMs = 3000,
) {
  const calls: Array<{ url: string; body: ClefBody; headers: Headers }> = [];
  const sleeps: number[] = [];
  let i = 0;
  const fetchFn = (async (url: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(url), body: JSON.parse(String(init?.body)) as ClefBody, headers: new Headers(init?.headers) });
    return responses[Math.min(i++, responses.length - 1)]!(init);
  }) as typeof fetch;
  const client = createClefClient(
    { ...cfg, maxConcurrency },
    {
      fetch: fetchFn,
      classifyCapMs,
      sleep: async (ms) => {
        sleeps.push(ms);
      },
    },
  );
  return { client, calls, sleeps };
}

describe("clef", () => {
  test("posts model, state with last assistant context, criteria (not options)", async () => {
    const { client, calls } = setup([() => ok(choice("question"))]);
    await client.classifyIntent("10.0.2.11", { lastAssistant: "서버 IP를 알려 주세요" });
    const c = calls[0]!;
    expect(c.url).toBe("http://clef.test/v1/systemone");
    expect(c.headers.get("authorization")).toBe("Bearer k-secret");
    expect(c.body.model).toBe("Cloudflare/clef-flash");
    expect(c.body.state).toBe("직전 AI 메시지: 서버 IP를 알려 주세요\n사용자: 10.0.2.11");
    const q = c.body.questions.intent;
    expect(q.type).toBe("choice");
    expect(q.options).toBeUndefined();
    expect(q.instructions).toBe("인프라 구성도 도구에서 사용자가 입력한 문장의 의도");
    expect(q.criteria).toEqual({
      structure_change: "구성도에 노드/연결/영역을 추가·삭제·수정해 달라는 요청",
      question: "용어·구성에 대한 질문이나 설명 요청",
      missing_info_answer: "IP·스펙·hostname 같은 빠진 정보에 대한 답",
      history: "이전 버전으로 되돌리기나 변경 이력 요청",
      other: "그 밖의 대화",
    });
  });

  test("truncates last assistant to 300 chars", async () => {
    const { client, calls } = setup([() => ok(choice("other"))]);
    await client.classifyIntent("x", { lastAssistant: "가".repeat(500) });
    expect(calls[0]!.body.state).toBe(`직전 AI 메시지: ${"가".repeat(300)}\n사용자: x`);
  });

  test("returns intent and confidence from answers.intent", async () => {
    const { client } = setup([() => ok(choice("structure_change", 0.83))]);
    expect(await client.classifyIntent("웹서버 추가", {})).toEqual({
      intent: "structure_change",
      confidence: 0.83,
    });
    expect(INTENT_MIN_CONFIDENCE).toBe(0.6);
  });

  test("returns null on unknown choice or missing answer; clamps confidence", async () => {
    expect(await setup([() => ok(choice("weird"))]).client.classifyIntent("a", {})).toBeNull();
    expect(await setup([() => ok({})]).client.classifyIntent("a", {})).toBeNull();
    const clamped = await setup([() => ok(choice("other", 7))]).client.classifyIntent("a", {});
    expect(clamped).toEqual({ intent: "other", confidence: 1 });
  });

  test("429 retries after 1000ms; 503 after 5000 then 15000", async () => {
    const a = setup([() => err(429), () => ok(choice("other"))]);
    await a.client.decide("s", {});
    expect(a.sleeps).toEqual([1000]);
    const b = setup([() => err(503), () => err(502), () => ok(choice("other"))]);
    await b.client.decide("s", {});
    expect(b.sleeps).toEqual([5000, 15000]);
  });

  test("4xx other than 429 is not retried", async () => {
    const { client, calls, sleeps } = setup([() => err(422)]);
    await expect(client.decide("s", {})).rejects.toThrow(/422/);
    expect(calls).toHaveLength(1);
    expect(sleeps).toEqual([]);
  });

  test("returns null when cfg is null, on timeout, or after retries exhausted", async () => {
    expect(await createClefClient(null).classifyIntent("a", {})).toBeNull();
    const ex = setup([() => err(503)]);
    await expect(ex.client.decide("s", {})).rejects.toThrow(/503/);
    expect(await ex.client.classifyIntent("a", {})).toBeNull();
    expect(ex.calls).toHaveLength(5);
    expect(ex.sleeps).toEqual([5000, 15000, 45000]);
    const to = setup([() => Promise.reject(new DOMException("t", "TimeoutError"))]);
    expect(await to.client.classifyIntent("a", {})).toBeNull();
  });

  test("error message never contains key or url", async () => {
    const { client } = setup([() => err(503)]);
    const e = await client.decide("s", {}).catch((x) => x as Error);
    expect(e.message).not.toContain("k-secret");
    expect(e.message).not.toContain("clef.test");
  });

  test("caller abort stops without retry", async () => {
    const ac = new AbortController();
    const { client, calls } = setup([
      () => {
        ac.abort();
        return Promise.reject(new DOMException("a", "AbortError"));
      },
    ]);
    await expect(client.decide("s", {}, ac.signal)).rejects.toThrow();
    expect(calls).toHaveLength(1);
  });

  test("never more than maxConcurrency requests in flight", async () => {
    let active = 0;
    let max = 0;
    const { client } = setup(
      Array.from({ length: 5 }, () => async () => {
        active++;
        max = Math.max(max, active);
        await new Promise((r) => setTimeout(r, 10));
        active--;
        return ok(choice("other"));
      }),
      2,
    );
    await Promise.all(Array.from({ length: 5 }, () => client.classifyIntent("a", {})));
    expect(max).toBe(2);
  });

  test("trailing slashes in url are stripped", async () => {
    const calls: string[] = [];
    const client = createClefClient(
      { url: "http://clef.test//", key: "k", maxConcurrency: 1 },
      {
        fetch: (async (u: RequestInfo | URL) => {
          calls.push(String(u));
          return ok(choice("other"));
        }) as typeof fetch,
      },
    );
    await client.classifyIntent("a", {});
    expect(calls).toEqual(["http://clef.test/v1/systemone"]);
  });

  describe("classifyIntent budget", () => {
    const hang = (init?: RequestInit) =>
      new Promise<Response>((_, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new DOMException("a", "AbortError")));
      });

    test("503 -> exactly one fetch, no sleep, null", async () => {
      const { client, calls, sleeps } = setup([() => err(503)]);
      expect(await client.classifyIntent("a", {})).toBeNull();
      expect(calls).toHaveLength(1);
      expect(sleeps).toEqual([]);
    });

    test("hung fetch -> null at the cap", async () => {
      const { client } = setup([hang], 2, 50);
      const t = Date.now();
      expect(await client.classifyIntent("a", {})).toBeNull();
      expect(Date.now() - t).toBeLessThan(1000);
    });

    test("429 then 200 -> two fetches, intent returned", async () => {
      const { client, calls, sleeps } = setup([() => err(429), () => ok(choice("question"))]);
      expect(await client.classifyIntent("a", {})).toEqual({ intent: "question", confidence: 0.9 });
      expect(calls).toHaveLength(2);
      expect(sleeps).toEqual([1000]);
    });

    test("429 twice -> only one retry", async () => {
      const { client, calls } = setup([() => err(429)]);
      expect(await client.classifyIntent("a", {})).toBeNull();
      expect(calls).toHaveLength(2);
    });

    test("429 retry skipped when it would not fit in the cap", async () => {
      const { client, calls } = setup([() => err(429)], 2, 500);
      expect(await client.classifyIntent("a", {})).toBeNull();
      expect(calls).toHaveLength(1);
    });

    test("queue wait counts toward the cap", async () => {
      const { client } = setup([hang], 2, 50);
      const t = Date.now();
      const r = await Promise.all([
        client.classifyIntent("a", {}),
        client.classifyIntent("b", {}),
        client.classifyIntent("c", {}),
      ]);
      expect(r).toEqual([null, null, null]);
      expect(Date.now() - t).toBeLessThan(1000);
    });

    test("slot is released after cap expiry", async () => {
      const { client } = setup([hang, () => ok(choice("other"))], 1, 50);
      expect(await client.classifyIntent("a", {})).toBeNull();
      expect(await client.classifyIntent("b", {})).toEqual({ intent: "other", confidence: 0.9 });
    });
  });

  test("aborting a queued waiter removes it and the slot is reused", async () => {
    let releaseFirst!: () => void;
    const first = (): Promise<Response> =>
      new Promise((resolve) => {
        releaseFirst = () => resolve(ok(choice("other")));
      });
    const { client, calls } = setup([first, () => ok(choice("other"))], 1);
    const p1 = client.decide("s", {});
    await Promise.resolve();
    const ac = new AbortController();
    const p2r = client.decide("s", {}, ac.signal).catch((e) => e);
    ac.abort();
    expect(await p2r).toBeInstanceOf(DOMException);
    expect(calls).toHaveLength(1);
    releaseFirst();
    await p1;
    await client.decide("s", {});
    expect(calls).toHaveLength(2);
  });
});
