import { EDGE_KINDS, GROUP_KINDS, NODE_KINDS } from "@/domain/catalog";
import type { DiagramState } from "@/domain/types";
import type { Intent } from "@/server/llm/clef";
import type { ChatMessage } from "@/server/llm/qwen";

export const HISTORY_LIMIT = 20;

// 허용값 목록은 catalog 에서 만든다(손으로 복사하지 않는다).
const KIND_LIST = NODE_KINDS.map((k) => k.kind).join(", ");
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
{"op":"update_node","id":"기존 노드 또는 그룹 id","label":"(선택)","sub":"(선택)","parent":"(선택)","attrs":{"바꿀 속성만":"값"}}
{"op":"update_edge","id":"기존 연결 id","label":"(선택)","edge_kind":"(선택)"}
{"op":"remove_node","id":"기존 노드 id"}
{"op":"remove_edge","id":"기존 연결 id"}

KIND 허용값: ${KIND_LIST}
GROUP_KIND 허용값: ${GROUP_KIND_LIST}
EDGE_KIND 허용값: ${EDGE_KIND_LIST}

규칙:
- id 는 영문 소문자·숫자·하이픈만 쓰고 ^[a-z0-9][a-z0-9-]{0,63}$ 형식이어야 한다. 노드·그룹·연결 id 는 서로 겹치면 안 된다.
- 요청이 애매하면 가정하고 set_assumption 으로 그 가정을 먼저 밝힌다.
- 이미 확정된 가정은 바꾸지 않는다. 확정(확정) 표시가 붙은 가정과 다른 값을 set_assumption 으로 내지 않는다.
- 그룹을 먼저, 그 안의 노드를 다음, 연결은 양 끝 노드가 생긴 뒤에 출력한다.
- 이중화 서버는 redundancy_group 그룹으로 묶고 label 에 VIP 를 적는다(예: "WAS VIP"). 2대 이상이면 몇 대든 하나의 redundancy_group 으로 묶는다.
- AZ(가용 영역)는 az 그룹을 만들지 않는다. 대신 서브넷·노드의 attrs.az 속성(예: "az":"2a")으로 표시한다.
- 외부 서비스는 external_service 그룹 안에 접점 노드(external_api/external_auth/external_pg)로 그린다.
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
- 사용자가 질문만 하면 구성은 건드리지 않는다. 질문이면 명령 없이 {"op":"say","text":"…"} 한두 문장으로만 답한다.`;

export const ANSWER_PROMPT = `너는 인프라 아키텍처 구성도 도구의 도우미다.
사용자의 질문이나 말에 한국어로 답한다. 답할 때는 아래 "현재 구성" 요약을 근거로, 지금 그려진 구성도에 대해 설명한다.

규칙:
- 일반 글로만 답한다. JSON, 명령, 코드펜스, 마크다운 제목은 쓰지 않는다.
- 1~4문장으로 짧게 쓴다.
- 제품명(Redis, ALB, Tomcat 등)은 원어 그대로 쓴다.
- 구성에 없는 내용을 지어내지 않는다. 모르면 모른다고 말한다.
- 사용자가 실제로는 구성을 바꿔 달라고 요청한 것이면, 지금은 답변 모드라 구성을 바꾸지 않았다고 짧게 알리고 "~추가해 줘"처럼 요청 형태로 다시 말해 달라고 안내한다.`;

export function summarizeState(state: DiagramState): string {
  const lines: string[] = [];
  for (const g of Object.values(state.groups)) {
    lines.push(`그룹 ${g.id} [${g.groupKind}] "${g.label}" parent=${g.parent ?? "-"}`);
  }
  for (const n of Object.values(state.nodes)) {
    lines.push(
      `노드 ${n.id} [${n.kind}] "${n.label}" sub="${n.sub ?? ""}" parent=${n.parent ?? "-"} attrs=${JSON.stringify(n.attrs ?? {})}`,
    );
  }
  for (const e of Object.values(state.edges)) {
    lines.push(`연결 ${e.id}: ${e.from} -> ${e.to} [${e.edgeKind}] "${e.label ?? ""}"`);
  }
  for (const a of Object.values(state.assumptions)) {
    lines.push(`가정 ${a.key}=${a.value} (${a.confirmed ? "확정" : "미확정"})`);
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
}): ChatMessage[] {
  const system = input.intent === "question" || input.intent === "other" ? ANSWER_PROMPT : SYSTEM_PROMPT;
  const refs = input.mentions.length ? input.mentions.map((m) => `${m.id} ${m.label}`).join("\n") : "없음";
  const user = `현재 구성:\n${summarizeState(input.state)}\n\n참조 노드:\n${refs}\n\n요청: ${input.text}`;
  return [
    { role: "system", content: system },
    ...input.history.slice(-HISTORY_LIMIT).map((h) => ({ role: h.role, content: h.content })),
    { role: "user", content: user },
  ];
}
