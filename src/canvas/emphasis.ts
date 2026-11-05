import type { DisplayEdge } from "./display";

export interface Emphasis {
  nodes: Set<string>;
  edges: Set<string>;
}

/**
 * 선택·호버가 공통으로 쓰는 강조 집합.
 * id 가 연결(묶인 원래 연결 포함)이면 그 연결과 두 끝 노드, 노드(또는 그려진 영역)면 그 노드와 닿은 연결, 이웃 노드.
 * id 가 없거나(nodeIds 를 주면) 알려진 연결·노드가 아니면 null(강조 없음).
 */
export function emphasisOf(edges: DisplayEdge[], id: string | null, nodeIds?: ReadonlySet<string>): Emphasis | null {
  if (id === null) return null;
  const hit = edges.find((e) => e.id === id || e.sourceEdgeIds.includes(id));
  if (hit) return { nodes: new Set([hit.from, hit.to]), edges: new Set([hit.id]) };
  // 사라진 대상(다시 배치되며 없어진 노드 등)이면 강조하지 않는다.
  if (nodeIds && !nodeIds.has(id)) return null;
  const nodes = new Set([id]);
  const ids = new Set<string>();
  for (const e of edges) {
    if (e.from !== id && e.to !== id) continue;
    ids.add(e.id);
    nodes.add(e.from);
    nodes.add(e.to);
  }
  return { nodes, edges: ids };
}

/**
 * 흐름을 볼 때의 강조 집합: 단계가 지나는 연결(원래 연결 id 는 묶인 표시 연결로 맞춘다)과 그 두 끝 노드.
 * 표시 연결에 없는 단계(끊긴 단계·숨긴 연결)는 건너뛴다. 하나도 맞지 않으면 빈 강조(모두 흐림)다.
 */
export function flowEmphasis(edges: DisplayEdge[], stepEdgeIds: string[]): Emphasis {
  const nodes = new Set<string>();
  const ids = new Set<string>();
  for (const id of stepEdgeIds) {
    const hit = edges.find((e) => e.id === id || e.sourceEdgeIds.includes(id));
    if (!hit) continue;
    ids.add(hit.id);
    nodes.add(hit.from);
    nodes.add(hit.to);
  }
  return { nodes, edges: ids };
}

/**
 * 고르면 흐리지 않고 남겨 둘 영역 id 집합.
 * 강조 노드(접힌 영역이 연결 끝이면 그 영역 id 도 노드 쪽에 들어 있다)와 고른 id 에 대해, 자기 자신과 모든 조상을 넣는다.
 * 노드 id 가 섞여도 영역 판정에는 쓰이지 않으므로 해가 없다.
 */
export function litZones(parentOf: (id: string) => string | null, emph: Emphasis, selectedId: string | null): Set<string> {
  const lit = new Set<string>();
  const add = (start: string) => {
    let p: string | null = start;
    while (p !== null && !lit.has(p)) {
      lit.add(p);
      p = parentOf(p);
    }
  };
  for (const id of emph.nodes) add(id);
  if (selectedId !== null) add(selectedId);
  return lit;
}
