"use client";

import { useRef } from "react";

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
}

const STEP = 16;
const BIG_STEP = 64;

/** 오른쪽 패널의 왼쪽 경계 손잡이. 왼쪽으로 끌거나 ← 를 누르면 패널이 넓어진다. */
export function PanelResizer({ width, min, max, defaultWidth, onChange }: PanelResizerProps) {
  const drag = useRef<{ x: number; width: number } | null>(null);
  const prevSelect = useRef("");
  const set = (w: number) => onChange(Math.min(max, Math.max(min, Math.round(w))));

  const end = () => {
    if (!drag.current) return;
    drag.current = null;
    document.body.style.userSelect = prevSelect.current;
  };

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
      style={{ right: width }}
      onPointerDown={(e) => {
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
