import { NODE_KINDS } from "@/domain/catalog";
import type { DNode } from "@/domain/types";

// 끝의 버전: 구분자(공백·/·-·_) 뒤의 숫자("Tomcat 10")이거나 점이 든 숫자("Redis7.2").
// 구분자 없이 붙은 숫자 하나("L4", "S3")는 이름의 일부라 남긴다.
const TRAILING_VERSION = /(?:[\s/_-]+v?\d+(?:\.\d+)*|v?\d+(?:\.\d+)+)$/i;
const SEPARATORS = /[\s/_.-]+/g;

/** 용어 사전 key: 소문자, 공백·`/`·`-`·`_`·`.` 제거, 끝의 버전 숫자 제거. */
export function normalizeTerm(s: string): string {
  return s.trim().toLowerCase().replace(TRAILING_VERSION, "").replace(SEPARATORS, "");
}

/** 노드에서 사전을 찾아볼 용어 후보. attrs.sw → sub → 종류 한국어 이름 순, 빈 값·중복 key 제외. */
export function termCandidates(node: DNode): { key: string; display: string }[] {
  const sw = node.attrs.sw;
  const raw = [
    typeof sw === "string" || typeof sw === "number" ? String(sw) : "",
    node.sub ?? "",
    NODE_KINDS.find((k) => k.kind === node.kind)?.labelKo ?? "",
  ];
  const out: { key: string; display: string }[] = [];
  for (const r of raw) {
    const display = r.trim();
    const key = normalizeTerm(display);
    if (!key || out.some((c) => c.key === key)) continue;
    out.push({ key, display });
  }
  return out;
}
