// device: 현장에 놓이는 기기(센서·카메라 등). 사람이 쓰는 단말(client)과 달리 방화벽 없는 진입 경고의 출발점으로 보지 않는다.
export type Category = "client" | "device" | "network" | "compute" | "data" | "external";

const SERVER = ["hostname", "cpu", "ram", "disk", "os", "ip", "sw"];
const GUARD = ["port", "rules", "vip"];
const DATA = ["cpu", "ram", "ip", "replication", "version"];

interface NodeKindDef {
  kind: string;
  labelKo: string;
  category: Category;
  requiredAttrs: string[];
}

const nk = (kind: string, labelKo: string, category: Category, requiredAttrs: string[] = []): NodeKindDef => ({
  kind,
  labelKo,
  category,
  requiredAttrs,
});

export const NODE_KINDS = [
  nk("client_web", "웹 클라이언트", "client"),
  nk("client_mobile", "모바일 클라이언트", "client"),
  nk("admin_user", "관리자", "client"),
  nk("control_display", "관제 화면", "client"),
  nk("iot_device", "IoT 기기", "device", ["count", "comm"]),
  nk("camera", "카메라", "device", ["count", "resolution"]),
  nk("dns", "DNS", "network"),
  nk("cdn", "CDN", "network"),
  nk("waf", "WAF", "network"),
  nk("firewall", "방화벽", "network", GUARD),
  nk("lb_l4", "L4 로드밸런서", "network", GUARD),
  nk("lb_l7", "L7 로드밸런서", "network", GUARD),
  nk("api_gateway", "API 게이트웨이", "network"),
  nk("nat", "NAT", "network"),
  nk("vpn", "VPN", "network"),
  nk("network_link", "망연계 솔루션", "network", ["sw"]),
  nk("iot_gateway", "기기 게이트웨이", "network", ["ip", "comm"]),
  nk("llm_gateway", "LLM 게이트웨이", "network", ["sw", "version"]),
  nk("web_server", "웹 서버", "compute", SERVER),
  nk("was", "WAS", "compute", SERVER),
  nk("app_server", "앱 서버", "compute", SERVER),
  nk("batch_server", "배치 서버", "compute", SERVER),
  nk("bastion", "배스천", "compute", SERVER),
  nk("k8s_cluster", "쿠버네티스 클러스터", "compute", ["nodes", "version"]),
  nk("k8s_ingress", "인그레스", "compute"),
  nk("k8s_service", "쿠버네티스 서비스", "compute"),
  nk("k8s_pod", "파드", "compute", ["replicas"]),
  nk("function", "함수", "compute", ["runtime", "service"]),
  nk("managed_service", "관리형 서비스", "compute", ["runtime", "service"]),
  nk("video_recorder", "영상 저장·관리", "compute", ["channels", "retention", "disk", "sw"]),
  nk("model_server", "AI 모델 서버", "compute", ["model", "gpu", "sw"]),
  nk("ai_agent", "AI 에이전트", "compute", ["model", "sw"]),
  nk("tool_server", "도구 서버(MCP)", "compute", ["transport"]),
  nk("signaling_server", "시그널링 서버", "compute", ["ip", "port", "sw"]),
  nk("media_server", "미디어 서버", "compute", ["ip", "port", "sw"]),
  nk("db_rdb", "관계형 DB", "data", DATA),
  nk("db_nosql", "NoSQL DB", "data", DATA),
  nk("cache", "캐시", "data", DATA),
  nk("search", "검색 엔진", "data", DATA),
  nk("object_storage", "오브젝트 스토리지", "data", DATA),
  nk("file_storage", "파일 스토리지", "data", DATA),
  nk("db_proxy", "DB 중계", "data", DATA),
  nk("vector_db", "벡터 DB", "data", ["sw", "version"]),
  nk("queue", "큐", "compute", ["brokers", "version"]),
  nk("stream", "스트림", "compute", ["brokers", "version"]),
  nk("mqtt_broker", "MQTT 브로커", "compute", ["sw", "port"]),
  nk("monitoring", "모니터링", "compute", ["sw", "version"]),
  nk("logging", "로깅", "compute", ["sw", "version"]),
  nk("ci_cd", "CI/CD", "compute", ["sw", "version"]),
  nk("external_api", "외부 API", "external", ["integration"]),
  nk("external_auth", "외부 인증", "external", ["integration"]),
  nk("external_pg", "외부 결제(PG)", "external", ["integration"]),
  nk("generic", "기타", "compute"),
] as const satisfies readonly NodeKindDef[];

export type NodeKind = (typeof NODE_KINDS)[number]["kind"];

export function categoryOf(kind: NodeKind): Category {
  return NODE_KINDS.find((k) => k.kind === kind)!.category;
}

export const GROUP_KINDS = [
  { kind: "cloud_region", labelKo: "클라우드 리전", zoneToken: "--zone-region", tintToken: "--zone-tint-region", innerDirection: "DOWN", dashed: true },
  { kind: "vpc", labelKo: "VPC", zoneToken: "--zone-vpc", tintToken: "--zone-tint-vpc", innerDirection: "DOWN", dashed: false },
  { kind: "subnet_public", labelKo: "공개 구역", zoneToken: "--zone-subnet-public", tintToken: "--zone-tint-public", innerDirection: "DOWN", dashed: false },
  { kind: "subnet_private", labelKo: "내부 구역", zoneToken: "--zone-subnet-private", tintToken: "--zone-tint-private", innerDirection: "DOWN", dashed: false },
  { kind: "dmz", labelKo: "DMZ", zoneToken: "--zone-subnet-public", tintToken: "--zone-tint-dmz", innerDirection: "DOWN", dashed: false },
  { kind: "idc", labelKo: "IDC", zoneToken: "--zone-region", tintToken: "--zone-tint-onprem", innerDirection: "DOWN", dashed: true },
  { kind: "onprem_zone", labelKo: "온프레미스 구역", zoneToken: "--zone-region", tintToken: "--zone-tint-onprem", innerDirection: "DOWN", dashed: true },
  { kind: "k8s_cluster", labelKo: "쿠버네티스 클러스터", zoneToken: "--zone-vpc", tintToken: "--zone-tint-k8s", innerDirection: "RIGHT", dashed: false },
  { kind: "network_zone", labelKo: "망", zoneToken: "--zone-region", tintToken: "--zone-tint-network", innerDirection: "DOWN", dashed: true },
  { kind: "external_service", labelKo: "외부 서비스", zoneToken: "--zone-external", tintToken: "--zone-tint-external", innerDirection: "DOWN", dashed: true },
  { kind: "redundancy_group", labelKo: "이중화 묶음", zoneToken: "--zone-redundancy", tintToken: "--zone-tint-redundancy", innerDirection: "RIGHT", dashed: true },
] as const;

export type GroupKind = (typeof GROUP_KINDS)[number]["kind"];

export const EDGE_KINDS = [
  { kind: "request", label: "동기 요청", colorToken: "--edge-request", dash: null, motion: "comet", speedFactor: 1, defaultHidden: false },
  { kind: "async", label: "비동기·이벤트", colorToken: "--edge-async", dash: "7 5", motion: "capsule", speedFactor: 0.75, defaultHidden: false },
  { kind: "replication", label: "복제·동기화", colorToken: "--edge-replication", dash: null, motion: "sheen", speedFactor: 0.5, defaultHidden: false },
  { kind: "aux", label: "보조(관리·모니터링)", colorToken: "--edge-aux", dash: "1.5 4", motion: "none", speedFactor: 0, defaultHidden: true },
] as const;

export type EdgeKind = (typeof EDGE_KINDS)[number]["kind"];
