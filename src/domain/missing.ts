import { NODE_KINDS } from "./catalog";
import type { DNode, DiagramState, Edge } from "./types";

// 빠진 정보 칸의 한국어 이름. 여기 없는 키는 키 그대로 보여 준다.
export const FIELD_LABELS: Record<string, string> = {
  hostname: "호스트명",
  cpu: "CPU",
  ram: "RAM",
  disk: "디스크",
  os: "OS",
  ip: "IP",
  sw: "SW",
  version: "버전",
  port: "포트",
  rules: "방화벽 규칙",
  vip: "VIP",
  replication: "복제 방식",
  nodes: "노드 수",
  replicas: "파드 수",
  brokers: "브로커 수",
  runtime: "런타임",
  service: "서비스",
  integration: "연동 방식",
  label: "프로토콜/포트",
};

export interface MissingItem {
  targetKind: "node" | "edge";
  targetId: string;
  key: string;
  label: string;
  unknown: boolean;
}

const labelOf = (key: string) => FIELD_LABELS[key] ?? key;

/** 빈 칸 판정: undefined·null·공백뿐인 문자열. 배지와 설명 패널이 같은 기준을 쓴다. */
export const isEmpty = (v: unknown) => v === undefined || v === null || (typeof v === "string" && v.trim() === "");

function requiredKeysForNode(node: DNode): string[] {
  return NODE_KINDS.find((k) => k.kind === node.kind)?.requiredAttrs.slice() ?? [];
}

// 흐름을 그리는 연결(request·async)만 프로토콜/포트를 요구한다.
function requiredKeysForEdge(edge: Edge): string[] {
  return edge.edgeKind === "request" || edge.edgeKind === "async" ? ["label"] : [];
}

/** 대상 노드·연결의 필수 키. 대상이 없으면 null. */
export function requiredKeysFor(state: DiagramState, targetKind: "node" | "edge", targetId: string): string[] | null {
  if (targetKind === "node") {
    const node = state.nodes[targetId];
    return node ? requiredKeysForNode(node) : null;
  }
  const edge = state.edges[targetId];
  return edge ? requiredKeysForEdge(edge) : null;
}

export function computeMissing(state: DiagramState): {
  items: MissingItem[];
  count: number;
  byNode: Record<string, number>;
} {
  const items: MissingItem[] = [];
  const byNode: Record<string, number> = {};
  let count = 0;

  for (const node of Object.values(state.nodes)) {
    for (const key of requiredKeysForNode(node)) {
      if (!isEmpty(node.attrs[key])) continue;
      const unknown = node.unknown?.includes(key) ?? false;
      items.push({ targetKind: "node", targetId: node.id, key, label: labelOf(key), unknown });
      if (!unknown) {
        count += 1;
        byNode[node.id] = (byNode[node.id] ?? 0) + 1;
      }
    }
  }
  for (const edge of Object.values(state.edges)) {
    for (const key of requiredKeysForEdge(edge)) {
      if (!isEmpty(edge.label)) continue;
      const unknown = edge.unknown?.includes(key) ?? false;
      items.push({ targetKind: "edge", targetId: edge.id, key, label: labelOf(key), unknown });
      if (!unknown) count += 1;
    }
  }
  return { items, count, byNode };
}

export const missingReminder = (n: number): string => `빠진 정보 ${n}개가 있어요`;
