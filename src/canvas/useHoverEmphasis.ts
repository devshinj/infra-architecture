import { useCallback, useEffect, useRef, useState } from "react";

/**
 * 마우스를 올린 대상 id. enter 뒤 delayMs 가 지나야 hoverId 가 되고, 그 전에 leave 하면 취소된다.
 * 지나가기만 해도 화면이 깜빡이지 않게 하는 지연이다.
 */
export function useHoverEmphasis(delayMs = 120) {
  const [hoverId, setHoverId] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<string | null>(null);

  const cancel = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
    pending.current = null;
  }, []);

  const enter = useCallback(
    (id: string) => {
      cancel();
      pending.current = id;
      timer.current = setTimeout(() => {
        timer.current = null;
        pending.current = null;
        setHoverId(id);
      }, delayMs);
    },
    [cancel, delayMs],
  );

  const leave = useCallback(
    (id: string) => {
      if (pending.current === id) cancel();
      setHoverId((h) => (h === id ? null : h));
    },
    [cancel],
  );

  const reset = useCallback(() => {
    cancel();
    setHoverId(null);
  }, [cancel]);

  useEffect(() => cancel, [cancel]);

  return { hoverId, enter, leave, reset };
}
