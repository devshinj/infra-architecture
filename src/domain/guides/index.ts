import { SHOP } from "./shop";
import { GUIDE_ENVS, type Guide, type GuideEnv } from "./types";

export const GUIDE_LIST: readonly Guide[] = [SHOP];

export function getGuide(id: string): Guide | undefined {
  return GUIDE_LIST.find((g) => g.id === id);
}

/** 대본이 있는 환경, GUIDE_ENVS 순서. */
export function guideEnvs(g: Guide): GuideEnv[] {
  return GUIDE_ENVS.filter((e) => g.variants[e] !== undefined);
}
