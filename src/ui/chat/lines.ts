import type { MessageRole } from "@/db/schema";
import { missingReminder } from "@/domain/missing";
import type { Warning } from "@/domain/types";
import type { MessageMeta } from "@/server/chat/events";

import type { ChatLine } from "./useChatTurn";

/** 경고 한 건의 대화 줄(id 는 호출하는 쪽이 정하거나 push 가 붙인다). */
export function warningLine(w: Warning): Omit<ChatLine, "id"> {
  return { kind: "warning", text: `${w.level === "check" ? "확인해 보세요" : "주의"}: ${w.text}`, nodeId: w.nodeId, level: w.level };
}

export interface TurnResult {
  version: number | null;
  status: "complete" | "aborted";
  applied: number;
  skipped: number;
  nodes?: number;
  edges?: number;
}

/** 차례 끝 요약 칩 글. 바뀐 것도 답도 없으면 "변경 사항이 없어요.", 답만 한 차례면 없음. */
export function summaryText(r: TurnResult, hadAnswer: boolean): string | null {
  if (r.version === null && r.applied === 0 && r.status === "complete") return hadAnswer ? null : "변경 사항이 없어요.";
  const counts = `적용 ${r.applied} · 건너뜀 ${r.skipped}`;
  const base = r.nodes === undefined || r.edges === undefined ? counts : `노드 ${r.nodes} · 연결 ${r.edges} · ${counts}`;
  return r.status === "aborted" ? `중단됨 · ${base}` : base;
}

/** 끝난 차례에 진행 카드를 남길지: 무언가 그렸거나 중단됐을 때만(답만 한 차례·변경 없음은 남기지 않는다). */
export const keepsCard = (r: Pick<TurnResult, "applied" | "status">) => r.applied > 0 || r.status === "aborted";

type Row = { id: string; role: MessageRole; content: string; meta: MessageMeta; createdAt?: Date | string | number };

const timeOf = (v: Row["createdAt"]): number | undefined => {
  if (v === undefined) return undefined;
  const t = new Date(v).getTime();
  return Number.isNaN(t) ? undefined : t;
};

/** 저장된 메시지를 화면 줄로 바꾼다. 살아 있는 차례가 끝난 모양(카드·안내·답·칩)과 같게 만든다. */
export function messagesToLines(rows: Row[]): ChatLine[] {
  const out: ChatLine[] = [];
  for (const m of rows) {
    const at = timeOf(m.createdAt);
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
    const s = summaryText(r, answer.trim() !== "");
    if (s) out.push({ id: `${m.id}-summary`, kind: "summary", text: s, ...t });
    const missing = meta.missing ?? 0;
    if (missing > 0) out.push({ id: `${m.id}-missing`, kind: "missing", text: missingReminder(missing), ...t });
    for (const w of meta.warnings ?? []) out.push({ id: `${m.id}-warn-${w.id}`, ...warningLine(w), ...t });
  }
  return out;
}
