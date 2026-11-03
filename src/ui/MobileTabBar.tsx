"use client";

import { useRef } from "react";

import styles from "./app.module.css";
import type { Tab } from "./RightPanel";

/** 좁은 화면 작업 화면의 네 보기: 캔버스 하나와 오른쪽 패널의 세 탭. */
export type MobileView = "구성도" | Tab;
export const MOBILE_VIEWS: MobileView[] = ["구성도", "대화", "설명", "이력"];
export const mobileTabId = (v: MobileView) => `mtab-${v}`;

export interface MobileTabBarProps {
  current: MobileView;
  onChange(v: MobileView): void;
  /** 각 탭이 보이는 영역의 id(aria-controls). */
  controls(v: MobileView): string;
  /** 구성도를 보는 중에 노드·연결을 골랐다: 설명 탭에 점을 찍어 거기 설명이 있음을 알린다. */
  explainWaiting?: boolean;
}

/**
 * 좁은 화면 아래 탭 막대. 탭 목록(tablist) 하나로 한 번에 한 화면만 보인다.
 * ←→·Home·End 로 탭을 옮기며 바로 고른다(포커스가 가는 탭은 지금 탭 하나, 로빙 tabindex).
 */
export function MobileTabBar({ current, onChange, controls, explainWaiting = false }: MobileTabBarProps) {
  const refs = useRef(new Map<MobileView, HTMLButtonElement>());
  const go = (i: number) => {
    const v = MOBILE_VIEWS[(i + MOBILE_VIEWS.length) % MOBILE_VIEWS.length];
    onChange(v);
    refs.current.get(v)?.focus();
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    const i = MOBILE_VIEWS.indexOf(current);
    if (e.key === "ArrowRight") go(i + 1);
    else if (e.key === "ArrowLeft") go(i - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(MOBILE_VIEWS.length - 1);
    else return;
    e.preventDefault();
  };
  return (
    <div className={styles.tabbar} role="tablist" aria-label="작업 화면" onKeyDown={onKeyDown}>
      {MOBILE_VIEWS.map((v) => {
        const selected = v === current;
        const dot = v === "설명" && explainWaiting && !selected;
        return (
          <button
            key={v}
            ref={(el) => {
              if (el) refs.current.set(v, el);
              else refs.current.delete(v);
            }}
            type="button"
            role="tab"
            id={mobileTabId(v)}
            aria-selected={selected}
            aria-controls={controls(v)}
            tabIndex={selected ? 0 : -1}
            className={styles.tabbarTab}
            onClick={() => onChange(v)}
          >
            <span className={styles.tabbarIcon}>
              {ICONS[v]}
              {dot && <i className={styles.tabbarDot} />}
            </span>
            {v}
            {dot && <span className={styles.srOnly}>, 고른 항목의 설명 있음</span>}
          </button>
        );
      })}
    </div>
  );
}

// 사이드바 레일 아이콘과 같은 결: 18px, 1.5px 선, currentColor.
const Svg = ({ children }: { children: React.ReactNode }) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);
const ICONS: Record<MobileView, React.ReactNode> = {
  구성도: <Svg><rect x="2.5" y="3" width="5" height="4" rx="1" /><rect x="10.5" y="3" width="5" height="4" rx="1" /><rect x="6.5" y="11" width="5" height="4" rx="1" /><path d="M5 7v2h8V7M9 9v2" /></Svg>,
  대화: <Svg><path d="M3 4.5A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5v6a1.5 1.5 0 0 1-1.5 1.5H8l-3.5 3v-3h0A1.5 1.5 0 0 1 3 10.5z" /></Svg>,
  설명: <Svg><circle cx="9" cy="9" r="6.25" /><path d="M9 8.25v4M9 5.75v.01" /></Svg>,
  이력: <Svg><circle cx="9" cy="9" r="6.25" /><path d="M9 5.5V9l2.5 1.5" /></Svg>,
};
