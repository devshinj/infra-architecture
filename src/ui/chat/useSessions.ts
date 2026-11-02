"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { MessageMeta } from "@/server/chat/events";

import { messagesToLines } from "./lines";
import type { ChatLine } from "./useChatTurn";

/** 구성도 대화는 "main", 질문 세션은 세션 id. */
export type SessionKey = "main" | string;

export interface SessionSummary {
  id: string;
  nodeId: string;
  /** 세션을 만들 때의 노드 이름(노드가 지워졌을 때 보인다). */
  nodeLabel: string;
  title: string;
  updatedAt: string;
}

/** 첫 질문을 보냈지만 서버가 아직 세션 id 를 주지 않은 세션. 한 번에 한 차례라 하나뿐이다. */
export const NEW_SESSION = "new";

const TITLE_MAX = 60;
/** 서버(createSession)와 같은 규칙: 공백을 한 칸으로 접고 60자. */
const titleOf = (text: string) => [...text.replace(/\s+/g, " ").trim()].slice(0, TITLE_MAX).join("").trimEnd();

const LOAD_FAILED = "대화를 불러오지 못했어요. 다시 시도해 주세요.";

type Lines = Record<string, ChatLine[] | "loading">;
type Update = ChatLine[] | ((prev: ChatLine[]) => ChatLine[]);

interface Row {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  meta: MessageMeta;
  createdAt: string;
}

/**
 * 대화 탭의 세션 목록과 고른 세션. 구성도 대화 줄은 useChatTurn 이 가지므로 여기에는 질문 세션 줄만 둔다.
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
        const have = new Set(next.map((l) => l.id));
        return { ...ls, [id]: [...next, ...cur.filter((l) => !have.has(l.id))] };
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
          const { [flying.id]: _gone, ...rest } = linesRef.current;
          linesRef.current = rest;
          setAllLines((ls) => {
            if (ls[flying.id] !== "loading") return ls;
            const { [flying.id]: _drop, ...others } = ls;
            return others;
          });
        }
      }
      if (key === "main" || key === NEW_SESSION) return;
      const have = linesRef.current[key];
      if (have !== undefined && !failed.current.has(key)) return;
      failed.current.delete(key);
      linesRef.current = { ...linesRef.current, [key]: "loading" };
      setAllLines((ls) => ({ ...ls, [key]: "loading" }));
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
    setPending({ id: NEW_SESSION, nodeId, nodeLabel, title: titleOf(text), updatedAt: new Date().toISOString() });
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
    setPending((p) => (p && p.nodeId === summary.nodeId ? null : p));
    setActive((a) => (a === NEW_SESSION ? summary.id : a));
  }, []);

  const linesOf = useCallback((key: SessionKey): ChatLine[] | "loading" => lines[key] ?? [], [lines]);

  /** 고른 세션의 요약(새 세션 포함). 구성도 대화·모르는 id 는 null. */
  const summaryOf = useCallback(
    (key: SessionKey): SessionSummary | null => (key === NEW_SESSION ? pending : (sessions.find((s) => s.id === key) ?? null)),
    [pending, sessions],
  );

  return { sessions, active, select, linesOf, upsert, setLines, startNew, summaryOf, pending };
}
