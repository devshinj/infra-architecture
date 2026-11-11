import type { ButtonHTMLAttributes, Ref } from "react";

import styles from "./button.module.css";

/**
 * 작업 화면의 버튼 하나(DESIGN.md · Components · Buttons). 모양은 button.module.css 한 곳에서만 정한다.
 * - primary: 연두 칠, 화면마다 하나(보내기·만들기). 비활성이면 무채색으로 물러선다.
 * - secondary: 칠 없는 머리카락 선(취소·새 대화·노드 링크 복사).
 * - danger: 되돌릴 수 없는 일(지우기).
 * - quiet: 테두리 없는 글자 버튼(로그아웃).
 */
export type ButtonVariant = "primary" | "secondary" | "danger" | "quiet";
/** sm: 패널 안 도구 동작(링크 복사·다시 쓰기), md: 기본, lg: 로그인 같은 한 줄 양식의 제출. */
export type ButtonSize = "sm" | "md" | "lg";

type Look = { variant?: ButtonVariant; size?: ButtonSize; block?: boolean; className?: string };

/** button 이 아닌 요소(Next Link 등)에 같은 모양을 입힌다. 돌려준 값을 그대로 펼쳐 넣는다. */
export function buttonClassName({ variant = "secondary", size = "md", block = false, className }: Look) {
  return {
    className: className ? `${styles.button} ${className}` : styles.button,
    "data-variant": variant,
    "data-size": size,
    "data-block": block ? "" : undefined,
  };
}

type Props = Look & ButtonHTMLAttributes<HTMLButtonElement> & { ref?: Ref<HTMLButtonElement> };

export function Button({ variant, size, block, className, type = "button", ref, ...rest }: Props) {
  return <button ref={ref} type={type} {...buttonClassName({ variant, size, block, className })} {...rest} />;
}
