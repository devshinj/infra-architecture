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
  const { layout, ends, groupLabels } = await defaultViewLayout(load(name));
  const m = measureLayout(layout, ends, 16, groupLabels);
  expect(m.crossings).toBeLessThanOrEqual(base.crossings);
  expect(m.parallelPx).toBeLessThanOrEqual(base.parallelPx);
  expect(m.throughNode).toBe(0);
  expect(m.bends).toBeLessThanOrEqual(base.bends);
  expect(m.zoneHeadCrossings).toBeLessThanOrEqual(base.zoneHeadCrossings);
}, LIMIT);

test.each(Object.keys(baseline))("%s: 모두 펼친 화면은 기준선보다 나빠지지 않는다", async (name) => {
  const base = baseline[name].expanded;
  const st = load(name);
  const { layout, ends, groupLabels } = await viewLayout(buildDisplayGraph(st, { ...defaultDisplayOptions(st), collapsed: new Set() }));
  const m = measureLayout(layout, ends, 16, groupLabels);
  expect(m.parallelPx).toBeLessThanOrEqual(base.parallelPx);
  expect(m.crossings).toBeLessThanOrEqual(base.crossings);
  expect(m.throughNode).toBe(0);
  expect(m.bends).toBeLessThanOrEqual(base.bends);
  expect(m.zoneHeadCrossings).toBeLessThanOrEqual(base.zoneHeadCrossings);
}, LIMIT);

// 평소 화면(샘플, 40개 이하 구성도, 접힌 기본 화면)에서는 서로 다른 선이 16px 미만으로 나란히 지나지 않는다.
// state-25 는 빠진다: 외부 열 줄기는 2단계에서 풀렸지만, 부하 분산기에서 WAS 두 대로 가는 두 선(ELK 배치)이 15.8px 로
// 나란한 88px 가 남는다. 위 기준선 시험이 나빠지지 않게만 지킨다.
// s1 은 묶음 경계 합치기로 WAS 줄 아래에 몰리던 연결이 줄어 0 이 되어 들어왔다.
const EVERYDAY = ["s1", "s2", "s3", "s4", "s5", "state-50", "state-100"];

test.each(EVERYDAY)("%s: default view has no parallel lines closer than 16px", async (name) => {
  const { layout, ends } = await defaultViewLayout(load(name));
  expect(measureLayout(layout, ends, 16).parallelPx).toBe(0);
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
