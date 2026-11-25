import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";

// 대화 탭 모양 규칙(DESIGN.md · Chat). 화면을 그리지 않고 CSS 글을 읽어 확인한다(tokens.test.ts 와 같은 방식).
const css = readFileSync(join(process.cwd(), "src/ui/chat/chat.module.css"), "utf8");

// 한 규칙(선택자 { ... }) 본문을 꺼낸다.
function rule(source: string, selector: string): string {
  const start = source.search(new RegExp("(^|\\n)" + selector.replace(".", "\\.") + " \\{"));
  const m = start < 0 ? null : source.slice(start).match(/\{([^}]*)\}/);
  if (!m) throw new Error(`rule not found: ${selector}`);
  return m[1];
}

test("my message bubble uses a surface corner and a hairline border", () => {
  const user = rule(css, ".user");
  expect(user).toContain("border-radius: var(--radius-surface)");
  expect(user).toMatch(/border:\s*1px solid var\(--line-node\)/);
  expect(user).not.toMatch(/12px 12px 4px/);
});

test("the AI answer body hangs on one left rail", () => {
  expect(rule(css, ".aiBody")).toMatch(/border-left:\s*1px solid var\(--line-node\)/);
});
