import { and, desc, eq, isNull } from "drizzle-orm";

import { db } from "@/db/client";
import { messages, type MessageRole } from "@/db/schema";

import type { MessageMeta } from "./events";

export type { MessageRole };

export async function createMessage(
  diagramId: string,
  role: MessageRole,
  content: string,
  meta: MessageMeta = {},
  sessionId: string | null = null,
): Promise<{ id: string; createdAt: Date }> {
  const [row] = await db
    .insert(messages)
    .values({ diagramId, role, content, meta, sessionId })
    .returning({ id: messages.id, createdAt: messages.createdAt });
  return row;
}

/** 가장 최근 `limit` 개를 오래된 순으로 돌려준다. `sessionId` 가 null 이면 구성도 대화만, 아니면 그 세션 것만. */
export async function listMessages(
  diagramId: string,
  limit = 100,
  sessionId: string | null = null,
): Promise<{ id: string; role: MessageRole; content: string; meta: MessageMeta; createdAt: Date }[]> {
  const rows = await db
    .select({
      id: messages.id,
      role: messages.role,
      content: messages.content,
      meta: messages.meta,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(
      and(
        eq(messages.diagramId, diagramId),
        sessionId === null ? isNull(messages.sessionId) : eq(messages.sessionId, sessionId),
      ),
    )
    .orderBy(desc(messages.createdAt), desc(messages.id))
    .limit(limit);
  return rows.reverse();
}
