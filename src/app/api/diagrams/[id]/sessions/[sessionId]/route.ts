import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { sessionPayload } from "@/server/chat/events";
import { withDiagramLock } from "@/server/chat/lock";
import { listMessages } from "@/server/chat/messages";
import { BUSY_MESSAGE, GENERIC_ERROR_MESSAGE } from "@/server/chat/pipeline";
import { deleteSession, foldTitle, getSession, renameSession, TITLE_MAX } from "@/server/chat/sessions";
import { getOwnedDiagram, NotFoundError } from "@/server/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NEED_LOGIN = "로그인이 필요해요.";
const NO_DIAGRAM = "구성도를 찾을 수 없어요.";
const NOT_FOUND = "대화를 찾을 수 없어요.";
const BAD_TITLE = `대화 이름은 1~${TITLE_MAX}자로 입력해 주세요.`;
const MESSAGE_LIMIT = 100;

const SessionIdSchema = z.uuid();
const RenameSchema = z.object({ title: z.string() });

const json = (error: string, status: number) => NextResponse.json({ error }, { status });

type Ctx = { params: Promise<{ id: string; sessionId: string }> };

/** 로그인·구성도 주인·세션 id 모양을 확인한다. 실패면 돌려줄 응답, 통과하면 ids. */
async function guard(ctx: Ctx): Promise<NextResponse | { userId: string; id: string; sessionId: string }> {
  const login = await auth();
  const userId = login?.user?.id;
  if (!userId) return json(NEED_LOGIN, 401);
  const { id, sessionId } = await ctx.params;
  await getOwnedDiagram(userId, id); // 남의 구성도는 NotFoundError
  if (!SessionIdSchema.safeParse(sessionId).success) return json(NOT_FOUND, 404);
  return { userId, id, sessionId };
}

function failed(err: unknown, label: string) {
  if (err instanceof NotFoundError) return json(NO_DIAGRAM, 404);
  console.error(label, err);
  return json(GENERIC_ERROR_MESSAGE, 500);
}

/** 세션 하나와 그 메시지(최근 100개, 오래된 순). 남의 구성도·세션은 404. */
export async function GET(_request: Request, ctx: Ctx) {
  try {
    const g = await guard(ctx);
    if (g instanceof NextResponse) return g;
    const session = await getSession(g.id, g.sessionId);
    if (!session) return json(NOT_FOUND, 404);
    const rows = await listMessages(g.id, MESSAGE_LIMIT, g.sessionId);
    return NextResponse.json({
      session,
      messages: rows.map((m) => ({ id: m.id, role: m.role, content: m.content, meta: m.meta, createdAt: m.createdAt })),
    });
  } catch (err) {
    return failed(err, "session route failed");
  }
}

/** 이름 바꾸기(두 종류 모두). 공백을 한 칸으로 접고 1~60자. 최근 이어간 순서는 그대로다. */
export async function PATCH(request: Request, ctx: Ctx) {
  try {
    const g = await guard(ctx);
    if (g instanceof NextResponse) return g;
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return json(BAD_TITLE, 400);
    }
    const parsed = RenameSchema.safeParse(body);
    if (!parsed.success) return json(BAD_TITLE, 400);
    const folded = parsed.data.title.replace(/\s+/g, " ").trim();
    if (folded === "" || [...folded].length > TITLE_MAX) return json(BAD_TITLE, 400);
    const row = await renameSession(g.id, g.sessionId, foldTitle(folded));
    if (!row) return json(NOT_FOUND, 404);
    return NextResponse.json({ session: sessionPayload(row) });
  } catch (err) {
    return failed(err, "session rename failed");
  }
}

/**
 * 세션과 그 메시지를 지운다(두 종류 모두). 구성도 버전은 그대로다.
 * 차례가 도는 중이면(구성도 잠금을 얻지 못하면) 409: 그 차례가 지운 세션에 글을 쓰지 못하게 한다.
 */
export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    const g = await guard(ctx);
    if (g instanceof NextResponse) return g;
    const locked = await withDiagramLock(g.id, () => deleteSession(g.id, g.sessionId));
    if (!locked.ok) return json(BUSY_MESSAGE, 409);
    if (!locked.value) return json(NOT_FOUND, 404);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return failed(err, "session delete failed");
  }
}
