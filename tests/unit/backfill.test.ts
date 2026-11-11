import { expect, test } from "vitest";

import { applyCommands } from "@/domain/apply";
import { emptyState } from "@/domain/types";
import { planCommandBackfill } from "@/server/chat/backfill";
import { REPLAY_COMMANDS_MAX } from "@/server/chat/prompt";

const v1 = applyCommands(emptyState(), [{ op: "add_node", id: "a", kind: "was", label: "a", parent: null }]).state;
const v3 = applyCommands(v1, [
  { op: "add_node", id: "b", kind: "was", label: "b", parent: null },
  { op: "add_edge", id: "e-a-b", from: "a", to: "b", edge_kind: "request" },
]).state;
const versions = new Map([
  [1, v1],
  [3, v3],
]);

test("a turn that made a version gets the commands from the version just before it", () => {
  expect(planCommandBackfill({ intent: "structure_change", applied: 2, version: 3 }, versions)).toEqual([
    { op: "add_node", id: "b", kind: "was", label: "b", parent: null },
    { op: "add_edge", id: "e-a-b", from: "a", to: "b", edge_kind: "request" },
  ]);
  // 첫 버전은 빈 구성도에서 시작한다.
  expect(planCommandBackfill({ applied: 1, version: 1 }, versions)).toEqual([{ op: "add_node", id: "a", kind: "was", label: "a", parent: null }]);
});

test("a command turn with no version and nothing applied is marked as failed (empty list)", () => {
  expect(planCommandBackfill({ intent: "structure_change", applied: 0, version: null }, versions)).toEqual([]);
  expect(planCommandBackfill({ applied: 0 }, versions)).toEqual([]);
});

test("left alone: answer/layout/history turns, already filled, unknown version, flow-only turns", () => {
  for (const intent of ["question", "other", "layout", "history"]) expect(planCommandBackfill({ intent, applied: 0 }, versions)).toBeNull();
  expect(planCommandBackfill({ applied: 1, version: 3, commands: [] }, versions)).toBeNull();
  expect(planCommandBackfill({ applied: 1, version: 9 }, versions)).toBeNull();
  expect(planCommandBackfill({ applied: 1, flows: 1, version: null }, versions)).toBeNull();
  expect(planCommandBackfill(null, versions)).toBeNull();
});

test("long turns keep only the first REPLAY_COMMANDS_MAX commands", () => {
  const big = applyCommands(
    emptyState(),
    Array.from({ length: REPLAY_COMMANDS_MAX + 5 }, (_, i) => ({ op: "add_node" as const, id: `n${i}`, kind: "was" as const, label: `n${i}`, parent: null })),
  ).state;
  expect(planCommandBackfill({ applied: 65, version: 1 }, new Map([[1, big]]))).toHaveLength(REPLAY_COMMANDS_MAX);
});
