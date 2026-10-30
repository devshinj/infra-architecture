// 사용자마다 처음 한 번 복사하는 용어 사전 초안 50개(§6.7). 처음엔 모두 "미검수"로 들어간다.
// definition 은 정식 명칭·약어 풀이와 분류를 담은 사전식 한 문장(120자 이내, 비유 없음).
// why·compare 는 용어·약어 항목(§6.2)만 채우고 제품 이름 항목은 빈 문자열이다.
// aliases 는 normalizeTerm 한 값이다. 노드 종류 한국어 이름(catalog labelKo)과 흔한 표기를 넣어
// 노드의 sw·sub·종류 이름 어느 것으로도 찾아지게 한다. key 는 normalizeTerm(term) 이다.

export interface GlossarySeedEntry {
  term: string;
  fullName: string;
  category: string;
  definition: string;
  why: string;
  compare: string;
  aliases: string[];
}

export const GLOSSARY_SEED: GlossarySeedEntry[] = [
  // ── 소프트웨어·제품 ─────────────────────────────
  {
    term: "Redis",
    fullName: "Remote Dictionary Server",
    category: "캐시 / 인메모리 저장소",
    definition:
      "Redis(Remote Dictionary Server)는 데이터를 디스크가 아닌 메모리에 저장해 빠른 읽기와 쓰기 속도를 제공하는 인메모리 NoSQL 키-값(Key-Value) 데이터 구조 스토어입니다.",
    why: "",
    compare: "",
    aliases: ["레디스"],
  },
  {
    term: "Nginx",
    fullName: "Nginx(엔진엑스)",
    category: "웹 서버 / 리버스 프록시",
    definition:
      "Nginx(엔진엑스)는 적은 자원으로 많은 동시 접속을 처리하도록 설계된 오픈소스 웹 서버이자 리버스 프록시(Reverse Proxy) 소프트웨어입니다.",
    why: "",
    compare: "",
    aliases: ["엔진엑스"],
  },
  {
    term: "Apache",
    fullName: "Apache HTTP Server",
    category: "웹 서버",
    definition:
      "Apache(Apache HTTP Server)는 아파치 소프트웨어 재단이 만든 오픈소스 웹 서버로, 모듈을 붙여 기능을 넓힐 수 있는 HTTP 서버 소프트웨어입니다.",
    why: "",
    compare: "",
    aliases: ["apachehttpserver", "apachehttpd", "httpd", "아파치"],
  },
  {
    term: "Tomcat",
    fullName: "Apache Tomcat",
    category: "WAS / 서블릿 컨테이너",
    definition:
      "Tomcat(Apache Tomcat)은 자바(Java) 서블릿과 JSP를 실행해 동적인 웹 페이지를 만들어 주는 오픈소스 웹 애플리케이션 서버(WAS)입니다.",
    why: "",
    compare: "",
    aliases: ["apachetomcat", "톰캣"],
  },
  {
    term: "MySQL",
    fullName: "MySQL",
    category: "관계형 DB",
    definition:
      "MySQL은 오라클이 관리하는 오픈소스 관계형 데이터베이스 관리 시스템(RDBMS)으로, 표 형태의 데이터를 SQL로 저장하고 조회합니다.",
    why: "",
    compare: "",
    aliases: ["마이에스큐엘"],
  },
  {
    term: "PostgreSQL",
    fullName: "PostgreSQL(포스트그레스큐엘)",
    category: "관계형 DB",
    definition:
      "PostgreSQL(포스트그레스큐엘)은 표준 SQL과 다양한 확장 기능을 지원하는 오픈소스 객체 관계형 데이터베이스 관리 시스템(ORDBMS)입니다.",
    why: "",
    compare: "",
    aliases: ["postgres", "pgsql", "포스트그레스", "포스트그레스큐엘"],
  },
  {
    term: "Oracle",
    fullName: "Oracle Database",
    category: "관계형 DB",
    definition:
      "Oracle(Oracle Database)은 오라클이 개발한 상용 관계형 데이터베이스 관리 시스템(RDBMS)으로, 대규모 기업 업무 시스템에서 많이 쓰입니다.",
    why: "",
    compare: "",
    aliases: ["oracledb", "oracledatabase", "오라클"],
  },
  {
    term: "MongoDB",
    fullName: "MongoDB",
    category: "NoSQL DB / 문서형 DB",
    definition:
      "MongoDB는 데이터를 JSON과 비슷한 문서(Document) 단위로 저장하는 오픈소스 문서형 NoSQL 데이터베이스입니다.",
    why: "",
    compare: "",
    aliases: ["mongo", "몽고db", "몽고디비"],
  },
  {
    term: "Elasticsearch",
    fullName: "Elasticsearch",
    category: "검색 엔진",
    definition:
      "Elasticsearch는 대량의 텍스트와 로그를 빠르게 검색·분석할 수 있도록 색인해 두는 분산형 오픈소스 검색 및 분석 엔진입니다.",
    why: "",
    compare: "",
    aliases: ["elastic", "엘라스틱서치"],
  },
  {
    term: "Kafka",
    fullName: "Apache Kafka",
    category: "스트림 / 이벤트 스트리밍",
    definition:
      "Kafka(Apache Kafka)는 대량의 이벤트 데이터를 순서대로 기록하고 여러 소비자에게 실시간으로 전달하는 분산 이벤트 스트리밍 플랫폼입니다.",
    why: "",
    compare: "",
    aliases: ["apachekafka", "카프카", "msk", "amazonmsk"],
  },
  {
    term: "RabbitMQ",
    fullName: "RabbitMQ",
    category: "큐 / 메시지 브로커",
    definition:
      "RabbitMQ는 AMQP 프로토콜로 생산자가 보낸 메시지를 큐에 담아 두었다가 소비자에게 전달하는 오픈소스 메시지 브로커입니다.",
    why: "",
    compare: "",
    aliases: ["rabbit", "래빗mq", "래빗엠큐"],
  },
  {
    term: "SQS",
    fullName: "Amazon Simple Queue Service",
    category: "큐 / 관리형 서비스",
    definition:
      "SQS(Amazon Simple Queue Service)는 AWS가 운영을 맡는 완전 관리형 메시지 큐 서비스로, 서비스 사이에 메시지를 안전하게 주고받게 합니다.",
    why: "",
    compare: "",
    aliases: ["amazonsqs", "awssqs", "simplequeueservice"],
  },
  {
    term: "S3",
    fullName: "Amazon Simple Storage Service",
    category: "오브젝트 스토리지 / 관리형 서비스",
    definition:
      "S3(Amazon Simple Storage Service)는 파일을 객체(Object) 단위로 저장하고 인터넷 주소로 꺼내 쓸 수 있게 하는 AWS의 오브젝트 스토리지 서비스입니다.",
    why: "",
    compare: "",
    aliases: ["amazons3", "awss3", "simplestorageservice"],
  },
  {
    term: "쿠버네티스",
    fullName: "Kubernetes(K8s)",
    category: "컨테이너 오케스트레이션",
    definition:
      "쿠버네티스(Kubernetes, K8s)는 여러 서버에 걸쳐 컨테이너의 배포·확장·복구를 자동으로 관리하는 오픈소스 컨테이너 오케스트레이션 플랫폼입니다.",
    why: "",
    compare: "",
    aliases: ["kubernetes", "k8s", "쿠버네티스클러스터", "k8scluster", "kubernetescluster", "eks", "amazoneks"],
  },
  {
    term: "Lambda",
    fullName: "AWS Lambda",
    category: "서버리스 함수 / 관리형 서비스",
    definition:
      "Lambda(AWS Lambda)는 이벤트가 발생할 때만 코드를 실행하고 실행한 시간만큼 비용을 받는 AWS의 서버리스 함수 서비스입니다.",
    why: "",
    compare: "",
    aliases: ["awslambda", "람다"],
  },

  // ── 네트워크 ─────────────────────────────────────
  {
    term: "CDN",
    fullName: "Content Delivery Network",
    category: "네트워크 / 콘텐츠 전송",
    definition:
      "CDN(Content Delivery Network)은 이미지·동영상 같은 콘텐츠를 사용자와 가까운 여러 지역의 서버에 복사해 두고 빠르게 전달하는 콘텐츠 전송 네트워크입니다.",
    why: "먼 원본 서버까지 가지 않아도 되어 응답이 빨라지고 원본 서버의 부하도 줄어듭니다.",
    compare: "웹 서버는 콘텐츠를 직접 만들어 보내고, CDN은 이미 만든 콘텐츠를 가까운 곳에서 대신 전달합니다.",
    aliases: ["콘텐츠전송네트워크", "contentdeliverynetwork"],
  },
  {
    term: "WAF",
    fullName: "Web Application Firewall",
    category: "네트워크 / 보안",
    definition:
      "WAF(Web Application Firewall)는 HTTP 요청 내용을 검사해 SQL 인젝션·XSS 같은 웹 공격을 막는 웹 애플리케이션 방화벽입니다.",
    why: "일반 방화벽은 IP·포트만 보므로 정상 포트로 들어오는 웹 공격은 걸러 내지 못합니다.",
    compare: "방화벽은 IP·포트로 접근을 막고, WAF는 요청 내용까지 읽어 공격 패턴을 막습니다.",
    aliases: ["웹방화벽", "웹애플리케이션방화벽", "webapplicationfirewall"],
  },
  {
    term: "DNS",
    fullName: "Domain Name System",
    category: "네트워크 / 이름 해석",
    definition:
      "DNS(Domain Name System)는 example.com 같은 도메인 이름을 컴퓨터가 찾아갈 수 있는 IP 주소로 바꿔 주는 인터넷 이름 해석 시스템입니다.",
    why: "사람은 숫자로 된 IP 주소 대신 기억하기 쉬운 도메인 이름으로 서비스에 접속할 수 있습니다.",
    compare: "DNS는 이름을 IP 주소로 바꾸기만 하고, 실제 요청을 여러 서버에 나누는 일은 로드밸런서가 합니다.",
    aliases: ["도메인네임시스템", "domainnamesystem"],
  },
  {
    term: "NAT",
    fullName: "Network Address Translation",
    category: "네트워크 / 주소 변환",
    definition:
      "NAT(Network Address Translation)는 내부망의 사설 IP 주소를 외부에서 쓰는 공인 IP 주소로 바꿔 주는 네트워크 주소 변환 기술입니다.",
    why: "외부에 드러나지 않는 내부 서버도 업데이트 내려받기처럼 바깥으로 나가는 통신을 할 수 있습니다.",
    compare: "NAT는 안에서 밖으로 나가는 통신을 돕고, 로드밸런서는 밖에서 안으로 들어오는 요청을 나눕니다.",
    aliases: ["natgateway", "nat게이트웨이", "주소변환", "networkaddresstranslation"],
  },
  {
    term: "VPN",
    fullName: "Virtual Private Network",
    category: "네트워크 / 보안 접속",
    definition:
      "VPN(Virtual Private Network)은 인터넷 위에 암호화된 통로를 만들어 떨어진 사용자나 사무실을 내부망처럼 안전하게 연결하는 가상 사설망입니다.",
    why: "공용 인터넷을 지나도 데이터가 암호화되어 내부 시스템에 안전하게 접속할 수 있습니다.",
    compare: "전용선은 물리 회선을 따로 빌려 연결하고, VPN은 인터넷 위에 암호화된 통로를 만들어 연결합니다.",
    aliases: ["가상사설망", "virtualprivatenetwork"],
  },
  {
    term: "VIP",
    fullName: "Virtual IP",
    category: "네트워크 / 이중화",
    definition:
      "VIP(Virtual IP)는 장비 한 대가 아니라 이중화된 여러 장비가 함께 쓰는 가상 IP 주소로, 장애가 나면 살아 있는 장비가 이 주소를 넘겨받습니다.",
    why: "장비가 바뀌어도 접속 주소가 그대로라서 사용자는 장애 전환을 알아채지 못합니다.",
    compare: "실제 IP는 장비 한 대에 묶여 있고, VIP는 살아 있는 장비로 옮겨 다닙니다.",
    aliases: ["virtualip", "가상ip"],
  },
  {
    term: "DMZ",
    fullName: "Demilitarized Zone",
    category: "네트워크 / 보안 구역",
    definition:
      "DMZ(Demilitarized Zone)는 외부 인터넷과 내부망 사이에 두고 웹 서버처럼 외부에 공개할 서버만 놓는 완충 네트워크 구역입니다.",
    why: "공개 서버가 공격을 받아도 공격자가 내부망의 DB까지 바로 닿지 못하게 막습니다.",
    compare: "내부망은 외부에서 직접 접근할 수 없고, DMZ는 정해진 포트로만 외부 접근을 허용합니다.",
    aliases: ["비무장지대", "demilitarizedzone"],
  },
  {
    term: "L4 로드밸런서",
    fullName: "Layer 4 Load Balancer",
    category: "네트워크 / 부하 분산",
    definition:
      "L4 로드밸런서(Layer 4 Load Balancer)는 네트워크 7계층 중 4번째인 전송 계층의 IP·포트만 보고 요청을 여러 서버에 나눠 보내는 장비입니다.",
    why: "여러 서버에 요청을 고르게 나눠 한 대가 고장 나도 서비스가 계속되게 합니다.",
    compare: "L4는 IP·포트만 보고 빠르게 나누고, L7은 URL·헤더 같은 요청 내용을 보고 나눕니다.",
    aliases: ["l4", "l4lb", "l4스위치", "layer4loadbalancer"],
  },
  {
    term: "L7 로드밸런서",
    fullName: "Layer 7 Load Balancer",
    category: "네트워크 / 부하 분산",
    definition:
      "L7 로드밸런서(Layer 7 Load Balancer)는 네트워크 7계층 중 7번째인 응용 계층의 URL·헤더 같은 요청 내용을 보고 알맞은 서버로 나눠 보내는 장비입니다.",
    why: "주소 경로마다 다른 서버로 보내는 것처럼 요청 내용에 따라 세밀하게 나눌 수 있습니다.",
    compare: "L7은 요청 내용을 읽는 만큼 세밀하게 나누지만, IP·포트만 보는 L4보다 처리 부담이 큽니다.",
    aliases: ["l7", "l7lb", "l7스위치", "layer7loadbalancer"],
  },
  {
    term: "ALB",
    fullName: "Application Load Balancer",
    category: "네트워크 / 부하 분산",
    definition:
      "ALB(Application Load Balancer)는 HTTP·HTTPS 요청의 경로와 헤더를 보고 대상 서버로 나눠 보내는 AWS의 L7 로드밸런서 서비스입니다.",
    why: "웹 요청을 주소 경로별로 나누고 HTTPS 인증서를 한곳에서 처리할 수 있습니다.",
    compare: "ALB는 L7에서 요청 내용을 보고 나누고, NLB는 L4에서 IP·포트만 보고 더 빠르게 나눕니다.",
    aliases: ["applicationloadbalancer", "awsalb"],
  },
  {
    term: "NLB",
    fullName: "Network Load Balancer",
    category: "네트워크 / 부하 분산",
    definition:
      "NLB(Network Load Balancer)는 TCP·UDP 연결을 IP·포트 기준으로 매우 빠르게 나눠 보내는 AWS의 L4 로드밸런서 서비스입니다.",
    why: "요청이 아주 많거나 고정 IP 주소가 필요한 서비스를 짧은 지연 시간으로 처리합니다.",
    compare: "NLB는 L4에서 빠르게 나누고, ALB는 L7에서 HTTP 요청 내용을 보고 나눕니다.",
    aliases: ["networkloadbalancer", "awsnlb"],
  },
  {
    term: "API 게이트웨이",
    fullName: "API Gateway",
    category: "네트워크 / API 관리",
    definition:
      "API 게이트웨이(API Gateway)는 여러 백엔드 서비스 앞에서 API 요청을 받아 인증·호출량 제한을 처리한 뒤 알맞은 서비스로 전달하는 관문 서버입니다.",
    why: "인증이나 호출량 제한 같은 공통 기능을 서비스마다 따로 만들지 않고 한곳에서 처리합니다.",
    compare: "로드밸런서는 같은 서버들에 요청을 나누고, API 게이트웨이는 API마다 다른 서비스로 보내며 정책을 적용합니다.",
    aliases: ["apigateway", "apigw"],
  },
  {
    term: "방화벽",
    fullName: "Firewall",
    category: "네트워크 / 보안",
    definition:
      "방화벽(Firewall)은 미리 정한 규칙에 따라 IP 주소와 포트를 검사해 허용된 네트워크 통신만 통과시키는 보안 장비 또는 소프트웨어입니다.",
    why: "꼭 필요한 통신만 열어 두어 외부 공격이 내부 서버에 닿는 길을 줄입니다.",
    compare: "방화벽은 IP·포트를 보고 막고, WAF는 웹 요청 내용까지 검사해 막습니다.",
    aliases: ["firewall", "fw"],
  },
  {
    term: "VPC",
    fullName: "Virtual Private Cloud",
    category: "네트워크 / 클라우드",
    definition:
      "VPC(Virtual Private Cloud)는 퍼블릭 클라우드 안에서 다른 고객과 논리적으로 분리해 만든 전용 가상 사설 네트워크입니다.",
    why: "클라우드에서도 IP 대역과 서브넷, 접근 규칙을 직접 정해 서버를 격리할 수 있습니다.",
    compare: "VPC는 전체 네트워크이고, 서브넷은 그 VPC 안을 다시 나눈 구역입니다.",
    aliases: ["가상사설클라우드", "virtualprivatecloud"],
  },
  {
    term: "서브넷",
    fullName: "Subnet",
    category: "네트워크 / 구역",
    definition:
      "서브넷(Subnet)은 하나의 네트워크 IP 대역을 더 작은 범위로 나눈 하위 네트워크로, 공개 구역과 내부 구역을 나누는 단위입니다.",
    why: "외부에 공개할 서버와 숨길 서버를 다른 서브넷에 두어 접근 규칙을 따로 적용합니다.",
    compare: "공개(퍼블릭) 서브넷은 인터넷과 직접 통하고, 내부(프라이빗) 서브넷은 직접 통하지 않습니다.",
    aliases: ["subnet", "공개구역", "내부구역", "퍼블릭서브넷", "프라이빗서브넷", "publicsubnet", "privatesubnet"],
  },
  {
    term: "가용 영역(AZ)",
    fullName: "Availability Zone",
    category: "클라우드 / 이중화",
    definition:
      "가용 영역(AZ, Availability Zone)은 클라우드 리전 안에서 전력과 네트워크가 서로 독립된 하나 이상의 데이터센터 묶음입니다.",
    why: "서버를 두 개 이상의 가용 영역에 나눠 두면 데이터센터 하나가 멈춰도 서비스가 계속됩니다.",
    compare: "리전은 서울·도쿄 같은 지역 단위이고, 가용 영역은 그 리전 안의 독립된 데이터센터 단위입니다.",
    aliases: ["az", "가용영역", "availabilityzone"],
  },

  // ── 서버·컴퓨팅 ──────────────────────────────────
  {
    term: "WAS",
    fullName: "Web Application Server",
    category: "서버 / 애플리케이션 실행",
    definition:
      "WAS(Web Application Server)는 사용자 요청에 따라 프로그램을 실행해 DB 조회 결과 같은 동적인 내용을 만들어 돌려주는 웹 애플리케이션 서버입니다.",
    why: "로그인·주문처럼 사용자마다 결과가 달라지는 처리를 웹 서버 대신 맡습니다.",
    compare: "웹 서버는 이미 만들어진 파일을 그대로 보내고, WAS는 프로그램을 실행해 내용을 새로 만듭니다.",
    aliases: ["webapplicationserver", "웹애플리케이션서버"],
  },
  {
    term: "배스천",
    fullName: "Bastion Host",
    category: "서버 / 보안 접속",
    definition:
      "배스천(Bastion Host)은 외부에서 내부망 서버에 관리 목적으로 접속할 때 반드시 거치도록 따로 열어 둔 접속 전용 서버입니다.",
    why: "관리 접속 경로를 한곳으로 모아 접근을 통제하고 접속 기록을 남길 수 있습니다.",
    compare: "VPN은 사용자 PC를 내부망에 연결하고, 배스천은 정해진 서버 한 대를 거쳐서만 들어가게 합니다.",
    aliases: ["bastion", "bastionhost", "배스천호스트", "점프서버", "jumpserver", "jumphost"],
  },
  {
    term: "오토스케일링",
    fullName: "Auto Scaling",
    category: "컴퓨팅 / 확장",
    definition:
      "오토스케일링(Auto Scaling)은 CPU 사용률이나 요청량 같은 지표에 따라 서버 대수를 자동으로 늘리거나 줄이는 클라우드 확장 기능입니다.",
    why: "사용량이 몰릴 때는 서버를 늘려 버티고, 한가할 때는 줄여 비용을 아낍니다.",
    compare: "수동 확장은 사람이 서버를 미리 늘려 두고, 오토스케일링은 지표를 보고 자동으로 조절합니다.",
    aliases: ["autoscaling", "asg", "autoscalinggroup", "자동확장"],
  },
  {
    term: "컨테이너",
    fullName: "Container",
    category: "컴퓨팅 / 실행 환경",
    definition:
      "컨테이너(Container)는 애플리케이션과 실행에 필요한 라이브러리·설정을 하나로 묶어 어느 서버에서나 같게 실행되도록 격리한 실행 환경입니다.",
    why: "개발 PC와 운영 서버의 환경 차이 없이 같은 결과로 배포할 수 있습니다.",
    compare: "가상 머신은 운영체제 전체를 따로 올리고, 컨테이너는 서버의 운영체제를 함께 써서 더 가볍습니다.",
    aliases: ["container", "docker", "도커"],
  },
  {
    term: "서버리스 함수",
    fullName: "Serverless Function(FaaS)",
    category: "컴퓨팅 / 서버리스",
    definition:
      "서버리스 함수(Serverless Function, FaaS)는 서버를 직접 관리하지 않고 요청이나 이벤트가 올 때만 코드를 실행해 실행한 만큼 비용을 내는 실행 방식입니다.",
    why: "서버 운영 부담 없이 가끔 실행되는 작업을 적은 비용으로 처리할 수 있습니다.",
    compare: "일반 서버는 늘 켜 두는 동안 비용을 내고, 서버리스 함수는 실행될 때만 비용을 냅니다.",
    aliases: ["함수", "서버리스", "serverless", "serverlessfunction", "faas", "function"],
  },

  // ── 쿠버네티스 ───────────────────────────────────
  {
    term: "인그레스",
    fullName: "Ingress",
    category: "쿠버네티스 / 네트워크",
    definition:
      "인그레스(Ingress)는 쿠버네티스 클러스터 밖에서 들어오는 HTTP·HTTPS 요청을 도메인이나 주소 경로에 따라 내부 서비스로 연결하는 규칙 리소스입니다.",
    why: "서비스마다 외부 주소를 따로 만들지 않고 하나의 입구에서 경로별로 나눌 수 있습니다.",
    compare: "서비스(K8s)는 클러스터 안에서 파드를 묶고, 인그레스는 클러스터 밖의 요청을 그 서비스로 들여보냅니다.",
    aliases: ["ingress", "k8singress", "ingresscontroller", "인그레스컨트롤러"],
  },
  {
    term: "파드",
    fullName: "Pod",
    category: "쿠버네티스 / 실행 단위",
    definition:
      "파드(Pod)는 쿠버네티스에서 하나 이상의 컨테이너를 묶어 같은 네트워크와 저장 공간을 함께 쓰게 하는 가장 작은 배포 단위입니다.",
    why: "함께 움직여야 하는 컨테이너를 한 단위로 배포하고 늘리거나 다시 시작할 수 있습니다.",
    compare: "컨테이너는 실행되는 프로그램 하나이고, 파드는 그 컨테이너들을 감싼 쿠버네티스의 관리 단위입니다.",
    aliases: ["pod", "k8spod"],
  },
  {
    term: "서비스(K8s)",
    fullName: "Kubernetes Service",
    category: "쿠버네티스 / 네트워크",
    definition:
      "서비스(Kubernetes Service)는 계속 바뀌는 여러 파드를 하나의 고정된 이름과 주소로 묶어 요청을 나눠 주는 쿠버네티스 네트워크 리소스입니다.",
    why: "파드가 다시 만들어져 IP 주소가 바뀌어도 다른 프로그램은 같은 주소로 접속할 수 있습니다.",
    compare: "서비스는 클러스터 안의 파드를 묶고, 인그레스는 클러스터 밖의 요청을 서비스로 연결합니다.",
    aliases: ["쿠버네티스서비스", "k8sservice", "k8s서비스", "kubernetesservice"],
  },

  // ── 데이터·운영 개념 ─────────────────────────────
  {
    term: "캐시",
    fullName: "Cache",
    category: "데이터 / 성능",
    definition:
      "캐시(Cache)는 자주 읽는 데이터를 원래 저장소보다 빠른 메모리 등에 복사해 두고 다음 요청 때 바로 돌려주는 임시 저장 공간입니다.",
    why: "같은 데이터를 매번 DB에서 읽지 않아도 되어 응답이 빨라지고 DB 부하가 줄어듭니다.",
    compare: "DB는 데이터를 오래 정확하게 보관하고, 캐시는 빠른 응답을 위해 잠시 사본을 둡니다.",
    aliases: ["cache", "캐시서버", "cacheserver"],
  },
  {
    term: "세션",
    fullName: "Session",
    category: "웹 / 상태 관리",
    definition:
      "세션(Session)은 사용자가 로그인한 뒤 여러 요청에 걸쳐 그 사용자의 로그인 상태와 정보를 서버 쪽에 유지하는 방식입니다.",
    why: "요청마다 다시 로그인하지 않아도 서버가 같은 사용자임을 알아봅니다.",
    compare: "세션은 정보를 서버에 두고, 토큰 방식은 서명된 정보를 사용자 쪽에 들고 다니게 합니다.",
    aliases: ["session", "세션저장소", "sessionstore"],
  },
  {
    term: "Cache-aside",
    fullName: "Cache-aside Pattern",
    category: "캐시 전략",
    definition:
      "Cache-aside(캐시 어사이드)는 애플리케이션이 먼저 캐시를 조회하고 없을 때만 DB에서 읽어 캐시에 채워 넣는 캐시 사용 패턴입니다.",
    why: "실제로 요청된 데이터만 캐시에 올라가고, 캐시가 멈춰도 DB에서 직접 읽어 서비스가 계속됩니다.",
    compare: "Write-through는 쓸 때마다 캐시와 DB를 함께 고치고, Cache-aside는 읽을 때 필요한 것만 채웁니다.",
    aliases: ["캐시어사이드", "cacheasidepattern", "lazyloading"],
  },
  {
    term: "DB 복제",
    fullName: "Database Replication",
    category: "데이터 / 이중화",
    definition:
      "DB 복제(Database Replication)는 원본(Primary) 데이터베이스의 변경 내용을 복제본(Replica)에 계속 복사해 같은 데이터를 유지하는 기술입니다.",
    why: "원본이 고장 나도 복제본으로 넘어갈 수 있고, 읽기 요청을 복제본에 나눌 수 있습니다.",
    compare: "동기 복제는 복사가 끝나야 저장을 마쳐 안전하고, 비동기 복제는 빠르지만 잠깐 차이가 생길 수 있습니다.",
    aliases: ["replication", "dbreplication", "databasereplication", "복제", "리플리케이션", "readreplica", "읽기복제본"],
  },
  {
    term: "Active/Standby",
    fullName: "Active/Standby",
    category: "이중화 방식",
    definition:
      "Active/Standby(액티브/스탠바이)는 한 장비만 실제로 일하고 다른 장비는 대기하다가 장애가 나면 일을 이어받는 이중화 방식입니다.",
    why: "운영 장비가 고장 나도 대기 장비가 이어받아 서비스가 멈추는 시간을 줄입니다.",
    compare: "Active/Active는 두 장비가 함께 일해 처리량도 늘리고, Active/Standby는 한 대가 대기하는 대신 구성이 단순합니다.",
    aliases: ["액티브스탠바이", "activepassive", "failover", "페일오버"],
  },
  {
    term: "DB 중계(Proxy)",
    fullName: "Database Proxy",
    category: "데이터 / 연결 관리",
    definition:
      "DB 중계(Database Proxy)는 애플리케이션과 데이터베이스 사이에서 연결을 모아 관리하고 요청을 DB로 전달하는 중계 서버입니다.",
    why: "DB 연결 수를 줄이고, DB가 바뀌거나 장애가 나도 애플리케이션 설정을 고치지 않아도 됩니다.",
    compare: "애플리케이션이 DB에 직접 붙으면 단순하고, 중계를 두면 연결 관리와 장애 전환을 한곳에 맡깁니다.",
    aliases: ["db중계", "dbproxy", "databaseproxy", "proxysql", "pgbouncer", "rdsproxy", "maxscale"],
  },
  {
    term: "모니터링",
    fullName: "Monitoring",
    category: "운영 / 관측",
    definition:
      "모니터링(Monitoring)은 서버와 서비스의 CPU·메모리·응답 시간·오류 수 같은 지표를 계속 모아 보여 주고 이상이 생기면 알리는 운영 시스템입니다.",
    why: "장애를 사용자보다 먼저 알아채고 원인을 빨리 찾을 수 있습니다.",
    compare: "모니터링은 숫자 지표의 흐름을 보고, 로깅은 개별 사건의 기록을 남깁니다.",
    aliases: ["monitoring", "관제"],
  },
  {
    term: "로깅",
    fullName: "Logging",
    category: "운영 / 관측",
    definition:
      "로깅(Logging)은 프로그램 실행 중에 일어난 요청·오류·작업 내역을 시간 순서대로 기록하고 한곳에 모아 두는 운영 시스템입니다.",
    why: "문제가 생겼을 때 언제 무슨 일이 있었는지 기록을 보고 원인을 추적할 수 있습니다.",
    compare: "로깅은 개별 사건을 글로 남기고, 모니터링은 지표를 숫자로 모아 추세를 봅니다.",
    aliases: ["logging", "로그", "log", "로그수집"],
  },
  {
    term: "CI/CD",
    fullName: "Continuous Integration/Continuous Delivery",
    category: "개발 / 배포 자동화",
    definition:
      "CI/CD(Continuous Integration/Continuous Delivery)는 코드 변경을 자동으로 빌드·테스트하고 운영 환경까지 배포하는 지속적 통합·배포 방식입니다.",
    why: "사람이 손으로 배포할 때 생기는 실수를 줄이고 변경을 자주 안전하게 내보냅니다.",
    compare: "수동 배포는 사람이 단계를 직접 밟고, CI/CD는 정해 둔 파이프라인이 자동으로 수행합니다.",
    aliases: ["ci", "continuousintegration", "continuousdelivery", "배포자동화", "배포파이프라인"],
  },

  // ── 외부 연동 ────────────────────────────────────
  {
    term: "OAuth",
    fullName: "Open Authorization",
    category: "인증 / 표준 프로토콜",
    definition:
      "OAuth(Open Authorization)는 사용자가 비밀번호를 넘기지 않고도 다른 서비스에 자기 정보 접근 권한을 맡길 수 있게 하는 표준 권한 위임 프로토콜입니다.",
    why: "소셜 로그인처럼 외부 계정으로 안전하게 로그인하고 필요한 권한만 넘길 수 있습니다.",
    compare: "OAuth는 권한을 위임하는 규약이고, 여기에 사용자 신원 확인을 더한 것이 OIDC(OpenID Connect)입니다.",
    aliases: ["oauth2", "openauthorization", "소셜로그인"],
  },
  {
    term: "PG(결제대행)",
    fullName: "Payment Gateway",
    category: "결제 / 외부 서비스",
    definition:
      "PG(Payment Gateway, 결제대행)는 온라인 상점을 대신해 신용카드사·은행과 결제 승인과 정산을 처리해 주는 전자결제 대행 서비스입니다.",
    why: "상점이 카드사마다 따로 계약하고 연동하지 않아도 여러 결제 수단을 한 번에 받을 수 있습니다.",
    compare: "간편결제는 사용자가 고르는 결제 수단이고, PG는 그 결제를 상점 대신 승인하고 정산하는 중계자입니다.",
    aliases: ["결제대행", "paymentgateway", "외부결제(pg)", "외부결제", "전자결제"],
  },
];
