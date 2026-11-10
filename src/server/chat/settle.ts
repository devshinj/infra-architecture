import { applyCommand, pruneEmptyGroups } from "@/domain/apply";
import type { Command } from "@/domain/commands";
import { recordReplaced, splitsFor, type StepSplit } from "@/domain/linkGuess";
import type { DiagramState } from "@/domain/types";

/** 정리로 사라진 그룹 id 를 깊은 것부터(자식이 부모보다 먼저) 돌려준다. */
function prunedOrder(before: DiagramState, after: DiagramState): string[] {
  const depth = (id: string) => {
    let d = 0;
    for (let p = before.groups[id]?.parent ?? null; p !== null; p = before.groups[p]?.parent ?? null) d++;
    return d;
  };
  return Object.keys(before.groups)
    .filter((id) => !Object.hasOwn(after.groups, id))
    .sort((a, b) => depth(b) - depth(a));
}

/**
 * 구성도를 바꾼 차례의 끝 정리. 대화와 MCP 가 똑같이 쓴다.
 * 이번 차례에 비게 된 영역을 안쪽부터 지우고, 추정으로 넣은 망연계마다 대신한 연결을 기록한다(되돌리기용).
 * emitted 는 적용한 순서 그대로다(remove_group… 그다음 set_link_guess…). 클라이언트도 같은 명령으로 맞춘다.
 * splits 는 망연계가 끼어든 연결로, 흐름 단계를 나누는 데 쓴다.
 */
export function settleTurn(
  turnStart: DiagramState,
  state: DiagramState,
): { state: DiagramState; emitted: Command[]; splits: StepSplit[] } {
  const emitted: Command[] = [];
  const pruned = pruneEmptyGroups(turnStart, state);
  for (const id of prunedOrder(state, pruned)) emitted.push({ op: "remove_group", id });
  let cur = pruned;
  const recorded = recordReplaced(turnStart, cur);
  for (const { nodeId, guess } of recorded) {
    const cmd: Command = { op: "set_link_guess", id: nodeId, guess };
    const r = applyCommand(cur, cmd);
    if (!r.ok) continue;
    cur = r.state;
    emitted.push(cmd);
  }
  return { state: cur, emitted, splits: splitsFor(turnStart, cur, recorded) };
}
