import { expect, test } from "vitest";

import { messagesToLines } from "@/ui/chat/lines";

test("reload adds the reminder after the assistant line", () => {
  const lines = messagesToLines([
    { id: "u1", role: "user", content: "그려줘", meta: {} },
    { id: "a1", role: "assistant", content: "네", meta: { applied: 1, missing: 3 } },
    { id: "a2", role: "assistant", content: "끝", meta: { applied: 1 } },
  ]);
  expect(lines.map((l) => [l.kind, l.text])).toEqual([
    ["user", "그려줘"],
    ["assistant", "네"],
    ["system", "빠진 정보 3개가 있어요"],
    ["assistant", "끝"],
  ]);
  expect(new Set(lines.map((l) => l.id)).size).toBe(lines.length);
});
