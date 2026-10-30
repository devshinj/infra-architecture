import { isAssumptionChangeMessage } from "@/domain/assumptions";
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
