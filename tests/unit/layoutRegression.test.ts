import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";

// ELK 적재가 느려 파일 맨 위에서 불러 수집 단계에서 적재한다(tokens.test.ts 주석 참고).
import { buildDisplayGraph, defaultDisplayOptions } from "@/canvas/display";
import { defaultViewLayout, measureLayout, viewLayout, type LayoutMetrics } from "@/canvas/layoutMetrics";
import { applyCommands } from "@/domain/apply";
import type { Command } from "@/domain/commands";
import { emptyState, type DiagramState } from "@/domain/types";
import { fx } from "../fixtures/spike";

// 기준선(baseline.json)은 이중화 묶음 경계 합치기(2026-11-12, display.ts (4b))를 넣고 다시 잰 값이다. 단계마다 이 값보다
// 나빠지지 않아야 한다. 규칙: 기본 화면·모두 펼친 화면 모두 교차·평행·꺾임·이름 알약 통과는 기준선 이하(여유 없음),
// 노드 통과는 0.
// 1단계에서 받아들인 변화(이전 기준선 대비): state-100 펼친 화면 교차 201→207·꺾임 539→540.
// 묶음 합치기에서 받아들인 변화(사용자 결정): 교차·꺾임은 크게 줄었고(s1 교차 11→2, state-25 19→10·꺾임 71→45,
// state-100 펼친 화면 207→136·540→333), 외부 열로 가는 선의 평행만 늘었다(state-25 544→934, state-50 펼친 화면
// 548→4614·이름 알약 12→13, state-100 펼친 화면 942→2816). 외부 열 줄기가 16px 줄을 못 찾아 5px 로 물러서는 것이었다.
// 2단계(2026-11-12, 붐비는 틈 벌리기·같은 높이는 오른쪽 노드부터·교차 적은 세로 토막)로 다시 잼: 외부 열 평행은 모두 없어지고
// (state-25 934→88, state-50 펼친 화면 4614→0, state-100 펼친 화면 2816→0), 교차도 줄었다(s1 2→1, s4 29→26,
// state-25 10→2, state-100 펼친 화면 136→124). 꺾임은 그대로, 대신 붐비던 틈만큼 구성도가 16~32px 길어졌다.
// state-25 에 남은 88px 는 외부 연결이 아닌 부하 분산기 두 선이다.
// state-portal(2026-11-16, v4): 실제 사용자포털 구성도(식별 정보 걷어냄)를 기준 구성도로 넣었다. 연결선 경로·가독성 개선(feat/edge-routing)의 전후를 같은 구성도로 견주려는 것이다.
// 이름 자리 확보(2026-11-16, Task 3)로 다시 잼: 모든 기준 구성도의 기본·펼친 화면에서 평소 화면 이름 겹침(labelViolations) 0,
// 빠진 이름(labelMissing) 0 을 지킨다. 이름 자리 확보로 크기가 늘었다(사용자 결정). 꺾임은 그대로이고, 크기는 이중화 묶음 안
// 이름 있는 가로 연결의 두 노드 사이를 벌려 넓어지거나(s2 708→759·aspect 0.776→0.832, s4 1994→2168·1.462→1.589,
// s5 551→578·0.553→0.580, state-portal 1781→1880·1.038→1.096, 기본·펼친 화면 같음), 구성도 아래 끝 이름 상자만큼 높이가
// 늘었다(state-50 기본 436→443·2.214→2.179, state-100 기본 436→443·2.579→2.538, state-200 기본 436→443·2.586→2.545).
// 교차·평행·노드 통과·이름 알약은 모두 이전 값 그대로다.
// 모든 선 16px 띄우기(2026-11-16, Task 5, separate.ts)로 다시 잼: baseline.json 은 지금 값을 빠짐없이 적은 것이다(sharedPx·
// labelViolations·labelMissing 포함, 시험이 지키지 않는 값도). 평행은 모두 0 이 됐다(state-25 기본·펼친 화면 88→0, state-200
// 펼친 화면 480→0). 교차는 늘지 않았고 state-200 펼친 화면만 612→611 로 줄었다. 꺾임·노드 통과·이름 알약·이름 겹침·크기는
// 그대로다. 지키지 않는 sharedPx 는 민 토막이 같은 줄기 식구와 겹치는 만큼 늘었다(state-25 328→343, state-200 펼친 화면
// 227385→228561). state-100·state-200 기본의 sharedPx 70→79 는 Task 3(막힌 외부 연결 다시 그리기)에서 이미 바뀌었는데
// 기준선에 적지 않았던 것이다. state-portal 기본은 교차 0·평행 0 을 지킨다(브라우저 글자 폭으로만 보이는 붐빔은 Task 9 에서 본다).
// zoneHeadCrossings(펼친 영역 이름 알약 자리를 지나는 선)는 기하로만 잰다: 사용자 결정으로 알약을 연결선 위 층(ZoneNameLayer)에 그려
// 선이 알약 뒤로 지나가므로, 배치는 이 자리를 피하지 않는다.
const baseline = JSON.parse(readFileSync(join(process.cwd(), "tests/fixtures/layout/baseline.json"), "utf8")) as Record<
  string,
  { default: LayoutMetrics; expanded: LayoutMetrics }
>;

const load = (name: string): DiagramState =>
  name.startsWith("state-")
    ? (JSON.parse(readFileSync(join(process.cwd(), `tests/fixtures/layout/${name}.json`), "utf8")) as DiagramState)
    : fx(name);

const LIMIT = 30_000;

test.each(Object.keys(baseline))("%s: 기본 화면은 기준선보다 나빠지지 않는다", async (name) => {
  const base = baseline[name].default;
  const { layout, ends, groupLabels, labels } = await defaultViewLayout(load(name));
  const m = measureLayout(layout, ends, 16, groupLabels, labels);
  expect(m.labelViolations).toBe(0);
  expect(m.labelMissing).toBe(0);
  expect(m.crossings).toBeLessThanOrEqual(base.crossings);
  // 평소 화면에서는 서로 다른 선이 16px 미만으로 나란히 지나지 않는다(모든 기준 구성도).
  expect(m.parallelPx).toBe(0);
  expect(m.throughNode).toBe(0);
  expect(m.bends).toBeLessThanOrEqual(base.bends);
  expect(m.zoneHeadCrossings).toBeLessThanOrEqual(base.zoneHeadCrossings);
}, LIMIT);

test.each(Object.keys(baseline))("%s: 모두 펼친 화면은 기준선보다 나빠지지 않는다", async (name) => {
  const base = baseline[name].expanded;
  const st = load(name);
  const { layout, ends, groupLabels, labels } = await viewLayout(buildDisplayGraph(st, { ...defaultDisplayOptions(st), collapsed: new Set() }));
  const m = measureLayout(layout, ends, 16, groupLabels, labels);
  expect(m.labelViolations).toBe(0);
  expect(m.labelMissing).toBe(0);
  expect(m.parallelPx).toBeLessThanOrEqual(base.parallelPx);
  expect(m.crossings).toBeLessThanOrEqual(base.crossings);
  expect(m.throughNode).toBe(0);
  expect(m.bends).toBeLessThanOrEqual(base.bends);
  expect(m.zoneHeadCrossings).toBeLessThanOrEqual(base.zoneHeadCrossings);
}, LIMIT);

// 사용자포털 구성도(실제 구성도) 기본 화면: 교차 0, 16px 미만 평행 0.
test("state-portal: default view has no crossings and no parallel lines closer than 16px", async () => {
  const { layout, ends } = await defaultViewLayout(load("state-portal"));
  const m = measureLayout(layout, ends, 16);
  expect(m.crossings).toBe(0);
  expect(m.parallelPx).toBe(0);
}, LIMIT);

// 외부 열로 몰리는 연결. 기준값은 455fd67(이 단계 전) 배치로 잰 교차·꺾임이다. 16px 를 지키려다 꺾은선(degraded)이
// 생기거나, 선이 노드를 지나거나, 교차·꺾임이 늘면 안 된다(그럴 때는 예전 간격을 쓴다).
const LANE_HEAD: Command[] = [
  { op: "add_group", id: "vpc", group_kind: "vpc", label: "VPC", parent: null },
  { op: "add_group", id: "ext", group_kind: "external_service", label: "외부", parent: null },
];
function fanIn(n: number, chain: boolean): Command[] {
  const c: Command[] = [...LANE_HEAD, { op: "add_node", id: "x", kind: "external_api", label: "API", parent: "ext" }];
  for (let i = 0; i < n; i++) {
    c.push({ op: "add_node", id: `m${i}`, kind: "app_server", label: `APP-${i}`, parent: "vpc" });
    c.push({ op: "add_edge", from: `m${i}`, to: "x", edge_kind: "request" });
  }
  if (chain) for (let i = 1; i < n; i++) c.push({ op: "add_edge", from: `m${i - 1}`, to: `m${i}`, edge_kind: "request" });
  return c;
}
function oneToMany(k: number): Command[] {
  const c: Command[] = [
    ...LANE_HEAD,
    { op: "add_node", id: "m", kind: "app_server", label: "APP", parent: "vpc" },
    { op: "add_node", id: "db", kind: "db_rdb", label: "DB", parent: "vpc" },
    { op: "add_node", id: "lb", kind: "load_balancer", label: "LB", parent: "vpc" },
    { op: "add_edge", from: "lb", to: "m", edge_kind: "request" },
    { op: "add_edge", from: "m", to: "db", edge_kind: "request" },
  ];
  for (let i = 0; i < k; i++) {
    c.push({ op: "add_node", id: `x${i}`, kind: "external_api", label: `API-${i}`, parent: "ext" });
    c.push({ op: "add_edge", from: "m", to: `x${i}`, edge_kind: "request" });
  }
  return c;
}
const LANE_CASES: [string, Command[], { crossings: number; bends: number }][] = [
  ["1 main → 4 external", oneToMany(4), { crossings: 6, bends: 15 }],
  ["4 main → 1 external", fanIn(4, false), { crossings: 4, bends: 12 }],
  ["5 main → 1 external", fanIn(5, false), { crossings: 8, bends: 15 }],
  ["6 main → 1 external", fanIn(6, false), { crossings: 10, bends: 18 }],
  ["8 main → 1 external", fanIn(8, false), { crossings: 18, bends: 24 }],
  ["4-chain → 1 external", fanIn(4, true), { crossings: 0, bends: 12 }],
  ["5-chain → 1 external", fanIn(5, true), { crossings: 0, bends: 15 }],
  ["8-chain → 1 external", fanIn(8, true), { crossings: 0, bends: 24 }],
];

test.each(LANE_CASES)("%s: no degraded edge, no line through a node, no more crossings or bends", async (_name, cmds, base) => {
  const { state, errors } = applyCommands(emptyState(), cmds);
  expect(errors).toEqual([]);
  const { layout, ends } = await defaultViewLayout(state);
  const m = measureLayout(layout, ends, 16);
  expect(layout.edges.filter((e) => e.degraded)).toEqual([]);
  expect(m.throughNode).toBe(0);
  expect(m.crossings).toBeLessThanOrEqual(base.crossings);
  expect(m.bends).toBeLessThanOrEqual(base.bends);
}, LIMIT);
