import { Fragment } from "react";

export interface GlossaryTerm {
  key: string;
  term: string;
  definition: string;
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** 감쌀 수 있는 용어(2자 이상, exclude 뺌)를 글자(소문자) → 용어로, 그리고 긴 것 먼저 맞추는 정규식으로. */
function matcher(terms: GlossaryTerm[], exclude?: string): { byText: Map<string, GlossaryTerm>; re: RegExp } | null {
  const usable = terms.filter((t) => [...t.term].length >= 2 && t.key !== exclude);
  if (usable.length === 0) return null;
  const byText = new Map<string, GlossaryTerm>();
  for (const t of usable) if (!byText.has(t.term.toLowerCase())) byText.set(t.term.toLowerCase(), t);
  const pattern = [...byText.keys()].sort((a, b) => b.length - a.length).map(escapeRe).join("|");
  return { byText, re: new RegExp(`(?<![A-Za-z0-9])(${pattern})(?![A-Za-z0-9])`, "i") };
}

/**
 * 한 패널의 글들을 차례대로 읽어, 용어마다 처음 나오는 글에서만 밑줄을 다는 계획.
 * 돌려주는 것: 글마다 "이 글에서 밑줄을 달 용어 key". 같은 용어는 그 글 안에서도 첫 자리만 감싼다(TermText).
 * 렌더할 때마다 처음부터 다시 계산한다(바깥 상태를 두지 않아 두 번 그려도 같다).
 */
export function underlinePlan(texts: string[], terms: GlossaryTerm[], exclude?: string): Set<string>[] {
  const m = matcher(terms, exclude);
  const seen = new Set<string>();
  return texts.map((text) => {
    const mine = new Set<string>();
    if (!m) return mine;
    const parts = text.split(new RegExp(m.re.source, "gi"));
    for (let i = 1; i < parts.length; i += 2) {
      const hit = m.byText.get(parts[i]!.toLowerCase());
      if (hit && !seen.has(hit.key)) {
        seen.add(hit.key);
        mine.add(hit.key);
      }
    }
    return mine;
  });
}

/**
 * 본문 속 사전 용어에 점선 밑줄과 한 줄 풀이를 붙인다.
 * 2자 이상 용어만, 긴 것 먼저, 대소문자 무시. `exclude` 는 감싸지 않을 용어 key(대상 노드 자신).
 * `only` 를 주면 그 용어만, 글 안에서 처음 한 번만 감싼다(underlinePlan 이 정한 패널 첫 등장).
 */
export function TermText({ text, terms, exclude, only }: { text: string; terms: GlossaryTerm[]; exclude?: string; only?: ReadonlySet<string> }) {
  const m = matcher(terms, exclude);
  if (!m) return <>{text}</>;
  const { byText, re } = m;
  const parts = text.split(re);
  const done = new Set<string>();
  return (
    <>
      {parts.map((part, i) => {
        let hit = i % 2 === 1 ? byText.get(part.toLowerCase()) : undefined;
        if (hit && only) {
          if (!only.has(hit.key) || done.has(hit.key)) hit = undefined;
          else done.add(hit.key);
        }
        return hit ? (
          <abbr key={i} className="term" title={hit.definition} data-def={hit.definition} tabIndex={0}>
            {part}
          </abbr>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        );
      })}
    </>
  );
}
