"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "./Button";
import styles from "./app.module.css";
import { useMediaQuery } from "./useMediaQuery";

/** 펼친 사이드바·접힌 레일 너비와 떠 있는 패널 여백(tokens.css --panel-gap 과 같다). */
export const SIDEBAR_WIDTH = 240;
export const RAIL_WIDTH = 56;
export const PANEL_GAP = 12;
export const SIDEBAR_COLLAPSED_KEY = "infrasketch.sidebarCollapsed";
/**
 * 휴대폰 너비. 이보다 좁으면 사이드바는 위 막대의 ☰ 서랍이 되고, 작업 화면은 아래 탭 막대로 한 화면씩 본다
 * (app.module.css 의 같은 미디어 쿼리가 첫 칠을 맞춘다). 저장값이 없으면 접힌 채로 시작해, 넓혀도 레일로 남는다.
 */
export const NARROW_QUERY = "(max-width: 640px)";
/** 태블릿 너비(641–900px)까지: 저장값이 없으면 사이드바를 레일로 접은 채 시작해 캔버스·패널 자리를 남긴다. */
export const COMPACT_QUERY = "(max-width: 900px)";

/** 사이드바 밖(빈 홈 화면 등)에서 사이드바의 ‘새 프로젝트’·‘새 구성도’ 대화상자를 연다. projectId 가 있으면 그 프로젝트에 구성도를 만든다. */
export type CreateRequest = (projectId?: string) => void;

interface ShellValue {
  /** 휴대폰 너비(NARROW_QUERY). 하이드레이션 첫 렌더는 false. */
  narrow: boolean;
  collapsed: boolean;
  setCollapsed(v: boolean): void;
  /** 화면 왼쪽 가장자리에서 사이드바 바깥 끝까지(여백 + 너비). 좁은 화면은 사이드바가 서랍이라 0. */
  sidebarExtent: number;
  requestCreate: CreateRequest;
  /** 사이드바가 대화상자를 여는 함수를 등록한다(null 이면 해제). */
  setCreateHandler(fn: CreateRequest | null): void;
  /** 사이드바에서 고른 구성도로 넘어가는 중(새 화면이 올 때까지). ShellMain 이 작업 화면 뼈대를 덮는다. */
  navigating: boolean;
  setNavigating(v: boolean): void;
}

const extentOf = (collapsed: boolean) => PANEL_GAP + (collapsed ? RAIL_WIDTH : SIDEBAR_WIDTH);

const ShellContext = createContext<ShellValue>({
  narrow: false,
  collapsed: false,
  setCollapsed: () => {},
  sidebarExtent: extentOf(false),
  requestCreate: () => {},
  setCreateHandler: () => {},
  navigating: false,
  setNavigating: () => {},
});

export const useShell = () => useContext(ShellContext);

/** 캔버스를 바탕 전체에 깔고 사이드바 접힘 상태를 기억하는 앱 셸. 첫 렌더는 펼침(하이드레이션 일치), 마운트 뒤 저장값을 읽는다. */
export function ShellProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setState] = useState(false);
  const narrow = useMediaQuery(NARROW_QUERY);
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      if (saved === "1" || (saved === null && window.matchMedia?.(COMPACT_QUERY).matches)) setState(true);
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
  const createHandler = useRef<CreateRequest | null>(null);
  const requestCreate = useCallback<CreateRequest>((projectId) => createHandler.current?.(projectId), []);
  const setCreateHandler = useCallback((fn: CreateRequest | null) => {
    createHandler.current = fn;
  }, []);
  const [navigating, setNavigating] = useState(false);
  const value = useMemo(
    () => ({ narrow, collapsed, setCollapsed, sidebarExtent: narrow ? 0 : extentOf(collapsed), requestCreate, setCreateHandler, navigating, setNavigating }),
    [narrow, collapsed, setCollapsed, requestCreate, setCreateHandler, navigating],
  );
  return (
    <ShellContext.Provider value={value}>
      <div className={styles.shell} style={{ "--shell-inset-left": `${value.sidebarExtent}px` } as React.CSSProperties}>
        {children}
      </div>
    </ShellContext.Provider>
  );
}

/** 빈 홈 화면의 시작 버튼: 사이드바와 같은 대화상자를 연다. */
export function CreateButton({ projectId, children }: { projectId?: string; children: React.ReactNode }) {
  const { requestCreate } = useShell();
  return (
    <Button variant="primary" size="lg" onClick={() => requestCreate(projectId)}>
      {children}
    </Button>
  );
}
