import { confirmAssumption } from "@/domain/assumptions";
import { emptyState } from "@/domain/types";
import { BUSY_MESSAGE } from "@/server/chat/busy";
import { USER_TURN_LOCK_WAIT_MS, withDiagramLock } from "@/server/chat/lock";
import { getOwnedDiagram, ValidationError } from "@/server/projects";
import { assertNotLearning } from "@/server/guide/runs";
import { createVersion, getLatestState } from "@/server/versions";

const KEY = /^[a-z_]{1,32}$/;

/**
 * Confirms one assumption on the latest state and saves it as a `form` version.
 * 대화 차례가 돌고 있으면(잠금) 확정하지 않고 BUSY_MESSAGE: 차례는 시작 때 읽은 상태로 저장하므로 그 사이의 확정이 덮인다.
 */
export async function confirmAssumptionFor(
  userId: string,
  diagramId: string,
  key: string,
  value: string,
): Promise<{ number: number }> {
  await getOwnedDiagram(userId, diagramId);
  await assertNotLearning(diagramId);
  if (typeof key !== "string" || !KEY.test(key)) throw new ValidationError("가정 항목이 올바르지 않아요");
  if (typeof value !== "string" || value.length < 1 || value.length > 80) {
    throw new ValidationError("가정 값은 1~80자로 입력해 주세요");
  }
  const locked = await withDiagramLock(
    diagramId,
    async () => {
      const latest = await getLatestState(diagramId);
      const next = confirmAssumption(latest?.state ?? emptyState(), key, value);
      const { number } = await createVersion(diagramId, next, { source: "form" });
      return { number };
    },
    { waitMs: USER_TURN_LOCK_WAIT_MS },
  );
  if (!locked.ok) throw new ValidationError(BUSY_MESSAGE);
  return locked.value;
}
