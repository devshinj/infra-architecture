import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";

import { canvasAriaLabels } from "@/canvas/ariaLabels";

const KEYS = [
  "controls.ariaLabel", "controls.fitView.ariaLabel", "controls.interactive.ariaLabel", "controls.zoomIn.ariaLabel", "controls.zoomOut.ariaLabel",
  "edge.a11yDescription.default", "handle.ariaLabel", "minimap.ariaLabel",
  "node.a11yDescription.ariaLiveMessage", "node.a11yDescription.default", "node.a11yDescription.keyboardDisabled",
];

test("canvasAriaLabels replaces every React Flow default label with Korean text", () => {
  for (const edit of [false, true]) {
    const cfg = canvasAriaLabels(edit);
    // React Flow 12.12 의 기본 안내 키 전부(@xyflow/system defaultAriaLabelConfig).
    expect(Object.keys(cfg).sort()).toEqual(KEYS);
    for (const [k, v] of Object.entries(cfg)) {
      const text = typeof v === "function" ? v({ direction: "left", x: 10, y: 20 }) : v;
      // 키 이름(Enter·Space·Esc·Shift) 말고는 영어 낱말이 없다.
      expect(text.replace(/Enter|Space|Esc|Shift/g, ""), k).not.toMatch(/[A-Za-z]{2,}/);
    }
  }
  expect(canvasAriaLabels(false)["node.a11yDescription.keyboardDisabled"]).not.toContain("화살표");
  expect(canvasAriaLabels(true)["node.a11yDescription.keyboardDisabled"]).toContain("화살표");
  const live = canvasAriaLabels(true)["node.a11yDescription.ariaLiveMessage"]!;
  expect(live({ direction: "up", x: 5, y: 7 })).toBe("선택한 노드를 위(으)로 옮겼습니다. 새 위치 x 5, y 7.");
});

test("node and zone wrappers show a focus-visible ring from --focus-ring that is at least 3:1 on the canvas", () => {
  const css = readFileSync(join(process.cwd(), "src/canvas/canvas.css"), "utf8");
  expect(css).toContain(".canvas__flow .react-flow__node[data-id]:focus-visible { outline: 1.5px solid var(--focus-ring); outline-offset: 2px; }");
  const tokens = readFileSync(join(process.cwd(), "src/styles/tokens.css"), "utf8");
  const hex = (n: string) => tokens.match(new RegExp(`--${n}:[ ]*(#[0-9A-Fa-f]{6});`))![1];
  const lum = (h: string) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const ratio = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  for (const bg of ["bg-canvas", "bg-node"]) expect(ratio(hex("focus-ring"), hex(bg)), bg).toBeGreaterThanOrEqual(3);
});
