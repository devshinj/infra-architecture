import { expect, test } from "vitest";

import { fx, isInExternal, spikeFixtures, synth } from "../fixtures/spike";

test("all 5 spike fixtures convert with zero apply errors and no az groups", () => {
  expect(spikeFixtures).toHaveLength(5);
  for (const f of spikeFixtures) {
    expect(Object.values(f.state.groups).some((g) => (g.groupKind as string) === "az")).toBe(false);
    expect(Object.keys(f.state.nodes).length).toBeGreaterThan(5);
  }
});

test("s4 large fixture keeps >= 30 nodes", () => {
  expect(Object.keys(spikeFixtures.find((f) => f.id === "s4")!.state.nodes).length).toBeGreaterThanOrEqual(30);
});

test("s4 az groups are dropped (they have no children in the spike data) and aux edges touch aux-kind nodes", () => {
  const s = fx("s4");
  expect(s.groups["az-a"]).toBeUndefined();
  expect(s.groups["az-b"]).toBeUndefined();
  expect(Object.values(s.edges).some((x) => x.edgeKind === "aux")).toBe(true);
  for (const e of Object.values(s.edges).filter((x) => x.edgeKind === "aux")) {
    const kinds = [s.nodes[e.from]?.kind, s.nodes[e.to]?.kind];
    expect(kinds.some((k) => ["monitoring", "logging", "ci_cd", "bastion"].includes(k as string))).toBe(true);
  }
});

test("isInExternal and synth helpers", () => {
  const withExternal = spikeFixtures.filter((f) => Object.values(f.state.nodes).some((n) => isInExternal(f.state, n.id)));
  expect(withExternal.length).toBeGreaterThan(0);
  const t = synth(5);
  expect(Object.keys(t.nodes)).toHaveLength(5);
  expect(Object.keys(t.edges)).toHaveLength(4);
  expect(isInExternal(t, "app-0")).toBe(false);
});
