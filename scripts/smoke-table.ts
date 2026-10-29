/** 점검 스크립트용 순수 도우미: 표 서식과 정답률. */
export function formatTable(header: string[], rows: string[][]): string {
  const width = (s: string) => [...s].reduce((n, ch) => n + (ch.charCodeAt(0) > 0x2e7f ? 2 : 1), 0);
  const pad = (s: string, w: number) => s + " ".repeat(Math.max(0, w - width(s)));
  const widths = header.map((h, i) => Math.max(width(h), ...rows.map((r) => width(r[i] ?? ""))));
  const line = (cells: string[]) => cells.map((c, i) => pad(c, widths[i]!)).join(" | ");
  return [line(header), widths.map((w) => "-".repeat(w)).join("-+-"), ...rows.map(line)].join("\n");
}

export function accuracy(oks: boolean[]): string {
  const n = oks.filter(Boolean).length;
  return `${n}/${oks.length} (${oks.length ? Math.round((n / oks.length) * 100) : 0}%)`;
}
