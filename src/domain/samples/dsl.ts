// 샘플 작성용 짧은 도우미. 샘플은 변경 명령 목록이고, 불러올 때 applyCommands 가 검사한다.
import type { EdgeKind, GroupKind, NodeKind } from "../catalog";
import type { Command } from "../commands";
import type { Attrs, EdgeDirection, EdgeMedium, EdgePayload } from "../types";

export interface Sample {
  id: string;
  /** 샘플 불러오기 메뉴에 보이는 이름. */
  title: string;
  /** 구성도 명령(영역·노드·연결·가정·망 종류)과 흐름 명령(add_flow). */
  commands: Command[];
}

export const group = (id: string, kind: GroupKind, label: string, parent: string | null = null): Command => ({
  op: "add_group",
  id,
  group_kind: kind,
  label,
  parent,
});

export const node = (id: string, kind: NodeKind, label: string, parent: string | null, sub?: string, attrs: Attrs = {}): Command => ({
  op: "add_node",
  id,
  kind,
  label,
  ...(sub ? { sub } : {}),
  parent,
  attrs,
});

interface EdgeExtra { payload?: EdgePayload; direction?: EdgeDirection; medium?: EdgeMedium }

/** 연결 id 는 e-<from>-<to> 로 정한다(흐름 단계가 이 id 를 쓴다). */
export const edgeId = (from: string, to: string) => `e-${from}-${to}`;

export const edge = (from: string, to: string, kind: EdgeKind, label?: string, extra: EdgeExtra = {}): Command => ({
  op: "add_edge",
  id: edgeId(from, to),
  from,
  to,
  edge_kind: kind,
  ...(label !== undefined ? { label } : {}),
  ...extra,
});

export const assume = (key: string, value: string): Command => ({ op: "set_assumption", key, value });

export const zoneType = (id: string, type: string): Command => ({ op: "set_zone_type", id, type });

/** 흐름 단계: [출발 노드, 도착 노드, 짧은 설명, 설명]. 연결 id 는 edgeId(출발, 도착)이다. */
type Step = [from: string, to: string, short: string, text: string];

export const flow = (id: string, name: string, origin: "user" | "system", summary: string, result: string, steps: Step[]): Command => ({
  op: "add_flow",
  id,
  name,
  origin,
  summary,
  result,
  steps: steps.map(([from, to, short, text]) => ({ edge: edgeId(from, to), from, short, text })),
});

/** 관리형 서비스 표시. multiAz 를 주면 Multi-AZ 칸도 쓴다. */
export const managed = (multiAz?: "yes" | "no"): Attrs => ({ managed: "yes", ...(multiAz ? { multi_az: multiAz } : {}) });
