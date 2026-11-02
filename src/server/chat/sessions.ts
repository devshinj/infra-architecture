import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { chatSessions } from "@/db/schema";

export type SessionRow = {
  id: string;
  diagramId: string;
  nodeId: string;
  nodeLabel: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
};

const TITLE_MAX = 60;
/** 페이지를 열 때 보내는 질문 세션 수(최근 이어간 순). */
export const SESSION_LIST_LIMIT = 50;

const columns = {
  id: chatSessions.id,
  diagramId: chatSessions.diagramId,
  nodeId: chatSessions.nodeId,
  nodeLabel: chatSessions.nodeLabel,
  title: chatSessions.title,
  createdAt: chatSessions.createdAt,
  updatedAt: chatSessions.updatedAt,
};

/** 첫 질문의 공백을 한 칸으로 접고 60자로 자른 것이 세션 제목이다. */
export async function createSession(
  diagramId: string,
  nodeId: string,
  nodeLabel: string,
  firstQuestion: string,
): Promise<SessionRow> {
  const title = [...firstQuestion.replace(/\s+/g, " ").trim()].slice(0, TITLE_MAX).join("").trimEnd();
  const [row] = await db
    .insert(chatSessions)
    .values({ diagramId, nodeId, nodeLabel, title })
    .returning(columns);
  return row;
}

/** 최근에 이어간 순서로 SESSION_LIST_LIMIT 개까지. */
export async function listSessions(diagramId: string): Promise<SessionRow[]> {
  return db
    .select(columns)
    .from(chatSessions)
    .where(eq(chatSessions.diagramId, diagramId))
    .orderBy(desc(chatSessions.updatedAt), desc(chatSessions.id))
    .limit(SESSION_LIST_LIMIT);
}

/** 다른 구성도의 세션이면 null. */
export async function getSession(diagramId: string, sessionId: string): Promise<SessionRow | null> {
  const [row] = await db
    .select(columns)
    .from(chatSessions)
    .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.diagramId, diagramId)));
  return row ?? null;
}

export async function touchSession(sessionId: string): Promise<void> {
  await db.update(chatSessions).set({ updatedAt: new Date() }).where(eq(chatSessions.id, sessionId));
}
