import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";

import {
  decodeSvgDataUrl,
  diagramBounds,
  edgeLabels,
  EXPORT_PADDING,
  exportFileName,
  exportFrame,
  keepInExport,
  LIGHT_BACKGROUND,
  LIGHT_TOKENS,
  MAX_EXPORT_SIDE,
  sanitizeFileName,
} from "@/canvas/exportImage";
import type { DisplayEdge } from "@/canvas/display";
import type { Layout } from "@/canvas/layout";

test("sanitizeFileName replaces filesystem-unsafe characters and trims", () => {
  expect(sanitizeFileName('a/b\\c:d*e?f"g<h>i|j')).toBe("a_b_c_d_e_f_g_h_i_j");
  expect(sanitizeFileName("  쇼핑몰\t운영 \n")).toBe("쇼핑몰 운영");
  expect(sanitizeFileName("이름\u0000\u001f끝")).toBe("이름__끝");
  expect(sanitizeFileName("...숨김.")).toBe("숨김");
  expect(sanitizeFileName("CON")).toBe("_CON");
  expect(sanitizeFileName("")).toBe("");
  // 글자(코드 포인트) 단위로 100자에서 자른다(한글·이모지가 반쪽 나지 않게).
  const long = "가".repeat(150);
  expect(Array.from(sanitizeFileName(long))).toHaveLength(100);
  expect(Array.from(sanitizeFileName("😀".repeat(120)))).toHaveLength(100);
});

test("exportFileName is <project>-<diagram>.<ext> with sensible fallbacks", () => {
  expect(exportFileName("쇼핑몰", "운영", "png")).toBe("쇼핑몰-운영.png");
  expect(exportFileName("A/B", "새 구성도", "svg")).toBe("A_B-새 구성도.svg");
  expect(exportFileName(undefined, "운영", "png")).toBe("운영.png");
  expect(exportFileName("쇼핑몰", "  ", "svg")).toBe("쇼핑몰.svg");
  expect(exportFileName("", "", "png")).toBe("InfraSketch-구성도.png");
  expect(exportFileName("???", undefined, "png")).toBe("___.png");
});

const layout = (over: Partial<Layout> = {}): Layout => ({
  nodes: { a: { id: "a", x: 100, y: 50, width: 140, height: 52 } as Layout["nodes"][string] },
  groups: { g: { id: "g", x: 80, y: 20, width: 300, height: 200 } as Layout["groups"][string] },
  edges: [],
  width: 400,
  height: 300,
  ...over,
});

test("diagramBounds unions nodes, groups, edge bends and label anchors", () => {
  expect(diagramBounds(layout())).toEqual({ x: 80, y: 20, width: 300, height: 200 });
  const withEdge = layout({ edges: [{ id: "e", points: [{ x: 10, y: 60 }, { x: 500, y: 60 }], labelAt: { x: 250, y: 400 } }] });
  expect(diagramBounds(withEdge)).toEqual({ x: 10, y: 20, width: 490, height: 380 });
  expect(diagramBounds({ nodes: {}, groups: {}, edges: [] })).toBeNull();
});

test("exportFrame pads the whole diagram at zoom 1 and maps its corner to the padding", () => {
  const f = exportFrame({ x: 80, y: 20, width: 300, height: 200 });
  expect(f).toEqual({ width: 300 + 2 * EXPORT_PADDING, height: 200 + 2 * EXPORT_PADDING, x: EXPORT_PADDING - 80, y: EXPORT_PADDING - 20, zoom: 1 });
  // 음수 좌표(고정 위치를 왼쪽 위로 끈 노드)도 여백 안으로 들어온다.
  const neg = exportFrame({ x: -50, y: -10, width: 100, height: 100 }, 20);
  expect(neg.x).toBe(70);
  expect(neg.y).toBe(30);
});

test("exportFrame scales a huge diagram down so the longest side fits the cap", () => {
  const f = exportFrame({ x: 0, y: 0, width: 12_000, height: 3_000 });
  expect(f.zoom).toBeCloseTo(MAX_EXPORT_SIDE / (12_000 + 2 * EXPORT_PADDING));
  expect(f.width).toBeLessThanOrEqual(MAX_EXPORT_SIDE);
  expect(f.height).toBeLessThan(f.width);
  expect(f.x).toBeCloseTo(EXPORT_PADDING * f.zoom);
  // 작은 구성도는 키우지 않는다.
  expect(exportFrame({ x: 0, y: 0, width: 10, height: 10 }).zoom).toBe(1);
});

test("edgeLabels lists every named edge that is drawn, hover-only or not", () => {
  const edges: DisplayEdge[] = [
    { id: "e1", from: "a", to: "b", edgeKind: "request", label: "HTTPS", sourceEdgeIds: ["e1"] },
    { id: "e2", from: "a", to: "c", edgeKind: "async", sourceEdgeIds: ["e2"] },
    { id: "e3", from: "b", to: "c", edgeKind: "request", label: "숨김", sourceEdgeIds: ["e3"] },
  ];
  const l = layout({
    edges: [
      { id: "e1", points: [{ x: 0, y: 0 }, { x: 0, y: 10 }], labelAt: { x: 0, y: 5 } },
      { id: "e2", points: [{ x: 0, y: 0 }, { x: 0, y: 10 }] },
      { id: "e4", points: [{ x: 0, y: 0 }, { x: 0, y: 10 }], labelAt: { x: 1, y: 1 } },
    ],
  });
  expect(edgeLabels(l, edges)).toEqual([{ id: "e1", label: "HTTPS", x: 0, y: 5 }]);
});

test("keepInExport drops screen chrome and keeps diagram content", () => {
  const el = (...classes: string[]) => ({ classList: { contains: (c: string) => classes.includes(c) } });
  for (const c of ["name-tooltip", "node__badge", "group__toggle", "motion-path", "motion-capsule", "edge-hit", "react-flow__minimap", "react-flow__controls", "react-flow__handle"]) {
    expect(keepInExport(el(c)), c).toBe(false);
  }
  for (const c of ["node", "group", "edge-line", "edge-label", "react-flow__node"]) expect(keepInExport(el(c)), c).toBe(true);
  expect(keepInExport({ nodeType: 3 })).toBe(true);
  expect(keepInExport(null)).toBe(true);
});

test("decodeSvgDataUrl turns html-to-image's data URL back into SVG text", () => {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg"><text>웹 서버 #1</text></svg>';
  expect(decodeSvgDataUrl(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`)).toBe(svg);
  const b64 = Buffer.from(svg, "utf8").toString("base64");
  expect(decodeSvgDataUrl(`data:image/svg+xml;base64,${b64}`)).toBe(svg);
});

// ---- 흰 바탕 색 ----
const tokensCss = readFileSync(join(process.cwd(), "src/styles/tokens.css"), "utf8");
const colorTokens = [...tokensCss.matchAll(/(--[a-z0-9-]+):\s*(#[0-9A-Fa-f]{3,8}|rgba?\([^)]*\))\s*;/g)].map((m) => m[1]);

test("LIGHT_TOKENS overrides every color token in tokens.css and nothing else", () => {
  expect(colorTokens.length).toBeGreaterThan(30);
  expect(Object.keys(LIGHT_TOKENS).sort()).toEqual([...new Set(colorTokens)].sort());
  for (const [k, v] of Object.entries(LIGHT_TOKENS)) expect(v, k).toMatch(/^(#[0-9A-F]{6}|rgba\(\d+, \d+, \d+, [\d.]+\))$/);
  expect(LIGHT_TOKENS["--bg-canvas"]).toBe(LIGHT_BACKGROUND);
});

// WCAG 2 상대 휘도 대비와 sRGB 섞기(color-mix in srgb 와 같다). tokens.test.ts 와 같은 계산.
function contrast(a: string, b: string): number {
  const lum = (hex: string) => {
    const [r, g, bl] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
function mix(a: string, pct: number, b: string): string {
  const ch = (h: string, i: number) => parseInt(h.slice(i, i + 2), 16);
  return "#" + [1, 3, 5].map((i) => Math.round((ch(a, i) * pct) / 100 + (ch(b, i) * (100 - pct)) / 100).toString(16).padStart(2, "0")).join("");
}
const L = (name: string) => LIGHT_TOKENS[`--${name}`]!;

test("light palette keeps node text, zone tags, labels and counts readable (4.5:1)", () => {
  const white = L("bg-canvas");
  for (const fg of ["text-primary", "text-secondary"]) {
    expect(contrast(L(fg), white), `${fg} on white`).toBeGreaterThanOrEqual(4.5);
    expect(contrast(L(fg), L("bg-node")), `${fg} on bg-node`).toBeGreaterThanOrEqual(4.5);
  }
  // 영역 이름표(canvas.css .group__name)와 영역 안 글자(옅은 칠 7% 위의 보조 글자).
  for (const k of Object.keys(LIGHT_TOKENS).filter((t) => t.startsWith("--zone-tint-"))) {
    const tint = LIGHT_TOKENS[k]!;
    expect(contrast(mix(tint, 55, L("text-primary")), mix(tint, 22, white)), `${k} tag`).toBeGreaterThanOrEqual(4.5);
    expect(contrast(L("text-secondary"), mix(tint, 7, white)), `${k} fill`).toBeGreaterThanOrEqual(4.5);
  }
});

test("light palette keeps edge strokes, icons and zone borders visible on white (3:1 / 1.6:1)", () => {
  const white = L("bg-canvas");
  for (const e of ["edge-request", "edge-async", "edge-replication", "edge-aux", "accent"]) {
    expect(contrast(L(e), white), e).toBeGreaterThanOrEqual(3);
  }
  for (const c of ["client", "network", "compute", "data", "external"]) {
    const cat = L(`cat-${c}`);
    // 아이콘(분류 색)은 옅은 색조 원(canvas.css .node__icon) 위에 그린다.
    expect(contrast(cat, mix(cat, 26, L("bg-node"))), `cat-${c}`).toBeGreaterThanOrEqual(3);
    // 노드 테두리(분류 색 38% + 테두리 색)는 흰 바탕과 구분된다.
    expect(contrast(mix(cat, 38, L("line-node")), white), `node border ${c}`).toBeGreaterThanOrEqual(1.6);
  }
  for (const k of Object.keys(LIGHT_TOKENS).filter((t) => t.startsWith("--zone-tint-"))) {
    expect(contrast(mix(LIGHT_TOKENS[k]!, 45, L("line-node")), white), `${k} border`).toBeGreaterThanOrEqual(1.6);
  }
});
