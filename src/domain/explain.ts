import { NODE_KINDS, type GroupKind } from "@/domain/catalog";
import { crossingEdges, groupMembers } from "@/domain/groupInfo";
import type { DiagramState, DNode, Group } from "@/domain/types";

/** 설명을 만드는 대상 종류. 서버 캐시(explanations.target_kind)와 화면 큐 키("kind:id")가 같은 이름을 쓴다. */
export type ExplainTargetKind = "node" | "edge" | "group";

// 끝의 버전: 구분자(공백·/·-·_) 뒤의 숫자("Tomcat 10")이거나 점이 든 숫자("Redis7.2").
// 구분자 없이 붙은 숫자 하나("L4", "S3")는 이름의 일부라 남긴다.
const TRAILING_VERSION = /(?:[\s/_-]+v?\d+(?:\.\d+)*|v?\d+(?:\.\d+)+)$/i;
const SEPARATORS = /[\s/_.-]+/g;

/** 용어 사전 key: 소문자, 공백·`/`·`-`·`_`·`.` 제거, 끝의 버전 숫자 제거. */
export function normalizeTerm(s: string): string {
  return s.trim().toLowerCase().replace(TRAILING_VERSION, "").replace(SEPARATORS, "");
}

/** 용어 후보가 나온 자리. sub 는 SW 이름이 아닐 수 있어(대수·"Multi-AZ" 등) AI 정의를 사전에 넣지 않는다. */
export type TermOrigin = "sw" | "sub" | "kind";

export interface TermCandidate {
  key: string;
  display: string;
  origin: TermOrigin;
}

/** 노드에서 사전을 찾아볼 용어 후보. attrs.sw → sub → 종류 한국어 이름 순, 빈 값·중복 key 제외. */
export function termCandidates(node: DNode): TermCandidate[] {
  const sw = node.attrs.sw;
  const raw: [string, TermOrigin][] = [
    [typeof sw === "string" || typeof sw === "number" ? String(sw) : "", "sw"],
    [node.sub ?? "", "sub"],
    [NODE_KINDS.find((k) => k.kind === node.kind)?.labelKo ?? "", "kind"],
  ];
  const out: TermCandidate[] = [];
  for (const [r, origin] of raw) {
    const display = r.trim();
    const key = normalizeTerm(display);
    if (!key || out.some((c) => c.key === key)) continue;
    out.push({ key, display, origin });
  }
  return out;
}

/**
 * 영역 종류마다 사전에서 찾을 용어. 기본 사전(seed)에 있는 말로 맞춘다.
 * 공개·내부 구역은 둘 다 서브넷이다(공개/내부 구분은 이름과 역할 설명이 맡는다).
 */
export const GROUP_TERMS: Record<GroupKind, string> = {
  cloud_region: "리전",
  vpc: "VPC",
  subnet_public: "서브넷",
  subnet_private: "서브넷",
  dmz: "DMZ",
  idc: "IDC",
  onprem_zone: "온프레미스",
  k8s_cluster: "쿠버네티스",
  network_zone: "망",
  external_service: "외부 서비스",
  redundancy_group: "이중화",
};

/**
 * 영역에서 사전을 찾아볼 용어 후보. 이름 → 종류 용어 순.
 * 이름은 용어가 아닐 수 있어 sub 처럼 사전에 넣지 않는다. 이름이 종류 용어와 같으면 종류 용어 하나로 친다.
 */
export function groupTermCandidates(group: Group): TermCandidate[] {
  const out: TermCandidate[] = [];
  const add = (raw: string, origin: TermOrigin) => {
    const display = raw.trim();
    const key = normalizeTerm(display);
    if (!key) return;
    const same = out.find((c) => c.key === key);
    if (same) {
      if (origin === "kind") same.origin = "kind";
      return;
    }
    out.push({ key, display, origin });
  };
  add(group.label, "sub");
  add(GROUP_TERMS[group.groupKind] ?? "", "kind");
  return out;
}

/** 노드·영역의 용어 후보. 연결이나 없는 대상이면 빈 목록. */
export function targetTermCandidates(state: DiagramState, kind: ExplainTargetKind, id: string): TermCandidate[] {
  if (kind === "node") return state.nodes[id] ? termCandidates(state.nodes[id]) : [];
  if (kind === "group") return state.groups[id] ? groupTermCandidates(state.groups[id]) : [];
  return [];
}

/** 화면이 받아 두는 사전 항목(용어 풀이 + 설명 패널에서 사전 정의를 바로 보이는 데 쓴다). */
export interface TermEntry {
  key: string;
  term: string;
  definition: string;
  aliases: string[];
  reviewed: boolean;
  /** 사전 항목을 누가 만들었나(기본 제공 seed / AI). "AI 설명" 배지는 AI 가 만든 항목에만 붙는다. */
  source: "seed" | "ai";
  why: string;
  compare: string;
}

/**
 * 후보 key 순서대로 사전 항목을 고른다(서버 findTerm 과 화면이 같은 규칙을 쓴다).
 * 한 key 에 key 일치와 alias 일치가 함께 있으면 key 일치가 이긴다.
 */
export function pickTerm<T extends { key: string; aliases: string[] }>(rows: T[], keys: string[]): T | null {
  for (const k of keys) {
    const hit = rows.find((r) => r.key === k) ?? rows.find((r) => r.aliases.includes(k));
    if (hit) return hit;
  }
  return null;
}

export interface NodeExplanation {
  kind: "node";
  term: string; // 표시 용어
  definition: string;
  definitionSource: "glossary" | "ai";
  reviewed: boolean; // 사전 항목의 검수 상태(ai 생성 직후 false)
  termSource?: "seed" | "ai"; // 정의를 가져온 사전 항목의 출처. 사전에 없던 AI 정의면 없다(definitionSource 가 ai).
  why?: string; // 사전에 있으면
  compare?: string; // 사전에 있으면
  role: string;
  adr: { decision: string; reason: string; alternative: string; cost: string };
}

/** 영역 설명. 정의 부분은 노드와 같고, 역할 다음에 경계(드나드는 것)가 붙는다. */
export interface GroupExplanation {
  kind: "group";
  term: string;
  definition: string;
  definitionSource: "glossary" | "ai";
  reviewed: boolean;
  termSource?: "seed" | "ai";
  why?: string;
  compare?: string;
  role: string;
  boundary: string;
  adr: { decision: string; reason: string; alternative: string; cost: string };
}

/** 정의 부분(사전 용어)이 있는 설명: 노드와 영역. */
export type TermedExplanation = NodeExplanation | GroupExplanation;
export type AnyExplanation = NodeExplanation | EdgeExplanation | GroupExplanation;

export interface EdgeExplanation {
  kind: "edge";
  flow: string;
  method: string;
  why: string;
  firewall: string;
}

/** 항목별 글자 수 상한(코드 포인트 기준). */
export const LIMITS = { definition: 120, role: 150, boundary: 150, adr: 80, why: 120, compare: 120, edge: 100 } as const;

const len = (s: string | undefined): number => (s ? [...s].length : 0);

/** 상한을 넘은 항목 이름 목록. 노드: definition, role, why, compare, adr.*; 영역: role 뒤에 boundary; 연결: flow, method, why, firewall. */
export function overLimit(e: AnyExplanation): string[] {
  const out: string[] = [];
  const check = (name: string, value: string | undefined, max: number) => {
    if (len(value) > max) out.push(name);
  };
  if (e.kind === "node" || e.kind === "group") {
    check("definition", e.definition, LIMITS.definition);
    check("role", e.role, LIMITS.role);
    if (e.kind === "group") check("boundary", e.boundary, LIMITS.boundary);
    check("why", e.why, LIMITS.why);
    check("compare", e.compare, LIMITS.compare);
    check("adr.decision", e.adr.decision, LIMITS.adr);
    check("adr.reason", e.adr.reason, LIMITS.adr);
    check("adr.alternative", e.adr.alternative, LIMITS.adr);
    check("adr.cost", e.adr.cost, LIMITS.adr);
  } else {
    check("flow", e.flow, LIMITS.edge);
    check("method", e.method, LIMITS.edge);
    check("why", e.why, LIMITS.edge);
    check("firewall", e.firewall, LIMITS.edge);
  }
  return out;
}

/** FNV-1a 32비트 → 8자리 16진수. 브라우저에서도 도는 순수 함수(crypto 불필요). */
function fnv1a(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

const attrText = (v: unknown): string | null => (typeof v === "string" || typeof v === "number" ? String(v) : null);

/** 연결 끝점: 노드(kind·label) 또는 영역(group·groupKind·label). 둘 다 없으면 null(끊어진 연결). */
function endpointOf(state: DiagramState, id: string): [string, string] | null {
  const n = state.nodes[id];
  if (n) return [n.kind, n.label];
  const g = state.groups[id];
  if (g) return [`group:${g.groupKind}`, g.label];
  return null;
}

/**
 * 설명이 낡았는지 판단하는 내용 서명. 대상이 없으면 null.
 * 노드: kind·label·sub·attrs.sw·attrs.version + 정렬한 연결 목록. 연결: edgeKind·label·양 끝 kind·label.
 * 영역: groupKind·label·망 종류 + 바로 안의 항목(kind·label) + 경계를 넘는 연결(edgeKind·label·방향·안쪽 끝·바깥 끝).
 * 연결 끝은 노드이거나 영역일 수 있다. cpu·ip 같은 다른 attrs 는 넣지 않는다.
 */
export function signatureOf(state: DiagramState, targetKind: ExplainTargetKind, id: string): string | null {
  if (targetKind === "group") {
    const g = state.groups[id];
    if (!g) return null;
    const members = groupMembers(state, id).map((m) => JSON.stringify([m.kind, m.id, ...(endpointOf(state, m.id) ?? ["", ""])]));
    const crossing = crossingEdges(state, id).map((c) => {
      const e = state.edges[c.edgeId]!;
      return JSON.stringify([e.edgeKind, e.label ?? "", c.dir, c.insideId, ...(endpointOf(state, c.insideId) ?? ["", ""]), c.outsideId, ...(endpointOf(state, c.outsideId) ?? ["", ""])]);
    });
    const sort = (xs: string[]) => [...xs].sort((x, y) => (x < y ? -1 : x > y ? 1 : 0));
    return fnv1a(JSON.stringify([g.groupKind, g.label, g.netType?.key ?? "", sort(members), sort(crossing)]));
  }
  if (targetKind === "edge") {
    const e = state.edges[id];
    if (!e) return null;
    const from = endpointOf(state, e.from);
    const to = endpointOf(state, e.to);
    if (!from || !to) return null;
    return fnv1a(JSON.stringify([e.edgeKind, e.label ?? "", ...from, ...to]));
  }
  const n = state.nodes[id];
  if (!n) return null;
  const links: { text: string }[] = [];
  for (const e of Object.values(state.edges)) {
    const dir = e.from === id ? "out" : e.to === id ? "in" : null;
    if (!dir) continue;
    const otherId = dir === "out" ? e.to : e.from;
    const other = endpointOf(state, otherId) ?? ["", ""];
    const entry = [e.edgeKind, dir, otherId, ...other];
    links.push({ text: JSON.stringify(entry) });
  }
  const sorted = links.map((l) => l.text).sort((x, y) => (x < y ? -1 : x > y ? 1 : 0));
  return fnv1a(`[${JSON.stringify(n.kind)},${JSON.stringify(n.label)},${JSON.stringify(n.sub ?? "")},${JSON.stringify(attrText(n.attrs.sw))},${JSON.stringify(attrText(n.attrs.version))},[${sorted.join(",")}]]`);
}
