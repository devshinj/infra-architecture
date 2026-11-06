import { noLinkKey } from "@/domain/assumptions";
import { networkZoneOf } from "@/domain/boundary";
import { mergeFlowSteps, revertLinkGuess } from "@/domain/linkGuess";
import { linkWarningId } from "@/domain/networkRules";
import { emptyState, type DiagramState } from "@/domain/types";
import { BUSY_MESSAGE } from "@/server/chat/busy";
import { withDiagramLock } from "@/server/chat/lock";
import { rewriteFlows } from "@/server/flows";
import { getOwnedDiagram, ValidationError } from "@/server/projects";
import { createVersion, getLatestState } from "@/server/versions";

const NO_LINK_VALUE = "망연계 없이 통신(사용자 확인)";

/** "맞아요": AI 추정 표시(guess)만 지운다. 노드·연결은 그대로. 추정이 아니면 `number: null`. */
export async function confirmLinkGuessFor(
  userId: string,
  diagramId: string,
  nodeId: string,
): Promise<{ number: number | null }> {
  await getOwnedDiagram(userId, diagramId);
  const locked = await withDiagramLock(diagramId, async () => {
    const latest = await getLatestState(diagramId);
    const before = latest?.state ?? emptyState();
    if (typeof nodeId !== "string" || !Object.hasOwn(before.nodes, nodeId) || !before.nodes[nodeId].guess) {
      return { number: null };
    }
    const state: DiagramState = structuredClone(before);
    delete state.nodes[nodeId].guess;
    const { number } = await createVersion(diagramId, state, { source: "form" });
    return { number };
  });
  if (!locked.ok) throw new ValidationError(BUSY_MESSAGE);
  return locked.value;
}

/**
 * "아니에요": 망연계 노드만 지우고 원래 연결을 되살린다. 그 망 짝은 "망연계 없이 통신"으로 확정해 기억하고,
 * 같은 짝의 망연계 예상 경고는 무시한다. 흐름 단계는 다시 합친다(실패해도 되돌리기는 끝난 것으로 본다).
 */
export async function rejectLinkGuessFor(
  userId: string,
  diagramId: string,
  nodeId: string,
): Promise<{ number: number | null; partial: boolean }> {
  await getOwnedDiagram(userId, diagramId);
  const locked = await withDiagramLock(diagramId, async () => {
    const latest = await getLatestState(diagramId);
    const before = latest?.state ?? emptyState();
    if (typeof nodeId !== "string") return { number: null, partial: false };
    const r = revertLinkGuess(before, nodeId);
    if (!r.ok) return { number: null, partial: false };

    // 대신한 연결의 양 끝이 속한 망 짝(되돌리기 전 상태 기준).
    const guess = before.nodes[nodeId].guess!;
    const ends = guess.replaced.length > 0 ? guess.replaced : guess.bridge ? [guess.bridge] : [];
    const pairs = new Map<string, [string, string]>();
    for (const e of ends) {
      const a = networkZoneOf(before, e.from);
      const b = networkZoneOf(before, e.to);
      if (a && b && a !== b) pairs.set(noLinkKey(a, b), [a, b]);
    }

    const state: DiagramState = structuredClone(r.state);
    const ignored = new Set(state.ignoredWarnings ?? []);
    for (const [key, [a, b]] of pairs) {
      if (!state.assumptions[key]?.confirmed) {
        state.assumptions[key] = { key, value: NO_LINK_VALUE, confirmed: true };
      }
      ignored.add(linkWarningId("link_expected", a, b));
    }
    if (ignored.size > 0) state.ignoredWarnings = [...ignored];

    const { number } = await createVersion(diagramId, state, { source: "form" });
    if (r.merges.length > 0) {
      try {
        await rewriteFlows(diagramId, (f) => mergeFlowSteps(f, r.merges));
      } catch (err) {
        console.error("reject link guess merge flow steps failed", err);
      }
    }
    return { number, partial: r.partial };
  });
  if (!locked.ok) throw new ValidationError(BUSY_MESSAGE);
  return locked.value;
}
