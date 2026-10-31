// Width estimate for SUIT Variable (ratios unchanged from the former IBM Plex Sans KR estimate, not re-measured): Hangul / CJK / fullwidth glyphs are 1em, uppercase Latin ~0.72em and M/W/m/w ~0.9em (both err wide), everything else ~0.58em.
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

// 라틴 글자는 넉넉히 잰다: 적게 재면 CSS 가 말풍선 없이 줄임표로 자른다(넓게 재면 말풍선이 하나 더 뜰 뿐이다).
// M·W·m·w 는 거의 1em 에 가깝고, 대문자는 소문자보다 넓다.
const EXTRA_WIDE_LATIN = new Set(["M", "W", "m", "w"]);
const isUpper = (ch: string): boolean => ch >= "A" && ch <= "Z";

const ratio = (ch: string): number => {
  if (isWide(ch.codePointAt(0) ?? 0)) return 1;
  if (EXTRA_WIDE_LATIN.has(ch)) return 0.9;
  if (isUpper(ch)) return 0.72;
  return 0.58;
};

const charWidth = (ch: string, fontPx: number): number => ratio(ch) * fontPx;

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
