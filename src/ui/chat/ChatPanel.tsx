"use client";

import { type ReactNode, type RefObject, useEffect, useLayoutEffect, useRef, useState } from "react";

import { NODE_GONE_MESSAGE } from "@/server/chat/events";
import { Button } from "@/ui/Button";

import { FLY_ORIGIN_ATTR } from "../FlyLayer";
import { useShell } from "../Shell";

import styles from "./chat.module.css";
import { type Mention, MentionInput, type MentionInputHandle } from "./MentionInput";
import { SessionPicker, type SessionPickerProps } from "./SessionPicker";
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
  /** 구성도에 노드가 없다. 대화 기록도 없으면 고정 인사말과 가이드를 보인다(저장·전송 없음). */
  emptyDiagram?: boolean;
  /** Rendered under the conversation. */
  footer?: ReactNode;
  /** `주의 N` 칩 클릭: 캔버스 구성 정보 카드를 펼쳐 주의 절로 간다. 없으면 칩은 글로만 보인다. */
  onOpenWarnings?(): void;
  /** 맨 위 대화 세션 고르기. 없으면 그리지 않는다. */
  picker?: SessionPickerProps;
  /**
   * 노드 질문 세션을 보는 중. 진행 카드·결과 칩·인사말 없이 말풍선과 답만 보인다.
   * nodeLabel 은 지금 구성도의 노드 이름이고, 노드가 지워졌으면 null(입력 대신 안내).
   */
  ask?: { nodeId: string; nodeLabel: string | null };
  /** 다른 세션의 차례가 도는 중: 보내기를 막고 안내한다(busy 는 이 세션의 차례). */
  elsewhereBusy?: boolean;
  /** 세션 줄을 불러오는 중: 보내기를 막는다. */
  loading?: boolean;
  /** 대화가 비어 있고 시작 인사도 없을 때 가운데 보일 안내(새 구성도 대화 등). */
  emptyHint?: string;
  /** `구성도 대화로 보내기` 가 옮겨 갈 구성도 대화(마지막으로 쓴 구성도 대화, 없으면 기본 대화). */
  handoffTo?: string;
}

const PLACEHOLDER_BASE = "만들고 싶은 서비스나 바꾸고 싶은 점을 말해 주세요.";
const PLACEHOLDER = `${PLACEHOLDER_BASE} 노드를 오른쪽 클릭하면 참조를 붙일 수 있어요.`;
/** 휴대폰(터치)에는 오른쪽 클릭이 없어 참조 안내를 뺀다. */
const PLACEHOLDER_NARROW = PLACEHOLDER_BASE;
const ASK_PLACEHOLDER = "이 노드에 대해 더 물어보기";
export const ELSEWHERE_BUSY = "다른 대화가 답하는 중이에요.";
const HANDOFF_LABEL = "구성도 대화로 보내기";
const DOWN = "AI 서버에 연결할 수 없어요. 잠시 뒤 다시 시도하거나 관리자에게 문의해 주세요.";
const NEAR_BOTTOM = 40;

const GREETING = "안녕하세요, InfraSketch예요. 만들고 싶은 서비스를 말씀해 주시면 인프라 구성도를 바로 그려 드릴게요.";
const GUIDE_TITLE = "이렇게 말하면 더 정확해요";
const GUIDE_ITEMS = ["무엇을 만드는지 (예: 쇼핑몰, 예약 서비스)", "어디에 올리는지 (클라우드, 사내 IDC)", "대략 사용자 수 (예: 하루 1만 명)", "붙일 외부 서비스 (결제, 소셜 로그인, 문자)"];
const EXAMPLES = ["결제와 카카오 로그인이 붙는 쇼핑몰", "사내 IDC에 WEB-WAS-DB 이중화", "AWS EKS 위 MSA와 Kafka", "하루 10만 명이 쓰는 예약 서비스"];

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
/** 질문 세션에서 보이지 않는 줄: 진행 카드·결과 칩. */
const HIDDEN_IN_ASK = new Set<ChatLine["kind"]>(["card", "summary", "warning"]);

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
  const drawing = card.part ? `이어서 그리는 중 (${card.part.n}/${card.part.of}) · 변경 ${card.changes}개` : `그리는 중 (변경 ${card.changes}개)`;
  const label = { review: "구성 검토", drawing, checking: "위험 요소 점검" };
  return [
    ...BUILD_STEPS.map((s, i) => ({ key: s, label: label[s], state: (i < at ? "done" : i === at ? "current" : "todo") as StepState })),
    { key: "done", label: "완료", state: "todo" as const },
  ];
}

/** 스크린 리더에 알릴 단계 이름(변경 수 없이). 단계가 바뀔 때만 글이 바뀐다. */
function stepName(card: ProgressCard): string {
  if (card.end) return card.end === "done" ? "완료" : "중단됨";
  if (card.mode === "answer") return "답변 작성 중";
  const drawing = card.part ? `이어서 그리는 중 (${card.part.n}/${card.part.of})` : "그리는 중";
  return { review: "구성 검토", drawing, checking: "위험 요소 점검" }[card.step];
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
          {r.state === "done" ? (
            <Check />
          ) : (
            // 현재 단계 점: 대화에서 캔버스로 날아가는 빛점의 출발점(FlyLayer).
            <span className={styles.stepIcon} aria-hidden="true" {...(r.state === "current" ? { [FLY_ORIGIN_ATTR]: "" } : {})} />
          )}
          <span>{r.label}</span>
          {r.state === "current" && <Dots />}
        </li>
      ))}
    </ol>
  );
}

export function ChatPanel({
  lines: allLines,
  busy,
  onSend,
  onStop,
  health,
  disabledReason,
  mentionRef,
  emptyDiagram = false,
  footer,
  onOpenWarnings,
  picker,
  ask,
  elsewhereBusy = false,
  loading = false,
  emptyHint,
  handoffTo = "main",
}: ChatPanelProps) {
  const { narrow } = useShell();
  const lines = ask ? allLines.filter((l) => !HIDDEN_IN_ASK.has(l.kind)) : allLines;
  const gone = !!ask && ask.nodeLabel === null;
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

  // 세션을 바꾸면 입력칸이 새로 그려져 비므로 보내기도 비활성으로 돌린다.
  const sessionKey = picker?.active ?? "main";
  useEffect(() => setHasContent(false), [sessionKey]);
  // 넘겨주기: 구성도 대화로 바꾼 뒤(입력칸이 새로 그려진 뒤) 참조와 글을 채운다. 보내지는 않는다.
  const [fill, setFill] = useState<{ mention: Mention; text: string } | null>(null);
  const handoff = (text: string) => {
    if (!ask || ask.nodeLabel === null) return;
    setFill({ mention: { id: ask.nodeId, label: ask.nodeLabel }, text });
    picker?.onSelect(handoffTo);
  };
  useEffect(() => {
    if (!fill || ask) return;
    setFill(null);
    mentionRef.current?.insertMention(fill.mention);
    mentionRef.current?.setText(fill.text);
  }, [fill, ask, mentionRef]);

  const reason = disabledReason ?? (elsewhereBusy ? ELSEWHERE_BUSY : undefined);
  const blocked = busy || elsewhereBusy || loading || !!disabledReason;
  // 보낼 수 있을 때만 금색. 비었거나 차례가 도는 동안은 무채색 비활성(중단이 그때의 동작이다).
  const canSubmit = !blocked && hasContent;
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
    if (l.kind === "handoff") {
      if (!ask) return null;
      return (
        <div key={l.id}>
          <button type="button" className={`${styles.result} ${styles.handoff}`} disabled={gone} onClick={() => handoff(l.text)}>
            {HANDOFF_LABEL}
          </button>
        </div>
      );
    }
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

  /** 시작 인사: AI 메시지와 같은 모양. 예시 칩은 입력칸만 채우고 보내지 않는다. */
  const renderGreeting = () => (
    <div className={styles.ai} role="group" aria-label="InfraSketch 메시지">
      <div className={styles.aiHead}>
        <span className={styles.mono} aria-hidden="true">
          IS
        </span>
        <span className={styles.aiName}>InfraSketch</span>
      </div>
      <div className={styles.aiBody}>
        <p className={styles.line}>{GREETING}</p>
        <p className={styles.guideTitle}>{GUIDE_TITLE}</p>
        <ul className={styles.guide}>
          {GUIDE_ITEMS.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <ul className={styles.examples} aria-label="예시 질문">
          {EXAMPLES.map((t) => (
            <li key={t}>
              <button type="button" className={`${styles.result} ${styles.example}`} disabled={blocked} onClick={() => mentionRef.current?.setText(t)}>
                {t}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  return (
    <div className={styles.chat}>
      {picker && <SessionPicker fallbackFocus={() => mentionRef.current?.focus()} {...picker} />}
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
        {!ask && emptyDiagram && lines.length === 0 && renderGreeting()}
        {!ask && !emptyDiagram && !loading && lines.length === 0 && emptyHint && (
          <p className={`${styles.line} ${styles.system}`} data-kind="system">
            {emptyHint}
          </p>
        )}
        {toBlocks(lines).map((b) => (b.kind === "line" ? renderLine(b.line, false) : renderTurn(b.id, b.lines)))}
        {footer}
      </div>
      <div role="status" className={styles.srOnly}>
        {lastCard ? stepName(lastCard) : ""}
      </div>
      {gone ? (
        <div className={styles.composer}>
          <p className={styles.reason} role="status">
            {NODE_GONE_MESSAGE}
          </p>
        </div>
      ) : (
        <div ref={composer} className={styles.composer}>
          {reason && <p className={styles.reason}>{reason}</p>}
          {/* 세션마다 입력칸을 새로 그린다(쓰던 글·참조가 다른 세션으로 따라가지 않게). */}
          <MentionInput
            key={sessionKey}
            ref={mentionRef}
            placeholder={ask ? ASK_PLACEHOLDER : narrow ? PLACEHOLDER_NARROW : PLACEHOLDER}
            canSend={!blocked}
            disabled={blocked}
            onSend={send}
            onContentChange={setHasContent}
          />
          <div className={styles.actions}>
            {busy && (
              <Button ref={stopBtn} onClick={onStop}>
                중단
              </Button>
            )}
            <Button variant="primary" disabled={!canSubmit} onClick={() => mentionRef.current?.submit()}>
              보내기
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
