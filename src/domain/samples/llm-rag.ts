import { assume, edge, flow, group, node, type Sample } from "./dsl";

const SERVER = { os: "Ubuntu 22.04", cpu: "8 Core", ram: "32GB", disk: "200GB", hostname: null, ip: null };

/**
 * 사내 LLM·RAG 에이전트. 에이전트가 벡터 DB 에서 문서를 찾고 LLM 게이트웨이로 사내 모델(필요하면 외부 LLM)을 부르며,
 * MCP 도구 서버로 그룹웨어 일을 한다. 그룹웨어가 1대라 경고가 남는다(의도된 경고).
 */
export const LLM_RAG: Sample = {
  id: "llm-rag",
  title: "사내 LLM·RAG 에이전트",
  commands: [
    assume("environment", "사내 IDC"),
    assume("external", "사내 모델로 답하기 어려운 질문만 외부 LLM API 로 보낸다"),

    group("idc", "idc", "사내 IDC"),
    group("svc", "onprem_zone", "서비스 구역", "idc"),
    group("portal-vip", "redundancy_group", "포털 VIP", "svc"),
    group("ai", "onprem_zone", "AI 구역", "idc"),
    group("ext", "external_service", "외부 서비스"),

    node("staff", "client_web", "직원 브라우저", null),
    node("apigw", "api_gateway", "API 게이트웨이", "svc", "Kong"),
    node("portal-1", "app_server", "사내 포털 #1", "portal-vip", "Next.js", { ...SERVER, sw: "Next.js 15" }),
    node("portal-2", "app_server", "사내 포털 #2", "portal-vip", "Next.js", { ...SERVER, sw: "Next.js 15" }),
    node("groupware", "app_server", "그룹웨어", "svc", "결재·일정", { ...SERVER, sw: null }),
    node("agent", "ai_agent", "AI 에이전트", "ai", "LangGraph", { model: "사내 모델 우선", sw: "LangGraph" }),
    node("mcp", "tool_server", "MCP 도구 서버", "ai", "그룹웨어 도구", { transport: "Streamable HTTP" }),
    node("llm-gw", "llm_gateway", "LLM 게이트웨이", "ai", "LiteLLM", { sw: "LiteLLM", version: "1.5" }),
    node("model", "model_server", "사내 모델 서버", "ai", "vLLM", { model: "Qwen3 32B", gpu: "H100 × 2", sw: "vLLM" }),
    node("vector", "vector_db", "벡터 DB", "ai", "Qdrant", { sw: "Qdrant", version: "1.12" }),
    node("indexer", "batch_server", "문서 색인 배치", "ai", "매일 새벽", { ...SERVER, sw: "Python 3.12" }),
    node("docs", "file_storage", "사내 문서 저장소", "svc", "NAS", { cpu: null, ram: null, ip: null, replication: null, version: null }),
    node("fw-out", "firewall", "외부 방화벽", "idc", undefined, { port: "443", rules: "LLM 게이트웨이 → 외부 LLM API 만 허용", vip: null }),
    node("ext-llm", "external_api", "외부 LLM API", "ext", undefined, { integration: "HTTPS REST" }),

    edge("staff", "apigw", "request", "HTTPS 443"),
    edge("apigw", "portal-1", "request", "HTTP 3000"),
    edge("apigw", "portal-2", "request", "HTTP 3000"),
    edge("portal-1", "agent", "request", "질문 HTTP"),
    edge("portal-2", "agent", "request", "질문 HTTP"),
    edge("agent", "vector", "request", "유사 문서 검색"),
    edge("agent", "llm-gw", "request", "추론 요청"),
    edge("llm-gw", "model", "request", "OpenAI 호환 API"),
    edge("llm-gw", "fw-out", "request", "HTTPS 443"),
    edge("fw-out", "ext-llm", "request", "HTTPS 443"),
    edge("agent", "mcp", "request", "MCP 도구 호출"),
    edge("mcp", "groupware", "request", "결재·일정 API"),
    edge("indexer", "docs", "request", "문서 읽기 SMB"),
    edge("indexer", "llm-gw", "request", "임베딩 요청"),
    edge("indexer", "vector", "request", "벡터 저장"),

    flow("ask", "질문 답변", "user", "직원이 사내 규정을 묻는다.", "근거 문서와 함께 답변을 돌려준다.", [
      ["staff", "apigw", "질문", "직원이 API 게이트웨이로 질문을 보낸다."],
      ["apigw", "portal-1", "포털", "게이트웨이가 사내 포털로 넘긴다."],
      ["portal-1", "agent", "에이전트", "포털이 AI 에이전트에 질문을 맡긴다."],
      ["agent", "vector", "문서 검색", "에이전트가 벡터 DB 에서 관련 문서를 찾는다."],
      ["agent", "llm-gw", "추론 요청", "찾은 문서를 붙여 LLM 게이트웨이에 답을 요청한다."],
      ["llm-gw", "model", "사내 모델", "게이트웨이가 사내 모델 서버로 보낸다."],
    ]),
    flow("index", "문서 색인", "system", "새 문서를 검색할 수 있게 벡터로 바꿔 둔다.", "새 문서의 벡터가 벡터 DB 에 쌓인다.", [
      ["indexer", "docs", "문서 읽기", "배치가 문서 저장소에서 새 문서를 읽는다."],
      ["indexer", "llm-gw", "임베딩", "LLM 게이트웨이로 문서 조각의 임베딩을 받는다."],
      ["indexer", "vector", "벡터 저장", "임베딩을 벡터 DB 에 저장한다."],
    ]),
  ],
};
