import { expect, test } from "vitest";

import { applyCommands } from "@/domain/apply";
import type { Command } from "@/domain/commands";
import { diffStates } from "@/domain/diff";
import { emptyState } from "@/domain/types";

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
