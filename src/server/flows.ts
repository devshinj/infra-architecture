import { and, asc, eq, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { flows, type FlowSource } from "@/db/schema";
import {
  checkFlow,
  FLOW_LIMITS,
  shortLabel,
  type Flow,
  type FlowOp,
  type FlowProblem,
  type FlowStep,
  type FlowStepInput,
} from "@/domain/flows";
import { emptyState, type DiagramState } from "@/domain/types";
import { withDiagramLock } from "@/server/chat/lock";
import { getOwnedDiagram, NotFoundError, ValidationError } from "@/server/projects";
import { getLatestState } from "@/server/versions";

export interface StoredFlow extends Flow {
  source: FlowSource;
  reviewed: boolean;
  problems: FlowProblem[];
}

export const FLOW_BUSY_MESSAGE = "지금은 구성도를 그리는 중이에요. 잠시 뒤 다시 해 주세요.";

/** 대화 차례가 구성도 잠금을 쥐고 있어 흐름을 고칠 수 없다. */
export class BusyError extends Error {
  constructor() {
    super(FLOW_BUSY_MESSAGE);
    this.name = "BusyError";
  }
}

// 흐름 id 는 명령 id 규칙을 따른다. 어긋난 key 는 없는 흐름으로 본다.
const KEY_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
const NAME_MAX = 60;

const byKey = (diagramId: string, key: string) => and(eq(flows.diagramId, diagramId), eq(flows.key, key));

const toSteps = (steps: FlowStepInput[]): FlowStep[] =>
  steps.map((s) => ({ edge: s.edge, from: s.from, short: shortLabel(s.short), text: s.text }));

/** 검사에 걸린 문제 종류(겹치지 않게, 처음 나온 순서). */
const problemReason = (problems: FlowProblem[]) => [...new Set(problems.map((p) => p.kind))].join(",");

/**
 * AI 흐름 명령을 흐름 저장소에 적용한다. 구성도 잠금은 호출자(대화 차례)가 쥐고 있다.
 * 명령마다 따로 저장·거절하고, 거절한 명령은 id 와 이유를 돌려준다.
 * - add: 같은 id 가 있거나, 흐름이 상한에 찼거나, 단계가 상한을 넘거나, 검사에 걸리면 거절.
 * - update: 없으면 거절. 준 칸만 바꾸고, 바꾼 결과가 검사에 걸리면 거절. AI 가 고친 흐름은 다시 "AI 제안"이 된다.
 * - remove: 없으면 거절.
 */
export async function applyFlowOps(
  diagramId: string,
  state: DiagramState,
  ops: FlowOp[],
  source: "ai",
): Promise<{ saved: number; rejected: { id: string; reason: string }[] }> {
  const rows = await db.select({ key: flows.key, data: flows.data }).from(flows).where(eq(flows.diagramId, diagramId));
  const current = new Map(rows.map((r) => [r.key, r.data]));
  const rejected: { id: string; reason: string }[] = [];
  let saved = 0;
  const reject = (id: string, reason: string) => rejected.push({ id, reason });

  for (const op of ops) {
    if (op.op === "remove_flow") {
      if (!current.has(op.id)) {
        reject(op.id, "not_found");
        continue;
      }
      await db.delete(flows).where(byKey(diagramId, op.id));
      current.delete(op.id);
      saved++;
      continue;
    }

    let next: Flow;
    if (op.op === "add_flow") {
      if (current.has(op.id)) {
        reject(op.id, "exists");
        continue;
      }
      if (current.size >= FLOW_LIMITS.flows) {
        reject(op.id, "too_many_flows");
        continue;
      }
      next = { id: op.id, name: op.name, origin: op.origin, steps: toSteps(op.steps) };
      if (op.summary !== undefined) next.summary = op.summary;
      if (op.result !== undefined) next.result = op.result;
    } else {
      const prev = current.get(op.id);
      if (!prev) {
        reject(op.id, "not_found");
        continue;
      }
      next = structuredClone(prev);
      if (op.name !== undefined) next.name = op.name;
      if (op.summary !== undefined) next.summary = op.summary;
      if (op.result !== undefined) next.result = op.result;
      if (op.steps !== undefined) next.steps = toSteps(op.steps);
    }

    if (next.steps.length === 0) {
      reject(op.id, "no_steps");
      continue;
    }
    if (next.steps.length > FLOW_LIMITS.steps) {
      reject(op.id, "too_many_steps");
      continue;
    }
    const problems = checkFlow(state, next);
    if (problems.length) {
      reject(op.id, problemReason(problems));
      continue;
    }

    if (op.op === "add_flow") {
      await db.insert(flows).values({ diagramId, key: op.id, data: next, source, reviewed: false });
    } else {
      await db
        .update(flows)
        .set({ data: next, source, reviewed: false, updatedAt: sql`now()` })
        .where(byKey(diagramId, op.id));
    }
    current.set(op.id, next);
    saved++;
  }
  return { saved, rejected };
}

/** 구성도의 흐름을 만든 순서로 돌려준다. 끊김은 최신 구성도 상태로 다시 계산한다. */
export async function listFlows(userId: string, diagramId: string): Promise<StoredFlow[]> {
  await getOwnedDiagram(userId, diagramId);
  const state = (await getLatestState(diagramId))?.state ?? emptyState();
  const rows = await db
    .select({ data: flows.data, source: flows.source, reviewed: flows.reviewed })
    .from(flows)
    .where(eq(flows.diagramId, diagramId))
    .orderBy(asc(flows.createdAt), asc(flows.id));
  return rows.map((r) => ({ ...r.data, source: r.source, reviewed: r.reviewed, problems: checkFlow(state, r.data) }));
}

/** 소유자 검사 → 잠금 안에서 흐름 행을 찾아 fn 을 돌린다. 없는 흐름은 NotFoundError, 차례가 돌고 있으면 BusyError. */
async function withOwnedFlow(
  userId: string,
  diagramId: string,
  key: string,
  fn: (flow: Flow) => Promise<void>,
): Promise<void> {
  await getOwnedDiagram(userId, diagramId);
  if (typeof key !== "string" || !KEY_RE.test(key)) throw new NotFoundError();
  const locked = await withDiagramLock(diagramId, async () => {
    const [row] = await db
      .select({ data: flows.data })
      .from(flows)
      .where(byKey(diagramId, key));
    if (!row) throw new NotFoundError();
    await fn(row.data);
  });
  if (!locked.ok) throw new BusyError();
}

/** 흐름 이름을 바꾼다(앞뒤 공백을 지우고 1~60자). 검수 상태는 그대로다. */
export async function renameFlow(userId: string, diagramId: string, key: string, name: string): Promise<void> {
  const clean = typeof name === "string" ? name.trim() : "";
  if (clean.length < 1 || clean.length > NAME_MAX) throw new ValidationError("이름은 1~60자로 입력해 주세요");
  await withOwnedFlow(userId, diagramId, key, async (flow) => {
    await db
      .update(flows)
      .set({ data: { ...flow, name: clean }, updatedAt: sql`now()` })
      .where(byKey(diagramId, key));
  });
}

export async function deleteFlow(userId: string, diagramId: string, key: string): Promise<void> {
  await withOwnedFlow(userId, diagramId, key, async () => {
    await db.delete(flows).where(byKey(diagramId, key));
  });
}

/** 사용자가 "맞아요"를 눌렀다. AI 제안 표시가 사라진다. */
export async function confirmFlow(userId: string, diagramId: string, key: string): Promise<void> {
  await withOwnedFlow(userId, diagramId, key, async () => {
    await db.update(flows).set({ reviewed: true, updatedAt: sql`now()` }).where(byKey(diagramId, key));
  });
}

export const LAST_STEP_MESSAGE = "마지막 단계는 지울 수 없어요. 흐름을 통째로 지워 주세요.";
const BAD_STEP_MESSAGE = "지울 단계를 찾을 수 없어요.";

/**
 * 끊긴 흐름을 고치려고 단계 하나(0부터 센 stepIndex)를 지운다. 출처·검수 상태는 그대로다.
 * 지운 뒤에도 다른 문제가 남을 수 있지만 흐름은 남긴다(검사로 거절하지 않는다). 마지막 한 단계는 지우지 않는다.
 */
export async function removeFlowStep(userId: string, diagramId: string, key: string, stepIndex: number): Promise<void> {
  await withOwnedFlow(userId, diagramId, key, async (flow) => {
    if (!Number.isInteger(stepIndex) || stepIndex < 0 || stepIndex >= flow.steps.length) throw new ValidationError(BAD_STEP_MESSAGE);
    if (flow.steps.length <= 1) throw new ValidationError(LAST_STEP_MESSAGE);
    const steps = flow.steps.filter((_, i) => i !== stepIndex);
    await db
      .update(flows)
      .set({ data: { ...flow, steps }, updatedAt: sql`now()` })
      .where(byKey(diagramId, key));
  });
}

/** 구성도를 복제할 때 흐름도 그대로 옮긴다(출처·검수 상태·만든 순서 포함). 소유권은 호출자가 확인한다. */
export async function copyFlows(fromDiagramId: string, toDiagramId: string): Promise<void> {
  const rows = await db
    .select({ key: flows.key, data: flows.data, source: flows.source, reviewed: flows.reviewed, createdAt: flows.createdAt })
    .from(flows)
    .where(eq(flows.diagramId, fromDiagramId))
    .orderBy(asc(flows.createdAt), asc(flows.id));
  if (rows.length === 0) return;
  await db.insert(flows).values(rows.map((r) => ({ ...r, diagramId: toDiagramId })));
}
