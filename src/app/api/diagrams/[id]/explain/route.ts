import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { explainTarget, listSignatures } from "@/server/explain";
import { NotFoundError, ValidationError } from "@/server/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// 최악의 경우 Qwen 4회(30초씩) + Clef 를 기다리므로 여유 있게 잡는다.
export const maxDuration = 150;

const BodySchema = z.object({
  targetKind: z.enum(["node", "edge"]),
  targetId: z.string().min(1).max(200),
  instruction: z.string().optional(),
});

const BAD_BODY = "설명 요청이 올바르지 않아요.";
const NEED_LOGIN = "로그인이 필요해요.";
const NOT_FOUND = "구성도를 찾을 수 없어요.";
const GENERIC = "설명을 만들지 못했어요. 다시 시도해 주세요.";

type Ctx = { params: Promise<{ id: string }> };

/** 서비스가 던진 오류를 상태 코드로 바꾼다. */
function failure(err: unknown, label: string) {
  if (err instanceof NotFoundError) return NextResponse.json({ error: NOT_FOUND }, { status: 404 });
  if (err instanceof ValidationError) return NextResponse.json({ error: err.message }, { status: 400 });
  console.error(label, err);
  return NextResponse.json({ error: GENERIC }, { status: 500 });
}

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
    const result = await explainTarget(userId, id, parsed.data.targetKind, parsed.data.targetId, {
      instruction: parsed.data.instruction,
      signal: request.signal,
    });
    return NextResponse.json(result);
  } catch (err) {
    return failure(err, "explain route failed");
  }
}

export async function GET(_request: Request, ctx: Ctx) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: NEED_LOGIN }, { status: 401 });

  const { id } = await ctx.params;
  try {
    return NextResponse.json(await listSignatures(userId, id));
  } catch (err) {
    return failure(err, "explain signatures failed");
  }
}
