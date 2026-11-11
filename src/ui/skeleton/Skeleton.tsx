import type { CSSProperties, ReactNode } from "react";

import styles from "./skeleton.module.css";

type Vars = CSSProperties & { "--w"?: string; "--i"?: number; "--cols"?: string };

/** 불러오는 동안 보이는 자리 한 덩이. 보조기기에는 label 한 줄로 알린다(점선 자리는 읽지 않는다). */
export function Loading({ label, className, children, ...data }: { label: string; className?: string; children: ReactNode; [attr: `data-${string}`]: string }) {
  return (
    <div className={`${styles.root} ${className ?? ""}`} aria-busy="true" {...data}>
      <span role="status" className={styles.srOnly}>
        {label}
      </span>
      <div aria-hidden="true" style={{ display: "contents" }}>
        {children}
      </div>
    </div>
  );
}

/** 글자 줄 자리. widths 는 줄마다의 너비(마지막 줄을 짧게 두면 문단처럼 보인다). start 는 그리기 시작 순번. */
export function SkeletonLines({ widths = ["100%", "88%", "64%"], start = 0, className }: { widths?: string[]; start?: number; className?: string }) {
  return (
    <span className={`${styles.lines} ${className ?? ""}`}>
      {widths.map((w, i) => (
        <span key={i} className={styles.line} style={{ "--w": w, "--i": start + i } as Vars} />
      ))}
    </span>
  );
}

/** 상자 자리: 영역(zone, 8px)·조작 부품(control, 6px)·알약(pill). */
export function SkeletonBlock({ shape = "zone", i = 0, className, style, children }: { shape?: "zone" | "control" | "pill"; i?: number; className?: string; style?: CSSProperties; children?: ReactNode }) {
  const shapeClass = shape === "control" ? styles.control : shape === "pill" ? styles.pill : "";
  return (
    <span className={`${styles.block} ${shapeClass} ${className ?? ""}`} style={{ ...style, "--i": i } as Vars}>
      {children}
    </span>
  );
}

/** 대화 줄 자리: AI 문단 · 사용자 말풍선 · AI 문단. 작업 화면 뼈대와 대화 세션을 바꿀 때 같이 쓴다. */
export function ChatSkeleton() {
  return (
    <>
      <SkeletonLines widths={["92%", "100%", "58%"]} />
      <SkeletonBlock shape="control" className={styles.bubble} i={3} />
      <SkeletonLines widths={["84%", "40%"]} start={4} />
    </>
  );
}

export { styles as skeletonStyles };
