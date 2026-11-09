// 망 지식: 망 종류, 연결 규칙, 두 종류 사이에 보통 필요한 연결 방식 계산.
// 순수 모듈이다. DB·화면·AI 를 모른다.

export type NetGrade = "closed" | "internal" | "boundary" | "external";

export const GRADE_LABELS: Record<NetGrade, string> = {
  closed: "폐쇄",
  internal: "내부",
  boundary: "경계",
  external: "외부",
};

export type LinkMethod = "firewall" | "network_link" | "none";

export const METHOD_LABELS: Record<LinkMethod, string> = {
  firewall: "방화벽(또는 VPN)으로 됨",
  network_link: "망연계 필요",
  none: "보통 잇지 않음(예외 확인)",
};

export interface NetType {
  key: string;
  name: string;
  aliases: string[];
  description: string;
  grade: NetGrade;
}

/** 망 종류 짝 규칙. a < b 순서로 정렬해 둔다. */
export interface NetRule {
  a: string;
  b: string;
  method: LinkMethod;
  note?: string;
}

/** 숨긴 종류는 types 에서 빠진다. */
export interface NetworkKnowledge {
  types: Record<string, NetType>;
  rules: NetRule[];
}

/** 기본 등급 짝 규칙. 위에서부터 처음 맞는 줄을 쓴다. 짝은 순서를 가리지 않는다. */
export const GRADE_RULES: ReadonlyArray<{
  a: NetGrade;
  b: NetGrade | "*";
  method: LinkMethod;
}> = [
  { a: "closed", b: "*", method: "none" },
  { a: "internal", b: "external", method: "network_link" },
  { a: "internal", b: "boundary", method: "firewall" },
  { a: "boundary", b: "external", method: "firewall" },
  { a: "internal", b: "internal", method: "firewall" },
  { a: "boundary", b: "boundary", method: "firewall" },
  { a: "external", b: "external", method: "firewall" },
];

export function pairKey(a: string, b: string): [string, string] {
  return a <= b ? [a, b] : [b, a];
}

function gradeMethod(x: NetGrade, y: NetGrade): LinkMethod | null {
  for (const r of GRADE_RULES) {
    if (r.b === "*") {
      if (r.a === x || r.a === y) return r.method;
    } else if ((r.a === x && r.b === y) || (r.a === y && r.b === x)) {
      return r.method;
    }
  }
  return null;
}

/** 두 망 종류 사이에 보통 필요한 방식. 종류가 없거나 같은 종류면 null. */
export function requiredMethod(
  k: NetworkKnowledge,
  typeA: string,
  typeB: string,
): { method: LinkMethod; source: "default" | "user"; note?: string } | null {
  if (typeA === typeB) return null;
  const ta = k.types[typeA];
  const tb = k.types[typeB];
  if (!ta || !tb) return null;

  const [a, b] = pairKey(typeA, typeB);
  const user = k.rules.find((r) => r.a === a && r.b === b);
  if (user) {
    return user.note
      ? { method: user.method, source: "user", note: user.note }
      : { method: user.method, source: "user" };
  }

  const method = gradeMethod(ta.grade, tb.grade);
  return method ? { method, source: "default" } : null;
}
