import { createThinkStripper } from "./think";

const BAD_LINE_MAX = 160;

export function createJsonlParser(
  onLine: (value: unknown) => void,
  onBadLine: (text: string) => void,
): { push(chunk: string): void; end(): void } {
  let line = ""; // current line, think-stripped
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
      handle(line);
      line = "";
    },
  };
}
