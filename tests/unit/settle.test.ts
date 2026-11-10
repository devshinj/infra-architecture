import { describe, expect, it } from "vitest";

import { emptyState, type DiagramState, type DNode } from "@/domain/types";
import { settleTurn } from "@/server/chat/settle";

import { adminCase } from "../fixtures/network";

const node = (id: string, parent: string | null, extra: Partial<DNode> = {}): DNode => ({ id, kind: "was", label: id, parent, attrs: {}, ...extra });

describe("settleTurn", () => {
  it("이번 차례에 빈 영역은 안쪽부터 remove_group 으로 지운다", () => {
    const before: DiagramState = {
      ...emptyState(),
      groups: {
        outer: { id: "outer", groupKind: "network_zone", label: "바깥", parent: null },
        inner: { id: "inner", groupKind: "subnet_private", label: "안쪽", parent: "outer" },
        keep: { id: "keep", groupKind: "network_zone", label: "남김", parent: null },
      },
      nodes: { a: node("a", "inner"), b: node("b", "keep") },
    };
    const after: DiagramState = { ...before, nodes: { b: before.nodes.b! } };
    const r = settleTurn(before, after);
    expect(r.emitted).toEqual([
      { op: "remove_group", id: "inner" },
      { op: "remove_group", id: "outer" },
    ]);
    expect(Object.keys(r.state.groups)).toEqual(["keep"]);
    expect(r.splits).toEqual([]);
  });

  it("추정으로 끼운 망연계는 set_link_guess 하나와 흐름 나누기 하나를 낸다", () => {
    const before = adminCase();
    const edges = { ...before.edges };
    delete edges.e2;
    const after: DiagramState = {
      ...before,
      nodes: { ...before.nodes, lk: { id: "lk", kind: "network_link", label: "망연계", parent: null, attrs: {}, guess: { replaced: [] } } },
      edges: {
        ...edges,
        "e-fw-lk": { id: "e-fw-lk", from: "fw", to: "lk", edgeKind: "request" },
        "e-lk-was": { id: "e-lk-was", from: "lk", to: "was", edgeKind: "request" },
      },
    };
    const r = settleTurn(before, after);
    expect(r.emitted).toEqual([
      { op: "set_link_guess", id: "lk", guess: { replaced: [{ id: "e2", from: "fw", to: "was", edgeKind: "request" }] } },
    ]);
    expect(r.state.nodes.lk!.guess).toEqual({ replaced: [{ id: "e2", from: "fw", to: "was", edgeKind: "request" }] });
    expect(r.splits).toEqual([{ edge: "e2", inEdge: "e-fw-lk", outEdge: "e-lk-was", link: "lk", from: "fw", to: "was" }]);
  });

  it("바뀐 것이 없으면 아무 명령도 내지 않는다", () => {
    const s = adminCase();
    const r = settleTurn(s, s);
    expect(r).toEqual({ state: s, emitted: [], splits: [] });
  });
});
