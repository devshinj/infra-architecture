import type { DisplayEdge } from "./display";
import type { Layout, Rect } from "./layout";
import { textWidth } from "./text";

/**
 * 구성도 이미지 내보내기(PNG·SVG). 화면에 그려진 React Flow 뷰포트(.react-flow__viewport)를 복제해
 * 화면 밖 무대에 붙이고, 강조·흐림·움직임을 걷어 낸 정지 화면을 html-to-image 로 찍는다.
 * 화면의 캔버스는 건드리지 않으므로 흰 바탕으로 찍어도 화면이 깜박이지 않는다.
 */

export type ExportFormat = "png" | "svg";
export type ExportBackground = "dark" | "light";

/** 구성도 둘레 여백(구성도 좌표 px). */
export const EXPORT_PADDING = 40;
/** 그림(캔버스) 한 변의 최대 픽셀(pixelRatio 를 곱한 뒤). 넘으면 비율대로 줄인다. */
export const MAX_CANVAS_SIDE = 8192;
/** 그림 넓이의 최대 픽셀(pixelRatio 를 곱한 뒤). iOS Safari 캔버스 한도(약 16.7M) 아래로 둔다. */
export const MAX_CANVAS_AREA = 16_000_000;
export const PNG_PIXEL_RATIO = 2;
export const LIGHT_BACKGROUND = "#FFFFFF";

const FALLBACK_NAME = "InfraSketch-구성도";
const MAX_NAME_LENGTH = 100;
// Windows 가 파일 이름으로 받지 않는 장치 이름.
const RESERVED = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i;

/** 파일 시스템에 쓸 수 없는 글자(\ / : * ? " < > | 와 제어 문자)를 `_` 로 바꾸고, 앞뒤 공백·점을 다듬는다. */
export function sanitizeFileName(raw: string): string {
  // 줄바꿈·탭 같은 공백은 한 칸으로 줄인 뒤, 남은 제어 문자를 바꾼다.
  let s = raw
    .replace(/\s+/g, " ")
    .replace(/[\\/:*?"<>|\u0000-\u001f\u007f]/g, "_")
    .trim()
    .replace(/^[.\s]+|[.\s]+$/g, "");
  if (Array.from(s).length > MAX_NAME_LENGTH) s = Array.from(s).slice(0, MAX_NAME_LENGTH).join("").trim();
  if (RESERVED.test(s)) s = `_${s}`;
  return s;
}

/** `<프로젝트 이름>-<구성도 이름>.png|svg`. 한쪽이 비면 다른 쪽만, 둘 다 비면 기본 이름. */
export function exportFileName(projectName: string | undefined, diagramName: string | undefined, format: ExportFormat): string {
  const parts = [projectName, diagramName].map((p) => sanitizeFileName(p ?? "")).filter((p) => p.length > 0);
  const base = parts.length > 0 ? sanitizeFileName(parts.join("-")) : FALLBACK_NAME;
  return `${base || FALLBACK_NAME}.${format}`;
}

/** 연결 이름 글자 크기(edges.css .edge-label)와 글자 둘레 테두리(stroke 3px) 몫. */
const LABEL_PX = 11;
const LABEL_HALO = 3;

/** 연결 이름이 차지하는 상자(가운데 정렬, 너비는 글자 수로 어림한다). */
export function labelRect(l: Pick<EdgeLabel, "label" | "x" | "y">): Rect {
  const width = textWidth(l.label, LABEL_PX) + 2 * LABEL_HALO;
  const height = LABEL_PX * 1.4 + 2 * LABEL_HALO;
  return { x: l.x - width / 2, y: l.y - height / 2, width, height };
}

/** 노드·영역 상자와 연결선 꺾임점, 연결 이름 상자를 모두 감싸는 사각형. 그릴 것이 없으면 null. */
export function diagramBounds(layout: Pick<Layout, "nodes" | "groups" | "edges">, labels: EdgeLabel[] = []): Rect | null {
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  const add = (x: number, y: number, w = 0, h = 0) => {
    x1 = Math.min(x1, x);
    y1 = Math.min(y1, y);
    x2 = Math.max(x2, x + w);
    y2 = Math.max(y2, y + h);
  };
  for (const r of [...Object.values(layout.nodes), ...Object.values(layout.groups)]) add(r.x, r.y, r.width, r.height);
  for (const e of layout.edges) {
    for (const p of e.points) add(p.x, p.y);
    if (e.labelAt) add(e.labelAt.x, e.labelAt.y);
  }
  for (const l of labels) {
    const r = labelRect(l);
    add(r.x, r.y, r.width, r.height);
  }
  return x1 === Infinity ? null : { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
}

export interface ExportFrame {
  /** 이미지 크기(CSS px). */
  width: number;
  height: number;
  /** 뷰포트에 줄 변환: translate(x, y) scale(zoom). */
  x: number;
  y: number;
  zoom: number;
}

export interface FrameLimits {
  padding?: number;
  /** 그림 1 CSS px 당 픽셀 수(PNG 2, SVG 1). 한도는 이것을 곱한 픽셀로 잰다. */
  pixelRatio?: number;
  maxSide?: number;
  maxArea?: number;
}

/**
 * 구성도 전체를 여백과 함께 담는 이미지 크기와 뷰포트 변환(React Flow 예제의 getViewportForBounds 와 같은 계산을
 * 배율 1 로 고정해 한다). 픽셀로 잰 한 변이 maxSide, 넓이가 maxArea 를 넘으면 그만큼 줄인다(확대는 하지 않는다).
 */
export function exportFrame(bounds: Rect, limits: FrameLimits = {}): ExportFrame {
  const { padding = EXPORT_PADDING, pixelRatio = 1, maxSide = MAX_CANVAS_SIDE, maxArea = MAX_CANVAS_AREA } = limits;
  const w0 = Math.max(1, bounds.width + 2 * padding);
  const h0 = Math.max(1, bounds.height + 2 * padding);
  const zoom = Math.min(1, maxSide / (w0 * pixelRatio), maxSide / (h0 * pixelRatio), Math.sqrt(maxArea / (w0 * h0)) / pixelRatio);
  return {
    // 올림 때문에 한도를 넘지 않게 내림한다.
    width: Math.max(1, Math.floor(w0 * zoom)),
    height: Math.max(1, Math.floor(h0 * zoom)),
    x: (padding - bounds.x) * zoom,
    y: (padding - bounds.y) * zoom,
    zoom,
  };
}

/**
 * 흰 바탕(문서용) 색. tokens.css 의 색 토큰을 모두 덮는다(빠지면 단위 테스트가 잡는다).
 * 글자·선은 흰 바탕에서 읽히게 어둡게, 칠은 옅게 바꾼다. 움직임 토큰은 내보내기에서 쓰지 않지만 함께 둔다.
 */
export const LIGHT_TOKENS: Readonly<Record<string, string>> = {
  "--bg-canvas": LIGHT_BACKGROUND,
  "--bg-node": "#F7F9FC",
  "--line-node": "#B4C0D1",
  "--bg-sidebar": "#F1F4F8",
  "--bg-panel": "#F5F7FA",
  "--bg-panel-raised": "#E8EDF3",
  "--line-shell": "#D3DAE4",
  "--glass-bg": "rgba(255, 255, 255, 0.92)",
  "--glass-line": "rgba(27, 38, 56, 0.12)",
  "--glass-highlight": "rgba(27, 38, 56, 0.2)",
  "--focus-ring": "#55657D",
  "--scrollbar-thumb": "rgba(85, 101, 125, 0.28)",
  "--scrollbar-thumb-hover": "rgba(85, 101, 125, 0.5)",
  "--fly-dot": "#55657D",
  "--text-primary": "#1B2638",
  "--text-secondary": "#4F5F77",
  "--accent": "#9A6E22",
  "--cat-client": "#56657A",
  "--cat-network": "#2F6AA3",
  "--cat-compute": "#4F5C70",
  "--cat-data": "#2D7A4C",
  "--cat-external": "#A0582F",
  "--edge-request": "#5A6C8A",
  "--edge-async": "#94603F",
  "--edge-replication": "#3F7F55",
  "--edge-aux": "#7D8BA0",
  // 강조 색: 흰 바탕에서는 기본색보다 진하고 채도 높게(같은 색 계열).
  "--edge-request-lit": "#2F5A94",
  "--edge-async-lit": "#7A3F1C",
  "--edge-replication-lit": "#1F6B3E",
  "--edge-aux-lit": "#44587A",
  "--edge-glow": "#3F6BA8",
  "--motion-comet-tail": "#7D8BA0",
  "--motion-comet-mid": "#9A6E22",
  "--motion-capsule": "#94603F",
  "--motion-sheen": "#3F7F55",
  "--state-missing": "#B8402F",
  "--state-missing-text": "#713433",
  "--state-warn": "#9A6E22",
  "--zone-region": "#93A5BE",
  "--zone-vpc": "#869CBE",
  "--zone-subnet-public": "#8FA8C4",
  "--zone-subnet-private": "#98A3C2",
  "--zone-redundancy": "#7C91B2",
  "--zone-external": "#B39684",
  "--zone-tint-region": "#4A6A92",
  "--zone-tint-vpc": "#3A6CAC",
  "--zone-tint-public": "#2A8196",
  "--zone-tint-private": "#525DA6",
  "--zone-tint-dmz": "#987232",
  "--zone-tint-k8s": "#368275",
  "--zone-tint-external": "#965F45",
  "--zone-tint-redundancy": "#62799E",
  "--zone-tint-onprem": "#667283",
};

/** 내보낸 그림에 남기지 않는 화면 장치: 말풍선·배지·접기 버튼·강조 링·강조 겹선·합친(또는 비킨) 연결 이름·움직임·클릭 영역·React Flow 도구. */
const CHROME = [
  "edge-emph",
  "edge-label--merged",
  "edge-label--moved",
  "name-tooltip",
  "node__badge",
  "node__pulse",
  "node__updated",
  "group__toggle",
  "motion-path",
  "motion-capsule",
  "edge-hit",
  "react-flow__handle",
  "react-flow__resize-control",
  "react-flow__nodesselection",
  "react-flow__selection",
  "react-flow__minimap",
  "react-flow__controls",
  "react-flow__panel",
  "react-flow__attribution",
  "react-flow__background",
];

/** html-to-image `filter`: 남길 요소면 true. 글자 노드 등 요소가 아닌 것은 늘 남긴다. */
export function keepInExport(node: unknown): boolean {
  const cl = (node as Element | null)?.classList;
  if (!cl || typeof cl.contains !== "function") return true;
  return !CHROME.some((c) => cl.contains(c));
}

// 강조·흐림·등장 효과 클래스 → 평상시 클래스(없으면 지운다).
const NEUTRAL_SWAPS: [string, string | null][] = [
  ["node--selected", "node--normal"],
  ["node--dimmed", "node--normal"],
  ["node--faded", "node--normal"],
  ["node--appearing", "node--normal"],
  ["node--updated", "node--normal"],
  ["node--pulse", null],
  ["group--selected", null],
  ["group--dimmed", null],
  ["edge--dim", null],
  ["edge--under", null],
  ["edge--faded", null],
  ["edge--selected", null],
  ["edge-line--appear", null],
  ["selected", null],
];

const SVG_NS = "http://www.w3.org/2000/svg";

export interface EdgeLabel { id: string; label: string; x: number; y: number }

/** 이름이 있는 연결의 이름 자리(화면에서 마우스를 올릴 때만 보이는 이름도 그림에는 늘 넣는다). */
export function edgeLabels(layout: Pick<Layout, "edges">, edges: DisplayEdge[]): EdgeLabel[] {
  const byId = new Map(edges.map((e) => [e.id, e]));
  const out: EdgeLabel[] = [];
  for (const l of layout.edges) {
    const e = byId.get(l.id);
    if (e?.label && l.labelAt && l.points.length >= 2) out.push({ id: e.id, label: e.label, x: l.labelAt.x, y: l.labelAt.y });
  }
  return out;
}

/**
 * 복제한 뷰포트를 정지한 평상시 모습으로 만든다: 선택·호버 강조와 흐림, 등장 효과를 걷고, 움직임 겹선과 화면 장치를
 * 지우고, 빠진 연결 이름을 채운다. 복제본만 바꾸며 화면의 원본은 그대로다.
 */
export function neutralizeClone(root: Element, labels: EdgeLabel[] = [], keepEdgeIds?: Set<string>): void {
  // 선택 때문에만 보이는 연결(보조 연결 숨김 중 선택한 노드의 보조 연결)은 그림에 넣지 않는다.
  if (keepEdgeIds) {
    for (const g of [...root.querySelectorAll("g[data-edge-id]")]) if (!keepEdgeIds.has(g.getAttribute("data-edge-id") ?? "")) g.remove();
    for (const g of [...root.querySelectorAll("g[data-edge-ids]")]) {
      const ids = (g.getAttribute("data-edge-ids") ?? "").split(" ").filter(Boolean);
      if (ids.length > 0 && !ids.some((i) => keepEdgeIds.has(i))) g.remove();
    }
  }
  for (const [from, to] of NEUTRAL_SWAPS) {
    for (const el of [...root.getElementsByClassName(from)]) {
      el.classList.remove(from);
      if (to) el.classList.add(to);
    }
  }
  for (const el of [...root.querySelectorAll("*")]) if (!keepInExport(el)) el.remove();
  for (const el of root.querySelectorAll<SVGElement | HTMLElement>("[style]")) el.style.removeProperty("--len");
  // 접근성용 속성은 그림에 의미가 없고, 같은 id 가 화면에 두 번 생기지 않게 지운다.
  for (const el of [...root.querySelectorAll("[id]")]) el.removeAttribute("id");
  // 화면 밖 복제본에 키보드 포커스가 가지 않게 한다.
  for (const el of [...root.querySelectorAll("[tabindex]")]) el.removeAttribute("tabindex");
  for (const el of [...root.querySelectorAll("[focusable]")]) el.removeAttribute("focusable");
  const byId = new Map(labels.map((l) => [l.id, l]));
  for (const g of root.querySelectorAll("g[data-edge-id]")) {
    const l = byId.get(g.getAttribute("data-edge-id") ?? "");
    if (!l || g.querySelector(".edge-label")) continue;
    const t = g.ownerDocument.createElementNS(SVG_NS, "text");
    t.setAttribute("class", "edge-label");
    t.setAttribute("x", String(l.x));
    t.setAttribute("y", String(l.y));
    t.textContent = l.label;
    g.appendChild(t);
  }
}

/**
 * 화면 밖에 붙일 무대. 찍는 것은 `stage` 이고, `holder` 가 그것을 화면 밖(fixed, 왼쪽 -100000px)으로 치운다.
 * 무대 자신에 화면 밖 위치를 주면 html-to-image 가 그 계산된 위치까지 그림에 옮겨 빈 그림이 나온다.
 * 흰 바탕이면 색 토큰을 무대에만 덮어써서(아래로 상속) 화면의 캔버스는 바뀌지 않는다.
 */
export function buildStage(doc: Document, viewportClone: HTMLElement, frame: ExportFrame, background: ExportBackground): { holder: HTMLDivElement; stage: HTMLDivElement } {
  const holder = doc.createElement("div");
  holder.setAttribute("aria-hidden", "true");
  // 화면 밖 무대는 포커스·클릭·보조기기에서 빠진다.
  holder.inert = true;
  const h = holder.style;
  h.position = "fixed";
  h.left = "-100000px";
  h.top = "0";
  h.pointerEvents = "none";
  const stage = doc.createElement("div");
  stage.className = "export-stage";
  stage.dataset.exportBg = background;
  const s = stage.style;
  s.position = "relative";
  s.width = `${frame.width}px`;
  s.height = `${frame.height}px`;
  s.overflow = "hidden";
  if (background === "light") for (const [k, v] of Object.entries(LIGHT_TOKENS)) s.setProperty(k, v);
  const v = viewportClone.style;
  v.transform = `translate(${frame.x}px, ${frame.y}px) scale(${frame.zoom})`;
  v.transformOrigin = "0 0";
  v.position = "absolute";
  v.left = "0";
  v.top = "0";
  v.width = `${frame.width}px`;
  v.height = `${frame.height}px`;
  stage.appendChild(viewportClone);
  holder.appendChild(stage);
  return { holder, stage };
}

// 웹 글꼴(SUIT)을 그림에 넣는 CSS. 한 번 만들어 두고 다시 쓴다(실패하면 다음에 다시 만든다).
let fontCSS: Promise<string> | null = null;

export interface ExportRequest {
  /** 화면의 `.react-flow__viewport` 요소. */
  viewport: HTMLElement;
  /** 선택과 상관없는 배치·연결(useDiagramView 의 baseLayout·baseDisplay). 여기 없는 연결은 그림에서 뺀다. */
  layout: Layout;
  edges: DisplayEdge[];
  format: ExportFormat;
  background: ExportBackground;
  fileName: string;
}

/** 그림을 만들어 내려받게 한다. 실패하면 예외를 던진다(부르는 쪽이 사용자에게 알린다). */
export async function exportDiagramImage(req: ExportRequest): Promise<void> {
  const labels = edgeLabels(req.layout, req.edges);
  const bounds = diagramBounds(req.layout, labels);
  if (!bounds) throw new Error("빈 구성도");
  const frame = exportFrame(bounds, { pixelRatio: req.format === "png" ? PNG_PIXEL_RATIO : 1 });
  const doc = req.viewport.ownerDocument;
  const clone = req.viewport.cloneNode(true) as HTMLElement;
  neutralizeClone(clone, labels, new Set(req.edges.map((e) => e.id)));
  const { holder, stage } = buildStage(doc, clone, frame, req.background);
  doc.body.appendChild(holder);
  try {
    const lib = await import("html-to-image");
    const backgroundColor =
      req.background === "light"
        ? LIGHT_BACKGROUND
        : getComputedStyle(doc.documentElement).getPropertyValue("--bg-canvas").trim() || "#1B2638";
    // 글꼴을 못 넣어도 그림은 만든다(보는 쪽 글꼴로 그려진다). 다음 내보내기에서 다시 시도한다.
    fontCSS ??= lib.getFontEmbedCSS(stage).catch((e: unknown) => {
      console.warn("글꼴을 그림에 넣지 못했습니다", e);
      fontCSS = null;
      return "";
    });
    const options = {
      width: frame.width,
      height: frame.height,
      backgroundColor,
      fontEmbedCSS: await fontCSS,
      filter: keepInExport,
    };
    let blob: Blob | null;
    if (req.format === "png") {
      blob = await lib.toBlob(stage, { ...options, pixelRatio: PNG_PIXEL_RATIO });
    } else {
      const url = await lib.toSvg(stage, options);
      blob = new Blob([decodeSvgDataUrl(url)], { type: "image/svg+xml;charset=utf-8" });
    }
    if (!blob || blob.size === 0) throw new Error("빈 그림");
    download(doc, blob, req.fileName);
  } finally {
    holder.remove();
  }
}

/** html-to-image 의 `data:image/svg+xml;charset=utf-8,<encodeURIComponent 된 본문>` 을 SVG 글로 되돌린다. */
export function decodeSvgDataUrl(url: string): string {
  const comma = url.indexOf(",");
  const head = url.slice(0, comma);
  const body = url.slice(comma + 1);
  if (head.endsWith(";base64")) {
    const bin = atob(body);
    return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
  }
  return decodeURIComponent(body);
}

function download(doc: Document, blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = doc.createElement("a");
  a.href = url;
  a.download = fileName;
  a.style.display = "none";
  doc.body.appendChild(a);
  a.click();
  a.remove();
  // 내려받기가 시작된 뒤에 풀어 준다.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
