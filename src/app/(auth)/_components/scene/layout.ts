import type { Category, GroupKind } from "@/domain/catalog";

/**
 * 로그인 옆 장면에 그리는 구성도 한 장의 자리(캔버스 좌표, 배율 1 = 앱 캔버스 100%).
 * 레이아웃 엔진(ELK) 없이 미리 정한 값이다. 크기 규칙은 캔버스와 같다(src/canvas/layout.ts):
 * 노드 높이 52, 영역 머리 30 · 옆 12 · 아래 12, 층 사이 52.
 * 이름·종류는 샘플 「IDC WEB-WAS-DB 이중화」(docs/superpowers/spike/spike-results.json s2)에서 가져왔다.
 *
 * order 는 나타나는 차례다(영역 → 노드 → 연결선, 각각 따로 센다). 움직임 시각은 AuthScene.module.css 가 정한다.
 */

export interface SceneZone {
  id: string;
  label: string;
  kind: GroupKind;
  x: number;
  y: number;
  w: number;
  h: number;
  /** 다른 영역 안에 든 영역(이중화 묶음) — 캔버스처럼 칠을 더 옅게 한다. */
  inner?: boolean;
  order: number;
}

export interface SceneNode {
  id: string;
  label: string;
  sub?: string;
  category: Category;
  x: number;
  y: number;
  w: number;
  order: number;
}

export interface SceneEdge {
  id: string;
  /** 꺾은선 점(마지막 점이 화살표 끝). */
  points: [number, number][];
  /** 갈림점(묶인 선이 나뉘는 자리). */
  junctions?: [number, number][];
  /** 마지막 점에 화살표를 단다(노드에 닿는 토막만). */
  arrow?: boolean;
  order: number;
}

export const SCENE_SIZE = { width: 512, height: 574 } as const;
export const NODE_H = 52;

export const SCENE_ZONES: SceneZone[] = [
  { id: "idc", label: "사내 IDC", kind: "idc", x: 0, y: 104, w: 512, h: 470, order: 0 },
  { id: "dmz", label: "외부 구간 (DMZ)", kind: "dmz", x: 12, y: 134, w: 488, h: 240, order: 1 },
  { id: "private", label: "내부 구간", kind: "onprem_zone", x: 12, y: 426, w: 488, h: 136, order: 2 },
  { id: "web-pair", label: "WEB VIP", kind: "redundancy_group", x: 24, y: 268, w: 464, h: 94, inner: true, order: 3 },
  { id: "was-pair", label: "WAS VIP", kind: "redundancy_group", x: 24, y: 456, w: 464, h: 94, inner: true, order: 4 },
];

export const SCENE_NODES: SceneNode[] = [
  { id: "client", label: "사용자 (Web)", category: "client", x: 160, y: 0, w: 192, order: 0 },
  { id: "fw", label: "외부 방화벽", sub: "FW", category: "network", x: 160, y: 164, w: 192, order: 1 },
  { id: "web-1", label: "WEB#1", sub: "Apache", category: "compute", x: 36, y: 298, w: 192, order: 2 },
  { id: "web-2", label: "WEB#2", sub: "Apache", category: "compute", x: 284, y: 298, w: 192, order: 3 },
  { id: "was-1", label: "WAS#1", sub: "Tomcat", category: "compute", x: 36, y: 486, w: 192, order: 4 },
  { id: "was-2", label: "WAS#2", sub: "Tomcat", category: "compute", x: 284, y: 486, w: 192, order: 5 },
];

/* 노드 가운데 x: 사용자·방화벽 256, WEB#1·WAS#1 132, WEB#2·WAS#2 380. */
export const SCENE_EDGES: SceneEdge[] = [
  // 사용자 → 외부 방화벽
  { id: "client-fw", points: [[256, 52], [256, 164]], arrow: true, order: 0 },
  // 외부 방화벽 → WEB#1·WEB#2 (한 줄로 내려와 갈린다)
  {
    id: "fw-web",
    points: [[256, 216], [256, 242]],
    junctions: [[256, 242]],
    order: 1,
  },
  { id: "fw-web-1", points: [[256, 242], [132, 242], [132, 298]], arrow: true, order: 2 },
  { id: "fw-web-2", points: [[256, 242], [380, 242], [380, 298]], arrow: true, order: 2 },
  // WEB 두 대 → WAS 두 대 (서로 다 잇는다: 두 줄이 가로 막대에서 만나 다시 갈린다)
  { id: "web-bus-1", points: [[132, 350], [132, 400]], order: 3 },
  { id: "web-bus-2", points: [[380, 350], [380, 400]], order: 3 },
  { id: "bus", points: [[132, 400], [380, 400]], junctions: [[132, 400], [380, 400]], order: 4 },
  { id: "bus-was-1", points: [[132, 400], [132, 486]], arrow: true, order: 5 },
  { id: "bus-was-2", points: [[380, 400], [380, 486]], arrow: true, order: 5 },
];

/**
 * 흐름 빛(혜성)이 지나는 요청 길: 사용자 → 방화벽 → WEB → WAS. 한 번은 왼쪽(WEB#1 → WAS#1), 다음은 오른쪽(WEB#2 → WAS#2)으로
 * 번갈아 지난다(이중화). 노드 밑으로 지날 때는 노드 카드에 가려진다(캔버스와 같은 층 순서).
 */
export const COMET_PATHS: [number, number][][] = [
  [[256, 52], [256, 242], [132, 242], [132, 486]],
  [[256, 52], [256, 242], [380, 242], [380, 486]],
];

/** 꺾은선 길이(px). */
export function polylineLength(pts: [number, number][]): number {
  let n = 0;
  for (let i = 1; i < pts.length; i++) n += Math.hypot(pts[i]![0] - pts[i - 1]![0], pts[i]![1] - pts[i - 1]![1]);
  return n;
}
