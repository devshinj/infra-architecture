import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { EdgeLayer } from "@/canvas/EdgeLayer";
import type { DisplayEdge } from "@/canvas/display";
import type { Layout } from "@/canvas/layout";
import * as motion from "@/canvas/motion";

vi.mock("@/canvas/motion", () => ({ startBundleMotion: vi.fn(() => vi.fn()) }));

const start = vi.mocked(motion.startBundleMotion);

beforeEach(() => {
  start.mockClear();
  // @ts-expect-error jsdom has no matchMedia unless a test installs one
  delete window.matchMedia;
});
afterEach(cleanup);

const mockMatchMedia = (matches: boolean) =>
  ((q: string) => ({ matches, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} })) as unknown as typeof window.matchMedia;

const lay = (edges: Layout["edges"]): Layout => ({ nodes: {}, groups: {}, edges, width: 330, height: 230 });
const de = (id: string, from: string, to: string, edgeKind: DisplayEdge["edgeKind"] = "request", label?: string): DisplayEdge => ({
  id, from, to, edgeKind, sourceEdgeIds: [id], ...(label ? { label } : {}),
});

const fanOutLayout = lay([
  { id: "e1", points: [{ x: 165, y: 52 }, { x: 165, y: 110 }, { x: 85, y: 110 }, { x: 85, y: 170 }] },
  { id: "e2", points: [{ x: 165, y: 52 }, { x: 165, y: 110 }, { x: 245, y: 110 }, { x: 245, y: 170 }] },
]);
const fanOutEdges = [de("e1", "alb", "w1"), de("e2", "alb", "w2")];
const base = { selectedId: null, hoverLabels: true, motion: false, appearing: new Set<string>(), nodeCount: 3 };

test("shared trunk path is rendered once", () => {
  render(<EdgeLayer layout={fanOutLayout} edges={fanOutEdges} {...base} />);
  expect(document.querySelectorAll('[data-seg-shared="true"]')).toHaveLength(1);
  expect(document.querySelectorAll("[data-junction]")).toHaveLength(1);
});

test("unrelated edges dim when a node is selected", () => {
  const layout = lay([
    { id: "e1", points: [{ x: 10, y: 10 }, { x: 10, y: 60 }] },
    { id: "e2", points: [{ x: 100, y: 10 }, { x: 100, y: 60 }] },
  ]);
  render(<EdgeLayer layout={layout} edges={[de("e1", "a", "b"), de("e2", "c", "d")]} {...base} selectedId="a" />);
  expect(document.querySelector('[data-edge-id="e1"]')).not.toHaveClass("edge--dim");
  expect(document.querySelector('[data-edge-id="e2"]')).toHaveClass("edge--dim");
  expect([...document.querySelectorAll(".edge-seg")].filter((s) => s.classList.contains("edge--dim"))).toHaveLength(1);
});

test("reduced motion starts no animations", () => {
  window.matchMedia = mockMatchMedia(true);
  render(<EdgeLayer layout={fanOutLayout} edges={fanOutEdges} {...base} motion />);
  expect(start).not.toHaveBeenCalled();
});

test("motion starts per bundle and stops on unmount", () => {
  const stop = vi.fn();
  start.mockReturnValue(stop);
  const { unmount } = render(<EdgeLayer layout={fanOutLayout} edges={fanOutEdges} {...base} motion />);
  expect(start).toHaveBeenCalledTimes(1);
  expect(start.mock.calls[0][2]).toBe("comet");
  unmount();
  expect(stop).toHaveBeenCalledTimes(1);
});

test("over 40 nodes only bundles touching the selection animate", () => {
  const layout = lay([
    { id: "e1", points: [{ x: 10, y: 10 }, { x: 10, y: 60 }] },
    { id: "e2", points: [{ x: 100, y: 10 }, { x: 100, y: 60 }] },
  ]);
  const edges = [de("e1", "a", "b"), de("e2", "c", "d")];
  render(<EdgeLayer layout={layout} edges={edges} {...base} motion nodeCount={41} selectedId={null} />);
  expect(start).not.toHaveBeenCalled();
  cleanup();
  render(<EdgeLayer layout={layout} edges={edges} {...base} motion nodeCount={41} selectedId="a" />);
  expect(start).toHaveBeenCalledTimes(1);
});

test("replication renders as double line", () => {
  const layout = lay([{ id: "r", points: [{ x: 10, y: 10 }, { x: 10, y: 80 }] }]);
  render(<EdgeLayer layout={layout} edges={[de("r", "a", "b", "replication")]} {...base} />);
  const paths = [...document.querySelectorAll(".edge-seg path.edge-line")];
  expect(paths).toHaveLength(2);
  expect(paths[0].getAttribute("d")).toBe(paths[1].getAttribute("d"));
  expect((paths[1] as SVGPathElement).style.stroke).toBe("var(--bg-canvas)");
});

test("each edge gets an open chevron arrowhead at its end", () => {
  render(<EdgeLayer layout={fanOutLayout} edges={fanOutEdges} {...base} />);
  const heads = document.querySelectorAll("path.edge-arrow");
  expect(heads).toHaveLength(2);
  // vertical line going down ends at (85,170); chevron points back up, tip at the end
  expect(heads[0].getAttribute("d")).toMatch(/L85,170 /);
});

test("labels: hover-only when hoverLabels, always for selected-incident edges", () => {
  const layout = lay([{ id: "e1", points: [{ x: 10, y: 10 }, { x: 10, y: 80 }], labelAt: { x: 10, y: 45 } }]);
  const edges = [de("e1", "a", "b", "request", "HTTPS")];
  const { rerender } = render(<EdgeLayer layout={layout} edges={edges} {...base} />);
  expect(document.body).not.toHaveTextContent("HTTPS");
  fireEvent.mouseEnter(document.querySelector('[data-edge-id="e1"] .edge-hit')!);
  expect(document.body).toHaveTextContent("HTTPS");
  fireEvent.mouseLeave(document.querySelector('[data-edge-id="e1"] .edge-hit')!);
  expect(document.body).not.toHaveTextContent("HTTPS");
  rerender(<EdgeLayer layout={layout} edges={edges} {...base} selectedId="a" />);
  expect(document.body).toHaveTextContent("HTTPS");
  rerender(<EdgeLayer layout={layout} edges={edges} {...base} hoverLabels={false} />);
  expect(document.body).toHaveTextContent("HTTPS");
});

test("appearing edges get the draw-in class", () => {
  render(<EdgeLayer layout={fanOutLayout} edges={fanOutEdges} {...base} appearing={new Set(["e1"])} />);
  expect(document.querySelectorAll(".edge-line--appear").length).toBeGreaterThan(0);
});

test("equal-but-new arrays and a selection change do not restart motion", () => {
  const stop = vi.fn();
  start.mockReturnValue(stop);
  const clone = () => ({
    layout: lay(fanOutLayout.edges.map((e) => ({ ...e, points: e.points.map((p) => ({ ...p })) }))),
    edges: fanOutEdges.map((e) => ({ ...e })),
  });
  const a = clone();
  const { rerender } = render(<EdgeLayer layout={a.layout} edges={a.edges} {...base} motion />);
  expect(start).toHaveBeenCalledTimes(1);
  const b = clone();
  rerender(<EdgeLayer layout={b.layout} edges={b.edges} {...base} motion selectedId="alb" />);
  expect(start).toHaveBeenCalledTimes(1);
  expect(stop).not.toHaveBeenCalled();
});
