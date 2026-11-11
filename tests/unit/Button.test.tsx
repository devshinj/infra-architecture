import "@testing-library/jest-dom/vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { afterEach, expect, test, vi } from "vitest";

import { Button, buttonClassName } from "@/ui/Button";

afterEach(cleanup);

const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

test("Button renders a type=button secondary md button by default", () => {
  render(<Button>새 대화</Button>);
  const b = screen.getByRole("button", { name: "새 대화" });
  expect(b).toHaveAttribute("type", "button");
  expect(b).toHaveAttribute("data-variant", "secondary");
  expect(b).toHaveAttribute("data-size", "md");
  expect(b).not.toHaveAttribute("data-block");
});

test("Button passes variant, size, block, type and native props through", async () => {
  const onClick = vi.fn();
  const ref = createRef<HTMLButtonElement>();
  render(
    <Button ref={ref} variant="danger" size="sm" block type="submit" aria-label="키 지우기" onClick={onClick}>
      지우기
    </Button>,
  );
  const b = screen.getByRole("button", { name: "키 지우기" });
  expect(b).toHaveAttribute("data-variant", "danger");
  expect(b).toHaveAttribute("data-size", "sm");
  expect(b).toHaveAttribute("data-block", "");
  expect(b).toHaveAttribute("type", "submit");
  expect(ref.current).toBe(b);
  await userEvent.click(b);
  expect(onClick).toHaveBeenCalledTimes(1);
});

test("a disabled primary keeps its variant (the stylesheet greys it) and ignores clicks", async () => {
  const onClick = vi.fn();
  render(<Button variant="primary" disabled onClick={onClick}>보내기</Button>);
  const b = screen.getByRole("button", { name: "보내기" });
  expect(b).toHaveAttribute("data-variant", "primary");
  expect(b).toBeDisabled();
  await userEvent.click(b);
  expect(onClick).not.toHaveBeenCalled();
});

test("buttonClassName gives non-button elements (links) the same look", () => {
  const p = buttonClassName({ variant: "primary", block: true });
  expect(p.className).toEqual(expect.any(String));
  expect(p["data-variant"]).toBe("primary");
  expect(p["data-size"]).toBe("md");
  expect(p["data-block"]).toBe("");
  const q = buttonClassName({ variant: "quiet", size: "sm", className: "extra" });
  expect(q.className).toContain("extra");
  expect(q["data-block"]).toBeUndefined();
});

test("button.module.css follows DESIGN.md: control radius, one lime fill, token colours only, focus ring", () => {
  const css = read("src/ui/button.module.css");
  expect(css).toMatch(/border-radius: var\(--radius-control\)/);
  expect(css).not.toMatch(/border-radius: (999px|var\(--radius-pill\))/);
  expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  expect(css).not.toMatch(/box-shadow|gradient/);
  // 연두 칠은 primary 규칙에만.
  const fills = [...css.matchAll(/([^{}]+)\{([^{}]*var\(--accent-fill[^{}]*)\}/g)].map((m) => m[1].trim().split(/\r?\n/).pop()!.trim());
  expect(fills.length).toBeGreaterThan(0);
  for (const sel of fills) expect(sel).toMatch(/\[data-variant="primary"\]/);
  expect(css).toMatch(/:focus-visible \{[^}]*outline: 2px solid var\(--focus-ring\)/);
  // 글자는 12px 아래로 내려가지 않는다.
  for (const m of css.matchAll(/font-size:\s*([\d.]+)px/g)) expect(Number(m[1])).toBeGreaterThanOrEqual(12);
});

function cssFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? cssFiles(p) : p.endsWith(".css") ? [p] : [];
  });
}

test("no stylesheet but button.module.css defines its own button classes", () => {
  const bad: string[] = [];
  for (const f of cssFiles(join(process.cwd(), "src"))) {
    if (f.endsWith("button.module.css")) continue;
    for (const m of readFileSync(f, "utf8").matchAll(/(^|\n|,)\s*(\.(?:btn|primaryBtn|dangerBtn|linkBtn|newChatBtn|linkButton|button)\b)/g)) bad.push(`${f} ${m[2]}`);
  }
  expect(bad).toEqual([]);
});
