import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";

// 학습 가이드 카드 모양(DESIGN.md · One Signal Rule 보충). CSS 글을 읽어 확인한다.
const css = readFileSync(join(process.cwd(), "src/ui/guide/guide.module.css"), "utf8");

function rule(source: string, selector: string): string {
  const start = source.search(new RegExp("(^|\\n)" + selector.replace(".", "\\.") + " \\{"));
  const m = start < 0 ? null : source.slice(start).match(/\{([^}]*)\}/);
  if (!m) throw new Error(`rule not found: ${selector}`);
  return m[1];
}

test("the guide band is a pale lime sheet with a lime title", () => {
  const band = rule(css, ".band");
  expect(band).toContain("background: color-mix(in srgb, var(--accent) 12%, var(--bg-canvas))");
  expect(band).toContain("border-bottom: 1px solid color-mix(in srgb, var(--accent) 35%, var(--line-node))");
  expect(rule(css, ".bandTitle")).toContain("color: var(--accent)");
});

test("a long title wraps and the dot row never shrinks", () => {
  expect(rule(css, ".bandTitle")).toMatch(/min-width:\s*0/);
  expect(rule(css, ".bandTitle")).toContain("overflow-wrap: anywhere");
  expect(rule(css, ".dots")).toMatch(/flex:\s*none/);
});

test("an open note sits in a small panel", () => {
  const note = rule(css, ".noteText");
  expect(note).toContain("background: var(--color-paper-2)");
  expect(note).toMatch(/border:\s*1px solid var\(--line-shell\)/);
  expect(note).toContain("border-radius: var(--radius-control)");
});

test("the guide sheet uses no shadow or gradient", () => {
  expect(css).not.toMatch(/gradient|box-shadow/);
});
