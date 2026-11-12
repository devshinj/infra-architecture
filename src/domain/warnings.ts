import { isDirectCrossing } from "./boundary";
import { categoryOf } from "./catalog";
import { isManaged, yesNo } from "./managed";
import type { NetworkKnowledge } from "./network";
import { evaluateNetworkRules, LINK_RULES } from "./networkRules";
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
const SPOF_KINDS = ["web_server", "was", "app_server", "db_rdb", "db_nosql", "lb_l4", "lb_l7", "db_proxy", "cache"];
/** 이 영역 안에 있으면 클라우드 노드로 본다(환경 가정은 자유 문장이라 쓰지 않는다). */
const CLOUD_GROUPS = ["cloud_region", "vpc"];
/** 관리형이면 여러 AZ 복제를 따로 켜야 하는 종류(RDS·Aurora·ElastiCache 등). 나머지 관리형(ALB·NLB·RDS Proxy 등)은 사업자가 이중화한다. */
const MULTI_AZ_KINDS = ["db_rdb", "db_nosql", "cache"];

const azOf = (n: DNode): string | null => {
  const v = n.attrs.az;
  return v === undefined || v === null || String(v).trim() === "" ? null : String(v).trim();
};
/** "WAS #2"·"WAS 2" 의 끝 번호를 뗀 이름. 같은 역할 서버인지 볼 때 쓴다. */
const baseLabel = (label: string) => label.replace(/\s*#?\s*\d+$/, "").trim();
/** 통신이 지나가야 쓸모 있는 노드. 연결이 하나도 없으면 놓기만 하고 길을 안 바꾼 것이다. */
const PASSTHROUGH_KINDS = ["firewall", "waf", "lb_l4", "lb_l7", "api_gateway", "nat", "vpn", "network_link", "cdn"];

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

/** 노드에서 가장 가까운 redundancy_group 영역 id. */
function nearestRedundancy(state: DiagramState, node: DNode): string | null {
  const seen = new Set<string>();
  for (let cur = node.parent; cur && !seen.has(cur); ) {
    seen.add(cur);
    const g = state.groups[cur];
    if (!g) break;
    if (g.groupKind === "redundancy_group") return g.id;
    cur = g.parent;
  }
  return null;
}

/**
 * 묶음 밖 노드의 문구. 같은 역할 서버(같은 종류이고 이름이 끝 번호만 다른 것, 예: WAS #1·WAS #2)가 따로 있으면
 * "1대뿐"은 사실과 달라 묶음에 없다고 말한다. 이름이 다른 같은 종류(주문 DB·결제 DB, 관리자 앱·API #1)는 같은 역할로 세지 않는다.
 */
function hasPeer(state: DiagramState, node: DNode): boolean {
  const base = baseLabel(node.label);
  return Object.values(state.nodes).some((n) => n.id !== node.id && n.kind === node.kind && baseLabel(n.label) === base);
}

/** 클라우드에서 직접 운영하는 묶음 구성원(관리형 제외). */
function membersOf(state: DiagramState, groupId: string): DNode[] {
  return Object.values(state.nodes)
    .filter((n) => SPOF_KINDS.includes(n.kind) && !isManaged(n) && nearestRedundancy(state, n) === groupId)
    .sort((a, b) => a.label.localeCompare(b.label, "ko", { numeric: true }) || (a.id < b.id ? -1 : 1));
}

const groupLabel = (state: DiagramState, node: DNode) => {
  const g = nearestRedundancy(state, node);
  return g ? (state.groups[g]?.label ?? g) : node.label;
};

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
    // 온프레미스(클라우드 영역 밖) 규칙: "이중화 묶음(VIP) 밖"이다.
    template: (s, { node }) =>
      hasPeer(s, node)
        ? `${node.label}이(가) 이중화 묶음(VIP)에 들어 있지 않아 멈춰도 대신할 서버로 넘어가지 않아요.`
        : `${node.label}이(가) 1대뿐이라 멈추면 서비스도 멈춰요.`,
    guide: "같은 역할 서버를 2대 이상 두고 이중화 묶음(VIP)으로 묶으세요.",
  },
  {
    rule: "spof_cloud",
    level: "warn",
    patternId: "lb-autoscale",
    // 클라우드에서 직접 운영하는 서버가 묶음(Auto Scaling·대상 그룹) 밖에 있다. 관리형은 여기 오지 않는다.
    template: (s, { node }) =>
      hasPeer(s, node)
        ? `${node.label}이(가) 같은 역할 서버 묶음에 들어 있지 않아 멈춰도 대신할 서버로 넘어가지 않아요.`
        : `${node.label}이(가) 1대뿐이라 멈추면 서비스도 멈춰요.`,
    guide: "같은 역할 서버를 2대 이상 서로 다른 AZ 에 두고 Auto Scaling 그룹(대상 그룹)으로 묶으세요.",
  },
  {
    rule: "az_spread",
    level: "warn",
    patternId: "lb-autoscale",
    // 묶음 하나에 경고 하나(첫 구성원 노드에 붙인다). AZ 를 모르는 구성원이 있으면 확인 필요다.
    template: (s, { node }) => {
      const g = nearestRedundancy(s, node);
      const azs = g ? membersOf(s, g).map(azOf) : [azOf(node)];
      const name = groupLabel(s, node);
      return azs.some((a) => a === null)
        ? `${name}의 서버들이 서로 다른 AZ 에 나뉘어 있는지 알 수 없어요.`
        : `${name}의 서버가 모두 AZ ${azs[0]}에 있어 그 AZ 가 멈추면 함께 멈춰요.`;
    },
    guide: "묶음 안 서버를 2개 이상의 AZ 에 나눠 두고, 노드마다 AZ 를 적으세요.",
  },
  {
    rule: "multi_az",
    level: "warn",
    patternId: "dr",
    template: (_s, { node }) =>
      yesNo(node.attrs.multi_az) === "no"
        ? `${node.label}이(가) 한 AZ 에만 있어 그 AZ 가 멈추면 데이터도 쓸 수 없어요.`
        : `${node.label}이(가) 여러 AZ 에 복제(Multi-AZ)되는지 알 수 없어요.`,
    guide: "관리형 DB·캐시는 Multi-AZ(다른 AZ 의 대기 복제본)를 켜고, 노드의 Multi-AZ 칸에 적으세요.",
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
  {
    rule: "network_direct",
    level: "warn",
    patternId: "external",
    template: (s, { node, edge }) => `${edge ? (s.nodes[edge.from]?.label ?? edge.from) : ""}에서 ${node.label}(으)로 망을 바로 넘어가요.`,
    guide: "서로 다른 망 사이 통신은 방화벽·망연계 솔루션·VPN 을 거치게 그리세요.",
  },
  {
    rule: "unused_passthrough",
    level: "warn",
    patternId: "external",
    template: (_s, { node }) => `${node.label}을(를) 지나는 연결이 없어 아무 통신도 거치지 않아요.`,
    guide: "지켜야 할 통신이 이 노드를 거치게 이어 주세요(예: 웹 서버 → 방화벽 → WAS).",
  },
];

const ruleOf = (name: string) => RULES.find((r) => r.rule === name)!;

/**
 * 문구를 늘 새로 계산하는 규칙. 지난 문구를 이어 쓰지도, Qwen 으로 다듬지도 않는다.
 * 같은 id 로 확인 필요↔경고가 바뀌거나 문구에 AZ 값이 들어가, 지난 문구가 사실과 달라질 수 있다.
 */
export const FIXED_TEXT_RULES: readonly string[] = [...LINK_RULES, "az_spread", "multi_az"];

function make(state: DiagramState, rule: Rule, node: DNode, edge?: Edge, level: WarningLevel = rule.level): Warning {
  return {
    id: `${rule.rule}:${edge ? edge.id : node.id}`,
    rule: rule.rule,
    nodeId: node.id,
    ...(edge ? { edgeId: edge.id } : {}),
    level,
    text: rule.template(state, { node, edge }),
    guide: rule.guide,
  };
}

/**
 * 이중화 점검. 클라우드 영역(cloud_region·vpc) 밖은 온프레미스 규칙(VIP 묶음), 안은 클라우드 규칙이다.
 * - 관리형(attrs.managed=yes) LB·컴퓨트·DB 중계는 사업자가 여러 AZ 로 이중화하므로 보지 않는다.
 * - 관리형 DB·캐시는 attrs.multi_az 를 본다: no 면 경고, 모르면 확인 필요.
 * - 직접 운영하는 서버는 묶음 밖이면 spof_cloud, 묶음 안이면 구성원의 AZ 가 2곳 이상인지 본다(모르면 확인 필요).
 */
function redundancyWarnings(state: DiagramState): Warning[] {
  const out: Warning[] = [];
  const checkedGroups = new Set<string>();
  for (const n of Object.values(state.nodes)) {
    if (!SPOF_KINDS.includes(n.kind)) continue;
    const kinds = ancestorKinds(state, n);
    if (!kinds.some((k) => CLOUD_GROUPS.includes(k))) {
      if (!kinds.includes("redundancy_group")) out.push(make(state, ruleOf("spof"), n));
      continue;
    }
    if (isManaged(n)) {
      if (!MULTI_AZ_KINDS.includes(n.kind)) continue;
      const multi = yesNo(n.attrs.multi_az);
      if (multi !== "yes") out.push(make(state, ruleOf("multi_az"), n, undefined, multi === "no" ? "warn" : "check"));
      continue;
    }
    const g = nearestRedundancy(state, n);
    if (!g) {
      out.push(make(state, ruleOf("spof_cloud"), n));
      continue;
    }
    if (checkedGroups.has(g)) continue;
    checkedGroups.add(g);
    const members = membersOf(state, g);
    const azs = members.map(azOf);
    if (azs.some((a) => a === null)) out.push(make(state, ruleOf("az_spread"), members[0]!, undefined, "check"));
    else if (new Set(azs).size < 2) out.push(make(state, ruleOf("az_spread"), members[0]!));
  }
  return out;
}

/** 코드 규칙을 평가한다. db_exposed 는 Clef 전용이라 여기서 만들지 않는다. */
export function evaluateRules(state: DiagramState, knowledge?: NetworkKnowledge): Warning[] {
  const nodes = Object.values(state.nodes);
  const edges = Object.values(state.edges);
  const out: Warning[] = [];

  const dbPublic = ruleOf("db_public");
  for (const n of nodes) {
    if (DATA_KINDS.includes(n.kind) && ancestorKinds(state, n).some((k) => PUBLIC_GROUPS.includes(k))) out.push(make(state, dbPublic, n));
  }

  const redundancy = state.assumptions.redundancy;
  // 이중화 가정 값과 상관없이 redundancy_group 밖의 단일 노드는 경고한다. 사용자가 "이중화 없음"을 확정(의도)했을 때만 끈다.
  const spofOff = !!redundancy && redundancy.value === "이중화 없음" && redundancy.confirmed;
  if (!spofOff) out.push(...redundancyWarnings(state));

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

  const netDirect = ruleOf("network_direct");
  for (const e of edges) {
    if (!isDirectCrossing(state, e)) continue;
    out.push(make(state, netDirect, state.nodes[e.to], e));
  }

  const unused = ruleOf("unused_passthrough");
  const touched = new Set(edges.flatMap((e) => [e.from, e.to]));
  for (const n of nodes) {
    if (PASSTHROUGH_KINDS.includes(n.kind) && !touched.has(n.id)) out.push(make(state, unused, n));
  }

  const cacheRule = ruleOf("cache_without_db");
  if (!nodes.some((n) => n.kind === "db_rdb" || n.kind === "db_nosql")) {
    for (const n of nodes) if (n.kind === "cache") out.push(make(state, cacheRule, n));
  }

  if (knowledge) out.push(...evaluateNetworkRules(state, knowledge));
  return out;
}

/** 화면 표시용 병합: 지금 걸리는 code 경고 + 저장된 Clef 경고, 무시 목록 분리. */
export function mergeWarnings(state: DiagramState, knowledge?: NetworkKnowledge): { active: Warning[]; ignored: Warning[] } {
  const stored = state.warnings ?? [];
  const storedById = new Map(stored.map((w) => [w.id, w]));
  const merged: Warning[] = evaluateRules(state, knowledge).map((w) => {
    const s = storedById.get(w.id);
    // 망연계 예상·AZ 경고는 저장된 문구로 덮지 않는다(종류·지식·AZ 값이 바뀌면 문구도 달라진다).
    return s && !FIXED_TEXT_RULES.includes(w.rule) ? { ...w, text: s.text } : w;
  });
  for (const w of stored) {
    if (w.rule === "db_exposed" && state.nodes[w.nodeId] && !merged.some((m) => m.id === w.id)) merged.push(w);
  }
  const ignoredIds = new Set(state.ignoredWarnings ?? []);
  return { active: merged.filter((w) => !ignoredIds.has(w.id)), ignored: merged.filter((w) => ignoredIds.has(w.id)) };
}

/** 차례 전후의 화면 경고(무시 제외) 변화. 대화의 주의 칩이 새로·해결·지금 모두를 보여 준다. */
export interface WarningCounts {
  fresh: number;
  resolved: number;
  now: number;
}

export function warningDelta(before: DiagramState, after: DiagramState, knowledge?: NetworkKnowledge): WarningCounts {
  const was = new Set(mergeWarnings(before, knowledge).active.map((w) => w.id));
  const is = new Set(mergeWarnings(after, knowledge).active.map((w) => w.id));
  return {
    fresh: [...is].filter((id) => !was.has(id)).length,
    resolved: [...was].filter((id) => !is.has(id)).length,
    now: is.size,
  };
}

export function warningsByNode(active: Warning[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const w of active) out[w.nodeId] = (out[w.nodeId] ?? 0) + 1;
  return out;
}
