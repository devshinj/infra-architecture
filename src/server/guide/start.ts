import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { diagrams } from "@/db/schema";
import { getGuide, guideEnvs } from "@/domain/guides";
import { stepFlowIds } from "@/domain/guides/apply";
import { ENV_LABEL, type AuthoredExplains, type GuideEnv } from "@/domain/guides/types";
import { guideView, type GuideView } from "@/domain/guides/view";
import { emptyState } from "@/domain/types";
import { BUSY_MESSAGE } from "@/server/chat/busy";
import { USER_TURN_LOCK_WAIT_MS, withDiagramLock } from "@/server/chat/lock";
import { createMessage } from "@/server/chat/messages";
import { saveAuthoredExplanations } from "@/server/explain";
import { deleteGuideFlows } from "@/server/flows";
import { createDiagramWithFreeName, createProject, findProjectByName, getOwnedDiagram, ValidationError } from "@/server/projects";
import { getLatestState } from "@/server/versions";

import { createGuideRun, getLiveGuideRun, saveGuideRun, type GuideRun } from "./runs";
import { confirmGuideEnv, quietMeta } from "./turn";

/** 학습 구성도를 모아 두는 프로젝트 이름. 없으면 만든다(대소문자 무시로 찾는다). */
export const LEARNING_PROJECT_NAME = "학습";
export const GUIDE_QUIT_MESSAGE = "학습을 그만뒀어요. 이제 자유롭게 고칠 수 있어요.";
const UNKNOWN_GUIDE_MESSAGE = "없는 학습 주제예요.";
const UNKNOWN_ENV_MESSAGE = "이 주제에는 그 환경이 없어요.";

/** "학습" 프로젝트를 찾거나 만든다. 동시에 만든 요청에 이름을 빼앗기면 다시 찾는다. */
async function learningProjectId(userId: string): Promise<string> {
  const found = await findProjectByName(userId, LEARNING_PROJECT_NAME);
  if (found) return found.id;
  try {
    return (await createProject(userId, LEARNING_PROJECT_NAME)).id;
  } catch (e) {
    const again = e instanceof ValidationError ? await findProjectByName(userId, LEARNING_PROJECT_NAME) : null;
    if (again) return again.id;
    throw e;
  }
}

/**
 * 학습을 시작한다: "학습" 프로젝트에 빈 구성도를 만들고(이름 겹치면 copyName) 진행 상태를 만든다.
 * env 가 없으면 환경을 묻는 첫 메시지를, 있으면 환경을 바로 확정하고 confirmGuideEnv 의 안내 하나를 남긴다(R3).
 * 없는 주제·환경이면 아무것도 만들지 않고 ValidationError. 새 구성도라 잠금은 필요 없다.
 */
export async function startGuide(userId: string, guideId: string, env: GuideEnv | null): Promise<{ projectId: string; diagramId: string }> {
  const guide = typeof guideId === "string" ? getGuide(guideId) : undefined;
  if (!guide) throw new ValidationError(UNKNOWN_GUIDE_MESSAGE);
  const envChoices = guideEnvs(guide);
  if (env !== null && !envChoices.includes(env)) throw new ValidationError(UNKNOWN_ENV_MESSAGE);

  const projectId = await learningProjectId(userId);
  const name = env === null ? guide.title : `${guide.title} (${ENV_LABEL[env]})`;
  const diagram = await createDiagramWithFreeName(userId, projectId, name);
  try {
    const run = await createGuideRun({ diagramId: diagram.id, guideId: guide.id, env: null });
    const state = emptyState();
    if (env === null) {
      const content = `${guide.envIntro}\n값은 예시입니다.`;
      await createMessage(diagram.id, "assistant", content, { guide: { kind: "env", envChoices }, says: [content], ...quietMeta(state) });
    } else {
      await confirmGuideEnv(diagram.id, run, env, state, null, { guide });
    }
  } catch (e) {
    // 반쯤 만든 학습 구성도를 남기지 않는다(진행 상태·메시지·버전은 구성도와 함께 지워진다).
    try {
      await db.delete(diagrams).where(eq(diagrams.id, diagram.id));
    } catch (cleanup) {
      console.error("[guide] start cleanup failed", diagram.id, cleanup);
    }
    throw e;
  }
  return { projectId, diagramId: diagram.id };
}

/** 학습을 그만둔다. 대화 차례와 겹치지 않게 구성도 잠금 안에서 한다. 이미 끝났거나 그만둔 학습이면 아무것도 하지 않는다. */
export async function quitGuide(userId: string, diagramId: string): Promise<void> {
  await getOwnedDiagram(userId, diagramId);
  const locked = await withDiagramLock(
    diagramId,
    async () => {
      const run = await getLiveGuideRun(diagramId);
      if (run?.status !== "active") return;
      await saveGuideRun({ ...run, status: "quit" });
      await createMessage(diagramId, "system", GUIDE_QUIT_MESSAGE);
    },
    { waitMs: USER_TURN_LOCK_WAIT_MS },
  );
  if (!locked.ok) throw new ValidationError(BUSY_MESSAGE);
}

/**
 * 학습 중 이력에서 restoredFrom 버전으로 되돌린 뒤 진행 상태를 맞춘다. active 일 때만, 구성도 잠금 안에서.
 * - 환경 확정 버전보다 앞이면 환경부터 다시 묻는다(env null·step 0, 대본 흐름 전부 삭제).
 * - 아니면 그 버전까지 끝낸 단계 수로 step 을 맞추고, 그 뒤 단계가 넣은 흐름을 지운다.
 * 그 뒤 지금 상태(되돌린 상태)의 서명으로 끝낸 단계들의 대본 설명을 다시 넣는다. 새 GuideView(아니면 null)를 돌려준다.
 */
export async function syncGuideAfterRestore(diagramId: string, restoredFrom: number): Promise<GuideView | null> {
  const locked = await withDiagramLock(diagramId, () => syncLocked(diagramId, restoredFrom), { waitMs: USER_TURN_LOCK_WAIT_MS });
  if (!locked.ok) throw new ValidationError(BUSY_MESSAGE);
  return locked.value;
}

async function syncLocked(diagramId: string, restoredFrom: number): Promise<GuideView | null> {
  const run = await getLiveGuideRun(diagramId);
  if (run?.status !== "active") return null;
  const guide = getGuide(run.guideId);
  if (!guide) return null; // getLiveGuideRun 이 이미 quit 로 바꾼다. 타입을 좁히려고 한 번 더 본다.
  const variant = run.env ? guide.variants[run.env] : undefined;

  let next: GuideRun;
  let dropFlows: string[];
  if (run.envVersion !== null && restoredFrom < run.envVersion) {
    next = { ...run, env: null, envVersion: null, step: 0, stepVersions: [] };
    dropFlows = variant ? stepFlowIds(variant, 0) : [];
  } else {
    const step = run.stepVersions.filter((v) => v <= restoredFrom).length;
    next = { ...run, step, stepVersions: run.stepVersions.slice(0, step) };
    dropFlows = variant ? stepFlowIds(variant, step) : [];
  }
  await db.transaction(async (tx) => {
    await saveGuideRun(next, tx);
    await deleteGuideFlows(diagramId, dropFlows, tx);
  });

  if (variant && next.step > 0) {
    const state = (await getLatestState(diagramId))?.state ?? emptyState();
    const explains: AuthoredExplains = Object.assign({}, ...variant.steps.slice(0, next.step).map((s) => s.explains));
    try {
      await saveAuthoredExplanations(diagramId, state, explains);
    } catch (err) {
      console.error("[guide] save explanations failed", err);
    }
  }
  return guideView(next, guide);
}

/** 구성도 화면이 보일 학습 상태. 범위를 넘은 run 은 여기서 quit 로 바뀐다(getLiveGuideRun). 학습이 없거나 대본이 없으면 null. */
export async function liveGuideView(diagramId: string): Promise<GuideView | null> {
  const run = await getLiveGuideRun(diagramId);
  const guide = run ? getGuide(run.guideId) : undefined;
  return run && guide ? guideView(run, guide) : null;
}
