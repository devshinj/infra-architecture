import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { diagramVersions, type VersionSource, type VersionStatus } from "@/db/schema";
import type { DiagramState } from "@/domain/types";
import { createMessage } from "@/server/chat/messages";

export interface CreateVersionOpts {
  source: VersionSource;
  status?: VersionStatus;
  restoredFrom?: number;
  messageId?: string;
}

export async function createVersion(
  diagramId: string,
  state: DiagramState,
  opts: CreateVersionOpts,
): Promise<{ id: string; number: number }> {
  return db.transaction(async (tx) => {
    // 같은 구성도의 동시 생성을 직렬화해 번호가 겹치지 않게 한다.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${diagramId}))`);
    const [{ max }] = await tx
      .select({ max: sql<number | null>`max(${diagramVersions.number})` })
      .from(diagramVersions)
      .where(eq(diagramVersions.diagramId, diagramId));
    const [row] = await tx
      .insert(diagramVersions)
      .values({
        diagramId,
        number: (max ?? 0) + 1,
        state,
        source: opts.source,
        status: opts.status ?? "complete",
        restoredFrom: opts.restoredFrom ?? null,
        messageId: opts.messageId ?? null,
      })
      .returning({ id: diagramVersions.id, number: diagramVersions.number });
    return row;
  });
}

export async function listVersions(diagramId: string) {
  return db
    .select({
      number: diagramVersions.number,
      source: diagramVersions.source,
      status: diagramVersions.status,
      restoredFrom: diagramVersions.restoredFrom,
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
