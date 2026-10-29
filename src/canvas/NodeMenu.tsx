"use client";

import { useEffect, useRef } from "react";

export interface NodeMenuProps {
  /** Pointer position, relative to the canvas wrapper. */
  x: number;
  y: number;
  onChoose(): void;
  onClose(): void;
}

/** Small right-click menu on a node or zone. Closes on Escape, outside click, or after choosing. */
export function NodeMenu({ x, y, onChoose, onClose }: NodeMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const item = useRef<HTMLButtonElement>(null);
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    item.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close.current();
      }
    };
    const onDown = (e: Event) => {
      if (!ref.current?.contains(e.target as Node)) close.current();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown, true);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown, true);
    };
  }, []);

  return (
    <div ref={ref} className="node-menu" role="menu" aria-label="노드 메뉴" style={{ left: x, top: y }}>
      <button
        ref={item}
        type="button"
        role="menuitem"
        className="node-menu__item"
        onClick={() => {
          onChoose();
          onClose();
        }}
      >
        대화에 참조 붙이기
      </button>
    </div>
  );
}
