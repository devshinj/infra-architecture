import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { checkLlmHealth } from "@/server/llm/health";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }
  return NextResponse.json(await checkLlmHealth());
}
