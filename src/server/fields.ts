import { isDeepStrictEqual } from "node:util";

import { requiredKeysFor } from "@/domain/missing";
import { emptyState, type DiagramState } from "@/domain/types";
import { BUSY_MESSAGE } from "@/server/chat/busy";
import { withDiagramLock } from "@/server/chat/lock";
import { getOwnedDiagram, ValidationError } from "@/server/projects";
import { createVersion, getLatestState } from "@/server/versions";

const VALUE_MAX = 80;
const BAD_KEY = "입력할 수 없는 항목이에요";
const NO_TARGET = "대상을 찾을 수 없어요";

export interface SaveFieldsInput {
  targetKind: "node" | "edge";
  targetId: string;
  values: Record<string, string>;
  unknown: string[];
}

/**
 * 체크리스트 폼 한 번을 `form` 버전 하나로 저장한다. 바뀐 게 없으면 버전을 만들지 않고 `number: null`.
 * 대화 차례가 돌고 있으면(잠금) 저장하지 않고 BUSY_MESSAGE 를 돌려준다.
 */
export async function saveFieldsFor(
  userId: string,
  diagramId: string,
  input: SaveFieldsInput,
): Promise<{ number: number | null }> {
  await getOwnedDiagram(userId, diagramId);
  const { targetKind, targetId } = input;
  if ((targetKind !== "node" && targetKind !== "edge") || typeof targetId !== "string") {
    throw new ValidationError(NO_TARGET);
  }
  const rawValues = input.values && typeof input.values === "object" ? input.values : {};
  const rawUnknown = Array.isArray(input.unknown) ? input.unknown : [];

  const locked = await withDiagramLock(diagramId, async () => {
    const latest = await getLatestState(diagramId);
    const before = latest?.state ?? emptyState();
    const state: DiagramState = structuredClone(before);
    const allowed = requiredKeysFor(state, targetKind, targetId);
    if (!allowed) throw new ValidationError(NO_TARGET);

    const filled: Record<string, string> = {};
    for (const [key, v] of Object.entries(rawValues)) {
      if (!allowed.includes(key) || typeof v !== "string") throw new ValidationError(BAD_KEY);
      const t = v.trim();
      if (t.length > VALUE_MAX) throw new ValidationError("값은 80자 이하로 입력해 주세요");
      if (t) filled[key] = t;
    }
    for (const key of rawUnknown) {
      if (typeof key !== "string" || !allowed.includes(key)) throw new ValidationError(BAD_KEY);
    }

    const unknown = [...new Set(rawUnknown)].filter((k) => !(k in filled));
    const target = targetKind === "node" ? state.nodes[targetId] : state.edges[targetId];
    if (targetKind === "node") {
      for (const [k, v] of Object.entries(filled)) state.nodes[targetId].attrs[k] = v;
    } else if (filled.label !== undefined) {
      state.edges[targetId].label = filled.label;
    }
    if (unknown.length) target.unknown = unknown;
    else delete target.unknown;

    if (isDeepStrictEqual(state, before)) return { number: null };
    const { number } = await createVersion(diagramId, state, { source: "form" });
    return { number };
  });
  if (!locked.ok) throw new ValidationError(BUSY_MESSAGE);
  return locked.value;
}
