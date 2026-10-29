import { describe, expect, test } from "vitest";

import { createQwenClient } from "@/server/llm/qwen";

const cfg = { baseUrl: "http://qwen.test/v1", key: "k-secret", model: "qwen3.8-flash-next" };
const msgs = [{ role: "user" as const, content: "hi" }];

function line(delta: object, finish: string | null = null): string {
  return `data: ${JSON.stringify({ choices: [{ index: 0, delta, finish_reason: finish }] })}\n\n`;
}
function sse(deltas: string[], finish: string | null = "stop"): string {
  const chunks = deltas.map((c) => line({ content: c }));
  chunks.push(line({}, finish));
  chunks.push("data: [DONE]\n\n");
  return chunks.join("");
}
const sseHeaders = { "content-type": "text/event-stream" };
const okRes = (body: string) => new Response(body, { status: 200, headers: sseHeaders });
const errRes = (status: number) =>
  new Response(JSON.stringify({ error: { message: "x" } }), {
    status,
    headers: { "content-type": "application/json" },
  });

function setup(responses: Array<() => Response>) {
  const bodies: any[] = [];
  const headers: Headers[] = [];
  const sleeps: number[] = [];
  let i = 0;
  const fetchFn = (async (_url: any, init: any) => {
    bodies.push(JSON.parse(init.body));
    headers.push(new Headers(init.headers));
    const r = responses[Math.min(i++, responses.length - 1)]!;
    return r();
  }) as typeof fetch;
  const client = createQwenClient(cfg, {
    fetch: fetchFn,
    sleep: async (ms) => {
      sleeps.push(ms);
    },
  });
  return { client, bodies, headers, sleeps, calls: () => i };
}
const run = (c: ReturnType<typeof setup>, signal = new AbortController().signal) => {
  const deltas: string[] = [];
  const p = c.client.streamCompletion(msgs, { signal, onDelta: (t) => deltas.push(t) });
  return { p, deltas };
};

describe("qwen client", () => {
  test("sends model, stream, temperature 0.3, max_tokens 16000 and chat_template_kwargs at top level", async () => {
    const c = setup([() => okRes(sse(["a"]))]);
    await run(c).p;
    const b = c.bodies[0];
    expect(b.model).toBe("qwen3.8-flash-next");
    expect(b.stream).toBe(true);
    expect(b.temperature).toBe(0.3);
    expect(b.max_tokens).toBe(16000);
    expect(b.chat_template_kwargs).toEqual({ enable_thinking: false });
    expect(b.messages).toEqual(msgs);
    expect(c.headers[0]!.get("authorization")).toBe("Bearer k-secret");
  });

  test("onDelta receives content deltas in order", async () => {
    const c = setup([() => okRes(sse(["안", "녕", "!"], "length"))]);
    const { p, deltas } = run(c);
    expect(await p).toEqual({ text: "안녕!", finishReason: "length" });
    expect(deltas).toEqual(["안", "녕", "!"]);
  });

  test("retries 503 twice then succeeds; waits 2000 then 4000", async () => {
    const c = setup([() => errRes(503), () => errRes(503), () => okRes(sse(["ok"]))]);
    const r = await run(c).p;
    expect(r.text).toBe("ok");
    expect(c.sleeps).toEqual([2000, 4000]);
  });

  test("gives up after 3 retries with the last status", async () => {
    const c = setup([() => errRes(503)]);
    await expect(run(c).p).rejects.toMatchObject({ status: 503 });
    expect(c.sleeps).toEqual([2000, 4000, 8000]);
    expect(c.calls()).toBe(4);
  });

  test("does not retry 400", async () => {
    const c = setup([() => errRes(400)]);
    await expect(run(c).p).rejects.toMatchObject({ status: 400 });
    expect(c.calls()).toBe(1);
  });

  test("empty completion is retried once", async () => {
    const c = setup([() => okRes(sse(["  "])), () => okRes(sse(["x"]))]);
    const { p, deltas } = run(c);
    expect((await p).text).toBe("x");
    expect(c.calls()).toBe(2);
    expect(deltas.join("").trim()).toBe("x"); // whitespace-only first attempt may be emitted
  });

  test("second empty completion is returned without another call", async () => {
    const c = setup([() => okRes(sse([""]))]);
    const r = await run(c).p;
    expect(r.text).toBe("");
    expect(c.calls()).toBe(2);
  });

  test("abort stops streaming and rejects with AbortError", async () => {
    const ac = new AbortController();
    const enc = new TextEncoder();
    const c = setup([
      () =>
        new Response(
          new ReadableStream({
            start(ctrl) {
              ctrl.enqueue(enc.encode(line({ content: "a" })));
              // never closes
            },
          }),
          { status: 200, headers: sseHeaders },
        ),
    ]);
    const deltas: string[] = [];
    const p = c.client.streamCompletion(msgs, {
      signal: ac.signal,
      onDelta: (t) => {
        deltas.push(t);
        ac.abort();
      },
    });
    await expect(p).rejects.toMatchObject({ name: "AbortError" });
    expect(deltas).toEqual(["a"]);
  });

  test("already-aborted signal rejects with AbortError", async () => {
    const ac = new AbortController();
    ac.abort();
    const c = setup([() => okRes(sse(["a"]))]);
    await expect(run(c, ac.signal).p).rejects.toMatchObject({ name: "AbortError" });
  });

  test("mid-stream failure is not retried", async () => {
    const enc = new TextEncoder();
    const c = setup([
      () =>
        new Response(
          new ReadableStream({
            start(ctrl) {
              ctrl.enqueue(enc.encode(line({ content: "a" })));
              ctrl.error(new Error("boom"));
            },
          }),
          { status: 200, headers: sseHeaders },
        ),
    ]);
    await expect(run(c).p).rejects.toBeTruthy();
    expect(c.calls()).toBe(1);
  });

  test("abort during retry backoff rejects promptly without another request", async () => {
    const ac = new AbortController();
    let calls = 0;
    const client = createQwenClient(cfg, {
      fetch: (async () => {
        calls++;
        return errRes(503);
      }) as typeof fetch,
      sleep: (_ms, signal) =>
        new Promise<void>((_res, rej) => {
          signal?.addEventListener("abort", () =>
            rej(new DOMException("aborted", "AbortError")),
          );
          setTimeout(() => ac.abort(), 5);
        }),
    });
    await expect(
      client.streamCompletion(msgs, { signal: ac.signal, onDelta: () => {} }),
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(calls).toBe(1);
  });
});
