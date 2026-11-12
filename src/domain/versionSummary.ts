import { diffStates } from "./diff";
import type { DiagramState } from "./types";

/** 이력 한 줄에 담는 요청 글 최대 글자 수. 넘으면 말줄임표로 끝낸다. 화면은 한 줄에서 더 줄인다. */
export const REQUEST_MAX = 40;

/** "노드 +1 −2" 처럼 붙은 수와 뗀 수. 둘 다 0 이면 null. */
function plusMinus(name: string, added: number, removed: number): string | null {
  const parts = [added > 0 ? `+${added}` : "", removed > 0 ? `−${removed}` : ""].filter(Boolean);
  return parts.length > 0 ? `${name} ${parts.join(" ")}` : null;
}

/** 두 상태 사이의 증감: "노드 +1 · 연결 +2 · 변경 1". 바뀐 것이 없으면 빈 문자열. */
export function changeDelta(before: DiagramState, after: DiagramState): string {
  const { added, removed, changed } = diffStates(before, after);
  const count = (set: Set<string>, key: "nodes" | "edges" | "groups") => [...set].filter((id) => id in after[key] || id in before[key]).length;
  return [
    plusMinus("노드", count(added, "nodes"), count(removed, "nodes")),
    plusMinus("연결", count(added, "edges"), count(removed, "edges")),
    plusMinus("영역", count(added, "groups"), count(removed, "groups")),
    changed.size > 0 ? `변경 ${changed.size}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

/**
 * AI 차례 버전의 이력 한 줄: "<요청 글> · <증감>". 요청 글은 공백을 한 칸으로 줄이고 REQUEST_MAX 자에서 말줄임한다.
 * 요청 글이 비면 증감만, 증감도 없으면 요청 글만 남는다.
 */
export function turnVersionSummary(request: string, before: DiagramState, after: DiagramState): string {
  const clean = request.replace(/\s+/g, " ").trim();
  const chars = [...clean];
  const req = chars.length > REQUEST_MAX ? `${chars.slice(0, REQUEST_MAX - 1).join("")}…` : clean;
  return [req, changeDelta(before, after)].filter(Boolean).join(" · ");
}
