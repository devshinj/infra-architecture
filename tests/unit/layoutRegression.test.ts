import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";

// ELK 적재가 느려 파일 맨 위에서 불러 수집 단계에서 적재한다(tokens.test.ts 주석 참고).
import { buildDisplayGraph, defaultDisplayOptions } from "@/canvas/display";
import { layoutDiagram } from "@/canvas/layout";
import { defaultViewLayout, measureLayout, type LayoutMetrics } from "@/canvas/layoutMetrics";
import type { DiagramState } from "@/domain/types";
import { fx } from "../fixtures/spike";

// 기준선(baseline.json)은 일회성 스크립트로 잰 값이다. 단계마다 이 값보다 나빠지지 않아야 한다.
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
  const { layout, ends } = await defaultViewLayout(load(name));
  const m = measureLayout(layout, ends, 16);
  expect(m.crossings).toBeLessThanOrEqual(base.crossings);
  expect(m.parallelPx).toBeLessThanOrEqual(base.parallelPx);
  expect(m.throughNode).toBe(0);
  expect(m.bends).toBeLessThanOrEqual(base.bends * 1.05);
}, LIMIT);

test.each(Object.keys(baseline))("%s: 모두 펼친 화면은 기준선보다 나빠지지 않는다", async (name) => {
  const base = baseline[name].expanded;
  const st = load(name);
  const g = buildDisplayGraph(st, { ...defaultDisplayOptions(st), collapsed: new Set() });
  const layout = await layoutDiagram(g, {});
  const ends = Object.fromEntries(g.edges.map((e) => [e.id, [e.from, e.to] as [string, string]]));
  const m = measureLayout(layout, ends, 16);
  expect(m.parallelPx).toBeLessThanOrEqual(base.parallelPx);
  expect(m.crossings).toBeLessThanOrEqual(base.crossings * 1.05);
}, LIMIT);

// 평소 화면(샘플, 40개 이하 구성도, 접힌 기본 화면)에서는 서로 다른 선이 16px 미만으로 나란히 지나지 않는다.
// s1 은 빠진다: WAS 줄 아래 한 층에 외부 열로 가는 연결 4개가 몰려 16px 줄이 3개뿐이라, 다 벌리면 교차가
// 기준선을 넘는다. 외부 열 줄기를 다시 짜는 2단계 몫이며, 그때까지는 위 기준선 시험이 나빠지지 않게만 지킨다.
const EVERYDAY = ["s2", "s3", "s4", "s5", "state-25", "state-50", "state-100"];

test.each(EVERYDAY)("%s: default view has no parallel lines closer than 16px", async (name) => {
  const { layout, ends } = await defaultViewLayout(load(name));
  expect(measureLayout(layout, ends, 16).parallelPx).toBe(0);
}, LIMIT);
