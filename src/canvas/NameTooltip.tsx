import { useCallback, useEffect, useRef, useState } from "react";

const SHOW_DELAY_MS = 300;

// 마지막 입력이 키보드였는가. 마우스 클릭으로 래퍼가 포커스를 받은 것과 Tab 으로 받은 것을 가른다(:focus-visible 을 못 쓰는 환경 대비).
let lastInputKeyboard = false;
let inputWatched = false;
function watchInput(): void {
  if (inputWatched || typeof document === "undefined") return;
  inputWatched = true;
  document.addEventListener("keydown", () => (lastInputKeyboard = true), true);
  document.addEventListener("pointerdown", () => (lastInputKeyboard = false), true);
  document.addEventListener("mousedown", () => (lastInputKeyboard = false), true);
}

watchInput();

/** 키보드로 온 포커스인가(마우스 클릭 포커스는 아님). */
export function isKeyboardFocus(el: HTMLElement): boolean {
  try {
    if (el.matches(":focus-visible")) return true;
  } catch {
    // 선택자를 모르는 환경: 마지막 입력으로 가린다.
  }
  return lastInputKeyboard;
}

/** 잘린 이름 말풍선을 여닫는다: 마우스를 올리거나 키보드 포커스가 오면 300ms 뒤 열고, 떠나거나 Esc 면 닫는다. */
export function useNameTooltip(enabled: boolean) {
  const [open, setOpen] = useState(false);
  const hovered = useRef(false);
  const focused = useRef(false);
  const live = useRef(enabled);
  live.current = enabled;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  }, []);
  const close = useCallback(() => {
    stop();
    setOpen(false);
  }, [stop]);
  const arm = useCallback(() => {
    if (timer.current !== null) return;
    timer.current = setTimeout(() => {
      timer.current = null;
      setOpen(true);
    }, SHOW_DELAY_MS);
  }, []);
  const set = useCallback(
    (kind: "hover" | "focus", on: boolean) => {
      if (!live.current) return;
      (kind === "hover" ? hovered : focused).current = on;
      if (on) arm();
      else if (!hovered.current && !focused.current) close();
    },
    [arm, close],
  );

  // 잘림이 풀리거나(enabled 꺼짐) 끄는 중이면 닫는다. 이름이 바뀌어 사라질 때 타이머도 정리한다.
  useEffect(() => {
    if (!enabled) {
      hovered.current = false;
      focused.current = false;
      close();
    }
    return stop;
  }, [enabled, close, stop]);

  // Esc 는 열려 있는 동안만 듣고, 막지 않고(다른 Esc 동작을 그대로 둔다) 말풍선만 닫는다.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  return { open: open && enabled, set };
}

export function NameTooltip({ id, label, sub }: { id: string; label: string; sub?: string }) {
  return (
    <span id={id} role="tooltip" className="name-tooltip">
      <span className="name-tooltip__label">{label}</span>
      {sub && <span className="name-tooltip__sub">{sub}</span>}
    </span>
  );
}
