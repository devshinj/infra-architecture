// 통신 길 판정: 경계 노드만 거쳐 이어진 길이 두 망 사이의 필요한 방식과 맞는지 본다. 순수 모듈이다.
import { noLinkKey } from "./assumptions";
import { BOUNDARY_NODE_KINDS, isLocalLink, networkZoneOf } from "./boundary";
import { GRADE_LABELS, pairKey, requiredMethod, type NetworkKnowledge } from "./network";
import type { DiagramState, Warning } from "./types";

/** 양 끝은 경계 노드 아닌 노드, via 는 거친 경계 노드. */
export interface CrossingPath { from: string; to: string; edges: string[]; via: string[] }

export const LINK_RULES = ["link_expected", "link_unusual"] as const;
export type LinkRule = (typeof LINK_RULES)[number];

/** 망 짝 기준 경고 id. 같은 두 망 사이는 길이 여럿이어도 하나다. */
export function linkWarningId(rule: LinkRule, zoneA: string, zoneB: string): string {
  const [a, b] = pairKey(zoneA, zoneB);
  return `${rule}:${a}--${b}`;
}

const ZONE_ID = /^[a-z0-9][a-z0-9-]{0,63}$/;

/** linkWarningId 로 만든 id 면 규칙과 두 망 id(작은 쪽부터), 아니면 null. */
export function parseLinkWarningId(id: string): { rule: LinkRule; zoneA: string; zoneB: string } | null {
  const rule = LINK_RULES.find((r) => id.startsWith(`${r}:`));
  if (!rule) return null;
  const rest = id.slice(rule.length + 1);
  for (let i = rest.indexOf("--"); i !== -1; i = rest.indexOf("--", i + 1)) {
    const a = rest.slice(0, i);
    const b = rest.slice(i + 2);
    if (ZONE_ID.test(a) && ZONE_ID.test(b) && a < b) return { rule, zoneA: a, zoneB: b };
  }
  return null;
}

export const LINK_GUIDE = "망연계를 넣으려면 대화로 '망연계 넣어 줘'라고 말해 주세요.";

/** 모든 통신 길. 연결 방향으로 따라가고, 경계 노드 고리에서 멈추며, 끝이 그룹인 연결은 건너뛴다. */
export function crossingPaths(state: DiagramState): CrossingPath[] {
  const out: CrossingPath[] = [];
  const outgoing = new Map<string, string[]>();
  for (const e of Object.values(state.edges)) {
    if (!state.nodes[e.from] || !state.nodes[e.to]) continue;
    // 근거리 무선·유선 직렬은 망을 거치지 않으므로 망 사이 통신 길로 따라가지 않는다.
    if (isLocalLink(e.medium)) continue;
    outgoing.set(e.from, [...(outgoing.get(e.from) ?? []), e.id]);
  }

  const walk = (start: string, cur: string, edges: string[], via: string[]) => {
    for (const id of outgoing.get(cur) ?? []) {
      const next = state.nodes[state.edges[id].to];
      if (BOUNDARY_NODE_KINDS.has(next.kind)) {
        if (via.includes(next.id)) continue;
        walk(start, next.id, [...edges, id], [...via, next.id]);
      } else {
        out.push({ from: start, to: next.id, edges: [...edges, id], via });
      }
    }
  };
  for (const n of Object.values(state.nodes)) {
    if (!BOUNDARY_NODE_KINDS.has(n.kind)) walk(n.id, n.id, [], []);
  }
  return out;
}

export interface LinkVerdict {
  rule: LinkRule;
  zoneA: string; // pairKey 순서
  zoneB: string;
  source: "default" | "user";
  note?: string;
  path: CrossingPath;
}

/** 규칙에 걸리는 길마다 하나씩(짝 모으기 전). 확정된 no_link 가정이 있는 짝의 link_expected 는 뺀다. */
export function linkVerdicts(state: DiagramState, k: NetworkKnowledge): LinkVerdict[] {
  const out: LinkVerdict[] = [];
  for (const path of crossingPaths(state)) {
    const za = networkZoneOf(state, path.from);
    const zb = networkZoneOf(state, path.to);
    if (!za || !zb || za === zb) continue;
    const ta = state.groups[za]?.netType;
    const tb = state.groups[zb]?.netType;
    if (!ta || !tb) continue;
    const req = requiredMethod(k, ta.key, tb.key);
    if (!req) continue;
    const [a, b] = pairKey(za, zb);
    let rule: LinkRule | null = null;
    if (req.method === "none") rule = "link_unusual";
    else if (req.method === "network_link" && !path.via.some((id) => state.nodes[id]?.kind === "network_link")) rule = "link_expected";
    if (!rule) continue;
    // 대화 지시(미확정 가정)는 안내를 끄지 않는다. 사용자가 확정한 거절만 끈다.
    if (rule === "link_expected" && state.assumptions[noLinkKey(a, b)]?.confirmed === true) continue;
    out.push({ rule, zoneA: a, zoneB: b, source: req.source, ...(req.note ? { note: req.note } : {}), path });
  }
  return out;
}

const CHECK_TAIL = "기관 규정과 방화벽 담당자에게 확인해 보세요.";

function textOf(state: DiagramState, k: NetworkKnowledge, v: LinkVerdict): string {
  const gradeOf = (zoneId: string) => {
    const t = state.groups[zoneId]?.netType;
    return t ? k.types[t.key]?.grade : undefined;
  };
  const prefix = [v.zoneA, v.zoneB]
    .map((id) => {
      const t = state.groups[id]?.netType;
      const def = t ? k.types[t.key] : undefined;
      return t && def && t.source === "ai" && !t.confirmed ? `${state.groups[id].label}을(를) '${def.name}'(으)로 추정했어요. ` : "";
    })
    .join("");

  // 폐쇄망을 앞에 두고 "(폐쇄)" 를 붙인다.
  let [first, second] = [v.zoneA, v.zoneB];
  if (gradeOf(second) === "closed" && gradeOf(first) !== "closed") [first, second] = [second, first];
  const nameA = state.groups[first]?.label ?? first;
  const nameB = state.groups[second]?.label ?? second;
  const named = v.rule === "link_unusual" && gradeOf(first) === "closed" ? `${nameA}(${GRADE_LABELS.closed})와(과) ${nameB}` : `${nameA}와(과) ${nameB}`;
  const basis = v.note ? `등록한 기관 규칙(${v.note})에 따르면` : "등록한 기관 규칙에 따르면";

  // 기본 제공 짝 규칙에 달린 까닭 한 줄(기관 규칙의 근거는 basis 로 따로 말한다).
  const hint = v.source === "default" && v.note ? `${v.note} ` : "";

  let body: string;
  if (v.rule === "link_expected") {
    body =
      v.source === "user"
        ? `${basis} ${named} 사이는 망연계가 필요해요.`
        : `보통 ${named} 사이는 방화벽 허용만으로는 통신할 수 없고 망연계가 필요해요. ${hint}${CHECK_TAIL}`;
  } else {
    body =
      v.source === "user"
        ? `${basis} ${named} 사이는 보통 잇지 않는 구간이에요.`
        : `${named} 사이는 보통 잇지 않는 구간이에요. ${hint}예외로 허용되는지 ${CHECK_TAIL}`;
  }
  return prefix + body;
}

/** 망 짝마다 경고 하나. 단계는 check(확인 권고)다. */
export function evaluateNetworkRules(state: DiagramState, k: NetworkKnowledge): Warning[] {
  const byId = new Map<string, LinkVerdict>();
  for (const v of linkVerdicts(state, k)) {
    const id = linkWarningId(v.rule, v.zoneA, v.zoneB);
    if (!byId.has(id)) byId.set(id, v);
  }
  return [...byId].map(([id, v]) => ({
    id,
    rule: v.rule,
    nodeId: v.path.to,
    edgeId: v.path.edges[v.path.edges.length - 1],
    level: "check" as const,
    text: textOf(state, k, v),
    guide: LINK_GUIDE,
  }));
}
