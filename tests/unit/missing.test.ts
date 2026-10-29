import { expect, test } from "vitest";

import { computeMissing, missingReminder } from "@/domain/missing";
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
