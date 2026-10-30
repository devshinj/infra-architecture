import { EDGE_KINDS, GROUP_KINDS, NODE_KINDS } from "@/domain/catalog";
import { LIMITS } from "@/domain/explain";
import type { MissingItem } from "@/domain/missing";
import { patternPromptBlock } from "@/domain/patterns";
import type { DiagramState } from "@/domain/types";
import type { Intent } from "@/server/llm/clef";
import type { ChatMessage } from "@/server/llm/qwen";

export const HISTORY_LIMIT = 20;
const MISSING_LINES_MAX = 40;

// 허용값 목록은 catalog 에서 만든다(손으로 복사하지 않는다).
// k8s_cluster 는 그룹으로만 쓴다(노드 kind 목록에서 제외).
const KIND_LIST = NODE_KINDS.map((k) => k.kind).filter((k) => k !== "k8s_cluster").join(", ");
const GROUP_KIND_LIST = GROUP_KINDS.map((k) => k.kind).join(", ");
const EDGE_KIND_LIST = EDGE_KINDS.map((k) => k.kind).join(", ");

export const SYSTEM_PROMPT = `너는 인프라 아키텍처 구성도를 그리는 도구의 엔진이다.
사용자 요청을 받아 구성도 변경 명령을 JSON Lines 로만 출력한다. 한 줄에 JSON 객체 하나. 다른 글, 코드펜스, 설명 금지.

명령 종류:
{"op":"say","text":"진행 상황 한 줄(예: L7 로드밸런서 추가…)"}
{"op":"set_assumption","key":"environment|scale|redundancy|deploy|replication|external","value":"짧은 문장"}
{"op":"add_group","id":"영문-소문자-id","group_kind":"<GROUP_KIND>","label":"표시이름","parent":"상위 그룹 id 또는 null"}
{"op":"add_node","id":"영문-소문자-id","kind":"<KIND>","label":"표시이름(예: WAS#1)","sub":"SW 또는 대수(예: Tomcat 10)","parent":"그룹 id 또는 null","attrs":{"sw":"...","hostname":null,"cpu":null,"ram":null,"ip":null}}
{"op":"add_edge","id":"e-<from>-<to>","from":"노드 또는 그룹 id","to":"노드 또는 그룹 id","edge_kind":"<EDGE_KIND>","label":"프로토콜/포트(예: HTTPS 443)"}
{"op":"update_node","id":"was-1","attrs":{"ram":"32GB"}}
{"op":"update_edge","id":"e-web-1-was-1","label":"HTTP 8080"}
{"op":"remove_node","id":"기존 노드 id"}
{"op":"remove_edge","id":"기존 연결 id"}

KIND 허용값: ${KIND_LIST}
GROUP_KIND 허용값: ${GROUP_KIND_LIST}
EDGE_KIND 허용값: ${EDGE_KIND_LIST}

규칙:
- id 는 영문 소문자·숫자·하이픈만 쓰고 ^[a-z0-9][a-z0-9-]{0,63}$ 형식이어야 한다. 노드·그룹·연결 id 는 서로 겹치면 안 된다.
- 요청이 애매하면 가정하고 set_assumption 으로 그 가정을 먼저 밝힌다.
- 이미 확정된 가정은 바꾸지 않는다. 요약에 (확정) 표시가 붙은 가정은 set_assumption 으로 다시 내지 않는다.
- 그룹을 먼저, 그 안의 노드를 다음, 연결은 양 끝 노드가 생긴 뒤에 출력한다.
- 이중화 서버는 redundancy_group 그룹으로 묶고 label 에 VIP 를 적는다(예: "WAS VIP"). 2대 이상이면 몇 대든 하나의 redundancy_group 으로 묶는다.
- AZ(가용 영역)는 az 그룹을 만들지 않는다. 대신 서브넷·노드의 attrs.az 속성(예: "az":"2a")으로 표시한다.
- 외부 서비스는 external_service 그룹 안에 접점 노드(external_api/external_auth/external_pg)로 그린다.
- 영역(그룹)의 이름·상위 영역은 바꿀 수 없다. 영역을 바꿔야 하면 say 로 알리고 노드만 수정한다.
- k8s_cluster 는 그룹(group_kind)으로만 쓴다. 노드 kind 로 쓰지 않는다.
- 사용자가 모르는 값(IP, hostname, 스펙)은 null 로 둔다. 지어내지 않는다.
- 연결은 실제 요청 흐름 방향(호출하는 쪽 → 받는 쪽)으로.
- edge_kind 는 동기 요청 request, 비동기·이벤트·웹훅 async, 복제·동기화 replication 이다. 모니터링·관리(Bastion, Prometheus 등) 연결은 aux 로 한다.
- 각 단계마다 say 로 진행 상황을 짧게 알린다.
- 기존 구성이 주어지면 바꿀 부분만 명령으로 낸다. 기존 id 를 그대로 쓴다.
- label, sub, say, set_assumption 의 value 는 모두 한국어로 쓴다. 제품명(Redis, ALB, Tomcat 등)은 원어 그대로.
- external_service 그룹은 우리 회사가 운영하지 않는 타사 서비스(PG사, 카카오, 택배사, 문자 발송 등)에만 쓴다. AWS 관리형 서비스(RDS, MSK, ElastiCache, S3, SQS)는 우리 인프라이므로 해당 위치(VPC/서브넷/리전)에 둔다.
- Kafka/MSK/Kinesis 는 stream, SQS/RabbitMQ 는 queue.
- CDN, WAF, DNS 처럼 VPC 밖 전역 서비스는 VPC 밖(리전 그룹 또는 최상위)에 둔다.
- 사용자(client_*)에서 시작하는 진입 연결을 반드시 그린다.
- warn 과 report_missing 명령은 내지 않는다. 위험 진단은 다른 단계가 맡는다.
- 사용자가 채워야 할 정보의 값을 알려 주면 update_node(attrs) 또는 update_edge(label) 로 그 값만 반영한다. 노드·연결을 새로 만들지 않는다.
- 사용자가 질문만 하면 구성은 건드리지 않는다. 질문이면 명령 없이 {"op":"say","text":"…"} 한두 문장으로만 답한다.

${patternPromptBlock()}`;

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

export function summarizeState(state: DiagramState): string {
  const lines: string[] = [];
  for (const g of Object.values(state.groups)) {
    lines.push(`그룹 ${g.id} [${g.groupKind}] ${JSON.stringify(g.label)} parent=${g.parent ?? "-"}`);
  }
  for (const n of Object.values(state.nodes)) {
    lines.push(
      `노드 ${n.id} [${n.kind}] ${JSON.stringify(n.label)} sub=${JSON.stringify(n.sub ?? "")} parent=${n.parent ?? "-"} attrs=${JSON.stringify(n.attrs ?? {})}`,
    );
  }
  for (const e of Object.values(state.edges)) {
    lines.push(`연결 ${e.id}: ${e.from} -> ${e.to} [${e.edgeKind}] ${JSON.stringify(e.label ?? "")}`);
  }
  // 사용자가 쓴 글(연결 이름·가정 값)은 노드 이름처럼 JSON 으로 감싸 줄바꿈이 새 줄을 만들지 못하게 한다.
  for (const a of Object.values(state.assumptions)) {
    lines.push(`가정 ${JSON.stringify(a.key)}=${JSON.stringify(a.value)} (${a.confirmed ? "확정" : "미확정"})`);
  }
  return lines.join("\n");
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

export function buildMessages(input: {
  intent: Intent | null;
  text: string;
  state: DiagramState;
  mentions: Mention[];
  history: { role: "user" | "assistant"; content: string }[];
  missing?: MissingItem[];
}): ChatMessage[] {
  const system = input.intent === "question" || input.intent === "other" ? ANSWER_PROMPT : SYSTEM_PROMPT;
  const labelOf = (id: string, fallback: string) => input.state.nodes[id]?.label ?? input.state.groups[id]?.label ?? fallback;
  const refs = input.mentions.length ? input.mentions.map((m) => `${m.id} ${labelOf(m.id, m.label).replace(/\s+/g, " ")}`).join("\n") : "없음";
  const open = input.intent === "missing_info_answer" ? (input.missing ?? []).filter((m) => !m.unknown).slice(0, MISSING_LINES_MAX) : [];
  const missingBlock = open.length ? `채워야 할 정보:\n${open.map((m) => `${m.targetId} ${m.key}(${m.label})`).join("\n")}\n\n` : "";
  const user = `현재 구성:\n${summarizeState(input.state)}\n\n참조 노드:\n${refs}\n\n${missingBlock}요청: ${input.text}`;
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
function explainContext(state: DiagramState, kind: "node" | "edge", id: string): string {
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
  instruction?: string;
  previous?: object;
  problems?: string[];
}): ChatMessage[] {
  const parts = [`현재 구성(대상과 이웃):\n${explainContext(input.state, input.kind, input.id)}`];
  if (input.kind === "node" && input.glossaryDefinition) {
    parts.push(`사전 정의: ${JSON.stringify(input.glossaryDefinition)}\n정의는 사전에 있으니 definition 키는 쓰지 않는다. 역할·ADR 은 이 정의와 어긋나지 않게 쓴다.`);
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
