"use client";

import { useMemo, useState } from "react";

import type { DisplayEdge } from "@/canvas/display";
import { EdgeLayer } from "@/canvas/EdgeLayer";
import type { Layout } from "@/canvas/layout";
import { NodeCard, type NodeCardData } from "@/canvas/NodeCard";

type Pt = [number, number];
interface PanelNode { id: string; x: number; y: number; data: NodeCardData }
interface PanelEdge { id: string; from: string; to: string; kind: DisplayEdge["edgeKind"]; pts: Pt[]; label?: string }
interface Panel { title: string; desc: string; nodes: PanelNode[]; edges: PanelEdge[] }

const W = 120;
const H = 40;
const n = (id: string, x: number, y: number, label: string, sub: string, category: NodeCardData["category"]): PanelNode => ({
  id, x, y, data: { label, fullLabel: label, sub, category, state: "normal" },
});

const ALB = n("alb", 105, 12, "ALB", "L7 로드밸런서", "network");
const WAS1 = (y: number) => n("w1", 25, y, "WAS#1", "Spring Boot", "compute");
const WAS2 = (y: number) => n("w2", 185, y, "WAS#2", "Spring Boot", "compute");

const PANELS: Panel[] = [
  {
    title: "갈라짐",
    desc: "몸통을 빛 하나가 지나가고, 갈림점에서 동시에 두 갈래로 나뉩니다. 몸통 선은 한 번만 그립니다.",
    nodes: [ALB, WAS1(170), WAS2(170)],
    edges: [
      { id: "f1", from: "alb", to: "w1", kind: "request", pts: [[165, 52], [165, 110], [85, 110], [85, 170]] },
      { id: "f2", from: "alb", to: "w2", kind: "request", pts: [[165, 52], [165, 110], [245, 110], [245, 170]] },
    ],
  },
  {
    title: "합쳐짐",
    desc: "두 갈래의 빛이 합류점에 동시에 도착해 하나로 이어져 내려갑니다.",
    nodes: [WAS1(12), WAS2(12), n("db", 105, 170, "DB Primary", "MySQL 8", "data")],
    edges: [
      { id: "m1", from: "w1", to: "db", kind: "request", pts: [[85, 52], [85, 110], [165, 110], [165, 170]] },
      { id: "m2", from: "w2", to: "db", kind: "request", pts: [[245, 52], [245, 110], [165, 110], [165, 170]] },
    ],
  },
  {
    title: "갈라졌다 합쳐짐",
    desc: "갈래마다 길이가 같으면 합류점에 동시에 도착하고, 다르면 짧은 쪽이 먼저 도착해 기다립니다.",
    nodes: [
      n("alb", 105, 12, "ALB", "L7 로드밸런서", "network"),
      n("w1", 25, 100, "WAS#1", "Spring Boot", "compute"),
      n("w2", 185, 100, "WAS#2", "Spring Boot", "compute"),
      n("db", 105, 188, "DB Primary", "MySQL 8", "data"),
    ],
    edges: [
      { id: "d1", from: "alb", to: "w1", kind: "request", pts: [[165, 52], [165, 76], [85, 76], [85, 100]] },
      { id: "d2", from: "alb", to: "w2", kind: "request", pts: [[165, 52], [165, 76], [245, 76], [245, 100]] },
      { id: "d3", from: "w1", to: "db", kind: "request", pts: [[85, 140], [85, 164], [165, 164], [165, 188]] },
      { id: "d4", from: "w2", to: "db", kind: "request", pts: [[245, 140], [245, 164], [165, 164], [165, 188]] },
    ],
  },
  {
    title: "선 종류",
    desc: "동기 요청(빛 꼬리), 비동기(점선 + 패킷), 복제(이중선 + 광택), 보조(움직임 없음). 노드를 클릭하면 관련 없는 선이 흐려집니다.",
    nodes: [
      n("a", 20, 10, "WAS#1", "Spring Boot", "compute"),
      n("b", 190, 10, "Kafka", "이벤트 버스", "compute"),
      n("c", 20, 100, "DB Primary", "MySQL 8", "data"),
      n("d", 190, 100, "DB Standby", "MySQL 8", "data"),
      n("e", 20, 180, "Prometheus", "모니터링", "compute"),
      n("f", 190, 180, "WAS#2", "Spring Boot", "compute"),
    ],
    edges: [
      { id: "k1", from: "a", to: "b", kind: "async", pts: [[140, 30], [190, 30]], label: "이벤트" },
      { id: "k2", from: "a", to: "c", kind: "request", pts: [[80, 50], [80, 100]], label: "SQL" },
      { id: "k3", from: "c", to: "d", kind: "replication", pts: [[140, 120], [190, 120]] },
      { id: "k4", from: "e", to: "f", kind: "aux", pts: [[140, 200], [190, 200]] },
    ],
  },
];

function PanelView({ panel }: { panel: Panel }) {
  const [selected, setSelected] = useState<string | null>(null);
  const edges = useMemo<DisplayEdge[]>(
    () => panel.edges.map((e) => ({ id: e.id, from: e.from, to: e.to, edgeKind: e.kind, sourceEdgeIds: [e.id], ...(e.label ? { label: e.label } : {}) })),
    [panel],
  );
  const layout = useMemo<Layout>(() => ({
    nodes: {}, groups: {}, width: 330, height: 240,
    edges: panel.edges.map((e) => {
      const mid = e.pts[Math.floor(e.pts.length / 2)];
      return { id: e.id, points: e.pts.map(([x, y]) => ({ x, y })), labelAt: { x: mid[0], y: mid[1] } };
    }),
  }), [panel]);
  const appearing = useMemo(() => new Set<string>(), []);
  return (
    <section style={{ background: "var(--bg-node)", border: "1px solid var(--line-node)", borderRadius: "var(--radius-zone)", padding: "12px 14px" }}>
      <h3 style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 600 }}>{panel.title}</h3>
      <p style={{ margin: "2px 0 8px", fontSize: 12.5, lineHeight: 1.55, color: "var(--text-secondary)" }}>{panel.desc}</p>
      <div style={{ position: "relative", width: 330, height: 240 }} onClick={() => setSelected(null)}>
        <EdgeLayer layout={layout} edges={edges} selectedId={selected} hoverId={null} hoverLabels motion appearing={appearing} nodeCount={panel.nodes.length} />
        {panel.nodes.map((nd) => (
          <div
            key={nd.id}
            style={{ position: "absolute", left: nd.x, top: nd.y, width: W, height: H, cursor: "pointer" }}
            onClick={(ev) => { ev.stopPropagation(); setSelected(nd.id); }}
          >
            <NodeCard data={{ ...nd.data, state: selected === nd.id ? "selected" : "normal" }} />
          </div>
        ))}
      </div>
    </section>
  );
}

export function EdgePanels() {
  return (
    <main style={{ padding: 22, minHeight: "100vh", background: "var(--bg-canvas)", color: "var(--text-primary)" }}>
      <h1 style={{ fontSize: 19, fontWeight: 600, margin: "0 0 14px" }}>연결선 모양과 움직임 (개발용)</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 18, maxWidth: 1000 }}>
        {PANELS.map((p) => <PanelView key={p.title} panel={p} />)}
      </div>
    </main>
  );
}
