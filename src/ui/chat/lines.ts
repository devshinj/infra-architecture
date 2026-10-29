import type { MessageRole } from "@/db/schema";
import { missingReminder } from "@/domain/missing";
import type { MessageMeta } from "@/server/chat/events";

import type { ChatLine } from "./useChatTurn";

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
  }
  return out;
}
