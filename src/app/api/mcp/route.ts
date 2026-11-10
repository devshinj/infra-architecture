import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { NextResponse } from "next/server";

import { createMcpServer } from "@/server/mcp/server";
import { verifyMcpKey } from "@/server/mcpKeys";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_KEY = "키가 맞지 않아요.";
const WRONG_KEY = "키가 맞지 않거나 지워졌어요. Claude Code 연결 화면에서 새 키를 만들어 다시 등록해 주세요.";
const GENERIC = "요청을 처리하지 못했어요. 잠시 뒤 다시 시도해 주세요.";

/** "Bearer <키>" 에서 키만 꺼낸다. 키·헤더는 로그에 쓰지 않는다. */
function bearerKey(request: Request): string | null {
  const header = request.headers.get("authorization");
  const m = header ? /^Bearer\s+(\S+)$/i.exec(header.trim()) : null;
  return m ? m[1]! : null;
}

/**
 * Claude Code 가 붙는 MCP 주소. 상태를 기억하지 않는다(stateless): 요청마다 키로 계정을 확인하고,
 * 그 계정만 보는 서버와 전송을 새로 만들어 JSON 으로 답한다.
 */
export async function POST(request: Request) {
  const key = bearerKey(request);
  if (!key) return NextResponse.json({ error: NO_KEY }, { status: 401 });
  // 키는 왔는데 틀렸거나 지워졌으면 403. 401 이면 Claude Code(SDK)가 OAuth 를 찾아 나서서 이 문구가 안 보인다.
  const userId = await verifyMcpKey(key);
  if (!userId) return NextResponse.json({ error: WRONG_KEY }, { status: 403 });

  const server = createMcpServer(userId);
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  try {
    await server.connect(transport);
    return await transport.handleRequest(request);
  } catch (err) {
    console.error("mcp request failed", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: GENERIC }, { status: 500 });
  } finally {
    // JSON 응답은 handleRequest 가 끝나면 다 만들어져 있다.
    await server.close();
  }
}

const notAllowed = () =>
  NextResponse.json(
    { jsonrpc: "2.0", error: { code: -32000, message: "이 주소는 POST 만 받아요." }, id: null },
    { status: 405, headers: { Allow: "POST" } },
  );

/** stateless 라 서버가 먼저 보내는 흐름(GET)도, 끝낼 세션(DELETE)도 없다. */
export async function GET() {
  return notAllowed();
}

export async function DELETE() {
  return notAllowed();
}
