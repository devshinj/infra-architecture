"use client";

import { useEffect, useRef, useState } from "react";

import { EDGE_KINDS } from "@/domain/catalog";

import styles from "./legend.module.css";

export interface LegendProps {
  /** 보조 연결을 숨기는 중이면 그 줄 끝에 `숨김` 을 붙인다. */
  hideAux: boolean;
  /** 빈 구성도에서는 범례를 그리지 않는다. */
  empty?: boolean;
}

const OPEN_KEY = "infrasketch.legendOpen";

/** 선 모양 견본: 실제 연결선과 같은 클래스(edges.css)를 쓴다. 복제는 굵은 선 위에 바탕색 가는 선(이중선). */
function EdgeSample({ kind }: { kind: (typeof EDGE_KINDS)[number]["kind"] }) {
  return (
    <svg className={styles.sample} width={40} height={14} viewBox="0 0 40 14" aria-hidden="true">
      <path className={`edge-line edge-line--${kind}`} d="M3 7H37" />
      {kind === "replication" && <path className="edge-line edge-line--replication-core" d="M3 7H37" />}
    </svg>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg className={styles.chevron} data-open={open || undefined} width={12} height={12} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.75 7.5 6 4.25 9.25 7.5" />
    </svg>
  );
}

/** 범례 버튼 아이콘: 선으로 이어진 두 점. */
function LegendIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx={3} cy={3.5} r={1.6} />
      <circle cx={11} cy={10.5} r={1.6} />
      <path d="M4.4 4.6 9.6 9.4" />
    </svg>
  );
}

/**
 * 캔버스 오른쪽 아래의 연결 범례. 접히면 `범례` 버튼 하나(기본), 펼치면 위로 열려
 * 연결 종류 4가지와 점·화살표가 뜻하는 것을 실제 선 모양으로 보인다. 펼침 상태는 localStorage 에 기억한다.
 */
export function Legend({ hideAux, empty = false }: LegendProps) {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // 첫 렌더는 접힘(하이드레이션 일치), 마운트 뒤 저장된 값을 읽는다.
  useEffect(() => {
    try {
      if (window.localStorage.getItem(OPEN_KEY) === "1") setOpen(true);
    } catch {
      /* 저장소를 못 읽으면 접은 채로 */
    }
  }, []);

  if (empty) return null;

  const change = (next: boolean) => {
    setOpen(next);
    try {
      window.localStorage.setItem(OPEN_KEY, next ? "1" : "0");
    } catch {
      /* 저장 실패는 이번 방문에만 영향 */
    }
  };

  // Escape: 열려 있을 때만 접고 포커스를 `범례` 버튼으로 돌린다.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Escape" || !open) return;
    e.preventDefault();
    change(false);
    toggleRef.current?.focus();
  };

  return (
    <aside className={styles.legend} data-open={open || undefined} aria-label="연결 범례" onKeyDown={onKeyDown}>
      <button ref={toggleRef} type="button" className={styles.toggle} aria-expanded={open} aria-controls="legend-body" onClick={() => change(!open)}>
        <LegendIcon />
        <span>범례</span>
        <Chevron open={open} />
      </button>
      {open && (
        <div id="legend-body" className={styles.body}>
          <h3 className={styles.heading}>연결 범례</h3>
          <ul className={styles.list}>
            {EDGE_KINDS.map((k) => (
              <li key={k.kind} className={styles.row}>
                <EdgeSample kind={k.kind} />
                <span className={styles.text}>{k.label}</span>
                {k.kind === "aux" && hideAux && <span className={styles.tag}>숨김</span>}
              </li>
            ))}
            <li className={styles.row}>
              <svg className={styles.sample} width={40} height={14} viewBox="0 0 40 14" aria-hidden="true">
                <path className="edge-line edge-line--request" d="M3 7H37" />
                <path className="motion-path motion-comet--head" d="M22 7H28" />
              </svg>
              <span className={styles.text}>움직이는 금색 점: 요청이 흘러가는 방향</span>
            </li>
            <li className={styles.row}>
              <svg className={styles.sample} width={40} height={14} viewBox="0 0 40 14" aria-hidden="true">
                <path className="edge-line edge-line--request" d="M3 7H37" />
                <circle className="edge-junction" cx={20} cy={7} r={2} />
              </svg>
              <span className={styles.text}>작은 점: 여러 연결이 한 줄로 합쳐지는 곳</span>
            </li>
            <li className={styles.row}>
              <svg className={styles.sample} width={40} height={14} viewBox="0 0 40 14" aria-hidden="true">
                <path className="edge-line edge-line--request" d="M3 7H34" />
                <path className="edge-arrow edge-arrow--request" d="M30.61 9.4 L35 7 L30.61 4.6" />
              </svg>
              <span className={styles.text}>화살표: 연결이 향하는 쪽</span>
            </li>
          </ul>
        </div>
      )}
    </aside>
  );
}
