import { categoryOf } from "./catalog";
import type { DNode, DiagramState, Edge, Warning, WarningLevel } from "./types";

interface Target { node: DNode; edge?: Edge }
interface Rule {
  rule: string;
  level: WarningLevel;
  patternId: string;
  template: (state: DiagramState, target: Target) => string;
  guide: string;
  /** Clef 판정 전용 규칙의 질문. */
  instructions?: string;
}

const PUBLIC_GROUPS = ["subnet_public", "dmz"];
export const DATA_KINDS = ["db_rdb", "db_nosql", "cache", "search", "db_proxy", "file_storage"];
const SPOF_KINDS = ["web_server", "was", "app_server", "db_rdb", "db_nosql", "lb_l4", "lb_l7"];

/** 노드의 조상 그룹 종류들(순환 방어). */
function ancestorKinds(state: DiagramState, node: DNode): string[] {
  const kinds: string[] = [];
  const seen = new Set<string>();
  let cur = node.parent;
  while (cur && !seen.has(cur)) {
    seen.add(cur);
    const g = state.groups[cur];
    if (!g) break;
    kinds.push(g.groupKind);
    cur = g.parent;
  }
  return kinds;
}

export const RULES: Rule[] = [
  {
    rule: "db_public",
    level: "warn",
    patternId: "web-was-db",
    template: (_s, { node }) => `${node.label}이(가) 공개 구역에 있어요.`,
    guide: "DB·캐시는 내부 구역에 두고 WAS 를 거쳐서만 접근하게 하세요.",
  },
  {
    rule: "spof",
    level: "warn",
    patternId: "web-was-db",
    template: (_s, { node }) => `${node.label}이(가) 1대뿐이라 멈추면 서비스도 멈춰요.`,
    guide: "같은 역할 서버를 2대 이상 두고 이중화 묶음(VIP)으로 묶으세요.",
  },
  {
    rule: "no_firewall",
    level: "warn",
    patternId: "lb-autoscale",
    template: (s, { node, edge }) => `${edge ? (s.nodes[edge.from]?.label ?? edge.from) : ""}에서 ${node.label}(으)로 바로 들어와요.`,
    guide: "외부 요청은 WAF·방화벽·로드밸런서를 거쳐 내부로 들어오게 하세요.",
  },
  {
    rule: "cache_without_db",
    level: "warn",
    patternId: "cache",
    template: (_s, { node }) => `${node.label}의 원본 데이터를 둘 DB 가 없어요.`,
    guide: "캐시는 원본 DB 앞의 계층이에요(Cache-aside). 원본 DB 를 함께 두세요.",
  },
  {
    rule: "db_exposed",
    level: "warn",
    patternId: "web-was-db",
    template: (_s, { node }) => `${node.label}이(가) 외부에서 직접 접근될 수 있어 보여요.`,
    guide: "DB 는 내부 구역에 두고, 외부와의 연결은 WAS 나 API 게이트웨이를 거치게 하세요.",
    instructions: "이 저장소가 인터넷(외부 사용자·외부 서비스)에서 방화벽 없이 직접 접근 가능한 위치에 있거나 그렇게 연결돼 있는가?",
  },
];

const ruleOf = (name: string) => RULES.find((r) => r.rule === name)!;

function make(state: DiagramState, rule: Rule, node: DNode, edge?: Edge): Warning {
  return {
    id: `${rule.rule}:${edge ? edge.id : node.id}`,
    rule: rule.rule,
    nodeId: node.id,
    ...(edge ? { edgeId: edge.id } : {}),
    level: rule.level,
    text: rule.template(state, { node, edge }),
    guide: rule.guide,
  };
}

/** 코드 규칙 4개를 평가한다. db_exposed 는 Clef 전용이라 여기서 만들지 않는다. */
export function evaluateRules(state: DiagramState): Warning[] {
  const nodes = Object.values(state.nodes);
  const edges = Object.values(state.edges);
  const out: Warning[] = [];

  const dbPublic = ruleOf("db_public");
  for (const n of nodes) {
    if (DATA_KINDS.includes(n.kind) && ancestorKinds(state, n).some((k) => PUBLIC_GROUPS.includes(k))) out.push(make(state, dbPublic, n));
  }

  const redundancy = state.assumptions.redundancy;
  // 이중화 가정이 없거나 "이중화 없음"(미확정)일 때만 켠다. 확정된 "이중화 없음"(의도)이나 다른 값(이중화됨)이면 끈다.
  const spofOff = !!redundancy && !(redundancy.value === "이중화 없음" && !redundancy.confirmed);
  if (!spofOff) {
    const spof = ruleOf("spof");
    for (const n of nodes) {
      if (SPOF_KINDS.includes(n.kind) && !ancestorKinds(state, n).includes("redundancy_group")) out.push(make(state, spof, n));
    }
  }

  const noFw = ruleOf("no_firewall");
  for (const e of edges) {
    if (e.edgeKind !== "request" && e.edgeKind !== "async") continue;
    const from = state.nodes[e.from];
    const to = state.nodes[e.to];
    if (!from || !to) continue;
    const fc = categoryOf(from.kind);
    const tc = categoryOf(to.kind);
    // 인그레스·배스천은 정당한 진입점이다.
    if (to.kind === "k8s_ingress" || to.kind === "bastion") continue;
    if ((fc === "client" || fc === "external") && (tc === "compute" || tc === "data")) out.push(make(state, noFw, to, e));
  }

  const cacheRule = ruleOf("cache_without_db");
  if (!nodes.some((n) => n.kind === "db_rdb" || n.kind === "db_nosql")) {
    for (const n of nodes) if (n.kind === "cache") out.push(make(state, cacheRule, n));
  }

  return out;
}

/** 화면 표시용 병합: 지금 걸리는 code 경고 + 저장된 Clef 경고, 무시 목록 분리. */
export function mergeWarnings(state: DiagramState): { active: Warning[]; ignored: Warning[] } {
  const stored = state.warnings ?? [];
  const storedById = new Map(stored.map((w) => [w.id, w]));
  const merged: Warning[] = evaluateRules(state).map((w) => {
    const s = storedById.get(w.id);
    return s ? { ...w, text: s.text } : w;
  });
  for (const w of stored) {
    if (w.rule === "db_exposed" && state.nodes[w.nodeId] && !merged.some((m) => m.id === w.id)) merged.push(w);
  }
  const ignoredIds = new Set(state.ignoredWarnings ?? []);
  return { active: merged.filter((w) => !ignoredIds.has(w.id)), ignored: merged.filter((w) => ignoredIds.has(w.id)) };
}

export function warningsByNode(active: Warning[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const w of active) out[w.nodeId] = (out[w.nodeId] ?? 0) + 1;
  return out;
}
