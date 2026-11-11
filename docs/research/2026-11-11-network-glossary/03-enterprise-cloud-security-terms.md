# 03. 기업·클라우드 망 구분과 망·보안 용어 조사

조사일: 2026-11-11. 범위: 일반 기업·클라우드·데이터센터 망 구분, 제로 트러스트, 망·보안 용어. 한국 공공·금융·의료·제어망 규정 해설은 뺐습니다.

근거 표기 규칙
- `[n]` = 6장 출처 번호. 이번 조사에서 본문을 직접 열어 확인한 것입니다.
- `[n·보조]` = 언론·업체·2차 자료. 공식 문서로 다시 확인해야 합니다.
- **미확인** = 정의 문장을 공식 출처와 대조하지 못했습니다. 널리 쓰이는 뜻으로 쓴 초안이니 데이터에 넣기 전에 확인이 필요합니다.

---

## 1. 요약

1. 클라우드 3사와 NCP 모두 서브넷을 "인터넷 게이트웨이로 가는 경로가 있느냐"로 퍼블릭/프라이빗으로 나눕니다. AWS는 여기에 "VPC 밖으로 가는 경로가 아예 없는" 격리 서브넷을 따로 정의합니다 [2][8][18].
2. 큰 조직의 클라우드는 망을 VPC 단위로 나눕니다. AWS 보안 참조 아키텍처는 인바운드·아웃바운드(이그레스)·검사 VPC를 네트워크 계정에 두고, Azure는 허브(방화벽·게이트웨이·배스천) + 스포크(업무) 구조를 권장합니다 [10][11].
3. 클라우드↔사내 연결(전용선·VPN·피어링·프라이빗 엔드포인트)은 모두 "공용 인터넷을 거치지 않는 사설 경로 + 방화벽·보안 그룹 통제" 방식입니다. 망연계 장비를 전제로 하지 않습니다 [5][6][12][13][14][15].
4. 그래서 지금 기본값 "내부↔외부 = 망연계"는 일반 기업·클라우드 구성도에서는 대부분 틀리게 나옵니다. 3장에 처리 방법 세 가지를 적었습니다(결정은 사용자 몫).
5. NIST SP 800-207은 "망 위치만으로 신뢰하지 않는다", "암묵적 신뢰 구역은 최대한 작게"를 원칙으로 둡니다. 다만 마이크로 세그멘테이션처럼 구역과 관문(PEP)을 두는 방식도 제로 트러스트 구현 방법으로 인정합니다. 망 등급을 "신뢰도"가 아니라 "노출·연결 방식 힌트"로 설명하는 편이 맞습니다 [1].
6. 망 종류 20개, 망 짝 규칙 15개, 용어 74개를 제안합니다. 용어 74개 가운데 근거에 "미확인"이 붙은 것은 27개(정의 전체 또는 비교 문장 일부)이고, 나머지 47개는 공식 출처 문구와 대조했습니다.
7. 확인하지 못한 것: 제로트러스트 가이드라인 2.0 원문(보도로만 확인), KT Cloud 현행 VPC 문서, 망분리·망연계의 국내 공식 정의 문구, NGFW·ZTNA·SOAR·EDR·DRM·GSLB의 표준 정의.

---

## 2. 망 종류 제안 표

기존 13개와 겹치지 않는 것만 적었습니다. 등급은 지금 모델(closed | internal | boundary | external)에 맞춘 제안입니다.

### 2.1 기업 사내 망

| key | name | aliases | description | grade | 근거 |
|---|---|---|---|---|---|
| `office-network` | 사무망 | OA망, 사내망, 임직원망, 오피스망 | 임직원 PC와 프린터 같은 사무 기기가 붙는 사내 망이에요. 보통 방화벽이나 프록시를 거쳐 인터넷을 쓸 수 있어요. | internal | 미확인(관행). 기존 "업무망"의 별칭으로만 넣는 방법도 있음 — 5장 참고 |
| `server-farm` | 서버팜 | 서버망, 서버존, 내부 서버 영역, 데이터센터 내부망 | 업무 시스템 서버와 DB를 모아 둔 망이에요. 사무망이나 인터넷에서 바로 들어오지 못하게 방화벽 뒤에 둬요. | internal | [21] 방화벽 보호 구간 설명. 명칭은 관행 |
| `guest-wireless` | 게스트·무선망 | 방문자 Wi-Fi, 게스트망, 손님용 무선랜, BYOD망 | 방문자나 개인 기기가 쓰는 무선 망이에요. 회사가 관리하지 않는 기기가 붙기 때문에 사내 망과 떼어 놓고 인터넷만 쓰게 해요. | external | [1] 2.2절 가정 2(회사 소유가 아닌 기기가 망에 있을 수 있음). 등급 판단은 제안 |
| `branch-wan` | 본사–지사 연결망 | WAN, 지사망, 거점 간 전용망, SD-WAN 구간 | 본사와 지사, 데이터센터를 잇는 회사 전용 통신 구간이에요. 전용회선이나 MPLS, SD-WAN으로 만들어요. | internal | [29][33·보조] |
| `partner-access` | 협력사 접속망 | 외주 접속 구간, 파트너망, 엑스트라넷, B2B 연동 구간 | 협력사나 외주 인력이 정해진 시스템에만 들어오도록 따로 둔 접속 구간이에요. 접근제어 솔루션과 방화벽을 거치게 해요. | boundary | 미확인(관행) |
| `vdi-network` | VDI 망 | 가상 데스크톱 영역, VDI존, 데스크톱 가상화 영역 | 서버에서 돌아가는 가상 PC들이 모여 있는 망이에요. 사용자는 화면만 받아 보고 자료는 이 망 안에 남아요. | internal | [41·보조] |
| `remote-access` | 원격 접속 구간 | 재택근무 접속, VPN 접속 구간, ZTNA 접속 구간, 원격근무망 | 집이나 외부에서 일하는 임직원이 회사 시스템으로 들어오는 입구예요. VPN이나 ZTNA로 사용자와 기기를 확인한 뒤 통과시켜요. | boundary | [22][23][1] 3.1.3절 |

### 2.2 클라우드 망

| key | name | aliases | description | grade | 근거 |
|---|---|---|---|---|---|
| `cloud-public-subnet` | 퍼블릭 서브넷 | Public Subnet, 공개 서브넷, 퍼블릭 영역 | 인터넷 게이트웨이로 가는 길이 있는 클라우드 서브넷이에요. 로드밸런서나 NAT 게이트웨이처럼 인터넷과 맞닿는 자원을 둬요. | boundary | [2][8][18] |
| `cloud-private-subnet` | 프라이빗 서브넷 | Private Subnet, 사설 서브넷, 프라이빗 영역 | 인터넷 게이트웨이로 가는 길이 없는 클라우드 서브넷이에요. 밖으로 나갈 때는 NAT 게이트웨이를 거치고, 밖에서 먼저 들어올 수는 없어요. | internal | [2][7][18] |
| `cloud-isolated-subnet` | 격리 서브넷 | Isolated Subnet, 데이터 서브넷, DB 서브넷, 폐쇄 서브넷 | VPC 밖으로 나가는 길이 아예 없는 서브넷이에요. 같은 VPC 안의 자원끼리만 통신해서 주로 DB를 둬요. | internal | [2] |
| `cloud-transit-hub` | 전송 허브 | Transit Gateway, 허브 VPC, 허브 가상 네트워크, 커넥티비티 허브, Transit Hub | 여러 VPC와 사내 망을 한곳에서 이어 주는 클라우드의 중앙 연결 지점이에요. 망끼리 오가는 길을 여기서 정해요. | boundary | [4][10][11] |
| `cloud-shared-services` | 공유 서비스 VPC | Shared Services VPC, 공용 서비스 영역, 공유 VPC, 플랫폼 영역 | 여러 업무 VPC가 함께 쓰는 DNS, 인증, 모니터링 같은 공통 기능을 모아 둔 VPC예요. | internal | [11] 허브·공유 서비스 설명, [16] |
| `cloud-inspection` | 검사 VPC | Inspection VPC, 보안 검사 영역, 방화벽 VPC | VPC 사이, 인터넷, 사내 망으로 오가는 통신을 한곳에서 검사하는 전용 VPC예요. 다른 업무 서버는 두지 않아요. | boundary | [10] |
| `cloud-egress` | 이그레스 VPC | Egress VPC, 아웃바운드 VPC, 중앙 인터넷 출구, 중앙 NAT 영역 | 여러 VPC가 인터넷으로 나갈 때 함께 쓰는 출구 VPC예요. NAT 게이트웨이와 방화벽을 여기에 모아 둬요. | boundary | [9][10] |
| `cloud-ingress` | 인그레스 VPC | Ingress VPC, 인바운드 VPC, 중앙 인터넷 입구 | 밖에서 시작된 접속을 받아 검사하고 안쪽으로 넘겨 주는 입구 VPC예요. | boundary | [10] |
| `hybrid-link` | 하이브리드 연결 구간 | 전용선 구간, Direct Connect, ExpressRoute, Cloud Interconnect, 사이트 간 VPN | 사내 데이터센터와 클라우드를 잇는 사설 연결 구간이에요. 전용선이나 VPN으로 만들고 공용 인터넷을 거치지 않게 해요. | boundary | [6][13][15] |
| `on-premises-dc` | 사내 데이터센터 | 온프레미스, IDC, 자체 전산실, 기존 전산망 | 회사가 직접 운영하는 전산실이나 데이터센터예요. 클라우드와 함께 쓰는 구성에서 한쪽 끝이 돼요. | internal | [6][11] cross-premises 설명 |

### 2.3 데이터센터 망

| key | name | aliases | description | grade | 근거 |
|---|---|---|---|---|---|
| `service-network` | 서비스망 | 서비스 네트워크, 운영망, 프로덕션망, 데이터망 | 사용자 요청과 응답이 실제로 오가는 망이에요. 관리용·백업용 통신과 섞이지 않게 따로 둬요. | internal | 미확인(관행) |
| `storage-network` | 스토리지망 | SAN, 스토리지 전용망, iSCSI망, FC망 | 서버와 저장 장치 사이에서 데이터를 주고받는 전용 망이에요. 일반 서비스 통신과 분리해요. | internal | [37·보조] SNIA 사전 |
| `cluster-interconnect` | 클러스터 인터커넥트 | 하트비트망, 클러스터 내부망, 프라이빗 인터커넥트, RAC 인터커넥트 | 한 묶음으로 동작하는 서버들끼리 상태 확인과 동기화를 주고받는 전용 망이에요. 다른 망과는 잇지 않아요. | closed | 미확인(관행) |

기존 항목 보강 제안
- **관리망**: aliases에 `OOB`, `대역 외 관리망`, `Out-of-Band`, `iLO/IPMI망` 추가. NIST 용어집은 out of band를 "별도 통신 채널로 전송되는 정보"로 정의합니다 [20].
- **백업망**: aliases에 `백업 전용망`, `Backup LAN` 추가(근거 미확인, 관행).
- **민간 클라우드**: 구성도 하나가 통째로 클라우드 안일 때는 위 `cloud-*` 영역으로 나눠 붙이고, 사내 구성도에서 바깥의 한 덩어리로 보일 때만 "민간 클라우드"를 쓰는 식으로 설명을 구분하면 헷갈리지 않습니다.

---

## 3. 망 짝 규칙 제안 표

등급 기본값(폐쇄↔모두 = 잇지 않음, 내부↔외부 = 망연계, 그 밖 = 방화벽)과 **다른 경우만** 적었습니다. 기존 key는 한국어 이름으로 적었습니다.

| a | b | method | note | 근거 |
|---|---|---|---|---|
| `office-network` | 인터넷망 | firewall | 일반 기업은 사무망에서 방화벽·프록시를 거쳐 인터넷을 쓰는 구성이 보통이에요. 망분리 의무가 있는 조직만 망연계가 필요해요. | [21] 방화벽 정의(보안 수준이 다른 망 사이 통제). 망분리 의무 범위는 다른 조사 참고 |
| `server-farm` | 인터넷망 | none | 서버팜은 인터넷과 바로 잇지 않고 DMZ를 거쳐요. | [21] 3장 DMZ 구성 |
| `guest-wireless` | `office-network` | none | 게스트망은 사내 망과 잇지 않고 인터넷만 쓰게 해요. | [1] 2.2절(관리되지 않는 기기). 구체 구성은 관행 |
| `guest-wireless` | `server-farm` | none | 위와 같아요. | 위와 같음 |
| `cloud-private-subnet` | 인터넷망 | firewall | 프라이빗 서브넷은 NAT 게이트웨이를 거쳐 밖으로 나가는 통신만 할 수 있어요. 밖에서 먼저 들어올 수는 없어요. | [2][7] |
| `cloud-isolated-subnet` | 인터넷망 | none | 격리 서브넷에는 VPC 밖으로 나가는 경로가 없어요. | [2] |
| `cloud-isolated-subnet` | `cloud-public-subnet` | none | DB가 있는 격리 서브넷은 퍼블릭 서브넷과 바로 잇지 않고 프라이빗 서브넷의 애플리케이션을 거쳐요. | 관행(3계층 구성). AWS는 계층별 서브넷 분리만 권고 [3] |
| `cloud-shared-services` | 인터넷망 | firewall | 공유 서비스 VPC는 이그레스 VPC나 허브의 방화벽을 거쳐 인터넷으로 나가요. | [9][10][11] |
| `on-premises-dc` | 민간 클라우드 | firewall | 사내 데이터센터와 클라우드는 전용선이나 VPN으로 잇고 방화벽·보안 그룹으로 통제해요. 망연계 장비는 쓰지 않는 게 보통이에요. | [6][13][15] |
| 업무망 | 민간 클라우드 | firewall | 일반 기업에서는 업무망과 클라우드를 전용선·VPN과 방화벽으로 이어요. (공공기관 규정이 걸리면 다른 조사의 규칙이 우선) | [6][13][15] |
| `office-network` | 민간 클라우드 | firewall | 위와 같아요. SaaS 접속은 프록시나 방화벽을 거쳐요. | 위와 같음 |
| `storage-network` | 인터넷망 | none | 스토리지망은 서버와 저장 장치 사이에서만 쓰고 외부와 잇지 않아요. | [37·보조] SAN 정의. 연결 금지는 관행 |
| `storage-network` | DMZ | none | 위와 같아요. | 위와 같음 |
| 관리망 | 인터넷망 | none | 장비 관리용 망은 인터넷과 바로 잇지 않아요. 원격 관리는 배스천이나 VPN을 거쳐요. | [20] out of band 정의. 연결 금지는 관행. 기존 규칙과 겹치면 생략 |
| 개발·테스트망 | 인터넷망 | firewall | 일반 기업의 개발망은 라이브러리 내려받기 등을 위해 방화벽을 거쳐 인터넷을 써요. | 관행(출처 미확인). 공공·금융은 다름 |

### "내부↔외부 = 망연계"가 과한 경우를 다루는 방법 (의견)

배경: 클라우드 사업자 문서와 NIST 방화벽 지침 어디에도 내부–외부 연결에 망연계(자료 전송 통제 장비)를 기본으로 두는 설명은 없습니다. 프라이빗 서브넷→NAT 게이트웨이→인터넷, 사내→전용선→클라우드가 표준 구성입니다 [2][6][7][21]. 망연계는 망분리 의무가 있는 조직에서만 기본값이 됩니다. 한국에서도 개인정보 안전성 확보조치 기준이 2025-10-31 시행 개정으로 인터넷망 차단을 일률 적용에서 위험 기반으로 바꿨다는 보도가 있습니다 [38·보조].

선택지(코드에 넣기 전에 사용자가 골라야 합니다)

| 방법 | 내용 | 장점 | 단점 |
|---|---|---|---|
| A. 짝 규칙으로만 덮기 | 기본값은 그대로 두고 위 표처럼 예외를 줄줄이 추가 | 구조 변경 없음 | 새 망 종류를 넣을 때마다 예외를 써야 하고 빠뜨리면 "망연계 필요"가 잘못 뜸 |
| B. 구성도 단위 "적용 기준" 두기 | 구성도(또는 조직)에 `공공·금융·제어(망분리 적용)` / `일반 기업·클라우드` 값을 두고, 뒤쪽이면 내부↔외부 기본값을 firewall로 바꿈 | 규칙 표가 작아지고 설명이 쉬움 | 데이터 모양에 필드가 하나 늘어남. 한 구성도에 두 기준이 섞이면 애매함 |
| C. 망 종류에 "망분리 대상" 속성 두기 | 행정망·금융 전산망·제어망 등에만 `separated: true`를 주고, 둘 중 하나라도 true일 때만 내부↔외부 = 망연계 | 한 구성도에 공공망과 클라우드가 섞여도 맞게 나옴 | 망 종류마다 값을 정해야 함 |

조사 결과만 보면 C가 사업자 문서의 구분과 가장 잘 맞습니다(망연계가 필요한 이유가 "외부라서"가 아니라 "그 망이 분리 대상이라서"이기 때문). 다만 공공기관 규정 쪽 조사 결과와 맞춰 본 뒤 정해야 합니다.

같이 볼 한계: `method`에 "직접 연결(통제 장비 없음)"이 없습니다. 서버팜↔스토리지망, 서비스망↔백업망처럼 같은 서버의 다른 랜카드로 붙는 망은 방화벽도 망연계도 아니어서 지금 값으로는 표현이 안 됩니다.

### 제로 트러스트가 망 등급 모델에 주는 시사점

NIST SP 800-207에서 확인한 내용 [1]
- 2.1절 원칙 2: "All communication is secured regardless of network location. Network location alone does not imply trust." 사내 망 안에서 온 요청도 밖에서 온 요청과 같은 보안 요구를 충족해야 합니다.
- 2.2절 가정 1: "The entire enterprise private network is not considered an implicit trust zone." 가정 4: 회사 자원이 모두 회사 소유 인프라에 있지는 않습니다(원격 근무자, 클라우드).
- 2장: 암묵적 신뢰 구역(implicit trust zone)은 마지막 PDP/PEP 관문을 지난 뒤의 영역이고, "가능한 한 작아야" 합니다. 제로 트러스트는 PDP/PEP를 자원 가까이로 옮기는 원칙입니다.
- 3.1절 구현 방식 세 가지: 강화된 신원 거버넌스(3.1.1), 마이크로 세그멘테이션(3.1.2, 자원을 개별 망 구간에 두고 관문 장비로 보호), 네트워크 인프라·SDP(3.1.3).
- 2.1절 머리말: 제로 트러스트 정의 대부분이 여전히 마이크로 세그멘테이션 같은 "경계"와의 관계로 스스로를 설명한다고 적습니다. 즉 경계 개념이 사라지는 것이 아니라 작아지고 자원 쪽으로 옮겨 갑니다.

한국 제로트러스트 가이드라인 2.0 (2024-12-03 과기정통부·KISA 공개, 보도로만 확인 [36·보조])
- 기업망 핵심 요소 6가지: 식별자, 기기·엔드포인트, 네트워크, 시스템, 애플리케이션·워크로드, 데이터.
- 성숙도 4단계: 기존 → 초기 → 향상 → 최적화(1.0의 3단계에 '초기'가 추가).
- 원문을 열지 못해 세부 원칙·역량 목록은 **미확인**입니다.

도구에 주는 시사점(의견)
1. 등급 이름과 설명에서 "믿을 수 있는 망"이라는 뉘앙스를 빼고 "어디까지 노출되는가, 무엇을 거쳐 연결하는가"로 설명하는 편이 원칙 2와 맞습니다.
2. 지금 기본값 "내부↔내부 = 방화벽"은 마이크로 세그멘테이션과 방향이 같으니 그대로 둬도 됩니다.
3. 원격 접속 구간, 협력사 접속망처럼 "사람과 기기를 확인하는 입구"는 망 등급보다 관문(PEP) 성격이 강합니다. `boundary` 등급 설명에 "사용자·기기를 확인하는 관문 구간"을 포함하면 ZTNA·SDP 구성도도 담을 수 있습니다.
4. 구성도에 정책 결정 지점(IAM·IdP)과 정책 시행 지점(게이트웨이·프록시·방화벽)이 있는지 표시하는 것은 망 등급과 별개의 축입니다. 등급 모델을 바꾸기보다 용어 사전(제로 트러스트, SDP, ZTNA, PEP/PDP)으로 먼저 받는 방법이 있습니다.
5. 제로 트러스트를 도입한 조직도 망 구간은 계속 그립니다. 등급 모델을 없앨 근거는 이번 조사에서 찾지 못했습니다.

---

## 4. 용어 사전 후보 (74개)

기존 50개와 겹치지 않게 골랐습니다. NAT 게이트웨이·프라이빗 서브넷처럼 기존 항목(NAT, 서브넷)의 하위 개념은 요청 목록에 있어 따로 넣었습니다. 웹 방화벽(WAF)과 차세대 방화벽의 차이는 "차세대 방화벽"의 compare에 넣었습니다.

### 4.1 망 분리·연계

**1. 망분리**
- fullName: 망분리 (Network Separation)
- category: 네트워크 / 보안
- definition: 망분리는 외부 인터넷에서 들어오는 침입과 내부 자료 유출을 막기 위해 업무용 망과 인터넷용 망을 서로 통신하지 못하게 나누는 보안 조치입니다.
- why: 인터넷에서 감염된 악성코드가 업무 시스템으로 번지거나 내부 자료가 밖으로 나가는 길을 끊을 수 있습니다.
- compare: 망분리는 두 망을 끊는 조치이고, 망연계는 끊어 놓은 두 망 사이에 허용된 자료만 넘기는 통로입니다.
- aliases: 망 분리, 네트워크 분리, 인터넷망 차단, 업무망·인터넷망 분리
- 근거: [38·보조][39·보조]. 국내 고시·해설서의 정의 문구는 **미확인**

**2. 물리적 망분리**
- fullName: 물리적 망분리 (Physical Network Separation)
- category: 네트워크 / 보안
- definition: 물리적 망분리는 업무용과 인터넷용으로 PC와 통신 회선, 네트워크 장비를 각각 따로 두어 두 망을 물리적으로 나누는 방식입니다.
- why: 두 망이 장비를 공유하지 않아 한쪽의 침해가 다른 쪽으로 넘어갈 경로가 가장 적습니다.
- compare: 물리적 망분리는 장비를 두 벌 두고, 논리적 망분리는 한 장비에서 가상화 기술로 영역을 나눕니다.
- aliases: 물리 망분리, 2PC 망분리, 물리적 분리
- 근거: [39·보조]. 공식 정의 **미확인**

**3. 논리적 망분리**
- fullName: 논리적 망분리 (Logical Network Separation)
- category: 네트워크 / 보안
- definition: 논리적 망분리는 장비를 두 벌 두지 않고 가상화 기술로 업무 영역과 인터넷 영역을 나누어 서로 통신하지 못하게 하는 방식입니다.
- why: PC와 회선을 추가로 들이지 않고도 업무망과 인터넷망을 나눌 수 있습니다.
- compare: 논리적 망분리는 서버에서 가상 PC를 돌리는 방식(VDI·SBC)과 PC 안에 가상 영역을 만드는 방식(CBC)으로 다시 나뉩니다.
- aliases: 논리 망분리, 가상화 망분리, 논리적 분리
- 근거: [39·보조]. 공식 정의 **미확인**

**4. 망연계**
- fullName: 망연계 (망간 자료전송, Network Interconnection Solution)
- category: 네트워크 / 보안
- definition: 망연계는 분리해 둔 보안 수준이 다른 두 망 사이에서 정해진 보안 정책에 맞는 자료만 검사해 넘겨 주는 장비 또는 체계입니다.
- why: 망을 분리한 상태를 유지하면서도 업무에 꼭 필요한 파일과 데이터는 주고받을 수 있습니다.
- compare: 방화벽은 두 망의 통신 연결 자체를 허용하거나 막고, 망연계는 직접 연결 없이 자료만 중계합니다.
- aliases: 망 연계, 망간 자료전송, 망연계 솔루션, 자료전송 시스템, 망간자료전송제품
- 근거: [43·보조]. 국내 가이드의 정의 문구는 **미확인**

**5. 일방향 전송 장비**
- fullName: 데이터 다이오드 (Data Diode, Unidirectional Gateway)
- category: 네트워크 / 보안
- definition: 일방향 전송 장비(데이터 다이오드)는 데이터가 한쪽 방향으로만 흐르도록 허용하는 네트워크 장비입니다.
- why: 제어 시스템 같은 중요한 망의 정보를 밖으로 내보내면서도 밖에서 들어오는 통신은 원천적으로 막을 수 있습니다.
- compare: 일방향 전송 장비는 한 방향 전송만 되고, 일반 망연계 장비는 정책에 따라 양쪽 방향 자료 전송을 중계합니다.
- aliases: 데이터 다이오드, 일방향 게이트웨이, 단방향 전송, Unidirectional Gateway, 일방향 망연계
- 근거: [20] data diode (출처 NIST SP 800-82r3 [24])

**6. CDS**
- fullName: 교차 도메인 솔루션 (Cross Domain Solution)
- category: 네트워크 / 보안
- definition: CDS(Cross Domain Solution)는 서로 다른 보안 영역 사이에서 수동 또는 자동으로 정보에 접근하거나 정보를 전송할 수 있게 하는 통제된 인터페이스입니다.
- why: 보안 등급이 다른 망끼리 정해진 규칙 안에서만 정보를 주고받게 할 수 있습니다.
- compare: CDS는 미국 정부·국방 분야 용어이고, 한국에서 말하는 망연계와 역할이 비슷합니다.
- aliases: Cross Domain Solution, 교차 도메인 솔루션, 크로스 도메인 솔루션
- 근거: [20] cross domain solution (CNSSI 4009-2022, SP 800-53 Rev.5). "망연계와 비슷"은 해석

**7. 에어갭**
- fullName: 에어갭 (Air Gap)
- category: 네트워크 / 보안
- definition: 에어갭은 두 시스템이 물리적으로 연결되어 있지 않고, 자료는 사람이 직접 통제하는 수동 방식으로만 옮길 수 있는 상태입니다.
- why: 네트워크를 통한 침입 경로를 아예 없앨 수 있습니다.
- compare: 에어갭은 연결이 전혀 없는 상태이고, 망연계나 일방향 전송은 통제된 연결 통로를 둔 상태입니다.
- aliases: Air Gap, 에어 갭, 완전 분리, 폐쇄망
- 근거: [20] air gap (CNSSI 4009-2022, RFC 4949)

**8. VDI**
- fullName: 가상 데스크톱 인프라 (Virtual Desktop Infrastructure)
- category: 인프라 / 보안
- definition: VDI(Virtual Desktop Infrastructure)는 데이터센터 서버의 가상 머신에서 사용자별 데스크톱 운영체제를 실행하고 그 화면을 네트워크로 사용자 기기에 전달하는 방식입니다.
- why: 자료가 사용자 PC가 아니라 서버에 남아 유출 위험이 줄고, 어디서 접속해도 같은 업무 환경을 쓸 수 있습니다.
- compare: VDI는 사용자마다 가상 PC를 하나씩 주고, SBC는 서버 한 대의 운영체제를 여러 사용자가 세션으로 나눠 씁니다.
- aliases: 가상 데스크톱, 데스크톱 가상화, Virtual Desktop Infrastructure, DaaS
- 근거: [41·보조] (Cisco·Azure·Google Cloud 설명 페이지의 검색 요약). 원문 미열람

**9. SBC**
- fullName: 서버 기반 컴퓨팅 (Server Based Computing)
- category: 인프라 / 보안
- definition: SBC(Server Based Computing)는 응용 프로그램 실행과 자료 저장을 중앙 서버에서 처리하고 사용자는 단말로 접속해 화면만 받아 쓰는 방식입니다.
- why: 프로그램과 자료가 서버에만 있어 관리와 유출 통제가 쉽습니다.
- compare: SBC는 서버 운영체제를 여러 사용자가 세션으로 함께 쓰고, VDI는 사용자마다 독립된 가상 PC를 씁니다.
- aliases: 서버 기반 컴퓨팅, Server Based Computing, 터미널 서비스, 세션 기반 데스크톱, RDS
- 근거: [39·보조]. VDI와의 구분은 자료마다 다름 — 5장 참고

### 4.2 제로 트러스트·접근 통제

**10. 제로 트러스트**
- fullName: 제로 트러스트 (Zero Trust, ZT)
- category: 보안 / 아키텍처
- definition: 제로 트러스트는 망이 이미 침해됐다고 보고, 망 위치만으로 신뢰하지 않으며 자원에 접근하는 요청마다 사용자와 기기를 확인해 최소 권한만 허용하는 보안 개념입니다.
- why: 사내 망에 한 번 들어온 공격자가 내부를 자유롭게 옮겨 다니는 것을 막을 수 있습니다.
- compare: 경계 보안은 망 안쪽을 믿고 바깥만 막고, 제로 트러스트는 안쪽 요청도 매번 검증합니다.
- aliases: Zero Trust, 제로트러스트, ZT, ZTA, 제로 트러스트 아키텍처
- 근거: [1] 2장 정의·2.1절 원칙, [20] zero trust architecture, [36·보조]

**11. SDP**
- fullName: 소프트웨어 정의 경계 (Software Defined Perimeter)
- category: 보안 / 네트워크
- definition: SDP(Software Defined Perimeter)는 사용자와 기기를 먼저 인증한 뒤에만 해당 자원으로 가는 연결을 소프트웨어로 만들어 주고, 그 전에는 망과 자원을 숨기는 접근 통제 구조입니다.
- why: 인증받지 않은 사람에게는 서비스가 보이지도 않아 공격 대상이 줄어듭니다.
- compare: SDP는 구조(컨트롤러와 접속·수락 호스트)를 가리키는 말이고, ZTNA는 그 구조를 쓰는 제품·서비스 분류를 가리키는 말로 주로 쓰입니다.
- aliases: Software Defined Perimeter, 소프트웨어 정의 경계, 소프트웨어 정의 페리미터
- 근거: [1] 3.1.3절, [34·보조] CSA SDP 명세 v2 소개 페이지(검색 요약)

**12. ZTNA**
- fullName: 제로 트러스트 네트워크 액세스 (Zero Trust Network Access)
- category: 보안 / 네트워크
- definition: ZTNA(Zero Trust Network Access)는 사용자 신원과 접속 상황을 확인한 뒤 망 전체가 아니라 허용된 애플리케이션에만 접근시키는 원격 접속 제품·서비스입니다.
- why: 원격 근무자나 협력사가 필요한 시스템만 쓰게 하고 나머지 내부 망은 보이지 않게 할 수 있습니다.
- compare: VPN은 접속하면 내부 망 구간에 들어오게 하고, ZTNA는 애플리케이션 단위로만 접근을 허용합니다.
- aliases: Zero Trust Network Access, 제로 트러스트 네트워크 접근, ZTNA 게이트웨이
- 근거: [40·보조] Gartner 정의의 2차 인용. Gartner 원문 **미확인**

**13. 마이크로 세그멘테이션**
- fullName: 마이크로 세그멘테이션 (Micro-Segmentation)
- category: 보안 / 네트워크
- definition: 마이크로 세그멘테이션은 자원을 하나씩 또는 작은 묶음으로 별도 망 구간에 두고 구간마다 관문 보안 장비로 접근을 통제하는 방식입니다.
- why: 한 서버가 뚫려도 같은 망의 다른 서버로 공격이 번지기 어렵습니다.
- compare: 일반 망 분할은 서브넷·VLAN처럼 큰 단위로 나누고, 마이크로 세그멘테이션은 서버나 워크로드 단위까지 잘게 나눕니다.
- aliases: Micro-Segmentation, 마이크로세그멘테이션, 초세분화, 워크로드 세분화
- 근거: [1] 3.1.2절

**14. 정책 결정 지점·정책 시행 지점**
- fullName: PDP (Policy Decision Point) · PEP (Policy Enforcement Point)
- category: 보안 / 아키텍처
- definition: PDP는 접근 요청을 허용할지 정책에 따라 판단하는 구성 요소이고, PEP는 그 판단대로 사용자와 자원 사이의 연결을 열거나 끊는 구성 요소입니다.
- why: 판단과 차단을 나누어 두면 모든 접근 요청에 같은 정책을 일관되게 적용할 수 있습니다.
- compare: PDP는 결정만 하고 통신은 지나가지 않으며, PEP는 실제 통신이 지나가는 관문입니다.
- aliases: PDP, PEP, 정책 결정 지점, 정책 시행 지점, Policy Decision Point, Policy Enforcement Point
- 근거: [1] 2장 그림 1 설명

**15. NAC**
- fullName: 네트워크 접근 제어 (Network Access Control)
- category: 네트워크 / 보안
- definition: NAC(Network Access Control)는 사용자 인증 결과와 기기의 보안 상태 점검 결과를 보고 그 기기를 네트워크에 붙여 줄지 정하는 기능 또는 장비입니다.
- why: 백신이 꺼져 있거나 허가받지 않은 기기가 사내 망에 붙는 것을 막을 수 있습니다.
- compare: 방화벽은 망과 망 사이의 통신을 통제하고, NAC는 기기가 망에 처음 붙는 순간을 통제합니다.
- aliases: Network Access Control, 네트워크 접근 제어, 네트워크 접근통제, 단말 접근 제어
- 근거: [20] network access control, [21] 2.1.7절·용어집 (원문은 "일부 방화벽이 제공하는 기능"으로 설명)

### 4.3 보안 장비

**16. IDS**
- fullName: 침입 탐지 시스템 (Intrusion Detection System)
- category: 보안
- definition: IDS(Intrusion Detection System)는 네트워크나 시스템에서 일어나는 일을 감시·분석해 침입 시도를 찾아내고 관리자에게 알리는 보안 시스템입니다.
- why: 방화벽을 통과한 공격이나 내부에서 일어나는 이상 행동을 알아챌 수 있습니다.
- compare: IDS는 탐지해서 알리기만 하고, IPS는 탐지한 공격을 차단까지 합니다.
- aliases: Intrusion Detection System, 침입 탐지 시스템, 침입탐지시스템
- 근거: [20] intrusion detection system (SP 800-12 Rev.1, SP 800-82r3, NISTIR 7711)

**17. IPS**
- fullName: 침입 방지 시스템 (Intrusion Prevention System)
- category: 보안
- definition: IPS(Intrusion Prevention System)는 침입 행위를 탐지하고, 그 행위가 목표에 닿기 전에 막으려고 시도하는 보안 시스템입니다.
- why: 알려진 공격 패턴이 담긴 통신을 사람이 개입하기 전에 자동으로 끊을 수 있습니다.
- compare: 방화벽은 주소와 포트 기준으로 허용 여부를 정하고, IPS는 통신 내용에서 공격 패턴을 찾아 막습니다.
- aliases: Intrusion Prevention System, 침입 방지 시스템, 침입차단시스템, IDPS
- 근거: [20] intrusion prevention system (SP 800-82r3, NISTIR 7711)

**18. DDoS 방어 장비**
- fullName: 분산 서비스 거부 공격 방어 장비 (Anti-DDoS)
- category: 보안
- definition: DDoS 방어 장비는 여러 호스트가 한꺼번에 몰려 서비스를 마비시키는 분산 서비스 거부 공격의 통신을 가려내 걸러 내는 장비 또는 서비스입니다.
- why: 대량의 공격 통신이 몰려도 정상 사용자의 요청은 계속 처리할 수 있습니다.
- compare: DDoS 방어 장비는 양으로 밀어붙이는 공격을 걸러 내고, WAF는 웹 요청 내용에 담긴 공격을 걸러 냅니다.
- aliases: Anti-DDoS, DDoS 차단 장비, DDoS 대응 장비, 디도스 방어, DDoS Protection
- 근거: [20] distributed denial of service(공격 정의), [10] AWS Shield 설명(계층 3·4 방어). 장비 정의 문구는 **미확인**

**19. 차세대 방화벽**
- fullName: 차세대 방화벽 (Next-Generation Firewall, NGFW)
- category: 네트워크 / 보안
- definition: 차세대 방화벽(NGFW)은 주소·포트 기준 통제에 더해 애플리케이션 식별과 침입 방지 기능을 함께 갖추고 통신 내용까지 검사하는 방화벽입니다.
- why: 같은 포트를 쓰는 여러 애플리케이션을 구분해 허용하거나 막을 수 있습니다.
- compare: 차세대 방화벽은 모든 종류의 통신을 대상으로 하고, 웹 방화벽(WAF)은 웹 서버 앞에서 HTTP 요청에 담긴 공격만 전문으로 막습니다.
- aliases: NGFW, Next-Generation Firewall, 차세대방화벽, L7 방화벽
- 근거: [40·보조] Gartner 정의의 2차 인용(원문 **미확인**), [21] 2.1.3절·2.1.9절(애플리케이션 방화벽·웹 애플리케이션 방화벽 설명)

**20. UTM**
- fullName: 통합 위협 관리 (Unified Threat Management)
- category: 네트워크 / 보안
- definition: UTM(Unified Threat Management)은 방화벽, 악성코드 탐지·제거, 의심스러운 탐색 통신 차단 같은 여러 보안 기능을 장비 한 대에 모은 시스템입니다.
- why: 장비 한 대로 정책을 관리할 수 있어 작은 조직이나 지점에서 운영 부담이 줄어듭니다.
- compare: UTM은 여러 기능을 한 장비에 묶는 데 초점이 있고, 차세대 방화벽은 애플리케이션 식별과 깊은 검사에 초점이 있습니다. 두 말의 경계는 흐립니다.
- aliases: Unified Threat Management, 통합 위협 관리, 통합보안장비
- 근거: [21] 2.1.8절. NGFW와의 구분은 해석

**21. SSL VPN**
- fullName: SSL VPN (Secure Sockets Layer Virtual Private Network)
- category: 네트워크 / 보안
- definition: SSL VPN은 SSL/TLS로 보호된 연결을 통해 원격 사용자가 조직의 내부 자원에 안전하게 접속하게 해 주는 가상 사설망입니다.
- why: 웹 브라우저나 가벼운 프로그램만으로 집이나 외부에서 회사 시스템에 접속할 수 있습니다.
- compare: SSL VPN은 주로 개인 사용자의 원격 접속에 쓰고, IPsec VPN은 주로 망과 망을 통째로 잇는 데 씁니다.
- aliases: SSL-VPN, TLS VPN, 원격 접속 VPN, 클라이언트 VPN
- 근거: [22] 요약·2장(포털형과 터널형으로 구분)

**22. IPsec VPN**
- fullName: IPsec VPN (Internet Protocol Security Virtual Private Network)
- category: 네트워크 / 보안
- definition: IPsec VPN은 네트워크 계층에서 IP 통신을 암호화하는 개방형 표준 묶음인 IPsec으로 공용 망 위에 만든 가상 사설망입니다.
- why: 애플리케이션을 고치지 않고도 두 망 사이의 모든 통신을 암호화할 수 있습니다.
- compare: IPsec VPN은 네트워크 계층에서 모든 통신을 보호하고, SSL VPN은 그 위 계층에서 사용자 접속을 보호합니다.
- aliases: IPsec, IPSec VPN, 사이트 간 VPN, Site-to-Site VPN, 게이트웨이 간 VPN
- 근거: [23] 요약·2장, [30]

**23. 프록시**
- fullName: 프록시 서버 (Forward Proxy)
- category: 네트워크 / 보안
- definition: 프록시는 클라이언트와 서버 사이에서 통신과 부가 기능을 대신 중계하는 장치 또는 프로그램입니다.
- why: 사내 PC의 인터넷 접속을 한곳으로 모아 접속 기록을 남기고 위험한 사이트를 막을 수 있습니다.
- compare: 프록시(포워드 프록시)는 내부 사용자를 대신해 밖으로 나가고, 리버스 프록시는 내부 서버를 대신해 밖의 요청을 받습니다.
- aliases: Proxy, 포워드 프록시, Forward Proxy, 웹 프록시, 프록시 서버, SWG
- 근거: [20] proxy (SP 800-113, SP 800-95). 포워드/리버스 구분은 **미확인**(일반 용례)

**24. 리버스 프록시**
- fullName: 리버스 프록시 (Reverse Proxy)
- category: 네트워크
- definition: 리버스 프록시는 외부 클라이언트의 요청을 내부 서버 대신 받아 알맞은 서버로 넘기고 응답을 되돌려 주는 중계 서버입니다.
- why: 내부 서버 주소를 감추고 암호화 처리, 캐시, 요청 분산을 한곳에서 맡을 수 있습니다.
- compare: 리버스 프록시는 서버 쪽을 대신하고, 포워드 프록시는 사용자 쪽을 대신합니다.
- aliases: Reverse Proxy, 역방향 프록시, 리버스프록시
- 근거: **미확인**(일반 용례). [11]에 "reverse proxy(Application Gateway, Front Door)로 클라이언트 연결을 종단" 용례만 확인

### 4.4 네트워크

**25. 전용회선**
- fullName: 전용회선 (Leased Line)
- category: 네트워크
- definition: 전용회선은 통신 사업자에게 빌려 두 지점 사이를 한 조직만 쓰도록 고정으로 연결한 통신 회선입니다.
- why: 다른 사용자와 회선을 나눠 쓰지 않아 속도가 일정하고 공용 인터넷을 거치지 않습니다.
- compare: 전용회선은 물리적으로 따로 빌린 회선이고, VPN은 공용 망 위에 암호화로 만든 가상의 전용 통로입니다.
- aliases: 전용선, 임대 회선, Leased Line, 전용 회선
- 근거: **미확인**(일반 용례)

**26. MPLS**
- fullName: 다중 프로토콜 레이블 스위칭 (Multiprotocol Label Switching)
- category: 네트워크
- definition: MPLS(Multiprotocol Label Switching)는 패킷에 짧은 레이블을 붙이고 그 레이블을 기준으로 정해진 경로에 따라 전달하는 통신 사업자망 기술입니다.
- why: 통신 사업자가 여러 고객의 본사–지사 통신을 한 망에서 서로 섞이지 않게 나르고 품질을 관리할 수 있습니다.
- compare: MPLS는 통신 사업자가 제공하는 사설 망 서비스이고, SD-WAN은 MPLS·인터넷 등 여러 회선 위에서 소프트웨어로 경로를 고르는 방식입니다.
- aliases: Multiprotocol Label Switching, MPLS VPN, IP-VPN, 엠피엘에스
- 근거: [29] 제목·초록만 확인. 정의 문장은 **미확인**(일반 용례)

**27. SD-WAN**
- fullName: 소프트웨어 정의 광역 통신망 (Software-Defined Wide Area Network)
- category: 네트워크
- definition: SD-WAN은 인터넷·전용회선 등 여러 회선 위에 가상 망을 올리고, 애플리케이션별 정책에 따라 통신을 어느 회선으로 보낼지 소프트웨어로 정하는 광역 통신망 방식입니다.
- why: 비싼 전용회선에만 기대지 않고 여러 회선을 섞어 쓰면서 지점 설정을 중앙에서 관리할 수 있습니다.
- compare: SD-WAN은 회선 위에서 경로를 고르는 방식이고, MPLS·전용회선은 그 아래에서 쓰이는 회선 종류입니다.
- aliases: Software-Defined WAN, SDWAN, 소프트웨어 정의 WAN
- 근거: [33·보조] MEF 70 계열 표준 소개(검색 요약). 표준 본문 미열람

**28. VLAN**
- fullName: 가상 랜 (Virtual Local Area Network)
- category: 네트워크
- definition: VLAN(Virtual LAN)은 하나의 물리적 랜을 데이터 링크 계층에서 서로 격리된 여러 브로드캐스트 영역으로 나눈 것입니다.
- why: 스위치를 따로 사지 않고도 부서나 용도별로 망을 나눌 수 있습니다.
- compare: VLAN은 한 스위치 망 안에서 나누는 방식이고, VXLAN은 여러 데이터센터에 걸친 망 위에 가상 랜을 올리는 방식입니다.
- aliases: Virtual LAN, 가상 랜, 브이랜, 802.1Q
- 근거: [20] virtual local area network (NIST SP 1800-15B)

**29. VXLAN**
- fullName: 가상 확장 랜 (Virtual eXtensible Local Area Network)
- category: 네트워크
- definition: VXLAN은 계층 3 네트워크 위에 가상의 계층 2 네트워크를 겹쳐 올리는 방식으로, 여러 테넌트가 쓰는 가상화 데이터센터의 오버레이 망을 만드는 데 씁니다.
- why: 물리 망 구성을 바꾸지 않고도 가상 머신용 망을 많이 만들고 여러 서버에 걸쳐 늘릴 수 있습니다.
- compare: VLAN은 스위치 망 안에서 구분하고, VXLAN은 IP 망 위에 터널로 가상 랜을 만듭니다.
- aliases: Virtual eXtensible LAN, 브이엑스랜, 오버레이 네트워크
- 근거: [26] 제목·초록

**30. ACL**
- fullName: 접근 제어 목록 (Access Control List)
- category: 네트워크 / 보안
- definition: ACL(Access Control List)은 어떤 대상이 자원에 접근할 수 있는지 허용할 대상을 나열해 접근을 통제하는 목록입니다.
- why: 라우터나 스위치에서 출발지·목적지 주소와 포트를 기준으로 통신을 간단히 허용하거나 막을 수 있습니다.
- compare: ACL은 규칙 목록 자체를 가리키고, 방화벽은 그런 규칙에 더해 연결 상태 추적 같은 기능을 갖춘 장비입니다.
- aliases: Access Control List, 접근 제어 목록, 접근통제목록
- 근거: [20] access control list (CNSSI 4009-2022, RFC 4949). 네트워크 장비 용례는 일반 용례

**31. 보안 그룹**
- fullName: 보안 그룹 (Security Group)
- category: 클라우드 / 보안
- definition: 보안 그룹은 클라우드에서 인스턴스 단위로 붙여 들어오고 나가는 통신을 허용 규칙으로 통제하며, 응답 통신은 자동으로 허용하는 상태 기반 가상 방화벽입니다.
- why: 서버마다 필요한 포트와 상대만 열어 둘 수 있습니다.
- compare: 보안 그룹은 인스턴스 단위·허용 규칙만·상태 기반이고, 네트워크 ACL은 서브넷 단위·허용과 거부 규칙·상태 비기반입니다.
- aliases: Security Group, SG, ACG, NSG, 시큐리티 그룹
- 근거: [3] 비교 표, [18] NCP ACG(서버 단위, Stateful)

**32. 네트워크 ACL**
- fullName: 네트워크 접근 제어 목록 (Network Access Control List, NACL)
- category: 클라우드 / 보안
- definition: 네트워크 ACL은 클라우드에서 서브넷 단위로 들어오고 나가는 통신을 허용 또는 거부 규칙으로 통제하며, 응답 통신도 따로 허용해야 하는 상태 비기반 규칙 목록입니다.
- why: 서브넷 전체에 특정 통신을 한 번에 막는 보조 방어선을 둘 수 있습니다.
- compare: 네트워크 ACL은 서브넷 전체에 적용되고 규칙을 번호 순서로 평가하며, 보안 그룹은 인스턴스에 적용되고 모든 규칙을 함께 평가합니다.
- aliases: NACL, Network ACL, 네트워크 접근 제어 목록, 서브넷 ACL
- 근거: [3] 비교 표, [18] NCP Network ACL(Subnet 단위, Stateless)

**33. GSLB**
- fullName: 글로벌 서버 부하 분산 (Global Server Load Balancing)
- category: 네트워크
- definition: GSLB(Global Server Load Balancing)는 DNS 응답을 이용해 사용자를 여러 지역의 데이터센터나 리전 가운데 상태가 정상이고 가까운 곳으로 보내는 부하 분산 방식입니다.
- why: 한 데이터센터에 장애가 나도 다른 지역으로 사용자를 돌려 서비스를 이어 갈 수 있습니다.
- compare: 일반 로드밸런서는 한 데이터센터 안의 서버들에 요청을 나누고, GSLB는 데이터센터나 리전 사이에서 나눕니다.
- aliases: Global Server Load Balancing, 글로벌 로드밸런싱, DNS 기반 부하 분산, GTM, Traffic Manager
- 근거: **미확인**(공식 정의 검색 실패, 일반 용례)

**34. Anycast**
- fullName: 애니캐스트 (Anycast)
- category: 네트워크
- definition: Anycast는 같은 IP 주소를 여러 지점의 서버에 함께 부여하고, 라우팅에 따라 사용자를 그 가운데 가까운 지점으로 연결하는 주소 지정 방식입니다.
- why: DNS나 CDN처럼 전 세계에 흩어진 서비스가 응답 속도와 가용성을 높일 수 있습니다.
- compare: Anycast는 라우팅으로 가까운 지점을 고르고, GSLB는 DNS 응답으로 지점을 고릅니다.
- aliases: 애니캐스트, Anycast IP, 애니캐스트 라우팅
- 근거: [27] 제목·초록(애니캐스트로 서비스를 분산하는 운영 권고)만 확인. 정의 문장은 **미확인**(일반 용례)

**35. BGP**
- fullName: 경계 경로 프로토콜 (Border Gateway Protocol)
- category: 네트워크
- definition: BGP(Border Gateway Protocol)는 자율 시스템(AS) 사이에서 어떤 네트워크에 도달할 수 있는지 정보를 서로 교환하는 라우팅 프로토콜입니다.
- why: 통신 사업자와 기업, 클라우드가 서로의 망으로 가는 길을 자동으로 알리고 바꿀 수 있습니다.
- compare: BGP는 조직과 조직 사이의 경로를 다루고, OSPF 같은 내부 라우팅 프로토콜은 한 조직 안의 경로를 다룹니다.
- aliases: Border Gateway Protocol, BGP-4, 경계 게이트웨이 프로토콜
- 근거: [25] 초록. 클라우드 전용선·전송 게이트웨이의 BGP 사용은 [4][6][13]

**36. 라우터**
- fullName: 라우터 (Router)
- category: 네트워크
- definition: 라우터는 두 네트워크 사이에서 OSI 3계층 관문 역할을 하며 데이터 패킷을 목적지 방향으로 중계하고 길을 정해 주는 장치입니다.
- why: 서로 다른 네트워크에 있는 장비끼리 통신할 수 있습니다.
- compare: 라우터는 IP 주소를 보고 네트워크 사이를 잇고, 스위치는 같은 네트워크 안의 장비를 잇습니다.
- aliases: Router, 라우팅 장비, 공유기
- 근거: [20] router (SP 800-82r3)

**37. L2 스위치**
- fullName: 계층 2 스위치 (Layer 2 Switch)
- category: 네트워크
- definition: L2 스위치는 들어온 데이터를 MAC 주소를 기준으로 목적지 장비가 연결된 포트로만 내보내는 데이터 링크 계층 장비입니다.
- why: 한 네트워크 안의 여러 서버와 PC를 서로 연결할 수 있습니다.
- compare: L2 스위치는 같은 네트워크 안에서만 전달하고, L3 스위치는 IP 주소를 보고 다른 네트워크로도 전달합니다.
- aliases: Layer 2 Switch, 스위치, 스위칭 허브, 액세스 스위치
- 근거: [20] switch(여러 입력 포트의 데이터를 목적지로 가는 출력 포트로 보내는 장치). MAC 주소·계층 구분은 **미확인**(일반 용례)

**38. L3 스위치**
- fullName: 계층 3 스위치 (Layer 3 Switch)
- category: 네트워크
- definition: L3 스위치는 스위치 기능에 더해 IP 주소를 기준으로 서로 다른 네트워크(VLAN) 사이의 통신을 전달하는 라우팅 기능을 갖춘 장비입니다.
- why: 사내 여러 VLAN 사이의 통신을 빠르게 이어 줄 수 있습니다.
- compare: L3 스위치는 주로 사내 망 안의 네트워크끼리 잇고, 라우터는 주로 외부 회선과 사내 망을 잇습니다.
- aliases: Layer 3 Switch, 멀티레이어 스위치, 코어 스위치, 분배 스위치
- 근거: **미확인**(일반 용례)

**39. 백본**
- fullName: 백본 네트워크 (Backbone Network)
- category: 네트워크
- definition: 백본은 여러 하위 네트워크를 서로 이어 주며 가장 많은 통신이 지나가는 중심 구간의 고속 네트워크입니다.
- why: 층별·건물별·지점별 네트워크가 중심 구간 하나를 통해 서로 통신할 수 있습니다.
- compare: 백본은 중심 구간 전체를 가리키고, 백본 스위치는 그 구간에 놓인 중심 장비를 가리킵니다.
- aliases: Backbone, 백본망, 기간망, 코어망, 백본 스위치
- 근거: **미확인**(일반 용례). [14]에 "Microsoft backbone" 용례만 확인

**40. 게이트웨이**
- fullName: 게이트웨이 (Gateway)
- category: 네트워크
- definition: 게이트웨이는 둘 이상의 컴퓨터 네트워크에 붙어 그 사이의 통신을 이어 주는 중간 시스템입니다.
- why: 서로 다른 네트워크나 방식이 다른 시스템이 한 지점을 거쳐 통신할 수 있습니다.
- compare: 게이트웨이는 네트워크의 출입구 역할을 가리키는 넓은 말이고, 라우터는 그 역할을 3계층에서 하는 장치입니다.
- aliases: Gateway, GW, 관문, 기본 게이트웨이
- 근거: [20] gateway (CNSSI 4009-2022, RFC 4949)

**41. 망 이중화**
- fullName: 네트워크 이중화 (Network Redundancy)
- category: 네트워크 / 가용성
- definition: 망 이중화는 회선이나 네트워크 장비를 두 벌 이상 두어 한쪽에 장애가 나도 다른 쪽으로 통신이 이어지게 하는 구성입니다.
- why: 회선 하나나 장비 한 대의 고장이 서비스 전체 중단으로 번지지 않습니다.
- compare: 망 이중화는 통신 경로를 두 벌 두는 것이고, Active/Standby는 두 벌 가운데 하나만 쓰고 하나는 대기시키는 운영 방식입니다.
- aliases: 네트워크 이중화, 회선 이중화, 장비 이중화, Redundancy, 다중화
- 근거: **미확인**(일반 용례). [13]에 ExpressRoute 회선이 두 연결로 이중화된다는 설명만 확인

**42. OOB 관리망**
- fullName: 대역 외 관리망 (Out-of-Band Management Network)
- category: 네트워크 / 운영
- definition: OOB 관리망은 서비스 통신이 지나가는 망과 분리된 별도 통신 경로로 서버와 네트워크 장비를 관리하는 전용 망입니다.
- why: 서비스 망에 장애나 공격이 생겨도 장비에 접속해 조치할 수 있습니다.
- compare: OOB 관리는 별도 망으로 장비에 접속하고, 인밴드 관리는 서비스 통신과 같은 망으로 접속합니다.
- aliases: Out-of-Band, OOB, 대역 외 관리, 관리 전용망, IPMI망, iLO망
- 근거: [20] out of band("별도 통신 채널로 전송되는 정보"). 관리망 정의 문장은 **미확인**(일반 용례)

**43. SAN**
- fullName: 스토리지 전용 네트워크 (Storage Area Network)
- category: 스토리지 / 네트워크
- definition: SAN(Storage Area Network)은 컴퓨터와 저장 장치 사이, 그리고 저장 장치끼리 데이터를 주고받는 것이 주된 목적인 네트워크입니다.
- why: 여러 서버가 대용량 저장 장치를 빠르고 안정적으로 함께 쓸 수 있습니다.
- compare: SAN은 서버에 디스크처럼 보이는 저장 공간을 전용 망으로 제공하고, NAS는 일반 망으로 파일 공유 형태의 저장 공간을 제공합니다.
- aliases: Storage Area Network, 스토리지 에어리어 네트워크, 스토리지망, FC SAN, iSCSI
- 근거: [37·보조] SNIA 온라인 사전(검색 요약). NAS 비교는 **미확인**

### 4.5 클라우드 네트워크

**44. NAT 게이트웨이**
- fullName: NAT 게이트웨이 (Network Address Translation Gateway)
- category: 클라우드 / 네트워크
- definition: NAT 게이트웨이는 프라이빗 서브넷의 인스턴스가 VPC 밖의 서비스로 접속할 수 있게 주소를 바꿔 주되, 밖에서 그 인스턴스로 먼저 접속하지는 못하게 하는 관리형 서비스입니다.
- why: 인터넷에 노출하지 않은 서버도 업데이트 내려받기나 외부 API 호출을 할 수 있습니다.
- compare: NAT 게이트웨이는 안에서 밖으로 나가는 통신만 열어 주고, 인터넷 게이트웨이는 양쪽 방향 통신을 모두 열어 줍니다.
- aliases: NAT Gateway, NAT GW, 나트 게이트웨이, Cloud NAT
- 근거: [7], [18]

**45. 인터넷 게이트웨이**
- fullName: 인터넷 게이트웨이 (Internet Gateway, IGW)
- category: 클라우드 / 네트워크
- definition: 인터넷 게이트웨이는 VPC와 인터넷 사이의 통신을 가능하게 하는 VPC 구성 요소로, 공인 IP를 가진 자원이 인터넷과 양쪽 방향으로 통신하게 해 줍니다.
- why: 로드밸런서나 웹 서버처럼 인터넷에서 접속해야 하는 자원을 외부와 연결할 수 있습니다.
- compare: 인터넷 게이트웨이로 가는 경로가 있는 서브넷이 퍼블릭 서브넷이고, 없는 서브넷이 프라이빗 서브넷입니다.
- aliases: Internet Gateway, IGW, 인터넷 GW
- 근거: [8], [18]

**46. 프라이빗 엔드포인트**
- fullName: 프라이빗 엔드포인트 (Private Endpoint, VPC Endpoint, PrivateLink)
- category: 클라우드 / 네트워크
- definition: 프라이빗 엔드포인트는 가상 네트워크 안의 사설 IP 주소를 쓰는 네트워크 인터페이스로, 클라우드 서비스나 다른 계정의 서비스에 인터넷을 거치지 않고 사설로 접속하게 해 줍니다.
- why: 스토리지나 DB 같은 관리형 서비스를 인터넷 게이트웨이나 NAT 없이 쓸 수 있습니다.
- compare: 프라이빗 엔드포인트는 특정 서비스 하나로 가는 한 방향 통로이고, 피어링은 두 네트워크 전체를 양쪽 방향으로 잇습니다.
- aliases: Private Endpoint, VPC 엔드포인트, PrivateLink, Private Link, Private Service Connect, 서비스 게이트웨이
- 근거: [5][12][17], [19] NHN Cloud 서비스 게이트웨이, [10] PrivateLink 한 방향 접근 설명

**47. VPC 피어링**
- fullName: VPC 피어링 (VPC Peering, Virtual Network Peering)
- category: 클라우드 / 네트워크
- definition: VPC 피어링은 두 가상 네트워크를 사업자 내부망으로 직접 이어 서로의 자원이 사설 IP 주소로 통신하게 하는 연결입니다.
- why: 서로 다른 VPC나 계정에 있는 시스템이 인터넷을 거치지 않고 통신할 수 있습니다.
- compare: 피어링은 두 네트워크를 일대일로 잇고 다른 네트워크로 건너가지 못하며, 전송 게이트웨이는 여러 네트워크를 중앙 허브 하나에 모아 잇습니다.
- aliases: VPC Peering, 가상 네트워크 피어링, VNet Peering, 피어링
- 근거: [14](사설·Microsoft 백본, 비전이적 [11]), [10](AWS: 10개 미만이면 피어링, 그 이상은 전송 게이트웨이 권고)

**48. 전송 게이트웨이**
- fullName: 전송 게이트웨이 (Transit Gateway)
- category: 클라우드 / 네트워크
- definition: 전송 게이트웨이는 여러 VPC와 온프레미스 네트워크를 서로 잇는 데 쓰는 클라우드의 네트워크 전송 허브입니다.
- why: VPC가 많아져도 연결을 한곳에 모아 경로를 관리할 수 있습니다.
- compare: 전송 게이트웨이는 허브 하나에 여러 네트워크를 붙이고, 피어링은 네트워크 쌍마다 연결을 따로 만듭니다.
- aliases: Transit Gateway, TGW, 트랜짓 게이트웨이, Transit Hub, Virtual WAN 허브
- 근거: [4], [10]

**49. 클라우드 전용선**
- fullName: 클라우드 전용 연결 (AWS Direct Connect · Azure ExpressRoute · Google Cloud Interconnect)
- category: 클라우드 / 네트워크
- definition: 클라우드 전용선은 사내 네트워크와 클라우드 사업자 네트워크를 공용 인터넷을 거치지 않는 전용 회선으로 잇는 연결 서비스입니다.
- why: 인터넷 VPN보다 속도와 지연이 일정하고 통신이 공용 인터넷에 노출되지 않습니다.
- compare: 클라우드 전용선은 전용 회선을 쓰고, 사이트 간 VPN은 공용 인터넷 위에 암호화 터널을 만듭니다.
- aliases: Direct Connect, DX, ExpressRoute, Cloud Interconnect, Dedicated Interconnect, 전용 연결
- 근거: [6][13][15]

**50. 퍼블릭 서브넷**
- fullName: 퍼블릭 서브넷 (Public Subnet)
- category: 클라우드 / 네트워크
- definition: 퍼블릭 서브넷은 인터넷 게이트웨이로 가는 직접 경로가 있어 그 안의 자원이 공용 인터넷과 통신할 수 있는 서브넷입니다.
- why: 로드밸런서, 배스천, NAT 게이트웨이처럼 인터넷과 맞닿아야 하는 자원을 둘 수 있습니다.
- compare: 퍼블릭 서브넷은 인터넷 게이트웨이 경로가 있고, 프라이빗 서브넷은 없습니다.
- aliases: Public Subnet, 공개 서브넷, 퍼블릭 영역
- 근거: [2][8][18]

**51. 프라이빗 서브넷**
- fullName: 프라이빗 서브넷 (Private Subnet)
- category: 클라우드 / 네트워크
- definition: 프라이빗 서브넷은 인터넷 게이트웨이로 가는 직접 경로가 없어 그 안의 자원이 인터넷에 나가려면 NAT 장치를 거쳐야 하는 서브넷입니다.
- why: 애플리케이션 서버를 인터넷에서 직접 접속할 수 없는 곳에 둘 수 있습니다.
- compare: 프라이빗 서브넷은 NAT를 거쳐 밖으로 나갈 수 있고, 격리 서브넷은 VPC 밖으로 가는 경로가 전혀 없습니다.
- aliases: Private Subnet, 사설 서브넷, 프라이빗 영역
- 근거: [2][18]

**52. 격리 서브넷**
- fullName: 격리 서브넷 (Isolated Subnet)
- category: 클라우드 / 네트워크
- definition: 격리 서브넷은 VPC 밖의 목적지로 가는 경로가 없어 같은 VPC 안의 자원끼리만 접속하고 접속받을 수 있는 서브넷입니다.
- why: DB처럼 외부와 통신할 필요가 없는 자원을 가장 안쪽에 둘 수 있습니다.
- compare: 격리 서브넷은 밖으로 나가는 통신도 안 되고, 프라이빗 서브넷은 NAT를 거쳐 나가는 통신은 됩니다.
- aliases: Isolated Subnet, 데이터 서브넷, DB 서브넷, 폐쇄 서브넷
- 근거: [2] (AWS 문서의 구분. 다른 사업자 문서에서는 같은 이름을 확인하지 못함)

**53. 허브-스포크**
- fullName: 허브-스포크 네트워크 토폴로지 (Hub-and-Spoke Network Topology)
- category: 클라우드 / 아키텍처
- definition: 허브-스포크는 방화벽·게이트웨이 같은 공유 네트워크 기능을 둔 중앙 허브 네트워크에 업무별 스포크 네트워크를 붙여 연결하는 구성 방식입니다.
- why: 인터넷 출구와 사내 연결, 보안 검사를 허브 한곳에서 통제하면서 업무별 네트워크는 서로 격리할 수 있습니다.
- compare: 허브-스포크는 모든 통신이 허브를 거치고, 풀 메시는 네트워크끼리 서로 직접 잇습니다.
- aliases: Hub-Spoke, 허브 앤 스포크, 허브 스포크 토폴로지, Hub and Spoke
- 근거: [11], [10](전송 게이트웨이의 허브-스포크 설계)

**54. 랜딩 존**
- fullName: 랜딩 존 (Landing Zone)
- category: 클라우드 / 아키텍처
- definition: 랜딩 존은 계정(구독)과 네트워크, 보안·로그 설정을 미리 표준대로 나눠 갖춰 둔 여러 계정 기반의 클라우드 기본 환경입니다.
- why: 새 업무를 올릴 때마다 계정과 망, 보안 설정을 처음부터 만들지 않고 같은 기준으로 시작할 수 있습니다.
- compare: 랜딩 존은 여러 계정과 네트워크를 아우르는 전체 기반이고, VPC는 그 안의 네트워크 한 단위입니다.
- aliases: Landing Zone, 랜딩존, Control Tower, Azure 랜딩 존, 멀티 계정 환경
- 근거: [9](Control Tower의 OU·계정 구성), [11](Azure 랜딩 존은 허브-스포크 기반, 허브는 Connectivity 구독). 한 문장 정의는 **미확인**(해석)

**55. 검사 VPC**
- fullName: 검사 VPC (Inspection VPC)
- category: 클라우드 / 보안
- definition: 검사 VPC는 VPC 사이, 인터넷, 온프레미스로 오가는 통신을 한곳에 모아 방화벽으로 검사하는 전용 VPC입니다.
- why: VPC마다 방화벽을 두지 않고 한곳에서 같은 정책으로 검사할 수 있습니다.
- compare: 검사 VPC는 통신을 검사하는 곳이고, 이그레스 VPC는 인터넷으로 나가는 출구를 모아 둔 곳입니다.
- aliases: Inspection VPC, 보안 검사 VPC, 방화벽 VPC, 중앙 검사
- 근거: [10](다른 워크로드를 두지 않아야 한다고 명시)

**56. 이그레스 VPC**
- fullName: 이그레스 VPC (Egress VPC, Outbound VPC)
- category: 클라우드 / 네트워크
- definition: 이그레스 VPC는 여러 VPC에서 시작해 인터넷으로 나가는 통신을 한곳에 모아 NAT 게이트웨이 등을 거쳐 내보내는 중앙 출구 VPC입니다.
- why: VPC마다 NAT 게이트웨이를 두지 않아도 되고 밖으로 나가는 통신을 한곳에서 통제할 수 있습니다.
- compare: 이그레스 VPC는 안에서 시작한 통신의 출구이고, 인그레스 VPC는 밖에서 시작한 접속을 받는 입구입니다.
- aliases: Egress VPC, 아웃바운드 VPC, 중앙 이그레스, Centralized Egress
- 근거: [9] 중앙 이그레스, [10] Outbound(egress) VPC

**57. 공유 VPC**
- fullName: 공유 VPC (Shared VPC, VPC Sharing)
- category: 클라우드 / 네트워크
- definition: 공유 VPC는 한 조직의 여러 프로젝트(계정)가 하나의 공통 VPC 네트워크에 자원을 붙여 내부 IP 주소로 통신하게 하는 방식입니다.
- why: 네트워크는 중앙 팀이 한곳에서 관리하고 각 팀은 자기 자원만 관리할 수 있습니다.
- compare: 공유 VPC는 네트워크 하나를 여러 계정이 함께 쓰고, 피어링은 계정마다 따로 만든 네트워크를 서로 잇습니다.
- aliases: Shared VPC, VPC 공유, 호스트 프로젝트, 서비스 프로젝트
- 근거: [16], [10](AWS RAM으로 서브넷 공유)

### 4.6 암호·인증

**58. HSM**
- fullName: 하드웨어 보안 모듈 (Hardware Security Module)
- category: 보안 / 암호
- definition: HSM(Hardware Security Module)은 암호 키를 보호·관리하고 암호 연산을 수행하는 물리적 컴퓨팅 장치입니다.
- why: 키를 장치 밖으로 꺼내지 않고 서명·암호화를 할 수 있어 키 유출 위험이 줄어듭니다.
- compare: HSM은 키를 보관하는 전용 하드웨어이고, KMS는 키의 생성·교체·폐기 같은 수명 관리를 맡는 시스템입니다.
- aliases: Hardware Security Module, 하드웨어 보안 모듈, CloudHSM, 암호 모듈
- 근거: [20] hardware security module (hsm) (SP 800-57 Part 2 Rev.1)

**59. KMS**
- fullName: 키 관리 시스템 (Key Management System / Service)
- category: 보안 / 암호
- definition: KMS(Key Management System)는 암호 키와 그 메타데이터의 생성, 배포, 저장, 백업, 사용, 폐기 등을 관리하는 시스템입니다.
- why: 암호 키를 애플리케이션 코드나 설정 파일에 두지 않고 한곳에서 통제하고 교체할 수 있습니다.
- compare: KMS는 키의 수명 관리를 맡고, HSM은 그 키를 안전하게 담는 하드웨어입니다.
- aliases: Key Management System, Key Management Service, 키 관리 서비스, 키 관리 시스템
- 근거: [20] key management system (SP 800-57 Part 1 Rev.5)

**60. PKI**
- fullName: 공개 키 기반 구조 (Public Key Infrastructure)
- category: 보안 / 암호
- definition: PKI(Public Key Infrastructure)는 공개 키 인증서를 발급, 유지, 폐기하기 위해 갖춘 체계입니다.
- why: 통신 상대가 진짜인지 인증서로 확인할 수 있는 신뢰 기반이 생깁니다.
- compare: PKI는 인증서를 발급·관리하는 체계 전체이고, 인증서는 그 체계가 발급한 개별 증명서입니다.
- aliases: Public Key Infrastructure, 공개 키 기반 구조, 공개키 기반구조, 인증 체계, CA
- 근거: [20] public key infrastructure (FIPS 186-5, SP 800-57 Part 2 Rev.1)

**61. 인증서**
- fullName: 공개 키 인증서 (Public Key Certificate, X.509 Certificate)
- category: 보안 / 암호
- definition: 인증서는 공개 키가 특정 서버나 사용자 것임을 인증 기관이 전자 서명으로 보증한 전자 문서입니다.
- why: 접속한 사이트나 상대 시스템이 가짜가 아님을 확인하고 암호화 통신을 시작할 수 있습니다.
- compare: 인증서는 공개해도 되는 증명서이고, 개인 키는 소유자만 가지고 있어야 하는 비밀 값입니다.
- aliases: Certificate, 공개 키 인증서, SSL 인증서, TLS 인증서, X.509
- 근거: **미확인**(정의 문장). [20] PKI 정의와 [10] ACM(TLS 인증서 발급·갱신) 설명만 확인

**62. TLS**
- fullName: 전송 계층 보안 (Transport Layer Security)
- category: 보안 / 네트워크
- definition: TLS(Transport Layer Security)는 클라이언트와 서버가 인터넷에서 주고받는 통신을 도청, 변조, 위조할 수 없게 보호하는 프로토콜입니다.
- why: 중간에서 통신을 가로채도 내용을 보거나 바꿀 수 없습니다.
- compare: TLS는 SSL의 후속 표준이며, HTTPS는 HTTP 통신을 TLS로 보호한 것입니다.
- aliases: Transport Layer Security, SSL, SSL/TLS, HTTPS, 전송 계층 보안
- 근거: [28] RFC 8446 초록. rfc-editor 페이지는 RFC 8446이 RFC 9846으로 대체됐다고 표시(5장 참고). SSL 후속 관계는 [22] 용례

**63. mTLS**
- fullName: 상호 TLS (Mutual TLS)
- category: 보안 / 네트워크
- definition: mTLS(Mutual TLS)는 TLS 연결에서 서버뿐 아니라 클라이언트도 인증서를 제시해 양쪽이 서로를 인증하는 방식입니다.
- why: 서비스끼리 통신할 때 허가된 상대인지 양쪽 모두 확인할 수 있습니다.
- compare: 일반 TLS는 서버만 인증서로 확인하고, mTLS는 클라이언트도 인증서로 확인합니다.
- aliases: Mutual TLS, 상호 TLS, 양방향 TLS, 상호 인증
- 근거: [20] mutual authentication("거래에 참여한 양쪽이 서로를 검증하는 과정"). TLS에 적용한 정의 문장은 **미확인**(일반 용례)

**64. SSO**
- fullName: 통합 인증 (Single Sign-On)
- category: 보안 / 인증
- definition: SSO(Single Sign-On)는 하나의 계정과 인증 수단으로 여러 애플리케이션에 접속하는 인증 방식입니다.
- why: 사용자는 한 번만 로그인하면 되고 조직은 계정을 한곳에서 관리하고 막을 수 있습니다.
- compare: SSO는 한 번 로그인으로 여러 시스템을 쓰는 방식이고, SAML과 OIDC는 SSO를 구현하는 데 쓰는 표준 프로토콜입니다.
- aliases: Single Sign-On, 통합 로그인, 싱글 사인온, 통합 인증
- 근거: [20] single sign-on (SP 800-63-4)

**65. SAML**
- fullName: 보안 주장 마크업 언어 (Security Assertion Markup Language)
- category: 보안 / 인증
- definition: SAML(Security Assertion Markup Language)은 서로 다른 조직의 시스템 사이에서 사용자 인증·권한 같은 보안 정보를 주고받는 틀을 정의한 OASIS 표준입니다.
- why: 회사 계정으로 외부 SaaS에 따로 가입하지 않고 로그인할 수 있습니다.
- compare: SAML은 XML 기반으로 기업용 웹 SSO에 오래 쓰였고, OIDC는 OAuth 2.0 위에 만든 더 가벼운 방식입니다.
- aliases: Security Assertion Markup Language, SAML 2.0, 샘엘
- 근거: [32] 초록. XML 기반이라는 점은 [32·보조](2차 자료 표현)

**66. OIDC**
- fullName: 오픈아이디 커넥트 (OpenID Connect)
- category: 보안 / 인증
- definition: OIDC(OpenID Connect)는 OAuth 2.0 프로토콜 위에 얹은 신원 계층으로, 인가 서버가 수행한 인증을 바탕으로 클라이언트가 사용자의 신원을 확인하게 해 주는 표준입니다.
- why: 앱이 비밀번호를 직접 다루지 않고도 로그인한 사용자가 누구인지 알 수 있습니다.
- compare: OAuth는 자원에 접근할 권한을 위임하는 표준이고, OIDC는 거기에 사용자가 누구인지 확인하는 기능을 더한 표준입니다.
- aliases: OpenID Connect, 오픈아이디 커넥트, OIDC 1.0
- 근거: [31] 초록

**67. IAM**
- fullName: 계정 및 접근 관리 (Identity and Access Management)
- category: 보안 / 인증
- definition: IAM(Identity and Access Management)은 사용자와 시스템의 신원을 만들고 인증 수단과 묶어, 누가 어떤 자원에 접근할 수 있는지 권한을 관리하는 체계입니다.
- why: 사람과 프로그램마다 꼭 필요한 권한만 주고 그 사용 내역을 추적할 수 있습니다.
- compare: IAM은 누가 무엇을 할 수 있는지 권한을 다루고, 방화벽과 보안 그룹은 어디서 어디로 통신할 수 있는지를 다룹니다.
- aliases: Identity and Access Management, 계정 권한 관리, ICAM, 아이엠
- 근거: [20] identity, credential, and access management (CNSSI 4009-2022)

**68. MFA**
- fullName: 다중 요소 인증 (Multi-Factor Authentication)
- category: 보안 / 인증
- definition: MFA(Multi-Factor Authentication)는 서로 다른 종류의 인증 요소를 두 가지 이상 써서 본인임을 확인하는 인증 방식입니다.
- why: 비밀번호가 유출돼도 다른 요소가 없으면 로그인할 수 없습니다.
- compare: MFA는 한 번의 로그인에 여러 요소를 요구하는 것이고, SSO는 한 번의 로그인으로 여러 시스템을 쓰게 하는 것입니다.
- aliases: Multi-Factor Authentication, 다중 인증, 2단계 인증, 2FA, OTP 인증
- 근거: [20] multi-factor authentication (CNSSI 4009-2022)

### 4.7 운영 보안

**69. 접근제어 솔루션**
- fullName: 시스템 접근제어 솔루션 (계정·서버·DB 접근제어, Privileged Access Management)
- category: 보안 / 운영
- definition: 접근제어 솔루션은 관리자와 개발자가 서버나 DB에 접속할 때 반드시 거치게 하여 접속 권한을 확인하고 실행한 명령과 조회 내역을 기록하는 보안 시스템입니다.
- why: 누가 언제 어떤 서버와 DB에서 무엇을 했는지 통제하고 추적할 수 있습니다.
- compare: 접근제어 솔루션은 권한 확인과 작업 기록까지 맡고, 배스천은 내부 서버로 들어가는 경유 서버 역할만 합니다.
- aliases: 서버 접근제어, DB 접근제어, 계정 관리 솔루션, 시스템 접근통제, PAM, 접근통제 게이트웨이
- 근거: **미확인**(국내 제품 분류 관행. 표준·공식 정의 찾지 못함)

**70. SIEM**
- fullName: 보안 정보 및 이벤트 관리 (Security Information and Event Management)
- category: 보안 / 운영
- definition: SIEM(Security Information and Event Management)은 여러 시스템 구성 요소에서 보안 데이터를 모아 하나의 화면에서 대응에 쓸 수 있는 정보로 보여 주는 도구입니다.
- why: 흩어진 로그를 한곳에서 엮어 보아 개별 장비에서는 보이지 않던 공격 징후를 찾을 수 있습니다.
- compare: SIEM은 로그를 모아 분석하고 경보를 내며, SOAR는 그 경보에 대한 대응 절차를 자동으로 실행합니다.
- aliases: Security Information and Event Management, 통합 보안 관제, 보안 관제 시스템, 통합로그분석, ESM
- 근거: [20] security information and event management (SIEM) tool (SP 800-128)

**71. SOAR**
- fullName: 보안 오케스트레이션·자동화·대응 (Security Orchestration, Automation and Response)
- category: 보안 / 운영
- definition: SOAR는 여러 보안 도구를 연결해 경보가 발생했을 때 미리 정한 대응 절차를 자동으로 실행하고 사건 처리 과정을 관리하는 보안 운영 도구입니다.
- why: 반복되는 경보 확인과 차단 작업을 자동화해 대응 시간을 줄일 수 있습니다.
- compare: SOAR는 대응을 자동화하고, SIEM은 대응의 출발점이 되는 경보를 만들어 냅니다.
- aliases: Security Orchestration Automation and Response, 보안 자동화 대응, 보안 오케스트레이션
- 근거: **미확인**(업체 용어집만 검색됨. 표준·공식 정의 찾지 못함)

**72. EDR**
- fullName: 엔드포인트 탐지 및 대응 (Endpoint Detection and Response)
- category: 보안 / 운영
- definition: EDR(Endpoint Detection and Response)은 PC와 서버 같은 단말의 동작을 계속 수집·분석해 침해 징후를 찾아내고 격리 같은 대응을 하게 해 주는 보안 도구입니다.
- why: 백신이 놓친 공격도 단말에서 일어난 행위 기록으로 찾아내고 조사할 수 있습니다.
- compare: 백신은 알려진 악성 파일을 막는 데 초점이 있고, EDR은 단말의 행위를 기록해 탐지와 사후 조사를 돕습니다.
- aliases: Endpoint Detection and Response, 엔드포인트 탐지 대응, 단말 탐지 대응, XDR
- 근거: [20]에 용어와 약어만 등재(정의 문구 없음, 출처 SP 1800-24C·SP 800-66r2). 정의 문장은 **미확인**

**73. DLP**
- fullName: 데이터 유출 방지 (Data Loss Prevention)
- category: 보안 / 데이터
- definition: DLP(Data Loss Prevention)는 사용 중인 데이터, 전송 중인 데이터, 저장된 데이터를 중앙에서 식별·감시·보호하는 기능 또는 시스템입니다.
- why: 개인정보나 기밀 문서가 메일, 메신저, USB로 밖에 나가는 것을 찾아내 막을 수 있습니다.
- compare: DLP는 데이터가 나가는 통로를 감시해 막고, DRM은 문서 자체를 암호화해 나가더라도 못 열게 합니다.
- aliases: Data Loss Prevention, 데이터 유출 방지, 정보 유출 방지, 내부정보 유출방지
- 근거: [20] data loss prevention (CNSSI 4009-2022). DRM과의 비교는 **미확인**

**74. DRM**
- fullName: 문서 보안 (Digital Rights Management, 기업 문서 암호화)
- category: 보안 / 데이터
- definition: DRM은 문서 파일을 암호화하고 사용자별로 열람·편집·인쇄 권한을 정해 권한이 있는 사람만 그 문서를 쓸 수 있게 하는 문서 보안 기술입니다.
- why: 문서가 회사 밖으로 나가더라도 권한이 없는 사람은 내용을 볼 수 없습니다.
- compare: DRM은 파일 자체에 보호를 걸고, DLP는 파일이 나가는 통로를 감시합니다.
- aliases: Digital Rights Management, 문서 보안, 문서 암호화, 문서 DRM, E-DRM
- 근거: **미확인**(국내 제품 분류 관행. 표준·공식 정의 찾지 못함)

### 4.8 요청 목록 대비 점검

- 요청 목록의 "웹 방화벽과 차세대 방화벽 차이" → 19번 compare. "PKI/인증서" → 60·61번. "TLS/mTLS" → 62·63번. "보안 그룹과 네트워크 ACL" → 31·32번. "프록시와 리버스 프록시" → 23·24번. "L2/L3 스위치" → 37·38번. "접근제어(계정·DB·서버)" → 69번.
- 요청 목록 밖에서 더한 것: 에어갭, 마이크로 세그멘테이션, PDP·PEP, OOB 관리망, SAN, 클라우드 전용선, 퍼블릭·프라이빗·격리 서브넷, 허브-스포크, 랜딩 존, 검사 VPC, 이그레스 VPC, 공유 VPC.
- 기존 50개와 이름이 가까운 것: NAT 게이트웨이(기존 NAT), 퍼블릭·프라이빗 서브넷(기존 서브넷), 차세대 방화벽(기존 방화벽·WAF), SSL/IPsec VPN(기존 VPN), 프록시(기존 DB 중계(Proxy)). 별칭이 서로 겹치지 않게 넣을 때 확인이 필요합니다. 특히 기존 "DB 중계(Proxy)"의 aliases에 `Proxy`가 있으면 23번과 충돌합니다.

---

## 5. 확인 못 한 것 / 출처가 엇갈리는 것

확인 못 한 것
1. **제로트러스트 가이드라인 2.0 원문**: KISA·과기정통부 원문 PDF 위치를 찾지 못했습니다. 6대 핵심 요소와 4단계 성숙도는 언론 보도 한 건 [36·보조]으로만 확인했습니다. 핵심 원칙 문구, 세부 역량, 교차 기능은 미확인입니다.
2. **KT Cloud 현행 VPC 문서**: 검색에 옛 ucloud biz 자료(DMZ tier / Private tier 2계층 구조 [42·보조])만 나왔습니다. 현행 서비스의 서브넷 구분·전용선·피어링 명칭은 미확인입니다.
3. **NHN Cloud**: VPC·서브넷·라우팅 테이블 정의와 서비스 게이트웨이 설명만 확인했습니다 [19]. 인터넷 게이트웨이·NAT 게이트웨이·피어링·트랜짓 허브는 메뉴 이름으로만 보였고 정의 본문은 열지 못했습니다.
4. **NCP**: 검색 요약으로 확인했습니다 [18]. 문서 본문을 직접 열지는 않았습니다. Transit VPC Connect, Cloud Connect(전용선) 같은 상품 정의는 미확인입니다.
5. **망분리·망연계의 국내 공식 정의 문구**: KISA 해설서·TTA 용어사전·국정원 가이드에서 정의 문장을 찾지 못했습니다. 4장 1~4번은 논문·언론 등 2차 자료 [39·보조][43·보조] 기반 초안입니다. 공공기관 규정 조사 결과가 있으면 그쪽 문구를 우선하세요.
6. **표준 정의를 찾지 못한 용어**: NGFW·ZTNA(Gartner 원문 미열람, 2차 인용만), SOAR·DRM·접근제어 솔루션·GSLB·전용회선·백본·L3 스위치·리버스 프록시·망 이중화(공식 정의 미발견), EDR(NIST 용어집에 정의 문구 없음).
7. **RFC 4786(Anycast)·RFC 3031(MPLS)**: 제목과 초록만 확인했고 정의 문장은 본문에서 대조하지 않았습니다.
8. **SD-WAN**: MEF 70 계열 표준의 존재와 요지는 검색으로 확인했으나 본문은 열지 않았습니다. 검색 요약에 따르면 MEF 70(2019)은 70.1(2021), 70.2(2023)로 대체됐습니다.
9. **Azure·GCP의 "격리 서브넷"**: AWS 문서 [2]에서만 isolated subnet이라는 이름을 확인했습니다.

출처가 엇갈리거나 주의할 것
1. **VDI와 SBC의 관계**: 국내 2차 자료 가운데 일부는 논리적 망분리를 SBC(서버 기반)와 CBC(PC 기반)로 나누고 VDI를 SBC에 넣고, 일부는 VDI(사용자별 가상 PC)와 SBC(세션 공유)를 따로 구분합니다 [39·보조][41·보조]. 4장에서는 뒤쪽 구분으로 썼습니다.
2. **NAC의 정의**: NIST SP 800-41 Rev.1은 NAC를 "일부 방화벽이 제공하는 기능(원격 근무 기기의 상태 점검)"으로 좁게 정의합니다 [21]. 국내에서 말하는 NAC(사내 망에 붙는 모든 단말을 통제하는 별도 장비)보다 범위가 좁습니다. 4장 정의는 양쪽에 다 맞게 썼습니다.
3. **UTM과 차세대 방화벽**: NIST 문서(2009)는 UTM만 다루고 NGFW라는 말은 쓰지 않습니다 [21]. 두 용어의 경계는 업체마다 다릅니다.
4. **TLS 1.3 표준 번호**: rfc-editor의 RFC 8446 정보 페이지가 "RFC 9846으로 대체됨"으로 표시했습니다 [28]. RFC 9846 본문은 열지 않았습니다. 용어 정의에는 영향이 없습니다.
5. **CSA SDP 명세 v2 발행일**: CSA 보도자료는 2022-03-10, 다른 CSA 자료 페이지는 2022-05-10으로 표시합니다 [34·보조].
6. **프라이빗 엔드포인트 이름**: AWS는 VPC 엔드포인트/PrivateLink [5], Azure는 프라이빗 엔드포인트/Private Link [12], GCP는 Private Service Connect [17], NHN Cloud는 서비스 게이트웨이 [19]로 부릅니다. 한 항목의 별칭으로 묶었습니다.
7. **사무망을 따로 둘지**: 기존 "업무망"과 일반 기업의 "사무망(OA)"은 실무에서 섞어 씁니다. 따로 두면 "업무망 = 망분리 대상, 사무망 = 인터넷 사용"으로 구분할 수 있고, 별칭으로만 넣으면 종류 수가 줄어듭니다. 3장의 A/B/C 선택과 함께 정해야 합니다.
8. **스토리지망 등급**: 외부와 잇지 않는다는 점에서는 closed에 가깝지만, 서버팜과는 직접 붙습니다. closed로 두면 "서버팜↔스토리지망 = 잇지 않음"이 되어 틀리므로 internal + 예외 규칙으로 제안했습니다.
9. **개인정보 안전성 확보조치 기준 개정**: 인터넷망 차단이 위험 기반으로 바뀌었다는 내용은 언론·법률 매체 [38·보조]로만 확인했습니다. 고시 원문은 다른 조사에서 확인이 필요합니다.

---

## 6. 출처 목록

표준·공식 문서 (본문 또는 초록·용어집을 직접 확인)

| 번호 | 제목 | 기관 | URL |
|---|---|---|---|
| 1 | SP 800-207 Zero Trust Architecture (2020) — 초록, 2장, 2.1절, 2.2절, 3.1절 | NIST | https://csrc.nist.gov/pubs/sp/800/207/final · https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-207.pdf |
| 2 | Amazon VPC User Guide — Subnets for your VPC (Subnet types) | AWS | https://docs.aws.amazon.com/vpc/latest/userguide/configure-subnets.html |
| 3 | Amazon VPC User Guide — Infrastructure security (Compare security groups and network ACLs) | AWS | https://docs.aws.amazon.com/vpc/latest/userguide/infrastructure-security.html |
| 4 | What is AWS Transit Gateway for Amazon VPC? | AWS | https://docs.aws.amazon.com/vpc/latest/tgw/what-is-transit-gateway.html |
| 5 | What is AWS PrivateLink? | AWS | https://docs.aws.amazon.com/vpc/latest/privatelink/what-is-privatelink.html |
| 6 | What is Direct Connect? | AWS | https://docs.aws.amazon.com/directconnect/latest/UserGuide/Welcome.html |
| 7 | Amazon VPC User Guide — NAT gateways | AWS | https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html |
| 8 | Amazon VPC User Guide — Enable internet access for a VPC using an internet gateway | AWS | https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Internet_Gateway.html |
| 9 | Whitepaper: Building a Scalable and Secure Multi-VPC AWS Network Infrastructure (개요, Centralized egress to internet) | AWS | https://docs.aws.amazon.com/whitepapers/latest/building-scalable-secure-multi-vpc-network-infrastructure/welcome.html · https://docs.aws.amazon.com/whitepapers/latest/building-scalable-secure-multi-vpc-network-infrastructure/centralized-egress-to-internet.html |
| 10 | AWS Security Reference Architecture — Infrastructure OU, Network account | AWS | https://docs.aws.amazon.com/prescriptive-guidance/latest/security-reference-architecture/network.html |
| 11 | Hub-spoke network topology in Azure | Microsoft | https://learn.microsoft.com/en-us/azure/architecture/networking/architecture/hub-spoke |
| 12 | What is a private endpoint? (Azure Private Link) | Microsoft | https://learn.microsoft.com/en-us/azure/private-link/private-endpoint-overview |
| 13 | Azure ExpressRoute overview | Microsoft | https://learn.microsoft.com/en-us/azure/expressroute/expressroute-introduction |
| 14 | Azure Virtual Network peering | Microsoft | https://learn.microsoft.com/en-us/azure/virtual-network/virtual-network-peering-overview |
| 15 | Cloud Interconnect overview | Google Cloud | https://docs.cloud.google.com/network-connectivity/docs/interconnect/concepts/overview |
| 16 | Shared VPC | Google Cloud | https://docs.cloud.google.com/vpc/docs/shared-vpc |
| 17 | Private Service Connect | Google Cloud | https://docs.cloud.google.com/vpc/docs/private-service-connect |
| 18 | VPC 개요·용어 (Subnet, NAT Gateway, ACG, Network ACL) — 검색 요약으로 확인, 본문 미열람 | 네이버 클라우드 플랫폼 | https://guide.ncloud-docs.com/docs/networking-vpc-vpcoverview · https://guide.ncloud-docs.com/docs/vpc-glossary-vpc |
| 19 | Network > VPC > 개요, Network > Service Gateway > 개요 | NHN Cloud | https://docs.nhncloud.com/ko/Network/VPC/ko/overview/ · https://docs.nhncloud.com/en/Network/Service%20Gateway/en/overview/ |
| 20 | CSRC Glossary (아래 용어별 페이지) | NIST | https://csrc.nist.gov/glossary |
| 21 | SP 800-41 Rev.1 Guidelines on Firewalls and Firewall Policy (2009) — 2.1절, 3장, 용어집 | NIST | https://csrc.nist.gov/pubs/sp/800/41/r1/final |
| 22 | SP 800-113 Guide to SSL VPNs (2008) — 요약·2장 | NIST | https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-113.pdf |
| 23 | SP 800-77 Rev.1 Guide to IPsec VPNs (2020) — 요약·2장 | NIST | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-77r1.pdf |
| 24 | SP 800-82 Rev.3 Guide to Operational Technology Security — 용어집 인용으로만 확인 | NIST | https://doi.org/10.6028/NIST.SP.800-82r3 |
| 25 | RFC 4271 A Border Gateway Protocol 4 (BGP-4) — 초록 | IETF | https://www.rfc-editor.org/info/rfc4271 |
| 26 | RFC 7348 Virtual eXtensible Local Area Network (VXLAN) — 초록 | IETF | https://www.rfc-editor.org/info/rfc7348 |
| 27 | RFC 4786 Operation of Anycast Services (BCP 126) — 초록 | IETF | https://www.rfc-editor.org/info/rfc4786 |
| 28 | RFC 8446 The Transport Layer Security (TLS) Protocol Version 1.3 — 초록 | IETF | https://www.rfc-editor.org/info/rfc8446 |
| 29 | RFC 3031 Multiprotocol Label Switching Architecture — 초록 | IETF | https://www.rfc-editor.org/info/rfc3031 |
| 30 | RFC 4301 Security Architecture for the Internet Protocol — 초록 | IETF | https://www.rfc-editor.org/info/rfc4301 |
| 31 | OpenID Connect Core 1.0 — 초록 | OpenID Foundation | https://openid.net/specs/openid-connect-core-1_0.html |
| 32 | SAML V2.0 Technical Overview (Committee Draft 02, 비규범 문서) — 초록 | OASIS | https://docs.oasis-open.org/security/saml/Post2.0/sstc-saml-tech-overview-2.0.html |

[20]에서 연 용어 페이지: cross_domain_solution, data_diode, air_gap, intrusion_detection_system, intrusion_prevention_system, network_access_control, access_control_list, router, switch, gateway, proxy, virtual_local_area_network, virtual_private_network, out_of_band, distributed_denial_of_service, hardware_security_module_hsm, key_management_system, public_key_infrastructure, multi_factor_authentication, mutual_authentication, single_sign_on, identity_credential_and_access_management, security_information_and_event_management_tool, data_loss_prevention, zero_trust_architecture, endpoint_detection_and_response(정의 없음), unified_threat_management(정의 없음), web_application_firewall(정의 없음). 주소는 `https://csrc.nist.gov/glossary/term/<이름>` 꼴입니다.

보조 자료 (언론·업체·2차 자료, 또는 검색 요약으로만 확인)

| 번호 | 제목 | 기관·성격 | URL |
|---|---|---|---|
| 33 | MEF 70 / 70.1 / 70.2 SD-WAN Service Attributes and Service Framework — 검색 요약만 | MEF(Mplify), 산업 표준 · 본문 미열람 | https://www.mplify.net/resources/mef-70-2-sd-wan-service-attributes-and-service-framework/ |
| 34 | Software-Defined Perimeter (SDP) Specification v2.0 소개 — 검색 요약만 | Cloud Security Alliance, 산업 단체 · 본문 미열람 | https://cloudsecurityalliance.org/artifacts/software-defined-perimeter-zero-trust-specification-v2/ |
| 35 | Zero Trust Maturity Model v2.0 (2023) — 검색 요약만 (5개 기둥, 4단계) | CISA, 정부 · 본문 미열람 | https://www.cisa.gov/sites/default/files/2023-04/zero_trust_maturity_model_v2_508.pdf |
| 36 | '제로트러스트 가이드라인 2.0' 공개…단계별 성숙도 모델·도입절차 구체화 (2024-12-03) | 바이라인네트워크, 언론 | https://byline.network/2024/12/3-220/ |
| 37 | SNIA Online Dictionary — Storage Area Network — 검색 요약만 | SNIA, 산업 단체 | https://snia.org/education/online-dictionary/term/storage-area-network |
| 38 | 개정 '개인정보의 안전성 확보조치 기준' 시행 외 — 검색 요약만 | 법률신문·위키독스, 언론·2차 자료 | https://www.lawtimes.co.kr/news/articleView.html?idxno=213530 · https://wikidocs.net/264634 |
| 39 | 망분리 방식(물리·논리, SBC·CBC·VDI) 설명 — 검색 요약만 | 학술 논문·언론, 2차 자료 | https://koreascience.kr/article/JAKO201434441684269.pdf · https://zdnet.co.kr/view/?no=20130328181225 |
| 40 | NGFW·ZTNA의 Gartner 정의 2차 인용 — 검색 요약만 | Cisco·Dark Reading·Packt 등, 업체·언론 | https://www.cisco.com/c/en/us/products/security/firewalls/what-is-a-next-generation-firewall.html · https://www.darkreading.com/cloud-security/next-generation-firewalls-poorly-named-but-essential-to-the-enterprise-network |
| 41 | What is VDI? — 검색 요약만 | Cisco·Microsoft Azure·Google Cloud 설명 페이지, 업체 | https://www.cisco.com/c/en/us/solutions/computing/what-is-a-vdi.html · https://azure.microsoft.com/en-in/resources/cloud-computing-dictionary/what-is-virtual-desktop-infrastructure-vdi · https://cloud.google.com/discover/what-is-virtual-desktop-infrastructure-vdi |
| 42 | (구) ucloud biz Enterprise Security 안내 — DMZ tier / Private tier — 검색 요약만 | 재판매사 게시 자료, 오래된 자료 | https://www.ncloud24.com/data/bbsData/1563773523&&1.Enterprise%20Security.pdf |
| 43 | [2023 망분리·망연계 리포트] 망분리·망연계 솔루션 — 검색 요약만 | 보안뉴스, 언론 | https://m.boannews.com/html/detail.html?idx=118540 |
