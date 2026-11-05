import type { EdgeKind, GroupKind, NodeKind } from "./catalog";

export type Attrs = Record<string, string | number | null>;
export interface Group { id: string; groupKind: GroupKind; label: string; parent: string | null }
export interface DNode { id: string; kind: NodeKind; label: string; sub?: string; parent: string | null; attrs: Attrs; unknown?: string[] }
/** 연결이 나르는 것: API 호출 또는 파일. */
export const EDGE_PAYLOADS = ["api", "file"] as const;
export type EdgePayload = (typeof EDGE_PAYLOADS)[number];
/** 데이터가 흐르는 방향. one_way 는 from → to 로만 지난다. */
export const EDGE_DIRECTIONS = ["one_way", "two_way"] as const;
export type EdgeDirection = (typeof EDGE_DIRECTIONS)[number];
export interface Edge { id: string; from: string; to: string; edgeKind: EdgeKind; label?: string; payload?: EdgePayload; direction?: EdgeDirection; unknown?: string[] }
export interface Assumption { key: string; value: string; confirmed: boolean }
export type WarningLevel = "warn" | "check";
export interface Warning {
  id: string;
  rule: string;
  nodeId: string;
  edgeId?: string;
  level: WarningLevel;
  text: string;
  guide: string;
}
export interface DiagramState {
  groups: Record<string, Group>;
  nodes: Record<string, DNode>;
  edges: Record<string, Edge>;
  assumptions: Record<string, Assumption>;
  warnings?: Warning[];
  ignoredWarnings?: string[];
}

export const emptyState = (): DiagramState => ({ groups: {}, nodes: {}, edges: {}, assumptions: {} });
