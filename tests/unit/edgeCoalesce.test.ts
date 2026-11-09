import { expect, test } from "vitest";

import { applyCommand, applyCommands } from "@/domain/apply";
import type { Command } from "@/domain/commands";
import { createEdgeCoalescer } from "@/domain/edgeCoalesce";
import { emptyState, type DiagramState } from "@/domain/types";

/** 노드 a·b·c 와 연결 e1(a→b, 라벨 HTTP)·e2(b→c) 가 있는 구성도. */
const base = (): DiagramState =>
  applyCommands(emptyState(), [
    { op: "add_node", id: "a", kind: "was", label: "a", parent: null },
    { op: "add_node", id: "b", kind: "was", label: "b", parent: null },
    { op: "add_node", id: "c", kind: "was", label: "c", parent: null },
    { op: "add_edge", id: "e1", from: "a", to: "b", edge_kind: "request", label: "HTTP" },
    { op: "add_edge", id: "e2", from: "b", to: "c", edge_kind: "request" },
  ]).state;

/** 파이프라인처럼 명령을 하나씩 넣고, 돌려받은 명령을 적용한 뒤 끝에 flush 한다. */
function run(cmds: Command[], start = base()) {
  const c = createEdgeCoalescer();
  let state = start;
  const out: Command[] = [];
  const take = (cmd: Command) => {
    out.push(cmd);
    const r = applyCommand(state, cmd);
    if (r.ok) state = r.state;
  };
  for (const cmd of cmds) for (const x of c.push(cmd, state)) take(x);
  for (const x of c.flush(state)) take(x);
  return { out, state, coalescer: c };
}

const removeE1: Command = { op: "remove_edge", id: "e1" };
const addAB = (extra: Partial<Extract<Command, { op: "add_edge" }>> = {}): Command => ({
  op: "add_edge",
  id: "e9",
  from: "a",
  to: "b",
  edge_kind: "request",
  label: "HTTP",
  ...extra,
});

test("같은 두 노드 사이를 지웠다 다시 만들면 아무 명령도 내지 않는다", () => {
  const { out, state } = run([removeE1, addAB()]);
  expect(out).toEqual([]);
  expect(Object.keys(state.edges).sort()).toEqual(["e1", "e2"]);
});

test("다시 만든 연결이 다른 값을 적으면 원래 연결에 그 값만 고친다", () => {
  const { out, state } = run([removeE1, addAB({ label: "HTTPS 443" })]);
  expect(out).toEqual([{ op: "update_edge", id: "e1", label: "HTTPS 443" }]);
  expect(state.edges.e1).toMatchObject({ from: "a", to: "b", label: "HTTPS 443" });
  expect(state.edges.e9).toBeUndefined();
});

test("다시 만든 연결이 적지 않은 값은 원래 것을 둔다(전달물·방향·종류 비교)", () => {
  const { out } = run([removeE1, addAB({ label: undefined, payload: "api", direction: "one_way", edge_kind: "async" })]);
  expect(out).toEqual([{ op: "update_edge", id: "e1", edge_kind: "async", payload: "api", direction: "one_way" }]);
});

test("방향이 반대면 짝짓지 않는다: 지우기는 끝에 내고 새 연결은 그대로", () => {
  const { out, state } = run([removeE1, { op: "add_edge", id: "e9", from: "b", to: "a", edge_kind: "request" }]);
  expect(out).toEqual([{ op: "add_edge", id: "e9", from: "b", to: "a", edge_kind: "request" }, removeE1]);
  expect(Object.keys(state.edges).sort()).toEqual(["e2", "e9"]);
});

test("없는 연결 지우기는 그대로 돌려준다(적용할 수 없는 명령으로 건너뛰게)", () => {
  const c = createEdgeCoalescer();
  const cmd: Command = { op: "remove_edge", id: "nope" };
  expect(c.push(cmd, base())).toEqual([cmd]);
  expect(c.pending()).toBe(0);
});

test("짝지은 뒤 새 id 를 가리키는 연결 고치기·흐름 단계는 원래 id 로 바꾼다", () => {
  const c = createEdgeCoalescer();
  const s = base();
  c.push(removeE1, s);
  c.push(addAB(), s);
  expect(c.push({ op: "update_edge", id: "e9", label: "TCP" }, s)).toEqual([{ op: "update_edge", id: "e1", label: "TCP" }]);
  const flow: Command = {
    op: "update_flow",
    id: "order",
    steps: [
      { edge: "e9", from: "a", short: "요청", text: "요청한다" },
      { edge: "e2", from: "b", short: "저장", text: "저장한다" },
    ],
  };
  expect(c.mapFlow(flow as Extract<Command, { op: "update_flow" }>)).toEqual({
    ...flow,
    steps: [
      { edge: "e1", from: "a", short: "요청", text: "요청한다" },
      { edge: "e2", from: "b", short: "저장", text: "저장한다" },
    ],
  });
  // 바꿀 것이 없으면 같은 명령을 돌려준다.
  const plain = { op: "remove_flow", id: "order" } as const;
  expect(c.mapFlow(plain)).toBe(plain);
});

test("id 없이 다시 만들면 그때 받았을 자동 id 를 원래 id 로 바꾼다", () => {
  const c = createEdgeCoalescer();
  const s = base();
  c.push(removeE1, s);
  expect(c.push(addAB({ id: undefined }), s)).toEqual([]);
  expect(c.push({ op: "update_edge", id: "e-a-b", label: "TCP" }, s)).toEqual([{ op: "update_edge", id: "e1", label: "TCP" }]);
});

test("미뤄 둔 지우기의 id 로 다른 두 노드 사이 연결을 만들면 지우기를 먼저 낸다", () => {
  const add: Command = { op: "add_edge", id: "e1", from: "a", to: "c", edge_kind: "request" };
  const { out, state } = run([removeE1, add]);
  expect(out).toEqual([removeE1, add]);
  expect(state.edges.e1).toMatchObject({ from: "a", to: "c" });
});

test("미뤄 둔 연결을 고치거나 다시 지우면 지우기를 먼저 낸다(원래처럼 뒤 명령은 실패)", () => {
  const upd: Command = { op: "update_edge", id: "e1", label: "TCP" };
  expect(run([removeE1, upd]).out).toEqual([removeE1, upd]);
  expect(run([removeE1, removeE1]).out).toEqual([removeE1, removeE1]);
});

test("flush 는 남은 지우기를 원래 순서로 내고, 그사이 사라진 연결은 조용히 버린다", () => {
  const c = createEdgeCoalescer();
  let s = base();
  expect(c.push({ op: "remove_edge", id: "e2" }, s)).toEqual([]);
  expect(c.push(removeE1, s)).toEqual([]);
  expect(c.pending()).toBe(2);
  expect(c.flush(s)).toEqual([{ op: "remove_edge", id: "e2" }, removeE1]);
  expect(c.pending()).toBe(0);
  expect(c.flush(s)).toEqual([]);

  c.push(removeE1, s);
  s = applyCommand(s, { op: "remove_node", id: "a" }).state; // e1 도 함께 사라진다
  expect(c.flush(s)).toEqual([]);
});

test("여러 지우기가 같은 두 노드면 가장 먼저 지운 것과 짝짓는다", () => {
  const s = applyCommand(base(), { op: "add_edge", id: "e3", from: "a", to: "b", edge_kind: "async" }).state;
  const { out, state } = run([{ op: "remove_edge", id: "e3" }, removeE1, addAB({ edge_kind: "async", label: undefined })], s);
  expect(out).toEqual([removeE1]);
  expect(Object.keys(state.edges).sort()).toEqual(["e2", "e3"]);
});

test("망연계 끼우기(A→B 지우고 A→망연계·망연계→B)는 그대로: 지우기는 끝에 낸다", () => {
  const cmds: Command[] = [
    removeE1,
    { op: "add_node", id: "link-1", kind: "network_link", label: "망연계", parent: null, guess: true },
    { op: "add_edge", id: "e-a-link", from: "a", to: "link-1", edge_kind: "request" },
    { op: "add_edge", id: "e-link-b", from: "link-1", to: "b", edge_kind: "request" },
  ];
  const { out, state } = run(cmds);
  expect(out).toEqual([...cmds.slice(1), removeE1]);
  expect(Object.keys(state.edges).sort()).toEqual(["e-a-link", "e-link-b", "e2"]);
});
