/** 의도 점검(eval-intent.ts)용 순수 도우미: Qwen 출력 판정과 기준 파일 비교. */
import type { DiagramState } from "@/domain/types";

export type QwenExpect =
  | { expect: "none" }
  | { expect: "structure" }
  | { expect: "flow"; ops: string[] }
  | { expect: "edge"; edge: string; payload: string; direction: string }
  | { expect: "node_attr"; node: string }
  | { expect: "nodes_attr"; nodes: string[]; key: string }
  | { expect: "record" }
  | { expect: "skip" };

/** 문장별 추가 검사. 기대(expect)와 함께 모두 맞아야 통과다. */
export interface QwenGuards {
  /** 나오면 안 되는 명령 */
  forbid?: string[];
  /** 기존 흐름을 고칠 때 남아 있는 단계(같은 연결)의 짧은 설명을 바꾸면 안 된다 */
  keepStepText?: boolean;
  /** 문장이 전달물·방향을 직접 말해서, 같은 망 안 연결에 적어도 지어낸 것이 아니다 */
  allowPayload?: boolean;
  /** 요청이 새 노드를 만들라고 한 문장: add_node 가 이 수보다 적으면 실패다(범위 규칙이 해야 할 일까지 막는지 본다). */
  addsNodes?: number;
  /** 요청 범위. 있으면 범위를 넘긴 실행은 실패다(checkScope). */
  scope?: Scope;
}

/** 한 가지만 요청하는 문장이 건드려도 되는 범위. */
export interface Scope {
  /** 바꾸거나 지워도 되는 기존 노드·연결·영역 id. 여기 든 노드에는 새 연결을 붙여도 된다. */
  touch?: string[];
  /** 새로 만들어도 되는 노드 수(기본 0) */
  newNodes?: number;
  /** 새로 만들어도 되는 영역 수(기본 0) */
  newGroups?: number;
  /** 사용자가 값을 말해서 채워도 되는 속성. "sw"(어느 노드든) 또는 "db.sw"(그 노드만) */
  attrs?: string[];
}

export type ScopeKind = "기존 대상" | "새 노드" | "새 영역" | "새 연결" | "속성값";
export interface ScopeIssue {
  kind: ScopeKind;
  detail: string;
}

/** 사용자가 말하지 않아도 그리기 규칙이 노드 종류를 보고 적게 하는 속성. 지어낸 값이 아니다. */
const RULE_ATTRS = new Set(["managed"]);

/**
 * 차례 시작 구성(before)과 명령을 적용한 구성(after)을 견주어 요청 범위를 넘긴 것을 검사별로 하나씩 돌려준다. 없으면 빈 배열.
 * 속성값은 새로 적힌(비어 있지 않고 전과 다른) 값만 본다. 시작 구성의 어느 노드에 같은 key·같은 값이 있으면 복사한 것으로 보고 넘어간다.
 */
export function checkScope(scope: Scope, before: DiagramState, after: DiagramState): ScopeIssue[] {
  const touch = new Set(scope.touch ?? []);
  const issues: ScopeIssue[] = [];
  const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

  const changed: string[] = [];
  const tables: [Record<string, unknown>, Record<string, unknown>][] = [
    [before.nodes, after.nodes],
    [before.edges, after.edges],
    [before.groups, after.groups],
  ];
  for (const [was, now] of tables) {
    for (const id of Object.keys(was)) {
      if (touch.has(id)) continue;
      if (now[id] === undefined) changed.push(`${id} 지워짐`);
      else if (!same(was[id], now[id])) changed.push(`${id} 바뀜`);
    }
  }
  if (changed.length) issues.push({ kind: "기존 대상", detail: changed.join(", ") });

  const added = (was: Record<string, unknown>, now: Record<string, unknown>) => Object.keys(now).filter((id) => !(id in was));
  const count = (kind: ScopeKind, ids: string[], allowed: number) => {
    if (ids.length > allowed) issues.push({ kind, detail: `${ids.length}개(허용 ${allowed}): ${ids.join(", ")}` });
  };
  count("새 노드", added(before.nodes, after.nodes), scope.newNodes ?? 0);
  count("새 영역", added(before.groups, after.groups), scope.newGroups ?? 0);

  const loose = added(before.edges, after.edges).filter((id) => {
    const e = after.edges[id]!;
    return e.from in before.nodes && e.to in before.nodes && !touch.has(e.from) && !touch.has(e.to);
  });
  if (loose.length) issues.push({ kind: "새 연결", detail: loose.map((id) => `${after.edges[id]!.from}→${after.edges[id]!.to}`).join(", ") });

  const allowed = new Set(scope.attrs ?? []);
  const known = new Set(Object.values(before.nodes).flatMap((n) => Object.entries(n.attrs).map(([k, v]) => `${k}=${v}`)));
  const made: string[] = [];
  for (const n of Object.values(after.nodes)) {
    const prev = before.nodes[n.id]?.attrs ?? {};
    for (const [k, v] of Object.entries(n.attrs)) {
      if (v === null || v === "" || prev[k] === v || RULE_ATTRS.has(k)) continue;
      if (allowed.has(k) || allowed.has(`${n.id}.${k}`) || known.has(`${k}=${v}`)) continue;
      made.push(`${n.id}.${k}=${v}`);
    }
  }
  if (made.length) issues.push({ kind: "속성값", detail: made.join(", ") });
  return issues;
}

/** 넘침을 한 줄로. 없으면 null. */
export function scopeNote(issues: ScopeIssue[]): string | null {
  return issues.length ? `범위 넘침 — ${issues.map((i) => `${i.kind}: ${i.detail}`).join(" / ")}` : null;
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
  const addedNodes = cmds.filter((c) => c.op === "add_node").length;
  if (g.addsNodes && addedNodes < g.addsNodes) return `새 노드가 모자람: ${addedNodes}개(기대 ${g.addsNodes}개 이상)`;
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
    case "nodes_attr": {
      const hit = new Set(cmds.filter((c) => c.op === "update_node" && c.id && c.attrs && exp.key in c.attrs).map((c) => c.id!));
      const missed = exp.nodes.filter((n) => !hit.has(n));
      const extra = [...hit].filter((n) => !exp.nodes.includes(n));
      if (missed.length || extra.length) return `대상이 다름(빠짐: ${missed.join(", ") || "-"} / 더함: ${extra.join(", ") || "-"})`;
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
  /** 범위(scope)를 잰 문장만: 넘친 실행 수/잰 실행 수 */
  scopeOver?: number;
  scopeRuns?: number;
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
