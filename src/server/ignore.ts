import { emptyState, type DiagramState } from "@/domain/types";
import { BUSY_MESSAGE } from "@/server/chat/busy";
import { withDiagramLock } from "@/server/chat/lock";
import { getOwnedDiagram, ValidationError } from "@/server/projects";
import { createVersion, getLatestState } from "@/server/versions";

const WARNING_ID = /^[a-z_]{1,32}:[a-z0-9][a-z0-9-]{0,63}$/;

/**
 * 경고 하나를 "의도된 구성"으로 무시하거나 다시 경고하도록 되돌리고 `form` 버전 하나로 저장한다.
 * 바뀐 게 없으면 버전을 만들지 않고 `number: null`. 대화 차례가 돌고 있으면 BUSY_MESSAGE.
 */
export async function setWarningIgnoredFor(
  userId: string,
  diagramId: string,
  warningId: string,
  ignored: boolean,
): Promise<{ number: number | null }> {
  await getOwnedDiagram(userId, diagramId);
  if (typeof warningId !== "string" || !WARNING_ID.test(warningId)) {
    throw new ValidationError("경고를 찾을 수 없어요");
  }

  if (typeof ignored !== "boolean") throw new ValidationError("의도된 구성 값이 올바르지 않아요");

  const locked = await withDiagramLock(diagramId, async () => {
    const latest = await getLatestState(diagramId);
    const before = latest?.state ?? emptyState();
    const current = before.ignoredWarnings ?? [];
    const has = current.includes(warningId);
    if (ignored === has) return { number: null };

    const state: DiagramState = structuredClone(before);
    const next = ignored ? [...current, warningId] : current.filter((id) => id !== warningId);
    if (next.length) state.ignoredWarnings = next;
    else delete state.ignoredWarnings;

    const { number } = await createVersion(diagramId, state, { source: "form" });
    return { number };
  });
  if (!locked.ok) throw new ValidationError(BUSY_MESSAGE);
  return locked.value;
}
