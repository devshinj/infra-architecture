"use client";

import { useEffect, useId, useRef } from "react";

export interface NodeMenuProps {
  /** Pointer position, relative to the canvas wrapper. */
  x: number;
  y: number;
  onChoose(): void;
  /** "이 노드에 대해 물어보기" 항목. 없으면(구역 등) 항목을 두지 않는다. */
  onAsk?(): void;
  /** 질문을 지금 못 보낼 때 항목을 막는다. */
  askDisabled?: boolean;
  /** 막힌 까닭(항목 설명으로 읽힌다). */
  askReason?: string;
  onClose(): void;
}

/** Small right-click menu on a node or zone. Closes on Escape, outside click, or after choosing. */
export function NodeMenu({ x, y, onChoose, onAsk, askDisabled = false, askReason, onClose }: NodeMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const item = useRef<HTMLButtonElement>(null);
  const reasonId = useId();
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
    // 위·아래 화살표로 항목 사이를 옮긴다(막힌 항목도 포커스는 받아 까닭을 읽을 수 있다).
    const onArrow = (e: KeyboardEvent) => {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      const items = [...(ref.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [])];
      if (items.length === 0) return;
      e.preventDefault();
      const i = items.indexOf(document.activeElement as HTMLButtonElement);
      const step = e.key === "ArrowDown" ? 1 : -1;
      items[(i + step + items.length) % items.length].focus();
    };
    const onDown = (e: Event) => {
      if (!ref.current?.contains(e.target as Node)) close.current();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("keydown", onArrow);
    document.addEventListener("pointerdown", onDown, true);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("keydown", onArrow);
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
      {onAsk && (
        <button
          type="button"
          role="menuitem"
          className="node-menu__item"
          {...(askDisabled ? { "aria-disabled": "true" as const } : {})}
          {...(askDisabled && askReason ? { "aria-describedby": reasonId } : {})}
          onClick={() => {
            if (askDisabled) return;
            onAsk();
            onClose();
          }}
        >
          이 노드에 대해 물어보기
        </button>
      )}
      {onAsk && askDisabled && askReason && (
        <span id={reasonId} className="node-menu__reason">
          {askReason}
        </span>
      )}
    </div>
  );
}
