// 영역 하나의 안과 경계: 바로 안의 항목, 경계를 넘는 연결. 설명 탭과 영역 설명 서명이 쓴다.
// 순수 모듈이다. DB·화면·AI 를 모른다.
import type { DiagramState } from "./types";

export interface GroupMember {
  id: string;
  kind: "node" | "group";
  label: string;
}

/** 경계를 넘는 연결 하나. insideId 는 영역 안(영역 자신 포함) 끝, outsideId 는 밖 끝. */
export interface CrossingEdge {
  edgeId: string;
  dir: "in" | "out";
  insideId: string;
  outsideId: string;
}

const parentOf = (state: DiagramState, id: string): string | null => state.nodes[id]?.parent ?? state.groups[id]?.parent ?? null;

/** id 가 groupId 자신이거나 그 아래(몇 단계든) 있는가. 부모가 돌고 돌아도 멈춘다. */
export function isInside(state: DiagramState, id: string, groupId: string): boolean {
  const seen = new Set<string>();
  for (let p: string | null = id; p !== null && !seen.has(p); p = parentOf(state, p)) {
    if (p === groupId) return true;
    seen.add(p);
  }
  return false;
}

const byLabel = (a: GroupMember, b: GroupMember) => a.label.localeCompare(b.label, "ko", { numeric: true }) || (a.id < b.id ? -1 : 1);

/** 바로 안의 하위 영역(이름순) 다음 바로 안의 노드(이름순). */
export function groupMembers(state: DiagramState, groupId: string): GroupMember[] {
  const groups = Object.values(state.groups)
    .filter((g) => g.parent === groupId && g.id !== groupId)
    .map((g): GroupMember => ({ id: g.id, kind: "group", label: g.label }))
    .sort(byLabel);
  const nodes = Object.values(state.nodes)
    .filter((n) => n.parent === groupId)
    .map((n): GroupMember => ({ id: n.id, kind: "node", label: n.label }))
    .sort(byLabel);
  return [...groups, ...nodes];
}

/** 한 끝만 영역 안인 연결(구성도의 연결 순서대로). 두 끝이 다 안이거나 다 밖이면 뺀다. */
export function crossingEdges(state: DiagramState, groupId: string): CrossingEdge[] {
  const out: CrossingEdge[] = [];
  for (const e of Object.values(state.edges)) {
    const fromIn = isInside(state, e.from, groupId);
    const toIn = isInside(state, e.to, groupId);
    if (fromIn === toIn) continue;
    out.push(fromIn ? { edgeId: e.id, dir: "out", insideId: e.from, outsideId: e.to } : { edgeId: e.id, dir: "in", insideId: e.to, outsideId: e.from });
  }
  return out;
}
