/** 의도 점검(eval-intent.ts)용 순수 도우미: Qwen 출력 판정과 기준 파일 비교. */

export type QwenExpect =
  | { expect: "none" }
  | { expect: "structure" }
  | { expect: "flow"; ops: string[] }
  | { expect: "edge"; edge: string; payload: string; direction: string }
  | { expect: "node_attr"; node: string }
  | { expect: "record" }
  | { expect: "skip" };

/** 문장별 추가 검사. 기대(expect)와 함께 모두 맞아야 통과다. */
export interface QwenGuards {
  /** 나오면 안 되는 명령 */
  forbid?: string[];
  /** 기존 흐름을 고칠 때 남아 있는 단계(같은 연결)의 짧은 설명을 바꾸면 안 된다 */
  keepStepText?: boolean;
}

/** Qwen 이 낸 명령 중 판정에 쓰는 것만(스키마를 통과한 명령). */
export interface SeenCommand {
  op: string;
  id?: string;
  payload?: string;
  direction?: string;
  attrs?: Record<string, unknown>;
  steps?: { edge: string; short: string }[];
}

/**
 * 추가 검사. 문제가 없으면 null.
 * guessed: 망을 넘지 않는데 전달물·방향을 적은 연결 id(스크립트가 적용 뒤 구성으로 구한다).
 * flows: 차례 시작 때의 흐름(id → 단계).
 */
export function checkGuards(
  g: QwenGuards,
  cmds: SeenCommand[],
  ctx: { guessed: string[]; flows: Record<string, { edge: string; short: string }[]> },
): string | null {
  const bad = (g.forbid ?? []).filter((op) => cmds.some((c) => c.op === op));
  if (bad.length) return `나오면 안 되는 명령: ${bad.join(", ")}`;
  if (ctx.guessed.length) return `망을 안 넘는 연결에 전달물·방향을 지어냄: ${ctx.guessed.join(", ")}`;
  if (g.keepStepText) {
    for (const c of cmds) {
      if (c.op !== "update_flow" || !c.id || !c.steps) continue;
      const before = new Map((ctx.flows[c.id] ?? []).map((s) => [s.edge, s.short]));
      const changed = c.steps.filter((s) => before.has(s.edge) && before.get(s.edge) !== s.short);
      if (changed.length) return `${c.id} 단계 글을 바꿈: ${changed.map((s) => `${before.get(s.edge)}→${s.short}`).join(", ")}`;
    }
  }
  return null;
}

const FLOW = new Set(["add_flow", "update_flow", "remove_flow"]);
const STRUCTURAL = (op: string) => op !== "set_assumption" && !FLOW.has(op);

/** 기대에 맞으면 null, 아니면 짧은 이유. record·skip 은 늘 null. */
export function judgeQwen(exp: QwenExpect, cmds: SeenCommand[]): string | null {
  switch (exp.expect) {
    case "record":
    case "skip":
      return null;
    case "none":
      return cmds.length === 0 ? null : `명령 ${cmds.length}개를 냄(${summarizeOps(cmds)})`;
    case "structure":
      return cmds.some((c) => STRUCTURAL(c.op)) ? null : `구성 명령 없음(${summarizeOps(cmds)})`;
    case "flow": {
      const flows = cmds.filter((c) => FLOW.has(c.op));
      if (flows.length === 0) return `흐름 명령 없음(${summarizeOps(cmds)})`;
      return flows.some((c) => exp.ops.includes(c.op)) ? null : `기대한 흐름 명령(${exp.ops.join("/")}) 없음(${summarizeOps(cmds)})`;
    }
    case "edge": {
      const hit = cmds.filter((c) => c.op === "update_edge" && c.id === exp.edge);
      if (hit.length === 0) return `${exp.edge} 갱신 없음(${summarizeOps(cmds)})`;
      const payload = lastDefined(hit.map((c) => c.payload));
      const direction = lastDefined(hit.map((c) => c.direction));
      if (payload !== exp.payload || direction !== exp.direction) return `값이 다름(${payload ?? "-"}, ${direction ?? "-"})`;
      return null;
    }
    case "node_attr": {
      const ok = cmds.some((c) => c.op === "update_node" && c.id === exp.node && c.attrs && Object.keys(c.attrs).length > 0);
      return ok ? null : `${exp.node} 속성 갱신 없음(${summarizeOps(cmds)})`;
    }
  }
}

const lastDefined = <T>(xs: (T | undefined)[]): T | undefined => xs.filter((x) => x !== undefined).at(-1);

/** "add_flow×2, update_edge" 꼴. 없으면 "명령 없음". */
export function summarizeOps(cmds: SeenCommand[]): string {
  if (cmds.length === 0) return "명령 없음";
  const counts = new Map<string, number>();
  for (const c of cmds) counts.set(c.op, (counts.get(c.op) ?? 0) + 1);
  return [...counts].map(([op, n]) => (n > 1 ? `${op}×${n}` : op)).join(", ");
}

/** 한 문장의 결과. intentOk·qwenOk 가 null 이면 이번에 재지 않았다는 뜻. */
export interface CaseResult {
  id: string;
  intent: string | null;
  confidence: number | null;
  routed: string;
  intentOk: boolean;
  qwenOk: boolean | null;
  qwenNote?: string;
  /** --repeat 로 여러 번 돌렸을 때 통과 횟수/전체. qwenOk 는 모두 통과했는지다. */
  qwenPasses?: number;
  qwenRuns?: number;
}

export interface Change {
  id: string;
  what: "의도" | "Qwen";
  from: string;
  to: string;
}

/** 기준보다 나빠진 것과 나아진 것. 기준에 없는 문장은 비교하지 않는다. */
export function compareBaseline(base: CaseResult[], cur: CaseResult[]): { worse: Change[]; better: Change[] } {
  const prev = new Map(base.map((r) => [r.id, r]));
  const worse: Change[] = [];
  const better: Change[] = [];
  for (const r of cur) {
    const p = prev.get(r.id);
    if (!p) continue;
    if (p.intentOk !== r.intentOk) {
      (r.intentOk ? better : worse).push({ id: r.id, what: "의도", from: p.routed, to: r.routed });
    }
    if (p.qwenOk !== null && r.qwenOk !== null && p.qwenOk !== r.qwenOk) {
      (r.qwenOk ? better : worse).push({ id: r.id, what: "Qwen", from: p.qwenNote ?? "맞음", to: r.qwenNote ?? "맞음" });
    }
  }
  return { worse, better };
}
