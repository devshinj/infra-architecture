import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import type { ChatEvent } from "@/server/chat/events";
import { defaultChatDeps } from "@/server/chat/deps";
import { BUSY_MESSAGE, GENERIC_ERROR_MESSAGE, runChatTurn, type ChatTurnResult } from "@/server/chat/pipeline";
import { getOwnedDiagram, NotFoundError } from "@/server/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({ text: z.string().trim().min(1).max(4000) });

const BAD_BODY = "메시지를 1~4000자로 입력해 주세요.";
const NEED_LOGIN = "로그인이 필요해요.";
const NOT_FOUND = "구성도를 찾을 수 없어요.";

const encoder = new TextEncoder();
const line = (e: ChatEvent) => encoder.encode(JSON.stringify(e) + "\n");

type Outcome = { ok: true; result: ChatTurnResult } | { ok: false; err: unknown };

/**
 * 상태 코드 결정 방식:
 *  - 401/400/404 는 스트림을 열기 전에 auth(), 본문 검증, getOwnedDiagram 으로 정한다.
 *  - 409(잠금 실패)는 runChatTurn 이 잠금을 얻어야 알 수 있다. 그래서 차례를 먼저 시작하고
 *    첫 이벤트가 올 때까지 이벤트를 버퍼에 모은다. 첫 이벤트가 error 가 아니면 곧바로 200 으로 스트리밍한다.
 *    첫 이벤트가 error 면(잠금 실패 시 유일한 이벤트) 차례가 끝나길 기다려 busy 이면 409 JSON,
 *    아니면 200 으로 버퍼를 먼저 흘려 보낸다.
 *  - 스트림이 열린 뒤의 예외는 console.error 후 일반 오류 이벤트 하나를 보내고 닫는다.
 */
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: NEED_LOGIN }, { status: 401 });

  if (!(request.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) {
    return NextResponse.json({ error: BAD_BODY }, { status: 400 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: BAD_BODY }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: BAD_BODY }, { status: 400 });
  const text = parsed.data.text;

  const { id } = await ctx.params;
  try {
    await getOwnedDiagram(userId, id);
  } catch (err) {
    if (err instanceof NotFoundError) return NextResponse.json({ error: NOT_FOUND }, { status: 404 });
    console.error("chat route ownership check failed", err);
    return NextResponse.json({ error: GENERIC_ERROR_MESSAGE }, { status: 500 });
  }

  // 브라우저 연결이 끊기거나 스트림이 취소되면 차례를 중단한다.
  const ac = new AbortController();
  if (request.signal.aborted) ac.abort();
  else request.signal.addEventListener("abort", () => ac.abort(), { once: true });

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

  const turn: Promise<Outcome> = runChatTurn({ userId, diagramId: id, text, signal: ac.signal, emit }, defaultChatDeps()).then(
    (result): Outcome => ({ ok: true, result }),
    (err): Outcome => ({ ok: false, err }),
  );

  // error 가 아닌 첫 이벤트면 곧바로 스트리밍, error 가 첫 이벤트이거나 이벤트 없이 끝나면 결과를 기다린다.
  const early = await Promise.race([first.then((e) => (e.t === "error" ? null : "stream" as const)), turn]);
  let outcome: Outcome | null = null;
  if (early !== "stream") {
    outcome = early ?? (await turn);
    if (!outcome.ok && outcome.err instanceof NotFoundError) {
      return NextResponse.json({ error: NOT_FOUND }, { status: 404 });
    }
    if (outcome.ok && outcome.result.status === "busy") {
      return NextResponse.json({ error: BUSY_MESSAGE }, { status: 409 });
    }
  }

  const finish = (o: Outcome) => {
    if (!o.ok) {
      console.error("chat turn failed", o.err);
      push(line({ t: "error", message: GENERIC_ERROR_MESSAGE }));
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
