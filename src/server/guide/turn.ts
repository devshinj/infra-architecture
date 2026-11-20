import { db } from "@/db/client";
import { isStructural, type Command } from "@/domain/commands";
import { getGuide, guideEnvs } from "@/domain/guides";
import { applyGuideStep, confirmEnvironment } from "@/domain/guides/apply";
import { decideStep, findConflict, readEnv, type StepVerdict } from "@/domain/guides/judge";
import { ENV_LABEL, type AuthoredExplains, type Guide, type GuideEnv, type GuideStep, type GuideVariant } from "@/domain/guides/types";
import { guideView } from "@/domain/guides/view";
import { euro } from "@/domain/josa";
import { computeMissing } from "@/domain/missing";
import type { NetworkKnowledge } from "@/domain/network";
import type { DiagramState } from "@/domain/types";
import { warningDelta } from "@/domain/warnings";
import { doneEvent, type ChatEvent, type MessageMeta } from "@/server/chat/events";
import { createMessage } from "@/server/chat/messages";
import { checkWarnings } from "@/server/chat/warnings";
import { saveAuthoredExplanations } from "@/server/explain";
import { saveGuideFlows } from "@/server/flows";
import type { ClefClient } from "@/server/llm/clef";
import { createVersion } from "@/server/versions";

import { askClef } from "./judge";
import { GUIDE_BROKEN_MESSAGE, saveGuideRun, type GuideRun } from "./runs";

export type GuideTurnOutcome = { handled: true } | { handled: false; intent: "question" };

export interface GuideTurnArgs {
  userId: string;
  diagramId: string;
  text: string;
  userMessageId: string;
  state: DiagramState;
  knowledge: NetworkKnowledge | null;
  run: GuideRun;
  signal: AbortSignal;
  emit(e: ChatEvent): void;
}

export interface GuideTurnDeps {
  clef: ClefClient;
  /** 대본 찾기. 테스트에서만 바꾼다(기본 getGuide). */
  guides?: (id: string) => Guide | undefined;
}

const HANDLED: GuideTurnOutcome = { handled: true };

const counts = (s: DiagramState) => ({ nodes: Object.keys(s.nodes).length, edges: Object.keys(s.edges).length });

/** 구성을 바꾸지 않은 학습 글의 메타. 요약 칩이 생기지 않게 changed 0·version null 로 둔다. */
export const quietMeta = (s: DiagramState): MessageMeta => ({ applied: 0, changed: 0, skipped: 0, version: null, status: "complete", ...counts(s) });

/** 구성을 바꾸지 않은 차례의 done(버전 없음). applied 는 환경 가정처럼 바꾸었어도 구성이 아닌 명령 수. */
function quietDone(s: DiagramState, knowledge: NetworkKnowledge | null, assistantMessageId: string, applied = 0): ChatEvent {
  return doneEvent({
    version: null,
    status: "complete",
    applied,
    changed: 0,
    skipped: 0,
    missing: computeMissing(s, knowledge ?? undefined).count,
    ...counts(s),
    assistantMessageId,
  });
}

/**
 * 환경 확정: 환경 가정 확정 → 버전(summary "학습: 환경 <라벨>") → run.env·envVersion 저장(버전과 같은 트랜잭션)
 * → assistant 메시지 "<라벨>(으)로 진행합니다. …"(meta.guide 없음 — 단계 안내는 카드가 GuideView 로 보인다).
 * 학습 차례와 학습 시작이 같이 쓴다. opts.guide 를 주지 않으면 getGuide 로 찾는다. 없는 대본·환경이면 throw.
 * opts.note 를 주면 안내 끝에 한 줄로 붙인다(학습 시작의 "값은 예시입니다."). 이 버전은 진행 기록(marks)에 남긴다.
 */
export async function confirmGuideEnv(
  diagramId: string,
  run: GuideRun,
  env: GuideEnv,
  state: DiagramState,
  messageId: string | null,
  opts: { guide?: Guide; note?: string } = {},
): Promise<{ run: GuideRun; version: number; cmd: Command; state: DiagramState; text: string; assistantMessageId: string }> {
  const variant = (opts.guide ?? getGuide(run.guideId))?.variants[env];
  if (!variant) throw new Error(`guide variant not found: ${run.guideId}/${env}`);
  const { state: next, cmd } = confirmEnvironment(state, variant.environment);
  const label = ENV_LABEL[env];
  const saved = await db.transaction(async (tx) => {
    const v = await createVersion(diagramId, next, { source: "ai", ...(messageId ? { messageId } : {}), summary: `학습: 환경 ${label}`, tx });
    const mark = { version: v.number, env, envVersion: v.number, stepVersions: [] };
    const confirmed: GuideRun = { ...run, env, envVersion: v.number, step: 0, stepVersions: [], marks: [...run.marks, mark], status: "active" };
    await saveGuideRun(confirmed, tx);
    return { version: v.number, run: confirmed };
  });
  const text = `${euro(label)} 진행합니다. 위 카드의 이번 단계를 말로 요청해 보세요.${opts.note ? `\n${opts.note}` : ""}`;
  const msg = await createMessage(diagramId, "assistant", text, { says: [text], changed: 0, ...counts(next) });
  return { ...saved, cmd, state: next, text, assistantMessageId: msg.id };
}

/**
 * 학습 중인 구성도의 기본 대화 한 차례. 구성도 잠금 안에서, 사용자 메시지를 저장한 뒤 불린다.
 * 환경을 아직 안 정했으면 환경을 읽고, 정했으면 이번 단계를 판정해 그리거나(맞음) 안내한다(안 맞음·충돌).
 * 질문이면 아무것도 보내지 않고 { handled: false, intent: "question" } 을 돌려준다(호출자가 질문 답변 경로를 탄다).
 */
export async function runGuideTurn(args: GuideTurnArgs, deps: GuideTurnDeps): Promise<GuideTurnOutcome> {
  const { run } = args;
  const guide = (deps.guides ?? getGuide)(run.guideId);
  const start = () => args.emit({ t: "start", messageId: args.userMessageId, intent: null });
  if (!guide) {
    start();
    await quitTurn(args, undefined, run.step + 1);
    return HANDLED;
  }
  if (run.env === null) {
    start();
    await envTurn(args, guide);
    return HANDLED;
  }
  const variant = guide.variants[run.env];
  const step = variant?.steps[run.step];
  if (!variant || !step) {
    start();
    await quitTurn(args, guide, run.step + 1);
    return HANDLED;
  }

  const n = run.step + 1;
  const started = Date.now();
  // 흔한 어긋남(수량 등)은 Clef 보다 먼저 본다. 걸리면 Clef 를 부르지 않는다.
  const reply = findConflict(args.text, step);
  const clef = reply === null ? await askClef(deps.clef, args.text, step.goal, args.signal) : { match: null, question: null };
  const verdict: StepVerdict = reply !== null ? { kind: "conflict", reply } : decideStep(args.text, step, clef);
  // 판정이 어디서 틀리는지 나중에 볼 수 있게 남긴다. 사용자 글은 남기지 않는다.
  console.info("[guide] verdict", { diagramId: args.diagramId, step: n, kind: verdict.kind, clefMatch: clef.match, clefQuestion: clef.question, ms: Date.now() - started });
  if (verdict.kind === "question") return { handled: false, intent: "question" };

  start();
  if (verdict.kind === "match") await stepTurn(args, deps, guide, run.env, variant, step);
  else await missTurn(args, guide, n, verdict.kind === "conflict" ? verdict.reply : step.miss);
  return HANDLED;
}

/** 환경을 읽어 확정하거나, 못 읽으면 환경 설명을 다시 보낸다. */
async function envTurn(args: GuideTurnArgs, guide: Guide): Promise<void> {
  const { diagramId, emit, state, knowledge } = args;
  const envChoices = guideEnvs(guide);
  const env = readEnv(args.text, envChoices);
  console.info("[guide] env", { diagramId, env });
  if (env === null) {
    emit({ t: "say", text: guide.envIntro });
    const msg = await createMessage(diagramId, "assistant", guide.envIntro, { guide: { kind: "env", envChoices }, says: [guide.envIntro], ...quietMeta(state) });
    emit({ t: "guide", view: guideView(args.run, guide) });
    emit(quietDone(state, knowledge, msg.id));
    return;
  }
  const r = await confirmGuideEnv(diagramId, args.run, env, state, args.userMessageId, { guide });
  emit({ t: "cmd", cmd: r.cmd });
  emit({ t: "say", text: r.text });
  emit({ t: "guide", view: guideView(r.run, guide) });
  // 환경 가정만 바꾼 차례라 평소 변경 없는 차례처럼 버전 없이 끝낸다(화면은 done 뒤 서버 상태를 다시 읽는다).
  emit(quietDone(r.state, knowledge, r.assistantMessageId, 1));
}

/** 안 맞음·충돌: 안내 글만 남긴다. 버전·진행 상태는 그대로다. */
async function missTurn(args: GuideTurnArgs, guide: Guide, n: number, text: string): Promise<void> {
  const { diagramId, emit, state, knowledge } = args;
  emit({ t: "say", text });
  const msg = await createMessage(diagramId, "assistant", text, { guide: { kind: "miss", step: n }, says: [text], ...quietMeta(state) });
  emit({ t: "guide", view: guideView(args.run, guide) });
  emit(quietDone(state, knowledge, msg.id));
}

/** 대본 명령이 거절됐거나 대본이 사라졌다: 학습을 그만두고 알린다. */
async function quitTurn(args: GuideTurnArgs, guide: Guide | undefined, n: number): Promise<void> {
  const { diagramId, emit, state, knowledge } = args;
  const quit: GuideRun = { ...args.run, status: "quit" };
  await saveGuideRun(quit);
  emit({ t: "error", message: GUIDE_BROKEN_MESSAGE });
  const msg = await createMessage(diagramId, "assistant", GUIDE_BROKEN_MESSAGE, { guide: { kind: "quit", step: n }, ...quietMeta(state) });
  if (guide) emit({ t: "guide", view: guideView(quit, guide) });
  emit(quietDone(state, knowledge, msg.id));
}

/** 맞음: 대본 명령을 확정으로 적용하고, 버전·흐름·진행 상태·설명을 저장한 뒤 단계 글(마지막이면 완료 글도)을 남긴다. */
async function stepTurn(args: GuideTurnArgs, deps: GuideTurnDeps, guide: Guide, env: GuideEnv, variant: GuideVariant, step: GuideStep): Promise<void> {
  const { diagramId, emit, state, knowledge, run } = args;
  const n = run.step + 1;
  const applied = applyGuideStep(state, step, knowledge ? { netTypes: knowledge.types } : {});
  if (!applied.ok) {
    console.error("[guide] step rejected", { diagramId, guideId: run.guideId, env: run.env, step: n, error: applied.error });
    await quitTurn(args, guide, n);
    return;
  }
  emit({ t: "status", phase: "drawing" });
  for (const cmd of applied.emitted) emit({ t: "cmd", cmd });

  // 경고는 코드 규칙만 본다(이미 중단된 신호). AI 경고 문구는 대본 밖 글이다.
  const checked = await checkWarnings(applied.state, state.warnings, { clef: deps.clef, qwen: null }, AbortSignal.abort(), knowledge ? { knowledge } : {});
  const next: DiagramState = { ...applied.state, warnings: checked.warnings };
  const delta = warningDelta(state, next, knowledge ?? undefined);
  const warningCounts = delta.fresh > 0 || delta.resolved > 0 ? delta : undefined;
  const last = n === variant.steps.length;

  // 버전·흐름·진행 상태는 한 트랜잭션으로 저장한다(반만 저장되면 다음 차례가 같은 단계를 다시 그리다 거절된다).
  const saved = await db.transaction(async (tx) => {
    const v = await createVersion(diagramId, next, { source: "ai", messageId: args.userMessageId, summary: `학습 ${n}단계: ${step.goal}`, tx });
    const flows = applied.flowOps.length > 0 ? await saveGuideFlows(diagramId, next, applied.flowOps, tx) : { saved: 0, rejected: [] };
    const stepVersions = [...run.stepVersions, v.number];
    const mark = { version: v.number, env, envVersion: run.envVersion, stepVersions };
    const advanced: GuideRun = { ...run, step: run.step + 1, stepVersions, marks: [...run.marks, mark], status: last ? "done" : "active" };
    await saveGuideRun(advanced, tx);
    return { version: v.number, flows, run: advanced };
  });
  for (const rej of saved.flows.rejected) {
    console.error("[guide] flow rejected", { diagramId, guideId: run.guideId, env: run.env, step: n, id: rej.id, reason: rej.reason });
    emit({ t: "skip", reason: `건너뜀: 적용할 수 없는 흐름(${rej.id}) ${rej.reason}` });
  }

  // 이웃이 붙으면 서명이 바뀌므로 지금까지(이번 단계 포함) 대본 설명을 지금 서명으로 다시 넣는다. 실패해도 차례는 마친다.
  const explains: AuthoredExplains = Object.assign({}, ...variant.steps.slice(0, n).map((s) => s.explains));
  try {
    await saveAuthoredExplanations(diagramId, next, explains);
  } catch (err) {
    console.error("[guide] save explanations failed", err);
  }

  const changed = applied.emitted.filter(isStructural).length;
  const appliedCount = applied.emitted.length + applied.flowOps.length;
  const skipped = saved.flows.rejected.length;
  const missing = computeMissing(next, knowledge ?? undefined).count;
  // 새 경고는 단계 글 앞에 보낸다(끝은 say → guide → done). 화면은 done 때 칩으로 보인다.
  if (checked.fresh.length > 0) emit({ t: "warnings", items: checked.fresh });
  emit({ t: "say", text: step.say });
  const meta: MessageMeta = {
    guide: { kind: "step", step: n, ...(step.notes?.length ? { notes: step.notes } : {}) },
    says: [step.say],
    applied: appliedCount,
    changed,
    skipped,
    version: saved.version,
    status: "complete",
    ...(saved.flows.saved > 0 ? { flows: saved.flows.saved } : {}),
    ...(missing > 0 ? { missing } : {}),
    ...(checked.fresh.length > 0 ? { warnings: checked.fresh } : {}),
    ...(warningCounts ? { warningCounts } : {}),
    ...counts(next),
  };
  let lastMessage = await createMessage(diagramId, "assistant", step.say, meta);
  if (last) {
    const rebuild = guideEnvs(guide).filter((e) => e !== run.env);
    emit({ t: "say", text: variant.outro });
    lastMessage = await createMessage(diagramId, "assistant", variant.outro, {
      guide: { kind: "done", outro: variant.outro, ...(variant.otherEnv ? { otherEnv: variant.otherEnv } : {}), rebuild },
      says: [variant.outro],
      ...quietMeta(next),
    });
  }
  emit({ t: "guide", view: guideView(saved.run, guide) });
  emit(
    doneEvent({
      version: saved.version,
      status: "complete",
      applied: appliedCount,
      changed,
      flows: saved.flows.saved,
      skipped,
      missing,
      ...counts(next),
      ...(warningCounts ? { warningCounts } : {}),
      assistantMessageId: lastMessage.id,
    }),
  );
}
