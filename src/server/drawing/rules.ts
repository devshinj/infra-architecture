import { EDGE_KINDS, GROUP_KINDS, NODE_KINDS } from "@/domain/catalog";
import { FIELD_LABELS } from "@/domain/missing";
import { EDGE_MEDIA } from "@/domain/types";
import { GRADE_LABELS, GRADE_RULES, METHOD_LABELS, pairKey, type NetworkKnowledge } from "@/domain/network";
import { patternPromptBlock } from "@/domain/patterns";

// 그리기 규칙 공용 모듈. Qwen 시스템 프롬프트와 MCP get_guide 가 같은 규칙 글을 쓴다.
// Qwen 출력 방식(JSON Lines·say·warn·질문·이어 쓰기·요청 맥락)에 관한 줄은 여기 두지 않는다 — prompt.ts 에 남는다.

// 허용값 목록은 catalog 에서 만든다(손으로 복사하지 않는다).
// k8s_cluster 는 그룹으로만 쓴다(노드 kind 목록에서 제외).
const KIND_LIST = NODE_KINDS.map((k) => k.kind).filter((k) => k !== "k8s_cluster").join(", ");
const GROUP_KIND_LIST = GROUP_KINDS.map((k) => k.kind).join(", ");
const EDGE_KIND_LIST = EDGE_KINDS.map((k) => k.kind).join(", ");

/** 노드 종류별 attrs 칸. 칸이 같은 종류끼리 한 줄로 묶는다(예: "web_server, was: hostname(호스트명), …"). */
export const ATTR_LIST = (() => {
  const byKeys = new Map<string, string[]>();
  for (const k of NODE_KINDS) {
    if (k.requiredAttrs.length === 0) continue;
    const keys = k.requiredAttrs.join(",");
    byKeys.set(keys, [...(byKeys.get(keys) ?? []), k.kind]);
  }
  return [...byKeys]
    .map(([keys, kinds]) => `${kinds.join(", ")}: ${keys.split(",").map((key) => `${key}(${FIELD_LABELS[key] ?? key})`).join(", ")}`)
    .join("\n");
})();

/** 명령 예 줄들(add_*·update_*·remove_*·set_assumption·set_zone_type·guess·흐름). say 줄은 Qwen 전용이라 뺀다. */
export const COMMAND_EXAMPLES = `{"op":"set_assumption","key":"environment|scale|redundancy|deploy|replication|external","value":"짧은 문장"}
{"op":"add_group","id":"영문-소문자-id","group_kind":"<GROUP_KIND>","label":"표시이름","parent":"상위 그룹 id 또는 null"}
{"op":"add_node","id":"영문-소문자-id","kind":"<KIND>","label":"표시이름(예: WAS#1)","sub":"SW 또는 대수(예: Tomcat 10)","parent":"그룹 id 또는 null","attrs":{"sw":"...","hostname":null,"cpu":null,"ram":null,"ip":null}}
{"op":"add_edge","id":"e-<from>-<to>","from":"노드 또는 그룹 id","to":"노드 또는 그룹 id","edge_kind":"<EDGE_KIND>","label":"프로토콜/포트(예: HTTPS 443)"}
{"op":"add_edge","id":"e-link-1-pg","from":"link-1","to":"pg","edge_kind":"request","label":"결제 요청","payload":"api","direction":"two_way"}
{"op":"update_node","id":"was-1","attrs":{"ram":"32GB"}}
{"op":"update_node","id":"was-1","parent":"새 영역 id"}
{"op":"update_edge","id":"e-web-1-was-1","label":"HTTP 8080"}
{"op":"update_edge","id":"e-web-1-was-1","payload":"file","direction":"one_way"}
{"op":"add_edge","from":"app","to":"band-1","edge_kind":"request","label":"BLE(GATT)","medium":"wireless"}
{"op":"remove_node","id":"기존 노드 id"}
{"op":"remove_edge","id":"기존 연결 id"}
{"op":"remove_group","id":"기존 영역 id"}
{"op":"set_zone_type","id":"망 영역 id","type":"망 종류 key 또는 null"}
{"op":"add_node","id":"link-1","kind":"network_link","label":"망연계 솔루션","parent":null,"guess":true}
{"op":"add_flow","id":"login","name":"로그인","origin":"user","summary":"사용자가 로그인한다","result":"로그인 결과를 화면에 돌려준다","steps":[{"edge":"e-client-web-was-1","from":"client-web","short":"로그인 요청","text":"아이디와 비밀번호를 WAS 로 보낸다"},{"edge":"e-was-1-db-1","from":"was-1","short":"회원 조회","text":"DB 에서 회원 정보를 확인한다"}]}
{"op":"update_flow","id":"login","name":"회원 로그인","result":"확인 결과를 돌려준다"}
{"op":"remove_flow","id":"기존 흐름 id"}`;

/** 노드·영역·연결 종류 목록과 노드 attrs 칸 목록. */
export const KIND_BLOCK = `KIND 허용값: ${KIND_LIST}
GROUP_KIND 허용값: ${GROUP_KIND_LIST}
EDGE_KIND 허용값: ${EDGE_KIND_LIST}
MEDIUM 허용값(연결의 통신 수단, 생략하면 보통의 IP 통신): ${EDGE_MEDIA.join(", ")}

노드 attrs 칸(종류별). 이 칸 이름만 쓴다. os 는 운영체제(예: Rocky Linux 9), sw 는 설치한 소프트웨어(예: Tomcat 10)다.
${ATTR_LIST}`;

/**
 * 그리기 규칙 글머리를 Qwen 전용 줄이 끼어 있던 자리마다 끊어 둔 묶음(원래 줄 순서·글 그대로).
 * SYSTEM_PROMPT 가 묶음 사이에 자기 줄을 넣는다. 첫 묶음 끝 줄은 영역 규칙의 앞부분이고, 뒷부분(Qwen 전용)은 prompt.ts 가 잇는다.
 */
export const DRAW_RULE_GROUPS = [
  `- id 는 영문 소문자·숫자·하이픈만 쓰고 ^[a-z0-9][a-z0-9-]{0,63}$ 형식이어야 한다. 노드·그룹·연결 id 는 서로 겹치면 안 된다.
- 요청이 애매하면 가정하고 set_assumption 으로 그 가정을 먼저 밝힌다.
- 이미 확정된 가정은 바꾸지 않는다. 요약에 (확정) 표시가 붙은 가정은 set_assumption 으로 다시 내지 않는다.
- 그룹을 먼저, 그 안의 노드를 다음, 연결은 양 끝 노드가 생긴 뒤에 출력한다.
- 이중화 서버는 redundancy_group 그룹으로 묶는다. 2대 이상이면 몇 대든 하나의 redundancy_group 으로 묶는다. 온프레미스는 label 에 VIP 를 적고(예: "WAS VIP"), 클라우드(cloud_region·vpc 안)는 VIP 대신 Auto Scaling 그룹·대상 그룹 이름을 적는다(예: "WAS Auto Scaling 그룹").
- 클라우드 사업자가 운영하는 관리형 서비스(ALB·NLB·RDS·Aurora·ElastiCache·RDS Proxy·DynamoDB 등)는 attrs.managed 를 "yes" 로 쓰고 redundancy_group 으로 묶지 않는다(사업자가 여러 AZ 로 이중화한다). 직접 설치해 운영하는 서버(EC2 위 Nginx·MySQL 등)에는 managed 를 쓰지 않는다.
- 관리형 DB·캐시(RDS·Aurora·ElastiCache·DocumentDB 등)는 여러 AZ 복제 여부를 attrs.multi_az 에 "yes" 또는 "no" 로 쓴다. 사용자가 Multi-AZ·복제본을 말했거나 DynamoDB 처럼 늘 여러 AZ 에 복제되는 서비스면 "yes", 단일 AZ 라고 했으면 "no", 근거가 없으면 null 로 둔다.
- AZ(가용 영역)는 az 그룹을 만들지 않는다. 대신 노드의 attrs.az 속성(예: "az":"2a")으로 표시한다. 클라우드에서 직접 운영하는 이중화 서버는 서로 다른 AZ 에 나눠 두고 노드마다 az 를 쓴다.
- 외부 서비스는 external_service 그룹 안에 접점 노드(external_api/external_auth/external_pg)로 그린다.
- 영역(그룹)의 이름·상위 영역은 바꿀 수 없다.`,
  `- 환경(environment)이나 배포 방식(deploy) 가정이 바뀌면 이 순서로 바꾼다: ① 새 가정에 맞는 영역을 add_group 으로 만든다 ② 새 구성에서도 쓰는 노드(WAS·DB 등)는 지우지 말고 update_node 의 parent 로 새 영역에 옮긴다 ③ 그 뒤에 남은 맞지 않는 노드는 remove_node, 영역은 remove_group 으로 지운다. remove_group 은 안의 노드까지 지우므로 옮길 노드를 먼저 옮긴다.
- k8s_cluster 는 그룹(group_kind)으로만 쓴다. 노드 kind 로 쓰지 않는다.
- 사용자가 모르는 값(IP, hostname, 스펙)은 null 로 둔다. 지어내지 않는다.
- 업무망·인터넷망처럼 분리된 망은 network_zone 영역으로 그리고 망 이름을 label 에 쓴다.
- 서로 다른 망을 잇는 통신은 방화벽(firewall)·망연계 솔루션(network_link)·VPN 노드를 거치게 그리고, 망을 넘는 연결에는 payload(api 또는 file)와 direction(one_way 또는 two_way)을 쓴다. 같은 망 안의 연결에는 사용자가 말하지 않은 payload·direction 을 쓰지 않는다.
- 방화벽·WAF·로드밸런서·API 게이트웨이·망연계·VPN 처럼 통신이 거쳐 가는 노드를 넣으면, 그 노드가 지킬 기존 연결을 remove_edge 하고 앞 노드 → 새 노드 → 뒤 노드로 다시 잇는다(예: 웹 서버 → WAS 를 웹 서버 → 방화벽 → WAS 로). 연결 없이 노드만 놓지 않는다.
- network_zone 영역에는 set_zone_type 으로 망 종류를 붙인다. type 은 "망 종류:" 목록의 key 만 쓰고, 맞는 것이 없거나 근거가 없으면 쓰지 않는다. 요약에 type=…(확정) 이 붙은 망은 바꾸지 않는다. 종류가 없는 기존 망도 이번 요청에 근거가 있으면 붙인다.
- 이번 요청에서 새로 그리거나 종류를 붙인 망처럼 "망 짝 규칙"에 없는 짝은 두 망 종류로 따져 "기관 규칙"을 먼저, 없으면 "기본 짝 규칙", 그것도 없으면 "등급 규칙"을 망 짝 규칙으로 쓴다.
- "망 짝 규칙"이 직접 연결인 두 망(서버와 스토리지망 등)은 사이에 방화벽·망연계 노드를 넣지 않고 바로 잇는다.
- "망 짝 규칙"이 망연계 필요인 두 망을 잇게 되면 사이에 network_link 노드를 넣고 그 add_node 에 "guess":true 를 쓴다. 사용자가 망연계를 넣어 달라고 했으면 guess 를 쓰지 않는다.`,
  `- 사용자가 "방화벽으로 바로"처럼 망연계 없이 이으라고 하면 그대로 따르고, set_assumption 의 key 를 no_link:<망 id>--<망 id>(두 망 id 를 사전순으로), value 를 "망연계 없이 통신" 으로 쓴다. 가정에 no_link:<a>--<b> 가 있는 두 망 사이에는 망연계를 넣지 않는다.
- 종류가 붙은 망이 있으면 인터넷·클라우드 쪽 서버(클라우드 WAS 등)도 알맞은 network_zone 안에 그린다. 외부 사용자와 외부 SaaS 는 망 밖에 그대로 둔다.
- 연결은 실제 요청 흐름 방향(호출하는 쪽 → 받는 쪽)으로.
- edge_kind 는 동기 요청 request, 비동기·이벤트·웹훅 async, 복제·동기화 replication 이다. 모니터링·관리(Bastion, Prometheus 등) 연결은 aux 로 한다.`,
  `- 기존 구성이 주어지면 바꿀 부분만 명령으로 낸다. 기존 id 를 그대로 쓴다.
- 이미 있는 노드·연결은 지웠다가 같은 것을 다시 만들지 않는다. 그대로 두거나 update_node·update_edge 로 고친다. 노드를 이중화 그룹으로 옮길 때도 그 노드의 id 와 연결은 그대로 둔다.
- 요청과 관계없는 노드·영역은 그대로 둔다. 요청에 없으면 노드를 다른 영역으로 옮기거나 이중화 그룹(redundancy_group) 밖으로 빼지 않는다.`,
  `- external_service 그룹은 우리 회사가 운영하지 않는 타사 서비스(PG사, 카카오, 택배사, 문자 발송 등)에만 쓴다. AWS 관리형 서비스(RDS, MSK, ElastiCache, S3, SQS)는 우리 인프라이므로 해당 위치(VPC/서브넷/리전)에 둔다.
- Kafka/MSK/Kinesis 는 stream, SQS/RabbitMQ 는 queue.
- CDN, WAF, DNS 처럼 VPC 밖 전역 서비스는 VPC 밖(리전 그룹 또는 최상위)에 둔다.
- 사용자(client_*)에서 시작하는 진입 연결을 반드시 그린다.
- medium(통신 수단)은 보통의 IP 통신이 아닐 때만 쓴다: 근거리 무선(BLE·NFC·Zigbee 등)은 wireless, 카메라 영상 스트림(RTSP 등)은 video, 실시간 영상·음성(WebRTC)은 media, 기기와 컨트롤러를 바로 잇는 RS-485·RS-232 직렬 선(OSDP·Wiegand·Modbus RTU 등)은 serial. 프로토콜 이름은 label 에 적는다(예: "BLE(GATT)", "RTSP", "SRTP/UDP", "OSDP(RS-485)"). video·media 연결은 영상·음성이 흐르는 방향으로 그린다.
- wireless·serial 연결은 망·방화벽을 거치지 않고 두 기기를 바로 잇는다. BLE·Zigbee·NFC 만 쓰는 기기(iot_device)는 서버에 바로 잇지 않고 휴대폰 앱(client_mobile)이나 iot_gateway 를 거친다.
- 기기·게이트웨이는 mqtt_broker 로 먼저 건다(기기 → 브로커, 예: "MQTT/TLS 8883"). 브로커에서 기기로 내려가는 연결은 따로 그리지 않는다. 브로커에서 뒤쪽 처리로 가는 연결은 async 다.
- 카메라(camera)는 video_recorder(NVR·VMS)에 video 로 잇고, 관제 화면(control_display)은 video_recorder 에서 영상을 받는다. 카메라를 관제 화면이나 인터넷에 바로 잇지 않는다. 밖에서 볼 때는 경계 구역의 media_server 를 거친다.
- 영상 분석·LLM·임베딩 서빙은 model_server 로 그리고 attrs 의 model·gpu 에 값을 쓴다. GPU 를 따로 노드로 만들지 않는다.
- WebRTC 는 연결 두 개로 그린다: 단말 → signaling_server(request, 예: "WSS 443"), 단말 → media_server(medium media). media 연결은 L7 로드밸런서·WAF·API 게이트웨이·CDN 을 거치지 않는다. 단말끼리 직접 잇는 media 는 1:1 통화일 때만 그린다.
- 외부 LLM API 는 external_service 안의 external_api 로 그리고 앱(또는 llm_gateway)에서 밖으로 나가는 request 로 잇는다. 사내 서빙은 앱 → llm_gateway → model_server 순으로 잇는다. 검색 증강(RAG)의 임베딩 저장소는 vector_db 다.
- AI 에이전트(ai_agent)는 모델(model_server 또는 외부 LLM)과 tool_server(MCP 서버)에 각각 잇는다. 모델에서 tool_server 나 사내 시스템으로 바로 잇지 않는다. tool_server 에서 사내 시스템으로는 그 시스템의 원래 연결로 잇는다.`,
  `- 사용자가 채워야 할 정보의 값을 알려 주면 update_node(attrs) 또는 update_edge(label·payload·direction·medium) 로 그 값만 반영한다. 노드·연결을 새로 만들지 않는다.
- "모든 서버", "WAS 전부"처럼 여러 대상을 말하면 현재 구성에서 그 조건에 맞는 노드를 하나도 빠뜨리지 말고 노드마다 update_node 를 낸다. 그 값의 칸이 없는 종류에는 쓰지 않는다.
- 흐름은 요청 하나가 구성도의 연결을 차례로 지나는 길이다. 흐름을 바꾸라는 요청이면 구성 명령과 함께 흐름 명령을 쓴다. 단계 edge 는 현재 구성(또는 이번에 만든) 연결 id 만 쓴다.
- 요청에 흐름 이야기가 없으면 흐름 명령을 쓰지 않는다. 구성을 바꿔 흐름이 끊겨도 도구가 사용자에게 알리므로 흐름을 고치지 않는다.
- "흐름:" 목록에 있는 흐름을 고쳐 달라고 하면 새 흐름을 만들지 말고 그 흐름 id 로 update_flow 를 쓴다. 연결을 바꿨으면 바뀐 연결 id 로 steps 를 다시 쓴다.
- 흐름을 고칠 때는 그대로 남는 단계의 short·text 를 "흐름:" 목록에 있는 글 그대로 쓴다.
- 흐름 단계는 요청이 가는 방향으로만 쓴다. from 은 그 단계를 시작하는 노드 id 다. 응답은 단계로 쓰지 않고 result 한 줄로 쓴다. short 는 12자 이내, text 는 120자 이내, 단계는 20개 이내로 쓴다. origin 은 사용자가 시작하면 user, 배치·스케줄처럼 시스템이 시작하면 system 이다. 흐름 id 는 위 id 규칙을 따르고, 기존 흐름을 고치거나 지울 때는 "흐름:" 목록의 id 를 그대로 쓴다.`,
] as const;

/**
 * say 를 말하는 Qwen 규칙 줄(망 짝 안내·한국어 쓰기) 가운데 그리기 뜻만 남긴 안내 전용 글.
 * SYSTEM_PROMPT 에는 원래 줄이 그대로 있고, 이 글은 get_guide 에만 쓴다.
 */
export const GUIDE_ONLY_LINES = {
  unlinkedPair: `- "망 짝 규칙"이 보통 잇지 않음인 두 망을 이으라고 하면 요청대로 그리고, 보통 잇지 않는 구간이라고 사용자에게 알린다.`,
  koreanText: `- label, sub, set_assumption 의 value 는 모두 한국어로 쓴다. label·sub 예시: "웹 서버 #1", "API 서버 #2", "공개 서브넷", "메인 VPC". 제품명만 원어 그대로 쓴다(CloudFront, Redis, Aurora MySQL, ALB, Tomcat 등).`,
} as const;

/** 그리기 규칙 글머리 전부(get_guide 용). SYSTEM_PROMPT 와 같은 순서이고 Qwen 출력 방식 줄은 없다. */
export const DRAW_RULES: string = [
  DRAW_RULE_GROUPS[0],
  DRAW_RULE_GROUPS[1],
  GUIDE_ONLY_LINES.unlinkedPair,
  DRAW_RULE_GROUPS[2],
  DRAW_RULE_GROUPS[3],
  GUIDE_ONLY_LINES.koreanText,
  DRAW_RULE_GROUPS[4],
  DRAW_RULE_GROUPS[5],
].join("\n");

/** 쓰는 패턴 블록. */
export function patternBlock(): string {
  return patternPromptBlock();
}

const byStr = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/** 망 종류 줄: key·이름·다른 이름·등급(설명은 뺀다). 이름·다른 이름은 JSON 으로 감싼다. */
export function networkTypeLines(k: NetworkKnowledge): string[] {
  return Object.values(k.types)
    .sort((a, b) => byStr(a.key, b.key))
    .map((t) => `${t.key} ${JSON.stringify(t.name)} 다른 이름=${JSON.stringify(t.aliases)} 등급=${GRADE_LABELS[t.grade]}${t.separated ? " 망분리 대상" : ""}`);
}

/** 기본 등급 규칙 줄(GRADE_RULES). 망분리 대상일 때만 맞는 줄은 그렇게 적는다. */
export function gradeRuleLines(): string[] {
  return GRADE_RULES.map(
    (r) =>
      `${GRADE_LABELS[r.a]} -- ${r.b === "*" ? "모든 등급" : GRADE_LABELS[r.b]}${r.when === "separated" ? "(둘 중 하나가 망분리 대상)" : ""}: ${METHOD_LABELS[r.method]}`,
  );
}

/** 기본 제공 짝 규칙 줄(등급 규칙보다 먼저 쓴다). 지식에 없는(숨긴) 종류가 낀 규칙은 뺀다. 근거는 싣지 않는다. */
export function baseRuleLines(k: NetworkKnowledge): string[] {
  return (k.baseRules ?? [])
    .filter((r) => Object.hasOwn(k.types, r.a) && Object.hasOwn(k.types, r.b))
    .map((r) => {
      const [a, b] = pairKey(r.a, r.b);
      return `${a} -- ${b}: ${METHOD_LABELS[r.method]}`;
    })
    .sort(byStr);
}

/** 기본 짝 규칙 블록. 규칙이 없으면 아무것도 넣지 않는다. */
export function baseRuleBlock(k: NetworkKnowledge): string[] {
  const lines = baseRuleLines(k);
  return lines.length ? [`기본 짝 규칙(등급 규칙보다 먼저):\n${lines.join("\n")}`] : [];
}

/** 기관 규칙 줄. 지식에 없는 종류가 낀 규칙은 뺀다. 근거(사용자 글)는 JSON 으로 감싼다. */
export function userRuleLines(k: NetworkKnowledge): string[] {
  return k.rules
    .filter((r) => Object.hasOwn(k.types, r.a) && Object.hasOwn(k.types, r.b))
    .map((r) => {
      const [a, b] = pairKey(r.a, r.b);
      return `${a} -- ${b}: ${METHOD_LABELS[r.method]}${r.note ? ` 근거=${JSON.stringify(r.note)}` : ""}`;
    })
    .sort(byStr);
}

/** 망 지식 안내 글: 망 종류, 등급 규칙(기본), 기관 규칙. 종류 설명(description)은 넣지 않는다. */
export function networkGuideText(k: NetworkKnowledge): string {
  const rules = userRuleLines(k);
  return [
    `망 종류:\n${networkTypeLines(k).join("\n")}`,
    `등급 규칙(기관 규칙·기본 짝 규칙이 없을 때):\n${gradeRuleLines().join("\n")}`,
    ...baseRuleBlock(k),
    `기관 규칙:\n${rules.length ? rules.join("\n") : "없음"}`,
  ].join("\n\n");
}
