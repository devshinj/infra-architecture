import { and, asc, eq, sql } from "drizzle-orm";

import { db, type Tx } from "@/db/client";
import { diagramVersions, flows, type FlowSource } from "@/db/schema";
import { checkFlow, judgeFlowOps, type Flow, type FlowOp, type FlowProblem } from "@/domain/flows";
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

/** 트랜잭션을 주면 그 안에서, 아니면 공용 연결로 읽고 쓴다. */
interface WriteOpts { tx?: Tx }

/**
 * AI 흐름 명령을 흐름 저장소에 적용한다. 구성도 잠금은 호출자(대화 차례·MCP)가 쥐고 있다.
 * 판정은 judgeFlowOps(쓰기 없음)가 하고, 통과한 명령만 저장한다. 거절한 명령은 id 와 이유를 돌려준다.
 * AI 가 고친 흐름은 다시 "AI 제안"이 된다.
 */
export async function applyFlowOps(
  diagramId: string,
  state: DiagramState,
  ops: FlowOp[],
  source: "ai",
  opts: WriteOpts = {},
): Promise<{ saved: number; rejected: { id: string; reason: string }[] }> {
  const q = opts.tx ?? db;
  const rows = await q.select({ data: flows.data }).from(flows).where(eq(flows.diagramId, diagramId));
  const outcomes = judgeFlowOps(state, rows.map((r) => r.data), ops);
  const rejected: { id: string; reason: string }[] = [];
  let saved = 0;
  for (const [i, out] of outcomes.entries()) {
    const op = ops[i]!;
    if (out.kind === "rejected") {
      rejected.push({ id: op.id, reason: out.reason });
      continue;
    }
    if (out.kind === "removed") {
      await q.delete(flows).where(byKey(diagramId, op.id));
    } else if (op.op === "add_flow") {
      await q.insert(flows).values({ diagramId, key: op.id, data: out.flow, source, reviewed: false });
    } else {
      await q
        .update(flows)
        .set({ data: out.flow, source, reviewed: false, updatedAt: sql`now()` })
        .where(byKey(diagramId, op.id));
    }
    saved++;
  }
  return { saved, rejected };
}

/**
 * 구성도의 흐름마다 rewrite 를 돌려, 새 흐름을 돌려준 것만 저장한다(null 이면 그대로). 바뀐 흐름 수를 돌려준다.
 * 도구가 정해진 규칙으로 고치는 것이라 출처·검수 상태는 그대로 둔다. 구성도 잠금은 호출자(대화 차례·MCP)가 쥐고 있다.
 */
export async function rewriteFlows(diagramId: string, rewrite: (f: Flow) => Flow | null, opts: WriteOpts = {}): Promise<number> {
  const q = opts.tx ?? db;
  const rows = await q.select({ key: flows.key, data: flows.data }).from(flows).where(eq(flows.diagramId, diagramId));
  let n = 0;
  for (const r of rows) {
    const next = rewrite(r.data);
    if (!next) continue;
    await q.update(flows).set({ data: next, updatedAt: sql`now()` }).where(byKey(diagramId, r.key));
    n++;
  }
  return n;
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

export interface DiagramHead {
  /** 최신 버전 번호(버전이 없으면 0). */
  version: number;
  /** 흐름 수와 마지막으로 고친 시각. 지우기는 행이 사라져 시각으로 못 알아채므로 수를 함께 본다. */
  flows: { count: number; updatedAt: string | null };
}

/** 열어 둔 브라우저가 바뀐 것을 알아채려고 자주 묻는 머리 정보. 구성도 상태·흐름 내용은 읽지 않는다. */
export async function getDiagramHead(userId: string, diagramId: string): Promise<DiagramHead> {
  await getOwnedDiagram(userId, diagramId);
  const [[v], [f]] = await Promise.all([
    db
      .select({ max: sql<number | null>`max(${diagramVersions.number})` })
      .from(diagramVersions)
      .where(eq(diagramVersions.diagramId, diagramId)),
    db
      .select({ count: sql<number>`count(*)::int`, max: sql<Date | null>`max(${flows.updatedAt})`.mapWith(flows.updatedAt) })
      .from(flows)
      .where(eq(flows.diagramId, diagramId)),
  ]);
  return { version: v?.max ?? 0, flows: { count: f?.count ?? 0, updatedAt: f?.max ? f.max.toISOString() : null } };
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
