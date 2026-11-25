import { describe, expect, test } from "vitest";

import { authoredExplanation, LIMITS, overLimit, signatureOf } from "@/domain/explain";
import { GLOSSARY_SEED } from "@/domain/glossary-seed";
import type { EdgeExplanation, GroupExplanation, NodeExplanation } from "@/domain/explain";
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

describe("signatureOf for groups", () => {
  // z(DMZ) 안에 a, 밖의 b·c. a→b·a→c 가 경계를 넘는다.
  const withZone = (): DiagramState => {
    const s = makeState();
    s.groups.z = { id: "z", groupKind: "dmz", label: "DMZ", parent: null };
    s.nodes.a!.parent = "z";
    return s;
  };

  test("follows kind, label, net type, direct members and crossing edges", () => {
    const base = signatureOf(withZone(), "group", "z");
    expect(base).toMatch(/^[0-9a-f]{8}$/);

    const kind = withZone();
    kind.groups.z!.groupKind = "vpc";
    expect(signatureOf(kind, "group", "z")).not.toBe(base);

    const label = withZone();
    label.groups.z!.label = "외부 구역";
    expect(signatureOf(label, "group", "z")).not.toBe(base);

    const net = withZone();
    net.groups.z!.netType = { key: "admin", source: "ai", confirmed: false };
    expect(signatureOf(net, "group", "z")).not.toBe(base);

    const member = withZone();
    member.nodes.a!.label = "결제 WAS";
    expect(signatureOf(member, "group", "z")).not.toBe(base);

    const outside = withZone();
    outside.nodes.b!.label = "회원 DB";
    expect(signatureOf(outside, "group", "z")).not.toBe(base);

    const inner = withZone();
    inner.nodes.b!.parent = "z"; // a→b 는 더는 경계를 넘지 않는다.
    expect(signatureOf(inner, "group", "z")).not.toBe(base);
  });

  test("ignores node attrs that are not part of the zone story", () => {
    const base = signatureOf(withZone(), "group", "z");
    const noise = withZone();
    noise.nodes.a!.attrs.cpu = 99;
    noise.nodes.b!.attrs.sw = "MySQL";
    expect(signatureOf(noise, "group", "z")).toBe(base);
  });

  test("missing group gives null", () => {
    expect(signatureOf(makeState(), "group", "nope")).toBeNull();
  });
});

describe("overLimit for groups", () => {
  const group = (over: Partial<GroupExplanation> = {}): GroupExplanation => ({
    kind: "group", term: "DMZ", definition: "d", definitionSource: "glossary", reviewed: true, role: "r", boundary: "b",
    adr: { decision: "a", reason: "b", alternative: "c", cost: "d" }, ...over,
  });

  test("checks role, boundary and adr like a node", () => {
    expect(overLimit(group())).toEqual([]);
    expect(overLimit(group({ boundary: "x".repeat(LIMITS.boundary + 1), role: "x".repeat(LIMITS.role + 1), adr: { decision: "x".repeat(81), reason: "b", alternative: "c", cost: "d" } })))
      .toEqual(["role", "boundary", "adr.decision"]);
  });
});

describe("authoredExplanation", () => {
  const ADR = { decision: "d", reason: "r", alternative: "a", cost: "c" };

  test("authoredExplanation fills the definition from the seed", () => {
    const seed = GLOSSARY_SEED.find((e) => e.term === "Tomcat")!;
    const r = authoredExplanation(makeState(), "node:a", { role: "주문을 처리합니다.", adr: ADR })!;
    expect(r.targetKind).toBe("node");
    expect(r.targetId).toBe("a");
    expect(r.signature).toBe(signatureOf(makeState(), "node", "a"));
    expect(r.data).toMatchObject({
      kind: "node",
      term: seed.term,
      definition: seed.definition,
      definitionSource: "glossary",
      termSource: "seed",
      reviewed: true,
      authored: true,
      role: "주문을 처리합니다.",
    });
    if (seed.why) expect((r.data as NodeExplanation).why).toBe(seed.why);
    if (seed.compare) expect((r.data as NodeExplanation).compare).toBe(seed.compare);
  });

  test("authoredExplanation keeps an authored definition", () => {
    const r = authoredExplanation(makeState(), "node:a", { term: "주문 WAS", definition: "대본이 쓴 정의", role: "r", adr: ADR })!;
    const d = r.data as NodeExplanation;
    expect(d).toMatchObject({ term: "주문 WAS", definition: "대본이 쓴 정의", definitionSource: "glossary", reviewed: true, authored: true });
    expect(d.termSource).toBeUndefined();
    expect(d.why).toBeUndefined();
    expect(d.compare).toBeUndefined();
    // term 이 없고 seed 도 안 쓰면 대상 이름.
    const named = authoredExplanation(makeState(), "node:b", { definition: "x", role: "r", adr: ADR })!;
    expect((named.data as NodeExplanation).term).toBe("주문 DB");
  });

  test("group and edge shapes, missing targets give null", () => {
    const s = makeState();
    s.groups.z = { id: "z", groupKind: "dmz", label: "DMZ 구역", parent: null };
    const g = authoredExplanation(s, "group:z", { role: "r", boundary: "b", adr: ADR })!;
    expect(g.data).toMatchObject({ kind: "group", boundary: "b", authored: true, definitionSource: "glossary" });
    const e = authoredExplanation(s, "edge:e1", { flow: "f", method: "m", why: "w", firewall: "x" })!;
    expect(e.data).toEqual({ kind: "edge", flow: "f", method: "m", why: "w", firewall: "x", authored: true });
    expect(authoredExplanation(s, "node:nope", { role: "r", adr: ADR })).toBeNull();
    expect(authoredExplanation(s, "edge:nope", { flow: "f", method: "m", why: "w", firewall: "x" })).toBeNull();
  });
});
