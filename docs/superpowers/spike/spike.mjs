// THROWAWAY SPIKE: Qwen 구성도 명령 생성 품질 + Clef 판정 확인
import fs from "node:fs";
import path from "node:path";

const PROJECT = "C:/Users/devsh/Desktop/new-study/infra-architecture";
const OUT = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Z]:)/, "$1");
const env = Object.fromEntries(
  fs.readFileSync(path.join(PROJECT, ".env"), "utf8").split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);
const QWEN_BASE = env.QWEN_API_URL.replace(/\/chat\/completions$/, "");
const QWEN_KEY = env.QWEN_CODER_KEY;
const MODEL = env.QWEN_MODEL || "qwen3.8-flash-next";
const CLEF_URL = "http://192.168.102.105:30000/v1/systemone";
const CLEF_KEY = env.CLEF_API_KEY;

const KINDS = `client_web client_mobile admin_user dns cdn waf firewall lb_l4 lb_l7 api_gateway nat vpn web_server was app_server batch_server bastion k8s_ingress k8s_service k8s_pod function managed_service db_rdb db_nosql cache search object_storage file_storage db_proxy queue stream monitoring logging ci_cd external_api external_auth external_pg generic`.split(" ");
const GROUP_KINDS = `cloud_region az vpc subnet_public subnet_private dmz idc onprem_zone k8s_cluster external_service redundancy_pair`.split(" ");
const EDGE_KINDS = `request async replication webhook data_sync`.split(" ");

const SYSTEM = `너는 인프라 아키텍처 구성도를 그리는 도구의 엔진이다.
사용자 요청을 받아 구성도 변경 명령을 JSON Lines 로만 출력한다. 한 줄에 JSON 객체 하나. 다른 글, 코드펜스, 설명 금지.

명령 종류:
{"op":"say","text":"진행 상황 한 줄(예: L7 로드밸런서 추가…)"}
{"op":"set_assumption","key":"environment|scale|redundancy|deploy|replication|external","value":"짧은 문장"}
{"op":"add_group","id":"영문-소문자-id","group_kind":"<GROUP_KIND>","label":"표시이름","parent":"상위 그룹 id 또는 null"}
{"op":"add_node","id":"영문-소문자-id","kind":"<KIND>","label":"표시이름(예: WAS#1)","sub":"SW 또는 대수(예: Tomcat 10)","parent":"그룹 id 또는 null","attrs":{"sw":"...","hostname":null,"cpu":null,"ram":null,"ip":null}}
{"op":"add_edge","id":"e-<from>-<to>","from":"노드id","to":"노드id","edge_kind":"<EDGE_KIND>","label":"프로토콜/포트(예: HTTPS 443)"}
{"op":"update_node","id":"기존 노드id","label":"(선택)","sub":"(선택)","parent":"(선택)","attrs":{"바꿀 속성만"}}
{"op":"remove_node","id":"기존 노드id"}
{"op":"remove_edge","id":"기존 엣지id"}
{"op":"warn","target":"노드/그룹 id","message":"위험한 구성 경고 한 문장"}

KIND 허용값: ${KINDS.join(", ")}
GROUP_KIND 허용값: ${GROUP_KINDS.join(", ")}
EDGE_KIND 허용값: ${EDGE_KINDS.join(", ")}

규칙:
- 요청이 애매하면 가정하고 set_assumption 으로 그 가정을 먼저 밝힌다.
- 그룹을 먼저, 그 안의 노드를 다음, 연결은 양 끝 노드가 생긴 뒤에 출력한다.
- 이중화 서버 쌍은 redundancy_pair 그룹으로 묶고 label 에 VIP 를 적는다(예: "WAS VIP").
- 외부 서비스는 external_service 그룹 안에 접점 노드(external_api/external_auth/external_pg)로 그린다.
- 사용자가 모르는 값(IP, hostname, 스펙)은 null 로 둔다. 지어내지 않는다.
- 연결은 실제 요청 흐름 방향(호출하는 쪽 → 받는 쪽)으로.
- 각 단계마다 say 로 진행 상황을 짧게 알린다.
- 기존 구성이 주어지면 바꿀 부분만 명령으로 낸다. 기존 id 를 그대로 쓴다.
- label, sub, say, set_assumption 의 value, warn 의 message 는 모두 한국어로 쓴다. 제품명(Redis, ALB, Tomcat 등)은 원어 그대로.
- external_service 그룹은 우리 회사가 운영하지 않는 타사 서비스(PG사, 카카오, 택배사, 문자 발송 등)에만 쓴다. AWS 관리형 서비스(RDS, MSK, ElastiCache, S3, SQS)는 우리 인프라이므로 해당 위치(VPC/서브넷/리전)에 둔다.
- Kafka/MSK/Kinesis 는 stream, SQS/RabbitMQ 는 queue.
- CDN, WAF, DNS 처럼 VPC 밖 전역 서비스는 VPC 밖(리전 그룹 또는 최상위)에 둔다.
- 사용자(client_*)에서 시작하는 진입 연결을 반드시 그린다.
- 구성에 단일 장애점, 공개 구역의 DB, 방화벽 없는 외부 진입 같은 위험이 있으면 warn 을 낸다.`;

const SCENARIOS = [
  { id: "s1", title: "결제·카카오 로그인 쇼핑몰", prompt: "결제대행사(PG) 연동이랑 카카오 로그인 붙는 쇼핑몰 구성 그려줘. 회원은 10만 정도." },
  { id: "s2", title: "IDC WEB-WAS-DB 이중화", prompt: "사내 IDC 온프레미스로 WEB-WAS-DB 기본 이중화 구성 그려줘. WEB은 Apache, WAS는 Tomcat, DB는 Oracle Active-Standby 이고 WAS와 DB 사이에 DB 중계 서버가 있어. 외부 구간에는 방화벽 있어." },
  { id: "s3", title: "K8s MSA + Kafka", prompt: "AWS EKS 위에 주문, 결제, 상품, 회원 마이크로서비스가 있고 서비스 간 이벤트는 Kafka(MSK)로 주고받아. 각 서비스는 자기 DB(RDS PostgreSQL)를 가지고 있고, 앞단은 ALB Ingress야. 모니터링은 Prometheus/Grafana." },
  { id: "s4", title: "대규모 멀티 AZ 커머스", prompt: "대형 커머스 서비스 구성 그려줘. AWS 서울 리전 2개 AZ 에 걸쳐 있고, CloudFront CDN, WAF, ALB, 웹 서버 4대, API 서버 6대, 배치 서버 2대, Redis 클러스터, Aurora MySQL(Writer 1 + Reader 2), Elasticsearch, S3, SQS, 관리자 페이지, Bastion, NAT, 그리고 외부로 PG사, 택배사 API, 문자 발송 API 연동." },
  { id: "s5", title: "수정 요청 (s2 기반)", base: "s2", prompt: "WAS#1 메모리 32GB로 바꾸고, WEB과 WAS 사이에 L4 스위치 넣어줘. 그리고 WAS 세션 공유용 Redis 하나 추가해줘." },
];

function validateAndApply(state, cmd, errors) {
  const has = (id) => state.nodes[id] || state.groups[id];
  switch (cmd.op) {
    case "say": state.says.push(cmd.text); return;
    case "set_assumption": state.assumptions[cmd.key] = cmd.value; return;
    case "warn": state.warns.push(cmd); if (!has(cmd.target)) errors.push(`warn target 없음: ${cmd.target}`); return;
    case "add_group":
      if (!GROUP_KINDS.includes(cmd.group_kind)) errors.push(`잘못된 group_kind: ${cmd.group_kind}`);
      if (cmd.parent && !state.groups[cmd.parent]) errors.push(`group parent 없음: ${cmd.parent} (${cmd.id})`);
      if (has(cmd.id)) errors.push(`중복 id: ${cmd.id}`);
      state.groups[cmd.id] = cmd; return;
    case "add_node":
      if (!KINDS.includes(cmd.kind)) errors.push(`잘못된 kind: ${cmd.kind} (${cmd.id})`);
      if (cmd.parent && !state.groups[cmd.parent]) errors.push(`node parent 없음: ${cmd.parent} (${cmd.id})`);
      if (has(cmd.id)) errors.push(`중복 id: ${cmd.id}`);
      state.nodes[cmd.id] = cmd; return;
    case "add_edge":
      if (!EDGE_KINDS.includes(cmd.edge_kind)) errors.push(`잘못된 edge_kind: ${cmd.edge_kind}`);
      if (!has(cmd.from) || !has(cmd.to)) { errors.push(`edge 끝점 없음: ${cmd.from}->${cmd.to}`); return; }
      state.edges[cmd.id || `e-${cmd.from}-${cmd.to}`] = cmd; return;
    case "update_node": {
      const n = state.nodes[cmd.id] || state.groups[cmd.id];
      if (!n) { errors.push(`update 대상 없음: ${cmd.id}`); return; }
      const { op, attrs, ...rest } = cmd;
      Object.assign(n, rest); n.attrs = { ...(n.attrs || {}), ...(attrs || {}) }; n._updated = true; return;
    }
    case "remove_node":
      if (!state.nodes[cmd.id]) { errors.push(`remove 대상 없음: ${cmd.id}`); return; }
      delete state.nodes[cmd.id];
      for (const [k, e] of Object.entries(state.edges)) if (e.from === cmd.id || e.to === cmd.id) delete state.edges[k];
      return;
    case "remove_edge":
      if (!state.edges[cmd.id]) { errors.push(`remove_edge 대상 없음: ${cmd.id}`); return; }
      delete state.edges[cmd.id]; return;
    default: errors.push(`알 수 없는 op: ${cmd.op}`);
  }
}

function summarizeState(state) {
  const lines = [];
  for (const g of Object.values(state.groups)) lines.push(`그룹 ${g.id} [${g.group_kind}] "${g.label}" parent=${g.parent ?? "-"}`);
  for (const n of Object.values(state.nodes)) lines.push(`노드 ${n.id} [${n.kind}] "${n.label}" sub="${n.sub ?? ""}" parent=${n.parent ?? "-"} attrs=${JSON.stringify(n.attrs ?? {})}`);
  for (const [id, e] of Object.entries(state.edges)) lines.push(`연결 ${id}: ${e.from} -> ${e.to} [${e.edge_kind}] "${e.label ?? ""}"`);
  return lines.join("\n");
}

async function runScenario(sc, baseState) {
  const state = baseState ? structuredClone(baseState) : { groups: {}, nodes: {}, edges: {}, assumptions: {}, says: [], warns: [] };
  if (baseState) { state.says = []; state.warns = []; for (const n of Object.values(state.nodes)) delete n._updated; }
  const userContent = baseState ? `현재 구성:\n${summarizeState(baseState)}\n\n요청: ${sc.prompt}` : sc.prompt;
  const errors = [], timeline = [], badLines = [];
  const t0 = Date.now();
  const res = await fetch(`${QWEN_BASE}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${QWEN_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL, stream: true, temperature: 0.3, max_tokens: 16000,
      chat_template_kwargs: { enable_thinking: false },
      messages: [{ role: "system", content: SYSTEM }, { role: "user", content: userContent }],
    }),
  });
  if (!res.ok) throw new Error(`${sc.id} HTTP ${res.status} ${await res.text()}`);
  let buf = "", sse = "", firstCmd = null, cmdCount = 0, raw = "";
  const handleLine = (line) => {
    line = line.trim().replace(/^```(json|jsonl)?/, "").replace(/```$/, "").trim();
    if (!line) return;
    let cmd;
    try { cmd = JSON.parse(line); } catch { badLines.push(line.slice(0, 160)); return; }
    cmdCount++; if (!firstCmd) firstCmd = Date.now() - t0;
    timeline.push({ t: Date.now() - t0, op: cmd.op, id: cmd.id ?? cmd.key ?? "" });
    validateAndApply(state, cmd, errors);
  };
  const dec = new TextDecoder();
  for await (const chunk of res.body) {
    sse += dec.decode(chunk, { stream: true });
    let i;
    while ((i = sse.indexOf("\n")) >= 0) {
      const ev = sse.slice(0, i).trim(); sse = sse.slice(i + 1);
      if (!ev.startsWith("data:")) continue;
      const data = ev.slice(5).trim();
      if (data === "[DONE]") continue;
      const delta = JSON.parse(data).choices?.[0]?.delta?.content ?? "";
      raw += delta; buf += delta;
      buf = buf.replace(/<think>[\s\S]*?<\/think>/g, "");
      let j;
      while ((j = buf.indexOf("\n")) >= 0) { handleLine(buf.slice(0, j)); buf = buf.slice(j + 1); }
    }
  }
  handleLine(buf);
  const total = Date.now() - t0;
  return {
    id: sc.id, title: sc.title, prompt: sc.prompt, state, errors, badLines, timeline,
    metrics: { firstCmdMs: firstCmd, totalMs: total, cmds: cmdCount,
      nodes: Object.keys(state.nodes).length, groups: Object.keys(state.groups).length, edges: Object.keys(state.edges).length },
    raw,
  };
}

async function testToolCalling() {
  const t0 = Date.now();
  const res = await fetch(`${QWEN_BASE}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${QWEN_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL, chat_template_kwargs: { enable_thinking: false },
      messages: [{ role: "user", content: "웹서버 노드 하나와 DB 노드 하나를 추가하고 연결해줘" }],
      tools: [
        { type: "function", function: { name: "add_node", description: "노드 추가", parameters: { type: "object", properties: { id: { type: "string" }, kind: { type: "string" }, label: { type: "string" } }, required: ["id", "kind", "label"] } } },
        { type: "function", function: { name: "add_edge", description: "연결 추가", parameters: { type: "object", properties: { from: { type: "string" }, to: { type: "string" } }, required: ["from", "to"] } } },
      ],
    }),
  });
  const j = await res.json();
  const msg = j.choices?.[0]?.message;
  return { status: res.status, ms: Date.now() - t0, tool_calls: msg?.tool_calls?.map((t) => ({ name: t.function.name, args: t.function.arguments })) ?? null, content: msg?.content?.slice(0, 300) ?? null, error: j.error ?? null };
}

async function clef(state, questions) {
  const t0 = Date.now();
  const res = await fetch(CLEF_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${CLEF_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "Cloudflare/clef-flash", state, questions }),
  });
  const j = await res.json();
  return { status: res.status, ms: Date.now() - t0, ...j };
}

async function testClef() {
  const intentQ = { intent: { type: "choice", instructions: "인프라 구성도 도구에서 사용자가 입력한 문장의 의도",
    criteria: { structure_change: "구성도에 노드/연결/영역을 추가·삭제·수정해 달라는 요청", question: "용어·구성에 대한 질문이나 설명 요청", missing_info_answer: "IP·스펙·hostname 같은 빠진 정보에 대한 답", history: "이전 버전으로 되돌리기나 변경 이력 요청", other: "그 밖의 대화" } } };
  const utterances = [
    ["DB를 하나 더 추가해서 이중화 해줘", "structure_change"],
    ["L4랑 L7 차이가 뭐야?", "question"],
    ["WAS 두 대 다 4코어 16기가야", "missing_info_answer"],
    ["아까 Redis 넣기 전으로 돌려줘", "history"],
    ["10.0.2.11, 10.0.2.12", "missing_info_answer"],
    ["이 구성에서 단일 장애점이 어디야?", "question"],
    ["카카오 로그인 연동 빼줘", "structure_change"],
    ["고마워", "other"],
  ];
  const intents = [];
  for (const [u, expect] of utterances) {
    const r = await clef(u, intentQ);
    const a = r.answers?.intent;
    intents.push({ u, expect, got: a?.choice, confidence: a?.confidence, ok: a?.choice === expect, ms: r.ms, err: r.detail ?? r.error });
  }
  const riskQ = { public_db: { type: "noul", instructions: "데이터베이스가 인터넷에서 직접 접근 가능한 위치(공개 서브넷 등)에 있거나 외부에서 DB로 바로 연결되는가?" },
    spof: { type: "noul", instructions: "핵심 서버(LB·WAS·DB 등) 중 1대뿐이라 고장 나면 서비스 전체가 멈추는 단일 장애점이 있는가?" } };
  const risky = "그룹 public [subnet_public]: 노드 lb(lb_l7), was-1(was), db-1(db_rdb, MySQL)\n연결: user->lb, lb->was-1, was-1->db-1, internet->db-1 (관리용 3306 직접 접속)";
  const safe = "그룹 public [subnet_public]: 노드 lb(lb_l7)\n그룹 private [subnet_private]: 노드 was-1, was-2(was, 이중화), db-a(Active), db-s(Standby)\n연결: user->lb, lb->was-1, lb->was-2, was-*->db-a, db-a->db-s(복제)";
  const risk = { risky: await clef(risky, riskQ), safe: await clef(safe, riskQ) };
  const qualQ = { difficulty: { type: "score", instructions: "IT 비전공자가 이 설명을 읽고 바로 이해할 수 있는가? 전문용어가 풀이 없이 많거나 문장이 길고 장황할수록 높은 단계", criteria: ["쉽고 간결함", "보통", "어렵거나 장황함"] } };
  const good = "Redis(Remote Dictionary Server)는 데이터를 디스크가 아닌 메모리에 저장해 빠른 읽기와 쓰기 속도를 제공하는 인메모리 키-값 저장소입니다.";
  const bad = "Redis는 BSD 라이선스 기반의 인메모리 데이터 구조 서버로서 String, Hash, List, Set, Sorted Set, Bitmap, HyperLogLog, Geospatial Index, Stream 등의 다양한 자료구조를 지원하며 RDB 스냅샷과 AOF 로그 기반의 영속성 메커니즘, Sentinel을 통한 고가용성, Cluster 모드를 통한 해시 슬롯 기반 샤딩, Lua 스크립팅, Pub/Sub 메시징, 트랜잭션(MULTI/EXEC) 및 낙관적 락(WATCH) 등을 제공하므로 다양한 워크로드에서 활용될 수 있는 범용적 솔루션입니다.";
  const quality = { good: await clef(good, qualQ), bad: await clef(bad, qualQ) };
  return { intents, risk, quality };
}

const results = { startedAt: new Date().toISOString(), model: MODEL };
results.toolCalling = await testToolCalling().catch((e) => ({ error: String(e) }));
console.log("tool calling:", JSON.stringify(results.toolCalling).slice(0, 400));
results.scenarios = [];
const byId = {};
for (const sc of SCENARIOS) {
  try {
    const r = await runScenario(sc, sc.base ? byId[sc.base]?.state : null);
    byId[sc.id] = r; results.scenarios.push(r);
    console.log(sc.id, JSON.stringify(r.metrics), "errors:", r.errors.length, "bad:", r.badLines.length);
  } catch (e) { console.log(sc.id, "FAILED", String(e).slice(0, 300)); results.scenarios.push({ id: sc.id, title: sc.title, failed: String(e) }); }
}
results.clef = await testClef().catch((e) => ({ error: String(e) }));
console.log("clef:", JSON.stringify(results.clef?.intents?.map((i) => [i.expect, i.got, i.confidence?.toFixed?.(2)])));
fs.writeFileSync(path.join(OUT, "results.json"), JSON.stringify(results, null, 2));
console.log("saved", path.join(OUT, "results.json"));
