"use client";

import { useEffect, useState } from "react";

import { normalizeTerm, type EdgeExplanation, type NodeExplanation } from "@/domain/explain";
import { Button } from "@/ui/Button";
import { SkeletonLines } from "@/ui/skeleton/Skeleton";

import { AI_BADGE, AI_BADGE_SR, isUnreviewedAi } from "../glossary/aiBadge";
import styles from "../panel.module.css";
import { TermText, type GlossaryTerm } from "./TermText";

export interface ExplanationProps {
  status: "idle" | "loading" | "ready" | "error";
  data?: NodeExplanation | EdgeExplanation;
  partial?: Partial<NodeExplanation>;
  message?: string;
  terms: GlossaryTerm[];
  onRewrite?(instruction: string): void;
  onRetry?(): void;
  busy?: boolean;
  /** 데이터가 아직 없을 때(loading) 어떤 자리를 그릴지. 기본은 노드. */
  target?: "node" | "edge";
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

/** 정의(+AI 설명 배지)와 사전에 있으면 필요한 이유·비교. 다 만든 설명과, 만드는 중·실패 때 사전 정의에 같이 쓴다. */
function DefinitionPart({ d, terms }: { d: Partial<NodeExplanation> & { definition: string }; terms: GlossaryTerm[] }) {
  const own = d.term ? normalizeTerm(d.term) : undefined;
  return (
    <>
      <Section title="정의">
        <p className={styles.explainText}>
          <TermText text={d.definition} terms={terms} exclude={own} />
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
          <p className={styles.explainText}><TermText text={d.why} terms={terms} /></p>
        </Section>
      )}
      {d.compare && (
        <Section title="비교">
          <p className={styles.explainText}><TermText text={d.compare} terms={terms} /></p>
        </Section>
      )}
    </>
  );
}

function NodeBody({ d, terms }: { d: NodeExplanation; terms: GlossaryTerm[] }) {
  const adr = [d.adr.decision, d.adr.reason, d.adr.alternative, d.adr.cost];
  return (
    <>
      <DefinitionPart d={d} terms={terms} />
      <Section title="이 구성에서의 역할">
        <p className={styles.explainText}><TermText text={d.role} terms={terms} /></p>
      </Section>
      <Section title="왜 이렇게 짰나요">
        <dl className={styles.adr}>
          {ADR_LABELS.map((label, i) => (
            <div key={label} className={styles.adrRow}>
              <dt>{label}</dt>
              <dd><TermText text={adr[i]} terms={terms} /></dd>
            </div>
          ))}
        </dl>
      </Section>
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
  return (
    <>
      {rows.map(([title, value]) => (
        <Section key={title} title={title}>
          <p className={styles.explainText}><TermText text={value} terms={terms} /></p>
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
  // 노드의 사전 정의(만드는 중·실패 때 받아 둔 것).
  const known = !isEdge && partial?.definition ? { ...partial, definition: partial.definition } : null;

  if (status === "loading") {
    const slots = isEdge ? ["무엇이 오가나", "방식", "왜 연결됐나", "방화벽 규칙"] : known ? ["이 구성에서의 역할", "왜 이렇게 짰나요"] : ["정의", "이 구성에서의 역할", "왜 이렇게 짰나요"];
    return (
      <div className={styles.explain} aria-busy="true">
        {known && <DefinitionPart d={known} terms={terms} />}
        {slots.map((s, i) => (
          <Section key={s} title={s}>
            <SkeletonLines widths={SLOT_LINES[s] ?? DEFAULT_LINES} start={i * 2} />
          </Section>
        ))}
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
        {known && <DefinitionPart d={known} terms={terms} />}
        <Section title={known ? "이 구성에서의 역할" : "설명"}>
          <Retry message={message} onRetry={onRetry} busy={busy} />
        </Section>
      </div>
    );
  }

  if (!data) return null;
  return (
    <div className={styles.explain}>
      {data.kind === "node" ? <NodeBody d={data} terms={terms} /> : <EdgeBody d={data} terms={terms} />}
      {onRewrite && <Rewrite onRewrite={onRewrite} busy={busy} />}
    </div>
  );
}
