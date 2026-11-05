import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { FLOW_SUGGEST_BUSY_MESSAGE, suggestFlows } from "@/server/flowSuggest";
import { NotFoundError, ValidationError } from "@/server/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Qwen 2회(30초씩)와 저장을 기다리므로 여유 있게 잡는다.
export const maxDuration = 150;

const BodySchema = z.object({ auto: z.boolean().optional() });

const BAD_BODY = "흐름 제안 요청이 올바르지 않아요.";
const NEED_LOGIN = "로그인이 필요해요.";
const NOT_FOUND = "구성도를 찾을 수 없어요.";
const GENERIC = "흐름을 만들지 못했어요. 다시 시도해 주세요.";

type Ctx = { params: Promise<{ id: string }> };

/** 흐름 제안. 처음 그린 뒤 자동(auto) 또는 "흐름 제안받기" 버튼. 성공하면 { saved }. */
export async function POST(request: Request, ctx: Ctx) {
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

  const { id } = await ctx.params;
  try {
    // 클라이언트 연결이 끊기면 생성을 멈춘다.
    const result = await suggestFlows(userId, id, { auto: parsed.data.auto ?? false, signal: request.signal });
    if (result.ok) return NextResponse.json({ saved: result.saved });
    const status = result.message === FLOW_SUGGEST_BUSY_MESSAGE ? 409 : 422;
    return NextResponse.json({ error: result.message }, { status });
  } catch (err) {
    if (err instanceof NotFoundError) return NextResponse.json({ error: NOT_FOUND }, { status: 404 });
    if (err instanceof ValidationError) return NextResponse.json({ error: err.message }, { status: 400 });
    console.error("flow suggest failed", err);
    return NextResponse.json({ error: GENERIC }, { status: 500 });
  }
}
