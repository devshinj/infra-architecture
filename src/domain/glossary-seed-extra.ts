import type { GlossarySeedEntry } from "./glossary-seed";

// 용어 사전 초안 2차분: 망·보안, 시스템 소프트웨어, 이 도구의 노드 종류를 설명하는 말.
// docs/research/2026-11-11-network-glossary/ 의 조사에서 출처로 확인한 항목만 옮겼다(03·04 파일의 근거 번호 참고).
// 망분리·망연계·오브젝트 스토리지·파일 스토리지는 공식 정의 문구를 찾지 못했지만 노드 종류와 망 지식의 핵심어라 넣었다.
// 처음엔 모두 "미검수"로 들어간다. 규칙은 glossary-seed.ts 머리말과 같다(사전식 한 문장 120자, 제품은 why·compare 비움, aliases 는 normalizeTerm 값).

export const GLOSSARY_SEED_EXTRA: GlossarySeedEntry[] = [
  // ── 망·보안 — 망 분리·연계 ──
  {
    term: "망분리",
    fullName: "망분리 (Network Separation)",
    category: "네트워크 / 보안",
    definition:
      "망분리는 외부 인터넷에서 들어오는 침입과 내부 자료 유출을 막기 위해 업무용 망과 인터넷용 망을 서로 통신하지 못하게 나누는 보안 조치입니다.",
    why: "인터넷에서 감염된 악성코드가 업무 시스템으로 번지거나 내부 자료가 밖으로 나가는 길을 끊을 수 있습니다.",
    compare: "망분리는 두 망을 끊는 조치이고, 망연계는 끊어 놓은 두 망 사이에 허용된 자료만 넘기는 통로입니다.",
    aliases: ["네트워크분리", "인터넷망차단", "업무망·인터넷망분리"],
  },
  {
    term: "망연계",
    fullName: "망연계 (망간 자료전송, Network Interconnection Solution)",
    category: "네트워크 / 보안",
    definition:
      "망연계는 분리해 둔 보안 수준이 다른 두 망 사이에서 정해진 보안 정책에 맞는 자료만 검사해 넘겨 주는 장비 또는 체계입니다.",
    why: "망을 분리한 상태를 유지하면서도 업무에 꼭 필요한 파일과 데이터는 주고받을 수 있습니다.",
    compare: "방화벽은 두 망의 통신 연결 자체를 허용하거나 막고, 망연계는 직접 연결 없이 자료만 중계합니다.",
    aliases: ["망간자료전송", "망연계솔루션", "자료전송시스템", "망간자료전송제품"],
  },
  {
    term: "일방향 전송 장비",
    fullName: "데이터 다이오드 (Data Diode, Unidirectional Gateway)",
    category: "네트워크 / 보안",
    definition:
      "일방향 전송 장비(데이터 다이오드)는 데이터가 한쪽 방향으로만 흐르도록 허용하는 네트워크 장비입니다.",
    why: "제어 시스템 같은 중요한 망의 정보를 밖으로 내보내면서도 밖에서 들어오는 통신은 원천적으로 막을 수 있습니다.",
    compare: "일방향 전송 장비는 한 방향 전송만 되고, 일반 망연계 장비는 정책에 따라 양쪽 방향 자료 전송을 중계합니다.",
    aliases: ["데이터다이오드", "일방향게이트웨이", "단방향전송", "unidirectionalgateway", "일방향망연계"],
  },
  {
    term: "CDS",
    fullName: "교차 도메인 솔루션 (Cross Domain Solution)",
    category: "네트워크 / 보안",
    definition:
      "CDS(Cross Domain Solution)는 서로 다른 보안 영역 사이에서 수동 또는 자동으로 정보에 접근하거나 정보를 전송할 수 있게 하는 통제된 인터페이스입니다.",
    why: "보안 등급이 다른 망끼리 정해진 규칙 안에서만 정보를 주고받게 할 수 있습니다.",
    compare: "CDS는 미국 정부·국방 분야 용어이고, 한국에서 말하는 망연계와 역할이 비슷합니다.",
    aliases: ["crossdomainsolution", "교차도메인솔루션", "크로스도메인솔루션"],
  },
  {
    term: "에어갭",
    fullName: "에어갭 (Air Gap)",
    category: "네트워크 / 보안",
    definition:
      "에어갭은 두 시스템이 물리적으로 연결되어 있지 않고, 자료는 사람이 직접 통제하는 수동 방식으로만 옮길 수 있는 상태입니다.",
    why: "네트워크를 통한 침입 경로를 아예 없앨 수 있습니다.",
    compare: "에어갭은 연결이 전혀 없는 상태이고, 망연계나 일방향 전송은 통제된 연결 통로를 둔 상태입니다.",
    aliases: ["airgap", "완전분리", "폐쇄망"],
  },

  // ── 망·보안 — 제로 트러스트·접근 통제 ──
  {
    term: "제로 트러스트",
    fullName: "제로 트러스트 (Zero Trust, ZT)",
    category: "보안 / 아키텍처",
    definition:
      "제로 트러스트는 망이 이미 침해됐다고 보고, 망 위치만으로 신뢰하지 않으며 자원에 접근하는 요청마다 사용자와 기기를 확인해 최소 권한만 허용하는 보안 개념입니다.",
    why: "사내 망에 한 번 들어온 공격자가 내부를 자유롭게 옮겨 다니는 것을 막을 수 있습니다.",
    compare: "경계 보안은 망 안쪽을 믿고 바깥만 막고, 제로 트러스트는 안쪽 요청도 매번 검증합니다.",
    aliases: ["zerotrust", "zt", "zta", "제로트러스트아키텍처"],
  },
  {
    term: "SDP",
    fullName: "소프트웨어 정의 경계 (Software Defined Perimeter)",
    category: "보안 / 네트워크",
    definition:
      "SDP(Software Defined Perimeter)는 사용자와 기기를 먼저 인증한 뒤에만 해당 자원으로 가는 연결을 소프트웨어로 만들어 주고, 그 전에는 망과 자원을 숨기는 접근 통제 구조입니다.",
    why: "인증받지 않은 사람에게는 서비스가 보이지도 않아 공격 대상이 줄어듭니다.",
    compare: "SDP는 구조(컨트롤러와 접속·수락 호스트)를 가리키는 말이고, ZTNA는 그 구조를 쓰는 제품·서비스 분류를 가리키는 말로 주로 쓰입니다.",
    aliases: ["softwaredefinedperimeter", "소프트웨어정의경계", "소프트웨어정의페리미터"],
  },
  {
    term: "마이크로 세그멘테이션",
    fullName: "마이크로 세그멘테이션 (Micro-Segmentation)",
    category: "보안 / 네트워크",
    definition:
      "마이크로 세그멘테이션은 자원을 하나씩 또는 작은 묶음으로 별도 망 구간에 두고 구간마다 관문 보안 장비로 접근을 통제하는 방식입니다.",
    why: "한 서버가 뚫려도 같은 망의 다른 서버로 공격이 번지기 어렵습니다.",
    compare: "일반 망 분할은 서브넷·VLAN처럼 큰 단위로 나누고, 마이크로 세그멘테이션은 서버나 워크로드 단위까지 잘게 나눕니다.",
    aliases: ["microsegmentation", "초세분화", "워크로드세분화"],
  },
  {
    term: "정책 결정 지점·정책 시행 지점",
    fullName: "PDP (Policy Decision Point) · PEP (Policy Enforcement Point)",
    category: "보안 / 아키텍처",
    definition:
      "PDP는 접근 요청을 허용할지 정책에 따라 판단하는 구성 요소이고, PEP는 그 판단대로 사용자와 자원 사이의 연결을 열거나 끊는 구성 요소입니다.",
    why: "판단과 차단을 나누어 두면 모든 접근 요청에 같은 정책을 일관되게 적용할 수 있습니다.",
    compare: "PDP는 결정만 하고 통신은 지나가지 않으며, PEP는 실제 통신이 지나가는 관문입니다.",
    aliases: ["pdp", "pep", "정책결정지점", "정책시행지점", "policydecisionpoint", "policyenforcementpoint"],
  },
  {
    term: "NAC",
    fullName: "네트워크 접근 제어 (Network Access Control)",
    category: "네트워크 / 보안",
    definition:
      "NAC(Network Access Control)는 사용자 인증 결과와 기기의 보안 상태 점검 결과를 보고 그 기기를 네트워크에 붙여 줄지 정하는 기능 또는 장비입니다.",
    why: "백신이 꺼져 있거나 허가받지 않은 기기가 사내 망에 붙는 것을 막을 수 있습니다.",
    compare: "방화벽은 망과 망 사이의 통신을 통제하고, NAC는 기기가 망에 처음 붙는 순간을 통제합니다.",
    aliases: ["networkaccesscontrol", "네트워크접근제어", "네트워크접근통제", "단말접근제어"],
  },

  // ── 망·보안 — 보안 장비 ──
  {
    term: "IDS",
    fullName: "침입 탐지 시스템 (Intrusion Detection System)",
    category: "보안",
    definition:
      "IDS(Intrusion Detection System)는 네트워크나 시스템에서 일어나는 일을 감시·분석해 침입 시도를 찾아내고 관리자에게 알리는 보안 시스템입니다.",
    why: "방화벽을 통과한 공격이나 내부에서 일어나는 이상 행동을 알아챌 수 있습니다.",
    compare: "IDS는 탐지해서 알리기만 하고, IPS는 탐지한 공격을 차단까지 합니다.",
    aliases: ["intrusiondetectionsystem", "침입탐지시스템"],
  },
  {
    term: "IPS",
    fullName: "침입 방지 시스템 (Intrusion Prevention System)",
    category: "보안",
    definition:
      "IPS(Intrusion Prevention System)는 침입 행위를 탐지하고, 그 행위가 목표에 닿기 전에 막으려고 시도하는 보안 시스템입니다.",
    why: "알려진 공격 패턴이 담긴 통신을 사람이 개입하기 전에 자동으로 끊을 수 있습니다.",
    compare: "방화벽은 주소와 포트 기준으로 허용 여부를 정하고, IPS는 통신 내용에서 공격 패턴을 찾아 막습니다.",
    aliases: ["intrusionpreventionsystem", "침입방지시스템", "침입차단시스템", "idps"],
  },
  {
    term: "UTM",
    fullName: "통합 위협 관리 (Unified Threat Management)",
    category: "네트워크 / 보안",
    definition:
      "UTM(Unified Threat Management)은 방화벽, 악성코드 탐지·제거, 의심스러운 탐색 통신 차단 같은 여러 보안 기능을 장비 한 대에 모은 시스템입니다.",
    why: "장비 한 대로 정책을 관리할 수 있어 작은 조직이나 지점에서 운영 부담이 줄어듭니다.",
    compare: "UTM은 여러 기능을 한 장비에 묶는 데 초점이 있고, 차세대 방화벽은 애플리케이션 식별과 깊은 검사에 초점이 있습니다. 두 말의 경계는 흐립니다.",
    aliases: ["unifiedthreatmanagement", "통합위협관리", "통합보안장비"],
  },
  {
    term: "SSL VPN",
    fullName: "SSL VPN (Secure Sockets Layer Virtual Private Network)",
    category: "네트워크 / 보안",
    definition:
      "SSL VPN은 SSL/TLS로 보호된 연결을 통해 원격 사용자가 조직의 내부 자원에 안전하게 접속하게 해 주는 가상 사설망입니다.",
    why: "웹 브라우저나 가벼운 프로그램만으로 집이나 외부에서 회사 시스템에 접속할 수 있습니다.",
    compare: "SSL VPN은 주로 개인 사용자의 원격 접속에 쓰고, IPsec VPN은 주로 망과 망을 통째로 잇는 데 씁니다.",
    aliases: ["tlsvpn", "원격접속vpn", "클라이언트vpn"],
  },
  {
    term: "IPsec VPN",
    fullName: "IPsec VPN (Internet Protocol Security Virtual Private Network)",
    category: "네트워크 / 보안",
    definition:
      "IPsec VPN은 네트워크 계층에서 IP 통신을 암호화하는 개방형 표준 묶음인 IPsec으로 공용 망 위에 만든 가상 사설망입니다.",
    why: "애플리케이션을 고치지 않고도 두 망 사이의 모든 통신을 암호화할 수 있습니다.",
    compare: "IPsec VPN은 네트워크 계층에서 모든 통신을 보호하고, SSL VPN은 그 위 계층에서 사용자 접속을 보호합니다.",
    aliases: ["ipsec", "사이트간vpn", "sitetositevpn", "게이트웨이간vpn"],
  },

  // ── 망·보안 — 네트워크 ──
  {
    term: "VLAN",
    fullName: "가상 랜 (Virtual Local Area Network)",
    category: "네트워크",
    definition:
      "VLAN(Virtual LAN)은 하나의 물리적 랜을 데이터 링크 계층에서 서로 격리된 여러 브로드캐스트 영역으로 나눈 것입니다.",
    why: "스위치를 따로 사지 않고도 부서나 용도별로 망을 나눌 수 있습니다.",
    compare: "VLAN은 한 스위치 망 안에서 나누는 방식이고, VXLAN은 여러 데이터센터에 걸친 망 위에 가상 랜을 올리는 방식입니다.",
    aliases: ["virtuallan", "가상랜", "브이랜", "8021q"],
  },
  {
    term: "VXLAN",
    fullName: "가상 확장 랜 (Virtual eXtensible Local Area Network)",
    category: "네트워크",
    definition:
      "VXLAN은 계층 3 네트워크 위에 가상의 계층 2 네트워크를 겹쳐 올리는 방식으로, 여러 테넌트가 쓰는 가상화 데이터센터의 오버레이 망을 만드는 데 씁니다.",
    why: "물리 망 구성을 바꾸지 않고도 가상 머신용 망을 많이 만들고 여러 서버에 걸쳐 늘릴 수 있습니다.",
    compare: "VLAN은 스위치 망 안에서 구분하고, VXLAN은 IP 망 위에 터널로 가상 랜을 만듭니다.",
    aliases: ["virtualextensiblelan", "브이엑스랜", "오버레이네트워크"],
  },
  {
    term: "ACL",
    fullName: "접근 제어 목록 (Access Control List)",
    category: "네트워크 / 보안",
    definition:
      "ACL(Access Control List)은 어떤 대상이 자원에 접근할 수 있는지 허용할 대상을 나열해 접근을 통제하는 목록입니다.",
    why: "라우터나 스위치에서 출발지·목적지 주소와 포트를 기준으로 통신을 간단히 허용하거나 막을 수 있습니다.",
    compare: "ACL은 규칙 목록 자체를 가리키고, 방화벽은 그런 규칙에 더해 연결 상태 추적 같은 기능을 갖춘 장비입니다.",
    aliases: ["accesscontrollist", "접근제어목록", "접근통제목록"],
  },
  {
    term: "보안 그룹",
    fullName: "보안 그룹 (Security Group)",
    category: "클라우드 / 보안",
    definition:
      "보안 그룹은 클라우드에서 인스턴스 단위로 붙여 들어오고 나가는 통신을 허용 규칙으로 통제하며, 응답 통신은 자동으로 허용하는 상태 기반 가상 방화벽입니다.",
    why: "서버마다 필요한 포트와 상대만 열어 둘 수 있습니다.",
    compare: "보안 그룹은 인스턴스 단위·허용 규칙만·상태 기반이고, 네트워크 ACL은 서브넷 단위·허용과 거부 규칙·상태 비기반입니다.",
    aliases: ["securitygroup", "sg", "acg", "nsg", "시큐리티그룹"],
  },
  {
    term: "네트워크 ACL",
    fullName: "네트워크 접근 제어 목록 (Network Access Control List, NACL)",
    category: "클라우드 / 보안",
    definition:
      "네트워크 ACL은 클라우드에서 서브넷 단위로 들어오고 나가는 통신을 허용 또는 거부 규칙으로 통제하며, 응답 통신도 따로 허용해야 하는 상태 비기반 규칙 목록입니다.",
    why: "서브넷 전체에 특정 통신을 한 번에 막는 보조 방어선을 둘 수 있습니다.",
    compare: "네트워크 ACL은 서브넷 전체에 적용되고 규칙을 번호 순서로 평가하며, 보안 그룹은 인스턴스에 적용되고 모든 규칙을 함께 평가합니다.",
    aliases: ["nacl", "networkacl", "네트워크접근제어목록", "서브넷acl"],
  },
  {
    term: "BGP",
    fullName: "경계 경로 프로토콜 (Border Gateway Protocol)",
    category: "네트워크",
    definition:
      "BGP(Border Gateway Protocol)는 자율 시스템(AS) 사이에서 어떤 네트워크에 도달할 수 있는지 정보를 서로 교환하는 라우팅 프로토콜입니다.",
    why: "통신 사업자와 기업, 클라우드가 서로의 망으로 가는 길을 자동으로 알리고 바꿀 수 있습니다.",
    compare: "BGP는 조직과 조직 사이의 경로를 다루고, OSPF 같은 내부 라우팅 프로토콜은 한 조직 안의 경로를 다룹니다.",
    aliases: ["bordergatewayprotocol", "경계게이트웨이프로토콜"],
  },
  {
    term: "라우터",
    fullName: "라우터 (Router)",
    category: "네트워크",
    definition:
      "라우터는 두 네트워크 사이에서 OSI 3계층 관문 역할을 하며 데이터 패킷을 목적지 방향으로 중계하고 길을 정해 주는 장치입니다.",
    why: "서로 다른 네트워크에 있는 장비끼리 통신할 수 있습니다.",
    compare: "라우터는 IP 주소를 보고 네트워크 사이를 잇고, 스위치는 같은 네트워크 안의 장비를 잇습니다.",
    aliases: ["router", "라우팅장비", "공유기"],
  },
  {
    term: "게이트웨이",
    fullName: "게이트웨이 (Gateway)",
    category: "네트워크",
    definition:
      "게이트웨이는 둘 이상의 컴퓨터 네트워크에 붙어 그 사이의 통신을 이어 주는 중간 시스템입니다.",
    why: "서로 다른 네트워크나 방식이 다른 시스템이 한 지점을 거쳐 통신할 수 있습니다.",
    compare: "게이트웨이는 네트워크의 출입구 역할을 가리키는 넓은 말이고, 라우터는 그 역할을 3계층에서 하는 장치입니다.",
    aliases: ["gateway", "gw", "관문", "기본게이트웨이"],
  },

  // ── 망·보안 — 클라우드 네트워크 ──
  {
    term: "인터넷 게이트웨이",
    fullName: "인터넷 게이트웨이 (Internet Gateway, IGW)",
    category: "클라우드 / 네트워크",
    definition:
      "인터넷 게이트웨이는 VPC와 인터넷 사이의 통신을 가능하게 하는 VPC 구성 요소로, 공인 IP를 가진 자원이 인터넷과 양쪽 방향으로 통신하게 해 줍니다.",
    why: "로드밸런서나 웹 서버처럼 인터넷에서 접속해야 하는 자원을 외부와 연결할 수 있습니다.",
    compare: "인터넷 게이트웨이로 가는 경로가 있는 서브넷이 퍼블릭 서브넷이고, 없는 서브넷이 프라이빗 서브넷입니다.",
    aliases: ["internetgateway", "igw", "인터넷gw"],
  },
  {
    term: "프라이빗 엔드포인트",
    fullName: "프라이빗 엔드포인트 (Private Endpoint, VPC Endpoint, PrivateLink)",
    category: "클라우드 / 네트워크",
    definition:
      "프라이빗 엔드포인트는 가상 네트워크 안의 사설 IP 주소를 쓰는 네트워크 인터페이스로, 클라우드 서비스나 다른 계정의 서비스에 인터넷을 거치지 않고 사설로 접속하게 해 줍니다.",
    why: "스토리지나 DB 같은 관리형 서비스를 인터넷 게이트웨이나 NAT 없이 쓸 수 있습니다.",
    compare: "프라이빗 엔드포인트는 특정 서비스 하나로 가는 한 방향 통로이고, 피어링은 두 네트워크 전체를 양쪽 방향으로 잇습니다.",
    aliases: ["privateendpoint", "vpc엔드포인트", "privatelink", "privateserviceconnect", "서비스게이트웨이"],
  },
  {
    term: "VPC 피어링",
    fullName: "VPC 피어링 (VPC Peering, Virtual Network Peering)",
    category: "클라우드 / 네트워크",
    definition:
      "VPC 피어링은 두 가상 네트워크를 사업자 내부망으로 직접 이어 서로의 자원이 사설 IP 주소로 통신하게 하는 연결입니다.",
    why: "서로 다른 VPC나 계정에 있는 시스템이 인터넷을 거치지 않고 통신할 수 있습니다.",
    compare: "피어링은 두 네트워크를 일대일로 잇고 다른 네트워크로 건너가지 못하며, 전송 게이트웨이는 여러 네트워크를 중앙 허브 하나에 모아 잇습니다.",
    aliases: ["vpcpeering", "가상네트워크피어링", "vnetpeering", "피어링"],
  },
  {
    term: "전송 게이트웨이",
    fullName: "전송 게이트웨이 (Transit Gateway)",
    category: "클라우드 / 네트워크",
    definition:
      "전송 게이트웨이는 여러 VPC와 온프레미스 네트워크를 서로 잇는 데 쓰는 클라우드의 네트워크 전송 허브입니다.",
    why: "VPC가 많아져도 연결을 한곳에 모아 경로를 관리할 수 있습니다.",
    compare: "전송 게이트웨이는 허브 하나에 여러 네트워크를 붙이고, 피어링은 네트워크 쌍마다 연결을 따로 만듭니다.",
    aliases: ["transitgateway", "tgw", "트랜짓게이트웨이", "transithub", "virtualwan허브"],
  },
  {
    term: "클라우드 전용선",
    fullName: "클라우드 전용 연결 (AWS Direct Connect · Azure ExpressRoute · Google Cloud Interconnect)",
    category: "클라우드 / 네트워크",
    definition:
      "클라우드 전용선은 사내 네트워크와 클라우드 사업자 네트워크를 공용 인터넷을 거치지 않는 전용 회선으로 잇는 연결 서비스입니다.",
    why: "인터넷 VPN보다 속도와 지연이 일정하고 통신이 공용 인터넷에 노출되지 않습니다.",
    compare: "클라우드 전용선은 전용 회선을 쓰고, 사이트 간 VPN은 공용 인터넷 위에 암호화 터널을 만듭니다.",
    aliases: ["directconnect", "dx", "expressroute", "cloudinterconnect", "dedicatedinterconnect", "전용연결"],
  },
  {
    term: "격리 서브넷",
    fullName: "격리 서브넷 (Isolated Subnet)",
    category: "클라우드 / 네트워크",
    definition:
      "격리 서브넷은 VPC 밖의 목적지로 가는 경로가 없어 같은 VPC 안의 자원끼리만 접속하고 접속받을 수 있는 서브넷입니다.",
    why: "DB처럼 외부와 통신할 필요가 없는 자원을 가장 안쪽에 둘 수 있습니다.",
    compare: "격리 서브넷은 밖으로 나가는 통신도 안 되고, 프라이빗 서브넷은 NAT를 거쳐 나가는 통신은 됩니다.",
    aliases: ["isolatedsubnet", "데이터서브넷", "db서브넷", "폐쇄서브넷"],
  },
  {
    term: "허브-스포크",
    fullName: "허브-스포크 네트워크 토폴로지 (Hub-and-Spoke Network Topology)",
    category: "클라우드 / 아키텍처",
    definition:
      "허브-스포크는 방화벽·게이트웨이 같은 공유 네트워크 기능을 둔 중앙 허브 네트워크에 업무별 스포크 네트워크를 붙여 연결하는 구성 방식입니다.",
    why: "인터넷 출구와 사내 연결, 보안 검사를 허브 한곳에서 통제하면서 업무별 네트워크는 서로 격리할 수 있습니다.",
    compare: "허브-스포크는 모든 통신이 허브를 거치고, 풀 메시는 네트워크끼리 서로 직접 잇습니다.",
    aliases: ["hubspoke", "허브앤스포크", "허브스포크토폴로지", "hubandspoke"],
  },
  {
    term: "검사 VPC",
    fullName: "검사 VPC (Inspection VPC)",
    category: "클라우드 / 보안",
    definition:
      "검사 VPC는 VPC 사이, 인터넷, 온프레미스로 오가는 통신을 한곳에 모아 방화벽으로 검사하는 전용 VPC입니다.",
    why: "VPC마다 방화벽을 두지 않고 한곳에서 같은 정책으로 검사할 수 있습니다.",
    compare: "검사 VPC는 통신을 검사하는 곳이고, 이그레스 VPC는 인터넷으로 나가는 출구를 모아 둔 곳입니다.",
    aliases: ["inspectionvpc", "보안검사vpc", "방화벽vpc", "중앙검사"],
  },
  {
    term: "이그레스 VPC",
    fullName: "이그레스 VPC (Egress VPC, Outbound VPC)",
    category: "클라우드 / 네트워크",
    definition:
      "이그레스 VPC는 여러 VPC에서 시작해 인터넷으로 나가는 통신을 한곳에 모아 NAT 게이트웨이 등을 거쳐 내보내는 중앙 출구 VPC입니다.",
    why: "VPC마다 NAT 게이트웨이를 두지 않아도 되고 밖으로 나가는 통신을 한곳에서 통제할 수 있습니다.",
    compare: "이그레스 VPC는 안에서 시작한 통신의 출구이고, 인그레스 VPC는 밖에서 시작한 접속을 받는 입구입니다.",
    aliases: ["egressvpc", "아웃바운드vpc", "중앙이그레스", "centralizedegress"],
  },
  {
    term: "공유 VPC",
    fullName: "공유 VPC (Shared VPC, VPC Sharing)",
    category: "클라우드 / 네트워크",
    definition:
      "공유 VPC는 한 조직의 여러 프로젝트(계정)가 하나의 공통 VPC 네트워크에 자원을 붙여 내부 IP 주소로 통신하게 하는 방식입니다.",
    why: "네트워크는 중앙 팀이 한곳에서 관리하고 각 팀은 자기 자원만 관리할 수 있습니다.",
    compare: "공유 VPC는 네트워크 하나를 여러 계정이 함께 쓰고, 피어링은 계정마다 따로 만든 네트워크를 서로 잇습니다.",
    aliases: ["sharedvpc", "vpc공유", "호스트프로젝트", "서비스프로젝트"],
  },

  // ── 망·보안 — 암호·인증 ──
  {
    term: "HSM",
    fullName: "하드웨어 보안 모듈 (Hardware Security Module)",
    category: "보안 / 암호",
    definition:
      "HSM(Hardware Security Module)은 암호 키를 보호·관리하고 암호 연산을 수행하는 물리적 컴퓨팅 장치입니다.",
    why: "키를 장치 밖으로 꺼내지 않고 서명·암호화를 할 수 있어 키 유출 위험이 줄어듭니다.",
    compare: "HSM은 키를 보관하는 전용 하드웨어이고, KMS는 키의 생성·교체·폐기 같은 수명 관리를 맡는 시스템입니다.",
    aliases: ["hardwaresecuritymodule", "하드웨어보안모듈", "cloudhsm", "암호모듈"],
  },
  {
    term: "KMS",
    fullName: "키 관리 시스템 (Key Management System / Service)",
    category: "보안 / 암호",
    definition:
      "KMS(Key Management System)는 암호 키와 그 메타데이터의 생성, 배포, 저장, 백업, 사용, 폐기 등을 관리하는 시스템입니다.",
    why: "암호 키를 애플리케이션 코드나 설정 파일에 두지 않고 한곳에서 통제하고 교체할 수 있습니다.",
    compare: "KMS는 키의 수명 관리를 맡고, HSM은 그 키를 안전하게 담는 하드웨어입니다.",
    aliases: ["keymanagementsystem", "keymanagementservice", "키관리서비스", "키관리시스템"],
  },
  {
    term: "PKI",
    fullName: "공개 키 기반 구조 (Public Key Infrastructure)",
    category: "보안 / 암호",
    definition:
      "PKI(Public Key Infrastructure)는 공개 키 인증서를 발급, 유지, 폐기하기 위해 갖춘 체계입니다.",
    why: "통신 상대가 진짜인지 인증서로 확인할 수 있는 신뢰 기반이 생깁니다.",
    compare: "PKI는 인증서를 발급·관리하는 체계 전체이고, 인증서는 그 체계가 발급한 개별 증명서입니다.",
    aliases: ["publickeyinfrastructure", "공개키기반구조", "인증체계", "ca"],
  },
  {
    term: "TLS",
    fullName: "전송 계층 보안 (Transport Layer Security)",
    category: "보안 / 네트워크",
    definition:
      "TLS(Transport Layer Security)는 클라이언트와 서버가 인터넷에서 주고받는 통신을 도청, 변조, 위조할 수 없게 보호하는 프로토콜입니다.",
    why: "중간에서 통신을 가로채도 내용을 보거나 바꿀 수 없습니다.",
    compare: "TLS는 SSL의 후속 표준이며, HTTPS는 HTTP 통신을 TLS로 보호한 것입니다.",
    aliases: ["transportlayersecurity", "ssl", "ssltls", "전송계층보안"],
  },
  {
    term: "SSO",
    fullName: "통합 인증 (Single Sign-On)",
    category: "보안 / 인증",
    definition:
      "SSO(Single Sign-On)는 하나의 계정과 인증 수단으로 여러 애플리케이션에 접속하는 인증 방식입니다.",
    why: "사용자는 한 번만 로그인하면 되고 조직은 계정을 한곳에서 관리하고 막을 수 있습니다.",
    compare: "SSO는 한 번 로그인으로 여러 시스템을 쓰는 방식이고, SAML과 OIDC는 SSO를 구현하는 데 쓰는 표준 프로토콜입니다.",
    aliases: ["singlesignon", "통합로그인", "싱글사인온", "통합인증"],
  },
  {
    term: "SAML",
    fullName: "보안 주장 마크업 언어 (Security Assertion Markup Language)",
    category: "보안 / 인증",
    definition:
      "SAML(Security Assertion Markup Language)은 서로 다른 조직의 시스템 사이에서 사용자 인증·권한 같은 보안 정보를 주고받는 틀을 정의한 OASIS 표준입니다.",
    why: "회사 계정으로 외부 SaaS에 따로 가입하지 않고 로그인할 수 있습니다.",
    compare: "SAML은 XML 기반으로 기업용 웹 SSO에 오래 쓰였고, OIDC는 OAuth 2.0 위에 만든 더 가벼운 방식입니다.",
    aliases: ["securityassertionmarkuplanguage", "샘엘"],
  },
  {
    term: "OIDC",
    fullName: "오픈아이디 커넥트 (OpenID Connect)",
    category: "보안 / 인증",
    definition:
      "OIDC(OpenID Connect)는 OAuth 2.0 프로토콜 위에 얹은 신원 계층으로, 인가 서버가 수행한 인증을 바탕으로 클라이언트가 사용자의 신원을 확인하게 해 주는 표준입니다.",
    why: "앱이 비밀번호를 직접 다루지 않고도 로그인한 사용자가 누구인지 알 수 있습니다.",
    compare: "OAuth는 자원에 접근할 권한을 위임하는 표준이고, OIDC는 거기에 사용자가 누구인지 확인하는 기능을 더한 표준입니다.",
    aliases: ["openidconnect", "오픈아이디커넥트"],
  },
  {
    term: "IAM",
    fullName: "계정 및 접근 관리 (Identity and Access Management)",
    category: "보안 / 인증",
    definition:
      "IAM(Identity and Access Management)은 사용자와 시스템의 신원을 만들고 인증 수단과 묶어, 누가 어떤 자원에 접근할 수 있는지 권한을 관리하는 체계입니다.",
    why: "사람과 프로그램마다 꼭 필요한 권한만 주고 그 사용 내역을 추적할 수 있습니다.",
    compare: "IAM은 누가 무엇을 할 수 있는지 권한을 다루고, 방화벽과 보안 그룹은 어디서 어디로 통신할 수 있는지를 다룹니다.",
    aliases: ["identityandaccessmanagement", "계정권한관리", "icam", "아이엠"],
  },
  {
    term: "MFA",
    fullName: "다중 요소 인증 (Multi-Factor Authentication)",
    category: "보안 / 인증",
    definition:
      "MFA(Multi-Factor Authentication)는 서로 다른 종류의 인증 요소를 두 가지 이상 써서 본인임을 확인하는 인증 방식입니다.",
    why: "비밀번호가 유출돼도 다른 요소가 없으면 로그인할 수 없습니다.",
    compare: "MFA는 한 번의 로그인에 여러 요소를 요구하는 것이고, SSO는 한 번의 로그인으로 여러 시스템을 쓰게 하는 것입니다.",
    aliases: ["multifactorauthentication", "다중인증", "2단계인증", "2fa", "otp인증"],
  },

  // ── 망·보안 — 운영 보안 ──
  {
    term: "SIEM",
    fullName: "보안 정보 및 이벤트 관리 (Security Information and Event Management)",
    category: "보안 / 운영",
    definition:
      "SIEM(Security Information and Event Management)은 여러 시스템 구성 요소에서 보안 데이터를 모아 하나의 화면에서 대응에 쓸 수 있는 정보로 보여 주는 도구입니다.",
    why: "흩어진 로그를 한곳에서 엮어 보아 개별 장비에서는 보이지 않던 공격 징후를 찾을 수 있습니다.",
    compare: "SIEM은 로그를 모아 분석하고 경보를 내며, SOAR는 그 경보에 대한 대응 절차를 자동으로 실행합니다.",
    aliases: ["securityinformationandeventmanagement", "통합보안관제", "보안관제시스템", "통합로그분석", "esm"],
  },

  // ── 제품 — 운영체제 ──
  {
    term: "RHEL",
    fullName: "Red Hat Enterprise Linux",
    category: "운영체제 / 리눅스",
    definition:
      "RHEL(Red Hat Enterprise Linux)은 레드햇(Red Hat)이 구독 방식으로 기술 지원과 함께 공급하는 기업용 리눅스 배포판입니다.",
    why: "",
    compare: "",
    aliases: ["redhat", "redhatenterpriselinux", "레드햇", "레드햇리눅스", "렐"],
  },
  {
    term: "CentOS",
    fullName: "Community Enterprise Operating System",
    category: "운영체제 / 리눅스 (지원 종료)",
    definition:
      "CentOS(CentOS Linux)는 RHEL과 호환되던 무료 리눅스 배포판으로, 지금은 지원이 끝나고 개발 단계 판인 CentOS Stream만 이어지고 있습니다.",
    why: "",
    compare: "",
    aliases: ["centoslinux", "centosstream", "센트os", "센토스"],
  },
  {
    term: "Windows Server",
    fullName: "Microsoft Windows Server",
    category: "운영체제 / 윈도우",
    definition:
      "Windows Server는 마이크로소프트(Microsoft)가 만드는 서버용 운영체제로, Active Directory·IIS·Hyper-V 같은 서버 기능을 함께 제공하는 상용 제품입니다.",
    why: "",
    compare: "",
    aliases: ["windows", "winserver", "윈도우서버", "윈도서버", "윈도우즈서버"],
  },

  // ── 제품 — 웹 서버 · WAS · 실행 환경 ──
  {
    term: "WebtoB",
    fullName: "WebtoB",
    category: "웹 서버",
    definition:
      "WebtoB는 티맥스소프트(TmaxSoft)가 만든 상용 웹 서버로, 같은 회사의 WAS인 JEUS와 짝을 이루어 국내 공공·금융 시스템에서 많이 쓰입니다.",
    why: "",
    compare: "",
    aliases: ["web2b", "웹투비"],
  },
  {
    term: "JEUS",
    fullName: "Java Enterprise User Solution",
    category: "WAS / 서블릿 컨테이너",
    definition:
      "JEUS(Java Enterprise User Solution)는 티맥스소프트(TmaxSoft)가 만든 상용 자바 웹 애플리케이션 서버(WAS)로, Java EE(Jakarta EE) 표준을 따릅니다.",
    why: "",
    compare: "",
    aliases: ["tmaxjeus", "제우스"],
  },
  {
    term: "JBoss EAP",
    fullName: "Red Hat JBoss Enterprise Application Platform",
    category: "WAS / 서블릿 컨테이너",
    definition:
      "JBoss EAP는 오픈소스 WildFly를 바탕으로 레드햇이 구독 방식으로 기술 지원을 붙여 공급하는 자바 웹 애플리케이션 서버(WAS)입니다.",
    why: "",
    compare: "",
    aliases: ["jboss", "jbossas", "제이보스"],
  },
  {
    term: "WildFly",
    fullName: "WildFly (구 JBoss Application Server)",
    category: "WAS / 서블릿 컨테이너",
    definition:
      "WildFly는 예전에 JBoss AS라고 부르던 오픈소스 자바 웹 애플리케이션 서버(WAS)로, 상용 제품인 JBoss EAP의 바탕이 되는 커뮤니티 프로젝트입니다.",
    why: "",
    compare: "",
    aliases: ["와일드플라이"],
  },
  {
    term: "Gunicorn",
    fullName: "Green Unicorn",
    category: "WAS / 파이썬 WSGI 서버",
    definition:
      "Gunicorn(Green Unicorn)은 파이썬(Python) 웹 애플리케이션을 WSGI 규격으로 실행하는 오픈소스 HTTP 서버로, 미리 띄워 둔 워커 프로세스들이 요청을 나누어 처리합니다.",
    why: "",
    compare: "",
    aliases: ["greenunicorn", "구니콘", "지유니콘"],
  },
  {
    term: "uWSGI",
    fullName: "uWSGI",
    category: "WAS / 파이썬 WSGI 서버 (유지보수 모드)",
    definition:
      "uWSGI는 파이썬 웹 애플리케이션을 WSGI 규격으로 실행하는 오픈소스 애플리케이션 서버로, 지금은 버그 수정만 하는 유지보수 모드라고 공식 문서가 밝히고 있습니다.",
    why: "",
    compare: "",
    aliases: ["유위스기"],
  },

  // ── 제품 — 데이터베이스 ──
  {
    term: "Tibero",
    fullName: "Tibero RDBMS",
    category: "관계형 DB",
    definition:
      "Tibero는 티맥스티베로(TmaxTibero)가 만든 국산 상용 관계형 데이터베이스(RDBMS)로, Oracle과 SQL 문법 호환성이 높아 국내 공공·금융에서 대체 제품으로 쓰입니다.",
    why: "",
    compare: "",
    aliases: ["tmaxtibero", "티베로"],
  },
  {
    term: "CUBRID",
    fullName: "CUBRID",
    category: "관계형 DB",
    definition:
      "CUBRID는 큐브리드(CUBRID)가 개발을 이끄는 국산 오픈소스 관계형 데이터베이스(RDBMS)로, 라이선스 비용이 없어 국내 공공기관에서 많이 쓰입니다.",
    why: "",
    compare: "",
    aliases: ["큐브리드"],
  },
  {
    term: "OpenSearch",
    fullName: "OpenSearch",
    category: "검색 엔진",
    definition:
      "OpenSearch는 Elasticsearch에서 갈라져 나온 오픈소스 검색·분석 엔진으로, 리눅스 재단 산하 OpenSearch Software Foundation이 관리합니다.",
    why: "",
    compare: "",
    aliases: ["amazonopensearch", "오픈서치"],
  },

  // ── 제품 — 미들웨어 · 연계 · 배치 ──
  {
    term: "Tuxedo",
    fullName: "Oracle Tuxedo",
    category: "미들웨어 / TP 모니터",
    definition:
      "Tuxedo(Oracle Tuxedo)는 오라클이 공급하는 상용 TP 모니터(트랜잭션 처리 미들웨어)로, C·COBOL로 만든 업무 서비스의 분산 트랜잭션을 관리합니다.",
    why: "",
    compare: "",
    aliases: ["oracletuxedo", "beatuxedo", "턱시도"],
  },
  {
    term: "Tmax",
    fullName: "Tmax (TP 모니터)",
    category: "미들웨어 / TP 모니터",
    definition:
      "Tmax는 티맥스소프트(TmaxSoft)가 1997년에 내놓은 국산 상용 TP 모니터(트랜잭션 처리 미들웨어)로, 국내 금융권 계정계에서 많이 쓰입니다.",
    why: "",
    compare: "",
    aliases: ["티맥스"],
  },

  // ── 제품 — 가상화 · 컨테이너 ──
  {
    term: "VMware vSphere",
    fullName: "VMware vSphere",
    category: "가상화 플랫폼",
    definition:
      "VMware vSphere는 브로드컴(Broadcom)에 인수된 VMware의 서버 가상화 플랫폼으로, 하이퍼바이저인 ESXi와 관리 서버인 vCenter로 이루어집니다.",
    why: "",
    compare: "",
    aliases: ["vsphere", "vmware", "브이스피어", "vm웨어", "브이엠웨어"],
  },
  {
    term: "ESXi",
    fullName: "VMware ESXi",
    category: "가상화 / 하이퍼바이저",
    definition:
      "ESXi(VMware ESXi)는 물리 서버에 운영체제 없이 직접 설치해 그 위에 여러 가상 머신을 띄우는 VMware의 하이퍼바이저입니다.",
    why: "",
    compare: "",
    aliases: ["vmwareesxi", "esx", "이에스엑스아이"],
  },
  {
    term: "vCenter",
    fullName: "VMware vCenter Server",
    category: "가상화 / 관리 서버",
    definition:
      "vCenter(VMware vCenter Server)는 여러 ESXi 호스트와 그 위의 가상 머신을 한 화면에서 관리하고 호스트 사이로 가상 머신을 옮기게 해 주는 VMware의 중앙 관리 서버입니다.",
    why: "",
    compare: "",
    aliases: ["vcenterserver", "vcsa", "브이센터"],
  },
  {
    term: "OpenStack",
    fullName: "OpenStack",
    category: "클라우드 플랫폼 / IaaS",
    definition:
      "OpenStack은 자체 데이터센터의 서버·저장소·네트워크를 묶어 사설 클라우드(IaaS)로 운영하게 해 주는 오픈소스 클라우드 플랫폼으로, OpenInfra 재단(2025년 리눅스 재단 합류)이 관리합니다.",
    why: "",
    compare: "",
    aliases: ["오픈스택"],
  },
  {
    term: "containerd",
    fullName: "containerd",
    category: "컨테이너 / 런타임",
    definition:
      "containerd는 컨테이너 이미지를 내려받고 컨테이너를 실행·관리하는 오픈소스 컨테이너 런타임으로, CNCF 졸업 프로젝트이며 쿠버네티스의 기본 런타임으로 많이 쓰입니다.",
    why: "",
    compare: "",
    aliases: ["컨테이너디"],
  },
  {
    term: "Helm",
    fullName: "Helm",
    category: "쿠버네티스 / 패키지 관리",
    definition:
      "Helm은 쿠버네티스에 올릴 설정 묶음을 차트(Chart)라는 패키지로 만들어 설치·업그레이드·되돌리기를 하게 해 주는 오픈소스 패키지 관리 도구로, CNCF 졸업 프로젝트입니다.",
    why: "",
    compare: "",
    aliases: ["helmchart", "헬름"],
  },
  {
    term: "Istio",
    fullName: "Istio",
    category: "쿠버네티스 / 서비스 메시",
    definition:
      "Istio는 쿠버네티스 안의 서비스들 사이 통신을 프록시로 가로채 암호화·경로 제어·관측을 해 주는 오픈소스 서비스 메시로, CNCF 졸업 프로젝트입니다.",
    why: "",
    compare: "",
    aliases: ["이스티오"],
  },
  {
    term: "Harbor",
    fullName: "Harbor",
    category: "컨테이너 / 이미지 레지스트리",
    definition:
      "Harbor는 컨테이너 이미지를 사내에 저장하고 접근 권한 관리와 취약점 검사를 해 주는 오픈소스 컨테이너 이미지 레지스트리로, CNCF 졸업 프로젝트입니다.",
    why: "",
    compare: "",
    aliases: ["harborregistry", "하버"],
  },

  // ── 제품 — 운영 도구 (빌드·배포·구성·모니터링) ──
  {
    term: "Argo CD",
    fullName: "Argo CD",
    category: "CI/CD / 쿠버네티스 배포",
    definition:
      "Argo CD는 Git 저장소에 적힌 설정과 쿠버네티스 클러스터의 실제 상태를 맞춰 주는 방식(GitOps)으로 배포하는 오픈소스 도구로, CNCF 졸업 프로젝트 Argo의 일부입니다.",
    why: "",
    compare: "",
    aliases: ["argo", "아르고cd", "아르고씨디"],
  },
  {
    term: "Prometheus",
    fullName: "Prometheus",
    category: "모니터링 / 메트릭",
    definition:
      "Prometheus는 서버와 애플리케이션의 수치 지표(메트릭)를 주기적으로 가져와 시계열로 저장하고 조건에 맞으면 알림을 보내는 오픈소스 모니터링 시스템으로, CNCF 졸업 프로젝트입니다.",
    why: "",
    compare: "",
    aliases: ["프로메테우스"],
  },
  {
    term: "Zabbix",
    fullName: "Zabbix",
    category: "모니터링 / 인프라",
    definition:
      "Zabbix는 서버·네트워크 장비·애플리케이션의 상태를 수집해 감시하고 알림을 보내는 오픈소스 인프라 모니터링 도구로, 7.0부터 AGPLv3 라이선스로 배포됩니다.",
    why: "",
    compare: "",
    aliases: ["자빅스"],
  },
  {
    term: "EFK 스택",
    fullName: "Elasticsearch · Fluentd · Kibana",
    category: "로깅 / 로그 수집·검색",
    definition:
      "EFK 스택은 ELK 스택에서 로그 수집기 Logstash를 Fluentd(또는 Fluent Bit)로 바꾼 구성으로, 쿠버네티스 환경의 로그 수집에 많이 쓰입니다.",
    why: "",
    compare: "",
    aliases: ["efk", "이에프케이"],
  },
  {
    term: "Fluentd",
    fullName: "Fluentd",
    category: "로깅 / 로그 수집기",
    definition:
      "Fluentd는 여러 곳에서 나오는 로그를 한 형식으로 모아 원하는 저장소로 보내는 오픈소스 로그 수집기로, CNCF 졸업 프로젝트입니다.",
    why: "",
    compare: "",
    aliases: ["fluentbit", "플루언트디"],
  },
  {
    term: "Scouter",
    fullName: "Scouter",
    category: "모니터링 / APM",
    definition:
      "Scouter는 LG CNS가 공개한 오픈소스 애플리케이션 성능 모니터링(APM) 도구로, 주로 자바 WAS의 응답 시간과 처리량을 실시간으로 보여 줍니다.",
    why: "",
    compare: "",
    aliases: ["스카우터"],
  },
  {
    term: "Jennifer",
    fullName: "JENNIFER",
    category: "모니터링 / APM",
    definition:
      "Jennifer(JENNIFER)는 제니퍼소프트(JenniferSoft)가 만든 국산 상용 애플리케이션 성능 모니터링(APM) 제품으로, Java·.NET·PHP 웹 애플리케이션의 상태를 실시간으로 보여 줍니다.",
    why: "",
    compare: "",
    aliases: ["jenniferapm", "제니퍼"],
  },
  {
    term: "Pinpoint",
    fullName: "Pinpoint",
    category: "모니터링 / APM",
    definition:
      "Pinpoint는 네이버가 공개한 Apache 2.0 라이선스의 오픈소스 애플리케이션 성능 모니터링(APM) 도구로, 여러 서버를 거치는 요청의 흐름을 추적해 보여 줍니다.",
    why: "",
    compare: "",
    aliases: ["naverpinpoint", "핀포인트"],
  },
  {
    term: "Sentry",
    fullName: "Sentry",
    category: "모니터링 / 오류 추적",
    definition:
      "Sentry는 애플리케이션에서 난 오류를 모아 원인 위치와 함께 알려 주는 오류 추적 서비스로, 소스는 공개되어 있지만 FSL이라는 경쟁 금지 조건의 라이선스를 씁니다.",
    why: "",
    compare: "",
    aliases: ["센트리"],
  },
  {
    term: "SonarQube",
    fullName: "SonarQube (SonarQube Server / Community Build)",
    category: "코드 품질 / 정적 분석",
    definition:
      "SonarQube는 소스 코드를 자동으로 검사해 버그·보안 취약점·코드 품질 문제를 찾아 주는 소나(Sonar)의 정적 분석 도구입니다.",
    why: "",
    compare: "",
    aliases: ["sonar", "sonarqubeserver", "소나큐브"],
  },

  // ── 개념 — 스토리지 · 연결 ──
  {
    term: "파일 스토리지",
    fullName: "파일 스토리지(File Storage)",
    category: "하드웨어 / 스토리지 방식",
    definition:
      "파일 스토리지는 데이터를 폴더와 파일 구조로 저장하고 NFS·SMB 같은 규약으로 여러 서버가 함께 쓰는 저장 방식입니다.",
    why: "여러 서버가 같은 파일을 보통의 폴더처럼 읽고 쓰게 합니다.",
    compare: "파일 스토리지는 폴더 경로로 찾고, 오브젝트 스토리지는 고유한 키(주소)로 찾습니다.",
    aliases: ["filestorage", "공유파일시스템", "nfs", "smb", "cifs"],
  },
  {
    term: "오브젝트 스토리지",
    fullName: "오브젝트 스토리지(Object Storage)",
    category: "하드웨어 / 스토리지 방식",
    definition:
      "오브젝트 스토리지는 파일을 설명 정보와 함께 객체 단위로 저장하고 HTTP API로 넣고 꺼내는 저장 방식입니다.",
    why: "이미지·동영상·백업처럼 양이 아주 많은 파일을 싸게 거의 한없이 저장합니다.",
    compare: "오브젝트 스토리지는 디스크처럼 서버에 붙이지 않고 API로 접근하며, 파일 일부만 고쳐 쓰기는 어렵습니다.",
    aliases: ["objectstorage", "객체스토리지", "오브젝트저장소", "버킷"],
  },

  // ── 노드 종류 ──
  {
    term: "웹 클라이언트",
    fullName: "웹 클라이언트(Web Client, 웹 브라우저)",
    category: "사용자 / 접속 단말",
    definition:
      "웹 클라이언트는 사용자가 PC나 휴대폰의 웹 브라우저로 서비스에 접속하는 쪽을 가리키는 말입니다.",
    why: "구성도에서 요청이 어디서 시작되는지를 보여 줍니다.",
    compare: "웹 클라이언트는 브라우저로 접속하고, 모바일 클라이언트는 설치한 앱으로 접속합니다.",
    aliases: ["webclient", "browser", "브라우저", "사용자pc", "웹사용자"],
  },
  {
    term: "모바일 클라이언트",
    fullName: "모바일 클라이언트(Mobile Client, 모바일 앱)",
    category: "사용자 / 접속 단말",
    definition:
      "모바일 클라이언트는 사용자가 휴대폰이나 태블릿에 설치한 앱으로 서비스에 접속하는 쪽을 가리키는 말입니다.",
    why: "앱은 브라우저와 달리 푸시 알림·앱 배포·버전 관리가 따로 필요해 구성도에서 구분합니다.",
    compare: "모바일 클라이언트는 보통 화면이 아니라 API를 호출하고, 웹 클라이언트는 화면(HTML)도 함께 받습니다.",
    aliases: ["mobileclient", "mobileapp", "모바일앱", "앱", "ios", "android"],
  },
  {
    term: "관리자",
    fullName: "관리자(Administrator, 운영자)",
    category: "사용자 / 접속 주체",
    definition:
      "관리자는 서비스나 서버를 설정·운영하기 위해 일반 사용자와 다른 경로와 권한으로 접속하는 내부 사람을 가리킵니다.",
    why: "관리자 접속 경로는 일반 사용자 경로와 분리해 더 엄격하게 통제해야 하므로 구성도에 따로 그립니다.",
    compare: "일반 사용자는 인터넷으로 서비스 화면에 들어오고, 관리자는 VPN·배스천 등을 거쳐 관리 화면이나 서버에 들어옵니다.",
    aliases: ["admin", "administrator", "운영자", "어드민", "관리자단말"],
  },
  {
    term: "웹 서버",
    fullName: "웹 서버(Web Server)",
    category: "서버 / 웹 계층",
    definition:
      "웹 서버는 브라우저의 HTTP 요청을 받아 이미지·HTML 같은 정해진 파일을 돌려주고, 프로그램 실행이 필요한 요청은 뒤쪽 WAS로 넘기는 서버입니다.",
    why: "단순한 파일 전달과 접속 처리를 앞에서 맡아 WAS의 부담을 덜고 WAS를 외부에 직접 드러내지 않습니다.",
    compare: "웹 서버는 이미 만들어진 파일을 전달하고, WAS는 프로그램을 실행해 결과를 만들어 냅니다.",
    aliases: ["webserver", "web", "http서버"],
  },
  {
    term: "앱 서버",
    fullName: "애플리케이션 서버(Application Server)",
    category: "서버 / 애플리케이션 계층",
    definition:
      "앱 서버는 업무 로직을 담은 프로그램을 실행해 요청을 처리하는 서버를 통틀어 부르는 말입니다.",
    why: "화면 전달(웹 서버)과 데이터 저장(DB) 사이에서 실제 업무 처리를 맡습니다.",
    compare: "WAS는 웹 요청을 처리하는 앱 서버의 한 종류이고, 앱 서버는 API 서버·내부 업무 서버까지 포함하는 넓은 말입니다.",
    aliases: ["appserver", "applicationserver", "ap서버", "ap", "애플리케이션서버", "api서버"],
  },
  {
    term: "배치 서버",
    fullName: "배치 서버(Batch Server)",
    category: "서버 / 배치",
    definition:
      "배치 서버는 사용자의 요청을 기다리지 않고 정해진 시각에 대량의 데이터를 한꺼번에 처리하는 프로그램을 실행하는 서버입니다.",
    why: "정산·통계·데이터 이관처럼 오래 걸리는 작업을 온라인 서비스와 분리해 서비스가 느려지지 않게 합니다.",
    compare: "배치 서버는 정해진 시간에 몰아서 처리하고, WAS는 요청이 올 때마다 바로 처리합니다.",
    aliases: ["batchserver", "배치ap", "스케줄러서버"],
  },
  {
    term: "관리형 서비스",
    fullName: "관리형 서비스(Managed Service)",
    category: "클라우드 / 서비스 형태",
    definition:
      "관리형 서비스는 데이터베이스·캐시·큐 같은 소프트웨어의 설치·패치·백업·장애 복구를 클라우드 사업자가 대신 해 주는 서비스 형태입니다.",
    why: "운영 인력과 시간을 줄이고 장애 복구를 사업자가 검증한 방식에 맡깁니다.",
    compare: "관리형 서비스는 사업자가 운영하고, 가상 서버에 직접 설치하면 사용자가 운영합니다.",
    aliases: ["managedservice", "매니지드서비스", "완전관리형", "fullymanaged"],
  },
  {
    term: "관계형 DB",
    fullName: "관계형 데이터베이스(Relational Database, RDBMS)",
    category: "데이터 / 데이터베이스",
    definition:
      "관계형 DB는 데이터를 행과 열로 된 표에 저장하고 표들을 서로 연결해 SQL로 조회하는 데이터베이스입니다.",
    why: "주문·결제·회원처럼 정확해야 하고 서로 얽힌 데이터를 어긋남 없이 저장합니다.",
    compare: "관계형 DB는 정해진 표 구조와 트랜잭션을 지키고, NoSQL DB는 구조가 자유롭고 서버를 늘려 확장하기 쉽습니다.",
    aliases: ["rdb", "rdbms", "relationaldatabase", "관계형데이터베이스", "sqldb", "알디비"],
  },
  {
    term: "NoSQL DB",
    fullName: "NoSQL(Not Only SQL) 데이터베이스",
    category: "데이터 / 데이터베이스",
    definition:
      "NoSQL DB는 표 구조 대신 키-값·문서·와이드 컬럼·그래프 같은 형태로 데이터를 저장하는 데이터베이스를 통틀어 부르는 말입니다.",
    why: "구조가 자주 바뀌거나 양이 아주 많은 데이터를 여러 서버에 나누어 빠르게 저장합니다.",
    compare: "NoSQL DB는 확장과 속도에 강하고, 관계형 DB는 여러 표를 묶는 조회와 엄격한 트랜잭션에 강합니다.",
    aliases: ["nosql", "노에스큐엘", "비관계형db", "문서db", "키값저장소"],
  },
  {
    term: "검색 엔진",
    fullName: "검색 엔진(Search Engine)",
    category: "데이터 / 검색",
    definition:
      "검색 엔진은 글과 문서를 단어 단위로 미리 색인해 두고 검색어에 맞는 결과를 관련도 순으로 빠르게 찾아 주는 시스템입니다.",
    why: "데이터베이스로는 느리거나 어려운 본문 검색, 오타 보정, 자동 완성을 처리합니다.",
    compare: "검색 엔진은 찾기 전용 사본이고, 원본 데이터는 데이터베이스에 둡니다.",
    aliases: ["searchengine", "전문검색", "fulltextsearch", "색인"],
  },
  {
    term: "큐",
    fullName: "메시지 큐(Message Queue)",
    category: "미들웨어 / 메시징",
    definition:
      "큐(메시지 큐)는 보내는 시스템이 맡긴 메시지를 받는 시스템이 꺼내 갈 때까지 순서대로 쌓아 두는 중간 저장소입니다.",
    why: "받는 쪽이 느리거나 잠시 멈춰도 요청을 잃지 않고 나중에 처리하게 합니다.",
    compare: "큐의 메시지는 한 번 꺼내 처리하면 사라지고, 스트림의 기록은 남아서 여러 곳이 다시 읽을 수 있습니다.",
    aliases: ["queue", "messagequeue", "mq", "메시지큐", "메시지브로커"],
  },
  {
    term: "스트림",
    fullName: "이벤트 스트림(Event Stream)",
    category: "미들웨어 / 메시징",
    definition:
      "스트림은 계속 발생하는 사건(이벤트) 기록을 시간 순서대로 쌓아 두고 여러 시스템이 각자 읽어 가게 하는 저장·전달 방식입니다.",
    why: "같은 데이터를 여러 시스템이 실시간으로 받아 각자 다른 용도로 처리하게 합니다.",
    compare: "스트림은 기록을 일정 기간 남겨 다시 읽을 수 있고, 큐는 꺼내 가면 없어집니다.",
    aliases: ["stream", "eventstream", "스트리밍", "이벤트스트림", "로그스트림"],
  },
  {
    term: "외부 API",
    fullName: "외부 API(External API, 외부 연동 서비스)",
    category: "외부 연동",
    definition:
      "외부 API는 우리 시스템이 인터넷이나 전용선으로 호출해 기능이나 데이터를 받아 오는 다른 회사·기관의 서비스입니다.",
    why: "지도·문자 발송·본인 확인처럼 직접 만들기 어려운 기능을 가져다 씁니다.",
    compare: "외부 API는 우리가 운영하지 않아 장애와 응답 지연을 우리가 고칠 수 없으므로, 호출 실패에 대비한 처리를 따로 둡니다.",
    aliases: ["externalapi", "3rdpartyapi", "서드파티api", "오픈api", "외부연동"],
  },
  {
    term: "외부 인증",
    fullName: "외부 인증 서비스(External Identity Provider, IdP)",
    category: "외부 연동 / 인증",
    definition:
      "외부 인증은 로그인한 사람이 누구인지 확인하는 일을 우리 시스템이 아니라 다른 회사·기관의 인증 서비스에 맡기는 것입니다.",
    why: "비밀번호를 직접 보관하지 않고 소셜 로그인·본인 확인·사내 통합 계정을 그대로 씁니다.",
    compare: "외부 인증은 \"누구인지 확인해 주는 곳\"이고, OAuth는 그 확인 결과를 주고받는 규약입니다.",
    aliases: ["idp", "identityprovider", "본인인증", "간편인증", "인증서비스"],
  },
  {
    term: "가상 머신(VM)",
    fullName: "가상 머신(Virtual Machine)",
    category: "가상화",
    definition:
      "가상 머신(VM)은 물리 서버 한 대의 자원을 소프트웨어로 나누어 만든, 운영체제를 따로 갖는 가상의 서버입니다.",
    why: "서버 한 대에 여러 업무를 서로 섞이지 않게 올려 장비를 아끼고, 서버를 몇 분 만에 새로 만듭니다.",
    compare: "가상 머신은 운영체제까지 통째로 갖고, 컨테이너는 운영체제를 함께 쓰고 프로그램만 따로 담아 더 가볍습니다.",
    aliases: ["vm", "virtualmachine", "가상서버", "가상머신", "게스트os", "인스턴스"],
  },
  {
    term: "하이퍼바이저",
    fullName: "하이퍼바이저(Hypervisor)",
    category: "가상화",
    definition:
      "하이퍼바이저는 물리 서버의 CPU·메모리·디스크를 나누어 가상 머신 여러 개를 만들고 실행하는 소프트웨어입니다.",
    why: "가상 머신들이 한 서버의 자원을 서로 방해하지 않고 나누어 쓰게 합니다.",
    compare: "하이퍼바이저는 가상 머신을 띄우는 바탕이고, 가상 머신은 그 위에서 도는 가상의 서버입니다.",
    aliases: ["hypervisor", "가상화소프트웨어", "vmm"],
  },

  // ── 개념 — 환경 · 배포 · 운영 ──
  {
    term: "APM",
    fullName: "애플리케이션 성능 모니터링(Application Performance Monitoring)",
    category: "모니터링",
    definition:
      "APM(애플리케이션 성능 모니터링)은 애플리케이션의 응답 시간·처리량·오류와 느린 지점을 실시간으로 추적해 보여 주는 도구나 활동입니다.",
    why: "서비스가 느려졌을 때 어느 화면·어느 SQL·어느 서버가 원인인지 빨리 찾습니다.",
    compare: "APM은 프로그램 안쪽의 처리 흐름을 보고, 인프라 모니터링은 서버의 CPU·메모리·디스크 상태를 봅니다.",
    aliases: ["applicationperformancemonitoring", "applicationperformancemanagement", "에이피엠", "성능모니터링"],
  },
  {
    term: "서비스 메시",
    fullName: "서비스 메시(Service Mesh)",
    category: "쿠버네티스 / 네트워킹",
    definition:
      "서비스 메시는 여러 서비스 사이의 통신을 서비스마다 붙인 프록시가 대신 처리하게 해 암호화·경로 제어·관측을 한곳에서 관리하는 인프라 계층입니다.",
    why: "서비스마다 통신 관련 코드를 넣지 않고도 보안과 장애 대응 규칙을 똑같이 적용합니다.",
    compare: "서비스 메시는 내부 서비스끼리의 통신을 다루고, API 게이트웨이는 외부에서 들어오는 요청을 다룹니다.",
    aliases: ["servicemesh", "사이드카", "sidecar"],
  },
  {
    term: "컨테이너 레지스트리",
    fullName: "컨테이너 이미지 레지스트리(Container Registry)",
    category: "컨테이너",
    definition:
      "컨테이너 레지스트리는 빌드한 컨테이너 이미지를 버전별로 저장해 두고 서버나 쿠버네티스가 내려받아 실행하게 하는 저장소입니다.",
    why: "배포할 이미지를 한곳에 모아 두고 접근 권한을 관리합니다.",
    compare: "컨테이너 레지스트리는 실행할 이미지를 보관하고, 형상관리 저장소(Git)는 소스 코드를 보관합니다.",
    aliases: ["containerregistry", "imageregistry", "이미지저장소", "레지스트리", "ecr", "dockerhub"],
  },

  // ── 개념 — 미들웨어 · 연계 · 금융 SI ──
  {
    term: "TP 모니터",
    fullName: "트랜잭션 처리 모니터(Transaction Processing Monitor)",
    category: "미들웨어",
    definition:
      "TP 모니터는 많은 사용자의 거래 요청을 받아 업무 프로그램에 나누어 주고 거래가 모두 성공하거나 모두 취소되도록 관리하는 미들웨어입니다.",
    why: "대량의 거래를 적은 자원으로 안정되게 처리하고 여러 DB에 걸친 거래의 일관성을 지킵니다.",
    compare: "TP 모니터는 주로 C·COBOL 업무 프로그램을 실행하고, WAS는 자바 웹 프로그램을 실행합니다.",
    aliases: ["tpmonitor", "tpm", "티피모니터", "트랜잭션미들웨어"],
  },
];
