"use client";

import { useEffect, useRef } from "react";

import styles from "./app.module.css";

export const PANEL_MIN = 320;
export const PANEL_MAX = 720;
export const PANEL_DEFAULT = 360;

export interface PanelResizerProps {
  width: number;
  min: number;
  max: number;
  defaultWidth: number;
  onChange: (width: number) => void;
  /** 작업 영역 오른쪽 끝에서 떠 있는 패널 바깥 끝까지의 여백(px). 손잡이는 패널 왼쪽 가장자리(offset + width)에 선다. */
  offset?: number;
}

const STEP = 16;
const BIG_STEP = 64;

/** 오른쪽 패널의 왼쪽 경계 손잡이. 왼쪽으로 끌거나 ← 를 누르면 패널이 넓어진다. */
export function PanelResizer({ width, min, max, defaultWidth, onChange, offset = 0 }: PanelResizerProps) {
  const drag = useRef<{ x: number; width: number } | null>(null);
  const prevSelect = useRef("");
  const set = (w: number) => onChange(Math.min(max, Math.max(min, Math.round(w))));

  const end = () => {
    if (!drag.current) return;
    drag.current = null;
    document.body.style.userSelect = prevSelect.current;
  };

  // 끄는 중에 사라지면 user-select 를 되돌린다.
  useEffect(
    () => () => {
      if (drag.current) document.body.style.userSelect = prevSelect.current;
    },
    [],
  );

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="대화 패널 너비"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={width}
      tabIndex={0}
      className={styles.resizer}
      style={{ right: offset + width }}
      onPointerDown={(e) => {
        // 끄는 중에 들어온 다른 포인터는 무시한다(시작점·이전 user-select 를 덮어쓰지 않게).
        if (drag.current) return;
        drag.current = { x: e.clientX, width };
        prevSelect.current = document.body.style.userSelect;
        document.body.style.userSelect = "none";
        e.currentTarget.setPointerCapture?.(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (drag.current) set(drag.current.width + (drag.current.x - e.clientX));
      }}
      onPointerUp={end}
      onPointerCancel={end}
      onLostPointerCapture={end}
      onDoubleClick={() => set(defaultWidth)}
      onKeyDown={(e) => {
        const step = e.shiftKey ? BIG_STEP : STEP;
        if (e.key === "ArrowLeft") set(width + step);
        else if (e.key === "ArrowRight") set(width - step);
        else if (e.key === "Home") set(min);
        else if (e.key === "End") set(max);
        else return;
        e.preventDefault();
      }}
    />
  );
}
