import { freeEdgeId } from "./apply";
import type { Command, FlowCommand } from "./commands";
import type { DiagramState } from "./types";

type AddEdge = Extract<Command, { op: "add_edge" }>;
type UpdateEdge = Extract<Command, { op: "update_edge" }>;

const has = (o: object, k: string) => Object.hasOwn(o, k);
const idTaken = (s: DiagramState, id: string) => has(s.groups, id) || has(s.nodes, id) || has(s.edges, id);

export interface EdgeCoalescer {
  /** 이 명령 대신 지금 적용할 명령들(순서대로). 있는 연결 지우기는 미뤄 두고 [] 를 돌려준다. */
  push(cmd: Command, state: DiagramState): Command[];
  /** 아직 미뤄 둔 지우기(원래 순서). 그사이 사라진 연결은 조용히 버린다. 부르면 비워진다. */
  flush(state: DiagramState): Command[];
  /** 흐름 명령 단계의 연결 id 를 짝지은 원래 id 로 바꾼다(바꿀 것이 없으면 같은 명령). */
  mapFlow<T extends FlowCommand>(cmd: T): T;
  /** 미뤄 둔 지우기 수. */
  pending(): number;
}

/**
 * 한 차례 동안 AI 가 있는 연결을 지웠다가 같은 두 노드 사이(같은 방향)에 다시 만들면 둘을 지우고,
 * 다른 값만 원래 연결에 update_edge 로 고친다. 연결 id 가 그대로라 흐름 단계(연결 id 를 가리킨다)가 깨지지 않는다.
 * 새로 만들 때 쓴 id 는 원래 id 로 바꿔 두고, 뒤따르는 연결 고치기·지우기·흐름 단계에 적용한다.
 *
 * 있는 연결 지우기는 바로 내지 않고 미뤄 둔다. 짝이 나오지 않으면 flush 때(이어 쓰기 직전·차례 끝) 낸다.
 * 미뤄 둔 연결을 다른 명령이 가리키면(같은 id 로 다시 만들기·고치기·또 지우기) 그 지우기를 먼저 내서
 * 원래 순서와 같은 결과(뒤 명령 실패 포함)가 나오게 한다.
 */
export function createEdgeCoalescer(): EdgeCoalescer {
  const deferred: { id: string; from: string; to: string }[] = [];
  /** 다시 만들 때 쓴 id → 남긴 원래 id */
  const rename = new Map<string, string>();
  const mapId = (id: string) => rename.get(id) ?? id;

  const removeCmd = (id: string): Command => ({ op: "remove_edge", id });
  /** 그사이 사라진(노드 지우기 등) 연결은 미뤄 둔 목록에서 뺀다. */
  const prune = (state: DiagramState) => {
    for (let i = deferred.length - 1; i >= 0; i--) if (!has(state.edges, deferred[i]!.id)) deferred.splice(i, 1);
  };
  /** 이 id 를 미뤄 두었으면 그 지우기를 꺼내 돌려준다. */
  const release = (id: string): Command[] => {
    const i = deferred.findIndex((d) => d.id === id);
    if (i < 0) return [];
    deferred.splice(i, 1);
    return [removeCmd(id)];
  };

  const coalesce = (cmd: AddEdge, state: DiagramState): Command[] | null => {
    const i = deferred.findIndex((d) => d.from === cmd.from && d.to === cmd.to);
    if (i < 0) return null;
    const kept = deferred[i]!;
    // 다른 것이 이미 쓰는 id 로 만들면 원래도 실패했다. 짝짓지 않고 그대로 보낸다.
    if (cmd.id !== undefined && cmd.id !== kept.id && idTaken(state, cmd.id)) return null;
    deferred.splice(i, 1);
    // id 없이 만들었으면, 지운 뒤에 받았을 자동 id 를 원래 id 로 바꾼다.
    const edges = { ...state.edges };
    delete edges[kept.id];
    const newId = cmd.id ?? freeEdgeId({ ...state, edges }, cmd.from, cmd.to);
    if (newId !== kept.id) rename.set(newId, kept.id);
    const old = state.edges[kept.id]!;
    const diff: Partial<UpdateEdge> = {};
    if (cmd.label !== undefined && cmd.label !== old.label) diff.label = cmd.label;
    if (cmd.edge_kind !== old.edgeKind) diff.edge_kind = cmd.edge_kind;
    if (cmd.payload !== undefined && cmd.payload !== old.payload) diff.payload = cmd.payload;
    if (cmd.direction !== undefined && cmd.direction !== old.direction) diff.direction = cmd.direction;
    if (cmd.medium !== undefined && cmd.medium !== old.medium) diff.medium = cmd.medium;
    return Object.keys(diff).length === 0 ? [] : [{ op: "update_edge", id: kept.id, ...diff }];
  };

  return {
    push(cmd, state) {
      prune(state);
      switch (cmd.op) {
        case "remove_edge": {
          const id = mapId(cmd.id);
          const out: Command = id === cmd.id ? cmd : { ...cmd, id };
          if (!has(state.edges, id)) return [out];
          // 이미 미뤄 둔 것을 또 지우면 원래처럼 앞 것은 지우고 뒤 것은 실패하게 둘 다 낸다.
          if (deferred.some((d) => d.id === id)) return [...release(id), out];
          const edge = state.edges[id]!;
          deferred.push({ id, from: edge.from, to: edge.to });
          return [];
        }
        case "update_edge": {
          const id = mapId(cmd.id);
          return [...release(id), id === cmd.id ? cmd : { ...cmd, id }];
        }
        case "add_edge": {
          const merged = coalesce(cmd, state);
          if (merged) return merged;
          // 진짜 새 연결이 그 id 를 가지게 되면 바꿔 두었던 것은 잊는다.
          rename.delete(cmd.id ?? freeEdgeId(state, cmd.from, cmd.to));
          return cmd.id !== undefined ? [...release(cmd.id), cmd] : [cmd];
        }
        case "add_node":
        case "add_group":
          // 노드·영역·연결은 id 를 함께 쓴다.
          rename.delete(cmd.id);
          return [...release(cmd.id), cmd];
        default:
          return [cmd];
      }
    },
    flush(state) {
      prune(state);
      return deferred.splice(0).map((d) => removeCmd(d.id));
    },
    mapFlow(cmd) {
      if (cmd.op === "remove_flow" || !cmd.steps || !cmd.steps.some((s) => rename.has(s.edge))) return cmd;
      return { ...cmd, steps: cmd.steps.map((s) => (rename.has(s.edge) ? { ...s, edge: mapId(s.edge) } : s)) };
    },
    pending: () => deferred.length,
  };
}
