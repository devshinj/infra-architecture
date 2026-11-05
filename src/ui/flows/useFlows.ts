"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { confirmFlowAction, deleteFlowAction, renameFlowAction } from "@/app/(app)/actions";
import type { StoredFlow } from "@/server/flows";

import { GENERIC_ERROR } from "../dialogs";

const SUGGEST_FAIL = "흐름을 만들지 못했어요. 다시 시도해 주세요.";

export interface UseFlowsInput {
  diagramId: string;
  /** 현재 판을 보는 중인가. 이력 보기·비교에서는 바꾸는 동작을 막는다(보기는 된다). */
  live: boolean;
  /** 대화 차례 중. 바꾸는 동작을 막는다(서버도 구성도 잠금으로 거절한다). */
  busy: boolean;
  /** 최신 버전 번호. 바뀌면 다시 불러온다(되돌리기·가져오기 뒤 끊김이 달라진다). */
  versionKey: number;
  fetchImpl?: typeof fetch;
}

export interface UseFlows {
  flows: StoredFlow[];
  activeKey: string | null;
  setActive(key: string | null): void;
  /** "흐름 제안받기" 버튼. */
  suggest(): Promise<void>;
  suggesting: boolean;
  /** 마지막 제안·맞아요 실패 문구. */
  error: string | null;
  /** 이름 바꾸기·삭제. 실패하면 대화상자에 보일 오류 글을 돌려준다. */
  rename(key: string, name: string): Promise<string | void>;
  remove(key: string): Promise<string | void>;
  confirm(key: string): Promise<void>;
  refresh(): Promise<StoredFlow[] | null>;
  /**
   * 대화 차례가 끝났다(done). 다시 불러오고, 구성을 바꾼 차례인데 흐름이 하나도 없으면 자동 제안을 한 번 보낸다.
   * 서버가 구성도마다 한 번만 하도록 막으므로 여기서는 중복을 따지지 않는다.
   */
  afterTurn(done: { changed: number } | undefined): Promise<void>;
}

const message = async (r: Response, fallback: string) => {
  try {
    const j = (await r.json()) as { error?: unknown };
    return typeof j.error === "string" && j.error ? j.error : fallback;
  } catch {
    return fallback;
  }
};

/** 구성도의 흐름 목록과 흐름 보기 상태. 흐름은 구성도와 따로 저장되어 흐름 라우트로 불러온다. */
export function useFlows({ diagramId, live, busy, versionKey, fetchImpl }: UseFlowsInput): UseFlows {
  const doFetch = fetchImpl ?? ((...a: Parameters<typeof fetch>) => fetch(...a));
  const fetchRef = useRef(doFetch);
  fetchRef.current = doFetch;
  const [flows, setFlows] = useState<StoredFlow[]>([]);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canChange = live && !busy;
  const canChangeRef = useRef(canChange);
  canChangeRef.current = canChange;

  // 늦게 온 옛 응답이 새 목록을 덮지 않게 요청마다 번호를 붙인다.
  const seq = useRef(0);
  const refresh = useCallback(async (): Promise<StoredFlow[] | null> => {
    const n = ++seq.current;
    try {
      const r = await fetchRef.current(`/api/diagrams/${diagramId}/flows`);
      if (!r || !r.ok) return null;
      const j = (await r.json()) as { flows?: unknown };
      const list = Array.isArray(j.flows) ? (j.flows as StoredFlow[]) : [];
      if (n === seq.current) setFlows(list);
      return list;
    } catch {
      return null; // 못 불러오면 있던 목록을 둔다
    }
  }, [diagramId]);

  // 다른 구성도로 가면 흐름 보기를 풀고 목록을 비운다.
  useEffect(() => {
    setFlows([]);
    setActiveKey(null);
    setError(null);
  }, [diagramId]);
  useEffect(() => {
    void refresh();
  }, [refresh, versionKey]);

  // 보던 흐름이 지워졌으면 흐름 보기를 푼다.
  useEffect(() => {
    if (activeKey !== null && !flows.some((f) => f.id === activeKey)) setActiveKey(null);
    // 목록이 바뀔 때만 본다(켠 직후 목록이 아직 안 왔을 수 있다).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flows]);

  const post = useCallback(
    async (auto: boolean) => {
      setSuggesting(true);
      if (!auto) setError(null);
      try {
        const r = await fetchRef.current(`/api/diagrams/${diagramId}/flows/suggest`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(auto ? { auto: true } : {}),
        });
        if (r.ok) await refresh();
        // 자동 제안이 못 하면 조용히 넘어간다(버튼으로 다시 할 수 있다).
        else if (!auto) setError(await message(r, SUGGEST_FAIL));
      } catch {
        if (!auto) setError(SUGGEST_FAIL);
      } finally {
        setSuggesting(false);
      }
    },
    [diagramId, refresh],
  );

  const suggest = useCallback(async () => {
    if (!canChangeRef.current || suggesting) return;
    await post(false);
  }, [post, suggesting]);

  const afterTurn = useCallback(
    async (done: { changed: number } | undefined) => {
      const list = await refresh();
      if ((done?.changed ?? 0) > 0 && list !== null && list.length === 0) await post(true);
    },
    [post, refresh],
  );

  const mutate = async (fn: () => Promise<{ ok: true } | { ok: false; error: string }>): Promise<string | void> => {
    if (!canChangeRef.current) return GENERIC_ERROR;
    try {
      const r = await fn();
      if (!r.ok) return r.error;
      await refresh();
    } catch {
      return GENERIC_ERROR;
    }
  };

  const rename = (key: string, name: string) => mutate(() => renameFlowAction(diagramId, key, name));
  const remove = async (key: string) => {
    const err = await mutate(() => deleteFlowAction(diagramId, key));
    if (!err) setActiveKey((k) => (k === key ? null : k));
    return err;
  };
  const confirm = async (key: string) => {
    if (!canChangeRef.current) return;
    setError(null);
    const err = await mutate(() => confirmFlowAction(diagramId, key));
    if (err) setError(err);
  };

  return { flows, activeKey, setActive: setActiveKey, suggest, suggesting, error, rename, remove, confirm, refresh, afterTurn };
}
