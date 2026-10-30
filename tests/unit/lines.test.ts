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

test("reload adds warning lines after the reminder", () => {
  const w = (id: string, nodeId: string, level: "warn" | "check", text: string) => ({ id, rule: id.split(":")[0], nodeId, level, text, guide: "g" });
  const lines = messagesToLines([
    { id: "a1", role: "assistant", content: "네", meta: { applied: 1, missing: 2, warnings: [w("spof:w", "w", "warn", "1대뿐이에요."), w("db_exposed:d", "d", "check", "보일 수 있어요.")] } },
    { id: "u2", role: "user", content: "다음", meta: { warnings: [w("spof:x", "x", "warn", "무시")] } },
  ]);
  expect(lines.map((l) => [l.kind, l.text])).toEqual([
    ["assistant", "네"],
    ["system", "빠진 정보 2개가 있어요"],
    ["warning", "주의: 1대뿐이에요."],
    ["warning", "확인해 보세요: 보일 수 있어요."],
    ["user", "다음"],
  ]);
  expect(lines[2]).toMatchObject({ nodeId: "w", level: "warn" });
  expect(lines[3]).toMatchObject({ nodeId: "d", level: "check" });
  expect(new Set(lines.map((l) => l.id)).size).toBe(lines.length);
});
