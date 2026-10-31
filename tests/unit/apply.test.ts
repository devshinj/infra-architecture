import { describe, expect, test } from "vitest";

import { applyCommand, applyCommands, pruneEmptyGroups } from "@/domain/apply";
import type { Command } from "@/domain/commands";
import { emptyState } from "@/domain/types";

const base = () =>
  applyCommands(emptyState(), [
    { op: "add_group", id: "vpc", group_kind: "vpc", label: "VPC", parent: null },
    { op: "add_node", id: "was-1", kind: "was", label: "WAS#1", parent: "vpc" },
    { op: "add_node", id: "db", kind: "db_rdb", label: "DB", parent: "vpc" },
    { op: "add_edge", from: "was-1", to: "db", edge_kind: "request", label: "JDBC" },
  ] as Command[]).state;

describe("applyCommand", () => {
  test("builds state and defaults edge id", () => {
    expect(Object.keys(base().edges)).toEqual(["e-was-1-db"]);
  });

  test("rejected command leaves state untouched", () => {
    const s = base();
    for (const bad of [
      { op: "add_node", id: "db", kind: "cache", label: "dup", parent: null },
      { op: "add_node", id: "vpc", kind: "cache", label: "dup group id", parent: null },
      { op: "add_node", id: "n", kind: "cache", label: "n", parent: "nope" },
      { op: "add_edge", from: "ghost", to: "db", edge_kind: "request" },
    ] as Command[]) {
      const r = applyCommand(s, bad);
      expect(r.ok).toBe(false);
      expect(r.state).toBe(s);
    }
  });

  test("edge default id gets numeric suffix on collision, endpoints may be groups", () => {
    let s = applyCommand(base(), { op: "add_edge", from: "was-1", to: "db", edge_kind: "request" }).state;
    s = applyCommand(s, { op: "add_edge", from: "was-1", to: "db", edge_kind: "request" }).state;
    s = applyCommand(s, { op: "add_edge", from: "was-1", to: "vpc", edge_kind: "request" }).state;
    expect(Object.keys(s.edges)).toEqual(["e-was-1-db", "e-was-1-db-2", "e-was-1-db-3", "e-was-1-vpc"]);
  });

  test("remove_node drops incident edges", () => {
    const r = applyCommand(base(), { op: "remove_node", id: "db" });
    expect(r.ok && Object.keys(r.state.edges)).toEqual([]);
  });

  test("update_node merges attrs and validates parent", () => {
    const r = applyCommand(base(), { op: "update_node", id: "was-1", attrs: { ram: "32GB" } });
    expect(r.ok && r.state.nodes["was-1"].attrs).toEqual({ ram: "32GB" });
    expect(applyCommand(base(), { op: "update_node", id: "was-1", parent: "nope" }).ok).toBe(false);
  });

  test("confirmed assumption cannot be overwritten", () => {
    let s = applyCommand(base(), { op: "set_assumption", key: "environment", value: "AWS" }).state;
    s = { ...s, assumptions: { environment: { ...s.assumptions.environment, confirmed: true } } };
    expect(applyCommand(s, { op: "set_assumption", key: "environment", value: "IDC" }).ok).toBe(false);
  });

  test("input state is never mutated", () => {
    const s = base();
    const snap = JSON.stringify(s);
    applyCommand(s, { op: "remove_node", id: "was-1" });
    applyCommand(s, { op: "update_node", id: "was-1", attrs: { a: 1 } });
    expect(JSON.stringify(s)).toBe(snap);
  });

  test("applyCommands collects errors with index and continues", () => {
    const r = applyCommands(emptyState(), [
      { op: "add_node", id: "a", kind: "cache", label: "a", parent: "nope" },
      { op: "add_node", id: "b", kind: "cache", label: "b", parent: null },
    ] as Command[]);
    expect(r.errors.map((e) => e.index)).toEqual([0]);
    expect(Object.keys(r.state.nodes)).toEqual(["b"]);
  });
});

describe("single id namespace", () => {
  test("node/group ids cannot reuse an edge id; edge ids cannot reuse a node/group id", () => {
    const s = base();
    const edgeId = Object.keys(s.edges)[0];
    expect(applyCommand(s, { op: "add_node", id: edgeId, kind: "was", label: "x", parent: null } as Command).ok).toBe(false);
    expect(applyCommand(s, { op: "add_group", id: edgeId, group_kind: "vpc", label: "x", parent: null } as Command).ok).toBe(false);
    expect(applyCommand(s, { op: "add_edge", id: "db", from: "was-1", to: "db", edge_kind: "request" } as Command).ok).toBe(false);
  });

  test("generated edge id is suffixed when it collides with a node id", () => {
    let s = applyCommand(base(), { op: "add_node", id: "e-was-1-db-2", kind: "cache", label: "c", parent: null } as Command);
    expect(s.ok).toBe(true);
    s = applyCommand(s.state, { op: "add_edge", from: "was-1", to: "db", edge_kind: "request" } as Command);
    expect(s.ok && Object.keys(s.state.edges)).toEqual(["e-was-1-db", "e-was-1-db-3"]);
  });

  test("ids like constructor behave as ordinary ids", () => {
    let s = applyCommand(emptyState(), { op: "add_node", id: "constructor", kind: "was", label: "c", parent: null } as Command);
    expect(s.ok).toBe(true);
    s = applyCommand(s.state, { op: "add_node", id: "toString", kind: "db_rdb", label: "d", parent: null } as Command);
    s = applyCommand(s.state, { op: "add_edge", from: "constructor", to: "toString", edge_kind: "request" } as Command);
    expect(s.ok).toBe(true);
    expect(applyCommand(s.state, { op: "add_node", id: "constructor", kind: "was", label: "c", parent: null } as Command).ok).toBe(false);
    expect(applyCommand(emptyState(), { op: "update_node", id: "constructor", label: "z" } as Command).ok).toBe(false);
    expect(applyCommand(emptyState(), { op: "remove_edge", id: "hasOwnProperty" } as Command).ok).toBe(false);
    expect(applyCommand(s.state, { op: "remove_node", id: "constructor" } as Command).ok).toBe(true);
  });
});

const nested = () =>
  applyCommands(emptyState(), [
    { op: "add_group", id: "region", group_kind: "cloud_region", label: "리전", parent: null },
    { op: "add_group", id: "vpc", group_kind: "vpc", label: "VPC", parent: "region" },
    { op: "add_group", id: "sub", group_kind: "subnet_private", label: "내부 구역", parent: "vpc" },
    { op: "add_group", id: "spare", group_kind: "subnet_public", label: "빈 구역", parent: null },
    { op: "add_node", id: "client", kind: "client_web", label: "사용자", parent: null },
    { op: "add_node", id: "was-1", kind: "was", label: "WAS#1", parent: "sub" },
    { op: "add_node", id: "db", kind: "db_rdb", label: "DB", parent: "vpc" },
    { op: "add_edge", from: "client", to: "was-1", edge_kind: "request" },
    { op: "add_edge", from: "client", to: "vpc", edge_kind: "request" },
    { op: "add_edge", from: "client", to: "spare", edge_kind: "aux" },
  ] as Command[]);

describe("remove_group", () => {
  test("remove_group removes descendants and touching edges", () => {
    const { state: s, errors } = nested();
    expect(errors).toEqual([]);
    const r = applyCommand(s, { op: "remove_group", id: "vpc" } as Command);
    expect(r.ok).toBe(true);
    expect(Object.keys(r.state.groups).sort()).toEqual(["region", "spare"]);
    expect(Object.keys(r.state.nodes)).toEqual(["client"]);
    expect(Object.keys(r.state.edges)).toEqual(["e-client-spare"]);
  });

  test("remove_group unknown id fails", () => {
    const { state: s } = nested();
    const r = applyCommand(s, { op: "remove_group", id: "nope" } as Command);
    expect(r).toEqual({ ok: false, error: "group nope not found", state: s });
    // a node id is not a group
    expect(applyCommand(s, { op: "remove_group", id: "was-1" } as Command).ok).toBe(false);
  });
});

describe("pruneEmptyGroups", () => {
  test("only groups emptied by this turn are pruned", () => {
    const before = applyCommands(emptyState(), [
      { op: "add_group", id: "old", group_kind: "vpc", label: "VPC", parent: null },
      { op: "add_group", id: "empty", group_kind: "subnet_public", label: "빈 구역", parent: null },
      { op: "add_node", id: "web", kind: "web_server", label: "WEB", parent: "old" },
      { op: "add_node", id: "client", kind: "client_web", label: "사용자", parent: null },
      { op: "add_edge", from: "client", to: "old", edge_kind: "request" },
    ] as Command[]).state;
    const after = applyCommands(before, [
      { op: "remove_node", id: "web" },
      { op: "add_group", id: "idc", group_kind: "idc", label: "사내 IDC", parent: null },
    ] as Command[]).state;
    const out = pruneEmptyGroups(before, after);
    expect(Object.keys(out.groups).sort()).toEqual(["empty", "idc"]);
    expect(Object.keys(out.edges)).toEqual([]);
    expect(pruneEmptyGroups(before, before)).toEqual(before);
  });

  test("nested empty groups are pruned inside-out", () => {
    const { state: before } = nested();
    const after = applyCommands(before, [
      { op: "remove_node", id: "was-1" },
      { op: "remove_node", id: "db" },
    ] as Command[]).state;
    const out = pruneEmptyGroups(before, after);
    expect(Object.keys(out.groups)).toEqual(["spare"]);
    expect(Object.keys(out.nodes)).toEqual(["client"]);
    expect(Object.keys(out.edges)).toEqual(["e-client-spare"]);
  });
});
