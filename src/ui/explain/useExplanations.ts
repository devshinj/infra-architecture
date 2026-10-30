"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { listTermsAction } from "@/app/(app)/actions";
import {
  normalizeTerm,
  pickTerm,
  signatureOf,
  termCandidates,
  type EdgeExplanation,
  type NodeExplanation,
  type TermEntry,
} from "@/domain/explain";
import type { DiagramState } from "@/domain/types";

import type { ExplanationProps } from "./Explanation";

export type TargetKind = "node" | "edge";

const FAIL = "설명을 만들지 못했어요. 다시 시도해 주세요.";

/** 받아 둔 설명 하나. 서버 GET 과 같은 "node:id" / "edge:id" 키로 둔다. */
interface Entry {
  status: "ready" | "error";
  data?: NodeExplanation | EdgeExplanation;
  partial?: Partial<NodeExplanation>;
  message?: string;
  /** 서버가 돌려준 서명(성공할 때만). */
  signature?: string;
  /** 요청할 때의 화면 서명. 서버 서명과 어긋나도 화면이 그대로면 다시 요청하지 않는다(무한 반복 방지). */
  requested: string;
  /** 실패한 다시 쓰기의 요청 한 줄. 다시 시도할 때 그대로 보낸다. */
  instruction?: string;
}

/** 사용자가 직접 부른 요청(다시 쓰기·다시 시도). 최신 여부와 상관없이 맨 앞에 선다. */
interface Request {
  kind: TargetKind;
  id: string;
  instruction?: string;
}

interface Job extends Request {
  key: string;
  sig: string;
  fromRequest: boolean;
}

export type ExplanationView = Pick<ExplanationProps, "status" | "data" | "partial" | "message">;

export interface UseExplanationsInput {
  diagramId: string;
  state: DiagramState;
  /** 현재 상태를 보는 중인가. 이력 보기·비교에서는 큐를 멈추고 받아 둔 것만 보인다. */
  live: boolean;
  /** 대화 차례 중. 새 요청을 시작하지 않는다(진행 중인 1건은 둔다). */
  busy: boolean;
  selectedId: string | null;
  fetchImpl?: typeof fetch;
}

const keyOf = (kind: TargetKind, id: string) => `${kind}:${id}`;
const omit = <T,>(o: Record<string, T>, key: string): Record<string, T> => {
  const rest = { ...o };
  delete rest[key];
  return rest;
};
const fresh = (e: Entry | undefined, sig: string) => !!e && (e.signature === sig || e.requested === sig);

/** 요청할 차례: 직접 부른 요청 → 선택한 대상 → 저장 서명과 다른 노드(삽입 순). 진행 중인 대상은 빼고 중복 없이. */
function queueOf(
  state: DiagramState,
  stored: Record<string, string> | null,
  entries: Record<string, Entry>,
  requests: Record<string, Request>,
  selectedId: string | null,
  runningKey: string | null,
): Job[] {
  const jobs: Job[] = [];
  const seen = new Set<string>();
  const push = (r: Request, mode: "request" | "selected" | "stale") => {
    const key = keyOf(r.kind, r.id);
    if (seen.has(key) || key === runningKey) return;
    const sig = signatureOf(state, r.kind, r.id);
    if (sig === null) return;
    if (mode !== "request" && fresh(entries[key], sig)) return;
    if (mode === "stale" && stored?.[key] === sig) return;
    seen.add(key);
    jobs.push({ ...r, key, sig, fromRequest: mode === "request" });
  };
  for (const r of Object.values(requests)) push(r, "request");
  if (selectedId !== null) {
    // 선택한 대상은 저장 서명이 같아도 요청한다: 서버가 캐시(사전 최신값 반영)를 AI 없이 돌려준다.
    if (state.nodes[selectedId]) push({ kind: "node", id: selectedId }, "selected");
    else if (state.edges[selectedId]) push({ kind: "edge", id: selectedId }, "selected");
  }
  // 연결은 선택했을 때만 만든다. 저장 서명을 받기 전에는 노드를 훑지 않는다.
  if (stored) for (const id of Object.keys(state.nodes)) push({ kind: "node", id }, "stale");
  return jobs;
}

/**
 * 노드·연결 설명을 한 번에 1건씩 차례로 요청한다.
 * 처음 열 때 저장 서명을 받고, 서명이 다른 노드를 큐에 넣는다. 선택한 대상이 맨 앞이다.
 * 실패는 오류로 남기고 자동으로 다시 하지 않는다(retry 로만).
 */
export function useExplanations({ diagramId, state, live, busy, selectedId, fetchImpl }: UseExplanationsInput) {
  const [stored, setStored] = useState<Record<string, string> | null>(null);
  const [entries, setEntries] = useState<Record<string, Entry>>({});
  const [requests, setRequests] = useState<Record<string, Request>>({});
  const [running, setRunning] = useState<Job | null>(null);
  const [terms, setTerms] = useState<TermEntry[]>([]);
  const runningRef = useRef<string | null>(null);
  const ctrlRef = useRef<AbortController | null>(null);
  const termsRef = useRef<TermEntry[]>([]);
  const entriesRef = useRef(entries);
  useEffect(() => {
    entriesRef.current = entries;
  });
  const fetchRef = useRef(fetchImpl);
  useEffect(() => {
    fetchRef.current = fetchImpl;
  });
  const doFetch: typeof fetch = (...a) => (fetchRef.current ?? fetch)(...a);

  const loadTerms = useCallback(() => {
    listTermsAction().then(
      (t) => {
        termsRef.current = t;
        setTerms(t);
      },
      () => {
        /* 용어 풀이가 없어도 설명은 보인다 */
      },
    );
  }, []);
  useEffect(loadTerms, [loadTerms]);

  // 저장 서명. 못 받으면 빈 목록으로 두고 차례로 요청한다(최신이면 서버가 AI 없이 캐시를 준다).
  useEffect(() => {
    const ctrl = new AbortController();
    setStored(null);
    (async () => {
      try {
        const r = await doFetch(`/api/diagrams/${diagramId}/explain`, { signal: ctrl.signal });
        const j: unknown = await r.json();
        if (!r.ok || !j || typeof j !== "object") throw new Error("bad signatures");
        if (!ctrl.signal.aborted) setStored(j as Record<string, string>);
      } catch {
        if (!ctrl.signal.aborted) setStored({});
      }
    })();
    return () => ctrl.abort();
  }, [diagramId]); // doFetch 는 ref 를 거쳐 늘 최신이다

  // 언마운트하면 진행 중 요청을 끊는다(끊긴 요청은 오류로 남기지 않는다).
  useEffect(
    () => () => {
      ctrlRef.current?.abort();
    },
    [],
  );

  const queue = useMemo(
    () => (live ? queueOf(state, stored, entries, requests, selectedId, running?.key ?? null) : []),
    [live, state, stored, entries, requests, selectedId, running],
  );
  const next = !busy && !running ? queue[0] : undefined;

  useEffect(() => {
    if (!next || runningRef.current !== null) return;
    const job = next;
    const ctrl = new AbortController();
    runningRef.current = job.key;
    ctrlRef.current = ctrl;
    setRunning(job);
    if (job.fromRequest) {
      setRequests((r) => omit(r, job.key));
    }
    const finish = () => {
      runningRef.current = null;
      ctrlRef.current = null;
      setRunning(null);
    };
    (async () => {
      let entry: Entry;
      try {
        const r = await doFetch(`/api/diagrams/${diagramId}/explain`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetKind: job.kind, targetId: job.id, ...(job.instruction ? { instruction: job.instruction } : {}) }),
          signal: ctrl.signal,
        });
        const j = (await r.json().catch(() => null)) as
          | { ok: true; explanation: NodeExplanation | EdgeExplanation; signature: string }
          | { ok: false; message?: string; partial?: Partial<NodeExplanation> }
          | null;
        if (r.ok && j?.ok === true) entry = { status: "ready", data: j.explanation, signature: j.signature, requested: job.sig };
        else if (r.ok && j?.ok === false)
          entry = { status: "error", message: j.message || FAIL, ...(j.partial ? { partial: j.partial } : {}), requested: job.sig };
        else entry = { status: "error", message: FAIL, requested: job.sig };
      } catch {
        if (ctrl.signal.aborted) return finish(); // 언마운트: 다시 붙으면 큐가 다시 고른다
        entry = { status: "error", message: FAIL, requested: job.sig };
      }
      if (ctrl.signal.aborted) return finish();
      if (entry.status === "error" && job.instruction) entry.instruction = job.instruction;
      setEntries((e) => ({ ...e, [job.key]: entry }));
      if (entry.status === "ready" && entry.signature) {
        const sig = entry.signature;
        setStored((s) => ({ ...(s ?? {}), [job.key]: sig }));
      }
      finish();
      // 다시 쓰기나 사전에 없던 AI 용어는 새 용어를 더했을 수 있다: 용어 목록을 다시 받는다.
      const d = entry.data;
      const newTerm = d?.kind === "node" && d.definitionSource === "ai" && !termsRef.current.some((t) => t.key === normalizeTerm(d.term));
      if (entry.status === "ready" && (job.instruction || newTerm)) loadTerms();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- next 가 바뀔 때만 새로 시작한다
  }, [next]);

  const queued = useMemo(() => new Set(queue.map((j) => j.key)), [queue]);

  /** 받아 둔 사전에서 찾은 노드의 정의 부분(서버 findTerm 과 같은 후보·순서). 없으면 undefined. */
  const glossaryOf = useCallback(
    (kind: TargetKind, id: string): Partial<NodeExplanation> | undefined => {
      const node = kind === "node" ? state.nodes[id] : undefined;
      const t = node ? pickTerm(terms, termCandidates(node).map((c) => c.key)) : null;
      if (!t) return undefined;
      return {
        term: t.term,
        definition: t.definition,
        definitionSource: "glossary",
        reviewed: t.reviewed,
        ...(t.why ? { why: t.why } : {}),
        ...(t.compare ? { compare: t.compare } : {}),
      };
    },
    [state, terms],
  );

  const get = useCallback(
    (kind: TargetKind, id: string): ExplanationView => {
      const key = keyOf(kind, id);
      // 만드는 동안에도 사전에 있는 정의는 바로 보인다(§6.6). 역할·ADR 만 기다린다.
      const loading = (): ExplanationView => {
        const partial = glossaryOf(kind, id);
        return partial ? { status: "loading", partial } : { status: "loading" };
      };
      if (running?.key === key) return loading();
      const sig = signatureOf(state, kind, id);
      const e = entries[key];
      if (e && sig !== null && fresh(e, sig)) {
        if (e.status === "ready") return { status: "ready", data: e.data };
        const partial = e.partial ?? glossaryOf(kind, id);
        return { status: "error", message: e.message, ...(partial ? { partial } : {}) };
      }
      return queued.has(key) ? loading() : { status: "idle" };
    },
    [state, entries, running, queued, glossaryOf],
  );

  // 정체성을 고정한다(setter 만 쓴다).
  const rewrite = useCallback((kind: TargetKind, id: string, instruction: string) => {
    setRequests((r) => ({ ...r, [keyOf(kind, id)]: { kind, id, instruction } }));
  }, []);
  const retry = useCallback((kind: TargetKind, id: string) => {
    const key = keyOf(kind, id);
    // 실패한 다시 쓰기면 같은 요청 한 줄로 다시 보낸다(없이 보내면 서버가 옛 캐시를 돌려준다).
    const instruction = entriesRef.current[key]?.instruction;
    setEntries((e) => omit(e, key));
    setRequests((r) => ({ ...r, [key]: { kind, id, ...(instruction ? { instruction } : {}) } }));
  }, []);

  return { get, rewrite, retry, terms };
}
