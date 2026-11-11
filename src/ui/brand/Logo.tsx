import styles from "./logo.module.css";

// S 흐름 마크: 꺾인 연결선 하나가 S(Sketch)를 그리며 노드를 지나고, 출발점의 연두 점이 흐름 점이다.
// 캔버스 문법(둥근 꺾임 연결선, 6px 노드)과 연두 신호 하나로만 그린다. 32 격자, 선 굵기 2.
export function LogoMark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false" className={styles.mark}>
      <path
        d="M25 6.5H11A4.5 4.5 0 0 0 6.5 11V11.5A4.5 4.5 0 0 0 11 16H21A4.5 4.5 0 0 1 25.5 20.5V21A4.5 4.5 0 0 1 21 25.5H8"
        stroke="var(--text-secondary)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <rect x="13" y="13" width="6" height="6" rx="1.6" fill="var(--text-primary)" />
      <rect x="3" y="22.5" width="6" height="6" rx="1.6" fill="var(--text-primary)" />
      <circle cx="25.5" cy="6.5" r="3.2" fill="var(--accent)" />
    </svg>
  );
}

/** 가로형 로고: 마크 + 워드마크(Infra 굵게 · Sketch 은빛). */
export function Logo({ markSize = 36, className }: { markSize?: number; className?: string }) {
  return (
    <div className={className ? `${styles.logo} ${className}` : styles.logo}>
      <LogoMark size={markSize} />
      <span className={styles.word}>
        Infra<span className={styles.wordSub}>Sketch</span>
      </span>
    </div>
  );
}
