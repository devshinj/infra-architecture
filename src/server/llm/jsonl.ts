import { createThinkStripper } from "./think";

const BAD_LINE_MAX = 160;
// 여러 줄에 걸친 객체는 이 크기·줄 수를 넘으면 한 줄짜리 깨진 글로 보고한다.
const MULTI_MAX_CHARS = 64 * 1024;
const MULTI_MAX_LINES = 200;

/** 한 줄을 훑어 중괄호 깊이 변화를 센다. 문자열 안의 중괄호는 세지 않는다. */
function scanLine(text: string, st: { depth: number; inStr: boolean; esc: boolean }): void {
  for (const ch of text) {
    if (st.inStr) {
      if (st.esc) st.esc = false;
      else if (ch === "\\") st.esc = true;
      else if (ch === '"') st.inStr = false;
    } else if (ch === '"') st.inStr = true;
    else if (ch === "{") st.depth++;
    else if (ch === "}") st.depth--;
  }
}

export function createJsonlParser(
  onLine: (value: unknown) => void,
  onBadLine: (text: string) => void,
): { push(chunk: string): void; end(): void } {
  let line = ""; // current line, think-stripped
  let ended = false;
  // 여러 줄에 걸친 객체를 모으는 중이면 지금까지 모은 글(없으면 null).
  let pending: string | null = null;
  let pendingLines = 0;
  let skipping = false; // 한도를 넘겨 버린 객체의 나머지 줄을 닫힐 때까지 건너뛰는 중
  const st = { depth: 0, inStr: false, esc: false };

  const handle = (text: string): void => {
    const t = text.trim();
    if (!t || t.startsWith("```")) return;
    let value: unknown;
    try {
      value = JSON.parse(t);
    } catch {
      onBadLine(t.slice(0, BAD_LINE_MAX));
      return;
    }
    onLine(value);
  };

  const flushPendingBad = (): void => {
    if (pending === null) return;
    onBadLine(pending.slice(0, BAD_LINE_MAX));
    pending = null;
  };

  /** 줄 하나를 받는다. 객체가 덜 닫혔으면 다음 줄들과 모아서 한 번에 읽는다. */
  const feed = (text: string): void => {
    const t = text.trim();
    if (skipping) {
      if (!(st.depth === 1 && !st.inStr && t.startsWith("{"))) {
        scanLine(t, st);
        if (st.depth <= 0) skipping = false;
        return;
      }
      skipping = false;
    }
    if (pending !== null) {
      if (!t) return;
      // 열린 객체의 바로 안쪽에서 "{" 로 시작하는 줄은 새 명령이다. 앞의 것은 깨진 것으로 보고 새로 시작한다.
      if (st.depth === 1 && !st.inStr && t.startsWith("{")) flushPendingBad();
    }
    if (pending === null) {
      if (!t.startsWith("{")) return handle(t);
      st.depth = 0;
      st.inStr = false;
      st.esc = false;
      scanLine(t, st);
      if (st.depth <= 0) return handle(t);
      pending = t;
      pendingLines = 1;
      return;
    }
    pending += "\n" + t;
    pendingLines++;
    scanLine(t, st);
    if (st.depth <= 0) {
      const whole = pending;
      pending = null;
      return handle(whole);
    }
    if (pending.length > MULTI_MAX_CHARS || pendingLines > MULTI_MAX_LINES) {
      flushPendingBad();
      skipping = true;
    }
  };

  const drainLines = (): void => {
    let i: number;
    while ((i = line.indexOf("\n")) >= 0) {
      const l = line.slice(0, i);
      line = line.slice(i + 1);
      feed(l);
    }
  };

  const stripper = createThinkStripper((t) => {
    line += t;
    drainLines();
  });

  return {
    push(chunk) {
      if (ended) return;
      stripper.push(chunk);
    },
    end() {
      if (ended) return;
      ended = true;
      stripper.end();
      feed(line);
      line = "";
      flushPendingBad();
      skipping = false;
    },
  };
}
