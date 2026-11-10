/**
 * 로그인 옆 별자리 장면의 자리(SVG 좌표, 1 = 화면 1px). 레이아웃 엔진 없이 미리 정한 값이다.
 * 이름은 샘플 「IDC WEB-WAS-DB 이중화」(docs/superpowers/spike/spike-results.json s2)에서 가져왔다.
 * order 는 나타나는 차례다(점·등고선·곡선이 각각 따로 센다). 움직임 시각은 AuthScene.module.css 가 정한다.
 */

export const SCENE_SIZE = { width: 500, height: 480 } as const;

export interface ScenePoint {
  id: string;
  label: string;
  /** 들어오는 자리(사용자·방화벽)는 고리, 서버는 작은 점. */
  shape: "ring" | "dot";
  x: number;
  y: number;
  order: number;
}

export interface SceneZone {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  order: number;
}

export interface SceneCurve {
  id: string;
  d: string;
  order: number;
}

export const SCENE_POINTS: ScenePoint[] = [
  { id: "client", label: "사용자", shape: "ring", x: 150, y: 14, order: 0 },
  { id: "fw", label: "외부 방화벽", shape: "ring", x: 150, y: 124, order: 1 },
  { id: "web-1", label: "WEB#1", shape: "dot", x: 150, y: 212, order: 2 },
  { id: "web-2", label: "WEB#2", shape: "dot", x: 360, y: 212, order: 3 },
  { id: "was-1", label: "WAS#1", shape: "dot", x: 150, y: 404, order: 4 },
  { id: "was-2", label: "WAS#2", shape: "dot", x: 360, y: 404, order: 5 },
];

export const SCENE_ZONES: SceneZone[] = [
  { id: "idc", label: "사내 IDC", x: 1, y: 52, w: 498, h: 427, order: 0 },
  { id: "dmz", label: "외부 구간 (DMZ)", x: 20, y: 84, w: 460, h: 172, order: 1 },
  { id: "private", label: "내부 구간", x: 20, y: 300, w: 460, h: 160, order: 2 },
];

/** 영역 등고선의 모서리 반지름(앱의 8px 상자와 다르게 크게 둥글린다). */
export const ZONE_RADIUS = 22;

const C = {
  clientFw: "M150 14 C138 54, 162 84, 150 124",
  fwWeb1: "C138 158, 138 180, 150 212",
  fwWeb2: "C150 176, 360 150, 360 212",
  web1Was1: "C138 280, 138 340, 150 404",
  web1Was2: "M150 212 C150 316, 360 300, 360 404",
  web2Was1: "M360 212 C360 316, 150 300, 150 404",
  web2Was2: "C372 280, 372 340, 360 404",
};

export const SCENE_CURVES: SceneCurve[] = [
  { id: "client-fw", d: C.clientFw, order: 0 },
  { id: "fw-web-1", d: `M150 124 ${C.fwWeb1}`, order: 1 },
  { id: "fw-web-2", d: `M150 124 ${C.fwWeb2}`, order: 1 },
  { id: "web-1-was-1", d: `M150 212 ${C.web1Was1}`, order: 2 },
  { id: "web-1-was-2", d: C.web1Was2, order: 2 },
  { id: "web-2-was-1", d: C.web2Was1, order: 2 },
  { id: "web-2-was-2", d: `M360 212 ${C.web2Was2}`, order: 2 },
];

/**
 * 흐름 빛(혜성)이 지나는 요청 길: 사용자 → 방화벽 → WEB → WAS. 한 번은 왼쪽(WEB#1 → WAS#1), 다음은 오른쪽(WEB#2 → WAS#2)으로
 * 번갈아 지난다(이중화). 곡선을 이어 붙인 한 길이다.
 */
export const COMET_PATHS: string[] = [`${C.clientFw} ${C.fwWeb1} ${C.web1Was1}`, `${C.clientFw} ${C.fwWeb2} ${C.web2Was2}`];

/** 글자 폭 어림(px): 한글은 글자 크기만큼, 라틴·숫자는 0.6em, 띄어쓰기·괄호는 0.32em. */
export function textWidth(text: string, px: number): number {
  let n = 0;
  for (const ch of text) n += /[가-힣]/.test(ch) ? 1 : /[ ()]/.test(ch) ? 0.32 : 0.6;
  return n * px;
}

/**
 * 영역 등고선: 큰 반지름 둥근 사각형 머리카락 선. 왼쪽 위 직선에 이름 자리만큼 틈을 낸다.
 * 시작점은 틈 오른쪽 끝, 시계 방향으로 돌아 틈 왼쪽 끝에서 끝난다(그리는 움직임도 이 방향).
 */
export function zonePath(z: SceneZone, labelPx: number): { d: string; labelX: number } {
  const r = ZONE_RADIUS;
  const { x, y, w, h } = z;
  const gapL = x + r + 2;
  const labelX = gapL + 6;
  const gapR = labelX + textWidth(z.label, labelPx) + 6;
  const d = [
    `M${gapR} ${y}`,
    `H${x + w - r}`,
    `A${r} ${r} 0 0 1 ${x + w} ${y + r}`,
    `V${y + h - r}`,
    `A${r} ${r} 0 0 1 ${x + w - r} ${y + h}`,
    `H${x + r}`,
    `A${r} ${r} 0 0 1 ${x} ${y + h - r}`,
    `V${y + r}`,
    `A${r} ${r} 0 0 1 ${x + r} ${y}`,
    `H${gapL}`,
  ].join(" ");
  return { d, labelX };
}
