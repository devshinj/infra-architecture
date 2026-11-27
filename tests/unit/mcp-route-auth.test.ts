import { afterEach, expect, test, vi } from "vitest";

vi.mock("@/server/mcpKeys", () => ({ verifyMcpKey: vi.fn() }));
vi.mock("@/server/mcp/server", () => ({ createMcpServer: vi.fn() }));

import { POST } from "@/app/api/mcp/route";
import { MCP_BODY_MAX_BYTES } from "@/server/mcp/body";
import { MCP_RATE } from "@/server/mcp/rate";
import { verifyMcpKey } from "@/server/mcpKeys";

const KEY = "isk_" + "k".repeat(43);

afterEach(() => vi.restoreAllMocks());

test("키 확인 중 DB 가 실패하면 라우트의 JSON 500 으로 답하고, 로그에 키·스택을 남기지 않는다", async () => {
  vi.mocked(verifyMcpKey).mockRejectedValue(new Error("connect ECONNREFUSED 127.0.0.1:5432"));
  const logged = vi.spyOn(console, "error").mockImplementation(() => {});

  const res = await POST(
    new Request("http://localhost/api/mcp", {
      method: "POST",
      headers: { authorization: `Bearer ${KEY}`, "content-type": "application/json" },
      body: "{}",
    }),
  );

  expect(res.status).toBe(500);
  expect(await res.json()).toEqual({ error: "요청을 처리하지 못했어요. 잠시 뒤 다시 시도해 주세요." });
  expect(logged).toHaveBeenCalledWith("mcp request failed", "connect ECONNREFUSED 127.0.0.1:5432");
  const text = logged.mock.calls.flat().map(String).join(" ");
  expect(text).not.toContain(KEY);
  expect(text).not.toMatch(/\n\s+at /);
});

const post = (body: string, headers: Record<string, string> = {}) =>
  POST(new Request("http://localhost/api/mcp", { method: "POST", headers: { authorization: `Bearer ${KEY}`, "content-type": "application/json", ...headers }, body }));

test("요청 본문이 한도보다 크면 키를 확인하기 전에 413 으로 돌려준다(길이 헤더가 없거나 틀려도)", async () => {
  vi.mocked(verifyMcpKey).mockResolvedValue("user-1");
  const big = JSON.stringify({ pad: "x".repeat(MCP_BODY_MAX_BYTES) });

  const declared = await post(big);
  expect(declared.status).toBe(413);
  expect(await declared.json()).toEqual({ error: expect.stringContaining("너무 커요") });

  // 길이를 작게 속여도 실제로 읽은 크기로 막는다.
  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      c.enqueue(new TextEncoder().encode(big));
      c.close();
    },
  });
  const lied = await POST(
    new Request("http://localhost/api/mcp", {
      method: "POST",
      headers: { authorization: `Bearer ${KEY}`, "content-type": "application/json" },
      body: stream,
      duplex: "half",
    } as RequestInit),
  );
  expect(lied.status).toBe(413);
  expect(verifyMcpKey).not.toHaveBeenCalled();
});

test("한 계정이 1분 한도를 넘겨 부르면 429 와 Retry-After 로 돌려준다", async () => {
  vi.mocked(verifyMcpKey).mockResolvedValue("user-rate");
  const { createMcpServer } = await import("@/server/mcp/server");
  vi.mocked(createMcpServer).mockImplementation(() => {
    throw new Error("stop here");
  });
  vi.spyOn(console, "error").mockImplementation(() => {});
  for (let i = 0; i < MCP_RATE.max; i++) expect((await post("{}")).status).toBe(500); // 한도 안: 서버를 만들러 간다.
  const limited = await post("{}");
  expect(limited.status).toBe(429);
  expect(Number(limited.headers.get("retry-after"))).toBeGreaterThan(0);
  expect(await limited.json()).toEqual({ error: expect.stringContaining("너무 자주") });
  // 다른 계정은 그대로 받는다.
  vi.mocked(verifyMcpKey).mockResolvedValue("user-other");
  expect((await post("{}")).status).toBe(500);
});
