import { NODE_KINDS } from "@/domain/catalog";
import { LIMITS, type NodeExplanation } from "@/domain/explain";
import type { Flow } from "@/domain/flows";
import type { MissingItem } from "@/domain/missing";
import { METHOD_LABELS, pairKey, requiredMethod, type NetworkKnowledge } from "@/domain/network";
import type { DiagramState } from "@/domain/types";
import type { Intent } from "@/server/llm/clef";
import { COMMAND_EXAMPLES, DRAW_RULE_GROUPS, KIND_BLOCK, patternBlock, gradeRuleLines, networkTypeLines, userRuleLines } from "@/server/drawing/rules";
import type { ChatMessage } from "@/server/llm/qwen";

export const HISTORY_LIMIT = 20;
const MISSING_LINES_MAX = 40;

// 그리기 규칙·종류 목록·attrs 칸 목록은 공용 모듈(MCP get_guide 와 같은 글)에 있다.
export { ATTR_LIST } from "@/server/drawing/rules";

const MISSING_FORMAT_NOTE =
  "값을 반영하는 명령은 한 줄에 JSON 하나로, 줄바꿈 없이 쓴다. 사용자가 말한 대상마다 따로 update_node 를 낸다. 연결의 전달물·방향은 update_edge 의 payload·direction 으로 낸다.";

const R = DRAW_RULE_GROUPS;

export const SYSTEM_PROMPT = `너는 인프라 아키텍처 구성도를 그리는 도구의 엔진이다.
사용자 요청을 받아 구성도 변경 명령을 JSON Lines 로만 출력한다. 한 줄에 JSON 객체 하나. 다른 글, 코드펜스, 설명 금지.

명령 종류:
{"op":"say","text":"진행 상황 한 줄(예: L7 로드밸런서 추가…)"}
${COMMAND_EXAMPLES}

${KIND_BLOCK}

규칙:
${R[0]} 영역을 바꿔야 하면 say 로 알리고 노드만 수정한다.
${R[1]}
- "망 짝 규칙"이 보통 잇지 않음인 두 망을 이으라고 하면 요청대로 그리고, 보통 잇지 않는 구간이라고 say 로 한 줄 알린다.
${R[2]}
- 각 단계마다 say 로 진행 상황을 짧게 알린다.
- JSON 객체 하나를 여러 줄로 나눠 쓰지 않는다.
${R[3]}
- label, sub, say, set_assumption 의 value 는 모두 한국어로 쓴다. label·sub 예시: "웹 서버 #1", "API 서버 #2", "공개 서브넷", "메인 VPC". 제품명만 원어 그대로 쓴다(CloudFront, Redis, Aurora MySQL, ALB, Tomcat 등).
${R[4]}
- warn 과 report_missing 명령은 내지 않는다. 위험 진단은 다른 단계가 맡는다.
${R[5]}
- 사용자가 질문만 하면 구성은 건드리지 않는다. 질문이면 명령 없이 {"op":"say","text":"…"} 한두 문장으로만 답한다.

${patternBlock()}`;

export const ANSWER_PROMPT = `너는 인프라 아키텍처 구성도 도구의 도우미다.
사용자의 질문이나 말에 한국어로 답한다. 답할 때는 아래 "현재 구성" 요약을 근거로, 지금 그려진 구성도에 대해 설명한다.

규칙:
- 일반 글로만 답한다. JSON, 명령, 코드펜스, 마크다운 제목은 쓰지 않는다.
- 1~4문장으로 짧게 쓴다.
- 제품명(Redis, ALB, Tomcat 등)은 원어 그대로 쓴다.
- 구성에 없는 내용을 지어내지 않는다. 모르면 모른다고 말한다.
- 사용자가 실제로는 구성을 바꿔 달라고 요청한 것이면, 지금은 답변 모드라 구성을 바꾸지 않았다고 짧게 알리고 "~추가해 줘"처럼 요청 형태로 다시 말해 달라고 안내한다.`;

// 경고 문구 작성(새 경고만, 한 번의 호출). 형식이 틀린 줄은 서버가 정해진 문구로 바꾼다.
export const WARNING_PROMPT = `너는 인프라 아키텍처 구성도 도구의 도우미다.
구성도에서 찾은 위험 요소마다 사용자에게 보여 줄 경고 문구를 쓴다.

출력 형식:
- JSON Lines 로만 출력한다. 한 줄에 {"id":"주어진 id","text":"경고 문구"} 하나. 다른 글, 코드펜스, 설명 금지.

규칙:
- text 는 한국어 한 문장, 80자 이내로 쓴다.
- 인프라를 잘 모르는 비전공자도 알 수 있게 쉬운 말로, 무엇이 왜 위험한지 쓴다.
- 제품명(Redis, ALB, Tomcat 등)과 노드 이름은 원어 그대로 쓴다.
- 주어진 id 마다 한 줄씩 쓴다. 주어지지 않은 id 를 만들지 않는다.
- 주어진 사실에 없는 내용을 지어내지 않는다.`;

/** 경고 문구 요청. facts 는 정해진 문구와 관련 노드 요약이다(공백을 접어 한 건이 한 줄이 되게 한다). */
export function buildWarningMessages(items: { id: string; rule: string; facts: string }[]): ChatMessage[] {
  const flat = (t: string) => t.replace(/\s+/g, " ").trim();
  const lines = items.map((it) => `id=${JSON.stringify(it.id)} rule=${it.rule} 사실: ${flat(it.facts)}`);
  return [
    { role: "system", content: WARNING_PROMPT },
    { role: "user", content: `경고 목록:\n${lines.join("\n")}` },
  ];
}

/** k 를 주면 지식에 없는 종류(지운·숨긴 것)는 종류 없음으로 보고 type= 을 적지 않는다. */
export function summarizeState(state: DiagramState, k?: NetworkKnowledge): string {
  const lines: string[] = [];
  for (const g of Object.values(state.groups)) {
    const t = g.netType && (!k || Object.hasOwn(k.types, g.netType.key)) ?` type=${g.netType.key}(${g.netType.source === "user" || g.netType.confirmed ? "확정" : "추정"})` : "";
    lines.push(`그룹 ${g.id} [${g.groupKind}] ${JSON.stringify(g.label)} parent=${g.parent ?? "-"}${t}`);
  }
  for (const n of Object.values(state.nodes)) {
    lines.push(
      `노드 ${n.id} [${n.kind}] ${JSON.stringify(n.label)} sub=${JSON.stringify(n.sub ?? "")} parent=${n.parent ?? "-"} attrs=${JSON.stringify(n.attrs ?? {})}${n.guess ? " guess" : ""}`,
    );
  }
  for (const e of Object.values(state.edges)) {
    lines.push(`연결 ${e.id}: ${e.from} -> ${e.to} [${e.edgeKind}] ${JSON.stringify(e.label ?? "")}${e.payload ? ` payload=${e.payload}` : ""}${e.direction ? ` direction=${e.direction}` : ""}`);
  }
  // 사용자가 쓴 글(연결 이름·가정 값)은 노드 이름처럼 JSON 으로 감싸 줄바꿈이 새 줄을 만들지 못하게 한다.
  for (const a of Object.values(state.assumptions)) {
    lines.push(`가정 ${JSON.stringify(a.key)}=${JSON.stringify(a.value)} (${a.confirmed ? "확정" : "미확정"})`);
  }
  return lines.join("\n");
}

const byStr = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/**
 * 망 지식 블록: 망 종류 목록(key·이름·다른 이름·등급, 설명은 뺀다) + 기본 등급 규칙 + 보이는 종류끼리의 기관 규칙
 * + 이 구성도에서 종류가 붙은 망 짝의 필요한 방식. 등급·기관 규칙은 망이 아직 없는 처음 그리는 차례에도 AI 가 쓰게 늘 넣는다.
 * 이름·다른 이름·근거(사용자 글)는 JSON 으로 감싸 줄바꿈이 새 줄을 만들지 못하게 한다.
 */
export function networkBlock(state: DiagramState, k: NetworkKnowledge): string {
  const types = networkTypeLines(k);
  const grades = gradeRuleLines();
  const userRules = userRuleLines(k);
  const zones = Object.values(state.groups)
    .filter((g) => g.groupKind === "network_zone" && g.netType)
    .sort((a, b) => byStr(a.id, b.id));
  const pairs: string[] = [];
  for (let i = 0; i < zones.length; i++) {
    for (let j = i + 1; j < zones.length; j++) {
      const req = requiredMethod(k, zones[i]!.netType!.key, zones[j]!.netType!.key);
      if (!req) continue;
      const [a, b] = pairKey(zones[i]!.id, zones[j]!.id);
      const basis = req.source === "user" && req.note ? ` 기관 규칙 근거=${JSON.stringify(req.note)}` : "";
      pairs.push(`${a} -- ${b}: ${METHOD_LABELS[req.method]}${basis}`);
    }
  }
  return [
    `망 종류:\n${types.join("\n")}`,
    `등급 규칙(기관 규칙이 없을 때):\n${grades.join("\n")}`,
    `기관 규칙:\n${userRules.length ? userRules.join("\n") : "없음"}`,
    `망 짝 규칙:\n${pairs.length ? pairs.join("\n") : "없음"}`,
  ].join("\n\n");
}

/** 흐름 한 개를 한 줄로: 지나는 연결 id 를 차례로. 이름(사용자 글)은 JSON 으로 감싸 줄바꿈이 새 줄을 만들지 못하게 한다. */
export function summarizeFlows(flows: Flow[]): string {
  return flows.map((f) => `흐름 ${f.id} [${f.origin}] ${JSON.stringify(f.name)}: ${f.steps.map((s) => s.edge).join(" > ")}`).join("\n");
}

// 흐름 제안(처음 그린 뒤 자동 + 버튼). 구성 명령과 따로 요청한다.
export const FLOW_SUGGEST_PROMPT = `너는 인프라 아키텍처 구성도 도구의 도우미다.
구성도를 보고, 요청 하나가 구성도의 연결을 차례로 지나는 길(흐름)을 제안한다.

출력 형식:
- add_flow 명령만 JSON Lines 로 출력한다. 한 줄에 JSON 객체 하나, 줄바꿈 없이. 다른 글, 코드펜스, 설명 금지.
{"op":"add_flow","id":"login","name":"로그인","origin":"user","summary":"사용자가 로그인한다","result":"로그인 결과를 화면에 돌려준다","steps":[{"edge":"e-client-web-was-1","from":"client-web","short":"로그인 요청","text":"아이디와 비밀번호를 서버로 보낸다"},{"edge":"e-was-1-db-1","from":"was-1","short":"회원 조회","text":"DB 에서 회원 정보를 확인한다"}]}

규칙:
- 흐름은 3~5개 쓴다. 사용자가 시작하는 행동 흐름(origin "user", 예: 로그인·주문)과 시스템·네트워크 흐름(origin "system", 예: 배치·복제·백업·외부 연동)을 섞는다.
- 단계 edge 는 "현재 구성"의 연결 id 만 쓴다. from 은 그 단계를 시작하는 노드 id 이고, 다음 단계는 앞 단계가 닿은 노드에서 시작한다.
- 단계는 요청이 가는 방향으로만 쓴다. 응답은 단계로 쓰지 않고 result 에 응답 한 줄로 쓴다.
- short 는 12자 이내, text 는 IT 비전공자가 알아듣는 한 문장(120자 이내)이다. 단계는 20개 이내다.
- name·summary·short·text·result 는 한국어로 쓴다. 제품명만 원어 그대로 쓴다.
- 흐름 id 는 영문 소문자·숫자·하이픈만 쓰고 ^[a-z0-9][a-z0-9-]{0,63}$ 형식이어야 한다. "이미 있는 흐름"의 id 는 쓰지 않고, 같은 길을 다시 만들지 않는다.
- 구성도에 없는 노드·연결을 지어내지 않는다.`;

/** 흐름 제안 요청. 이미 있는 흐름을 알려 새 id 를 고르고 겹치지 않게 한다. */
export function buildFlowSuggestMessages(state: DiagramState, flows: Flow[] = []): ChatMessage[] {
  const existing = flows.length ? summarizeFlows(flows) : "없음";
  return [
    { role: "system", content: FLOW_SUGGEST_PROMPT },
    { role: "user", content: `현재 구성:\n${summarizeState(state)}\n\n이미 있는 흐름:\n${existing}` },
  ];
}

export interface Mention {
  id: string;
  label: string;
}

const MENTION_RE = /@\[([^\]]{1,80})\]\(node:([a-z0-9][a-z0-9-]{0,63})\)/g;

export function parseMentions(text: string, state: DiagramState): { clean: string; mentions: Mention[] } {
  const mentions: Mention[] = [];
  const seen = new Set<string>();
  const clean = text.replace(MENTION_RE, (_m, label: string, id: string) => {
    if ((id in state.nodes || id in state.groups) && !seen.has(id)) {
      seen.add(id);
      mentions.push({ id, label });
    }
    return `@${label}`;
  });
  return { clean, mentions };
}

/** 출력 한도로 끊긴 명령 응답을 이어 쓰게 할 때 요청 뒤에 붙인다. */
export const CONTINUE_NOTE = `이어 쓰기: 이 요청에 대한 앞 응답이 출력 길이 한도에 닿아 중간에 끊겼다. 위 "현재 구성"은 이 요청을 지금까지 반영한 결과다.
- 끊긴 곳부터 이어서 남은 명령만 낸다. 처음부터 다시 하지 않는다.
- 현재 구성에 이미 있는 그룹·노드·연결 id 는 다시 만들지 않고, 지우거나 옮기지도 않는다(이미 반영된 것이다).
- 남은 그룹·노드를 마저 낸 뒤 연결을 낸다. 이미 낸 say·set_assumption·흐름 명령은 반복하지 않는다.`;

export function buildMessages(input: {
  intent: Intent | null;
  text: string;
  state: DiagramState;
  mentions: Mention[];
  history: { role: "user" | "assistant"; content: string }[];
  missing?: MissingItem[];
  /** 앞 응답이 출력 한도로 끊겨 이어 쓰게 하는 요청이면 true. state 는 지금까지 반영한 상태다. */
  continuation?: boolean;
  /** 저장된 흐름. 있으면 "현재 구성" 뒤에 흐름 목록을 넣는다. */
  flows?: Flow[];
  /** 망 지식. 있으면 "현재 구성" 바로 뒤에 망 종류·망 짝 규칙을 넣는다. */
  network?: NetworkKnowledge;
}): ChatMessage[] {
  const system = input.intent === "question" || input.intent === "other" ? ANSWER_PROMPT : SYSTEM_PROMPT;
  const labelOf = (id: string, fallback: string) => input.state.nodes[id]?.label ?? input.state.groups[id]?.label ?? fallback;
  const refs = input.mentions.length ? input.mentions.map((m) => `${m.id} ${labelOf(m.id, m.label).replace(/\s+/g, " ")}`).join("\n") : "없음";
  const open = input.intent === "missing_info_answer" ? (input.missing ?? []).filter((m) => !m.unknown).slice(0, MISSING_LINES_MAX) : [];
  const missingBlock = open.length ? `채워야 할 정보:\n${open.map((m) => `${m.targetId} ${m.key}(${m.label})`).join("\n")}\n\n${MISSING_FORMAT_NOTE}\n\n` : "";
  const cont = input.continuation ? `\n\n${CONTINUE_NOTE}` : "";
  const flowBlock = input.flows?.length ? `흐름:\n${summarizeFlows(input.flows)}\n\n` : "";
  const netBlock = input.network ? `${networkBlock(input.state, input.network)}\n\n` : "";
  const user = `현재 구성:\n${summarizeState(input.state, input.network)}\n\n${netBlock}${flowBlock}참조 노드:\n${refs}\n\n${missingBlock}요청: ${input.text}${cont}`;
  return [
    { role: "system", content: system },
    ...input.history.slice(-HISTORY_LIMIT).map((h) => ({ role: h.role, content: h.content })),
    { role: "user", content: user },
  ];
}

// 설명 생성(§6.1~6.3). 글자 상한은 LIMITS 에서 가져와 검사와 프롬프트가 어긋나지 않게 한다.
export const EXPLAIN_NODE_PROMPT = `너는 인프라 아키텍처 구성도 도구의 도우미다.
구성도의 노드 하나를 IT 비전공자에게 설명하는 글을 쓴다.

출력 형식:
- JSON 객체 하나만 출력한다. 다른 글, 코드펜스, 설명 금지.
- {"definition":"정의","role":"이 구성에서의 역할","adr":{"decision":"결정","reason":"이유","alternative":"대안","cost":"대가"}}
- 사전 정의가 주어지면 definition 키는 쓰지 않는다.

규칙:
- definition: 정식 명칭·약어 풀이와 분류를 포함한 사전식 정의 한 문장, ${LIMITS.definition}자 이내.
  예: "Redis(Remote Dictionary Server)는 데이터를 디스크가 아닌 메모리에 저장해 빠른 읽기와 쓰기 속도를 제공하는 인메모리 NoSQL 키-값(Key-Value) 데이터 구조 스토어입니다."
- role: 일반론이 아니라 이 구성에서 이 노드가 맡은 역할, 1~2문장, ${LIMITS.role}자 이내.
- adr: 이 노드를 이 자리에 둔 결정의 요약. decision(결정)·reason(이유)·alternative(대안)·cost(대가) 각 한 줄, 각 ${LIMITS.adr}자 이내.
- 비유를 쓰지 않는다. 전문용어는 짧게 풀어 쓴다.
- 한국어로 쓴다. 제품명(Redis, ALB, Tomcat 등)은 원어 그대로.
- 주어진 구성에 없는 내용을 지어내지 않는다.`;

export const EXPLAIN_EDGE_PROMPT = `너는 인프라 아키텍처 구성도 도구의 도우미다.
구성도의 연결선 하나를 IT 비전공자에게 설명하는 글을 쓴다.

출력 형식:
- JSON 객체 하나만 출력한다. 다른 글, 코드펜스, 설명 금지.
- {"flow":"무엇이 오가나","method":"방식","why":"왜 연결됐나","firewall":"방화벽 규칙"}

규칙:
- flow: 이 연결로 무엇(요청·데이터·이벤트)이 오가는지.
- method: 프로토콜·포트와 동기/비동기 여부.
- why: 이 구성에서 두 대상이 왜 연결됐는지.
- firewall: 이 연결을 위해 어느 쪽에서 어느 쪽으로 어떤 포트를 열어야 하는지. 포트를 모르면 지어내지 말고 정해야 한다고 쓴다.
- 각 항목은 한 문장, ${LIMITS.edge}자 이내.
- 비유를 쓰지 않는다. 전문용어는 짧게 풀어 쓴다.
- 한국어로 쓴다. 제품명(Redis, ALB, Tomcat 등)은 원어 그대로.
- 주어진 구성에 없는 내용을 지어내지 않는다.`;

const kindKo = (kind: string) => NODE_KINDS.find((k) => k.kind === kind)?.labelKo ?? kind;

/** 노드·영역 한 개를 한 줄로. 사용자 글은 JSON.stringify 로 감싼다. */
function describeEndpoint(state: DiagramState, id: string): string {
  const n = state.nodes[id];
  if (n) {
    const sw = n.attrs.sw ?? null;
    const version = n.attrs.version ?? null;
    return `노드 ${n.id} [${n.kind}/${kindKo(n.kind)}] ${JSON.stringify(n.label)} sub=${JSON.stringify(n.sub ?? "")} sw=${JSON.stringify(sw)} version=${JSON.stringify(version)}`;
  }
  const g = state.groups[id];
  return g ? `영역 ${g.id} [${g.groupKind}] ${JSON.stringify(g.label)}` : `없음 ${JSON.stringify(id)}`;
}

/** 대상의 상위 영역 줄(가까운 것부터). */
function ancestorsOf(state: DiagramState, parent: string | null): string {
  const out: string[] = [];
  const seen = new Set<string>();
  for (let cur = parent; cur && !seen.has(cur); ) {
    seen.add(cur);
    const g = state.groups[cur];
    if (!g) break;
    out.push(`${g.id} [${g.groupKind}] ${JSON.stringify(g.label)}`);
    cur = g.parent;
  }
  return out.length ? out.join(" < ") : "없음(최상위)";
}

/** 대상과 이웃(상위 영역·연결 상대)만 담은 요약. */
export function explainContext(state: DiagramState, kind: "node" | "edge", id: string): string {
  if (kind === "edge") {
    const e = state.edges[id];
    if (!e) return `대상 연결 ${JSON.stringify(id)}: 없음`;
    const side = (end: string) => {
      const parent = state.nodes[end]?.parent ?? state.groups[end]?.parent ?? null;
      return `${describeEndpoint(state, end)} 상위 영역: ${ancestorsOf(state, parent)}`;
    };
    return [
      `대상 연결 ${e.id} [${e.edgeKind}] ${JSON.stringify(e.label ?? "")}: ${e.from} -> ${e.to}`,
      `보내는 쪽: ${side(e.from)}`,
      `받는 쪽: ${side(e.to)}`,
    ].join("\n");
  }
  const n = state.nodes[id];
  if (!n) return `대상 노드 ${JSON.stringify(id)}: 없음`;
  const lines = [`대상 ${describeEndpoint(state, id)}`, `상위 영역: ${ancestorsOf(state, n.parent)}`];
  for (const e of Object.values(state.edges)) {
    const how = `${e.id} [${e.edgeKind}] ${JSON.stringify(e.label ?? "")}`;
    if (e.to === id && e.from !== id) lines.push(`들어오는 연결 ${how}: ${describeEndpoint(state, e.from)} -> 대상`);
    else if (e.from === id && e.to !== id) lines.push(`나가는 연결 ${how}: 대상 -> ${describeEndpoint(state, e.to)}`);
  }
  return lines.join("\n");
}

/**
 * 노드·연결 설명 요청. 사전 정의가 있으면 definition 을 쓰지 말라고 한다.
 * instruction(다시 쓰기 요청)·problems(길이 초과·어려움 지적)가 있으면 이전 결과와 함께 다시 쓰라고 한다.
 */
export function buildExplainMessages(input: {
  kind: "node" | "edge";
  state: DiagramState;
  id: string;
  glossaryDefinition?: string;
  /** 사전에 없을 때 정의할 용어. */
  term?: string;
  instruction?: string;
  previous?: object;
  problems?: string[];
}): ChatMessage[] {
  const parts = [`현재 구성(대상과 이웃):\n${explainContext(input.state, input.kind, input.id)}`];
  if (input.kind === "node" && input.glossaryDefinition) {
    parts.push(`사전 정의: ${JSON.stringify(input.glossaryDefinition)}\n정의는 사전에 있으니 definition 키는 쓰지 않는다. 역할·ADR 은 이 정의와 어긋나지 않게 쓴다.`);
  } else if (input.kind === "node" && input.term) {
    parts.push(`정의할 용어: ${JSON.stringify(input.term)}\ndefinition 은 이 용어의 사전식 정의다.`);
  }
  const problems = input.problems?.filter(Boolean) ?? [];
  if (input.instruction || problems.length) {
    const redo: string[] = [];
    if (input.previous) redo.push(`이전 결과:\n${JSON.stringify(input.previous)}`);
    if (problems.length) redo.push(`고칠 점:\n${problems.map((p) => `- ${p}`).join("\n")}`);
    if (input.instruction) redo.push(`사용자 요청: ${JSON.stringify(input.instruction)}`);
    redo.push(`위 내용을 반영해 ${input.previous ? "이전 결과를 " : ""}다시 써라. 같은 JSON 형식으로 출력한다.`);
    parts.push(redo.join("\n\n"));
  }
  return [
    { role: "system", content: input.kind === "node" ? EXPLAIN_NODE_PROMPT : EXPLAIN_EDGE_PROMPT },
    { role: "user", content: parts.join("\n\n") },
  ];
}

// 노드 하나에 대해 물어보기(§6.8). 근거는 대상 노드 요약과 저장된 설명뿐이다.
export const ASK_PROMPT = `너는 인프라 아키텍처 구성도 도구의 도우미다.
사용자가 구성도의 노드 하나에 대해 묻는 말에 한국어로 답한다.

규칙:
- 일반 글로만 답한다. JSON, 명령, 코드펜스, 마크다운 제목은 쓰지 않는다.
- 1~4문장으로 짧게 쓴다.
- 근거는 주어진 "대상 노드"(종류·SW·속성·연결된 노드)와 "설명"(있으면)뿐이다. 거기에 없는 내용은 지어내지 말고 모른다고 말한다.
- 제품명(Redis, ALB, Tomcat 등)은 원어 그대로 쓴다.
- 답에서 노드 id 를 쓰지 말고 노드 이름(label)으로 부른다.
- 구성에 없는 제품·기술 이름을 새로 꺼내지 않는다. 모르면 이 구성 정보만으로는 알 수 없다고 말한다.
- 사용자가 구성을 바꿔 달라고 하면 바꾸지 않는다. 구성 변경은 구성도 대화에서 요청해 달라고 짧게 안내한다.`;

/** 설명 항목 한 줄. 줄바꿈을 접어 한 항목이 한 줄이 되게 한다. */
const oneLine = (t: string) => t.replace(/\s+/g, " ").trim();

function explanationBlock(e: NodeExplanation | undefined): string {
  if (!e) return "없음";
  const { decision, reason, alternative, cost } = e.adr;
  return [
    `정의: ${oneLine(e.definition)}`,
    `역할: ${oneLine(e.role)}`,
    `ADR: 결정 ${oneLine(decision)} / 이유 ${oneLine(reason)} / 대안 ${oneLine(alternative)} / 대가 ${oneLine(cost)}`,
  ].join("\n");
}

/** 노드 질문 요청. 기록은 그 세션 것만 최근 HISTORY_LIMIT 개. */
export function buildAskMessages(input: {
  state: DiagramState;
  nodeId: string;
  explanation?: NodeExplanation;
  history: { role: "user" | "assistant"; content: string }[];
  text: string;
}): ChatMessage[] {
  const user = `대상 노드:\n${explainContext(input.state, "node", input.nodeId)}\n\n설명:\n${explanationBlock(input.explanation)}\n\n질문: ${input.text}`;
  return [
    { role: "system", content: ASK_PROMPT },
    ...input.history.slice(-HISTORY_LIMIT).map((h) => ({ role: h.role, content: h.content })),
    { role: "user", content: user },
  ];
}
