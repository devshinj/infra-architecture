const OPEN = "<think>";
const CLOSE = "</think>";
const BAD_LINE_MAX = 160;

/** Length of the longest suffix of `s` that is a proper prefix of `tag`. */
function partialTagLen(s: string, tag: string): number {
  for (let k = Math.min(tag.length - 1, s.length); k > 0; k--) {
    if (s.endsWith(tag.slice(0, k))) return k;
  }
  return 0;
}

export function createJsonlParser(
  onLine: (value: unknown) => void,
  onBadLine: (text: string) => void,
): { push(chunk: string): void; end(): void } {
  let raw = ""; // unprocessed input (may end with a partial tag)
  let line = ""; // current line, think-stripped
  let inThink = false;
  let ended = false;

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

  const drainLines = (): void => {
    let i: number;
    while ((i = line.indexOf("\n")) >= 0) {
      const l = line.slice(0, i);
      line = line.slice(i + 1);
      handle(l);
    }
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
        line += raw.slice(0, i);
        raw = raw.slice(i + OPEN.length);
        inThink = true;
        drainLines();
        continue;
      }
      const hold = partialTagLen(raw, OPEN);
      line += raw.slice(0, raw.length - hold);
      raw = raw.slice(raw.length - hold);
      drainLines();
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
      if (!inThink) line += raw;
      raw = "";
      drainLines();
      handle(line);
      line = "";
    },
  };
}
