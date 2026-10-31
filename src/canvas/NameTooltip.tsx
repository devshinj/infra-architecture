import { useCallback, useEffect, useRef, useState } from "react";

const SHOW_DELAY_MS = 300;

/** 잘린 이름 말풍선을 여닫는다: 마우스를 올리거나 키보드 포커스가 오면 300ms 뒤 열고, 떠나거나 Esc 면 닫는다. */
export function useNameTooltip(enabled: boolean) {
  const [open, setOpen] = useState(false);
  const hovered = useRef(false);
  const focused = useRef(false);
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
      (kind === "hover" ? hovered : focused).current = on;
      if (on) arm();
      else if (!hovered.current && !focused.current) close();
    },
    [arm, close],
  );

  // 잘림이 풀리거나(enabled 꺼짐) 끄는 중이면 닫는다. 이름이 바뀌어 사라질 때 타이머도 정리한다.
  useEffect(() => {
    if (!enabled) close();
    return stop;
  }, [enabled, close, stop]);

  // Esc 는 막지 않고(다른 Esc 동작을 그대로 둔다) 말풍선만 닫는다.
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [enabled, close]);

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
