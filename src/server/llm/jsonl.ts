import { createThinkStripper } from "./think";

const BAD_LINE_MAX = 160;
// 여러 줄에 걸친 객체는 이 크기·줄 수를 넘으면 한 줄짜리 깨진 글로 보고한다.
const MULTI_MAX_CHARS = 64 * 1024;
const MULTI_MAX_LINES = 200;

/** 객체 사이에 끼어도 무시하는 글자: 공백, 배열로 감쌀 때의 `[` `]`, 객체 뒤 쉼표. */
const WRAP = /[\s,[\]]/;
const stripWrap = (t: string) => t.replace(/^[\s,[\]]+/, "").replace(/[\s,[\]]+$/, "");

interface Scan {
  depth: number;
  inStr: boolean;
  esc: boolean;
}

/** 한 줄을 훑어 중괄호 깊이 변화를 센다. 문자열 안의 중괄호는 세지 않는다. */
function scanLine(text: string, st: Scan): void {
  for (const ch of text) step(ch, st);
}

function step(ch: string, st: Scan): void {
  if (st.inStr) {
    if (st.esc) st.esc = false;
    else if (ch === "\\") st.esc = true;
    else if (ch === '"') st.inStr = false;
  } else if (ch === '"') st.inStr = true;
  else if (ch === "{") st.depth++;
  else if (ch === "}") st.depth--;
}

/** 그 글만으로 "op" 키가 있는 완전한 JSON 객체인지(새 명령의 시작으로 볼지). */
function isCommandLine(t: string): boolean {
  try {
    const v: unknown = JSON.parse(t);
    return typeof v === "object" && v !== null && !Array.isArray(v) && Object.hasOwn(v, "op");
  } catch {
    return false;
  }
}

/**
 * 모델 출력에서 JSON 객체를 하나씩 꺼낸다. 한 줄에 하나가 기본이지만 다음도 읽는다:
 * 여러 줄로 펼쳐 쓴 객체(문자열 밖 중괄호 깊이로 닫힘을 안다), 한 줄에 여러 객체, 객체 뒤 쉼표,
 * `[` `]` 로 감싼 배열, 코드 펜스 줄(건너뜀). 객체가 닫히는 줄에서 바로 onLine 을 부른다.
 * 깨진 글은 onBadLine 으로 알린다. `end({ dropPartial: true })` 면 끝에서 덜 닫힌 객체를 알리지 않고 버린다
 * (출력 한도로 끊긴 꼬리).
 * onText 를 주면 객체 밖의 일반 글(중괄호가 없는 글)은 깨진 글 대신 onText 로 자르지 않고 넘긴다.
 * 중괄호가 있는 글은 부서진 JSON 조각으로 보고 그대로 onBadLine 으로 보낸다.
 */
export function createJsonlParser(
  onLine: (value: unknown) => void,
  onBadLine: (text: string) => void,
  onText?: (text: string) => void,
): { push(chunk: string): void; end(opts?: { dropPartial?: boolean }): void } {
  let line = ""; // current line, think-stripped
  let ended = false;
  // 여러 줄에 걸친 객체를 모으는 중이면 지금까지 모은 글(없으면 null).
  let pending: string | null = null;
  let pendingLines = 0;
  let skipping = false; // 한도를 넘겨 버린 객체의 나머지 줄을 닫힐 때까지 건너뛰는 중
  const st: Scan = { depth: 0, inStr: false, esc: false };

  const bad = (t: string) => onBadLine(t.trim().slice(0, BAD_LINE_MAX));

  const handleObject = (text: string): void => {
    let value: unknown;
    try {
      value = JSON.parse(text);
    } catch {
      bad(text);
      return;
    }
    onLine(value);
  };

  const flushPendingBad = (): void => {
    if (pending === null) return;
    bad(pending);
    pending = null;
  };

  /** 줄 하나를 글자 단위로 훑는다. 객체 밖의 감싸는 글자는 무시하고, 객체가 닫히면 바로 읽는다. */
  const scanChars = (t: string): void => {
    let i = 0;
    while (i < t.length) {
      if (pending === null) {
        const ch = t[i]!;
        if (WRAP.test(ch)) {
          i++;
          continue;
        }
        if (ch !== "{") {
          // 객체 밖의 다른 글: 그 줄의 나머지를 일반 글(onText 가 있고 중괄호가 없을 때) 또는 깨진 글로
          const rest = t.slice(i).trim();
          if (onText && !/[{}]/.test(rest)) onText(rest);
          else bad(rest);
          return;
        }
        pending = "";
        pendingLines = 1;
        st.depth = 0;
        st.inStr = false;
        st.esc = false;
      }
      const start = i;
      while (i < t.length) {
        step(t[i]!, st);
        i++;
        if (st.depth <= 0 && !st.inStr) break;
      }
      pending += t.slice(start, i);
      if (st.depth <= 0 && !st.inStr) {
        const whole = pending;
        pending = null;
        handleObject(whole);
      }
    }
  };

  /** 줄 하나를 받는다. 객체가 덜 닫혔으면 다음 줄들과 모아서 한 번에 읽는다. tail 은 줄바꿈 없이 끝난 마지막 줄. */
  const feed = (text: string, tail = false): void => {
    const t = text.trim();
    if (pending !== null || skipping) {
      // 모으는 중에 코드 펜스가 오면 앞의 것은 깨진 것으로 알리고 펜스는 건너뛴다.
      if (t.startsWith("```")) {
        flushPendingBad();
        skipping = false;
        return;
      }
      // 그 줄만으로 "op" 가 있는 완전한 JSON 객체인 줄이 오면, 앞의 것은 깨진 한 줄로 알리고 이 줄은 새 명령으로 읽는다.
      // 그렇지 않으면 계속 모은다(여는 괄호만 다음 줄에 있는 객체, attrs 안 배열의 객체 줄도 온전히 읽는다).
      const core = stripWrap(t);
      if (core.startsWith("{") && isCommandLine(core)) {
        flushPendingBad();
        skipping = false;
      }
    }
    if (skipping) {
      scanLine(t, st);
      if (st.depth <= 0) skipping = false;
      return;
    }
    if (pending === null) {
      if (!t || t.startsWith("```")) return;
    } else {
      if (!t) return;
      pending += "\n";
      pendingLines++;
    }
    scanChars(t);
    if (pending === null) return;
    // JSON 문자열에는 날 줄바꿈이 올 수 없다: 줄 끝에서 문자열이 열려 있으면 이 객체는 깨졌다.
    // (끊긴 마지막 줄은 줄바꿈 없이 끝나 이 검사를 하지 않는다.)
    if (tail) return;
    if (st.inStr) {
      flushPendingBad();
      return;
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
    end(opts) {
      if (ended) return;
      ended = true;
      stripper.end();
      const last = line;
      line = "";
      const drop = opts?.dropPartial === true;
      feed(last, drop);
      // 끊긴 꼬리: 끝에 남은 덜 닫힌 객체는 알리지 않고 버린다(그 앞에서 닫힌 객체는 이미 읽었다).
      if (drop) pending = null;
      else flushPendingBad();
      skipping = false;
    },
  };
}
