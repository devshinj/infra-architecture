import "@testing-library/jest-dom/vitest";
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import type { DisplayEdge } from "@/canvas/display";
import { EdgeLayer } from "@/canvas/EdgeLayer";
import { ZoneNameLayer } from "@/canvas/ZoneNameLayer";
import { buildStage, edgeLabels, exportDiagramImage, LIGHT_TOKENS, neutralizeClone, PNG_PIXEL_RATIO } from "@/canvas/exportImage";
import type { Layout } from "@/canvas/layout";

const lib = vi.hoisted(() => ({
  toBlob: vi.fn(),
  toSvg: vi.fn(),
  getFontEmbedCSS: vi.fn(),
}));
vi.mock("html-to-image", () => lib);

// 화면의 React Flow 뷰포트를 흉내 낸다: 선택된 노드·흐린 노드·말풍선·배지·접기 버튼·움직임 겹선·호버 전용 연결 이름.
const VIEWPORT = `
<div class="react-flow__viewport" style="transform: translate(-300px, 12px) scale(0.4);">
  <div class="react-flow__nodes">
    <div class="react-flow__node react-flow__node-zone"><div class="group group--selected group--dimmed" data-group-kind="vpc">
      <div class="group__head"><button class="group__toggle"><span class="group__toggle-name">VPC</span> 접기</button></div>
    </div></div>
    <div class="react-flow__node react-flow__node-infra selected" tabindex="0"><div class="node node--selected node--pulse">
      <span class="node__text"><span class="node__label">웹 서버</span></span>
      <button class="node__badge node__badge--missing" aria-label="빠진 정보 2개">2</button>
      <div class="name-tooltip" id="tip-1">웹 서버 전체 이름</div>
      <span class="node__pulse"></span>
    </div></div>
    <div class="react-flow__node react-flow__node-infra"><div class="node node--dimmed"><span class="node__label">DB</span><span class="node__updated"></span></div></div>
    <div class="react-flow__node react-flow__node-infra"><div class="node node--appearing"><span class="node__label">캐시</span></div></div>
    <div class="react-flow__node react-flow__node-infra"><div class="node node--faded"><span class="node__label">큐</span></div></div>
  </div>
  <div class="react-flow__viewport-portal">
    <div class="zone-names"><span class="group__name group--dimmed" data-zone-id="g" title="VPC">VPC</span></div>
    <svg class="edge-layer">
      <g data-bundle="b1">
        <g class="edge-seg edge--dim" data-edge-ids="e1 e2"><path class="edge-line edge-line--request edge-line--appear" style="--len: 120;"></path>
          <g data-motion-seg="s1"><path class="motion-path motion-comet"></path><rect class="motion-capsule"></rect></g></g>
      </g>
      <g data-bundle="b2"><g class="edge-seg" data-edge-ids="aux1"><path class="edge-line edge-line--aux"></path></g></g>
      <g class="edge edge--faded edge--selected" data-edge-id="e1"><path class="edge-arrow"></path><path class="edge-hit"></path></g>
      <g class="edge" data-edge-id="aux1"><path class="edge-arrow edge-arrow--aux"></path><text class="edge-label">관리</text></g>
      <g class="edge" data-edge-id="e2"><path class="edge-hit"></path><text class="edge-label">이미 보임</text></g>
    </svg>
  </div>
</div>`;

const mount = () => {
  const host = document.createElement("div");
  host.innerHTML = VIEWPORT;
  document.body.appendChild(host);
  return host.querySelector<HTMLElement>(".react-flow__viewport")!;
};

const LAYOUT: Layout = {
  nodes: { a: { id: "a", x: 100, y: 100, width: 140, height: 52 } as Layout["nodes"][string] },
  groups: { g: { id: "g", x: 60, y: 40, width: 400, height: 260 } as Layout["groups"][string] },
  edges: [
    { id: "e1", points: [{ x: 170, y: 152 }, { x: 170, y: 240 }], labelAt: { x: 170, y: 196 } },
    { id: "e2", points: [{ x: 240, y: 126 }, { x: 400, y: 126 }], labelAt: { x: 320, y: 126 } },
  ],
  width: 500,
  height: 320,
};
const EDGES: DisplayEdge[] = [
  { id: "e1", from: "a", to: "b", edgeKind: "request", label: "HTTPS", sourceEdgeIds: ["e1"] },
  { id: "e2", from: "a", to: "c", edgeKind: "request", label: "이미 보임", sourceEdgeIds: ["e2"] },
];

beforeEach(() => {
  lib.toBlob.mockReset().mockResolvedValue(new Blob(["png-bytes"], { type: "image/png" }));
  lib.toSvg.mockReset().mockResolvedValue(`data:image/svg+xml;charset=utf-8,${encodeURIComponent("<svg><text>웹 서버</text></svg>")}`);
  lib.getFontEmbedCSS.mockReset().mockResolvedValue("@font-face{font-family:SUIT}");
  vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: vi.fn(() => "blob:x"), revokeObjectURL: vi.fn() }));
});
afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

test("neutralizeClone freezes the neutral state and drops chrome, without touching the screen", () => {
  const viewport = mount();
  const before = viewport.outerHTML;
  const clone = viewport.cloneNode(true) as HTMLElement;
  neutralizeClone(
    clone,
    [
      { id: "e1", label: "HTTPS", x: 170, y: 196 },
      { id: "e2", label: "이미 보임", x: 320, y: 126 },
    ],
    new Set(["e1", "e2"]),
  );

  for (const c of ["node--selected", "node--dimmed", "node--faded", "node--appearing", "node--pulse", "group--selected", "group--dimmed", "edge--dim", "edge--faded", "edge--selected", "edge-line--appear", "selected"]) {
    expect(clone.getElementsByClassName(c), c).toHaveLength(0);
  }
  expect(clone.querySelectorAll(".node.node--normal")).toHaveLength(4);
  for (const sel of [".name-tooltip", ".node__badge", ".node__pulse", ".node__updated", ".group__toggle", ".motion-path", ".motion-capsule", ".edge-hit"]) {
    expect(clone.querySelector(sel), sel).toBeNull();
  }
  // 화면에서 마우스를 올려야 보이던 이름도 넣고, 이미 보이던 이름은 겹치지 않게 그대로 둔다.
  const e1 = clone.querySelector('[data-edge-id="e1"] .edge-label')!;
  expect(e1.textContent).toBe("HTTPS");
  expect(e1.namespaceURI).toBe("http://www.w3.org/2000/svg");
  expect(e1.getAttribute("x")).toBe("170");
  expect(clone.querySelectorAll('[data-edge-id="e2"] .edge-label')).toHaveLength(1);
  expect(clone.querySelector<SVGElement>(".edge-line")!.style.getPropertyValue("--len")).toBe("");
  expect(clone.querySelector("[id]")).toBeNull();
  expect(clone.querySelector("[tabindex]")).toBeNull();
  // 선택 때문에만 보이던 보조 연결(기준 배치에 없는 연결)은 선·화살표·이름 모두 빠진다.
  expect(clone.querySelector('[data-edge-id="aux1"]')).toBeNull();
  expect(clone.querySelector('[data-edge-ids="aux1"]')).toBeNull();
  expect(clone.textContent).not.toContain("관리");
  expect(clone.querySelector('[data-edge-ids="e1 e2"]')).not.toBeNull();
  // 노드 이름·영역 이름(연결선 위 이름표 층)은 남는다.
  expect(clone.textContent).toContain("웹 서버");
  expect(clone.textContent).toContain("VPC");
  expect(clone.textContent).not.toContain("접기");
  expect(viewport.outerHTML).toBe(before);
});

test("buildStage sits off screen, frames the viewport and remaps tokens only for the light background", () => {
  const frame = { width: 480, height: 340, x: -20, y: 0, zoom: 1 };
  const dark = buildStage(document, document.createElement("div"), frame, "dark");
  // 화면 밖 위치는 감싸는 holder 에만 준다(찍히는 stage 에 주면 그 위치까지 그림에 옮겨진다).
  expect(dark.holder.style.position).toBe("fixed");
  expect(dark.holder.style.left).toBe("-100000px");
  expect(dark.holder.firstElementChild).toBe(dark.stage);
  expect(dark.holder.inert).toBe(true);
  expect(dark.stage.dataset.exportBg).toBe("dark");
  expect(dark.stage.style.left).toBe("");
  expect(dark.stage.style.position).toBe("relative");
  expect(dark.stage.style.width).toBe("480px");
  expect(dark.stage.style.getPropertyValue("--bg-canvas")).toBe("");
  const vp = dark.stage.firstElementChild as HTMLElement;
  expect(vp.style.transform).toBe("translate(-20px, 0px) scale(1)");

  const light = buildStage(document, document.createElement("div"), frame, "light").stage;
  for (const [k, v] of Object.entries(LIGHT_TOKENS)) expect(light.style.getPropertyValue(k), k).toBe(v);
  expect(document.documentElement.style.getPropertyValue("--bg-canvas")).toBe("");
});

test("exportDiagramImage captures a PNG at 2x of the off-screen stage, downloads it, and cleans up", async () => {
  const viewport = mount();
  const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
    expect(this.download).toBe("쇼핑몰-운영.png");
    expect(this.href).toBe("blob:x");
  });
  let seen: { stage: HTMLElement; bg: string; inDoc: boolean; label: string | null } | null = null;
  lib.toBlob.mockImplementation(async (stage: HTMLElement) => {
    seen = {
      stage,
      bg: stage.style.getPropertyValue("--bg-canvas"),
      inDoc: document.body.contains(stage),
      label: stage.querySelector('[data-edge-id="e1"] .edge-label')?.textContent ?? null,
    };
    return new Blob(["png"], { type: "image/png" });
  });

  await exportDiagramImage({ viewport, layout: LAYOUT, edges: EDGES, format: "png", background: "light", fileName: "쇼핑몰-운영.png" });

  expect(seen).not.toBeNull();
  expect(seen!.inDoc).toBe(true);
  expect(seen!.bg).toBe(LIGHT_TOKENS["--bg-canvas"]);
  expect(seen!.label).toBe("HTTPS");
  const opts = lib.toBlob.mock.calls[0]![1];
  // 영역(60,40 400×260)에 여백 40 씩.
  expect(opts).toMatchObject({ width: 480, height: 340, pixelRatio: PNG_PIXEL_RATIO, backgroundColor: "#FFFFFF", fontEmbedCSS: "@font-face{font-family:SUIT}" });
  expect(opts.filter({ classList: { contains: (c: string) => c === "name-tooltip" } })).toBe(false);
  expect(click).toHaveBeenCalledTimes(1);
  expect(document.querySelector(".export-stage")).toBeNull();
  expect(document.body.children).toHaveLength(1);
  // 화면의 뷰포트는 그대로다.
  expect(viewport.style.transform).toBe("translate(-300px, 12px) scale(0.4)");
  expect(viewport.querySelector(".node--selected")).not.toBeNull();
});

test("exportDiagramImage writes SVG text (not a data URL) for the svg format", async () => {
  const viewport = mount();
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  const blobs: Blob[] = [];
  (URL.createObjectURL as ReturnType<typeof vi.fn>).mockImplementation((b: Blob) => {
    blobs.push(b);
    return "blob:y";
  });
  await exportDiagramImage({ viewport, layout: LAYOUT, edges: EDGES, format: "svg", background: "dark", fileName: "a.svg" });
  expect(lib.toSvg).toHaveBeenCalledTimes(1);
  expect(lib.toSvg.mock.calls[0]![1].pixelRatio).toBeUndefined();
  expect(blobs[0]!.type).toContain("image/svg+xml");
  expect(await blobs[0]!.text()).toBe("<svg><text>웹 서버</text></svg>");
});

test("exportDiagramImage drops edges missing from the base layout (selection-only aux edges)", async () => {
  const viewport = mount();
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  let aux: Element | null | undefined;
  lib.toBlob.mockImplementation(async (stage: HTMLElement) => {
    aux = stage.querySelector('[data-edge-id="aux1"]');
    return new Blob(["png"]);
  });
  await exportDiagramImage({ viewport, layout: LAYOUT, edges: EDGES, format: "png", background: "dark", fileName: "a.png" });
  expect(aux).toBeNull();
  expect(viewport.querySelector('[data-edge-id="aux1"]')).not.toBeNull();
});

test("exportDiagramImage still exports without the font when font embedding fails, and retries it next time", async () => {
  vi.resetModules();
  const fresh = await import("@/canvas/exportImage");
  const viewport = mount();
  const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  lib.getFontEmbedCSS.mockRejectedValueOnce(new Error("font fetch failed"));
  await fresh.exportDiagramImage({ viewport, layout: LAYOUT, edges: EDGES, format: "png", background: "dark", fileName: "a.png" });
  expect(click).toHaveBeenCalledTimes(1);
  expect(lib.toBlob.mock.calls[0]![1].fontEmbedCSS).toBe("");
  expect(warn).toHaveBeenCalled();
  await fresh.exportDiagramImage({ viewport, layout: LAYOUT, edges: EDGES, format: "png", background: "dark", fileName: "a.png" });
  expect(lib.getFontEmbedCSS).toHaveBeenCalledTimes(2);
  expect(lib.toBlob.mock.calls[1]![1].fontEmbedCSS).toBe("@font-face{font-family:SUIT}");
});

test("exportDiagramImage removes the stage and rethrows when capture fails", async () => {
  const viewport = mount();
  const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  lib.toBlob.mockRejectedValue(new Error("canvas tainted"));
  await expect(exportDiagramImage({ viewport, layout: LAYOUT, edges: EDGES, format: "png", background: "dark", fileName: "a.png" })).rejects.toThrow("canvas tainted");
  expect(document.querySelector(".export-stage")).toBeNull();
  expect(click).not.toHaveBeenCalled();
});

test("exportDiagramImage refuses an empty layout", async () => {
  const viewport = mount();
  await expect(
    exportDiagramImage({ viewport, layout: { nodes: {}, groups: {}, edges: [], width: 0, height: 0 }, edges: [], format: "png", background: "dark", fileName: "a.png" }),
  ).rejects.toThrow();
  expect(lib.toBlob).not.toHaveBeenCalled();
});

test("export removes emphasis overlay", () => {
  const host = document.createElement("div");
  host.innerHTML = `
<div class="react-flow__viewport">
  <svg class="edge-layer">
    <g class="edge-base"><g data-bundle="b1">
      <g class="edge-seg edge--under" data-edge-ids="e1 e2"><path class="edge-line edge-line--request"></path></g>
      <g class="edge-seg edge--dim" data-edge-ids="e2"><path class="edge-line edge-line--request"></path></g>
    </g></g>
    <g class="edge-emph" data-mode="select"><g data-emph-edge="e1">
      <path class="edge-emph__glow"></path><path class="edge-emph__line edge-line edge-line--request"></path><path class="edge-emph__arrow edge-arrow edge-arrow--request"></path>
    </g></g>
    <g class="edge-motion"><g class="edge-motion__seg" data-motion-seg="s1"><path class="motion-path motion-comet"></path></g></g>
    <g class="edge edge--selected" data-edge-id="e1"><path class="edge-arrow edge-arrow--request edge--under"></path></g>
    <g class="edge edge--dim" data-edge-id="e2"><path class="edge-arrow edge-arrow--request"></path></g>
  </svg>
</div>`;
  document.body.appendChild(host);
  const viewport = host.querySelector<HTMLElement>(".react-flow__viewport")!;
  const clone = viewport.cloneNode(true) as HTMLElement;
  neutralizeClone(clone, [], new Set(["e1", "e2"]));
  expect(clone.querySelectorAll(".edge-emph")).toHaveLength(0);
  expect(clone.querySelectorAll("[data-emph-edge]")).toHaveLength(0);
  expect(clone.getElementsByClassName("edge--under")).toHaveLength(0);
  expect(clone.getElementsByClassName("edge--dim")).toHaveLength(0);
  expect(clone.querySelectorAll(".edge-seg")).toHaveLength(2);
  expect(clone.querySelectorAll("g[data-edge-id] .edge-arrow")).toHaveLength(2);
  expect(viewport.querySelectorAll(".edge-emph")).toHaveLength(1);
});

test("export keeps every original label while a node is selected", () => {
  const layout: Layout = {
    nodes: { n: { id: "n", x: 0, y: 0, width: 100, height: 40 } as Layout["nodes"][string] },
    groups: {},
    edges: [
      { id: "h1", points: [{ x: 100, y: 5 }, { x: 200, y: 5 }], labelAt: { x: 150, y: 5 } },
      { id: "h2", points: [{ x: 100, y: 15 }, { x: 200, y: 45 }], labelAt: { x: 150, y: 30 } },
      { id: "s1", points: [{ x: 100, y: 35 }, { x: 200, y: 125 }], labelAt: { x: 150, y: 80 } },
      { id: "far", points: [{ x: 10, y: 150 }, { x: 10, y: 220 }], labelAt: { x: 10, y: 185 } },
    ],
    width: 300,
    height: 240,
  };
  const edges: DisplayEdge[] = [
    { id: "h1", from: "n", to: "a", edgeKind: "request", label: "HTTP", sourceEdgeIds: ["h1"] },
    { id: "h2", from: "n", to: "b", edgeKind: "request", label: "HTTP", sourceEdgeIds: ["h2"] },
    { id: "s1", from: "n", to: "d", edgeKind: "request", label: "SQL", sourceEdgeIds: ["s1"] },
    { id: "far", from: "x", to: "y", edgeKind: "request", label: "관리", sourceEdgeIds: ["far"] },
  ];
  const host = document.createElement("div");
  host.className = "react-flow__viewport";
  document.body.appendChild(host);
  render(
    <EdgeLayer layout={layout} edges={edges} selectedId="n" selectedRect={layout.nodes.n} hoverId={null} hoverLabels={false} motion={false} appearing={new Set()} nodeCount={5} />,
    { container: host },
  );
  // 화면에는 합친 이름이 있다.
  expect(host.querySelector(".edge-label--merged")).toHaveTextContent("HTTP ×2");
  const clone = host.cloneNode(true) as HTMLElement;
  neutralizeClone(clone, edgeLabels(layout, edges), new Set(edges.map((e) => e.id)));
  expect(clone.textContent).not.toContain("×");
  expect(clone.querySelector(".edge-label--merged")).toBeNull();
  for (const e of edges) {
    const t = clone.querySelectorAll(`[data-edge-id="${e.id}"] .edge-label`);
    expect(t, e.id).toHaveLength(1);
    expect(t[0].textContent).toBe(e.label);
    const at = layout.edges.find((l) => l.id === e.id)!.labelAt!;
    expect(t[0].getAttribute("x")).toBe(String(at.x));
    expect(t[0].getAttribute("y")).toBe(String(at.y));
  }
  cleanup();
});

test("the export clone keeps the zone-name layer with plain (undimmed) pills, on dark and light stages", () => {
  const host = document.createElement("div");
  host.className = "react-flow__viewport";
  const portal = document.createElement("div");
  portal.className = "react-flow__viewport-portal";
  host.appendChild(portal);
  document.body.appendChild(host);
  render(
    <>
      <EdgeLayer layout={LAYOUT} edges={EDGES} selectedId="a" selectedRect={LAYOUT.nodes.a} hoverId={null} hoverLabels={false} motion={false} appearing={new Set()} nodeCount={3} />
      <ZoneNameLayer
        zones={[
          { id: "g", x: 60, y: 40, width: 400, label: "운영 VPC", groupKind: "vpc", collapsed: false, hiddenCount: 0, dimmed: true },
          { id: "h", x: 500, y: 40, width: 200, label: "데이터 영역", groupKind: "subnet_private", collapsed: true, hiddenCount: 2 },
        ]}
      />
    </>,
    { container: portal },
  );
  expect(host.querySelector(".group__name.group--dimmed")).not.toBeNull();
  for (const bg of ["dark", "light"] as const) {
    const clone = host.cloneNode(true) as HTMLElement;
    neutralizeClone(clone, edgeLabels(LAYOUT, EDGES), new Set(EDGES.map((e) => e.id)));
    const { stage } = buildStage(document, clone, { width: 800, height: 400, x: 0, y: 0, zoom: 1 }, bg);
    const pills = [...stage.querySelectorAll<HTMLElement>(".react-flow__viewport-portal .zone-names .group__name")];
    expect(pills.map((p) => p.textContent), bg).toEqual(["운영 VPC", "데이터 영역"]);
    expect(stage.getElementsByClassName("group--dimmed"), bg).toHaveLength(0);
    // 자리와 영역 색은 인라인이라 복제본에도 그대로다. 흰 바탕이면 무대가 덮어쓴 토큰을 물려받는다.
    expect(pills[0].style.transform, bg).toBe("translate(71px, 56px) translateY(-50%)");
    expect(pills[0].style.getPropertyValue("--tint"), bg).toBe("var(--zone-tint-vpc)");
    if (bg === "light") expect(stage.style.getPropertyValue("--zone-tint-vpc")).toBe(LIGHT_TOKENS["--zone-tint-vpc"]);
  }
  // 화면의 원본은 그대로 흐려 있다.
  expect(host.querySelector(".group__name.group--dimmed")).not.toBeNull();
});

test("export drops a moved single label and puts the original back at labelAt", () => {
  const layout: Layout = {
    nodes: { n: { id: "n", x: 100, y: 100, width: 100, height: 40 } as Layout["nodes"][string] },
    groups: {},
    edges: [{ id: "s", points: [{ x: 150, y: 140 }, { x: 150, y: 240 }], labelAt: { x: 150, y: 145 } }],
    width: 300,
    height: 260,
  };
  const edges: DisplayEdge[] = [{ id: "s", from: "n", to: "x", edgeKind: "request", label: "SQL", sourceEdgeIds: ["s"] }];
  const host = document.createElement("div");
  document.body.appendChild(host);
  render(
    <EdgeLayer layout={layout} edges={edges} selectedId="n" selectedRect={layout.nodes.n} hoverId={null} hoverLabels={false} motion={false} appearing={new Set()} nodeCount={2} />,
    { container: host },
  );
  expect(host.querySelector(".edge-label--moved")).not.toBeNull();
  const clone = host.cloneNode(true) as HTMLElement;
  neutralizeClone(clone, edgeLabels(layout, edges), new Set(["s"]));
  expect(clone.querySelector(".edge-label--moved")).toBeNull();
  const t = clone.querySelectorAll(".edge-label");
  expect(t).toHaveLength(1);
  expect(t[0].getAttribute("y")).toBe("145");
  cleanup();
});
