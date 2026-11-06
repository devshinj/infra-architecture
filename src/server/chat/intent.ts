import { isAssumptionChangeMessage } from "@/domain/assumptions";
import type { MissingItem } from "@/domain/missing";
import type { DiagramState } from "@/domain/types";
import { INTENT_MIN_CONFIDENCE, type Intent } from "@/server/llm/clef";

/**
 * The turn's intent. A client-made assumption-change message always asks for a structure change,
 * so it never goes to Clef (a wrong `layout` there would drop the request and clear the pins).
 */
export async function resolveIntent(
  text: string,
  classify: () => Promise<{ intent: Intent; confidence: number } | null>,
): Promise<Intent | null> {
  if (isAssumptionChangeMessage(text)) return "structure_change";
  const classified = await classify();
  return classified && classified.confidence >= INTENT_MIN_CONFIDENCE ? classified.intent : null;
}

/**
 * Clef 에 넘길 빠진 정보 문맥. 사용자 글·직전 AI 답에 이름이 나왔거나 참조한 대상(노드·영역, 연결은 한쪽 끝)만 골라
 * "WAS: CPU·RAM" 처럼 대상별로 묶는다. 관계없는 항목을 길게 넘기면 질문·값만 알려 주는 답의 확신도가 떨어진다.
 */
export function clefOpenItems(
  state: DiagramState,
  items: MissingItem[],
  ctx: { text: string; lastAssistant?: string; mentionIds?: string[] },
): string[] {
  const nameOf = (id: string) => state.nodes[id]?.label ?? state.groups[id]?.label ?? id;
  const mentioned = new Set(ctx.mentionIds ?? []);
  const seen = (id: string) => {
    if (mentioned.has(id)) return true;
    const name = nameOf(id);
    return ctx.text.includes(name) || (ctx.lastAssistant?.includes(name) ?? false);
  };
  const groups = new Map<string, string[]>();
  for (const m of items) {
    let target: string;
    if (m.targetKind === "node") {
      if (!seen(m.targetId)) continue;
      target = nameOf(m.targetId);
    } else {
      const e = state.edges[m.targetId];
      if (!e || !(seen(e.from) || seen(e.to))) continue;
      target = `${nameOf(e.from)} → ${nameOf(e.to)}`;
    }
    groups.set(target, [...(groups.get(target) ?? []), m.label]);
  }
  return [...groups].map(([target, labels]) => `${target}: ${labels.join("·")}`);
}
