import type { GlossarySeedEntry } from "./glossary-seed";

// 용어 사전 초안 3차분: 하드웨어, 이중화·재해복구·운영 개념, 제품, 연계 개념·프로토콜, 망·보안 용어와 클라우드 서비스 이름.
// 2차분에서 근거가 약해 미뤘던 후보를 출처 페이지를 열어 다시 대조했고, 1차 출처(공식 문서·표준·기관 문서)로 확인한 항목만 옮겼다.
// 항목별 출처와 고친 점은 docs/research/2026-11-11-network-glossary/batch3/ 의 JSON 에 있다.
// 처음엔 모두 "미검수"로 들어간다. 규칙은 glossary-seed.ts 머리말과 같다(사전식 한 문장 120자, 제품은 why·compare 비움, aliases 는 normalizeTerm 값).

export const GLOSSARY_SEED_BATCH3: GlossarySeedEntry[] = [
  // ── 하드웨어 · 물리 인프라 ──
  {
    term: "랙 서버",
    fullName: "랙 마운트 서버(Rack-mount Server)",
    category: "하드웨어 / 서버",
    definition:
      "랙 서버는 표준 폭 19인치의 장비 선반(랙)에 층층이 끼워 넣도록 납작하게 만든 서버입니다.",
    why: "좁은 전산실 공간에 서버를 많이 넣고 전원·케이블을 정리하기 쉽게 합니다.",
    compare: "랙 서버는 한 대가 전원과 팬을 따로 갖고, 블레이드 서버는 여러 대가 한 틀의 전원과 팬을 나눠 씁니다.",
    aliases: ["rackserver", "rackmount", "랙마운트서버", "1u서버", "2u서버"],
  },
  {
    term: "블레이드 서버",
    fullName: "블레이드 서버(Blade Server)",
    category: "하드웨어 / 서버",
    definition:
      "블레이드 서버는 얇은 카드 모양의 서버 여러 장을 전원과 냉각 장치를 함께 쓰는 틀(섀시)에 꽂아 쓰는 서버입니다.",
    why: "같은 공간에 더 많은 서버를 넣고 케이블 수를 줄입니다.",
    compare: "블레이드 서버는 섀시가 있어야 동작하고, 랙 서버는 한 대만으로 동작합니다.",
    aliases: ["bladeserver", "blade", "블레이드", "섀시"],
  },
  {
    term: "타워 서버",
    fullName: "타워형 서버(Tower Server)",
    category: "하드웨어 / 서버",
    definition:
      "타워 서버는 데스크톱 PC 본체처럼 세워 두는 모양의 서버입니다.",
    why: "랙이나 전산실이 없는 작은 사무실에서 서버를 한두 대 둘 때 씁니다.",
    compare: "타워 서버는 바닥에 세워 두고, 랙 서버는 랙에 끼워 넣습니다.",
    aliases: ["towerserver", "타워형서버"],
  },
  {
    term: "x86 서버",
    fullName: "x86(x86-64) 아키텍처 서버",
    category: "하드웨어 / 서버",
    definition:
      "x86 서버는 인텔(Intel)·AMD가 만드는 x86 계열 CPU를 쓰는 서버로, 가장 널리 쓰이는 서버 종류입니다.",
    why: "여러 제조사가 만들어 값이 싸고 부품과 소프트웨어 선택 폭이 넓습니다.",
    compare: "x86 서버는 제조사가 달라도 같은 운영체제를 쓰고, 유닉스 서버는 제조사마다 전용 CPU와 전용 운영체제를 씁니다.",
    aliases: ["x86", "x64", "ia서버", "범용서버", "엑스팔육서버"],
  },
  {
    term: "유닉스 서버",
    fullName: "유닉스(UNIX) 서버",
    category: "하드웨어 / 서버",
    definition:
      "유닉스 서버는 IBM Power·HPE Integrity·Oracle SPARC처럼 제조사 전용 CPU에 AIX·HP-UX·Solaris 같은 유닉스 운영체제를 올린 서버입니다.",
    why: "안정성이 중요한 핵심 업무(미션 크리티컬) 시스템에 오래 쓰여 왔습니다.",
    compare: "유닉스 서버를 x86 리눅스 서버로 바꾸는 작업을 U2L(Unix to Linux)이라고 부릅니다.",
    aliases: ["unixserver", "risc서버", "유닉스", "u2l"],
  },
  {
    term: "메인프레임",
    fullName: "메인프레임(Mainframe)",
    category: "하드웨어 / 서버",
    definition:
      "메인프레임은 아주 많은 거래를 끊김 없이 처리하도록 만든 대형 컴퓨터로, IBM Z 계열이 대표적입니다.",
    why: "대량의 거래를 높은 안정성으로 처리해야 하는 은행·보험의 핵심 업무에 쓰입니다.",
    compare: "메인프레임은 큰 장비 한 대에 업무를 모으고, 분산 서버(오픈 시스템)는 작은 서버 여러 대에 나눕니다.",
    aliases: ["mainframe", "ibmz", "호스트"],
  },
  {
    term: "CPU 소켓·코어",
    fullName: "CPU 소켓(Socket)·코어(Core)",
    category: "하드웨어 / 부품",
    definition:
      "소켓은 메인보드에서 CPU 칩 하나를 꽂는 자리이고, 코어는 CPU 칩 안에서 실제로 계산을 하는 처리 단위입니다.",
    why: "서버 처리 능력과 소프트웨어 라이선스 비용이 소켓 수·코어 수로 정해지는 경우가 많습니다.",
    compare: "\"2소켓 32코어\"는 CPU 칩 2개에 코어가 모두 합쳐 32개라는 뜻입니다.",
    aliases: ["cpu", "core", "socket", "코어", "소켓", "2소켓", "씨피유"],
  },
  {
    term: "vCPU",
    fullName: "가상 CPU(Virtual CPU)",
    category: "하드웨어 / 가상 자원",
    definition:
      "vCPU(가상 CPU)는 가상 머신이나 클라우드 서버에 나누어 준 CPU 단위로, 보통 물리 CPU의 스레드 하나에 해당합니다.",
    why: "클라우드 서버 사양과 요금을 정하는 기본 단위입니다.",
    compare: "물리 코어 하나는 하이퍼스레딩을 켜면 vCPU 2개로 계산되는 경우가 많아, vCPU 수와 물리 코어 수는 같지 않습니다.",
    aliases: ["virtualcpu", "가상cpu", "브이씨피유"],
  },
  {
    term: "메모리(RAM)",
    fullName: "주기억장치(Random Access Memory)",
    category: "하드웨어 / 부품",
    definition:
      "메모리(RAM)는 실행 중인 프로그램과 데이터를 잠시 올려 두는 기억장치로, 전원이 꺼지면 내용이 사라집니다.",
    why: "메모리가 넉넉해야 프로그램이 느린 디스크를 덜 쓰고 빠르게 동작합니다.",
    compare: "메모리는 빠르지만 꺼지면 지워지고, 디스크는 느리지만 꺼져도 남습니다.",
    aliases: ["ram", "memory", "메모리", "램", "주기억장치"],
  },
  {
    term: "GPU 서버",
    fullName: "GPU(Graphics Processing Unit) 서버",
    category: "하드웨어 / 서버",
    definition:
      "GPU 서버는 그래픽 처리 장치(GPU)를 여러 개 달아 많은 계산을 동시에 처리하는 서버로, AI 학습과 추론에 주로 쓰입니다.",
    why: "AI 계산처럼 한꺼번에 많이 하는 계산은 코어가 수백~수천 개인 GPU가 CPU보다 빠르게 처리합니다.",
    compare: "GPU 서버는 전력과 발열이 일반 서버보다 훨씬 커서 전산실의 전원·냉각 용량을 따로 확인해야 합니다.",
    aliases: ["gpuserver", "gpu", "지피유서버", "ai서버"],
  },
  {
    term: "어플라이언스",
    fullName: "어플라이언스(Appliance)",
    category: "하드웨어 / 일체형 장비",
    definition:
      "어플라이언스는 특정 용도의 소프트웨어를 전용 하드웨어에 미리 설치해 한 덩어리로 파는 일체형 장비입니다.",
    why: "소프트웨어를 설치하고 맞추는 시간을 줄여 장비를 켠 뒤 곧바로 쓸 수 있게 합니다.",
    compare: "어플라이언스는 장비째로 사고, 소프트웨어 제품은 준비한 서버에 직접 설치합니다.",
    aliases: ["appliance", "어플라이언스장비", "일체형장비"],
  },
  {
    term: "HCI",
    fullName: "하이퍼컨버지드 인프라(Hyper-Converged Infrastructure)",
    category: "하드웨어 / 통합 인프라",
    definition:
      "HCI(하이퍼컨버지드 인프라)는 컴퓨팅·저장소·네트워크를 x86 서버 위에서 소프트웨어로 합쳐 한 시스템으로 운영하는 인프라 구성 방식입니다.",
    why: "별도 스토리지 장비 없이 서버를 추가하는 것만으로 가상화 환경의 용량을 늘립니다.",
    compare: "HCI는 서버 안 디스크를 묶어 저장소로 쓰고, 전통 구성은 서버와 SAN 스토리지를 따로 둡니다.",
    aliases: ["hyperconverged", "하이퍼컨버지드"],
  },
  {
    term: "HDD",
    fullName: "하드 디스크 드라이브(Hard Disk Drive)",
    category: "하드웨어 / 디스크",
    definition:
      "HDD(하드 디스크 드라이브)는 회전하는 자기 원판에 데이터를 기록하는 저장 장치입니다.",
    why: "용량당 값이 싸서 백업·보관처럼 큰 용량이 필요한 곳에 씁니다.",
    compare: "HDD는 싸고 느리며, SSD는 비싸고 빠릅니다.",
    aliases: ["harddisk", "하드디스크", "하드"],
  },
  {
    term: "SSD",
    fullName: "솔리드 스테이트 드라이브(Solid State Drive)",
    category: "하드웨어 / 디스크",
    definition:
      "SSD(솔리드 스테이트 드라이브)는 움직이는 부품 없이 플래시 메모리에 데이터를 기록하는 저장 장치입니다.",
    why: "읽고 쓰는 속도가 HDD보다 훨씬 빨라 데이터베이스처럼 디스크를 많이 쓰는 곳의 성능을 높입니다.",
    compare: "SSD는 저장 장치의 종류이고, NVMe는 SSD를 연결하는 빠른 접속 규격입니다.",
    aliases: ["solidstatedrive", "플래시", "올플래시", "에스에스디"],
  },
  {
    term: "NVMe",
    fullName: "Non-Volatile Memory Express",
    category: "하드웨어 / 디스크 접속 규격",
    definition:
      "NVMe(Non-Volatile Memory Express)는 SSD 같은 플래시 저장 장치를 주로 PCIe로 연결해 빠르게 읽고 쓰도록 만든 접속 규격입니다.",
    why: "예전 디스크용 규격(SATA·SAS)의 속도 한계를 넘어 SSD 성능을 제대로 끌어냅니다.",
    compare: "같은 SSD라도 NVMe 방식은 SATA·SAS 방식보다 훨씬 많은 명령을 동시에 처리해 더 빠릅니다.",
    aliases: ["nvmessd", "엔브이엠이"],
  },
  {
    term: "RAID",
    fullName: "Redundant Array of Independent Disks",
    category: "하드웨어 / 디스크 보호",
    definition:
      "RAID(Redundant Array of Independent Disks)는 디스크 여러 개를 하나처럼 묶어 속도를 높이거나 디스크가 고장 나도 데이터를 지키는 기술입니다.",
    why: "디스크 한두 개가 고장 나도 서비스가 멈추거나 데이터가 사라지지 않게 합니다.",
    compare: "RAID는 디스크 고장에 대비하는 것이고 백업은 삭제·오류·재해에 대비하는 것이어서, RAID가 백업을 대신하지 못합니다.",
    aliases: ["레이드", "디스크어레이"],
  },
  {
    term: "DAS",
    fullName: "직접 연결 스토리지(Direct Attached Storage)",
    category: "하드웨어 / 스토리지",
    definition:
      "DAS(Direct Attached Storage)는 서버 한 대에 케이블로 직접 붙여 그 서버만 쓰는 저장 장치입니다.",
    why: "구성이 단순하고 값이 싸며 네트워크를 거치지 않아 빠릅니다.",
    compare: "DAS는 서버 한 대 전용이고, NAS·SAN은 여러 서버가 함께 씁니다.",
    aliases: ["directattachedstorage", "다스", "직접연결스토리지"],
  },
  {
    term: "NAS",
    fullName: "네트워크 연결 스토리지(Network Attached Storage)",
    category: "하드웨어 / 스토리지",
    definition:
      "NAS(Network Attached Storage)는 네트워크로 연결해 여러 사용자와 서버가 파일 단위로 함께 쓰는 전용 저장 장치입니다.",
    why: "여러 서버가 같은 파일(첨부 파일, 이미지 등)을 함께 읽고 써야 할 때 씁니다.",
    compare: "NAS는 파일 단위로 주고받고(NFS·SMB), SAN은 디스크 블록 단위로 주고받습니다.",
    aliases: ["networkattachedstorage", "나스", "공유스토리지"],
  },
  {
    term: "SAN",
    fullName: "스토리지 전용 네트워크(Storage Area Network)",
    category: "하드웨어 / 스토리지",
    definition:
      "SAN(Storage Area Network)은 서버와 저장 장치를 전용 고속 네트워크로 연결해 서버가 저장 장치를 자기 디스크처럼 쓰게 하는 구성입니다.",
    why: "데이터베이스처럼 빠르고 안정적인 디스크가 필요한 서버 여러 대에 큰 저장 장치를 나누어 줍니다.",
    compare: "SAN은 서버에 디스크로 보이고, NAS는 서버에 공유 폴더로 보입니다.",
    aliases: ["storageareanetwork", "산", "san스토리지", "san스위치"],
  },
  {
    term: "블록 스토리지",
    fullName: "블록 스토리지(Block Storage)",
    category: "하드웨어 / 스토리지 방식",
    definition:
      "블록 스토리지는 데이터를 블록 단위로 저장하고 서버에는 디스크 한 개(볼륨)처럼 붙여 쓰는 저장 방식입니다.",
    why: "운영체제와 데이터베이스처럼 디스크를 직접 다루는 프로그램에 빠른 저장소를 줍니다.",
    compare: "블록 스토리지는 서버에 디스크(볼륨)로 붙고, 파일 스토리지는 폴더와 파일 구조로 보입니다.",
    aliases: ["blockstorage", "볼륨", "volume", "디스크볼륨"],
  },
  {
    term: "파이버 채널",
    fullName: "파이버 채널(Fibre Channel, FC)",
    category: "하드웨어 / 스토리지 연결",
    definition:
      "파이버 채널(Fibre Channel)은 서버와 저장 장치를 연결하는 SAN 전용 고속 통신 규격으로, 주로 광케이블을 씁니다.",
    why: "일반 네트워크와 분리된 전용 통로로 저장 장치를 빠르고 안정적으로 연결합니다.",
    compare: "파이버 채널은 전용 장비(HBA·SAN 스위치)가 필요하고, iSCSI는 일반 이더넷 장비를 그대로 씁니다.",
    aliases: ["fc", "fibrechannel", "fiberchannel", "광채널"],
  },
  {
    term: "iSCSI",
    fullName: "Internet Small Computer System Interface",
    category: "하드웨어 / 스토리지 연결",
    definition:
      "iSCSI는 저장 장치 명령(SCSI)을 일반 IP 네트워크(TCP/IP)로 주고받아 서버와 저장 장치를 연결하는 통신 규격입니다.",
    why: "전용 SAN 장비 없이 기존 네트워크 장비로 SAN을 값싸게 구성합니다.",
    compare: "iSCSI는 일반 이더넷 망을 그대로 쓰고, 파이버 채널은 전용 장비로 꾸민 별도 망을 씁니다.",
    aliases: ["아이스카시", "ipsan"],
  },
  {
    term: "HBA",
    fullName: "호스트 버스 어댑터(Host Bus Adapter)",
    category: "하드웨어 / 부품",
    definition:
      "HBA(Host Bus Adapter)는 서버를 SAN 스토리지나 외부 저장 장치에 연결하기 위해 서버에 꽂는 확장 카드입니다.",
    why: "서버가 파이버 채널 같은 저장 장치 전용 통로에 붙을 수 있게 합니다.",
    compare: "HBA는 저장 장치용 연결 카드이고, NIC는 일반 네트워크용 연결 카드입니다.",
    aliases: ["hostbusadapter", "fchba", "에이치비에이"],
  },
  {
    term: "NIC",
    fullName: "네트워크 인터페이스 카드(Network Interface Card)",
    category: "하드웨어 / 부품",
    definition:
      "NIC(Network Interface Card)는 서버나 PC를 네트워크에 연결해 주는 내부 회로 기판 또는 카드입니다.",
    why: "서버가 다른 장비와 통신하려면 반드시 있어야 하는 부품입니다.",
    compare: "NIC는 일반 네트워크에 연결하고, HBA는 저장 장치 전용 통로에 연결합니다.",
    aliases: ["networkinterfacecard", "랜카드", "네트워크카드", "닉"],
  },
  {
    term: "본딩·티밍",
    fullName: "NIC 본딩(Bonding)·티밍(Teaming), 링크 묶음(Link Aggregation)",
    category: "하드웨어 / 네트워크 이중화",
    definition:
      "본딩·티밍은 서버의 네트워크 포트 여러 개를 하나처럼 묶어 고장에 대비하거나 통신 용량을 늘리는 구성입니다.",
    why: "랜 케이블이나 포트 하나가 고장 나도 서버 통신이 끊기지 않게 합니다.",
    compare: "리눅스에서는 주로 본딩, 윈도우에서는 티밍이라고 부르며 하는 일은 비슷합니다.",
    aliases: ["bonding", "teaming", "nicteaming", "lacp", "본딩", "티밍", "링크애그리게이션"],
  },
  {
    term: "테이프 라이브러리(PTL)",
    fullName: "물리 테이프 라이브러리(Physical Tape Library)",
    category: "하드웨어 / 백업 장비",
    definition:
      "테이프 라이브러리(PTL)는 자기 테이프 여러 개와 테이프 드라이브, 테이프를 옮기는 로봇 팔을 한 장비에 담아 백업을 자동으로 기록하는 장치입니다.",
    why: "많은 양의 데이터를 오래 보관하고, 네트워크와 떨어진 상태(에어 갭)로 지킬 수 있습니다.",
    compare: "PTL은 실제 테이프에 기록하고, VTL은 디스크에 기록하면서 테이프 장비처럼 보이게 합니다.",
    aliases: ["ptl", "tapelibrary", "lto", "테이프백업", "테이프장비"],
  },
  {
    term: "VTL",
    fullName: "가상 테이프 라이브러리(Virtual Tape Library)",
    category: "하드웨어 / 백업 장비",
    definition:
      "VTL(Virtual Tape Library)은 디스크 저장 장치를 백업 소프트웨어에는 테이프 라이브러리처럼 보이게 만든 백업 장비입니다.",
    why: "테이프용으로 짜 둔 백업 절차를 바꾸지 않고 디스크를 백업 저장소로 쓰게 합니다.",
    compare: "VTL은 실제로는 디스크에 저장하고, PTL은 실제 테이프에 저장합니다.",
    aliases: ["virtualtapelibrary", "가상테이프", "브이티엘"],
  },
  {
    term: "L2 스위치",
    fullName: "2계층(Layer 2) 스위치",
    category: "하드웨어 / 네트워크 장비",
    definition:
      "L2 스위치는 같은 네트워크 안의 서버와 장비를 랜 케이블로 연결하고 장비 고유 주소(MAC 주소)를 보고 데이터를 전달하는 네트워크 장비입니다.",
    why: "랙 안의 서버 여러 대를 네트워크에 연결하는 기본 장비입니다.",
    compare: "L2 스위치는 같은 네트워크 안에서만 전달하고, L3 스위치는 다른 네트워크로도 길을 찾아 전달합니다.",
    aliases: ["l2", "layer2switch", "스위치", "스위칭허브", "tor스위치", "엘투스위치"],
  },
  {
    term: "L3 스위치",
    fullName: "3계층(Layer 3) 스위치",
    category: "하드웨어 / 네트워크 장비",
    definition:
      "L3 스위치는 IP 주소를 보고 서로 다른 네트워크 사이로 데이터의 길을 찾아 전달하는(라우팅) 기능을 가진 스위치입니다.",
    why: "여러 네트워크 구역(서브넷·VLAN)을 서로 연결하는 전산실의 중심 장비로 씁니다.",
    compare: "L3 스위치는 IP 주소를 보고 길을 찾고, L4 스위치는 전송 계층(TCP·UDP) 정보를 보고 여러 서버로 나누어 보냅니다.",
    aliases: ["l3", "layer3switch", "백본스위치", "코어스위치", "엘쓰리스위치"],
  },
  {
    term: "랙",
    fullName: "서버 랙(Rack, 19인치 캐비닛)",
    category: "하드웨어 / 전산실 설비",
    definition:
      "랙은 서버·스위치·스토리지 같은 장비를 층층이 끼워 넣어 정리하는 폭 19인치 규격의 선반(캐비닛)입니다.",
    why: "장비를 좁은 바닥 면적에 높이 쌓고 전원과 케이블을 정리합니다.",
    compare: "랙 하나의 높이는 보통 42U이고, 장비 높이를 U 단위로 세어 몇 대가 들어갈지 계산합니다.",
    aliases: ["rack", "서버랙", "캐비닛", "19인치랙", "42u랙"],
  },
  {
    term: "U(랙 유닛)",
    fullName: "랙 유닛(Rack Unit)",
    category: "하드웨어 / 전산실 설비",
    definition:
      "U(랙 유닛)는 랙에 넣는 장비의 높이를 세는 단위로, 1U는 1.75인치(약 44.45mm)입니다.",
    why: "장비가 랙에서 차지하는 자리를 세어 랙과 상면이 얼마나 필요한지 계산합니다.",
    compare: "\"2U 서버\"는 높이가 2칸인 서버라는 뜻으로, 성능이 아니라 크기를 말합니다.",
    aliases: ["rackunit", "ru", "1u", "2u", "유", "랙유닛"],
  },
  {
    term: "상면",
    fullName: "상면(전산실 장비 설치 공간)",
    category: "하드웨어 / 전산실 설비",
    definition:
      "상면은 전산실(IDC)에서 서버·스위치 같은 장비를 설치하는 자리를 뜻하는 현업 용어로, 보통 랙이나 케이지 단위로 빌립니다.",
    why: "IDC 임대 비용과 장비 증설 가능 여부가 상면으로 정해집니다.",
    compare: "\"상면이 부족하다\"는 말은 디스크 용량이 아니라 장비를 놓을 자리가 없다는 뜻입니다.",
    aliases: ["상면공간", "랙상면", "floorspace", "상면임대"],
  },
  {
    term: "UPS",
    fullName: "무정전 전원 장치(Uninterruptible Power Supply)",
    category: "하드웨어 / 전산실 설비",
    definition:
      "UPS(무정전 전원 장치)는 정전이나 전압 이상이 생겼을 때 배터리로 장비에 전기를 잠시 계속 공급하는 장치입니다.",
    why: "정전 순간에 서버가 갑자기 꺼져 데이터가 깨지는 것을 막고 비상 발전기가 돌 때까지 시간을 법니다.",
    compare: "UPS는 짧은 시간만 버티고, 긴 정전은 비상 발전기처럼 오래가는 전원이 맡습니다.",
    aliases: ["무정전전원", "무정전전원공급장치", "유피에스"],
  },
  {
    term: "항온항습기",
    fullName: "항온항습기(전산실 공조 장치, CRAC)",
    category: "하드웨어 / 전산실 설비",
    definition:
      "항온항습기는 전산실의 온도와 습도를 일정하게 유지하는 냉방·공조 장치입니다.",
    why: "서버가 내는 열을 식히고 습도를 맞춰 장비 고장을 막습니다.",
    compare: "일반 냉방기와 달리 바깥 기온과 상관없이 1년 내내 쉬지 않고 돌며 장비 열을 식히는 데 맞춰 만들어졌습니다.",
    aliases: ["항온항습", "crac", "공조", "전산실냉방"],
  },
  {
    term: "KVM 스위치",
    fullName: "KVM(Keyboard, Video, Mouse) 스위치",
    category: "하드웨어 / 전산실 설비",
    definition:
      "KVM 스위치는 키보드·모니터·마우스 한 벌로 서버 여러 대를 골라 가며 조작하게 해 주는 전환 장치입니다.",
    why: "서버마다 모니터와 키보드를 달지 않고도 전산실에서 여러 서버를 직접 조작합니다.",
    compare: "KVM 스위치는 조작용 장치이고, 리눅스 가상화 기능인 KVM(Kernel-based Virtual Machine)과는 이름만 같습니다.",
    aliases: ["kvmswitch", "kvmoverip", "케이브이엠스위치"],
  },

  // ── 이중화 · 재해복구 · 운영 개념 ──
  {
    term: "이중화",
    fullName: "이중화(Redundancy)",
    category: "가용성",
    definition:
      "이중화는 서버·장비·회선을 같은 것으로 둘 이상 두어 하나가 고장 나도 나머지로 서비스를 이어 가게 하는 구성입니다.",
    why: "장비 한 대의 고장이 서비스 중단으로 이어지지 않게 합니다.",
    compare: "이중화는 고장에 대비해 여분을 두는 것이고, 백업은 데이터가 지워지거나 깨졌을 때 되돌리기 위한 사본입니다.",
    aliases: ["redundancy", "다중화", "이중화구성", "spof제거", "리던던시"],
  },
  {
    term: "Active-Active",
    fullName: "액티브-액티브(Active-Active) 구성",
    category: "가용성",
    definition:
      "Active-Active는 이중화한 장비 두 대 이상이 모두 동시에 요청을 처리하는 구성입니다.",
    why: "평소에는 처리 능력을 함께 쓰고, 한 대가 고장 나면 남은 장비가 이어서 처리합니다.",
    compare: "Active-Active는 모두 일하고, Active-Standby는 한 대만 일하고 나머지는 대기합니다.",
    aliases: ["aa", "액티브액티브"],
  },
  {
    term: "HA",
    fullName: "고가용성(High Availability)",
    category: "가용성",
    definition:
      "HA(고가용성)는 장애가 나도 서비스가 멈추는 시간을 아주 짧게 줄이도록 이중화와 페일오버를 갖춘 성질 또는 그런 구성입니다.",
    why: "장애로 서비스가 멈추는 시간을 줄여 업무 손실을 막습니다.",
    compare: "HA는 주로 장비·부품 고장에 대비하고, DR은 전산센터 전체가 못 쓰게 되는 재해에 대비합니다.",
    aliases: ["highavailability", "고가용성", "ha구성", "에이치에이"],
  },
  {
    term: "클러스터링",
    fullName: "클러스터링(Clustering)",
    category: "가용성 / 확장",
    definition:
      "클러스터링은 서버 여러 대를 묶어 바깥에서는 하나의 시스템처럼 보이고 동작하게 하는 구성입니다.",
    why: "한 대가 고장 나도 서비스가 이어지고, 여러 대가 일을 나누어 처리 능력을 높입니다.",
    compare: "로드밸런싱은 요청을 나누는 것까지이고, 클러스터링은 서버들이 서로 상태를 알고 함께 움직입니다.",
    aliases: ["clustering", "cluster", "클러스터", "클러스터구성"],
  },
  {
    term: "페일오버",
    fullName: "페일오버(Failover, 장애 조치)",
    category: "가용성",
    definition:
      "페일오버는 일하던 장비에 장애가 났을 때 대기하던 장비가 그 일을 자동 또는 수동으로 넘겨받는 것입니다.",
    why: "장애가 나도 사람이 복구할 때까지 기다리지 않고 서비스를 이어 갑니다.",
    compare: "페일오버는 장애 때 대기 쪽으로 넘어가는 것이고, 페일백은 복구 뒤 원래 쪽으로 되돌아오는 것입니다.",
    aliases: ["failover", "장애조치", "절체", "테이크오버", "takeover"],
  },
  {
    term: "페일백",
    fullName: "페일백(Failback, 원복)",
    category: "가용성",
    definition:
      "페일백은 페일오버로 넘어갔던 서비스를 원래 장비가 복구된 뒤 원래 장비로 되돌리는 것입니다.",
    why: "임시로 버티던 상태를 끝내고 원래의 이중화 구성으로 돌아갑니다.",
    compare: "페일오버는 급하게 일어나지만, 페일백은 보통 사용자가 적은 시간에 계획해서 합니다.",
    aliases: ["failback", "원복", "절체복귀"],
  },
  {
    term: "세션 클러스터링",
    fullName: "세션 클러스터링(Session Clustering)",
    category: "가용성 / WAS",
    definition:
      "세션 클러스터링은 WAS 여러 대가 로그인 상태 같은 세션 정보를 서로 복제하거나 한곳에 함께 저장해 공유하는 구성입니다.",
    why: "WAS 한 대가 죽어도 사용자가 다시 로그인하지 않고 다른 WAS에서 이어서 쓰게 합니다.",
    compare: "세션 클러스터링은 세션을 여러 대가 공유하고, 스티키 세션은 사용자를 한 대에만 계속 보내 공유 없이 해결합니다.",
    aliases: ["sessionclustering", "세션공유", "세션복제", "sessionreplication"],
  },
  {
    term: "스티키 세션",
    fullName: "스티키 세션(Sticky Session, 세션 고정)",
    category: "부하 분산",
    definition:
      "스티키 세션은 로드밸런서가 같은 사용자의 요청을 처음 연결된 서버 한 대로만 계속 보내는 설정입니다.",
    why: "세션을 서버끼리 공유하지 않아도 로그인 상태가 유지되게 합니다.",
    compare: "스티키 세션은 그 서버가 죽으면 세션을 잃고, 세션 클러스터링은 다른 서버가 이어받습니다.",
    aliases: ["stickysession", "sessionaffinity", "세션고정", "세션어피니티", "퍼시스턴스", "persistence"],
  },
  {
    term: "헬스 체크",
    fullName: "헬스 체크(Health Check, 상태 확인)",
    category: "부하 분산 / 가용성",
    definition:
      "헬스 체크는 로드밸런서나 관리 시스템이 서버에 주기적으로 신호를 보내 정상인지 확인하는 동작입니다.",
    why: "고장 난 서버를 자동으로 찾아 요청을 보내지 않게 합니다.",
    compare: "헬스 체크는 \"살아 있나\"만 짧게 묻고, 모니터링은 성능과 상태를 자세히 모아 기록합니다.",
    aliases: ["healthcheck", "상태검사", "liveness", "readiness", "l4체크"],
  },
  {
    term: "라운드 로빈",
    fullName: "라운드 로빈(Round Robin, RR)",
    category: "부하 분산 방식",
    definition:
      "라운드 로빈은 들어온 요청을 서버들에 차례대로 한 번씩 돌아가며 나누어 주는 부하 분산 방식입니다.",
    why: "가장 단순하고, 서버 성능이 비슷할 때 요청을 고르게 나눕니다.",
    compare: "라운드 로빈은 서버가 지금 얼마나 바쁜지 보지 않고, 최소 연결 방식은 덜 바쁜 서버를 골라 보냅니다.",
    aliases: ["roundrobin", "rr", "순차분배"],
  },
  {
    term: "최소 연결",
    fullName: "최소 연결(Least Connections, LC)",
    category: "부하 분산 방식",
    definition:
      "최소 연결은 지금 처리 중인 연결 수가 가장 적은 서버로 새 요청을 보내는 부하 분산 방식입니다.",
    why: "요청마다 처리 시간이 크게 다를 때 특정 서버에만 일이 쌓이는 것을 막습니다.",
    compare: "최소 연결은 서버의 현재 연결 수를 보고, 라운드 로빈은 순서만 봅니다.",
    aliases: ["leastconnection", "leastconnections", "lc", "리스트커넥션", "최소접속"],
  },
  {
    term: "해시 분산",
    fullName: "해시(Hash) 기반 부하 분산",
    category: "부하 분산 방식",
    definition:
      "해시 분산은 접속한 쪽의 IP 주소 같은 값을 계산한 결과로 서버를 정해, 같은 값이면 늘 같은 서버로 보내는 부하 분산 방식입니다.",
    why: "같은 사용자를 계속 같은 서버로 보내 세션이나 캐시를 그대로 쓰게 합니다.",
    compare: "해시 분산은 값으로 서버가 정해져 고르게 나뉘지 않을 수 있고, 라운드 로빈은 고르게 나누지만 같은 서버로 간다는 보장이 없습니다.",
    aliases: ["hash", "sourceiphash", "iphash", "해시", "소스ip해시"],
  },
  {
    term: "가용성",
    fullName: "가용성(Availability)",
    category: "가용성 / 지표",
    definition:
      "가용성은 전체 시간 가운데 서비스를 정상으로 쓸 수 있었던 시간의 비율을 퍼센트로 나타낸 값입니다.",
    why: "서비스가 얼마나 멈추지 않아야 하는지를 숫자로 정해 설계와 계약의 기준으로 삼습니다.",
    compare: "99.9%는 1년에 약 8시간 45분, 99.99%는 약 52분까지 멈춰도 된다는 뜻입니다.",
    aliases: ["availability", "가동률", "업타임", "uptime", "쓰리나인", "포나인", "999%"],
  },
  {
    term: "SLA",
    fullName: "서비스 수준 협약(Service Level Agreement)",
    category: "운영 / 계약",
    definition:
      "SLA(서비스 수준 협약)는 서비스를 제공하는 쪽과 쓰는 쪽이 가용성·응답 시간·장애 복구 시간 같은 수준을 숫자로 정해 약속한 문서입니다.",
    why: "서비스 품질을 측정할 기준과 제공자·이용자 양쪽의 책임을 미리 정합니다.",
    compare: "SLA는 계약상의 약속이고, 가용성은 그 안에 들어가는 지표 가운데 하나입니다.",
    aliases: ["servicelevelagreement", "서비스수준협약", "서비스수준계약", "에스엘에이"],
  },
  {
    term: "DR",
    fullName: "재해복구(Disaster Recovery)",
    category: "재해복구",
    definition:
      "DR(재해복구)은 화재·지진·정전 같은 재해로 주 전산센터를 못 쓰게 됐을 때 떨어진 곳의 다른 센터에서 서비스를 다시 살리는 체계입니다.",
    why: "전산센터 한 곳 전체가 멈춰도 업무를 이어 가게 합니다.",
    compare: "DR은 센터 전체의 재해에 대비하고, HA는 센터 안의 장비 고장에 대비합니다.",
    aliases: ["disasterrecovery", "재해복구", "dr센터", "drc", "재해복구센터", "디알"],
  },
  {
    term: "미러 사이트",
    fullName: "미러 사이트(Mirrored Site)",
    category: "재해복구 / DR 센터 유형",
    definition:
      "미러 사이트는 주 센터와 기술적으로 똑같이 갖추고 데이터를 실시간으로 자동 복제해 두는 완전 이중화 재해복구 센터입니다.",
    why: "재해가 나도 서비스가 거의 끊기지 않게 합니다.",
    compare: "미러 사이트는 데이터를 실시간으로 똑같이 맞춰 두어 가장 비싸고, 핫 사이트는 장비를 갖추고 대기하다 재해 때 넘겨받습니다.",
    aliases: ["mirrorsite", "mirroredsite", "미러센터", "미러링센터"],
  },
  {
    term: "핫 사이트",
    fullName: "핫 사이트(Hot Site)",
    category: "재해복구 / DR 센터 유형",
    definition:
      "핫 사이트는 주 센터 수준의 장비와 소프트웨어를 갖추고 가동 상태로 준비해 두어 재해 때 빠르게 넘겨받는 재해복구 센터입니다.",
    why: "재해 뒤 빠르게 서비스를 다시 열어야 하는 중요한 업무에 씁니다.",
    compare: "핫 사이트는 장비를 모두 갖추고 가동 상태로 대기하고, 웜 사이트는 장비를 일부만 갖춥니다.",
    aliases: ["hotsite", "핫센터"],
  },
  {
    term: "웜 사이트",
    fullName: "웜 사이트(Warm Site)",
    category: "재해복구 / DR 센터 유형",
    definition:
      "웜 사이트는 장비와 통신 설비를 일부만 갖춰 두고 재해 때 부족한 것을 채워 서비스를 살리는 재해복구 센터입니다.",
    why: "핫 사이트보다 비용을 줄이면서 중요한 업무부터 복구할 수 있게 합니다.",
    compare: "웜 사이트는 일부 장비가 준비돼 있고, 콜드 사이트는 장소와 전기·통신만 있습니다.",
    aliases: ["warmsite", "웜센터"],
  },
  {
    term: "콜드 사이트",
    fullName: "콜드 사이트(Cold Site)",
    category: "재해복구 / DR 센터 유형",
    definition:
      "콜드 사이트는 장소와 전원·냉방·통신 회선만 마련해 두고 재해가 난 뒤에 장비를 들여와 복구하는 재해복구 센터입니다.",
    why: "유지 비용이 가장 적게 들어, 오래 멈춰도 되는 업무에 씁니다.",
    compare: "콜드 사이트는 유지 비용이 가장 적지만 장비를 들여와 설치하는 시간이 길고, 미러 사이트는 가장 비싸지만 거의 끊기지 않습니다.",
    aliases: ["coldsite", "콜드센터"],
  },
  {
    term: "RTO",
    fullName: "목표 복구 시간(Recovery Time Objective)",
    category: "재해복구 / 지표",
    definition:
      "RTO(목표 복구 시간)는 장애나 재해가 난 뒤 서비스를 다시 쓸 수 있게 되기까지 허용하는 최대 시간입니다.",
    why: "업무가 얼마나 오래 멈춰도 되는지를 정해 이중화와 재해복구 수준(비용)을 결정합니다.",
    compare: "RTO는 \"얼마나 빨리 되살리나\"이고, RPO는 \"데이터를 어느 시점까지 되살리나\"입니다.",
    aliases: ["recoverytimeobjective", "목표복구시간", "복구목표시간", "알티오"],
  },
  {
    term: "RPO",
    fullName: "목표 복구 시점(Recovery Point Objective)",
    category: "재해복구 / 지표",
    definition:
      "RPO(목표 복구 시점)는 장애나 재해 때 데이터를 어느 시점까지 되살려야 하는지를 정한 목표로, 잃어도 되는 데이터 분량을 시간으로 나타낸 값입니다.",
    why: "백업과 복제를 얼마나 자주 해야 하는지를 정합니다.",
    compare: "RPO가 0이면 데이터를 하나도 잃지 않아야 한다는 뜻이고, RPO가 1시간이면 최근 1시간치는 잃을 수 있다는 뜻입니다.",
    aliases: ["recoverypointobjective", "목표복구시점", "복구목표시점", "알피오"],
  },
  {
    term: "풀 백업",
    fullName: "전체 백업(Full Backup)",
    category: "백업",
    definition:
      "풀 백업은 대상 데이터 전체를 통째로 복사해 두는 백업 방식입니다.",
    why: "백업본 하나만 있으면 복구할 수 있어 복구가 가장 간단하고 빠릅니다.",
    compare: "풀 백업은 시간과 저장 공간이 가장 많이 들어, 예를 들어 주말에 풀 백업을 하고 평일에는 증분·차등 백업을 합니다.",
    aliases: ["fullbackup", "전체백업"],
  },
  {
    term: "증분 백업",
    fullName: "증분 백업(Incremental Backup)",
    category: "백업",
    definition:
      "증분 백업은 종류와 상관없이 바로 앞의 백업 뒤로 새로 생기거나 바뀐 데이터만 복사하는 백업 방식입니다.",
    why: "백업 시간과 저장 공간을 적게 씁니다.",
    compare: "증분 백업은 복구할 때 풀 백업과 그 뒤의 증분 백업을 모두 차례로 써야 하고, 차등 백업은 풀 백업과 마지막 차등 백업 두 개만 있으면 됩니다.",
    aliases: ["incrementalbackup", "인크리멘탈"],
  },
  {
    term: "차등 백업",
    fullName: "차등 백업(Differential Backup)",
    category: "백업",
    definition:
      "차등 백업은 마지막 풀 백업 뒤로 바뀐 데이터를 매번 모두 복사하는 백업 방식입니다.",
    why: "증분 백업보다 복구가 간단하고 풀 백업보다 빠르게 끝납니다.",
    compare: "차등 백업은 날이 갈수록 백업 크기가 커지고, 증분 백업은 매번 작습니다.",
    aliases: ["differentialbackup", "디퍼렌셜"],
  },
  {
    term: "스냅샷",
    fullName: "스냅샷(Snapshot)",
    category: "백업",
    definition:
      "스냅샷은 디스크나 데이터의 어느 한 순간 상태를 기록해 두어 나중에 그 시점으로 되돌릴 수 있게 하는 기능입니다.",
    why: "작업 전에 몇 초 만에 찍어 두고 문제가 생기면 빠르게 되돌립니다.",
    compare: "스냅샷은 원본과의 차이만 기록해 원본에 기대는 경우가 많고, 백업은 원본과 따로 보관하는 사본입니다.",
    aliases: ["snapshot", "스냅숏", "시점복사"],
  },
  {
    term: "아카이빙",
    fullName: "아카이빙(Archiving, 장기 보관)",
    category: "백업 / 보관",
    definition:
      "아카이빙은 더 이상 자주 쓰지 않는 데이터를 주로 기록 보존과 규정 준수를 위해 운영 저장소에서 옮겨 오래 보관하는 것입니다.",
    why: "운영 데이터베이스를 가볍게 유지하면서 보존 의무를 지킵니다.",
    compare: "백업은 되살리기 위한 사본이고, 아카이빙은 나중에 찾아보려고 원본을 옮겨 보관하는 것입니다.",
    aliases: ["archiving", "archive", "아카이브", "장기보관", "데이터보관"],
  },
  {
    term: "샤딩",
    fullName: "샤딩(Sharding, 수평 분할)",
    category: "데이터 / 확장",
    definition:
      "샤딩은 같은 구조의 데이터를 정한 기준(예: 회원 번호)에 따라 여러 데이터베이스 서버에 나누어 저장하는 방식입니다.",
    why: "데이터베이스 한 대로 감당할 수 없는 데이터양과 쓰기 요청을 여러 대로 나눕니다.",
    compare: "샤딩은 여러 서버로 나누고, 파티셔닝은 한 서버 안에서 표를 나눕니다.",
    aliases: ["sharding", "shard", "샤드", "수평분할", "db분산"],
  },
  {
    term: "파티셔닝",
    fullName: "파티셔닝(Partitioning)",
    category: "데이터 / 성능",
    definition:
      "파티셔닝은 큰 표 하나를 날짜나 범위 같은 기준으로 여러 조각(파티션)으로 나누어 한 데이터베이스 안에 저장하는 방식입니다.",
    why: "필요한 조각만 읽어 조회가 빨라지고 오래된 데이터를 조각째 지우거나 옮기기 쉽습니다.",
    compare: "파티셔닝은 프로그램에서는 여전히 표 하나로 보이고, 샤딩은 어느 서버로 갈지 따로 정해 줘야 합니다.",
    aliases: ["partitioning", "partition", "파티션", "테이블파티셔닝"],
  },
  {
    term: "커넥션 풀",
    fullName: "커넥션 풀(Connection Pool)",
    category: "데이터 / 성능",
    definition:
      "커넥션 풀은 애플리케이션이 데이터베이스 연결을 미리 여러 개 만들어 두고 필요할 때 빌려 쓰고 돌려주는 방식입니다.",
    why: "요청마다 연결을 새로 맺는 시간을 없애고 데이터베이스에 붙는 연결 수를 제한합니다.",
    compare: "커넥션 풀은 WAS 안에 있는 기능이고, DB 중계(Proxy)는 WAS와 DB 사이에 따로 두는 서버입니다.",
    aliases: ["connectionpool", "dbcp", "hikaricp", "연결풀"],
  },
  {
    term: "읽기 전용 복제본",
    fullName: "읽기 전용 복제본(Read Replica)",
    category: "데이터 / 확장",
    definition:
      "읽기 전용 복제본은 원본 데이터베이스의 변경을 계속 받아 같은 데이터를 갖고 조회 요청만 처리하는 복제 데이터베이스입니다.",
    why: "조회 요청을 복제본으로 돌려 원본 데이터베이스의 부담을 줄입니다.",
    compare: "읽기 전용 복제본은 평소에도 조회를 처리하고, Standby는 장애 때 넘겨받으려고 대기합니다.",
    aliases: ["리드레플리카", "슬레이브", "replica", "조회용db"],
  },
  {
    term: "스케일 업",
    fullName: "스케일 업(Scale-up, 수직 확장)",
    category: "확장",
    definition:
      "스케일 업은 서버 한 대의 CPU·메모리·디스크를 더 큰 것으로 바꿔 처리 능력을 높이는 방식입니다.",
    why: "구조를 바꾸지 않고 서버 한 대의 성능을 올립니다.",
    compare: "스케일 업은 한 대를 키우는 것이라 하드웨어 한계가 있고, 스케일 아웃은 대수를 늘려 그 한계를 넘습니다.",
    aliases: ["scaleup", "수직확장"],
  },
  {
    term: "스케일 아웃",
    fullName: "스케일 아웃(Scale-out, 수평 확장)",
    category: "확장",
    definition:
      "스케일 아웃은 같은 서버의 대수를 늘려 요청을 나누어 처리함으로써 처리 능력을 높이는 방식입니다.",
    why: "서버를 더하는 만큼 처리량이 늘고 한 대가 고장 나도 나머지가 처리합니다.",
    compare: "스케일 아웃은 요청이나 데이터를 여러 대에 나누는 장치가 필요하고, 스케일 업은 한 대만 키우면 되지만 하드웨어 한계가 있습니다.",
    aliases: ["scaleout", "수평확장"],
  },
  {
    term: "tpmC",
    fullName: "transactions per minute, TPC-C",
    category: "설계 / 성능 지표",
    definition:
      "tpmC는 TPC-C라는 표준 성능 시험에서 1분 동안 처리한 신규 주문 거래 수를 나타내는 온라인 거래 처리 성능 단위입니다.",
    why: "제조사가 다른 서버의 처리 능력을 같은 잣대로 비교하고 필요한 서버 규모를 숫자로 계산합니다.",
    compare: "TPC-C는 다섯 가지 거래를 섞어 돌리는 시험의 이름이고, tpmC는 그 가운데 신규 주문 거래만 센 결과 값입니다.",
    aliases: ["tpcc", "티피엠씨"],
  },
  {
    term: "온프레미스",
    fullName: "온프레미스(On-premises)",
    category: "인프라 형태",
    definition:
      "온프레미스는 회사가 서버와 장비를 직접 갖추고 자기 전산실이나 데이터센터에 두고 운영하는 방식입니다.",
    why: "데이터와 장비를 직접 통제해야 하거나 규제상 외부에 둘 수 없을 때 씁니다.",
    compare: "온프레미스는 장비를 사서 직접 운영하고, 클라우드는 사업자의 자원을 빌려 쓴 만큼 냅니다.",
    aliases: ["onpremises", "onpremise", "onprem", "온프렘", "자체구축"],
  },
  {
    term: "IDC",
    fullName: "인터넷 데이터 센터(Internet Data Center)",
    category: "인프라 형태 / 시설",
    definition:
      "IDC(인터넷 데이터 센터)는 서버와 네트워크 장비를 모아 두고 전원·냉방·회선·보안을 갖춰 운영하는 전용 건물입니다.",
    why: "회사가 직접 갖추기 어려운 안정적인 전원·냉방·통신 회선을 빌려 씁니다.",
    compare: "IDC는 장비를 두는 건물이고, 클라우드는 그런 건물 안의 자원을 서비스로 빌려주는 것입니다.",
    aliases: ["internetdatacenter", "데이터센터", "전산센터", "dc", "아이디씨"],
  },
  {
    term: "코로케이션",
    fullName: "코로케이션(Colocation)",
    category: "인프라 형태",
    definition:
      "코로케이션은 회사가 가진 서버를 IDC에 가져다 두고 공간(상면)·전원·회선만 빌려 쓰는 방식입니다.",
    why: "전산실을 직접 짓지 않고도 내 장비를 안정적인 시설에서 운영합니다.",
    compare: "코로케이션은 장비가 내 것이고, 서버 호스팅은 장비까지 빌립니다.",
    aliases: ["colocation", "colo", "코로", "하우징"],
  },
  {
    term: "호스팅",
    fullName: "호스팅(Hosting)",
    category: "인프라 형태",
    definition:
      "호스팅은 사업자가 가진 서버나 그 일부를 빌려 웹 사이트나 시스템을 올려 운영하는 방식입니다.",
    why: "장비를 사지 않고 달마다 요금을 내며 서버를 씁니다.",
    compare: "호스팅은 보통 정해진 사양을 월 단위로 빌리고, 클라우드는 필요할 때 바로 늘리고 줄이며 쓴 만큼 냅니다.",
    aliases: ["hosting", "서버호스팅", "웹호스팅", "임대서버"],
  },
  {
    term: "하이브리드 클라우드",
    fullName: "하이브리드 클라우드(Hybrid Cloud)",
    category: "클라우드 형태",
    definition:
      "하이브리드 클라우드는 온프레미스(또는 사설 클라우드)와 퍼블릭 클라우드를 연결해 함께 쓰는 구성입니다.",
    why: "중요한 데이터는 내부에 두고, 늘었다 줄었다 하는 업무는 클라우드에서 처리합니다.",
    compare: "하이브리드 클라우드는 내부와 클라우드를 섞은 것이고, 멀티 클라우드는 클라우드 사업자를 둘 이상 쓰는 것입니다.",
    aliases: ["hybridcloud", "하이브리드", "하이브리드구성"],
  },
  {
    term: "멀티 클라우드",
    fullName: "멀티 클라우드(Multi-cloud)",
    category: "클라우드 형태",
    definition:
      "멀티 클라우드는 둘 이상의 클라우드 사업자가 제공하는 클라우드 서비스를 함께 쓰는 구성입니다.",
    why: "한 사업자의 장애나 가격·정책 변화에 묶이지 않게 합니다.",
    compare: "멀티 클라우드는 사업자가 여럿이라는 뜻이고, 온프레미스와 섞는지는 따지지 않습니다.",
    aliases: ["multicloud", "복수클라우드"],
  },
  {
    term: "IaaS",
    fullName: "서비스형 인프라(Infrastructure as a Service)",
    category: "클라우드 서비스 모델",
    definition:
      "IaaS(서비스형 인프라)는 가상 서버·저장소·네트워크 같은 인프라 자원을 빌려 쓰고 운영체제부터는 사용자가 직접 관리하는 클라우드 서비스 모델입니다.",
    why: "장비를 사지 않고도 온프레미스와 같은 자유도로 서버를 구성합니다.",
    compare: "IaaS는 서버까지 빌리고, PaaS는 프로그램 실행 환경까지, SaaS는 완성된 프로그램까지 빌립니다.",
    aliases: ["infrastructureasaservice", "이아스", "아이아스", "서비스형인프라"],
  },
  {
    term: "PaaS",
    fullName: "서비스형 플랫폼(Platform as a Service)",
    category: "클라우드 서비스 모델",
    definition:
      "PaaS(서비스형 플랫폼)는 운영체제·미들웨어·실행 환경을 사업자가 관리하고 사용자는 자기 프로그램만 올려 실행하는 클라우드 서비스 모델입니다.",
    why: "서버와 미들웨어 운영을 맡기고 프로그램 개발에 집중합니다.",
    compare: "PaaS는 내 프로그램을 올리는 곳이고, SaaS는 남이 만든 프로그램을 그대로 쓰는 것입니다.",
    aliases: ["platformasaservice", "파스", "서비스형플랫폼"],
  },
  {
    term: "SaaS",
    fullName: "서비스형 소프트웨어(Software as a Service)",
    category: "클라우드 서비스 모델",
    definition:
      "SaaS(서비스형 소프트웨어)는 사업자가 운영하는 완성된 소프트웨어를 설치 없이 인터넷으로 접속해 쓰는 클라우드 서비스 모델입니다.",
    why: "설치·업그레이드·운영 없이 필요한 기능을 바로 씁니다.",
    compare: "SaaS는 구독해서 쓰고, 설치형(구축형) 소프트웨어는 사서 내 서버에 설치합니다.",
    aliases: ["softwareasaservice", "사스", "싸스", "서비스형소프트웨어", "구독형"],
  },
  {
    term: "리전",
    fullName: "리전(Region)",
    category: "클라우드 / 위치",
    definition:
      "리전은 클라우드 사업자가 데이터센터들을 묶어 운영하는 지리적 구역(예: 서울 리전)입니다.",
    why: "사용자와 가까운 곳에 두어 응답을 빠르게 하고, 데이터를 어느 나라에 둘지 정합니다.",
    compare: "리전은 서로 격리된 여러 가용 영역(AZ)으로 이루어지고, 리전끼리도 격리돼 있어 다른 리전을 재해복구에 씁니다.",
    aliases: ["region", "서울리전", "리젼", "apnortheast"],
  },
  {
    term: "테넌트",
    fullName: "테넌트(Tenant)",
    category: "클라우드 / 사용 단위",
    definition:
      "테넌트는 여러 고객이 함께 쓰는 시스템에서 한 고객(조직·회사·그룹)에 속한 사용자들을 묶은 사용 단위입니다.",
    why: "같은 시스템을 여러 고객이 나눠 쓰면서도 서로의 데이터를 볼 수 없게 합니다.",
    compare: "멀티 테넌트는 여러 고객이 한 시스템을 나눠 쓰고, 싱글 테넌트는 고객마다 시스템을 따로 둡니다.",
    aliases: ["tenant", "멀티테넌트", "multitenant", "테넌시", "tenancy"],
  },
  {
    term: "개발계",
    fullName: "개발 환경(Development)",
    category: "환경 구분",
    definition:
      "개발계는 개발자가 프로그램을 만들고 바로 올려서 동작을 확인하는 환경입니다.",
    why: "운영 서비스에 영향을 주지 않고 자유롭게 만들고 고칩니다.",
    compare: "개발계는 자주 바뀌고 불안정해도 되고, 검증계는 운영과 비슷하게 맞춰 두고 확인용으로 씁니다.",
    aliases: ["development", "dev", "개발환경", "개발서버", "데브"],
  },
  {
    term: "검증계",
    fullName: "검증 환경(Test / QA)",
    category: "환경 구분",
    definition:
      "검증계는 테스트계·QA 환경이라고도 부르며, 개발을 마친 프로그램을 운영에 올리기 전에 기능과 성능을 시험하는 환경입니다.",
    why: "운영에 올리기 전에 오류를 찾아 실제 사용자가 겪지 않게 합니다.",
    compare: "검증계와 스테이징은 조직마다 같은 뜻으로도 쓰고, 검증계는 기능 시험용·스테이징은 운영 직전 최종 확인용으로 나누어 쓰기도 합니다.",
    aliases: ["test", "qa", "테스트계", "검증환경", "테스트서버", "품질계"],
  },
  {
    term: "스테이징",
    fullName: "스테이징 환경(Staging)",
    category: "환경 구분",
    definition:
      "스테이징은 운영 환경과 최대한 비슷하게 구성해 두고 운영에 반영하기 직전에 새 버전을 올려 마지막으로 확인하는 환경입니다.",
    why: "운영과 같은 조건에서 미리 돌려 보아 배포 때 생길 문제를 줄입니다.",
    compare: "스테이징은 운영과 구성이 같아야 의미가 있고, 개발계는 운영과 달라도 됩니다.",
    aliases: ["staging", "stage", "stg", "스테이지", "준운영", "사전운영"],
  },
  {
    term: "무중단 배포",
    fullName: "무중단 배포(Zero-downtime Deployment)",
    category: "배포",
    definition:
      "무중단 배포는 새 버전을 올리는 동안에도 사용자가 서비스를 끊김 없이 쓸 수 있게 하는 배포 방식을 통틀어 부르는 말입니다.",
    why: "배포 때문에 서비스를 멈추거나 야간 점검 시간을 잡지 않아도 됩니다.",
    compare: "롤링·블루그린·카나리가 모두 무중단 배포의 구체적인 방법입니다.",
    aliases: ["zerodowntimedeployment", "무정지배포", "무중단"],
  },
  {
    term: "롤링 배포",
    fullName: "롤링 배포(Rolling Deployment)",
    category: "배포",
    definition:
      "롤링 배포는 서버 여러 대를 한 대(또는 몇 대)씩 차례로 새 버전으로 바꿔 가는 배포 방식입니다.",
    why: "서버를 추가로 마련하지 않고도 서비스를 멈추지 않고 배포합니다.",
    compare: "롤링 배포는 배포 도중 옛 버전과 새 버전이 함께 돌고, 블루그린 배포는 한 번에 통째로 바꿉니다.",
    aliases: ["rollingupdate", "rollingdeployment", "롤링업데이트", "순차배포"],
  },
  {
    term: "블루그린 배포",
    fullName: "블루그린 배포(Blue-Green Deployment)",
    category: "배포",
    definition:
      "블루그린 배포는 지금 버전(블루)과 똑같은 환경을 하나 더 만들어 새 버전(그린)을 올린 뒤 접속을 한 번에 그쪽으로 돌리는 배포 방식입니다.",
    why: "문제가 생기면 접속을 이전 환경으로 되돌리기만 하면 되어 복구가 빠릅니다.",
    compare: "블루그린 배포는 환경이 두 벌 필요해 비용이 들고, 롤링 배포는 한 벌로 됩니다.",
    aliases: ["bluegreen", "블루그린"],
  },
  {
    term: "카나리 배포",
    fullName: "카나리 배포(Canary Deployment)",
    category: "배포",
    definition:
      "카나리 배포는 새 버전을 일부 사용자나 일부 서버에만 먼저 내보내 문제가 없는지 본 뒤 점차 전체로 넓히는 배포 방식입니다.",
    why: "새 버전의 문제가 전체 사용자에게 퍼지기 전에 적은 범위에서 먼저 드러나게 합니다.",
    compare: "카나리 배포는 접속 비율을 조금씩 옮기고, 블루그린 배포는 한 번에 모두 옮깁니다.",
    aliases: ["canary", "canaryrelease", "카나리", "카나리아배포", "점진배포"],
  },
  {
    term: "형상관리",
    fullName: "형상관리(Configuration Management)",
    category: "운영 / 개발 관리",
    definition:
      "형상관리는 소스 코드·산출물·설정의 변경을 통제하고 변경 이력을 기록·추적해 버전별로 관리하는 활동입니다.",
    why: "변경 이력을 추적하고 문제가 생기면 이전 버전으로 되돌립니다.",
    compare: "형상관리는 소스의 변경을 기록하고, CI/CD는 그 소스를 빌드해 서버에 올리는 과정을 자동으로 돌립니다.",
    aliases: ["scm", "versioncontrol", "vcs", "git", "svn", "버전관리", "소스관리"],
  },
  {
    term: "PM(정기점검)",
    fullName: "예방 점검(Preventive Maintenance)",
    category: "운영",
    definition:
      "PM(Preventive Maintenance)은 고장이 나기 전에 미리 정한 일정에 따라 시스템과 장비를 점검·정비하는 예방 유지보수 작업입니다.",
    why: "고장을 미리 찾아 막아 예기치 않은 서비스 중단을 줄입니다.",
    compare: "운영 용어 PM은 정기점검이고, 사업 관리 용어 PM은 프로젝트 관리자(Project Manager)입니다.",
    aliases: ["preventivemaintenance", "정기점검", "pm작업", "예방점검", "시스템점검"],
  },
  {
    term: "IaC",
    fullName: "코드형 인프라(Infrastructure as Code)",
    category: "운영 / 자동화",
    definition:
      "IaC(코드형 인프라)는 서버·네트워크 같은 인프라 구성을 손으로 설정하지 않고 코드 파일로 적어 자동으로 만들고 바꾸는 방식입니다.",
    why: "같은 환경을 실수 없이 반복해서 만들고 변경 이력을 코드로 남깁니다.",
    compare: "IaC는 인프라를 만드는 일을 자동화하고, CI/CD는 프로그램을 빌드·배포하는 일을 자동화합니다.",
    aliases: ["infrastructureascode", "코드형인프라", "인프라코드", "아이에이씨"],
  },

  // ── 제품 ──
  {
    term: "Rocky Linux",
    fullName: "Rocky Linux",
    category: "운영체제 / 리눅스",
    definition:
      "Rocky Linux는 RESF(Rocky Enterprise Software Foundation)가 주관하고 커뮤니티가 개발하는, RHEL과 호환되는 오픈소스 기업용 리눅스 배포판입니다.",
    why: "",
    compare: "",
    aliases: ["rocky", "록키리눅스", "로키리눅스"],
  },
  {
    term: "Ubuntu",
    fullName: "Ubuntu (Ubuntu Server)",
    category: "운영체제 / 리눅스",
    definition:
      "Ubuntu는 캐노니컬(Canonical)이 데비안(Debian)을 바탕으로 만들어 배포하는 리눅스 배포판으로, 장기 지원판(LTS)이 2년마다 나옵니다.",
    why: "",
    compare: "",
    aliases: ["ubuntuserver", "ubuntults", "우분투"],
  },
  {
    term: "AIX",
    fullName: "Advanced Interactive eXecutive",
    category: "운영체제 / 유닉스",
    definition:
      "AIX는 IBM이 자사 Power 서버용으로 만드는 상용 유닉스(UNIX) 운영체제입니다.",
    why: "",
    compare: "",
    aliases: ["ibmaix", "에이아이엑스"],
  },
  {
    term: "Solaris",
    fullName: "Oracle Solaris",
    category: "운영체제 / 유닉스",
    definition:
      "Solaris(Oracle Solaris)는 오라클(Oracle)이 공급하는 기업용 서버 운영체제로, SPARC와 x86 서버에서 동작합니다.",
    why: "",
    compare: "",
    aliases: ["oraclesolaris", "솔라리스"],
  },
  {
    term: "IIS",
    fullName: "Internet Information Services",
    category: "웹 서버",
    definition:
      "IIS(Internet Information Services)는 마이크로소프트가 Windows Server의 역할로 포함해 제공하는 웹 서버로, ASP.NET 애플리케이션 등을 실행합니다.",
    why: "",
    compare: "",
    aliases: ["internetinformationservices", "microsoftiis", "아이아이에스"],
  },
  {
    term: "WebLogic",
    fullName: "Oracle WebLogic Server",
    category: "WAS / 서블릿 컨테이너",
    definition:
      "WebLogic(Oracle WebLogic Server)은 오라클(Oracle)이 공급하는 자바 EE 표준 기반의 웹 애플리케이션 서버(WAS)입니다.",
    why: "",
    compare: "",
    aliases: ["weblogicserver", "oracleweblogic", "wls", "웹로직"],
  },
  {
    term: "WebSphere",
    fullName: "IBM WebSphere Application Server",
    category: "WAS / 서블릿 컨테이너",
    definition:
      "WebSphere(IBM WebSphere Application Server)는 IBM이 공급하는 상용 자바 애플리케이션 서버(WAS)로, 전통(traditional) 판과 가벼운 Liberty 판이 있습니다.",
    why: "",
    compare: "",
    aliases: ["websphereapplicationserver", "ibmwas", "websphereliberty", "웹스피어"],
  },
  {
    term: "OHS",
    fullName: "Oracle HTTP Server",
    category: "웹 서버",
    definition:
      "OHS(Oracle HTTP Server)는 Apache HTTP Server를 바탕으로 만든 Oracle Fusion Middleware의 웹 서버로, 주로 WebLogic 앞단에서 요청을 받아 넘깁니다.",
    why: "",
    compare: "",
    aliases: ["oraclehttpserver", "오에이치에스"],
  },
  {
    term: "Spring Boot",
    fullName: "Spring Boot (내장 톰캣)",
    category: "애플리케이션 프레임워크 / 내장 WAS",
    definition:
      "Spring Boot는 Tomcat 같은 서버를 안에 품어 따로 설치 없이 바로 실행되는 스프링(Spring) 애플리케이션을 만들게 해 주는 오픈소스 프레임워크입니다.",
    why: "",
    compare: "",
    aliases: ["embeddedtomcat", "내장톰캣", "스프링부트"],
  },
  {
    term: "Node.js",
    fullName: "Node.js",
    category: "애플리케이션 런타임",
    definition:
      "Node.js는 크롬의 V8 엔진으로 자바스크립트(JavaScript)를 브라우저 밖에서 실행하는 오픈소스 런타임으로, OpenJS Foundation 소속 프로젝트입니다.",
    why: "",
    compare: "",
    aliases: ["node", "노드", "노드제이에스"],
  },
  {
    term: "PM2",
    fullName: "Process Manager 2",
    category: "프로세스 관리자",
    definition:
      "PM2는 Node.js 애플리케이션을 백그라운드로 띄워 계속 살려 두고 여러 프로세스로 부하를 나누어 주는 오픈소스 프로세스 관리자입니다.",
    why: "",
    compare: "",
    aliases: ["피엠투"],
  },
  {
    term: "MariaDB",
    fullName: "MariaDB Server",
    category: "관계형 DB",
    definition:
      "MariaDB는 MySQL의 원 개발자들이 만든 오픈소스 관계형 데이터베이스(RDBMS)로, MySQL을 그대로 대체할 수 있게 설계되었습니다.",
    why: "",
    compare: "",
    aliases: ["마리아db", "마리아디비"],
  },
  {
    term: "MS SQL Server",
    fullName: "Microsoft SQL Server",
    category: "관계형 DB",
    definition:
      "MS SQL Server(Microsoft SQL Server)는 마이크로소프트가 만드는 상용 관계형 데이터베이스(RDBMS)로, Windows와 리눅스에서 동작합니다.",
    why: "",
    compare: "",
    aliases: ["mssql", "sqlserver", "엠에스에스큐엘"],
  },
  {
    term: "Altibase",
    fullName: "Altibase",
    category: "관계형 DB / 인메모리",
    definition:
      "Altibase는 알티베이스(Altibase)가 만든 국산 상용 관계형 데이터베이스(RDBMS)로, 메모리 테이블과 디스크 테이블을 한 엔진에서 함께 쓰는 하이브리드 구조입니다.",
    why: "",
    compare: "",
    aliases: ["altibasehdb", "알티베이스"],
  },
  {
    term: "Db2",
    fullName: "IBM Db2",
    category: "관계형 DB",
    definition:
      "Db2(IBM Db2)는 IBM이 만드는 상용 관계형 데이터베이스(RDBMS)로, 메인프레임·유닉스·리눅스·윈도우에서 동작합니다.",
    why: "",
    compare: "",
    aliases: ["ibmdb2", "udb", "디비투"],
  },
  {
    term: "Oracle RAC",
    fullName: "Oracle Real Application Clusters",
    category: "관계형 DB / 클러스터",
    definition:
      "Oracle RAC(Real Application Clusters)는 여러 서버의 인스턴스가 공유 저장소에 있는 데이터베이스 하나를 함께 열어 서비스하게 하는 Oracle Database의 클러스터 옵션입니다.",
    why: "",
    compare: "",
    aliases: ["rac", "realapplicationclusters", "오라클랙"],
  },
  {
    term: "Oracle Data Guard",
    fullName: "Oracle Data Guard",
    category: "관계형 DB / 복제·재해복구",
    definition:
      "Oracle Data Guard는 운영 데이터베이스의 변경 기록(redo)을 대기(Standby) 데이터베이스로 보내 적용해 같은 상태로 유지하는 Oracle Database의 재해복구 기능입니다.",
    why: "",
    compare: "",
    aliases: ["dataguard", "adg", "activedataguard", "데이터가드"],
  },
  {
    term: "Aurora",
    fullName: "Amazon Aurora",
    category: "관계형 DB / 클라우드 관리형",
    definition:
      "Aurora(Amazon Aurora)는 AWS가 제공하는 MySQL·PostgreSQL 호환 관리형 관계형 데이터베이스로, 데이터를 세 가용 영역에 자동으로 복제합니다.",
    why: "",
    compare: "",
    aliases: ["amazonaurora", "awsaurora", "auroramysql", "aurorapostgresql", "오로라"],
  },
  {
    term: "RDS",
    fullName: "Amazon Relational Database Service",
    category: "관계형 DB / 클라우드 관리형",
    definition:
      "RDS(Amazon Relational Database Service)는 MySQL·PostgreSQL·Oracle 같은 관계형 데이터베이스의 설치·백업·패치를 AWS가 대신 해 주는 관리형 서비스입니다.",
    why: "",
    compare: "",
    aliases: ["amazonrds", "awsrds", "알디에스"],
  },
  {
    term: "DynamoDB",
    fullName: "Amazon DynamoDB",
    category: "NoSQL DB / 클라우드 관리형",
    definition:
      "DynamoDB(Amazon DynamoDB)는 AWS가 제공하는 서버리스 방식의 관리형 NoSQL 데이터베이스로, 키-값과 문서 형태의 데이터를 저장합니다.",
    why: "",
    compare: "",
    aliases: ["amazondynamodb", "dynamo", "다이나모db", "다이나모디비"],
  },
  {
    term: "Cassandra",
    fullName: "Apache Cassandra",
    category: "NoSQL DB / 와이드 컬럼",
    definition:
      "Cassandra(Apache Cassandra)는 여러 서버에 데이터를 나누어 저장하고 주(Master) 서버 없이 동작하는 오픈소스 분산 NoSQL 데이터베이스입니다.",
    why: "",
    compare: "",
    aliases: ["apachecassandra", "카산드라"],
  },
  {
    term: "HBase",
    fullName: "Apache HBase",
    category: "NoSQL DB / 와이드 컬럼",
    definition:
      "HBase(Apache HBase)는 하둡(Hadoop)의 분산 파일 시스템 위에서 아주 큰 표 형태의 데이터를 저장하는 오픈소스 분산 NoSQL 데이터베이스입니다.",
    why: "",
    compare: "",
    aliases: ["apachehbase", "에이치베이스"],
  },
  {
    term: "InfluxDB",
    fullName: "InfluxDB",
    category: "시계열 DB",
    definition:
      "InfluxDB는 인플럭스데이터(InfluxData)가 만드는 시계열 데이터베이스로, 시간 순서로 쌓이는 측정값(모니터링 지표, 센서 값)을 저장하고 조회하는 데 맞춰져 있습니다.",
    why: "",
    compare: "",
    aliases: ["influx", "인플럭스db", "인플럭스디비"],
  },
  {
    term: "Memcached",
    fullName: "Memcached",
    category: "캐시 / 인메모리",
    definition:
      "Memcached는 키와 값을 메모리에 저장하는 오픈소스 분산 캐시 서버로, 데이터베이스 부하를 줄여 응답을 빠르게 하는 데 씁니다.",
    why: "",
    compare: "",
    aliases: ["memcache", "멤캐시드", "멤캐시"],
  },
  {
    term: "ActiveMQ",
    fullName: "Apache ActiveMQ",
    category: "큐 / 메시지 브로커",
    definition:
      "ActiveMQ(Apache ActiveMQ)는 자바로 만든 오픈소스 메시지 브로커로, 자바 메시지 표준(JMS)을 비롯한 여러 프로토콜로 시스템 사이에 메시지를 전달합니다.",
    why: "",
    compare: "",
    aliases: ["apacheactivemq", "activemqartemis", "액티브mq", "액티브엠큐"],
  },
  {
    term: "IBM MQ",
    fullName: "IBM MQ",
    category: "큐 / 메시지 브로커",
    definition:
      "IBM MQ는 IBM이 공급하는 상용 메시지 큐 미들웨어로, 애플리케이션이 큐에 넣은 메시지를 다른 시스템으로 빠짐없이 전달하며 금융권에서도 쓰입니다.",
    why: "",
    compare: "",
    aliases: ["아이비엠엠큐"],
  },
  {
    term: "Control-M",
    fullName: "BMC Control-M",
    category: "배치 스케줄러",
    definition:
      "Control-M은 BMC가 공급하는 상용 작업 자동화(배치 스케줄러) 제품으로, 여러 시스템의 작업 흐름을 순서와 시간에 맞춰 실행하고 한곳에서 관리합니다.",
    why: "",
    compare: "",
    aliases: ["ctm", "bmccontrolm", "컨트롤엠"],
  },
  {
    term: "Quartz",
    fullName: "Quartz Job Scheduler",
    category: "배치 스케줄러 / 라이브러리",
    definition:
      "Quartz는 자바 애플리케이션 안에서 정해진 시각이나 주기에 작업을 실행하게 해 주는 오픈소스 작업 스케줄링 라이브러리입니다.",
    why: "",
    compare: "",
    aliases: ["quartzscheduler", "쿼츠"],
  },
  {
    term: "Airflow",
    fullName: "Apache Airflow",
    category: "배치 스케줄러 / 워크플로",
    definition:
      "Airflow(Apache Airflow)는 여러 단계로 이어지는 배치 작업 흐름을 파이썬 코드로 정의해 일정에 맞춰 실행하고 감시하는 오픈소스 워크플로 플랫폼입니다.",
    why: "",
    compare: "",
    aliases: ["apacheairflow", "에어플로", "에어플로우"],
  },
  {
    term: "Oracle GoldenGate",
    fullName: "Oracle GoldenGate",
    category: "데이터 복제 / CDC",
    definition:
      "Oracle GoldenGate는 데이터베이스에서 바뀐 데이터를 잡아 같은 종류나 다른 종류의 데이터베이스로 실시간 복제하는 오라클의 데이터 복제(CDC) 제품입니다.",
    why: "",
    compare: "",
    aliases: ["goldengate", "ogg", "골든게이트"],
  },
  {
    term: "Debezium",
    fullName: "Debezium",
    category: "데이터 복제 / CDC",
    definition:
      "Debezium은 데이터베이스의 변경 내용을 잡아 Kafka로 내보내는 오픈소스 변경 데이터 캡처(CDC) 플랫폼으로, Commonhaus 재단이 주관합니다.",
    why: "",
    compare: "",
    aliases: ["데비지움"],
  },
  {
    term: "Hyper-V",
    fullName: "Microsoft Hyper-V",
    category: "가상화 / 하이퍼바이저",
    definition:
      "Hyper-V는 마이크로소프트가 Windows Server와 Windows에 포함해 제공하는 하이퍼바이저로, 물리 서버 한 대에 여러 가상 머신을 띄웁니다.",
    why: "",
    compare: "",
    aliases: ["하이퍼브이", "하이퍼v"],
  },
  {
    term: "KVM",
    fullName: "Kernel-based Virtual Machine",
    category: "가상화 / 하이퍼바이저",
    definition:
      "KVM(Kernel-based Virtual Machine)은 리눅스 커널에 들어 있는 오픈소스 가상화 기능으로, 리눅스 서버를 하이퍼바이저로 만들어 가상 머신을 띄웁니다.",
    why: "",
    compare: "",
    aliases: ["kernelbasedvirtualmachine", "qemukvm", "케이브이엠"],
  },
  {
    term: "Docker",
    fullName: "Docker (Docker Engine)",
    category: "컨테이너 / 실행 도구",
    definition:
      "Docker는 애플리케이션과 실행에 필요한 것들을 컨테이너 이미지로 묶고 그 이미지를 컨테이너로 실행하는 도구로, 도커(Docker, Inc.)가 만듭니다.",
    why: "",
    compare: "",
    aliases: ["dockerengine", "dockerd", "도커"],
  },
  {
    term: "OpenShift",
    fullName: "Red Hat OpenShift",
    category: "컨테이너 플랫폼 / 쿠버네티스 배포판",
    definition:
      "OpenShift(Red Hat OpenShift)는 레드햇이 쿠버네티스를 중심으로 개발·운영 도구를 더해 공급하는 기업용 컨테이너 애플리케이션 플랫폼입니다.",
    why: "",
    compare: "",
    aliases: ["ocp", "openshiftcontainerplatform", "오픈시프트"],
  },
  {
    term: "Rancher",
    fullName: "SUSE Rancher",
    category: "쿠버네티스 / 클러스터 관리",
    definition:
      "Rancher는 여러 쿠버네티스 클러스터의 인증·접근 권한·모니터링을 한곳에서 관리하게 해 주는 수세(SUSE)의 컨테이너 관리 플랫폼입니다.",
    why: "",
    compare: "",
    aliases: ["suserancher", "랜처"],
  },
  {
    term: "Jenkins",
    fullName: "Jenkins",
    category: "CI/CD / 자동화 서버",
    definition:
      "Jenkins는 소프트웨어의 빌드·테스트·배포 작업을 자동으로 돌려 주는 오픈소스 자동화 서버입니다.",
    why: "",
    compare: "",
    aliases: ["젠킨스"],
  },
  {
    term: "GitLab",
    fullName: "GitLab",
    category: "형상관리 / CI/CD",
    definition:
      "GitLab은 Git 소스 관리와 계획, CI/CD, 보안 점검을 한 제품으로 제공하는 개발(DevSecOps) 플랫폼으로, 사내에 직접 설치해 쓸 수도 있습니다.",
    why: "",
    compare: "",
    aliases: ["gitlabci", "gitlabce", "깃랩"],
  },
  {
    term: "Ansible",
    fullName: "Red Hat Ansible",
    category: "구성 관리 / 자동화",
    definition:
      "Ansible은 대상 서버에 별도 프로그램(에이전트)을 깔지 않고 SSH로 접속해 설치·설정 작업을 자동으로 수행하는 오픈소스 자동화 도구로, 레드햇이 후원합니다.",
    why: "",
    compare: "",
    aliases: ["ansibleplaybook", "앤서블", "앤시블"],
  },
  {
    term: "Terraform",
    fullName: "HashiCorp Terraform",
    category: "인프라 코드(IaC)",
    definition:
      "Terraform은 클라우드와 사내 인프라 자원을 코드로 적어 만들고 바꾸는 하시코프(HashiCorp)의 코드형 인프라(IaC) 도구로, 라이선스가 MPL에서 BSL로 바뀌었습니다.",
    why: "",
    compare: "",
    aliases: ["tf", "hashicorpterraform", "테라폼"],
  },
  {
    term: "Grafana",
    fullName: "Grafana",
    category: "모니터링 / 대시보드",
    definition:
      "Grafana는 여러 데이터 저장소의 지표·로그를 조회해 그래프 대시보드로 보여 주고 알림을 보내는 오픈소스 시각화 도구로, 그라파나 랩스(Grafana Labs)가 만듭니다.",
    why: "",
    compare: "",
    aliases: ["그라파나"],
  },
  {
    term: "Nagios",
    fullName: "Nagios (Nagios Core)",
    category: "모니터링 / 인프라",
    definition:
      "Nagios는 서버·네트워크 장비·서비스 상태를 감시해 문제가 생기면 알림을 보내는 모니터링 도구로, 오픈소스인 Nagios Core와 상용 Nagios XI가 있습니다.",
    why: "",
    compare: "",
    aliases: ["nagioscore", "nagiosxi", "나기오스"],
  },
  {
    term: "ELK 스택",
    fullName: "Elasticsearch · Logstash · Kibana (Elastic Stack)",
    category: "로깅 / 로그 수집·검색",
    definition:
      "ELK 스택은 데이터를 모으는 Logstash, 저장·검색하는 Elasticsearch, 화면으로 보여 주는 Kibana를 묶어 부르는 이름으로, 엘라스틱(Elastic)의 Elastic Stack에 해당합니다.",
    why: "",
    compare: "",
    aliases: ["elk", "elasticstack", "엘크", "엘라스틱스택"],
  },
  {
    term: "Logstash",
    fullName: "Logstash",
    category: "로깅 / 로그 수집기",
    definition:
      "Logstash는 여러 곳의 데이터를 받아 가공한 뒤 Elasticsearch 같은 저장소로 보내는 엘라스틱(Elastic)의 오픈소스 데이터 수집·가공 파이프라인입니다.",
    why: "",
    compare: "",
    aliases: ["로그스태시"],
  },
  {
    term: "Kibana",
    fullName: "Kibana",
    category: "로깅 / 대시보드",
    definition:
      "Kibana는 Elasticsearch에 쌓인 데이터를 검색·분석하고 그래프와 대시보드로 보여 주는 엘라스틱(Elastic)의 화면 도구입니다.",
    why: "",
    compare: "",
    aliases: ["키바나"],
  },
  {
    term: "WhaTap",
    fullName: "WhaTap Monitoring",
    category: "모니터링 / 통합 모니터링(SaaS)",
    definition:
      "WhaTap은 와탭랩스(WhaTap Labs)가 SaaS로 제공하는 국산 모니터링 서비스로, 애플리케이션·서버·데이터베이스·쿠버네티스 상태를 실시간으로 보여 줍니다.",
    why: "",
    compare: "",
    aliases: ["와탭"],
  },
  {
    term: "Datadog",
    fullName: "Datadog",
    category: "모니터링 / 통합 모니터링(SaaS)",
    definition:
      "Datadog은 인프라·애플리케이션·로그의 상태를 한곳에 모아 보여 주는 데이터독(Datadog)의 통합 모니터링·보안 플랫폼입니다.",
    why: "",
    compare: "",
    aliases: ["데이터독"],
  },
  {
    term: "Nexus",
    fullName: "Sonatype Nexus Repository",
    category: "아티팩트 저장소",
    definition:
      "Nexus(Sonatype Nexus Repository)는 Maven·npm·Docker 같은 형식의 소프트웨어 구성 요소를 한곳에 저장하고 배포하는 소나타입(Sonatype)의 저장소 관리 제품입니다.",
    why: "",
    compare: "",
    aliases: ["nexusrepository", "nexusoss", "sonatypenexus", "넥서스"],
  },

  // ── 연계 개념 · 프로토콜 ──
  {
    term: "EAI",
    fullName: "기업 애플리케이션 통합(Enterprise Application Integration)",
    category: "미들웨어 / 연계",
    definition:
      "EAI(기업 애플리케이션 통합)는 회사 안의 서로 다른 시스템과 애플리케이션을 미들웨어 등으로 연결해 데이터를 주고받게 하는 통합 방식이나 그 솔루션입니다.",
    why: "시스템끼리 일일이 직접 연결하지 않고 가운데 허브에서 전달 경로와 데이터 변환을 관리합니다.",
    compare: "EAI는 시스템을 통합하는 일 전체를 가리키고, ESB는 그 가운데 허브를 구현하는 방식의 하나입니다.",
    aliases: ["enterpriseapplicationintegration", "이에이아이", "내부연계"],
  },
  {
    term: "ESB",
    fullName: "엔터프라이즈 서비스 버스(Enterprise Service Bus)",
    category: "미들웨어 / 연계",
    definition:
      "ESB(엔터프라이즈 서비스 버스)는 가운데 놓인 소프트웨어가 애플리케이션 사이의 데이터 변환·전달 경로 지정·통신 규약 변환을 맡아 통합하는 구조입니다.",
    why: "시스템끼리 일일이 직접 연결하지 않아도 되고, 기능을 서비스로 만들어 다시 쓰기 쉬워집니다.",
    compare: "EAI는 시스템을 통합하는 일 전체를 가리키고, ESB는 서비스 인터페이스로 느슨하게 연결하는 통합 구조의 하나입니다.",
    aliases: ["enterpriseservicebus", "이에스비", "서비스버스"],
  },
  {
    term: "API 관리",
    fullName: "API 관리(API Management, APIM)",
    category: "미들웨어 / 연계",
    definition:
      "API 관리는 API를 배포하고 통제하고 분석하는 과정으로, 게이트웨이·개발자 포털·접근 통제·사용량 제한·통계를 아우르는 활동이나 솔루션입니다.",
    why: "누가 어떤 API를 얼마나 쓰는지 통제하고 개발자에게 API를 안전하게 공개합니다.",
    compare: "API 게이트웨이는 요청을 받아 넘기는 단일 관문이고, API 관리는 게이트웨이에 통계·포털·접근 통제까지 더한 전체 체계입니다.",
    aliases: ["apimanagement", "apim", "api관리플랫폼"],
  },
  {
    term: "배치 스케줄러",
    fullName: "배치 스케줄러(Batch Scheduler, 작업 스케줄러)",
    category: "미들웨어 / 배치",
    definition:
      "배치 스케줄러는 배치 작업을 정해진 시각이나 앞선 작업의 완료 같은 조건에 맞춰 자동으로 실행하는 소프트웨어입니다.",
    why: "많은 배치 작업을 사람 손 없이 정해진 시각과 순서대로 실행합니다.",
    compare: "작업 스케줄러는 주로 한 시스템의 배치 작업을 실행하고, 워크로드 자동화는 여러 서버에 걸친 작업 흐름을 한곳에서 관리합니다.",
    aliases: ["batchscheduler", "jobscheduler", "작업스케줄러", "잡스케줄러"],
  },
  {
    term: "ETL",
    fullName: "추출·변환·적재(Extract, Transform, Load)",
    category: "데이터 / 연계",
    definition:
      "ETL은 여러 원천의 데이터를 꺼내(추출) 분석에 맞는 모양으로 바꾼(변환) 뒤 데이터 웨어하우스 같은 곳에 넣는(적재) 작업이나 도구입니다.",
    why: "여러 시스템에 흩어진 데이터를 한곳에 모아 통계와 분석에 쓰게 합니다.",
    compare: "ETL은 데이터를 바꾼 뒤에 적재하고, ELT는 먼저 적재한 뒤 대상 시스템 안에서 바꿉니다.",
    aliases: ["extracttransformload", "이티엘", "데이터적재"],
  },
  {
    term: "CDC",
    fullName: "변경 데이터 캡처(Change Data Capture)",
    category: "데이터 / 연계",
    definition:
      "CDC(변경 데이터 캡처)는 데이터베이스에서 언제 무엇이 바뀌었는지 추적해 그 변경분을 다른 시스템에 전달하는 데이터 통합 방식입니다.",
    why: "데이터 전체를 다시 옮기지 않고 바뀐 부분만 전달해 다른 시스템을 실시간에 가깝게 맞춥니다.",
    compare: "로그 기반 CDC는 트랜잭션 로그를 읽어 원본 부담이 적고, 조회 기반 방식은 원본을 주기적으로 조회해 부담이 더 큽니다.",
    aliases: ["changedatacapture", "씨디씨", "변경데이터캡처"],
  },
  {
    term: "리포팅 툴",
    fullName: "리포팅 툴(Reporting Tool, 보고서 솔루션)",
    category: "미들웨어 / 출력",
    definition:
      "리포팅 툴은 데이터베이스의 데이터를 정해진 쪽 양식의 보고서로 만들어 화면에 보여 주고 인쇄하거나 PDF·엑셀 등으로 내보내는 솔루션입니다.",
    why: "양식(보고서 정의)만 만들어 두면 실행할 때 데이터를 가져와 양식에 채워 문서를 만들어 냅니다.",
    compare: "리포팅 툴은 모든 데이터를 쪽에 맞춰 빠짐없이 출력하고, BI 도구의 보고서는 화면에서 데이터를 살펴보는 데 맞춰져 있습니다.",
    aliases: ["reportingtool", "리포트툴", "리포트서버", "레포팅툴", "보고서툴"],
  },
  {
    term: "배치",
    fullName: "배치 처리(Batch Processing, 일괄 처리)",
    category: "처리 방식",
    definition:
      "배치는 양이 많고 반복되는 데이터 작업을 모아 두었다가 주기적으로 한꺼번에 처리하는 방식 또는 그렇게 도는 작업입니다.",
    why: "정산·청구처럼 양이 많은 작업을 야간 같은 한가한 시간에 사람 손을 거의 들이지 않고 처리합니다.",
    compare: "배치는 모아 둔 데이터를 정해진 때에 차례로 처리하고, 스트림 처리는 데이터가 흘러들어오는 대로 계속 처리합니다.",
    aliases: ["batch", "batchjob", "일괄처리", "배치작업", "야간배치"],
  },
  {
    term: "온라인 트랜잭션",
    fullName: "온라인 트랜잭션 처리(Online Transaction Processing, OLTP)",
    category: "처리 방식",
    definition:
      "온라인 트랜잭션은 많은 사용자의 요청(조회·이체·주문 등)을 받는 즉시 실시간으로 처리해 결과를 돌려주는 거래 처리 방식입니다.",
    why: "사용자가 기다리는 동안 바로 끝내야 하는 거래 업무를 처리합니다.",
    compare: "온라인 트랜잭션(OLTP)은 짧고 단순한 거래를 아주 많이 처리하고, 분석 처리(OLAP)는 많은 데이터를 복잡하게 조회해 분석합니다.",
    aliases: ["oltp", "onlinetransaction", "온라인거래", "온라인처리", "실시간거래"],
  },
  {
    term: "포트",
    fullName: "포트 번호(Port Number)",
    category: "프로토콜 / 기본 개념",
    definition:
      "포트는 컴퓨터 한 대 안에서 어느 프로그램(서비스)으로 가는 통신인지 구분하는 0~65535 사이의 번호입니다.",
    why: "IP 주소 하나로 웹·DB·원격 접속 같은 여러 서비스를 동시에 받게 합니다.",
    compare: "IP 주소는 어느 서버인지를 가리키고, 포트는 그 서버 안의 어느 프로그램인지를 가리킵니다.",
    aliases: ["port", "포트번호", "tcp포트", "서비스포트", "리슨포트"],
  },
  {
    term: "HTTP",
    fullName: "HyperText Transfer Protocol",
    category: "프로토콜 / 웹",
    definition:
      "HTTP(HyperText Transfer Protocol)는 브라우저와 웹 서버가 요청과 응답을 주고받는 웹의 기본 통신 규약으로, 기본 포트는 80입니다.",
    why: "웹 페이지와 API 호출이 모두 이 규약으로 오갑니다.",
    compare: "HTTP는 내용이 암호화되지 않고, HTTPS는 암호화됩니다.",
    aliases: ["80포트", "에이치티티피"],
  },
  {
    term: "HTTPS",
    fullName: "HTTP over TLS (HTTP Secure)",
    category: "프로토콜 / 웹",
    definition:
      "HTTPS는 HTTP 통신을 TLS로 암호화하고 서버를 인증해 중간에서 엿보거나 바꾸지 못하게 한 통신 규약으로, 기본 포트는 443입니다.",
    why: "로그인 정보와 개인 정보가 전송 중에 노출되지 않게 합니다.",
    compare: "HTTPS는 서버에 인증서가 있어야 하고, HTTP는 인증서 없이 동작합니다.",
    aliases: ["443포트", "보안접속"],
  },
  {
    term: "TCP",
    fullName: "전송 제어 프로토콜(Transmission Control Protocol)",
    category: "프로토콜 / 전송 계층",
    definition:
      "TCP(전송 제어 프로토콜)는 먼저 연결을 맺고 데이터가 빠짐없이 순서대로 도착했는지 확인하며 보내는 전송 규약입니다.",
    why: "웹·DB·파일 전송처럼 데이터가 하나도 빠지면 안 되는 통신에 씁니다.",
    compare: "TCP는 연결을 맺고 도착을 확인하며 보내고, UDP는 연결 없이 보내며 도착을 보장하지 않습니다.",
    aliases: ["transmissioncontrolprotocol", "티씨피"],
  },
  {
    term: "UDP",
    fullName: "사용자 데이터그램 프로토콜(User Datagram Protocol)",
    category: "프로토콜 / 전송 계층",
    definition:
      "UDP(사용자 데이터그램 프로토콜)는 연결을 맺지 않고 도착 확인도 없이 데이터를 바로 보내는 전송 규약입니다.",
    why: "DNS 조회처럼 짧게 주고받거나 절차를 줄여 빠르게 보내야 하는 통신에 씁니다.",
    compare: "UDP는 절차가 적은 대신 도착과 중복 방지를 보장하지 않고, TCP는 빠짐없이 순서대로 도착하게 합니다.",
    aliases: ["userdatagramprotocol", "유디피"],
  },
  {
    term: "AJP",
    fullName: "Apache JServ Protocol",
    category: "프로토콜 / 웹 서버-WAS 연결",
    definition:
      "AJP(Apache JServ Protocol)는 Apache 같은 웹 서버가 받은 요청을 뒤쪽 Tomcat 같은 WAS로 넘길 때 쓰는 이진 통신 규약으로, 기본 포트는 8009입니다.",
    why: "웹 서버와 WAS 사이를 성능을 위해 이진 형식의 패킷으로, 연결을 재사용하며 잇습니다.",
    compare: "AJP는 웹 서버와 WAS 사이에서만 쓰고, 믿을 수 있는 내부 망 밖에 열어 두면 안 되는 내부 전용 통로입니다.",
    aliases: ["ajp13", "8009포트", "에이제이피"],
  },
  {
    term: "JDBC",
    fullName: "Java Database Connectivity",
    category: "프로토콜 / DB 접속 규격",
    definition:
      "JDBC(Java Database Connectivity)는 자바 프로그램이 데이터베이스에 접속해 SQL을 실행하는 표준 접속 규격(API)입니다.",
    why: "데이터베이스 제품이 달라도 드라이버만 바꿔 같은 방식으로 접속합니다.",
    compare: "JDBC는 통신 규약이 아니라 자바의 접속 방식 표준이고, 실제 통신은 DB 제품마다 다른 드라이버와 포트로 이루어집니다.",
    aliases: ["jdbc드라이버", "jdbcurl", "제이디비씨"],
  },
  {
    term: "SSH",
    fullName: "시큐어 셸(Secure Shell)",
    category: "프로토콜 / 원격 접속",
    definition:
      "SSH(Secure Shell)는 안전하지 않은 망에서도 암호화된 통로로 서버에 원격 접속해 명령을 실행하게 하는 통신 규약으로, 기본 포트는 22입니다.",
    why: "관리자가 떨어진 곳에서 서버를 안전하게 조작합니다.",
    compare: "SSH는 원격 접속 규약이고, SFTP는 그 SSH 통로 위에서 파일을 주고받는 규약입니다.",
    aliases: ["secureshell", "22포트", "에스에스에이치"],
  },
  {
    term: "SFTP",
    fullName: "SSH 파일 전송 프로토콜(SSH File Transfer Protocol)",
    category: "프로토콜 / 파일 전송",
    definition:
      "SFTP(SSH File Transfer Protocol)는 SSH의 암호화된 통로로 파일을 주고받는 통신 규약으로, 기본 포트는 SSH와 같은 22입니다.",
    why: "시스템 사이에 파일을 암호화해 안전하게 보냅니다.",
    compare: "SFTP는 이름과 달리 FTP를 확장한 것이 아니라 SSH의 하위 기능으로 동작하는 별도 규약입니다.",
    aliases: ["sshftp", "에스에프티피"],
  },
  {
    term: "SMTP",
    fullName: "간이 우편 전송 프로토콜(Simple Mail Transfer Protocol)",
    category: "프로토콜 / 메일",
    definition:
      "SMTP(Simple Mail Transfer Protocol)는 메일 서버끼리 또는 프로그램이 메일 서버로 전자우편을 보낼 때 쓰는 통신 규약으로, 기본 포트는 25(제출용 587)입니다.",
    why: "시스템이 알림·인증 메일을 보낼 때 씁니다.",
    compare: "SMTP는 메일을 보내는 규약이고, 받은 메일을 읽는 데는 IMAP·POP3를 씁니다.",
    aliases: ["메일발송", "25포트", "587포트"],
  },
  {
    term: "LDAP",
    fullName: "경량 디렉터리 접근 프로토콜(Lightweight Directory Access Protocol)",
    category: "프로토콜 / 디렉터리",
    definition:
      "LDAP(Lightweight Directory Access Protocol)는 사용자·조직 정보를 모아 둔 디렉터리 서비스를 조회하고 인증하는 통신 규약으로, 기본 포트는 389(TLS 636)입니다.",
    why: "여러 시스템이 한곳에 모아 둔 계정 정보를 함께 조회해 로그인에 쓰게 합니다.",
    compare: "LDAP는 디렉터리에 접근하는 통신 규약이고, 디렉터리 서버는 그 규약으로 조회되는 계정·조직 정보 저장소입니다.",
    aliases: ["ldaps", "엘댑"],
  },
  {
    term: "SNMP",
    fullName: "간이 망 관리 프로토콜(Simple Network Management Protocol)",
    category: "프로토콜 / 장비 관리",
    definition:
      "SNMP(Simple Network Management Protocol)는 관리 서버가 장비의 상태 값을 읽고 장비가 이상을 알리는 통신 규약으로, 기본 포트는 UDP 161(알림 162)입니다.",
    why: "제조사가 다른 장비들의 상태를 한 가지 방식으로 모아 모니터링합니다.",
    compare: "SNMP 조회는 관리 서버가 장비에 값을 물어보는 것이고, 트랩(알림)은 장비가 먼저 이상을 알리는 것입니다.",
    aliases: ["snmptrap", "161포트", "에스엔엠피"],
  },
  {
    term: "NTP",
    fullName: "네트워크 시간 프로토콜(Network Time Protocol)",
    category: "프로토콜 / 시간 동기화",
    definition:
      "NTP(Network Time Protocol)는 서버와 장비의 시계를 기준 시간 서버에 맞추는 통신 규약으로, 기본 포트는 UDP 123입니다.",
    why: "서버마다 시간이 다르면 로그 순서가 어긋나고 인증·거래가 실패할 수 있어 모든 서버의 시간을 맞춥니다.",
    compare: "NTP는 시간을 맞추는 규약이고, NTP 서버(타임 서버)는 기준 시간을 알려 주는 서버입니다.",
    aliases: ["시간동기화", "123포트"],
  },

  // ── 망·보안 · 클라우드 서비스 ──
  {
    term: "물리적 망분리",
    fullName: "물리적 망분리 (Physical Network Separation)",
    category: "네트워크 / 보안",
    definition:
      "물리적 망분리는 업무용 PC와 인터넷용 PC를 따로 두는 것처럼 내부망에 쓰는 단말과 장비를 외부망과 물리적으로 나누는 망분리 방식입니다.",
    why: "두 망이 단말과 장비를 함께 쓰지 않아 외부망의 침해가 내부망으로 넘어올 경로를 줄일 수 있습니다.",
    compare: "물리적 망분리는 PC를 두 대 쓰고, 논리적 망분리는 PC 한 대에서 가상화 기술로 내부망용과 외부망용 영역을 나눕니다.",
    aliases: ["물리망분리", "2pc망분리", "물리적분리"],
  },
  {
    term: "논리적 망분리",
    fullName: "논리적 망분리 (Logical Network Separation)",
    category: "네트워크 / 보안",
    definition:
      "논리적 망분리는 PC 한 대에서 가상화 기술 등으로 내부망에 접속하는 영역과 외부망에 접속하는 영역을 논리적으로 나누는 망분리 방식입니다.",
    why: "PC와 회선을 추가로 들이지 않고도 업무망과 인터넷망을 나눌 수 있습니다.",
    compare: "논리적 망분리는 가상화로 PC 한 대를 나눠 쓰고, 물리적 망분리는 업무용 PC와 인터넷용 PC를 따로 둡니다.",
    aliases: ["논리망분리", "가상화망분리", "논리적분리"],
  },
  {
    term: "VDI",
    fullName: "가상 데스크톱 인프라 (Virtual Desktop Infrastructure)",
    category: "인프라 / 보안",
    definition:
      "VDI(Virtual Desktop Infrastructure)는 중앙 서버의 가상 머신에서 사용자별 데스크톱을 실행하고 사용자는 네트워크로 접속해 쓰는 방식입니다.",
    why: "자료가 사용자 PC가 아니라 서버에 남아 유출 위험이 줄고, 어디서 접속해도 같은 업무 환경을 쓸 수 있습니다.",
    compare: "VDI는 사용자마다 가상 PC를 하나씩 주고, SBC는 서버 한 대의 운영체제를 여러 사용자가 세션으로 나눠 씁니다.",
    aliases: ["가상데스크톱", "데스크톱가상화", "virtualdesktopinfrastructure"],
  },
  {
    term: "ZTNA",
    fullName: "제로 트러스트 네트워크 액세스 (Zero Trust Network Access)",
    category: "보안 / 네트워크",
    definition:
      "ZTNA(Zero Trust Network Access)는 사용자 신원과 접속 상황을 확인한 뒤 망 전체가 아니라 허용된 애플리케이션에만 접근시키는 원격 접속 기술입니다.",
    why: "원격 근무자나 협력사가 필요한 시스템만 쓰게 하고 나머지 내부 망은 보이지 않게 할 수 있습니다.",
    compare: "VPN은 접속하면 내부 망 구간에 들어오게 하고, ZTNA는 애플리케이션 단위로만 접근을 허용합니다.",
    aliases: ["zerotrustnetworkaccess", "제로트러스트네트워크접근", "ztna게이트웨이"],
  },
  {
    term: "DDoS 방어 장비",
    fullName: "분산 서비스 거부 공격 방어 장비 (Anti-DDoS)",
    category: "보안",
    definition:
      "DDoS 방어 장비는 여러 호스트를 동원해 서비스를 마비시키는 분산 서비스 거부 공격의 통신을 가려내 걸러 내는 장비 또는 서비스입니다.",
    why: "대량의 공격 통신이 몰려도 정상 사용자의 요청은 계속 처리할 수 있습니다.",
    compare: "DDoS 방어 장비는 양으로 밀어붙이는 공격을 걸러 내고, WAF는 웹 요청 내용에 담긴 공격을 걸러 냅니다.",
    aliases: ["antiddos", "ddos차단장비", "ddos대응장비", "디도스방어", "ddosprotection"],
  },
  {
    term: "차세대 방화벽",
    fullName: "차세대 방화벽 (Next-Generation Firewall, NGFW)",
    category: "네트워크 / 보안",
    definition:
      "차세대 방화벽(NGFW)은 주소·포트뿐 아니라 애플리케이션·사용자·콘텐츠를 식별해 통제하고 침입 방지 기능까지 갖춘 방화벽입니다.",
    why: "같은 포트를 쓰는 여러 애플리케이션을 구분해 허용하거나 막을 수 있습니다.",
    compare: "차세대 방화벽은 모든 종류의 통신을 대상으로 하고, 웹 방화벽(WAF)은 웹 서버 앞에서 HTTP 요청에 담긴 공격만 전문으로 막습니다.",
    aliases: ["ngfw", "nextgenerationfirewall", "l7방화벽"],
  },
  {
    term: "프록시",
    fullName: "프록시 서버 (Proxy Server)",
    category: "네트워크 / 보안",
    definition:
      "프록시는 클라이언트와 서버 사이에서 통신과 부가 기능을 대신 중계하는 장치 또는 프로그램입니다.",
    why: "사내 PC의 인터넷 접속을 한곳으로 모아 접속 기록을 남기고 위험한 사이트를 막을 수 있습니다.",
    compare: "프록시(포워드 프록시)는 내부 사용자를 대신해 밖으로 나가고, 리버스 프록시는 내부 서버를 대신해 밖의 요청을 받습니다.",
    aliases: ["proxy", "포워드프록시", "forwardproxy", "웹프록시", "프록시서버"],
  },
  {
    term: "리버스 프록시",
    fullName: "리버스 프록시 (Reverse Proxy)",
    category: "네트워크",
    definition:
      "리버스 프록시는 외부 클라이언트의 요청을 내부 서버 대신 받아 알맞은 서버로 넘기고 응답을 되돌려 주는 중계 서버입니다.",
    why: "내부 서버 주소를 감추고 암호화 처리, 캐시, 요청 분산을 한곳에서 맡을 수 있습니다.",
    compare: "리버스 프록시는 서버 쪽을 대신하고, 포워드 프록시는 사용자 쪽을 대신합니다.",
    aliases: ["reverseproxy", "역방향프록시"],
  },
  {
    term: "MPLS",
    fullName: "다중 프로토콜 레이블 스위칭 (Multiprotocol Label Switching)",
    category: "네트워크",
    definition:
      "MPLS(Multiprotocol Label Switching)는 패킷이 망에 들어올 때 짧은 레이블을 붙이고 이후에는 그 레이블만 보고 전달하는 기술입니다.",
    why: "중간 장비가 패킷의 주소를 다시 분석하지 않고 레이블만으로 다음 경로를 정할 수 있습니다.",
    compare: "MPLS는 레이블로 패킷을 전달하는 기술이고, SD-WAN은 MPLS·인터넷 등 여러 회선 위에서 소프트웨어로 경로를 고르는 방식입니다.",
    aliases: ["multiprotocollabelswitching", "mplsvpn", "엠피엘에스"],
  },
  {
    term: "SD-WAN",
    fullName: "소프트웨어 정의 광역 통신망 (Software-Defined Wide Area Network)",
    category: "네트워크",
    definition:
      "SD-WAN(Software-Defined WAN)은 MPLS·인터넷 등 여러 회선을 함께 쓰면서 중앙 정책에 따라 애플리케이션 통신의 경로를 소프트웨어로 정하는 광역 통신망 기술입니다.",
    why: "비싼 MPLS 회선에만 기대지 않고 여러 회선을 섞어 쓰면서 망 전체를 중앙에서 관리할 수 있습니다.",
    compare: "SD-WAN은 여러 회선 위에서 경로를 고르는 방식이고, MPLS·광대역 인터넷은 그 아래에서 통신을 실어 나르는 수단입니다.",
    aliases: ["softwaredefinedwan", "소프트웨어정의wan"],
  },
  {
    term: "GSLB",
    fullName: "글로벌 서버 부하 분산 (Global Server Load Balancing)",
    category: "네트워크",
    definition:
      "GSLB(Global Server Load Balancing)는 DNS 응답을 이용해 사용자를 여러 지역의 데이터센터 가운데 상태와 위치가 알맞은 곳으로 보내는 부하 분산 방식입니다.",
    why: "한 데이터센터에 장애가 나도 다른 지역으로 사용자를 돌려 서비스를 이어 갈 수 있습니다.",
    compare: "일반 로드밸런서는 한 데이터센터 안의 서버들에 요청을 나누고, GSLB는 데이터센터나 리전 사이에서 나눕니다.",
    aliases: ["globalserverloadbalancing", "글로벌로드밸런싱", "dns기반부하분산"],
  },
  {
    term: "Anycast",
    fullName: "애니캐스트 (Anycast)",
    category: "네트워크",
    definition:
      "Anycast는 같은 서비스 주소를 여러 지점에서 함께 쓰고, 그 주소로 보낸 통신이 라우팅에 따라 그 가운데 한 지점으로 전달되게 하는 방식입니다.",
    why: "DNS처럼 여러 지점에 흩어 둔 서비스가 주소 하나로 요청을 나눠 받아 가용성을 높일 수 있습니다.",
    compare: "Anycast는 라우팅으로 가까운 지점을 고르고, GSLB는 DNS 응답으로 지점을 고릅니다.",
    aliases: ["애니캐스트", "anycastip", "애니캐스트라우팅"],
  },
  {
    term: "백본",
    fullName: "백본 네트워크 (Backbone Network)",
    category: "네트워크",
    definition:
      "백본(Backbone)은 계층 구조로 이루어진 네트워크에서 여러 하위 네트워크를 서로 이어 주는 중심 구간의 네트워크입니다.",
    why: "층별·건물별·지점별 네트워크가 중심 구간 하나를 통해 서로 통신할 수 있습니다.",
    compare: "백본은 중심 구간 전체를 가리키고, 백본 스위치는 그 구간에 놓인 중심 장비를 가리킵니다.",
    aliases: ["backbone", "백본망", "기간망", "코어망"],
  },
  {
    term: "OOB 관리망",
    fullName: "대역 외 관리망 (Out-of-Band Management Network)",
    category: "네트워크 / 운영",
    definition:
      "OOB 관리망은 서비스 통신이 지나가는 망과 분리된 별도 통신 경로로 서버와 네트워크 장비를 관리하는 전용 망입니다.",
    why: "서비스 망에 장애나 공격이 생겨도 장비에 접속해 조치할 수 있습니다.",
    compare: "OOB 관리는 별도 망으로 장비에 접속하고, 인밴드 관리는 서비스 통신과 같은 망으로 접속합니다.",
    aliases: ["outofband", "oob", "대역외관리", "관리전용망", "ipmi망", "ilo망"],
  },
  {
    term: "랜딩 존",
    fullName: "랜딩 존 (Landing Zone)",
    category: "클라우드 / 아키텍처",
    definition:
      "랜딩 존은 보안·규정 준수 모범 사례에 따라 여러 계정(구독)과 공통 자원을 미리 갖춰 둔 클라우드 기본 환경입니다.",
    why: "새 업무를 올릴 때마다 계정과 망, 보안 설정을 처음부터 만들지 않고 같은 기준으로 시작할 수 있습니다.",
    compare: "랜딩 존은 여러 계정과 네트워크를 아우르는 전체 기반이고, VPC는 그 안의 네트워크 한 단위입니다.",
    aliases: ["landingzone", "azure랜딩존", "멀티계정환경"],
  },
  {
    term: "인증서",
    fullName: "공개 키 인증서 (Public Key Certificate, X.509 Certificate)",
    category: "보안 / 암호",
    definition:
      "인증서는 공개 키가 특정 서버나 사용자 것임을 인증 기관이 전자 서명으로 보증한 전자 문서입니다.",
    why: "접속한 사이트나 상대 시스템이 가짜가 아님을 확인하고 암호화 통신을 시작할 수 있습니다.",
    compare: "인증서는 공개해도 되는 증명서이고, 개인 키는 소유자만 가지고 있어야 하는 비밀 값입니다.",
    aliases: ["certificate", "공개키인증서", "ssl인증서", "tls인증서", "x509"],
  },
  {
    term: "mTLS",
    fullName: "상호 TLS (Mutual TLS)",
    category: "보안 / 네트워크",
    definition:
      "mTLS(Mutual TLS)는 TLS 연결에서 서버뿐 아니라 클라이언트도 인증서를 제시해 양쪽이 서로를 인증하는 방식입니다.",
    why: "서비스끼리 통신할 때 허가된 상대인지 양쪽 모두 확인할 수 있습니다.",
    compare: "일반 TLS는 서버만 인증서로 확인하고, mTLS는 클라이언트도 인증서로 확인합니다.",
    aliases: ["mutualtls", "상호tls", "양방향tls"],
  },
  {
    term: "SOAR",
    fullName: "보안 오케스트레이션·자동화·대응 (Security Orchestration, Automation and Response)",
    category: "보안 / 운영",
    definition:
      "SOAR는 여러 보안 도구를 연결해 경보가 발생했을 때 미리 정한 대응 절차를 자동으로 실행하고 사건 처리 과정을 관리하는 보안 운영 도구입니다.",
    why: "반복되는 경보 확인과 차단 작업을 자동화해 대응 시간을 줄일 수 있습니다.",
    compare: "SOAR는 대응을 자동화하고, SIEM은 대응의 출발점이 되는 경보를 만들어 냅니다.",
    aliases: ["securityorchestrationautomationandresponse", "보안자동화대응", "보안오케스트레이션"],
  },
  {
    term: "EDR",
    fullName: "엔드포인트 탐지 및 대응 (Endpoint Detection and Response)",
    category: "보안 / 운영",
    definition:
      "EDR(Endpoint Detection and Response)은 PC와 서버 같은 단말의 동작을 계속 수집·분석해 위협을 찾아내고 격리 같은 대응을 하게 해 주는 보안 도구입니다.",
    why: "백신이 놓친 공격도 단말에서 일어난 행위 기록으로 찾아내고 조사할 수 있습니다.",
    compare: "백신은 알려진 악성 파일을 막는 데 초점이 있고, EDR은 단말의 행위를 기록해 탐지와 사후 조사를 돕습니다.",
    aliases: ["endpointdetectionandresponse", "엔드포인트탐지대응", "단말탐지대응"],
  },
  {
    term: "DLP",
    fullName: "데이터 유출 방지 (Data Loss Prevention)",
    category: "보안 / 데이터",
    definition:
      "DLP(Data Loss Prevention)는 사용 중인 데이터, 전송 중인 데이터, 저장된 데이터를 중앙에서 식별·감시·보호하는 기능 또는 시스템입니다.",
    why: "개인정보나 기밀 문서가 메일, 메신저, USB로 밖에 나가는 것을 찾아내 막을 수 있습니다.",
    compare: "DLP는 데이터가 나가는 통로를 감시해 막고, DRM은 문서 자체를 암호화해 나가더라도 못 열게 합니다.",
    aliases: ["datalossprevention", "데이터유출방지", "정보유출방지", "내부정보유출방지"],
  },
  {
    term: "DRM",
    fullName: "문서 보안 (Digital Rights Management, 기업 문서 암호화)",
    category: "보안 / 데이터",
    definition:
      "DRM은 문서 파일을 암호화하고 사용자별로 열람·편집·인쇄 권한을 정해 권한이 있는 사람만 그 문서를 쓸 수 있게 하는 문서 보안 기술입니다.",
    why: "문서가 회사 밖으로 나가더라도 권한이 없는 사람은 내용을 볼 수 없습니다.",
    compare: "DRM은 파일 자체에 보호를 걸고, DLP는 파일이 나가는 통로를 감시합니다.",
    aliases: ["digitalrightsmanagement", "문서보안", "문서암호화", "문서drm", "edrm"],
  },
  {
    term: "EC2",
    fullName: "Amazon Elastic Compute Cloud",
    category: "클라우드 / 가상 서버",
    definition:
      "EC2(Amazon Elastic Compute Cloud)는 AWS에서 필요한 사양의 가상 서버(인스턴스)를 만들어 쓰고 쓴 만큼 요금을 내는 서비스입니다.",
    why: "",
    compare: "",
    aliases: ["amazonec2", "ec2instance", "이씨투"],
  },
  {
    term: "EBS",
    fullName: "Amazon Elastic Block Store",
    category: "클라우드 / 블록 스토리지",
    definition:
      "EBS(Amazon Elastic Block Store)는 EC2 가상 서버에 디스크처럼 붙여 쓰는 AWS의 블록 스토리지 서비스입니다.",
    why: "",
    compare: "",
    aliases: ["amazonebs", "ebsvolume", "이비에스"],
  },
  {
    term: "EFS",
    fullName: "Amazon Elastic File System",
    category: "클라우드 / 파일 스토리지",
    definition:
      "EFS(Amazon Elastic File System)는 여러 서버가 NFS로 동시에 붙어 같은 파일을 읽고 쓰는 AWS의 관리형 파일 스토리지 서비스입니다.",
    why: "",
    compare: "",
    aliases: ["amazonefs", "이에프에스"],
  },
  {
    term: "EKS",
    fullName: "Amazon Elastic Kubernetes Service",
    category: "클라우드 / 관리형 쿠버네티스",
    definition:
      "EKS(Amazon Elastic Kubernetes Service)는 쿠버네티스의 관리 영역(컨트롤 플레인)을 AWS가 대신 운영해 주는 관리형 쿠버네티스 서비스입니다.",
    why: "",
    compare: "",
    aliases: ["amazoneks", "이케이에스"],
  },
  {
    term: "ECS",
    fullName: "Amazon Elastic Container Service",
    category: "클라우드 / 컨테이너 실행",
    definition:
      "ECS(Amazon Elastic Container Service)는 컨테이너로 만든 애플리케이션을 배포·관리·확장해 주는 AWS의 완전 관리형 컨테이너 오케스트레이션 서비스입니다.",
    why: "",
    compare: "",
    aliases: ["amazonecs", "이씨에스"],
  },
  {
    term: "Fargate",
    fullName: "AWS Fargate",
    category: "클라우드 / 서버리스 컨테이너",
    definition:
      "Fargate(AWS Fargate)는 ECS나 EKS의 컨테이너를 사용자가 서버를 관리하지 않고 실행하게 해 주는 AWS의 서버리스 컨테이너 실행 환경입니다.",
    why: "",
    compare: "",
    aliases: ["awsfargate", "파게이트"],
  },
  {
    term: "ElastiCache",
    fullName: "Amazon ElastiCache",
    category: "클라우드 / 관리형 캐시",
    definition:
      "ElastiCache(Amazon ElastiCache)는 Valkey·Memcached·Redis OSS 엔진의 인메모리 캐시를 AWS가 설치·운영해 주는 관리형 캐시 서비스입니다.",
    why: "",
    compare: "",
    aliases: ["amazonelasticache", "엘라스티캐시"],
  },
  {
    term: "CloudFront",
    fullName: "Amazon CloudFront",
    category: "클라우드 / CDN",
    definition:
      "CloudFront(Amazon CloudFront)는 사용자와 가까운 거점에서 콘텐츠를 대신 전달하는 AWS의 콘텐츠 전송 네트워크(CDN) 서비스입니다.",
    why: "",
    compare: "",
    aliases: ["amazoncloudfront", "클라우드프론트"],
  },
  {
    term: "Route 53",
    fullName: "Amazon Route 53",
    category: "클라우드 / DNS",
    definition:
      "Route 53(Amazon Route 53)은 도메인 이름을 IP 주소로 바꿔 주고 서버 상태에 따라 접속 경로를 바꿀 수 있는 AWS의 관리형 DNS 서비스입니다.",
    why: "",
    compare: "",
    aliases: ["route53", "amazonroute", "라우트53", "라우트"],
  },
  {
    term: "Amazon API Gateway",
    fullName: "Amazon API Gateway",
    category: "클라우드 / API 게이트웨이",
    definition:
      "Amazon API Gateway는 REST·HTTP·WebSocket API를 만들어 공개하고 인증·트래픽 관리·모니터링을 맡아 주는 AWS의 관리형 서비스입니다.",
    why: "",
    compare: "",
    aliases: ["awsapigateway", "api게이트웨이(aws)"],
  },
  {
    term: "CloudWatch",
    fullName: "Amazon CloudWatch",
    category: "클라우드 / 모니터링·로깅",
    definition:
      "CloudWatch(Amazon CloudWatch)는 AWS 자원의 지표와 로그를 모아 그래프로 보여 주고 조건에 맞으면 알림을 보내는 AWS의 모니터링 서비스입니다.",
    why: "",
    compare: "",
    aliases: ["amazoncloudwatch", "cloudwatchlogs", "클라우드워치"],
  },
];
