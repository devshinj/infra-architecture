import { describe, expect, test } from "vitest";

import { LIMITS, overLimit, signatureOf } from "@/domain/explain";
import type { EdgeExplanation, NodeExplanation } from "@/domain/explain";
import type { DiagramState } from "@/domain/types";

function makeState(): DiagramState {
  return {
    groups: {},
    nodes: {
      a: { id: "a", kind: "was", label: "주문 WAS", sub: "Tomcat", parent: null, attrs: { sw: "Tomcat", version: "10", cpu: 4, ip: "10.0.0.1" } },
      b: { id: "b", kind: "db_rdb", label: "주문 DB", parent: null, attrs: {} },
      c: { id: "c", kind: "cache", label: "캐시", parent: null, attrs: {} },
    },
    edges: {
      e1: { id: "e1", from: "a", to: "b", edgeKind: "request", label: "SQL" },
      e2: { id: "e2", from: "a", to: "c", edgeKind: "request" },
    },
    assumptions: {},
  };
}

describe("signatureOf", () => {
  test("signature changes with kind, sw and neighbours only", () => {
    const base = signatureOf(makeState(), "node", "a");
    expect(base).toMatch(/^[0-9a-f]{8}$/);

    const kind = makeState();
    kind.nodes.a.kind = "app_server";
    expect(signatureOf(kind, "node", "a")).not.toBe(base);

    const sw = makeState();
    sw.nodes.a.attrs.sw = "Jetty";
    expect(signatureOf(sw, "node", "a")).not.toBe(base);

    const nb = makeState();
    nb.nodes.b.label = "회원 DB";
    expect(signatureOf(nb, "node", "a")).not.toBe(base);

    const noise = makeState();
    noise.nodes.a.attrs.cpu = 16;
    noise.nodes.a.attrs.ip = "10.9.9.9";
    expect(signatureOf(noise, "node", "a")).toBe(base);

    // 연결 정의 순서와 무관하다.
    const reordered = makeState();
    reordered.edges = { e2: reordered.edges.e2, e1: reordered.edges.e1 };
    expect(signatureOf(reordered, "node", "a")).toBe(base);
  });

  test("edge signature follows label and endpoints", () => {
    const base = signatureOf(makeState(), "edge", "e1");
    const label = makeState();
    label.edges.e1.label = "JDBC";
    expect(signatureOf(label, "edge", "e1")).not.toBe(base);
    const end = makeState();
    end.nodes.b.label = "회원 DB";
    expect(signatureOf(end, "edge", "e1")).not.toBe(base);
    const noise = makeState();
    noise.nodes.a.attrs.cpu = 99;
    expect(signatureOf(noise, "edge", "e1")).toBe(base);
  });

  test("missing target gives null", () => {
    const s = makeState();
    expect(signatureOf(s, "node", "zzz")).toBeNull();
    expect(signatureOf(s, "edge", "zzz")).toBeNull();
  });
});

describe("signatureOf with group endpoints", () => {
  const withZone = (label: string): DiagramState => {
    const s = makeState();
    s.groups.z = { id: "z", groupKind: "dmz", label, parent: null };
    s.edges.ez = { id: "ez", from: "z", to: "a", edgeKind: "request" };
    return s;
  };
  test("edge to a group is explainable and follows the group label", () => {
    const base = signatureOf(withZone("DMZ"), "edge", "ez");
    expect(base).not.toBeNull();
    expect(signatureOf(withZone("내부망"), "edge", "ez")).not.toBe(base);
    const dangling = withZone("DMZ");
    delete dangling.groups.z;
    expect(signatureOf(dangling, "edge", "ez")).toBeNull();
  });
  test("node signature changes when its zone neighbour is renamed", () => {
    expect(signatureOf(withZone("내부망"), "node", "a")).not.toBe(signatureOf(withZone("DMZ"), "node", "a"));
  });
});

describe("overLimit", () => {
  const node = (over: Partial<NodeExplanation> = {}): NodeExplanation => ({
    kind: "node", term: "t", definition: "d", definitionSource: "ai", reviewed: false, role: "r",
    adr: { decision: "a", reason: "b", alternative: "c", cost: "d" }, ...over,
  });

  test("overLimit lists exceeded fields by code points", () => {
    expect(overLimit(node())).toEqual([]);
    // 이모지는 UTF-16 으로 2칸이지만 코드 포인트로는 1자다.
    expect(overLimit(node({ definition: "😀".repeat(LIMITS.definition) }))).toEqual([]);
    expect(overLimit(node({ definition: "😀".repeat(LIMITS.definition + 1), role: "x".repeat(LIMITS.role + 1) }))).toEqual(["definition", "role"]);
    expect(overLimit(node({ adr: { decision: "x".repeat(81), reason: "b", alternative: "c", cost: "x".repeat(81) }, why: "x".repeat(121), compare: "x".repeat(120) })))
      .toEqual(["why", "adr.decision", "adr.cost"].sort((a, b) => order(a) - order(b)));
    const edge: EdgeExplanation = { kind: "edge", flow: "x".repeat(101), method: "m", why: "w", firewall: "x".repeat(100) };
    expect(overLimit(edge)).toEqual(["flow"]);
  });
});

// 구현의 출력 순서(definition, role, why, compare, adr.*)와 맞추는 보조.
function order(name: string): number {
  return ["definition", "role", "why", "compare", "adr.decision", "adr.reason", "adr.alternative", "adr.cost"].indexOf(name);
}
