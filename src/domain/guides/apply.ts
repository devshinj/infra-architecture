import { applyCommand, type ApplyOptions } from "@/domain/apply";
import { isFlowCommand, toFlowOp, type Command } from "@/domain/commands";
import type { FlowOp } from "@/domain/flows";
import { emptyState, type DiagramState } from "@/domain/types";

import type { GuideStep, GuideVariant } from "./types";

export type ApplyGuideStepResult =
  | { ok: true; state: DiagramState; emitted: Command[]; flowOps: FlowOp[] }
  | { ok: false; error: string };

/**
 * 대본 한 단계를 구성도에 적용한다. 구성·가정 명령은 차례로 적용하고(하나라도 거절되면 ok:false, `#<index> <error>`),
 * 흐름 명령은 적용하지 않고 flowOps 로 돌려준다. 대본이 넣은 가정·망 종류는 학습자가 확정한 것으로 친다.
 */
export function applyGuideStep(state: DiagramState, step: GuideStep, opts: ApplyOptions = {}): ApplyGuideStepResult {
  let cur = state;
  const emitted: Command[] = [];
  const flowOps: FlowOp[] = [];
  const assumed = new Set<string>();
  const zoned = new Set<string>();
  for (const [index, cmd] of step.commands.entries()) {
    if (isFlowCommand(cmd)) {
      flowOps.push(toFlowOp(cmd));
      continue;
    }
    const r = applyCommand(cur, cmd, opts);
    if (!r.ok) return { ok: false, error: `#${index} ${r.error}` };
    cur = r.state;
    emitted.push(cmd);
    if (cmd.op === "set_assumption") assumed.add(cmd.key);
    if (cmd.op === "set_zone_type") zoned.add(cmd.id);
  }
  const assumptions = { ...cur.assumptions };
  for (const key of assumed) assumptions[key] = { ...assumptions[key]!, confirmed: true };
  const groups = { ...cur.groups };
  for (const id of zoned) {
    const g = groups[id];
    if (g?.netType) groups[id] = { ...g, netType: { key: g.netType.key, source: "user", confirmed: true } };
  }
  return { ok: true, state: { ...cur, assumptions, groups }, emitted, flowOps };
}

/** 환경 가정을 확정한다. 이미 확정돼 있으면 값을 덮는다. */
export function confirmEnvironment(state: DiagramState, value: string): { state: DiagramState; cmd: Command } {
  const { environment: _old, ...rest } = state.assumptions;
  void _old;
  const cmd: Command = { op: "set_assumption", key: "environment", value };
  const r = applyCommand({ ...state, assumptions: rest }, cmd);
  if (!r.ok) throw new Error(r.error);
  const next = { ...r.state, assumptions: { ...r.state.assumptions, environment: { key: "environment", value, confirmed: true } } };
  return { state: next, cmd };
}

/** 빈 상태에 환경을 확정하고 0..upTo-1 단계를 적용한다. 거절되면 throw. */
export function buildGuideState(variant: GuideVariant, upTo: number, opts: ApplyOptions = {}): { state: DiagramState; flowOps: FlowOp[] } {
  let state = confirmEnvironment(emptyState(), variant.environment).state;
  const flowOps: FlowOp[] = [];
  for (const [i, step] of variant.steps.slice(0, upTo).entries()) {
    const r = applyGuideStep(state, step, opts);
    if (!r.ok) throw new Error(`단계 ${i} (${step.id}) ${r.error}`);
    state = r.state;
    flowOps.push(...r.flowOps);
  }
  return { state, flowOps };
}

/** from 단계 이후가 add_flow 하는 흐름 id. */
export function stepFlowIds(variant: GuideVariant, from: number): string[] {
  return variant.steps
    .slice(from)
    .flatMap((s) => s.commands.filter(isFlowCommand))
    .filter((c) => c.op === "add_flow")
    .map((c) => c.id);
}
