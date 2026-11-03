import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { defaultChatDeps } from "@/server/chat/deps";
import {
  BUSY_MESSAGE,
  GENERIC_ERROR_MESSAGE,
  runChatTurn,
  type ChatSessionTarget,
  type ChatTurnResult,
} from "@/server/chat/pipeline";
import { getSession } from "@/server/chat/sessions";
import { streamTurn } from "@/server/chat/stream";
import { getOwnedDiagram, NotFoundError, ValidationError } from "@/server/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// sessionId: 이어 갈 구성도 대화 세션. newSession: 이 메시지로 새 구성도 대화 세션을 만든다. 둘 다 없으면 기본 대화.
const BodySchema = z
  .object({
    text: z.string().trim().min(1).max(4000),
    sessionId: z.uuid().optional(),
    newSession: z.literal(true).optional(),
  })
  .refine((b) => !(b.sessionId && b.newSession));

const BAD_BODY = "메시지를 1~4000자로 입력해 주세요.";
const NEED_LOGIN = "로그인이 필요해요.";
const NOT_FOUND = "구성도를 찾을 수 없어요.";

/**
 * 상태 코드 결정 방식:
 *  - 401/400/404 는 스트림을 열기 전에 auth(), 본문 검증, getOwnedDiagram 으로 정한다.
 *    남의 구성도·세션은 404, 노드 질문 세션 id 는 400(노드 질문은 /ask 로만 이어 간다).
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
  const { text, sessionId, newSession } = parsed.data;
  const target: ChatSessionTarget | undefined = newSession ? "new" : sessionId ? { id: sessionId } : undefined;

  const { id } = await ctx.params;
  try {
    await getOwnedDiagram(userId, id);
    if (sessionId) {
      const row = await getSession(id, sessionId);
      if (!row) return NextResponse.json({ error: NOT_FOUND }, { status: 404 });
      if (row.kind !== "diagram") return NextResponse.json({ error: BAD_BODY }, { status: 400 });
    }
  } catch (err) {
    if (err instanceof NotFoundError) return NextResponse.json({ error: NOT_FOUND }, { status: 404 });
    console.error("chat route ownership check failed", err);
    return NextResponse.json({ error: GENERIC_ERROR_MESSAGE }, { status: 500 });
  }

  return streamTurn<ChatTurnResult>({
    requestSignal: request.signal,
    run: (emit, signal) => runChatTurn({ userId, diagramId: id, text, session: target, signal, emit }, defaultChatDeps()),
    early(outcome) {
      if (!outcome.ok && outcome.err instanceof NotFoundError) return NextResponse.json({ error: NOT_FOUND }, { status: 404 });
      if (!outcome.ok && outcome.err instanceof ValidationError) return NextResponse.json({ error: BAD_BODY }, { status: 400 });
      if (outcome.ok && outcome.result.status === "busy") return NextResponse.json({ error: BUSY_MESSAGE }, { status: 409 });
      return null;
    },
    errorMessage: GENERIC_ERROR_MESSAGE,
    label: "chat turn failed",
  });
}
