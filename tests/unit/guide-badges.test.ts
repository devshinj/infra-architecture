import { afterEach, expect, test, vi } from "vitest";

import { getGuide } from "@/domain/guides";
import { learnBadges, type GuideRun } from "@/server/guide/runs";

// 앱 셸(layout)이 페이지마다 부르는 사이드바 학습 배지. DB 없이 읽는 함수만 바꿔 본다.
const SHOP = getGuide("shop")!;
const run = (diagramId: string, over: Partial<GuideRun> = {}) => ({
  diagramId,
  guideId: "shop",
  env: "onprem" as const,
  step: 2,
  stepVersions: [3, 4],
  envVersion: 2,
  marks: [],
  status: "active" as const,
  projectId: "p",
  diagramName: diagramId,
  ...over,
});

afterEach(() => {
  vi.restoreAllMocks();
});

test("active runs get a step badge; finished and quit runs get none", async () => {
  const badges = await learnBadges("u", async () => [run("a"), run("b", { status: "done" }), run("c", { status: "quit" }), run("d", { env: null, step: 0, stepVersions: [] })]);
  expect(badges).toEqual(new Map([["a", `학습 3/${SHOP.variants.onprem!.steps.length}`], ["d", "학습"]]));
});

test("the shell renders without learning badges when guide runs cannot be read", async () => {
  // 마이그레이션 전(guide_runs 없음) 등으로 못 읽어도 모든 페이지가 500 이 되지 않게 배지만 뺀다.
  const err = vi.spyOn(console, "error").mockImplementation(() => {});
  const badges = await learnBadges("u", async () => {
    throw new Error('relation "guide_runs" does not exist');
  });
  expect(badges).toEqual(new Map());
  expect(err).toHaveBeenCalledTimes(1);
});
