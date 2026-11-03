import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { NODE_GONE_MESSAGE, runAskTurn, type AskTurnResult } from "@/server/chat/ask";
import { defaultChatDeps } from "@/server/chat/deps";
import { SESSION_GONE_MESSAGE } from "@/server/chat/events";
import { BUSY_MESSAGE, GENERIC_ERROR_MESSAGE } from "@/server/chat/pipeline";
import { getSession } from "@/server/chat/sessions";
import { streamTurn } from "@/server/chat/stream";
import { getOwnedDiagram, NotFoundError, ValidationError } from "@/server/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// 차례 전체 상한(240초, 출력 한도 이어 쓰기 포함)이 플랫폼 시간 제한에 먼저 잘리지 않게 한다.
export const maxDuration = 300;

const BodySchema = z.object({
  nodeId: z.string().min(1).max(200),
  text: z.string().trim().min(1).max(4000),
  sessionId: z.uuid().optional(),
});

const BAD_BODY = "메시지를 1~4000자로 입력해 주세요.";
const NEED_LOGIN = "로그인이 필요해요.";
const NOT_FOUND = "구성도를 찾을 수 없어요.";

const json = (error: string, status: number) => NextResponse.json({ error }, { status });

/**
 * 노드에 대해 묻는 차례. 구성도 대화 route 와 같은 ndjson 형식·오류 코드를 쓴다.
 *  - 401/400/404 는 스트림을 열기 전에 정한다(남의 구성도·세션은 404, 세션의 노드와 다르면 400).
 *  - 409 는 잠금 실패(BUSY_MESSAGE) 또는 노드가 지금 구성도에 없을 때(NODE_GONE_MESSAGE)다.
 */
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return json(NEED_LOGIN, 401);

  if (!(request.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) {
    return json(BAD_BODY, 400);
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(BAD_BODY, 400);
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return json(BAD_BODY, 400);
  const { nodeId, text } = parsed.data;
  const sessionId = parsed.data.sessionId ?? null;

  const { id } = await ctx.params;
  try {
    await getOwnedDiagram(userId, id);
    if (sessionId !== null) {
      const row = await getSession(id, sessionId);
      if (!row) return json(NOT_FOUND, 404);
      // 구성도 대화 세션은 /chat 으로만 이어 간다.
      if (row.kind !== "node" || row.nodeId !== nodeId) return json(BAD_BODY, 400);
    }
  } catch (err) {
    if (err instanceof NotFoundError) return json(NOT_FOUND, 404);
    console.error("ask route ownership check failed", err);
    return json(GENERIC_ERROR_MESSAGE, 500);
  }

  return streamTurn<AskTurnResult>({
    requestSignal: request.signal,
    run: (emit, signal) => runAskTurn({ userId, diagramId: id, nodeId, sessionId, text, signal, emit }, defaultChatDeps()),
    early(outcome) {
      if (!outcome.ok && outcome.err instanceof NotFoundError) return json(NOT_FOUND, 404);
      if (!outcome.ok && outcome.err instanceof ValidationError) return json(BAD_BODY, 400);
      if (outcome.ok && outcome.result.status === "busy") return json(BUSY_MESSAGE, 409);
      if (outcome.ok && outcome.result.status === "session_gone") return json(SESSION_GONE_MESSAGE, 404);
      if (outcome.ok && outcome.result.status === "gone") return json(NODE_GONE_MESSAGE, 409);
      return null;
    },
    errorMessage: GENERIC_ERROR_MESSAGE,
    label: "ask turn failed",
  });
}
