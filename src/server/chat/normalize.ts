/**
 * AI 출력 한 줄을 도메인 스키마에 넘기기 전에 다듬는다. 대화 경로와 점검 스크립트만 쓴다.
 * 도메인 스키마(`@/domain/commands`)는 엄격하게 두고, 모델이 흔히 내는 형태만 받아 준다.
 * - 생략 가능하지만 null 은 안 되는 칸의 null → 키 제거
 * - add_node / add_group 에 parent 가 없으면 parent: null
 * - attrs 값: 문자열·숫자 배열 → "a, b", true/false → "true"/"false"
 * 그 밖의 값은 그대로 둬서 스키마가 거부하게 한다.
 */

/** op 별로 "생략 가능, null 불가" 인 칸. parent 는 null 을 받으므로 넣지 않는다. */
const DROP_NULL: Readonly<Record<string, readonly string[]>> = {
  add_node: ["sub", "attrs"],
  add_edge: ["id", "label"],
  update_node: ["label", "sub", "attrs"],
  update_edge: ["label", "edge_kind"],
};

const NEEDS_PARENT: ReadonlySet<string> = new Set(["add_node", "add_group"]);
const HAS_ATTRS: ReadonlySet<string> = new Set(["add_node", "update_node"]);

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

function flattenAttr(v: unknown): unknown {
  if (typeof v === "boolean") return v ? "true" : "false";
  if (Array.isArray(v) && v.every((x) => typeof x === "string" || typeof x === "number")) return v.join(", ");
  return v;
}

export function normalizeAiCommand(raw: unknown): unknown {
  if (!isPlainObject(raw) || typeof raw.op !== "string") return raw;
  const op = raw.op;
  const out: Record<string, unknown> = { ...raw };
  for (const key of DROP_NULL[op] ?? []) {
    if (out[key] === null) delete out[key];
  }
  if (NEEDS_PARENT.has(op) && !("parent" in out)) out.parent = null;
  if (HAS_ATTRS.has(op) && isPlainObject(out.attrs)) {
    out.attrs = Object.fromEntries(Object.entries(out.attrs).map(([k, v]) => [k, flattenAttr(v)]));
  }
  return out;
}
