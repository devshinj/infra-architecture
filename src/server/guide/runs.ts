import { eq } from "drizzle-orm";

import { db, type Tx } from "@/db/client";
import { diagrams, guideRuns, projects, type GuideMark } from "@/db/schema";
import { getGuide } from "@/domain/guides";
import { learnBadge } from "@/domain/guides/progress";
import type { GuideEnv } from "@/domain/guides/types";
import { guideView } from "@/domain/guides/view";
import { ValidationError } from "@/server/projects";

export interface GuideRun {
  diagramId: string;
  guideId: string;
  env: GuideEnv | null;
  step: number;
  stepVersions: number[];
  envVersion: number | null;
  /** 가이드가 만든 버전의 기록(버전 번호 순). */
  marks: GuideMark[];
  status: "active" | "done" | "quit";
}

export type { GuideMark };

export const LEARNING_LOCKED_MESSAGE = "학습 중에는 바꿀 수 없어요. 학습을 그만두면 바꿀 수 있어요.";
export const GUIDE_BROKEN_MESSAGE = "가이드가 바뀌어 이어갈 수 없어요. 처음부터 다시 해 주세요.";

type Row = typeof guideRuns.$inferSelect;

function toRun(r: Row): GuideRun {
  return {
    diagramId: r.diagramId,
    guideId: r.guideId,
    env: r.env,
    step: r.step,
    stepVersions: r.stepVersions,
    envVersion: r.envVersion,
    marks: r.marks,
    status: r.status,
  };
}

export async function getGuideRun(diagramId: string, tx?: Tx): Promise<GuideRun | null> {
  const [row] = await (tx ?? db).select().from(guideRuns).where(eq(guideRuns.diagramId, diagramId));
  return row ? toRun(row) : null;
}

/** 새 학습을 시작한다. 이미 있는 행(그만뒀거나 끝난 것)은 처음 상태로 덮어쓴다. */
export async function createGuideRun(
  run: Pick<GuideRun, "diagramId" | "guideId" | "env">,
  tx?: Tx,
): Promise<GuideRun> {
  const fresh = { guideId: run.guideId, env: run.env, step: 0, stepVersions: [], envVersion: null, marks: [], status: "active" as const };
  const [row] = await (tx ?? db)
    .insert(guideRuns)
    .values({ diagramId: run.diagramId, ...fresh })
    .onConflictDoUpdate({ target: guideRuns.diagramId, set: { ...fresh, updatedAt: new Date() } })
    .returning();
  return toRun(row);
}

export async function saveGuideRun(run: GuideRun, tx?: Tx): Promise<void> {
  await (tx ?? db)
    .update(guideRuns)
    .set({
      guideId: run.guideId,
      env: run.env,
      step: run.step,
      stepVersions: run.stepVersions,
      envVersion: run.envVersion,
      marks: run.marks,
      status: run.status,
      updatedAt: new Date(),
    })
    .where(eq(guideRuns.diagramId, run.diagramId));
}

function outOfRange(run: GuideRun): boolean {
  const guide = getGuide(run.guideId);
  if (!guide) return true;
  if (run.env === null) return run.step !== 0;
  const variant = guide.variants[run.env];
  if (!variant) return true;
  return run.step >= variant.steps.length;
}

/** active 인데 대본이 없거나(getGuide) env 의 variant 가 없거나 step 이 단계 수를 넘으면 quit 로 저장하고 그 상태를 돌려준다. */
export async function getLiveGuideRun(diagramId: string, tx?: Tx): Promise<GuideRun | null> {
  const run = await getGuideRun(diagramId, tx);
  if (!run || run.status !== "active" || !outOfRange(run)) return run;
  const quit: GuideRun = { ...run, status: "quit" };
  await saveGuideRun(quit, tx);
  return quit;
}

export async function isLearning(diagramId: string): Promise<boolean> {
  return (await getLiveGuideRun(diagramId))?.status === "active";
}

/** 학습 중이면 ValidationError(LEARNING_LOCKED_MESSAGE). */
export async function assertNotLearning(diagramId: string): Promise<void> {
  if (await isLearning(diagramId)) throw new ValidationError(LEARNING_LOCKED_MESSAGE);
}

export async function listGuideRuns(userId: string): Promise<(GuideRun & { projectId: string; diagramName: string })[]> {
  const rows = await db
    .select({ run: guideRuns, projectId: projects.id, diagramName: diagrams.name })
    .from(guideRuns)
    .innerJoin(diagrams, eq(diagrams.id, guideRuns.diagramId))
    .innerJoin(projects, eq(projects.id, diagrams.projectId))
    .where(eq(projects.ownerId, userId));
  return rows.map((r) => ({ ...toRun(r.run), projectId: r.projectId, diagramName: r.diagramName }));
}

/**
 * 사이드바 학습 배지: 학습 중인 구성도 id → "학습 3/12". 앱 셸이 페이지마다 부르므로, 진행 상태를 못 읽어도
 * (마이그레이션 전 등) 셸을 막지 않는다: 오류를 남기고 배지 없이(빈 Map) 그린다. load 는 테스트에서만 바꾼다.
 */
export async function learnBadges(userId: string, load: (userId: string) => Promise<GuideRun[]> = listGuideRuns): Promise<Map<string, string>> {
  const badges = new Map<string, string>();
  let runs: GuideRun[];
  try {
    runs = await load(userId);
  } catch (err) {
    console.error("[guide] learn badges failed", err);
    return badges;
  }
  for (const r of runs) {
    const guide = r.status === "active" ? getGuide(r.guideId) : undefined;
    if (guide) badges.set(r.diagramId, learnBadge(guideView(r, guide)));
  }
  return badges;
}
