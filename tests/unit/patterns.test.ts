import { expect, test } from "vitest";

import { PATTERNS, patternPromptBlock } from "@/domain/patterns";

test("nine patterns in spec order", () => {
  expect(PATTERNS.map((p) => p.id)).toEqual(["web-was-db", "lb-autoscale", "cache", "mq-async", "k8s", "cdn-static", "serverless", "dr", "external"]);
  for (const p of PATTERNS) expect(p.summary.length).toBeGreaterThan(10);
});

test("prompt block has one line per pattern", () => {
  const lines = patternPromptBlock().split("\n");
  expect(lines[0]).toBe("구성 패턴(기준 지식):");
  expect(lines).toHaveLength(10);
  expect(lines[1]).toBe(`- ${PATTERNS[0].name}: ${PATTERNS[0].summary}`);
});
