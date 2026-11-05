import { expect, test } from "vitest";

import { computeMissing, isEmpty, missingReminder, requiredKeysFor } from "@/domain/missing";
import { emptyState, type DiagramState } from "@/domain/types";

const withNode = (attrs: Record<string, string | number | null>, unknown?: string[]): DiagramState => ({
  ...emptyState(),
  nodes: { "was-1": { id: "was-1", kind: "was", label: "WAS", parent: null, attrs, ...(unknown ? { unknown } : {}) } },
});

test("server node lists every empty required attr", () => {
  const r = computeMissing(withNode({ sw: "Tomcat", ram: null }));
  expect(r.items.map((i) => i.key)).toEqual(["hostname", "cpu", "ram", "disk", "os", "ip"]);
  expect(r.items[0]).toEqual({ targetKind: "node", targetId: "was-1", key: "hostname", label: "호스트명", unknown: false });
  expect(r.count).toBe(6);
  expect(r.byNode["was-1"]).toBe(6);
});

test("whitespace counts as empty", () => {
  const full = { hostname: "h", cpu: 1, ram: 1, disk: 1, os: "o", ip: "  ", sw: "s" };
  const r = computeMissing(withNode(full));
  expect(r.items.map((i) => i.key)).toEqual(["ip"]);
});

test("unknown is listed but not counted", () => {
  const r = computeMissing(withNode({}, ["ip"]));
  const ip = r.items.find((i) => i.key === "ip");
  expect(ip?.unknown).toBe(true);
  expect(r.count).toBe(6);
  expect(r.byNode["was-1"]).toBe(6);
});

test("filled value wins over unknown", () => {
  const r = computeMissing(withNode({ ip: "10.0.0.1" }, ["ip"]));
  expect(r.items.find((i) => i.key === "ip")).toBeUndefined();
});

test("kinds without required attrs produce no items", () => {
  const s = emptyState();
  for (const kind of ["client_web", "cdn", "dns"] as const) {
    s.nodes[kind] = { id: kind, kind, label: kind, parent: null, attrs: {} };
  }
  const r = computeMissing(s);
  expect(r.items).toEqual([]);
  expect(r.count).toBe(0);
  expect(r.byNode).toEqual({});
});

test("request and async edges need a label, replication and aux do not", () => {
  const s = emptyState();
  s.edges = {
    a: { id: "a", from: "x", to: "y", edgeKind: "request" },
    b: { id: "b", from: "x", to: "y", edgeKind: "async", label: " " },
    c: { id: "c", from: "x", to: "y", edgeKind: "replication" },
    d: { id: "d", from: "x", to: "y", edgeKind: "aux" },
    e: { id: "e", from: "x", to: "y", edgeKind: "request", label: "HTTPS" },
  };
  const r = computeMissing(s);
  expect(r.items).toEqual([
    { targetKind: "edge", targetId: "a", key: "label", label: "프로토콜/포트", unknown: false },
    { targetKind: "edge", targetId: "b", key: "label", label: "프로토콜/포트", unknown: false },
  ]);
  expect(r.count).toBe(2);
});

test("unknown travels with the state", () => {
  const a = withNode({}, ["ip"]);
  const b = structuredClone(a);
  delete b.nodes["was-1"].unknown;
  expect(computeMissing(structuredClone(a)).count).toBe(6);
  expect(computeMissing(b).count).toBe(7);
});

test("missingReminder", () => {
  expect(missingReminder(3)).toBe("빠진 정보 3개가 있어요");
});

test("requiredKeysFor returns the target's keys or null", () => {
  const s = withNode({});
  s.edges = {
    r: { id: "r", from: "a", to: "b", edgeKind: "request" },
    x: { id: "x", from: "a", to: "b", edgeKind: "aux" },
  };
  expect(requiredKeysFor(s, "node", "was-1")).toContain("ram");
  expect(requiredKeysFor(s, "edge", "r")).toEqual(["label"]);
  expect(requiredKeysFor(s, "edge", "x")).toEqual([]);
  expect(requiredKeysFor(s, "node", "nope")).toBeNull();
  expect(requiredKeysFor(s, "edge", "nope")).toBeNull();
});

test("isEmpty treats undefined, null and whitespace-only strings as empty", () => {
  expect([undefined, null, "", "  	"].every(isEmpty)).toBe(true);
  expect(["a", 0, " x "].some(isEmpty)).toBe(false);
});

const crossState = (edge: Partial<import("@/domain/types").Edge> = {}): DiagramState => ({
  ...emptyState(),
  groups: {
    biz: { id: "biz", groupKind: "network_zone", label: "업무망", parent: null },
    net: { id: "net", groupKind: "network_zone", label: "인터넷망", parent: null },
  },
  nodes: {
    a: { id: "a", kind: "was", label: "A", parent: "biz", attrs: {} },
    b: { id: "b", kind: "external_api", label: "B", parent: "net", attrs: {} },
  },
  edges: { e: { id: "e", from: "a", to: "b", edgeKind: "request", label: "HTTPS", ...edge } },
});
const edgeItems = (s: DiagramState) => computeMissing(s).items.filter((i) => i.targetKind === "edge");

test("crossing edge without payload/direction adds two items labelled 전달물/방향", () => {
  const r = computeMissing(crossState());
  expect(edgeItems(crossState()).map((i) => [i.key, i.label])).toEqual([["payload", "전달물"], ["direction", "방향"]]);
  expect(r.count).toBe(r.items.filter((i) => !i.unknown && i.targetKind === "edge").length + r.items.filter((i) => i.targetKind === "node" && !i.unknown).length);
  expect(requiredKeysFor(crossState(), "edge", "e")).toEqual(["label", "payload", "direction"]);
});

test("filled values clear them", () => {
  expect(edgeItems(crossState({ payload: "api", direction: "one_way" }))).toEqual([]);
  expect(edgeItems(crossState({ payload: "file" })).map((i) => i.key)).toEqual(["direction"]);
});

test("non-crossing edge unchanged", () => {
  const s = crossState();
  s.nodes.b.parent = "biz";
  expect(edgeItems(s)).toEqual([]);
  s.edges.e.label = "";
  expect(edgeItems(s).map((i) => i.key)).toEqual(["label"]);
});
