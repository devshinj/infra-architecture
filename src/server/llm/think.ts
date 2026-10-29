const OPEN = "<think>";
const CLOSE = "</think>";

/** Length of the longest suffix of `s` that is a proper prefix of `tag`. */
function partialTagLen(s: string, tag: string): number {
  for (let k = Math.min(tag.length - 1, s.length); k > 0; k--) {
    if (s.endsWith(tag.slice(0, k))) return k;
  }
  return 0;
}

/**
 * 스트림에서 `<think>…</think>` 구간을 지운다(태그가 청크 경계에 걸쳐도).
 * 태그 앞부분일 수 있는 꼬리는 다음 청크까지 붙잡아 둔다. 빈 글은 onText 로 보내지 않는다.
 */
export function createThinkStripper(onText: (t: string) => void): { push(chunk: string): void; end(): void } {
  let raw = ""; // unprocessed input (may end with a partial tag)
  let inThink = false;
  let ended = false;
  const out = (t: string) => {
    if (t) onText(t);
  };

  const process = (): void => {
    for (;;) {
      if (inThink) {
        const i = raw.indexOf(CLOSE);
        if (i >= 0) {
          raw = raw.slice(i + CLOSE.length);
          inThink = false;
          continue;
        }
        raw = raw.slice(raw.length - partialTagLen(raw, CLOSE));
        return;
      }
      const i = raw.indexOf(OPEN);
      if (i >= 0) {
        const before = raw.slice(0, i);
        raw = raw.slice(i + OPEN.length);
        inThink = true;
        out(before);
        continue;
      }
      const hold = partialTagLen(raw, OPEN);
      const text = raw.slice(0, raw.length - hold);
      raw = raw.slice(raw.length - hold);
      out(text);
      return;
    }
  };

  return {
    push(chunk) {
      if (ended) return;
      raw += chunk;
      process();
    },
    end() {
      if (ended) return;
      ended = true;
      const rest = inThink ? "" : raw;
      raw = "";
      out(rest);
    },
  };
}
