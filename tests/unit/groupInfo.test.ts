import { describe, expect, test } from "vitest";

import { crossingEdges, groupMembers, isInside } from "@/domain/groupInfo";
import type { DiagramState } from "@/domain/types";

/** vpc 안에 app·sub(안에 db), 밖에 user. 연결: user→app(들어옴), app→db(안끼리), db→ext(나감), user→vpc(영역 자신으로 들어옴), sub→app(안끼리). */
function makeState(): DiagramState {
  return {
    groups: {
      vpc: { id: "vpc", groupKind: "vpc", label: "주문 VPC", parent: null },
      sub: { id: "sub", groupKind: "subnet_private", label: "DB 구역", parent: "vpc" },
      other: { id: "other", groupKind: "external_service", label: "외부", parent: null },
    },
    nodes: {
      app: { id: "app", kind: "was", label: "WAS", parent: "vpc", attrs: {} },
      db: { id: "db", kind: "db_rdb", label: "주문 DB", parent: "sub", attrs: {} },
      user: { id: "user", kind: "client_web", label: "사용자", parent: null, attrs: {} },
      ext: { id: "ext", kind: "managed_service", label: "PG", parent: "other", attrs: {} },
    },
    edges: {
      e1: { id: "e1", from: "user", to: "app", edgeKind: "request", label: "HTTPS" },
      e2: { id: "e2", from: "app", to: "db", edgeKind: "request" },
      e3: { id: "e3", from: "db", to: "ext", edgeKind: "request" },
      e4: { id: "e4", from: "user", to: "vpc", edgeKind: "request" },
      e5: { id: "e5", from: "sub", to: "app", edgeKind: "request" },
    },
    assumptions: {},
  };
}

describe("isInside", () => {
  test("the group itself and every descendant are inside", () => {
    const s = makeState();
    expect(isInside(s, "vpc", "vpc")).toBe(true);
    expect(isInside(s, "app", "vpc")).toBe(true);
    expect(isInside(s, "db", "vpc")).toBe(true);
    expect(isInside(s, "sub", "vpc")).toBe(true);
    expect(isInside(s, "user", "vpc")).toBe(false);
    expect(isInside(s, "app", "sub")).toBe(false);
  });

  test("a parent cycle does not loop forever", () => {
    const s = makeState();
    s.groups.vpc!.parent = "sub";
    expect(isInside(s, "user", "sub")).toBe(false);
  });
});

describe("groupMembers", () => {
  test("lists direct child groups first, then direct child nodes, each by label", () => {
    const s = makeState();
    s.nodes.batch = { id: "batch", kind: "app_server", label: "배치", parent: "vpc", attrs: {} };
    expect(groupMembers(s, "vpc")).toEqual([
      { id: "sub", kind: "group", label: "DB 구역" },
      { id: "batch", kind: "node", label: "배치" },
      { id: "app", kind: "node", label: "WAS" },
    ]);
    expect(groupMembers(s, "sub")).toEqual([{ id: "db", kind: "node", label: "주문 DB" }]);
  });
});

describe("crossingEdges", () => {
  test("keeps only edges with exactly one end inside, with direction and both ends", () => {
    const s = makeState();
    expect(crossingEdges(s, "vpc")).toEqual([
      { edgeId: "e1", dir: "in", insideId: "app", outsideId: "user" },
      { edgeId: "e3", dir: "out", insideId: "db", outsideId: "ext" },
      { edgeId: "e4", dir: "in", insideId: "vpc", outsideId: "user" },
    ]);
  });

  test("an inner group sees edges to its parent's other members as crossing", () => {
    const s = makeState();
    expect(crossingEdges(s, "sub")).toEqual([
      { edgeId: "e2", dir: "in", insideId: "db", outsideId: "app" },
      { edgeId: "e3", dir: "out", insideId: "db", outsideId: "ext" },
      { edgeId: "e5", dir: "out", insideId: "sub", outsideId: "app" },
    ]);
  });
});
