import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getDiagramHead } from "@/server/flows";
import { NotFoundError, ValidationError } from "@/server/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NEED_LOGIN = "로그인이 필요해요.";
const NOT_FOUND = "구성도를 찾을 수 없어요.";
const GENERIC = "구성도 상태를 확인하지 못했어요. 다시 시도해 주세요.";

type Ctx = { params: Promise<{ id: string }> };

/** 열어 둔 구성도가 몇 초마다 묻는 최신 버전 번호와 흐름 머리 정보(수·마지막 수정 시각). */
export async function GET(_request: Request, ctx: Ctx) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: NEED_LOGIN }, { status: 401 });

  const { id } = await ctx.params;
  try {
    return NextResponse.json(await getDiagramHead(userId, id), { headers: { "cache-control": "no-store" } });
  } catch (err) {
    if (err instanceof NotFoundError) return NextResponse.json({ error: NOT_FOUND }, { status: 404 });
    if (err instanceof ValidationError) return NextResponse.json({ error: err.message }, { status: 400 });
    console.error("diagram head failed", err);
    return NextResponse.json({ error: GENERIC }, { status: 500 });
  }
}
