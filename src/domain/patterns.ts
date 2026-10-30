// 구성 패턴 라이브러리(스펙 §7.1). AI 프롬프트의 기준 지식이자 경고 규칙의 근거로만 쓴다.
export interface Pattern { id: string; name: string; summary: string }

export const PATTERNS: Pattern[] = [
  {
    id: "web-was-db",
    name: "WEB-WAS-DB 이중화",
    summary: "사용자 요청이 L4/L7 로드밸런서(VIP)에서 웹 서버, WAS, DB 순으로 흐른다. 각 계층은 2대 이상 이중화 묶음으로 두고, DB 는 Active/Standby 와 복제(필요 시 DB 중계)를 쓰며 내부 구역에 둔다.",
  },
  {
    id: "lb-autoscale",
    name: "로드밸런싱 + 오토스케일링",
    summary: "외부 요청은 WAF·방화벽을 거쳐 L4/L7 로드밸런서로 들어오고, 로드밸런서가 오토스케일링되는 서버 묶음으로 트래픽을 나눈다. 부하에 따라 서버 수가 늘고 줄어든다.",
  },
  {
    id: "cache",
    name: "캐시 계층",
    summary: "WAS 가 Redis 같은 캐시를 먼저 조회하고 없으면 원본 DB 를 읽어 캐시에 채운다(Cache-aside). 캐시는 원본 DB 앞의 계층이라 원본 DB 와 함께 둔다.",
  },
  {
    id: "mq-async",
    name: "메시지 큐 비동기 처리",
    summary: "WAS 같은 생산자가 Kafka·RabbitMQ 큐에 메시지를 넣고, 소비자(배치·워커)가 꺼내 비동기로 처리한다. 요청과 처리를 분리해 부하를 완충한다.",
  },
  {
    id: "k8s",
    name: "Kubernetes 클러스터",
    summary: "외부 요청이 인그레스, 쿠버네티스 서비스, 파드 순으로 전달된다. 파드는 여러 개로 복제되고 DB 같은 상태 저장소는 클러스터 밖이나 별도 구역에 둔다.",
  },
  {
    id: "cdn-static",
    name: "CDN + 정적 호스팅",
    summary: "사용자 요청이 DNS 와 CDN 을 거쳐 오브젝트 스토리지의 정적 파일을 받아 간다. 동적 요청만 로드밸런서와 서버로 넘어간다.",
  },
  {
    id: "serverless",
    name: "서버리스",
    summary: "클라이언트가 API 게이트웨이로 요청하면 게이트웨이가 함수를 호출하고, 함수는 관리형 DB·스토리지를 사용한다. 서버를 직접 관리하지 않는다.",
  },
  {
    id: "dr",
    name: "재해복구(DR) 구성",
    summary: "주 사이트(리전·AZ)와 복구 사이트를 나누고 DB 와 데이터를 복제로 동기화한다. 장애 시 DNS 나 로드밸런서가 트래픽을 복구 사이트로 돌린다.",
  },
  {
    id: "external",
    name: "외부 연동",
    summary: "WAS 가 PG 결제나 OAuth 소셜 로그인 같은 외부 서비스를 호출하며, 이 연결은 방화벽·NAT 등 허용된 경로로만 나간다. 외부 서비스는 별도 영역으로 구분해 표시한다.",
  },
];

/** 생성 프롬프트에 넣을 기준 지식 블록. 패턴당 한 줄. */
export function patternPromptBlock(): string {
  return ["구성 패턴(기준 지식):", ...PATTERNS.map((p) => `- ${p.name}: ${p.summary}`)].join("\n");
}
