import { noLinkKey, parseNoLinkKey } from "@/domain/assumptions";
import { networkZoneOf } from "@/domain/boundary";
import { mergeFlowSteps, revertLinkGuess } from "@/domain/linkGuess";
import { crossingPaths } from "@/domain/networkRules";
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
 * "아니에요": 망연계 노드만 지우고 원래 연결을 되살린다. 그 망 짝은 "망연계 없이 통신"으로 확정해 기억한다
 * (그 가정이 같은 짝의 망연계 예상 안내를 끈다). 흐름 단계는 다시 합친다(실패해도 되돌리기는 끝난 것으로 본다).
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

    // 이 망연계를 지나던 통신 길의 두 끝(경계 노드가 아닌 노드)이 속한 망 짝(되돌리기 전 상태 기준).
    // 방화벽이 망 밖에 그려져 대신한 연결의 끝이 망 밖이어도 짝을 찾는다.
    const pairs = new Set<string>();
    const addPair = (a: string | null, b: string | null) => {
      if (a && b && a !== b) pairs.add(noLinkKey(a, b));
    };
    for (const p of crossingPaths(before)) {
      if (p.via.includes(nodeId)) addPair(networkZoneOf(before, p.from), networkZoneOf(before, p.to));
    }
    // 끝이 영역(그룹)인 연결은 통신 길에 들지 않으므로, 대신한 연결의 양 끝으로도 찾는다.
    const guess = before.nodes[nodeId].guess!;
    for (const e of guess.replaced.length > 0 ? guess.replaced : guess.bridge ? [guess.bridge] : []) {
      addPair(networkZoneOf(before, e.from), networkZoneOf(before, e.to));
    }

    // 확정한 no_link 가정이 그 짝의 망연계 예상 안내를 끈다(경고 무시 목록에는 넣지 않는다: 가정을 지우면 안내가 다시 보이게).
    const state: DiagramState = structuredClone(r.state);
    for (const key of pairs) {
      if (!state.assumptions[key]?.confirmed) {
        state.assumptions[key] = { key, value: NO_LINK_VALUE, confirmed: true };
      }
    }

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

/** 가정 칩의 지우기: 망연계 거절 기억(no_link 가정) 하나를 지운다. 그 짝의 안내가 다시 보인다. 없으면 `number: null`. */
export async function removeNoLinkFor(userId: string, diagramId: string, key: string): Promise<{ number: number | null }> {
  await getOwnedDiagram(userId, diagramId);
  if (typeof key !== "string" || !parseNoLinkKey(key)) throw new ValidationError("가정 항목이 올바르지 않아요");
  const locked = await withDiagramLock(diagramId, async () => {
    const latest = await getLatestState(diagramId);
    const before = latest?.state ?? emptyState();
    if (!Object.hasOwn(before.assumptions, key)) return { number: null };
    const state: DiagramState = structuredClone(before);
    delete state.assumptions[key];
    const { number } = await createVersion(diagramId, state, { source: "form" });
    return { number };
  });
  if (!locked.ok) throw new ValidationError(BUSY_MESSAGE);
  return locked.value;
}
