import { describe, expect, test } from "vitest";

import { EDGE_KINDS, GROUP_KINDS, NODE_KINDS, categoryOf } from "@/domain/catalog";
import { applyCommand } from "@/domain/apply";
import { COMMAND_OPS, FLOW_OPS, SERVER_ONLY_OPS, createFlowRetarget, isFlowCommand, isStructural, parseCommand, type Command, type FlowCommand } from "@/domain/commands";
import type { FlowOp } from "@/domain/flows";
import { emptyState } from "@/domain/types";

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

describe("flow commands", () => {
  const step = (i: number) => ({ edge: `e-${i}`, from: `n-${i}`, short: "인증 요청", text: "로그인 정보를 보낸다" });
  test("add_flow parses", () => {
    const r = parseCommand({ op: "add_flow", id: "login", name: "  로그인  ", origin: "user", summary: "로그인", result: "토큰을 받는다", steps: [step(1)] });
    expect(r).toEqual({
      ok: true,
      cmd: { op: "add_flow", id: "login", name: "로그인", origin: "user", summary: "로그인", result: "토큰을 받는다", steps: [step(1)] },
    });
    expect(isFlowCommand((r as { ok: true; cmd: Command }).cmd)).toBe(true);
    expect(parseCommand({ op: "update_flow", id: "login", name: "새 이름" }).ok).toBe(true);
    expect(parseCommand({ op: "remove_flow", id: "login" }).ok).toBe(true);
    for (const op of ["add_flow", "update_flow", "remove_flow"] as const) {
      expect(COMMAND_OPS).toContain(op);
      expect(FLOW_OPS.has(op)).toBe(true);
    }
  });
  test("steps over 20 rejected", () => {
    const base = { op: "add_flow", id: "f", name: "흐름", origin: "system" };
    expect(parseCommand({ ...base, steps: Array.from({ length: 20 }, (_, i) => step(i)) }).ok).toBe(true);
    expect(parseCommand({ ...base, steps: Array.from({ length: 21 }, (_, i) => step(i)) }).ok).toBe(false);
    expect(parseCommand({ ...base, steps: [] }).ok).toBe(false);
    expect(parseCommand({ op: "update_flow", id: "f", steps: Array.from({ length: 21 }, (_, i) => step(i)) }).ok).toBe(false);
  });
  test("flow fields are checked (id, name, origin, lengths)", () => {
    const ok = { op: "add_flow", id: "f", name: "흐름", origin: "user", steps: [step(1)] };
    expect(parseCommand({ ...ok, id: "Bad Id" }).ok).toBe(false);
    expect(parseCommand({ ...ok, name: "   " }).ok).toBe(false);
    expect(parseCommand({ ...ok, name: "가".repeat(60) }).ok).toBe(true);
    expect(parseCommand({ ...ok, name: "가".repeat(61) }).ok).toBe(false);
    expect(parseCommand({ ...ok, origin: "admin" }).ok).toBe(false);
    expect(parseCommand({ ...ok, summary: "가".repeat(201) }).ok).toBe(false);
    expect(parseCommand({ ...ok, result: "가".repeat(201) }).ok).toBe(false);
    expect(parseCommand({ ...ok, steps: [{ ...step(1), text: "가".repeat(121) }] }).ok).toBe(false);
    expect(parseCommand({ ...ok, steps: [{ ...step(1), short: "가".repeat(40) }] }).ok).toBe(true);
    expect(parseCommand({ ...ok, steps: [{ ...step(1), edge: "E 1" }] }).ok).toBe(false);
    expect(parseCommand({ ...ok, steps: [{ ...step(1), from: "N_1" }] }).ok).toBe(false);
  });
  test("isStructural(add_flow) === false", () => {
    const r = parseCommand({ op: "add_flow", id: "f", name: "흐름", origin: "user", steps: [step(1)] });
    expect(r.ok && isStructural(r.cmd)).toBe(false);
    expect(isStructural({ op: "remove_flow", id: "f" })).toBe(false);
    expect(isStructural({ op: "update_flow", id: "f" })).toBe(false);
    expect(isStructural({ op: "remove_edge", id: "e" })).toBe(true);
    expect(isFlowCommand({ op: "remove_edge", id: "e" })).toBe(false);
  });
  test("applyCommand leaves the diagram as is for flow commands", () => {
    const state = emptyState();
    expect(applyCommand(state, { op: "remove_flow", id: "f" })).toEqual({ ok: true, state });
    expect(applyCommand(state, { op: "remove_flow", id: "f" }).state).toBe(state);
  });
  test("FlowCommand is a FlowOp", () => {
    const cmd: FlowCommand = { op: "update_flow", id: "f", steps: [step(1)] };
    const op: FlowOp = cmd;
    expect(op.op).toBe("update_flow");
  });
});

describe("망 종류·망연계 추정 명령", () => {
  test("commands: set_zone_type 의 type 은 id 형식 또는 null", () => {
    expect(parseCommand({ op: "set_zone_type", id: "dmz", type: "dmz" }).ok).toBe(true);
    expect(parseCommand({ op: "set_zone_type", id: "dmz", type: null }).ok).toBe(true);
    expect(parseCommand({ op: "set_zone_type", id: "dmz", type: "Not Id" }).ok).toBe(false);
    expect(parseCommand({ op: "set_zone_type", id: "dmz" }).ok).toBe(false);
    expect(isStructural({ op: "set_zone_type", id: "dmz", type: "dmz" })).toBe(true);
  });
  test("commands: isStructural(set_link_guess) === false", () => {
    const cmd = { op: "set_link_guess", id: "lnk", guess: { replaced: [{ from: "a", to: "b", edgeKind: "request" }] } };
    const r = parseCommand(cmd);
    expect(r.ok && isStructural(r.cmd)).toBe(false);
    expect(parseCommand({ op: "set_link_guess", id: "lnk", guess: null }).ok).toBe(true);
    expect(parseCommand({ op: "set_link_guess", id: "lnk", guess: { replaced: [{ from: "a", to: "b", edgeKind: "zzz" }] } }).ok).toBe(false);
    expect(SERVER_ONLY_OPS.has("set_link_guess")).toBe(true);
    expect(COMMAND_OPS).toContain("set_link_guess");
  });
  test("add_node 는 guess 를 받는다", () => {
    expect(parseCommand({ op: "add_node", id: "l", kind: "network_link", label: "L", parent: null, guess: true }).ok).toBe(true);
  });
});

describe("createFlowRetarget", () => {
  const steps = [{ edge: "e-a-b", from: "a", short: "요청", text: "보낸다" }];
  const add = (id: string): FlowCommand => ({ op: "add_flow", id, name: "회원가입", origin: "user", summary: "요약", result: "결과", steps });

  test("add_flow on an existing flow id becomes update_flow (origin dropped, the rest replaced)", () => {
    const retarget = createFlowRetarget(["signup"]);
    expect(retarget(add("signup"))).toEqual({ op: "update_flow", id: "signup", name: "회원가입", summary: "요약", result: "결과", steps });
  });

  test("new ids stay add_flow, and a second add_flow with the same id in the turn becomes update_flow", () => {
    const retarget = createFlowRetarget([]);
    expect(retarget(add("login"))).toEqual(add("login"));
    expect(retarget(add("login")).op).toBe("update_flow");
  });

  test("after remove_flow the id is free again; update_flow and remove_flow pass through", () => {
    const retarget = createFlowRetarget(["signup"]);
    const rm: FlowCommand = { op: "remove_flow", id: "signup" };
    const up: FlowCommand = { op: "update_flow", id: "pay", name: "결제" };
    expect(retarget(rm)).toEqual(rm);
    expect(retarget(add("signup"))).toEqual(add("signup"));
    expect(retarget(up)).toEqual(up);
  });

  test("optional fields left out of add_flow are not invented on update_flow", () => {
    const retarget = createFlowRetarget(["signup"]);
    const bare: FlowCommand = { op: "add_flow", id: "signup", name: "회원가입", origin: "user", steps };
    expect(retarget(bare)).toEqual({ op: "update_flow", id: "signup", name: "회원가입", steps });
  });
});
