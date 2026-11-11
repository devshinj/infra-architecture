import { commandsBetween } from "@/domain/diff";
import { emptyState, type DiagramState } from "@/domain/types";

import type { MessageMeta } from "./events";
import { REPLAY_COMMANDS_MAX } from "./prompt";

const NOT_COMMAND_PATH = new Set(["question", "other", "layout", "history"]);

/**
 * 명령을 저장하기 전의 AI 답에 채울 meta.commands. 채우지 않을 메시지면 null.
 * - 이미 commands 가 있거나 답변·재정렬·이력 차례: null(그대로).
 * - 버전을 만든 차례: 바로 앞 버전 → 그 버전의 구성 명령(앞 REPLAY_COMMANDS_MAX 개). 버전을 못 찾으면 null.
 * - 버전도 반영도 없는 명령 차례(say 만 쓰고 멈춤·전부 건너뜀): [] (기록 재생에서 실패한 차례로 빠진다).
 * - 버전 없이 반영만 있는 차례(흐름만 바꿈 등): 되살릴 수 없어 null.
 */
export function planCommandBackfill(meta: MessageMeta | null | undefined, versions: ReadonlyMap<number, DiagramState>): unknown[] | null {
  if (!meta || Array.isArray(meta.commands)) return null;
  if (meta.intent && NOT_COMMAND_PATH.has(meta.intent)) return null;
  if (typeof meta.version === "number") {
    const after = versions.get(meta.version);
    if (!after) return null;
    const prev = Math.max(-Infinity, ...[...versions.keys()].filter((n) => n < meta.version!));
    const before = Number.isFinite(prev) ? versions.get(prev)! : emptyState();
    return commandsBetween(before, after).slice(0, REPLAY_COMMANDS_MAX);
  }
  if ((meta.applied ?? 0) === 0) return [];
  return null;
}
