import { useCallback, useEffect, useRef, useState } from "react";

/**
 * 마우스를 올린 대상 id. enter 뒤 delayMs 가 지나야 hoverId 가 되고, 그 전에 leave 하면 취소된다.
 * leave 도 같은 지연 뒤에 풀린다(그 사이 enter 가 오면 취소). 지나가기만 해도 화면이 깜빡이지 않게 하는 지연이다.
 * reset 은 곧바로 푼다.
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

  // 떠날 때도 같은 지연 뒤에 푼다. 이웃 노드로 옮기면(leave 뒤 곧 enter) enter 가 이 타이머를 취소해,
  // 강조가 풀렸다 다시 걸리며 화면이 숨 쉬듯 깜빡이지 않는다.
  const leave = useCallback(
    (id: string) => {
      // 다른 대상이 이미 기다리는 중이면 그쪽이 hoverId 를 바꾼다.
      if (pending.current !== null && pending.current !== id) return;
      cancel();
      timer.current = setTimeout(() => {
        timer.current = null;
        setHoverId((h) => (h === id ? null : h));
      }, delayMs);
    },
    [cancel, delayMs],
  );

  const reset = useCallback(() => {
    cancel();
    setHoverId(null);
  }, [cancel]);

  useEffect(() => cancel, [cancel]);

  return { hoverId, enter, leave, reset };
}
