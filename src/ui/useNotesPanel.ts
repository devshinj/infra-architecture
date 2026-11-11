"use client";

import { useEffect, useRef } from "react";

import { useShell } from "./Shell";

const motion = (): ScrollBehavior =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

/**
 * 보조 페이지(용어 사전·망 지식)의 범례표 + 주기 판 한 쌍.
 * - 넓은 화면: 주기 판은 CSS(sticky)로 화면에 붙어 따라온다. 여기서는 할 일이 없다.
 * - 좁은 화면: 주기 판이 목록 아래에 쌓이므로, 줄을 고르면 주기 판으로 스크롤하고 제목에 초점을 둔다.
 * - 닫으면 고른 줄(data-row-id)로 초점을 돌려준다. 좁은 화면이면 그 줄까지 다시 스크롤한다.
 */
export function useNotesPanel(openId: string | null) {
  const { narrow } = useShell();
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!narrow || !openId) return;
    const panel = panelRef.current;
    panel?.scrollIntoView?.({ block: "start", behavior: motion() });
    panel?.querySelector<HTMLElement>("[data-panel-title]")?.focus({ preventScroll: true });
  }, [narrow, openId]);

  const returnTo = (id: string | null) => {
    if (!id) return;
    const row = rootRef.current?.querySelector<HTMLElement>(`[data-row-id="${id}"]`);
    if (!row) return;
    if (narrow) row.scrollIntoView?.({ block: "center", behavior: motion() });
    row.focus({ preventScroll: narrow });
  };

  return { rootRef, panelRef, returnTo };
}

/** 주기 판 안에서 Esc 를 누르면 닫는다(한글 조합 중에는 조합 취소로 남긴다). */
export const closeOnEscape = (onClose: () => void) => (e: React.KeyboardEvent) => {
  if (e.key !== "Escape" || e.nativeEvent.isComposing) return;
  e.preventDefault();
  onClose();
};
