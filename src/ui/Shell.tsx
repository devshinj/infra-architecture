"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import styles from "./app.module.css";

/** 펼친 사이드바·접힌 레일 너비와 떠 있는 패널 여백(tokens.css --panel-gap 과 같다). */
export const SIDEBAR_WIDTH = 240;
export const RAIL_WIDTH = 56;
export const PANEL_GAP = 12;
export const SIDEBAR_COLLAPSED_KEY = "infrasketch.sidebarCollapsed";

interface ShellValue {
  collapsed: boolean;
  setCollapsed(v: boolean): void;
  /** 화면 왼쪽 가장자리에서 사이드바 바깥 끝까지(여백 + 너비). */
  sidebarExtent: number;
}

const extentOf = (collapsed: boolean) => PANEL_GAP + (collapsed ? RAIL_WIDTH : SIDEBAR_WIDTH);

const ShellContext = createContext<ShellValue>({ collapsed: false, setCollapsed: () => {}, sidebarExtent: extentOf(false) });

export const useShell = () => useContext(ShellContext);

/** 캔버스를 바탕 전체에 깔고 사이드바 접힘 상태를 기억하는 앱 셸. 첫 렌더는 펼침(하이드레이션 일치), 마운트 뒤 저장값을 읽는다. */
export function ShellProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setState] = useState(false);
  useEffect(() => {
    try {
      if (window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1") setState(true);
    } catch {
      /* 저장소를 못 읽으면 펼친 채로 */
    }
  }, []);
  const setCollapsed = useCallback((v: boolean) => {
    setState(v);
    try {
      window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, v ? "1" : "0");
    } catch {
      /* 저장 실패는 이번 방문에만 영향 */
    }
  }, []);
  const value = useMemo(() => ({ collapsed, setCollapsed, sidebarExtent: extentOf(collapsed) }), [collapsed, setCollapsed]);
  return (
    <ShellContext.Provider value={value}>
      <div className={styles.shell} style={{ "--shell-inset-left": `${value.sidebarExtent}px` } as React.CSSProperties}>
        {children}
      </div>
    </ShellContext.Provider>
  );
}
