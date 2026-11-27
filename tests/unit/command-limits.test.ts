import { expect, test } from "vitest";

import { applyCommand, STATE_LIMITS } from "@/domain/apply";
import { commandSchema, TEXT_LIMITS, type Command } from "@/domain/commands";
import { emptyState, type DiagramState } from "@/domain/types";

const ok = (c: unknown) => commandSchema.safeParse(c).success;
const node = (over: Record<string, unknown> = {}) => ({ op: "add_node", id: "n1", kind: "web_server", label: "웹 서버", parent: null, ...over });

test("이름·보조 글·속성에 길이 상한이 있다(한도까지는 받는다)", () => {
  expect(ok(node({ label: "가".repeat(TEXT_LIMITS.label) }))).toBe(true);
  expect(ok(node({ label: "가".repeat(TEXT_LIMITS.label + 1) }))).toBe(false);
  expect(ok(node({ sub: "a".repeat(TEXT_LIMITS.sub + 1) }))).toBe(false);
  expect(ok(node({ attrs: { cpu: "a".repeat(TEXT_LIMITS.attrValue) } }))).toBe(true);
  expect(ok(node({ attrs: { cpu: "a".repeat(TEXT_LIMITS.attrValue + 1) } }))).toBe(false);
  expect(ok(node({ attrs: { ["k".repeat(TEXT_LIMITS.attrKey + 1)]: "v" } }))).toBe(false);
  const many = Object.fromEntries(Array.from({ length: TEXT_LIMITS.attrCount + 1 }, (_, i) => [`k${i}`, "v"]));
  expect(ok(node({ attrs: many }))).toBe(false);

  expect(ok({ op: "add_group", id: "g1", group_kind: "vpc", label: "가".repeat(TEXT_LIMITS.label + 1), parent: null })).toBe(false);
  expect(ok({ op: "update_node", id: "n1", label: "가".repeat(TEXT_LIMITS.label + 1) })).toBe(false);
  expect(ok({ op: "add_edge", from: "a", to: "b", edge_kind: "request", label: "a".repeat(TEXT_LIMITS.label + 1) })).toBe(false);
  expect(ok({ op: "update_edge", id: "e1", label: "a".repeat(TEXT_LIMITS.label + 1) })).toBe(false);
  expect(ok({ op: "set_assumption", key: "k".repeat(TEXT_LIMITS.assumptionKey + 1), value: "v" })).toBe(false);
  expect(ok({ op: "set_assumption", key: "k", value: "v".repeat(TEXT_LIMITS.assumptionValue + 1) })).toBe(false);
});

function fill(count: { nodes?: number; groups?: number; edges?: number }): DiagramState {
  const state = emptyState();
  for (let i = 0; i < (count.groups ?? 0); i++) state.groups[`g${i}`] = { id: `g${i}`, groupKind: "vpc", label: "영역", parent: null };
  for (let i = 0; i < (count.nodes ?? 0); i++) state.nodes[`n${i}`] = { id: `n${i}`, kind: "web_server", label: "웹", parent: null, attrs: {} };
  for (let i = 0; i < (count.edges ?? 0); i++) state.edges[`e${i}`] = { id: `e${i}`, from: "n0", to: "n1", edgeKind: "request" };
  return state;
}
const parse = (c: unknown) => commandSchema.parse(c) as Command;

test("구성도 하나의 노드·영역·연결 수에 상한이 있다", () => {
  const full = fill({ nodes: STATE_LIMITS.nodes });
  expect(applyCommand(full, parse(node({ id: "extra" })))).toMatchObject({ ok: false, error: expect.stringContaining("node limit") });
  const almost = fill({ nodes: STATE_LIMITS.nodes - 1 });
  expect(applyCommand(almost, parse(node({ id: "extra" }))).ok).toBe(true);

  const groups = fill({ groups: STATE_LIMITS.groups });
  expect(applyCommand(groups, parse({ op: "add_group", id: "extra", group_kind: "vpc", label: "영역", parent: null }))).toMatchObject({ ok: false, error: expect.stringContaining("group limit") });

  const edges = fill({ nodes: 2, edges: STATE_LIMITS.edges });
  expect(applyCommand(edges, parse({ op: "add_edge", from: "n0", to: "n1", edge_kind: "request" }))).toMatchObject({ ok: false, error: expect.stringContaining("edge limit") });
  // 고치고 지우는 일은 한도와 상관없다.
  expect(applyCommand(full, parse({ op: "update_node", id: "n0", label: "새 이름" })).ok).toBe(true);
  expect(applyCommand(full, parse({ op: "remove_node", id: "n0" })).ok).toBe(true);
});
