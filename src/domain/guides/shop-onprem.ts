// 대형 쇼핑몰 — 온프레미스(사내 IDC). 바탕은 samples/idc-3tier.ts.
// 가상 값: DMZ 10.10.10.0/24, 내부 구역 10.10.20.0/24, 운영 관리 구역 10.10.30.0/24, 사내망 172.16.0.0/16.
import { assume, edge, flow, group, node } from "../samples/dsl";

import { countConflicts, E, edgeText, G, groupText, N, nodeText, update } from "./authoring";
import type { GuideVariant } from "./types";

const OS = "Rocky Linux 9";
const server = (hostname: string, ip: string, sw: string, cpu: string, ram: string, disk: string) => ({ sw, os: OS, cpu, ram, disk, hostname, ip });

// 방화벽 규칙은 단계마다 늘어난다(같은 칸을 고쳐 쓴다).
const FW_EXT_RULES_1 = "인터넷 → L4 VIP 10.10.10.100 TCP 443 허용, 나머지 차단";
const FW_EXT_RULES_8 = "인터넷 → L4 VIP 10.10.10.100 443 허용 · 프록시 10.10.10.21~22 → PG사 443 허용 · 나머지 차단";
const FW_INT_RULES_4 = "WEB 10.10.10.11~12 → WAS 8080 허용, 나머지 차단";
const FW_INT_RULES_8 = "WEB → WAS 8080 · WAS → 프록시 VIP 10.10.10.20:3128 허용, 나머지 차단";
const FW_INT_RULES_10 = "WEB → WAS 8080 · WAS → 프록시 VIP 3128 · 사내망 172.16.0.0/16 → 관리자 VIP 8443 허용, 나머지 차단";
const FW_INT_RULES_11 =
  "WEB → WAS 8080 · WAS → 프록시 VIP 3128 · 사내망 → 관리자 VIP 8443 · 관리 구역 → 서버 10050·161 · 서버 → 관리 구역 5044 허용, 나머지 차단";

export const SHOP_ONPREM: GuideVariant = {
  environment: "사내 IDC",
  outro:
    "IDC 안에 DMZ 와 내부 구역을 나누고, L4·WEB·WAS·DB 를 모두 이중화한 쇼핑몰을 만들었어요. 결제 승인은 프록시를 거쳐 PG사로 나가요. 세일 때는 Redis 캐시가 몰리는 조회를 받고, 주문 대기열이 배송·알림·적립 같은 후속 일을 나눠 받아요.",
  otherEnv: [
    { from: "L4 두 대(VIP)", to: "ALB(AWS 가 이중화하는 관리형)" },
    { from: "WEB·WAS 서버 두 대", to: "EC2 Auto Scaling 그룹(두 AZ)" },
    { from: "DB Active-Standby(VIP)", to: "RDS Multi-AZ(엔드포인트)" },
    { from: "Redis + Sentinel", to: "ElastiCache(Multi-AZ)" },
    { from: "NAS", to: "S3" },
    { from: "외부 방화벽", to: "WAF·보안 그룹" },
    { from: "사내 큐(RabbitMQ)", to: "SQS" },
    { from: "아웃바운드 프록시", to: "NAT 게이트웨이(목적지 거르기는 Network Firewall 등 따로)" },
    { from: "사내 전용 회선(운영자)", to: "Client VPN" },
    { from: "Zabbix·ELK", to: "CloudWatch" },
  ],
  steps: [
    // ── 1. 고객 진입과 외부 방화벽 ─────────────────────────────
    {
      id: "entry",
      goal: "고객 진입과 외부 방화벽(IDC·DMZ)",
      example: "고객이 웹과 앱으로 들어오고 앞에 방화벽을 둬 줘",
      keywords: [
        ["방화벽", "firewall", "fw"],
        ["고객", "사용자", "외부", "인터넷", "입구", "진입", "들어", "접속", "dmz", "idc"],
      ],
      commands: [
        assume("scale", "회원 300만 명, 세일 때 평소의 10배 접속"),
        group("idc", "idc", "쇼핑몰 IDC"),
        group("dmz", "dmz", "DMZ", "idc"),
        node("user", "client_web", "고객 브라우저", null),
        node("mobile", "client_mobile", "고객 앱", null),
        node("fw-ext", "firewall", "외부 방화벽", "dmz", "HA 한 쌍", { port: "443", rules: FW_EXT_RULES_1, vip: "10.10.10.1" }),
        edge("user", "fw-ext", "request", "HTTPS 443"),
        edge("mobile", "fw-ext", "request", "HTTPS 443"),
      ],
      say: "IDC 안에 DMZ 를 나누고 맨 앞에 외부 방화벽을 뒀어요. 고객 브라우저와 앱의 요청은 모두 이 방화벽을 지나고, 허용한 HTTPS(443)만 안으로 들어와요.",
      notes: [
        { kind: "net", text: "DMZ 는 인터넷에서 오는 요청을 처음 받는 구역이에요. 고객 정보가 든 DB 는 여기 두지 않고 뒤의 내부 구역에 둬요." },
        { kind: "flow", text: "고객 → 외부 방화벽 → L4 순서로 들어와요. 앱도 브라우저와 같은 HTTPS 입구를 써요." },
        { kind: "caution", text: "실제로는 방화벽도 두 대를 HA 로 묶어 한 대처럼 써요. 그림에서는 한 대로 줄였어요." },
      ],
      miss: "이번 단계는 고객이 들어오는 입구예요. 고객과 그 앞의 외부 방화벽을 넣어 달라고 말해 보세요.",
      explains: {
        [G("idc")]: groupText(
          "쇼핑몰 서버와 네트워크 장비를 모아 둔 데이터센터예요. 전원·냉방·회선은 IDC 가 맡고, 장비 구성과 운영은 우리가 직접 해요.",
          "바깥과는 외부 방화벽(인터넷 회선)과 사내 전용 회선(운영자 접속)으로만 이어져요.",
          ["쇼핑몰을 우리 IDC 에 직접 구축한다", "장비와 망을 직접 통제하고, 오래 쓰면 비용을 예측하기 쉽다", "클라우드(AWS 등)에 올려 장비 운영을 맡긴다", "세일에 대비해 장비를 미리 사 둬야 하고, 장애 대응도 직접 한다"],
        ),
        [G("dmz")]: groupText(
          "인터넷에서 오는 요청을 처음 받는 구역이에요. L4·WEB 서버처럼 바깥과 직접 말해야 하는 장비만 여기에 둬요.",
          "외부 방화벽에서 443 만 들어오고, 안쪽으로는 내부 방화벽이 허용한 통신(WEB → WAS 8080 등)만 나가요.",
          ["공개 장비는 DMZ, 데이터는 내부 구역으로 나눈다", "DMZ 서버가 뚫려도 DB 까지는 방화벽이 한 번 더 막는다", "한 구역에 모두 두고 방화벽 하나만 쓴다", "방화벽이 둘로 늘고 규칙을 두 곳에서 관리한다"],
        ),
        [N("user")]: nodeText(
          "PC 브라우저로 상품을 보고 주문하는 고객이에요. 모든 요청은 HTTPS 로 외부 방화벽을 거쳐 들어와요.",
          ["고객 요청은 HTTPS(443)로만 받는다", "로그인·주문 정보가 오가므로 암호화가 필요하다", "HTTP(80)도 그대로 받는다", "인증서를 발급·갱신해 WEB 서버에 둬야 한다"],
        ),
        [N("mobile")]: nodeText(
          "휴대폰 앱으로 쇼핑하는 고객이에요. 앱도 브라우저와 같은 HTTPS 입구로 들어와 같은 WEB·WAS 를 써요.",
          ["앱 전용 입구를 따로 두지 않고 같은 입구를 쓴다", "방화벽 규칙과 서버를 한 벌로 관리할 수 있다", "앱 전용 API 서버와 입구를 따로 둔다", "앱과 웹의 부하가 같은 서버에 섞인다"],
        ),
        [N("fw-ext")]: nodeText(
          "인터넷과 DMZ 사이의 문지기예요. 규칙에 적힌 통신만 통과시키고 나머지는 막아요. 공인 IP 로 온 요청은 L4 VIP(사설 IP)로 바꿔(NAT) 넘겨요.",
          ["외부 방화벽은 필요한 포트만 열고 나머지는 막는다", "열린 포트가 적을수록 공격받을 곳이 줄어든다", "필요할 때마다 포트를 넓게 연다", "새 통신이 생길 때마다 규칙을 요청해 반영해야 한다"],
        ),
        [E("user", "fw-ext")]: edgeText(
          "고객 브라우저의 상품·주문 요청이 IDC 로 들어와요.",
          "HTTPS(TCP 443). 인터넷을 지나므로 TLS 로 암호화해요.",
          "IDC 로 들어오는 입구는 외부 방화벽 하나뿐이라 모든 요청이 여기를 거쳐요.",
          "외부 방화벽: 인터넷 → L4 VIP 443 허용.",
        ),
        [E("mobile", "fw-ext")]: edgeText(
          "고객 앱의 상품·주문 API 요청이 IDC 로 들어와요.",
          "HTTPS(TCP 443). 브라우저와 같은 주소·같은 포트를 써요.",
          "앱도 같은 입구를 써야 방화벽 규칙을 한 벌로 관리할 수 있어요.",
          "외부 방화벽: 인터넷 → L4 VIP 443 허용(브라우저와 같은 규칙).",
        ),
      },
    },

    // ── 2. L4 두 대 이중화 ─────────────────────────────────────
    {
      id: "l4",
      goal: "L4 두 대 이중화(VIP)",
      example: "L4 두 대로 이중화해 줘",
      keywords: [
        ["l4", "로드밸런서", "로드 밸런서", "load balancer", "부하분산", "부하 분산"],
        ["이중화", "vip", "active", "액티브", "standby", "스탠바이", "한 쌍", "페어", "failover", "페일오버", "l4 두 대", "l4 2대", "l4를 두 대", "l4를 2대", "로드밸런서 두 대", "로드밸런서 2대", "두 대의 l4"],
      ],
      conflicts: countConflicts(
        "이번에는 L4 를 두 대로 해요. L4 는 Active 한 대가 일하고 Standby 한 대가 기다리는 한 쌍이면 충분해요.",
        "L4 가 한 대뿐이면 그 장비가 멈출 때 쇼핑몰 전체가 멈춰요. 이번에는 두 대로 이중화해요.",
      ),
      commands: [
        assume("redundancy", "L4·DB 는 Active-Standby, WEB·WAS 는 두 대가 함께 일함(Active-Active)"),
        group("l4-ha", "redundancy_group", "L4 이중화", "dmz"),
        node("l4-1", "lb_l4", "L4 #1", "l4-ha", "Active", { port: "443", rules: "VIP 443 → WEB 서버 443, 라운드 로빈·헬스 체크 5초", vip: "10.10.10.100" }),
        node("l4-2", "lb_l4", "L4 #2", "l4-ha", "Standby", { port: "443", rules: "VIP 443 → WEB 서버 443, 라운드 로빈·헬스 체크 5초", vip: "10.10.10.100" }),
        edge("fw-ext", "l4-1", "request", "HTTPS 443"),
        edge("fw-ext", "l4-2", "request", "HTTPS 443"),
        edge("l4-1", "l4-2", "replication", "상태 확인(하트비트)"),
      ],
      say: "L4 두 대를 한 쌍으로 묶었어요. 평소에는 Active 가 VIP(10.10.10.100)를 맡아 요청을 받고, Active 가 멈추면 Standby 가 VIP 를 넘겨받아 이어서 받아요.",
      notes: [
        { kind: "net", text: "VIP 는 장비 한 대의 주소가 아니라 한 쌍이 함께 쓰는 대표 주소예요. 방화벽과 고객은 VIP 만 알면 돼요." },
        { kind: "flow", text: "방화벽 → L4 Standby 연결은 평소엔 비어 있어요. Active 가 멈춘 뒤에만 이 길로 요청이 가요." },
        { kind: "caution", text: "하트비트가 끊기면 두 대가 모두 VIP 를 가지려 할 수 있어요(스플릿 브레인). 그래서 하트비트 선을 이중으로 둬요." },
      ],
      miss: "이번 단계는 L4 를 두 대로 이중화하는 거예요. 'L4 두 대로 이중화해 줘'처럼 말해 보세요.",
      explains: {
        [G("l4-ha")]: groupText(
          "L4 두 대를 Active-Standby 한 쌍으로 묶은 영역이에요. 한 쌍은 VIP 10.10.10.100 하나로 요청을 받아요.",
          "외부 방화벽에서 VIP 로 443 이 들어오고, WEB 서버 두 대로 443 이 나가요. 두 L4 사이에는 하트비트가 오가요.",
          ["L4 는 Active-Standby 로 두고 VIP 를 함께 쓴다", "한 대가 멈춰도 VIP 가 옮겨 가 고객이 쓰는 주소는 그대로다", "두 대가 모두 요청을 받는 Active-Active", "Standby 한 대는 평소에 일하지 않고 기다린다"],
        ),
        [N("l4-1")]: nodeText(
          "평소 VIP 를 맡아 들어온 요청을 WEB 서버 두 대에 번갈아 나눠 줘요. 헬스 체크로 멈춘 WEB 서버를 찾아 분산 대상에서 빼요.",
          ["L4(TCP 수준)로 나누고 암호는 WEB 서버가 푼다", "L4 는 내용을 열어 보지 않아 빠르고 단순하다", "L7 로드밸런서가 TLS 를 풀고 주소별로 나눈다", "URL 경로별로 나누는 일은 WEB 서버가 맡아야 한다"],
        ),
        [N("l4-2")]: nodeText(
          "평소에는 대기하며 하트비트로 Active 를 지켜봐요. Active 가 응답하지 않으면 VIP 를 넘겨받아 같은 일을 이어 해요.",
          ["Standby 도 Active 와 같은 설정으로 둔다", "넘겨받는 순간 같은 규칙으로 바로 일해야 한다", "장애가 나면 사람이 설정을 옮긴다", "설정을 바꿀 때마다 두 대를 맞춰야 한다(보통 자동 동기화)"],
        ),
        [E("fw-ext", "l4-1")]: edgeText(
          "방화벽을 통과한 고객 요청이 L4 VIP 로 가요. 평소에는 Active 인 L4 #1 이 받아요.",
          "HTTPS(TCP 443). 방화벽이 공인 IP 를 VIP 10.10.10.100 으로 바꿔 넘겨요.",
          "고객 요청을 여러 WEB 서버에 나누려면 먼저 L4 를 거쳐야 해요.",
          "외부 방화벽: 인터넷 → 10.10.10.100:443 허용.",
        ),
        [E("fw-ext", "l4-2")]: edgeText(
          "Active 가 멈췄을 때 고객 요청이 Standby 로 가는 길이에요.",
          "HTTPS(TCP 443). VIP 가 Standby 로 옮겨 가면 같은 주소로 요청이 와요.",
          "장애 때도 방화벽 규칙을 바꾸지 않고 요청을 이어 받기 위해서예요.",
          "Active 와 같은 규칙(VIP 443)을 써서 따로 열 것이 없어요.",
        ),
        [E("l4-1", "l4-2")]: edgeText(
          "두 L4 가 서로 살아 있는지 짧은 신호를 계속 주고받아요.",
          "하트비트(장비 제조사 방식). 보통 전용 선이나 포트로 몇 초마다 확인해요.",
          "Active 가 멈춘 것을 Standby 가 알아야 VIP 를 넘겨받을 수 있어요.",
          "두 L4 가 직접 이어진 구간이라 방화벽을 거치지 않아요.",
        ),
      },
    },

    // ── 3. WEB 서버 두 대 ──────────────────────────────────────
    {
      id: "web",
      goal: "WEB 서버 두 대",
      example: "웹 서버 두 대를 L4 뒤에 붙여 줘",
      keywords: [["웹서버", "웹 서버", "web", "nginx", "엔진엑스", "apache", "아파치", "웹 두 대", "웹 2대", "웹을"]],
      conflicts: countConflicts(
        "세 대도 틀린 구성은 아니지만, 이 가이드는 WEB 서버를 두 대로 맞춰요. '웹 서버 두 대'로 말해 주세요.",
        "WEB 서버가 한 대뿐이면 멈출 때 대신할 서버가 없어요. 이번에는 두 대로 해요.",
      ),
      commands: [
        group("web-pool", "redundancy_group", "WEB 서버 묶음", "dmz"),
        node("web-1", "web_server", "WEB #1", "web-pool", "Nginx 1.26", server("shop-web01", "10.10.10.11", "Nginx 1.26", "8 Core", "16GB", "200GB")),
        node("web-2", "web_server", "WEB #2", "web-pool", "Nginx 1.26", server("shop-web02", "10.10.10.12", "Nginx 1.26", "8 Core", "16GB", "200GB")),
        edge("l4-1", "web-1", "request", "HTTPS 443"),
        edge("l4-1", "web-2", "request", "HTTPS 443"),
        edge("l4-2", "web-1", "request", "HTTPS 443"),
        edge("l4-2", "web-2", "request", "HTTPS 443"),
      ],
      say: "WEB 서버 두 대를 L4 뒤에 붙였어요. L4 가 요청을 두 대에 나누고, WEB 서버는 HTTPS 를 풀어 화면 파일을 주거나 WAS 로 넘겨요. 한 대가 멈추면 L4 가 남은 한 대로만 보내요.",
      notes: [
        { kind: "flow", text: "L4 두 대가 모두 WEB 두 대에 이어져 있어요. 어느 L4 가 Active 가 되어도 WEB 두 대를 다 써요." },
        { kind: "net", text: "WEB 서버는 DMZ 에서 바깥 요청을 직접 받아요. 그래서 고객 데이터를 저장하지 않고 넘겨주기만 해요." },
        { kind: "caution", text: "TLS 인증서는 WEB 서버 두 대에 똑같이 두고, 만료 전에 함께 바꿔야 해요." },
      ],
      miss: "이번 단계는 L4 뒤의 WEB 서버 두 대예요. '웹 서버 두 대를 L4 뒤에 붙여 줘'처럼 말해 보세요.",
      explains: {
        [G("web-pool")]: groupText(
          "WEB 서버 두 대를 묶은 영역이에요. 두 대가 함께 요청을 받는 Active-Active 라 한 대가 멈춰도 나머지가 받아요.",
          "L4 에서 443 이 들어오고, 내부 방화벽을 거쳐 WAS 로 8080 이 나가요.",
          ["WEB 서버는 두 대가 함께 일하게 둔다", "평소에도 부하를 반씩 나누고, 한 대 장애를 견딘다", "한 대만 두고 장애 때 새로 띄운다", "두 서버의 설정·배포를 늘 똑같이 맞춰야 한다"],
        ),
        [N("web-1")]: nodeText(
          "고객의 HTTPS 를 풀고(TLS 종료) 화면 파일은 직접 돌려줘요. 상품·주문 같은 요청은 WAS 두 대에 나눠 넘겨요(리버스 프록시).",
          ["WEB 은 Nginx 로 두고 TLS 를 여기서 푼다", "적은 자원으로 많은 접속을 받고, WAS 는 계산에만 집중한다", "WAS 가 TLS 와 화면 파일까지 직접 맡는다", "WEB·WAS 두 계층을 따로 운영해야 한다"],
        ),
        [N("web-2")]: nodeText(
          "WEB #1 과 똑같이 설정한 짝이에요. L4 가 두 대에 번갈아 보내므로 평소에도 요청의 절반을 받아요.",
          ["WEB #1 과 같은 설정·같은 인증서로 둔다", "어느 서버로 가도 고객이 같은 화면을 받아야 한다", "두 서버에 서로 다른 일을 맡긴다", "한쪽만 바꾸는 실수를 막도록 배포를 자동화해야 한다"],
        ),
        [E("l4-1", "web-1")]: edgeText(
          "Active L4 가 고객 요청을 WEB #1 로 보내요.",
          "HTTPS(TCP 443). L4 는 암호를 풀지 않고 그대로 넘겨요.",
          "L4 가 두 WEB 서버에 요청을 나누는 길이에요.",
          "같은 DMZ 안이라 방화벽을 거치지 않아요.",
        ),
        [E("l4-1", "web-2")]: edgeText(
          "Active L4 가 고객 요청을 WEB #2 로 보내요.",
          "HTTPS(TCP 443). L4 는 암호를 풀지 않고 그대로 넘겨요.",
          "요청을 두 서버에 번갈아 나눠 한 대에 몰리지 않게 해요.",
          "같은 DMZ 안이라 방화벽을 거치지 않아요.",
        ),
        [E("l4-2", "web-1")]: edgeText(
          "Standby L4 가 VIP 를 넘겨받은 뒤 WEB #1 로 보내는 길이에요.",
          "HTTPS(TCP 443). Active 일 때와 같은 방식이에요.",
          "Standby 가 Active 가 되어도 WEB 두 대를 그대로 써야 해서 미리 이어 둬요.",
          "같은 DMZ 안이라 방화벽을 거치지 않아요.",
        ),
        [E("l4-2", "web-2")]: edgeText(
          "Standby L4 가 VIP 를 넘겨받은 뒤 WEB #2 로 보내는 길이에요.",
          "HTTPS(TCP 443). Active 일 때와 같은 방식이에요.",
          "넘겨받은 뒤에도 WEB 두 대에 나눠 보내기 위해서예요.",
          "같은 DMZ 안이라 방화벽을 거치지 않아요.",
        ),
      },
    },

    // ── 4. 내부 방화벽과 WAS 두 대 ─────────────────────────────
    {
      id: "was",
      goal: "내부 방화벽과 WAS 두 대",
      example: "내부 방화벽 뒤에 WAS 두 대를 넣어 줘",
      keywords: [["was", "와스", "웹애플리케이션서버", "웹 애플리케이션 서버", "애플리케이션 서버", "tomcat", "톰캣", "내부 방화벽", "내부방화벽"]],
      conflicts: countConflicts(
        "세 대도 틀린 구성은 아니지만, 이 가이드는 WAS 를 두 대로 맞춰요. 'WAS 두 대'로 말해 주세요.",
        "WAS 가 한 대뿐이면 멈출 때 주문을 받을 서버가 없어요. 이번에는 두 대로 해요.",
      ),
      commands: [
        group("inner", "onprem_zone", "내부 구역", "idc"),
        group("was-pool", "redundancy_group", "WAS 묶음", "inner"),
        node("fw-int", "firewall", "내부 방화벽", "inner", "HA 한 쌍", { port: "8080", rules: FW_INT_RULES_4, vip: "10.10.20.1" }),
        node("was-1", "was", "WAS #1", "was-pool", "Tomcat 10.1", server("shop-was01", "10.10.20.11", "Tomcat 10.1", "16 Core", "32GB", "200GB")),
        node("was-2", "was", "WAS #2", "was-pool", "Tomcat 10.1", server("shop-was02", "10.10.20.12", "Tomcat 10.1", "16 Core", "32GB", "200GB")),
        edge("web-1", "fw-int", "request", "HTTP 8080"),
        edge("web-2", "fw-int", "request", "HTTP 8080"),
        edge("fw-int", "was-1", "request", "HTTP 8080"),
        edge("fw-int", "was-2", "request", "HTTP 8080"),
      ],
      say: "DMZ 뒤에 내부 구역을 만들고 그 입구에 내부 방화벽을 뒀어요. 상품·주문을 계산하는 WAS 두 대는 여기 있어요. WEB 서버가 보낸 8080 요청만 내부 방화벽을 지나 WAS 에 닿아요.",
      notes: [
        { kind: "net", text: "내부 구역은 인터넷에서 바로 닿지 않아요. DMZ 의 WEB 서버를 거치고 내부 방화벽을 한 번 더 지나야 해요." },
        { kind: "flow", text: "WEB 서버가 WAS 두 대에 요청을 나눠요(Nginx upstream). WAS 하나가 멈추면 WEB 이 남은 WAS 로 보내요." },
        { kind: "caution", text: "DB 를 WAS 와 다른 구역으로 한 번 더 나누고 방화벽을 두는 곳도 있어요. 이 가이드는 한 구역으로 단순하게 둬요." },
      ],
      miss: "이번 단계는 내부 방화벽 뒤의 WAS 두 대예요. '내부 방화벽 뒤에 WAS 두 대를 넣어 줘'처럼 말해 보세요.",
      explains: {
        [G("inner")]: groupText(
          "WAS·DB·캐시처럼 고객 정보와 주문을 다루는 서버를 모아 둔 구역이에요. 바깥 요청은 반드시 DMZ 와 내부 방화벽을 거쳐야 닿아요.",
          "DMZ 의 WEB 서버에서 8080 이 들어오고, 바깥으로 나갈 때는 DMZ 의 프록시를 거쳐요. 운영자는 사내 전용 회선으로 들어와요.",
          ["WAS·DB 를 DMZ 와 다른 구역에 둔다", "공개 서버가 뚫려도 데이터까지는 방화벽이 한 번 더 막는다", "DMZ 에 WAS·DB 를 함께 둔다", "구역 사이 통신마다 방화벽 규칙을 열어야 한다"],
          { term: "내부 구역", definition: "내부 구역은 인터넷에서 직접 닿지 않도록 방화벽 뒤에 둔 서버 구역으로, 업무 서버와 데이터를 둡니다." },
        ),
        [G("was-pool")]: groupText(
          "WAS 두 대를 묶은 영역이에요. 두 대가 함께 요청을 처리하고, 로그인 세션은 서버 밖 Redis 에 둬 어느 WAS 로 가도 로그인이 이어져요.",
          "내부 방화벽을 거쳐 WEB 서버에서 8080 이 들어오고, DB·캐시·NAS·대기열로 요청이 나가요.",
          ["WAS 는 두 대가 함께 일하고 세션은 서버 밖에 둔다", "한 대가 멈춰도 고객이 다시 로그인하지 않는다", "세션을 각 WAS 에 두고 WEB(Nginx)이 세션 쿠키 값으로 같은 WAS 에 고정(스티키)", "세션 저장소(Redis)를 따로 운영해야 한다"],
        ),
        [N("fw-int")]: nodeText(
          "DMZ 와 내부 구역 사이의 두 번째 문지기예요. WEB 서버가 WAS 로 가는 8080 처럼 정해진 통신만 통과시켜요.",
          ["외부 방화벽과 따로 내부 방화벽을 둔다", "외부 방화벽이 뚫려도 내부 구역을 한 번 더 지킨다", "방화벽 하나에 DMZ·내부 구역을 모두 잇는다", "장비와 규칙 관리가 두 배로 든다"],
        ),
        [N("was-1")]: nodeText(
          "상품 조회·장바구니·주문 같은 쇼핑몰 기능을 계산하는 서버예요. DB·캐시에서 데이터를 읽고 써서 결과를 WEB 서버로 돌려줘요.",
          ["WAS 는 Tomcat 위에서 쇼핑몰 앱을 돌린다", "자바 웹 앱을 돌리는 흔한 조합이라 운영 자료가 많다", "상용 WAS(JEUS·WebLogic 등)", "기술 지원은 커뮤니티나 별도 계약에 기대야 한다"],
        ),
        [N("was-2")]: nodeText(
          "WAS #1 과 같은 앱을 돌리는 짝이에요. 평소에 요청을 나눠 받고, 한쪽을 배포할 때 다른 쪽이 서비스를 이어 가요.",
          ["두 WAS 를 번갈아 배포한다(롤링 배포)", "배포 중에도 쇼핑몰을 멈추지 않는다", "두 대를 한꺼번에 멈추고 배포한다", "옛 버전과 새 버전이 잠깐 함께 돌아도 되게 만들어야 한다"],
        ),
        [E("web-1", "fw-int")]: edgeText(
          "WEB #1 이 상품·주문 요청을 WAS 로 넘겨요.",
          "HTTP(TCP 8080). 내부 구간이라 암호화하지 않는 곳이 많아요(필요하면 TLS).",
          "WEB 은 화면 파일만 갖고 있어 계산은 WAS 에 맡겨야 해요.",
          "내부 방화벽: 10.10.10.11 → WAS 8080 허용.",
        ),
        [E("web-2", "fw-int")]: edgeText(
          "WEB #2 가 상품·주문 요청을 WAS 로 넘겨요.",
          "HTTP(TCP 8080). WEB #1 과 같은 방식이에요.",
          "어느 WEB 서버로 들어온 요청이든 WAS 에서 계산해야 해요.",
          "내부 방화벽: 10.10.10.12 → WAS 8080 허용.",
        ),
        [E("fw-int", "was-1")]: edgeText(
          "내부 방화벽을 통과한 요청이 WAS #1 에 닿아요.",
          "HTTP(TCP 8080).",
          "WEB 이 고른 WAS 로 요청을 전달하는 마지막 구간이에요.",
          "내부 방화벽: WEB 두 대 → 10.10.20.11:8080 만 허용.",
        ),
        [E("fw-int", "was-2")]: edgeText(
          "내부 방화벽을 통과한 요청이 WAS #2 에 닿아요.",
          "HTTP(TCP 8080).",
          "WEB 이 고른 WAS 로 요청을 전달하는 마지막 구간이에요.",
          "내부 방화벽: WEB 두 대 → 10.10.20.12:8080 만 허용.",
        ),
      },
    },

    // ── 5. 주문·회원 DB 이중화 ────────────────────────────────
    {
      id: "db",
      goal: "주문·회원 DB 이중화(Active-Standby)",
      example: "주문·회원 DB 를 이중화해서 넣어 줘",
      keywords: [["db", "디비", "데이터베이스", "database", "mysql", "마이에스큐엘", "oracle", "오라클", "mariadb", "마리아"]],
      commands: [
        group("db-ha", "redundancy_group", "DB 이중화", "inner"),
        node("db-1", "db_rdb", "주문·회원 DB #1", "db-ha", "Active", {
          sw: "MySQL 8.4", version: "8.4", cpu: "32 Core", ram: "128GB", disk: "2TB SSD", hostname: "shop-db01", ip: "10.10.20.31", replication: "반동기 복제(주)",
        }),
        node("db-2", "db_rdb", "주문·회원 DB #2", "db-ha", "Standby", {
          sw: "MySQL 8.4", version: "8.4", cpu: "32 Core", ram: "128GB", disk: "2TB SSD", hostname: "shop-db02", ip: "10.10.20.32", replication: "반동기 복제(대기)",
        }),
        edge("was-1", "db-1", "request", "MySQL 3306"),
        edge("was-2", "db-1", "request", "MySQL 3306"),
        edge("db-1", "db-2", "replication", "반동기 복제"),
      ],
      say: "주문·회원 DB 를 Active-Standby 로 이중화했어요. WAS 는 DB VIP(10.10.20.30)로 Active 에만 읽고 써요. Active 는 바뀐 데이터를 Standby 에 복제하고, 멈추면 Standby 가 Active 를 이어받아요.",
      notes: [
        { kind: "net", text: "L4 의 VIP 와 같은 생각이에요. 다만 DB 는 데이터까지 넘겨받아야 해서, 평소에 복제로 Standby 를 Active 와 같게 맞춰 둬요." },
        { kind: "flow", text: "WEB·WAS 는 두 대가 함께 일하지만 DB 는 한 대만 써요. 같은 데이터를 두 곳에서 함께 고치면 맞추기 어렵기 때문이에요." },
        { kind: "caution", text: "반동기 복제는 Standby 의 답을 기다려 커밋해 쓰기가 조금 느려요. 답이 10초(기본값) 넘게 없으면 비동기로 바뀌어 유실 위험이 생겨요." },
      ],
      miss: "이번 단계는 주문·회원 DB 를 이중화하는 거예요. 'DB 를 이중화해서 넣어 줘'처럼 말해 보세요.",
      explains: {
        [G("db-ha")]: groupText(
          "DB 두 대를 Active-Standby 로 묶은 영역이에요. 이중화 관리 도구가 VIP 10.10.20.30 을 Active 에 붙여 두고, 장애 때 Standby 로 옮겨요.",
          "WAS·주문 처리기·관리자 서버에서 VIP 로 3306 이 들어와요. DB 가 먼저 바깥으로 거는 통신은 없어요(감시·로그 제외).",
          ["DB 는 Active-Standby 와 반동기 복제로 둔다", "주문 데이터를 잃을 위험을 크게 줄이면서 구성이 비교적 단순하다", "Active-Active 클러스터(Galera·RAC 등)", "Standby 는 평소 쉬고, 넘어가는 동안 접속이 잠깐 끊긴다"],
        ),
        [N("db-1")]: nodeText(
          "주문·회원·상품 원본 데이터를 저장하는 Active DB 예요. 모든 읽기·쓰기를 받고, 바뀐 내용을 Standby 에 바로 복제해요.",
          ["MySQL 8.4 LTS 를 쓴다", "쇼핑몰에 흔히 쓰여 자료와 운영 인력을 구하기 쉽다", "Oracle·PostgreSQL", "자동 장애 조치 도구는 따로 골라 붙여야 한다"],
        ),
        [N("db-2")]: nodeText(
          "Active 와 같은 데이터를 복제로 받아 두는 Standby DB 예요. 평소 요청은 받지 않고, Active 가 멈추면 Active 가 되어 VIP 를 넘겨받아요.",
          ["Standby 는 평소 읽기 요청도 받지 않는다", "역할이 단순해 장애 때 바로 넘겨받을 수 있다", "Standby 를 읽기 전용으로 열어 조회를 나눈다", "Standby 서버 자원이 평소에는 쉬고 있다"],
        ),
        [E("was-1", "db-1")]: edgeText(
          "WAS #1 이 회원·주문 데이터를 읽고 써요.",
          "MySQL 프로토콜(TCP 3306)로 DB VIP 10.10.20.30 에 접속해요.",
          "쇼핑몰 원본 데이터는 DB 에만 있어요.",
          "같은 내부 구역이라 방화벽 장비를 거치지 않아요. DB 서버에서 WAS 주소만 3306 을 열어요.",
        ),
        [E("was-2", "db-1")]: edgeText(
          "WAS #2 가 회원·주문 데이터를 읽고 써요.",
          "MySQL 프로토콜(TCP 3306)로 DB VIP 10.10.20.30 에 접속해요.",
          "두 WAS 가 같은 DB 를 봐야 어느 서버로 가도 같은 주문이 보여요.",
          "같은 내부 구역이라 방화벽 장비를 거치지 않아요. DB 서버에서 WAS 주소만 3306 을 열어요.",
        ),
        [E("db-1", "db-2")]: edgeText(
          "Active 에서 바뀐 데이터가 Standby 로 그대로 복사돼요.",
          "MySQL 복제(반동기). Standby 가 받았다는 답을 기다려 커밋해요. 답이 늦으면 비동기로 바뀌어요.",
          "Active 가 멈춰도 Standby 에 같은 데이터가 있어야 이어받을 수 있어요.",
          "같은 구역 안, 두 DB 사이 3306 만 서로 열어요.",
        ),
      },
    },

    // ── 6. 세션·상품 캐시(Redis) ──────────────────────────────
    {
      id: "cache",
      goal: "세션·상품 캐시(Redis)",
      example: "WAS 옆에 Redis 캐시를 넣어 줘",
      keywords: [["redis", "레디스", "캐시", "cache", "세션"]],
      commands: [
        group("redis-ha", "redundancy_group", "Redis 이중화", "inner"),
        node("redis-1", "cache", "Redis #1", "redis-ha", "주 노드", {
          sw: "Redis 7.2", version: "7.2", cpu: "8 Core", ram: "64GB", hostname: "shop-redis01", ip: "10.10.20.41", replication: "주 노드(Sentinel 감시)",
        }),
        node("redis-2", "cache", "Redis #2", "redis-ha", "복제본", {
          sw: "Redis 7.2", version: "7.2", cpu: "8 Core", ram: "64GB", hostname: "shop-redis02", ip: "10.10.20.42", replication: "복제본(비동기)",
        }),
        edge("was-1", "redis-1", "request", "Redis 6379"),
        edge("was-2", "redis-1", "request", "Redis 6379"),
        edge("redis-1", "redis-2", "replication", "비동기 복제"),
      ],
      say: "WAS 옆에 Redis 두 대를 뒀어요. 로그인 세션과 자주 보는 상품 정보를 메모리에 두어, 세일 때 같은 상품을 여러 고객이 봐도 DB 까지 가지 않고 빠르게 돌려줘요.",
      notes: [
        { kind: "flow", text: "WAS 는 먼저 Redis 에서 상품을 찾고, 없을 때만 DB 에서 읽어 Redis 에 채워요(Cache-aside)." },
        { kind: "net", text: "Sentinel 이 Redis 를 감시해요. 주 노드가 멈추면 복제본을 주 노드로 올리고, WAS 는 Sentinel 에게 새 주소를 물어요." },
        { kind: "caution", text: "캐시는 원본이 아니에요. 가격·재고처럼 바로 맞아야 하는 값은 짧게 두거나 바뀔 때 캐시를 지워요." },
      ],
      miss: "이번 단계는 세션·상품 캐시예요. 'WAS 옆에 Redis 캐시를 넣어 줘'처럼 말해 보세요.",
      explains: {
        [G("redis-ha")]: groupText(
          "Redis 주 노드와 복제본을 묶은 영역이에요. Sentinel 3개(그림에서 생략)가 다수결로 장애를 판정해 복제본을 주 노드로 올려요.",
          "WAS 에서 6379 로 세션·상품 조회가 들어와요. Redis 가 먼저 바깥으로 거는 통신은 없어요.",
          ["Redis 는 주·복제본 두 대와 Sentinel 로 둔다", "캐시 데이터가 한 대 메모리에 들어가 나눠 담을 필요가 없다", "Redis Cluster 로 데이터를 여러 대에 나눈다", "Sentinel 을 따로 띄우고, 넘어가는 동안 잠깐 쓰기가 멈춘다"],
        ),
        [N("redis-1")]: nodeText(
          "세션과 상품 캐시를 메모리에 두는 주 노드예요. WAS 의 읽기·쓰기를 모두 받고 바뀐 내용을 복제본에 보내요.",
          ["세션을 WAS 가 아닌 Redis 에 둔다", "어느 WAS 로 가도 같은 로그인 상태를 읽을 수 있다", "WAS 끼리 세션을 복제한다(세션 클러스터링)", "Redis 가 멈추면 로그인이 풀릴 수 있어 이중화가 꼭 필요하다"],
        ),
        [N("redis-2")]: nodeText(
          "주 노드의 데이터를 받아 두는 복제본이에요. 주 노드가 멈추면 Sentinel 이 이 노드를 새 주 노드로 올려요.",
          ["복제는 비동기로 둔다", "캐시는 빠른 응답이 먼저이고, 잃어도 DB 에서 다시 채운다", "쓰기마다 복제본 응답을 기다린다(WAIT 명령)", "넘어갈 때 마지막 몇 건의 세션이 사라질 수 있다"],
        ),
        [E("was-1", "redis-1")]: edgeText(
          "WAS #1 이 세션을 확인하고 상품 정보를 캐시에서 찾아요.",
          "Redis 프로토콜(TCP 6379). Sentinel(26379)에게 물어 지금의 주 노드로 접속해요.",
          "DB 보다 훨씬 빨라 세일 때 몰리는 조회를 여기서 받아요.",
          "같은 내부 구역이라 방화벽 장비를 거치지 않아요.",
        ),
        [E("was-2", "redis-1")]: edgeText(
          "WAS #2 가 세션을 확인하고 상품 정보를 캐시에서 찾아요.",
          "Redis 프로토콜(TCP 6379). Sentinel(26379)에게 물어 지금의 주 노드로 접속해요.",
          "두 WAS 가 같은 세션을 봐야 어느 서버로 가도 로그인이 이어져요.",
          "같은 내부 구역이라 방화벽 장비를 거치지 않아요.",
        ),
        [E("redis-1", "redis-2")]: edgeText(
          "주 노드의 변경이 복제본으로 복사돼요.",
          "Redis 복제(비동기). 주 노드는 복제본의 응답을 기다리지 않아요.",
          "주 노드가 멈췄을 때 복제본이 같은 데이터로 이어받게 해요.",
          "같은 구역 안, 두 Redis 사이 6379 만 서로 열어요.",
        ),
      },
    },

    // ── 7. 상품 이미지 저장소(NAS) ────────────────────────────
    {
      id: "nas",
      goal: "상품 이미지 저장소(NAS)",
      example: "상품 이미지 저장소를 붙여 줘",
      keywords: [["nas", "나스", "이미지", "저장소", "스토리지", "storage", "파일 서버", "파일서버"]],
      commands: [
        node("nas", "file_storage", "상품 이미지 저장소", "inner", "NAS", {
          cpu: "컨트롤러 2개", ram: "컨트롤러당 64GB", disk: "50TB", ip: "10.10.20.51", hostname: "shop-nas01", replication: "컨트롤러 이중화, 매일 스냅샷", version: "NFS 4.1",
        }),
        edge("was-1", "nas", "request", "NFS 2049"),
        edge("was-2", "nas", "request", "NFS 2049"),
      ],
      say: "상품 이미지를 둘 NAS 를 내부 구역에 붙였어요. WAS 두 대가 같은 폴더를 함께 써서, 어느 WAS 로 요청이 가든 같은 이미지 파일을 읽어요.",
      notes: [
        { kind: "flow", text: "고객이 상품 이미지를 열면 WAS 가 NAS 에서 읽어 WEB 을 거쳐 돌려줘요." },
        { kind: "net", text: "NAS 는 파일을 네트워크로 나눠 쓰는 장비예요. 서버는 NFS 로 연결해 자기 디스크의 폴더처럼 써요." },
        { kind: "caution", text: "세일 때 이미지 요청이 몰리면 IDC 회선이 먼저 막혀요. 그래서 이미지 앞에 CDN 을 두는 경우가 많아요." },
      ],
      miss: "이번 단계는 상품 이미지를 둘 저장소예요. '상품 이미지 저장소를 붙여 줘'처럼 말해 보세요.",
      explains: {
        [N("nas")]: nodeText(
          "상품 이미지 파일을 모아 두는 공용 저장 장치예요. WAS·관리자 서버가 NFS 로 같은 폴더를 함께 쓰고, 컨트롤러 두 개라 한쪽이 멈춰도 이어 가요.",
          ["이미지는 DB 가 아닌 NAS 에 파일로 둔다", "큰 파일을 DB 에 넣으면 DB 가 느려지고 백업이 커진다", "WEB·WAS 서버마다 디스크에 나눠 둔다", "NAS 장비를 따로 사고 용량을 관리해야 한다"],
        ),
        [E("was-1", "nas")]: edgeText(
          "WAS #1 이 상품 이미지 파일을 읽고 써요.",
          "NFS v4.1(TCP 2049)로 NAS 폴더를 연결(마운트)해 써요.",
          "두 WAS 가 같은 이미지를 봐야 어느 서버로 가도 같은 화면이 나와요.",
          "같은 내부 구역 안이에요. NAS 에서 WAS 주소만 접근을 허용해요.",
        ),
        [E("was-2", "nas")]: edgeText(
          "WAS #2 가 상품 이미지 파일을 읽고 써요.",
          "NFS v4.1(TCP 2049)로 같은 폴더를 연결해 써요.",
          "WAS #1 이 쓴 이미지를 WAS #2 도 바로 읽을 수 있어요.",
          "같은 내부 구역 안이에요. NAS 에서 WAS 주소만 접근을 허용해요.",
        ),
      },
    },

    // ── 8. PG 결제 외부 연동(아웃바운드 프록시) ───────────────
    {
      id: "pg",
      goal: "PG 결제 외부 연동(아웃바운드 프록시)",
      example: "PG사 결제를 연동해 줘",
      keywords: [["pg", "결제", "payment", "페이먼트", "카드사", "프록시", "proxy", "아웃바운드"]],
      commands: [
        assume("external", "PG사 결제(카드 승인 API)"),
        group("ext", "external_service", "외부 결제사"),
        node("pg", "external_pg", "PG사", "ext", "결제 승인", { integration: "REST API(HTTPS), 결제창 연동" }),
        group("proxy-ha", "redundancy_group", "프록시 이중화", "dmz"),
        node("proxy-1", "generic", "아웃바운드 프록시 #1", "proxy-ha", "포워드 프록시", server("shop-proxy01", "10.10.10.21", "Squid 6", "4 Core", "8GB", "100GB")),
        node("proxy-2", "generic", "아웃바운드 프록시 #2", "proxy-ha", "포워드 프록시", server("shop-proxy02", "10.10.10.22", "Squid 6", "4 Core", "8GB", "100GB")),
        edge("user", "pg", "request", "결제창 HTTPS"),
        edge("mobile", "pg", "request", "결제창 HTTPS"),
        edge("was-1", "fw-int", "request", "프록시 3128"),
        edge("was-2", "fw-int", "request", "프록시 3128"),
        edge("fw-int", "proxy-1", "request", "프록시 3128"),
        edge("fw-int", "proxy-2", "request", "프록시 3128"),
        edge("proxy-1", "fw-ext", "request", "HTTPS 443"),
        edge("proxy-2", "fw-ext", "request", "HTTPS 443"),
        edge("fw-ext", "pg", "request", "HTTPS 443"),
        update("fw-ext", { rules: FW_EXT_RULES_8 }),
        update("fw-int", { port: "8080, 3128", rules: FW_INT_RULES_8 }),
      ],
      say: "PG사 결제를 붙였어요. 카드 정보는 고객이 PG사 결제창에 직접 넣고, 승인은 WAS 가 요청해요. 내부 구역의 WAS 는 인터넷에 바로 못 나가서 DMZ 의 프록시 두 대(VIP)를 거쳐 PG사로 나가요.",
      notes: [
        { kind: "link", text: "승인 요청은 WAS → 내부 방화벽 → 프록시 → 외부 방화벽 → PG사로 나가요. 두 방화벽에 출발지·목적지·포트를 적어 오픈을 요청해요." },
        { kind: "link", text: "PG사의 결제 결과 통보는 고객 요청과 같은 입구로 들어와요. 서버에서 PG사 IP 나 서명을 확인해 진짜 통보만 받아요." },
        { kind: "caution", text: "PG사가 우리 출구 IP 를 등록해 달라고 하기도 해요. 외부 방화벽이 바꿔 내보내는 공인 IP 를 알려 줘요." },
      ],
      miss: "이번 단계는 PG사 결제 연동이에요. 'PG사 결제를 연동해 줘'처럼 말해 보세요.",
      explains: {
        [G("ext")]: groupText(
          "우리가 운영하지 않는 바깥 회사의 서비스를 모아 둔 영역이에요. 여기서는 카드 결제를 대신 처리하는 PG사가 있어요.",
          "고객이 결제창으로 직접 오고, 쇼핑몰은 프록시와 외부 방화벽을 거쳐 승인 API 를 불러요. 결과 통보는 쇼핑몰 입구로 보내요.",
          ["카드 결제는 PG사에 맡긴다", "카드사마다 따로 계약·연동하지 않고, 카드 정보 보관 부담이 준다", "카드사·VAN 과 직접 연동한다", "결제 건마다 수수료를 내고 PG사 장애에 영향을 받는다"],
        ),
        [N("pg")]: nodeText(
          "고객의 카드 결제를 받아 카드사 승인을 대신 처리하는 결제대행사예요. 쇼핑몰은 카드 번호를 받지 않고, 결제창 인증 결과로 승인만 요청해요.",
          ["결제창 방식으로 카드 정보를 PG사가 직접 받는다", "쇼핑몰 서버에 카드 정보가 지나가지 않아 보안 부담이 준다", "쇼핑몰 화면에서 카드 정보를 받아 넘긴다", "결제 화면 흐름을 PG사 방식에 맞춰야 한다"],
        ),
        [G("proxy-ha")]: groupText(
          "아웃바운드 프록시 두 대를 Active-Standby 로 묶은 영역이에요. VIP 10.10.10.20 을 Active 가 맡고, 멈추면 Standby 가 넘겨받아요.",
          "WAS 의 승인 요청이 내부 방화벽을 거쳐 VIP 3128 로 들어오고, 외부 방화벽을 거쳐 PG사 443 으로 나가요.",
          ["프록시도 두 대로 이중화한다", "결제 승인이 지나는 길이라 한 대가 멈추면 결제도 멈춘다", "프록시 한 대만 둔다", "두 대의 허용 목적지 설정을 늘 똑같이 맞춰야 한다"],
        ),
        [N("proxy-1")]: nodeText(
          "내부 서버가 인터넷에 나갈 때 대신 나가 주는 Active 프록시예요. 허용한 목적지(PG사 승인 주소)로만 내보내고 나간 기록을 남겨요.",
          ["내부 서버는 프록시를 거쳐서만 밖으로 나간다", "나가는 목적지를 한곳에서 통제하고 기록할 수 있다", "두 방화벽에 WAS → PG사를 바로 연다", "프록시를 따로 운영하고 목적지 목록을 관리해야 한다"],
        ),
        [N("proxy-2")]: nodeText(
          "프록시 #1 과 같은 설정의 Standby 예요. 평소에는 기다리다가 Active 가 멈추면 VIP 를 넘겨받아 결제 승인 요청을 이어서 내보내요.",
          ["Standby 도 같은 허용 목록으로 둔다", "넘겨받는 순간 같은 목적지로만 내보내야 한다", "장애가 나면 방화벽을 열어 WAS 가 바로 나가게 한다", "쓰지 않는 서버도 늘 같은 설정으로 맞춰야 한다"],
        ),
        [E("user", "pg")]: edgeText(
          "고객이 PG사 결제창에서 카드 정보를 넣고 인증해요.",
          "HTTPS(TCP 443). 고객 브라우저가 PG사 주소로 직접 접속해요.",
          "카드 정보가 쇼핑몰 서버를 거치지 않게 하기 위해서예요.",
          "고객과 PG사 사이라 쇼핑몰 방화벽을 지나지 않아요.",
        ),
        [E("mobile", "pg")]: edgeText(
          "고객 앱이 PG사 결제 화면을 띄워 카드 인증을 해요.",
          "HTTPS(TCP 443). 앱 안의 웹 화면이나 결제 앱이 PG사로 바로 접속해요.",
          "앱에서도 카드 정보가 쇼핑몰 서버를 거치지 않게 해요.",
          "고객과 PG사 사이라 쇼핑몰 방화벽을 지나지 않아요.",
        ),
        [E("was-1", "fw-int")]: edgeText(
          "WAS #1 이 PG사 승인 요청을 프록시로 보내요.",
          "HTTP 프록시(TCP 3128). CONNECT 로 PG사까지 TLS 터널을 열어요.",
          "내부 구역 서버는 인터넷에 바로 나갈 수 없어 프록시를 거쳐야 해요.",
          "내부 방화벽: 10.10.20.11 → 프록시 VIP 10.10.10.20:3128 허용.",
        ),
        [E("was-2", "fw-int")]: edgeText(
          "WAS #2 가 PG사 승인 요청을 프록시로 보내요.",
          "HTTP 프록시(TCP 3128). CONNECT 로 PG사까지 TLS 터널을 열어요.",
          "어느 WAS 가 결제를 받든 같은 길로 나가요.",
          "내부 방화벽: 10.10.20.12 → 프록시 VIP 10.10.10.20:3128 허용.",
        ),
        [E("fw-int", "proxy-1")]: edgeText(
          "내부 방화벽을 지난 승인 요청이 Active 프록시에 닿아요.",
          "HTTP 프록시(TCP 3128). 프록시 VIP 10.10.10.20 으로 와요.",
          "나가는 통신을 프록시 한곳으로 모아 통제해요.",
          "내부 방화벽: WAS 두 대 → 10.10.10.20:3128 만 허용.",
        ),
        [E("fw-int", "proxy-2")]: edgeText(
          "Active 가 멈춰 VIP 가 넘어오면 승인 요청이 Standby 프록시로 와요.",
          "HTTP 프록시(TCP 3128). 같은 VIP 로 와요.",
          "프록시 한 대가 멈춰도 결제 승인이 멈추지 않게 해요.",
          "Active 와 같은 VIP 규칙을 써서 따로 열 것이 없어요.",
        ),
        [E("proxy-1", "fw-ext")]: edgeText(
          "프록시가 PG사 승인 API 로 요청을 내보내요.",
          "HTTPS(TCP 443). WAS 가 연 TLS 터널을 프록시가 이어 주고, 외부 방화벽이 출발 주소를 공인 IP 로 바꿔요.",
          "인터넷으로 나가는 출구는 외부 방화벽 하나뿐이에요.",
          "외부 방화벽: 10.10.10.21 → PG사 승인 서버 IP 443 허용.",
        ),
        [E("proxy-2", "fw-ext")]: edgeText(
          "Standby 가 Active 가 되었을 때 PG사로 내보내는 길이에요.",
          "HTTPS(TCP 443). 프록시 #1 과 같은 방식이에요.",
          "넘겨받은 뒤에도 같은 출구로 나가야 해요.",
          "외부 방화벽: 10.10.10.22 → PG사 승인 서버 IP 443 허용.",
        ),
        [E("fw-ext", "pg")]: edgeText(
          "승인 요청이 인터넷을 지나 PG사에 닿고, 승인 결과가 돌아와요.",
          "HTTPS(TCP 443) REST API. PG사가 준 가맹점 키로 요청을 인증해요.",
          "카드 승인은 PG사만 할 수 있어 쇼핑몰이 직접 요청해야 해요.",
          "외부 방화벽의 나가는 규칙(프록시 → PG사 IP 443)으로만 열어요.",
        ),
      },
    },

    // ── 9. 주문 대기열(큐) ─────────────────────────────────────
    {
      id: "queue",
      goal: "주문 대기열(큐)",
      example: "주문이 몰릴 때를 대비해 대기열을 넣어 줘",
      keywords: [["대기열", "큐", "queue", "rabbitmq", "래빗", "kafka", "카프카", "mq", "메시지"]],
      commands: [
        node("mq", "queue", "주문 대기열", "inner", "RabbitMQ 4.0 · 3대", {
          sw: "RabbitMQ 4.0", version: "4.0", brokers: "3", os: OS, cpu: "8 Core", ram: "16GB", hostname: "shop-mq01~03", ip: "10.10.20.61~63",
        }),
        group("order-pool", "redundancy_group", "주문 처리 묶음", "inner"),
        node("order-1", "app_server", "주문 처리기 #1", "order-pool", "Spring Boot 3.5", server("shop-order01", "10.10.20.71", "Spring Boot 3.5", "8 Core", "16GB", "100GB")),
        node("order-2", "app_server", "주문 처리기 #2", "order-pool", "Spring Boot 3.5", server("shop-order02", "10.10.20.72", "Spring Boot 3.5", "8 Core", "16GB", "100GB")),
        edge("was-1", "mq", "async", "AMQP 5672"),
        edge("was-2", "mq", "async", "AMQP 5672"),
        edge("mq", "order-1", "async", "AMQP 5672"),
        edge("mq", "order-2", "async", "AMQP 5672"),
        edge("order-1", "db-1", "request", "MySQL 3306"),
        edge("order-2", "db-1", "request", "MySQL 3306"),
      ],
      say: "주문 대기열과 주문 처리기 두 대를 넣었어요. 결제 승인까지는 WAS 가 바로 하고, 배송 요청·알림·포인트 적립처럼 조금 늦어도 되는 일은 대기열에 넣어 처리기가 차례로 꺼내 처리해요.",
      notes: [
        { kind: "flow", text: "결제 승인은 바로 하고, 배송·알림·적립 같은 후속 일만 대기열에 쌓여요. 처리기가 감당할 만큼씩 꺼내 DB 쓰기가 한꺼번에 몰리지 않아요." },
        { kind: "caution", text: "대기열은 같은 메시지를 두 번 줄 수 있어요. 처리기는 주문 번호로 이미 처리했는지 보고 건너뛰어야 해요." },
        { kind: "caution", text: "처리기 여러 대가 나눠 꺼내면 처리 순서가 섞일 수 있어요. 같은 주문의 일이 순서에 기대지 않게 만들어요." },
      ],
      miss: "이번 단계는 배송·알림 같은 주문 후속 일을 받아 둘 대기열이에요. '주문 대기열을 넣어 줘'처럼 말해 보세요.",
      explains: {
        [N("mq")]: nodeText(
          "결제를 마친 주문의 후속 일(배송·알림·적립) 메시지를 받아 두었다가 처리기에 차례로 건네는 대기열이에요. 3대 클러스터의 쿼럼 큐라 한 대가 멈춰도 메시지를 잃지 않아요.",
          ["늦어도 되는 주문 후속 일은 대기열로 넘긴다", "몰릴 때도 WAS 는 빨리 답하고, 뒤쪽 일은 처리기가 제 속도로 한다", "WAS 가 배송 요청·알림까지 끝낸 뒤 답한다", "처리가 조금 늦을 수 있고, 중복·순서 처리를 앱이 맡는다"],
        ),
        [G("order-pool")]: groupText(
          "대기열에서 주문 메시지를 꺼내 배송 요청·알림·포인트 적립을 처리하는 서버 두 대예요. 두 대가 나눠 꺼내므로 한 대가 멈춰도 나머지가 이어 처리해요.",
          "대기열에서 5672 로 메시지를 받고, DB 에 3306 으로 결과를 써요.",
          ["처리기는 WAS 와 다른 서버로 둔다", "세일 때 처리기만 따로 늘리고, 고객 응답 속도에 영향을 주지 않는다", "WAS 안에서 메시지도 함께 처리한다", "서버와 배포 대상이 하나 더 는다"],
        ),
        [N("order-1")]: nodeText(
          "대기열에서 주문 메시지를 하나씩 꺼내 처리하고, 끝나면 대기열에 완료를 알려(ack) 메시지를 지워요.",
          ["처리가 끝난 뒤에 완료를 알린다(수동 ack)", "처리 중 멈추면 메시지가 대기열로 돌아가 다른 처리기가 이어 한다", "꺼내자마자 완료로 친다(자동 ack)", "같은 메시지가 두 번 올 수 있어 중복을 걸러야 한다"],
        ),
        [N("order-2")]: nodeText(
          "주문 처리기 #1 과 같은 일을 하는 짝이에요. 두 대가 대기열을 함께 비우므로 몰릴 때 처리 속도를 높여요.",
          ["대기열이 쌓이면 처리기 대수를 늘린다", "쌓인 메시지가 늘면 처리기를 더해 빨리 비운다", "처리기 수를 고정한다", "늘린 처리기만큼 DB 쓰기도 늘어 DB 가 견디는지 봐야 한다"],
        ),
        [E("was-1", "mq")]: edgeText(
          "결제를 마친 주문의 '주문 접수' 메시지를 대기열에 넣어요.",
          "AMQP(TCP 5672). 대기열이 받았다고 확인해 주면(publisher confirm) 끝내요.",
          "WAS 가 뒤쪽 일을 기다리지 않고 고객에게 바로 답하려고요.",
          "같은 내부 구역 안이라 방화벽 장비를 거치지 않아요.",
        ),
        [E("was-2", "mq")]: edgeText(
          "WAS #2 가 받은 주문의 '주문 접수' 메시지를 대기열에 넣어요.",
          "AMQP(TCP 5672). 대기열의 확인을 받고 끝내요.",
          "어느 WAS 가 주문을 받든 같은 대기열로 모아요.",
          "같은 내부 구역 안이라 방화벽 장비를 거치지 않아요.",
        ),
        [E("mq", "order-1")]: edgeText(
          "대기열에 쌓인 주문 메시지를 처리기 #1 에 건네요.",
          "AMQP(TCP 5672). 처리기가 대기열에 붙어 있다가 메시지를 받아요.",
          "처리기가 감당할 만큼씩 받아 처리하게 해요.",
          "같은 내부 구역 안이라 방화벽 장비를 거치지 않아요.",
        ),
        [E("mq", "order-2")]: edgeText(
          "대기열에 쌓인 주문 메시지를 처리기 #2 에 건네요.",
          "AMQP(TCP 5672). 두 처리기가 메시지를 나눠 받아요.",
          "처리기 두 대가 함께 비워 몰린 주문을 빨리 처리해요.",
          "같은 내부 구역 안이라 방화벽 장비를 거치지 않아요.",
        ),
        [E("order-1", "db-1")]: edgeText(
          "처리기 #1 이 주문 상태를 '배송 준비'로 바꾸고 포인트를 적립해요.",
          "MySQL(TCP 3306), DB VIP 로 접속해요.",
          "처리 결과는 원본 DB 에 남겨야 해요.",
          "같은 내부 구역 안이라 방화벽 장비를 거치지 않아요.",
        ),
        [E("order-2", "db-1")]: edgeText(
          "처리기 #2 가 주문 상태를 '배송 준비'로 바꾸고 포인트를 적립해요.",
          "MySQL(TCP 3306), DB VIP 로 접속해요.",
          "처리 결과는 원본 DB 에 남겨야 해요.",
          "같은 내부 구역 안이라 방화벽 장비를 거치지 않아요.",
        ),
      },
    },

    // ── 10. 운영자 관리자 화면 ─────────────────────────────────
    {
      id: "admin",
      goal: "운영자 관리자 화면",
      example: "운영자가 쓰는 관리자 화면을 붙여 줘",
      keywords: [["관리자", "운영자", "어드민", "admin", "백오피스", "back office"]],
      commands: [
        node("operator", "admin_user", "운영자", null),
        group("admin-ha", "redundancy_group", "관리자 서버 이중화", "inner"),
        node("admin-1", "was", "관리자 WAS #1", "admin-ha", "Active", server("shop-admin01", "10.10.20.81", "Tomcat 10.1", "8 Core", "16GB", "100GB")),
        node("admin-2", "was", "관리자 WAS #2", "admin-ha", "Standby", server("shop-admin02", "10.10.20.82", "Tomcat 10.1", "8 Core", "16GB", "100GB")),
        edge("operator", "fw-int", "request", "HTTPS 8443"),
        edge("fw-int", "admin-1", "request", "HTTPS 8443"),
        edge("fw-int", "admin-2", "request", "HTTPS 8443"),
        edge("admin-1", "db-1", "request", "MySQL 3306"),
        edge("admin-2", "db-1", "request", "MySQL 3306"),
        edge("admin-1", "nas", "request", "NFS 2049"),
        edge("admin-2", "nas", "request", "NFS 2049"),
        update("fw-int", { port: "8080, 3128, 8443", rules: FW_INT_RULES_10 }),
      ],
      say: "운영자용 관리자 서버 두 대를 내부 구역에 뒀어요. 운영자는 인터넷이 아니라 사내 전용 회선으로 들어와 내부 방화벽을 지나요. 고객 입구(DMZ)와 길을 아예 나눴어요.",
      notes: [
        { kind: "net", text: "관리자 화면은 고객 입구에 열지 않아요. 사내망(172.16.0.0/16)에서 온 요청만 내부 방화벽이 통과시켜요." },
        { kind: "caution", text: "재택처럼 밖에서 들어와야 하면 VPN 으로 사내망에 먼저 붙게 하고, 로그인에는 2단계 인증을 써요." },
        { kind: "flow", text: "관리자 서버는 상품·주문을 DB 에서 고치고, 운영자가 올린 상품 이미지는 NAS 에 저장해요." },
      ],
      miss: "이번 단계는 운영자가 쓰는 관리자 화면이에요. '관리자 화면을 붙여 줘'처럼 말해 보세요.",
      explains: {
        [N("operator")]: nodeText(
          "상품을 올리고 주문·회원을 관리하는 쇼핑몰 운영자예요. 회사 사무실에서 사내 전용 회선으로 IDC 의 관리자 서버에 접속해요.",
          ["운영자는 사내망에서만 관리자 화면에 들어온다", "관리자 권한이 털리면 피해가 커서 접속 위치를 좁힌다", "관리자 화면도 인터넷에 열고 로그인만 강화한다", "밖에서 일할 때는 VPN 을 거쳐야 해 번거롭다"],
        ),
        [G("admin-ha")]: groupText(
          "관리자 서버 두 대를 Active-Standby 로 묶은 영역이에요. VIP 10.10.20.80 을 Active 가 맡고, 멈추면 Standby 가 넘겨받아요.",
          "사내망에서 내부 방화벽을 거쳐 8443 이 들어오고, DB(3306)와 NAS(2049)로 나가요.",
          ["관리자 서버는 L4 없이 VIP 로만 이중화한다", "쓰는 사람이 적어 나눠 받을 필요 없이 장애 대비만 하면 된다", "고객용 L4 를 함께 써서 Active-Active 로 둔다", "Standby 한 대는 평소 쉬고 있다"],
        ),
        [N("admin-1")]: nodeText(
          "상품 등록·주문 관리 같은 운영 기능을 돌리는 Active 관리자 서버예요. 고객용 WAS 와 앱을 나눠 운영 기능이 고객 쪽에 드러나지 않아요.",
          ["관리자 앱을 고객용 WAS 와 다른 서버로 둔다", "고객 입구로는 관리 기능에 닿을 길 자체가 없다", "고객용 WAS 에 관리자 주소만 따로 둔다", "서버와 배포 대상이 늘어난다"],
        ),
        [N("admin-2")]: nodeText(
          "관리자 WAS #1 과 같은 앱을 둔 Standby 예요. 평소에는 기다리다가 Active 가 멈추면 VIP 를 넘겨받아요.",
          ["Standby 도 같은 버전으로 함께 배포한다", "넘겨받는 순간 같은 기능이 돌아야 한다", "장애가 나면 새 서버를 만든다", "쓰지 않는 서버도 늘 최신으로 맞춰야 한다"],
        ),
        [E("operator", "fw-int")]: edgeText(
          "운영자 PC 의 관리자 화면 요청이 IDC 로 들어와요.",
          "HTTPS(TCP 8443). 인터넷이 아닌 사내 전용 회선을 지나요.",
          "관리자 화면은 인터넷 입구가 아닌 사내망 길로만 열어 둬요.",
          "내부 방화벽: 172.16.0.0/16 → 관리자 VIP 10.10.20.80:8443 허용.",
        ),
        [E("fw-int", "admin-1")]: edgeText(
          "통과한 관리자 요청이 Active 관리자 서버에 닿아요.",
          "HTTPS(TCP 8443). 관리자 VIP 10.10.20.80 으로 와요.",
          "운영자는 VIP 만 알면 어느 서버가 Active 든 접속돼요.",
          "사내망에서 출발한 요청만 허용해요.",
        ),
        [E("fw-int", "admin-2")]: edgeText(
          "Active 가 멈춰 VIP 가 넘어오면 관리자 요청이 Standby 로 와요.",
          "HTTPS(TCP 8443). 같은 VIP 로 와요.",
          "장애 때도 운영자가 접속 주소를 바꾸지 않게 해요.",
          "Active 와 같은 VIP 규칙을 써서 따로 열 것이 없어요.",
        ),
        [E("admin-1", "db-1")]: edgeText(
          "운영자가 고친 상품·주문 정보를 DB 에 써요.",
          "MySQL(TCP 3306), DB VIP 로 접속해요.",
          "관리 기능도 원본 DB 를 고쳐야 고객 화면에 반영돼요.",
          "같은 내부 구역이라 방화벽 장비를 거치지 않아요.",
        ),
        [E("admin-2", "db-1")]: edgeText(
          "Standby 가 Active 가 되었을 때 DB 를 쓰는 길이에요.",
          "MySQL(TCP 3306), DB VIP 로 접속해요.",
          "넘겨받은 뒤에도 같은 DB 를 고쳐야 해요.",
          "같은 내부 구역이라 방화벽 장비를 거치지 않아요.",
        ),
        [E("admin-1", "nas")]: edgeText(
          "운영자가 올린 상품 이미지를 NAS 에 저장해요.",
          "NFS v4.1(TCP 2049).",
          "WAS 가 같은 폴더에서 바로 읽어 고객에게 보여 줘요.",
          "같은 내부 구역 안이에요. NAS 에서 관리자 서버 주소도 허용해요.",
        ),
        [E("admin-2", "nas")]: edgeText(
          "Standby 가 Active 가 되었을 때 이미지를 저장하는 길이에요.",
          "NFS v4.1(TCP 2049).",
          "넘겨받은 뒤에도 이미지를 같은 폴더에 올려야 해요.",
          "같은 내부 구역 안이에요. NAS 에서 관리자 서버 주소도 허용해요.",
        ),
      },
    },

    // ── 11. 모니터링·로그 수집 ─────────────────────────────────
    {
      id: "ops",
      goal: "모니터링·로그 수집",
      example: "모니터링과 로그 수집을 붙여 줘",
      keywords: [["모니터링", "monitoring", "로그", "log", "zabbix", "자빅스", "elk", "관제", "감시", "지표"]],
      commands: [
        group("mgmt", "onprem_zone", "운영 관리 구역", "idc"),
        node("mon", "monitoring", "모니터링", "mgmt", "Zabbix 7.0", { ...server("shop-zabbix01", "10.10.30.11", "Zabbix 7.0", "8 Core", "16GB", "500GB"), version: "7.0" }),
        node("log", "logging", "로그 수집", "mgmt", "ELK 스택 8.17", { ...server("shop-elk01", "10.10.30.21", "ELK 스택", "16 Core", "64GB", "10TB"), version: "8.17" }),
        edge("mon", "dmz", "aux", "상태 수집"),
        edge("mon", "inner", "aux", "상태 수집"),
        edge("dmz", "log", "aux", "로그 전송"),
        edge("inner", "log", "aux", "로그 전송"),
        edge("mon", "operator", "aux", "장애 알림"),
        update("fw-int", { port: "8080, 3128, 8443, 10050, 161, 5044", rules: FW_INT_RULES_11 }),
      ],
      say: "운영 관리 구역에 모니터링(Zabbix)과 로그 수집(ELK)을 뒀어요. 서버와 장비의 상태를 모아 보고 이상하면 운영자에게 알려요. 서버 로그도 한곳에 모아 장애 원인을 찾아요.",
      notes: [
        { kind: "flow", text: "Zabbix 가 서버의 에이전트(10050)에 상태를 묻고, 각 서버의 Filebeat 가 로그를 Logstash(5044)로 보내요." },
        { kind: "net", text: "관리 구역과 DMZ·내부 구역 사이의 감시 통신도 내부 방화벽에 정해진 포트만 열어요." },
        { kind: "caution", text: "세일 전에 CPU·DB 연결 수·대기열 길이에 알림 기준을 걸어 두세요. 몰린 뒤에 보면 늦어요." },
      ],
      miss: "이번 단계는 모니터링과 로그 수집이에요. '모니터링과 로그 수집을 붙여 줘'처럼 말해 보세요.",
      explains: {
        [G("mgmt")]: groupText(
          "모니터링과 로그 수집 서버를 둔 구역이에요. 고객 요청은 여기로 오지 않고, 운영에 필요한 통신만 드나들어요.",
          "DMZ·내부 구역 서버에 상태를 물으러 나가고(10050·161), 그쪽 로그가 들어와요(5044). 운영자에게 알림을 보내요.",
          ["감시 서버는 서비스 구역과 다른 구역에 둔다", "서비스 구역에 문제가 생겨도 감시는 살아 있어야 한다", "내부 구역에 함께 둔다", "방화벽에 감시용 규칙을 따로 열어야 한다"],
          { term: "운영 관리 구역", definition: "운영 관리 구역은 감시·로그 수집처럼 운영에만 쓰는 서버를 서비스 서버와 따로 모아 둔 구역입니다." },
        ),
        [N("mon")]: nodeText(
          "서버·L4·방화벽의 CPU·메모리·응답 상태를 주기적으로 모아 그래프로 보여 주고, 기준을 넘으면 운영자에게 알려요.",
          ["Zabbix 로 서버와 장비를 함께 감시한다", "에이전트와 SNMP 를 함께 써 서버와 장비를 한 화면에서 본다", "Prometheus·Grafana 로 감시한다", "감시 서버 자체도 백업하고 관리해야 한다"],
        ),
        [N("log")]: nodeText(
          "각 서버의 접속·오류 로그를 한곳에 모아 검색하게 해 줘요. 장애가 나면 어느 서버에서 무슨 일이 있었는지 시간순으로 찾아요.",
          ["로그는 서버마다 두지 않고 ELK 로 모은다", "서버가 여러 대라 한곳에서 검색해야 원인을 빨리 찾는다", "서버마다 접속해 로그 파일을 직접 본다", "로그 양만큼 저장 공간이 들어 보관 기간을 정해야 한다"],
        ),
        [E("mon", "dmz")]: edgeText(
          "Zabbix 가 DMZ 의 WEB·프록시 서버와 L4·방화벽 상태를 모아요.",
          "서버는 Zabbix 에이전트(TCP 10050)에, 장비는 SNMP(UDP 161)로 물어요.",
          "고객 입구 쪽이 멈추면 가장 먼저 알아야 해요.",
          "내부 방화벽: 관리 구역 → DMZ 10050·161 허용.",
        ),
        [E("mon", "inner")]: edgeText(
          "Zabbix 가 내부 구역의 WAS·DB·캐시·대기열 상태를 모아요.",
          "Zabbix 에이전트(TCP 10050)에 물어요.",
          "DB 연결 수나 대기열 길이처럼 몰림의 신호를 봐야 해요.",
          "내부 방화벽: 관리 구역 → 내부 구역 10050 허용.",
        ),
        [E("dmz", "log")]: edgeText(
          "DMZ 서버들의 접속·오류 로그가 로그 수집 서버로 가요.",
          "각 서버의 Filebeat 가 Logstash(TCP 5044)로 보내요.",
          "공격 시도나 오류를 한곳에서 찾아보려고요.",
          "내부 방화벽: DMZ → 관리 구역 5044 허용.",
        ),
        [E("inner", "log")]: edgeText(
          "내부 구역 서버들의 앱·오류 로그가 로그 수집 서버로 가요.",
          "각 서버의 Filebeat 가 Logstash(TCP 5044)로 보내요.",
          "주문 실패 같은 문제를 서버를 돌아다니지 않고 찾으려고요.",
          "내부 방화벽: 내부 구역 → 관리 구역 5044 허용.",
        ),
        [E("mon", "operator")]: edgeText(
          "기준을 넘은 경보가 운영자에게 가요.",
          "Zabbix 알림 기능으로 메일·문자·메신저를 보내요.",
          "몰림이나 장애를 사람이 바로 알아야 대응해요.",
          "사내 메일·문자 발송 서버로 가는 길만 열어요.",
        ),
      },
    },

    // ── 12. 상품 보기·결제 흐름 ────────────────────────────────
    {
      id: "flows",
      goal: "상품 보기·결제 흐름",
      example: "상품 보기와 결제 흐름을 정리해 줘",
      keywords: [["흐름", "flow", "경로", "과정", "시나리오"]],
      commands: [
        flow("product-view", "상품 보기", "user", "고객이 브라우저로 상품 상세를 연다.", "상품 정보와 이미지를 화면에 돌려준다.", [
          ["user", "fw-ext", "상품 요청", "고객 브라우저가 외부 방화벽으로 상품 페이지를 요청한다."],
          ["fw-ext", "l4-1", "통과", "허용된 443 요청을 L4 VIP 로 넘긴다."],
          ["l4-1", "web-1", "분산", "Active L4 가 WEB 서버 한 대를 고른다."],
          ["web-1", "fw-int", "WAS 호출", "WEB 이 TLS 를 풀고 내부 방화벽을 거쳐 WAS 를 부른다."],
          ["fw-int", "was-1", "통과", "허용된 8080 요청만 WAS 로 넘긴다."],
          ["was-1", "redis-1", "캐시 조회", "WAS 가 Redis 에서 상품 정보를 먼저 찾는다."],
          ["was-1", "db-1", "DB 조회", "캐시에 없으면 DB 에서 읽고 Redis 에 채운다."],
          ["was-1", "nas", "이미지 읽기", "WAS 가 NAS 에서 상품 이미지를 읽는다."],
        ]),
        flow("checkout", "결제", "user", "고객이 앱에서 주문을 결제한다.", "결제 결과와 주문 번호를 돌려주고, 배송 준비는 대기열로 넘긴다.", [
          ["mobile", "pg", "카드 인증", "고객 앱이 PG사 결제창을 열어 카드 정보를 넣고 인증한다."],
          ["mobile", "fw-ext", "승인 요청", "인증 결과를 가지고 쇼핑몰에 결제 승인을 요청한다."],
          ["fw-ext", "l4-1", "통과", "허용된 443 요청을 L4 VIP 로 넘긴다."],
          ["l4-1", "web-2", "분산", "Active L4 가 WEB 서버 한 대를 고른다."],
          ["web-2", "fw-int", "WAS 호출", "WEB 이 내부 방화벽을 거쳐 WAS 를 부른다."],
          ["fw-int", "was-2", "통과", "허용된 8080 요청만 WAS 로 넘긴다."],
          ["was-2", "fw-int", "밖으로", "WAS 가 PG사 승인 API 를 부르러 프록시로 간다."],
          ["fw-int", "proxy-1", "통과", "허용된 3128 요청만 프록시로 넘긴다."],
          ["proxy-1", "fw-ext", "출구", "프록시가 외부 방화벽을 거쳐 인터넷으로 나간다."],
          ["fw-ext", "pg", "승인", "PG사가 카드사 승인을 받아 결과를 돌려준다."],
          ["was-2", "db-1", "주문 저장", "WAS 가 결제된 주문을 DB 에 저장한다."],
          ["was-2", "mq", "접수 메시지", "배송 요청·알림 같은 후속 일을 대기열에 넣는다."],
          ["mq", "order-1", "꺼내기", "주문 처리기가 메시지를 꺼낸다."],
          ["order-1", "db-1", "배송 준비", "처리기가 주문 상태를 배송 준비로 바꾼다."],
        ]),
      ],
      say: "상품 보기와 결제 두 흐름을 정리했어요. 흐름을 재생하면 요청이 어느 장비를 어떤 순서로 지나는지 볼 수 있어요.",
      notes: [
        { kind: "flow", text: "상품 보기는 캐시에서 먼저 찾고, 없을 때만 DB 로 가요. 세일 때 DB 를 지키는 핵심이에요." },
        { kind: "link", text: "결제는 고객 → PG사 결제창, WAS → 프록시 → PG사 승인의 두 갈래로 PG사와 이어져요." },
        { kind: "caution", text: "흐름에는 Active 쪽 길만 그렸어요. Standby 로 가는 길은 장애 때만 쓰여요." },
      ],
      miss: "마지막 단계는 흐름 정리예요. '상품 보기와 결제 흐름을 정리해 줘'처럼 말해 보세요.",
      explains: {},
    },
  ],
};
