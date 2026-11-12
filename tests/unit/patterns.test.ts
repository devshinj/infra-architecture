import { expect, test } from "vitest";

import { PATTERNS, patternPromptBlock } from "@/domain/patterns";

test("ten patterns in spec order, ids unique", () => {
  expect(PATTERNS.map((p) => p.id)).toEqual(["web-was-db", "lb-autoscale", "cache", "mq-async", "k8s", "cdn-static", "serverless", "dr", "external", "video-surveillance"]);
  expect(new Set(PATTERNS.map((p) => p.id)).size).toBe(PATTERNS.length);
  for (const p of PATTERNS) expect(p.summary.length).toBeGreaterThan(10);
});

test("prompt block has one line per pattern", () => {
  const lines = patternPromptBlock().split("\n");
  expect(lines[0]).toBe("구성 패턴(기준 지식):");
  expect(lines).toHaveLength(11);
  expect(lines.at(-1)).toBe("- 영상관제(VMS): " + PATTERNS[9].summary);
  expect(lines[1]).toBe(`- ${PATTERNS[0].name}: ${PATTERNS[0].summary}`);
});
