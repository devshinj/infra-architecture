import type { MessageRole } from "@/db/schema";
import type { Warning } from "@/domain/types";
import type { WarningCounts } from "@/domain/warnings";
import type { MessageMeta } from "@/server/chat/events";

import type { ChatLine } from "./useChatTurn";

/**
 * 한 차례의 경고 변화를 칩 하나로 알린다(`새 주의 2 · 주의 4 해결 · 지금 모두 6`, 0 인 항목은 뺀다).
 * 새로 생기거나 해결된 경고가 없으면 null. 수가 없는 옛 메시지는 예전처럼 새 경고 수(`주의 N`)만.
 * 자세한 목록은 캔버스 구성 정보 카드에 있다.
 */
export function warningsChip(ws: readonly Warning[], counts?: WarningCounts): Omit<ChatLine, "id"> | null {
  if (!counts) return ws.length > 0 ? { kind: "warning", text: `주의 ${ws.length}` } : null;
  if (counts.fresh === 0 && counts.resolved === 0) return null;
  const parts = [
    ...(counts.fresh > 0 ? [`새 주의 ${counts.fresh}`] : []),
    ...(counts.resolved > 0 ? [`주의 ${counts.resolved} 해결`] : []),
    `지금 모두 ${counts.now}`,
  ];
  return { kind: "warning", text: parts.join(" · ") };
}

export const NOT_APPLIED_MESSAGE = "요청을 반영하지 못했어요. 다시 말해 주세요.";

export interface TurnResult {
  version: number | null;
  status: "complete" | "aborted";
  applied: number;
  /** 구성을 바꾼 명령 수(가정 제외). 없으면(옛 메시지) applied 로 본다. */
  changed?: number;
  /** 저장한 흐름 명령 수(있을 때만). */
  flows?: number;
  skipped: number;
  nodes?: number;
  edges?: number;
}

/** 바꾼 곳(구성을 바꾼 명령) 수. 옛 메시지는 changed 가 없어 applied 를 쓴다. */
const changedOf = (r: Pick<TurnResult, "applied" | "changed">) => r.changed ?? r.applied;

/**
 * 차례 끝 요약 칩 글. 바꾼 곳 수(가정 변경은 세지 않는다)만 쉬운 말로 보이고 건너뛴 수는 보이지 않는다.
 * 바꾼 곳이 없고 AI 가 낸 글(안내·답)도 없으면 반영하지 못했다고 알린다: 구성 변경 요청(structure_change)이면
 * 언제나(가정만 바꿨어도), 그 밖에는 버전 없이 건너뛴 명령이 있을 때. AI 가 글을 냈으면 알리지 않는다.
 * 구성 변경 차례에 글만 내고 바뀐 것이 없으면 "바꾼 곳이 없어요".
 * 그 밖에 바뀐 것이 없으면 "변경 사항이 없어요.", 답만 한 차례면 없음.
 * 재정렬(layout) 차례는 "다시 정렬했어요" 안내와 어긋나므로 칩을 두지 않는다.
 * 흐름을 저장했으면 `흐름 N개 바꿨어요`를 덧붙인다. 흐름만 바꾼 차례(버전 없음)도 반영한 것으로 본다.
 */
export function summaryText(r: TurnResult, hadAnswer: boolean, intent?: string | null): string | null {
  // 옛 메시지(changed 없음)는 예전 규칙 그대로 보인다.
  if (r.changed === undefined) return legacySummaryText(r, hadAnswer, intent);
  const changed = r.changed;
  const flows = r.flows ?? 0;
  if (changed === 0 && flows === 0 && r.status === "complete") {
    if (!hadAnswer && intent !== "layout" && (intent === "structure_change" || (r.version === null && r.skipped > 0))) return NOT_APPLIED_MESSAGE;
    // 구성 변경 차례인데 AI 가 "~추가합니다" 같은 글만 내고 아무것도 안 바꿨으면, 글만 보고 바뀐 줄 알지 않게 알린다.
    if (r.version === null && hadAnswer && intent === "structure_change") return "바꾼 곳이 없어요";
    if (r.version === null) return hadAnswer || intent === "layout" ? null : "변경 사항이 없어요.";
  }
  const flowText = flows > 0 ? `흐름 ${flows}개 바꿨어요` : null;
  const counts = changed > 0 ? `${changed}곳 바꿨어요` : flowText ? null : "바꾼 곳이 없어요";
  const parts = [...(r.nodes === undefined || r.edges === undefined ? [] : [`노드 ${r.nodes}`, `연결 ${r.edges}`]), counts, flowText].filter((p) => p !== null);
  const base = parts.join(" · ");
  return r.status === "aborted" ? `중단됨 · ${base}` : base;
}

/** changed 가 없던 때의 요약 규칙(옛 메시지를 다시 불러올 때만). */
function legacySummaryText(r: TurnResult, hadAnswer: boolean, intent?: string | null): string | null {
  if (r.version === null && r.applied === 0 && r.status === "complete") {
    if (r.skipped > 0 && intent !== "layout") return NOT_APPLIED_MESSAGE;
    return hadAnswer || intent === "layout" ? null : "변경 사항이 없어요.";
  }
  const counts = r.applied > 0 ? `${r.applied}곳 바꿨어요` : "바꾼 곳이 없어요";
  const base = r.nodes === undefined || r.edges === undefined ? counts : `노드 ${r.nodes} · 연결 ${r.edges} · ${counts}`;
  return r.status === "aborted" ? `중단됨 · ${base}` : base;
}

/** 끝난 차례에 진행 카드를 남길지: 구성을 바꿨거나 중단됐을 때만(답만 한 차례·가정만 바꾼 차례·변경 없음은 남기지 않는다). */
export const keepsCard = (r: Pick<TurnResult, "applied" | "changed" | "status">) => changedOf(r) > 0 || r.status === "aborted";

type Row = { id: string; role: MessageRole; content: string; meta: MessageMeta; createdAt?: Date | string | number };

const timeOf = (v: Row["createdAt"]): number | undefined => {
  if (v === undefined) return undefined;
  const t = new Date(v).getTime();
  return Number.isNaN(t) ? undefined : t;
};

/** 저장된 메시지를 화면 줄로 바꾼다. 살아 있는 차례가 끝난 모양(카드·안내·답·칩)과 같게 만든다. */
export function messagesToLines(rows: Row[]): ChatLine[] {
  const out: ChatLine[] = [];
  let lastUser = "";
  for (const m of rows) {
    const at = timeOf(m.createdAt);
    if (m.role === "user") lastUser = m.content;
    if (m.role !== "assistant") {
      out.push({ id: m.id, kind: m.role, text: m.content, meta: m.meta, ...(at !== undefined ? { at } : {}) });
      continue;
    }
    const t = { turn: m.id, ...(at !== undefined ? { at } : {}) };
    const meta = m.meta;
    const r: TurnResult = {
      version: meta.version ?? null,
      status: meta.status === undefined || meta.status === "complete" ? "complete" : "aborted",
      applied: meta.applied ?? 0,
      ...(meta.changed !== undefined ? { changed: meta.changed } : {}),
      ...(meta.flows !== undefined ? { flows: meta.flows } : {}),
      skipped: meta.skipped ?? 0,
      ...(meta.nodes !== undefined ? { nodes: meta.nodes } : {}),
      ...(meta.edges !== undefined ? { edges: meta.edges } : {}),
    };
    if (keepsCard(r)) {
      const card: NonNullable<ChatLine["card"]> = { mode: "build", step: "checking", changes: 0, end: r.status === "complete" ? "done" : "aborted" };
      if (r.nodes !== undefined) card.nodes = r.nodes;
      if (r.edges !== undefined) card.edges = r.edges;
      out.push({ id: `${m.id}-card`, kind: "card", text: "", card, ...t });
    }
    // content = says 와 답을 줄바꿈으로 이은 것. 안내(say)는 따로, 남은 글은 답으로 둔다.
    const says = meta.says ?? [];
    const joined = says.join("\n");
    let answer = m.content;
    if (says.length > 0 && m.content.startsWith(joined)) {
      says.forEach((s, i) => out.push({ id: `${m.id}-say-${i}`, kind: "progress", text: s, ...t }));
      answer = m.content.slice(joined.length).replace(/^\n/, "");
    }
    if (answer.trim()) out.push({ id: m.id, kind: "assistant", text: answer, meta, ...t });
    // 질문 세션에서 구성도 대화로 넘긴 답: 바로 앞 사용자 글을 넘기는 버튼. 요약 칩은 두지 않는다.
    if (meta.handoff) {
      // 저장된 넘긴 글(meta.handoffText)을 먼저 쓰고, 옛 줄은 앞 사용자 글로. 둘 다 비면 버튼 없이 안내 글만 둔다.
      const text = meta.handoffText || lastUser;
      if (text.trim()) out.push({ id: `${m.id}-handoff`, kind: "handoff", text, ...t });
      continue;
    }
    // 안내(say)도 AI 가 낸 글이다: 글이 있으면 반영 못 함 안내를 두지 않는다(살아 있는 차례와 같게).
    // 옛 메시지(changed 없음)는 예전처럼 답 글만 본다.
    const wrote = answer.trim() !== "" || (meta.changed !== undefined && says.some((x) => x.trim() !== ""));
    const s = summaryText(r, wrote, meta.intent);
    if (s) out.push({ id: `${m.id}-summary`, kind: "summary", text: s, ...t });
    // 빠진 정보(meta.missing)는 대화에 줄을 두지 않는다: 캔버스 카드가 지금 상태로 보여 준다.
    const chip = warningsChip(meta.warnings ?? [], meta.warningCounts);
    if (chip) out.push({ id: `${m.id}-warn`, ...chip, ...t });
  }
  return out;
}
