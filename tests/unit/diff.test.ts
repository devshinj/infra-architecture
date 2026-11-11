import { describe, expect, test } from "vitest";

import { applyCommands } from "@/domain/apply";
import { parseCommand, type Command } from "@/domain/commands";
import { commandsBetween, diffStates } from "@/domain/diff";
import { emptyState, type DiagramState } from "@/domain/types";

import { fx } from "../fixtures/spike";

const base = () =>
  applyCommands(emptyState(), [
    { op: "add_group", id: "vpc", group_kind: "vpc", label: "VPC", parent: null },
    { op: "add_node", id: "was-1", kind: "was", label: "WAS#1", parent: "vpc" },
    { op: "add_node", id: "db", kind: "db_rdb", label: "DB", parent: "vpc" },
    { op: "add_edge", from: "was-1", to: "db", edge_kind: "request", label: "JDBC" },
  ] as Command[]).state;

test("diff detects added/removed/changed", () => {
  const a = base();
  const b = applyCommands(a, [
    { op: "update_node", id: "was-1", label: "WAS-1" },
    { op: "add_node", id: "r", kind: "cache", label: "Redis", parent: null },
  ]).state;
  const d = diffStates(a, b);
  expect([...d.added]).toEqual(["r"]);
  expect([...d.changed]).toEqual(["was-1"]);
  expect(d.removed.size).toBe(0);
  expect([...diffStates(b, a).removed]).toEqual(["r"]);
});

test("diff detects removed edges via node removal; identical states are empty", () => {
  const a = base();
  const b = applyCommands(a, [{ op: "remove_node", id: "db" }]).state;
  expect([...diffStates(a, b).removed].sort()).toEqual(["db", "e-was-1-db"]);
  const same = diffStates(a, base());
  expect(same.added.size + same.removed.size + same.changed.size).toBe(0);
});

describe("commandsBetween", () => {
  // 비교는 구성(영역·노드·연결·가정 값)만. 망연계 표시·모름 표시·망 종류의 출처는 다루지 않는다.
  const shape = (s: DiagramState) => ({
    groups: Object.fromEntries(Object.values(s.groups).map((g) => [g.id, { kind: g.groupKind, label: g.label, parent: g.parent, net: g.netType?.key ?? null }])),
    nodes: Object.fromEntries(Object.values(s.nodes).map((n) => [n.id, { kind: n.kind, label: n.label, sub: n.sub, parent: n.parent, attrs: Object.fromEntries(Object.entries(n.attrs ?? {}).filter(([, v]) => v !== null)) }])),
    edges: Object.fromEntries(Object.values(s.edges).map((e) => [e.id, { from: e.from, to: e.to, kind: e.edgeKind, label: e.label, payload: e.payload, direction: e.direction }])),
    assumptions: Object.fromEntries(Object.entries(s.assumptions ?? {}).map(([k, v]) => [k, v.value])),
  });

  /** 실제 대화 차례처럼 샘플을 고친다: 영역 하나 더하고 노드를 옮기고, 속성·연결을 바꾸고, 노드 하나와 빈 영역을 지운다. */
  const edited = (s: DiagramState): DiagramState => {
    const nodes = Object.values(s.nodes);
    const edges = Object.values(s.edges);
    const [first, second] = nodes;
    const lastNode = nodes.at(-1)!;
    const cmds: Command[] = [
      { op: "add_group", id: "new-zone", group_kind: "network_zone", label: "새 망", parent: null },
      { op: "set_zone_type", id: "new-zone", type: "internet" },
      { op: "add_node", id: "new-fw", kind: "firewall", label: "새 방화벽", parent: "new-zone" },
      { op: "update_node", id: first!.id, parent: "new-zone", attrs: { ram: "64GB" } },
      { op: "add_edge", id: "e-new", from: "new-fw", to: second!.id, edge_kind: "request", label: "HTTPS 443" },
      ...(edges[0] ? [{ op: "update_edge", id: edges[0].id, label: "바뀐 이름" } as Command] : []),
      { op: "remove_node", id: lastNode.id },
      { op: "set_assumption", key: "scale", value: "크게" },
    ];
    const r = applyCommands(s, cmds);
    expect(r.errors).toEqual([]);
    return r.state;
  };

  test("applying the commands to a gives b (empty ↔ samples, and edited samples)", () => {
    const ids = ["s1", "s2", "s3", "s4", "s5"];
    const pairs: [DiagramState, DiagramState][] = [
      ...ids.map((id) => [emptyState(), fx(id)] as [DiagramState, DiagramState]),
      ...ids.map((id) => [fx(id), emptyState()] as [DiagramState, DiagramState]),
      ...ids.map((id) => [fx(id), edited(fx(id))] as [DiagramState, DiagramState]),
      ...ids.map((id) => [edited(fx(id)), fx(id)] as [DiagramState, DiagramState]),
    ];
    for (const [a, b] of pairs) {
      const cmds = commandsBetween(a, b);
      for (const c of cmds) expect(parseCommand(c).ok).toBe(true);
      const r = applyCommands(a, cmds);
      expect(r.errors ?? []).toEqual([]);
      // 가정은 지우는 명령이 없어 b 에 있는 것만 맞춘다. 영역 이름·상위는 바꾸는 명령이 없어 양쪽에 있는 영역은 a 것을 기대한다.
      const got = shape(r.state);
      const want = shape(b);
      for (const [id, g] of Object.entries(want.groups)) {
        const before = a.groups[id];
        if (before) want.groups[id] = { ...g, label: before.label, parent: before.parent };
      }
      got.assumptions = Object.fromEntries(Object.keys(want.assumptions).map((k) => [k, got.assumptions[k]]));
      expect(got).toEqual(want);
    }
  });

  test("nothing changed gives no commands; attr removal is sent as null; zone type key changes", () => {
    const s1 = fx("s1");
    expect(commandsBetween(s1, s1)).toEqual([]);
    const n = Object.values(s1.nodes).find((x) => Object.keys(x.attrs).length > 0)!;
    const [k] = Object.keys(n.attrs);
    const dropped: DiagramState = { ...s1, nodes: { ...s1.nodes, [n.id]: { ...n, attrs: Object.fromEntries(Object.entries(n.attrs).filter(([x]) => x !== k)) } } };
    expect(commandsBetween(s1, dropped)).toEqual([{ op: "update_node", id: n.id, attrs: { [k!]: null } }]);
  });
});
