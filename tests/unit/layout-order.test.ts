import { expect, test } from "vitest";

import { buildDisplayGraph, defaultDisplayOptions, type DisplayGraph } from "@/canvas/display";
import { crossings, layoutDiagram, numberedClasses, type Layout } from "@/canvas/layout";
import { applyCommands } from "@/domain/apply";
import { emptyState } from "@/domain/types";
import { fx } from "../fixtures/spike";

/** 끝점이 아닌 노드를 가로지르는 연결 토막: "연결id|노드id". */
function crossingsOf(g: DisplayGraph, l: Layout): Set<string> {
  const rects = new Map(Object.entries(l.nodes).map(([id, r]) => [id, { x: r.x, y: r.y, width: r.width, height: r.height }]));
  const ends = new Map(g.edges.map((e) => [e.id, [e.from, e.to] as [string, string]]));
  const edges = new Map(l.edges.filter((e) => !e.degraded).map((e) => [e.id, e.points]));
  return crossings(rects, ends, edges);
}

const f5Fixture = () => {
  const { state } = applyCommands(emptyState(), [
    { op: "add_group", id: "vpc", group_kind: "vpc", label: "VPC", parent: null },
    { op: "add_node", id: "lb", kind: "lb_l4", label: "L4", parent: "vpc" },
    { op: "add_group", id: "pool", group_kind: "redundancy_group", label: "웹 서버 VIP", parent: "vpc" },
    { op: "add_node", id: "web-3", kind: "web_server", label: "웹 서버 #3", parent: "pool" },
    { op: "add_node", id: "web-1", kind: "web_server", label: "웹 서버 #1", parent: "pool" },
    { op: "add_node", id: "web-2", kind: "web_server", label: "웹 서버 #2", parent: "pool" },
    { op: "add_node", id: "web-4", kind: "web_server", label: "웹 서버 #4", parent: "pool" },
    { op: "add_node", id: "was", kind: "was", label: "WAS", parent: "vpc" },
    { op: "add_edge", from: "lb", to: "web-3", edge_kind: "request" },
    { op: "add_edge", from: "lb", to: "web-1", edge_kind: "request" },
    { op: "add_edge", from: "lb", to: "web-2", edge_kind: "request" },
    { op: "add_edge", from: "lb", to: "web-4", edge_kind: "request" },
    { op: "add_edge", from: "web-3", to: "was", edge_kind: "request" },
    { op: "add_edge", from: "web-1", to: "was", edge_kind: "request" },
    { op: "add_edge", from: "web-2", to: "was", edge_kind: "request" },
  ]);
  return state;
};

test.each(["s1", "s2", "s3", "s4", "s5"])("no edge segment crosses a non-endpoint node (%s)", async (id) => {
  const st = fx(id);
  const g = buildDisplayGraph(st, defaultDisplayOptions(st));
  expect([...crossingsOf(g, await layoutDiagram(g, {}))]).toEqual([]);
});

test("no edge segment crosses a non-endpoint node (F5 fixture), and the row is ordered", async () => {
  const st = f5Fixture();
  const g = buildDisplayGraph(st, defaultDisplayOptions(st));
  const l = await layoutDiagram(g, {});
  expect([...crossingsOf(g, l)]).toEqual([]);
  const xs = ["web-1", "web-2", "web-3", "web-4"].map((id) => l.nodes[id]!.x);
  expect([...xs].sort((a, b) => a - b)).toEqual(xs);
});

test("numberedClasses groups only same-prefix trailing numbers", () => {
  const items = ["Aurora Writer", "Aurora Reader 2", "Aurora Reader 1", "웹 서버 #3", "웹 서버 1", "API 2", "주 DB", "대기 DB"].map((label, i) => ({ id: `n${i}`, label }));
  expect(numberedClasses(items)).toEqual([["n2", "n1"], ["n4", "n3"]]);
});

test("a mixed group keeps Writer in place while Reader 1 comes before Reader 2", async () => {
  const { state, errors } = applyCommands(emptyState(), [
    { op: "add_group", id: "vpc", group_kind: "vpc", label: "VPC", parent: null },
    { op: "add_node", id: "app", kind: "was", label: "WAS", parent: "vpc" },
    { op: "add_group", id: "aurora", group_kind: "redundancy_group", label: "Aurora", parent: "vpc" },
    { op: "add_node", id: "w", kind: "db_rdb", label: "Aurora Writer", parent: "aurora" },
    { op: "add_node", id: "r2", kind: "db_rdb", label: "Aurora Reader 2", parent: "aurora" },
    { op: "add_node", id: "r1", kind: "db_rdb", label: "Aurora Reader 1", parent: "aurora" },
    { op: "add_edge", from: "app", to: "w", edge_kind: "request" },
    { op: "add_edge", from: "app", to: "r2", edge_kind: "request" },
    { op: "add_edge", from: "app", to: "r1", edge_kind: "request" },
  ]);
  expect(errors).toEqual([]);
  const g = buildDisplayGraph(state, defaultDisplayOptions(state));
  const off = await layoutDiagram(g, {}, { reorder: false });
  const on = await layoutDiagram(g, {});
  // Writer 는 자리를 바꾸지 않는다. Reader 1 이 Reader 2 보다 왼쪽이다.
  expect(on.nodes.w!.x).toBe(off.nodes.w!.x);
  expect(on.nodes.r1!.x).toBeLessThan(on.nodes.r2!.x);
  expect([...crossingsOf(g, on)].every((k) => crossingsOf(g, off).has(k))).toBe(true);
});

// 고정 시드의 임의 구성도 50개. 그래프는 미리(동기로, 싸게) 다 만들어 두고, 비싼 ELK 배치는 구성도마다
// 따로 시험한다. 예전에는 50개 × 배치 2번을 한 시험에 몰아 5초 기본 제한의 60% 넘게 썼고, 기계가 바쁘면 넘겼다.
function randomDiagrams(count: number): DisplayGraph[] {
  let seed = 7;
  const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  const pick = <T,>(a: T[]): T => a[Math.floor(rnd() * a.length)]!;
  const out: DisplayGraph[] = [];
  for (let t = 0; t < count; t++) {
    const g: DisplayGraph = { groups: {}, nodes: {}, edges: [] } as unknown as DisplayGraph;
    const grp = (id: string, kind: string, parent: string | null) => ((g.groups as Record<string, unknown>)[id] = { id, groupKind: kind, label: id, parent, collapsed: false, hiddenCount: 0 });
    const nd = (id: string, kind: string, parent: string | null, label: string) => ((g.nodes as Record<string, unknown>)[id] = { id, kind, label, parent, attrs: {} });
    grp("vpc", "vpc", null);
    grp("sub", "subnet_private", "vpc");
    grp("pool", pick(["redundancy_group", "redundancy_group", "k8s_cluster"]), "sub");
    const n = 2 + Math.floor(rnd() * 5);
    const idx = Array.from({ length: n }, (_, i) => i + 1).sort(() => rnd() - 0.5);
    nd("lb", "lb_l4", "vpc", "L4");
    nd("lb2", "lb_l7", "sub", "L7");
    nd("was", "was", "sub", "WAS");
    nd("db", "db_rdb", "vpc", "DB");
    nd("cache", "cache", "sub", "Redis");
    nd("mon", "monitoring", null, "모니터링");
    for (const i of idx) nd(`m${i}`, "web_server", "pool", `웹 서버 #${i}${rnd() < 0.3 ? " 긴 이름 덧붙임" : ""}`);
    const seen = new Set<string>();
    const add = (f: string, to: string) => {
      const id = `e-${f}-${to}`;
      if (f === to || seen.has(id)) return;
      seen.add(id);
      g.edges.push({ id, from: f, to, edgeKind: "request", sourceEdgeIds: [] } as never);
    };
    for (const i of idx) {
      if (rnd() < 0.8) add(pick(["lb", "lb2", "mon"]), `m${i}`);
      if (rnd() < 0.6) add(`m${i}`, pick(["was", "db", "cache"]));
    }
    const outside = ["lb", "lb2", "was", "db", "cache", "mon"];
    for (let k = 0; k < 4; k++) add(pick(outside), pick(outside));
    out.push(g);
  }
  return out;
}

const RANDOM = randomDiagrams(50);

// 이름 순서로 자리를 바꿔도 노드를 가로지르는 연결이 새로 생기지 않는다.
test.each(RANDOM.map((g, t) => [t, g] as const))(
  "random VPC > subnet > group diagram %i: reordering adds no edge-through-node crossing",
  async (_t, g) => {
    const off = await layoutDiagram(g, {}, { reorder: false });
    const on = await layoutDiagram(g, {});
    const before = crossingsOf(g, off);
    expect([...crossingsOf(g, on)].filter((k) => !before.has(k))).toEqual([]);
  },
);

// 아무 것도 안 바꿔서 통과하는 시험이 되지 않게, 일부는 실제로 바뀐다(처음 바뀌는 것을 찾으면 멈춘다).
test("random diagrams: reordering actually moves nodes in some of them", async () => {
  let moved = -1;
  for (const [t, g] of RANDOM.entries()) {
    const off = await layoutDiagram(g, {}, { reorder: false });
    const on = await layoutDiagram(g, {});
    if (Object.keys(on.nodes).some((id) => on.nodes[id]!.x !== off.nodes[id]!.x)) {
      moved = t;
      break;
    }
  }
  expect(moved).toBeGreaterThanOrEqual(0);
});
