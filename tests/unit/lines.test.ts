import { expect, test } from "vitest";

import { messagesToLines } from "@/ui/chat/lines";

test("reload has no missing-info line (the canvas card shows it)", () => {
  const lines = messagesToLines([
    { id: "u1", role: "user", content: "그려줘", meta: {} },
    { id: "a1", role: "assistant", content: "네", meta: { applied: 1, missing: 3 } },
    { id: "a2", role: "assistant", content: "끝", meta: { applied: 1 } },
  ]);
  expect(lines.map((l) => [l.kind, l.text])).toEqual([
    ["user", "그려줘"],
    ["card", ""],
    ["assistant", "네"],
    ["summary", "적용 1 · 건너뜀 0"],
    ["card", ""],
    ["assistant", "끝"],
    ["summary", "적용 1 · 건너뜀 0"],
  ]);
  expect(new Set(lines.map((l) => l.id)).size).toBe(lines.length);
});

test("reload collapses a turn's warnings into one 주의 N chip after the summary", () => {
  const w = (id: string, nodeId: string, level: "warn" | "check", text: string) => ({ id, rule: id.split(":")[0], nodeId, level, text, guide: "g" });
  const lines = messagesToLines([
    { id: "a1", role: "assistant", content: "네", meta: { applied: 1, missing: 2, warnings: [w("spof:w", "w", "warn", "1대뿐이에요."), w("db_exposed:d", "d", "check", "보일 수 있어요.")] } },
    { id: "u2", role: "user", content: "다음", meta: { warnings: [w("spof:x", "x", "warn", "무시")] } },
  ]);
  expect(lines.map((l) => [l.kind, l.text])).toEqual([
    ["card", ""],
    ["assistant", "네"],
    ["summary", "적용 1 · 건너뜀 0"],
    ["warning", "주의 2"],
    ["user", "다음"],
  ]);
  expect(lines[3]!.turn).toBe("a1");
  expect(new Set(lines.map((l) => l.id)).size).toBe(lines.length);
});

test("reload renders the same structure with a collapsed done card", () => {
  const at = new Date("2026-10-30T09:05:00");
  const lines = messagesToLines([
    { id: "u1", role: "user", content: "쇼핑몰", meta: {}, createdAt: at },
    {
      id: "a1",
      role: "assistant",
      content: "웹 서버를 놓을게요\nDB 를 붙일게요",
      meta: { intent: "structure_change", applied: 5, skipped: 1, version: 2, status: "complete", says: ["웹 서버를 놓을게요", "DB 를 붙일게요"], nodes: 3, edges: 2, missing: 4 },
      createdAt: at,
    },
    { id: "u2", role: "user", content: "뭐야?", meta: {} },
    { id: "a2", role: "assistant", content: "로드밸런서예요", meta: { intent: "question", applied: 0, skipped: 0, version: null, status: "complete", says: [] } },
    { id: "a3", role: "assistant", content: "", meta: { applied: 1, skipped: 0, version: 3, status: "aborted", says: [], nodes: 4, edges: 2 } },
  ]);
  // 살아 있는 차례가 끝난 모양과 같다: 카드 → 안내(say) → 칩(요약).
  expect(lines.map((l) => [l.kind, l.text])).toEqual([
    ["user", "쇼핑몰"],
    ["card", ""],
    ["progress", "웹 서버를 놓을게요"],
    ["progress", "DB 를 붙일게요"],
    ["summary", "노드 3 · 연결 2 · 적용 5 · 건너뜀 1"],
    ["user", "뭐야?"],
    ["assistant", "로드밸런서예요"],
    ["card", ""],
    ["summary", "중단됨 · 노드 4 · 연결 2 · 적용 1 · 건너뜀 0"],
  ]);
  expect(lines[1]!.card).toEqual({ mode: "build", step: "checking", changes: 0, end: "done", nodes: 3, edges: 2 });
  expect(lines[7]!.card).toMatchObject({ end: "aborted" });
  // 한 메시지의 줄은 한 차례로 묶이고 시각을 가진다.
  expect(lines.slice(1, 5).every((l) => l.turn === "a1" && l.at === at.getTime())).toBe(true);
  expect(lines[0]!.at).toBe(at.getTime());
  expect(lines[6]!.turn).toBe("a2");
  expect(new Set(lines.map((l) => l.id)).size).toBe(lines.length);
});

test("reload of a layout reply has no 변경 사항이 없어요. chip", () => {
  const text = "구성도를 다시 정렬했어요.";
  const lines = messagesToLines([
    { id: "u1", role: "user", content: "보기 좋게 다시 배치해 줘", meta: {} },
    { id: "a1", role: "assistant", content: text, meta: { intent: "layout", applied: 0, skipped: 0, version: null, status: "complete", says: [text] } },
  ]);
  expect(lines.map((l) => [l.kind, l.text])).toEqual([
    ["user", "보기 좋게 다시 배치해 줘"],
    ["progress", text],
  ]);
});
