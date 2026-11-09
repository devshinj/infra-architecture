import { BOUNDARY_NODE_KINDS, crossesBoundary, networkZoneOf } from "./boundary";
import type { NetworkKnowledge } from "./network";
import { linkVerdicts } from "./networkRules";
import type { DiagramState } from "./types";

export type FlowOrigin = "user" | "system";
/** edge=연결 id, from=이 단계를 시작하는 노드 */
export interface FlowStep { edge: string; from: string; short: string; text: string }
export interface Flow { id: string; name: string; origin: FlowOrigin; summary?: string; result?: string; steps: FlowStep[] }

/** 흐름 만들기·고치기 명령이 받는 단계 모양(Task 4·5 공용). */
export interface FlowStepInput { edge: string; from: string; short: string; text: string }
export type FlowOp =
  | { op: "add_flow"; id: string; name: string; origin: FlowOrigin; summary?: string; result?: string; steps: FlowStepInput[] }
  | { op: "update_flow"; id: string; name?: string; summary?: string; result?: string; steps?: FlowStepInput[] }
  | { op: "remove_flow"; id: string };

export type FlowProblem =
  | { kind: "missing_edge"; step: number }
  | { kind: "bad_start"; step: number }
  | { kind: "disconnected"; step: number }
  | { kind: "against_direction"; step: number };

export const FLOW_LIMITS = { flows: 20, steps: 20, short: 12 } as const;

/** 단계의 도착 노드. 연결이 없거나 from 이 그 연결의 끝이 아니면 null. */
export function stepEnd(state: DiagramState, step: FlowStep): string | null {
  const edge = state.edges[step.edge];
  if (!edge) return null;
  if (step.from === edge.from) return edge.to;
  if (step.from === edge.to) return edge.from;
  return null;
}

/** 끊김은 저장하지 않고 늘 여기서 계산한다. 갈래를 허용한다. */
export function checkFlow(state: DiagramState, flow: Flow): FlowProblem[] {
  const problems: FlowProblem[] = [];
  const reachable = new Set<string>();
  flow.steps.forEach((step, i) => {
    const edge = state.edges[step.edge];
    if (!edge) {
      problems.push({ kind: "missing_edge", step: i });
      if (i === 0) reachable.add(step.from);
      return;
    }
    const end = stepEnd(state, step);
    if (end === null) {
      problems.push({ kind: "bad_start", step: i });
      if (i === 0) reachable.add(step.from);
      return;
    }
    if (i === 0) reachable.add(step.from);
    else if (!reachable.has(step.from)) problems.push({ kind: "disconnected", step: i });
    if (edge.direction === "one_way" && step.from === edge.to && edge.from !== edge.to) {
      problems.push({ kind: "against_direction", step: i });
    }
    reachable.add(end);
  });
  return problems;
}

const toSteps = (steps: FlowStepInput[]): FlowStep[] =>
  steps.map((s) => ({ edge: s.edge, from: s.from, short: shortLabel(s.short), text: s.text }));

/** 검사에 걸린 문제 종류(겹치지 않게, 처음 나온 순서). */
const problemReason = (problems: FlowProblem[]) => [...new Set(problems.map((p) => p.kind))].join(",");

/** 흐름 명령 하나의 판정. saved 는 저장할 흐름(만들기·고치기), removed 는 지우기. */
export type FlowOpOutcome = { kind: "rejected"; reason: string } | { kind: "saved"; flow: Flow } | { kind: "removed" };

/**
 * 흐름 명령을 쓰기 없이 순서대로 판정한다. 거절한 명령은 뒤 명령에 영향을 주지 않는다(저장소 적용과 같다).
 * - add: 같은 id 가 있거나, 흐름이 상한에 찼거나, 단계가 상한을 넘거나, 검사에 걸리면 거절.
 * - update: 없으면 거절. 준 칸만 바꾸고, 바꾼 결과가 검사에 걸리면 거절.
 * - remove: 없으면 거절.
 */
export function judgeFlowOps(state: DiagramState, existing: Flow[], ops: FlowOp[]): FlowOpOutcome[] {
  const current = new Map(existing.map((f) => [f.id, f]));
  return ops.map((op): FlowOpOutcome => {
    if (op.op === "remove_flow") {
      if (!current.delete(op.id)) return { kind: "rejected", reason: "not_found" };
      return { kind: "removed" };
    }
    let next: Flow;
    if (op.op === "add_flow") {
      if (current.has(op.id)) return { kind: "rejected", reason: "exists" };
      if (current.size >= FLOW_LIMITS.flows) return { kind: "rejected", reason: "too_many_flows" };
      next = { id: op.id, name: op.name, origin: op.origin, steps: toSteps(op.steps) };
      if (op.summary !== undefined) next.summary = op.summary;
      if (op.result !== undefined) next.result = op.result;
    } else {
      const prev = current.get(op.id);
      if (!prev) return { kind: "rejected", reason: "not_found" };
      next = structuredClone(prev);
      if (op.name !== undefined) next.name = op.name;
      if (op.summary !== undefined) next.summary = op.summary;
      if (op.result !== undefined) next.result = op.result;
      if (op.steps !== undefined) next.steps = toSteps(op.steps);
    }
    if (next.steps.length === 0) return { kind: "rejected", reason: "no_steps" };
    if (next.steps.length > FLOW_LIMITS.steps) return { kind: "rejected", reason: "too_many_steps" };
    const problems = checkFlow(state, next);
    if (problems.length) return { kind: "rejected", reason: problemReason(problems) };
    current.set(op.id, next);
    return { kind: "saved", flow: next };
  });
}

/** 흐름 명령을 미리 검사한다(쓰기 없음). 하나라도 거절이면 거절 전부(명령 순서 index)를 돌려준다. */
export function planFlowOps(
  state: DiagramState,
  existing: Flow[],
  ops: FlowOp[],
): { ok: true; changed: number } | { ok: false; rejected: { index: number; reason: string }[] } {
  const rejected: { index: number; reason: string }[] = [];
  judgeFlowOps(state, existing, ops).forEach((o, index) => {
    if (o.kind === "rejected") rejected.push({ index, reason: o.reason });
  });
  return rejected.length ? { ok: false, rejected } : { ok: true, changed: ops.length };
}

/** 이 노드·연결을 지나는 흐름(끊긴 단계는 세지 않는다). */
export function flowsThrough(state: DiagramState, flows: Flow[], id: string): Flow[] {
  return flows.filter((f) =>
    f.steps.some((s) => {
      const end = stepEnd(state, s);
      if (end === null) return false;
      return s.edge === id || s.from === id || end === id;
    }),
  );
}

/** 캔버스용 짧은 설명: 12자 넘으면 11자 + "…". 글자 수는 코드 포인트 기준. */
export function shortLabel(s: string): string {
  const chars = [...s];
  if (chars.length <= FLOW_LIMITS.short) return s;
  return chars.slice(0, FLOW_LIMITS.short - 1).join("") + "…";
}

/** 단계 설명에 덧붙는 경계 넘김 문장(경계를 안 넘으면 null). */
export function crossingNote(state: DiagramState, step: FlowStep, knowledge?: NetworkKnowledge): string | null {
  const base = crossingBase(state, step);
  if (!knowledge) return base;
  const hit = linkVerdicts(state, knowledge).find((v) => v.path.edges.includes(step.edge));
  if (!hit) return base;
  const tail = hit.rule === "link_expected" ? "망연계 필요 예상" : "보통 잇지 않는 구간";
  return base ? `${base} · ${tail}` : tail;
}

function crossingBase(state: DiagramState, step: FlowStep): string | null {
  const edge = state.edges[step.edge];
  if (!edge || !crossesBoundary(state, edge)) return null;
  const zoneLabel = (nodeId: string) => {
    const z = networkZoneOf(state, nodeId);
    return z ? state.groups[z]?.label ?? null : null;
  };
  const end = stepEnd(state, step) ?? (step.from === edge.from ? edge.to : edge.from);
  const fromLabel = zoneLabel(step.from) ?? "망 밖";
  const toLabel = zoneLabel(end) ?? "망 밖";
  const boundary = [step.from, end].map((id) => state.nodes[id]).find((nd) => nd && BOUNDARY_NODE_KINDS.has(nd.kind));
  // 화살표 글자(→)는 화면 글꼴에서 ">" 처럼 보여 말로 쓴다.
  return `${fromLabel}에서 ${toLabel}으로 넘어가요${boundary ? `(${boundary.label} 거침)` : ""}`;
}

/** 사용자가 흐름 단계의 글(짧은 설명·설명)을 고쳐 달라고 한 요청인지. 그때만 AI 가 쓴 단계 글을 그대로 받는다. */
export function asksStepText(text: string): boolean {
  return /설명|문구|단계\s*글/.test(text);
}

/**
 * 흐름을 고치는 명령의 단계 중 원래 흐름에도 있던 단계(같은 연결·같은 시작 노드)는 원래 짧은 설명·설명 글을 쓴다.
 * AI 는 흐름 목록에서 연결 id 만 보므로, 단계 전체를 다시 쓸 때 남는 단계의 글을 새로 지어내기 때문이다.
 */
export function keepStepText<T extends FlowOp>(op: T, before: Flow[]): T {
  if (op.op !== "update_flow" || !op.steps) return op;
  const flow = before.find((f) => f.id === op.id);
  if (!flow) return op;
  const old = new Map(flow.steps.map((s) => [`${s.edge}\u0000${s.from}`, s]));
  return {
    ...op,
    steps: op.steps.map((s) => {
      const o = old.get(`${s.edge}\u0000${s.from}`);
      return o ? { ...s, short: o.short, text: o.text } : s;
    }),
  };
}
