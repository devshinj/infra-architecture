import type { EdgeKind, GroupKind, NodeKind } from "./catalog";

export type Attrs = Record<string, string | number | null>;
export interface Group { id: string; groupKind: GroupKind; label: string; parent: string | null }
export interface DNode { id: string; kind: NodeKind; label: string; sub?: string; parent: string | null; attrs: Attrs; unknown?: string[] }
export interface Edge { id: string; from: string; to: string; edgeKind: EdgeKind; label?: string; unknown?: string[] }
export interface Assumption { key: string; value: string; confirmed: boolean }
export interface DiagramState {
  groups: Record<string, Group>;
  nodes: Record<string, DNode>;
  edges: Record<string, Edge>;
  assumptions: Record<string, Assumption>;
}

export const emptyState = (): DiagramState => ({ groups: {}, nodes: {}, edges: {}, assumptions: {} });
