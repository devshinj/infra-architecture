import { asc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { flows } from "@/db/schema";
import { applyCommand } from "@/domain/apply";
import { COMMAND_OPS, isFlowCommand, isStructural, parseCommand, SERVER_ONLY_OPS, toFlowOp, type Command, type FlowCommand } from "@/domain/commands";
import { createEdgeCoalescer } from "@/domain/edgeCoalesce";
import { FLOW_LIMITS, planFlowOps, type Flow, type FlowOp } from "@/domain/flows";
import { splitFlowSteps, type StepSplit } from "@/domain/linkGuess";
import { computeMissing, type MissingItem } from "@/domain/missing";
import type { NetworkKnowledge } from "@/domain/network";
import { linkVerdicts, type LinkVerdict } from "@/domain/networkRules";
import { emptyState, type DiagramState, type Warning } from "@/domain/types";
import { env } from "@/env";
import { withDiagramLock } from "@/server/chat/lock";
import { settleTurn } from "@/server/chat/settle";
import { checkCodeWarnings } from "@/server/chat/warnings";
import { applyFlowOps, listFlows, rewriteFlows } from "@/server/flows";
import { getNetworkKnowledge } from "@/server/network";
import { getOwnedDiagram } from "@/server/projects";
import { createVersion, getLatestState, getVersion } from "@/server/versions";

import { explainRejection, FLOW_REJECT_PREFIX, REJECT } from "./explain";

export const MCP_BUSY_MESSAGE = "지금 다른 변경이 진행 중이에요. 잠시 뒤 다시 시도해 주세요.";
export const staleMessage = (latest: number) => `구성도가 바뀌었어요(지금 버전 ${latest}). get_diagram 으로 다시 읽어 주세요.`;
const SUMMARY_MAX = 80;

/** 브라우저에서 이 구성도를 여는 주소. */
export const diagramUrl = (projectId: string, diagramId: string) => `${env.APP_URL}/p/${projectId}/d/${diagramId}`;

/** 이력에 남길 한 줄: 앞뒤 공백을 지우고, 비면 "Claude Code에서 N곳 바꿈", 80자에서 자른다. */
export function versionSummary(summary: string | undefined, changed: number): string {
  const clean = typeof summary === "string" ? summary.trim() : "";
  const text = clean === "" ? `Claude Code에서 ${changed}곳 바꿈` : clean;
  return [...text].slice(0, SUMMARY_MAX).join("");
}

export type McpApplyInput = {
  userId: string;
  diagramId: string;
  baseVersion: number;
  commands: unknown[];
  summary?: string;
  dryRun?: boolean;
};

export type McpApplyResult =
  | { ok: false; kind: "busy" | "stale" | "rejected"; message: string; errors?: string[]; latestVersion?: number }
  | {
      ok: true;
      dryRun: boolean;
      version: number | null;
      changed: number;
      flowsChanged: number;
      freshWarnings: Warning[];
      missing: MissingItem[];
      linkExpected: LinkVerdict[];
      url: string;
    };

export type McpRestoreResult =
  | { ok: false; kind: "busy" | "stale" | "not_found"; message: string }
  | { ok: true; version: number; brokenFlows: { id: string; name: string }[]; url: string };

const KNOWN_OPS: ReadonlySet<string> = new Set(COMMAND_OPS);

/** 명령 차례를 쓰기 없이 끝까지 검사·적용한 결과. errors 는 명령 번호 순서다. */
interface Checked {
  state: DiagramState;
  errors: { index: number; text: string }[];
  /** 흐름 명령(원래 번호, 짝지은 연결 id 로 바꾼 것). */
  flowOps: { index: number; raw: unknown; op: FlowOp }[];
  changed: number;
  assumed: number;
}

/**
 * 명령을 대화 차례와 같은 규칙으로 적용한다. 틀린 명령에서 멈추지 않고 끝까지 검사한다.
 * say·set_link_guess·모르는 명령은 거절하고, 형식은 parseCommand 로, 망 종류는 망 지식으로 확인한다.
 * 흐름 명령은 모으고, 나머지는 연결 짝짓기(지웠다 다시 만든 연결)를 거쳐 적용한다.
 */
function checkCommands(start: DiagramState, commands: unknown[], knowledge: NetworkKnowledge | null): Checked {
  let state = start;
  const errors: Checked["errors"] = [];
  const flowCmds: { index: number; raw: unknown; cmd: FlowCommand }[] = [];
  let changed = 0;
  let assumed = 0;
  const reject = (index: number, raw: unknown, error: string) => errors.push({ index, text: explainRejection(index, raw, error) });
  const applyOpts = knowledge ? { netTypes: knowledge.types } : {};
  const applyOne = (index: number, raw: unknown, cmd: Command) => {
    const r = applyCommand(state, cmd, applyOpts);
    if (!r.ok) return reject(index, raw, r.error);
    state = r.state;
    if (isStructural(cmd)) changed++;
    else assumed++;
  };

  const edges = createEdgeCoalescer();
  // 미뤄 둔 연결 지우기가 나중에 적용될 때 원래 번호로 알리려고 남긴다.
  const removedAt = new Map<string, { index: number; raw: unknown }>();
  commands.forEach((raw, index) => {
    const op = raw && typeof raw === "object" ? (raw as { op?: unknown }).op : undefined;
    if (op === "say") return reject(index, raw, REJECT.say);
    if (typeof op !== "string" || !KNOWN_OPS.has(op)) return reject(index, raw, REJECT.unknownOp);
    if (SERVER_ONLY_OPS.has(op as Command["op"])) return reject(index, raw, REJECT.serverOnly);
    const parsed = parseCommand(raw);
    if (!parsed.ok) return reject(index, raw, parsed.error);
    const cmd = parsed.cmd;
    // 망 종류는 망 지식에 있는 key 만 붙인다(null 은 지우기). 지식을 못 읽었으면 모두 거절한다.
    if (cmd.op === "set_zone_type" && (!knowledge || (cmd.type !== null && !Object.hasOwn(knowledge.types, cmd.type)))) {
      return reject(index, raw, REJECT.unknownNetType);
    }
    if (isFlowCommand(cmd)) {
      flowCmds.push({ index, raw, cmd });
      return;
    }
    if (cmd.op === "remove_edge") removedAt.set(cmd.id, { index, raw });
    for (const c of edges.push(cmd, state)) applyOne(index, raw, c);
  });
  for (const c of edges.flush(state)) {
    const at = (c.op === "remove_edge" && removedAt.get(c.id)) || { index: commands.length - 1, raw: c };
    applyOne(at.index, at.raw, c);
  }
  // 흐름 명령은 마지막 짝 정보로 연결 id 를 바꾼다(흐름 명령 뒤에 짝을 알게 될 수 있다).
  const flowOps = flowCmds.map(({ index, raw, cmd }) => ({ index, raw, op: toFlowOp(edges.mapFlow(cmd)) }));
  return { state, errors, flowOps, changed, assumed };
}

/** 망연계가 끼어든 연결을 지나던 흐름 단계를 둘로 나눈다(대화 차례와 같은 규칙: 단계 상한을 넘으면 그대로). */
const splitRewrite = (splits: StepSplit[]) => (f: Flow) => {
  const next = splitFlowSteps(f, splits);
  return next && next.steps.length <= FLOW_LIMITS.steps ? next : null;
};

async function readFlows(diagramId: string): Promise<Flow[]> {
  const rows = await db.select({ data: flows.data }).from(flows).where(eq(flows.diagramId, diagramId)).orderBy(asc(flows.createdAt), asc(flows.id));
  return rows.map((r) => r.data);
}

/**
 * Claude Code 가 보낸 명령을 전부 적용하거나 하나도 적용하지 않는다. 흐름 명령도 함께 검사한다.
 * base_version 이 최신이 아니면 덮어쓰지 않는다. dryRun 이면 검사만 하고 저장하지 않는다.
 * 성공하면 대화 차례 끝과 같은 정리(빈 영역·망연계 기록·흐름 단계 나누기·코드 규칙 경고)를 하고,
 * 버전과 흐름을 한 트랜잭션으로 저장한다. 대화 메시지는 남기지 않고 Clef·Qwen 도 부르지 않는다.
 * 남의 구성도면 NotFoundError 를 던진다.
 */
export async function applyMcpCommands(input: McpApplyInput): Promise<McpApplyResult> {
  const diagram = await getOwnedDiagram(input.userId, input.diagramId);
  const url = diagramUrl(diagram.projectId, diagram.id);
  const locked = await withDiagramLock(input.diagramId, () => lockedApply(input, url));
  if (!locked.ok) return { ok: false, kind: "busy", message: MCP_BUSY_MESSAGE };
  return locked.value;
}

async function lockedApply(input: McpApplyInput, url: string): Promise<McpApplyResult> {
  const { diagramId } = input;
  const latest = await getLatestState(diagramId);
  const latestVersion = latest?.number ?? 0;
  if (latestVersion !== input.baseVersion) {
    return { ok: false, kind: "stale", message: staleMessage(latestVersion), latestVersion };
  }
  const start = latest?.state ?? emptyState();
  // 망 지식을 못 읽어도 검사는 한다(대화와 같다). 그때 망 종류 명령은 모두 거절된다.
  const knowledge = await getNetworkKnowledge(input.userId).catch((err) => {
    console.error("mcp network knowledge failed", err);
    return null;
  });

  const checked = checkCommands(start, Array.isArray(input.commands) ? input.commands : [], knowledge);
  let state = checked.state;
  const touched = checked.changed + checked.assumed > 0;

  // 구성도를 바꾼 호출만 차례 끝 정리를 한다. 흐름은 정리가 끝난 상태로 검사한다(저장할 때와 같은 상태).
  let splits: StepSplit[] = [];
  if (touched) {
    const settled = settleTurn(start, state);
    state = settled.state;
    splits = settled.splits;
  }
  const errors = [...checked.errors];
  const flowOps = checked.flowOps.map((f) => f.op);
  if (flowOps.length > 0) {
    // 망연계로 나뉠 흐름은 나뉜 뒤 모양으로 검사한다(저장할 때 먼저 나눈다).
    const existing = (await readFlows(diagramId)).map((f) => splitRewrite(splits)(f) ?? f);
    const plan = planFlowOps(state, existing, flowOps);
    if (!plan.ok) {
      for (const r of plan.rejected) {
        const f = checked.flowOps[r.index]!;
        errors.push({ index: f.index, text: explainRejection(f.index, f.raw, FLOW_REJECT_PREFIX + r.reason) });
      }
    }
  }
  if (errors.length > 0) {
    errors.sort((a, b) => a.index - b.index);
    return {
      ok: false,
      kind: "rejected",
      message: `명령 ${errors.length}개를 적용할 수 없어 아무것도 저장하지 않았어요. 고쳐서 다시 보내 주세요.`,
      errors: errors.map((e) => e.text),
    };
  }

  let freshWarnings: Warning[] = [];
  if (touched) {
    const warned = checkCodeWarnings(state, latest?.state.warnings, knowledge ?? undefined);
    state = { ...state, warnings: warned.warnings };
    freshWarnings = warned.fresh;
  }
  const result = {
    ok: true as const,
    dryRun: input.dryRun === true,
    version: null as number | null,
    changed: checked.changed,
    flowsChanged: flowOps.length,
    freshWarnings,
    missing: computeMissing(state, knowledge ?? undefined).items.filter((m) => !m.unknown),
    linkExpected: knowledge ? linkVerdicts(state, knowledge).filter((v) => v.rule === "link_expected") : [],
    url,
  };
  if (result.dryRun || (!touched && flowOps.length === 0)) return result;

  await db.transaction(async (tx) => {
    if (touched) {
      const v = await createVersion(diagramId, state, { source: "mcp", via: "mcp", summary: versionSummary(input.summary, checked.changed), tx });
      result.version = v.number;
    }
    if (splits.length > 0) await rewriteFlows(diagramId, splitRewrite(splits), { tx });
    if (flowOps.length > 0) {
      const r = await applyFlowOps(diagramId, state, flowOps, "ai", { tx });
      // 잠금 안에서 미리 검사했으니 거절이 나오면 안 된다. 나오면 되감는다(전부 아니면 전무).
      if (r.rejected.length > 0) throw new Error(`mcp flow ops rejected after plan: ${JSON.stringify(r.rejected)}`);
    }
  });
  return result;
}

/**
 * 예전 버전으로 되돌린다(새 버전 하나, 출처 restore·via mcp). 구성도 잠금과 base_version 검사를 한다.
 * 대화 메시지는 남기지 않는다. 흐름은 되돌리지 않고, 되돌린 뒤 끊긴 흐름을 알려 준다.
 */
export async function restoreMcpVersion(input: {
  userId: string;
  diagramId: string;
  baseVersion: number;
  number: number;
}): Promise<McpRestoreResult> {
  const diagram = await getOwnedDiagram(input.userId, input.diagramId);
  const url = diagramUrl(diagram.projectId, diagram.id);
  const locked = await withDiagramLock(input.diagramId, async (): Promise<McpRestoreResult> => {
    const latestVersion = (await getLatestState(input.diagramId))?.number ?? 0;
    if (latestVersion !== input.baseVersion) return { ok: false, kind: "stale", message: staleMessage(latestVersion) };
    const state = Number.isInteger(input.number) && input.number > 0 ? await getVersion(input.diagramId, input.number) : null;
    if (!state) return { ok: false, kind: "not_found", message: `버전 ${input.number} 이(가) 없어요. list_versions 로 번호를 확인해 주세요.` };
    const v = await createVersion(input.diagramId, state, { source: "restore", restoredFrom: input.number, via: "mcp" });
    const brokenFlows = (await listFlows(input.userId, input.diagramId))
      .filter((f) => f.problems.length > 0)
      .map((f) => ({ id: f.id, name: f.name }));
    return { ok: true, version: v.number, brokenFlows, url };
  });
  if (!locked.ok) return { ok: false, kind: "busy", message: MCP_BUSY_MESSAGE };
  return locked.value;
}
