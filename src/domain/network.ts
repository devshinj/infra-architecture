// 망 지식: 망 종류, 연결 규칙, 두 종류 사이에 보통 필요한 연결 방식 계산.
// 순수 모듈이다. DB·화면·AI 를 모른다.

export type NetGrade = "closed" | "internal" | "boundary" | "external";

export const GRADE_LABELS: Record<NetGrade, string> = {
  closed: "폐쇄",
  internal: "내부",
  boundary: "경계",
  external: "외부",
};

export type LinkMethod = "firewall" | "network_link" | "direct" | "none";

export const METHOD_LABELS: Record<LinkMethod, string> = {
  firewall: "방화벽(또는 VPN)으로 됨",
  network_link: "망연계 필요",
  // 서버와 스토리지망처럼 같은 장비의 다른 랜카드로 붙는 망. 사이에 통제 장비를 두지 않는다.
  direct: "직접 연결(사이에 통제 장비 없음)",
  none: "보통 잇지 않음(예외 확인)",
};

export interface NetType {
  key: string;
  name: string;
  aliases: string[];
  description: string;
  grade: NetGrade;
  /**
   * 망분리 대상: 규정이나 기관 방침으로 인터넷 같은 바깥 망과 떼어 놓는 망(행정망, 금융 업무망 등).
   * 내부↔외부가 망연계인 까닭은 "바깥이라서"가 아니라 "이 망이 분리 대상이라서"다.
   * 일반 기업 사무망·클라우드 프라이빗 서브넷처럼 방화벽·NAT 로 바깥과 잇는 망은 false 다.
   */
  separated: boolean;
}

/** 망 종류 짝 규칙. a < b 순서로 정렬해 둔다. */
export interface NetRule {
  a: string;
  b: string;
  method: LinkMethod;
  note?: string;
}

/**
 * 숨긴 종류는 types 에서 빠진다. rules 는 사용자가 등록한 기관 규칙,
 * baseRules 는 기본 제공 짝 규칙(network-seed 의 NETWORK_RULE_SEED)이다. 없으면 등급 규칙만 쓴다.
 */
export interface NetworkKnowledge {
  types: Record<string, NetType>;
  rules: NetRule[];
  baseRules?: readonly NetRule[];
}

/**
 * 기본 등급 짝 규칙. 위에서부터 처음 맞는 줄을 쓴다. 짝은 순서를 가리지 않는다.
 * when: "separated" 인 줄은 두 망 가운데 하나라도 망분리 대상일 때만 맞는다.
 */
export const GRADE_RULES: ReadonlyArray<{
  a: NetGrade;
  b: NetGrade | "*";
  method: LinkMethod;
  when?: "separated";
}> = [
  { a: "closed", b: "*", method: "none" },
  { a: "internal", b: "external", method: "network_link", when: "separated" },
  { a: "internal", b: "external", method: "firewall" },
  { a: "internal", b: "boundary", method: "firewall" },
  { a: "boundary", b: "external", method: "firewall" },
  { a: "internal", b: "internal", method: "firewall" },
  { a: "boundary", b: "boundary", method: "firewall" },
  { a: "external", b: "external", method: "firewall" },
];

export function pairKey(a: string, b: string): [string, string] {
  return a <= b ? [a, b] : [b, a];
}

function gradeMethod(x: NetGrade, y: NetGrade, separated: boolean): LinkMethod | null {
  for (const r of GRADE_RULES) {
    if (r.when === "separated" && !separated) continue;
    if (r.b === "*") {
      if (r.a === x || r.a === y) return r.method;
    } else if ((r.a === x && r.b === y) || (r.a === y && r.b === x)) {
      return r.method;
    }
  }
  return null;
}

/**
 * 두 망 종류 사이에 보통 필요한 방식. 종류가 없거나 같은 종류면 null.
 * 차례: 기관 규칙(user) → 기본 제공 짝 규칙 → 등급 규칙. 뒤의 둘은 source 가 "default" 다.
 */
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

  const base = k.baseRules?.find((r) => r.a === a && r.b === b);
  if (base) {
    return base.note ? { method: base.method, source: "default", note: base.note } : { method: base.method, source: "default" };
  }

  const method = gradeMethod(ta.grade, tb.grade, ta.separated || tb.separated);
  return method ? { method, source: "default" } : null;
}
