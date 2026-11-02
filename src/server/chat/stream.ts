import type { ChatEvent } from "./events";

export type TurnOutcome<R> = { ok: true; result: R } | { ok: false; err: unknown };

const encoder = new TextEncoder();
const line = (e: ChatEvent) => encoder.encode(JSON.stringify(e) + "\n");

/**
 * 대화 차례를 ndjson 스트림 응답으로 돌린다(구성도 대화·노드 질문이 같이 쓴다).
 *
 * 상태 코드 결정 방식:
 *  - 잠금 실패처럼 차례를 시작해야 알 수 있는 상태는 첫 이벤트가 올 때까지 이벤트를 버퍼에 모아 정한다.
 *    첫 이벤트가 error 가 아니면 곧바로 200 으로 스트리밍한다.
 *    첫 이벤트가 error 이거나 이벤트 없이 끝나면 차례가 끝나길 기다려 `early` 에 넘긴다.
 *    `early` 가 응답을 돌려주면 그것을(409·404 등 JSON), null 이면 200 으로 버퍼를 먼저 흘려 보낸다.
 *  - 스트림이 열린 뒤의 예외는 console.error 후 일반 오류 이벤트 하나를 보내고 닫는다.
 *  - 브라우저 연결이 끊기거나 스트림이 취소되면 차례 신호를 중단한다.
 */
export async function streamTurn<R>(opts: {
  requestSignal: AbortSignal;
  run(emit: (e: ChatEvent) => void, signal: AbortSignal): Promise<R>;
  early(outcome: TurnOutcome<R>): Response | null;
  errorMessage: string;
  label: string;
}): Promise<Response> {
  const ac = new AbortController();
  if (opts.requestSignal.aborted) ac.abort();
  else opts.requestSignal.addEventListener("abort", () => ac.abort(), { once: true });

  const buffer: Uint8Array[] = [];
  let controller: ReadableStreamDefaultController<Uint8Array> | null = null;
  let closed = false;
  let onFirst: (e: ChatEvent) => void = () => {};
  const first = new Promise<ChatEvent>((resolve) => {
    onFirst = resolve;
  });
  let sawFirst = false;

  const push = (bytes: Uint8Array) => {
    if (closed) return;
    if (!controller) {
      buffer.push(bytes);
      return;
    }
    try {
      controller.enqueue(bytes);
    } catch {
      closed = true;
    }
  };

  const emit = (e: ChatEvent) => {
    push(line(e));
    if (!sawFirst) {
      sawFirst = true;
      onFirst(e);
    }
  };

  const turn: Promise<TurnOutcome<R>> = opts.run(emit, ac.signal).then(
    (result): TurnOutcome<R> => ({ ok: true, result }),
    (err): TurnOutcome<R> => ({ ok: false, err }),
  );

  // error 가 아닌 첫 이벤트면 곧바로 스트리밍, error 가 첫 이벤트이거나 이벤트 없이 끝나면 결과를 기다린다.
  const early = await Promise.race([first.then((e) => (e.t === "error" ? null : ("stream" as const))), turn]);
  if (early !== "stream") {
    const response = opts.early(early ?? (await turn));
    if (response) return response;
  }

  const finish = (o: TurnOutcome<R>) => {
    if (!o.ok) {
      console.error(opts.label, o.err);
      push(line({ t: "error", message: opts.errorMessage }));
    }
    if (!closed) {
      closed = true;
      try {
        controller?.close();
      } catch {
        // 이미 닫힘
      }
    }
  };

  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      controller = c;
      for (const b of buffer) c.enqueue(b);
      buffer.length = 0;
      void turn.then(finish);
    },
    cancel() {
      closed = true;
      ac.abort();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
