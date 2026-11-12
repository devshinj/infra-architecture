// 사용자 말에 나온 사전 용어 찾기. 대화·질문 프롬프트에 그 용어의 정의만 붙이는 데 쓴다(사전 전체를 싣지 않는다).

/** 찾을 때 필요한 칸만. key·aliases 는 normalizeTerm 한 값이다. */
export interface MatchEntry {
  key: string;
  aliases: string[];
  term: string;
  definition: string;
}

export interface MatchedTerm {
  term: string;
  definition: string;
}

/** 한 번에 붙이는 용어 수 상한. */
export const GLOSSARY_MATCH_MAX = 6;

// normalizeTerm 과 같은 구분자. 끝의 버전 숫자는 떼지 않는다(문장 가운데의 말을 찾으므로).
const SEPARATOR = /[\s/_.-]/;
const ASCII_WORD = /[a-z0-9]/;
/** 이보다 짧은 이름은 찾지 않는다(한 글자는 아무 말에나 걸린다). */
const NAME_MIN = 2;

/** 소문자로 바꾸고 구분자를 뺀 글과, 그 글자마다의 원문 자리. */
function squash(text: string): { flat: string; at: number[]; lower: string } {
  const lower = text.toLowerCase();
  let flat = "";
  const at: number[] = [];
  for (let i = 0; i < lower.length; i++) {
    if (SEPARATOR.test(lower[i])) continue;
    flat += lower[i];
    at.push(i);
  }
  return { flat, at, lower };
}

/**
 * text 에 나온 사전 용어를 나온 차례로 돌려준다(최대 max 개).
 * - 표제어와 별칭을 구분자(공백·/·-·_·.)를 무시하고 찾는다("API 게이트웨이" = "api게이트웨이").
 * - 영문·숫자로 시작하거나 끝나는 이름은 그쪽이 다른 영문·숫자에 붙어 있으면 치지 않는다("was" 는 "wasabi" 에 걸리지 않는다).
 *   한글이 붙는 것은 조사일 수 있어 친다("SFU가").
 * - 긴 이름을 먼저 잡고, 이미 잡힌 자리와 겹치는 짧은 이름은 버린다("API 게이트웨이" 안의 "게이트웨이").
 */
export function matchGlossaryTerms(text: string, entries: readonly MatchEntry[], max: number = GLOSSARY_MATCH_MAX): MatchedTerm[] {
  const { flat, at, lower } = squash(text);
  if (!flat) return [];

  const names: { name: string; entry: MatchEntry }[] = [];
  for (const entry of entries) {
    for (const name of new Set([entry.key, ...entry.aliases])) {
      if ([...name].length >= NAME_MIN) names.push({ name, entry });
    }
  }
  // 긴 이름 먼저. 길이가 같으면 이름순(결과가 입력 순서에 흔들리지 않게).
  names.sort((a, b) => b.name.length - a.name.length || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

  const free = (start: number, end: number, taken: [number, number][]) => taken.every(([s, e]) => end <= s || start >= e);
  const bounded = (start: number, end: number, name: string) => {
    const before = at[start] > 0 ? lower[at[start] - 1] : "";
    const after = at[end - 1] + 1 < lower.length ? lower[at[end - 1] + 1] : "";
    if (ASCII_WORD.test(name[0]) && ASCII_WORD.test(before)) return false;
    if (ASCII_WORD.test(name[name.length - 1]) && ASCII_WORD.test(after)) return false;
    return true;
  };

  const taken: [number, number][] = [];
  const found = new Map<MatchEntry, number>();
  for (const { name, entry } of names) {
    if (found.has(entry)) continue;
    for (let from = 0; ; ) {
      const start = flat.indexOf(name, from);
      if (start < 0) break;
      const end = start + name.length;
      if (bounded(start, end, name) && free(start, end, taken)) {
        taken.push([start, end]);
        found.set(entry, start);
        break;
      }
      from = start + 1;
    }
  }
  return [...found]
    .sort((a, b) => a[1] - b[1])
    .slice(0, max)
    .map(([e]) => ({ term: e.term, definition: e.definition }));
}

/** 프롬프트에 붙이는 글. 용어가 없으면 빈 문자열. */
export function glossaryBlock(terms: readonly MatchedTerm[]): string {
  if (!terms.length) return "";
  return `용어 사전(요청에 나온 말의 뜻. 이 말을 설명할 때는 이 뜻을 따른다):\n${terms.map((t) => `- ${t.term}: ${t.definition}`).join("\n")}\n\n`;
}
