import { assume, edge, flow, group, managed, node, type Sample } from "./dsl";

const SERVICES = [
  ["order", "주문"],
  ["payment", "결제"],
  ["product", "상품"],
  ["member", "회원"],
] as const;

const DB = { sw: "PostgreSQL", version: "16", replication: "동기(대기 복제본)", cpu: null, ram: null, ip: null };

/** EKS 위 MSA 와 MSK(Kafka). 상품 DB 만 단일 AZ 라 경고가 남는다(의도된 경고). */
export const EKS_MSA: Sample = {
  id: "eks-msa",
  title: "EKS MSA + Kafka",
  commands: [
    assume("environment", "클라우드(AWS)"),
    assume("deploy", "EKS 위 컨테이너 배포"),
    assume("scale", "마이크로서비스 4종(주문·결제·상품·회원)"),

    group("region", "cloud_region", "AWS 서울 리전"),
    group("vpc", "vpc", "서비스 VPC", "region"),
    group("pub", "subnet_public", "공개 서브넷", "vpc"),
    group("app", "subnet_private", "앱 서브넷", "vpc"),
    group("eks", "k8s_cluster", "EKS 클러스터", "app"),
    group("data", "subnet_private", "데이터 서브넷", "vpc"),

    node("user", "client_web", "고객", null),
    node("alb", "lb_l7", "ALB", "pub", "인그레스용 L7", { ...managed(), port: "443", rules: "모든 경로를 인그레스로 전달" }),
    node("ingress", "k8s_ingress", "인그레스", "eks", "AWS Load Balancer Controller"),
    ...SERVICES.flatMap(([id, ko]) => [
      node(`svc-${id}`, "k8s_service", `${ko} 서비스`, "eks"),
      node(`pod-${id}`, "k8s_pod", `${ko} 파드`, "eks", "Spring Boot 3", { replicas: 3 }),
    ]),
    node("monitoring", "monitoring", "Prometheus·Grafana", "eks", undefined, { sw: "Prometheus", version: "2.53" }),
    node("msk", "stream", "MSK", "data", "Kafka 이벤트", { ...managed(), brokers: 3, version: "3.7" }),
    ...SERVICES.map(([id, ko]) =>
      node(`db-${id}`, "db_rdb", `${ko} DB`, "data", id === "product" ? "RDS PostgreSQL · 단일 AZ" : "RDS PostgreSQL", {
        ...managed(id === "product" ? "no" : "yes"),
        ...DB,
        ...(id === "product" ? { replication: "없음" } : {}),
      }),
    ),

    edge("user", "alb", "request", "HTTPS 443"),
    edge("alb", "ingress", "request", "HTTP 80"),
    ...SERVICES.flatMap(([id]) => [
      edge("ingress", `svc-${id}`, "request", "HTTP 80"),
      edge(`svc-${id}`, `pod-${id}`, "request", "HTTP 8080"),
      edge(`pod-${id}`, `db-${id}`, "request", "PostgreSQL 5432"),
      edge("monitoring", `pod-${id}`, "aux", "지표 수집"),
    ]),
    edge("pod-order", "msk", "async", "주문 생성됨 발행"),
    edge("msk", "pod-payment", "async", "주문 생성됨 구독"),
    edge("msk", "pod-product", "async", "재고 차감 구독"),

    flow("order-create", "주문 생성", "user", "고객이 주문하면 결제·재고 처리가 이벤트로 이어진다.", "주문을 접수하고, 결제와 재고 차감은 뒤에서 이어서 처리한다.", [
      ["user", "alb", "주문 요청", "고객이 ALB 로 주문 요청을 보낸다."],
      ["alb", "ingress", "전달", "ALB 가 EKS 인그레스로 요청을 넘긴다."],
      ["ingress", "svc-order", "경로 배분", "인그레스가 경로를 보고 주문 서비스로 보낸다."],
      ["svc-order", "pod-order", "파드 배분", "주문 서비스가 주문 파드 가운데 하나로 보낸다."],
      ["pod-order", "db-order", "주문 저장", "주문 파드가 주문을 주문 DB 에 저장한다."],
      ["pod-order", "msk", "이벤트 발행", "주문 생성됨 이벤트를 MSK 에 발행한다."],
      ["msk", "pod-payment", "결제 처리", "결제 파드가 이벤트를 받아 결제를 시작한다."],
      ["msk", "pod-product", "재고 차감", "상품 파드가 이벤트를 받아 재고를 줄인다."],
    ]),
  ],
};
