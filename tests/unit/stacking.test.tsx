import "@testing-library/jest-dom/vitest";
import { cleanup, render, waitFor } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeAll, expect, test, vi } from "vitest";

import { Canvas, type CanvasOptions, type CanvasProps } from "@/canvas/Canvas";
import { defaultDisplayOptions } from "@/canvas/display";
import type { Layout } from "@/canvas/layout";
import { EDGE_Z, NODE_Z, ZONE_NAME_IN_PORTAL_Z, ZONE_Z_MAX, zoneZ } from "@/canvas/stacking";
import type { DiagramState } from "@/domain/types";

import { synth } from "../fixtures/spike";

beforeAll(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  class DM { m22 = 1; }
  vi.stubGlobal("DOMMatrixReadOnly", DM);
  vi.stubGlobal("DOMMatrix", DM);
});
afterEach(cleanup);

const g = (id: string, parent: string | null) => ({ id, parent, x: 0, y: 0, width: 10, height: 10 });

test("zoneZ counts outer zones and stops below the edge layer", () => {
  const groups: Layout["groups"] = { a: g("a", null), b: g("b", "a"), c: g("c", "b") };
  expect([zoneZ(groups, "a"), zoneZ(groups, "b"), zoneZ(groups, "c")]).toEqual([0, 1, 2]);
  const deep: Layout["groups"] = {};
  for (let i = 0; i < 12; i++) deep[`z${i}`] = g(`z${i}`, i === 0 ? null : `z${i - 1}`);
  expect(zoneZ(deep, "z11")).toBe(ZONE_Z_MAX);
  // 잘못 이어진 고리에서도 끝난다.
  expect(zoneZ({ x: g("x", "y"), y: g("y", "x") }, "x")).toBeLessThanOrEqual(ZONE_Z_MAX);
  expect(ZONE_Z_MAX).toBeLessThan(EDGE_Z);
  expect(EDGE_Z).toBeLessThan(NODE_Z);
});

test("the edge layer sits between zones and nodes, also in the export clone (unscoped rule)", () => {
  const css = readFileSync(join(process.cwd(), "src/canvas/canvas.css"), "utf8");
  expect(css).toMatch(new RegExp(`^\\.react-flow__viewport-portal \\{ z-index: ${EDGE_Z}; \\}$`, "m"));
});

test("an inner zone's wrapper is stacked above its outer zone, and nodes above every zone", async () => {
  const state: DiagramState = synth(2);
  const options: CanvasOptions = { ...defaultDisplayOptions(state), hoverLabels: true, showMissingBadges: false };
  const props: CanvasProps = {
    state, pinned: {}, editMode: false, options, motion: false,
    onOptionsChange: vi.fn(), onSelect: vi.fn(), onPinnedChange: vi.fn(), onAutoArrange: vi.fn(), onEditModeChange: vi.fn(), onMotionChange: vi.fn(),
  };
  const { container } = render(<div style={{ width: 800, height: 600 }}><Canvas {...props} /></div>);
  const z = (id: string) => Number((container.querySelector(`.react-flow__node[data-id="${id}"]`) as HTMLElement).style.zIndex);
  await waitFor(() => expect(container.querySelector('.react-flow__node[data-id="sub"]')).not.toBeNull());
  expect(z("vpc")).toBe(0);
  expect(z("sub")).toBe(1);
  expect(z("app-0")).toBe(NODE_Z);
});

test("the zone-name layer sits above the edge layer and below nodes", async () => {
  // 이름표 층은 연결선 층과 같은 viewport-portal(EDGE_Z, 노드 NODE_Z 아래) 안에서 연결선 그림 위에 놓인다.
  const css = readFileSync(join(process.cwd(), "src/canvas/edges.css"), "utf8");
  // 연결선 그림(.edge-layer)은 portal 안에서 z-index 를 갖지 않는다(이름표 층보다 아래).
  expect(css.match(/^\.edge-layer \{[^}]*\}/m)?.[0]).not.toMatch(/z-index/);

  const state: DiagramState = synth(2);
  const options: CanvasOptions = { ...defaultDisplayOptions(state), hoverLabels: true, showMissingBadges: false };
  const props: CanvasProps = {
    state, pinned: {}, editMode: false, options, motion: false,
    onOptionsChange: vi.fn(), onSelect: vi.fn(), onPinnedChange: vi.fn(), onAutoArrange: vi.fn(), onEditModeChange: vi.fn(), onMotionChange: vi.fn(),
  };
  const { container } = render(<div style={{ width: 800, height: 600 }}><Canvas {...props} /></div>);
  await waitFor(() => expect(container.querySelector(".zone-names")).not.toBeNull());
  const layer = container.querySelector<HTMLElement>(".zone-names")!;
  const edges = container.querySelector(".edge-layer")!;
  expect(layer.parentElement).toBe(edges.parentElement);
  expect(layer.parentElement).toHaveClass("react-flow__viewport-portal");
  expect(layer.style.zIndex).toBe(String(ZONE_NAME_IN_PORTAL_Z));
  expect(Number(layer.style.zIndex)).toBeGreaterThan(0);
  expect(edges.getAttribute("style") ?? "").not.toMatch(/z-index/);
  expect(layer.style.position).toBe("absolute");
});
