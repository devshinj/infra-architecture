import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { listFlows } from "@/server/flows";
import { NotFoundError, ValidationError } from "@/server/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NEED_LOGIN = "로그인이 필요해요.";
const NOT_FOUND = "구성도를 찾을 수 없어요.";
const GENERIC = "흐름을 불러오지 못했어요. 다시 시도해 주세요.";

type Ctx = { params: Promise<{ id: string }> };

/** 구성도의 흐름 목록. 끊김(problems)은 최신 구성도 상태로 계산해 붙인다. */
export async function GET(_request: Request, ctx: Ctx) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: NEED_LOGIN }, { status: 401 });

  const { id } = await ctx.params;
  try {
    return NextResponse.json({ flows: await listFlows(userId, id) });
  } catch (err) {
    if (err instanceof NotFoundError) return NextResponse.json({ error: NOT_FOUND }, { status: 404 });
    if (err instanceof ValidationError) return NextResponse.json({ error: err.message }, { status: 400 });
    console.error("flows list failed", err);
    return NextResponse.json({ error: GENERIC }, { status: 500 });
  }
}
