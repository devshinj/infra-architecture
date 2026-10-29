// Width estimate for IBM Plex Sans KR: Hangul / CJK / fullwidth glyphs are 1em, everything else ~0.58em.
const WIDE: [number, number][] = [
  [0x1100, 0x11ff], // Hangul Jamo
  [0x2e80, 0x303f], // CJK radicals, symbols & punctuation
  [0x3040, 0x30ff], // Hiragana, Katakana
  [0x3130, 0x318f], // Hangul compatibility Jamo
  [0x3400, 0x4dbf], // CJK extension A
  [0x4e00, 0x9fff], // CJK unified ideographs
  [0xac00, 0xd7a3], // Hangul syllables
  [0xf900, 0xfaff], // CJK compatibility ideographs
  [0xff01, 0xff60], // Fullwidth forms
  [0xffe0, 0xffe6], // Fullwidth signs
];

const isWide = (cp: number): boolean => WIDE.some(([lo, hi]) => cp >= lo && cp <= hi);

const charWidth = (ch: string, fontPx: number): number => (isWide(ch.codePointAt(0) ?? 0) ? 1 : 0.58) * fontPx;

export function textWidth(s: string, fontPx: number): number {
  let w = 0;
  for (const ch of s) w += charWidth(ch, fontPx);
  return w;
}

const ELLIPSIS = "…";

export function truncate(s: string, maxPx: number, fontPx: number): string {
  if (textWidth(s, fontPx) <= maxPx) return s;
  const budget = maxPx - textWidth(ELLIPSIS, fontPx);
  let out = "";
  let w = 0;
  for (const ch of s) {
    const cw = charWidth(ch, fontPx);
    if (w + cw > budget) break;
    out += ch;
    w += cw;
  }
  return out + ELLIPSIS;
}
