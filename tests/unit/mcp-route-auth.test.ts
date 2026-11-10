import { afterEach, expect, test, vi } from "vitest";

vi.mock("@/server/mcpKeys", () => ({ verifyMcpKey: vi.fn() }));
vi.mock("@/server/mcp/server", () => ({ createMcpServer: vi.fn() }));

import { POST } from "@/app/api/mcp/route";
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
