/** MCP 요청 본문의 상한. 명령 500개를 한 번에 보내도 수백 KB 다. */
export const MCP_BODY_MAX_BYTES = 1024 * 1024;

/**
 * 본문을 한도까지만 읽는다. 넘으면 null(더 읽지 않는다). content-length 는 믿지 않고 실제 읽은 크기로 본다 —
 * 헤더가 없거나 작게 적혀 있어도 메모리에 통째로 올리지 않는다.
 */
export async function readLimitedBody(request: Request, maxBytes: number = MCP_BODY_MAX_BYTES): Promise<string | null> {
  if (Number(request.headers.get("content-length") ?? 0) > maxBytes) return null;
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel().catch(() => {});
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}
