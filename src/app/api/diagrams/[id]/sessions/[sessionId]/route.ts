import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { listMessages } from "@/server/chat/messages";
import { GENERIC_ERROR_MESSAGE } from "@/server/chat/pipeline";
import { getSession } from "@/server/chat/sessions";
import { getOwnedDiagram, NotFoundError } from "@/server/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NEED_LOGIN = "로그인이 필요해요.";
const NOT_FOUND = "구성도를 찾을 수 없어요.";
const MESSAGE_LIMIT = 100;

const SessionIdSchema = z.uuid();

/** 질문 세션 하나와 그 메시지(최근 100개, 오래된 순). 남의 구성도·세션은 404. */
export async function GET(_request: Request, ctx: { params: Promise<{ id: string; sessionId: string }> }) {
  const login = await auth();
  const userId = login?.user?.id;
  if (!userId) return NextResponse.json({ error: NEED_LOGIN }, { status: 401 });

  const { id, sessionId } = await ctx.params;
  try {
    await getOwnedDiagram(userId, id);
    const session = SessionIdSchema.safeParse(sessionId).success ? await getSession(id, sessionId) : null;
    if (!session) return NextResponse.json({ error: NOT_FOUND }, { status: 404 });
    const rows = await listMessages(id, MESSAGE_LIMIT, sessionId);
    return NextResponse.json({
      session,
      messages: rows.map((m) => ({ id: m.id, role: m.role, content: m.content, meta: m.meta, createdAt: m.createdAt })),
    });
  } catch (err) {
    if (err instanceof NotFoundError) return NextResponse.json({ error: NOT_FOUND }, { status: 404 });
    console.error("session route failed", err);
    return NextResponse.json({ error: GENERIC_ERROR_MESSAGE }, { status: 500 });
  }
}
