import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { diagramVersions, diagrams, type GuideMark } from "@/db/schema";
import { getGuide, guideEnvs } from "@/domain/guides";
import { stepFlowIds } from "@/domain/guides/apply";
import { ENV_LABEL, type AuthoredExplains, type Guide, type GuideEnv } from "@/domain/guides/types";
import { guideView, type GuideView } from "@/domain/guides/view";
import { emptyState } from "@/domain/types";
import { BUSY_MESSAGE } from "@/server/chat/busy";
import { USER_TURN_LOCK_WAIT_MS, withDiagramLock } from "@/server/chat/lock";
import { createMessage } from "@/server/chat/messages";
import { saveAuthoredExplanations } from "@/server/explain";
import { deleteGuideFlows } from "@/server/flows";
import { createDiagramWithFreeName, createProject, findProjectByName, getOwnedDiagram, ValidationError } from "@/server/projects";
import { getLatestState, restoreVersionWithMessage, type RestoreMessageOpts } from "@/server/versions";

import { createGuideRun, getLiveGuideRun, saveGuideRun, type GuideRun } from "./runs";
import { confirmGuideEnv, quietMeta } from "./turn";

/** 학습 구성도를 모아 두는 프로젝트 이름. 없으면 만든다(대소문자 무시로 찾는다). */
export const LEARNING_PROJECT_NAME = "학습";
export const GUIDE_QUIT_MESSAGE = "학습을 그만뒀어요. 이제 자유롭게 고칠 수 있어요.";
/** 첫 대화에 붙이는 가상 값 안내. */
const EXAMPLE_NOTE = "값은 예시입니다.";
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
 * 어느 쪽이든 첫 메시지 끝에 "값은 예시입니다." 한 줄이 붙는다.
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
      const content = `${guide.envIntro}\n${EXAMPLE_NOTE}`;
      await createMessage(diagram.id, "assistant", content, { guide: { kind: "env", envChoices }, says: [content], ...quietMeta(state) });
    } else {
      await confirmGuideEnv(diagram.id, run, env, state, null, { guide, note: EXAMPLE_NOTE });
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
 * 학습 중 이력에서 restoredFrom 버전으로 되돌린 뒤 진행 상태를 그 버전의 단계로 맞춘다(되돌리기·다시 하기 모두).
 * 구성도 잠금을 스스로 잡는다. 되돌리기와 함께 한 잠금 안에서 하려면 restoreGuideVersion 을 쓴다.
 */
export async function syncGuideAfterRestore(diagramId: string, restoredFrom: number): Promise<GuideView | null> {
  const locked = await withDiagramLock(diagramId, () => syncGuideLocked(diagramId, restoredFrom), { waitMs: USER_TURN_LOCK_WAIT_MS });
  if (!locked.ok) throw new ValidationError(BUSY_MESSAGE);
  return locked.value;
}

/**
 * 학습 중에 이력에서 되돌린다: 구성도 잠금 안에서 되돌리기(시스템 메시지 포함)와 단계 맞추기를 함께 한다.
 * 잠금을 못 잡으면(대화 차례가 도는 중) 아무것도 되돌리지 않고 { ok: false }.
 */
export async function restoreGuideVersion(
  diagramId: string,
  number: number,
  opts: RestoreMessageOpts = {},
): Promise<{ ok: true; number: number; text: string; guide: GuideView | null } | { ok: false }> {
  const locked = await withDiagramLock(
    diagramId,
    async () => {
      const r = await restoreVersionWithMessage(diagramId, number, opts);
      return { ...r, guide: await syncGuideLocked(diagramId, number) };
    },
    { waitMs: USER_TURN_LOCK_WAIT_MS },
  );
  return locked.ok ? { ok: true, ...locked.value } : { ok: false };
}

/**
 * restoredFrom 이 어느 가이드 버전인지 찾는다. 되돌리기로 만든 버전이면 그 원본(restoredFrom)을 따라간다.
 * 가이드가 만든 버전에 닿지 못하면(환경 확정 전 버전 등) null.
 */
async function resolveMark(diagramId: string, marks: GuideMark[], restoredFrom: number): Promise<GuideMark | null> {
  const byVersion = new Map(marks.map((m) => [m.version, m]));
  const rows = await db
    .select({ number: diagramVersions.number, restoredFrom: diagramVersions.restoredFrom })
    .from(diagramVersions)
    .where(eq(diagramVersions.diagramId, diagramId));
  const origin = new Map(rows.map((r) => [r.number, r.restoredFrom]));
  const seen = new Set<number>();
  for (let v: number | null | undefined = restoredFrom; v != null && !seen.has(v); v = origin.get(v)) {
    const mark = byVersion.get(v);
    if (mark) return mark;
    seen.add(v);
  }
  return null;
}

/** 대본 어느 환경에서든 add_flow 하는 흐름 id 전부. */
const allScriptFlowIds = (guide: Guide) => new Set(guideEnvs(guide).flatMap((e) => stepFlowIds(guide.variants[e]!, 0)));

/**
 * 잠금을 쥔 호출자가 부른다. active 일 때만 진행 상태를 restoredFrom 버전의 기록(marks)으로 맞춘다.
 * - 가이드 버전(되돌리기 원본을 따라가 찾은 것)이면 그 버전의 env·envVersion·stepVersions·step 으로.
 * - 아니면(환경 확정 전) 환경부터 다시 묻는다: env null·step 0.
 * 맞춘 단계 이후(다른 환경 대본 포함)가 넣는 흐름은 지우고, 지금 상태(되돌린 상태)의 서명으로 끝낸 단계들의 대본 설명을 다시 넣는다.
 * 새 GuideView(학습 중이 아니면 null)를 돌려준다.
 */
export async function syncGuideLocked(diagramId: string, restoredFrom: number): Promise<GuideView | null> {
  const run = await getLiveGuideRun(diagramId);
  if (run?.status !== "active") return null;
  const guide = getGuide(run.guideId);
  if (!guide) return null; // getLiveGuideRun 이 이미 quit 로 바꾼다. 타입을 좁히려고 한 번 더 본다.

  const found = await resolveMark(diagramId, run.marks, restoredFrom);
  const mark = found && guide.variants[found.env] ? found : null;
  const variant = mark ? guide.variants[mark.env] : undefined;
  const next: GuideRun = mark
    ? { ...run, env: mark.env, envVersion: mark.envVersion, stepVersions: mark.stepVersions, step: mark.stepVersions.length }
    : { ...run, env: null, envVersion: null, step: 0, stepVersions: [] };
  // 남길 흐름: 맞춘 환경에서 끝낸 단계가 넣은 것. 나머지 대본 흐름(뒤 단계·다른 환경)은 지운다.
  const keep = new Set(variant ? stepFlowIds({ ...variant, steps: variant.steps.slice(0, next.step) }, 0) : []);
  const dropFlows = [...allScriptFlowIds(guide)].filter((id) => !keep.has(id));
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
