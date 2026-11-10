"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** 열어 둔 구성도가 바깥(Claude Code) 변경을 묻는 간격. */
export const POLL_MS = 3000;

/** 바뀐 것을 알려 주는 안내와 버튼 글. */
export const REMOTE_CHANGED = "Claude Code가 구성도를 바꿨어요";
export const REMOTE_LOAD = "불러오기";

export interface UseRemoteChangesInput {
  diagramId: string;
  /** 지금 화면이 보여 주는(또는 이미 받아 오는 중인) 버전 번호. Claude Code 버전이 이보다 커야 불러온다. */
  version: number;
  /**
   * 끼어들면 안 되는 때(입력 중·대화상자·이력 보기). 함수면 물을 때마다 다시 본다(포커스는 렌더를 부르지 않는다).
   * 이때는 새 버전을 불러오지 않고 pending 만 켠다.
   */
  paused: boolean | (() => boolean);
  /**
   * 묻지도 않는 때: 대화 차례 중, 또는 브라우저가 스스로 쓴 버전을 아직 받아 오는 중(그 버전을 Claude Code 변경으로 오해하지 않게).
   * 함수면 물을 때마다(응답을 받은 뒤에도) 다시 본다.
   */
  busy: boolean | (() => boolean);
  /** 새 버전이 있다: 불러온다. */
  onVersion(): void;
  /** 흐름 수나 마지막 수정 시각이 바뀌었다: 흐름 목록만 다시 불러온다. */
  onFlows(): void;
  fetchImpl?: typeof fetch;
}

type Head = { version: number; mcpVersion: number; flows: { count: number; updatedAt: string | null } };

const isHead = (j: unknown): j is Head => {
  const h = j as Partial<Head> | null;
  return !!h && typeof h.version === "number" && typeof h.mcpVersion === "number" && !!h.flows && typeof h.flows.count === "number";
};

const read = (v: boolean | (() => boolean)) => (typeof v === "function" ? v() : v);

/**
 * 탭이 보일 때만 붙자마자 한 번, 그 뒤 POLL_MS 마다 `/api/diagrams/[id]/head` 를 묻는다.
 * Claude Code 가 만든 최신 버전(mcpVersion)이 version 보다 크면 끼어들어도 될 때 onVersion, 아니면 pending(안내만).
 * 브라우저가 스스로 만든 버전은 mcpVersion 을 올리지 않으므로 안내가 뜨지 않는다.
 * 흐름 키(수 + 마지막 수정 시각)가 바뀌면 onFlows. 흐름 키는 처음 받은 값을 기준으로 삼는다.
 */
export function useRemoteChanges({ diagramId, version, paused, busy, onVersion, onFlows, fetchImpl }: UseRemoteChangesInput): {
  pending: boolean;
  load(): void;
} {
  const [pending, setPending] = useState(false);
  const latest = useRef({ version, paused, busy, onVersion, onFlows, fetchImpl });
  latest.current = { version, paused, busy, onVersion, onFlows, fetchImpl };
  // 이미 불러 달라고 한 버전: 불러오는 동안 다음 물음에서 다시 부르지 않는다.
  const asked = useRef(0);
  // 마지막으로 받은 Claude Code 최신 버전.
  const seen = useRef(0);
  const flowsKey = useRef<string | null>(null);

  // 다른 구성도로 가면 기준을 비운다.
  useEffect(() => {
    asked.current = 0;
    seen.current = 0;
    flowsKey.current = null;
    setPending(false);
  }, [diagramId]);
  // 버전을 따라잡으면 안내를 내린다.
  useEffect(() => {
    if (version >= seen.current) setPending(false);
  }, [version]);

  const load = useCallback(() => {
    setPending(false);
    asked.current = Math.max(asked.current, seen.current);
    latest.current.onVersion();
  }, []);

  useEffect(() => {
    let alive = true;
    let inFlight = false;
    const poll = async () => {
      const cur = latest.current;
      if (inFlight || read(cur.busy) || document.visibilityState !== "visible") return;
      inFlight = true;
      try {
        const doFetch = cur.fetchImpl ?? fetch;
        const r = await doFetch(`/api/diagrams/${diagramId}/head`, { cache: "no-store" });
        if (!alive || !r?.ok) return;
        const head: unknown = await r.json();
        if (!alive || !isHead(head)) return;
        const now = latest.current;
        if (read(now.busy)) return; // 묻는 사이 차례나 스스로 쓰기가 시작됐다
        const key = `${head.flows.count}:${head.flows.updatedAt ?? ""}`;
        if (flowsKey.current !== null && flowsKey.current !== key) now.onFlows();
        flowsKey.current = key;
        seen.current = head.mcpVersion;
        if (head.mcpVersion > now.version && head.mcpVersion > asked.current) {
          if (read(now.paused)) {
            setPending(true);
          } else {
            asked.current = head.mcpVersion;
            setPending(false);
            now.onVersion();
          }
        }
      } catch {
        /* 못 물으면 다음 차례에 다시 묻는다 */
      } finally {
        inFlight = false;
      }
    };
    // 붙자마자 한 번 물어 흐름 키의 기준을 잡는다(처음 3초 사이의 변경도 놓치지 않게).
    void poll();
    const id = setInterval(() => void poll(), POLL_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [diagramId]);

  return { pending, load };
}
