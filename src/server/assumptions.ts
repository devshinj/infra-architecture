import { confirmAssumption } from "@/domain/assumptions";
import { emptyState } from "@/domain/types";
import { getOwnedDiagram, ValidationError } from "@/server/projects";
import { createVersion, getLatestState } from "@/server/versions";

const KEY = /^[a-z_]{1,32}$/;

/** Confirms one assumption on the latest state and saves it as a `form` version. */
export async function confirmAssumptionFor(
  userId: string,
  diagramId: string,
  key: string,
  value: string,
): Promise<{ number: number }> {
  await getOwnedDiagram(userId, diagramId);
  if (typeof key !== "string" || !KEY.test(key)) throw new ValidationError("가정 항목이 올바르지 않아요");
  if (typeof value !== "string" || value.length < 1 || value.length > 80) {
    throw new ValidationError("가정 값은 1~80자로 입력해 주세요");
  }
  const latest = await getLatestState(diagramId);
  const next = confirmAssumption(latest?.state ?? emptyState(), key, value);
  const { number } = await createVersion(diagramId, next, { source: "form" });
  return { number };
}
