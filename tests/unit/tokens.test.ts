import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";

// 레이아웃 모듈은 elkjs 번들(약 1.5MB)을 끌어온다. 시험 안에서 await import 하면 그 적재·변환 시간이 5초 시험 제한에
// 들어가 기계가 바쁠 때 시간 초과가 났다. 파일 맨 위에서 불러 수집 단계에서 적재되게 한다.
import { azChipWidth, CONTENT_WIDTH, NODE, SUB_PX } from "@/canvas/layout";
import { textWidth } from "@/canvas/text";
import { GROUP_KINDS } from "@/domain/catalog";

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
  expect(css).toMatch(/--bg-sidebar:\s*#091015;/);
  expect(css).toMatch(/--bg-panel:\s*#091015;/);
  expect(css).toMatch(/--bg-panel-raised:\s*#182126;/);
  expect(css).toMatch(/--line-shell:\s*#20282C;/);
  // 캔버스·노드 토큰(Vantage paper · paper-3)
  expect(css).toMatch(/--bg-canvas:\s*#04090C;/);
  expect(css).toMatch(/--bg-node:\s*#111A1F;/);
});

test("fly dot token is a silver brighter than the glass highlight", () => {
  const css = read("src/styles/tokens.css");
  expect(css).toContain("--fly-dot: #DCE3EE;");
  expect(read("docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md")).toMatch(/\| `fly-dot` \| `#DCE3EE` \|/);
});

test("floating panel tokens have exact values (flat paper-2, hairline, no blur)", () => {
  const css = read("src/styles/tokens.css");
  expect(css).toContain("--glass-bg: rgba(9, 16, 21, 1);");
  expect(css).toContain("--glass-line: rgba(32, 40, 44, 1);");
  expect(css).not.toContain("--glass-highlight:");
  expect(css).not.toContain("--glass-blur:");
  expect(css).toContain("--radius-panel: 4px;");
  expect(css).toContain("--panel-gap: 12px;");
});

test("sidebar and panel float as flat paper-2 panels with a hairline over the full-bleed canvas", () => {
  const css = read("src/ui/app.module.css");
  expect(rule(css, ".shell")).toContain("background: var(--bg-canvas)");
  for (const sel of [".sidebar", ".panel"]) {
    const r = rule(css, sel);
    expect(r, sel).toContain("background: var(--glass-bg)");
    expect(r, sel).not.toContain("backdrop-filter");
    expect(r, sel).toContain("border: 1px solid var(--glass-line)");
    expect(r, sel).toContain("border-radius: var(--radius-panel)");
  }
  expect(css).not.toContain("backdrop-filter");
  expect(rule(css, ".sidebar")).toContain("position: absolute");
  expect(rule(css, ".panelDock")).toContain("position: absolute");
  expect(css).not.toMatch(/box-shadow|gradient/);
  // 알약 탭: 선택은 bg-panel-raised 채움 + text-primary
  expect(rule(css, ".tab")).toContain("border-radius: 999px");
  const sel = css.match(/\.tab\[aria-selected="true"\] \{([^}]*)\}/)![1];
  expect(sel).toContain("background: var(--bg-panel-raised)");
  expect(sel).toContain("color: var(--text-primary)");
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
  expect(secondary).toBe("#8F9AA0");
  for (const bg of ["bg-panel-raised", "bg-panel", "bg-node", "bg-canvas", "bg-sidebar"]) {
    expect(contrast(secondary, token(bg)), bg).toBeGreaterThanOrEqual(4.5);
  }
  expect(contrast(token("text-primary"), token("bg-panel-raised"))).toBeGreaterThan(contrast(secondary, token("bg-panel-raised")) * 1.5);
});

// ---- 캔버스 구역·노드 색 구분 (P3D Task 4) ----
const TINTS: Record<string, string> = {
  region: "#718A9C", vpc: "#688AA8", public: "#68959D", private: "#777E9F", dmz: "#A68F68",
  k8s: "#6A978D", external: "#A68471", redundancy: "#8196A2", onprem: "#7E888E", network: "#857A9A",
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

test("info card and legend body text is 13px (panel body rule)", () => {
  const card = read("src/ui/canvas/infoCard.module.css");
  for (const sel of [".title", ".empty", ".warnText"]) expect(rule(card, sel), sel).toMatch(/font-size:\s*13px/);
  const legend = read("src/ui/canvas/legend.module.css");
  for (const sel of [".toggle", ".text"]) expect(rule(legend, sel), sel).toMatch(/font-size:\s*13px/);
});

test("chat bubbles and progress dots follow the restrained spec", () => {
  const css = read("src/ui/chat/chat.module.css");
  const user = rule(css, ".user");
  expect(user).toContain("background: var(--bg-panel-raised)");
  expect(user).toContain("border-radius: 12px 12px 4px 12px");
  expect(user).toContain("max-width: 85%");
  expect(rule(css, ".mono")).toContain("border: 1px solid var(--line-node)");
  expect(css).toMatch(/\.dots span \{[^}]*animation: dot 1\.2s/);
  // 움직임 줄이기: 점 애니메이션이 없다.
  expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\) \{ \.dots span \{ animation: none;/);
  // 말풍선·아바타·진행 점은 금색을 쓰지 않는다.
  for (const sel of [".user", ".mono", ".dots span"]) expect(rule(css, sel), sel).not.toContain("var(--accent");
  // 대화에서 금색은 보내기 버튼 하나뿐이다(사용자 결정: 작업 화면의 유일한 주 동작). 금색 칠을 쓰는 규칙은 .primaryBtn 뿐이고,
  // 그 칠(var(--accent-fill))은 .primaryBtn 본 규칙 하나에만 있다.
  const goldRules = [...css.matchAll(/([^{}]+)\{([^{}]*var\(--accent[^{}]*)\}/g)].map((m) => m[1].trim().split(/\r?\n/).pop()!.trim());
  expect(goldRules.length).toBeGreaterThan(0);
  for (const sel of goldRules) expect(sel).toMatch(/^\.primaryBtn(:[a-z():-]+)?$/);
  expect(rule(css, ".primaryBtn")).toContain("background: var(--accent-fill)");
  expect(css.replace(/(^|\n)\.primaryBtn \{[^}]*\}/, "")).not.toContain("var(--accent-fill)");
  expect(css).not.toContain("var(--accent)");
  // ChatPanel 에서 primaryBtn 을 쓰는 버튼은 보내기 하나다.
  const panel = read("src/ui/chat/ChatPanel.tsx");
  expect(panel.match(/styles\.primaryBtn/g)).toHaveLength(1);
  expect(panel).toMatch(/styles\.primaryBtn[^\n]*\n\s*보내기/);
  expect(css).not.toMatch(/gradient|box-shadow/);
});

test("scrollbar tokens and thin themed scrollbars; the app shell never scrolls the page", () => {
  const tokens = read("src/styles/tokens.css");
  expect(tokens).toContain("--scrollbar-thumb: rgba(154, 167, 186, 0.28);");
  expect(tokens).toContain("--scrollbar-thumb-hover: rgba(154, 167, 186, 0.5);");
  const globals = read("src/styles/globals.css");
  // 표준 속성은 웹킷 규칙을 못 쓰는 엔진에서만(Chrome 121+ 는 둘이 함께면 웹킷 규칙을 무시한다).
  expect(globals).toMatch(/@supports not selector\(::-webkit-scrollbar\) \{[^@]*scrollbar-width: thin;[^@]*scrollbar-color: var\(--scrollbar-thumb\) transparent;/);
  expect(globals).toContain("scrollbar-width: thin;");
  expect(globals).toContain("scrollbar-color: var(--scrollbar-thumb) transparent;");
  expect(globals).toMatch(/::-webkit-scrollbar \{[^}]*width: 8px;/);
  expect(globals).toMatch(/::-webkit-scrollbar-thumb \{[^}]*border-radius:/);
  expect(globals).toMatch(/::-webkit-scrollbar-thumb:hover \{[^}]*var\(--scrollbar-thumb-hover\)/);
  // 셸은 화면에 고정돼 문서 높이에 보태지지 않는다.
  expect(rule(read("src/ui/app.module.css"), ".shell")).toMatch(/position: fixed;\s*inset: 0;[^}]*overflow: hidden;/);
});

// ---- 글자 크기·대비 (P3E Task 1) ----
function cssFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? cssFiles(p) : p.endsWith(".css") ? [p] : [];
  });
}

test("no css font-size below 11px", () => {
  // 예외: 대화 아바타 IS 모노그램 하나.
  const allowed = [{ file: "chat.module.css", selector: ".mono" }];
  const bad: string[] = [];
  for (const f of cssFiles(join(process.cwd(), "src"))) {
    const css = readFileSync(f, "utf8");
    for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const sel = m[1].trim().split(/\r?\n/).pop()!.trim();
      for (const d of m[2].matchAll(/font-size:\s*([\d.]+)px/g)) {
        if (parseFloat(d[1]) >= 11) continue;
        if (allowed.some((a) => f.endsWith(a.file) && sel === a.selector)) continue;
        bad.push(`${f} ${sel} ${d[0]}`);
      }
    }
  }
  expect(bad).toEqual([]);
});

// rgba 색을 불투명 배경 위에 합성한다.
function over(rgba: string, bg: string): string {
  const m = rgba.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/)!;
  const a = parseFloat(m[4]);
  const ch = (h: string, i: number) => parseInt(h.slice(i, i + 2), 16);
  return "#" + [1, 3, 5].map((i, k) => Math.round(parseInt(m[k + 1]) * a + ch(bg, i) * (1 - a)).toString(16).padStart(2, "0")).join("");
}

test("text contrast is at least 4.5:1", () => {
  const css = read("src/styles/tokens.css");
  const token = (name: string) => css.match(new RegExp(`--${name}:[ ]*(#[0-9A-Fa-f]{6});`))![1];
  const glass = over(css.match(/--glass-bg:\s*(rgba\([^)]*\));/)![1], token("bg-canvas"));
  for (const fg of ["text-primary", "text-secondary"]) {
    for (const [name, bg] of [["bg-canvas", token("bg-canvas")], ["bg-panel", token("bg-panel")], ["glass-bg", glass]]) {
      expect(contrast(token(fg), bg), `${fg} on ${name}`).toBeGreaterThanOrEqual(4.5);
    }
  }
  // 영역 이름표: canvas.css 의 글자 비율을 그대로 읽는다.
  const canvas = read("src/canvas/canvas.css");
  const fgPct = Number(canvas.match(/color: color-mix\(in srgb, var\(--tint\) (\d+)%, var\(--text-primary\)\)/)![1]);
  for (const m of css.matchAll(/--zone-tint-([a-z0-9]+):\s*(#[0-9A-Fa-f]{6});/g)) {
    const bg = mix(m[2], 22, token("bg-canvas"));
    const fg = mix(m[2], fgPct, token("text-primary"));
    expect(contrast(fg, bg), `zone ${m[1]}`).toBeGreaterThanOrEqual(4.5);
  }
});

// ---- 노드 글자 영역·대비 (P3E Task 3) ----
test("node card text contrast on --bg-node is at least 4.5:1", () => {
  const css = read("src/styles/tokens.css");
  const token = (name: string) => css.match(new RegExp(`--${name}:[ ]*(#[0-9A-Fa-f]{6});`))![1];
  for (const fg of ["text-primary", "text-secondary"]) {
    expect(contrast(token(fg), token("bg-node")), `${fg} on bg-node`).toBeGreaterThanOrEqual(4.5);
  }
});

test("layout AZ chip width matches .node__az and .node__subrow CSS", async () => {
  const css = read("src/canvas/canvas.css");
  const az = rule(css, ".node__az");
  expect(Number(az.match(/font-size:\s*(\d+)px/)![1])).toBe(SUB_PX);
  const border = Number(az.match(/border:\s*(\d+)px solid/)![1]);
  const padX = Number(az.match(/padding:\s*0 (\d+)px/)![1]);
  const gap = Number(rule(css, ".node__subrow").match(/\bgap:\s*(\d+)px/)![1]);
  // 칩 = 글자(`AZ <az>`) + 양쪽 안쪽 여백 + 양쪽 테두리 + 보조 글자와의 사이.
  expect(azChipWidth("2a")).toBeCloseTo(textWidth("AZ 2a", SUB_PX) + 2 * padX + 2 * border + gap);
});

test("layout truncation width equals the .node CSS content box", async () => {
  const css = read("src/canvas/canvas.css");
  const node = rule(css, ".node");
  const px = (re: RegExp) => Number(node.match(re)![1]);
  const pad = node.match(/padding:\s*0 (\d+)px 0 (\d+)px;/)!;
  const padRightCss = Number(pad[1]);
  const padLeftCss = Number(pad[2]);
  const gap = px(/\bgap:\s*(\d+)px/);
  const border = px(/border:\s*(\d+)px solid/);
  const icon = Number(rule(css, ".node__icon").match(/width:\s*(\d+)px/)![1]);
  // 한 줄 안의 글자 칸 = 최대 너비 − 양쪽 테두리 − 안쪽 여백 − 아이콘 − 아이콘과 글자 사이.
  const cssContent = NODE.maxWidth - 2 * border - padLeftCss - padRightCss - icon - gap;
  expect(CONTENT_WIDTH).toBe(cssContent);
});

// ---- 빠진 정보 글자·배지 대비 (접근성 점검) ----
test("state-missing-text is the agreed mix and reaches 4.5:1 on every surface; text never uses raw state-missing", () => {
  const css = read("src/styles/tokens.css");
  const token = (name: string) => css.match(new RegExp(`--${name}:[ ]*(#[0-9A-Fa-f]{6});`))![1];
  const text = token("state-missing-text");
  expect(text.toUpperCase()).toBe(mix(token("state-missing"), 55, token("text-primary")).toUpperCase());
  const glass = over(css.match(/--glass-bg:\s*(rgba\([^)]*\));/)![1], token("bg-canvas"));
  for (const [name, bg] of [...["bg-canvas", "bg-node", "bg-sidebar", "bg-panel", "bg-panel-raised"].map((n) => [n, token(n)]), ["glass-bg", glass]]) {
    expect(contrast(text, bg), name).toBeGreaterThanOrEqual(4.5);
  }
  // 글자색(color:)에 --state-missing 을 그대로 쓰지 않는다(테두리·칠은 괜찮다).
  const bad: string[] = [];
  for (const f of cssFiles(join(process.cwd(), "src"))) {
    for (const m of readFileSync(f, "utf8").matchAll(/(?:^|[;{\s])color:\s*var\(--state-missing\)/g)) bad.push(`${f} ${m[0].trim()}`);
  }
  expect(bad).toEqual([]);
});

test("missing badge number reaches 4.5:1 and the badge stays distinct from the node and canvas", () => {
  const css = read("src/styles/tokens.css");
  const token = (name: string) => css.match(new RegExp(`--${name}:[ ]*(#[0-9A-Fa-f]{6});`))![1];
  const badge = rule(read("src/canvas/canvas.css"), ".node__badge--missing");
  const m = badge.match(/background: color-mix\(in srgb, var\(--state-missing\) (\d+)%, var\(--text-primary\)\); color: var\(--([a-z-]+)\);/)!;
  const fill = mix(token("state-missing"), Number(m[1]), token("text-primary"));
  expect(contrast(token(m[2]), fill)).toBeGreaterThanOrEqual(4.5);
  for (const bg of ["bg-node", "bg-canvas"]) expect(contrast(fill, token(bg)), bg).toBeGreaterThanOrEqual(3);
});

test("glossary search placeholder uses text-secondary instead of the browser gray", () => {
  expect(read("src/ui/glossary/glossary.module.css")).toContain(".search::placeholder { color: var(--text-secondary); }");
});

// ---- 주 동작 버튼·입력칸 테두리 대비 ----
test("primary button text on the accent fill reaches 4.5:1 in every state, and input borders reach 3:1", () => {
  const css = read("src/styles/tokens.css");
  const token = (name: string) => css.match(new RegExp(`--${name}:[ ]*(#[0-9A-Fa-f]{6});`))![1];
  // 섞기 토큰은 color-mix(in srgb, var(--a) N%, var(--b)) 꼴 그대로 읽어 계산한다.
  const mixed = (name: string) => {
    const m = css.match(new RegExp(String.raw`--${name}:\s*color-mix\(in srgb, var\(--([a-z-]+)\) (\d+)%, var\(--([a-z-]+)\)\);`))!;
    return mix(token(m[1]), Number(m[2]), token(m[3]));
  };
  expect(css).toContain("--accent-fill: var(--accent);");
  expect(css).toContain("--on-accent: var(--bg-sidebar);");
  const on = token("bg-sidebar");
  for (const fill of [token("accent"), mixed("accent-fill-hover"), mixed("accent-fill-active")]) {
    expect(contrast(on, fill), fill).toBeGreaterThanOrEqual(4.5);
  }
  for (const bg of ["bg-panel-raised", "bg-node", "bg-canvas"]) expect(contrast(mixed("line-input"), token(bg)), bg).toBeGreaterThanOrEqual(3);
});

// edges.css 의 클래스만으로 된 규칙으로 opacity 를 셈한다: 맞는 규칙 가운데 클래스 수(구체성)가 높은 것, 같으면 뒤의 것이 이긴다.
function resolvedOpacity(css: string, classes: string[]): string | null {
  const top = css.replace(/\/\*[\s\S]*?\*\//g, "").replace(/@media[^{]*\{(?:[^{}]*\{[^}]*\})*[^{}]*\}/g, "");
  let best: { spec: number; order: number; value: string } | null = null;
  let order = 0;
  for (const m of top.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    order++;
    const value = m[2].match(/(?:^|;)\s*opacity:\s*([^;]+)/)?.[1].trim();
    if (!value) continue;
    for (const raw of m[1].split(",")) {
      const sel = raw.trim();
      if (!/^(\.[\w-]+)+$/.test(sel)) continue;
      const need = sel.split(".").filter(Boolean);
      if (!need.every((c) => classes.includes(c))) continue;
      if (!best || need.length > best.spec || (need.length === best.spec && order >= best.order)) best = { spec: need.length, order, value };
    }
  }
  return best?.value ?? null;
}

test("edges.css: dim, under and faded win over degraded on segments, edges and motion hosts", () => {
  const css = read("src/canvas/edges.css");
  for (const host of ["edge-seg", "edge", "edge-motion__seg"]) {
    expect(resolvedOpacity(css, [host, "edge--degraded"]), host).toBe("0.8");
    expect(resolvedOpacity(css, [host, "edge--degraded", "edge--dim"]), host).toBe("0.12");
    expect(resolvedOpacity(css, [host, "edge--dim", "edge--degraded"]), host).toBe("0.12");
    expect(resolvedOpacity(css, [host, "edge--degraded", "edge--faded"]), host).toBe("0.45");
    expect(resolvedOpacity(css, [host, "edge--degraded", "edge--under"]), host).toBe("0.12");
  }
});

test("zone name font scales with zoom and has no far override", () => {
  const css = read("src/canvas/canvas.css");
  expect(rule(css, ".group__name")).toContain("font-size: clamp(11px, calc(10px / var(--zoom, 1)), 20px);");
  expect(css).not.toMatch(/\[data-zoom="far"\]\s+\.group__name/);
});

test("zone name pill keeps its look in the layer above the edges: opaque tint, dims like its zone, no motion when reduced", () => {
  const css = read("src/canvas/canvas.css");
  const r = rule(css, ".group__name");
  for (const d of ["font-weight: 600;", "line-height: 1.5;", "padding: 0 9px;", "border-radius: 999px;", "background: color-mix(in srgb, var(--tint) 22%, var(--bg-canvas));", "color: color-mix(in srgb, var(--tint) 55%, var(--text-primary));", "text-overflow: ellipsis;", "box-sizing: border-box;", "pointer-events: auto;", "transition: opacity 0.35s ease, transform 0.4s ease;"]) expect(r, d).toContain(d);
  // 이름표 층 자체는 누르기를 받지 않는다(알약만 받는다).
  expect(rule(css, ".zone-names")).toContain("pointer-events: none;");
  // .group--dimmed 는 영역 상자와 알약 모두에 쓴다.
  expect(rule(css, ".group--dimmed")).toContain("opacity: 0.35;");
  const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
  expect(reduced).toMatch(/\.group__name \{ transition: none; \}/);
});
