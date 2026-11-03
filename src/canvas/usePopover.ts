import { useEffect, useRef, useState } from "react";

/**
 * 버튼 + 팝오버 공통 동작: 열면 첫 항목에 포커스, Esc 는 닫고 포커스를 버튼으로 돌리며, 바깥 누름은 닫는다.
 * 샘플 불러오기·보기 옵션·대화 세션 고르기가 함께 쓴다.
 */
export function usePopover(firstItem: string) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    root.current?.querySelector<HTMLElement>(firstItem)?.focus();
    const onKey = (e: KeyboardEvent) => {
      // 팝오버 안의 행 메뉴처럼 안쪽에서 이미 Esc 를 처리했으면(preventDefault) 팝오버는 그대로 둔다.
      if (e.key !== "Escape" || e.defaultPrevented) return;
      setOpen(false);
      trigger.current?.focus();
    };
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as globalThis.Node)) setOpen(false);
    };
    // 키보드로 포커스가 팝오버 밖(버튼 포함 root 바깥)으로 나가면 닫는다. 창 전환처럼 relatedTarget 이 없으면 그대로 둔다.
    const onOut = (e: FocusEvent) => {
      const to = e.relatedTarget as globalThis.Node | null;
      if (to && !root.current?.contains(to)) setOpen(false);
    };
    const el = root.current;
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    el?.addEventListener("focusout", onOut);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
      el?.removeEventListener("focusout", onOut);
    };
  }, [open, firstItem]);
  return { open, setOpen, root, trigger };
}

/** 메뉴(role="menu") 안의 ↑↓: 항목 사이를 돌며 포커스를 옮긴다. 샘플 불러오기·이미지 내보내기가 함께 쓴다. */
export function moveMenuFocus(e: { key: string; preventDefault(): void; currentTarget: Element }) {
  if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
  e.preventDefault();
  const items = [...e.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])')];
  const at = items.indexOf(document.activeElement as HTMLElement);
  items[(at + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]?.focus();
}
