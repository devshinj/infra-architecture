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
