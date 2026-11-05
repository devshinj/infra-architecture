import { describe, expect, test } from "vitest";

import { EDGE_KINDS, GROUP_KINDS, NODE_KINDS, categoryOf } from "@/domain/catalog";
import { COMMAND_OPS, parseCommand } from "@/domain/commands";

describe("parseCommand", () => {
  test("parses add_node with snake_case wire fields", () => {
    const r = parseCommand({ op: "add_node", id: "was-1", kind: "was", label: "WAS#1", parent: "was-pair", attrs: { ram: null } });
    expect(r.ok && r.cmd.op).toBe("add_node");
  });
  test("rejects unknown kind", () => {
    const r = parseCommand({ op: "add_node", id: "x", kind: "webserver", label: "x", parent: null });
    expect(r.ok).toBe(false);
  });
  test("rejects bad id", () => expect(parseCommand({ op: "remove_node", id: "WAS 1" }).ok).toBe(false));
  test("parses remove_group and lists it in COMMAND_OPS", () => {
    expect(parseCommand({ op: "remove_group", id: "aws-region" })).toEqual({ ok: true, cmd: { op: "remove_group", id: "aws-region" } });
    expect(parseCommand({ op: "remove_group" }).ok).toBe(false);
    expect(COMMAND_OPS).toContain("remove_group");
  });
});

describe("catalog", () => {
  test("every node kind has a category, redundancy_group lays out RIGHT, aux hidden", () => {
    expect(NODE_KINDS.every((k) => k.category)).toBe(true);
    expect(GROUP_KINDS.find((g) => g.kind === "redundancy_group")!.innerDirection).toBe("RIGHT");
    expect(EDGE_KINDS.find((e) => e.kind === "aux")!.defaultHidden).toBe(true);
    expect(categoryOf("db_proxy")).toBe("data");
  });
});

describe("edge payload/direction", () => {
  test("add_edge accepts payload and direction", () => {
    const r = parseCommand({ op: "add_edge", from: "a", to: "b", edge_kind: "request", payload: "api", direction: "two_way" });
    expect(r.ok && r.cmd.op === "add_edge" && r.cmd.payload === "api" && r.cmd.direction === "two_way").toBe(true);
  });
  test('update_edge rejects payload "ftp"', () => {
    expect(parseCommand({ op: "update_edge", id: "e1", payload: "ftp" }).ok).toBe(false);
    expect(parseCommand({ op: "update_edge", id: "e1", direction: "both" }).ok).toBe(false);
  });
});
