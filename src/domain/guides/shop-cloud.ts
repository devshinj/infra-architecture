// 대형 쇼핑몰 — 클라우드(AWS 서울 리전). 바탕은 samples/aws-shop.ts.
// 가상 값: VPC 10.0.0.0/16. 서브넷은 AZ 마다 하나씩이다(공개 10.0.0.0/24·10.0.1.0/24, 앱 10.0.10.0/24·10.0.11.0/24, 데이터 10.0.20.0/24·10.0.21.0/24).
// 빈 영역이 남지 않게 서브넷은 그 안에 처음 무언가를 놓는 단계에서 만든다(1단계는 리전과 입구, 2단계에 VPC·공개 서브넷).
import { assume, edge, flow, group, managed, node } from "../samples/dsl";

import { countConflicts, E, edgeText, G, groupText, N, nodeText } from "./authoring";
import type { GuideVariant } from "./types";

const ec2 = (hostname: string, ip: string, az: "2a" | "2c") => ({
  sw: "Spring Boot 3.5", os: "Amazon Linux 2023", cpu: "2 vCPU (m6i.large)", ram: "8GiB", disk: "30GiB gp3", hostname, ip, az,
});
const NO_VERSION = "관리형(버전 없음)";

const ASG_DEF = {
  term: "Auto Scaling 그룹",
  definition: "Auto Scaling 그룹은 같은 설정의 EC2 서버를 정한 대수만큼 유지하고 부하에 따라 늘리거나 줄이는 AWS 의 서버 묶음입니다.",
};

export const SHOP_CLOUD: GuideVariant = {
  environment: "클라우드(AWS)",
  outro:
    "서울 리전의 VPC 를 공개·앱·데이터 서브넷으로 나누고, 서버는 두 AZ 의 Auto Scaling 그룹으로, DB·캐시는 Multi-AZ 로 이중화한 쇼핑몰을 만들었어요. 결제 승인은 NAT 를 거쳐 PG사로 나가고, 세일 때는 CloudFront·ElastiCache·SQS 가 몰린 요청을 나눠 받아요.",
  otherEnv: [
    { from: "ALB", to: "L4 두 대(VIP)" },
    { from: "EC2 Auto Scaling 그룹(두 AZ)", to: "WEB·WAS 서버 두 대" },
    { from: "RDS Multi-AZ(엔드포인트)", to: "DB Active-Standby(VIP)" },
    { from: "ElastiCache(Multi-AZ)", to: "Redis + Sentinel" },
    { from: "S3", to: "NAS" },
    { from: "WAF·보안 그룹", to: "외부 방화벽" },
    { from: "SQS", to: "사내 큐(RabbitMQ)" },
    { from: "NAT 게이트웨이", to: "아웃바운드 프록시" },
    { from: "Client VPN", to: "사내 전용 회선(운영자)" },
    { from: "CloudWatch", to: "Zabbix·ELK" },
  ],
  steps: [
    // ── 1. 고객 진입: CDN·WAF ──────────────────────────────────
    {
      id: "entry",
      goal: "고객 진입: CDN·WAF",
      example: "고객이 CloudFront 와 WAF 를 거쳐 들어오게 해 줘",
      keywords: [
        ["cloudfront", "클라우드프론트", "클라우드 프런트", "cdn", "waf", "웹방화벽", "웹 방화벽"],
        // "CloudFront 로 내보내 줘"(S3 단계)는 받지 않게, CloudFront 낱말만으로는 둘째 묶음을 채우지 않는다.
        ["고객", "사용자", "들어", "진입", "입구", "접속", "거쳐", "cloudfront와", "cloudfront랑", "cloudfront를", "cloudfront 넣", "클라우드프론트와", "클라우드프론트를", "cdn과", "cdn을", "cdn 넣", "waf와", "waf를", "waf 넣"],
      ],
      commands: [
        assume("scale", "회원 300만 명, 세일 때 평소의 10배 접속"),
        group("region", "cloud_region", "AWS 서울 리전"),
        node("user", "client_web", "고객 브라우저", null),
        node("mobile", "client_mobile", "고객 앱", null),
        node("cdn", "cdn", "CloudFront", null, "CDN", { ...managed(), sw: "Amazon CloudFront" }),
        node("waf", "waf", "AWS WAF", "region", "웹 방화벽", managed()),
        edge("user", "cdn", "request", "HTTPS 443"),
        edge("mobile", "cdn", "request", "HTTPS 443"),
        edge("cdn", "waf", "request", "HTTPS 443"),
      ],
      say: "고객이 먼저 닿는 CloudFront 와 AWS WAF 를 놓았어요. CloudFront 는 고객과 가까운 엣지에서 요청을 받고, 캐시에 없는 요청만 서울 리전으로 보내요. WAF 는 그 요청에서 공격 패턴을 걸러요.",
      notes: [
        { kind: "net", text: "CloudFront 는 특정 리전이 아니라 AWS 의 전 세계 엣지에서 돌아요. 그래서 리전 밖에 그렸어요." },
        { kind: "flow", text: "고객 → CloudFront → WAF → ALB 순서로 들어와요. 앱도 브라우저와 같은 입구를 써요." },
        { kind: "caution", text: "이 가이드는 WAF 를 ALB 에 붙여요. CloudFront 에 붙이면 캐시에서 바로 나가는 요청까지 검사할 수 있어요." },
      ],
      miss: "이번 단계는 고객이 들어오는 입구예요. 'CloudFront 와 WAF 를 거쳐 들어오게 해 줘'처럼 말해 보세요.",
      explains: {
        [G("region")]: groupText(
          "쇼핑몰 서버와 데이터를 두는 AWS 서울 리전(ap-northeast-2)이에요. 리전 안에는 서로 떨어진 데이터센터 묶음(AZ)이 여러 곳 있어요.",
          "CloudFront 를 거친 요청이 들어오고, NAT 게이트웨이를 거쳐 PG사로 나가요. 운영자는 Client VPN 으로 들어와요.",
          ["고객이 국내라 서울 리전에 둔다", "고객과 가까워 응답이 빠르고, 국내 저장 요구에도 맞추기 쉽다", "도쿄 같은 다른 리전에 둔다", "서울 리전 전체가 멈추는 일까지는 대비하지 않는다"],
        ),
        [N("user")]: nodeText(
          "PC 브라우저로 상품을 보고 주문하는 고객이에요. 쇼핑몰 주소로 접속하면 가까운 CloudFront 엣지로 연결돼요.",
          ["고객 요청은 HTTPS 로만 받는다", "로그인·주문 정보가 오가므로 암호화가 필요하다", "HTTP 도 그대로 받는다", "인증서를 발급해 CloudFront 에 붙여야 한다"],
        ),
        [N("mobile")]: nodeText(
          "휴대폰 앱으로 쇼핑하는 고객이에요. 앱의 API 요청도 브라우저와 같은 CloudFront 주소로 들어와요.",
          ["앱 전용 입구를 따로 두지 않고 같은 입구를 쓴다", "WAF 규칙과 서버를 한 벌로 관리할 수 있다", "앱 전용 ALB·API 서버를 따로 둔다", "앱과 웹의 부하가 같은 서버에 섞인다"],
        ),
        [N("cdn")]: nodeText(
          "고객과 가까운 엣지에서 요청을 받는 CDN 이에요. 상품 이미지는 캐시해 바로 돌려주고, 주문 같은 API 요청은 캐시하지 않고 서울의 ALB 로 넘겨요.",
          ["모든 고객 요청을 CloudFront 로 먼저 받는다", "이미지 부하를 엣지가 받아 세일 때 서버로 오는 요청이 준다", "고객이 ALB 로 바로 접속한다", "캐시 규칙을 잘못 두면 바뀐 가격이 늦게 보일 수 있다"],
        ),
        [N("waf")]: nodeText(
          "ALB 에 붙어 들어오는 요청을 검사하는 웹 방화벽이에요. 따로 지나는 장비는 아니에요. SQL 인젝션 같은 공격과 요청을 너무 많이 보내는 IP 를 막아요.",
          ["WAF 를 ALB 에 붙이고 관리형 규칙을 쓴다", "AWS 가 관리하는 공격 규칙과 속도 제한으로 바로 막을 수 있다", "CloudFront 에 붙여 엣지에서 막는다", "요청 수만큼 요금이 들고, 정상 요청을 막지 않게 규칙을 다듬어야 한다"],
        ),
        [E("user", "cdn")]: edgeText(
          "고객 브라우저의 페이지·이미지·API 요청이 CloudFront 로 가요.",
          "HTTPS(TCP 443). 고객과 가까운 엣지가 받아요.",
          "모든 고객 요청을 한 입구로 받아 캐시와 보호를 함께 하려고요.",
          "CloudFront 는 HTTPS 만 받게 하고, HTTP 로 오면 HTTPS 로 돌려보내요.",
        ),
        [E("mobile", "cdn")]: edgeText(
          "고객 앱의 API 요청이 CloudFront 로 가요.",
          "HTTPS(TCP 443). 브라우저와 같은 주소를 써요.",
          "앱도 같은 입구를 써 보안 설정을 한 벌로 관리해요.",
          "CloudFront 는 HTTPS 만 받아요.",
        ),
        [E("cdn", "waf")]: edgeText(
          "캐시에 없는 요청(주로 API)이 서울 리전으로 가요. ALB 에 붙은 WAF 가 먼저 검사해요.",
          "HTTPS(TCP 443). CloudFront 가 원본(ALB)에 새로 연결해요.",
          "주문·로그인처럼 서버가 답해야 하는 요청을 원본으로 보내는 길이에요.",
          "ALB 보안 그룹은 CloudFront 출발 주소 목록(관리형 접두사 목록)만 허용해요.",
        ),
      },
    },

    // ── 2. VPC·공개 서브넷과 ALB ───────────────────────────────
    {
      id: "alb",
      goal: "VPC·공개 서브넷과 ALB",
      example: "VPC 를 만들고 WAF 뒤에 ALB 를 둬 줘",
      keywords: [["alb", "로드밸런서", "로드 밸런서", "load balancer", "elb", "vpc", "공개 서브넷", "퍼블릭 서브넷"]],
      commands: [
        group("vpc", "vpc", "쇼핑몰 VPC", "region"),
        group("pub", "subnet_public", "공개 서브넷", "vpc"),
        node("alb", "lb_l7", "ALB", "pub", "L7 로드밸런서", { ...managed(), sw: "AWS ALB", port: "443", rules: "443 리스너 → API 대상 그룹(8080), 헬스 체크 /health" }),
        edge("waf", "alb", "request", "HTTPS 443"),
      ],
      say: "서울 리전에 쇼핑몰 VPC 를 만들고, 인터넷과 닿는 공개 서브넷에 ALB 를 뒀어요. WAF 검사를 통과한 요청을 ALB 가 받아 뒤의 API 서버들에 나눠요. ALB 는 AWS 가 여러 AZ 에 이중화해 운영해요.",
      notes: [
        { kind: "net", text: "공개 서브넷은 인터넷 게이트웨이로 가는 경로가 있는 서브넷이에요. 인터넷과 맞닿는 ALB·NAT 만 여기 둬요." },
        { kind: "caution", text: "서브넷은 AZ 하나에 속해요. 그림의 공개 서브넷은 실제로 2a·2c 에 하나씩, 두 개예요." },
        { kind: "flow", text: "온프레미스의 L4 자리예요. 다만 ALB 는 HTTPS 를 풀고 주소(경로)를 보고 나누는 L7 이에요." },
      ],
      miss: "이번 단계는 VPC 와 그 안의 ALB 예요. 'VPC 를 만들고 WAF 뒤에 ALB 를 둬 줘'처럼 말해 보세요.",
      explains: {
        [G("vpc")]: groupText(
          "쇼핑몰만 쓰는 사설 네트워크(10.0.0.0/16)예요. 이 안을 공개·앱·데이터 서브넷으로 나눠 자원을 둬요.",
          "인터넷 게이트웨이를 통해 ALB 가 요청을 받고 NAT 가 밖으로 나가요. 운영자는 Client VPN 으로 들어와요.",
          ["VPC 하나에 서브넷 세 층을 둔다", "계층마다 경로와 보안 그룹을 다르게 줄 수 있다", "공개 서브넷 하나에 모두 둔다", "서브넷과 경로 표를 계층·AZ 마다 관리해야 한다"],
        ),
        [G("pub")]: groupText(
          "인터넷 게이트웨이로 가는 경로가 있는 서브넷이에요. 인터넷과 직접 말해야 하는 ALB 와 NAT 게이트웨이만 둬요.",
          "CloudFront 에서 443 이 ALB 로 들어오고, 앱 서브넷으로 8080 이 나가요. 앱 서브넷의 바깥 요청은 NAT 를 거쳐 나가요.",
          ["서버는 공개 서브넷에 두지 않는다", "서버에 공인 IP 가 없어 인터넷에서 바로 닿지 않는다", "서버도 공개 서브넷에 두고 보안 그룹으로만 막는다", "서버가 밖으로 나가려면 NAT 게이트웨이를 거쳐야 한다"],
        ),
        [N("alb")]: nodeText(
          "WAF 를 거친 요청을 받아 API 서버들에 나눠 주는 L7 로드밸런서예요. HTTPS 를 풀어 경로를 보고, 헬스 체크로 멈춘 서버를 대상에서 빼요.",
          ["관리형 ALB 로 요청을 나눈다", "AWS 가 여러 AZ 에 이중화하고 늘려 줘 장비 이중화가 필요 없다", "EC2 에 Nginx·HAProxy 를 직접 둔다", "시간과 처리량만큼 요금이 들고 세부 설정은 AWS 가 정한 만큼만 된다"],
        ),
        [E("waf", "alb")]: edgeText(
          "WAF 검사를 통과한 요청이 ALB 로 넘어가요.",
          "HTTPS(TCP 443). ALB 가 인증서로 암호를 풀어요. WAF 는 ALB 에 붙어 같은 자리에서 검사해요.",
          "통과한 요청만 서버 쪽으로 나누기 위해서예요.",
          "ALB 보안 그룹: CloudFront 접두사 목록 → 443 허용.",
        ),
      },
    },

    // ── 3. API 두 대를 두 AZ 에(Auto Scaling) ──────────────────
    {
      id: "api",
      goal: "API 두 대를 두 AZ 에(Auto Scaling)",
      example: "API 서버 두 대를 AZ 두 곳에 나눠 넣어 줘",
      keywords: [["api", "ec2", "앱서버", "앱 서버", "애플리케이션 서버", "오토스케일링", "오토 스케일링", "auto scaling", "asg", "was", "백엔드", "backend"]],
      conflicts: countConflicts(
        "세 대도 틀린 구성은 아니지만, 이 가이드는 API 서버를 두 대로 맞춰요. 'API 서버 두 대를 AZ 두 곳에'로 말해 주세요.",
        "한 대나 한 AZ 에만 두면 그 서버나 AZ 가 멈출 때 쇼핑몰도 멈춰요. 이번에는 두 대를 두 AZ 에 나눠요.",
      ),
      commands: [
        assume("redundancy", "서버는 두 AZ 에 나눈 Auto Scaling, DB·캐시는 Multi-AZ"),
        group("app", "subnet_private", "앱 서브넷", "vpc"),
        group("api-asg", "redundancy_group", "API Auto Scaling 그룹", "app"),
        node("api-1", "app_server", "API #1", "api-asg", "Spring Boot 3.5", ec2("shop-api-2a", "10.0.10.21", "2a")),
        node("api-2", "app_server", "API #2", "api-asg", "Spring Boot 3.5", ec2("shop-api-2c", "10.0.11.21", "2c")),
        edge("alb", "api-1", "request", "HTTP 8080"),
        edge("alb", "api-2", "request", "HTTP 8080"),
      ],
      say: "앱 서브넷에 API 서버 두 대를 AZ 2a·2c 에 하나씩 두고 Auto Scaling 그룹으로 묶었어요. 한 AZ 가 통째로 멈춰도 다른 AZ 의 서버가 받고, 멈춘 서버는 Auto Scaling 이 새로 띄워요.",
      notes: [
        { kind: "net", text: "앱 서브넷은 인터넷에서 먼저 들어올 수 없는 프라이빗 서브넷이에요. 요청은 ALB 를 거쳐서만 와요." },
        { kind: "flow", text: "세일 때 CPU 가 오르면 Auto Scaling 이 서버를 늘리고, ALB 가 새 서버에도 요청을 나눠요." },
        { kind: "caution", text: "서버는 언제든 바뀌어요. 세션·파일을 서버 디스크에 두지 말고 캐시·S3 에 둬야 해요." },
      ],
      miss: "이번 단계는 API 서버 두 대를 두 AZ 에 나눠 두는 거예요. 'API 서버 두 대를 AZ 두 곳에 나눠 넣어 줘'처럼 말해 보세요.",
      explains: {
        [G("app")]: groupText(
          "API·관리자 앱·주문 처리기 서버를 두는 프라이빗 서브넷이에요. 서버에 공인 IP 가 없어 인터넷에서 바로 닿지 않아요.",
          "ALB 에서 8080 이 들어오고, 데이터 서브넷으로 3306·6379 가, NAT 로 바깥 요청이 나가요.",
          ["서버는 프라이빗 서브넷에 둔다", "공격자가 서버에 바로 닿을 길을 없앤다", "공개 서브넷에 두고 보안 그룹으로 막는다", "밖으로 나갈 때 NAT 게이트웨이 요금이 든다"],
        ),
        [G("api-asg")]: groupText(
          "API 서버를 최소 2대에서 최대 10대로 유지하는 묶음이에요. 두 AZ 에 고르게 두고, 멈춘 서버는 새로 띄워 ALB 대상 그룹에 다시 넣어요.",
          "ALB 에서 8080 이 들어오고, RDS·ElastiCache·SQS 와 NAT(PG사)로 나가요.",
          ["API 는 두 AZ 에 걸친 Auto Scaling 그룹으로 둔다", "AZ 하나가 멈춰도 이어지고, 몰리면 자동으로 늘어난다", "EC2 두 대를 고정으로 둔다", "서버가 언제든 바뀌어도 되게 앱을 상태 없이 만들어야 한다"],
          ASG_DEF,
        ),
        [N("api-1")]: nodeText(
          "상품 조회·장바구니·주문·결제 승인을 처리하는 API 서버예요(AZ 2a). 캐시·DB 를 읽고 쓰고, PG사 승인은 NAT 를 거쳐 요청해요.",
          ["WEB·WAS 를 나누지 않고 API 서버 한 층으로 둔다", "TLS 는 ALB 가, 이미지는 CloudFront·S3 가 맡아 WEB 층이 할 일이 적다", "온프레미스처럼 WEB·WAS 를 나눈다", "API 서버가 이미지 밖의 모든 요청을 혼자 감당한다"],
        ),
        [N("api-2")]: nodeText(
          "API #1 과 같은 서버를 다른 AZ(2c)에 둔 짝이에요. ALB 가 두 대에 나눠 보내고, 2a 가 멈추면 이 서버가 받아요.",
          ["두 서버를 서로 다른 AZ 에 둔다", "AZ 하나의 전원·네트워크 장애를 함께 겪지 않는다", "같은 AZ 에 두 대를 둔다", "AZ 를 넘는 통신에 약간의 요금과 지연이 생긴다"],
        ),
        [E("alb", "api-1")]: edgeText(
          "ALB 가 고객 요청을 API #1(2a)로 보내요.",
          "HTTP(TCP 8080). 암호는 ALB 에서 풀었어요.",
          "대상 그룹에 든 서버들에 요청을 나누는 길이에요.",
          "API 보안 그룹: ALB 보안 그룹 → 8080 만 허용.",
        ),
        [E("alb", "api-2")]: edgeText(
          "ALB 가 고객 요청을 API #2(2c)로 보내요.",
          "HTTP(TCP 8080). 암호는 ALB 에서 풀었어요.",
          "두 AZ 의 서버에 나눠 보내 한쪽에 몰리지 않게 해요.",
          "API 보안 그룹: ALB 보안 그룹 → 8080 만 허용.",
        ),
      },
    },

    // ── 4. RDS Multi-AZ ────────────────────────────────────────
    {
      id: "rds",
      goal: "RDS Multi-AZ",
      example: "주문·회원 DB 는 RDS Multi-AZ 로 넣어 줘",
      keywords: [["rds", "db", "디비", "데이터베이스", "database", "mysql", "마이에스큐엘", "aurora", "오로라"]],
      commands: [
        group("data", "subnet_private", "데이터 서브넷", "vpc"),
        node("rds", "db_rdb", "RDS MySQL", "data", "주문·회원 · Multi-AZ", {
          ...managed("yes"), sw: "Amazon RDS", version: "MySQL 8.4", replication: "동기 복제(다른 AZ 대기 인스턴스)",
        }),
        edge("api-1", "rds", "request", "MySQL 3306"),
        edge("api-2", "rds", "request", "MySQL 3306"),
      ],
      say: "데이터 서브넷에 RDS MySQL 을 Multi-AZ 로 넣었어요. 주 DB 는 2a, 대기 DB 는 2c 에 있고 쓰기마다 동기로 복제해요. 주 DB 가 멈추면 AWS 가 대기 DB 로 넘기고 접속 주소(엔드포인트)는 그대로예요.",
      notes: [
        { kind: "net", text: "데이터 서브넷에는 밖으로 나가는 경로를 두지 않았어요(격리 서브넷). DB 는 VPC 안의 서버하고만 말해요." },
        { kind: "flow", text: "온프레미스의 VIP 대신, 엔드포인트(DNS 이름)가 대기 DB 를 가리키도록 바뀌어요. 넘어가는 데 보통 1~2분 걸려요." },
        { kind: "caution", text: "이 구성(Multi-AZ 인스턴스)의 대기 DB 는 읽기를 받지 않아요. 조회를 나누려면 읽기 전용 복제본을 따로 만들어요." },
      ],
      miss: "이번 단계는 주문·회원 DB 예요. 'DB 는 RDS Multi-AZ 로 넣어 줘'처럼 말해 보세요.",
      explains: {
        [G("data")]: groupText(
          "RDS·ElastiCache 를 두는 서브넷이에요. 경로 표에 NAT·인터넷 게이트웨이가 없어 VPC 밖으로 나가는 길이 아예 없어요.",
          "앱 서브넷의 서버에서 3306(RDS)·6379(ElastiCache)만 들어와요. 밖으로 나가는 통신은 없어요.",
          ["DB·캐시는 밖으로 나갈 길이 없는 서브넷에 둔다", "DB 가 털려도 데이터를 밖으로 바로 내보낼 길이 없다", "앱 서브넷에 함께 둔다", "서브넷과 경로 표가 하나 더 는다"],
        ),
        [N("rds")]: nodeText(
          "주문·회원·상품 원본 데이터를 저장하는 관리형 MySQL 이에요. AWS 가 백업·패치·장애 조치를 맡고, 우리는 엔드포인트 주소로 접속만 해요.",
          ["DB 는 RDS Multi-AZ 로 둔다", "다른 AZ 의 대기 DB 와 자동 장애 조치를 AWS 가 맡는다", "EC2 두 대에 MySQL 을 직접 설치해 복제한다", "대기 DB 몫의 요금이 더 들고, DB 서버 OS 에는 들어갈 수 없다"],
        ),
        [E("api-1", "rds")]: edgeText(
          "API #1 이 회원·주문 데이터를 읽고 써요.",
          "MySQL(TCP 3306). RDS 엔드포인트(DNS 이름)로 접속해요.",
          "원본 데이터는 RDS 에만 있어요.",
          "RDS 보안 그룹: API 보안 그룹 → 3306 만 허용.",
        ),
        [E("api-2", "rds")]: edgeText(
          "API #2 가 회원·주문 데이터를 읽고 써요.",
          "MySQL(TCP 3306). 같은 엔드포인트로 접속해요.",
          "두 AZ 의 서버가 같은 DB 를 봐야 어느 서버로 가도 같은 주문이 보여요.",
          "RDS 보안 그룹: API 보안 그룹 → 3306 만 허용.",
        ),
      },
    },

    // ── 5. ElastiCache ─────────────────────────────────────────
    {
      id: "cache",
      goal: "ElastiCache",
      example: "세션·상품 캐시로 ElastiCache 를 넣어 줘",
      keywords: [["elasticache", "엘라스티캐시", "캐시", "cache", "redis", "레디스", "세션"]],
      commands: [
        node("redis", "cache", "ElastiCache", "data", "Redis OSS · 세션·상품 캐시", {
          ...managed("yes"), sw: "Amazon ElastiCache", version: "Redis OSS 7.1", replication: "주 노드 + 다른 AZ 복제본(자동 장애 조치)",
        }),
        edge("api-1", "redis", "request", "Redis 6379"),
        edge("api-2", "redis", "request", "Redis 6379"),
      ],
      say: "데이터 서브넷에 ElastiCache(Redis)를 넣었어요. 로그인 세션과 자주 보는 상품 정보를 메모리에 두어, 세일 때 같은 상품 조회가 몰려도 RDS 까지 가지 않아요.",
      notes: [
        { kind: "flow", text: "API 는 먼저 캐시에서 찾고, 없을 때만 RDS 에서 읽어 캐시에 채워요(Cache-aside)." },
        { kind: "net", text: "주 노드와 복제본이 다른 AZ 에 있어요. 주 노드가 멈추면 AWS 가 복제본을 주 노드로 올리고, 접속 주소는 그대로예요." },
        { kind: "caution", text: "캐시는 원본이 아니에요. 가격·재고처럼 바로 맞아야 하는 값은 짧게 두거나 바뀔 때 캐시를 지워요." },
      ],
      miss: "이번 단계는 세션·상품 캐시예요. '세션·상품 캐시로 ElastiCache 를 넣어 줘'처럼 말해 보세요.",
      explains: {
        [N("redis")]: nodeText(
          "세션과 상품 캐시를 메모리에 두는 관리형 Redis 예요. 주 노드와 다른 AZ 의 복제본으로 이중화하고, 장애 조치는 AWS 가 해요.",
          ["세션을 서버가 아닌 ElastiCache 에 둔다", "Auto Scaling 으로 서버가 바뀌어도 로그인이 이어진다", "ALB 고정 세션(스티키)으로 같은 서버에 보낸다", "캐시 요금이 들고, 캐시가 멈추면 로그인이 풀릴 수 있다"],
        ),
        [E("api-1", "redis")]: edgeText(
          "API #1 이 세션을 확인하고 상품 정보를 캐시에서 찾아요.",
          "Redis 프로토콜(TCP 6379). 기본(primary) 엔드포인트로 접속해요.",
          "RDS 보다 훨씬 빨라 몰리는 조회를 여기서 받아요.",
          "ElastiCache 보안 그룹: API 보안 그룹 → 6379 만 허용.",
        ),
        [E("api-2", "redis")]: edgeText(
          "API #2 가 세션을 확인하고 상품 정보를 캐시에서 찾아요.",
          "Redis 프로토콜(TCP 6379). 같은 엔드포인트로 접속해요.",
          "두 서버가 같은 세션을 봐야 어느 서버로 가도 로그인이 이어져요.",
          "ElastiCache 보안 그룹: API 보안 그룹 → 6379 만 허용.",
        ),
      },
    },

    // ── 6. S3 상품 이미지 ──────────────────────────────────────
    {
      id: "s3",
      goal: "S3 상품 이미지",
      example: "상품 이미지는 S3 에 두고 CloudFront 로 내보내 줘",
      keywords: [["s3", "이미지", "버킷", "bucket", "오브젝트", "스토리지", "storage"]],
      commands: [
        node("s3", "object_storage", "S3", "region", "상품 이미지", { ...managed(), sw: "Amazon S3", replication: "리전 안 여러 AZ 에 자동 저장", version: NO_VERSION }),
        edge("cdn", "s3", "request", "이미지 HTTPS"),
      ],
      say: "상품 이미지를 S3 에 두고 CloudFront 가 꺼내 가게 했어요. 한 번 꺼낸 이미지는 엣지에 캐시돼, 세일 때 이미지 요청이 몰려도 서버와 S3 까지 오지 않아요.",
      notes: [
        { kind: "net", text: "S3 는 VPC 안이 아니라 리전에 있는 서비스예요. 그래서 VPC 밖, 리전 안에 그렸어요." },
        { kind: "flow", text: "고객 → CloudFront(캐시) → 캐시에 없을 때만 S3 로 가요. 이미지는 API 서버를 거치지 않아요." },
        { kind: "caution", text: "버킷은 공개하지 않아요. CloudFront 만 읽게 OAC(원본 접근 제어)로 막아 둬요." },
      ],
      miss: "이번 단계는 상품 이미지 저장이에요. '상품 이미지는 S3 에 두고 CloudFront 로 내보내 줘'처럼 말해 보세요.",
      explains: {
        [N("s3")]: nodeText(
          "상품 이미지 파일을 저장하는 오브젝트 스토리지예요. 리전 안 여러 AZ 에 자동으로 나눠 저장해 따로 이중화할 것이 없어요.",
          ["이미지는 S3 에 두고 CloudFront 로 내보낸다", "용량 걱정 없이 쌓고, 내보내는 부하는 CloudFront 가 받는다", "EC2 디스크나 EFS 에 두고 서버가 내보낸다", "저장량·요청 수만큼 요금이 들고, 바꾼 이미지는 캐시를 지워야 바로 보인다"],
        ),
        [E("cdn", "s3")]: edgeText(
          "엣지 캐시에 없는 상품 이미지를 S3 에서 가져와요.",
          "HTTPS(TCP 443). OAC 로 서명한 CloudFront 요청만 버킷이 받아요.",
          "이미지를 서버를 거치지 않고 바로 고객에게 주려고요.",
          "S3 버킷 정책: 이 CloudFront 배포에서 온 읽기만 허용해요.",
        ),
      },
    },

    // ── 7. NAT 와 PG 결제 연동 ─────────────────────────────────
    {
      id: "pg",
      goal: "NAT 와 PG 결제 연동",
      example: "NAT 를 거쳐 PG사 결제를 연동해 줘",
      keywords: [["pg", "결제", "payment", "페이먼트", "카드사", "nat"]],
      commands: [
        assume("external", "PG사 결제(카드 승인 API)"),
        group("ext", "external_service", "외부 결제사"),
        node("nat", "nat", "NAT 게이트웨이", "pub", "AZ 마다 1개", managed()),
        node("pg", "external_pg", "PG사", "ext", "결제 승인", { integration: "REST API(HTTPS), 결제창 연동" }),
        edge("user", "pg", "request", "결제창 HTTPS"),
        edge("mobile", "pg", "request", "결제창 HTTPS"),
        edge("api-1", "nat", "request", "HTTPS 443"),
        edge("api-2", "nat", "request", "HTTPS 443"),
        edge("nat", "pg", "request", "HTTPS 443"),
      ],
      say: "PG사 결제를 붙였어요. 카드 정보는 고객이 PG사 결제창에 직접 넣고, 승인은 API 서버가 요청해요. 프라이빗 서브넷의 API 는 공인 IP 가 없어 NAT 게이트웨이를 거쳐 PG사로 나가요.",
      notes: [
        { kind: "link", text: "승인 요청은 API → NAT 게이트웨이 → 인터넷 게이트웨이 → PG사로 나가요. API 보안 그룹의 나가는 규칙에 443 을 열어 둬요." },
        { kind: "caution", text: "PG사가 출구 IP 등록을 요구하면 NAT 게이트웨이의 탄력적 IP 를 알려 줘요. AZ 마다 NAT 를 두면 그 IP 를 모두 알려요." },
        { kind: "link", text: "PG사의 결제 결과 통보는 고객 요청처럼 CloudFront 로 들어와요. 서버에서 PG사 서명을 확인해 진짜 통보만 받아요." },
      ],
      miss: "이번 단계는 PG사 결제 연동이에요. 'NAT 를 거쳐 PG사 결제를 연동해 줘'처럼 말해 보세요.",
      explains: {
        [G("ext")]: groupText(
          "우리가 운영하지 않는 바깥 회사의 서비스를 모아 둔 영역이에요. 여기서는 카드 결제를 대신 처리하는 PG사가 있어요.",
          "고객이 결제창으로 직접 오고, API 는 NAT 게이트웨이를 거쳐 승인 API 를 불러요. 결과 통보는 쇼핑몰 입구로 보내요.",
          ["카드 결제는 PG사에 맡긴다", "카드사마다 따로 계약·연동하지 않고, 카드 정보 보관 부담이 준다", "카드사·VAN 과 직접 연동한다", "결제 건마다 수수료를 내고 PG사 장애에 영향을 받는다"],
        ),
        [N("nat")]: nodeText(
          "프라이빗 서브넷 서버가 인터넷에 나갈 때 출발 주소를 자기 공인 IP(탄력적 IP)로 바꿔 내보내요. 밖에서 먼저 거는 연결은 받지 않아요. 실제로는 AZ 마다 하나씩 둬요.",
          ["서버는 NAT 게이트웨이로만 밖에 나간다", "서버에 공인 IP 를 주지 않고도 PG사를 부를 수 있다", "API 서버를 공개 서브넷에 두고 공인 IP 를 준다", "시간·처리량 요금이 들고, AZ 마다 두면 그만큼 더 든다"],
        ),
        [N("pg")]: nodeText(
          "고객의 카드 결제를 받아 카드사 승인을 대신 처리하는 결제대행사예요. 쇼핑몰은 카드 번호를 받지 않고, 결제창 인증 결과로 승인만 요청해요.",
          ["결제창 방식으로 카드 정보를 PG사가 직접 받는다", "쇼핑몰 서버에 카드 정보가 지나가지 않아 보안 부담이 준다", "쇼핑몰 화면에서 카드 정보를 받아 넘긴다", "결제 화면 흐름을 PG사 방식에 맞춰야 한다"],
        ),
        [E("user", "pg")]: edgeText(
          "고객이 PG사 결제창에서 카드 정보를 넣고 인증해요.",
          "HTTPS(TCP 443). 고객 브라우저가 PG사 주소로 직접 접속해요.",
          "카드 정보가 쇼핑몰 서버를 거치지 않게 하기 위해서예요.",
          "고객과 PG사 사이라 쇼핑몰의 WAF·보안 그룹을 지나지 않아요.",
        ),
        [E("mobile", "pg")]: edgeText(
          "고객 앱이 PG사 결제 화면을 띄워 카드 인증을 해요.",
          "HTTPS(TCP 443). 앱 안의 웹 화면이나 결제 앱이 PG사로 바로 접속해요.",
          "앱에서도 카드 정보가 쇼핑몰 서버를 거치지 않게 해요.",
          "고객과 PG사 사이라 쇼핑몰의 WAF·보안 그룹을 지나지 않아요.",
        ),
        [E("api-1", "nat")]: edgeText(
          "API #1 이 PG사 승인 요청을 NAT 게이트웨이로 보내요.",
          "HTTPS(TCP 443). 앱 서브넷 경로 표의 기본 경로(0.0.0.0/0)가 NAT 를 가리켜요.",
          "공인 IP 가 없는 서버가 인터넷에 나가는 유일한 길이에요.",
          "API 보안 그룹: 나가는 443 허용.",
        ),
        [E("api-2", "nat")]: edgeText(
          "API #2 가 PG사 승인 요청을 NAT 게이트웨이로 보내요.",
          "HTTPS(TCP 443). 실제로는 같은 AZ(2c)의 NAT 를 쓰게 경로 표를 나눠요.",
          "AZ 하나가 멈춰도 다른 AZ 의 서버가 밖으로 나갈 수 있게 해요.",
          "API 보안 그룹: 나가는 443 허용.",
        ),
        [E("nat", "pg")]: edgeText(
          "승인 요청이 인터넷을 지나 PG사에 닿고, 승인 결과가 돌아와요.",
          "HTTPS(TCP 443) REST API. 출발 주소는 NAT 의 탄력적 IP 예요.",
          "카드 승인은 PG사만 할 수 있어 쇼핑몰이 직접 요청해야 해요.",
          "NAT 게이트웨이에는 보안 그룹이 없어요. PG사가 우리 탄력적 IP 를 허용 목록에 넣기도 해요.",
        ),
      },
    },

    // ── 8. 주문 대기열(SQS) ────────────────────────────────────
    {
      id: "queue",
      goal: "주문 대기열(SQS)",
      example: "주문이 몰릴 때를 대비해 SQS 대기열을 넣어 줘",
      keywords: [["sqs", "대기열", "큐", "queue", "메시지"]],
      commands: [
        node("sqs", "queue", "주문 대기열", "region", "Amazon SQS · 표준 대기열", { ...managed(), sw: "Amazon SQS", version: NO_VERSION }),
        group("order-asg", "redundancy_group", "주문 처리 Auto Scaling 그룹", "app"),
        node("order-1", "app_server", "주문 처리기 #1", "order-asg", "Spring Boot 3.5", ec2("shop-order-2a", "10.0.10.31", "2a")),
        node("order-2", "app_server", "주문 처리기 #2", "order-asg", "Spring Boot 3.5", ec2("shop-order-2c", "10.0.11.31", "2c")),
        edge("api-1", "sqs", "async", "SQS HTTPS"),
        edge("api-2", "sqs", "async", "SQS HTTPS"),
        edge("sqs", "order-1", "async", "SQS HTTPS"),
        edge("sqs", "order-2", "async", "SQS HTTPS"),
        edge("order-1", "rds", "request", "MySQL 3306"),
        edge("order-2", "rds", "request", "MySQL 3306"),
      ],
      say: "SQS 주문 대기열과 주문 처리기 두 대를 넣었어요. 결제 승인까지는 API 가 바로 하고, 배송 요청·알림·포인트 적립처럼 조금 늦어도 되는 일은 SQS 에 넣어 처리기가 꺼내 처리해요.",
      notes: [
        { kind: "flow", text: "세일 때 주문이 몰려도 SQS 가 받아 두고, 처리기는 감당할 만큼씩 꺼내요. 쌓인 메시지가 늘면 처리기를 늘려요." },
        { kind: "caution", text: "표준 대기열은 같은 메시지를 두 번 줄 수 있어요. 처리기는 주문 번호로 이미 처리했는지 보고 건너뛰어야 해요." },
        { kind: "caution", text: "표준 대기열은 넣은 순서대로 꺼내 주지 않을 수 있어요. 순서가 꼭 필요하면 FIFO 대기열을 쓰고 처리량 한도를 확인해요." },
      ],
      miss: "이번 단계는 주문이 몰릴 때 받아 둘 대기열이에요. 'SQS 대기열을 넣어 줘'처럼 말해 보세요.",
      explains: {
        [N("sqs")]: nodeText(
          "주문 접수 메시지를 받아 두었다가 처리기가 꺼내 가게 하는 관리형 대기열이에요. AWS 가 여러 AZ 에 나눠 저장해 따로 이중화할 것이 없어요.",
          ["늦어도 되는 주문 후속 일은 SQS 로 넘긴다", "몰릴 때도 API 는 빨리 답하고, 뒤쪽 일은 처리기가 제 속도로 한다", "API 가 배송 요청·알림까지 끝낸 뒤 답한다", "처리가 조금 늦을 수 있고, 중복·순서 처리를 앱이 맡는다"],
        ),
        [G("order-asg")]: groupText(
          "SQS 에서 주문 메시지를 꺼내 처리하는 서버 묶음이에요. 두 AZ 에 한 대씩 두고, 쌓인 메시지 수에 따라 대수를 늘리거나 줄여요.",
          "SQS 에서 메시지를 받아 오고(HTTPS), RDS 에 3306 으로 결과를 써요.",
          ["처리기는 API 와 다른 Auto Scaling 그룹으로 둔다", "처리기만 따로 늘려도 고객 응답에 영향을 주지 않는다", "Lambda 가 SQS 메시지를 받아 처리한다", "서버 묶음과 배포 대상이 하나 더 는다"],
          ASG_DEF,
        ),
        [N("order-1")]: nodeText(
          "SQS 에서 메시지를 받아 배송 요청·알림·포인트 적립을 처리하고, 끝나면 메시지를 지워요(AZ 2a).",
          ["처리가 끝난 뒤에 메시지를 지운다", "처리 중 멈추면 표시 제한 시간 뒤 메시지가 다시 보여 다른 처리기가 이어 한다", "받자마자 메시지를 지운다", "같은 메시지가 두 번 올 수 있어 중복을 걸러야 한다"],
        ),
        [N("order-2")]: nodeText(
          "주문 처리기 #1 과 같은 일을 다른 AZ(2c)에서 하는 짝이에요. 두 대가 SQS 를 함께 비우므로 몰릴 때 처리 속도를 높여요.",
          ["쌓인 메시지 수로 처리기 대수를 조절한다", "몰릴 때만 늘려 비용을 아낀다", "처리기 수를 고정한다", "처리기가 늘수록 RDS 쓰기도 늘어 RDS 가 견디는지 봐야 한다"],
        ),
        [E("api-1", "sqs")]: edgeText(
          "결제를 마친 주문의 '주문 접수' 메시지를 SQS 에 넣어요.",
          "SQS API(HTTPS 443). NAT 나 VPC 엔드포인트를 거쳐 SQS 에 닿아요.",
          "API 가 뒤쪽 일을 기다리지 않고 고객에게 바로 답하려고요.",
          "API 보안 그룹: 나가는 443 허용.",
        ),
        [E("api-2", "sqs")]: edgeText(
          "API #2 가 받은 주문의 '주문 접수' 메시지를 SQS 에 넣어요.",
          "SQS API(HTTPS 443).",
          "어느 서버가 주문을 받든 같은 대기열로 모아요.",
          "API 보안 그룹: 나가는 443 허용.",
        ),
        [E("sqs", "order-1")]: edgeText(
          "처리기 #1 이 SQS 에서 주문 메시지를 받아 와요.",
          "SQS API(HTTPS 443). 처리기가 롱 폴링으로 메시지를 가져가요.",
          "처리기가 감당할 만큼씩 꺼내 처리하게 해요.",
          "처리기 보안 그룹: 나가는 443 허용(VPC 엔드포인트를 쓰면 NAT 를 거치지 않아요).",
        ),
        [E("sqs", "order-2")]: edgeText(
          "처리기 #2 가 SQS 에서 주문 메시지를 받아 와요.",
          "SQS API(HTTPS 443). 두 처리기가 메시지를 나눠 받아요.",
          "처리기 두 대가 함께 비워 몰린 주문을 빨리 처리해요.",
          "처리기 보안 그룹: 나가는 443 허용.",
        ),
        [E("order-1", "rds")]: edgeText(
          "처리기 #1 이 주문 상태를 '배송 준비'로 바꾸고 포인트를 적립해요.",
          "MySQL(TCP 3306). RDS 엔드포인트로 접속해요.",
          "처리 결과는 원본 DB 에 남겨야 해요.",
          "RDS 보안 그룹: 처리기 보안 그룹 → 3306 허용.",
        ),
        [E("order-2", "rds")]: edgeText(
          "처리기 #2 가 주문 상태를 '배송 준비'로 바꾸고 포인트를 적립해요.",
          "MySQL(TCP 3306). RDS 엔드포인트로 접속해요.",
          "처리 결과는 원본 DB 에 남겨야 해요.",
          "RDS 보안 그룹: 처리기 보안 그룹 → 3306 허용.",
        ),
      },
    },

    // ── 9. 관리자 앱 ──────────────────────────────────────────
    {
      id: "admin",
      goal: "관리자 앱",
      example: "운영자가 쓰는 관리자 앱을 붙여 줘",
      keywords: [["관리자", "운영자", "어드민", "admin", "백오피스", "back office"]],
      commands: [
        node("operator", "admin_user", "운영자", null),
        node("vpn", "vpn", "Client VPN", "vpc", "AWS Client VPN", managed()),
        node("ialb", "lb_l7", "내부 ALB", "app", "관리자 전용", { ...managed(), sw: "AWS ALB", port: "443", rules: "관리자 도메인 443 → 관리자 앱 대상 그룹(8080)" }),
        group("admin-asg", "redundancy_group", "관리자 앱 Auto Scaling 그룹", "app"),
        node("admin-1", "app_server", "관리자 앱 #1", "admin-asg", "Spring Boot 3.5", ec2("shop-admin-2a", "10.0.10.41", "2a")),
        node("admin-2", "app_server", "관리자 앱 #2", "admin-asg", "Spring Boot 3.5", ec2("shop-admin-2c", "10.0.11.41", "2c")),
        edge("operator", "vpn", "request", "VPN(TLS)"),
        edge("vpn", "ialb", "request", "HTTPS 443"),
        edge("ialb", "admin-1", "request", "HTTP 8080"),
        edge("ialb", "admin-2", "request", "HTTP 8080"),
        edge("admin-1", "rds", "request", "MySQL 3306"),
        edge("admin-2", "rds", "request", "MySQL 3306"),
        edge("admin-1", "s3", "request", "S3 HTTPS"),
        edge("admin-2", "s3", "request", "S3 HTTPS"),
      ],
      say: "운영자용 관리자 앱 두 대를 앱 서브넷에 두고, 고객용과 다른 내부 ALB 로 받게 했어요. 운영자는 인터넷 입구가 아니라 Client VPN 으로 VPC 에 들어와야 관리자 화면에 닿아요.",
      notes: [
        { kind: "net", text: "내부 ALB 는 사설 주소만 있어 인터넷에서 닿지 않아요. VPN 으로 VPC 에 들어온 사람만 쓸 수 있어요." },
        { kind: "caution", text: "Client VPN 은 회사 계정(SSO)이나 인증서로 사람을 확인해요. 퇴사자 계정은 바로 막아야 해요." },
        { kind: "flow", text: "관리자 앱은 RDS 의 상품·주문을 고치고, 운영자가 올린 상품 이미지는 S3 에 저장해요." },
      ],
      miss: "이번 단계는 운영자가 쓰는 관리자 앱이에요. '관리자 앱을 붙여 줘'처럼 말해 보세요.",
      explains: {
        [N("operator")]: nodeText(
          "상품을 올리고 주문·회원을 관리하는 쇼핑몰 운영자예요. 사무실이나 집에서 Client VPN 을 켜고 관리자 화면에 접속해요.",
          ["운영자는 VPN 으로만 관리자 화면에 들어온다", "관리자 화면이 인터넷에 드러나지 않아 공격받을 곳이 준다", "관리자 화면도 CloudFront 로 열고 IP·로그인으로 막는다", "VPN 사용자 관리와 연결 요금이 든다"],
        ),
        [N("vpn")]: nodeText(
          "운영자 PC 와 VPC 사이에 암호화 터널을 만드는 관리형 VPN 이에요. 인증한 운영자만 VPC 안의 내부 ALB 에 닿게 해요.",
          ["AWS Client VPN 으로 사람의 접속을 받는다", "VPN 장비를 따로 운영하지 않고 사람 단위로 접속을 관리한다", "배스천 서버나 사무실과 잇는 사이트 간 VPN", "VPC 에 붙여 둔 시간과 사용자가 접속한 시간만큼 요금이 든다"],
        ),
        [N("ialb")]: nodeText(
          "관리자 앱 두 대에 요청을 나눠 주는 내부 전용 로드밸런서예요. 고객용 ALB 와 따로 두어 고객 입구로는 관리자 화면에 닿을 수 없어요.",
          ["관리자용 ALB 를 고객용과 따로 둔다", "관리자 경로를 인터넷 입구와 완전히 나눈다", "고객용 ALB 에 관리자 경로 규칙을 더한다", "ALB 하나만큼 요금이 더 든다"],
        ),
        [G("admin-asg")]: groupText(
          "관리자 앱 서버를 두 AZ 에 한 대씩 유지하는 묶음이에요. 한 대가 멈추면 새로 띄우고, 그동안 다른 AZ 의 서버가 받아요.",
          "내부 ALB 에서 8080 이 들어오고, RDS(3306)와 S3(443)로 나가요.",
          ["관리자 앱도 두 AZ 에 두 대로 둔다", "운영자가 적어도 장애 때 주문 관리를 못 하면 안 된다", "관리자 앱은 한 대만 둔다", "쓰는 사람이 적은데도 서버 두 대 요금이 든다"],
          ASG_DEF,
        ),
        [N("admin-1")]: nodeText(
          "상품 등록·주문 관리 같은 운영 기능을 돌리는 서버예요(AZ 2a). 고객용 API 와 서버를 나눠 운영 기능이 고객 쪽에 드러나지 않아요.",
          ["관리자 앱을 고객용 API 와 다른 서버로 둔다", "고객 입구로는 관리 기능에 닿을 길 자체가 없다", "API 서버에 관리자 기능을 함께 둔다", "배포 대상이 하나 더 는다"],
        ),
        [N("admin-2")]: nodeText(
          "관리자 앱 #1 과 같은 서버를 다른 AZ(2c)에 둔 짝이에요. 내부 ALB 가 두 대에 나눠 보내요.",
          ["두 서버를 다른 AZ 에 둔다", "AZ 하나가 멈춰도 운영을 이어 간다", "같은 AZ 에 두 대를 둔다", "AZ 를 넘는 통신 요금이 조금 든다"],
        ),
        [E("operator", "vpn")]: edgeText(
          "운영자 PC 가 VPN 터널을 열어 VPC 에 들어와요.",
          "OpenVPN 방식의 TLS 터널(UDP 또는 TCP 443)이에요.",
          "관리자 화면은 VPC 안에서만 닿게 해 뒀어요.",
          "Client VPN 인증(SSO·인증서)과 허용 규칙으로 들어올 대상을 정해요.",
        ),
        [E("vpn", "ialb")]: edgeText(
          "VPN 으로 들어온 관리자 요청이 내부 ALB 에 닿아요.",
          "HTTPS(TCP 443). 관리자 도메인은 VPC 안 사설 주소로 연결돼요.",
          "관리자 앱을 여러 대 둬도 운영자는 주소 하나로 접속해요.",
          "내부 ALB 보안 그룹: Client VPN 보안 그룹 → 443 만 허용.",
        ),
        [E("ialb", "admin-1")]: edgeText(
          "내부 ALB 가 관리자 요청을 관리자 앱 #1(2a)로 보내요.",
          "HTTP(TCP 8080).",
          "대상 그룹에 든 관리자 앱에 요청을 나눠요.",
          "관리자 앱 보안 그룹: 내부 ALB 보안 그룹 → 8080 만 허용.",
        ),
        [E("ialb", "admin-2")]: edgeText(
          "내부 ALB 가 관리자 요청을 관리자 앱 #2(2c)로 보내요.",
          "HTTP(TCP 8080).",
          "두 AZ 의 서버에 나눠 한쪽이 멈춰도 이어지게 해요.",
          "관리자 앱 보안 그룹: 내부 ALB 보안 그룹 → 8080 만 허용.",
        ),
        [E("admin-1", "rds")]: edgeText(
          "운영자가 고친 상품·주문 정보를 RDS 에 써요.",
          "MySQL(TCP 3306).",
          "관리 기능도 원본 DB 를 고쳐야 고객 화면에 반영돼요.",
          "RDS 보안 그룹: 관리자 앱 보안 그룹 → 3306 허용.",
        ),
        [E("admin-2", "rds")]: edgeText(
          "관리자 앱 #2 가 상품·주문 정보를 RDS 에 써요.",
          "MySQL(TCP 3306).",
          "어느 관리자 앱으로 가도 같은 DB 를 고쳐요.",
          "RDS 보안 그룹: 관리자 앱 보안 그룹 → 3306 허용.",
        ),
        [E("admin-1", "s3")]: edgeText(
          "운영자가 올린 상품 이미지를 S3 에 저장해요.",
          "S3 API(HTTPS 443). S3 게이트웨이 엔드포인트로 NAT 없이 닿아요.",
          "올린 이미지를 CloudFront 가 바로 고객에게 내보내요.",
          "관리자 앱의 IAM 역할에 이 버킷 쓰기만 허용해요.",
        ),
        [E("admin-2", "s3")]: edgeText(
          "관리자 앱 #2 가 올린 상품 이미지를 S3 에 저장해요.",
          "S3 API(HTTPS 443). S3 게이트웨이 엔드포인트로 닿아요.",
          "어느 관리자 앱으로 올려도 같은 버킷에 쌓여요.",
          "관리자 앱의 IAM 역할에 이 버킷 쓰기만 허용해요.",
        ),
      },
    },

    // ── 10. CloudWatch 모니터링·로그 ───────────────────────────
    {
      id: "ops",
      goal: "CloudWatch 모니터링·로그",
      example: "CloudWatch 로 모니터링과 로그를 붙여 줘",
      keywords: [["cloudwatch", "클라우드워치", "모니터링", "monitoring", "로그", "log", "지표", "알람", "감시"]],
      commands: [
        node("cw", "monitoring", "CloudWatch", "region", "지표·로그·알람", { ...managed(), sw: "Amazon CloudWatch", version: NO_VERSION }),
        edge("vpc", "cw", "aux", "지표·로그"),
        edge("cw", "operator", "aux", "알람"),
      ],
      say: "CloudWatch 를 붙여 ALB·EC2·RDS·ElastiCache·SQS 의 지표와 서버 로그를 한곳에서 보게 했어요. 기준을 넘으면 알람이 운영자에게 가요.",
      notes: [
        { kind: "flow", text: "관리형 서비스의 지표는 설치 없이 모여요. EC2 의 메모리·디스크와 앱 로그는 CloudWatch 에이전트를 깔아야 모여요." },
        { kind: "net", text: "온프레미스처럼 감시 서버를 따로 두지 않아요. 서버의 에이전트가 HTTPS 로 CloudWatch 에 보내요." },
        { kind: "caution", text: "세일 전에 CPU·RDS 연결 수·SQS 에 쌓인 메시지 수에 알람을 걸어 두세요. 몰린 뒤에 보면 늦어요." },
      ],
      miss: "이번 단계는 모니터링과 로그예요. 'CloudWatch 로 모니터링과 로그를 붙여 줘'처럼 말해 보세요.",
      explains: {
        [N("cw")]: nodeText(
          "AWS 자원의 지표와 로그를 모아 그래프로 보여 주고, 기준을 넘으면 알람을 보내는 관리형 감시 서비스예요.",
          ["감시와 로그는 CloudWatch 로 모은다", "관리형 서비스 지표가 저절로 모이고 감시 서버를 운영할 필요가 없다", "EC2 에 Prometheus·Grafana·ELK 를 직접 운영한다", "로그 저장량과 지표 수만큼 요금이 들어 보관 기간을 정해야 한다"],
        ),
        [E("vpc", "cw")]: edgeText(
          "VPC 안 서버·ALB·RDS·ElastiCache 의 지표와 앱 로그가 CloudWatch 로 가요.",
          "관리형 서비스는 자동으로, EC2 는 CloudWatch 에이전트가 HTTPS(443)로 보내요.",
          "몰림과 장애를 한 화면에서 보려고요.",
          "서버 보안 그룹: 나가는 443 허용(NAT 나 VPC 엔드포인트를 거쳐요).",
        ),
        [E("cw", "operator")]: edgeText(
          "기준을 넘은 알람이 운영자에게 가요.",
          "CloudWatch 알람이 SNS 로 메일·문자를 보내요.",
          "몰림이나 장애를 사람이 바로 알아야 대응해요.",
          "AWS 안에서 보내는 알림이라 따로 열 것이 없어요.",
        ),
      },
    },

    // ── 11. 상품 보기·결제 흐름 ────────────────────────────────
    {
      id: "flows",
      goal: "상품 보기·결제 흐름",
      example: "상품 보기와 결제 흐름을 정리해 줘",
      keywords: [["흐름", "flow", "경로", "과정", "시나리오"]],
      commands: [
        flow("product-view", "상품 보기", "user", "고객이 브라우저로 상품 상세를 연다.", "상품 정보와 이미지를 화면에 돌려준다.", [
          ["user", "cdn", "상품 요청", "고객 브라우저가 CloudFront 로 상품 페이지를 요청한다."],
          ["cdn", "s3", "이미지", "이미지는 엣지 캐시에서 주고, 없으면 S3 에서 가져온다."],
          ["cdn", "waf", "API 전달", "상품 정보 API 는 캐시하지 않고 서울 리전으로 보낸다."],
          ["waf", "alb", "검사", "ALB 에 붙은 WAF 가 요청을 검사한다."],
          ["alb", "api-1", "분배", "ALB 가 API 서버 한 대로 요청을 나눈다."],
          ["api-1", "redis", "캐시 조회", "API 가 ElastiCache 에서 상품 정보를 먼저 찾는다."],
          ["api-1", "rds", "DB 조회", "캐시에 없으면 RDS 에서 읽어 캐시에 채운다."],
        ]),
        flow("checkout", "결제", "user", "고객이 앱에서 주문을 결제한다.", "결제 결과와 주문 번호를 돌려주고, 배송 준비는 SQS 로 넘긴다.", [
          ["mobile", "pg", "카드 인증", "고객 앱이 PG사 결제창을 열어 카드 정보를 넣고 인증한다."],
          ["mobile", "cdn", "승인 요청", "인증 결과를 가지고 쇼핑몰에 결제 승인을 요청한다."],
          ["cdn", "waf", "전달", "CloudFront 가 API 요청을 서울 리전으로 보낸다."],
          ["waf", "alb", "검사", "ALB 에 붙은 WAF 가 요청을 검사한다."],
          ["alb", "api-2", "분배", "ALB 가 API 서버 한 대로 요청을 나눈다."],
          ["api-2", "nat", "밖으로", "API 가 NAT 게이트웨이를 거쳐 인터넷으로 나간다."],
          ["nat", "pg", "승인", "PG사가 카드사 승인을 받아 결과를 돌려준다."],
          ["api-2", "rds", "주문 저장", "API 가 결제된 주문을 RDS 에 저장한다."],
          ["api-2", "sqs", "접수 메시지", "배송 요청·알림 같은 후속 일을 SQS 에 넣는다."],
          ["sqs", "order-1", "꺼내기", "주문 처리기가 메시지를 받아 온다."],
          ["order-1", "rds", "배송 준비", "처리기가 주문 상태를 배송 준비로 바꾼다."],
        ]),
      ],
      say: "상품 보기와 결제 두 흐름을 정리했어요. 흐름을 재생하면 요청이 어느 서비스를 어떤 순서로 지나는지 볼 수 있어요.",
      notes: [
        { kind: "flow", text: "상품 이미지는 CloudFront 와 S3 사이에서 끝나요. API 서버까지 오는 것은 상품 정보 요청뿐이에요." },
        { kind: "link", text: "결제는 고객 → PG사 결제창, API → NAT → PG사 승인의 두 갈래로 PG사와 이어져요." },
        { kind: "caution", text: "흐름은 서버 한 대씩만 그렸어요. 실제로는 ALB 가 요청마다 API 두 대 가운데 하나를 골라요." },
      ],
      miss: "마지막 단계는 흐름 정리예요. '상품 보기와 결제 흐름을 정리해 줘'처럼 말해 보세요.",
      explains: {},
    },
  ],
};
