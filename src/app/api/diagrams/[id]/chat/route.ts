import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { defaultChatDeps } from "@/server/chat/deps";
import { BUSY_MESSAGE, GENERIC_ERROR_MESSAGE, runChatTurn, type ChatTurnResult } from "@/server/chat/pipeline";
import { streamTurn } from "@/server/chat/stream";
import { getOwnedDiagram, NotFoundError } from "@/server/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({ text: z.string().trim().min(1).max(4000) });

const BAD_BODY = "메시지를 1~4000자로 입력해 주세요.";
const NEED_LOGIN = "로그인이 필요해요.";
const NOT_FOUND = "구성도를 찾을 수 없어요.";

/**
 * 상태 코드 결정 방식:
 *  - 401/400/404 는 스트림을 열기 전에 auth(), 본문 검증, getOwnedDiagram 으로 정한다.
 *  - 409(잠금 실패)는 차례가 잠금을 얻어야 알 수 있어 streamTurn 이 첫 이벤트를 보고 정한다.
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

  return streamTurn<ChatTurnResult>({
    requestSignal: request.signal,
    run: (emit, signal) => runChatTurn({ userId, diagramId: id, text, signal, emit }, defaultChatDeps()),
    early(outcome) {
      if (!outcome.ok && outcome.err instanceof NotFoundError) return NextResponse.json({ error: NOT_FOUND }, { status: 404 });
      if (outcome.ok && outcome.result.status === "busy") return NextResponse.json({ error: BUSY_MESSAGE }, { status: 409 });
      return null;
    },
    errorMessage: GENERIC_ERROR_MESSAGE,
    label: "chat turn failed",
  });
}
