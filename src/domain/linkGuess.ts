import { freeEdgeId } from "./apply";
import type { Flow, FlowStep } from "./flows";
import type { DiagramState, Edge, LinkGuess, ReplacedEdge } from "./types";

/** edge(from→to) 가 from→link(inEdge), link→to(outEdge) 로 갈린다. from·to 는 원래 연결의 양 끝(흐름 방향 판정용). */
export interface StepSplit { edge: string; inEdge: string; outEdge: string; link: string; from: string; to: string }
export interface StepMerge { inEdge: string; outEdge: string; edge: string; link: string }

const has = (o: object, k: string) => Object.hasOwn(o, k);

function toReplaced(e: Edge, id?: string): ReplacedEdge {
  return {
    from: e.from,
    to: e.to,
    edgeKind: e.edgeKind,
    ...(e.label !== undefined ? { label: e.label } : {}),
    ...(e.payload !== undefined ? { payload: e.payload } : {}),
    ...(e.direction !== undefined ? { direction: e.direction } : {}),
    ...(id !== undefined ? { id } : {}),
  };
}

/** 망연계로 들어오는(앞) / 나가는(뒤) 연결. 반대쪽 끝이 노드가 아니면(그룹) 건너뛴다. */
function incident(state: DiagramState, link: string) {
  const ins: Edge[] = [];
  const outs: Edge[] = [];
  for (const e of Object.values(state.edges)) {
    if (e.to === link && e.from !== link && has(state.nodes, e.from)) ins.push(e);
    else if (e.from === link && e.to !== link && has(state.nodes, e.to)) outs.push(e);
  }
  return { ins, outs };
}

/** 차례 시작·끝 상태로, 이번 차례에 guess 로 새로 생긴 network_link 마다 대신한 연결을 계산한다. */
export function recordReplaced(before: DiagramState, after: DiagramState): { nodeId: string; guess: LinkGuess }[] {
  const result: { nodeId: string; guess: LinkGuess }[] = [];
  for (const node of Object.values(after.nodes)) {
    if (!node.guess || has(before.nodes, node.id)) continue;
    const { ins, outs } = incident(after, node.id);
    const preds = new Set(ins.map((e) => e.from));
    const succs = new Set(outs.map((e) => e.to));
    const replaced = Object.values(before.edges)
      .filter((e) => !has(after.edges, e.id) && preds.has(e.from) && succs.has(e.to))
      .map((e) => toReplaced(e, e.id));
    const guess: LinkGuess = { replaced };
    // 앞·뒤가 여럿이어도 bridge 는 하나(LinkGuess.bridge 가 하나): 먼저 그린 앞 × 먼저 그린 뒤.
    if (replaced.length === 0 && ins.length > 0 && outs.length > 0) {
      const inEdge = ins[0];
      guess.bridge = toReplaced({ ...inEdge, from: inEdge.from, to: outs[0].to });
    }
    result.push({ nodeId: node.id, guess });
  }
  return result;
}

const sameSet = (a: Set<string>, b: Set<string>) => a.size === b.size && [...a].every((x) => b.has(x));

/** 망연계 노드 하나를 되돌린다. 순수 함수. */
export function revertLinkGuess(
  state: DiagramState,
  nodeId: string,
):
  | { ok: true; state: DiagramState; partial: boolean; merges: StepMerge[] }
  | { ok: false; error: "not_found" | "not_guess" } {
  if (!has(state.nodes, nodeId)) return { ok: false, error: "not_found" };
  const node = state.nodes[nodeId];
  if (!node.guess) return { ok: false, error: "not_guess" };

  const { ins, outs } = incident(state, nodeId);
  const toRestore = node.guess.replaced.length > 0 ? node.guess.replaced : node.guess.bridge ? [node.guess.bridge] : [];
  let partial = !sameSet(new Set(ins.map((e) => e.from)), new Set(toRestore.map((r) => r.from)))
    || !sameSet(new Set(outs.map((e) => e.to)), new Set(toRestore.map((r) => r.to)));

  const nodes = { ...state.nodes };
  delete nodes[nodeId];
  const edges: Record<string, Edge> = {};
  for (const [id, e] of Object.entries(state.edges)) {
    if (e.from !== nodeId && e.to !== nodeId) edges[id] = e;
  }
  let next: DiagramState = { ...state, nodes, edges };

  const merges: StepMerge[] = [];
  const endOk = (id: string) => has(next.nodes, id) || has(next.groups, id);
  for (const r of toRestore) {
    if (!endOk(r.from) || !endOk(r.to)) {
      partial = true;
      continue;
    }
    const taken = (id: string) => has(next.groups, id) || has(next.nodes, id) || has(next.edges, id);
    const id = r.id !== undefined && !taken(r.id) ? r.id : freeEdgeId(next, r.from, r.to);
    const restored: Edge = {
      id,
      from: r.from,
      to: r.to,
      edgeKind: r.edgeKind,
      ...(r.label !== undefined ? { label: r.label } : {}),
      ...(r.payload !== undefined ? { payload: r.payload } : {}),
      ...(r.direction !== undefined ? { direction: r.direction } : {}),
    };
    next = { ...next, edges: { ...next.edges, [id]: restored } };
    const inE = ins.find((e) => e.from === r.from);
    const outE = outs.find((e) => e.to === r.to);
    if (inE && outE) merges.push({ inEdge: inE.id, outEdge: outE.id, edge: id, link: nodeId });
  }
  return { ok: true, state: next, partial, merges };
}

/** guess 로 갈라진 연결마다, after 에서 앞쪽·뒤쪽 연결을 찾아 흐름 나누기 정보로 만든다. */
export function splitsFor(
  before: DiagramState,
  after: DiagramState,
  recorded: { nodeId: string; guess: LinkGuess }[],
): StepSplit[] {
  const splits: StepSplit[] = [];
  for (const { nodeId, guess } of recorded) {
    const { ins, outs } = incident(after, nodeId);
    for (const r of guess.replaced) {
      const orig =
        r.id !== undefined && has(before.edges, r.id)
          ? before.edges[r.id]
          : Object.values(before.edges).find((e) => e.from === r.from && e.to === r.to);
      const inE = ins.find((e) => e.from === r.from);
      const outE = outs.find((e) => e.to === r.to);
      if (!orig || !inE || !outE) continue;
      splits.push({ edge: orig.id, inEdge: inE.id, outEdge: outE.id, link: nodeId, from: r.from, to: r.to });
    }
  }
  return splits;
}

export function splitFlowSteps(flow: Flow, splits: StepSplit[]): Flow | null {
  let changed = false;
  const steps: FlowStep[] = [];
  for (const step of flow.steps) {
    const sp = splits.find((s) => s.edge === step.edge && (step.from === s.from || step.from === s.to));
    if (!sp) {
      steps.push(step);
      continue;
    }
    changed = true;
    const { short, text } = step;
    if (step.from === sp.from) {
      steps.push({ edge: sp.inEdge, from: sp.from, short, text }, { edge: sp.outEdge, from: sp.link, short, text });
    } else {
      steps.push({ edge: sp.outEdge, from: sp.to, short, text }, { edge: sp.inEdge, from: sp.link, short, text });
    }
  }
  return changed ? { ...flow, steps } : null;
}

export function mergeFlowSteps(flow: Flow, merges: StepMerge[]): Flow | null {
  let changed = false;
  const steps: FlowStep[] = [];
  for (let i = 0; i < flow.steps.length; i++) {
    const a = flow.steps[i];
    const b = flow.steps[i + 1];
    const m = b && merges.find((x) => b.from === x.link && ((a.edge === x.inEdge && b.edge === x.outEdge) || (a.edge === x.outEdge && b.edge === x.inEdge)));
    if (m) {
      steps.push({ edge: m.edge, from: a.from, short: a.short, text: a.text });
      changed = true;
      i++;
    } else {
      steps.push(a);
    }
  }
  return changed ? { ...flow, steps } : null;
}
