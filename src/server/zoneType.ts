import { emptyState, type DiagramState } from "@/domain/types";
import { BUSY_MESSAGE } from "@/server/chat/busy";
import { withDiagramLock } from "@/server/chat/lock";
import { getNetworkKnowledge } from "@/server/network";
import { getOwnedDiagram, ValidationError } from "@/server/projects";
import { createVersion, getLatestState } from "@/server/versions";

const NO_TARGET = "대상을 찾을 수 없어요";
const BAD_KEY = "고를 수 없는 값이에요";

/**
 * 망 영역의 종류를 사람이 확인하거나 바꾼다. 저장 값은 { key, source: "user", confirmed: true } 라 AI 가 덮어쓰지 못한다.
 * key 가 null 이면 종류 칸을 지운다. 바뀐 게 없으면 버전을 만들지 않고 `number: null`. 대화 차례가 돌고 있으면 BUSY_MESSAGE.
 */
export async function setZoneTypeFor(
  userId: string,
  diagramId: string,
  groupId: string,
  key: string | null,
): Promise<{ number: number | null }> {
  await getOwnedDiagram(userId, diagramId);
  if (typeof groupId !== "string") throw new ValidationError(NO_TARGET);
  if (key !== null) {
    if (typeof key !== "string") throw new ValidationError(BAD_KEY);
    const knowledge = await getNetworkKnowledge(userId);
    if (!Object.hasOwn(knowledge.types, key)) throw new ValidationError(BAD_KEY);
  }

  const locked = await withDiagramLock(diagramId, async () => {
    const latest = await getLatestState(diagramId);
    const before = latest?.state ?? emptyState();
    const group = Object.hasOwn(before.groups, groupId) ? before.groups[groupId] : undefined;
    if (!group || group.groupKind !== "network_zone") throw new ValidationError(NO_TARGET);

    const cur = group.netType;
    if (key === null) {
      if (!cur) return { number: null };
    } else if (cur && cur.key === key && cur.source === "user" && cur.confirmed) {
      return { number: null };
    }

    const state: DiagramState = structuredClone(before);
    if (key === null) delete state.groups[groupId].netType;
    else state.groups[groupId].netType = { key, source: "user", confirmed: true };

    const { number } = await createVersion(diagramId, state, { source: "form" });
    return { number };
  });
  if (!locked.ok) throw new ValidationError(BUSY_MESSAGE);
  return locked.value;
}
