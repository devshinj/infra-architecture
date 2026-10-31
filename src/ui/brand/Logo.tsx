import styles from "./logo.module.css";

// V2 마크: 겹친 두 구역 + 둥근 연결선 + 사각 노드 둘 + 겹친 자리의 금색 점. 48 격자, 선 굵기 1.4 하나.
export function LogoMark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false" className={styles.mark}>
      <rect x="6" y="6" width="24" height="24" rx="6" fill="none" stroke="var(--edge-aux)" strokeWidth="1.4" />
      <rect x="18" y="18" width="24" height="24" rx="6" fill="none" stroke="var(--text-secondary)" strokeWidth="1.4" />
      <path
        d="M12 15 V20 a4 4 0 0 0 4 4 H32 a4 4 0 0 1 4 4 V33"
        fill="none"
        stroke="var(--cat-compute)"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <rect x="9" y="9" width="6" height="6" rx="1.6" fill="var(--text-primary)" />
      <rect x="33" y="33" width="6" height="6" rx="1.6" fill="var(--text-primary)" />
      <circle cx="24" cy="24" r="2.6" fill="var(--accent)" />
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
