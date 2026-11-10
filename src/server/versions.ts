import { and, desc, eq, sql } from "drizzle-orm";

import { db, type Tx } from "@/db/client";
import { diagramVersions, type VersionSource, type VersionStatus } from "@/db/schema";
import type { DiagramState } from "@/domain/types";
import { createMessage } from "@/server/chat/messages";

export interface CreateVersionOpts {
  source: VersionSource;
  status?: VersionStatus;
  restoredFrom?: number;
  messageId?: string;
  via?: "mcp";
  summary?: string;
  /** 주어지면 이 트랜잭션 안에서 만든다(새 트랜잭션을 열지 않는다). */
  tx?: Tx;
  /** 주어지면, 번호를 잠근 뒤 최신 번호가 이것과 다를 때 StaleVersionError 를 던진다(덮어쓰기 막기). */
  expectedLatest?: number;
}

/** 저장하려는 순간 최신 버전이 기대와 달랐다. latest 는 지금 최신 번호(없으면 0). */
export class StaleVersionError extends Error {
  constructor(readonly latest: number) {
    super(`latest version is ${latest}`);
    this.name = "StaleVersionError";
  }
}

/**
 * 트랜잭션 안에서 이 구성도의 버전 번호를 잠그고(createVersion 과 같은 잠금) 최신 번호를 돌려준다.
 * expected 를 주면 다를 때 StaleVersionError 를 던진다. 잠금은 트랜잭션이 끝날 때 풀린다.
 */
export async function lockLatestNumber(tx: Tx, diagramId: string, expected?: number): Promise<number> {
  // 같은 구성도의 동시 생성을 직렬화해 번호가 겹치지 않게 한다.
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${diagramId}))`);
  const [{ max }] = await tx
    .select({ max: sql<number | null>`max(${diagramVersions.number})` })
    .from(diagramVersions)
    .where(eq(diagramVersions.diagramId, diagramId));
  const latest = max ?? 0;
  if (expected !== undefined && latest !== expected) throw new StaleVersionError(latest);
  return latest;
}

export async function createVersion(
  diagramId: string,
  state: DiagramState,
  opts: CreateVersionOpts,
): Promise<{ id: string; number: number }> {
  const run = async (tx: Tx) => {
    const latest = await lockLatestNumber(tx, diagramId, opts.expectedLatest);
    const [row] = await tx
      .insert(diagramVersions)
      .values({
        diagramId,
        number: latest + 1,
        state,
        source: opts.source,
        status: opts.status ?? "complete",
        restoredFrom: opts.restoredFrom ?? null,
        messageId: opts.messageId ?? null,
        via: opts.via ?? null,
        summary: opts.summary ?? null,
      })
      .returning({ id: diagramVersions.id, number: diagramVersions.number });
    return row;
  };
  return opts.tx ? run(opts.tx) : db.transaction(run);
}

export async function listVersions(diagramId: string) {
  return db
    .select({
      number: diagramVersions.number,
      source: diagramVersions.source,
      status: diagramVersions.status,
      restoredFrom: diagramVersions.restoredFrom,
      via: diagramVersions.via,
      summary: diagramVersions.summary,
      createdAt: diagramVersions.createdAt,
    })
    .from(diagramVersions)
    .where(eq(diagramVersions.diagramId, diagramId))
    .orderBy(desc(diagramVersions.number));
}

export async function getVersion(diagramId: string, number: number): Promise<DiagramState | null> {
  const [row] = await db
    .select({ state: diagramVersions.state })
    .from(diagramVersions)
    .where(and(eq(diagramVersions.diagramId, diagramId), eq(diagramVersions.number, number)));
  return row?.state ?? null;
}

export async function getLatestState(
  diagramId: string,
): Promise<{ number: number; state: DiagramState } | null> {
  const [row] = await db
    .select({ number: diagramVersions.number, state: diagramVersions.state })
    .from(diagramVersions)
    .where(eq(diagramVersions.diagramId, diagramId))
    .orderBy(desc(diagramVersions.number))
    .limit(1);
  return row ?? null;
}

export async function restoreVersion(diagramId: string, number: number): Promise<{ number: number }> {
  const state = await getVersion(diagramId, number);
  if (!state) throw new Error(`버전 ${number} 을(를) 찾을 수 없습니다`);
  const { number: created } = await createVersion(diagramId, state, {
    source: "restore",
    restoredFrom: number,
  });
  return { number: created };
}

/** 되돌리기 + 대화에 시스템 메시지를 남긴다. 소유권은 호출자가 확인한다. */
export async function restoreVersionWithMessage(
  diagramId: string,
  number: number,
): Promise<{ number: number }> {
  const r = await restoreVersion(diagramId, number);
  await createMessage(diagramId, "system", `v${number}로 되돌림 (새 버전 v${r.number})`);
  return r;
}
