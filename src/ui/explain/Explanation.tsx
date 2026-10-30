"use client";

import { useState } from "react";

import { normalizeTerm, type EdgeExplanation, type NodeExplanation } from "@/domain/explain";

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
      <button type="button" className={styles.linkBtn} disabled={busy} onClick={() => setOpen(true)}>
        다시 쓰기
      </button>
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
      <button
        type="button"
        className={styles.linkBtn}
        disabled={busy}
        onClick={() => {
          onRewrite(text.trim() || DEFAULT_INSTRUCTION);
          setText("");
          setOpen(false);
        }}
      >
        다시 만들기
      </button>
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
        <button type="button" className={styles.linkBtn} disabled={busy} onClick={onRetry}>
          다시 시도
        </button>
      )}
    </>
  );
}

const ADR_LABELS = ["결정", "이유", "대안", "대가"] as const;

/** 정의(+미검수)와 사전에 있으면 필요한 이유·비교. 다 만든 설명과, 만드는 중·실패 때 사전 정의에 같이 쓴다. */
function DefinitionPart({ d, terms }: { d: Partial<NodeExplanation> & { definition: string }; terms: GlossaryTerm[] }) {
  const own = d.term ? normalizeTerm(d.term) : undefined;
  return (
    <>
      <Section title="정의">
        <p className={styles.explainText}>
          <TermText text={d.definition} terms={terms} exclude={own} />
          {d.reviewed === false && <span className={styles.unreviewed}>미검수</span>}
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
      <Section title="결정 기록(ADR)">
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
  if (status === "idle") return null;

  const isEdge = (data?.kind ?? target) === "edge";
  // 노드의 사전 정의(만드는 중·실패 때 받아 둔 것).
  const known = !isEdge && partial?.definition ? { ...partial, definition: partial.definition } : null;

  if (status === "loading") {
    const slots = isEdge ? ["무엇이 오가나", "방식", "왜 연결됐나", "방화벽 규칙"] : known ? ["이 구성에서의 역할", "결정 기록(ADR)"] : ["정의", "이 구성에서의 역할", "결정 기록(ADR)"];
    return (
      <div className={styles.explain} aria-busy="true">
        {known && <DefinitionPart d={known} terms={terms} />}
        {slots.map((s) => (
          <Section key={s} title={s}>
            <p className={styles.missing}>{LOADING}</p>
          </Section>
        ))}
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
