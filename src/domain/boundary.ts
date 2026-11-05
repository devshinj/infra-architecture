import type { NodeKind } from "./catalog";
import type { DiagramState, Edge } from "./types";

/** 망 경계를 정당하게 넘겨 주는 노드 종류: 방화벽·망연계 솔루션·VPN. */
export const BOUNDARY_NODE_KINDS: ReadonlySet<NodeKind> = new Set<NodeKind>(["firewall", "network_link", "vpn"]);

/** 노드(또는 그룹)의 가장 가까운 network_zone 조상 id. 없으면 null. 순환 방어. */
export function networkZoneOf(state: DiagramState, nodeId: string): string | null {
  const start = state.nodes[nodeId]?.parent ?? state.groups[nodeId]?.parent ?? null;
  const seen = new Set<string>();
  let cur = start;
  while (cur && !seen.has(cur)) {
    seen.add(cur);
    const g = state.groups[cur];
    if (!g) return null;
    if (g.groupKind === "network_zone") return g.id;
    cur = g.parent;
  }
  return null;
}

/** 구성도에 망이 하나라도 있고, 두 끝의 망이 서로 다르면(한쪽이 망 밖이어도) true. */
export function crossesBoundary(state: DiagramState, edge: Edge): boolean {
  if (!Object.values(state.groups).some((g) => g.groupKind === "network_zone")) return false;
  if (!state.nodes[edge.from] || !state.nodes[edge.to]) return false;
  return networkZoneOf(state, edge.from) !== networkZoneOf(state, edge.to);
}

/** 경계를 넘고 두 끝 어느 쪽도 경계 노드가 아닌 연결. */
export function isDirectCrossing(state: DiagramState, edge: Edge): boolean {
  if (!crossesBoundary(state, edge)) return false;
  const from = state.nodes[edge.from];
  const to = state.nodes[edge.to];
  return !BOUNDARY_NODE_KINDS.has(from.kind) && !BOUNDARY_NODE_KINDS.has(to.kind);
}
