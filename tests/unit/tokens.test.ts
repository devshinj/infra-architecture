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

// WCAG 2 상대 휘도 대비.
function contrast(a: string, b: string): number {
  const lum = (hex: string) => {
    const [r, g, bl] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

test("text-secondary reaches 4.5:1 on every surface and stays dimmer than text-primary", () => {
  const css = read("src/styles/tokens.css");
  const token = (name: string) => css.match(new RegExp(`--${name}:[ ]*(#[0-9A-Fa-f]{6});`))![1];
  const secondary = token("text-secondary");
  expect(secondary).toBe("#9AA7BA");
  for (const bg of ["bg-panel-raised", "bg-panel", "bg-node", "bg-canvas", "bg-sidebar"]) {
    expect(contrast(secondary, token(bg)), bg).toBeGreaterThanOrEqual(4.5);
  }
  expect(contrast(token("text-primary"), token("bg-panel-raised"))).toBeGreaterThan(contrast(secondary, token("bg-panel-raised")) * 1.5);
});

// ---- 캔버스 구역·노드 색 구분 (P3D Task 4) ----
const TINTS: Record<string, string> = {
  region: "#5B7BA0", vpc: "#4F7FB8", public: "#3F93A8", private: "#6874B8", dmz: "#B08B4F",
  k8s: "#4E9A8E", external: "#A9765E", redundancy: "#7F95B5", onprem: "#7A8696",
};

// sRGB 공간에서 a 를 pct% 만큼 b 에 섞는다(color-mix in srgb 와 같다).
function mix(a: string, pct: number, b: string): string {
  const ch = (h: string, i: number) => parseInt(h.slice(i, i + 2), 16);
  return "#" + [1, 3, 5].map((i) => Math.round((ch(a, i) * pct) / 100 + (ch(b, i) * (100 - pct)) / 100).toString(16).padStart(2, "0")).join("");
}

test("zone tint tokens have exact values", () => {
  const css = read("src/styles/tokens.css");
  for (const [name, hex] of Object.entries(TINTS)) {
    expect(css, name).toContain(`--zone-tint-${name}: ${hex};`);
  }
});

test("each group kind maps to a tint token", async () => {
  const { GROUP_KINDS } = await import("@/domain/catalog");
  const css = read("src/styles/tokens.css");
  for (const g of GROUP_KINDS) {
    expect(g.tintToken, g.kind).toMatch(/^--zone-tint-/);
    expect(css, g.kind).toContain(`${g.tintToken}:`);
  }
  const t = (k: string) => GROUP_KINDS.find((g) => g.kind === k)!.tintToken;
  expect(t("idc")).toBe("--zone-tint-onprem");
  expect(t("onprem_zone")).toBe("--zone-tint-onprem");
  expect(t("cloud_region")).toBe("--zone-tint-region");
});

test("zone tag text contrast on tag background is at least 4.5:1", () => {
  const css = read("src/styles/tokens.css");
  const token = (name: string) => css.match(new RegExp(`--${name}:[ ]*(#[0-9A-Fa-f]{6});`))![1];
  for (const [name, hex] of Object.entries(TINTS)) {
    const bg = mix(hex, 22, token("bg-canvas"));
    const fg = mix(hex, 55, token("text-primary"));
    expect(contrast(fg, bg), name).toBeGreaterThanOrEqual(4.5);
  }
});

test("canvas.css paints zones and nodes with the agreed mixes and no side stripe", () => {
  const css = read("src/canvas/canvas.css");
  expect(css).toContain("color-mix(in srgb, var(--tint) 7%, transparent)");
  expect(css).toContain("color-mix(in srgb, var(--tint) 45%, var(--line-node))");
  expect(css).toContain("color-mix(in srgb, var(--tint) 22%, var(--bg-canvas))");
  expect(css).toContain("color-mix(in srgb, var(--tint) 55%, var(--text-primary))");
  expect(css).toContain("color-mix(in srgb, var(--cat) 26%, var(--bg-node))");
  expect(css).toContain("color-mix(in srgb, var(--cat) 38%, var(--line-node))");
  expect(css).not.toMatch(/border-left:/);
});
