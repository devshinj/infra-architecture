// 메신저 — 클라우드(AWS 서울 리전). 실제 회사의 구성이 아니라 이런 서비스를 만들 때 흔히 쓰는 구성이다. 값은 모두 예시다.
// 가상 값: VPC 10.30.0.0/16. 서브넷은 AZ 마다 하나씩이다(공개 10.30.0.0/24·10.30.1.0/24, 앱 10.30.10.0/24·10.30.11.0/24, 데이터 10.30.20.0/24·10.30.21.0/24).
// 도메인은 예약된 example 을 쓴다(chat.messenger.example·api.messenger.example·files.messenger.example).
// 빈 영역이 남지 않게 영역은 그 안에 처음 무언가를 놓는 단계에서 만든다(데이터 서브넷은 접속 상태 캐시, 외부 영역은 FCM·APNs 단계).
// 실시간 전달: 보내는 채팅 서버가 저장(DynamoDB) → 접속 상태에서 받는 사람의 서버 확인 → 그 서버 채널에 발행(Redis Pub/Sub).
// 파일: API 서버가 CloudFront 서명 URL 을 주고, 앱은 CloudFront(OAC)를 거쳐 S3 에 올리고 받는다. 앱 → S3 직접 연결은 방화벽 없는 진입 경고에 걸려 그리지 않는다.
import type { Command } from "../commands";
import { assume, edge, edgeId, group, managed, node } from "../samples/dsl";

import { countConflicts, E, edgeText, G, groupText, N, nodeText, update } from "./authoring";
import type { GuideVariant } from "./types";

/**
 * 흐름 명령. dsl 의 flow 와 같고, 단계 끝에 true 를 붙이면 연결을 거꾸로 지난다(받는 사람에게 내려보내는 길).
 * 거꾸로 단계는 [시작 노드, 도착 노드, …] 순서로 쓰고, 연결 id 는 edgeId(도착, 시작)이다.
 */
type FlowStepRow = [from: string, to: string, short: string, text: string, reverse?: true];
const flow = (id: string, name: string, origin: "user" | "system", summary: string, result: string, steps: FlowStepRow[]): Command => ({
  op: "add_flow",
  id,
  name,
  origin,
  summary,
  result,
  steps: steps.map(([from, to, short, text, reverse]) => ({ edge: reverse ? edgeId(to, from) : edgeId(from, to), from, short, text })),
});

const ec2 = (hostname: string, ip: string, az: "2a" | "2c", sw: string, cpu: string, ram: string) => ({
  sw, os: "Amazon Linux 2023", cpu, ram, disk: "30GiB gp3", hostname, ip, az,
});
const chat = (hostname: string, ip: string, az: "2a" | "2c") => ec2(hostname, ip, az, "Node.js 22", "4 vCPU (c6i.xlarge)", "8GiB");
const api = (hostname: string, ip: string, az: "2a" | "2c") => ec2(hostname, ip, az, "Spring Boot 3.5", "2 vCPU (m6i.large)", "8GiB");
const push = (hostname: string, ip: string, az: "2a" | "2c") => ec2(hostname, ip, az, "Spring Boot 3.5", "2 vCPU (c6i.large)", "4GiB");
const NO_VERSION = "관리형(버전 없음)";
const REDIS = { ...managed("yes"), sw: "Amazon ElastiCache", version: "Redis OSS 7.1", replication: "주 노드 + 다른 AZ 복제본(자동 장애 조치)" };

const ASG_DEF = {
  term: "Auto Scaling 그룹",
  definition: "Auto Scaling 그룹은 같은 설정의 EC2 서버를 정한 대수만큼 유지하고 부하에 따라 늘리거나 줄이는 AWS 의 서버 묶음입니다.",
};

/**
 * 워커 대수 어긋남. authoring.ts 의 수량 이름에 "워커"가 없어 "워커 세 대"·"워커 한 대로"를 여기서 더한다.
 * "세 대"는 앞의 이름으로만 잡는다(authoring.ts 머리말: "차세대" 함정).
 */
const workerConflicts = (more: string, fewer: string): NonNullable<GuideVariant["steps"][number]["conflicts"]> => [
  ...countConflicts(more, fewer),
  ...["워커 세 대", "워커 4대", "워커 네 대", "워커 3대"].map((p) => ({ pattern: [p], reply: more })),
  ...["워커 한 대만", "워커 한 대로", "워커 1대만", "워커 1대로"].map((p) => ({ pattern: [p], reply: fewer })),
];

const ALB_CHAT_RULES = "443 리스너(AWS WAF 연결): chat.messenger.example → 채팅 대상 그룹(8080) · 유휴 시간 제한 60초(기본) · 헬스 체크 /health";

export const MESSENGER_CLOUD: GuideVariant = {
  environment: "클라우드(AWS)",
  outro:
    "서울 리전의 VPC 에 ALB 와 두 AZ 의 채팅 서버를 두어 WebSocket 연결을 오래 쥐고, 서버 사이 전달은 Redis Pub/Sub, 저장은 DynamoDB, 접속 상태는 ElastiCache 로 나눈 메신저를 만들었어요. 연결이 없는 사용자에게는 SQS 와 푸시 워커가 FCM·APNs 로 알림을 맡기고, 사진·파일은 서명 URL 로 CloudFront 를 거쳐 S3 를 오가요.",
  otherEnv: [
    { from: "ALB(WebSocket, 유휴 시간 제한)", to: "L4·L7 장비 두 대(VIP, 연결 유지 시간 설정)" },
    { from: "채팅 서버 Auto Scaling 그룹(두 AZ)", to: "채팅 서버 두 대 이상(VIP 뒤)" },
    { from: "ElastiCache(접속 상태·Pub/Sub)", to: "Redis + Sentinel" },
    { from: "DynamoDB", to: "Cassandra 같은 분산 NoSQL 클러스터(직접 운영)" },
    { from: "RDS Multi-AZ", to: "MySQL Active-Standby(VIP)" },
    { from: "S3 + CloudFront", to: "사내 오브젝트 스토리지 + CDN 업체 계약" },
    { from: "SQS", to: "사내 큐(RabbitMQ)" },
    { from: "NAT 게이트웨이", to: "아웃바운드 프록시·방화벽(FCM·APNs 주소만 허용)" },
    { from: "CloudWatch", to: "Prometheus·Grafana·ELK" },
  ],
  steps: [
    // ── 1. 앱 진입: ALB 와 WebSocket ───────────────────────────
    {
      id: "entry",
      goal: "앱 진입: ALB 와 WebSocket",
      example: "앱이 ALB 를 거쳐 WebSocket 으로 접속하게 해 줘",
      keywords: [["alb", "로드밸런서", "로드 밸런서", "load balancer", "elb", "websocket", "웹소켓", "웹 소켓", "vpc", "입구", "진입"]],
      commands: [
        assume("scale", "가입자 100만 명, 동시 접속 최대 10만(예시)"),
        node("user", "client_web", "PC·웹 메신저", null),
        node("mobile", "client_mobile", "모바일 앱", null, "Android·iOS"),
        group("region", "cloud_region", "AWS 서울 리전"),
        group("vpc", "vpc", "메신저 VPC", "region"),
        group("pub", "subnet_public", "공개 서브넷", "vpc"),
        node("alb", "lb_l7", "ALB", "pub", "L7 로드밸런서 · WebSocket", { ...managed(), sw: "AWS ALB", port: "443", rules: ALB_CHAT_RULES }),
        edge("user", "alb", "request", "WSS 443"),
        edge("mobile", "alb", "request", "WSS 443"),
      ],
      say: "서울 리전에 메신저 VPC 를 만들고 공개 서브넷에 ALB 를 뒀어요. 앱은 로그인한 뒤 ALB 로 WebSocket 연결을 하나 열어 두고, 그 연결로 메시지를 보내고 받아요. 서버도 묻기를 기다리지 않고 먼저 내려보낼 수 있어요.",
      notes: [
        { kind: "net", text: "WebSocket 은 HTTPS(443) 요청으로 시작해 연결을 업그레이드한 거예요. 보안 그룹에는 443 만 열면 돼요." },
        { kind: "caution", text: "ALB 는 유휴 시간 제한(기본 60초) 동안 오가는 데이터가 없으면 연결을 끊어요. 앱이 30초쯤마다 작은 하트비트를 보내 연결을 살려 둬요." },
        { kind: "flow", text: "연결은 한 번 열리면 끊길 때까지 같은 서버에 붙어 있어요. 그래서 WebSocket 만 쓰면 고정 세션(스티키)을 따로 켜지 않아도 돼요." },
      ],
      miss: "이번 단계는 앱이 들어오는 입구예요. '앱이 ALB 를 거쳐 WebSocket 으로 접속하게 해 줘'처럼 말해 보세요.",
      explains: {
        [N("user")]: nodeText(
          "PC 프로그램이나 브라우저로 대화하는 사용자예요. 로그인하면 ALB 로 WebSocket 연결을 열어 두고 메시지를 주고받아요.",
          ["PC·웹도 앱과 같은 WebSocket 입구를 쓴다", "메시지 처리 서버를 한 벌로 운영할 수 있다", "PC 는 몇 초마다 새 메시지를 묻는다(폴링)", "연결을 오래 쥐는 서버를 직접 운영해야 한다"],
        ),
        [N("mobile")]: nodeText(
          "휴대폰 앱(Android·iOS) 사용자예요. 앱이 화면에 있을 때는 WebSocket 으로 주고받고, 앱이 꺼지거나 뒤로 가 연결이 끊기면 푸시 알림으로 새 메시지를 알아요.",
          ["앱이 화면에 있을 때만 WebSocket 을 연다", "휴대폰 OS 는 배터리 때문에 뒤로 간 앱의 연결을 오래 두지 않는다", "앱이 뒤에서도 연결을 붙들고 있게 한다", "꺼진 동안의 알림은 FCM·APNs 에 기대야 한다"],
        ),
        [G("region")]: groupText(
          "메신저 서버와 데이터를 두는 AWS 서울 리전(ap-northeast-2)이에요. 리전 안에는 서로 떨어진 데이터센터 묶음(AZ)이 여러 곳 있어요.",
          "앱의 WebSocket·API 연결이 ALB 로 들어오고, 파일은 CloudFront 를 거쳐 S3 로 오가요. 푸시는 NAT 게이트웨이를 거쳐 FCM·APNs 로 나가요.",
          ["사용자가 국내라 서울 리전에 둔다", "가까워 메시지 지연이 짧고, 국내 저장 요구에도 맞추기 쉽다", "도쿄 같은 다른 리전에 둔다", "서울 리전 전체가 멈추는 일까지는 대비하지 않는다"],
        ),
        [G("vpc")]: groupText(
          "메신저만 쓰는 사설 네트워크(10.30.0.0/16)예요. 이 안을 공개·앱·데이터 서브넷으로 나눠 자원을 둬요.",
          "인터넷 게이트웨이를 통해 ALB 가 연결을 받고 NAT 가 푸시 요청을 내보내요. DynamoDB·SQS 에는 VPC 엔드포인트로 닿아요.",
          ["VPC 하나에 서브넷 세 층을 둔다", "계층마다 경로와 보안 그룹을 다르게 줄 수 있다", "공개 서브넷 하나에 모두 둔다", "서브넷과 경로 표를 계층·AZ 마다 관리해야 한다"],
        ),
        [G("pub")]: groupText(
          "인터넷 게이트웨이로 가는 경로가 있는 서브넷이에요. 인터넷과 직접 말해야 하는 ALB 와 NAT 게이트웨이만 둬요.",
          "앱의 443 연결이 ALB 로 들어오고, 앱 서브넷으로 8080 이 나가요. 푸시 워커의 바깥 요청은 NAT 를 거쳐 인터넷으로 나가요.",
          ["서버는 공개 서브넷에 두지 않는다", "서버에 공인 IP 가 없어 인터넷에서 바로 닿지 않는다", "서버도 공개 서브넷에 두고 보안 그룹으로만 막는다", "서버가 밖으로 나가려면 NAT 게이트웨이를 거쳐야 한다"],
        ),
        [N("alb")]: nodeText(
          "앱의 WebSocket 연결과 API 요청을 받아 채팅 서버·API 서버에 나눠 주는 L7 로드밸런서예요. TLS 를 풀고, 헬스 체크로 멈춘 서버를 대상에서 빼요.",
          ["관리형 ALB 로 WebSocket 연결을 받는다", "WebSocket 을 그대로 지원하고 AWS 가 여러 AZ 에 이중화한다", "NLB 로 TCP 째 넘기고 TLS 는 서버가 푼다", "유휴 시간 제한에 걸리지 않게 앱이 하트비트를 보내야 한다"],
        ),
        [E("user", "alb")]: edgeText(
          "PC·웹 메신저가 ALB 에 WebSocket 연결을 열고, 그 연결로 메시지를 주고받아요.",
          "WSS(TCP 443). HTTPS 요청으로 시작해 WebSocket 으로 업그레이드해요.",
          "연결 하나로 보내기와 받기를 모두 해, 새 메시지를 바로 받으려고요.",
          "ALB 보안 그룹: 인터넷 → 443 허용. WAF 는 연결을 여는 요청을 검사해요.",
        ),
        [E("mobile", "alb")]: edgeText(
          "모바일 앱이 화면에 있는 동안 ALB 에 WebSocket 연결을 열어 둬요.",
          "WSS(TCP 443). 30초쯤마다 하트비트를 보내 유휴 시간 제한에 걸리지 않게 해요.",
          "앱이 켜져 있는 동안 새 메시지를 바로 받으려고요.",
          "ALB 보안 그룹: 인터넷 → 443 허용.",
        ),
      },
    },

    // ── 2. 채팅 서버 두 대를 두 AZ 에 ──────────────────────────
    {
      id: "chat",
      goal: "채팅 서버 두 대를 두 AZ 에",
      example: "채팅 서버 두 대를 AZ 두 곳에 나눠 넣어 줘",
      keywords: [["채팅 서버", "채팅서버", "채팅용 서버", "chat", "웹소켓 서버", "websocket 서버", "연결 서버", "ec2", "오토스케일링", "오토 스케일링", "auto scaling", "asg"]],
      conflicts: countConflicts(
        "세 대도 틀린 구성은 아니지만, 이 가이드는 채팅 서버를 두 대로 시작해요. '채팅 서버 두 대를 AZ 두 곳에'로 말해 주세요.",
        "한 대나 한 AZ 에만 두면 그 서버가 멈출 때 모든 연결이 함께 끊겨요. 이번에는 두 대를 두 AZ 에 나눠요.",
      ),
      commands: [
        assume("redundancy", "서버는 두 AZ 에 나눈 Auto Scaling, 캐시·DB 는 Multi-AZ"),
        group("app", "subnet_private", "앱 서브넷", "vpc"),
        group("chat-asg", "redundancy_group", "채팅 서버 Auto Scaling 그룹", "app"),
        node("chat-1", "app_server", "채팅 서버 #1", "chat-asg", "WebSocket 서버", chat("msg-chat-2a", "10.30.10.11", "2a")),
        node("chat-2", "app_server", "채팅 서버 #2", "chat-asg", "WebSocket 서버", chat("msg-chat-2c", "10.30.11.11", "2c")),
        edge("alb", "chat-1", "request", "WebSocket 8080"),
        edge("alb", "chat-2", "request", "WebSocket 8080"),
      ],
      say: "앱 서브넷에 채팅 서버 두 대를 AZ 2a·2c 에 하나씩 두고 Auto Scaling 그룹으로 묶었어요. 채팅 서버는 답하고 끝나는 서버가 아니라, 접속한 사람마다 연결을 하나씩 오래 쥐고 있어요.",
      notes: [
        { kind: "flow", text: "서버를 늘려도 이미 열린 연결은 옮겨 가지 않아요. 새 서버는 새로 들어오는 연결부터 받아요." },
        { kind: "caution", text: "배포나 축소로 서버가 빠지면 그 서버의 연결이 끊겨요. 앱은 잠깐 기다렸다 다시 연결하고, 놓친 메시지를 받아 와야 해요." },
        { kind: "net", text: "늘리고 줄이는 기준은 CPU 보다 서버당 연결 수가 맞아요. 채팅 서버가 연결 수를 CloudWatch 지표로 올려 Auto Scaling 에 써요." },
      ],
      miss: "이번 단계는 연결을 쥐는 채팅 서버예요. '채팅 서버 두 대를 AZ 두 곳에 나눠 넣어 줘'처럼 말해 보세요.",
      explains: {
        [G("app")]: groupText(
          "채팅 서버·API 서버·푸시 워커를 두는 프라이빗 서브넷이에요. 서버에 공인 IP 가 없어 인터넷에서 바로 닿지 않아요.",
          "ALB 에서 8080 이 들어오고, 데이터 서브넷으로 6379·3306 이, 엔드포인트로 DynamoDB·SQS 요청이, NAT 로 푸시가 나가요.",
          ["서버는 프라이빗 서브넷에 둔다", "공격자가 서버에 바로 닿을 길을 없앤다", "공개 서브넷에 두고 보안 그룹으로 막는다", "밖으로 나갈 때 NAT 게이트웨이를 거쳐야 하고 요금이 든다"],
        ),
        [G("chat-asg")]: groupText(
          "채팅 서버를 최소 2대에서 최대 10대로 유지하는 묶음이에요. 두 AZ 에 고르게 두고, 서버당 연결 수가 늘면 서버를 더 띄워요.",
          "ALB 에서 WebSocket(8080)이 들어오고, 캐시(6379)·DynamoDB·SQS 로 나가요.",
          ["채팅 서버는 두 AZ 에 걸친 Auto Scaling 그룹으로 둔다", "AZ 하나가 멈춰도 다른 AZ 서버로 다시 연결되고, 몰리면 늘어난다", "EC2 두 대를 고정으로 둔다", "서버가 빠질 때마다 그 서버의 연결이 끊겨 앱이 다시 연결해야 한다"],
          ASG_DEF,
        ),
        [N("chat-1")]: nodeText(
          "앱마다 WebSocket 연결을 하나씩 쥐고 메시지를 받고 내려보내는 서버예요(AZ 2a). 받은 메시지는 저장한 뒤 받는 사람이 붙은 서버로 넘겨요.",
          ["채팅 서버를 API 서버와 따로 둔다", "연결을 오래 쥐는 서버만 연결 수 기준으로 따로 늘린다", "API 서버가 WebSocket 도 함께 받는다", "배포·운영할 서버 묶음이 하나 더 는다"],
        ),
        [N("chat-2")]: nodeText(
          "채팅 서버 #1 과 같은 서버를 다른 AZ(2c)에 둔 짝이에요. ALB 가 새 연결을 두 대에 나눠 주고, 2a 가 멈추면 끊긴 앱들이 이 서버로 다시 연결해요.",
          ["두 서버를 서로 다른 AZ 에 둔다", "AZ 하나의 장애로 모든 연결이 함께 끊기지 않는다", "같은 AZ 에 두 대를 둔다", "서로 다른 서버에 붙은 사람끼리는 메시지를 넘겨줄 길이 따로 필요하다"],
        ),
        [E("alb", "chat-1")]: edgeText(
          "ALB 가 새 WebSocket 연결을 채팅 서버 #1(2a)에 붙여요. 연결은 끊길 때까지 이 서버에 머물러요.",
          "WebSocket(TCP 8080). TLS 는 ALB 에서 풀고 업그레이드된 연결을 서버로 이어요.",
          "연결을 두 서버에 나눠 한 서버에 몰리지 않게 해요.",
          "채팅 서버 보안 그룹: ALB 보안 그룹 → 8080 만 허용.",
        ),
        [E("alb", "chat-2")]: edgeText(
          "ALB 가 새 WebSocket 연결을 채팅 서버 #2(2c)에 붙여요.",
          "WebSocket(TCP 8080). 헬스 체크(/health)에 실패한 서버에는 새 연결을 보내지 않아요.",
          "두 AZ 의 서버에 나눠 한 AZ 가 멈춰도 다시 연결할 곳이 있게 해요.",
          "채팅 서버 보안 그룹: ALB 보안 그룹 → 8080 만 허용.",
        ),
      },
    },

    // ── 3. 메시지 저장: DynamoDB ───────────────────────────────
    {
      id: "store",
      goal: "메시지 저장: DynamoDB",
      example: "메시지는 DynamoDB 에 저장해 줘",
      keywords: [["dynamodb", "다이나모", "dynamo", "nosql", "노에스큐엘", "메시지 저장", "메시지를 저장", "대화 저장", "대화를 저장", "대화 기록", "메시지 기록", "db", "디비", "데이터베이스", "database"]],
      commands: [
        node("ddb", "db_nosql", "메시지 저장소", "region", "Amazon DynamoDB · 대화방·메시지·읽음", {
          ...managed("yes"), sw: "Amazon DynamoDB", version: NO_VERSION, replication: "리전 안 여러 AZ 에 자동 복제",
        }),
        edge("chat-1", "ddb", "request", "DynamoDB HTTPS"),
        edge("chat-2", "ddb", "request", "DynamoDB HTTPS"),
      ],
      say: "메시지 저장소로 DynamoDB 를 붙였어요. 대화방 번호를 파티션 키, 메시지 순번을 정렬 키로 두어 한 방의 메시지를 순서대로 쓰고 읽어요. 채팅 서버는 메시지를 먼저 저장한 뒤 보낸 사람에게 '보냄'을 알려요.",
      notes: [
        { kind: "flow", text: "메시지는 쓰기가 아주 많고, 읽을 때는 '이 방의 최근 메시지'처럼 키로 찾아요. 그래서 키로 나눠 많이 쓰기 좋은 DynamoDB 를 골랐어요." },
        { kind: "net", text: "DynamoDB 는 VPC 밖의 리전 서비스예요. 채팅 서버는 게이트웨이 엔드포인트로 NAT 없이 닿아요." },
        { kind: "caution", text: "읽음은 방마다 '어디까지 읽었나' 순번 하나로 저장해요. 메시지마다 읽은 사람을 따로 쓰면 단체방에서 쓰기가 크게 늘어요." },
      ],
      miss: "이번 단계는 메시지를 남겨 둘 저장소예요. '메시지는 DynamoDB 에 저장해 줘'처럼 말해 보세요.",
      explains: {
        [N("ddb")]: nodeText(
          "1:1·단체 대화방, 메시지, 사람마다 읽은 위치를 저장하는 관리형 NoSQL 이에요. AWS 가 여러 AZ 에 복제하고 쓰기량에 맞춰 늘려요.",
          ["메시지는 DynamoDB 에 대화방·순번 키로 저장한다", "쓰기가 많아도 키로 나눠 받아 내고, 서버·복제 운영이 없다", "RDS(MySQL)나 직접 운영하는 Cassandra 에 저장한다", "키로 찾지 않는 검색은 어렵고, 아주 큰 단체방은 한 파티션에 쓰기가 몰린다"],
        ),
        [E("chat-1", "ddb")]: edgeText(
          "채팅 서버 #1 이 받은 메시지를 저장하고, 다시 연결한 앱이 놓친 메시지를 순번으로 읽어 가요.",
          "DynamoDB API(HTTPS 443). VPC 게이트웨이 엔드포인트로 NAT 없이 닿아요.",
          "저장이 끝난 메시지만 '보냄'으로 알려, 서버가 멈춰도 메시지를 잃지 않게 해요.",
          "채팅 서버 IAM 역할에 이 테이블 읽기·쓰기만 허용해요.",
        ),
        [E("chat-2", "ddb")]: edgeText(
          "채팅 서버 #2 가 받은 메시지와 읽은 위치를 저장하고 읽어요.",
          "DynamoDB API(HTTPS 443). 같은 테이블을 써요.",
          "어느 서버에 붙어도 같은 대화 기록을 보게 해요.",
          "채팅 서버 IAM 역할에 이 테이블 읽기·쓰기만 허용해요.",
        ),
      },
    },

    // ── 4. 접속 상태: ElastiCache ──────────────────────────────
    {
      id: "presence",
      goal: "접속 상태: ElastiCache",
      example: "접속 상태는 ElastiCache 에 둬 줘",
      keywords: [["접속 상태", "접속상태", "온라인 상태", "presence", "프레즌스", "접속 여부", "접속중", "접속 중", "온라인 표시", "elasticache", "엘라스티캐시", "캐시", "cache"]],
      commands: [
        group("data", "subnet_private", "데이터 서브넷", "vpc"),
        node("presence", "cache", "접속 상태 캐시", "data", "ElastiCache · 사용자 → 채팅 서버", REDIS),
        edge("chat-1", "presence", "request", "Redis 6379"),
        edge("chat-2", "presence", "request", "Redis 6379"),
      ],
      say: "데이터 서브넷에 접속 상태 캐시(ElastiCache)를 넣었어요. 사용자가 연결하면 채팅 서버가 '이 사람은 채팅 서버 #1 에 있음'을 짧은 만료 시간과 함께 적고, 하트비트가 올 때마다 다시 적어요.",
      notes: [
        { kind: "flow", text: "연결이 끊기거나 서버가 멈추면 하트비트도 끊겨 기록이 만료돼요. 기록이 없으면 그 사람은 오프라인이에요." },
        { kind: "net", text: "데이터 서브넷에는 밖으로 나가는 경로가 없어요. 캐시는 VPC 안의 서버하고만 말해요." },
        { kind: "caution", text: "접속 상태는 다시 만들 수 있는 값이라 캐시에 둬요. 캐시가 바뀌어 비어도 하트비트마다 다시 적어 곧 채워져요." },
      ],
      miss: "이번 단계는 누가 접속해 있는지 적는 곳이에요. '접속 상태는 ElastiCache 에 둬 줘'처럼 말해 보세요.",
      explains: {
        [G("data")]: groupText(
          "접속 상태 캐시·메시지 중계 캐시·회원 DB 를 두는 서브넷이에요. 경로 표에 NAT·인터넷 게이트웨이가 없어 VPC 밖으로 나가는 길이 없어요.",
          "앱 서브넷의 서버에서 6379(ElastiCache)·3306(RDS)만 들어와요. 밖으로 나가는 통신은 없어요.",
          ["캐시·DB 는 밖으로 나갈 길이 없는 서브넷에 둔다", "털려도 데이터를 밖으로 바로 내보낼 길이 없다", "앱 서브넷에 함께 둔다", "서브넷과 경로 표가 하나 더 는다"],
        ),
        [N("presence")]: nodeText(
          "누가 어느 채팅 서버에 연결돼 있는지 '사용자 → 서버' 기록을 만료 시간과 함께 두는 관리형 Redis 예요. 주 노드와 다른 AZ 복제본으로 이중화해요.",
          ["접속 상태는 만료 시간이 있는 캐시 키로 둔다", "끊긴 사람은 따로 지우지 않아도 만료로 오프라인이 된다", "DB 에 접속·종료 시각을 기록한다", "하트비트마다 쓰기가 생기고, 끊긴 뒤 몇십 초 늦게 오프라인이 된다"],
        ),
        [E("chat-1", "presence")]: edgeText(
          "채팅 서버 #1 이 자기에게 붙은 사람을 적고, 받는 사람이 어느 서버에 있는지 찾아요.",
          "Redis 프로토콜(TCP 6379). 키마다 만료 시간을 줘요.",
          "메시지를 어느 서버로 넘길지, 푸시를 보낼지 정하려고요.",
          "ElastiCache 보안 그룹: 채팅 서버 보안 그룹 → 6379 만 허용.",
        ),
        [E("chat-2", "presence")]: edgeText(
          "채팅 서버 #2 가 자기에게 붙은 사람을 적고 하트비트마다 다시 적어요.",
          "Redis 프로토콜(TCP 6379). 같은 기본 엔드포인트로 접속해요.",
          "두 서버가 같은 접속 상태를 봐야 어디로 보낼지 맞게 정해요.",
          "ElastiCache 보안 그룹: 채팅 서버 보안 그룹 → 6379 만 허용.",
        ),
      },
    },

    // ── 5. 서버 사이 전달: Redis Pub/Sub ───────────────────────
    {
      id: "pubsub",
      goal: "서버 사이 전달: Redis Pub/Sub",
      example: "서버 사이 메시지 전달은 Redis Pub/Sub 로 해 줘",
      keywords: [["pub/sub", "pub sub", "펍섭", "펍서브", "발행", "구독", "publish", "subscribe", "서버 사이", "서버 간", "서버끼리", "서버들 사이", "중계", "브로커", "redis", "레디스"]],
      commands: [
        node("pubsub", "cache", "메시지 중계 캐시", "data", "ElastiCache · Pub/Sub", REDIS),
        edge("chat-1", "pubsub", "request", "Redis 6379"),
        edge("chat-2", "pubsub", "request", "Redis 6379"),
      ],
      say: "받는 사람이 다른 채팅 서버에 붙어 있으면 그 서버로 메시지를 넘겨야 해요. 채팅 서버마다 자기 채널을 구독해 두고, 보내는 서버는 접속 상태에서 찾은 서버의 채널에 발행해요. 그 서버가 받아 연결로 내려 줘요.",
      notes: [
        { kind: "flow", text: "채팅 서버 #1 → 받는 사람의 서버(#2) 확인 → #2 채널에 발행 → #2 가 받아 WebSocket 으로 내려보내요." },
        { kind: "link", text: "채팅 서버끼리는 직접 잇지 않고 중계 캐시만 바라봐요. 서버가 늘어도 서로의 주소를 알 필요가 없어요." },
        { kind: "caution", text: "Redis Pub/Sub 는 받아 두지 않고 그 순간 구독 중인 서버에만 전해요. 놓친 메시지는 앱이 다시 연결할 때 DynamoDB 에서 받아 와요." },
      ],
      miss: "이번 단계는 채팅 서버끼리 메시지를 넘기는 길이에요. '서버 사이 메시지 전달은 Redis Pub/Sub 로 해 줘'처럼 말해 보세요.",
      explains: {
        [N("pubsub")]: nodeText(
          "채팅 서버들이 서로 메시지를 넘기는 Pub/Sub 중계 캐시예요. 서버마다 자기 채널을 구독하고, 접속 상태 캐시와 나눠 발행이 몰려도 접속 조회가 늦지 않아요.",
          ["서버 사이 전달은 ElastiCache 의 Redis Pub/Sub 로 한다", "지연이 짧고, 서버가 늘어도 자기 채널만 구독하면 된다", "Kafka(MSK) 같은 메시지 큐로 넘긴다", "받아 두지 않아 놓친 메시지는 DB 에서 다시 받아 와야 한다"],
        ),
        [E("chat-1", "pubsub")]: edgeText(
          "채팅 서버 #1 이 다른 서버로 갈 메시지를 그 서버 채널에 발행하고, 자기 채널로 오는 메시지를 받아요.",
          "Redis 프로토콜(TCP 6379). 구독은 연결 하나를 계속 열어 두고 받아요.",
          "서버마다 다른 사람이 붙어 있어 서버 사이에 메시지를 넘겨야 해요.",
          "ElastiCache 보안 그룹: 채팅 서버 보안 그룹 → 6379 만 허용.",
        ),
        [E("chat-2", "pubsub")]: edgeText(
          "채팅 서버 #2 가 자기 채널을 구독해 다른 서버가 보낸 메시지를 받고, 필요하면 발행도 해요.",
          "Redis 프로토콜(TCP 6379). 장애 조치로 연결이 끊기면 다시 구독해요.",
          "#1 에 붙은 사람이 #2 에 붙은 사람에게 보낸 메시지가 이 길로 와요.",
          "ElastiCache 보안 그룹: 채팅 서버 보안 그룹 → 6379 만 허용.",
        ),
      },
    },

    // ── 6. 로그인·API 서버와 회원 DB ───────────────────────────
    {
      id: "api",
      goal: "로그인·API 서버와 회원 DB",
      example: "로그인 API 서버 두 대와 회원 DB 를 넣어 줘",
      keywords: [["로그인", "login", "인증", "토큰", "token", "jwt", "회원", "api", "rds", "mysql"]],
      conflicts: countConflicts(
        "세 대도 틀린 구성은 아니지만, 이 가이드는 API 서버를 두 대로 맞춰요. '로그인 API 서버 두 대와 회원 DB'로 말해 주세요.",
        "한 대나 한 AZ 에만 두면 그 서버가 멈출 때 아무도 로그인할 수 없어요. 이번에는 두 대를 두 AZ 에 나눠요.",
      ),
      commands: [
        group("api-asg", "redundancy_group", "API Auto Scaling 그룹", "app"),
        node("api-1", "app_server", "API #1", "api-asg", "Spring Boot 3.5", api("msg-api-2a", "10.30.10.21", "2a")),
        node("api-2", "app_server", "API #2", "api-asg", "Spring Boot 3.5", api("msg-api-2c", "10.30.11.21", "2c")),
        node("rds", "db_rdb", "회원 DB", "data", "RDS MySQL · 회원·친구·기기 토큰", {
          ...managed("yes"), sw: "Amazon RDS", version: "MySQL 8.4", replication: "동기 복제(다른 AZ 대기 인스턴스)",
        }),
        update("alb", { rules: `${ALB_CHAT_RULES} · api.messenger.example → API 대상 그룹(8080)` }),
        edge("alb", "api-1", "request", "HTTP 8080"),
        edge("alb", "api-2", "request", "HTTP 8080"),
        edge("api-1", "rds", "request", "MySQL 3306"),
        edge("api-2", "rds", "request", "MySQL 3306"),
      ],
      say: "로그인과 친구 목록 같은 짧은 요청은 API 서버 두 대가 맡고, 회원·친구·기기 토큰은 RDS MySQL(Multi-AZ)에 둬요. ALB 는 주소(chat·api)를 보고 채팅 서버와 API 서버로 나눠 보내요.",
      notes: [
        { kind: "link", text: "로그인하면 API 서버가 짧게 쓰는 액세스 토큰(JWT)을 줘요. 앱은 WebSocket 을 열 때 이 토큰을 보내고, 채팅 서버는 서명만 확인해요." },
        { kind: "caution", text: "브라우저는 WebSocket 에 인증 헤더를 붙일 수 없어 토큰을 첫 메시지나 쿠키로 보내요. 주소 뒤에 붙이면 로그에 남지 않게 막아요." },
        { kind: "net", text: "API 와 채팅은 같은 ALB 를 쓰고 대상 그룹만 달라요. 요청이 짧은 API 와 연결이 긴 채팅을 서버로 나눠 따로 늘려요." },
      ],
      miss: "이번 단계는 로그인을 맡는 API 서버와 회원 DB 예요. '로그인 API 서버 두 대와 회원 DB 를 넣어 줘'처럼 말해 보세요.",
      explains: {
        [G("api-asg")]: groupText(
          "API 서버를 두 AZ 에 한 대씩, 최대 6대까지 유지하는 묶음이에요. 멈춘 서버는 새로 띄워 ALB 대상 그룹에 다시 넣어요.",
          "ALB 에서 8080 이 들어오고, 회원 DB(3306)로 나가요.",
          ["API 는 채팅과 다른 Auto Scaling 그룹으로 둔다", "로그인이 몰려도 연결을 쥔 채팅 서버에 영향이 없다", "채팅 서버가 API 도 함께 받는다", "서버 묶음과 배포 대상이 하나 더 는다"],
          ASG_DEF,
        ),
        [N("api-1")]: nodeText(
          "로그인·토큰 발급, 친구 목록, 기기 토큰 등록, 파일 서명 URL 발급 같은 짧은 요청을 처리해요(AZ 2a). 회원 정보는 RDS 에서 읽고 써요.",
          ["로그인하면 짧게 쓰는 JWT 액세스 토큰과 갱신 토큰을 준다", "채팅 서버가 서명만 확인해 연결마다 DB 를 묻지 않는다", "연결할 때마다 채팅 서버가 세션 저장소를 조회한다", "발급한 액세스 토큰은 만료 전에 되돌리기 어려워 수명을 짧게 둔다"],
        ),
        [N("api-2")]: nodeText(
          "API #1 과 같은 서버를 다른 AZ(2c)에 둔 짝이에요. ALB 가 두 대에 나눠 보내고, 2a 가 멈추면 이 서버가 받아요.",
          ["두 서버를 서로 다른 AZ 에 둔다", "AZ 하나가 멈춰도 로그인이 이어진다", "같은 AZ 에 두 대를 둔다", "AZ 를 넘는 통신에 약간의 요금과 지연이 생긴다"],
        ),
        [N("rds")]: nodeText(
          "회원·친구 관계·기기 토큰(푸시를 받을 주소)을 저장하는 관리형 MySQL 이에요. 다른 AZ 의 대기 DB 로 이중화하고 장애 조치는 AWS 가 해요.",
          ["회원·친구 정보는 RDS Multi-AZ 에 둔다", "가입·친구 맺기처럼 정확해야 하고 관계를 묶어 읽는 데이터라 RDB 가 맞다", "회원 정보도 DynamoDB 에 함께 둔다", "저장소가 둘이 되어 백업·운영을 따로 챙긴다"],
        ),
        [E("alb", "api-1")]: edgeText(
          "ALB 가 api 주소로 온 로그인·친구 목록 요청을 API #1(2a)로 보내요.",
          "HTTP(TCP 8080). TLS 는 ALB 에서 풀었어요.",
          "주소(호스트 이름)로 채팅과 API 를 나눠, 짧은 요청은 API 서버가 받게 해요.",
          "API 보안 그룹: ALB 보안 그룹 → 8080 만 허용.",
        ),
        [E("alb", "api-2")]: edgeText(
          "ALB 가 api 주소로 온 요청을 API #2(2c)로 보내요.",
          "HTTP(TCP 8080). TLS 는 ALB 에서 풀었어요.",
          "두 AZ 의 서버에 나눠 한쪽에 몰리지 않게 해요.",
          "API 보안 그룹: ALB 보안 그룹 → 8080 만 허용.",
        ),
        [E("api-1", "rds")]: edgeText(
          "API #1 이 로그인 확인, 친구 목록, 기기 토큰 등록을 위해 회원 DB 를 읽고 써요.",
          "MySQL(TCP 3306). RDS 엔드포인트(DNS 이름)로 접속해요.",
          "회원 원본 데이터는 회원 DB 에만 있어요.",
          "RDS 보안 그룹: API 보안 그룹 → 3306 만 허용.",
        ),
        [E("api-2", "rds")]: edgeText(
          "API #2 가 같은 회원 DB 를 읽고 써요.",
          "MySQL(TCP 3306). 같은 엔드포인트로 접속해요.",
          "어느 API 서버로 가도 같은 회원 정보가 보여야 해요.",
          "RDS 보안 그룹: API 보안 그룹 → 3306 만 허용.",
        ),
      },
    },

    // ── 7. 사진·파일: S3 와 CloudFront ─────────────────────────
    {
      id: "files",
      goal: "사진·파일: S3 와 CloudFront",
      example: "사진·파일은 S3 에 올리고 CloudFront 로 받게 해 줘",
      keywords: [["s3", "cloudfront", "클라우드프론트", "클라우드 프런트", "cdn", "사진", "파일", "이미지", "첨부", "버킷", "bucket", "오브젝트", "동영상"]],
      commands: [
        node("cdn", "cdn", "CloudFront", null, "CDN · 파일 올리기·받기", { ...managed(), sw: "Amazon CloudFront" }),
        node("s3", "object_storage", "S3", "region", "사진·파일", { ...managed(), sw: "Amazon S3", replication: "리전 안 여러 AZ 에 자동 저장", version: NO_VERSION }),
        edge("user", "cdn", "request", "HTTPS 443"),
        edge("mobile", "cdn", "request", "HTTPS 443"),
        edge("cdn", "s3", "request", "OAC HTTPS"),
      ],
      say: "사진·파일은 메시지 연결로 보내지 않아요. 앱이 API 서버에서 몇 분만 쓰는 서명 URL 을 받아 CloudFront 를 거쳐 S3 에 바로 올리고, 메시지에는 파일 위치만 담아요. 받는 사람도 서명 URL 로 받아요.",
      notes: [
        { kind: "flow", text: "API 에서 서명 URL 받기 → CloudFront 로 올리기 → S3 저장 → WebSocket 으로 '사진 보냄(파일 위치)' 메시지를 보내요." },
        { kind: "caution", text: "버킷은 공개하지 않아요. S3 는 CloudFront 만 OAC 로 읽고 쓰게 하고, 앱은 기한이 짧은 서명 URL 로만 CloudFront 에 닿아요." },
        { kind: "net", text: "CloudFront 는 리전 밖 전 세계 엣지에서 돌아요. 큰 파일이 채팅·API 서버를 지나지 않아 연결을 쥔 서버가 가벼워요." },
      ],
      miss: "이번 단계는 사진·파일을 주고받는 길이에요. '사진·파일은 S3 에 올리고 CloudFront 로 받게 해 줘'처럼 말해 보세요.",
      explains: {
        [N("cdn")]: nodeText(
          "사진·파일을 올리고 받는 입구예요. 서명이 맞는 요청만 받아 S3 로 넘기고, 한 번 받은 파일은 엣지에 캐시해 같은 방 사람들이 빨리 받아요.",
          ["파일은 서명 URL 로 CloudFront 를 거쳐 S3 에 올리고 받는다", "큰 파일이 채팅·API 서버를 지나지 않고, 받기는 엣지 캐시가 맡는다", "S3 미리 서명 URL 로 S3 주소에 바로 올린다", "CloudFront 에 PUT 을 열고, 서명 키를 API 서버에 안전하게 둬야 한다"],
        ),
        [N("s3")]: nodeText(
          "사진·동영상·파일을 저장하는 오브젝트 스토리지예요. 리전 안 여러 AZ 에 자동으로 나눠 저장해 따로 이중화할 것이 없어요.",
          ["파일은 S3 에 두고 메시지에는 파일 위치만 담는다", "메시지 저장소가 가볍고, 용량 걱정 없이 쌓는다", "파일을 DynamoDB 나 서버 디스크에 둔다", "저장량·요청 수만큼 요금이 들어 오래된 파일의 보관 기간을 정해야 한다"],
        ),
        [E("user", "cdn")]: edgeText(
          "PC·웹 메신저가 서명 URL 로 파일을 올리고, 받은 사진·파일을 내려받아요.",
          "HTTPS(TCP 443). files 주소의 CloudFront 엣지가 받아요.",
          "파일은 메시지 연결이 아닌 따로 된 길로 오가야 채팅이 막히지 않아요.",
          "CloudFront 는 서명이 없거나 기한이 지난 URL 을 403 으로 막아요.",
        ),
        [E("mobile", "cdn")]: edgeText(
          "모바일 앱이 찍은 사진을 서명 URL 로 올리고, 받은 사진을 내려받아요.",
          "HTTPS(TCP 443). 가까운 CloudFront 엣지가 받아요.",
          "큰 파일이 채팅 서버를 지나지 않게 해요.",
          "CloudFront 는 서명이 맞는 요청만 받아요.",
        ),
        [E("cdn", "s3")]: edgeText(
          "CloudFront 가 올라온 파일을 S3 에 쓰고, 캐시에 없는 파일을 S3 에서 가져와요.",
          "HTTPS(TCP 443). OAC 로 CloudFront 가 서명한 요청만 버킷이 받아요.",
          "버킷을 공개하지 않고 CloudFront 만 통로로 쓰려고요.",
          "S3 버킷 정책: 이 CloudFront 배포에서 온 읽기·쓰기만 허용해요.",
        ),
      },
    },

    // ── 8. 푸시 대기열(SQS)과 푸시 워커 ────────────────────────
    {
      id: "queue",
      goal: "푸시 대기열(SQS)과 푸시 워커",
      example: "푸시 보낼 일은 SQS 대기열에 넣고 워커 두 대가 꺼내게 해 줘",
      keywords: [["sqs", "대기열", "큐", "queue", "워커", "worker"]],
      conflicts: workerConflicts(
        "세 대도 틀린 구성은 아니지만, 이 가이드는 푸시 워커를 두 대로 맞춰요. 'SQS 대기열과 워커 두 대'로 말해 주세요.",
        "한 대나 한 AZ 에만 두면 그 워커가 멈출 때 푸시가 모두 밀려요. 이번에는 두 대를 두 AZ 에 나눠요.",
      ),
      commands: [
        node("sqs", "queue", "푸시 대기열", "region", "Amazon SQS · 표준 대기열", { ...managed(), sw: "Amazon SQS", version: NO_VERSION }),
        group("push-asg", "redundancy_group", "푸시 워커 Auto Scaling 그룹", "app"),
        node("push-1", "app_server", "푸시 워커 #1", "push-asg", "Spring Boot 3.5", push("msg-push-2a", "10.30.10.31", "2a")),
        node("push-2", "app_server", "푸시 워커 #2", "push-asg", "Spring Boot 3.5", push("msg-push-2c", "10.30.11.31", "2c")),
        edge("chat-1", "sqs", "async", "SQS HTTPS"),
        edge("chat-2", "sqs", "async", "SQS HTTPS"),
        edge("sqs", "push-1", "async", "SQS HTTPS"),
        edge("sqs", "push-2", "async", "SQS HTTPS"),
        edge("push-1", "rds", "request", "MySQL 3306"),
        edge("push-2", "rds", "request", "MySQL 3306"),
      ],
      say: "받는 사람이 오프라인이면 채팅 서버는 '푸시 보내기' 일을 SQS 대기열에 넣고 바로 다음 메시지를 처리해요. 푸시 워커 두 대가 대기열에서 꺼내 회원 DB 에서 받는 사람의 기기 토큰을 찾아요.",
      notes: [
        { kind: "flow", text: "500명 단체방에 메시지 하나면 푸시도 수백 건이에요. 대기열이 한꺼번에 받아 두고, 워커가 감당할 만큼씩 꺼내요." },
        { kind: "caution", text: "표준 대기열은 같은 메시지를 두 번 줄 수 있어요. 메시지 번호로 이미 보낸 알림인지 보고 건너뛰어야 알림이 두 번 가지 않아요." },
        { kind: "net", text: "SQS 는 VPC 밖의 리전 서비스예요. 채팅 서버와 워커는 SQS 인터페이스 엔드포인트로 NAT 없이 닿아요." },
      ],
      miss: "이번 단계는 푸시 보낼 일을 받아 둘 대기열과 워커예요. '푸시 보낼 일은 SQS 대기열에 넣어 줘'처럼 말해 보세요.",
      explains: {
        [N("sqs")]: nodeText(
          "연결이 없는 사용자에게 보낼 푸시 일을 받아 두었다가 워커가 꺼내 가게 하는 관리형 대기열이에요. AWS 가 여러 AZ 에 나눠 저장해요.",
          ["푸시는 SQS 에 넣고 워커가 따로 보낸다", "푸시 서비스가 느리거나 멈춰도 채팅 서버는 메시지 처리를 이어 간다", "채팅 서버가 FCM·APNs 를 바로 부른다", "알림이 조금 늦을 수 있고 중복은 워커가 걸러야 한다"],
        ),
        [G("push-asg")]: groupText(
          "SQS 에서 푸시 일을 꺼내 보내는 워커 묶음이에요. 두 AZ 에 한 대씩 두고, 쌓인 메시지 수에 따라 대수를 늘리거나 줄여요.",
          "SQS 에서 일을 받아 오고(HTTPS), 회원 DB(3306)에서 기기 토큰을 읽고, NAT 를 거쳐 FCM·APNs 로 나가요.",
          ["푸시 워커는 채팅 서버와 다른 Auto Scaling 그룹으로 둔다", "푸시가 몰려도 연결을 쥔 채팅 서버는 영향을 받지 않는다", "Lambda 가 SQS 메시지를 받아 보낸다", "서버 묶음과 배포 대상이 하나 더 는다"],
          ASG_DEF,
        ),
        [N("push-1")]: nodeText(
          "SQS 에서 푸시 일을 꺼내 회원 DB 에서 기기 토큰을 찾고, FCM·APNs 에 알림을 맡겨요(AZ 2a). 다 보내면 대기열의 메시지를 지워요.",
          ["보낸 뒤에 대기열 메시지를 지운다", "보내다 멈추면 표시 제한 시간 뒤 다른 워커가 이어 보낸다", "꺼내자마자 지운다", "같은 일이 두 번 올 수 있어 중복을 걸러야 한다"],
        ),
        [N("push-2")]: nodeText(
          "푸시 워커 #1 과 같은 일을 다른 AZ(2c)에서 하는 짝이에요. FCM·APNs 가 '없는 기기'라고 답한 토큰은 회원 DB 에서 지워요.",
          ["더는 없는 기기의 토큰은 지운다", "앱을 지운 기기에 계속 보내는 헛걸음을 줄인다", "토큰을 그대로 두고 매번 보낸다", "워커가 회원 DB 에 쓰기까지 해야 한다"],
        ),
        [E("chat-1", "sqs")]: edgeText(
          "받는 사람의 접속 기록이 없으면 채팅 서버 #1 이 '푸시 보내기' 일을 대기열에 넣어요.",
          "SQS API(HTTPS 443). SQS 인터페이스 엔드포인트로 VPC 안에서 닿아요.",
          "느린 바깥 푸시 서비스를 기다리지 않고 다음 메시지를 처리하려고요.",
          "채팅 서버 보안 그룹: 나가는 443 허용, IAM 역할에 이 대기열 보내기만 허용.",
        ),
        [E("chat-2", "sqs")]: edgeText(
          "채팅 서버 #2 도 오프라인인 사람에게 갈 푸시 일을 같은 대기열에 넣어요.",
          "SQS API(HTTPS 443).",
          "어느 채팅 서버에서 생긴 푸시든 한 대기열로 모아요.",
          "채팅 서버 보안 그룹: 나가는 443 허용.",
        ),
        [E("sqs", "push-1")]: edgeText(
          "푸시 워커 #1 이 대기열에서 푸시 일을 받아 와요.",
          "SQS API(HTTPS 443). 워커가 롱 폴링으로 메시지를 가져가요.",
          "워커가 감당할 만큼씩 꺼내 보내게 해요.",
          "워커 보안 그룹: 나가는 443 허용(인터페이스 엔드포인트).",
        ),
        [E("sqs", "push-2")]: edgeText(
          "푸시 워커 #2 가 대기열에서 푸시 일을 받아 와요.",
          "SQS API(HTTPS 443). 두 워커가 메시지를 나눠 받아요.",
          "두 대가 함께 비워 몰린 푸시를 빨리 보내요.",
          "워커 보안 그룹: 나가는 443 허용.",
        ),
        [E("push-1", "rds")]: edgeText(
          "푸시 워커 #1 이 받는 사람의 기기 토큰을 회원 DB 에서 읽어요.",
          "MySQL(TCP 3306). RDS 엔드포인트로 접속해요.",
          "알림을 보낼 휴대폰 주소(기기 토큰)는 회원 DB 에만 있어요.",
          "RDS 보안 그룹: 워커 보안 그룹 → 3306 허용.",
        ),
        [E("push-2", "rds")]: edgeText(
          "푸시 워커 #2 가 기기 토큰을 읽고, 더는 없는 기기의 토큰을 지워요.",
          "MySQL(TCP 3306). 같은 엔드포인트로 접속해요.",
          "기기 토큰을 최신으로 유지해 헛걸음을 줄여요.",
          "RDS 보안 그룹: 워커 보안 그룹 → 3306 허용.",
        ),
      },
    },

    // ── 9. NAT 를 거쳐 FCM·APNs 푸시 ───────────────────────────
    {
      id: "push",
      goal: "NAT 를 거쳐 FCM·APNs 푸시",
      example: "NAT 를 거쳐 FCM·APNs 로 푸시 알림을 보내 줘",
      keywords: [["fcm", "apns", "nat", "firebase", "파이어베이스", "에프씨엠", "푸시 알림", "푸시알림", "push notification", "알림 서비스", "오프라인"]],
      commands: [
        assume("external", "푸시 알림(FCM·APNs)"),
        group("ext", "external_service", "푸시 알림 서비스"),
        node("nat", "nat", "NAT 게이트웨이", "pub", "AZ 마다 1개", managed()),
        node("fcm", "external_api", "FCM", "ext", "Android 푸시", { integration: "FCM HTTP v1 API(HTTPS 443, 서비스 계정 OAuth 2.0)" }),
        node("apns", "external_api", "APNs", "ext", "iOS 푸시", { integration: "APNs HTTP/2 API(HTTPS 443, 토큰 인증 키)" }),
        edge("push-1", "nat", "request", "HTTPS 443"),
        edge("push-2", "nat", "request", "HTTPS 443"),
        edge("nat", "fcm", "request", "HTTPS 443"),
        edge("nat", "apns", "request", "HTTP/2 443"),
        edge("fcm", "mobile", "async", "푸시(기기 상시 연결)"),
        edge("apns", "mobile", "async", "푸시(기기 상시 연결)"),
      ],
      say: "푸시 워커가 NAT 게이트웨이를 거쳐 Android 는 FCM, iOS 는 APNs 에 알림을 맡겨요. 휴대폰까지는 OS 가 FCM·APNs 와 늘 열어 두는 연결로 전해져, 앱이 꺼져 있어도 알림이 떠요.",
      notes: [
        { kind: "link", text: "워커 → NAT → 인터넷 게이트웨이 → FCM·APNs 로 나가요. 모두 HTTPS 443 이고, 기기 토큰과 우리 서버 인증(서비스 계정·인증 키)을 함께 보내요." },
        { kind: "caution", text: "NAT 게이트웨이는 한 AZ 안에서만 이중화돼요. 그림은 하나지만 AZ 마다 하나씩 둬야 한 AZ 가 멈춰도 푸시가 나가요." },
        { kind: "flow", text: "푸시는 도착을 보장하지 않아 '새 메시지' 알림만 맡겨요. 앱을 열면 다시 연결해 마지막 순번 뒤의 메시지를 받아 와요." },
      ],
      miss: "이번 단계는 휴대폰까지 알림을 보내는 길이에요. 'NAT 를 거쳐 FCM·APNs 로 푸시 알림을 보내 줘'처럼 말해 보세요.",
      explains: {
        [G("ext")]: groupText(
          "우리가 운영하지 않는 푸시 알림 서비스를 모아 둔 영역이에요. Android 는 구글의 FCM, iOS 는 애플의 APNs 가 휴대폰까지 알림을 전해요.",
          "푸시 워커의 요청이 NAT 게이트웨이를 거쳐 HTTPS 443 으로 들어오고, 각 서비스가 기기에 알림을 내려보내요.",
          ["휴대폰 알림은 FCM·APNs 에 맡긴다", "앱이 꺼져 있어도 OS 가 늘 열어 둔 연결로 알림을 받는다", "앱이 스스로 서버와 연결을 계속 유지한다", "도착 시점과 도착 여부를 우리가 보장할 수 없다"],
        ),
        [N("nat")]: nodeText(
          "프라이빗 서브넷의 워커가 인터넷에 나갈 때 출발 주소를 자기 공인 IP(탄력적 IP)로 바꿔 내보내요. 밖에서 먼저 거는 연결은 받지 않아요. 실제로는 AZ 마다 하나씩 둬요.",
          ["워커는 NAT 게이트웨이로만 밖에 나간다", "워커에 공인 IP 를 주지 않고도 FCM·APNs 를 부를 수 있다", "워커를 공개 서브넷에 두고 공인 IP 를 준다", "목적지를 거르지 않고 처리량만큼 요금이 든다"],
        ),
        [N("fcm")]: nodeText(
          "Android 앱의 푸시 알림을 휴대폰까지 전하는 구글의 서비스예요. 워커가 기기 토큰과 알림을 HTTPS 로 보내면 FCM 이 기기로 내려보내요.",
          ["Android 알림은 FCM 으로 보낸다", "Android 기기는 FCM 연결을 늘 열어 두어 앱이 꺼져도 알림이 간다", "iOS 도 FCM 하나로 보낸다(FCM 이 APNs 로 넘김)", "서비스 계정 키를 관리해야 하고 FCM 장애에 영향을 받는다"],
          { term: "FCM", definition: "FCM(Firebase Cloud Messaging)은 구글이 제공하는 푸시 알림 전달 서비스로, 서버가 보낸 알림을 Android·iOS·웹 기기에 전해 줍니다." },
        ),
        [N("apns")]: nodeText(
          "iOS 앱의 푸시 알림을 iPhone 까지 전하는 애플의 서비스예요. 워커가 인증 키로 서명한 토큰과 기기 토큰을 HTTP/2 로 보내면 APNs 가 기기로 내려보내요.",
          ["iOS 알림은 APNs 에 바로 보낸다", "iOS 는 뒤로 간 앱의 연결을 곧 멈춰, 꺼진 앱에 알리려면 APNs 를 거쳐야 한다", "FCM 을 거쳐 APNs 로 보낸다", "애플 인증 키를 관리하고 알림 크기 제한(4KB)을 지켜야 한다"],
          { term: "APNs", definition: "APNs(Apple Push Notification service)는 애플이 운영하는 푸시 알림 전달 서비스로, 서버가 보낸 알림을 iPhone 같은 애플 기기에 전해 줍니다." },
        ),
        [E("push-1", "nat")]: edgeText(
          "푸시 워커 #1 이 FCM·APNs 로 가는 요청을 NAT 게이트웨이로 보내요.",
          "HTTPS(TCP 443). 앱 서브넷 경로 표의 기본 경로(0.0.0.0/0)가 NAT 를 가리켜요.",
          "공인 IP 가 없는 워커가 인터넷에 나가는 길이에요.",
          "워커 보안 그룹: 나가는 443 허용.",
        ),
        [E("push-2", "nat")]: edgeText(
          "푸시 워커 #2 가 FCM·APNs 로 가는 요청을 NAT 게이트웨이로 보내요.",
          "HTTPS(TCP 443). 실제로는 같은 AZ(2c)의 NAT 를 쓰게 경로 표를 나눠요.",
          "AZ 하나가 멈춰도 다른 AZ 의 워커가 밖으로 나갈 수 있게 해요.",
          "워커 보안 그룹: 나가는 443 허용.",
        ),
        [E("nat", "fcm")]: edgeText(
          "알림 요청이 인터넷을 지나 FCM 에 닿고, 접수 결과가 돌아와요.",
          "HTTPS(TCP 443) REST API. 서비스 계정으로 받은 OAuth 2.0 토큰을 붙여요.",
          "Android 기기에 알림을 전할 수 있는 곳은 FCM 이에요.",
          "NAT 게이트웨이에는 보안 그룹이 없어요. 나가는 것은 워커 보안 그룹이 정해요.",
        ),
        [E("nat", "apns")]: edgeText(
          "알림 요청이 인터넷을 지나 APNs 에 닿고, 접수 결과가 돌아와요.",
          "HTTP/2(TCP 443). 인증 키로 서명한 토큰(JWT)을 붙여요.",
          "iOS 기기에 알림을 전할 수 있는 곳은 APNs 예요.",
          "워커 보안 그룹: 나가는 443 허용. APNs 가 '없는 기기'라고 답하면 토큰을 지워요.",
        ),
        [E("fcm", "mobile")]: edgeText(
          "FCM 이 Android 휴대폰에 알림을 내려보내요. 앱이 꺼져 있어도 알림이 떠요.",
          "기기가 FCM 과 늘 열어 둔 연결로 받아요. 우리 서버가 휴대폰에 직접 연결하지 않아요.",
          "OS 가 연결 하나로 모든 앱의 알림을 받아 배터리를 아껴요.",
          "휴대폰 쪽 연결이라 우리 VPC·보안 그룹을 지나지 않아요.",
        ),
        [E("apns", "mobile")]: edgeText(
          "APNs 가 iPhone 에 알림을 내려보내요.",
          "기기가 APNs 와 늘 열어 둔 연결로 받아요.",
          "iOS 에서 꺼진 앱에 알릴 수 있는 길이에요.",
          "휴대폰 쪽 연결이라 우리 VPC·보안 그룹을 지나지 않아요.",
        ),
      },
    },

    // ── 10. CloudWatch 모니터링 ────────────────────────────────
    {
      id: "ops",
      goal: "CloudWatch 모니터링",
      example: "CloudWatch 로 연결 수와 지표를 지켜보게 해 줘",
      keywords: [["cloudwatch", "클라우드워치", "모니터링", "monitoring", "지표", "메트릭", "metric", "알람", "감시", "로그 수집", "로그를", "logs"]],
      commands: [
        node("operator", "admin_user", "운영자", null),
        node("cw", "monitoring", "CloudWatch", "region", "지표·로그·알람", { ...managed(), sw: "Amazon CloudWatch", version: NO_VERSION }),
        edge("vpc", "cw", "aux", "지표·로그"),
        edge("cw", "operator", "aux", "알람"),
      ],
      say: "CloudWatch 를 붙여 ALB 연결 수, 채팅 서버당 연결 수, DynamoDB 쓰기, 푸시 대기열에 쌓인 양을 한곳에서 보게 했어요. 기준을 넘으면 운영자에게 알람이 가요.",
      notes: [
        { kind: "flow", text: "ALB·DynamoDB·SQS 지표는 설치 없이 모여요. 서버당 연결 수와 앱 로그는 채팅 서버가 에이전트로 직접 올려요." },
        { kind: "caution", text: "푸시 대기열에서 가장 오래된 메시지의 나이가 늘면 워커가 밀린 거예요. 알람을 걸어 두고 워커를 늘려요." },
        { kind: "net", text: "서버의 에이전트는 CloudWatch 인터페이스 엔드포인트나 NAT 를 거쳐 HTTPS 로 보내요." },
      ],
      miss: "이번 단계는 모니터링이에요. 'CloudWatch 로 연결 수와 지표를 지켜보게 해 줘'처럼 말해 보세요.",
      explains: {
        [N("operator")]: nodeText(
          "메신저를 운영하는 담당자예요. 연결 수·저장 지연·푸시 밀림 알람을 받아 서버를 늘리거나 장애에 대응해요.",
          ["알람은 운영자에게 메일·문자로 보낸다", "몰림이나 장애를 사람이 바로 알아야 대응한다", "대시보드를 사람이 늘 지켜본다", "기준을 다듬지 않으면 알람이 너무 많아 무뎌진다"],
        ),
        [N("cw")]: nodeText(
          "AWS 자원의 지표와 로그를 모아 그래프로 보여 주고, 기준을 넘으면 알람을 보내는 관리형 감시 서비스예요.",
          ["감시와 로그는 CloudWatch 로 모은다", "관리형 서비스 지표가 저절로 모이고 감시 서버를 운영할 필요가 없다", "EC2 에 Prometheus·Grafana·ELK 를 직접 운영한다", "로그 저장량과 지표 수만큼 요금이 들어 보관 기간을 정해야 한다"],
        ),
        [E("vpc", "cw")]: edgeText(
          "VPC 안 서버·ALB·캐시·DB 의 지표와 앱 로그가 CloudWatch 로 가요.",
          "관리형 서비스는 자동으로, EC2 는 CloudWatch 에이전트가 HTTPS(443)로 보내요.",
          "연결 몰림과 장애를 한 화면에서 보려고요.",
          "서버 보안 그룹: 나가는 443 허용(NAT 나 VPC 엔드포인트를 거쳐요).",
        ),
        [E("cw", "operator")]: edgeText(
          "기준을 넘은 알람이 운영자에게 가요.",
          "CloudWatch 알람이 SNS 로 메일·문자를 보내요.",
          "연결 몰림이나 푸시 밀림을 사람이 바로 알아야 대응해요.",
          "AWS 안에서 보내는 알림이라 따로 열 것이 없어요.",
        ),
      },
    },

    // ── 11. 1:1 메시지·오프라인 푸시 흐름 ──────────────────────
    {
      id: "flows",
      goal: "1:1 메시지·오프라인 푸시 흐름",
      example: "1:1 메시지와 오프라인 푸시 흐름을 정리해 줘",
      keywords: [["흐름", "flow", "경로", "과정", "시나리오"]],
      commands: [
        flow("direct-message", "1:1 메시지 보내기", "user", "휴대폰 사용자가 PC 로 접속 중인 친구에게 메시지를 보낸다.", "메시지를 저장하고, 친구의 PC 에 바로 보여 준다.", [
          ["mobile", "alb", "메시지 전송", "보내는 사람 앱이 열어 둔 WebSocket 으로 메시지를 보낸다."],
          ["alb", "chat-1", "연결된 서버", "그 연결을 쥔 채팅 서버 #1 이 메시지를 받는다."],
          ["chat-1", "ddb", "저장", "대화방 번호와 순번으로 DynamoDB 에 먼저 저장하고, 보낸 사람에게 '보냄'을 알린다."],
          ["chat-1", "presence", "접속 확인", "받는 사람이 어느 채팅 서버에 연결돼 있는지 찾는다(#2)."],
          ["chat-1", "pubsub", "발행", "채팅 서버 #2 의 채널에 메시지를 발행한다."],
          ["pubsub", "chat-2", "전달", "그 채널을 구독하던 채팅 서버 #2 가 메시지를 받는다.", true],
          ["chat-2", "alb", "내려보냄", "채팅 서버 #2 가 받는 사람의 WebSocket 연결로 메시지를 내려보낸다.", true],
          ["alb", "user", "도착", "친구의 PC 화면에 메시지가 바로 나타난다.", true],
        ]),
        flow("offline-push", "오프라인 사용자 푸시", "user", "PC 사용자가 앱을 닫아 둔 친구에게 메시지를 보낸다.", "친구 휴대폰에 알림이 뜨고, 앱을 열면 놓친 메시지를 받아 온다.", [
          ["user", "alb", "메시지 전송", "PC 메신저가 WebSocket 으로 메시지를 보낸다."],
          ["alb", "chat-2", "연결된 서버", "그 연결을 쥔 채팅 서버 #2 가 받는다."],
          ["chat-2", "ddb", "저장", "메시지를 DynamoDB 에 먼저 저장한다."],
          ["chat-2", "presence", "연결 없음", "받는 사람의 접속 기록이 없어 오프라인으로 본다."],
          ["chat-2", "sqs", "푸시 요청", "'푸시 보내기' 일을 SQS 대기열에 넣는다."],
          ["sqs", "push-1", "꺼내기", "푸시 워커 #1 이 대기열에서 일을 받아 온다."],
          ["push-1", "rds", "기기 토큰", "회원 DB 에서 받는 사람 휴대폰의 기기 토큰을 읽는다."],
          ["push-1", "nat", "밖으로", "NAT 게이트웨이를 거쳐 인터넷으로 나간다."],
          ["nat", "fcm", "FCM 요청", "FCM 에 기기 토큰과 '새 메시지' 알림을 보낸다."],
          ["fcm", "mobile", "알림 도착", "FCM 이 휴대폰에 알림을 띄운다."],
          ["mobile", "alb", "다시 연결", "친구가 알림을 눌러 앱을 열면 WebSocket 을 다시 연다."],
          ["alb", "chat-1", "새 연결", "이번에는 채팅 서버 #1 이 연결을 받는다."],
          ["chat-1", "ddb", "놓친 메시지", "마지막으로 받은 순번 뒤의 메시지를 DynamoDB 에서 읽어 내려보낸다."],
        ]),
      ],
      say: "1:1 메시지와 오프라인 푸시 두 흐름을 정리했어요. 흐름을 재생하면 메시지가 저장되고, 받는 사람의 서버로 넘어가거나 푸시로 바뀌는 순서를 볼 수 있어요.",
      notes: [
        { kind: "flow", text: "보내는 채팅 서버는 저장 → 접속 상태 확인 → 발행 순서로 일해요. 받는 사람의 연결이 없으면 발행 대신 푸시 대기열로 보내요." },
        { kind: "link", text: "VPC 밖 바깥 회사로 나가는 것은 푸시(FCM·APNs)뿐이에요. 실시간 전달은 채팅 서버와 중계 캐시 사이에서 끝나요." },
        { kind: "caution", text: "흐름은 서버 한 대씩만 그렸어요. 실제로는 사람마다 연결이 붙은 채팅 서버가 다르고, 다시 연결하면 바뀔 수도 있어요." },
      ],
      miss: "마지막 단계는 흐름 정리예요. '1:1 메시지와 오프라인 푸시 흐름을 정리해 줘'처럼 말해 보세요.",
      explains: {},
    },
  ],
};
