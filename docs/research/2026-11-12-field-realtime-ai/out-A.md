# A) BLE·IoT 기기 통신 — 구성 지식

조사일 2026-11-12. "확인됨"은 출처 페이지를 열어 본문을 읽은 것만 가리킨다. 열지 못했거나 본문에 문장이 없던 것은 5장에 모았다.
포트 번호는 IANA 등록부와 각 벤더 문서에서 확인한 값만 적었다.

기존 시드와의 관계: `network-seed.ts` 에 이미 `iot-net`(사물인터넷망, closed, separated=true)과 `iot-net ↔ business-net = network_link` 규칙이 있다. `catalog.ts` 에는 IoT 기기·게이트웨이·브로커용 노드 종류와 "IP 망을 거치지 않는 무선 직접 연결"용 선 종류가 없다(4장 끝에 제안).

---

## 1. 전형적인 구성

### 구성 1 — 앱 ↔ 기기 BLE 직결 (가장 작은 구성: 웨어러블, 혈압계, 도어락 설정)

구성요소: 모바일 앱(휴대폰), BLE 기기(센서·웨어러블), 앱 서버(API), DB.

- 모바일 앱 → BLE 기기 : BLE 광고 스캔 후 연결(휴대폰=센트럴, 기기=페리페럴), 포트 개념 없음, 앱이 먼저 건다. 연결 뒤 GATT 로 특성 값을 읽기·쓰기(앱=GATT 클라이언트, 기기=GATT 서버). 측정값·설정값이 흐른다. [확인됨: Android BLE 문서]
- 모바일 앱 ↔ BLE 기기 : 페어링(암호 키 생성), 본딩(키 저장). 등록 정보를 NFC·QR 로 넘기는 대역 외(OOB) 방식도 있다. [확인됨: Bluetooth SIG 블로그, NFC Forum]
- 모바일 앱 → 앱 서버 : HTTPS/443, 앱 → 서버. 앱이 기기에서 읽은 값을 대신 올린다(기기는 인터넷에 붙지 않는다).
- 앱 서버 → DB : 기존 웹 구성과 같다.

요점: 기기는 IP 주소가 없고 어떤 망 구역에도 속하지 않는다. 기기와 서버 사이에는 선이 없고, 휴대폰이 중계자다. 휴대폰이 곁에 없으면 데이터가 올라가지 않는다.

### 구성 2 — Wi-Fi 기기가 클라우드 IoT 플랫폼에 직접 붙는 구성 (스마트 플러그, 가전)

구성요소: 모바일 앱, Wi-Fi 기기, 가정/현장 공유기(AP), 클라우드 IoT 플랫폼(기기 게이트웨이·메시지 브로커, 규칙 엔진, 디바이스 섀도/트윈, 레지스트리, 프로비저닝 서비스, 펌웨어 배포), 뒤쪽 처리(함수·DB·저장소), 앱 서버.

- 모바일 앱 → 기기 : (처음 한 번) BLE 또는 SoftAP 로 Wi-Fi 이름·비밀번호 전달. 앱 → 기기. [확인됨: ESP-IDF 프로비저닝 문서, AWS IoT Lens "personalization"]
- 기기 → 공유기 → 인터넷 → 클라우드 브로커 : MQTT over TLS / 8883 (또는 443), 기기가 먼저 건다(아웃바운드). 텔레메트리·상태 보고가 올라가고, 같은 연결로 명령·설정이 내려온다. [확인됨: AWS IoT 프로토콜 표, Azure IoT Hub 포트 표, IANA]
  - AWS IoT Core: MQTT 8883(X.509 인증서), MQTT 443(ALPN), MQTT over WebSocket 443, HTTPS 8443/443(발행만). QoS 0·1 지원.
  - Azure IoT Hub: MQTT 8883, AMQP 5671, MQTT/AMQP over WebSocket 443, HTTPS 443. 표 제목이 "기기가 열어야 하는 아웃바운드 포트".
- 기기 → 프로비저닝 서비스 : (처음 켤 때) 등록 요청, 기기 → 클라우드. 사물 등록·인증서·정책이 만들어진다. [확인됨: AWS 디바이스 프로비저닝, Azure DPS]
- 브로커 → 규칙 엔진 → 함수/DB/저장소 : 클라우드 안, 비동기. 메시지를 골라 뒤쪽으로 넘긴다. [확인됨: AWS "How AWS IoT works"]
- 모바일 앱/앱 서버 → 디바이스 섀도·트윈 : HTTPS(REST) 또는 MQTT, 앱 → 클라우드. "원하는 상태(desired)"를 쓰면 기기가 붙어 있을 때 전달된다. [확인됨: AWS Device Shadow, Azure Device Twin]
- 클라우드 → 기기 : 작업(Jobs)으로 펌웨어 갱신 지시, 기기가 내려받아 설치. 방향은 기기가 연 연결 위에서 내려온다. [확인됨: AWS IoT Jobs]

요점: 기기 쪽 방화벽은 들어오는 포트를 열 필요가 없다(기기가 밖으로 건다). 앱은 기기와 직접 통신하지 않고 클라우드를 거친다(처음 설정 때만 BLE/SoftAP 직결).

### 구성 3 — 근거리 무선 기기 → 게이트웨이(허브) → 브로커 (Zigbee·Thread·BLE 센서, 스마트홈·빌딩)

구성요소: 센서·액추에이터(Zigbee/Thread/BLE 메시), 게이트웨이(허브: Zigbee 코디네이터, Thread 보더 라우터, Matter 브리지, 엣지 런타임), 현장 LAN, 방화벽, MQTT 브로커(클라우드 또는 자체), 플랫폼.

- 기기 → 게이트웨이 : Zigbee(IEEE 802.15.4 메시) / Thread(802.15.4 위 IPv6) / BLE·블루투스 메시. 포트 없음(Zigbee·BLE). 측정값이 올라가고 제어가 내려간다. [확인됨: Zigbee2MQTT 문서, OpenThread, Bluetooth SIG]
  - Zigbee: 코디네이터가 망을 만들고, 라우터가 중계, 종단 기기는 부모 하나를 통해서만 통신.
  - Thread: 보더 라우터가 Thread 망과 Wi-Fi/이더넷을 양방향 IP 로 잇는다(프로토콜 변환이 아니라 IP 전달).
  - Matter: IPv6 위에서 동작. 새 기기 등록(커미셔닝)에 BLE 를 쓸 수 있다. Zigbee·Z-Wave·블루투스 메시 기기는 브리지를 거쳐 Matter 기기처럼 보인다.
- 게이트웨이 → 브로커 : MQTT over TLS / 8883(또는 WebSocket 443), 게이트웨이가 먼저 건다. 기기 메시지를 모아 올린다. [확인됨: Azure IoT Edge 게이트웨이, Mosquitto 브리지]
  - 투명 게이트웨이: 기기 신원이 그대로 클라우드에 보인다. 프로토콜 변환 게이트웨이: 클라우드에는 게이트웨이만 보인다. 신원 변환: 게이트웨이가 기기 대신 신원을 만들어 준다. [확인됨: Azure]
  - Azure 는 여러 기기 신원을 한 연결에 실어야 하는 필드 게이트웨이에는 AMQP 를 권한다.
- 게이트웨이(엣지 런타임) : 현장에서 거르고 모으고, 끊겼을 때 저장했다가 보낸다. [확인됨: AWS Greengrass, Azure IoT Edge]
- 모바일 앱 → 게이트웨이/기기 : 같은 집 LAN 안에서는 로컬 제어, 밖에서는 클라우드 경유. (로컬 제어 세부는 미확인)

요점: 게이트웨이가 기기망과 IP 망의 경계다. Azure 문서는 게이트웨이가 "연결된 기기를 인터넷 노출로부터 가리고, 연결이 없는 OT 망과 IT 망 사이에 놓인다"고 적는다.

### 구성 4 — 온프레미스: 자체 MQTT 브로커 + 자체 플랫폼 (공장·빌딩·공공)

구성요소: 현장 기기, 게이트웨이, 기기망(사물인터넷망), 방화벽 또는 망연계, MQTT 브로커(Mosquitto/EMQX, 이중화), IoT 플랫폼(ThingsBoard 등: 기기 관리·수집·시각화), 시계열 DB, 관리자 화면, 업무망.

- 기기/게이트웨이 → 브로커 : MQTT 1883(평문) 또는 8883(TLS), 기기 → 브로커. [확인됨: IANA, Mosquitto 기본 포트 1883]
  - Mosquitto: 리스너를 따로 정의하지 않으면 로컬에서만 접속 허용, allow_anonymous 기본 false. require_certificate 로 클라이언트 인증서 강제. [확인됨: mosquitto.conf]
  - EMQX 문서의 실행 예 포트: 1883, 8883, 8083(WebSocket), 8084, 18083(대시보드). [확인됨]
- 저사양 기기 → 플랫폼 : CoAP/UDP 5683, DTLS 는 5684. LwM2M 은 CoAP 위에서 기기 관리. [확인됨: RFC 7252, IANA, OMA 위키]
- 현장 브로커 → 중앙 브로커 : MQTT 브리지(브로커 간 연결, 토픽 지정). 현장 → 중앙. [확인됨: mosquitto.conf]
- 브로커 → 플랫폼/수집기 → 시계열 DB : 구독, 비동기.
- 관리자 → 플랫폼 화면 : HTTPS.
- 기기망 ↔ 업무망 : 방화벽 또는 망연계(망분리 대상 기관). 기존 시드 규칙과 같다.

LoRaWAN 변형(넓은 부지·도시): 종단 기기 → (LoRa 무선) → LoRaWAN 게이트웨이 → (셀룰러·Wi-Fi·이더넷 백홀, IP) → 네트워크 서버 → 응용 서버. 종단 기기는 특정 게이트웨이에 묶이지 않고, 게이트웨이는 내용을 처리하지 않고 넘기기만 한다. [확인됨: LoRa Alliance, The Things Network] AWS 는 네트워크 서버를 직접 운영하지 않는 "AWS IoT Core for LoRaWAN" 을 제공한다. [확인됨]

---

## 2. 구성요소 사전

| 요소 | 역할 | 보통 놓이는 곳 | 구성도에 적을 속성 |
|---|---|---|---|
| IoT 기기(센서·액추에이터) | 현장 값을 재거나 무언가를 움직인다 | 현장. BLE·Zigbee 기기는 IP 망 밖, Wi-Fi·이더넷 기기는 기기망(사물인터넷망) | 수량, 통신 방식(BLE/Zigbee/Thread/Wi-Fi/LoRaWAN/NB-IoT), 전원(배터리/상시), 보고 주기, 펌웨어 버전 |
| 모바일 앱 | BLE 로 기기와 직접 통신, 처음 설정, 클라우드 경유 원격 제어 | 사용자 휴대폰(인터넷망) | OS, BLE 역할(센트럴), 인증 방식 |
| IoT 게이트웨이(허브) | 근거리 무선 기기를 모아 IP 망·브로커로 넘긴다. 프로토콜 변환·현장 처리·오프라인 저장 | 기기망과 상위 망의 경계 | 받는 무선(Zigbee/Thread/BLE/LoRa), 위쪽 프로토콜(MQTT/AMQP), 방식(투명/프로토콜 변환), 연결 기기 수, 엣지 런타임 이름 |
| Zigbee 코디네이터 | Zigbee 망을 만들고 가입을 받는다 | 게이트웨이 안 | 채널, 연결 기기 수 |
| Thread 보더 라우터 | Thread 망 ↔ Wi-Fi/이더넷 IP 전달 | 게이트웨이·공유기·스피커 안 | — |
| LoRaWAN 게이트웨이 | LoRa 무선 ↔ IP 중계 | 옥상·전주 등 현장, 백홀로 인터넷 또는 사설망 | 백홀(셀룰러/이더넷), 대수 |
| LoRaWAN 네트워크 서버 | 게이트웨이·기기 관리, 중복 제거, 응용 서버로 전달 | 클라우드 또는 서버팜 | 제품, 관리형 여부 |
| MQTT 브로커 | 발행된 메시지를 구독자에게 분배 | 클라우드(관리형) 또는 DMZ·기기망 쪽 서버 구역 | 제품(Mosquitto/EMQX/IoT Core), 포트(1883/8883/443), TLS·클라이언트 인증서 여부, 노드 수, 버전(3.1.1/5.0), QoS |
| 기기 게이트웨이(클라우드) | 기기 접속을 받아 인증하는 클라우드 입구 | 클라우드 IoT 플랫폼 | 엔드포인트, 인증(X.509/토큰) |
| 규칙 엔진 | 메시지를 골라 저장소·함수 등으로 전달 | 클라우드 IoT 플랫폼 | 규칙 수, 대상 서비스 |
| 디바이스 섀도·트윈 | 기기 상태(원하는 값/보고된 값) 문서 보관 | 클라우드 IoT 플랫폼 | — |
| 디바이스 레지스트리 | 기기 신원·속성·인증서 목록 | 클라우드 IoT 플랫폼 | 등록 기기 수 |
| 프로비저닝 서비스 | 처음 켠 기기를 등록하고 인증서·정책 부여 | 클라우드 IoT 플랫폼 | 방식(사전 인증서/JITP/클레임/신뢰 사용자/DPS) |
| 펌웨어 배포(OTA) | 원격 작업으로 펌웨어·설정 갱신 | 클라우드 IoT 플랫폼 + 파일 저장소 | 대상 그룹, 배포 방식 |
| IoT 플랫폼(자체) | 기기 관리·수집·처리·시각화 | 서버팜 또는 사설 클라우드 | 제품(ThingsBoard 등), 지원 프로토콜 |
| CoAP/LwM2M 서버 | 저사양 기기의 자원 접근·기기 관리 | 플랫폼과 같은 구역 | 포트 5683/5684 |
| 시계열 DB | 측정값 저장 | 내부 구역 | 보존 기간(기존 `db_nosql`·InfluxDB 용어 재사용) |

---

## 3. 망·보안 관점

**어떤 망에 두나**
- BLE·NFC·Zigbee 구간은 IP 망이 아니다. 망 구역으로 감싸지 말고 "현장"이라는 자리 표시만 둔다. 휴대폰과 기기를 잇는 BLE 는 방화벽·공유기·인터넷을 거치지 않는 직접 무선 연결이다(Android 문서: 앱이 스캔해 기기의 GATT 서버에 연결).
- IP 를 쓰는 기기(Wi-Fi·이더넷)와 게이트웨이는 업무망과 나눈 기기망(시드의 `iot-net`)에 둔다. 기존 규칙대로 `iot-net ↔ business-net` 은 통제 장비(망연계 또는 방화벽)를 거친다.
- 게이트웨이가 경계다. AWS IoT Lens 는 게이트웨이를 "엣지 컴퓨팅, 네트워크 분할, 보안 준수, 관리 영역 연결"에 쓰라고 적고, Azure 는 게이트웨이가 기기를 인터넷 노출로부터 가린다고 적는다.
- 브로커는 기기가 닿을 수 있어야 하므로 클라우드(관리형)이거나, 자체 구축이면 기기망에서 닿는 서버 구역/DMZ 에 둔다. 업무 시스템은 브로커를 구독하는 쪽이지 기기가 업무망 안으로 들어오게 하지 않는다.

**망 사이를 무엇으로 잇나**
- 기기/게이트웨이 → 클라우드 브로커: 방화벽에서 아웃바운드 8883(또는 443)만 허용. 인바운드 개방 없음. Azure 문서는 8883·5671 이 막힌 망에서는 WebSocket 443 을 쓰라고 적는다.
- 기기망 ↔ 업무망: 방화벽(일반 기업) 또는 망연계(망분리 대상 기관).
- 현장 브로커 ↔ 중앙 브로커: MQTT 브리지 + TLS, 현장이 밖으로 건다.
- 앱 ↔ 기기(BLE): 잇는 장비 없음(직접). 보안은 페어링·본딩과 앱 계층 암호화로 한다. Android 문서는 "페어링한 기기의 데이터는 그 휴대폰의 모든 앱이 접근할 수 있으므로 민감한 데이터는 앱 계층 보안을 구현하라"고 경고한다.

**인증·암호화**
- 기기마다 신원 하나(X.509 클라이언트 인증서)와 최소 권한 정책(정해진 클라이언트 ID·토픽만). [확인됨: AWS 보안 모범 사례]
- MQTT 규격은 TLS 를 쓰는 서버가 8883 을 쓰도록 권하고, 사용자명/비밀번호 또는 클라이언트 인증서로 인증할 수 있다고 적는다(3.1.1 §5.1, §5.4.1).
- 기기 시계가 틀리면 인증서 검증이 실패하므로 NTP 동기화가 필요하다. [확인됨: AWS]
- 클레임 인증서(여러 기기 공용 임시 인증서)는 유출 시 위험이 크다고 AWS 가 직접 적는다.

**흔한 실수**
1. BLE 기기에서 서버로 직접 선을 긋는다 → 실제로는 휴대폰 앱이나 게이트웨이가 중계한다.
2. 앱 ↔ 기기 BLE 선 위에 방화벽·공유기를 그린다 → IP 망을 거치지 않는다.
3. 클라우드에서 기기로 들어가는 인바운드 선을 그린다 → 기기가 먼저 연 MQTT 연결 위로 내려간다.
4. MQTT 를 평문 1883 으로 인터넷에 노출한다 → 8883(TLS) 또는 443(WSS).
5. 기기를 업무망·사무용 무선망에 섞는다 → 기기망으로 분리.
6. 모든 기기가 같은 인증서·비밀번호를 쓴다 → 기기별 신원.
7. Zigbee 기기가 브로커에 직접 MQTT 로 붙는 것처럼 그린다 → Zigbee 는 코디네이터/허브가 MQTT 로 바꿔 준다.
8. Thread 보더 라우터와 Matter 브리지를 같은 것으로 그린다 → 앞은 IP 전달, 뒤는 프로토콜 변환.
9. 브로커에서 DB 로 직접 선을 긋는다 → 규칙 엔진이나 구독하는 수집 서비스가 사이에 있다.

**국내 규정·가이드**
- 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 제48조의6(정보통신망연결기기등에 관한 인증): IoT 보안인증의 근거. KISA 안내 페이지는 제도를 "IoT 제품이 정보보호인증기준에 적합함을 시험하여 인증서를 발급하는 제도", 대상을 "IoT 제품 및 제품과 연동되는 모바일 앱", 등급을 Lite·Basic·Standard, 인증 영역을 7개(식별 및 인증, 데이터 보호, 암호, 소프트웨어 보안, 업데이트 및 기술지원, 운영체제 및 네트워크 보안, 하드웨어 보안)로 적는다. [KISA 페이지 확인됨. 조문 원문은 law.go.kr 이 본문을 내주지 않아 법령 사본 사이트와 시험기관(KTR) 안내로만 확인]
- 적용 기준: 「정보통신망연결기기등에 대한 정보보호인증기준」(과학기술정보통신부고시 제2021-73호) — KTR 안내 페이지에서 고시 이름·번호 확인. 고시 원문은 열지 않았고 현행 번호인지 미확인.
- KISA 가이드라인 게시판에서 제목·등록일을 확인한 문서: 「IoT 공통보안원칙」(2016-03-21), 「IoT 공통보안 가이드」(2016-10-06), 「홈ㆍ가전 IoT 보안가이드」(2017-08-07), 「스마트의료 사이버보안 가이드」(2018-05-29), 「스마트교통 사이버보안 가이드」(2018-05-29), 「스마트공장 사이버보안 가이드」(2019-12-26). PDF 본문은 열지 않았으므로 어떤 망 구성 요구가 들어 있는지는 미확인.
- 「지능형 홈네트워크 설비 설치 및 기술기준」(공동주택 홈네트워크): 세대별 망분리 의무 조항이 있다는 것은 언론 보도로만 확인. 조문 번호(제14조 제2항 / 제14조의2)와 시행일이 자료마다 달라 원문 확인 필요.

---

## 4. 구성도를 그리는 AI 에게 줄 지침 후보

1. 모바일 앱과 BLE 기기는 망 구역·방화벽·공유기를 거치지 않는 직접 무선 선으로 잇고 선 이름에 "BLE(GATT)"를 적는다.
2. BLE·Zigbee·NFC 만 쓰는 기기에서 서버나 브로커로 직접 선을 긋지 않는다. 휴대폰 앱이나 게이트웨이를 거쳐 잇는다.
3. 근거리 무선 기기(Zigbee, Thread, 블루투스 메시)는 게이트웨이(허브)에 잇고 선 이름에 무선 종류를 적는다. 이 선에는 포트를 적지 않는다.
4. 게이트웨이나 Wi-Fi 기기는 브로커에 "MQTT/TLS 8883"으로 잇고, 화살표는 기기·게이트웨이에서 브로커 쪽으로 향하게 한다.
5. 클라우드에서 기기로 가는 명령·펌웨어는 새 인바운드 선을 만들지 않고, 기기가 연 MQTT 연결의 내려가는 흐름으로 설명한다.
6. 8883 을 못 여는 망이라고 하면 "MQTT over WebSocket 443"으로 잇는다.
7. IP 를 쓰는 기기와 게이트웨이는 사물인터넷망(기기망)에 두고, 업무망과는 방화벽이나 망연계를 거쳐 잇는다.
8. 게이트웨이는 기기망의 경계에 두고, 기기를 인터넷에 직접 내놓지 않는다.
9. 브로커 뒤에는 규칙 엔진이나 구독하는 수집 서비스를 두고 그것을 거쳐 DB·저장소로 잇는다. 브로커와 뒤쪽 처리 사이는 비동기 선으로 그린다.
10. 앱이 원격으로 기기를 제어하면 앱 → 클라우드(API·디바이스 섀도) → 브로커 → 기기 순으로 잇고, 앱 → 기기 직접 선은 BLE 로 가까이 있을 때만 그린다.
11. 처음 설정(Wi-Fi 프로비저닝, 커미셔닝)은 앱 → 기기 BLE 또는 SoftAP 선으로 그리고 "처음 등록 때만"이라고 적는다.
12. LoRaWAN 은 종단 기기 → 게이트웨이 → 네트워크 서버 → 응용 서버 순으로 잇고, 게이트웨이와 네트워크 서버 사이만 IP 선(백홀)으로 그린다.

**카탈로그에 더하면 좋을 것(제안, 코드는 고치지 않음)**
- 노드 종류: `iot_device`(IoT 기기; 속성: 수량·통신 방식·전원·펌웨어), `iot_gateway`(IoT 게이트웨이; 속성: 받는 무선·위쪽 프로토콜·방식), `mqtt_broker`(MQTT 브로커; 지금은 `queue`/`stream`으로 대신할 수 있으나 성격이 다름), `iot_platform`(관리형 IoT 서비스; `managed_service`로 대신 가능).
- 선 종류 또는 선 속성: "무선 직접(비IP)" — 방화벽·망 경계 경고 대상에서 빼야 한다. 지금의 request/async 는 모두 IP 통신을 전제로 한다.
- 망 규칙 후보: `iot-net ↔ internet` = firewall(아웃바운드 8883/443 만, 클라우드 브로커용) — 현재 `iot-net` 은 closed 등급이라 기본값이 막힘일 가능성이 있어 클라우드 IoT 구성과 충돌할 수 있다(등급 규칙 구현은 확인하지 않음). `iot-net ↔ office-net`/`office-wlan` = 분리 권장.
- 자리 표시: "현장(비IP 무선 구간)" 그룹 — 망이 아님을 드러내는 점선 묶음.

---

## 5. 확인하지 못한 것·출처가 갈리는 것

- Bluetooth Core 규격 원문은 열지 않았다. GATT·역할 정의는 Android 공식 문서, 페어링·본딩은 Bluetooth SIG 블로그, 채널 수는 SIG 개요 페이지 기준이다. "BLE 는 IP 를 쓰지 않는다"는 문장 자체는 어느 출처에도 없고, 연결 절차(스캔 → GATT 서버 연결) 설명에서 끌어낸 것이다. (BLE 위에 IPv6 를 올리는 프로파일이 따로 있다는 점은 조사하지 않았다.)
- MQTT 5.0 규격은 길어서 4.2(네트워크 연결)·4.7(토픽) 본문을 읽지 못했다. 포트 1883/8883 은 IANA 등록부와 MQTT 3.1.1 §5.1 로, 와일드카드 규칙은 3.1.1 부록의 규범 문장으로 확인했다. 토픽 구분자 "/" 문자는 읽은 발췌에 없었다.
- MQTT 규격은 "브로커"가 아니라 "Server"라고 부른다. "브로커"는 AWS·Mosquitto 등 제품 문서의 용어다.
- Matter 규격 원문과 CSA 소개 페이지에서는 전송 계층 목록을 확인하지 못했다. 구글 문서는 "어떤 IPv6 전송 위에서도 동작", "BLE 로 커미셔닝할 수 있다"고만 적는다. 패브릭·컨트롤러 개념, 로컬 제어 경로는 미확인.
- Zigbee 대역: CSA 는 "2.4GHz 와 Sub-GHz"를 적는다. "Zigbee = 2.4GHz"로 단정하지 않는다. 코디네이터가 망에 하나라는 점은 Zigbee2MQTT 문서 수준이다.
- LoRaWAN 기기 클래스(A/B/C)와 키 이름·길이는 확인하지 못했다(TTN 문서에 NwkSKey/AppSKey 이름과 "128비트 AES" 언급만 있음).
- LwM2M: 부트스트랩 서버, 펌웨어 업데이트 객체, DTLS 사용은 열람 페이지에 없었다. "CoAP 를 전송에 쓴다"와 "기기 관리 프로토콜"만 확인.
- NB-IoT: GSMA 페이지가 403. 용어는 verified=false 로 냈다. LTE-M, Z-Wave, 비콘 규격은 조사하지 않았다.
- "OTA"라는 약어는 열람한 AWS·Azure 페이지에 나오지 않는다(원격 펌웨어 업데이트로 설명).
- Azure: 문서가 "IoT Hub 의 MQTT 지원은 제한적이며 MQTT 3.1.1/5 전체가 필요하면 Event Grid MQTT 브로커를 보라"고 적는다. 또 새 엣지 연결 구성에는 Azure IoT Operations 를 우선 권한다고 적어, IoT Edge 중심 설명은 앞으로 바뀔 수 있다.
- AWS: Greengrass V1 은 2026-10-07 지원 종료(문서 공지). Greengrass 의 로컬 클라이언트 기기 연결 세부는 읽지 않았다.
- 국내: law.go.kr 은 본문이 스크립트로 불려 와 조문을 읽지 못했다. 정보통신망법 제48조의6 은 법령 사본 사이트(보조)와 KTR 안내로 확인. IoT 보안인증 법정 시행 시점은 보도마다 2021년/2022년으로 갈린다. 등급별 항목 수(10/23/41)는 2019년 안내문 검색 요약에만 나와 쓰지 않았다.
- 국내: 홈네트워크 고시는 원문 미열람. 조문 번호가 "제14조 제2항"(아이뉴스24)과 "제14조의2"(다른 보도)로 갈리고, 시행일도 보도에 따라 다르다.
- KISA IoT 가이드 PDF 본문은 열지 않았다(제목·등록일만). ETSI EN 303 645, NIST IR 8259 는 확인하지 못했다(ETSI 페이지는 다른 표준 내용이 나옴).
- `iot-net` 이 closed 등급이라 클라우드 브로커로 나가는 구성에서 경고가 어떻게 뜨는지는 코드(`networkRules.ts`)를 읽지 않아 모른다.

---

## 6. 출처 목록

| 제목 | 기관 | URL | 열람 |
|---|---|---|---|
| Bluetooth Low Energy (Android Developers) | Google | https://developer.android.com/develop/connectivity/bluetooth/ble/ble-overview | 열람 |
| Bluetooth Technology Overview | Bluetooth SIG | https://www.bluetooth.com/learn-about-bluetooth/tech-overview/ | 열람 |
| Bluetooth Pairing Part 1 – Pairing Feature Exchange | Bluetooth SIG(블로그) | https://www.bluetooth.com/blog/bluetooth-pairing-part-1-pairing-feature-exchange/ | 열람 |
| Bluetooth Mesh | Bluetooth SIG | https://www.bluetooth.com/learn-about-bluetooth/feature-enhancements/mesh/ | 열람(내용 적음) |
| NFC Technology | NFC Forum | https://nfc-forum.org/learn/nfc-technology/ | 열람 |
| Zigbee | Connectivity Standards Alliance | https://csa-iot.org/all-solutions/zigbee/ | 열람 |
| Zigbee network | Zigbee2MQTT(오픈소스 문서) | https://www.zigbee2mqtt.io/advanced/zigbee/01_zigbee_network.html | 열람 |
| Zigbee2MQTT 첫 화면 | Zigbee2MQTT | https://www.zigbee2mqtt.io/ | 열람 |
| Zigbee Fundamentals | Silicon Labs | https://docs.silabs.com/zigbee/latest/zigbee-fundamentals/ | 목차만 나옴 |
| RFC 4944 (IPv6 over IEEE 802.15.4) | IETF | https://www.rfc-editor.org/rfc/rfc4944 | 열람 |
| Thread Primer | OpenThread | https://openthread.io/guides/thread-primer | 열람 |
| OpenThread Border Router | OpenThread | https://openthread.io/guides/border-router | 열람 |
| Matter Primer | Google Home Developers | https://developers.home.google.com/matter/primer | 열람 |
| Matter | Connectivity Standards Alliance | https://csa-iot.org/all-solutions/matter/ | 열람(소개 문구뿐) |
| Matter Handbook – How It Works | CSA | https://handbook.buildwithmatter.com/how-it-works/ | 목차만 나옴 |
| About LoRaWAN | LoRa Alliance | https://lora-alliance.org/about-lorawan/ | 열람 |
| LoRaWAN Architecture | The Things Network | https://www.thethingsnetwork.org/docs/lorawan/architecture/ | 열람 |
| Narrow Band IoT | GSMA | https://www.gsma.com/solutions-and-impact/technologies/internet-of-things/narrow-band-internet-of-things-nb-iot/ | 막힘(403) |
| ESP-IDF Unified Provisioning | Espressif | https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-reference/provisioning/provisioning.html | 열람 |
| Wi-Fi Easy Connect | Wi-Fi Alliance | https://www.wi-fi.org/discover-wi-fi/wi-fi-easy-connect | 열람 |
| MQTT Version 5.0 | OASIS | https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html | 일부 열람(1~3장) |
| MQTT Version 3.1.1 | OASIS | https://docs.oasis-open.org/mqtt/mqtt/v3.1.1/os/mqtt-v3.1.1-os.html | 일부 열람(5장·부록) |
| Service Name and Port Registry (mqtt) | IANA | https://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.xhtml?search=mqtt | 열람 |
| Service Name and Port Registry (coap) | IANA | https://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.xhtml?search=coap | 열람 |
| RFC 7252 (CoAP) | IETF | https://www.rfc-editor.org/rfc/rfc7252 | 일부 열람(앞부분) |
| Lightweight M2M | OMA SpecWorks | https://www.openmobilealliance.org/specifications/lwm2m | 열람(소개뿐) |
| OMA LwM2M for Developers wiki | Open Mobile Alliance | https://github.com/OpenMobileAlliance/OMA_LwM2M_for_Developers/wiki | 열람 |
| Eclipse Mosquitto | Eclipse Foundation | https://mosquitto.org/ | 열람 |
| mosquitto.conf man page | Eclipse Mosquitto | https://mosquitto.org/man/mosquitto-conf-5.html | 열람 |
| EMQX Getting Started | EMQ | https://docs.emqx.com/en/emqx/latest/getting-started/getting-started.html | 열람 |
| What is ThingsBoard? | ThingsBoard | https://thingsboard.io/docs/getting-started-guides/what-is-thingsboard/ | 열람 |
| How AWS IoT works | AWS | https://docs.aws.amazon.com/iot/latest/developerguide/aws-iot-how-it-works.html | 열람 |
| Device communication protocols | AWS | https://docs.aws.amazon.com/iot/latest/developerguide/protocols.html | 열람 |
| AWS IoT Device Shadow service | AWS | https://docs.aws.amazon.com/iot/latest/developerguide/iot-device-shadows.html | 열람 |
| AWS IoT Jobs | AWS | https://docs.aws.amazon.com/iot/latest/developerguide/iot-jobs.html | 열람 |
| Device provisioning | AWS | https://docs.aws.amazon.com/iot/latest/developerguide/iot-provision.html | 열람 |
| Security best practices in AWS IoT Core | AWS | https://docs.aws.amazon.com/iot/latest/developerguide/security-best-practices.html | 열람 |
| What is AWS IoT Greengrass? | AWS | https://docs.aws.amazon.com/greengrass/v2/developerguide/what-is-iot-greengrass.html | 열람 |
| IoT Lens – Design principles | AWS | https://docs.aws.amazon.com/wellarchitected/latest/iot-lens/design-principles.html | 열람 |
| IoT Hub communication protocols and ports | Microsoft | https://learn.microsoft.com/en-us/azure/iot-hub/iot-hub-devguide-protocols | 열람 |
| Understand IoT Hub device twins | Microsoft | https://learn.microsoft.com/en-us/azure/iot-hub/iot-hub-devguide-device-twins | 열람 |
| Use IoT Edge as a gateway | Microsoft | https://learn.microsoft.com/en-us/azure/iot-edge/iot-edge-as-gateway | 열람 |
| What is Azure IoT Edge | Microsoft | https://learn.microsoft.com/en-us/azure/iot-edge/about-iot-edge | 열람 |
| Introduction to Azure IoT (참조 구조 URL 이 여기로 넘어옴) | Microsoft | https://learn.microsoft.com/en-us/azure/iot/iot-introduction | 열람 |
| Overview of IoT Hub Device Provisioning Service | Microsoft | https://learn.microsoft.com/en-us/azure/iot-dps/about-iot-dps | 열람 |
| 정보통신망연결기기 보안인증(IoT) | KISA | https://www.kisa.or.kr/1050608 | 열람 |
| IoT 공통보안원칙 (게시글) | KISA | https://www.kisa.or.kr/2060205/form?page=6&postSeq=1 | 게시글 열람, PDF 미열람 |
| IoT 공통보안 가이드 (게시글) | KISA | https://www.kisa.or.kr/2060205/form?postSeq=2 | 게시글 열람, PDF 미열람 |
| 홈ㆍ가전 IoT 보안가이드 (게시글) | KISA | https://www.kisa.or.kr/2060205/form?postSeq=3 | 게시글 열람, PDF 미열람 |
| 스마트의료/스마트교통/스마트공장 사이버보안 가이드 (게시글) | KISA | https://www.kisa.or.kr/2060205/form?postSeq=4 (5, 6) | 게시글 열람, PDF 미열람 |
| IoT 보안인증 안내 | KTR(보조) | https://ktr.or.kr/test-evaluation/cybersecurity/contentsid/2673/index.do | 열람 |
| 정보통신망법 제48조의6 | 케이스노트(보조, 법령 사본) | https://casenote.kr/법령/정보통신망_이용촉진_및_정보보호_등에_관한_법률/제48조의6 | 열람(요약 형태) |
| 정보통신망법 제48조의6 | 국가법령정보센터 | https://www.law.go.kr/법령/정보통신망이용촉진및정보보호등에관한법률/제48조의6 | 막힘(본문 미표시) |
| 지능형 홈네트워크 설비 설치 및 기술기준 | 국가법령정보센터 / 국토교통부 | https://www.law.go.kr/행정규칙/지능형홈네트워크설비설치및기술기준 | 막힘(본문 미표시, 국토부 페이지는 리다이렉트 오류) |
| 홈네트워크 망분리 관련 기사(2022-06-29) | 아이뉴스24(보조) | https://www.inews24.com/view/1495489 | 열람 |
| KISA IoT 보안인증(옛 주소) | KISA | https://www.kisa.or.kr/1050604 | 막힘(500) |
| Consumer IoT security | ETSI | https://www.etsi.org/technologies/consumer-iot-security | 열람했으나 EN 303 645 내용 없음 |
