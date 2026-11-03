import { and, desc, eq, gt, sql } from "drizzle-orm";

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
/** 한 번에 보내는 세션 수(최근 이어간 순). 대화 고르기는 무리(종류)마다 이만큼씩 더 불러온다. */
export const SESSION_LIST_LIMIT = 50;
/** 더 불러올 때 함께 보내는 "그 사이 바뀐 세션" 상한. */
const CHANGED_LIMIT = 200;

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

/** 최근 이어간 시각을 DB 시계로 갱신한다(쪽 넘김 커서·syncedAt 과 같은 시계). */
export async function touchSession(sessionId: string): Promise<void> {
  await db.update(chatSessions).set({ updatedAt: sql`now()` }).where(eq(chatSessions.id, sessionId));
}

/**
 * 쪽 커서: 마지막으로 보낸 행의 `updated_at`(DB 글 그대로, 마이크로초까지) + `|` + id.
 * 행이 지워지거나 다시 이어져도 (updated_at, id) 값으로만 비교하므로 다음 쪽이 흔들리지 않는다.
 */
export type SessionCursor = string;
const TS_TEXT = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d{1,6})?[+-]\d{2}(:\d{2})?$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** DB 시각 글(timestamptz::text)인지. syncedAt·커서 검증에 쓴다. */
export const isDbTimestamp = (t: string) => TS_TEXT.test(t);
export function parseCursor(c: string): { at: string; id: string } | null {
  const i = c.lastIndexOf("|");
  if (i < 0) return null;
  const at = c.slice(0, i);
  const id = c.slice(i + 1);
  return isDbTimestamp(at) && UUID.test(id) ? { at, id } : null;
}

export interface SessionPage {
  /** 이 쪽의 세션(최근 이어간 순). */
  items: SessionRow[];
  /** 더 있으면 다음 쪽 커서, 없으면 null. */
  nextCursor: SessionCursor | null;
  /** since 뒤로 바뀐(이어졌거나 새로 생긴) 같은 종류 세션. 앞 쪽을 불러온 뒤 위로 올라온 행이 빠지지 않게 한다. */
  changed: SessionRow[];
  /** 다음 요청의 since. 이 쪽을 읽기 전의 DB 시각이다. */
  syncedAt: string;
}

/**
 * 한 종류의 세션 한 쪽(최근 이어간 순 SESSION_LIST_LIMIT 개). cursor 가 있으면 그 행 다음부터.
 * since 가 있으면 그 뒤로 바뀐 세션도 함께 돌려준다(클라이언트가 id 로 합친다).
 * cursor·since 는 parseCursor·isDbTimestamp 로 검증한 값이어야 한다.
 */
export async function listSessionPage(
  diagramId: string,
  kind: ChatSessionKind,
  opts: { cursor?: { at: string; id: string } | null; since?: string | null; limit?: number } = {},
): Promise<SessionPage> {
  const limit = opts.limit ?? SESSION_LIST_LIMIT;
  // 먼저 시각을 잡는다: 읽는 사이 바뀐 행은 다음 요청의 changed 로 온다.
  const [{ now }] = await db.execute<{ now: string }>(sql`select clock_timestamp()::text as now`);
  const cur = opts.cursor;
  const rows = await db
    .select({ ...columns, cursorAt: sql<string>`${chatSessions.updatedAt}::text` })
    .from(chatSessions)
    .where(
      and(
        eq(chatSessions.diagramId, diagramId),
        eq(chatSessions.kind, kind),
        cur ? sql`(${chatSessions.updatedAt}, ${chatSessions.id}) < (${cur.at}::timestamptz, ${cur.id}::uuid)` : undefined,
      ),
    )
    .orderBy(desc(chatSessions.updatedAt), desc(chatSessions.id))
    .limit(limit + 1);
  const page = rows.slice(0, limit);
  const last = page.at(-1);
  const changed = opts.since
    ? await db
        .select(columns)
        .from(chatSessions)
        .where(
          and(
            eq(chatSessions.diagramId, diagramId),
            eq(chatSessions.kind, kind),
            gt(chatSessions.updatedAt, sql`${opts.since}::timestamptz`),
          ),
        )
        .orderBy(desc(chatSessions.updatedAt), desc(chatSessions.id))
        .limit(CHANGED_LIMIT)
    : [];
  return {
    items: page.map((r) => asRow({ id: r.id, diagramId: r.diagramId, kind: r.kind, nodeId: r.nodeId, nodeLabel: r.nodeLabel, title: r.title, createdAt: r.createdAt, updatedAt: r.updatedAt })),
    nextCursor: rows.length > limit && last ? `${last.cursorAt}|${last.id}` : null,
    changed: changed.map(asRow),
    syncedAt: now,
  };
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
