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

describe("edge payload/direction", () => {
  test("add_edge stores payload/direction", () => {
    const s = applyCommand(base(), { op: "add_edge", id: "e-pd", from: "was-1", to: "db", edge_kind: "request", payload: "file", direction: "one_way" });
    expect(s.ok && s.state.edges["e-pd"]).toMatchObject({ payload: "file", direction: "one_way" });
  });
  test("update_edge merges payload/direction and keeps label", () => {
    const s = applyCommand(base(), { op: "update_edge", id: "e-was-1-db", payload: "api", direction: "two_way" });
    expect(s.ok && s.state.edges["e-was-1-db"]).toMatchObject({ label: "JDBC", payload: "api", direction: "two_way" });
  });
});

describe("망 종류·망연계 추정 표시", () => {
  const withZone = () =>
    applyCommands(emptyState(), [
      { op: "add_group", id: "dmz", group_kind: "network_zone", label: "DMZ", parent: null },
      { op: "add_group", id: "vpc", group_kind: "vpc", label: "VPC", parent: null },
      { op: "add_node", id: "lnk", kind: "network_link", label: "망연계", parent: "dmz" },
      { op: "add_node", id: "web", kind: "was", label: "WAS", parent: "dmz" },
    ] as Command[]).state;

  test("apply set_zone_type: network_zone 에만, AI 출처·미확인으로 저장", () => {
    const r = applyCommand(withZone(), { op: "set_zone_type", id: "dmz", type: "dmz" });
    expect(r.ok && r.state.groups.dmz.netType).toEqual({ key: "dmz", source: "ai", confirmed: false });
    const bad = applyCommand(withZone(), { op: "set_zone_type", id: "vpc", type: "dmz" });
    expect(bad.ok).toBe(false);
    expect(applyCommand(withZone(), { op: "set_zone_type", id: "nope", type: "dmz" }).ok).toBe(false);
  });

  test("apply set_zone_type: 사용자 확정 종류는 바꾸지 못한다", () => {
    const s = withZone();
    s.groups.dmz = { ...s.groups.dmz, netType: { key: "internal", source: "user", confirmed: true } };
    const r = applyCommand(s, { op: "set_zone_type", id: "dmz", type: "dmz" });
    expect(r).toMatchObject({ ok: false, error: "zone type dmz is confirmed" });
    expect(r.state).toBe(s);
  });

  test("apply set_zone_type: 지식에 없는 key 의 사용자 종류는 종류 없음으로 보고 AI 가 다시 붙인다", () => {
    const s = withZone();
    s.groups.dmz = { ...s.groups.dmz, netType: { key: "gone", source: "user", confirmed: true } };
    const cmd = { op: "set_zone_type", id: "dmz", type: "dmz" } as const;
    const r = applyCommand(s, cmd, { netTypes: { dmz: {} } });
    expect(r.ok && r.state.groups.dmz.netType).toEqual({ key: "dmz", source: "ai", confirmed: false });
    // 지식에 있는 key 면 그대로 막는다.
    const known = applyCommand(s, cmd, { netTypes: { gone: {}, dmz: {} } });
    expect(known).toMatchObject({ ok: false, error: "zone type dmz is confirmed" });
    // 지식을 주지 않으면 지금처럼 막는다.
    expect(applyCommand(s, cmd).ok).toBe(false);
  });

  test("apply set_zone_type: null 이면 칸을 지운다", () => {
    const a = applyCommand(withZone(), { op: "set_zone_type", id: "dmz", type: "dmz" });
    if (!a.ok) throw new Error("x");
    const r = applyCommand(a.state, { op: "set_zone_type", id: "dmz", type: null });
    expect(r.ok && "netType" in r.state.groups.dmz).toBe(false);
  });

  test("apply add_node guess: network_link 만 guess 를 남긴다", () => {
    const s = withZone();
    const link = applyCommand(s, { op: "add_node", id: "l2", kind: "network_link", label: "연계", parent: "dmz", guess: true });
    expect(link.ok && link.state.nodes.l2.guess).toEqual({ replaced: [] });
    const other = applyCommand(s, { op: "add_node", id: "w2", kind: "was", label: "WAS", parent: "dmz", guess: true });
    expect(other.ok && "guess" in other.state.nodes.w2).toBe(false);
    const plain = applyCommand(s, { op: "add_node", id: "l3", kind: "network_link", label: "연계", parent: "dmz" });
    expect(plain.ok && "guess" in plain.state.nodes.l3).toBe(false);
  });

  test("apply set_link_guess: 저장·지우기, 없는 노드는 실패", () => {
    const guess = { replaced: [{ from: "web", to: "lnk", edgeKind: "request" as const, id: "e1" }] };
    const a = applyCommand(withZone(), { op: "set_link_guess", id: "lnk", guess });
    expect(a.ok && a.state.nodes.lnk.guess).toEqual(guess);
    if (!a.ok) throw new Error("x");
    const b = applyCommand(a.state, { op: "set_link_guess", id: "lnk", guess: null });
    expect(b.ok && "guess" in b.state.nodes.lnk).toBe(false);
    expect(applyCommand(withZone(), { op: "set_link_guess", id: "nope", guess }).ok).toBe(false);
  });
});
