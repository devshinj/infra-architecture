import { expect, test } from "vitest";

import type { Layout, LaidOutGroup, LaidOutNode } from "@/canvas/layout";
// ELK 적재가 느려 파일 맨 위에서 불러 수집 단계에서 적재한다(tokens.test.ts 주석 참고).
import { measureLayout, NAME_PX } from "@/canvas/layoutMetrics";
import { textWidth } from "@/canvas/text";

const line = (id: string, ...pts: [number, number][]) => ({ id, points: pts.map(([x, y]) => ({ x, y })) });
const lay = (edges: Layout["edges"], nodes: Record<string, LaidOutNode> = {}): Layout => ({ nodes, groups: {}, edges, width: 200, height: 100 });
const ends: Record<string, [string, string]> = { a: ["n1", "n2"], b: ["n3", "n4"] };

test("parallel lines 12px apart over 100px count as 100 parallel px", () => {
  const m = measureLayout(lay([line("a", [0, 0], [0, 116]), line("b", [12, 0], [12, 116])]), ends);
  expect(m.parallelPx).toBe(100);
  expect(m.sharedPx).toBe(0);
});

test("lines 16px apart are not parallel", () => {
  const m = measureLayout(lay([line("a", [0, 0], [0, 116]), line("b", [16, 0], [16, 116])]), ends);
  expect(m.parallelPx).toBe(0);
});

test("identical segments count as shared, not parallel", () => {
  const m = measureLayout(lay([line("a", [0, 0], [0, 116]), line("b", [0, 0], [0, 116])]), ends);
  expect(m.sharedPx).toBeGreaterThan(0);
  expect(m.parallelPx).toBe(0);
});

test("perpendicular crossing counts once", () => {
  const m = measureLayout(lay([line("a", [0, 50], [100, 50]), line("b", [50, 0], [50, 100])]), ends);
  expect(m.crossings).toBe(1);
});

test("edge through a non-endpoint node is counted", () => {
  const node = (id: string, x: number): LaidOutNode => ({ id, x, y: 40, width: 20, height: 20, parent: null, displayLabel: id });
  const nodes = { n1: node("n1", 0), n2: node("n2", 180), mid: node("mid", 90) };
  const m = measureLayout(lay([line("a", [10, 50], [190, 50])], nodes), { a: ["n1", "n2"] });
  expect(m.throughNode).toBe(1);
});

test("edges through an expanded zone's name pill are counted once per pill", () => {
  // 영역 z(0,0 에서 400×200)는 안에 노드 n 이 있어 펼친 영역이다. 이름 알약은 x 10~(28+글자 폭), y 0~30.
  const pillRight = 10 + 18 + textWidth("공개 서브넷", NAME_PX);
  const node = (id: string, x: number, y: number, parent: string | null): LaidOutNode => ({ id, x, y, width: 20, height: 20, parent, displayLabel: id });
  const groups: Record<string, LaidOutGroup> = { z: { id: "z", x: 0, y: 0, width: 400, height: 200, parent: null } };
  const nodes = { n: node("n", 300, 150, "z"), p: node("p", 500, 0, null), q: node("q", 500, 100, null) };
  const layout: Layout = {
    nodes,
    groups,
    edges: [
      line("a", [20, -40], [20, 15], [20, 60]), // 알약을 세로로 지난다(마디 둘이 지나도 한 번)
      line("b", [-20, 15], [pillRight + 20, 15]), // 알약을 가로로 지난다
      line("c", [pillRight + 5, -40], [pillRight + 5, 60]), // 알약 오른쪽 바깥
      line("d", [-20, 40], [380, 40]), // 머리 칸 아래
      line("e", [20, -40], [20, 60]), // 끝점이 영역 z 인 선은 세지 않는다
    ],
    width: 600,
    height: 300,
  };
  const ends: Record<string, [string, string]> = { a: ["p", "q"], b: ["p", "q"], c: ["p", "q"], d: ["p", "q"], e: ["z", "p"] };
  expect(measureLayout(layout, ends, 16, { z: "공개 서브넷" }).zoneHeadCrossings).toBe(2);
  // 이름을 모르면 잴 수 없어 세지 않는다.
  expect(measureLayout(layout, ends, 16).zoneHeadCrossings).toBe(0);
  // 안에 아무것도 없는(접힌) 영역은 노드 통과로 세고 알약으로는 세지 않는다.
  const collapsed = { ...layout, nodes: { p: nodes.p, q: nodes.q } };
  expect(measureLayout(collapsed, ends, 16, { z: "공개 서브넷" }).zoneHeadCrossings).toBe(0);
});
