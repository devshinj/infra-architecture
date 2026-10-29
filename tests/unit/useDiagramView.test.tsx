import { renderHook, waitFor } from "@testing-library/react";
import { expect, test } from "vitest";

import { defaultDisplayOptions } from "@/canvas/display";
import { useDiagramView } from "@/canvas/useDiagramView";
import { applyCommands } from "@/domain/apply";

import { fx } from "../fixtures/spike";

test("new nodes are marked appearing, changed nodes updated", async () => {
  const s2 = fx("s2");
  const { result, rerender } = renderHook(({ s }) => useDiagramView(s, {}, defaultDisplayOptions(s)), { initialProps: { s: s2 } });
  await waitFor(() => expect(result.current.layout).not.toBeNull());
  const next = applyCommands(s2, [
    { op: "add_node", id: "redis-x", kind: "cache", label: "Redis", parent: null },
    { op: "update_node", id: "was-1", attrs: { ram: "32GB" } },
  ]).state;
  rerender({ s: next });
  await waitFor(() => expect(result.current.appearing.has("redis-x")).toBe(true));
  expect(result.current.updated.has("was-1")).toBe(true);
});
