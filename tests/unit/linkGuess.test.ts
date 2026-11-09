import { describe, expect, it } from "vitest";
import { mergeFlowSteps, recordReplaced, revertLinkGuess, splitFlowSteps, splitsFor } from "@/domain/linkGuess";
import type { Flow } from "@/domain/flows";
import type { DiagramState, DNode, Edge } from "@/domain/types";

const node = (id: string, kind: DNode["kind"], extra: Partial<DNode> = {}): DNode => ({ id, kind, label: id, parent: null, attrs: {}, ...extra });
const edge = (id: string, from: string, to: string, extra: Partial<Edge> = {}): Edge => ({ id, from, to, edgeKind: "request", ...extra });

const base = (): DiagramState => ({
  groups: {},
  nodes: { fw: node("fw", "firewall"), was: node("was", "was"), other: node("other", "db") },
  edges: {
    "e-fw-was": edge("e-fw-was", "fw", "was", { label: "업무", direction: "one_way" }),
    "e-other-was": edge("e-other-was", "other", "was"),
  },
  assumptions: {},
});

/** fw→was 를 지우고 fw→link→was 를 그린 뒤 상태 */
const withLink = (): DiagramState => {
  const s = base();
  const edges = { ...s.edges };
  delete edges["e-fw-was"];
  return {
    ...s,
    nodes: { ...s.nodes, lk: node("lk", "network_link", { guess: { replaced: [] } }) },
    edges: { ...edges, "e-fw-lk": edge("e-fw-lk", "fw", "lk", { label: "업무", direction: "one_way" }), "e-lk-was": edge("e-lk-was", "lk", "was") },
  };
};

describe("recordReplaced", () => {
  it("방화벽→WAS 를 지우고 방화벽→망연계→WAS 를 그리면 replaced 에 원래 연결 그대로", () => {
    const rec = recordReplaced(base(), withLink());
    expect(rec).toEqual([
      { nodeId: "lk", guess: { replaced: [{ from: "fw", to: "was", edgeKind: "request", label: "업무", direction: "one_way", id: "e-fw-was" }] } },
    ]);
  });

  it("처음 그린 망연계는 bridge", () => {
    const b = base();
    const before: DiagramState = { ...b, edges: {} };
    const after = withLink();
    after.edges = { "e-fw-lk": after.edges["e-fw-lk"], "e-lk-was": after.edges["e-lk-was"] };
    const rec = recordReplaced(before, after);
    expect(rec[0].guess.replaced).toEqual([]);
    expect(rec[0].guess.bridge).toEqual({ from: "fw", to: "was", edgeKind: "request", label: "업무", direction: "one_way" });
  });

  it("이전에도 있던 노드나 guess 없는 노드는 기록하지 않는다", () => {
    const after = withLink();
    expect(recordReplaced(after, after)).toEqual([]);
    expect(recordReplaced(base(), base())).toEqual([]);
  });
});

describe("revertLinkGuess", () => {
  it("노드·앞뒤 연결만 지우고 원래 연결을 되살린다, 다른 것은 깊은 같음", () => {
    const s = withLink();
    s.nodes.lk.guess = recordReplaced(base(), s)[0].guess;
    const r = revertLinkGuess(s, "lk");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.partial).toBe(false);
    expect(r.state).toEqual(base());
    expect(r.merges).toEqual([{ inEdge: "e-fw-lk", outEdge: "e-lk-was", edge: "e-fw-was", link: "lk" }]);
  });

  it("원래 id 가 이미 쓰이면 add_edge 규칙의 id 를 쓴다", () => {
    const s = withLink();
    s.edges["e-fw-was"] = edge("e-fw-was", "other", "fw");
    s.nodes.lk.guess = { replaced: [{ from: "fw", to: "was", edgeKind: "request", id: "e-fw-was" }] };
    const r = revertLinkGuess(s, "lk");
    expect(r.ok && r.state.edges["e-fw-was-2"]).toBeTruthy();
  });

  it("guess 없는 노드는 not_guess, 없는 노드는 not_found", () => {
    expect(revertLinkGuess(base(), "fw")).toEqual({ ok: false, error: "not_guess" });
    expect(revertLinkGuess(base(), "nope")).toEqual({ ok: false, error: "not_found" });
  });

  it("끝 노드가 사라졌으면 partial, 나머지만 되살림", () => {
    const s = withLink();
    s.nodes.lk.guess = {
      replaced: [
        { from: "fw", to: "was", edgeKind: "request", id: "e-fw-was" },
        { from: "ghost", to: "was", edgeKind: "request" },
      ],
    };
    const r = revertLinkGuess(s, "lk");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.partial).toBe(true);
    expect(r.state.edges["e-fw-was"]).toBeTruthy();
    expect(Object.keys(r.state.edges).sort()).toEqual(["e-fw-was", "e-other-was"]);
  });

  it("사용자가 앞뒤 연결을 고쳤으면 partial", () => {
    const s = withLink();
    s.nodes.lk.guess = recordReplaced(base(), s)[0].guess;
    s.edges["e-other-lk"] = edge("e-other-lk", "other", "lk");
    const r = revertLinkGuess(s, "lk");
    expect(r.ok && r.partial).toBe(true);
    expect(r.ok && r.state.edges["e-other-lk"]).toBeUndefined();
  });

  it("끝이 그룹인 연결이 닿아 있어도 죽지 않는다", () => {
    const s = withLink();
    s.groups.g = { id: "g", groupKind: "network_zone", label: "g", parent: null };
    s.edges["e-g-lk"] = edge("e-g-lk", "g", "lk");
    s.edges["e-lk-g"] = edge("e-lk-g", "lk", "g");
    s.nodes.lk.guess = recordReplaced(base(), s)[0].guess;
    const r = revertLinkGuess(s, "lk");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.partial).toBe(false);
    expect(r.state.edges["e-g-lk"]).toBeUndefined();
    expect(r.state.edges["e-fw-was"]).toBeTruthy();
  });
});

describe("splitFlowSteps / mergeFlowSteps", () => {
  const fwd: Flow = { id: "f", name: "f", origin: "user", steps: [
    { edge: "e-other-was", from: "other", short: "a", text: "A" },
    { edge: "e-fw-was", from: "fw", short: "b", text: "B" },
  ] };
  const rev: Flow = { id: "r", name: "r", origin: "user", steps: [{ edge: "e-fw-was", from: "was", short: "c", text: "C" }] };
  const splits = splitsFor(base(), withLink(), [{ nodeId: "lk", guess: recordReplaced(base(), withLink())[0].guess }]);

  it("splitsFor 는 앞·뒤 연결을 찾는다", () => {
    expect(splits).toEqual([{ edge: "e-fw-was", inEdge: "e-fw-lk", outEdge: "e-lk-was", link: "lk", from: "fw", to: "was" }]);
  });

  it("정방향·역방향으로 나누고, 되돌리면 원래 흐름과 같다", () => {
    const merges = [{ inEdge: "e-fw-lk", outEdge: "e-lk-was", edge: "e-fw-was", link: "lk" }];
    const f2 = splitFlowSteps(fwd, splits)!;
    expect(f2.steps.map((s) => [s.edge, s.from, s.short])).toEqual([
      ["e-other-was", "other", "a"], ["e-fw-lk", "fw", "b"], ["e-lk-was", "lk", "b"],
    ]);
    const r2 = splitFlowSteps(rev, splits)!;
    expect(r2.steps.map((s) => [s.edge, s.from])).toEqual([["e-lk-was", "was"], ["e-fw-lk", "lk"]]);
    expect(mergeFlowSteps(f2, merges)).toEqual(fwd);
    expect(mergeFlowSteps(r2, merges)).toEqual(rev);
  });

  it("바뀐 게 없으면 null", () => {
    expect(splitFlowSteps({ ...fwd, steps: [fwd.steps[0]] }, splits)).toBeNull();
    expect(mergeFlowSteps(fwd, [])).toBeNull();
  });
});
