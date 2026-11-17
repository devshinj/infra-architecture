import styles from "./arrow.module.css";

/** 화살표 모양: 오른쪽(→), 왼쪽(←), 양쪽(↔). 연결선 층의 방향 표지와 같은 선 + 머리. */
const ARROW_D = {
  right: "M1,4 H11 M8,1 L11,4 L8,7",
  left: "M11,4 H1 M4,1 L1,4 L4,7",
  both: "M1,4 H11 M4,1 L1,4 L4,7 M8,1 L11,4 L8,7",
} as const;
export type ArrowDir = keyof typeof ARROW_D;
const ARROW_CHAR: Record<ArrowDir, string> = { right: "→", left: "←", both: "↔" };

/**
 * 방향 화살표. 글자(→ ← ↔)는 화면 글꼴에서 ">" "<" 처럼 보여 선으로 그린다.
 * 꾸밈이라 보조기기에는 숨긴다: 뜻은 곁의 글자가 전하거나, ArrowPair 처럼 숨긴 글자를 함께 둔다.
 */
export function Arrow({ dir }: { dir: ArrowDir }) {
  return (
    <svg className={styles.arrow} width="12" height="8" viewBox="0 0 12 8" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d={ARROW_D[dir]} />
    </svg>
  );
}

/** 줄 앞의 방향 표시(들어옴 ←, 나감 →): 선 화살표 + 보조기기·글자 내용용 숨긴 화살표 글자. */
export function ArrowMark({ dir }: { dir: ArrowDir }) {
  return (
    <>
      <Arrow dir={dir} />
      <span className={styles.srOnly}>{ARROW_CHAR[dir]}</span>
    </>
  );
}

/**
 * "a → b" 한 덩이: 화면에는 선 화살표, 보조기기와 글자 내용(textContent)에는 숨긴 화살표 글자가 들어가
 * 읽는 이름은 그대로 "a → b" 다(공백은 숨긴 글자 밖에 둬야 이름 계산에서 살아남는다).
 */
export function ArrowPair({ a, b, dir = "right" }: { a: string; b: string; dir?: ArrowDir }) {
  return (
    <>
      {a}{" "}
      <Arrow dir={dir} />
      <span className={styles.srOnly}>{ARROW_CHAR[dir]}</span>{" "}
      {b}
    </>
  );
}
