import type { EdgeKind, GroupKind, NodeKind } from "./catalog";

export type Attrs = Record<string, string | number | null>;
/** 연결이 나르는 것: API 호출 또는 파일. */
export const EDGE_PAYLOADS = ["api", "file"] as const;
export type EdgePayload = (typeof EDGE_PAYLOADS)[number];
/** 데이터가 흐르는 방향. one_way 는 from → to 로만 지난다. */
/**
 * 통신 수단. 없으면 보통의 IP 통신으로 본다("ip" 는 잘못 붙은 값을 되돌릴 때 쓴다).
 * wireless: 망을 거치지 않고 기기끼리 바로 붙는 근거리 무선(BLE·NFC·Zigbee 등), video: 끊기지 않고 흐르는 영상 스트림(RTSP 등),
 * media: 실시간 영상·음성(WebRTC 의 SRTP 등).
 */
export const EDGE_MEDIA = ["ip", "wireless", "video", "media"] as const;
export type EdgeMedium = (typeof EDGE_MEDIA)[number];

export const EDGE_DIRECTIONS = ["one_way", "two_way"] as const;
export type EdgeDirection = (typeof EDGE_DIRECTIONS)[number];
/** 망 영역의 종류. source "user" 는 사람이 확정한 것이라 AI 가 바꾸지 못한다. */
export interface ZoneType { key: string; source: "ai" | "user"; confirmed: boolean }
export interface Group { id: string; groupKind: GroupKind; label: string; parent: string | null; netType?: ZoneType }
export interface Edge { id: string; from: string; to: string; edgeKind: EdgeKind; label?: string; payload?: EdgePayload; direction?: EdgeDirection; medium?: EdgeMedium; unknown?: string[] }
/** 망연계 솔루션이 대신한 연결 하나(되돌릴 때 다시 그린다). */
export interface ReplacedEdge { from: string; to: string; edgeKind: EdgeKind; label?: string; payload?: EdgePayload; direction?: EdgeDirection; medium?: EdgeMedium; id?: string }
/** bridge = 새로 그려 대신한 연결이 없을 때 앞·뒤 노드를 바로 이을 연결. */
export interface LinkGuess { replaced: ReplacedEdge[]; bridge?: ReplacedEdge }
export interface DNode { id: string; kind: NodeKind; label: string; sub?: string; parent: string | null; attrs: Attrs; unknown?: string[]; guess?: LinkGuess }
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
