"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * 미디어 쿼리가 맞는가. 서버와 하이드레이션 첫 렌더는 늘 false(넓은 화면 마크업)이고, 그 뒤 실제 값으로 바뀐다.
 * 좁은 화면의 첫 칠은 CSS 미디어 쿼리가 맞춘다(구조만 이 훅으로 바꾼다). matchMedia 가 없으면 false.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = typeof window === "undefined" ? undefined : window.matchMedia?.(query);
      if (!mql) return () => {};
      if (typeof mql.addEventListener === "function") {
        mql.addEventListener("change", onChange);
        return () => mql.removeEventListener("change", onChange);
      }
      // 옛 사파리: addListener 만 있다.
      mql.addListener?.(onChange);
      return () => mql.removeListener?.(onChange);
    },
    [query],
  );
  const get = () => (typeof window === "undefined" ? false : !!window.matchMedia?.(query)?.matches);
  return useSyncExternalStore(subscribe, get, () => false);
}
