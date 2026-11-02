import { describe, expect, test } from "vitest";

import spike from "../../docs/superpowers/spike/spike-results.json";
import { applyCommand } from "@/domain/apply";
import { parseCommand } from "@/domain/commands";
import { emptyState, type DiagramState } from "@/domain/types";
import { normalizeAiCommand } from "@/server/chat/normalize";

type SpikeLines = { groups: Record<string, unknown>; nodes: Record<string, unknown>; edges: Record<string, unknown> };
const s1 = (spike.scenarios as unknown as { id: string; state: SpikeLines }[]).find((s) => s.id === "s1")!.state;

describe("normalizeAiCommand", () => {
  test("real spike s1 client lines with sub:null now parse and apply, with their entry edges", () => {
    const web = s1.nodes["client-web"];
    const mobile = s1.nodes["client-mobile"];
    expect(web).toMatchObject({ sub: null });
    expect(mobile).toMatchObject({ sub: null });
    // 정규화 없이는 거부된다(도메인 스키마는 엄격하게 둔다).
    expect(parseCommand(web).ok).toBe(false);

    let state: DiagramState = emptyState();
    // 스파이크는 그룹 이름 변경(redundancy_pair → redundancy_group) 전에 찍었다. 그 이름만 지금 것으로 바꾼다.
    const groups = Object.values(s1.groups).map((g) =>
      (g as { group_kind?: unknown }).group_kind === "redundancy_pair" ? { ...(g as object), group_kind: "redundancy_group" } : g,
    );
    const lines = [...groups, ...Object.values(s1.nodes), ...Object.values(s1.edges)];
    const rejected: unknown[] = [];
    for (const raw of lines) {
      const p = parseCommand(normalizeAiCommand(raw));
      if (!p.ok) {
        rejected.push(raw);
        continue;
      }
      const r = applyCommand(state, p.cmd);
      if (r.ok) state = r.state;
      else rejected.push(raw);
    }
    expect(rejected).toEqual([]);
    expect(state.nodes["client-web"]).toBeDefined();
    expect(state.nodes["client-web"]!.sub).toBeUndefined();
    expect(state.nodes["client-mobile"]).toBeDefined();
    expect(state.edges["e-client-web-cdn"]).toBeDefined();
    expect(state.edges["e-client-mobile-cdn"]).toBeDefined();
    expect(Object.keys(state.nodes)).toHaveLength(12);
    expect(Object.keys(state.edges)).toHaveLength(15);
  });

  test("drops null on optional-not-nullable fields", () => {
    expect(normalizeAiCommand({ op: "add_node", id: "a", kind: "was", label: "A", sub: null, parent: null, attrs: null })).toEqual({
      op: "add_node",
      id: "a",
      kind: "was",
      label: "A",
      parent: null,
    });
    expect(normalizeAiCommand({ op: "add_edge", id: null, from: "a", to: "b", edge_kind: "request", label: null })).toEqual({
      op: "add_edge",
      from: "a",
      to: "b",
      edge_kind: "request",
    });
    expect(normalizeAiCommand({ op: "update_node", id: "a", label: null, sub: null, attrs: null, parent: null })).toEqual({
      op: "update_node",
      id: "a",
      parent: null,
    });
    expect(normalizeAiCommand({ op: "update_edge", id: "e", label: null, edge_kind: null })).toEqual({ op: "update_edge", id: "e" });
  });

  test("keeps parent:null and null attrs values", () => {
    const n = normalizeAiCommand({ op: "add_node", id: "a", kind: "was", label: "A", parent: null, attrs: { ip: null, ram: "16GB" } });
    expect(n).toEqual({ op: "add_node", id: "a", kind: "was", label: "A", parent: null, attrs: { ip: null, ram: "16GB" } });
    expect(parseCommand(n).ok).toBe(true);
  });

  test("adds parent:null when add_node / add_group omit it", () => {
    expect(normalizeAiCommand({ op: "add_group", id: "vpc", group_kind: "vpc", label: "VPC" })).toEqual({
      op: "add_group",
      id: "vpc",
      group_kind: "vpc",
      label: "VPC",
      parent: null,
    });
    const n = normalizeAiCommand({ op: "add_node", id: "a", kind: "was", label: "A" });
    expect(n).toMatchObject({ parent: null });
    expect(parseCommand(n).ok).toBe(true);
    // update_node 에는 붙이지 않는다(생략 = 그대로 둠).
    expect(normalizeAiCommand({ op: "update_node", id: "a" })).toEqual({ op: "update_node", id: "a" });
  });

  test("flattens attrs arrays of strings/numbers and booleans", () => {
    const n = normalizeAiCommand({
      op: "add_node",
      id: "a",
      kind: "was",
      label: "A",
      parent: null,
      attrs: { az: ["2a", "2c"], ports: [80, 443], multi_az: true, public: false, cpu: 4 },
    });
    expect(n).toMatchObject({ attrs: { az: "2a, 2c", ports: "80, 443", multi_az: "true", public: "false", cpu: 4 } });
    expect(parseCommand(n).ok).toBe(true);
    expect(normalizeAiCommand({ op: "update_node", id: "a", attrs: { az: ["2a"] } })).toEqual({
      op: "update_node",
      id: "a",
      attrs: { az: "2a" },
    });
  });

  test("still rejected: invalid kind, attrs object value, mixed array", () => {
    expect(parseCommand(normalizeAiCommand({ op: "add_node", id: "a", kind: "load_balancer", label: "A", sub: null })).ok).toBe(false);
    expect(
      parseCommand(normalizeAiCommand({ op: "add_node", id: "a", kind: "was", label: "A", parent: null, attrs: { spec: { cpu: 4 } } })).ok,
    ).toBe(false);
    expect(
      parseCommand(normalizeAiCommand({ op: "add_node", id: "a", kind: "was", label: "A", parent: null, attrs: { az: ["2a", { x: 1 }] } }))
        .ok,
    ).toBe(false);
    // 필수 값의 null 은 그대로 둬서 거부된다.
    expect(parseCommand(normalizeAiCommand({ op: "add_node", id: "a", kind: "was", label: null, parent: null })).ok).toBe(false);
  });

  test("does not mutate input; non-objects and unknown ops pass through", () => {
    const raw = { op: "add_node", id: "a", kind: "was", label: "A", sub: null };
    const copy = structuredClone(raw);
    normalizeAiCommand(raw);
    expect(raw).toEqual(copy);
    expect(normalizeAiCommand("x")).toBe("x");
    expect(normalizeAiCommand(null)).toBe(null);
    expect(normalizeAiCommand([1])).toEqual([1]);
    const warn = { op: "warn", text: null };
    expect(normalizeAiCommand(warn)).toEqual(warn);
  });

  test("ids with underscores or capitals are normalized consistently so references still resolve", () => {
    const raw = [
      { op: "add_node", id: "client_web", kind: "client_web", label: "웹 사용자", parent: null },
      { op: "add_node", id: "Web_1", kind: "web_server", label: "웹 서버 #1", parent: null },
      { op: "add_edge", from: "client_web", to: "Web_1", edge_kind: "request" },
    ];
    const normalized = raw.map((r) => normalizeAiCommand(r));
    expect(normalized[0]).toMatchObject({ id: "client-web" });
    expect(normalized[2]).toMatchObject({ from: "client-web", to: "web-1" });
    // 정규화 없이는 거부된다.
    expect(parseCommand(raw[2]).ok).toBe(false);
    let state: DiagramState = emptyState();
    for (const n of normalized) {
      const p = parseCommand(n);
      expect(p.ok).toBe(true);
      if (p.ok) {
        const r = applyCommand(state, p.cmd);
        expect(r.ok).toBe(true);
        if (r.ok) state = r.state;
      }
    }
    expect(Object.keys(state.nodes)).toEqual(["client-web", "web-1"]);
    expect(Object.values(state.edges).map((e) => [e.from, e.to])).toEqual([["client-web", "web-1"]]);
  });

  test("values that would still not be a valid id, and other fields, are left untouched", () => {
    expect(normalizeAiCommand({ op: "update_node", id: "a b_c", attrs: { sw: "Foo_Bar" }, label: "A_B" })).toEqual({
      op: "update_node",
      id: "a b_c",
      attrs: { sw: "Foo_Bar" },
      label: "A_B",
    });
    expect(normalizeAiCommand({ op: "add_node", id: "x", kind: "was", label: "A", parent: null })).toMatchObject({ parent: null });
  });
});
