/**
 * 학습 진행 표시. 화면(클라이언트)이 쓰므로 대본(index)을 import 하지 않는다: 대본 전체가 브라우저로 가지 않게.
 */
import type { GuideView } from "./view";

type Progress = Pick<GuideView, "env" | "step" | "total" | "status">;

/**
 * 진행 표시(n / 전체). n 은 지금 하는 단계(1 부터, R1). 끝났으면 전체 / 전체.
 * 환경을 고르기 전(단계 수를 모름)이면 null.
 */
export function stepCount(v: Progress): { n: number; total: number } | null {
  if (v.env === null || v.total === 0) return null;
  return { n: v.status === "done" ? v.total : Math.min(v.step + 1, v.total), total: v.total };
}

/** 사이드바 구성도 줄의 학습 배지("학습 3/12"). 환경을 고르기 전이면 "학습". */
export function learnBadge(v: Progress): string {
  const c = stepCount(v);
  return c ? `학습 ${c.n}/${c.total}` : "학습";
}
