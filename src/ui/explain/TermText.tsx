import { Fragment } from "react";

export interface GlossaryTerm {
  key: string;
  term: string;
  definition: string;
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * 본문 속 사전 용어에 점선 밑줄과 한 줄 풀이를 붙인다.
 * 2자 이상 용어만, 긴 것 먼저, 대소문자 무시. `exclude` 는 감싸지 않을 용어 key(대상 노드 자신).
 */
export function TermText({ text, terms, exclude }: { text: string; terms: GlossaryTerm[]; exclude?: string }) {
  const usable = terms.filter((t) => [...t.term].length >= 2 && t.key !== exclude);
  if (usable.length === 0) return <>{text}</>;
  const byText = new Map<string, GlossaryTerm>();
  for (const t of usable) if (!byText.has(t.term.toLowerCase())) byText.set(t.term.toLowerCase(), t);
  const pattern = [...byText.keys()].sort((a, b) => b.length - a.length).map(escapeRe).join("|");
  const parts = text.split(new RegExp(`(${pattern})`, "i"));
  return (
    <>
      {parts.map((part, i) => {
        const hit = i % 2 === 1 ? byText.get(part.toLowerCase()) : undefined;
        return hit ? (
          <abbr key={i} className="term" title={hit.definition} tabIndex={0}>
            {part}
          </abbr>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        );
      })}
    </>
  );
}
