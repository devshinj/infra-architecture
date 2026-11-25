import type { Guide, GuideEnv } from "./types";
import { guideEnvs } from "./index";

export interface GuideView {
  guideId: string;
  title: string;
  env: GuideEnv | null;
  envChoices: GuideEnv[];
  /** 끝낸 단계 수(= 지금 단계의 0 기준 번호). */
  step: number;
  total: number;
  status: "active" | "done" | "quit";
  current: { goal: string; example: string } | null;
}

export function guideView(
  run: { guideId: string; env: GuideEnv | null; step: number; status: "active" | "done" | "quit" },
  guide: Guide,
): GuideView {
  const variant = run.env ? guide.variants[run.env] : undefined;
  const total = variant?.steps.length ?? 0;
  const cur = variant && run.status === "active" && run.step < total ? variant.steps[run.step] : undefined;
  return {
    guideId: run.guideId,
    title: guide.title,
    env: run.env,
    envChoices: guideEnvs(guide),
    step: run.step,
    total,
    status: run.status,
    current: cur ? { goal: cur.goal, example: cur.example } : null,
  };
}

/** 주제 고르기 화면의 카드 하나(대본 전체를 화면에 보내지 않는다). */
export interface GuideSummary {
  id: string;
  title: string;
  intro: string;
  learns: string[];
  /** 대본이 있는 환경과 그 단계 수(GUIDE_ENVS 순서). */
  envs: { env: GuideEnv; steps: number }[];
}

export function guideSummary(g: Guide): GuideSummary {
  return {
    id: g.id,
    title: g.title,
    intro: g.intro,
    learns: [...g.learns],
    envs: guideEnvs(g).map((env) => ({ env, steps: g.variants[env]!.steps.length })),
  };
}
