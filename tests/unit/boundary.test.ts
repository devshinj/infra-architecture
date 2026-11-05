import { expect, test } from "vitest";

import { BOUNDARY_NODE_KINDS, crossesBoundary, isDirectCrossing, networkZoneOf } from "@/domain/boundary";
import type { NodeKind } from "@/domain/catalog";
import { emptyState, type DiagramState } from "@/domain/types";

const n = (id: string, kind: NodeKind, parent: string | null) => ({ id, kind, label: id, parent, attrs: {} });
const e = (id: string, from: string, to: string) => ({ id, from, to, edgeKind: "request" as const });

// 업무망(안: sub 그룹 > was), 인터넷망(api), 망 밖(link)
const build = (): DiagramState => ({
  ...emptyState(),
  groups: {
    biz: { id: "biz", groupKind: "network_zone", label: "업무망", parent: null },
    sub: { id: "sub", groupKind: "subnet_private", label: "sub", parent: "biz" },
    net: { id: "net", groupKind: "network_zone", label: "인터넷망", parent: null },
  },
  nodes: {
    was: n("was", "was", "sub"),
    was2: n("was2", "was", "biz"),
    api: n("api", "external_api", "net"),
    auth: n("auth", "external_api", "net"),
    link: n("link", "network_link", null),
    fw: n("fw", "firewall", "net"),
  },
});

test("node in 업무망 → zone id; node outside any network_zone → null", () => {
  const s = build();
  expect(networkZoneOf(s, "was")).toBe("biz");
  expect(networkZoneOf(s, "link")).toBeNull();
});

test("no network_zone in diagram → crossesBoundary false for every edge", () => {
  const s = build();
  s.groups = { sub: s.groups.sub };
  s.groups.sub.parent = null;
  s.edges = { a: e("a", "was", "api"), b: e("b", "was", "link") };
  for (const ed of Object.values(s.edges)) expect(crossesBoundary(s, ed)).toBe(false);
});

test("WAS(업무망) → network_link(망 밖) crosses", () => {
  const s = build();
  expect(crossesBoundary(s, e("x", "was", "link"))).toBe(true);
});

test("network_link → 인증(인터넷망) crosses", () => {
  const s = build();
  expect(crossesBoundary(s, e("x", "link", "auth"))).toBe(true);
});

test("same zone does not cross", () => {
  const s = build();
  expect(crossesBoundary(s, e("x", "was", "was2"))).toBe(false);
  expect(crossesBoundary(s, e("y", "api", "auth"))).toBe(false);
});

test("isDirectCrossing true only when neither end is firewall/network_link/vpn", () => {
  const s = build();
  expect([...BOUNDARY_NODE_KINDS].sort()).toEqual(["firewall", "network_link", "vpn"]);
  expect(isDirectCrossing(s, e("x", "was", "api"))).toBe(true);
  expect(isDirectCrossing(s, e("x", "was", "link"))).toBe(false);
  expect(isDirectCrossing(s, e("x", "was", "fw"))).toBe(false);
  expect(isDirectCrossing(s, e("x", "was", "was2"))).toBe(false);
});
