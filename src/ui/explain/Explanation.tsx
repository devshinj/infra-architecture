"use client";

import { useEffect, useState } from "react";

import { normalizeTerm, type AnyExplanation, type EdgeExplanation, type GroupExplanation, type NodeExplanation, type TermedExplanation } from "@/domain/explain";
import { Button } from "@/ui/Button";
import { SkeletonLines } from "@/ui/skeleton/Skeleton";

import { AI_BADGE, AI_BADGE_SR, isUnreviewedAi } from "../glossary/aiBadge";
import styles from "../panel.module.css";
import { TermText, underlinePlan, type GlossaryTerm } from "./TermText";

export interface ExplanationProps {
  status: "idle" | "loading" | "ready" | "error";
  data?: AnyExplanation;
  partial?: Partial<TermedExplanation>;
  message?: string;
  terms: GlossaryTerm[];
  onRewrite?(instruction: string): void;
  onRetry?(): void;
  busy?: boolean;
  /** 데이터가 아직 없을 때(loading) 어떤 자리를 그릴지. 기본은 노드. */
  target?: "node" | "edge" | "group";
}

const LOADING = "설명을 만드는 중…";
/** 설명은 AI 가 쓰므로 길어질 수 있다. 이만큼 지나면 멈춘 게 아니라고 한 줄 알린다. */
export const SLOW_MS = 10_000;
const SLOW = "조금 오래 걸리고 있어요. 다 만들면 바로 보여 드릴게요.";
/** 칸마다 줄 자리(정의는 길고, 나머지는 두 줄쯤). */
const SLOT_LINES: Record<string, string[]> = { 정의: ["100%", "94%", "52%"] };
const DEFAULT_LINES = ["100%", "68%"];

/** active 가 SLOW_MS 넘게 이어지면 true. 꺼지면 다시 처음부터 잰다. */
function useSlow(active: boolean): boolean {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => setSlow(true), SLOW_MS);
    return () => {
      clearTimeout(t);
      setSlow(false);
    };
  }, [active]);
  return active && slow;
}
const DEFAULT_INSTRUCTION = "더 쉽고 짧게";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={styles.section}>
      <h3 className={styles.heading}>{title}</h3>
      {children}
    </section>
  );
}

function Rewrite({ onRewrite, busy }: { onRewrite: (instruction: string) => void; busy?: boolean }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  if (!open) {
    return (
      <Button size="sm" className={styles.start} disabled={busy} onClick={() => setOpen(true)}>
        다시 쓰기
      </Button>
    );
  }
  return (
    <div className={styles.rewrite}>
      <input
        className={styles.rewriteInput}
        value={text}
        disabled={busy}
        placeholder="어떻게 고칠까요? (예: 더 쉽게)"
        aria-label="다시 쓰기 지시"
        onChange={(e) => setText(e.target.value)}
      />
      <Button
        size="sm"
        disabled={busy}
        onClick={() => {
          onRewrite(text.trim() || DEFAULT_INSTRUCTION);
          setText("");
          setOpen(false);
        }}
      >
        다시 만들기
      </Button>
    </div>
  );
}

function Retry({ message, onRetry, busy }: { message?: string; onRetry?: () => void; busy?: boolean }) {
  return (
    <>
      {message && (
        <p className={styles.cautionError} role="alert">
          {message}
        </p>
      )}
      {onRetry && (
        <Button size="sm" className={styles.start} disabled={busy} onClick={onRetry}>
          다시 시도
        </Button>
      )}
    </>
  );
}

const ADR_LABELS = ["결정", "이유", "대안", "대가"] as const;

/** 「자세히」 펼침 상태를 브라우저에 기억하는 키("1" 이면 펼침). 노드를 바꿔도 같은 상태로 연다. */
export const DETAILS_OPEN_KEY = "infrasketch.explainDetails";

function readOpen(): boolean {
  try {
    return window.localStorage.getItem(DETAILS_OPEN_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * 「자세히」 접힘 절: 정의·필요한 이유·비교·왜 이렇게 짰나요. 펼침 상태는 기억한다.
 * 첫 렌더는 접힌 채(하이드레이션 일치), 마운트 뒤 기억한 값을 읽는다.
 */
function Details({ parts, children }: { parts: string[]; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(readOpen()), []);
  return (
    <details
      className={styles.details}
      open={open}
      onToggle={(e) => {
        const next = (e.currentTarget as HTMLDetailsElement).open;
        setOpen(next);
        try {
          window.localStorage.setItem(DETAILS_OPEN_KEY, next ? "1" : "0");
        } catch {
          /* 저장 실패는 이번 방문에만 영향 */
        }
      }}
    >
      <summary className={styles.detailsSummary}>
        <svg className={styles.detailsChevron} width={12} height={12} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4.5 2.75 7.75 6 4.5 9.25" />
        </svg>
        자세히
        <span className={styles.detailsParts}>{parts.join(" · ")}</span>
      </summary>
      <div className={styles.detailsBody}>{children}</div>
    </details>
  );
}

/** 정의(+AI 설명 배지)와 사전에 있으면 필요한 이유·비교. 다 만든 설명과, 만드는 중·실패 때 사전 정의에 같이 쓴다. */
function DefinitionPart({ d, terms, plan }: { d: Partial<TermedExplanation> & { definition: string }; terms: GlossaryTerm[]; plan: Plan }) {
  return (
    <>
      <Section title="정의">
        <p className={styles.explainText}>
          <PlannedText text={d.definition} terms={terms} plan={plan} />
          {isUnreviewedAi({ source: d.termSource ?? (d.definitionSource === "ai" ? "ai" : undefined), reviewed: d.reviewed }) && (
            <>
              <span className={styles.unreviewed}>{AI_BADGE}</span>
              <span className={styles.srOnly}>{AI_BADGE_SR}</span>
            </>
          )}
        </p>
      </Section>
      {d.why && (
        <Section title="필요한 이유">
          <p className={styles.explainText}><PlannedText text={d.why} terms={terms} plan={plan} /></p>
        </Section>
      )}
      {d.compare && (
        <Section title="비교">
          <p className={styles.explainText}><PlannedText text={d.compare} terms={terms} plan={plan} /></p>
        </Section>
      )}
    </>
  );
}

/** 「자세히」 머리에 적을 안의 절 이름. */
const detailParts = (d: Partial<TermedExplanation>, adr: boolean) =>
  [d.definition ? "정의" : null, d.why ? "필요한 이유" : null, d.compare ? "비교" : null, adr ? "왜 이렇게 짰나요" : null].filter((x): x is string => x !== null);

/**
 * 밑줄 계획: 화면에 놓이는 차례(역할 → 정의 → 필요한 이유 → 비교 → 왜 이렇게 짰나요)대로 글을 읽어 용어마다 첫 글에서만 밑줄.
 * 노드 자신의 용어(정의의 대상)는 패널 어디서도 감싸지 않는다.
 */
type Plan = Map<string, ReadonlySet<string>>;
function makePlan(texts: string[], terms: GlossaryTerm[], own?: string): Plan {
  const sets = underlinePlan(texts, terms, own);
  const plan: Plan = new Map();
  texts.forEach((t, i) => {
    // 같은 글이 두 번 나오면 앞의 계획에 합친다(두 번째 자리는 이미 본 용어라 비어 있다).
    plan.set(t, new Set([...(plan.get(t) ?? []), ...sets[i]!]));
  });
  return plan;
}
function PlannedText({ text, terms, plan }: { text: string; terms: GlossaryTerm[]; plan: Plan }) {
  return <TermText text={text} terms={terms} only={plan.get(text) ?? new Set()} />;
}

/** 영역 설명의 경계 절 이름. 다 만든 설명과 만드는 중 자리가 같은 이름을 쓴다. */
const BOUNDARY_TITLE = "경계에서 드나드는 것";

/**
 * 노드·영역 설명 본문. 역할이 맨 위, 영역은 그 아래 경계. 정의·왜 이렇게 짰나요는 「자세히」 안.
 * 밑줄 계획은 화면 차례(역할 → 경계 → 정의 → 필요한 이유 → 비교 → ADR)대로 읽는다.
 */
function NodeBody({ d, terms }: { d: NodeExplanation | GroupExplanation; terms: GlossaryTerm[] }) {
  const adr = [d.adr.decision, d.adr.reason, d.adr.alternative, d.adr.cost];
  const boundary = d.kind === "group" ? d.boundary : null;
  const plan = makePlan([d.role, ...(boundary !== null ? [boundary] : []), d.definition, d.why ?? "", d.compare ?? "", ...adr], terms, d.term ? normalizeTerm(d.term) : undefined);
  return (
    <>
      <Section title="이 구성에서의 역할">
        <p className={styles.explainText}><PlannedText text={d.role} terms={terms} plan={plan} /></p>
      </Section>
      {boundary !== null && (
        <Section title={BOUNDARY_TITLE}>
          <p className={styles.explainText}><PlannedText text={boundary} terms={terms} plan={plan} /></p>
        </Section>
      )}
      <Details parts={detailParts(d, true)}>
        <DefinitionPart d={d} terms={terms} plan={plan} />
        <Section title="왜 이렇게 짰나요">
          <dl className={styles.adr}>
            {ADR_LABELS.map((label, i) => (
              <div key={label} className={styles.adrRow}>
                <dt>{label}</dt>
                <dd><PlannedText text={adr[i]} terms={terms} plan={plan} /></dd>
              </div>
            ))}
          </dl>
        </Section>
      </Details>
    </>
  );
}

function EdgeBody({ d, terms }: { d: EdgeExplanation; terms: GlossaryTerm[] }) {
  const rows: [string, string][] = [
    ["무엇이 오가나", d.flow],
    ["방식", d.method],
    ["왜 연결됐나", d.why],
    ["방화벽 규칙", d.firewall],
  ];
  const plan = makePlan(rows.map(([, v]) => v), terms);
  return (
    <>
      {rows.map(([title, value]) => (
        <Section key={title} title={title}>
          <p className={styles.explainText}><PlannedText text={value} terms={terms} plan={plan} /></p>
        </Section>
      ))}
    </>
  );
}

/** 설명 패널 본문. 데이터는 props 로만 받는다(요청·큐는 호출한 쪽 몫). */
export function Explanation({ status, data, partial, message, terms, onRewrite, onRetry, busy, target }: ExplanationProps) {
  const slow = useSlow(status === "loading");
  if (status === "idle") return null;

  const isEdge = (data?.kind ?? target) === "edge";
  const isGroup = (data?.kind ?? target) === "group";
  // 노드의 사전 정의(만드는 중·실패 때 받아 둔 것).
  const known = !isEdge && partial?.definition ? { ...partial, definition: partial.definition } : null;

  const knownPlan = known ? makePlan([known.definition, known.why ?? "", known.compare ?? ""], terms, known.term ? normalizeTerm(known.term) : undefined) : null;
  const skeleton = (s: string, i: number) => (
    <Section key={s} title={s}>
      <SkeletonLines widths={SLOT_LINES[s] ?? DEFAULT_LINES} start={i * 2} />
    </Section>
  );

  if (status === "loading") {
    // 다 만든 설명과 같은 자리: 역할이 맨 위, 정의·왜 이렇게 짰나요는 「자세히」 안. 받아 둔 사전 정의는 그 안에 바로 보인다.
    const edgeSlots = ["무엇이 오가나", "방식", "왜 연결됐나", "방화벽 규칙"];
    return (
      <div className={styles.explain} aria-busy="true">
        {isEdge ? (
          edgeSlots.map(skeleton)
        ) : (
          <>
            {skeleton("이 구성에서의 역할", 0)}
            {isGroup && skeleton(BOUNDARY_TITLE, 1)}
            <Details parts={known ? detailParts(known, true) : ["정의", "왜 이렇게 짰나요"]}>
              {known && knownPlan ? <DefinitionPart d={known} terms={terms} plan={knownPlan} /> : skeleton("정의", isGroup ? 2 : 1)}
              {skeleton("왜 이렇게 짰나요", isGroup ? 3 : 2)}
            </Details>
          </>
        )}
        {/* 알림 한 자리: 평소에는 보조기기에만 "만드는 중", 오래 걸리면 화면에도 보이는 안내로 바뀐다. */}
        <p role="status" className={slow ? styles.slowNote : styles.srOnly}>
          {slow ? SLOW : LOADING}
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className={styles.explain}>
        <Section title={known ? "이 구성에서의 역할" : "설명"}>
          <Retry message={message} onRetry={onRetry} busy={busy} />
        </Section>
        {known && knownPlan && (
          <Details parts={detailParts(known, false)}>
            <DefinitionPart d={known} terms={terms} plan={knownPlan} />
          </Details>
        )}
      </div>
    );
  }

  if (!data) return null;
  return (
    <div className={styles.explain}>
      {data.kind === "edge" ? <EdgeBody d={data} terms={terms} /> : <NodeBody d={data} terms={terms} />}
      {onRewrite && <Rewrite onRewrite={onRewrite} busy={busy} />}
    </div>
  );
}
