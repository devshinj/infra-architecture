// 배달앱 — 클라우드(AWS 서울 리전). 실제 회사의 구성이 아니라 이런 서비스를 만들 때 흔히 쓰는 구성이다. 값은 모두 예시다.
// 가상 값: VPC 10.30.0.0/16. 서브넷은 AZ 마다 하나씩이다(공개 10.30.0.0/24·10.30.1.0/24, 앱 10.30.10.0/24·10.30.11.0/24, 데이터 10.30.20.0/24·10.30.21.0/24).
// 빈 영역이 남지 않게 영역은 그 안에 처음 무언가를 놓는 단계에서 만든다(1단계에 리전·VPC·공개 서브넷, 2단계에 앱 서브넷, 3단계에 데이터 서브넷).
// 주문 상태 알림: 주문 API → SNS 주제 → 알림 큐(SQS) → 알림 워커 → FCM·APNs(고객·라이더) / 실시간 Redis → 실시간 서버 → WebSocket(가게).
// 배차: 같은 SNS 주제 → 배차 큐(접수 이벤트만) → 배차 서비스 → 위치 캐시(GEO) 반경 조회 → '배차 제안' 이벤트 → 알림 워커가 라이더에게 푸시.
// 라이더 위치는 RDS 에 쓰지 않고 위치 캐시에 최신 값만 둔다. 고객 화면으로는 실시간 Redis → 실시간 서버 → WebSocket 으로 내려간다.
import type { Command } from "../commands";
import { assume, edge, edgeId, group, managed, node } from "../samples/dsl";

import { countConflicts, E, edgeText, G, groupText, N, nodeText, update } from "./authoring";
import type { GuideVariant } from "./types";

const ec2 = (hostname: string, ip: string, az: "2a" | "2c") => ({
  sw: "Spring Boot 3.5", os: "Amazon Linux 2023", cpu: "2 vCPU (m6i.large)", ram: "8GiB", disk: "30GiB gp3", hostname, ip, az,
});
const NO_VERSION = "관리형(버전 없음)";
const redis = (): Record<string, string> => ({
  ...managed("yes"), sw: "Amazon ElastiCache", version: "Redis OSS 7.1", replication: "주 노드 + 다른 AZ 복제본(자동 장애 조치)",
});

const ASG_DEF = {
  term: "Auto Scaling 그룹",
  definition: "Auto Scaling 그룹은 같은 설정의 EC2 서버를 정한 대수만큼 유지하고 부하에 따라 늘리거나 줄이는 AWS 의 서버 묶음입니다.",
};

const ALB_RULES = {
  orders: "443 리스너: /orders·/stores → 주문 API(8080) · 헬스 체크 /health",
  ws: "443 리스너: /orders·/stores → 주문 API(8080), /ws → 실시간 서버(8080) · 헬스 체크 /health",
  location: "443 리스너: /orders·/stores → 주문 API(8080), /ws → 실시간 서버(8080), /rider/location → 위치 API(8080) · 헬스 체크 /health",
};

/** 흐름 단계: [출발, 도착, 짧은 설명, 설명]. 거꾸로 지나는 단계(내려보내기)는 back() 으로 쓴다. */
type FlowStepRow = [from: string, to: string, short: string, text: string];
type FlowStepCmd = { edge: string; from: string; short: string; text: string };
/** 연결을 거꾸로 지나는 단계. 연결 id 는 원래 방향(to → from)의 것이다. */
const back = (from: string, to: string, short: string, text: string): FlowStepCmd => ({ edge: edgeId(to, from), from, short, text });
const flowOf = (id: string, name: string, summary: string, result: string, steps: (FlowStepRow | FlowStepCmd)[]): Command => ({
  op: "add_flow",
  id,
  name,
  origin: "user",
  summary,
  result,
  steps: steps.map((s) => (Array.isArray(s) ? { edge: edgeId(s[0], s[1]), from: s[0], short: s[2], text: s[3] } : s)),
});

export const DELIVERY_CLOUD: GuideVariant = {
  environment: "클라우드(AWS)",
  outro:
    "서울 리전 VPC 에 세 앱이 함께 쓰는 ALB 와 역할별 서비스(주문·알림·실시간·위치·배차)를 두 AZ 에 나눠 두었어요. 주문 상태가 바뀌면 SNS·SQS 를 거쳐 고객·라이더에는 푸시로, 가게에는 WebSocket 으로 알리고, 라이더 위치는 DB 가 아닌 위치 캐시에 최신 값만 두어 배차와 고객 화면에 써요.",
  otherEnv: [
    { from: "ALB(경로별 분배·WebSocket)", to: "L4·L7 장비 두 대(VIP)" },
    { from: "서비스별 EC2 Auto Scaling 그룹(두 AZ)", to: "서비스별 서버 두 대씩(이중화)" },
    { from: "예약 조정(점심·저녁 전 미리 늘리기)", to: "가장 몰릴 때를 견딜 만큼 서버를 미리 사 둠" },
    { from: "RDS Multi-AZ(엔드포인트)", to: "DB Active-Standby(VIP)" },
    { from: "ElastiCache(메뉴·실시간·위치)", to: "Redis + Sentinel" },
    { from: "SNS·SQS", to: "사내 메시지 브로커(Kafka·RabbitMQ)" },
    { from: "NAT 게이트웨이", to: "외부 방화벽·아웃바운드 프록시(PG사·푸시·지도로 나가는 길)" },
    { from: "CloudWatch", to: "Zabbix·ELK" },
  ],
  steps: [
    // ── 1. 세 앱과 입구(ALB) ───────────────────────────────────
    {
      id: "entry",
      goal: "세 앱과 입구(ALB)",
      example: "고객·가게·라이더 앱이 ALB 로 들어오게 해 줘",
      keywords: [
        ["alb", "로드밸런서", "로드 밸런서", "load balancer", "elb", "입구", "진입", "vpc"],
        ["고객", "가게", "라이더", "세 앱", "앱", "들어", "접속"],
      ],
      commands: [
        assume("scale", "하루 주문 50만 건, 점심·저녁에 평소의 5배"),
        node("customer", "client_mobile", "고객 앱", null),
        node("store", "client_mobile", "가게 앱", null, "주문 접수 태블릿"),
        node("rider", "client_mobile", "라이더 앱", null),
        group("region", "cloud_region", "AWS 서울 리전"),
        group("vpc", "vpc", "배달 VPC", "region"),
        group("pub", "subnet_public", "공개 서브넷", "vpc"),
        node("alb", "lb_l7", "ALB", "pub", "L7 로드밸런서", { ...managed(), sw: "AWS ALB", port: "443", rules: ALB_RULES.orders }),
        edge("customer", "alb", "request", "HTTPS 443"),
        edge("store", "alb", "request", "HTTPS 443"),
        edge("rider", "alb", "request", "HTTPS 443"),
      ],
      say: "고객·가게·라이더 세 앱과, 세 앱이 함께 쓰는 입구인 ALB 를 놓았어요. 앱마다 서버를 따로 두지 않고, ALB 가 요청 경로를 보고 주문·위치 같은 역할별 서비스로 나눠 보내요.",
      notes: [
        { kind: "flow", text: "고객은 주문하고, 가게는 접수·조리 완료를, 라이더는 픽업·배달 완료를 눌러요. 세 앱이 같은 주문의 상태를 바꾸고 봐요." },
        { kind: "net", text: "ALB 는 인터넷과 닿는 공개 서브넷에 두고, AWS 가 여러 AZ 에 이중화해요. 서버는 인터넷에서 바로 닿지 않는 서브넷에 둘 거예요." },
        { kind: "caution", text: "입구가 하나라 권한 확인이 중요해요. 서버는 로그인 토큰에서 고객·가게·라이더 역할을 보고, 남의 주문이나 다른 역할의 기능은 막아요." },
      ],
      miss: "이번 단계는 세 앱이 들어오는 입구예요. '고객·가게·라이더 앱이 ALB 로 들어오게 해 줘'처럼 말해 보세요.",
      explains: {
        [N("customer")]: nodeText(
          "음식을 고르고 주문·결제하며, 배달 상태와 라이더 위치를 보는 고객의 휴대폰 앱이에요.",
          ["고객·가게·라이더 앱을 따로 만든다", "하는 일과 화면이 달라 앱마다 필요한 기능만 담는다", "한 앱에서 로그인한 역할에 따라 화면을 바꾼다", "앱 세 개를 따로 배포하고 관리해야 한다"],
        ),
        [N("store")]: nodeText(
          "가게가 새 주문을 받아 접수하고 조리 완료를 누르는 앱이에요. 주로 가게 카운터의 태블릿에 켜 둬요.",
          ["가게 앱은 켜 둔 채로 새 주문을 기다린다", "주문이 오면 바로 울려야 접수가 늦지 않는다", "가게가 때때로 새 주문을 직접 확인한다", "연결을 오래 붙잡아 두는 실시간 서버가 필요하다"],
        ),
        [N("rider")]: nodeText(
          "라이더가 배차를 받아 수락하고 픽업·배달 완료를 누르는 앱이에요. 배달 중에는 몇 초마다 현재 위치를 올려요.",
          ["라이더 앱이 휴대폰 GPS 위치를 서버에 올린다", "배차와 고객의 라이더 위치 보기에 실제 위치가 필요하다", "라이더가 '출발·도착' 같은 상태만 누른다", "배터리·데이터를 쓰고 개인 위치정보를 지켜야 한다"],
        ),
        [G("region")]: groupText(
          "배달앱 서버와 데이터를 두는 AWS 서울 리전(ap-northeast-2)이에요. 리전 안에는 서로 떨어진 데이터센터 묶음(AZ)이 여러 곳 있어요.",
          "세 앱의 요청이 ALB 로 들어오고, NAT 게이트웨이를 거쳐 PG사·푸시·지도 API 로 나가요.",
          ["고객·가게가 국내라 서울 리전에 둔다", "가까워 응답이 빠르고, 몇 초마다 오는 위치 요청에도 유리하다", "다른 나라 리전에 둔다", "서울 리전 전체가 멈추는 일까지는 대비하지 않는다"],
        ),
        [G("vpc")]: groupText(
          "배달앱만 쓰는 사설 네트워크(10.30.0.0/16)예요. 이 안을 공개·앱·데이터 서브넷으로 나눠 자원을 둬요.",
          "인터넷 게이트웨이를 통해 ALB 가 요청을 받고, 앱 서브넷의 바깥 요청은 NAT 로 나가요.",
          ["VPC 하나에 서브넷 세 층을 둔다", "층마다 경로와 보안 그룹을 다르게 줄 수 있다", "공개 서브넷 하나에 모두 둔다", "서브넷과 경로 표를 층·AZ 마다 관리해야 한다"],
        ),
        [G("pub")]: groupText(
          "인터넷 게이트웨이로 가는 경로가 있는 서브넷이에요. 인터넷과 직접 말해야 하는 ALB 와 NAT 게이트웨이만 둬요.",
          "세 앱의 443 이 ALB 로 들어오고 앱 서브넷으로 8080 이 나가요. 앱 서브넷의 바깥 요청은 NAT 를 거쳐 나가요.",
          ["서버는 공개 서브넷에 두지 않는다", "서버에 공인 IP 가 없어 인터넷에서 바로 닿지 않는다", "서버도 공개 서브넷에 두고 보안 그룹으로만 막는다", "서버가 밖으로 나가려면 NAT 게이트웨이를 거쳐야 한다"],
        ),
        [N("alb")]: nodeText(
          "세 앱의 요청을 받아 경로를 보고 맡은 서비스에 나눠 주는 L7 로드밸런서예요. HTTPS 를 풀고, 헬스 체크로 멈춘 서버를 대상에서 빼요.",
          ["입구 하나(ALB)에서 경로로 서비스를 나눈다", "앱은 주소 하나만 알면 되고, 서비스를 나눠도 앱을 고치지 않는다", "앱이나 서비스마다 로드밸런서와 주소를 따로 둔다", "경로 규칙이 늘어 규칙을 관리해야 한다"],
        ),
        [E("customer", "alb")]: edgeText(
          "고객 앱의 가게·메뉴 보기, 주문, 배달 상태 요청이 ALB 로 들어와요.",
          "HTTPS(TCP 443). 배달 추적 화면의 WebSocket 연결도 이 입구로 열어요.",
          "고객 요청을 한 입구로 받아 경로에 따라 서비스로 나눠요.",
          "ALB 보안 그룹: 인터넷 → 443 만 허용.",
        ),
        [E("store", "alb")]: edgeText(
          "가게 앱의 주문 접수·조리 완료 요청이 ALB 로 들어와요.",
          "HTTPS(TCP 443). 새 주문을 받는 WebSocket 연결도 이 입구로 열어요.",
          "가게 앱도 같은 입구와 같은 주문 서비스를 써요.",
          "ALB 보안 그룹: 인터넷 → 443 만 허용.",
        ),
        [E("rider", "alb")]: edgeText(
          "라이더 앱의 배차 수락·픽업·완료 요청과 위치 보고가 ALB 로 들어와요.",
          "HTTPS(TCP 443).",
          "라이더 요청도 같은 입구에서 경로로 나눠요.",
          "ALB 보안 그룹: 인터넷 → 443 만 허용.",
        ),
      },
    },

    // ── 2. 주문 API 두 대를 두 AZ 에 ────────────────────────────
    {
      id: "order-api",
      goal: "주문 API 두 대를 두 AZ 에",
      example: "주문 API 서버 두 대를 AZ 두 곳에 나눠 넣어 줘",
      keywords: [["주문 api", "주문 서버", "주문 서비스", "api 서버", "백엔드", "backend", "ec2", "auto scaling", "오토스케일링", "오토 스케일링", "asg", "앱 서버", "was"]],
      conflicts: countConflicts(
        "세 대도 틀린 구성은 아니지만, 이 가이드는 주문 API 를 두 대로 맞춰요. '주문 API 서버 두 대를 AZ 두 곳에'로 말해 주세요.",
        "한 대나 한 AZ 에만 두면 그 서버나 AZ 가 멈출 때 주문도 멈춰요. 이번에는 두 대를 두 AZ 에 나눠요.",
      ),
      commands: [
        assume("redundancy", "서버는 두 AZ 에 나눈 Auto Scaling, DB·캐시는 Multi-AZ"),
        group("app", "subnet_private", "앱 서브넷", "vpc"),
        group("order-asg", "redundancy_group", "주문 API Auto Scaling 그룹", "app"),
        node("order-1", "app_server", "주문 API #1", "order-asg", "Spring Boot 3.5", ec2("dlv-order-2a", "10.30.10.21", "2a")),
        node("order-2", "app_server", "주문 API #2", "order-asg", "Spring Boot 3.5", ec2("dlv-order-2c", "10.30.11.21", "2c")),
        edge("alb", "order-1", "request", "HTTP 8080"),
        edge("alb", "order-2", "request", "HTTP 8080"),
      ],
      say: "앱 서브넷에 주문 API 두 대를 AZ 2a·2c 에 하나씩 두고 Auto Scaling 그룹으로 묶었어요. 고객 주문, 가게 접수, 라이더 픽업·완료가 모두 여기서 주문 상태를 바꿔요.",
      notes: [
        { kind: "flow", text: "주문 상태(결제 완료→접수→조리 완료→픽업→배달 완료)는 주문 API 한 곳에서만 바꿔요. 그래야 세 앱이 같은 상태를 봐요." },
        { kind: "caution", text: "점심·저녁처럼 몰리는 시각은 매일 비슷해요. 서버가 뜨는 데 몇 분 걸리니 예약 조정으로 그 전에 대수를 미리 늘려 둬요." },
        { kind: "net", text: "앱 서브넷은 인터넷에서 먼저 들어올 수 없는 프라이빗 서브넷이에요. 요청은 ALB 를 거쳐서만 와요." },
      ],
      miss: "이번 단계는 주문 API 서버 두 대를 두 AZ 에 나눠 두는 거예요. '주문 API 서버 두 대를 AZ 두 곳에 나눠 넣어 줘'처럼 말해 보세요.",
      explains: {
        [G("app")]: groupText(
          "주문·알림·실시간·위치·배차 서버를 두는 프라이빗 서브넷이에요. 서버에 공인 IP 가 없어 인터넷에서 바로 닿지 않아요.",
          "ALB 에서 8080 이 들어오고, 데이터 서브넷으로 3306·6379 가, NAT 로 바깥 요청이 나가요.",
          ["서버는 프라이빗 서브넷에 둔다", "공격자가 서버에 바로 닿을 길을 없앤다", "공개 서브넷에 두고 보안 그룹으로 막는다", "밖으로 나갈 때 NAT 게이트웨이 요금이 든다"],
        ),
        [G("order-asg")]: groupText(
          "주문 API 서버를 최소 2대에서 최대 12대로 유지하는 묶음이에요. 두 AZ 에 고르게 두고, 몰리면 늘리고 멈춘 서버는 새로 띄워요.",
          "ALB 에서 8080 이 들어오고, RDS·메뉴 캐시와 NAT(PG사·지도 API)로 나가요. 주문 이벤트는 SNS 로 내요.",
          ["주문 API 는 두 AZ 에 걸친 Auto Scaling 그룹으로 둔다", "AZ 하나가 멈춰도 주문을 받고, 점심·저녁엔 대수를 늘린다", "EC2 두 대를 고정으로 둔다", "서버가 언제든 바뀌어도 되게 앱을 상태 없이 만들어야 한다"],
          ASG_DEF,
        ),
        [N("order-1")]: nodeText(
          "주문 받기·결제 승인·주문 상태 바꾸기를 처리하는 API 서버예요(AZ 2a). 고객·가게·라이더 세 앱의 주문 요청을 모두 받아요.",
          ["주문 상태를 바꾸는 일은 주문 API 한 곳에 모은다", "세 앱이 같은 규칙으로 상태를 바꿔 어긋나지 않는다", "가게용·라이더용 서버가 각자 상태를 바꾼다", "주문 API 가 멈추면 세 앱이 함께 멈춰 이중화가 꼭 필요하다"],
        ),
        [N("order-2")]: nodeText(
          "주문 API #1 과 같은 서버를 다른 AZ(2c)에 둔 짝이에요. ALB 가 두 대에 나눠 보내고, 2a 가 멈추면 이 서버가 받아요.",
          ["두 서버를 서로 다른 AZ 에 둔다", "AZ 하나의 전원·네트워크 장애를 함께 겪지 않는다", "같은 AZ 에 두 대를 둔다", "AZ 를 넘는 통신에 약간의 요금과 지연이 생긴다"],
        ),
        [E("alb", "order-1")]: edgeText(
          "ALB 가 /orders·/stores 경로 요청을 주문 API #1(2a)로 보내요.",
          "HTTP(TCP 8080). 암호는 ALB 에서 풀었어요.",
          "대상 그룹에 든 주문 API 들에 요청을 나눠요.",
          "주문 API 보안 그룹: ALB 보안 그룹 → 8080 만 허용.",
        ),
        [E("alb", "order-2")]: edgeText(
          "ALB 가 /orders·/stores 경로 요청을 주문 API #2(2c)로 보내요.",
          "HTTP(TCP 8080). 암호는 ALB 에서 풀었어요.",
          "두 AZ 의 서버에 나눠 보내 한쪽에 몰리지 않게 해요.",
          "주문 API 보안 그룹: ALB 보안 그룹 → 8080 만 허용.",
        ),
      },
    },

    // ── 3. 주문·가게 DB(RDS Multi-AZ) ─────────────────────────
    {
      id: "rds",
      goal: "주문·가게 DB(RDS Multi-AZ)",
      example: "주문·가게 DB 는 RDS Multi-AZ 로 넣어 줘",
      keywords: [["rds", "db", "디비", "데이터베이스", "database", "mysql", "aurora", "오로라"]],
      commands: [
        group("data", "subnet_private", "데이터 서브넷", "vpc"),
        node("rds", "db_rdb", "RDS MySQL", "data", "주문·가게·메뉴 · Multi-AZ", {
          ...managed("yes"), sw: "Amazon RDS", version: "MySQL 8.4", replication: "동기 복제(다른 AZ 대기 인스턴스)",
        }),
        edge("order-1", "rds", "request", "MySQL 3306"),
        edge("order-2", "rds", "request", "MySQL 3306"),
      ],
      say: "데이터 서브넷에 RDS MySQL 을 Multi-AZ 로 넣었어요. 주문·가게·메뉴·회원 원본이 여기 있어요. 주 DB 가 멈추면 AWS 가 다른 AZ 의 대기 DB 로 넘기고 접속 주소는 그대로예요.",
      notes: [
        { kind: "net", text: "데이터 서브넷에는 밖으로 나가는 경로를 두지 않았어요(격리 서브넷). DB 는 VPC 안의 서버하고만 말해요." },
        { kind: "flow", text: "엔드포인트(DNS 이름)가 대기 DB 를 가리키도록 바뀌어요. 넘어가는 1~2분 동안 쓰기가 실패할 수 있어 앱이 다시 시도해요." },
        { kind: "caution", text: "라이더 위치처럼 몇 초마다 바뀌는 값은 이 DB 에 쓰지 않아요. 원본으로 남길 주문·결제·가게 정보만 둬요." },
      ],
      miss: "이번 단계는 주문·가게 DB 예요. '주문·가게 DB 는 RDS Multi-AZ 로 넣어 줘'처럼 말해 보세요.",
      explains: {
        [G("data")]: groupText(
          "RDS·ElastiCache 를 두는 서브넷이에요. 경로 표에 NAT·인터넷 게이트웨이가 없어 VPC 밖으로 나가는 길이 아예 없어요.",
          "앱 서브넷의 서버에서 3306(RDS)·6379(ElastiCache)만 들어와요. 밖으로 나가는 통신은 없어요.",
          ["DB·캐시는 밖으로 나갈 길이 없는 서브넷에 둔다", "DB 가 털려도 데이터를 밖으로 바로 내보낼 길이 없다", "앱 서브넷에 함께 둔다", "서브넷과 경로 표가 하나 더 는다"],
        ),
        [N("rds")]: nodeText(
          "주문·가게·메뉴·회원 원본을 저장하는 관리형 MySQL 이에요. AWS 가 백업·패치·장애 조치를 맡고, 우리는 엔드포인트 주소로 접속만 해요.",
          ["DB 는 RDS Multi-AZ 로 둔다", "다른 AZ 의 대기 DB 와 자동 장애 조치를 AWS 가 맡는다", "EC2 두 대에 MySQL 을 직접 설치해 복제한다", "대기 DB 몫의 요금이 더 들고, DB 서버 OS 에는 들어갈 수 없다"],
        ),
        [E("order-1", "rds")]: edgeText(
          "주문 API #1 이 주문을 저장하고 주문 상태를 바꿔요.",
          "MySQL(TCP 3306). RDS 엔드포인트(DNS 이름)로 접속해요.",
          "주문의 원본은 RDS 에만 있어요.",
          "RDS 보안 그룹: 주문 API 보안 그룹 → 3306 만 허용.",
        ),
        [E("order-2", "rds")]: edgeText(
          "주문 API #2 가 주문을 저장하고 주문 상태를 바꿔요.",
          "MySQL(TCP 3306). 같은 엔드포인트로 접속해요.",
          "두 AZ 의 서버가 같은 DB 를 봐야 어느 서버로 가도 같은 주문이 보여요.",
          "RDS 보안 그룹: 주문 API 보안 그룹 → 3306 만 허용.",
        ),
      },
    },

    // ── 4. 메뉴·가게 캐시(ElastiCache) ─────────────────────────
    {
      id: "menu-cache",
      goal: "메뉴·가게 캐시(ElastiCache)",
      example: "메뉴·가게 정보 캐시로 ElastiCache 를 넣어 줘",
      keywords: [
        ["elasticache", "엘라스티캐시", "캐시", "cache", "redis", "레디스"],
        // "위치 캐시에 두는"(위치 단계)은 받지 않게, 캐시 낱말만으로는 둘째 묶음을 채우지 않는다.
        ["메뉴", "가게", "elasticache", "엘라스티캐시", "redis", "레디스", "캐시를", "캐시로", "캐시 넣", "캐시 추가", "캐시 붙", "캐시 둬", "캐시 두"],
      ],
      commands: [
        node("menu-cache", "cache", "메뉴 캐시", "data", "ElastiCache · 메뉴·가게 정보", redis()),
        edge("order-1", "menu-cache", "request", "Redis 6379"),
        edge("order-2", "menu-cache", "request", "Redis 6379"),
      ],
      say: "데이터 서브넷에 메뉴 캐시(ElastiCache Redis)를 넣었어요. 점심·저녁에 수많은 고객이 같은 가게 목록과 메뉴를 열어도, 메모리에서 바로 돌려줘 RDS 까지 가지 않아요.",
      notes: [
        { kind: "flow", text: "주문 API 는 먼저 캐시에서 찾고, 없을 때만 RDS 에서 읽어 캐시에 채워요(Cache-aside)." },
        { kind: "caution", text: "품절·영업 종료는 바로 보여야 해요. 가게가 바꾸면 그 가게의 캐시를 지워, 없는 메뉴가 주문되지 않게 해요." },
        { kind: "net", text: "주 노드와 복제본이 다른 AZ 에 있어요. 주 노드가 멈추면 AWS 가 복제본을 주 노드로 올리고 접속 주소는 그대로예요." },
      ],
      miss: "이번 단계는 메뉴·가게 정보 캐시예요. '메뉴·가게 정보 캐시로 ElastiCache 를 넣어 줘'처럼 말해 보세요.",
      explains: {
        [N("menu-cache")]: nodeText(
          "가게 목록·메뉴·영업 상태처럼 많이 읽고 가끔 바뀌는 정보를 메모리에 두는 관리형 Redis 예요. 주 노드와 다른 AZ 의 복제본으로 이중화해요.",
          ["자주 읽는 메뉴·가게 정보는 캐시에 둔다", "몰리는 시간에 같은 조회가 RDS 에 쌓이지 않는다", "RDS 읽기 전용 복제본을 늘려 조회를 나눈다", "캐시 요금이 들고, 바뀐 정보를 캐시에서 지워 줘야 한다"],
        ),
        [E("order-1", "menu-cache")]: edgeText(
          "주문 API #1 이 가게 목록과 메뉴를 캐시에서 먼저 찾아요.",
          "Redis 프로토콜(TCP 6379). 기본(primary) 엔드포인트로 접속해요.",
          "RDS 보다 훨씬 빨라 몰리는 조회를 여기서 받아요.",
          "메뉴 캐시 보안 그룹: 주문 API 보안 그룹 → 6379 만 허용.",
        ),
        [E("order-2", "menu-cache")]: edgeText(
          "주문 API #2 가 가게 목록과 메뉴를 캐시에서 먼저 찾아요.",
          "Redis 프로토콜(TCP 6379). 같은 엔드포인트로 접속해요.",
          "두 서버가 같은 캐시를 봐야 어느 서버로 가도 같은 메뉴가 보여요.",
          "메뉴 캐시 보안 그룹: 주문 API 보안 그룹 → 6379 만 허용.",
        ),
      },
    },

    // ── 5. NAT 와 PG 결제 연동 ─────────────────────────────────
    {
      id: "pg",
      goal: "NAT 와 PG 결제 연동",
      example: "NAT 를 거쳐 PG사 결제를 연동해 줘",
      keywords: [["pg", "결제", "payment", "페이먼트", "카드", "nat"]],
      commands: [
        group("ext", "external_service", "외부 서비스"),
        node("nat", "nat", "NAT 게이트웨이", "pub", "AZ 마다 1개", managed()),
        node("pg", "external_pg", "PG사", "ext", "결제 승인", { integration: "REST API(HTTPS), 결제창 연동" }),
        edge("customer", "pg", "request", "결제창 HTTPS"),
        edge("order-1", "nat", "request", "HTTPS 443"),
        edge("order-2", "nat", "request", "HTTPS 443"),
        edge("nat", "pg", "request", "HTTPS 443"),
      ],
      say: "PG사 결제를 붙였어요. 카드 정보는 고객이 앱에 뜬 PG사 결제창에 직접 넣고, 승인은 주문 API 가 요청해요. 프라이빗 서브넷의 서버는 공인 IP 가 없어 NAT 게이트웨이를 거쳐 PG사로 나가요.",
      notes: [
        { kind: "link", text: "승인 요청은 주문 API → NAT 게이트웨이 → 인터넷 게이트웨이 → PG사로 나가요. 주문 API 보안 그룹의 나가는 규칙에 443 을 열어요." },
        { kind: "caution", text: "PG사가 출구 IP 등록을 요구하면 NAT 게이트웨이의 탄력적 IP 를 알려 줘요. AZ 마다 NAT 를 두면 그 IP 를 모두 알려요." },
        { kind: "flow", text: "승인이 끝나야 주문이 '결제 완료'가 되고 가게에 알릴 수 있어요. 가게가 거절하면 같은 길로 PG사에 결제 취소를 요청해요." },
      ],
      miss: "이번 단계는 PG사 결제 연동이에요. 'NAT 를 거쳐 PG사 결제를 연동해 줘'처럼 말해 보세요.",
      explains: {
        [G("ext")]: groupText(
          "우리가 운영하지 않는 바깥 회사의 서비스를 모아 둔 영역이에요. 결제 PG사가 있고, 뒤에서 푸시 알림과 지도 서비스가 더해져요.",
          "고객 앱이 결제창으로 직접 오고, 서버의 요청은 NAT 게이트웨이를 거쳐 들어와요.",
          ["결제·푸시·지도는 외부 서비스에 맡긴다", "직접 만들기 어려운 기능을 계약·연동만으로 붙인다", "비슷한 기능을 직접 만든다", "외부 장애·요금·호출 한도에 영향을 받는다"],
        ),
        [N("nat")]: nodeText(
          "프라이빗 서브넷 서버가 인터넷에 나갈 때 출발 주소를 자기 공인 IP(탄력적 IP)로 바꿔 내보내요. 밖에서 먼저 거는 연결은 받지 않아요. 실제로는 AZ 마다 하나씩 둬요.",
          ["서버는 NAT 게이트웨이로만 밖에 나간다", "서버에 공인 IP 를 주지 않고도 PG사·푸시·지도를 부를 수 있다", "서버를 공개 서브넷에 두고 공인 IP 를 준다", "목적지를 거르지 않아 필요하면 Network Firewall 을 더하고, 요금이 든다"],
        ),
        [N("pg")]: nodeText(
          "고객의 카드 결제를 받아 카드사 승인을 대신 처리하는 결제대행사예요. 배달앱은 카드 번호를 받지 않고, 결제창 인증 결과로 승인만 요청해요.",
          ["결제창 방식으로 카드 정보를 PG사가 직접 받는다", "배달앱 서버에 카드 정보가 지나가지 않아 보안 부담이 준다", "앱 화면에서 카드 정보를 받아 넘긴다", "결제 화면 흐름을 PG사 방식에 맞춰야 한다"],
        ),
        [E("customer", "pg")]: edgeText(
          "고객이 앱에 뜬 PG사 결제창에서 카드 정보를 넣고 인증해요.",
          "HTTPS(TCP 443). 앱 안의 결제 화면이 PG사 주소로 바로 접속해요.",
          "카드 정보가 배달앱 서버를 거치지 않게 하기 위해서예요.",
          "고객과 PG사 사이라 배달앱의 보안 그룹을 지나지 않아요.",
        ),
        [E("order-1", "nat")]: edgeText(
          "주문 API #1 이 PG사 승인·지도 API 요청을 NAT 게이트웨이로 보내요.",
          "HTTPS(TCP 443). 앱 서브넷 경로 표의 기본 경로(0.0.0.0/0)가 NAT 를 가리켜요.",
          "공인 IP 가 없는 서버가 인터넷에 나가는 길이에요.",
          "주문 API 보안 그룹: 나가는 443 허용.",
        ),
        [E("order-2", "nat")]: edgeText(
          "주문 API #2 가 PG사 승인·지도 API 요청을 NAT 게이트웨이로 보내요.",
          "HTTPS(TCP 443). 실제로는 같은 AZ(2c)의 NAT 를 쓰게 경로 표를 나눠요.",
          "AZ 하나가 멈춰도 다른 AZ 의 서버가 밖으로 나갈 수 있게 해요.",
          "주문 API 보안 그룹: 나가는 443 허용.",
        ),
        [E("nat", "pg")]: edgeText(
          "승인 요청이 인터넷을 지나 PG사에 닿고, 승인 결과가 돌아와요.",
          "HTTPS(TCP 443) REST API. 출발 주소는 NAT 의 탄력적 IP 예요.",
          "카드 승인은 PG사만 할 수 있어 배달앱이 직접 요청해야 해요.",
          "NAT 게이트웨이에는 보안 그룹이 없어요. PG사가 우리 탄력적 IP 를 허용 목록에 넣기도 해요.",
        ),
      },
    },

    // ── 6. 주문 이벤트와 알림 큐(SNS·SQS) ─────────────────────
    {
      id: "events",
      goal: "주문 이벤트와 알림 큐(SNS·SQS)",
      example: "주문 상태가 바뀌면 SNS·SQS 로 알림 워커에 넘겨 줘",
      keywords: [["sns", "sqs", "큐", "queue", "대기열", "이벤트", "event", "토픽", "topic", "알림 워커를", "알림 워커 넣", "알림 워커 두", "알림 워커 추가"]],
      commands: [
        node("sns", "queue", "주문 이벤트", "region", "Amazon SNS · 표준 주제", { ...managed(), sw: "Amazon SNS", version: NO_VERSION }),
        node("notify-q", "queue", "알림 큐", "region", "Amazon SQS · 표준 대기열", { ...managed(), sw: "Amazon SQS", version: NO_VERSION }),
        group("notify-asg", "redundancy_group", "알림 워커 Auto Scaling 그룹", "app"),
        node("notify-1", "app_server", "알림 워커 #1", "notify-asg", "Spring Boot 3.5", ec2("dlv-notify-2a", "10.30.10.31", "2a")),
        node("notify-2", "app_server", "알림 워커 #2", "notify-asg", "Spring Boot 3.5", ec2("dlv-notify-2c", "10.30.11.31", "2c")),
        edge("order-1", "sns", "async", "SNS HTTPS"),
        edge("order-2", "sns", "async", "SNS HTTPS"),
        edge("sns", "notify-q", "async", "SNS 구독"),
        edge("notify-q", "notify-1", "async", "SQS HTTPS"),
        edge("notify-q", "notify-2", "async", "SQS HTTPS"),
        edge("notify-1", "rds", "request", "MySQL 3306"),
        edge("notify-2", "rds", "request", "MySQL 3306"),
      ],
      say: "주문 상태가 바뀌면 주문 API 가 SNS 주제에 '상태 바뀜' 이벤트를 한 번 내고, 알림 큐(SQS)가 받아 둬요. 알림 워커 두 대가 꺼내 누구에게 알릴지 정해요. 주문 API 는 알림이 끝나길 기다리지 않아요.",
      notes: [
        { kind: "flow", text: "SNS 는 한 이벤트를 구독한 큐마다 한 부씩 넣어 줘요. 뒤에서 배차 큐를 붙여도 주문 API 는 고치지 않아요." },
        { kind: "caution", text: "DB 저장과 이벤트 내기는 한 번에 묶이지 않아요. 저장한 뒤 이벤트를 못 냈을 때 다시 내는 장치(아웃박스 표 등)를 둬요." },
        { kind: "caution", text: "표준 큐는 같은 이벤트를 두 번 주거나 순서를 바꿀 수 있어요. 워커는 DB 의 지금 상태를 보고 이미 보낸 알림·지난 상태는 건너뛰어요." },
      ],
      miss: "이번 단계는 주문 상태가 바뀔 때 알림 쪽으로 넘기는 길이에요. 'SNS·SQS 로 알림 워커에 넘겨 줘'처럼 말해 보세요.",
      explains: {
        [N("sns")]: nodeText(
          "주문 상태가 바뀔 때마다 주문 API 가 이벤트를 한 번 내는 SNS 주제예요. 구독한 큐마다 한 부씩 넣어 주고, AWS 가 여러 AZ 에 나눠 운영해요.",
          ["상태 바뀜은 SNS 주제 하나로 낸다", "알림·배차처럼 받을 곳이 늘어도 주문 API 는 한 번만 낸다", "주문 API 가 알림 큐·배차 큐에 각각 넣는다", "메시지 순서를 보장하지 않아 받는 쪽이 지금 상태를 확인해야 한다"],
          { term: "Amazon SNS", definition: "Amazon SNS(Simple Notification Service)는 한 번 발행한 메시지를 구독한 여러 대상(SQS 큐·HTTP 등)에 나눠 보내는 AWS 의 관리형 발행/구독 서비스입니다." },
        ),
        [N("notify-q")]: nodeText(
          "주문 이벤트를 받아 두었다가 알림 워커가 꺼내 가게 하는 관리형 대기열이에요. 워커가 잠깐 멈추거나 몰려도 이벤트가 사라지지 않아요.",
          ["SNS 와 워커 사이에 SQS 큐를 둔다", "워커가 멈추거나 느려도 이벤트가 큐에 남아 기다린다", "SNS 가 워커의 HTTP 주소로 바로 보낸다", "큐가 하나 늘고, 쌓인 메시지 수를 지켜봐야 한다"],
        ),
        [G("notify-asg")]: groupText(
          "알림 큐에서 이벤트를 꺼내 푸시와 가게 알림을 보내는 서버 묶음이에요. 두 AZ 에 한 대씩 두고, 쌓인 메시지 수에 따라 늘리거나 줄여요.",
          "알림 큐에서 이벤트를 받아 오고(HTTPS), RDS 를 읽고, NAT(FCM·APNs)와 실시간 Redis 로 보내요.",
          ["알림 워커는 주문 API 와 다른 Auto Scaling 그룹으로 둔다", "알림이 몰려도 주문 받기에 영향을 주지 않는다", "주문 API 서버가 알림까지 보낸다", "서버 묶음과 배포 대상이 하나 더 는다"],
          ASG_DEF,
        ),
        [N("notify-1")]: nodeText(
          "알림 큐에서 이벤트를 꺼내, 상태에 맞춰 고객·가게·라이더 중 누구에게 무엇을 알릴지 정하고 보내요(AZ 2a). 보낸 뒤에 메시지를 지워요.",
          ["처리가 끝난 뒤에 메시지를 지운다", "보내다 멈추면 메시지가 다시 보여 다른 워커가 이어 한다", "받자마자 메시지를 지운다", "같은 이벤트가 두 번 올 수 있어 중복을 걸러야 한다"],
        ),
        [N("notify-2")]: nodeText(
          "알림 워커 #1 과 같은 일을 다른 AZ(2c)에서 하는 짝이에요. 두 대가 알림 큐를 함께 비워 몰릴 때도 알림이 늦지 않게 해요.",
          ["쌓인 메시지 수로 워커 대수를 조절한다", "몰릴 때만 늘려 비용을 아낀다", "워커 수를 고정한다", "워커가 늘수록 RDS 읽기도 늘어 RDS 가 견디는지 봐야 한다"],
        ),
        [E("order-1", "sns")]: edgeText(
          "주문 API #1 이 주문 상태가 바뀔 때마다 '상태 바뀜' 이벤트를 SNS 주제에 내요.",
          "SNS API(HTTPS 443). NAT 나 VPC 엔드포인트를 거쳐 SNS 에 닿아요.",
          "알림·배차 같은 뒤쪽 일을 기다리지 않고 앱에 바로 답하려고요.",
          "주문 API 보안 그룹: 나가는 443 허용. IAM 역할에 이 주제 발행만 허용해요.",
        ),
        [E("order-2", "sns")]: edgeText(
          "주문 API #2 가 받은 주문의 상태 바뀜 이벤트를 SNS 주제에 내요.",
          "SNS API(HTTPS 443).",
          "어느 서버가 상태를 바꾸든 같은 주제로 모아요.",
          "주문 API 보안 그룹: 나가는 443 허용. IAM 역할에 이 주제 발행만 허용해요.",
        ),
        [E("sns", "notify-q")]: edgeText(
          "SNS 가 받은 이벤트를 구독한 알림 큐에 넣어요.",
          "SNS → SQS 구독. AWS 안에서 전달돼요.",
          "워커가 잠깐 멈춰도 이벤트가 큐에 남아 있게 해요.",
          "알림 큐의 접근 정책에 이 SNS 주제가 넣는 것만 허용해요.",
        ),
        [E("notify-q", "notify-1")]: edgeText(
          "알림 워커 #1 이 알림 큐에서 이벤트를 받아 와요.",
          "SQS API(HTTPS 443). 워커가 롱 폴링으로 메시지를 가져가요.",
          "워커가 감당할 만큼씩 꺼내 처리하게 해요.",
          "워커 보안 그룹: 나가는 443 허용.",
        ),
        [E("notify-q", "notify-2")]: edgeText(
          "알림 워커 #2 가 알림 큐에서 이벤트를 받아 와요.",
          "SQS API(HTTPS 443). 두 워커가 메시지를 나눠 받아요.",
          "두 대가 함께 비워 몰린 알림을 빨리 보내요.",
          "워커 보안 그룹: 나가는 443 허용.",
        ),
        [E("notify-1", "rds")]: edgeText(
          "알림 워커 #1 이 주문의 지금 상태와 받을 사람의 기기 토큰을 읽어요.",
          "MySQL(TCP 3306). RDS 엔드포인트로 접속해요.",
          "이벤트가 늦거나 겹쳐도 DB 의 지금 상태로 알려요.",
          "RDS 보안 그룹: 워커 보안 그룹 → 3306 허용.",
        ),
        [E("notify-2", "rds")]: edgeText(
          "알림 워커 #2 가 주문의 지금 상태와 받을 사람의 기기 토큰을 읽어요.",
          "MySQL(TCP 3306). RDS 엔드포인트로 접속해요.",
          "어느 워커가 받아도 같은 기준으로 알려요.",
          "RDS 보안 그룹: 워커 보안 그룹 → 3306 허용.",
        ),
      },
    },

    // ── 7. 푸시 알림(FCM·APNs) ─────────────────────────────────
    {
      id: "push",
      goal: "푸시 알림(FCM·APNs) 연동",
      example: "알림 워커가 FCM·APNs 로 푸시를 보내게 해 줘",
      keywords: [["fcm", "apns", "푸시", "push", "firebase", "파이어베이스"]],
      commands: [
        node("fcm", "external_api", "FCM", "ext", "안드로이드 푸시", { integration: "HTTP v1 API(HTTPS, OAuth 2.0 토큰)" }),
        node("apns", "external_api", "APNs", "ext", "iOS 푸시", { integration: "HTTP/2 API(HTTPS, 인증 토큰)" }),
        edge("notify-1", "nat", "request", "HTTPS 443"),
        edge("notify-2", "nat", "request", "HTTPS 443"),
        edge("nat", "fcm", "request", "HTTPS 443"),
        edge("nat", "apns", "request", "HTTPS 443"),
        edge("fcm", "customer", "async", "푸시"),
        edge("fcm", "rider", "async", "푸시"),
        edge("apns", "customer", "async", "푸시"),
        edge("apns", "rider", "async", "푸시"),
      ],
      say: "알림 워커가 NAT 를 거쳐 안드로이드는 FCM, iPhone 은 APNs 에 푸시를 맡기게 했어요. 앱이 꺼져 있어도 '가게가 접수했어요', '새 배차가 있어요' 같은 알림이 고객·라이더 휴대폰에 떠요.",
      notes: [
        { kind: "link", text: "워커 → NAT → FCM·APNs 로 나가요. FCM 은 서비스 계정으로 받은 OAuth 토큰, APNs 는 Apple 이 준 키로 만든 토큰으로 인증해요." },
        { kind: "net", text: "휴대폰은 FCM·APNs 와 연결을 늘 열어 두고 알림을 받아요. 그래서 우리 서버가 휴대폰에 직접 연결하지 않아도 돼요." },
        { kind: "caution", text: "푸시는 늦거나 빠질 수 있어요. 앱을 열면 서버에서 주문 상태를 다시 받고, 바로 봐야 하는 가게 주문은 다음 단계의 실시간 연결로 보내요." },
      ],
      miss: "이번 단계는 고객·라이더 휴대폰에 푸시 알림을 보내는 길이에요. 'FCM·APNs 로 푸시를 보내게 해 줘'처럼 말해 보세요.",
      explains: {
        [N("fcm")]: nodeText(
          "Google 이 운영하는 푸시 서비스예요. 알림 워커가 보낸 알림을 안드로이드 고객·라이더 휴대폰에 전달해요.",
          ["안드로이드 푸시는 FCM 에 맡긴다", "꺼진 앱에도 알림을 띄우는 길은 운영체제의 푸시 서비스뿐이다", "앱이 켜져 있을 때만 서버와 연결해 알린다", "전달을 보장하지 않고, 기기 토큰을 관리해야 한다"],
          { term: "FCM", definition: "FCM(Firebase Cloud Messaging)은 Google 이 제공하는 푸시 알림 서비스로, 서버가 보낸 메시지를 안드로이드·iOS·웹 앱이 깔린 기기에 전달합니다." },
        ),
        [N("apns")]: nodeText(
          "Apple 이 운영하는 푸시 서비스예요. 알림 워커가 보낸 알림을 iPhone 고객·라이더에게 전달해요.",
          ["iOS 푸시는 APNs 에 바로 보낸다", "iPhone 에 알림을 띄우는 길은 결국 APNs 를 지난다", "FCM 에 맡겨 FCM 이 APNs 로 넘기게 한다", "안드로이드와 다른 인증·형식을 따로 다뤄야 한다"],
          { term: "APNs", definition: "APNs(Apple Push Notification service)는 Apple 이 운영하는 푸시 알림 서비스로, 서버가 보낸 알림을 iPhone 같은 Apple 기기의 앱에 전달합니다." },
        ),
        [E("notify-1", "nat")]: edgeText(
          "알림 워커 #1 이 푸시 요청을 NAT 게이트웨이로 보내요.",
          "HTTPS(TCP 443). 앱 서브넷의 기본 경로가 NAT 를 가리켜요.",
          "공인 IP 가 없는 워커가 FCM·APNs 에 닿는 길이에요.",
          "워커 보안 그룹: 나가는 443 허용.",
        ),
        [E("notify-2", "nat")]: edgeText(
          "알림 워커 #2 가 푸시 요청을 NAT 게이트웨이로 보내요.",
          "HTTPS(TCP 443). 실제로는 같은 AZ(2c)의 NAT 를 써요.",
          "AZ 하나가 멈춰도 다른 AZ 의 워커가 푸시를 보낼 수 있어요.",
          "워커 보안 그룹: 나가는 443 허용.",
        ),
        [E("nat", "fcm")]: edgeText(
          "푸시 요청이 인터넷을 지나 FCM 에 닿아요.",
          "HTTPS(TCP 443). FCM HTTP v1 API 를 OAuth 2.0 토큰으로 불러요.",
          "안드로이드 기기에 알림을 보내는 길이 FCM 이에요.",
          "NAT 에는 보안 그룹이 없어요. 워커 보안 그룹의 나가는 443 으로 다스려요.",
        ),
        [E("nat", "apns")]: edgeText(
          "푸시 요청이 인터넷을 지나 APNs 에 닿아요.",
          "HTTPS(TCP 443) HTTP/2. Apple 이 준 키로 만든 인증 토큰을 붙여요.",
          "iPhone 에 알림을 보내는 길이 APNs 예요.",
          "NAT 에는 보안 그룹이 없어요. 워커 보안 그룹의 나가는 443 으로 다스려요.",
        ),
        [E("fcm", "customer")]: edgeText(
          "FCM 이 안드로이드 고객 휴대폰에 '접수됐어요·배달 출발' 같은 알림을 띄워요.",
          "휴대폰이 늘 열어 둔 FCM 연결로 내려가요.",
          "앱이 꺼져 있어도 고객이 주문 상태를 알게 해요.",
          "우리 망 밖 구간이에요. 우리 프로젝트 인증과 기기 토큰이 있어야 보낼 수 있어요.",
        ),
        [E("fcm", "rider")]: edgeText(
          "FCM 이 안드로이드 라이더 휴대폰에 '새 배차가 있어요' 알림을 띄워요.",
          "휴대폰이 늘 열어 둔 FCM 연결로 내려가요.",
          "라이더가 앱을 보고 있지 않아도 배차 제안을 알게 해요.",
          "우리 망 밖 구간이에요. 우리 프로젝트 인증과 기기 토큰이 있어야 보낼 수 있어요.",
        ),
        [E("apns", "customer")]: edgeText(
          "APNs 가 iPhone 고객에게 주문 상태 알림을 띄워요.",
          "iPhone 이 늘 열어 둔 APNs 연결로 내려가요.",
          "앱이 꺼져 있어도 고객이 주문 상태를 알게 해요.",
          "우리 망 밖 구간이에요. 우리 앱의 인증 키와 기기 토큰이 있어야 보낼 수 있어요.",
        ),
        [E("apns", "rider")]: edgeText(
          "APNs 가 iPhone 라이더에게 배차 제안 알림을 띄워요.",
          "iPhone 이 늘 열어 둔 APNs 연결로 내려가요.",
          "라이더가 앱을 보고 있지 않아도 배차 제안을 알게 해요.",
          "우리 망 밖 구간이에요. 우리 앱의 인증 키와 기기 토큰이 있어야 보낼 수 있어요.",
        ),
      },
    },

    // ── 8. 가게 앱 실시간 주문 접수(WebSocket) ──────────────────
    {
      id: "realtime",
      goal: "가게 앱 실시간 주문 접수(WebSocket)",
      example: "가게 앱이 WebSocket 으로 새 주문을 바로 받게 해 줘",
      keywords: [["websocket", "웹소켓", "웹 소켓", "실시간", "소켓", "socket", "pub/sub", "펍섭"]],
      commands: [
        update("alb", { rules: ALB_RULES.ws }),
        group("rt-asg", "redundancy_group", "실시간 서버 Auto Scaling 그룹", "app"),
        node("rt-1", "app_server", "실시간 서버 #1", "rt-asg", "WebSocket", ec2("dlv-rt-2a", "10.30.10.41", "2a")),
        node("rt-2", "app_server", "실시간 서버 #2", "rt-asg", "WebSocket", ec2("dlv-rt-2c", "10.30.11.41", "2c")),
        node("rt-redis", "cache", "실시간 Redis", "data", "ElastiCache · Pub/Sub", redis()),
        edge("alb", "rt-1", "request", "WebSocket 8080"),
        edge("alb", "rt-2", "request", "WebSocket 8080"),
        edge("notify-1", "rt-redis", "async", "Redis 6379"),
        edge("notify-2", "rt-redis", "async", "Redis 6379"),
        edge("rt-redis", "rt-1", "async", "Redis 구독 6379"),
        edge("rt-redis", "rt-2", "async", "Redis 구독 6379"),
      ],
      say: "가게 앱이 실시간 서버와 WebSocket 연결을 열어 두게 했어요. 새 주문 이벤트가 오면 알림 워커가 실시간 Redis 의 그 가게 채널에 내고, 그 가게와 연결된 서버가 바로 태블릿에 내려보내 울려요.",
      notes: [
        { kind: "flow", text: "가게가 새로 고침하지 않아도 주문이 바로 떠요. 실시간 서버는 자기에게 연결된 가게의 채널만 구독해, 맡은 서버가 받아 보내요." },
        { kind: "net", text: "ALB 는 WebSocket 을 그대로 넘겨요. 오가는 게 없으면 유휴 시간 제한(기본 60초)에 끊기므로 앱과 서버가 주기적으로 핑을 주고받아요." },
        { kind: "caution", text: "Pub/Sub 은 메시지를 저장하지 않아 그 순간 연결이 없으면 놓쳐요. 다시 연결하면 앱이 주문 API 에서 접수 안 한 주문을 다시 받아 와요." },
      ],
      miss: "이번 단계는 가게 앱이 새 주문을 바로 받는 실시간 연결이에요. '가게 앱이 WebSocket 으로 새 주문을 받게 해 줘'처럼 말해 보세요.",
      explains: {
        [G("rt-asg")]: groupText(
          "가게 앱·고객 추적 화면과 WebSocket 연결을 붙잡고 있는 서버 묶음이에요. 두 AZ 에 한 대씩 두고, 연결 수가 늘면 대수를 늘려요.",
          "ALB 에서 WebSocket(8080)이 들어오고, 실시간 Redis(6379)의 채널을 구독해요.",
          ["연결을 붙잡는 실시간 서버를 주문 API 와 나눈다", "연결이 많아도 주문 처리 서버의 자원을 쓰지 않는다", "주문 API 서버가 WebSocket 까지 받는다", "서버를 줄이거나 바꿀 때 연결이 끊겨 앱이 다시 붙어야 한다"],
          ASG_DEF,
        ),
        [N("rt-1")]: nodeText(
          "가게 태블릿과 WebSocket 연결을 열어 두고, 자기에게 붙은 가게의 채널로 온 새 주문을 바로 내려보내는 서버예요(AZ 2a).",
          ["가게 앱과는 WebSocket 연결을 유지한다", "서버가 먼저 보낼 수 있어 새 주문이 바로 울린다", "가게 앱이 몇 초마다 새 주문을 묻는다(폴링)", "연결마다 서버 자원을 써서 연결 수에 맞춰 늘려야 한다"],
        ),
        [N("rt-2")]: nodeText(
          "실시간 서버 #1 과 같은 일을 다른 AZ(2c)에서 하는 짝이에요. 한쪽이 멈추면 끊긴 가게 앱이 다시 붙을 때 이 서버로 와요.",
          ["두 서버를 다른 AZ 에 둔다", "AZ 하나가 멈춰도 가게가 다시 연결해 주문을 받는다", "한 AZ 에 두 대를 둔다", "끊긴 순간의 알림은 앱이 다시 받아 와야 한다"],
        ),
        [N("rt-redis")]: nodeText(
          "실시간 서버들에 메시지를 건네는 관리형 Redis 예요. 워커가 가게·주문 채널에 내면, 그 채널을 구독한 실시간 서버가 받아요.",
          ["서버 사이 실시간 전달은 Redis Pub/Sub 으로 한다", "워커는 가게가 어느 서버에 붙었는지 몰라도 된다", "가게마다 붙은 서버를 표에 적고 그 서버를 바로 부른다", "메시지를 저장하지 않아 놓친 주문은 다시 받아 와야 한다"],
        ),
        [E("alb", "rt-1")]: edgeText(
          "ALB 가 /ws 경로의 WebSocket 연결을 실시간 서버 #1(2a)로 넘겨요.",
          "WebSocket(TCP 8080). 암호는 ALB 에서 풀고, HTTP 요청으로 시작해 WebSocket 으로 바꾼 뒤 오래 열어 둬요.",
          "한 번 붙은 연결은 끝날 때까지 이 서버와 이어져요.",
          "실시간 서버 보안 그룹: ALB 보안 그룹 → 8080 만 허용.",
        ),
        [E("alb", "rt-2")]: edgeText(
          "ALB 가 /ws 경로의 WebSocket 연결을 실시간 서버 #2(2c)로 넘겨요.",
          "WebSocket(TCP 8080).",
          "새 연결을 두 서버에 나눠 한쪽에 몰리지 않게 해요.",
          "실시간 서버 보안 그룹: ALB 보안 그룹 → 8080 만 허용.",
        ),
        [E("notify-1", "rt-redis")]: edgeText(
          "알림 워커 #1 이 새 주문·상태 알림을 그 가게의 채널에 내요.",
          "Redis 프로토콜(TCP 6379). PUBLISH 명령을 써요.",
          "어느 실시간 서버에 붙은 가게든 한 번 내면 닿아요.",
          "실시간 Redis 보안 그룹: 워커 보안 그룹 → 6379 허용.",
        ),
        [E("notify-2", "rt-redis")]: edgeText(
          "알림 워커 #2 가 새 주문·상태 알림을 그 가게의 채널에 내요.",
          "Redis 프로토콜(TCP 6379). PUBLISH 명령을 써요.",
          "어느 워커가 이벤트를 받아도 같은 채널로 내요.",
          "실시간 Redis 보안 그룹: 워커 보안 그룹 → 6379 허용.",
        ),
        [E("rt-redis", "rt-1")]: edgeText(
          "실시간 서버 #1 이 자기에게 붙은 가게·주문의 채널 메시지를 받아요.",
          "Redis 프로토콜(TCP 6379). 서버가 SUBSCRIBE 로 연결을 열어 두면 메시지가 와요.",
          "받은 메시지를 바로 그 가게의 WebSocket 으로 내려보내요.",
          "실시간 Redis 보안 그룹: 실시간 서버 보안 그룹 → 6379 허용.",
        ),
        [E("rt-redis", "rt-2")]: edgeText(
          "실시간 서버 #2 가 자기에게 붙은 가게·주문의 채널 메시지를 받아요.",
          "Redis 프로토콜(TCP 6379). SUBSCRIBE 로 받아요.",
          "두 서버가 각자 맡은 연결의 메시지만 받아요.",
          "실시간 Redis 보안 그룹: 실시간 서버 보안 그룹 → 6379 허용.",
        ),
      },
    },

    // ── 9. 라이더 위치 수집과 위치 캐시 ──────────────────────────
    {
      id: "location",
      goal: "라이더 위치 수집과 위치 캐시",
      example: "라이더 위치를 받아 위치 캐시에 두는 위치 API 를 넣어 줘",
      keywords: [
        ["위치", "location", "gps", "좌표"],
        // "라이더 위치 보기 흐름"(흐름 단계)은 받지 않게, 위치 낱말과 함께 무엇을 둘지 말해야 맞는다.
        ["캐시", "api", "수집", "받아", "올리", "올려", "저장", "추적", "tracking", "서버", "서비스", "넣", "두", "redis", "레디스", "geo"],
      ],
      commands: [
        update("alb", { rules: ALB_RULES.location }),
        group("loc-asg", "redundancy_group", "위치 API Auto Scaling 그룹", "app"),
        node("loc-1", "app_server", "위치 API #1", "loc-asg", "Spring Boot 3.5", ec2("dlv-loc-2a", "10.30.10.51", "2a")),
        node("loc-2", "app_server", "위치 API #2", "loc-asg", "Spring Boot 3.5", ec2("dlv-loc-2c", "10.30.11.51", "2c")),
        node("geo", "cache", "위치 캐시", "data", "ElastiCache · 라이더 위치(GEO)", redis()),
        edge("alb", "loc-1", "request", "HTTP 8080"),
        edge("alb", "loc-2", "request", "HTTP 8080"),
        edge("loc-1", "geo", "request", "Redis 6379"),
        edge("loc-2", "geo", "request", "Redis 6379"),
        edge("loc-1", "rt-redis", "async", "Redis 6379"),
        edge("loc-2", "rt-redis", "async", "Redis 6379"),
      ],
      say: "라이더 앱이 몇 초마다 올리는 위치를 위치 API 가 받아, 위치 캐시에 라이더마다 최신 값 하나로 덮어써요. 배달 중인 주문이면 실시간 Redis 에도 내 그 주문을 보는 고객 앱에 WebSocket 으로 내려가요.",
      notes: [
        { kind: "caution", text: "위치는 DB 에 다 쓰지 않아요. 라이더 1만 명이 5초마다 올리면 초당 2천 건이에요. 최신 위치만 메모리에 두고, 이력이 필요하면 모아 따로 저장해요." },
        { kind: "flow", text: "고객 앱은 배달 추적 화면을 여는 동안 실시간 서버에 WebSocket 을 열어요. 위치가 올 때마다 지도 위 라이더가 움직여요." },
        { kind: "caution", text: "라이더 위치는 개인 위치정보예요. 배달 중에만 받고, 고객에게는 자기 주문을 맡은 라이더만 보여요." },
      ],
      miss: "이번 단계는 라이더 위치를 받아 두는 곳이에요. '라이더 위치를 받아 위치 캐시에 두는 위치 API 를 넣어 줘'처럼 말해 보세요.",
      explains: {
        [G("loc-asg")]: groupText(
          "라이더 위치 보고를 받는 서버 묶음이에요. 요청은 작지만 아주 잦아, 주문 API 와 나눠 두고 라이더 수에 따라 늘려요.",
          "ALB 에서 8080 이 들어오고, 위치 캐시(6379)에 쓰고 실시간 Redis(6379)에 내요.",
          ["위치 받기는 주문 API 와 다른 서비스로 둔다", "잦은 위치 요청이 몰려도 주문 받기가 느려지지 않는다", "주문 API 가 위치까지 받는다", "서비스와 배포 대상이 하나 더 는다"],
          ASG_DEF,
        ),
        [N("loc-1")]: nodeText(
          "라이더 앱이 올린 위치를 받아 위치 캐시에 덮어쓰고, 배달 중인 주문이면 그 주문 채널에 위치를 내는 서버예요(AZ 2a).",
          ["위치는 받자마자 캐시에 덮어쓰고 바로 답한다", "DB 쓰기를 기다리지 않아 잦은 요청도 가볍게 받는다", "위치를 받을 때마다 RDS 에 한 줄씩 쓴다", "캐시가 멈추면 최신 위치가 잠깐 비고, 다음 보고로 다시 채워진다"],
        ),
        [N("loc-2")]: nodeText(
          "위치 API #1 과 같은 서버를 다른 AZ(2c)에 둔 짝이에요. ALB 가 두 대에 나눠 보내요.",
          ["두 서버를 다른 AZ 에 둔다", "AZ 하나가 멈춰도 위치 보고가 이어진다", "같은 AZ 에 두 대를 둔다", "AZ 를 넘는 통신에 약간의 요금과 지연이 생긴다"],
        ),
        [N("geo")]: nodeText(
          "라이더마다 최신 위치 하나만 메모리에 두는 관리형 Redis 예요. Redis GEO 로 저장해, 배차 때 가게 반경 안의 라이더를 바로 찾아요.",
          ["최신 위치는 DB 가 아닌 Redis GEO 에 둔다", "초당 수천 건의 덮어쓰기와 반경 조회를 메모리에서 빠르게 한다", "RDS 에 위치를 쓰고 공간 질의로 찾는다", "메모리에만 있어 이력은 따로 모아야 한다"],
        ),
        [E("alb", "loc-1")]: edgeText(
          "ALB 가 /rider/location 경로의 위치 보고를 위치 API #1(2a)로 보내요.",
          "HTTP(TCP 8080). 암호는 ALB 에서 풀었어요.",
          "위치 보고만 따로 받는 서비스로 나눠요.",
          "위치 API 보안 그룹: ALB 보안 그룹 → 8080 만 허용.",
        ),
        [E("alb", "loc-2")]: edgeText(
          "ALB 가 /rider/location 경로의 위치 보고를 위치 API #2(2c)로 보내요.",
          "HTTP(TCP 8080).",
          "두 AZ 의 서버에 나눠 보내요.",
          "위치 API 보안 그룹: ALB 보안 그룹 → 8080 만 허용.",
        ),
        [E("loc-1", "geo")]: edgeText(
          "위치 API #1 이 라이더의 최신 위치를 위치 캐시에 덮어써요.",
          "Redis 프로토콜(TCP 6379). GEOADD 는 같은 라이더면 위치를 바꿔 써요.",
          "라이더마다 한 줄만 남아 쓰기가 쌓이지 않아요.",
          "위치 캐시 보안 그룹: 위치 API 보안 그룹 → 6379 허용.",
        ),
        [E("loc-2", "geo")]: edgeText(
          "위치 API #2 가 라이더의 최신 위치를 위치 캐시에 덮어써요.",
          "Redis 프로토콜(TCP 6379). GEOADD 로 써요.",
          "어느 서버로 와도 같은 캐시에 최신 위치가 남아요.",
          "위치 캐시 보안 그룹: 위치 API 보안 그룹 → 6379 허용.",
        ),
        [E("loc-1", "rt-redis")]: edgeText(
          "위치 API #1 이 배달 중인 주문의 채널에 라이더 위치를 내요.",
          "Redis 프로토콜(TCP 6379). PUBLISH 명령을 써요.",
          "그 주문을 보는 고객 앱에 실시간 서버가 바로 내려보내요.",
          "실시간 Redis 보안 그룹: 위치 API 보안 그룹 → 6379 허용.",
        ),
        [E("loc-2", "rt-redis")]: edgeText(
          "위치 API #2 가 배달 중인 주문의 채널에 라이더 위치를 내요.",
          "Redis 프로토콜(TCP 6379). PUBLISH 명령을 써요.",
          "고객 앱이 묻지 않아도 위치가 내려가게 해요.",
          "실시간 Redis 보안 그룹: 위치 API 보안 그룹 → 6379 허용.",
        ),
      },
    },

    // ── 10. 배차 서비스(주변 라이더 찾기) ─────────────────────────
    {
      id: "dispatch",
      goal: "배차 서비스(주변 라이더 찾기)",
      example: "주변 라이더를 찾아 배차하는 배차 서비스를 넣어 줘",
      keywords: [["배차", "dispatch", "매칭", "matching", "주변 라이더", "가까운 라이더", "근처 라이더"]],
      commands: [
        node("dispatch-q", "queue", "배차 큐", "region", "Amazon SQS · 표준 대기열", { ...managed(), sw: "Amazon SQS", version: NO_VERSION }),
        group("dispatch-asg", "redundancy_group", "배차 서비스 Auto Scaling 그룹", "app"),
        node("disp-1", "app_server", "배차 서비스 #1", "dispatch-asg", "Spring Boot 3.5", ec2("dlv-disp-2a", "10.30.10.61", "2a")),
        node("disp-2", "app_server", "배차 서비스 #2", "dispatch-asg", "Spring Boot 3.5", ec2("dlv-disp-2c", "10.30.11.61", "2c")),
        edge("sns", "dispatch-q", "async", "SNS 구독(접수만)"),
        edge("dispatch-q", "disp-1", "async", "SQS HTTPS"),
        edge("dispatch-q", "disp-2", "async", "SQS HTTPS"),
        edge("disp-1", "geo", "request", "Redis 6379"),
        edge("disp-2", "geo", "request", "Redis 6379"),
        edge("disp-1", "sns", "async", "SNS HTTPS"),
        edge("disp-2", "sns", "async", "SNS HTTPS"),
      ],
      say: "가게가 주문을 접수하면 같은 SNS 주제의 이벤트가 배차 큐에도 들어가요. 배차 서비스가 위치 캐시에서 가게 반경 안의 라이더를 찾아 고르고, '배차 제안' 이벤트를 내 알림 워커가 라이더에게 푸시해요.",
      notes: [
        { kind: "flow", text: "배차 큐는 '접수' 이벤트만 받게 구독 필터를 걸어요. 배차 서비스가 낸 '배차 제안'은 알림 큐로만 가고 배차 큐로 돌아오지 않아요." },
        { kind: "caution", text: "두 라이더가 같은 배차를 동시에 수락할 수 있어요. 주문 API 가 '아직 배차 전'일 때만 바꾸는 조건으로 DB 를 고쳐 한 명만 되게 해요." },
        { kind: "caution", text: "앱이 꺼진 라이더는 위치가 캐시에 남아요. 마지막 보고 시각을 따로 두고, 오래된 라이더는 후보에서 빼요." },
      ],
      miss: "이번 단계는 주변 라이더를 찾아 배차하는 서비스예요. '주변 라이더를 찾아 배차하는 배차 서비스를 넣어 줘'처럼 말해 보세요.",
      explains: {
        [N("dispatch-q")]: nodeText(
          "SNS 주제에서 '가게 접수' 이벤트만 받아 두었다가 배차 서비스가 꺼내 가게 하는 관리형 대기열이에요.",
          ["배차는 알림과 다른 큐로 받는다", "알림이 몰려도 배차가 밀리지 않고, 따로 늘릴 수 있다", "알림 워커가 배차까지 한다", "큐와 구독 필터를 하나 더 관리해야 한다"],
        ),
        [G("dispatch-asg")]: groupText(
          "배차 큐에서 접수된 주문을 꺼내 주변 라이더를 찾고 고르는 서버 묶음이에요. 두 AZ 에 한 대씩 두고, 쌓인 주문 수로 대수를 정해요.",
          "배차 큐에서 받아 오고(HTTPS), 위치 캐시(6379)에서 라이더를 찾고, SNS 로 '배차 제안'을 내요.",
          ["배차는 따로 늘릴 수 있는 서비스로 둔다", "점심·저녁 몰림 때 배차만 늘려 대기를 줄인다", "주문 API 가 접수 때 바로 배차한다", "서비스와 배포 대상이 하나 더 는다"],
          ASG_DEF,
        ),
        [N("disp-1")]: nodeText(
          "접수된 주문의 가게 좌표로 위치 캐시에서 반경 안의 라이더를 찾아, 거리·배달 중인 건수를 보고 고르는 서버예요(AZ 2a). 수락은 주문 API 가 확정해요.",
          ["배차 서비스는 고르고 제안만 하고, 확정은 주문 API 가 한다", "주문 상태를 바꾸는 곳이 하나로 남아 어긋나지 않는다", "배차 서비스가 DB 의 주문을 직접 고친다", "제안·수락·확정이 여러 단계로 나뉜다"],
        ),
        [N("disp-2")]: nodeText(
          "배차 서비스 #1 과 같은 일을 다른 AZ(2c)에서 하는 짝이에요. 두 대가 배차 큐를 함께 비워요.",
          ["두 서버를 다른 AZ 에 둔다", "AZ 하나가 멈춰도 배차가 이어진다", "같은 AZ 에 두 대를 둔다", "같은 주문이 두 번 올 수 있어 이미 제안했는지 확인해야 한다"],
        ),
        [E("sns", "dispatch-q")]: edgeText(
          "SNS 가 '가게 접수' 이벤트만 골라 배차 큐에 넣어요.",
          "SNS → SQS 구독. 구독 필터 정책으로 이벤트 종류를 골라요.",
          "주문 API 를 고치지 않고 배차라는 새 소비자를 붙였어요.",
          "배차 큐의 접근 정책에 이 SNS 주제가 넣는 것만 허용해요.",
        ),
        [E("dispatch-q", "disp-1")]: edgeText(
          "배차 서비스 #1 이 배차 큐에서 접수된 주문을 받아 와요.",
          "SQS API(HTTPS 443). 롱 폴링으로 가져가요.",
          "감당할 만큼씩 꺼내 배차해요.",
          "배차 보안 그룹: 나가는 443 허용.",
        ),
        [E("dispatch-q", "disp-2")]: edgeText(
          "배차 서비스 #2 가 배차 큐에서 접수된 주문을 받아 와요.",
          "SQS API(HTTPS 443).",
          "두 대가 나눠 받아 몰린 배차를 빨리 처리해요.",
          "배차 보안 그룹: 나가는 443 허용.",
        ),
        [E("disp-1", "geo")]: edgeText(
          "배차 서비스 #1 이 가게 좌표에서 반경 안의 라이더를 가까운 순으로 찾아요.",
          "Redis 프로토콜(TCP 6379). GEOSEARCH 명령을 써요.",
          "DB 를 뒤지지 않고 메모리에서 바로 주변 라이더를 찾아요.",
          "위치 캐시 보안 그룹: 배차 보안 그룹 → 6379 허용.",
        ),
        [E("disp-2", "geo")]: edgeText(
          "배차 서비스 #2 가 가게 반경 안의 라이더를 찾아요.",
          "Redis 프로토콜(TCP 6379). GEOSEARCH 명령을 써요.",
          "어느 배차 서버든 같은 최신 위치로 고르게 해요.",
          "위치 캐시 보안 그룹: 배차 보안 그룹 → 6379 허용.",
        ),
        [E("disp-1", "sns")]: edgeText(
          "배차 서비스 #1 이 고른 라이더에게 보낼 '배차 제안' 이벤트를 SNS 에 내요.",
          "SNS API(HTTPS 443).",
          "라이더 푸시는 알림 워커가 한곳에서 맡게 해요.",
          "배차 보안 그룹: 나가는 443 허용. IAM 역할에 이 주제 발행만 허용해요.",
        ),
        [E("disp-2", "sns")]: edgeText(
          "배차 서비스 #2 가 '배차 제안' 이벤트를 SNS 에 내요.",
          "SNS API(HTTPS 443).",
          "어느 배차 서버가 골라도 같은 길로 라이더에게 알려요.",
          "배차 보안 그룹: 나가는 443 허용. IAM 역할에 이 주제 발행만 허용해요.",
        ),
      },
    },

    // ── 11. 지도·주소 외부 API ──────────────────────────────────
    {
      id: "map",
      goal: "지도·주소 외부 API 연동",
      example: "지도·주소 검색 외부 API 를 연동해 줘",
      // "map" 만 쓰면 "FCM·APNs"("fcmapns")에 걸린다.
      keywords: [["지도", "maps", "map api", "주소", "지오코딩", "geocod", "좌표 변환", "길찾기", "내비"]],
      commands: [
        assume("external", "PG사 결제, 푸시(FCM·APNs), 지도·주소 API"),
        node("map", "external_api", "지도·주소 API", "ext", "지도 표시·주소 검색", { integration: "앱: 지도 SDK(HTTPS) · 서버: REST API(HTTPS, API 키)" }),
        edge("customer", "map", "request", "지도 SDK HTTPS"),
        edge("rider", "map", "request", "지도 SDK HTTPS"),
        edge("nat", "map", "request", "HTTPS 443"),
      ],
      say: "지도 사업자의 지도·주소 API 를 붙였어요. 앱은 지도 SDK 로 지도를 직접 그리고, 주문 API 는 NAT 를 거쳐 배달 주소를 좌표로 바꿔 배달 가능 지역과 거리를 확인해요.",
      notes: [
        { kind: "link", text: "지도 그림은 앱과 지도 사업자 사이에서 오가 우리 서버를 거치지 않아요. 주소 검색·좌표 변환만 주문 API 가 NAT 로 불러요." },
        { kind: "caution", text: "앱에 넣은 키는 꺼내 볼 수 있어요. 앱 키는 우리 앱에서만 쓰이게 제한하고, 서버 키는 서버에만 둬요." },
        { kind: "flow", text: "호출 수만큼 요금·한도가 있어요. 주소는 주문할 때 한 번만 좌표로 바꿔 주문에 적고, 배차·거리 계산에 다시 써요." },
      ],
      miss: "이번 단계는 지도·주소 외부 API 연동이에요. '지도·주소 검색 외부 API 를 연동해 줘'처럼 말해 보세요.",
      explains: {
        [N("map")]: nodeText(
          "지도 화면, 주소 검색, 주소를 좌표로 바꾸기를 제공하는 지도 사업자의 API 예요. 앱은 SDK 로, 서버는 REST API 로 불러요.",
          ["지도·주소는 지도 사업자의 API 를 쓴다", "지도 데이터와 주소 체계를 직접 만들고 고칠 필요가 없다", "지도 데이터를 사서 직접 지도 서버를 운영한다", "호출 수만큼 요금이 들고 사업자 장애·한도에 영향을 받는다"],
          { term: "지도·주소 API", definition: "지도·주소 API 는 지도 사업자가 제공하는 외부 API 로, 지도 표시·주소 검색·주소를 좌표로 바꾸기·거리 계산 같은 기능을 제공합니다." },
        ),
        [E("customer", "map")]: edgeText(
          "고객 앱이 지도 SDK 로 가게·배달 주소와 라이더 위치를 지도에 그려요.",
          "HTTPS(TCP 443). 앱의 지도 SDK 가 지도 사업자에서 지도 조각을 받아 와요.",
          "지도 그림을 우리 서버가 대신 받아 줄 필요가 없어요.",
          "고객과 지도 사업자 사이라 배달앱의 보안 그룹을 지나지 않아요. 앱 키는 우리 앱에서만 쓰이게 제한해요.",
        ),
        [E("rider", "map")]: edgeText(
          "라이더 앱이 지도 SDK 로 가게와 배달지까지 길을 지도에 보여요.",
          "HTTPS(TCP 443). 앱의 지도 SDK 가 지도 사업자에 바로 접속해요.",
          "라이더가 길을 보는 데 우리 서버를 거치지 않아요.",
          "라이더와 지도 사업자 사이라 배달앱의 보안 그룹을 지나지 않아요.",
        ),
        [E("nat", "map")]: edgeText(
          "주문 API 의 주소 검색·좌표 변환 요청이 인터넷을 지나 지도 사업자에 닿아요.",
          "HTTPS(TCP 443) REST API. 서버 전용 API 키를 붙여요.",
          "배달 가능 지역과 거리를 서버에서 정확히 확인하려고요.",
          "NAT 에는 보안 그룹이 없어요. 주문 API 보안 그룹의 나가는 443 으로 다스려요.",
        ),
      },
    },

    // ── 12. CloudWatch 모니터링·알람 ───────────────────────────
    {
      id: "ops",
      goal: "CloudWatch 모니터링·알람",
      example: "CloudWatch 로 모니터링과 알람을 붙여 줘",
      keywords: [["cloudwatch", "클라우드워치", "모니터링", "monitoring", "로그", "log", "지표", "알람", "감시", "metric", "대시보드"]],
      commands: [
        node("cw", "monitoring", "CloudWatch", "region", "지표·로그·알람", { ...managed(), sw: "Amazon CloudWatch", version: NO_VERSION }),
        node("operator", "admin_user", "운영자", null),
        edge("vpc", "cw", "aux", "지표·로그"),
        edge("cw", "operator", "aux", "알람"),
      ],
      say: "CloudWatch 를 붙여 ALB·EC2·RDS·ElastiCache·SNS·SQS 의 지표와 서버 로그를 한곳에서 보게 했어요. 기준을 넘으면 알람이 운영자에게 가요.",
      notes: [
        { kind: "caution", text: "점심 전에 주문 수·큐에 쌓인 메시지·WebSocket 연결 수·위치 보고 수를 함께 봐요. 큐가 쌓이면 워커를, 연결이 늘면 실시간 서버를 늘려요." },
        { kind: "flow", text: "관리형 서비스의 지표는 설치 없이 모여요. EC2 의 메모리·디스크와 앱 로그는 CloudWatch 에이전트를 깔아야 모여요." },
        { kind: "net", text: "감시 서버를 따로 두지 않아요. 서버의 에이전트가 HTTPS 로 CloudWatch 에 보내요(NAT 나 VPC 엔드포인트를 거쳐요)." },
      ],
      miss: "이번 단계는 모니터링과 알람이에요. 'CloudWatch 로 모니터링과 알람을 붙여 줘'처럼 말해 보세요.",
      explains: {
        [N("cw")]: nodeText(
          "AWS 자원의 지표와 로그를 모아 그래프로 보여 주고, 기준을 넘으면 알람을 보내는 관리형 감시 서비스예요.",
          ["감시와 로그는 CloudWatch 로 모은다", "관리형 서비스 지표가 저절로 모이고 감시 서버를 운영할 필요가 없다", "EC2 에 Prometheus·Grafana·ELK 를 직접 운영한다", "로그 저장량과 지표 수만큼 요금이 들어 보관 기간을 정해야 한다"],
        ),
        [N("operator")]: nodeText(
          "배달앱을 운영하며 알람을 받고 몰림·장애에 대응하는 운영자예요.",
          ["알람은 운영자에게 바로 보낸다", "몰림이나 장애를 사람이 바로 알아야 대응한다", "운영자가 대시보드를 수시로 들여다본다", "기준을 잘못 잡으면 알람이 너무 많거나 늦다"],
        ),
        [E("vpc", "cw")]: edgeText(
          "VPC 안 서버·ALB·RDS·ElastiCache 의 지표와 앱 로그가 CloudWatch 로 가요.",
          "관리형 서비스는 자동으로, EC2 는 CloudWatch 에이전트가 HTTPS(443)로 보내요.",
          "몰림과 장애를 한 화면에서 보려고요.",
          "서버 보안 그룹: 나가는 443 허용(NAT 나 VPC 엔드포인트를 거쳐요).",
        ),
        [E("cw", "operator")]: edgeText(
          "기준을 넘은 알람이 운영자에게 가요.",
          "CloudWatch 알람이 운영용 SNS 주제(주문 이벤트와 다른 주제)로 메일·문자를 보내요.",
          "몰림이나 장애를 사람이 바로 알아야 대응해요.",
          "AWS 안에서 보내는 알림이라 따로 열 것이 없어요.",
        ),
      },
    },

    // ── 13. 주문하기·라이더 위치 보기 흐름 ────────────────────────
    {
      id: "flows",
      goal: "주문하기·라이더 위치 보기 흐름",
      example: "주문하기와 라이더 위치 보기 흐름을 정리해 줘",
      keywords: [["흐름", "flow", "시나리오", "과정"]],
      commands: [
        flowOf("order", "주문하기", "고객이 앱에서 주문하고 결제한다.", "가게 태블릿에 새 주문이 울리고, 가게가 접수하면 배차 서비스가 주변 라이더를 찾는다.", [
          ["customer", "pg", "카드 인증", "고객 앱이 PG사 결제창을 열어 카드 정보를 넣고 인증한다."],
          ["customer", "alb", "주문 요청", "인증 결과와 함께 주문을 보낸다."],
          ["alb", "order-1", "분배", "ALB 가 /orders 경로를 주문 API 한 대로 보낸다."],
          ["order-1", "nat", "밖으로", "주문 API 가 NAT 게이트웨이를 거쳐 인터넷으로 나간다."],
          ["nat", "pg", "결제 승인", "PG사가 카드사 승인을 받아 결과를 돌려준다."],
          ["order-1", "rds", "주문 저장", "결제된 주문을 '결제 완료'로 RDS 에 저장한다."],
          ["order-1", "sns", "이벤트", "'결제 완료' 이벤트를 SNS 주제에 내고 고객에게 답한다."],
          ["sns", "notify-q", "알림 큐", "SNS 가 이벤트를 알림 큐에 넣는다."],
          ["notify-q", "notify-1", "꺼내기", "알림 워커가 이벤트를 받아 와 가게에 알릴 일을 정한다."],
          ["notify-1", "rt-redis", "가게 채널", "워커가 그 가게의 채널에 새 주문을 낸다."],
          ["rt-redis", "rt-1", "구독 서버", "그 가게와 연결된 실시간 서버가 메시지를 받는다."],
          back("rt-1", "alb", "내려보내기", "실시간 서버가 열려 있는 WebSocket 으로 새 주문을 보낸다."),
          back("alb", "store", "주문 울림", "ALB 를 지나 가게 태블릿에 새 주문이 울린다."),
          ["store", "alb", "접수", "가게가 접수 버튼을 누른다."],
          ["alb", "order-2", "분배", "ALB 가 접수 요청을 주문 API 한 대로 보낸다."],
          ["order-2", "rds", "상태 바꿈", "주문 상태를 '접수'로 바꾼다."],
          ["order-2", "sns", "접수 이벤트", "'접수' 이벤트를 SNS 주제에 낸다(고객 푸시는 알림 큐 쪽에서 나간다)."],
          ["sns", "dispatch-q", "배차 큐", "구독 필터가 '접수' 이벤트를 배차 큐에도 넣는다."],
          ["dispatch-q", "disp-1", "배차 시작", "배차 서비스가 접수된 주문을 받아 온다."],
          ["disp-1", "geo", "주변 라이더", "가게 반경 안의 라이더를 위치 캐시에서 가까운 순으로 찾는다."],
        ]),
        flowOf("rider-track", "라이더 위치 보기", "배달 중인 라이더 앱이 몇 초마다 위치를 올린다.", "고객 앱의 지도에서 라이더가 움직인다. 위치는 RDS 에 쓰지 않는다.", [
          ["rider", "alb", "위치 보고", "라이더 앱이 현재 위치를 /rider/location 으로 보낸다."],
          ["alb", "loc-1", "분배", "ALB 가 위치 보고를 위치 API 한 대로 보낸다."],
          ["loc-1", "geo", "최신 위치", "위치 API 가 라이더의 최신 위치를 위치 캐시에 덮어쓴다."],
          ["loc-1", "rt-redis", "주문 채널", "배달 중인 주문의 채널에 위치를 낸다."],
          ["rt-redis", "rt-2", "구독 서버", "그 주문을 보는 고객과 연결된 실시간 서버가 받는다."],
          back("rt-2", "alb", "내려보내기", "실시간 서버가 고객의 WebSocket 으로 위치를 보낸다."),
          back("alb", "customer", "지도 갱신", "고객 앱이 지도 위 라이더 위치를 옮긴다."),
        ]),
      ],
      say: "주문하기와 라이더 위치 보기 두 흐름을 정리했어요. 재생하면 주문이 결제·저장·이벤트를 거쳐 가게 태블릿에 닿는 길과, 라이더 위치가 DB 를 거치지 않고 고객 화면까지 가는 길을 볼 수 있어요.",
      notes: [
        { kind: "flow", text: "주문 API 는 결제·저장·이벤트 내기까지만 하고 답해요. 가게 알림과 배차는 SNS 뒤에서 따로 이어져요." },
        { kind: "link", text: "결제는 고객 → PG사 결제창, 주문 API → NAT → PG사 승인의 두 갈래로 PG사와 이어져요." },
        { kind: "caution", text: "흐름은 서버 한 대씩만 그렸어요. 실제로는 ALB 와 큐가 두 대 가운데 하나에 나눠 줘요." },
      ],
      miss: "마지막 단계는 흐름 정리예요. '주문하기와 라이더 위치 보기 흐름을 정리해 줘'처럼 말해 보세요.",
      explains: {},
    },
  ],
};
