"use client";

import { type ReactNode, type RefObject, useEffect, useLayoutEffect, useRef, useState } from "react";

import styles from "./chat.module.css";
import { MentionInput, type MentionInputHandle } from "./MentionInput";
import type { ChatLine, ProgressCard } from "./useChatTurn";

export type LlmHealth = { qwen: string; clef: string };

export interface ChatPanelProps {
  lines: ChatLine[];
  busy: boolean;
  onSend(text: string): void;
  onStop(): void;
  health: LlmHealth | null;
  disabledReason?: string;
  mentionRef: RefObject<MentionInputHandle | null>;
  /** Rendered under the conversation (sample list for an empty diagram). */
  footer?: ReactNode;
  /** `주의 N` 칩 클릭: 캔버스 구성 정보 카드를 펼쳐 주의 절로 간다. 없으면 칩은 글로만 보인다. */
  onOpenWarnings?(): void;
}

const PLACEHOLDER = "만들고 싶은 서비스나 바꾸고 싶은 점을 말해 주세요. 노드를 오른쪽 클릭하면 참조를 붙일 수 있어요.";
const DOWN = "AI 서버에 연결할 수 없어요. 잠시 뒤 다시 시도하거나 관리자에게 문의해 주세요.";
const NEAR_BOTTOM = 40;

const TOKEN = /@\[([^\]]*)\]\(node:([^)]+)\)/g;

/** Shows `@[라벨](node:id)` tokens as an inline reference label. */
function renderText(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(TOKEN)) {
    const at = m.index ?? 0;
    if (at > last) out.push(text.slice(last, at));
    out.push(
      <span key={at} className={styles.ref}>
        {m[1]}
      </span>,
    );
    last = at + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const pad = (n: number) => String(n).padStart(2, "0");
const hhmm = (ms: number) => {
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** 차례 끝 결과 칩(요약·주의 N). */
const CHIP_KINDS = new Set<ChatLine["kind"]>(["summary", "warning"]);

/** 차례 밖의 줄은 하나씩, 같은 차례(turn)의 줄은 한 AI 메시지로 묶는다. */
type Block = { kind: "line"; line: ChatLine } | { kind: "turn"; id: string; lines: ChatLine[] };
function toBlocks(lines: ChatLine[]): Block[] {
  const out: Block[] = [];
  for (const l of lines) {
    const last = out.at(-1);
    if (l.turn === undefined) out.push({ kind: "line", line: l });
    else if (last?.kind === "turn" && last.id === l.turn) last.lines.push(l);
    else out.push({ kind: "turn", id: l.turn, lines: [l] });
  }
  return out;
}

function Check() {
  return (
    <svg className={styles.stepIcon} viewBox="0 0 12 12" aria-hidden="true">
      <path d="M2.5 6.2 5 8.5l4.5-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Dots() {
  return (
    <span className={styles.dots} aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

const BUILD_STEPS = ["review", "drawing", "checking"] as const;
type StepState = "done" | "current" | "todo";

function stepRows(card: ProgressCard): { key: string; label: string; state: StepState }[] {
  if (card.mode === "answer") return [{ key: "answer", label: "답변 작성 중", state: "current" }];
  const at = BUILD_STEPS.indexOf(card.step);
  const label = { review: "구성 검토", drawing: `그리는 중 (변경 ${card.changes}개)`, checking: "위험 요소 점검" };
  return [
    ...BUILD_STEPS.map((s, i) => ({ key: s, label: label[s], state: (i < at ? "done" : i === at ? "current" : "todo") as StepState })),
    { key: "done", label: "완료", state: "todo" as const },
  ];
}

/** 스크린 리더에 알릴 단계 이름(변경 수 없이). 단계가 바뀔 때만 글이 바뀐다. */
function stepName(card: ProgressCard): string {
  if (card.end) return card.end === "done" ? "완료" : "중단됨";
  if (card.mode === "answer") return "답변 작성 중";
  return { review: "구성 검토", drawing: "그리는 중", checking: "위험 요소 점검" }[card.step];
}

/** 진행 카드: 진행 중이면 단계 목록, 끝나면 접힌 한 줄(`완료 · 노드 N · 연결 M` / `중단됨`). */
function CardView({ card }: { card: ProgressCard }) {
  if (card.end) {
    const done = card.end === "done";
    const counts = card.nodes !== undefined && card.edges !== undefined ? ` · 노드 ${card.nodes} · 연결 ${card.edges}` : "";
    return (
      <div className={`${styles.card} ${styles.cardEnded}`} data-end={card.end}>
        {done ? <Check /> : <span className={`${styles.stepIcon} ${styles.stop}`} aria-hidden="true" />}
        <span>{done ? `완료${counts}` : "중단됨"}</span>
      </div>
    );
  }
  return (
    <ol className={styles.card} aria-label="진행 단계">
      {stepRows(card).map((r) => (
        <li key={r.key} className={styles.step} data-state={r.state} {...(r.state === "current" ? { "aria-current": "step" as const } : {})}>
          {r.state === "done" ? <Check /> : <span className={styles.stepIcon} aria-hidden="true" />}
          <span>{r.label}</span>
          {r.state === "current" && <Dots />}
        </li>
      ))}
    </ol>
  );
}

export function ChatPanel({ lines, busy, onSend, onStop, health, disabledReason, mentionRef, footer, onOpenWarnings }: ChatPanelProps) {
  const list = useRef<HTMLDivElement>(null);
  const composer = useRef<HTMLDivElement>(null);
  const stopBtn = useRef<HTMLButtonElement>(null);
  const stick = useRef(true);
  const [hasContent, setHasContent] = useState(false);

  useLayoutEffect(() => {
    const el = list.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [lines]);

  // 보내는 동안 입력칸·보내기가 비활성이라 포커스를 잃는다. 입력칸에서 보냈으면 차례 동안은 중단 버튼에,
  // 끝나면(중단 버튼이 사라져 포커스가 갈 곳을 잃었을 때만) 입력칸에 둔다.
  const refocus = useRef(false);
  useEffect(() => {
    if (!refocus.current) return;
    if (busy) {
      stopBtn.current?.focus();
      return;
    }
    refocus.current = false;
    const a = document.activeElement;
    if (!a || a === document.body || composer.current?.contains(a)) mentionRef.current?.focus();
  }, [busy, mentionRef]);
  const send = (text: string) => {
    refocus.current = !!composer.current?.contains(document.activeElement);
    onSend(text);
  };

  const blocked = busy || !!disabledReason;
  const lastCard = lines.findLast((l) => l.kind === "card" && l.card)?.card;
  const down = health !== null && health.qwen !== "ok";

  const renderChip = (l: ChatLine) => {
    const tone = l.kind === "summary" ? styles.chipSummary : styles.chipWarning;
    const attrs = { "data-kind": l.kind };
    const onClick = l.kind === "warning" ? onOpenWarnings : undefined;
    return onClick ? (
      <button type="button" className={`${styles.result} ${tone}`} onClick={onClick} {...attrs}>
        {l.text}
      </button>
    ) : (
      <span className={`${styles.result} ${tone}`} {...attrs}>
        {l.text}
      </span>
    );
  };

  /** 말풍선·본문 한 줄. inTurn: AI 메시지 안의 줄(안내 글은 왼쪽 작은 글, 밖이면 가운데). */
  const renderLine = (l: ChatLine, inTurn: boolean) => {
    if (CHIP_KINDS.has(l.kind)) return <div key={l.id}>{renderChip(l)}</div>;
    const cls = l.kind === "system" && inTurn ? styles.note : styles[l.kind];
    return (
      <p key={l.id} className={`${styles.line} ${cls}`} data-kind={l.kind}>
        {renderText(l.text)}
      </p>
    );
  };

  /** AI 메시지: 머리 줄(IS · InfraSketch · 시각) → 진행 카드 → 본문 → 결과 칩 줄. */
  const renderTurn = (id: string, ls: ChatLine[]) => {
    const at = ls.find((l) => l.at !== undefined)?.at;
    const body = ls.filter((l) => l.kind !== "card" && !CHIP_KINDS.has(l.kind));
    const chips = ls.filter((l) => CHIP_KINDS.has(l.kind));
    return (
      <div key={id} className={styles.ai} role="group" aria-label="InfraSketch 메시지">
        <div className={styles.aiHead}>
          <span className={styles.mono} aria-hidden="true">
            IS
          </span>
          <span className={styles.aiName}>InfraSketch</span>
          {at !== undefined && (
            <time className={styles.aiTime} dateTime={new Date(at).toISOString()} suppressHydrationWarning>
              {hhmm(at)}
            </time>
          )}
        </div>
        <div className={styles.aiBody}>
          {/* 카드는 변경마다 바뀌므로 읽지 않는다. 단계 변화는 아래 상태 줄이 알린다. */}
          <div aria-live="off" className={styles.cardSlot}>
            {ls.map((l) => (l.kind === "card" && l.card ? <CardView key={l.id} card={l.card} /> : null))}
          </div>
          {body.map((l) => renderLine(l, true))}
          {chips.length > 0 && (
            <ul className={styles.results} aria-label="이번 차례 결과">
              {chips.map((l) => (
                <li key={l.id}>{renderChip(l)}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.chat}>
      {down && (
        <div className={styles.notice} role="status">
          {DOWN}
        </div>
      )}
      <div
        ref={list}
        className={styles.log}
        role="log"
        aria-live="polite"
        aria-label="대화 내용"
        tabIndex={0}
        onScroll={(e) => {
          const el = e.currentTarget;
          stick.current = el.scrollHeight - el.scrollTop - el.clientHeight <= NEAR_BOTTOM;
        }}
      >
        {toBlocks(lines).map((b) => (b.kind === "line" ? renderLine(b.line, false) : renderTurn(b.id, b.lines)))}
        {footer}
      </div>
      <div role="status" className={styles.srOnly}>
        {lastCard ? stepName(lastCard) : ""}
      </div>
      <div ref={composer} className={styles.composer}>
        {disabledReason && <p className={styles.reason}>{disabledReason}</p>}
        <MentionInput
          ref={mentionRef}
          placeholder={PLACEHOLDER}
          canSend={!blocked}
          disabled={blocked}
          onSend={send}
          onContentChange={setHasContent}
        />
        <div className={styles.actions}>
          {busy && (
            <button ref={stopBtn} type="button" className={styles.btn} onClick={onStop}>
              중단
            </button>
          )}
          <button type="button" className={styles.btn} disabled={blocked || !hasContent} onClick={() => mentionRef.current?.submit()}>
            보내기
          </button>
        </div>
      </div>
    </div>
  );
}
