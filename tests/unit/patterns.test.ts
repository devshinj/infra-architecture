import { expect, test } from "vitest";

import { ASSUMPTION_CHOICES } from "@/domain/assumptions";
import { PATTERNS, patternPromptBlock } from "@/domain/patterns";

test("eleven patterns in spec order, ids unique", () => {
  expect(PATTERNS.map((p) => p.id)).toEqual([
    "web-was-db",
    "lb-autoscale",
    "cache",
    "mq-async",
    "k8s",
    "cdn-static",
    "serverless",
    "dr",
    "external",
    "video-surveillance-city",
    "video-surveillance-site",
  ]);
  expect(new Set(PATTERNS.map((p) => p.id)).size).toBe(PATTERNS.length);
  for (const p of PATTERNS) expect(p.summary.length).toBeGreaterThan(10);
});

test("prompt block has one line per pattern", () => {
  const lines = patternPromptBlock().split("\n");
  expect(lines[0]).toBe("구성 패턴(기준 지식):");
  expect(lines).toHaveLength(PATTERNS.length + 1);
  expect(lines[1]).toBe(`- ${PATTERNS[0].name}: ${PATTERNS[0].summary}`);
  const last = PATTERNS.at(-1)!;
  expect(lines.at(-1)).toBe(`- ${last.name}: ${last.summary}`);
});

test("영상관제 패턴은 되묻기(관제 대상) 두 답에 하나씩 맞고, 영상 방향을 녹화서버 → 관제 화면으로 쓴다", () => {
  const [city, site] = ASSUMPTION_CHOICES.video_site!;
  const byName = (name: string) => PATTERNS.find((p) => p.name === name)!;
  expect(city).toContain("지자체");
  expect(site).toContain("일반 시설");
  const cityPattern = byName("영상관제(지자체 통합관제)");
  const sitePattern = byName("영상관제(일반 시설)");
  expect(cityPattern.summary).toContain("관제 화면은 방화벽을 거쳐 녹화서버(대규모면 스트리밍 분배 서버)에서 영상을 받고");
  expect(cityPattern.summary).toContain("VMS 관리서버를 app_server 로 따로 둔다");
  expect(cityPattern.summary).not.toContain("VMS 와 영상에 닿는다");
  expect(sitePattern.summary).toContain("통합관제망·망연계 없이");
  expect(sitePattern.summary).toContain("관제 화면은 녹화서버에서 영상을 받는다");
});
