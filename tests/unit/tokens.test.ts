import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";

const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

// 한 규칙(선택자 { ... }) 본문을 꺼낸다.
function rule(css: string, selector: string): string {
  const start = css.search(new RegExp("(^|\\n)" + selector.replace(".", "\\.") + " \\{"));
  const m = start < 0 ? null : css.slice(start).match(/\{([^}]*)\}/);
  if (!m) throw new Error(`rule not found: ${selector}`);
  return m[1];
}

test("tokens.css defines the shell tokens with exact values", () => {
  const css = read("src/styles/tokens.css");
  expect(css).toMatch(/--bg-sidebar:\s*#121A27;/);
  expect(css).toMatch(/--bg-panel:\s*#212E42;/);
  expect(css).toMatch(/--bg-panel-raised:\s*#2A3A52;/);
  expect(css).toMatch(/--line-shell:\s*#2C3A50;/);
  // 캔버스·노드 토큰은 그대로
  expect(css).toMatch(/--bg-canvas:\s*#1B2638;/);
  expect(css).toMatch(/--bg-node:\s*#223147;/);
});

test("sidebar, panel and canvas use different background tokens", () => {
  const css = read("src/ui/app.module.css");
  expect(rule(css, ".sidebar")).toContain("background: var(--bg-sidebar)");
  expect(rule(css, ".panel")).toContain("background: var(--bg-panel)");
  expect(rule(css, ".shell")).toContain("background: var(--bg-canvas)");
  expect(rule(css, ".sidebar")).toContain("var(--line-shell)");
  expect(rule(css, ".panel")).toContain("var(--line-shell)");
  expect(rule(css, ".tabs")).toContain("var(--line-shell)");
});

test("surfaces raised above the panel use bg-panel-raised, not bg-node", () => {
  for (const f of ["src/ui/panel.module.css", "src/ui/chat/chat.module.css"]) {
    expect(read(f)).not.toContain("var(--bg-node)");
  }
});
