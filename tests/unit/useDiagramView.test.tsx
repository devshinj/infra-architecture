import { renderHook, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import * as layoutMod from "@/canvas/layout";

vi.mock("@/canvas/layout", async (orig) => {
  const m = await orig<typeof import("@/canvas/layout")>();
  return { ...m, layoutDiagram: vi.fn(m.layoutDiagram) };
});

import { defaultDisplayOptions } from "@/canvas/display";
import { useDiagramView } from "@/canvas/useDiagramView";
import { applyCommands } from "@/domain/apply";
import type { Command } from "@/domain/commands";
import { emptyState } from "@/domain/types";

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

test("selecting a node keeps every position, runs ELK once, and overlays the revealed aux edge", async () => {
  const s3 = fx("s3");
  const spy = vi.mocked(layoutMod.layoutDiagram);
  spy.mockClear();
  const { result, rerender } = renderHook(({ sel }) => useDiagramView(s3, {}, { ...defaultDisplayOptions(s3), selectedId: sel }), {
    initialProps: { sel: null as string | null },
  });
  await waitFor(() => expect(result.current.layout).not.toBeNull());
  const before = result.current.layout!;
  expect(before.edges.find((e) => e.id === "e-prometheus-grafana")).toBeUndefined();
  rerender({ sel: "prometheus" });
  await waitFor(() => expect(result.current.layout!.edges.some((e) => e.id === "e-prometheus-grafana")).toBe(true));
  const after = result.current.layout!;
  for (const [id, n] of Object.entries(before.nodes)) expect([after.nodes[id].x, after.nodes[id].y]).toEqual([n.x, n.y]);
  expect(after.edges.find((e) => e.id === "e-prometheus-grafana")!.degraded).toBe(true);
  expect(spy).toHaveBeenCalledTimes(1);
});

test("aux-first parallel edge: selecting an endpoint keeps the request edge in display and layout", async () => {
  const s = applyCommands(emptyState(), [
    { op: "add_node", id: "x", kind: "was", label: "X", parent: null },
    { op: "add_node", id: "y", kind: "db_rdb", label: "Y", parent: null },
    { op: "add_edge", id: "a-aux", from: "x", to: "y", edge_kind: "aux" },
    { op: "add_edge", id: "z-req", from: "x", to: "y", edge_kind: "request" },
  ] as Command[]).state;
  const { result, rerender } = renderHook(({ sel }) => useDiagramView(s, {}, { ...defaultDisplayOptions(s), selectedId: sel }), {
    initialProps: { sel: null as string | null },
  });
  await waitFor(() => expect(result.current.layout).not.toBeNull());
  rerender({ sel: "x" });
  await waitFor(() => expect(result.current.display.edges.some((e) => e.id === "a-aux")).toBe(true));
  expect(result.current.display.edges.find((e) => e.edgeKind === "request")!.id).toBe("z-req");
  const ids = result.current.layout!.edges.map((e) => e.id);
  expect(ids).toContain("z-req");
  expect(ids).toContain("a-aux");
});

test("settled is false while the layout for new pins is computed, then true", async () => {
  const s2 = fx("s2");
  const opts = defaultDisplayOptions(s2);
  const { result, rerender } = renderHook(({ p }) => useDiagramView(s2, p, opts), {
    initialProps: { p: { "was-1": { x: 900, y: 900 } } as Record<string, { x: number; y: number }> },
  });
  await waitFor(() => expect(result.current.settled).toBe(true));
  rerender({ p: {} });
  expect(result.current.settled).toBe(false);
  await waitFor(() => expect(result.current.settled).toBe(true));
  expect(result.current.layout!.nodes["was-1"].x).not.toBe(900);
});
