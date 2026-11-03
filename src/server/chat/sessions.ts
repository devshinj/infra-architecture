import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { chatSessions, type ChatSessionKind } from "@/db/schema";

export type { ChatSessionKind };

interface SessionBase {
  id: string;
  diagramId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}
/** 노드 질문 세션(노드가 있다) 또는 구성도 대화 세션(노드가 없다). */
export type SessionRow =
  | (SessionBase & { kind: "node"; nodeId: string; nodeLabel: string })
  | (SessionBase & { kind: "diagram"; nodeId: null; nodeLabel: null });

/** 세션을 만들 때의 종류: 노드 질문이면 그 노드와 만들 때의 이름. */
export type NewSession = { kind: "node"; nodeId: string; nodeLabel: string } | { kind: "diagram" };

export const TITLE_MAX = 60;
/** 페이지를 열 때 보내는 세션 수(최근 이어간 순, 두 종류 합쳐서). */
export const SESSION_LIST_LIMIT = 50;

const columns = {
  id: chatSessions.id,
  diagramId: chatSessions.diagramId,
  kind: chatSessions.kind,
  nodeId: chatSessions.nodeId,
  nodeLabel: chatSessions.nodeLabel,
  title: chatSessions.title,
  createdAt: chatSessions.createdAt,
  updatedAt: chatSessions.updatedAt,
};

// DB 의 CHECK 제약이 종류와 노드 칸을 맞춰 두므로 행 모양을 그대로 좁힌다.
const asRow = (r: { kind: ChatSessionKind; nodeId: string | null; nodeLabel: string | null } & SessionBase): SessionRow =>
  r as SessionRow;

/** 공백을 한 칸으로 접고 앞뒤를 지운 뒤 60자(코드포인트)로 자른다. 세션 제목 규칙. */
export function foldTitle(text: string): string {
  return [...text.replace(/\s+/g, " ").trim()].slice(0, TITLE_MAX).join("").trimEnd();
}

/** 첫 메시지(질문)의 공백을 한 칸으로 접고 60자로 자른 것이 세션 제목이다. */
export async function createSession(diagramId: string, kind: NewSession, firstText: string): Promise<SessionRow> {
  const title = foldTitle(firstText);
  const values =
    kind.kind === "node"
      ? { diagramId, kind: "node" as const, nodeId: kind.nodeId, nodeLabel: kind.nodeLabel, title }
      : { diagramId, kind: "diagram" as const, nodeId: null, nodeLabel: null, title };
  const [row] = await db.insert(chatSessions).values(values).returning(columns);
  return asRow(row);
}

/** 최근에 이어간 순서로 SESSION_LIST_LIMIT 개까지. */
export async function listSessions(diagramId: string): Promise<SessionRow[]> {
  const rows = await db
    .select(columns)
    .from(chatSessions)
    .where(eq(chatSessions.diagramId, diagramId))
    .orderBy(desc(chatSessions.updatedAt), desc(chatSessions.id))
    .limit(SESSION_LIST_LIMIT);
  return rows.map(asRow);
}

/** 다른 구성도의 세션이면 null. */
export async function getSession(diagramId: string, sessionId: string): Promise<SessionRow | null> {
  const [row] = await db
    .select(columns)
    .from(chatSessions)
    .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.diagramId, diagramId)));
  return row ? asRow(row) : null;
}

export async function touchSession(sessionId: string): Promise<void> {
  await db.update(chatSessions).set({ updatedAt: new Date() }).where(eq(chatSessions.id, sessionId));
}

/**
 * 이름 바꾸기. 최근 이어간 순서(updated_at)는 바꾸지 않는다. 다른 구성도의 세션이면 null.
 * title 은 호출자가 foldTitle 로 접어 1~60자인지 확인한 값이다.
 */
export async function renameSession(diagramId: string, sessionId: string, title: string): Promise<SessionRow | null> {
  const [row] = await db
    .update(chatSessions)
    .set({ title })
    .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.diagramId, diagramId)))
    .returning(columns);
  return row ? asRow(row) : null;
}

/** 세션과 그 메시지를 지운다(messages.session_id 의 cascade). 버전은 그대로다. 지웠으면 true. */
export async function deleteSession(diagramId: string, sessionId: string): Promise<boolean> {
  const rows = await db
    .delete(chatSessions)
    .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.diagramId, diagramId)))
    .returning({ id: chatSessions.id });
  return rows.length > 0;
}
