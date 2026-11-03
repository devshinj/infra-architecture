"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { MessageMeta, SessionEventPayload } from "@/server/chat/events";

import { messagesToLines } from "./lines";
import type { ChatLine } from "./useChatTurn";

/** 기본 대화(세션 없는 구성도 대화)는 "main", 그 밖의 세션은 세션 id. */
export type SessionKey = "main" | string;

/**
 * 세션 요약. kind "node" 는 노드 질문 세션(nodeLabel 은 만들 때의 노드 이름, 노드가 지워졌을 때 보인다),
 * kind "diagram" 은 구성도 대화 세션(노드 없음).
 */
export type SessionSummary = SessionEventPayload;

/**
 * 서버가 아직 id 를 주지 않은 새 세션: 첫 질문을 보낸 노드 질문 세션, 또는 `+ 새 대화` 로 연 구성도 대화 세션.
 * 한 번에 하나뿐이다(새로 열면 앞의 것을 바꾼다).
 */
export const NEW_SESSION = "new";

const TITLE_MAX = 60;
/** 서버(foldTitle)와 같은 규칙: 공백을 한 칸으로 접고 60자. */
export const titleOf = (text: string) => [...text.replace(/\s+/g, " ").trim()].slice(0, TITLE_MAX).join("").trimEnd();
/** 첫 메시지를 보내기 전의 새 구성도 대화 이름. */
export const NEW_CHAT_TITLE = "새 대화";

const LOAD_FAILED = "대화를 불러오지 못했어요. 다시 시도해 주세요.";
const RENAME_FAILED = "이름을 바꾸지 못했어요. 잠시 후 다시 시도해 주세요.";
const DELETE_FAILED = "대화를 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.";

/** 응답의 오류 글(없으면 fallback). */
async function errorOf(r: Response, fallback: string): Promise<string> {
  try {
    const j = (await r.json()) as { error?: unknown };
    return typeof j.error === "string" && j.error ? j.error : fallback;
  } catch {
    return fallback;
  }
}

type Lines = Record<string, ChatLine[] | "loading">;
type Update = ChatLine[] | ((prev: ChatLine[]) => ChatLine[]);

const without = (ls: Lines, id: string): Lines => Object.fromEntries(Object.entries(ls).filter(([k]) => k !== id));

/**
 * 불러온 기록 뒤에 이을 차례 줄. 차례 줄은 화면용 id(l-N)라 저장된 줄과 id 로 맞출 수 없어 글로 맞춘다:
 * 사용자 줄은 같은 글의 불러온 사용자 줄이 있으면, 그 뒤에 불러온 답이 있으면 이어지는 답·안내 줄도 이미 있는 것이다.
 */
function turnOnly(loaded: ChatLine[], turn: ChatLine[]): ChatLine[] {
  const out: ChatLine[] = [];
  let replied = false;
  for (const l of turn) {
    if (l.id.endsWith("-load-failed")) continue;
    if (l.kind === "user") {
      const at = loaded.findLastIndex((x) => x.kind === "user" && x.text === l.text);
      replied = at >= 0 && loaded.some((x, k) => k > at && x.kind === "assistant");
      if (at >= 0) continue;
    } else if (replied) {
      continue;
    }
    out.push(l);
  }
  return out;
}

interface Row {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  meta: MessageMeta;
  createdAt: string;
}

/**
 * 대화 탭의 세션 목록과 고른 세션. 기본 대화 줄은 useChatTurn 이 가지므로 여기에는 세션(구성도 대화·노드 질문) 줄만 둔다.
 * 세션 줄은 처음 고를 때 서버에서 한 번 불러 캐시하고, 도는 차례는 setLines 로 그 세션에 쌓는다.
 * 새로고침하면 늘 구성도 대화로 연다.
 */
export function useSessions({ diagramId, initial }: { diagramId: string; initial: SessionSummary[] }) {
  const [sessions, setSessions] = useState<SessionSummary[]>(initial);
  const [active, setActive] = useState<SessionKey>("main");
  const [lines, setAllLines] = useState<Lines>({});
  const [pending, setPending] = useState<SessionSummary | null>(null);
  const linesRef = useRef(lines);
  useEffect(() => {
    linesRef.current = lines;
  });
  const alive = useRef(true);
  /** 지금 불러오는 세션 하나(고른 세션이 바뀌거나 사라지면 끊는다). */
  const inflight = useRef<{ id: string; ac: AbortController } | null>(null);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      inflight.current?.ac.abort();
      inflight.current = null;
    };
  }, []);

  /** 불러오기에 실패한 세션: 다시 고르면 다시 불러온다. */
  const failed = useRef(new Set<string>());

  const load = useCallback(
    async (id: string, signal: AbortSignal) => {
      let next: ChatLine[];
      try {
        const r = await fetch(`/api/diagrams/${encodeURIComponent(diagramId)}/sessions/${encodeURIComponent(id)}`, { signal });
        if (!r.ok) throw new Error(`status ${r.status}`);
        const j = (await r.json()) as { messages: Row[] };
        next = messagesToLines(j.messages);
      } catch {
        // 끊긴 불러오기는 오류가 아니다(끊은 쪽이 이미 줄을 비웠다).
        if (signal.aborted) return;
        next = [{ id: `${id}-load-failed`, kind: "error", text: LOAD_FAILED }];
        failed.current.add(id);
      }
      if (signal.aborted || !alive.current) return;
      if (inflight.current?.ac.signal === signal) inflight.current = null;
      // 불러오는 사이 도는 차례가 줄을 쌓았으면 불러온 줄을 앞에 두고, 아직 없는 차례 줄만 뒤에 잇는다.
      setAllLines((ls) => {
        const cur = ls[id];
        if (cur === "loading") return { ...ls, [id]: next };
        if (cur === undefined) return ls;
        return { ...ls, [id]: [...next, ...turnOnly(next, cur)] };
      });
    },
    [diagramId],
  );
  const select = useCallback(
    (key: SessionKey) => {
      setActive(key);
      // 다른 세션으로 옮기면 불러오던 것을 끊고, 반쯤 불러온 줄은 비워 다시 고르면 다시 불러오게 한다.
      const flying = inflight.current;
      if (flying && flying.id !== key) {
        flying.ac.abort();
        inflight.current = null;
        if (linesRef.current[flying.id] === "loading") {
          linesRef.current = without(linesRef.current, flying.id);
          setAllLines((ls) => (ls[flying.id] === "loading" ? without(ls, flying.id) : ls));
        } else {
          // 도는 차례 줄이 이미 있는 세션: 기록을 못 불렀으니 다시 고르면 다시 불러와 합친다.
          failed.current.add(flying.id);
        }
      }
      if (key === "main" || key === NEW_SESSION) return;
      const have = linesRef.current[key];
      if (have !== undefined && !failed.current.has(key)) return;
      failed.current.delete(key);
      // 차례 줄이 이미 있으면 가리지 않고 그대로 두고 불러온 기록과 합친다.
      const keep = Array.isArray(have) && have.some((l) => !l.id.endsWith("-load-failed"));
      if (!keep) {
        linesRef.current = { ...linesRef.current, [key]: "loading" };
        setAllLines((ls) => ({ ...ls, [key]: "loading" }));
      }
      const ac = new AbortController();
      inflight.current = { id: key, ac };
      void load(key, ac.signal);
    },
    [load],
  );

  const setLines = useCallback((key: SessionKey, update: Update) => {
    setAllLines((ls) => {
      const prev = ls[key];
      const base = prev === undefined || prev === "loading" ? [] : prev;
      return { ...ls, [key]: typeof update === "function" ? update(base) : update };
    });
  }, []);

  /** 새 질문 세션을 열고 고른다. 서버가 세션 id 를 주면 upsert 가 그 id 로 옮긴다. */
  const startNew = useCallback(({ nodeId, nodeLabel, text }: { nodeId: string; nodeLabel: string; text: string }) => {
    setPending({ id: NEW_SESSION, kind: "node", nodeId, nodeLabel, title: titleOf(text), updatedAt: new Date().toISOString() });
    setAllLines((ls) => ({ ...ls, [NEW_SESSION]: [] }));
    setActive(NEW_SESSION);
  }, []);

  /**
   * 새 구성도 대화를 열고 고른다(`+ 새 대화`, 또는 그 대화의 첫 메시지를 다시 보낼 때). 서버 세션은 첫 메시지를 보낼 때
   * 만들어지고, 그때 upsert 가 이 줄을 그 id 로 옮긴다. text 가 없으면 아직 보내지 않은 빈 대화다.
   */
  const startNewDiagram = useCallback((text?: string) => {
    const title = text ? titleOf(text) : NEW_CHAT_TITLE;
    setPending({ id: NEW_SESSION, kind: "diagram", nodeId: null, nodeLabel: null, title, updatedAt: new Date().toISOString() });
    setAllLines((ls) => ({ ...ls, [NEW_SESSION]: [] }));
    setActive(NEW_SESSION);
  }, []);

  /**
   * 세션을 맨 위로 올리거나 새로 넣는다. 서버가 막 만든 세션이면(아직 줄이 없고 새 세션 줄이 있으면)
   * 새 세션 줄·선택을 그 id 로 옮긴다. 이어 묻는 세션은 고를 때 줄을 불러 두었으므로 옮기지 않는다.
   */
  const upsert = useCallback((summary: SessionSummary) => {
    setSessions((ss) => [summary, ...ss.filter((s) => s.id !== summary.id)]);
    setAllLines((ls) => {
      const draft = ls[NEW_SESSION];
      if (draft === undefined || ls[summary.id] !== undefined) return ls;
      const rest = { ...ls, [summary.id]: draft };
      delete rest[NEW_SESSION];
      return rest;
    });
    setPending((p) => (p && p.kind === summary.kind && p.nodeId === summary.nodeId ? null : p));
    setActive((a) => (a === NEW_SESSION ? summary.id : a));
  }, []);

  const linesOf = useCallback((key: SessionKey): ChatLine[] | "loading" => lines[key] ?? [], [lines]);

  /** 고른 세션의 요약(새 세션 포함). 구성도 대화·모르는 id 는 null. */
  const summaryOf = useCallback(
    (key: SessionKey): SessionSummary | null => (key === NEW_SESSION ? pending : (sessions.find((s) => s.id === key) ?? null)),
    [pending, sessions],
  );

  /** 이름 바꾸기. 실패하면 보일 오류 글을 돌려준다. 목록 순서(최근 이어감)는 그대로다. */
  const rename = useCallback(
    async (id: string, title: string): Promise<string | void> => {
      let r: Response;
      try {
        r = await fetch(`/api/diagrams/${encodeURIComponent(diagramId)}/sessions/${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ title }),
        });
      } catch {
        return RENAME_FAILED;
      }
      if (!r.ok) return errorOf(r, RENAME_FAILED);
      let next: string;
      try {
        next = ((await r.json()) as { session: { title: string } }).session.title;
      } catch {
        next = titleOf(title);
      }
      if (!alive.current) return;
      setSessions((ss) => ss.map((s) => (s.id === id ? { ...s, title: next } : s)));
    },
    [diagramId],
  );

  /** 세션과 그 메시지를 지운다. 보던 세션이면 기본 대화로 돌아간다. 실패하면 보일 오류 글을 돌려준다. */
  const remove = useCallback(
    async (id: string): Promise<string | void> => {
      let r: Response;
      try {
        r = await fetch(`/api/diagrams/${encodeURIComponent(diagramId)}/sessions/${encodeURIComponent(id)}`, { method: "DELETE" });
      } catch {
        return DELETE_FAILED;
      }
      // 이미 없는 세션(다른 탭에서 지움)도 목록에서 뺀다.
      if (!r.ok && r.status !== 404) return errorOf(r, DELETE_FAILED);
      if (!alive.current) return;
      if (inflight.current?.id === id) {
        inflight.current.ac.abort();
        inflight.current = null;
      }
      failed.current.delete(id);
      linesRef.current = without(linesRef.current, id);
      setSessions((ss) => ss.filter((s) => s.id !== id));
      setAllLines((ls) => without(ls, id));
      setActive((a) => (a === id ? "main" : a));
    },
    [diagramId],
  );

  return { sessions, active, select, linesOf, upsert, setLines, startNew, startNewDiagram, rename, remove, summaryOf, pending };
}
