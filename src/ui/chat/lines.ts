import type { MessageRole } from "@/db/schema";
import { missingReminder } from "@/domain/missing";
import type { Warning } from "@/domain/types";
import type { MessageMeta } from "@/server/chat/events";

import type { ChatLine } from "./useChatTurn";

/** 경고 한 건의 대화 줄(id 는 호출하는 쪽이 정하거나 push 가 붙인다). */
export function warningLine(w: Warning): Omit<ChatLine, "id"> {
  return { kind: "warning", text: `${w.level === "check" ? "확인해 보세요" : "주의"}: ${w.text}`, nodeId: w.nodeId, level: w.level };
}

type Row = { id: string; role: MessageRole; content: string; meta: MessageMeta };

/** 저장된 메시지를 화면 줄로 바꾼다. 안내 줄은 DB 메시지가 아니라 여기서만 만든다. */
export function messagesToLines(rows: Row[]): ChatLine[] {
  const out: ChatLine[] = [];
  for (const m of rows) {
    out.push({ id: m.id, kind: m.role, text: m.content, meta: m.meta });
    const missing = m.meta.missing ?? 0;
    if (m.role === "assistant" && missing > 0) {
      out.push({ id: `${m.id}-missing`, kind: "system", text: missingReminder(missing) });
    }
    if (m.role === "assistant") {
      for (const w of m.meta.warnings ?? []) out.push({ id: `${m.id}-warn-${w.id}`, ...warningLine(w) });
    }
  }
  return out;
}
