import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { sessionPayload } from "@/server/chat/events";
import { GENERIC_ERROR_MESSAGE } from "@/server/chat/pipeline";
import { isDbTimestamp, listSessionPage, parseCursor } from "@/server/chat/sessions";
import { getOwnedDiagram, NotFoundError } from "@/server/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NEED_LOGIN = "로그인이 필요해요.";
const NOT_FOUND = "구성도를 찾을 수 없어요.";
const BAD_QUERY = "목록을 불러올 조건이 맞지 않아요.";

const json = (error: string, status: number) => NextResponse.json({ error }, { status });

/**
 * 대화 고르기의 `더 보기`: 한 종류(kind=diagram|node)의 세션 한 쪽(최근 이어간 순 50개).
 *  - cursor: 앞 쪽이 준 nextCursor. 없으면 첫 쪽.
 *  - since: 앞 쪽이 준 syncedAt. 있으면 그 뒤로 바뀐 세션(changed)도 함께 준다.
 * 남의 구성도는 404, 조건이 틀리면 400.
 */
export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const login = await auth();
  const userId = login?.user?.id;
  if (!userId) return json(NEED_LOGIN, 401);

  const q = new URL(request.url).searchParams;
  const kind = q.get("kind");
  if (kind !== "diagram" && kind !== "node") return json(BAD_QUERY, 400);
  const rawCursor = q.get("cursor");
  const cursor = rawCursor ? parseCursor(rawCursor) : null;
  if (rawCursor && !cursor) return json(BAD_QUERY, 400);
  const since = q.get("since");
  if (since && !isDbTimestamp(since)) return json(BAD_QUERY, 400);

  const { id } = await ctx.params;
  try {
    await getOwnedDiagram(userId, id);
    const page = await listSessionPage(id, kind, { cursor, since });
    return NextResponse.json({
      items: page.items.map(sessionPayload),
      nextCursor: page.nextCursor,
      changed: page.changed.map(sessionPayload),
      syncedAt: page.syncedAt,
    });
  } catch (err) {
    if (err instanceof NotFoundError) return json(NOT_FOUND, 404);
    console.error("session list failed", err);
    return json(GENERIC_ERROR_MESSAGE, 500);
  }
}
