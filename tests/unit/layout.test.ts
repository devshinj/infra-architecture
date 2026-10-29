import { expect, test } from "vitest";

import { buildDisplayGraph, defaultDisplayOptions } from "@/canvas/display";
import { elbowRoute } from "@/canvas/elbow";
import { layoutDiagram, type Layout, type Rect } from "@/canvas/layout";
import { findOverlaps } from "@/canvas/overlap";
import { textWidth, truncate } from "@/canvas/text";
import { applyCommand, applyCommands } from "@/domain/apply";
import type { DiagramState } from "@/domain/types";
import { emptyState } from "@/domain/types";
import { fx, isInExternal } from "../fixtures/spike";

const lay = (st: DiagramState, pinned: Record<string, { x: number; y: number }> = {}): Promise<Layout> =>
  layoutDiagram(buildDisplayGraph(st, defaultDisplayOptions(st)), pinned);

const rectOf = (l: Layout, id: string): Rect => l.nodes[id] ?? l.groups[id];

function onBorder(p: { x: number; y: number }, r: Rect, tol = 1): boolean {
  const insideX = p.x >= r.x - tol && p.x <= r.x + r.width + tol;
  const insideY = p.y >= r.y - tol && p.y <= r.y + r.height + tol;
  const nearV = Math.abs(p.x - r.x) <= tol || Math.abs(p.x - (r.x + r.width)) <= tol;
  const nearH = Math.abs(p.y - r.y) <= tol || Math.abs(p.y - (r.y + r.height)) <= tol;
  return (insideY && nearV) || (insideX && nearH);
}

test.each(["s1", "s2", "s3", "s4", "s5"])("spike %s lays out with zero overlaps", async (id) => {
  const l = await lay(fx(id));
  expect(findOverlaps(l)).toEqual([]);
});

test("external service groups sit right of the main flow", async () => {
  const st = fx("s1");
  const l = await lay(st);
  const ext = Object.values(st.groups)
    .filter((g) => g.groupKind === "external_service")
    .map((g) => l.groups[g.id]);
  expect(ext.length).toBeGreaterThan(0);
  const mainRight = Math.max(
    ...Object.values(st.nodes)
      .filter((n) => !isInExternal(st, n.id))
      .map((n) => l.nodes[n.id].x + l.nodes[n.id].width),
  );
  expect(ext.every((g) => g.x >= mainRight)).toBe(true);
});

test("flow goes top→down: client above fw above web above was above db (s2)", async () => {
  const l = await lay(fx("s2"));
  const y = (id: string) => l.nodes[id].y;
  expect(y("client-web")).toBeLessThan(y("fw-external"));
  expect(y("fw-external")).toBeLessThan(y("web-1"));
  expect(y("web-1")).toBeLessThan(y("was-1"));
  expect(y("was-1")).toBeLessThan(y("db-primary"));
});

test("redundancy group children sit side by side", async () => {
  const l = await lay(fx("s2"));
  expect(l.nodes["was-1"].y).toBe(l.nodes["was-2"].y);
  expect(l.nodes["was-1"].x).not.toBe(l.nodes["was-2"].x);
});

test.each(["s1", "s2", "s3", "s4", "s5"])("edge points are absolute: every edge starts on its source rect border (%s)", async (id) => {
  const st = fx(id);
  const g = buildDisplayGraph(st, defaultDisplayOptions(st));
  const l = await layoutDiagram(g, {});
  expect(l.edges.length).toBe(g.edges.length);
  const byId = new Map(g.edges.map((e) => [e.id, e]));
  for (const e of l.edges) {
    const de = byId.get(e.id)!;
    expect(e.points.length).toBeGreaterThanOrEqual(2);
    const first = e.points[0];
    const last = e.points[e.points.length - 1];
    expect(onBorder(first, rectOf(l, de.from)), `${e.id} start ${JSON.stringify(first)}`).toBe(true);
    expect(onBorder(last, rectOf(l, de.to)), `${e.id} end ${JSON.stringify(last)}`).toBe(true);
    for (let i = 1; i < e.points.length; i++) {
      const [p, q] = [e.points[i - 1], e.points[i]];
      expect(Math.abs(p.x - q.x) < 0.5 || Math.abs(p.y - q.y) < 0.5, `${e.id} segment ${i} not orthogonal`).toBe(true);
    }
  }
});

test("main flow stays top→down when an external lane is present (s1)", async () => {
  const l = await lay(fx("s1"));
  const y = (id: string) => l.nodes[id].y;
  expect(y("client-web")).toBeLessThan(y("cdn"));
  expect(y("cdn")).toBeLessThan(y("lb-l7"));
  expect(y("lb-l7")).toBeLessThan(y("k8s-ingress"));
  expect(y("k8s-ingress")).toBeLessThan(y("was-1"));
});

test.each(["s1", "s2", "s3", "s4", "s5"])("no edge runs horizontally through a group name band (%s)", async (id) => {
  const l = await lay(fx(id));
  const bad: string[] = [];
  for (const e of l.edges) {
    for (let i = 1; i < e.points.length; i++) {
      const [p, q] = [e.points[i - 1], e.points[i]];
      if (Math.abs(p.y - q.y) > 0.5) continue;
      const [x1, x2] = [Math.min(p.x, q.x), Math.max(p.x, q.x)];
      for (const g of Object.values(l.groups)) {
        if (p.y > g.y + 0.5 && p.y < g.y + 30 - 0.5 && x1 < g.x + g.width && x2 > g.x) bad.push(`${e.id}×${g.id}@${p.y}`);
      }
    }
  }
  expect(bad).toEqual([]);
});

test("redundancy members connected by an edge still sit in one row (s2 db-pair)", async () => {
  const st = fx("s2");
  const l = await lay(st);
  const p = l.nodes["db-primary"];
  const s = l.nodes["db-standby"];
  expect(p.y).toBe(s.y);
  const e = Object.values(st.edges).find(
    (x) => (x.from === "db-primary" && x.to === "db-standby") || (x.from === "db-standby" && x.to === "db-primary"),
  )!;
  const pts = l.edges.find((x) => x.id === e.id)!.points;
  expect(pts).toHaveLength(2);
  const from = l.nodes[e.from];
  const to = l.nodes[e.to];
  const cy = p.y + p.height / 2;
  const fromSide = from.x < to.x ? from.x + from.width : from.x;
  const toSide = from.x < to.x ? to.x : to.x + to.width;
  expect(pts).toEqual([{ x: fromSide, y: cy }, { x: toSide, y: cy }]);
});

test("redundancy members sit in one row (s4 aurora-cluster)", async () => {
  const l = await lay(fx("s4"));
  const ys = ["aurora-writer", "aurora-reader-1", "aurora-reader-2"].map((id) => l.nodes[id].y);
  expect(new Set(ys).size).toBe(1);
});

test("long labels truncate without overlap", async () => {
  const st = applyCommands(fx("s2"), [
    { op: "update_node", id: "was-1", label: "주문결제통합처리애플리케이션서버첫번째인스턴스입니다" },
  ]).state;
  const l = await lay(st);
  expect(l.nodes["was-1"].width).toBe(220);
  expect(l.nodes["was-1"].displayLabel.endsWith("…")).toBe(true);
  expect(findOverlaps(l)).toEqual([]);
});

test("empty state and empty group", async () => {
  expect((await lay(emptyState())).edges).toEqual([]);
  const g = applyCommand(emptyState(), { op: "add_group", id: "vpc", group_kind: "vpc", label: "VPC", parent: null }).state;
  const l = await lay(g);
  expect(l.groups.vpc).toMatchObject({ width: 160, height: 56 });
});

test("collapsed group renders as a 160×56 box", async () => {
  const st = fx("s2");
  const opts = { ...defaultDisplayOptions(st), collapsed: new Set(["was-pair"]) };
  const l = await layoutDiagram(buildDisplayGraph(st, opts), {});
  expect(l.groups["was-pair"]).toMatchObject({ width: 160, height: 56 });
  expect(l.nodes["was-1"]).toBeUndefined();
  expect(findOverlaps(l)).toEqual([]);
});

test("pinned node keeps its position and gets an elbow edge", async () => {
  const l = await lay(fx("s2"), { "was-1": { x: 900, y: 900 } });
  const was = l.nodes["was-1"];
  expect({ x: was.x, y: was.y }).toEqual({ x: 900, y: 900 });
  const st = fx("s2");
  const g = buildDisplayGraph(st, defaultDisplayOptions(st));
  const touching = g.edges.filter((e) => e.from === "was-1" || e.to === "was-1");
  expect(touching.length).toBeGreaterThan(0);
  for (const de of touching) {
    const e = l.edges.find((x) => x.id === de.id)!;
    expect(e.points).toEqual(elbowRoute(rectOf(l, de.from), rectOf(l, de.to)));
  }
  expect(l.width).toBeGreaterThanOrEqual(900 + was.width);
  expect(l.height).toBeGreaterThanOrEqual(900 + was.height);
});

test("elbow route: below, above, side", () => {
  const a = { x: 0, y: 0, width: 100, height: 40 };
  expect(elbowRoute(a, { x: 200, y: 100, width: 100, height: 40 })).toEqual([
    { x: 50, y: 40 }, { x: 50, y: 70 }, { x: 250, y: 70 }, { x: 250, y: 100 },
  ]);
  expect(elbowRoute(a, { x: 200, y: -100, width: 100, height: 40 })).toEqual([
    { x: 50, y: 0 }, { x: 50, y: -30 }, { x: 250, y: -30 }, { x: 250, y: -60 },
  ]);
  expect(elbowRoute(a, { x: 200, y: 10, width: 100, height: 40 })).toEqual([
    { x: 100, y: 20 }, { x: 150, y: 20 }, { x: 150, y: 30 }, { x: 200, y: 30 },
  ]);
  expect(elbowRoute(a, { x: -300, y: 10, width: 100, height: 40 })).toEqual([
    { x: 0, y: 20 }, { x: -100, y: 20 }, { x: -100, y: 30 }, { x: -200, y: 30 },
  ]);
});

test("findOverlaps detects each kind of collision", () => {
  const base = (): Layout => ({
    nodes: {
      a: { id: "a", parent: "g", x: 20, y: 40, width: 132, height: 44, displayLabel: "a" },
    },
    groups: { g: { id: "g", parent: null, x: 0, y: 0, width: 300, height: 200 } },
    edges: [],
    width: 300,
    height: 200,
  });
  expect(findOverlaps(base())).toEqual([]);

  const nodes = base();
  nodes.nodes.b = { id: "b", parent: "g", x: 155, y: 40, width: 132, height: 44, displayLabel: "b" };
  expect(findOverlaps(nodes)).toContain("a×b");

  const header = base();
  header.nodes.a.y = 20;
  expect(findOverlaps(header)).toContain("a×g");

  const border = base();
  border.groups.h = { id: "h", parent: null, x: 100, y: 300, width: 200, height: 100 };
  border.nodes.a.y = 280;
  border.groups.g.height = 400;
  expect(findOverlaps(border)).toContain("a×h");

  const badge = base();
  // d sits 6px right of a: rings off isolates the badge circle at a's top-right corner.
  badge.nodes.d = { id: "d", parent: "g", x: 158, y: 40, width: 60, height: 44, displayLabel: "d" };
  expect(findOverlaps(badge, { ring: 0, badge: 8 })).toContain("a×d");
  expect(findOverlaps(badge, { ring: 0, badge: 0 })).not.toContain("a×d");
});

test("text helpers", () => {
  expect(textWidth("가나", 12)).toBe(24);
  expect(textWidth("ab", 10)).toBeCloseTo(11.6);
  expect(truncate("가나다라마", 40, 12)).toBe("가나…");
  expect(truncate("가나", 40, 12)).toBe("가나");
});
