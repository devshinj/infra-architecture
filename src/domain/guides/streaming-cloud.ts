// 동영상 스트리밍 — 클라우드(AWS 서울 리전).
// 가상 값: VPC 10.20.0.0/16. 서브넷은 AZ 마다 하나씩이다(공개 10.20.0.0/24·10.20.1.0/24, 앱 10.20.10.0/24·10.20.11.0/24, 데이터 10.20.20.0/24·10.20.21.0/24).
// 빈 영역이 남지 않게 영역은 그 안에 처음 무언가를 놓는 단계에서 만든다(1단계는 리전 밖의 입구, 2단계에 리전·VPC·공개 서브넷).
// 큰 영상은 API 를 거치지 않고 미리 서명한 URL 로 원본 버킷에 바로 올린다. 업로더 → 버킷을 바로 그으면 "방화벽 없는 진입" 경고가 뜨고,
// 실제로도 멀리 있는 업로더가 가까운 엣지로 들어오게 S3 Transfer Acceleration(전송 가속) 엣지를 거치게 그린다.
// 변환은 EC2 워커(FFmpeg)로 한다. MediaConvert 는 ADR 의 다른 방법으로만 말한다.
// 서버가 부르는 AWS 서비스(S3·SQS·Firehose·CloudWatch)는 VPC 엔드포인트로 닿아 NAT 를 두지 않는다.
import { assume, edge, flow, group, managed, node } from "../samples/dsl";

import { countConflicts, E, edgeText, G, groupText, N, nodeText, update } from "./authoring";
import type { GuideVariant } from "./types";

const api = (hostname: string, ip: string, az: "2a" | "2c") => ({
  sw: "Spring Boot 3.5", os: "Amazon Linux 2023", cpu: "2 vCPU (m6i.large)", ram: "8GiB", disk: "30GiB gp3", hostname, ip, az,
});
const worker = (hostname: string, ip: string, az: "2a" | "2c") => ({
  sw: "FFmpeg 7.1", os: "Amazon Linux 2023", cpu: "8 vCPU (c7i.2xlarge)", ram: "16GiB", disk: "200GiB gp3(변환 작업 공간)", hostname, ip, az,
});
const NO_VERSION = "관리형(버전 없음)";
const S3_ATTRS = { ...managed(), sw: "Amazon S3", replication: "리전 안 여러 AZ 에 자동 저장", version: NO_VERSION };

const ASG_DEF = {
  term: "Auto Scaling 그룹",
  definition: "Auto Scaling 그룹은 같은 설정의 EC2 서버를 정한 대수만큼 유지하고 부하에 따라 늘리거나 줄이는 AWS 의 서버 묶음입니다.",
};
const WORKER_DEF = {
  term: "변환 워커",
  definition: "변환 워커는 대기열에서 작업을 꺼내 원본 영상을 여러 화질의 재생용 파일로 바꾸는 서버입니다.",
};

export const STREAMING_CLOUD: GuideVariant = {
  environment: "클라우드(AWS)",
  outro:
    "업로더는 큰 영상을 서명 URL 로 원본 버킷에 바로 올리고, S3 이벤트와 SQS 가 변환 작업을 워커에 넘겨 화질별 HLS 를 변환본 버킷에 만들어요. 시청자는 서명 쿠키로 CloudFront 엣지에서 조각을 받아 보고, 시청 기록은 Firehose 가 로그 버킷에 모아요.",
  otherEnv: [
    { from: "CloudFront", to: "상용 CDN 계약, 또는 캐시 서버(Nginx) 여러 대" },
    { from: "S3 원본·변환본 버킷", to: "대용량 오브젝트 스토리지(MinIO·Ceph) 또는 NAS" },
    { from: "미리 서명한 URL·전송 가속", to: "오브젝트 스토리지의 서명 URL(S3 방식 지원 제품) 또는 업로드 전용 서버" },
    { from: "S3 이벤트 → SQS", to: "저장소 알림 + 사내 큐(RabbitMQ·Kafka)" },
    { from: "변환 워커 Auto Scaling 그룹", to: "변환 서버 여러 대(GPU 인코더 포함), 몰릴 때를 생각해 미리 넉넉히" },
    { from: "ALB", to: "L4 두 대(VIP)" },
    { from: "RDS Multi-AZ", to: "DB Active-Standby(VIP)" },
    { from: "Amazon OpenSearch", to: "OpenSearch·Elasticsearch 클러스터 직접 운영" },
    { from: "Data Firehose", to: "Kafka + 로그 수집기(Fluentd 등)" },
    { from: "CloudWatch", to: "Zabbix·ELK" },
  ],
  steps: [
    // ── 1. 시청자·업로더와 CloudFront ─────────────────────────
    {
      id: "entry",
      goal: "시청자·업로더와 CloudFront",
      example: "시청자와 업로더가 CloudFront 로 들어오게 해 줘",
      keywords: [
        ["cloudfront", "클라우드프론트", "클라우드 프런트", "cdn"],
        // "CloudFront 가 재생을 맡게"(재생 단계)는 받지 않게, 사람·입구 말이 있어야 맞음으로 본다.
        ["시청자", "업로더", "사용자", "고객", "들어", "진입", "입구", "접속", "거쳐", "cloudfront 넣", "cdn 넣", "cloudfront를 넣", "cdn을 넣"],
      ],
      commands: [
        assume("scale", "하루 업로드 2천 편, 저녁 동시 시청 5만 명"),
        node("viewer", "client_web", "시청자", null),
        node("uploader", "client_web", "업로더", null),
        node("cdn", "cdn", "CloudFront", null, "CDN", { ...managed(), sw: "Amazon CloudFront" }),
        edge("viewer", "cdn", "request", "HTTPS 443"),
        edge("uploader", "cdn", "request", "HTTPS 443"),
      ],
      say: "시청자와 영상을 올리는 업로더가 먼저 닿는 CloudFront 를 놓았어요. 영상 조각은 가까운 엣지의 캐시에서 내보내고, 로그인·영상 목록 같은 API 요청은 서울 리전으로 넘겨요.",
      notes: [
        { kind: "net", text: "CloudFront 는 특정 리전이 아니라 AWS 의 전 세계 엣지에서 돌아요. 그래서 리전 밖에 그렸어요." },
        { kind: "flow", text: "업로더도 로그인·영상 등록 같은 API 요청은 이 입구로 와요. 큰 영상 파일은 다른 길로 바로 올려요(5단계)." },
        { kind: "caution", text: "동영상 서비스는 내보내는 데이터가 아주 많아요. 엣지 캐시가 대부분을 받아 줘야 저장소와 서버가 버텨요." },
      ],
      miss: "이번 단계는 시청자와 업로더가 들어오는 입구예요. '시청자와 업로더가 CloudFront 로 들어오게 해 줘'처럼 말해 보세요.",
      explains: {
        [N("viewer")]: nodeText(
          "브라우저·휴대폰·TV 앱으로 영상을 찾아보고 재생하는 시청자예요. 서비스 주소로 접속하면 가까운 CloudFront 엣지로 연결돼요.",
          ["시청자 요청은 HTTPS 로만 받는다", "로그인 정보와 재생 권한(쿠키)이 오가므로 암호화가 필요하다", "영상 조각은 HTTP 로 내보낸다", "인증서를 발급해 CloudFront 에 붙여야 한다"],
        ),
        [N("uploader")]: nodeText(
          "영상을 올리는 크리에이터예요. 제목·설명 등록은 API 로 하고, 몇 GB 짜리 영상 파일은 원본 버킷으로 바로 올려요.",
          ["업로더도 시청자와 같은 입구로 API 를 부른다", "WAF·인증 같은 입구 설정을 한 벌로 관리한다", "업로더 전용 도메인과 서버를 따로 둔다", "업로드 접수와 시청 요청이 같은 API 서버에 섞인다"],
        ),
        [N("cdn")]: nodeText(
          "시청자와 가까운 엣지에서 요청을 받는 CDN 이에요. 영상 조각·썸네일은 캐시해 바로 내보내고, API 요청은 캐시하지 않고 서울의 ALB 로 넘겨요.",
          ["모든 시청 요청을 CloudFront 로 먼저 받는다", "같은 영상을 여러 명이 봐도 엣지 캐시가 받아 원본으로 오는 요청이 준다", "S3 나 서버가 영상을 직접 내보낸다", "내보낸 데이터 양만큼 요금이 들고, 캐시 규칙을 경로마다 정해야 한다"],
        ),
        [E("viewer", "cdn")]: edgeText(
          "시청자의 화면·API·영상 조각 요청이 가까운 CloudFront 엣지에 닿아요.",
          "HTTPS(TCP 443). 서비스 도메인이 CloudFront 를 가리켜요.",
          "영상은 엣지에서 바로 받아야 빨리 시작되고 끊기지 않아요.",
          "CloudFront 는 HTTPS 만 받게 하고, HTTP 로 오면 HTTPS 로 돌려보내요.",
        ),
        [E("uploader", "cdn")]: edgeText(
          "업로더 앱의 로그인·영상 등록·업로드 시작 같은 API 요청이 엣지에 닿아요.",
          "HTTPS(TCP 443). 시청자와 같은 도메인을 써요.",
          "업로드 시작과 서명 URL 받기는 API 가 해야 하는 일이에요.",
          "CloudFront 는 HTTPS 만 받아요. 영상 파일 자체는 이 길로 오지 않아요.",
        ),
      },
    },

    // ── 2. VPC·공개 서브넷과 ALB ───────────────────────────────
    {
      id: "alb",
      goal: "VPC·공개 서브넷과 ALB",
      example: "VPC 를 만들고 CloudFront 뒤에 ALB 를 둬 줘",
      keywords: [["alb", "로드밸런서", "로드 밸런서", "load balancer", "elb", "vpc", "공개 서브넷", "퍼블릭 서브넷"]],
      commands: [
        group("region", "cloud_region", "AWS 서울 리전"),
        group("vpc", "vpc", "스트리밍 VPC", "region"),
        group("pub", "subnet_public", "공개 서브넷", "vpc"),
        node("alb", "lb_l7", "ALB", "pub", "L7 로드밸런서", { ...managed(), sw: "AWS ALB", port: "443", rules: "443 리스너: 비밀 원본 헤더가 있으면 API 대상 그룹(8080), 없으면 403 · 헬스 체크 /health" }),
        edge("cdn", "alb", "request", "HTTPS 443"),
      ],
      say: "서울 리전에 스트리밍 VPC 를 만들고, 인터넷과 닿는 공개 서브넷에 ALB 를 뒀어요. CloudFront 는 /api 로 시작하는 요청만 ALB 로 보내고, ALB 가 그 요청을 API 서버들에 나눠요.",
      notes: [
        { kind: "net", text: "공개 서브넷에는 인터넷과 맞닿는 ALB 만 둬요. 이 구성의 서버는 인터넷에 나갈 일이 없어 NAT 게이트웨이도 두지 않아요." },
        { kind: "flow", text: "영상 조각은 ALB 로 오지 않아요. CloudFront 가 경로(/api, /videos)를 보고 갈 곳을 나눠요." },
        { kind: "caution", text: "CloudFront 주소 목록은 남의 CloudFront 도 포함해요. 그래서 우리 CloudFront 가 붙인 비밀 헤더가 있는 요청만 ALB 가 넘겨요." },
      ],
      miss: "이번 단계는 VPC 와 그 안의 ALB 예요. 'VPC 를 만들고 CloudFront 뒤에 ALB 를 둬 줘'처럼 말해 보세요.",
      explains: {
        [G("region")]: groupText(
          "서버와 영상 파일을 두는 AWS 서울 리전(ap-northeast-2)이에요. 리전 안에는 서로 떨어진 데이터센터 묶음(AZ)이 여러 곳 있어요.",
          "CloudFront 를 거친 API 요청이 ALB 로, 업로드 조각이 전송 가속 엣지를 거쳐 원본 버킷으로 들어와요. 영상 조각은 CloudFront 가 꺼내 가요.",
          ["시청자가 국내라 서울 리전에 둔다", "업로드가 빠르고, 엣지 캐시에 없는 조각도 가까운 원본에서 가져온다", "도쿄 같은 다른 리전에 둔다", "서울 리전 전체가 멈추는 일까지는 대비하지 않는다"],
        ),
        [G("vpc")]: groupText(
          "스트리밍 서비스만 쓰는 사설 네트워크(10.20.0.0/16)예요. 공개·앱·데이터 서브넷으로 나눠 서버와 DB 를 둬요.",
          "인터넷 게이트웨이를 통해 ALB 가 요청을 받아요. S3·SQS 같은 AWS 서비스에는 VPC 엔드포인트로 닿아요.",
          ["VPC 하나에 서브넷 세 층을 둔다", "계층마다 경로와 보안 그룹을 다르게 줄 수 있다", "공개 서브넷 하나에 모두 둔다", "서브넷과 경로 표를 계층·AZ 마다 관리해야 한다"],
        ),
        [G("pub")]: groupText(
          "인터넷 게이트웨이로 가는 경로가 있는 서브넷이에요. 인터넷과 직접 말해야 하는 ALB 만 둬요.",
          "CloudFront 에서 443 이 ALB 로 들어오고, 앱 서브넷의 API 서버로 8080 이 나가요.",
          ["서버는 공개 서브넷에 두지 않는다", "서버에 공인 IP 가 없어 인터넷에서 바로 닿지 않는다", "서버도 공개 서브넷에 두고 보안 그룹으로만 막는다", "서버가 인터넷에 나가야 하면 NAT 를 따로 더해야 한다"],
        ),
        [N("alb")]: nodeText(
          "CloudFront 가 넘긴 API 요청을 받아 API 서버들에 나눠 주는 L7 로드밸런서예요. 헬스 체크로 멈춘 서버를 대상에서 빼요.",
          ["관리형 ALB 로 API 요청을 나눈다", "AWS 가 여러 AZ 에 이중화하고 늘려 줘 장비 이중화가 필요 없다", "EC2 에 Nginx·HAProxy 를 직접 둔다", "시간과 처리량만큼 요금이 들고 세부 설정은 AWS 가 정한 만큼만 된다"],
        ),
        [E("cdn", "alb")]: edgeText(
          "/api 로 시작하는 요청(로그인·목록·업로드 시작·재생 권한)을 CloudFront 가 ALB 로 보내요.",
          "HTTPS(TCP 443). CloudFront 가 비밀 헤더를 붙여 ALB 에 새로 연결해요. 캐시하지 않아요.",
          "서버가 답해야 하는 요청만 원본으로 보내는 길이에요.",
          "보안 그룹은 CloudFront 접두사 목록만 443 허용, 리스너는 비밀 헤더가 없으면 403 으로 막아요.",
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
        "한 대나 한 AZ 에만 두면 그 서버나 AZ 가 멈출 때 영상 목록과 재생 권한도 멈춰요. 이번에는 두 대를 두 AZ 에 나눠요.",
      ),
      commands: [
        assume("redundancy", "서버는 두 AZ 에 나눈 Auto Scaling, DB 는 Multi-AZ"),
        group("app", "subnet_private", "앱 서브넷", "vpc"),
        group("api-asg", "redundancy_group", "API Auto Scaling 그룹", "app"),
        node("api-1", "app_server", "API #1", "api-asg", "Spring Boot 3.5", api("vod-api-2a", "10.20.10.21", "2a")),
        node("api-2", "app_server", "API #2", "api-asg", "Spring Boot 3.5", api("vod-api-2c", "10.20.11.21", "2c")),
        edge("alb", "api-1", "request", "HTTP 8080"),
        edge("alb", "api-2", "request", "HTTP 8080"),
      ],
      say: "앱 서브넷에 API 서버 두 대를 AZ 2a·2c 에 하나씩 두고 Auto Scaling 그룹으로 묶었어요. API 는 영상 목록·업로드 접수·재생 권한을 맡고, 영상 파일은 직접 주고받지 않아요.",
      notes: [
        { kind: "net", text: "앱 서브넷은 인터넷에서 먼저 들어올 수 없는 프라이빗 서브넷이에요. 요청은 ALB 를 거쳐서만 와요." },
        { kind: "flow", text: "영상 파일은 API 를 지나지 않아요. 올릴 때는 S3 로 바로, 볼 때는 CloudFront 에서 받아요. 그래서 API 는 작게 둬도 돼요." },
        { kind: "caution", text: "서버는 언제든 바뀌어요. 로그인 상태를 서버 메모리에 두지 말고 토큰이나 공용 저장소에 둬요." },
      ],
      miss: "이번 단계는 API 서버 두 대를 두 AZ 에 나눠 두는 거예요. 'API 서버 두 대를 AZ 두 곳에 나눠 넣어 줘'처럼 말해 보세요.",
      explains: {
        [G("app")]: groupText(
          "API 서버와 변환 워커를 두는 프라이빗 서브넷이에요. 서버에 공인 IP 가 없어 인터넷에서 바로 닿지 않아요.",
          "ALB 에서 8080 이 들어오고, 데이터 서브넷으로 DB·검색 요청이, VPC 엔드포인트로 S3·SQS 요청이 나가요.",
          ["서버는 프라이빗 서브넷에 둔다", "공격자가 서버에 바로 닿을 길을 없앤다", "공개 서브넷에 두고 보안 그룹으로 막는다", "AWS 서비스마다 VPC 엔드포인트를 만들어야 한다"],
        ),
        [G("api-asg")]: groupText(
          "API 서버를 최소 2대에서 최대 8대로 유지하는 묶음이에요. 두 AZ 에 고르게 두고, 멈춘 서버는 새로 띄워 ALB 대상 그룹에 다시 넣어요.",
          "ALB 에서 8080 이 들어오고, RDS·OpenSearch·원본 버킷·Firehose 로 나가요.",
          ["API 는 두 AZ 에 걸친 Auto Scaling 그룹으로 둔다", "AZ 하나가 멈춰도 이어지고, 저녁 시청이 몰리면 자동으로 늘어난다", "EC2 두 대를 고정으로 둔다", "서버가 언제든 바뀌어도 되게 앱을 상태 없이 만들어야 한다"],
          ASG_DEF,
        ),
        [N("api-1")]: nodeText(
          "영상 목록·검색·업로드 접수·재생 권한 확인을 처리하는 API 서버예요(AZ 2a). 영상 파일은 다루지 않고 정보와 권한만 다뤄요.",
          ["API 는 영상 파일을 받거나 내보내지 않는다", "큰 파일이 서버 대역폭·디스크를 잡아먹지 않아 서버가 작아도 된다", "API 서버가 업로드를 받아 S3 에 다시 올린다", "업로드·재생 권한을 서명 URL·쿠키로 따로 다뤄야 한다"],
        ),
        [N("api-2")]: nodeText(
          "API #1 과 같은 서버를 다른 AZ(2c)에 둔 짝이에요. ALB 가 두 대에 나눠 보내고, 2a 가 멈추면 이 서버가 받아요.",
          ["두 서버를 서로 다른 AZ 에 둔다", "AZ 하나의 전원·네트워크 장애를 함께 겪지 않는다", "같은 AZ 에 두 대를 둔다", "AZ 를 넘는 통신에 약간의 요금과 지연이 생긴다"],
        ),
        [E("alb", "api-1")]: edgeText(
          "ALB 가 API 요청을 API #1(2a)로 보내요.",
          "HTTP(TCP 8080). 암호는 ALB 에서 풀었어요.",
          "대상 그룹에 든 서버들에 요청을 나누는 길이에요.",
          "API 보안 그룹: ALB 보안 그룹 → 8080 만 허용.",
        ),
        [E("alb", "api-2")]: edgeText(
          "ALB 가 API 요청을 API #2(2c)로 보내요.",
          "HTTP(TCP 8080). 암호는 ALB 에서 풀었어요.",
          "두 AZ 의 서버에 나눠 보내 한쪽에 몰리지 않게 해요.",
          "API 보안 그룹: ALB 보안 그룹 → 8080 만 허용.",
        ),
      },
    },

    // ── 4. 메타데이터 DB(RDS Multi-AZ) ──────────────────────────
    {
      id: "rds",
      goal: "메타데이터 DB(RDS Multi-AZ)",
      example: "영상 정보는 RDS Multi-AZ 에 저장해 줘",
      keywords: [["rds", "db", "디비", "데이터베이스", "database", "postgres", "포스트그레스", "aurora", "오로라", "메타데이터", "메타 데이터", "metadata"]],
      commands: [
        group("data", "subnet_private", "데이터 서브넷", "vpc"),
        node("rds", "db_rdb", "메타데이터 DB", "data", "RDS PostgreSQL · Multi-AZ", {
          ...managed("yes"), sw: "Amazon RDS", version: "PostgreSQL 16.4", replication: "동기 복제(다른 AZ 대기 인스턴스)",
        }),
        edge("api-1", "rds", "request", "PostgreSQL 5432"),
        edge("api-2", "rds", "request", "PostgreSQL 5432"),
      ],
      say: "데이터 서브넷에 메타데이터 DB 를 RDS PostgreSQL Multi-AZ 로 넣었어요. 제목·설명·업로더·변환 상태·화질 목록을 여기 두고, 영상 파일은 S3 에 둬요. 주 DB 가 멈추면 다른 AZ 의 대기 DB 로 넘어가요.",
      notes: [
        { kind: "flow", text: "DB 에는 파일이 아니라 파일 위치(S3 키)와 상태만 적어요. 큰 파일을 DB 에 넣으면 백업·복제가 느려져요." },
        { kind: "net", text: "데이터 서브넷에는 VPC 밖으로 나가는 경로가 없어요. DB 는 VPC 안의 서버하고만 말해요." },
        { kind: "caution", text: "이 구성(Multi-AZ 인스턴스)의 대기 DB 는 읽기를 받지 않아요. 목록 조회가 몰리면 읽기 전용 복제본이나 캐시를 더해요." },
      ],
      miss: "이번 단계는 영상 정보를 담을 DB 예요. '영상 정보는 RDS Multi-AZ 에 저장해 줘'처럼 말해 보세요.",
      explains: {
        [G("data")]: groupText(
          "메타데이터 DB 와 검색 엔진을 두는 서브넷이에요. 경로 표에 NAT·인터넷 게이트웨이가 없어 VPC 밖으로 나가는 길이 없어요.",
          "앱 서브넷의 API 서버와 변환 워커에서 5432(RDS)·443(검색)만 들어와요. 밖으로 나가는 통신은 없어요.",
          ["DB·검색 엔진은 밖으로 나갈 길이 없는 서브넷에 둔다", "DB 가 털려도 데이터를 밖으로 바로 내보낼 길이 없다", "앱 서브넷에 함께 둔다", "서브넷과 경로 표가 하나 더 는다"],
        ),
        [N("rds")]: nodeText(
          "영상 제목·설명·업로더·변환 상태·화질별 파일 위치를 저장하는 관리형 PostgreSQL 이에요. 백업·패치·장애 조치는 AWS 가 맡아요.",
          ["메타데이터는 RDS Multi-AZ 에, 파일은 S3 에 둔다", "DB 가 작게 유지되고 장애 조치를 AWS 가 맡는다", "영상 파일까지 DB 에 넣는다", "대기 DB 몫의 요금이 더 들고, DB 서버 OS 에는 들어갈 수 없다"],
        ),
        [E("api-1", "rds")]: edgeText(
          "API #1 이 영상 목록·상세·권한 정보를 읽고, 업로드 접수를 써요.",
          "PostgreSQL(TCP 5432). RDS 엔드포인트(DNS 이름)로 접속해요.",
          "영상 정보의 원본은 이 DB 에만 있어요.",
          "RDS 보안 그룹: API 보안 그룹 → 5432 만 허용.",
        ),
        [E("api-2", "rds")]: edgeText(
          "API #2 가 영상 정보를 읽고 업로드 접수를 써요.",
          "PostgreSQL(TCP 5432). 같은 엔드포인트로 접속해요.",
          "두 AZ 의 서버가 같은 DB 를 봐야 어느 서버로 가도 같은 영상 정보가 보여요.",
          "RDS 보안 그룹: API 보안 그룹 → 5432 만 허용.",
        ),
      },
    },

    // ── 5. 원본 버킷과 바로 올리기 ─────────────────────────────
    {
      id: "upload",
      goal: "원본 버킷과 바로 올리기(서명 URL)",
      example: "원본 영상은 S3 버킷에 바로 올리게 해 줘",
      keywords: [
        ["s3", "버킷", "bucket", "오브젝트", "스토리지", "storage", "presigned", "pre signed", "미리 서명", "서명된 url", "서명 url", "멀티파트", "multipart", "전송 가속", "transfer acceleration"],
        // 변환본 버킷(8단계)·재생(9단계)·로그 버킷(10단계) 요청은 받지 않게, 올리기 말이 있어야 맞음으로 본다.
        ["올리", "올려", "올릴", "업로드", "upload", "원본", "presigned", "pre signed", "미리 서명", "멀티파트", "multipart"],
      ],
      commands: [
        node("s3-raw", "object_storage", "원본 버킷", "region", "S3 · 업로드 원본", S3_ATTRS),
        node("accel", "cdn", "전송 가속 엣지", null, "S3 Transfer Acceleration", { ...managed(), sw: "S3 Transfer Acceleration" }),
        edge("api-1", "s3-raw", "request", "S3 API HTTPS"),
        edge("api-2", "s3-raw", "request", "S3 API HTTPS"),
        edge("uploader", "accel", "request", "HTTPS 443 조각 PUT"),
        edge("accel", "s3-raw", "request", "AWS 망 HTTPS"),
      ],
      say: "원본 버킷을 만들고, 큰 영상은 API 서버를 거치지 않고 여기로 바로 올리게 했어요. API 는 업로드를 열고 조각마다 미리 서명한 URL 만 줘요. 앱은 그 URL 로 조각을 나눠 올려요(멀티파트 업로드).",
      notes: [
        { kind: "flow", text: "API 가 멀티파트 업로드를 열고 조각별 서명 URL 을 줘요. 앱이 조각을 다 올리고 알리면 API 가 조각을 하나로 합쳐요." },
        { kind: "link", text: "조각은 업로더 → 가까운 전송 가속 엣지 → AWS 망 → 원본 버킷으로 가요. 끊긴 조각만 다시 올리면 돼요." },
        { kind: "caution", text: "서명 URL 은 정한 파일 하나에 짧게만 쓰게 만들어요. 끝나지 않은 멀티파트 조각은 수명 주기 규칙으로 지워요." },
      ],
      miss: "이번 단계는 원본 영상을 저장소에 바로 올리는 길이에요. '원본 영상은 S3 버킷에 바로 올리게 해 줘'처럼 말해 보세요.",
      explains: {
        [N("s3-raw")]: nodeText(
          "업로더가 올린 원본 영상 파일을 그대로 두는 S3 버킷이에요. 공개하지 않고, 서명 URL 로 올리기와 변환 워커의 읽기만 허용해요.",
          ["원본은 따로 버킷에 두고 지우지 않는다", "화질을 더하거나 변환을 다시 할 때 원본에서 새로 만든다", "변환 뒤 원본을 지운다", "원본 저장 요금이 계속 들어, 수명 주기 규칙으로 싼 저장 등급으로 옮긴다"],
        ),
        [N("accel")]: nodeText(
          "업로더와 가까운 CloudFront 엣지에서 조각을 받아 AWS 내부 망으로 원본 버킷까지 보내 주는 S3 기능이에요. 서명 URL 도 이 주소로 만들어요.",
          ["업로드는 S3 전송 가속 주소로 받는다", "멀리 있는 업로더도 가까운 엣지에 닿아 큰 파일이 빨리, 덜 끊기며 오른다", "S3 리전 주소로 바로 올린다", "가속을 거친 만큼 GB 당 요금이 더 들어, 업로더가 가까우면 끄기도 한다"],
          {
            term: "S3 Transfer Acceleration",
            definition: "S3 Transfer Acceleration(전송 가속)은 CloudFront 엣지로 받은 데이터를 AWS 내부 망으로 S3 버킷까지 보내는 S3 의 업로드 가속 기능입니다.",
          },
        ),
        [E("api-1", "s3-raw")]: edgeText(
          "API #1 이 멀티파트 업로드를 열고 조각 서명 URL 을 만들며, 다 오르면 조각을 합쳐요.",
          "S3 API(HTTPS 443). S3 게이트웨이 엔드포인트로 NAT 없이 닿아요.",
          "업로드 시작·완료와 서명은 권한을 가진 서버만 해야 해요.",
          "API 의 IAM 역할에 원본 버킷의 업로드 관련 권한만 줘요. 영상 바이트는 이 길로 오지 않아요.",
        ),
        [E("api-2", "s3-raw")]: edgeText(
          "API #2 가 멀티파트 업로드를 열고 서명 URL 을 만들며, 다 오르면 조각을 합쳐요.",
          "S3 API(HTTPS 443). S3 게이트웨이 엔드포인트로 닿아요.",
          "어느 API 서버가 받아도 같은 버킷에 같은 방식으로 올리게 해요.",
          "API 의 IAM 역할에 원본 버킷의 업로드 관련 권한만 줘요.",
        ),
        [E("uploader", "accel")]: edgeText(
          "업로더 앱이 영상 조각을 서명 URL 로 하나씩(또는 몇 개씩 함께) 올려요.",
          "HTTPS(TCP 443) PUT. 조각마다 서명 URL 이 따로 있어요.",
          "큰 파일을 서버를 거치지 않고, 끊겨도 조각만 다시 올리게 하려고요.",
          "서명 URL 의 서명·만료 시간이 권한이에요. 정한 파일 이름과 조각 번호에만 쓸 수 있어요.",
        ),
        [E("accel", "s3-raw")]: edgeText(
          "엣지가 받은 조각을 AWS 내부 망으로 서울의 원본 버킷에 넣어요.",
          "AWS 망 안의 HTTPS 전송이에요. 우리가 따로 잇는 길은 없어요.",
          "인터넷 구간을 짧게 해 먼 곳에서도 업로드가 빨라져요.",
          "버킷 정책으로 공개 접근을 막아, 서명 URL 이 없으면 올릴 수 없어요.",
        ),
      },
    },

    // ── 6. 변환 대기열(S3 이벤트 → SQS) ─────────────────────────
    {
      id: "queue",
      goal: "변환 대기열(S3 이벤트 → SQS)",
      example: "원본이 들어오면 SQS 큐에 변환 작업을 넣어 줘",
      keywords: [["sqs", "큐", "queue", "대기열", "메시지", "s3 이벤트", "이벤트 알림", "event notification"]],
      commands: [
        node("sqs", "queue", "변환 대기열", "region", "Amazon SQS · 표준 대기열", { ...managed(), sw: "Amazon SQS", version: NO_VERSION }),
        edge("s3-raw", "sqs", "async", "S3 이벤트 알림"),
      ],
      say: "원본 버킷에 파일이 다 오르면 S3 가 이벤트를 SQS 변환 대기열에 넣게 했어요. 변환은 몇 분에서 몇십 분 걸려서, 업로드 요청 안에서 기다리지 않고 대기열에 맡겨요.",
      notes: [
        { kind: "flow", text: "멀티파트 업로드는 조각을 합친 순간 파일이 생겨요. 그때 '파일 생성' 이벤트가 대기열로 가요. 업로더에게는 '처리 중'이 보여요." },
        { kind: "caution", text: "S3 이벤트는 드물게 두 번 올 수 있어요. 변환은 영상 ID 로 이미 했는지 보고, 같은 결과 위치에 덮어쓰게 해요." },
        { kind: "caution", text: "여러 번 실패한 메시지는 DLQ(실패 대기열)로 옮겨 사람이 봐요. 안 그러면 깨진 파일이 끝없이 다시 시도돼요." },
      ],
      miss: "이번 단계는 변환 작업을 받아 둘 대기열이에요. '원본이 들어오면 SQS 큐에 변환 작업을 넣어 줘'처럼 말해 보세요.",
      explains: {
        [N("sqs")]: nodeText(
          "원본이 올라왔다는 S3 이벤트를 받아 두었다가 변환 워커가 꺼내 가게 하는 관리형 대기열이에요. AWS 가 여러 AZ 에 나눠 저장해요.",
          ["변환 요청은 S3 이벤트 → SQS 로 넘긴다", "업로드가 몰려도 작업이 쌓일 뿐 사라지지 않고, 워커가 제 속도로 꺼낸다", "API 가 업로드 완료 때 워커를 바로 부른다", "변환이 늦게 시작될 수 있고, 중복·실패 처리를 앱이 맡는다"],
        ),
        [E("s3-raw", "sqs")]: edgeText(
          "원본 파일이 생기면 S3 가 버킷·파일 이름이 든 이벤트 메시지를 대기열에 넣어요.",
          "S3 이벤트 알림(파일 생성 이벤트)이 SQS 로 가요. AWS 안에서 일어나요.",
          "업로드 완료와 변환 시작을 끊어, 업로드는 바로 끝나게 해요.",
          "SQS 대기열 정책에 이 원본 버킷에서 온 S3 이벤트만 넣을 수 있게 허용해요.",
        ),
      },
    },

    // ── 7. 변환 워커(Auto Scaling) ─────────────────────────────
    {
      id: "worker",
      goal: "변환 워커를 두 AZ 에(Auto Scaling)",
      example: "변환 워커 두 대를 AZ 두 곳에 넣어 줘",
      keywords: [["워커", "worker", "트랜스코딩", "transcoding", "트랜스코더", "transcoder", "인코딩", "encoding", "인코더", "encoder", "ffmpeg", "변환 서버", "변환하는 서버", "변환기"]],
      commands: [
        group("work-asg", "redundancy_group", "변환 워커 Auto Scaling 그룹", "app"),
        node("work-1", "app_server", "변환 워커 #1", "work-asg", "FFmpeg 7.1", worker("vod-worker-2a", "10.20.10.51", "2a")),
        node("work-2", "app_server", "변환 워커 #2", "work-asg", "FFmpeg 7.1", worker("vod-worker-2c", "10.20.11.51", "2c")),
        edge("sqs", "work-1", "async", "SQS HTTPS"),
        edge("sqs", "work-2", "async", "SQS HTTPS"),
        edge("work-1", "s3-raw", "request", "S3 HTTPS 원본 읽기"),
        edge("work-2", "s3-raw", "request", "S3 HTTPS 원본 읽기"),
      ],
      say: "변환 워커 두 대를 두 AZ 에 두고 Auto Scaling 그룹으로 묶었어요. 워커는 대기열에서 작업을 꺼내 원본을 내려받고 FFmpeg 로 변환해요. 쌓인 작업이 늘면 워커도 늘어요.",
      notes: [
        { kind: "flow", text: "워커 한 대당 쌓인 작업 수를 기준으로 대수를 늘리고 줄여요. 업로드가 적은 밤에는 최소 대수만 남겨요." },
        { kind: "caution", text: "메시지 표시 제한 시간은 변환 시간보다 길게 잡거나 작업 중에 늘려요. 짧으면 다른 워커가 같은 영상을 또 변환해요." },
        { kind: "net", text: "워커는 인터페이스 엔드포인트로 SQS 에, 게이트웨이 엔드포인트로 S3 에 닿아요. 큰 파일이 NAT 요금을 타지 않아요." },
      ],
      miss: "이번 단계는 영상을 변환하는 워커예요. '변환 워커 두 대를 AZ 두 곳에 넣어 줘'처럼 말해 보세요.",
      explains: {
        [G("work-asg")]: groupText(
          "변환 워커를 최소 2대에서 최대 20대로 유지하는 묶음이에요. 두 AZ 에 고르게 두고, 쌓인 변환 작업 수에 따라 대수를 바꿔요.",
          "SQS 에서 작업을 받아 오고(HTTPS), 원본·변환본 버킷과 RDS·OpenSearch 로 나가요. 들어오는 연결은 없어요.",
          ["변환은 API 와 다른 Auto Scaling 그룹의 워커가 한다", "변환이 CPU 를 다 써도 시청·업로드 응답에 영향이 없다", "AWS Elemental MediaConvert 에 변환을 맡긴다", "FFmpeg 설정·서버 관리를 우리가 하고, 몰릴 때 늘어나는 데 몇 분 걸린다"],
          ASG_DEF,
        ),
        [N("work-1")]: nodeText(
          "대기열에서 변환 작업을 꺼내 원본을 작업 공간 디스크로 내려받고, FFmpeg 로 화질별 HLS 와 썸네일을 만드는 서버예요(AZ 2a).",
          ["변환은 Lambda 가 아닌 EC2 워커로 한다", "긴 영상 변환은 Lambda 의 최대 실행 시간(15분)을 넘기기 쉽다", "Lambda 함수로 변환한다", "워커 서버의 OS·FFmpeg 버전을 우리가 관리한다"],
          WORKER_DEF,
        ),
        [N("work-2")]: nodeText(
          "변환 워커 #1 과 같은 일을 다른 AZ(2c)에서 하는 짝이에요. 두 대가 대기열을 함께 비워 몰릴 때 처리 속도를 높여요.",
          ["작업이 끝난 뒤에 메시지를 지운다", "변환 중 서버가 멈추면 메시지가 다시 보여 다른 워커가 처음부터 한다", "받자마자 메시지를 지운다", "같은 영상을 두 번 변환할 수 있어 결과를 덮어써도 되게 만든다"],
          WORKER_DEF,
        ),
        [E("sqs", "work-1")]: edgeText(
          "워커 #1 이 대기열에서 변환 작업(버킷·파일 이름)을 받아 와요.",
          "SQS API(HTTPS 443). 워커가 롱 폴링으로 메시지를 가져가요.",
          "워커가 감당할 만큼씩만 꺼내 변환하게 해요.",
          "워커 보안 그룹: 나가는 443 허용. SQS 인터페이스 엔드포인트로 VPC 안에서 닿아요.",
        ),
        [E("sqs", "work-2")]: edgeText(
          "워커 #2 가 대기열에서 변환 작업을 받아 와요.",
          "SQS API(HTTPS 443). 두 워커가 메시지를 나눠 받아요.",
          "워커 두 대가 함께 비워 쌓인 작업을 빨리 줄여요.",
          "워커 보안 그룹: 나가는 443 허용.",
        ),
        [E("work-1", "s3-raw")]: edgeText(
          "워커 #1 이 변환할 원본 영상을 작업 공간 디스크로 내려받아요.",
          "S3 API(HTTPS 443) GET. S3 게이트웨이 엔드포인트로 NAT 없이 닿아요.",
          "원본은 몇 GB 라 NAT 를 거치면 GB 당 처리 요금이 붙어요.",
          "워커의 IAM 역할에 원본 버킷 읽기만 허용해요.",
        ),
        [E("work-2", "s3-raw")]: edgeText(
          "워커 #2 가 변환할 원본 영상을 내려받아요.",
          "S3 API(HTTPS 443) GET. S3 게이트웨이 엔드포인트로 닿아요.",
          "어느 워커가 맡아도 같은 원본을 읽어요.",
          "워커의 IAM 역할에 원본 버킷 읽기만 허용해요.",
        ),
      },
    },

    // ── 8. 변환본 버킷(화질별 HLS) ─────────────────────────────
    {
      id: "output",
      goal: "변환본 버킷(화질별 HLS)",
      example: "변환한 영상은 HLS 로 다른 버킷에 저장해 줘",
      keywords: [["hls", "m3u8", "변환본", "변환한 영상", "변환된 영상", "abr", "화질별", "적응형", "adaptive", "출력 버킷", "결과 버킷", "썸네일", "thumbnail", "dash"]],
      commands: [
        node("s3-out", "object_storage", "변환본 버킷", "region", "S3 · HLS 조각·썸네일", S3_ATTRS),
        edge("work-1", "s3-out", "request", "S3 HTTPS HLS 저장"),
        edge("work-2", "s3-out", "request", "S3 HTTPS HLS 저장"),
        edge("work-1", "rds", "request", "PostgreSQL 5432"),
        edge("work-2", "rds", "request", "PostgreSQL 5432"),
      ],
      say: "변환본 버킷을 원본과 따로 만들었어요. 워커는 1080p·720p·480p 화질마다 몇 초짜리 HLS 조각과 재생 목록, 썸네일을 여기 저장하고, DB 의 영상 상태를 '공개'로 바꿔요.",
      notes: [
        { kind: "flow", text: "대표 재생 목록(m3u8)이 화질별 목록을 알려 줘요. 플레이어는 회선 속도를 보며 조각마다 화질을 바꿔요(ABR)." },
        { kind: "caution", text: "원본과 변환본을 한 버킷에 두면 변환본 저장이 또 변환 이벤트를 부를 수 있어요. 권한·수명 주기도 달라 버킷을 나눠요." },
      ],
      miss: "이번 단계는 화질별로 변환한 영상을 담는 버킷이에요. '변환한 영상은 HLS 로 다른 버킷에 저장해 줘'처럼 말해 보세요.",
      explains: {
        [N("s3-out")]: nodeText(
          "화질별 HLS 조각·재생 목록·썸네일을 두는 S3 버킷이에요. 워커만 쓰고, 읽기는 CloudFront 에만 허용해요.",
          ["변환본은 원본과 다른 버킷에 둔다", "쓰는 쪽·읽는 쪽 권한과 보관 규칙을 버킷마다 따로 정한다", "한 버킷에 폴더(접두사)로 나눈다", "버킷이 늘어 정책·이벤트 설정을 버킷마다 관리한다"],
        ),
        [E("work-1", "s3-out")]: edgeText(
          "워커 #1 이 화질별 HLS 조각·재생 목록·썸네일을 변환본 버킷에 올려요.",
          "S3 API(HTTPS 443) PUT. S3 게이트웨이 엔드포인트로 닿아요.",
          "재생할 파일을 CloudFront 가 꺼내 갈 자리에 두려고요.",
          "워커의 IAM 역할에 변환본 버킷 쓰기만 허용해요.",
        ),
        [E("work-2", "s3-out")]: edgeText(
          "워커 #2 가 변환 결과를 변환본 버킷에 올려요.",
          "S3 API(HTTPS 443) PUT. 영상 ID 마다 정해진 위치에 덮어써요.",
          "같은 영상을 두 번 변환해도 결과가 한 벌만 남게 해요.",
          "워커의 IAM 역할에 변환본 버킷 쓰기만 허용해요.",
        ),
        [E("work-1", "rds")]: edgeText(
          "워커 #1 이 변환이 끝난 영상의 상태·길이·화질 목록·썸네일 위치를 DB 에 써요.",
          "PostgreSQL(TCP 5432). RDS 엔드포인트로 접속해요.",
          "상태가 '공개'로 바뀌어야 목록에 보이고 재생 권한을 줄 수 있어요.",
          "RDS 보안 그룹: 워커 보안 그룹 → 5432 허용.",
        ),
        [E("work-2", "rds")]: edgeText(
          "워커 #2 가 변환 결과와 상태를 DB 에 써요. 실패하면 '변환 실패'로 남겨요.",
          "PostgreSQL(TCP 5432). RDS 엔드포인트로 접속해요.",
          "업로더가 자기 영상의 처리 상태를 API 로 볼 수 있게 해요.",
          "RDS 보안 그룹: 워커 보안 그룹 → 5432 허용.",
        ),
      },
    },

    // ── 9. CloudFront 로 재생(OAC·서명 쿠키) ───────────────────
    {
      id: "playback",
      goal: "CloudFront 로 재생(OAC·서명 쿠키)",
      example: "영상 재생은 CloudFront 가 맡게 하고 서명 쿠키로 막아 줘",
      keywords: [
        ["cloudfront", "클라우드프론트", "클라우드 프런트", "cdn", "엣지"],
        ["재생", "보여", "내보내", "스트리밍", "streaming", "서명 쿠키", "서명된 쿠키", "signed cookie", "signed url", "oac", "꺼내"],
      ],
      commands: [
        update("cdn", { rules: "/api/* → ALB(캐시 안 함) · /videos/* → 변환본 버킷(서명 쿠키 필요, 캐시)" }),
        edge("cdn", "s3-out", "request", "HTTPS 443 (OAC)"),
      ],
      say: "재생은 CloudFront 가 변환본 버킷에서 조각을 꺼내 맡게 했어요. 인기 영상은 엣지 캐시에서 바로 나가 버킷·서버로 오는 요청이 크게 줄어요. 볼 권한은 API 가 준 서명 쿠키로 엣지에서 확인해요.",
      notes: [
        { kind: "flow", text: "API 가 권한을 확인하고 CloudFront 서명 쿠키를 줘요. 조각이 수백 개라 조각마다 URL 에 서명하기보다 쿠키 하나로 묶어요." },
        { kind: "link", text: "버킷은 공개하지 않아요. CloudFront 만 읽게 OAC 와 버킷 정책으로 막아, 버킷 주소로는 받아 갈 수 없어요." },
        { kind: "caution", text: "서명 쿠키는 볼 수 있는 사람만 거를 뿐, 받은 영상의 복사는 못 막아요. 유료 영화처럼 막아야 하면 DRM 을 더해요." },
      ],
      miss: "이번 단계는 CloudFront 가 영상을 내보내는 재생 길이에요. '영상 재생은 CloudFront 가 맡게 하고 서명 쿠키로 막아 줘'처럼 말해 보세요.",
      explains: {
        [E("cdn", "s3-out")]: edgeText(
          "엣지 캐시에 없는 재생 목록·HLS 조각·썸네일을 CloudFront 가 변환본 버킷에서 가져와요.",
          "HTTPS(TCP 443). OAC 로 서명한 CloudFront 요청만 버킷이 받아요.",
          "한 번 가져온 조각은 엣지에 캐시돼 다음 시청자는 버킷까지 오지 않아요.",
          "버킷 정책: 이 CloudFront 배포에서 온 읽기만 허용. 시청자 쪽은 서명 쿠키가 없으면 엣지가 403.",
        ),
      },
    },

    // ── 10. 시청 기록 모으기(Data Firehose) ─────────────────────
    {
      id: "logs",
      goal: "시청 기록 모으기(Data Firehose)",
      example: "시청 기록은 Firehose 로 모아 S3 에 쌓아 줘",
      keywords: [["firehose", "파이어호스", "kinesis", "키네시스", "시청 기록", "시청기록", "시청 로그", "시청 이벤트", "재생 기록", "로그 수집", "이벤트 수집", "추천"]],
      commands: [
        node("firehose", "stream", "Data Firehose", "region", "시청 이벤트 모으기", { ...managed(), sw: "Amazon Data Firehose", version: NO_VERSION }),
        node("s3-log", "object_storage", "로그 버킷", "region", "S3 · 시청 기록", S3_ATTRS),
        edge("api-1", "firehose", "async", "Firehose HTTPS"),
        edge("api-2", "firehose", "async", "Firehose HTTPS"),
        edge("firehose", "s3-log", "async", "묶음 파일 저장"),
      ],
      say: "시청 기록을 모으는 Data Firehose 와 로그 버킷을 넣었어요. 앱이 재생 시작·멈춤·본 시간을 API 로 보내면, API 는 Firehose 에 넘기고 Firehose 가 몇 분씩 묶어 S3 에 파일로 쌓아요.",
      notes: [
        { kind: "flow", text: "쌓인 기록은 추천·인기 순위를 계산하는 분석 작업이 나중에 읽어요. 이 가이드는 그 분석 작업은 그리지 않아요." },
        { kind: "caution", text: "시청 이벤트는 양이 아주 많아요. DB 에 한 건씩 쓰지 말고, 앱이 모아 보내고 API 는 Firehose 로 넘기기만 해요." },
        { kind: "net", text: "API 는 Firehose 인터페이스 엔드포인트로 VPC 안에서 보내요. 시청 기록도 인터넷을 지나지 않아요." },
      ],
      miss: "이번 단계는 시청 기록을 모으는 길이에요. '시청 기록은 Firehose 로 모아 S3 에 쌓아 줘'처럼 말해 보세요.",
      explains: {
        [N("firehose")]: nodeText(
          "API 가 넘긴 시청 이벤트를 받아 두었다가 정한 크기나 시간만큼 묶어 로그 버킷에 파일로 쓰는 관리형 전달 서비스예요.",
          ["시청 기록은 Firehose 로 모아 S3 에 쌓는다", "서버를 두지 않고도 많은 이벤트를 묶어 싸게 저장한다", "Kinesis Data Streams 에 넣고 소비 프로그램을 직접 둔다", "묶는 동안 몇 분 늦게 쌓여, 실시간 집계에는 따로 수단이 필요하다"],
          {
            term: "Amazon Data Firehose",
            definition: "Amazon Data Firehose(옛 이름 Kinesis Data Firehose)는 들어온 데이터를 묶어 S3 같은 저장소로 자동으로 보내는 AWS 의 관리형 전달 서비스입니다.",
          },
        ),
        [N("s3-log")]: nodeText(
          "Firehose 가 묶어 쓴 시청 기록 파일을 날짜별 폴더로 쌓아 두는 S3 버킷이에요. 분석 작업이 이 파일을 읽어요.",
          ["시청 기록은 서비스 DB 가 아닌 S3 에 파일로 쌓는다", "양이 많아도 싸게 오래 두고, 분석이 서비스 DB 를 건드리지 않는다", "시청 기록을 RDS 에 한 줄씩 쓴다", "바로 조회하기 어렵고, 분석하려면 Athena 같은 도구가 따로 필요하다"],
        ),
        [E("api-1", "firehose")]: edgeText(
          "API #1 이 앱이 보낸 시청 이벤트 묶음을 Firehose 로 넘겨요.",
          "Firehose API(HTTPS 443). 인터페이스 엔드포인트로 VPC 안에서 닿아요.",
          "API 는 받아서 넘기기만 해 시청 이벤트가 몰려도 빨리 답해요.",
          "API 보안 그룹: 나가는 443 허용. IAM 역할에 이 전달 스트림 쓰기만 줘요.",
        ),
        [E("api-2", "firehose")]: edgeText(
          "API #2 가 시청 이벤트 묶음을 Firehose 로 넘겨요.",
          "Firehose API(HTTPS 443).",
          "어느 API 서버가 받아도 같은 전달 스트림으로 모아요.",
          "API 보안 그룹: 나가는 443 허용.",
        ),
        [E("firehose", "s3-log")]: edgeText(
          "Firehose 가 모은 이벤트를 정한 크기나 시간마다 파일 하나로 묶어 로그 버킷에 써요.",
          "AWS 안에서 Firehose 가 S3 로 써요. 우리가 잇는 길은 없어요.",
          "작은 이벤트를 하나씩 쓰지 않고 묶어 써야 요청 수와 요금이 줄어요.",
          "Firehose 의 IAM 역할에 로그 버킷 쓰기만 허용해요.",
        ),
      },
    },

    // ── 11. 영상 검색(OpenSearch) ──────────────────────────────
    {
      id: "search",
      goal: "영상 검색(OpenSearch)",
      example: "영상 제목으로 찾게 OpenSearch 검색을 넣어 줘",
      keywords: [["opensearch", "오픈서치", "오픈 서치", "elasticsearch", "엘라스틱서치", "검색", "search"]],
      commands: [
        node("search", "search", "검색 엔진", "data", "Amazon OpenSearch · 두 AZ", {
          ...managed(), sw: "Amazon OpenSearch", version: "OpenSearch 2.17", replication: "두 AZ 에 데이터 노드 + 복제 샤드 1벌",
        }),
        edge("api-1", "search", "request", "HTTPS 443 검색"),
        edge("api-2", "search", "request", "HTTPS 443 검색"),
        edge("work-1", "search", "request", "HTTPS 443 색인"),
        edge("work-2", "search", "request", "HTTPS 443 색인"),
      ],
      say: "제목·태그로 영상을 찾는 검색은 OpenSearch 에 맡겼어요. 워커가 영상을 공개할 때 검색 문서를 넣고, API 는 검색어를 받아 OpenSearch 에 물어요. 영상 정보의 원본은 여전히 RDS 에 있어요.",
      notes: [
        { kind: "flow", text: "DB 의 LIKE 검색은 영상이 늘면 느리고 띄어쓰기·형태가 다른 말을 못 찾아요. 검색 엔진은 미리 색인해 둬 빨라요." },
        { kind: "caution", text: "DB 와 검색 색인은 따로라 어긋날 수 있어요. 제목을 고치거나 비공개로 바꿀 때 색인도 고치고, 가끔 다시 맞춰요." },
        { kind: "net", text: "OpenSearch 는 VPC 안 데이터 서브넷에 두고, 두 AZ 에 노드와 복제 샤드를 나눠요. 접속은 HTTPS 443 이에요." },
      ],
      miss: "이번 단계는 영상 검색이에요. '영상 제목으로 찾게 OpenSearch 검색을 넣어 줘'처럼 말해 보세요.",
      explains: {
        [N("search")]: nodeText(
          "공개된 영상의 제목·설명·태그를 색인해 두고 검색어에 맞는 영상을 관련도 순으로 찾아 주는 관리형 검색 엔진이에요.",
          ["검색은 OpenSearch 에 따로 맡긴다", "한국어 형태소 분석과 관련도 순 정렬로 빠르게 찾는다", "RDS 의 LIKE·전문 검색으로 찾는다", "DB 와 색인을 함께 맞춰야 하고, 검색 노드 요금이 든다"],
        ),
        [E("api-1", "search")]: edgeText(
          "API #1 이 시청자의 검색어로 OpenSearch 에 물어 영상 ID 목록을 받아요.",
          "HTTPS(TCP 443) REST API. VPC 안 도메인 엔드포인트로 접속해요.",
          "검색 결과의 자세한 정보는 다시 RDS 에서 읽어요.",
          "OpenSearch 보안 그룹: API 보안 그룹 → 443 허용.",
        ),
        [E("api-2", "search")]: edgeText(
          "API #2 가 검색어로 OpenSearch 에 물어요. 제목을 고치면 색인도 고쳐요.",
          "HTTPS(TCP 443) REST API.",
          "어느 API 서버로 가도 같은 검색 결과를 줘요.",
          "OpenSearch 보안 그룹: API 보안 그룹 → 443 허용.",
        ),
        [E("work-1", "search")]: edgeText(
          "워커 #1 이 변환을 마치고 공개한 영상의 검색 문서를 넣어요.",
          "HTTPS(TCP 443) REST API. 영상 ID 를 문서 ID 로 써요.",
          "공개되는 순간부터 검색에 나오게 하려고요.",
          "OpenSearch 보안 그룹: 워커 보안 그룹 → 443 허용.",
        ),
        [E("work-2", "search")]: edgeText(
          "워커 #2 가 공개한 영상의 검색 문서를 넣어요.",
          "HTTPS(TCP 443). 같은 영상 ID 로 넣으면 덮어써 중복이 생기지 않아요.",
          "어느 워커가 변환해도 같은 색인에 들어가요.",
          "OpenSearch 보안 그룹: 워커 보안 그룹 → 443 허용.",
        ),
      },
    },

    // ── 12. CloudWatch 모니터링 ────────────────────────────────
    {
      id: "ops",
      goal: "CloudWatch 모니터링·알람",
      example: "CloudWatch 로 모니터링과 알람을 붙여 줘",
      keywords: [["cloudwatch", "클라우드워치", "모니터링", "monitoring", "지표", "메트릭", "metric", "알람", "감시"]],
      commands: [
        node("cw", "monitoring", "CloudWatch", "region", "지표·로그·알람", { ...managed(), sw: "Amazon CloudWatch", version: NO_VERSION }),
        node("operator", "admin_user", "운영자", null),
        edge("vpc", "cw", "aux", "지표·로그"),
        edge("cw", "operator", "aux", "알람"),
      ],
      say: "CloudWatch 를 붙여 ALB·EC2·RDS·SQS·OpenSearch·CloudFront 의 지표와 서버 로그를 보게 했어요. 기준을 넘으면 알람이 운영자에게 가요.",
      notes: [
        { kind: "caution", text: "변환 대기열의 가장 오래된 메시지 나이에 알람을 걸어요. 워커가 밀리면 업로더는 '처리 중'만 오래 보게 돼요." },
        { kind: "flow", text: "CloudFront 캐시 적중률도 봐요. 떨어지면 변환본 버킷으로 가는 요청과 요금이 함께 늘어요." },
        { kind: "net", text: "관리형 서비스 지표는 설치 없이 모여요. EC2 의 메모리·앱 로그는 CloudWatch 에이전트가 엔드포인트로 보내요." },
      ],
      miss: "이번 단계는 모니터링과 알람이에요. 'CloudWatch 로 모니터링과 알람을 붙여 줘'처럼 말해 보세요.",
      explains: {
        [N("cw")]: nodeText(
          "AWS 자원의 지표와 로그를 모아 그래프로 보여 주고 기준을 넘으면 알람을 보내는 관리형 감시 서비스예요. CloudFront 지표는 us-east-1 리전에 모여요.",
          ["감시와 로그는 CloudWatch 로 모은다", "관리형 서비스 지표가 저절로 모이고 감시 서버를 운영할 필요가 없다", "EC2 에 Prometheus·Grafana·ELK 를 직접 운영한다", "로그 저장량과 지표 수만큼 요금이 들어 보관 기간을 정해야 한다"],
        ),
        [N("operator")]: nodeText(
          "서비스를 운영하는 담당자예요. 알람을 받아 워커 최대 대수를 늘리거나, 실패 대기열에 쌓인 변환 실패를 살펴요.",
          ["알람은 메일·문자로 운영자에게 보낸다", "변환 밀림·오류를 사람이 바로 알아야 대응한다", "대시보드를 사람이 계속 지켜본다", "알람 기준을 잘못 잡으면 알람이 너무 많거나 늦게 온다"],
        ),
        [E("vpc", "cw")]: edgeText(
          "VPC 안 서버·ALB·RDS·OpenSearch 의 지표와 앱 로그가 CloudWatch 로 가요. S3·SQS 지표도 함께 모여요.",
          "관리형 서비스는 자동으로, EC2 는 CloudWatch 에이전트가 HTTPS(443)로 보내요.",
          "변환 밀림과 장애를 한 화면에서 보려고요.",
          "서버 보안 그룹: 나가는 443 허용. CloudWatch 인터페이스 엔드포인트로 닿아요.",
        ),
        [E("cw", "operator")]: edgeText(
          "기준을 넘은 알람이 운영자에게 가요.",
          "CloudWatch 알람이 SNS 로 메일·문자를 보내요.",
          "변환 밀림이나 재생 오류를 사람이 바로 알아야 대응해요.",
          "AWS 안에서 보내는 알림이라 따로 열 것이 없어요.",
        ),
      },
    },

    // ── 13. 영상 올리기·보기 흐름 ──────────────────────────────
    {
      id: "flows",
      goal: "영상 올리기·보기 흐름",
      example: "영상 올리기와 영상 보기 흐름을 정리해 줘",
      keywords: [["흐름", "flow", "경로", "과정", "시나리오"]],
      commands: [
        flow("upload", "영상 올리기", "user", "업로더가 몇 GB 짜리 영상을 올린다.", "원본을 받아 화질별 HLS 로 바꾸고, 영상을 공개해 검색에 넣는다.", [
          ["uploader", "cdn", "업로드 시작", "업로더 앱이 영상 제목과 함께 업로드 시작을 요청한다."],
          ["cdn", "alb", "API 전달", "CloudFront 가 /api 요청을 서울의 ALB 로 보낸다."],
          ["alb", "api-1", "분배", "ALB 가 API 서버 한 대로 요청을 나눈다."],
          ["api-1", "rds", "영상 등록", "API 가 영상을 '업로드 중' 상태로 DB 에 적는다."],
          ["api-1", "s3-raw", "서명 URL", "API 가 멀티파트 업로드를 열고 조각별 서명 URL 을 만들어 돌려준다."],
          ["uploader", "accel", "조각 올리기", "앱이 서명 URL 로 조각을 가까운 전송 가속 엣지에 올린다."],
          ["accel", "s3-raw", "원본 저장", "엣지가 조각을 AWS 망으로 원본 버킷에 넣는다."],
          ["api-1", "s3-raw", "조각 합치기", "조각이 다 오르면 앱이 알리고, API 가 조각을 하나의 원본 파일로 합친다."],
          ["s3-raw", "sqs", "변환 요청", "원본 파일이 생기자 S3 가 이벤트를 변환 대기열에 넣는다."],
          ["sqs", "work-1", "작업 꺼내기", "변환 워커가 대기열에서 작업을 받아 온다."],
          ["work-1", "s3-raw", "원본 읽기", "워커가 원본을 작업 공간으로 내려받는다."],
          ["work-1", "s3-out", "HLS 저장", "화질별 HLS 조각·재생 목록·썸네일을 변환본 버킷에 올린다."],
          ["work-1", "rds", "공개 처리", "영상 상태를 '공개'로 바꾸고 화질 목록을 적는다."],
          ["work-1", "search", "검색 색인", "공개한 영상의 제목·태그를 검색 엔진에 넣는다."],
        ]),
        flow("watch", "영상 보기", "user", "시청자가 영상을 검색해 재생한다.", "서명 쿠키로 권한을 확인한 조각을 엣지에서 받아 보고, 시청 기록을 남긴다.", [
          ["viewer", "cdn", "검색 요청", "시청자 앱이 검색어로 영상을 찾는다."],
          ["cdn", "alb", "API 전달", "CloudFront 가 /api 요청을 서울의 ALB 로 보낸다."],
          ["alb", "api-2", "분배", "ALB 가 API 서버 한 대로 요청을 나눈다."],
          ["api-2", "search", "검색", "API 가 검색 엔진에서 맞는 영상 ID 를 찾는다."],
          ["api-2", "rds", "정보·권한", "영상 정보와 볼 권한을 DB 에서 확인하고 서명 쿠키를 만들어 준다."],
          ["viewer", "cdn", "조각 받기", "플레이어가 서명 쿠키를 붙여 재생 목록과 HLS 조각을 엣지에 요청한다."],
          ["cdn", "s3-out", "캐시 채우기", "엣지 캐시에 없는 조각만 변환본 버킷에서 가져온다."],
          ["api-2", "firehose", "시청 기록", "재생 중 앱이 보낸 시청 이벤트를 API 가 Firehose 로 넘긴다."],
          ["firehose", "s3-log", "묶어 저장", "Firehose 가 이벤트를 묶어 로그 버킷에 파일로 쓴다."],
        ]),
      ],
      say: "영상 올리기와 영상 보기 두 흐름을 정리했어요. 흐름을 재생하면 큰 파일과 작은 요청이 서로 다른 길로 다니는 것을 볼 수 있어요.",
      notes: [
        { kind: "flow", text: "영상 파일은 올릴 때 전송 가속 엣지 → 원본 버킷, 볼 때 변환본 버킷 → CloudFront 로만 다녀요. API 는 작은 요청만 받아요." },
        { kind: "link", text: "업로드와 변환은 S3 이벤트 → SQS 로 끊겨 있어요. 워커가 밀려도 업로드는 이미 끝나 있어요." },
        { kind: "caution", text: "흐름은 서버 한 대씩만 그렸어요. 실제로는 ALB 가 요청마다 API 두 대 가운데 하나를, 대기열이 워커 하나를 골라요." },
      ],
      miss: "마지막 단계는 흐름 정리예요. '영상 올리기와 영상 보기 흐름을 정리해 줘'처럼 말해 보세요.",
      explains: {},
    },
  ],
};
