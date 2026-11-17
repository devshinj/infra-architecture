import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { EdgeLayer } from "@/canvas/EdgeLayer";
import type { DisplayEdge } from "@/canvas/display";
import { labelBox, NODE_RING, tooClose } from "@/canvas/edgeLabels";
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

const lay = (edges: Layout["edges"]): Layout => ({ nodes: {}, groups: {}, edges, width: 330, height: 230, labels: [], labelBlocked: [] });
const de = (id: string, from: string, to: string, edgeKind: DisplayEdge["edgeKind"] = "request", label?: string): DisplayEdge => ({
  id, from, to, edgeKind, sourceEdgeIds: [id], ...(label ? { label } : {}),
});

const fanOutLayout = lay([
  { id: "e1", points: [{ x: 165, y: 52 }, { x: 165, y: 110 }, { x: 85, y: 110 }, { x: 85, y: 170 }] },
  { id: "e2", points: [{ x: 165, y: 52 }, { x: 165, y: 110 }, { x: 245, y: 110 }, { x: 245, y: 170 }] },
]);
const fanOutEdges = [de("e1", "alb", "w1"), de("e2", "alb", "w2")];
const base = { selectedId: null, hoverId: null, hoverLabels: true, motion: false, appearing: new Set<string>(), nodeCount: 3 };

test("a given emphasis (a selected open zone) decides which edges stay lit", () => {
  const layout = lay([
    { id: "e1", points: [{ x: 10, y: 10 }, { x: 10, y: 60 }] },
    { id: "e2", points: [{ x: 100, y: 10 }, { x: 100, y: 60 }] },
  ]);
  // 고른 영역 id 는 어느 연결의 끝도 아니지만, 넘겨받은 강조 집합대로 e1 은 밝고 e2 는 흐리다.
  render(<EdgeLayer layout={layout} edges={[de("e1", "a", "b"), de("e2", "c", "d")]} {...base} selectedId="zone" emphasis={{ nodes: new Set(["zone", "a", "b"]), edges: new Set(["e1"]) }} />);
  expect(document.querySelector('[data-edge-id="e1"]')).not.toHaveClass("edge--dim");
  expect(document.querySelector('[data-edge-id="e2"]')).toHaveClass("edge--dim");
});

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

test("clicking an edge hit path selects that edge", () => {
  const onSelect = vi.fn();
  render(<EdgeLayer layout={fanOutLayout} edges={fanOutEdges} {...base} onSelect={onSelect} />);
  fireEvent.click(document.querySelector('[data-edge-id="e2"] .edge-hit')!);
  expect(onSelect).toHaveBeenCalledWith("e2");
});

test("a selected edge keeps itself undimmed and dims the others", () => {
  render(<EdgeLayer layout={fanOutLayout} edges={fanOutEdges} {...base} selectedId="e1" />);
  expect(document.querySelector('[data-edge-id="e1"]')).toHaveClass("edge--selected");
  expect(document.querySelector('[data-edge-id="e1"]')).not.toHaveClass("edge--dim");
  expect(document.querySelector('[data-edge-id="e2"]')).toHaveClass("edge--dim");
});

test("clicking the selected edge again clears selection", () => {
  const onSelect = vi.fn();
  render(<EdgeLayer layout={fanOutLayout} edges={fanOutEdges} {...base} selectedId="e2" onSelect={onSelect} />);
  fireEvent.click(document.querySelector('[data-edge-id="e2"] .edge-hit')!);
  expect(onSelect).toHaveBeenCalledWith(null);
});

test("hoverId fades unrelated edges", () => {
  const edges = [...fanOutEdges, de("e3", "x", "y")];
  const layout = lay([...fanOutLayout.edges, { id: "e3", points: [{ x: 10, y: 10 }, { x: 10, y: 60 }] }]);
  render(<EdgeLayer layout={layout} edges={edges} {...base} hoverId="alb" />);
  expect(document.querySelector('[data-edge-id="e3"]')).toHaveClass("edge--faded");
  expect(document.querySelector('[data-edge-id="e1"]')).not.toHaveClass("edge--faded");
});

test("hoverId is ignored while something is selected", () => {
  render(<EdgeLayer layout={fanOutLayout} edges={fanOutEdges} {...base} selectedId="e1" hoverId="e2" />);
  expect(document.querySelector('[data-edge-id="e2"]')).toHaveClass("edge--dim");
  expect(document.querySelector('[data-edge-id="e2"]')).not.toHaveClass("edge--faded");
});

test("hovering an edge hit path calls onHover", () => {
  const onHover = vi.fn();
  render(<EdgeLayer layout={fanOutLayout} edges={fanOutEdges} {...base} onHover={onHover} />);
  const hit = document.querySelector('[data-edge-id="e1"] .edge-hit')!;
  fireEvent.mouseEnter(hit);
  expect(onHover).toHaveBeenLastCalledWith("e1");
  fireEvent.mouseLeave(hit);
  expect(onHover).toHaveBeenLastCalledWith(null);
});

test("appearing edges are not faded by hover", () => {
  const edges = [...fanOutEdges, de("e3", "x", "y")];
  const layout = lay([...fanOutLayout.edges, { id: "e3", points: [{ x: 10, y: 10 }, { x: 10, y: 60 }] }]);
  render(<EdgeLayer layout={layout} edges={edges} {...base} hoverId="alb" appearing={new Set(["e3"])} />);
  expect(document.querySelector('[data-edge-id="e3"]')).not.toHaveClass("edge--faded");
  expect(document.querySelector('[data-edge-id="e1"]')).not.toHaveClass("edge--faded");
});

const toD = (pts: { x: number; y: number }[]) => pts.map((p, i) => `${i ? "L" : "M"} ${p.x} ${p.y}`).join(" ");

test("selecting a node overlays each incident edge once with its own kind", () => {
  render(<EdgeLayer layout={fanOutLayout} edges={fanOutEdges} {...base} selectedId="w1" />);
  expect(document.querySelectorAll(".edge-emph")).toHaveLength(1);
  expect(document.querySelector(".edge-emph")).toHaveAttribute("data-mode", "select");
  expect(document.querySelectorAll('[data-emph-edge="e1"]')).toHaveLength(1);
  expect(document.querySelector('[data-emph-edge="e2"]')).toBeNull();
  const line = document.querySelector('[data-emph-edge="e1"] path.edge-emph__line')!;
  expect(line).toHaveClass("edge-line--request");
  expect(line.getAttribute("d")).toBe(toD(fanOutLayout.edges[0].points));
  expect(document.querySelectorAll('[data-emph-edge="e1"] path.edge-emph__glow')).toHaveLength(1);
  expect(document.querySelectorAll('[data-emph-edge="e1"] path.edge-emph__arrow')).toHaveLength(1);
  // 이어진 선의 바닥 화살표는 겹선 아래로 흐리고, 이어지지 않은 연결은 지금처럼 통째로 흐린다.
  expect(document.querySelector('[data-edge-id="e1"] .edge-arrow')).toHaveClass("edge--under");
  expect(document.querySelector('[data-edge-id="e1"]')).not.toHaveClass("edge--dim");
  expect(document.querySelector('[data-edge-id="e2"]')).toHaveClass("edge--dim");
  expect(document.querySelector('[data-edge-id="e2"] .edge-arrow')).not.toHaveClass("edge--under");
});

test("layers are ordered base, emphasis, motion, edges, then the shared-segment press targets", () => {
  render(<EdgeLayer layout={fanOutLayout} edges={fanOutEdges} {...base} selectedId="w1" onTrunkClick={vi.fn()} />);
  const svg = document.querySelector("svg.edge-layer")!;
  const order = [...svg.children].map((c) =>
    c.classList.contains("edge-base") ? "base" : c.classList.contains("edge-emph") ? "emph" : c.classList.contains("edge-motion") ? "motion" : c.classList.contains("edge") ? "edge" : c.classList.contains("edge-seg-hits") ? "hits" : "?",
  );
  expect(order).toEqual(["base", "emph", "motion", "edge", "edge", "hits"]);
});

test("no overlay without selection or hover", () => {
  render(<EdgeLayer layout={fanOutLayout} edges={fanOutEdges} {...base} />);
  expect(document.querySelectorAll(".edge-emph")).toHaveLength(0);
  expect(document.querySelectorAll(".edge--under")).toHaveLength(0);
});

test("async edge on a shared request trunk is overlaid as async", () => {
  const edges = [de("e1", "alb", "w1"), de("e2", "alb", "w2", "async")];
  render(<EdgeLayer layout={fanOutLayout} edges={edges} {...base} selectedId="e2" />);
  const line = document.querySelector('[data-emph-edge="e2"] path.edge-emph__line')!;
  expect(line).toHaveClass("edge-line--async");
  expect(line).not.toHaveClass("edge-line--request");
  expect(document.querySelector('[data-emph-edge="e2"] path.edge-emph__arrow')).toHaveClass("edge-arrow--async");
});

test("replication overlay keeps its core stripe", () => {
  const layout = lay([{ id: "r", points: [{ x: 10, y: 10 }, { x: 10, y: 80 }] }]);
  render(<EdgeLayer layout={layout} edges={[de("r", "a", "b", "replication")]} {...base} selectedId="r" />);
  const g = document.querySelector('[data-emph-edge="r"]')!;
  expect(g.querySelector("path.edge-emph__line")).toHaveClass("edge-line--replication");
  expect(g.querySelector("path.edge-line--replication-core")!.getAttribute("d")).toBe(toD(layout.edges[0].points));
});

test("junction off the selected path is dimmed", () => {
  const layout = lay([
    { id: "e1", points: [{ x: 165, y: 52 }, { x: 165, y: 110 }, { x: 85, y: 110 }, { x: 85, y: 170 }] },
    { id: "e2", points: [{ x: 165, y: 52 }, { x: 165, y: 110 }, { x: 245, y: 110 }, { x: 245, y: 140 }, { x: 225, y: 140 }, { x: 225, y: 200 }] },
    { id: "e3", points: [{ x: 165, y: 52 }, { x: 165, y: 110 }, { x: 245, y: 110 }, { x: 245, y: 140 }, { x: 265, y: 140 }, { x: 265, y: 200 }] },
  ]);
  const edges = [de("e1", "alb", "w1"), de("e2", "alb", "w2"), de("e3", "alb", "w3")];
  render(<EdgeLayer layout={layout} edges={edges} {...base} selectedId="w1" />);
  const at = (x: number, y: number) => document.querySelector(`circle[data-junction][cx="${x}"][cy="${y}"]`);
  expect(at(165, 110)).not.toBeNull();
  expect(at(245, 140)).not.toBeNull();
  expect(at(165, 110)).not.toHaveClass("edge--dim");
  expect(at(245, 140)).toHaveClass("edge--dim");
});

test("trunk under the overlay is dimmed but its motion is not", () => {
  render(<EdgeLayer layout={fanOutLayout} edges={fanOutEdges} {...base} motion selectedId="w1" />);
  const trunk = document.querySelector('g.edge-seg[data-seg-shared="true"]')!;
  expect(trunk).toHaveClass("edge--under");
  expect(trunk).not.toHaveClass("edge--dim");
  expect(trunk.querySelector("[data-motion-seg]")).toBeNull();
  const segs = [...document.querySelectorAll("[data-motion-seg]")];
  expect(segs).toHaveLength(document.querySelectorAll("g.edge-seg").length);
  for (const m of segs) {
    expect(m.parentElement).toHaveClass("edge-motion");
    expect(m).toHaveClass("edge-motion__seg");
  }
  const trunkKey = [...document.querySelectorAll("g.edge-seg")].indexOf(trunk);
  const trunkMotion = segs[trunkKey];
  expect(trunkMotion).not.toHaveClass("edge--dim");
  expect(trunkMotion).not.toHaveClass("edge--under");
  expect(trunkMotion).not.toHaveClass("edge--faded");
  // e2 만 지나는 갈래의 움직임은 바닥과 같이 흐린다.
  const e2Branch = [...document.querySelectorAll("g.edge-seg")].findIndex((s) => s.getAttribute("data-edge-ids") === "e2");
  expect(segs[e2Branch]).toHaveClass("edge--dim");
});

test("hover overlays without glow", () => {
  render(<EdgeLayer layout={fanOutLayout} edges={fanOutEdges} {...base} hoverId="w1" />);
  expect(document.querySelectorAll('.edge-emph[data-mode="hover"]')).toHaveLength(1);
  expect(document.querySelectorAll(".edge-emph__glow")).toHaveLength(0);
  expect(document.querySelectorAll("[data-emph-edge]")).toHaveLength(1);
  expect(document.querySelector('[data-emph-edge="e1"]')).not.toBeNull();
  // 호버는 겹선 아래 바닥 선을 흐리지 않고, 이어지지 않은 선만 지금처럼 0.45로 흐린다.
  expect(document.querySelectorAll("g.edge-seg.edge--under")).toHaveLength(0);
  expect(document.querySelector('[data-edge-id="e2"]')).toHaveClass("edge--faded");
});

test("selecting an original id of a merged edge overlays the display edge", () => {
  const layout = lay([{ id: "m", points: [{ x: 10, y: 10 }, { x: 10, y: 80 }] }]);
  const merged: DisplayEdge = { id: "m", from: "a", to: "b", edgeKind: "request", sourceEdgeIds: ["a", "b"] };
  render(<EdgeLayer layout={layout} edges={[merged]} {...base} selectedId="b" />);
  expect(document.querySelectorAll("[data-emph-edge]")).toHaveLength(1);
  expect(document.querySelector('[data-emph-edge="m"]')).not.toBeNull();
});

test("degraded edge is overlaid along its elbow", () => {
  const pts = [{ x: 10, y: 10 }, { x: 10, y: 50 }, { x: 90, y: 50 }, { x: 90, y: 100 }];
  const layout = lay([{ id: "d", points: pts, degraded: true }]);
  render(<EdgeLayer layout={layout} edges={[de("d", "a", "b")]} {...base} selectedId="d" />);
  expect(document.querySelector('[data-emph-edge="d"] path.edge-emph__line')!.getAttribute("d")).toBe(toD(pts));
});

test("hover sinks the incident base arrow under the overlay arrow, not its line", () => {
  render(<EdgeLayer layout={fanOutLayout} edges={fanOutEdges} {...base} hoverId="w1" />);
  expect(document.querySelector('[data-edge-id="e1"] .edge-arrow')).toHaveClass("edge--under");
  expect(document.querySelector('[data-edge-id="e2"] .edge-arrow')).not.toHaveClass("edge--under");
  expect(document.querySelectorAll("g.edge-seg.edge--under")).toHaveLength(0);
});

test("motion host of a degraded segment keeps the degraded opacity", () => {
  const layout = lay([{ id: "d", points: [{ x: 10, y: 10 }, { x: 10, y: 50 }, { x: 90, y: 50 }], degraded: true }]);
  render(<EdgeLayer layout={layout} edges={[de("d", "a", "b")]} {...base} motion />);
  const hosts = [...document.querySelectorAll("[data-motion-seg]")];
  expect(hosts.length).toBeGreaterThan(0);
  for (const h of hosts) expect(h).toHaveClass("edge--degraded");
});

// 노드 n(0,0 100×40) 오른쪽 변에서 같은 이름 셋, 다른 이름 하나가 나가고, 이어지지 않은 선에도 같은 이름이 있다.
const labelled = () => {
  const layout = lay([
    { id: "h1", points: [{ x: 100, y: 5 }, { x: 200, y: 5 }], labelAt: { x: 150, y: 5 } },
    { id: "h2", points: [{ x: 100, y: 15 }, { x: 200, y: 45 }], labelAt: { x: 150, y: 30 } },
    { id: "h3", points: [{ x: 200, y: 85 }, { x: 100, y: 25 }], labelAt: { x: 150, y: 55 } },
    { id: "s1", points: [{ x: 100, y: 35 }, { x: 200, y: 125 }], labelAt: { x: 150, y: 80 } },
    { id: "far", points: [{ x: 10, y: 150 }, { x: 10, y: 220 }], labelAt: { x: 10, y: 185 } },
  ]);
  const edges = [
    de("h1", "n", "a", "request", "HTTP"),
    de("h2", "n", "b", "request", "HTTP"),
    de("h3", "c", "n", "request", "HTTP"),
    de("s1", "n", "d", "request", "SQL"),
    de("far", "x", "y", "request", "HTTP"),
  ];
  return { layout, edges, rect: { x: 0, y: 0, width: 100, height: 40 } };
};
const labelTexts = () => [...document.querySelectorAll(".edge-label")].map((t) => t.textContent);

test("selected node shows each label text once", () => {
  const { layout, edges, rect } = labelled();
  render(<EdgeLayer layout={layout} edges={edges} {...base} hoverLabels={false} selectedId="n" selectedRect={rect} />);
  const texts = labelTexts();
  expect(new Set(texts).size).toBe(texts.length);
  expect(texts.sort()).toEqual(["HTTP ×3", "SQL"]);
  const merged = document.querySelector("text.edge-label--merged")!;
  expect(merged).toHaveTextContent("HTTP ×3");
  expect(merged.getAttribute("x")).toBe("114");
  expect(merged.getAttribute("y")).toBe("15");
  // 오른쪽 변 옆이므로 글자는 그 자리에서 바깥(오른쪽)으로 시작한다.
  expect(merged.getAttribute("data-anchor")).toBe("start");
  expect((merged as SVGTextElement).style.textAnchor).toBe("start");
  // 하나뿐인 이름은 제 선 안에서 원래 자리에 둔다.
  const sql = document.querySelector('[data-edge-id="s1"] .edge-label')!;
  expect(sql).toHaveTextContent("SQL");
  expect(sql).not.toHaveClass("edge-label--merged");
  expect(sql.getAttribute("x")).toBe("150");
  for (const id of ["h1", "h2", "h3"]) expect(document.querySelector(`[data-edge-id="${id}"] .edge-label`)).toBeNull();
});

test("hoverLabels off: labels of non-incident edges are hidden while selected", () => {
  const layout = lay([
    { id: "e1", points: [{ x: 10, y: 10 }, { x: 10, y: 80 }], labelAt: { x: 10, y: 45 } },
    { id: "e2", points: [{ x: 100, y: 10 }, { x: 100, y: 80 }], labelAt: { x: 100, y: 45 } },
  ]);
  const edges = [de("e1", "a", "b", "request", "HTTPS"), de("e2", "c", "d", "request", "HTTPS")];
  const { rerender } = render(<EdgeLayer layout={layout} edges={edges} {...base} hoverLabels={false} />);
  expect(labelTexts()).toEqual(["HTTPS", "HTTPS"]);
  rerender(<EdgeLayer layout={layout} edges={edges} {...base} hoverLabels={false} selectedId="a" selectedRect={{ x: 0, y: -30, width: 20, height: 40 }} />);
  expect(labelTexts()).toEqual(["HTTPS"]);
  expect(document.querySelector('[data-edge-id="e1"] .edge-label')).not.toBeNull();
  expect(document.querySelector('[data-edge-id="e2"] .edge-label')).toBeNull();
});

test("edge selection shows its own label unchanged", () => {
  const { layout, edges } = labelled();
  render(<EdgeLayer layout={layout} edges={edges} {...base} hoverLabels={false} selectedId="h2" />);
  expect(labelTexts()).toEqual(["HTTP"]);
  const t = document.querySelector('[data-edge-id="h2"] .edge-label')!;
  expect(t.getAttribute("x")).toBe("150");
  expect(t.getAttribute("y")).toBe("30");
  expect(document.querySelector(".edge-label--merged")).toBeNull();
});

test("hover keeps per-edge labels (no merging)", () => {
  const { layout, edges } = labelled();
  render(<EdgeLayer layout={layout} edges={edges} {...base} hoverLabels={false} hoverId="n" />);
  expect(document.querySelector(".edge-label--merged")).toBeNull();
  expect(labelTexts().filter((t) => t === "HTTP")).toHaveLength(4);
});

test("a single label moved off the node is drawn as a placed label, not in its edge", () => {
  const layout = lay([{ id: "s", points: [{ x: 150, y: 140 }, { x: 150, y: 240 }], labelAt: { x: 150, y: 145 } }]);
  const edges = [de("s", "n", "x", "request", "SQL")];
  render(<EdgeLayer layout={layout} edges={edges} {...base} hoverLabels={false} selectedId="n" selectedRect={{ x: 100, y: 100, width: 100, height: 40 }} />);
  expect(labelTexts()).toEqual(["SQL"]);
  expect(document.querySelector('[data-edge-id="s"] .edge-label')).toBeNull();
  const t = document.querySelector("text.edge-label--moved")!;
  expect(t).toHaveTextContent("SQL");
  expect(Number(t.getAttribute("y"))).toBeGreaterThan(145);
});

test("a single label at a labelAt with more than two decimals stays in its edge", () => {
  const layout = lay([{ id: "s", points: [{ x: 300, y: 20.12345 }, { x: 400, y: 20.12345 }], labelAt: { x: 350.12345, y: 20.12345 } }]);
  const edges = [de("s", "n", "x", "request", "SQL")];
  render(<EdgeLayer layout={layout} edges={edges} {...base} hoverLabels={false} selectedId="n" selectedRect={{ x: 0, y: 0, width: 100, height: 40 }} />);
  expect(document.querySelector(".edge-label--moved")).toBeNull();
  const t = document.querySelector('[data-edge-id="s"] .edge-label')!;
  expect(t).toHaveTextContent("SQL");
  expect(t.getAttribute("x")).toBe("350.12345");
});

// 흐름 단계·망 경계: 세 개의 긴 세로 연결(a→b, b→c, d→e).
const flowLayout = lay([
  { id: "e1", points: [{ x: 40, y: 10 }, { x: 40, y: 210 }], labelAt: { x: 40, y: 110 } },
  { id: "e2", points: [{ x: 160, y: 10 }, { x: 160, y: 210 }], labelAt: { x: 160, y: 110 } },
  { id: "e3", points: [{ x: 280, y: 10 }, { x: 280, y: 210 }], labelAt: { x: 280, y: 110 } },
]);
const flowEdges = [de("e1", "a", "b", "request", "HTTPS"), de("e2", "b", "c"), de("e3", "d", "e", "request", "SQL")];

test("flowSteps render edge-step-label per display edge with smallest n", () => {
  render(
    <EdgeLayer
      layout={flowLayout}
      edges={flowEdges}
      {...base}
      flowSteps={[
        { displayEdgeId: "e1", n: 3, short: "응답 받음" },
        { displayEdgeId: "e1", n: 1, short: "요청 보냄" },
        { displayEdgeId: "e2", n: 2, short: "저장" },
        { displayEdgeId: "gone", n: 4, short: "없음" },
      ]}
    />,
  );
  const labels = [...document.querySelectorAll(".edge-step-label")];
  expect(labels.map((l) => l.textContent)).toEqual(["1. 요청 보냄", "2. 저장"]);
  expect(labels.map((l) => l.getAttribute("data-step-edge"))).toEqual(["e1", "e2"]);
});

test("step edges overlaid, others dimmed", () => {
  render(<EdgeLayer layout={flowLayout} edges={flowEdges} {...base} flowSteps={[{ displayEdgeId: "e1", n: 1, short: "요청" }, { displayEdgeId: "e2", n: 2, short: "저장" }]} />);
  const emph = document.querySelector(".edge-emph");
  expect(emph).toHaveAttribute("data-mode", "select");
  expect([...emph!.querySelectorAll("[data-emph-edge]")].map((g) => g.getAttribute("data-emph-edge"))).toEqual(["e1", "e2"]);
  expect(emph!.querySelectorAll(".edge-emph__glow")).toHaveLength(2);
  expect(document.querySelector('[data-edge-id="e1"]')).not.toHaveClass("edge--dim");
  expect(document.querySelector('[data-edge-id="e2"]')).not.toHaveClass("edge--dim");
  expect(document.querySelector('[data-edge-id="e3"]')).toHaveClass("edge--dim");
});

test("normal labels hidden on step edges", () => {
  render(<EdgeLayer layout={flowLayout} edges={flowEdges} {...base} hoverLabels={false} flowSteps={[{ displayEdgeId: "e1", n: 1, short: "요청" }]} />);
  expect(document.querySelector('[data-edge-id="e1"] .edge-label')).toBeNull();
  expect(document.querySelector(".edge-step-label")).toHaveTextContent("1. 요청");
  // 흐름 밖 연결 이름은 고른 때처럼 흐린 선에 남지 않는다.
  expect(document.querySelector('[data-edge-id="e3"] .edge-label')).toBeNull();
});

test("crossing dot rendered without selection; tag only when selected or in flow", () => {
  const crossing = new Set(["e1"]);
  const { rerender } = render(<EdgeLayer layout={flowLayout} edges={flowEdges} {...base} crossing={crossing} />);
  const dots = document.querySelectorAll(".edge-boundary-dot");
  expect(dots).toHaveLength(1);
  expect(dots[0].closest("[data-edge-id]")).toHaveAttribute("data-edge-id", "e1");
  expect(dots[0]).toHaveAttribute("r", "3");
  expect(document.querySelector(".edge-boundary-tag")).toBeNull();
  // 연결과 닿지 않은 노드를 고르면 표시는 없다.
  rerender(<EdgeLayer layout={flowLayout} edges={flowEdges} {...base} crossing={crossing} selectedId="d" />);
  expect(document.querySelector(".edge-boundary-tag")).toBeNull();
  // 연결의 끝 노드를 고르면 보인다.
  rerender(<EdgeLayer layout={flowLayout} edges={flowEdges} {...base} crossing={crossing} selectedId="a" />);
  expect(document.querySelectorAll(".edge-boundary-tag")).toHaveLength(1);
  expect(document.querySelectorAll(".edge-boundary-dot")).toHaveLength(1);
  // 흐름 단계 연결이어도 보인다.
  rerender(<EdgeLayer layout={flowLayout} edges={flowEdges} {...base} crossing={crossing} flowSteps={[{ displayEdgeId: "e1", n: 1, short: "요청" }]} />);
  expect(document.querySelectorAll(".edge-boundary-tag")).toHaveLength(1);
  // 흐름에 들지 않은 경계 연결은 점만.
  rerender(<EdgeLayer layout={flowLayout} edges={flowEdges} {...base} crossing={crossing} flowSteps={[{ displayEdgeId: "e2", n: 1, short: "요청" }]} />);
  expect(document.querySelector(".edge-boundary-tag")).toBeNull();
});

test('tag shows "망 넘음", the payload as text and the direction as a drawn arrow', () => {
  const edges = [
    { ...de("e1", "a", "b"), payload: "api" as const, direction: "two_way" as const },
    { ...de("e2", "b", "c"), payload: "file" as const, direction: "one_way" as const },
    de("e3", "d", "e"),
  ];
  const { rerender } = render(<EdgeLayer layout={flowLayout} edges={edges} {...base} crossing={new Set(["e1", "e2", "e3"])} flowSteps={[1, 2, 3].map((n) => ({ displayEdgeId: `e${n}`, n, short: "단계" }))} />);
  const tag = (id: string) => document.querySelector(`.edge-boundary-tag[data-tag-edge="${id}"]`)!;
  expect(tag("e1").querySelector(".edge-boundary-tag__pill-text")).toHaveTextContent("망 넘음");
  // 화살표 글자(→ ↔)는 글꼴에 따라 ">" 처럼 보여 글자로 쓰지 않고 선으로 그린다.
  expect(tag("e1").querySelector(".edge-boundary-tag__detail")!.textContent).toBe("API");
  expect(tag("e1").querySelector(".edge-boundary-tag__dir")).toHaveAttribute("data-direction", "two_way");
  expect(tag("e2").querySelector(".edge-boundary-tag__detail")!.textContent).toBe("파일");
  expect(tag("e2").querySelector(".edge-boundary-tag__dir")).toHaveAttribute("data-direction", "one_way");
  expect(document.querySelector(".edge-boundary-tags")!.textContent).not.toMatch(/[→↔]/);
  // 전달물·방향이 없으면 알약만.
  expect(tag("e3").querySelector(".edge-boundary-tag__pill-text")).toHaveTextContent("망 넘음");
  expect(tag("e3").querySelector(".edge-boundary-tag__detail")).toBeNull();
  expect(tag("e3").querySelector(".edge-boundary-tag__dir")).toBeNull();
  // 방향만 있으면 화살표만.
  rerender(<EdgeLayer layout={flowLayout} edges={[{ ...de("e1", "a", "b"), direction: "one_way" as const }]} {...base} crossing={new Set(["e1"])} flowSteps={[{ displayEdgeId: "e1", n: 1, short: "단계" }]} />);
  expect(tag("e1").querySelector(".edge-boundary-tag__detail")).toBeNull();
  expect(tag("e1").querySelector(".edge-boundary-tag__dir")).toHaveAttribute("data-direction", "one_way");
});

test("selecting a crossing edge itself shows its boundary tag", () => {
  render(<EdgeLayer layout={flowLayout} edges={flowEdges} {...base} crossing={new Set(["e1", "e3"])} selectedId="e1" />);
  expect([...document.querySelectorAll(".edge-boundary-tag")].map((t) => t.getAttribute("data-tag-edge"))).toEqual(["e1"]);
});

test("an empty short description leaves just the number", () => {
  render(<EdgeLayer layout={flowLayout} edges={flowEdges} {...base} flowSteps={[{ displayEdgeId: "e1", n: 3, short: "" }]} />);
  expect(document.querySelector(".edge-step-label")!.textContent).toBe("3");
});

test("resting view draws layout.labels as-is: one '<name> ×N' on the first edge, no member names", () => {
  const { layout, edges } = labelled();
  layout.labels = [{ edgeIds: ["h1", "h2"], text: "HTTP ×2", x: 150, y: 5 }];
  const { rerender } = render(<EdgeLayer layout={layout} edges={edges} {...base} hoverLabels={false} />);
  const on = (id: string) => document.querySelector(`[data-edge-id="${id}"] .edge-label`);
  expect(on("h1")).toHaveTextContent("HTTP ×2");
  expect(on("h1")!.getAttribute("x")).toBe("150");
  expect(on("h1")!.getAttribute("y")).toBe("5");
  expect(on("h2")).toBeNull();
  expect(labelTexts().filter((t) => t === "HTTP ×2")).toHaveLength(1);
  // 이름을 올렸을 때만 보이게 하면 화면에는 이름이 없다.
  rerender(<EdgeLayer layout={layout} edges={edges} {...base} hoverLabels />);
  expect(labelTexts()).toEqual([]);
});

// ---- 줄기 펼치기 ----
const trunkLayout = lay([
  { id: "e1", points: [{ x: 165, y: 52 }, { x: 165, y: 110 }, { x: 85, y: 110 }, { x: 85, y: 170 }] },
  { id: "e2", points: [{ x: 165, y: 52 }, { x: 165, y: 110 }, { x: 245, y: 110 }, { x: 245, y: 170 }] },
  { id: "e3", points: [{ x: 165, y: 52 }, { x: 165, y: 110 }, { x: 165, y: 200 }] },
  { id: "e4", points: [{ x: 10, y: 10 }, { x: 10, y: 60 }] },
]);
const trunkEdges = [de("e1", "alb", "w1", "async", "하나"), de("e2", "alb", "w2", "request", "둘"), de("e3", "alb", "w3", "request", "셋"), de("e4", "x", "y")];
const trunkSel = { segKey: "k", edgeIds: ["e1", "e2", "e3"], at: { x: 165, y: 80 } };
const trunkProps = { ...base, hoverLabels: false };

test("each shared segment gets one press target, solo segments get none", () => {
  render(<EdgeLayer layout={trunkLayout} edges={trunkEdges} {...trunkProps} onTrunkClick={vi.fn()} />);
  const hits = [...document.querySelectorAll(".edge-seg-hit")];
  expect(hits).toHaveLength(1);
  expect(hits[0].getAttribute("data-seg-key")).toBeTruthy();
  expect(document.querySelectorAll(".edge-seg").length).toBeGreaterThan(1);
});

test("pressing a shared segment reports it as a trunk click and does not select", () => {
  const onTrunkClick = vi.fn();
  const onSelect = vi.fn();
  render(<EdgeLayer layout={trunkLayout} edges={trunkEdges} {...trunkProps} onTrunkClick={onTrunkClick} onSelect={onSelect} />);
  const hit = document.querySelector(".edge-seg-hit")!;
  fireEvent.click(hit);
  expect(onSelect).not.toHaveBeenCalled();
  expect(onTrunkClick).toHaveBeenCalledTimes(1);
  const c = onTrunkClick.mock.calls[0][0];
  expect(c.segKey).toBe(hit.getAttribute("data-seg-key"));
  expect([...c.edgeIds].sort()).toEqual(["e1", "e2", "e3"]);
  expect(Number.isFinite(c.at.x) && Number.isFinite(c.at.y)).toBe(true);
});

test("an expanded trunk draws one coloured overlay per edge, keeping the edge kind class", () => {
  render(<EdgeLayer layout={trunkLayout} edges={trunkEdges} {...trunkProps} trunk={trunkSel} />);
  const gs = [...document.querySelectorAll(".edge-trunk g[data-trunk-edge]")];
  expect(gs.map((g) => g.getAttribute("data-trunk-edge"))).toEqual(["e1", "e2", "e3"]);
  expect(gs.map((g) => g.getAttribute("data-trunk-color"))).toEqual(["0", "1", "2"]);
  expect(gs[0].querySelector(".edge-line--async")).not.toBeNull();
  expect(gs[1].querySelector(".edge-line--request")).not.toBeNull();
});

test("trunk tags name the far end, using the display name of a collapsed zone", () => {
  const endName = (id: string) => (id === "w2" ? "영역 B" : `N:${id}`);
  render(<EdgeLayer layout={trunkLayout} edges={trunkEdges} {...trunkProps} trunk={trunkSel} endName={endName} />);
  const tags = [...document.querySelectorAll(".edge-trunk-tag")];
  expect(tags.map((t) => t.textContent)).toEqual(["N:w1", "영역 B", "N:w3"]);
  expect(tags.map((t) => t.getAttribute("data-trunk-color"))).toEqual(["0", "1", "2"]);
});

test("a click near the destination end gets the source as far end", () => {
  render(<EdgeLayer layout={trunkLayout} edges={trunkEdges} {...trunkProps} trunk={{ ...trunkSel, at: { x: 85, y: 168 } }} endName={(id) => `N:${id}`} />);
  const tag = document.querySelector('.edge-trunk-tag[data-trunk-edge="e1"]')!;
  expect(tag.textContent).toBe("N:alb");
});

test("a trunk keeps the others dim and shows its edges' own names even with names on hover only off", () => {
  const withNames = lay(trunkLayout.edges.map((l) => ({ ...l, labelAt: l.points[1] })));
  render(<EdgeLayer layout={withNames} edges={trunkEdges} {...trunkProps} trunk={trunkSel} />);
  expect([...document.querySelectorAll(".edge-label")].map((t) => t.textContent).sort()).toEqual(["둘", "셋", "하나"]);
  expect(document.querySelector('[data-edge-id="e4"]')).toHaveClass("edge--dim");
  expect(document.querySelector('[data-edge-id="e1"]')).not.toHaveClass("edge--dim");
});

test("hovering a shared segment lights all its edges with the hover overlay, no colours or tags", () => {
  render(<EdgeLayer layout={trunkLayout} edges={trunkEdges} {...trunkProps} onTrunkClick={vi.fn()} />);
  fireEvent.mouseEnter(document.querySelector(".edge-seg-hit")!);
  const emph = document.querySelector('.edge-emph[data-mode="hover"]')!;
  expect([...emph.querySelectorAll("[data-emph-edge]")].map((g) => g.getAttribute("data-emph-edge")).sort()).toEqual(["e1", "e2", "e3"]);
  expect(document.querySelector(".edge-trunk")).toBeNull();
  expect(document.querySelector(".edge-trunk-tag")).toBeNull();
  fireEvent.mouseLeave(document.querySelector(".edge-seg-hit")!);
  expect(document.querySelector(".edge-emph")).toBeNull();
});

test("hovering a shared segment shows every edge's name without overlap, even with names on hover only; leaving hides them", () => {
  const withNames = lay(trunkLayout.edges.map((l) => ({ ...l, labelAt: { x: 165, y: 80 } })));
  const onHoverEdges = vi.fn();
  const { rerender } = render(<EdgeLayer layout={withNames} edges={trunkEdges} {...trunkProps} hoverLabels onTrunkClick={vi.fn()} onHoverEdges={onHoverEdges} />);
  expect(labelTexts()).toEqual([]);
  fireEvent.mouseEnter(document.querySelector(".edge-seg-hit")!);
  expect(labelTexts().sort()).toEqual(["둘", "셋", "하나"]);
  expect([...(onHoverEdges.mock.calls.at(-1)![0] as string[])].sort()).toEqual(["e1", "e2", "e3"]);
  const boxes = [...document.querySelectorAll(".edge-label")].map((t) => labelBox({ text: t.textContent!, x: Number(t.getAttribute("x")), y: Number(t.getAttribute("y")), anchor: "middle" }));
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) expect(tooClose(boxes[i], boxes[j])).toBe(false);
  fireEvent.mouseLeave(document.querySelector(".edge-seg-hit")!);
  expect(labelTexts()).toEqual([]);
  expect(onHoverEdges).toHaveBeenLastCalledWith(null);
  // 이름이 늘 보이는 설정에서도 같은 이름 셋이 겹치지 않게 놓인다.
  rerender(<EdgeLayer layout={withNames} edges={trunkEdges} {...trunkProps} hoverLabels={false} onTrunkClick={vi.fn()} onHoverEdges={onHoverEdges} />);
  fireEvent.mouseEnter(document.querySelector(".edge-seg-hit")!);
  const again = [...document.querySelectorAll(".edge-label")].map((t) => labelBox({ text: t.textContent!, x: Number(t.getAttribute("x")), y: Number(t.getAttribute("y")), anchor: "middle" }));
  expect(again).toHaveLength(3);
  for (let i = 0; i < again.length; i++) for (let j = i + 1; j < again.length; j++) expect(tooClose(again[i], again[j])).toBe(false);
});

test("the shared-segment hover report drops when the segment vanishes", () => {
  const onHoverEdges = vi.fn();
  const { rerender } = render(<EdgeLayer layout={trunkLayout} edges={trunkEdges} {...trunkProps} onTrunkClick={vi.fn()} onHoverEdges={onHoverEdges} />);
  fireEvent.mouseEnter(document.querySelector(".edge-seg-hit")!);
  expect(onHoverEdges).toHaveBeenLastCalledWith(expect.arrayContaining(["e1", "e2", "e3"]));
  rerender(<EdgeLayer layout={lay([trunkLayout.edges[3]])} edges={[trunkEdges[3]]} {...trunkProps} onTrunkClick={vi.fn()} onHoverEdges={onHoverEdges} />);
  expect(onHoverEdges).toHaveBeenLastCalledWith(null);
});

test("without a trunk handler there are no shared-segment hits and the edge hit selects", () => {
  const onSelect = vi.fn();
  render(<EdgeLayer layout={trunkLayout} edges={trunkEdges} {...trunkProps} onSelect={onSelect} />);
  expect(document.querySelector(".edge-seg-hit")).toBeNull();
  fireEvent.click(document.querySelector('[data-edge-id="e1"] .edge-hit')!);
  expect(onSelect).toHaveBeenCalledWith("e1");
});

test("a shared-segment hover is dropped when that segment vanishes while hovered", () => {
  const { rerender } = render(<EdgeLayer layout={trunkLayout} edges={trunkEdges} {...trunkProps} onTrunkClick={vi.fn()} />);
  fireEvent.mouseEnter(document.querySelector(".edge-seg-hit")!);
  expect(document.querySelector('.edge-emph[data-mode="hover"]')).not.toBeNull();
  rerender(<EdgeLayer layout={lay([trunkLayout.edges[3]])} edges={[trunkEdges[3]]} {...trunkProps} onTrunkClick={vi.fn()} />);
  expect(document.querySelector(".edge-emph")).toBeNull();
});

test("flow view ignores the trunk and has no shared-segment hits", () => {
  render(
    <EdgeLayer layout={trunkLayout} edges={trunkEdges} {...trunkProps} onTrunkClick={vi.fn()} trunk={trunkSel} flowSteps={[{ displayEdgeId: "e4", n: 1, short: "x" }]} />,
  );
  expect(document.querySelector(".edge-seg-hit")).toBeNull();
  expect(document.querySelector(".edge-trunk")).toBeNull();
  expect(document.querySelector(".edge-trunk-tag")).toBeNull();
});

test("a trunk with vanished edges draws only the survivors and keeps their colours", () => {
  render(<EdgeLayer layout={trunkLayout} edges={trunkEdges} {...trunkProps} trunk={{ ...trunkSel, edgeIds: ["e1", "gone", "e3"] }} />);
  const gs = [...document.querySelectorAll(".edge-trunk g[data-trunk-edge]")];
  expect(gs.map((g) => [g.getAttribute("data-trunk-edge"), g.getAttribute("data-trunk-color")])).toEqual([["e1", "0"], ["e3", "2"]]);
  expect([...document.querySelectorAll(".edge-trunk-tag")].map((t) => t.getAttribute("data-trunk-color"))).toEqual(["0", "2"]);
});

test("trunk names whose raw spots coincide are placed apart from each other and from node rings", () => {
  const rect = { id: "alb", x: 140, y: 20, width: 50, height: 32 };
  const stacked: Layout = {
    ...lay(trunkLayout.edges.slice(0, 3).map((l) => ({ ...l, labelAt: { x: 165, y: 80 } }))),
    nodes: { alb: rect as Layout["nodes"][string] },
  };
  render(<EdgeLayer layout={stacked} edges={trunkEdges.slice(0, 3)} {...trunkProps} trunk={trunkSel} />);
  const texts = [...document.querySelectorAll("text.edge-label")];
  expect(texts).toHaveLength(3);
  const boxes = texts.map((t) => labelBox({ text: t.textContent!, x: Number(t.getAttribute("x")), y: Number(t.getAttribute("y")), anchor: "middle" }));
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) expect(tooClose(boxes[i], boxes[j]), `${i}-${j}`).toBe(false);
    const ring = { x1: rect.x - NODE_RING, y1: rect.y - NODE_RING, x2: rect.x + rect.width + NODE_RING, y2: rect.y + rect.height + NODE_RING };
    const b = boxes[i];
    expect(b.x1 < ring.x2 && ring.x1 < b.x2 && b.y1 < ring.y2 && ring.y1 < b.y2).toBe(false);
  }
});

test("boundary dot dodges the merged resting label text, not the bare edge label", () => {
  const points = [{ x: 0, y: 50 }, { x: 400, y: 50 }];
  const at = { x: 200, y: 50 };
  const layout: Layout = { ...lay([{ id: "e1", points, labelAt: at }]), labels: [{ edgeIds: ["e1", "e2", "e3"], text: "NFS ×3", x: at.x, y: at.y }] };
  render(<EdgeLayer layout={layout} edges={[de("e1", "a", "b", "request", "NFS")]} {...base} crossing={new Set(["e1"])} />);
  const dot = document.querySelector(".edge-boundary-dot")!;
  const cx = Number(dot.getAttribute("cx"));
  const cy = Number(dot.getAttribute("cy"));
  const name = labelBox({ text: "NFS ×3", x: at.x, y: at.y, anchor: "middle" });
  const gapX = Math.max(name.x1 - (cx + 3), cx - 3 - name.x2);
  expect(Math.max(gapX, name.y1 - (cy + 3), cy - 3 - name.y2)).toBeGreaterThanOrEqual(0);
});
