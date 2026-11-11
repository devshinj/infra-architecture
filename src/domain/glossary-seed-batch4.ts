import type { GlossarySeedEntry } from "./glossary-seed";

// 용어 사전 초안 4차분: BLE·IoT 기기 통신, CCTV·영상 관제, WebRTC 실시간 영상·음성, LLM 서빙·AI 에이전트.
// 출처 페이지를 열어 확인했고 1차 출처(표준·공식 문서·기관 문서)가 하나 이상 있는 항목만 옮겼다.
// 항목별 출처와 주의할 점은 docs/research/2026-11-12-field-realtime-ai/ 의 JSON 에 있다.
// 처음엔 모두 "미검수"로 들어간다. 규칙은 glossary-seed.ts 머리말과 같다(사전식 한 문장 120자, 제품은 why·compare 비움, aliases 는 normalizeTerm 값).

export const GLOSSARY_SEED_BATCH4: GlossarySeedEntry[] = [
  // ── BLE · IoT 기기 통신 ──
  {
    term: "BLE",
    fullName: "저전력 블루투스(Bluetooth Low Energy)",
    category: "IoT / 근거리 무선",
    definition:
      "BLE는 전력을 적게 쓰도록 설계되어 가까운 기기끼리 적은 양의 데이터를 주고받는 2.4GHz 대역 블루투스 무선 방식입니다.",
    why: "배터리로 오래 동작해야 하는 센서·웨어러블을 휴대폰 앱과 바로 연결할 때 씁니다.",
    compare: "BLE는 앱과 기기가 무선으로 직접 붙고, Wi-Fi는 공유기와 IP 망을 거쳐 통신합니다.",
    aliases: ["bluetoothlowenergy", "bluetoothle", "저전력블루투스", "블루투스le"],
  },
  {
    term: "GATT",
    fullName: "일반 속성 프로파일(Generic Attribute Profile)",
    category: "IoT / BLE",
    definition:
      "GATT는 BLE 연결 위에서 속성이라는 짧은 데이터를 서비스와 특성 단위로 읽고 쓰는 방법을 정한 규격입니다.",
    why: "제조사가 달라도 앱이 기기의 값(심박수, 배터리 등)을 같은 방식으로 읽고 쓰게 합니다.",
    compare: "GATT는 연결된 뒤 데이터를 주고받는 규칙이고, 광고·스캔은 연결 전에 기기를 찾는 절차입니다.",
    aliases: ["genericattributeprofile", "gatt프로파일", "att", "gatt서버", "gatt클라이언트"],
  },
  {
    term: "GATT 특성",
    fullName: "GATT 서비스·특성(Service / Characteristic)",
    category: "IoT / BLE",
    definition:
      "GATT 특성은 값 하나와 그 값을 설명하는 디스크립터로 이루어진 데이터 항목이며, 특성 여러 개를 묶은 것이 서비스입니다.",
    why: "앱이 UUID로 원하는 값을 골라 읽기·쓰기·알림 받기를 하게 합니다.",
    compare: "특성은 값 하나를 가리키고, 서비스는 관련된 특성을 모아 둔 묶음입니다.",
    aliases: ["characteristic", "캐릭터리스틱", "gatt서비스", "descriptor", "uuid"],
  },
  {
    term: "센트럴·페리페럴",
    fullName: "BLE 센트럴 / 페리페럴 역할(Central / Peripheral)",
    category: "IoT / BLE",
    definition:
      "센트럴은 광고를 스캔해 연결을 거는 쪽이고 페리페럴은 광고를 내보내며 연결을 기다리는 쪽인 BLE 연결 역할 구분입니다.",
    why: "누가 찾고 누가 찾아지는지를 정해 연결 방향을 분명히 합니다.",
    compare: "센트럴·페리페럴은 연결을 맺는 역할이고, GATT 서버·클라이언트는 연결 뒤 데이터를 주고받는 역할입니다.",
    aliases: ["central", "peripheral", "센트럴", "페리페럴", "주변장치"],
  },
  {
    term: "BLE 광고·스캔",
    fullName: "BLE 광고와 스캔(Advertising / Scanning)",
    category: "IoT / BLE",
    definition:
      "BLE 광고·스캔은 기기가 자기 존재를 알리는 짧은 신호를 주기적으로 내보내고 휴대폰이 그 신호를 찾아내는 절차입니다.",
    why: "연결하기 전에 주변에 어떤 기기가 있는지 알아내기 위해 씁니다.",
    compare: "광고는 연결 없이 한쪽에서 뿌리는 신호이고, GATT 통신은 연결을 맺은 뒤 양쪽이 주고받습니다.",
    aliases: ["advertising", "scanning", "애드버타이징", "ble스캔", "비콘"],
  },
  {
    term: "BLE 페어링",
    fullName: "블루투스 페어링(Pairing)",
    category: "IoT / BLE 보안",
    definition:
      "BLE 페어링은 두 기기가 연결 구간을 암호화하는 데 쓸 키를 만들어 나누는 절차입니다.",
    why: "가까이 있는 다른 사람이 무선 구간의 데이터를 엿보거나 끼어드는 것을 막기 위해 씁니다.",
    compare: "페어링은 이번 연결에 쓸 키를 만드는 절차이고, 본딩은 그 키를 저장해 다음에도 쓰는 것입니다.",
    aliases: ["pairing", "페어링", "justworks", "passkeyentry", "lesecureconnections"],
  },
  {
    term: "BLE 본딩",
    fullName: "블루투스 본딩(Bonding)",
    category: "IoT / BLE 보안",
    definition:
      "BLE 본딩은 페어링 뒤에 장기 키를 주고받아 저장해 두어 다음 연결 때 다시 페어링하지 않게 하는 것입니다.",
    why: "한 번 등록한 기기를 다시 켤 때마다 인증 절차를 반복하지 않게 합니다.",
    compare: "BLE 본딩은 블루투스 키 저장을 뜻하고, 서버 랜카드를 묶는 본딩·티밍과는 다른 말입니다.",
    aliases: ["블루투스본딩", "ltk", "장기키"],
  },
  {
    term: "대역 외 페어링",
    fullName: "대역 외 페어링(Out-of-Band Pairing)",
    category: "IoT / BLE 보안",
    definition:
      "대역 외 페어링은 페어링에 필요한 정보 일부를 블루투스가 아닌 NFC나 QR 코드 같은 다른 수단으로 주고받는 방식입니다.",
    why: "기기를 직접 대거나 찍은 사람만 등록할 수 있게 해 엉뚱한 기기와 연결되는 일을 줄입니다.",
    compare: "대역 외 페어링은 다른 통신 수단을 빌려 쓰고, Just Works는 추가 확인 없이 블루투스만으로 맺습니다.",
    aliases: ["oob페어링", "nfc페어링", "qr페어링"],
  },
  {
    term: "블루투스 메시",
    fullName: "블루투스 메시 네트워킹(Bluetooth Mesh Networking)",
    category: "IoT / 근거리 무선",
    definition:
      "블루투스 메시는 여러 블루투스 기기가 메시지를 서로 중계해 여러 홉 너머의 기기까지 전달하는 네트워크 방식입니다.",
    why: "조명처럼 수가 많고 넓게 퍼진 기기를 한 번에 제어할 때 씁니다.",
    compare: "블루투스 메시는 기기들이 서로 중계하고, 일반 BLE 연결은 휴대폰과 기기 둘 사이에서만 통신합니다.",
    aliases: ["bluetoothmesh", "ble메시", "managedflood"],
  },
  {
    term: "NFC",
    fullName: "근거리 무선 통신(Near Field Communication)",
    category: "IoT / 근거리 무선",
    definition:
      "NFC는 13.56MHz 주파수로 몇 센티미터 안에서만 동작하는 비접촉 무선 통신 기술입니다.",
    why: "기기를 갖다 대는 동작만으로 결제, 출입, 기기 등록 정보를 주고받게 합니다.",
    compare: "NFC는 대야만 될 만큼 거리가 짧고, BLE는 수 미터 떨어져도 연결됩니다.",
    aliases: ["nearfieldcommunication", "엔에프씨", "nfc태그", "태깅"],
  },
  {
    term: "Zigbee",
    fullName: "지그비(Zigbee)",
    category: "IoT / 근거리 무선",
    definition:
      "Zigbee는 IEEE 802.15.4 무선 위에서 기기들이 서로 중계하는 메시 망을 이루는 저전력 근거리 통신 규격입니다.",
    why: "전구·스위치·센서처럼 수가 많고 전력이 적은 기기를 허브 하나에 묶을 때 씁니다.",
    compare: "Zigbee는 IP를 쓰지 않아 허브가 있어야 IP 망과 이어지고, Thread는 기기마다 IPv6 주소를 갖습니다.",
    aliases: ["지그비", "zigbeepro"],
  },
  {
    term: "Zigbee 코디네이터",
    fullName: "Zigbee 코디네이터(Coordinator)",
    category: "IoT / 근거리 무선",
    definition:
      "Zigbee 코디네이터는 채널과 망 식별자, 보안 방식을 정해 Zigbee 망을 처음 만드는 특별한 라우터 역할의 기기입니다.",
    why: "Zigbee 망마다 망을 세우고 기기 가입을 받아 주는 기준점이 필요해서 둡니다.",
    compare: "코디네이터는 망에 하나만 있고 망을 만들며, 라우터는 여러 대가 중계만 하고, 종단 기기는 중계하지 않습니다.",
    aliases: ["coordinator", "지그비코디네이터", "zigbee허브", "zigbee라우터", "종단기기"],
  },
  {
    term: "IEEE 802.15.4",
    fullName: "IEEE 802.15.4 저속 무선 개인 통신망 표준",
    category: "IoT / 근거리 무선",
    definition:
      "IEEE 802.15.4는 Zigbee와 Thread가 아래층으로 함께 쓰는 저전력·저속 무선의 물리 계층과 MAC 계층 표준입니다.",
    why: "작은 배터리 기기가 짧은 프레임으로 통신하도록 무선 구간의 공통 바탕을 정합니다.",
    compare: "802.15.4는 무선 구간만 정하고, 그 위의 망 구성과 응용 규칙은 Zigbee나 Thread가 정합니다.",
    aliases: ["lrwpan", "6lowpan"],
  },
  {
    term: "Thread",
    fullName: "스레드(Thread)",
    category: "IoT / 근거리 무선",
    definition:
      "Thread는 IEEE 802.15.4 무선 메시 위에서 동작하는 저전력 기기용 IPv6 기반 네트워크 프로토콜입니다.",
    why: "배터리 기기도 IP 주소를 갖고 다른 IP 망과 바로 통신하게 하려고 씁니다.",
    compare: "Thread는 IPv6를 그대로 쓰고 보더 라우터로 이어지며, Zigbee는 허브가 프로토콜을 바꿔 줘야 합니다.",
    aliases: ["스레드", "thread네트워크", "openthread"],
  },
  {
    term: "Thread 보더 라우터",
    fullName: "Thread 보더 라우터(Thread Border Router)",
    category: "IoT / 근거리 무선",
    definition:
      "Thread 보더 라우터는 Thread 망을 Wi-Fi나 이더넷 같은 다른 IP 망과 이어 양방향으로 IP 통신이 되게 하는 장치입니다.",
    why: "Thread 기기가 집이나 건물의 IP 망, 나아가 클라우드와 통신하려면 이 장치가 있어야 합니다.",
    compare: "보더 라우터는 IP 패킷을 그대로 넘겨 주고, Zigbee 허브는 프로토콜을 바꿔서 전달합니다.",
    aliases: ["borderrouter", "보더라우터", "otbr", "경계라우터"],
  },
  {
    term: "Matter",
    fullName: "매터(Matter)",
    category: "IoT / 스마트홈 표준",
    definition:
      "Matter는 IPv6 위에서 동작하며 제조사가 다른 스마트홈 기기와 앱이 같은 방식으로 통신하게 하는 연결 표준입니다.",
    why: "기기를 한 번 등록하면 여러 회사의 스마트홈 앱에서 함께 쓰게 하려고 씁니다.",
    compare: "Matter는 기기끼리 쓰는 공통 언어이고, Thread와 Wi-Fi는 그 아래에서 데이터를 실어 나르는 망입니다.",
    aliases: ["매터", "matter표준", "csamatter"],
  },
  {
    term: "Matter 브리지",
    fullName: "Matter 브리지(Bridge)",
    category: "IoT / 스마트홈 표준",
    definition:
      "Matter 브리지는 Matter 망과 Zigbee 같은 다른 IoT 기술 양쪽에 속해 그쪽 기기를 Matter 기기처럼 보이게 하는 장치입니다.",
    why: "이미 설치한 Zigbee·Z-Wave 기기를 버리지 않고 Matter 앱에서 함께 쓰게 합니다.",
    compare: "브리지는 프로토콜을 바꿔 주고, Thread 보더 라우터는 IP 패킷을 바꾸지 않고 넘깁니다.",
    aliases: ["bridge", "브리지", "브릿지"],
  },
  {
    term: "커미셔닝",
    fullName: "기기 커미셔닝(Commissioning)",
    category: "IoT / 기기 등록",
    definition:
      "커미셔닝은 새 기기를 인증하고 망에 가입시켜 쓸 수 있는 상태로 만드는 처음 등록 절차입니다.",
    why: "허락받은 기기만 망에 들어오게 하고 망 접속 정보를 안전하게 넘겨주기 위해 거칩니다.",
    compare: "커미셔닝은 가까운 망에 기기를 가입시키는 일이고, 클라우드 프로비저닝은 클라우드에 기기 신원을 등록하는 일입니다.",
    aliases: ["commissioning", "온보딩", "기기등록", "onboarding"],
  },
  {
    term: "LPWAN",
    fullName: "저전력 광역 통신망(Low Power Wide Area Network)",
    category: "IoT / 광역 무선",
    definition:
      "LPWAN은 배터리로 동작하는 기기를 적은 전력으로 먼 거리에서 인터넷에 연결하는 무선 통신망 종류입니다.",
    why: "검침기·환경 센서처럼 넓은 지역에 흩어져 가끔 조금씩만 보내는 기기에 씁니다.",
    compare: "LPWAN은 멀리 가지만 보내는 양이 적고, Wi-Fi는 가까운 거리에서 많은 양을 보냅니다.",
    aliases: ["lpwa", "저전력광역망", "lowpowerwidearea"],
  },
  {
    term: "LoRaWAN",
    fullName: "로라완(LoRaWAN)",
    category: "IoT / 광역 무선",
    definition:
      "LoRaWAN은 비면허 대역에서 종단 기기, 게이트웨이, 네트워크 서버, 응용 서버로 이루어지는 저전력 광역 통신망 규격입니다.",
    why: "통신사 회선 없이도 넓은 부지나 도시에 센서 망을 직접 깔 수 있게 합니다.",
    compare: "LoRaWAN은 비면허 대역에 직접 게이트웨이를 세울 수 있고, NB-IoT는 통신사 이동통신망을 빌려 씁니다.",
    aliases: ["로라완", "lora", "로라"],
  },
  {
    term: "LoRaWAN 게이트웨이",
    fullName: "LoRaWAN 게이트웨이(Gateway)",
    category: "IoT / 광역 무선",
    definition:
      "LoRaWAN 게이트웨이는 종단 기기의 무선 메시지를 받아 IP 패킷으로 바꿔 네트워크 서버로 넘기는 중계 장치입니다.",
    why: "무선 구간과 IP 망을 잇는 지점이 있어야 기기 데이터가 서버까지 갑니다.",
    compare: "LoRaWAN 게이트웨이는 내용을 처리하지 않고 중계만 하며, IoT 엣지 게이트웨이는 현장에서 데이터를 가공합니다.",
    aliases: ["lora게이트웨이", "로라게이트웨이", "lorawangateway"],
  },
  {
    term: "LoRaWAN 네트워크 서버",
    fullName: "LoRaWAN 네트워크 서버(Network Server)",
    category: "IoT / 광역 무선",
    definition:
      "LoRaWAN 네트워크 서버는 게이트웨이와 종단 기기를 관리하고 중복 수신을 걸러 메시지를 응용 서버로 보내는 서버입니다.",
    why: "여러 게이트웨이가 같은 메시지를 받아도 하나로 정리해 올바른 응용으로 넘기기 위해 둡니다.",
    compare: "네트워크 서버는 망 운영과 전달을 맡고, 응용 서버는 기기 데이터의 내용을 처리합니다.",
    aliases: ["lns", "networkserver", "네트워크서버", "응용서버", "조인서버"],
  },
  {
    term: "Wi-Fi 프로비저닝",
    fullName: "Wi-Fi 프로비저닝(Wi-Fi Provisioning)",
    category: "IoT / 기기 등록",
    definition:
      "Wi-Fi 프로비저닝은 화면이 없는 기기에 휴대폰 앱으로 공유기 이름과 비밀번호를 넘겨주어 Wi-Fi에 붙게 하는 처음 설정 절차입니다.",
    why: "공유기 정보는 설치 장소마다 달라 공장에서 미리 넣을 수 없어서 현장에서 넘겨줘야 합니다.",
    compare: "Wi-Fi 프로비저닝은 망 접속 정보를 넣는 일이고, 클라우드 프로비저닝은 기기 인증서와 신원을 등록하는 일입니다.",
    aliases: ["wifiprovisioning", "와이파이프로비저닝", "wifi설정", "wifieasyconnect"],
  },
  {
    term: "SoftAP",
    fullName: "소프트웨어 액세스 포인트(Software Access Point)",
    category: "IoT / 기기 등록",
    definition:
      "SoftAP는 기기가 스스로 임시 Wi-Fi 공유기처럼 동작해 휴대폰이 그 기기에 직접 접속하게 하는 방식입니다.",
    why: "블루투스가 없는 기기에도 휴대폰으로 처음 설정 값을 넘겨줄 수 있게 합니다.",
    compare: "SoftAP 방식은 휴대폰이 쓰던 Wi-Fi를 잠시 끊고 기기에 붙어야 하고, BLE 방식은 Wi-Fi를 끊지 않습니다.",
    aliases: ["소프트ap", "ap모드", "핫스팟모드"],
  },
  {
    term: "MQTT",
    fullName: "MQTT(Message Queuing Telemetry Transport)",
    category: "IoT / 메시지 프로토콜",
    definition:
      "MQTT는 클라이언트가 서버(브로커)를 사이에 두고 토픽 단위로 메시지를 발행하고 구독하는 가벼운 메시지 전송 프로토콜입니다.",
    why: "연결이 자주 끊기고 성능이 낮은 기기도 적은 통신량으로 데이터를 보내고 명령을 받게 합니다.",
    compare: "MQTT는 연결을 유지하며 서버가 기기로 바로 밀어 주고, HTTP는 기기가 요청할 때만 응답을 받습니다.",
    aliases: ["엠큐티티", "mqtts", "mqtttls"],
  },
  {
    term: "MQTT 브로커",
    fullName: "MQTT 브로커(MQTT Broker / Server)",
    category: "IoT / 메시지 프로토콜",
    definition:
      "MQTT 브로커는 발행된 메시지를 받아 그 토픽을 구독한 클라이언트에게 나눠 주는 중간 서버입니다.",
    why: "기기와 응용이 서로의 주소를 몰라도 브로커 한 곳에만 붙으면 메시지를 주고받게 합니다.",
    compare: "MQTT 브로커는 구독자에게 바로 전달하는 데 중점을 두고, Kafka는 메시지를 쌓아 두고 다시 읽게 합니다.",
    aliases: ["mqtt서버", "mqttserver", "브로커"],
  },
  {
    term: "MQTT 토픽",
    fullName: "MQTT 토픽(Topic Name)",
    category: "IoT / 메시지 프로토콜",
    definition:
      "MQTT 토픽은 브로커가 구독 조건과 맞춰 보고 누구에게 보낼지 정하는 데 쓰는, 메시지에 붙이는 이름표입니다.",
    why: "기기·데이터 종류별로 메시지를 나눠 필요한 쪽만 받게 합니다.",
    compare: "토픽은 발행할 때 붙이는 정확한 이름이고, 토픽 필터는 구독할 때 쓰는 조건식입니다.",
    aliases: ["topic", "토픽", "topicname", "토픽이름"],
  },
  {
    term: "토픽 와일드카드",
    fullName: "MQTT 토픽 필터 와일드카드(Topic Filter Wildcards)",
    category: "IoT / 메시지 프로토콜",
    definition:
      "토픽 와일드카드는 구독 조건에서 한 단계(+)나 그 아래 여러 단계(#)를 한꺼번에 가리키는 데 쓰는 기호입니다.",
    why: "기기 수백 대의 토픽을 하나씩 적지 않고 한 줄로 구독하게 합니다.",
    compare: "와일드카드는 구독하는 토픽 필터에만 쓸 수 있고, 발행하는 토픽 이름에는 쓸 수 없습니다.",
    aliases: ["topicfilter", "토픽필터", "멀티레벨와일드카드", "싱글레벨와일드카드"],
  },
  {
    term: "MQTT QoS",
    fullName: "MQTT 전달 보장 수준(Quality of Service)",
    category: "IoT / 메시지 프로토콜",
    definition:
      "MQTT QoS는 메시지 전달을 0(최대 한 번), 1(최소 한 번), 2(정확히 한 번) 가운데 어느 수준으로 보장할지 정하는 값입니다.",
    why: "잃어도 되는 측정값과 꼭 전달돼야 하는 명령을 구분해 통신량과 신뢰성을 맞춥니다.",
    compare: "QoS 1은 중복 수신이 생길 수 있고, QoS 2는 중복 없이 한 번만 전달하지만 주고받는 횟수가 늘어납니다.",
    aliases: ["qos", "전달보장"],
  },
  {
    term: "유지 메시지",
    fullName: "MQTT 유지 메시지(Retained Message)",
    category: "IoT / 메시지 프로토콜",
    definition:
      "유지 메시지는 브로커가 토픽마다 마지막 한 건을 저장해 두었다가 새로 구독한 클라이언트에게 바로 보내 주는 메시지입니다.",
    why: "나중에 접속한 앱도 기기의 마지막 상태를 기다리지 않고 바로 알게 합니다.",
    compare: "유지 메시지는 토픽별 마지막 값 하나만 남기고, 디바이스 섀도는 원하는 상태와 보고된 상태를 문서로 관리합니다.",
    aliases: ["retainedmessage", "retain", "리테인", "보존메시지"],
  },
  {
    term: "유언 메시지",
    fullName: "MQTT 유언 메시지(Will Message)",
    category: "IoT / 메시지 프로토콜",
    definition:
      "유언 메시지는 클라이언트가 미리 맡겨 두고 연결이 끊기면 브로커가 대신 발행해 주는 메시지입니다.",
    why: "기기가 예고 없이 꺼지거나 통신이 끊긴 것을 다른 쪽이 알아차리게 합니다.",
    compare: "유언 메시지는 연결이 끊긴 뒤 브로커가 내보내고, Keep Alive는 연결이 살아 있는지 확인하는 시간 간격입니다.",
    aliases: ["willmessage", "lastwill", "lwt", "lastwillandtestament", "keepalive"],
  },
  {
    term: "MQTT over WebSocket",
    fullName: "웹소켓 위 MQTT(MQTT over WebSocket)",
    category: "IoT / 메시지 프로토콜",
    definition:
      "MQTT over WebSocket은 MQTT 메시지를 웹소켓 연결에 실어 보내 443 포트로 브로커와 통신하는 방식입니다.",
    why: "8883 포트가 막힌 망이나 웹 브라우저에서도 MQTT를 쓰게 합니다.",
    compare: "일반 MQTT/TLS는 8883 포트를 쓰고, MQTT over WebSocket은 HTTPS와 같은 443 포트를 씁니다.",
    aliases: ["mqttoverwss", "wss", "mqtt웹소켓", "mqttoverwebsockets"],
  },
  {
    term: "MQTT 브리지",
    fullName: "MQTT 브리지(MQTT Bridge)",
    category: "IoT / 메시지 프로토콜",
    definition:
      "MQTT 브리지는 한 브로커가 다른 브로커에 접속해 정해 둔 토픽의 메시지를 서로 넘겨주는 브로커 간 연결입니다.",
    why: "현장 브로커에 모은 데이터를 본사나 클라우드 브로커로 올려 보낼 때 씁니다.",
    compare: "MQTT 브리지는 브로커와 브로커를 잇고, 일반 MQTT 연결은 기기와 브로커를 잇습니다.",
    aliases: ["브로커브리지", "브로커연동"],
  },
  {
    term: "발행/구독",
    fullName: "발행/구독 방식(Publish/Subscribe)",
    category: "IoT / 메시지 프로토콜",
    definition:
      "발행/구독은 보내는 쪽이 주제에 메시지를 올리면 그 주제를 구독한 쪽들이 중간 서버를 통해 받아 가는 통신 방식입니다.",
    why: "보내는 쪽과 받는 쪽이 서로를 직접 알 필요가 없어 기기와 응용을 따로 늘릴 수 있습니다.",
    compare: "발행/구독은 중간 서버가 여러 수신자에게 나눠 주고, 요청/응답은 한쪽이 묻고 상대가 바로 답합니다.",
    aliases: ["pubsub", "publishsubscribe", "펍섭", "게시구독"],
  },
  {
    term: "CoAP",
    fullName: "제약 환경 응용 프로토콜(Constrained Application Protocol)",
    category: "IoT / 메시지 프로토콜",
    definition:
      "CoAP는 성능이 낮은 기기와 손실이 많은 망을 위해 UDP 위에서 GET·POST·PUT·DELETE를 쓰도록 만든 웹 전송 프로토콜입니다.",
    why: "메모리와 전력이 작은 기기가 HTTP와 비슷한 방식으로 자원을 읽고 쓰게 합니다.",
    compare: "CoAP는 UDP 위에서 짧은 메시지를 쓰고, HTTP는 TCP 위에서 더 큰 헤더를 씁니다.",
    aliases: ["코앱", "coaps", "constrainedapplicationprotocol"],
  },
  {
    term: "LwM2M",
    fullName: "경량 M2M(OMA Lightweight M2M)",
    category: "IoT / 기기 관리",
    definition:
      "LwM2M은 성능이 낮은 IoT 기기를 원격으로 관리하도록 OMA가 만들고 전송에 CoAP를 쓰는 기기 관리 프로토콜입니다.",
    why: "제조사가 달라도 같은 방식으로 기기 상태를 보고 설정을 바꾸게 합니다.",
    compare: "LwM2M은 기기 관리 절차까지 정해 두고, MQTT는 메시지를 나르는 방법만 정합니다.",
    aliases: ["lightweightm2m", "omalwm2m"],
  },
  {
    term: "IoT 게이트웨이",
    fullName: "IoT 게이트웨이(IoT Gateway / Field Gateway)",
    category: "IoT / 구성요소",
    definition:
      "IoT 게이트웨이는 현장의 기기들과 클라우드나 서버 사이에 놓여 기기 연결을 모아 위쪽 망으로 넘겨주는 장치입니다.",
    why: "기기를 인터넷에 직접 드러내지 않고, 스스로 클라우드에 붙지 못하는 기기도 연결하게 합니다.",
    compare: "IoT 게이트웨이는 현장에서 기기 쪽 통신을 모으고, API 게이트웨이는 서버 앞에서 API 요청을 받습니다.",
    aliases: ["fieldgateway", "필드게이트웨이", "엣지게이트웨이", "edgegateway", "iot허브(장치)", "스마트홈허브", "기기게이트웨이"],
  },
  {
    term: "프로토콜 변환 게이트웨이",
    fullName: "프로토콜 변환 게이트웨이(Protocol Translation Gateway)",
    category: "IoT / 구성요소",
    definition:
      "프로토콜 변환 게이트웨이는 기기가 쓰는 통신 방식을 클라우드가 받는 방식으로 바꿔 기기 대신 메시지를 올려 보내는 게이트웨이입니다.",
    why: "MQTT·AMQP·HTTP를 못 쓰는 기기(Zigbee, BLE, 산업용 프로토콜)를 클라우드에 연결하게 합니다.",
    compare: "프로토콜 변환 게이트웨이는 기기 신원을 가리고 게이트웨이만 보이며, 투명 게이트웨이는 기기 신원을 그대로 넘깁니다.",
    aliases: ["protocoltranslation", "opaquegateway", "투명게이트웨이", "transparentgateway", "신원변환"],
  },
  {
    term: "엣지 컴퓨팅",
    fullName: "엣지 컴퓨팅(Edge Computing)",
    category: "IoT / 구성요소",
    definition:
      "엣지 컴퓨팅은 데이터가 생기는 현장 가까이에 있는 장치에서 데이터를 모으고 거르고 분석해 필요한 것만 클라우드로 보내는 방식입니다.",
    why: "통신이 끊겨도 현장에서 바로 판단하고, 보내는 데이터 양을 줄이려고 씁니다.",
    compare: "엣지 컴퓨팅은 현장 장치에서 처리하고, 클라우드 처리 방식은 원본을 모두 올린 뒤 처리합니다.",
    aliases: ["edgecomputing", "엣지", "에지컴퓨팅", "엣지런타임"],
  },
  {
    term: "디바이스 섀도",
    fullName: "디바이스 섀도(Device Shadow)",
    category: "IoT / 기기 관리",
    definition:
      "디바이스 섀도는 기기의 현재 상태와 원하는 상태를 클라우드에 JSON 문서로 저장해 기기가 꺼져 있어도 읽고 쓸 수 있게 하는 것입니다.",
    why: "기기가 오프라인일 때 앱이 보낸 변경 요청을 잃지 않고 다시 연결되면 맞추게 합니다.",
    compare: "디바이스 섀도는 AWS IoT의 이름이고, 같은 역할을 Azure IoT Hub에서는 디바이스 트윈이라고 부릅니다.",
    aliases: ["deviceshadow", "섀도", "쉐도우", "thingshadow", "desiredreported"],
  },
  {
    term: "디바이스 트윈",
    fullName: "디바이스 트윈(Device Twin)",
    category: "IoT / 기기 관리",
    definition:
      "디바이스 트윈은 기기의 메타데이터, 설정, 상태를 담아 IoT 허브가 기기마다 하나씩 유지하는 JSON 문서입니다.",
    why: "서버 쪽 앱과 기기가 설정과 상태를 맞추고, 조건으로 기기를 찾아 한꺼번에 작업하게 합니다.",
    compare: "디바이스 트윈은 기기 한 대의 상태 문서이고, 디지털 트윈은 설비나 공간 전체를 본뜬 모델을 가리킵니다.",
    aliases: ["devicetwin", "기기트윈", "desiredproperties", "reportedproperties"],
  },
  {
    term: "OTA 업데이트",
    fullName: "무선 원격 업데이트(Over-the-Air Update)",
    category: "IoT / 기기 관리",
    definition:
      "OTA 업데이트는 설치된 기기를 회수하지 않고 통신망으로 새 펌웨어나 소프트웨어를 내려보내 설치하게 하는 원격 갱신입니다.",
    why: "현장에 흩어진 기기의 보안 결함과 기능을 사람이 방문하지 않고 고치기 위해 씁니다.",
    compare: "OTA 업데이트는 통신망으로 내려받고, 로컬 업데이트는 케이블이나 저장 매체를 기기에 직접 꽂아 넣습니다.",
    aliases: ["ota", "fota", "펌웨어업데이트", "overtheair", "원격펌웨어갱신"],
  },
  {
    term: "디바이스 프로비저닝",
    fullName: "디바이스 프로비저닝(Device Provisioning)",
    category: "IoT / 기기 등록",
    definition:
      "디바이스 프로비저닝은 기기를 클라우드에 등록하고 고유 인증서와 권한 정책을 붙여 안전하게 통신할 수 있게 만드는 절차입니다.",
    why: "기기마다 다른 신원을 줘야 한 대가 뚫려도 다른 기기와 데이터가 함께 넘어가지 않습니다.",
    compare: "디바이스 프로비저닝은 클라우드에 신원을 등록하는 일이고, Wi-Fi 프로비저닝은 공유기 접속 정보를 넣는 일입니다.",
    aliases: ["deviceprovisioning", "기기프로비저닝", "플릿프로비저닝", "fleetprovisioning", "jitp", "jitr"],
  },
  {
    term: "제로터치 프로비저닝",
    fullName: "제로터치 프로비저닝(Zero-touch Provisioning)",
    category: "IoT / 기기 등록",
    definition:
      "제로터치 프로비저닝은 기기가 처음 켜질 때 등록 서비스에 스스로 접속해 사람 손 없이 알맞은 IoT 허브에 등록되는 방식입니다.",
    why: "기기 수가 많을 때 한 대씩 수작업으로 등록하는 시간과 실수를 줄입니다.",
    compare: "제로터치 프로비저닝은 기기가 스스로 등록하고, 수동 등록은 관리자가 기기마다 정보를 입력합니다.",
    aliases: ["zerotouch", "무접촉프로비저닝", "dps", "deviceprovisioningservice", "자동등록"],
  },
  {
    term: "기기 인증서",
    fullName: "기기 인증서(X.509 Device / Client Certificate)",
    category: "IoT / 보안",
    definition:
      "기기 인증서는 기기마다 하나씩 넣어 브로커나 클라우드에 접속할 때 그 기기가 맞는지 증명하는 X.509 인증서입니다.",
    why: "비밀번호를 여러 기기가 같이 쓰는 대신 기기별로 신원을 확인하고 권한을 따로 주기 위해 씁니다.",
    compare: "기기 인증서는 기기가 자신을 증명하는 데 쓰고, 서버 인증서는 기기가 접속한 서버가 진짜인지 확인하는 데 씁니다.",
    aliases: ["devicecertificate", "클라이언트인증서", "x509클라이언트인증서", "디바이스인증서", "클레임인증서"],
  },
  {
    term: "디바이스 레지스트리",
    fullName: "디바이스 레지스트리(Device Registry)",
    category: "IoT / 기기 관리",
    definition:
      "디바이스 레지스트리는 등록된 기기의 이름, 속성, 인증서 같은 정보를 클라우드에서 모아 관리하는 기기 목록 저장소입니다.",
    why: "어떤 기기가 연결을 허락받았는지 확인하고 종류·그룹별로 찾아 관리하게 합니다.",
    compare: "디바이스 레지스트리는 기기의 신원과 속성을 담고, 디바이스 섀도는 기기의 현재 상태 값을 담습니다.",
    aliases: ["deviceregistry", "기기레지스트리", "thingregistry", "사물레지스트리", "identityregistry"],
  },
  {
    term: "규칙 엔진",
    fullName: "IoT 규칙 엔진(Rules Engine)",
    category: "IoT / 구성요소",
    definition:
      "IoT 규칙 엔진은 브로커로 들어온 메시지를 조건에 따라 골라 저장소, 함수, 다른 서비스로 넘겨주는 클라우드 기능입니다.",
    why: "기기 메시지를 받는 일과 처리·저장하는 일을 나눠 뒤쪽 서비스를 자유롭게 붙이게 합니다.",
    compare: "규칙 엔진은 메시지를 골라 다른 서비스로 보내고, 브로커는 구독한 클라이언트에게 메시지를 나눠 줍니다.",
    aliases: ["rulesengine", "룰엔진", "iotrules", "메시지라우팅"],
  },
  {
    term: "텔레메트리",
    fullName: "텔레메트리(Telemetry)",
    category: "IoT / 데이터 흐름",
    definition:
      "텔레메트리는 기기가 측정한 센서 값을 시간순으로 계속 클라우드나 서버로 올려 보내는 데이터입니다.",
    why: "현장 상태를 멀리서 지켜보고 쌓인 값으로 이상을 찾아내기 위해 모읍니다.",
    compare: "텔레메트리는 기기에서 위로 올라가는 측정값이고, 명령은 위에서 기기로 내려가는 제어 메시지입니다.",
    aliases: ["telemetry", "원격측정", "d2c메시지", "devicetocloud", "c2d메시지"],
  },
  {
    term: "센서·액추에이터",
    fullName: "센서와 액추에이터(Sensor / Actuator)",
    category: "IoT / 구성요소",
    definition:
      "센서는 온도 같은 바깥 상태를 재서 기기가 알 수 있는 값으로 바꾸는 부품이고 액추에이터는 기기가 바깥의 무언가를 움직이게 하는 부품입니다.",
    why: "기기가 현실 세계를 재고 제어하려면 이 두 부품이 있어야 합니다.",
    compare: "센서는 값을 읽어 들이는 입력 쪽이고, 액추에이터는 모터·릴레이처럼 움직임을 내는 출력 쪽입니다.",
    aliases: ["sensor", "actuator", "센서", "액추에이터", "구동기", "iot기기"],
  },
  {
    term: "IoT 보안인증",
    fullName: "정보통신망연결기기등 정보보호인증(IoT 보안인증)",
    category: "IoT / 국내 제도",
    definition:
      "IoT 보안인증은 IoT 제품과 연동 모바일 앱이 정보보호인증기준에 맞는지 시험해 인증서를 발급하는 KISA의 인증 제도입니다.",
    why: "보안 수준을 확인받은 기기를 골라 쓸 수 있게 해 취약한 기기가 망에 들어오는 일을 줄입니다.",
    compare: "IoT 보안인증은 기기 제품을 시험하고, ISMS-P는 기관의 정보보호 관리 체계를 심사합니다.",
    aliases: ["사물인터넷보안인증", "정보통신망연결기기등정보보호인증", "kisaiot인증"],
  },
  {
    term: "AWS IoT Core",
    fullName: "AWS IoT Core",
    category: "IoT / 클라우드 서비스",
    definition:
      "AWS IoT Core는 연결된 기기가 클라우드 응용이나 다른 기기와 안전하게 메시지를 주고받게 하는 AWS의 관리형 서비스입니다.",
    why: "",
    compare: "",
    aliases: ["iotcore", "awsiot", "아마존iot"],
  },
  {
    term: "AWS IoT Greengrass",
    fullName: "AWS IoT Greengrass",
    category: "IoT / 엣지 소프트웨어",
    definition:
      "AWS IoT Greengrass는 현장 장치에서 IoT 응용을 만들고 배포하고 관리하게 하는 AWS의 오픈소스 엣지 런타임이자 클라우드 서비스입니다.",
    why: "",
    compare: "",
    aliases: ["greengrass", "그린그래스", "greengrasscore"],
  },
  {
    term: "Azure IoT Hub",
    fullName: "Azure IoT Hub",
    category: "IoT / 클라우드 서비스",
    definition:
      "Azure IoT Hub는 많은 기기와 클라우드가 양방향으로 메시지를 주고받고 기기를 관리하게 하는 Microsoft Azure의 서비스입니다.",
    why: "",
    compare: "",
    aliases: ["iothub", "애저iot허브", "azureiot"],
  },
  {
    term: "Azure IoT Edge",
    fullName: "Azure IoT Edge",
    category: "IoT / 엣지 소프트웨어",
    definition:
      "Azure IoT Edge는 현장 장치에 컨테이너로 된 응용을 배포하고 실행하고 감시하게 하는 Microsoft의 기기용 런타임입니다.",
    why: "",
    compare: "",
    aliases: ["iotedge", "애저iot엣지", "edgehub"],
  },
  {
    term: "Mosquitto",
    fullName: "Eclipse Mosquitto",
    category: "IoT / MQTT 브로커",
    definition:
      "Mosquitto는 MQTT 5.0, 3.1.1, 3.1을 구현한 Eclipse 재단의 오픈소스 메시지 브로커입니다.",
    why: "",
    compare: "",
    aliases: ["eclipsemosquitto", "모스키토"],
  },
  {
    term: "EMQX",
    fullName: "EMQX",
    category: "IoT / MQTT 브로커",
    definition:
      "EMQX는 EMQ가 만든 MQTT 메시지 플랫폼(브로커)입니다.",
    why: "",
    compare: "",
    aliases: ["이엠큐엑스"],
  },
  {
    term: "ThingsBoard",
    fullName: "ThingsBoard",
    category: "IoT / 플랫폼",
    definition:
      "ThingsBoard는 기기 관리와 데이터 수집·처리·시각화를 제공하는 IoT 플랫폼입니다.",
    why: "",
    compare: "",
    aliases: ["씽스보드"],
  },
  {
    term: "Zigbee2MQTT",
    fullName: "Zigbee2MQTT",
    category: "IoT / 게이트웨이 소프트웨어",
    definition:
      "Zigbee2MQTT는 Zigbee 어댑터로 받은 Zigbee 기기 신호를 MQTT 메시지로 바꿔 브로커에 이어 주는 오픈소스 브리지 소프트웨어입니다.",
    why: "",
    compare: "",
    aliases: ["z2m", "지그비투엠큐티티"],
  },
  // ── CCTV · 영상 관제 ──
  {
    term: "IP 카메라",
    fullName: "IP 카메라(IP Camera, 네트워크 카메라)",
    category: "영상 관제 / 현장 장비",
    definition:
      "IP 카메라는 찍은 영상을 직접 압축해 네트워크로 보내는 카메라입니다.",
    why: "카메라마다 영상선을 따로 끌지 않고 랜선 하나로 영상을 모을 수 있습니다.",
    compare: "IP 카메라는 랜선으로 디지털 영상을 보내고, 아날로그 카메라는 동축 케이블로 영상 신호를 보냅니다.",
    aliases: ["네트워크카메라", "ipcamera", "networkcamera", "cctv카메라", "카메라"],
  },
  {
    term: "PTZ 카메라",
    fullName: "PTZ 카메라(Pan-Tilt-Zoom Camera)",
    category: "영상 관제 / 현장 장비",
    definition:
      "PTZ 카메라는 원격으로 좌우·상하로 돌리고 확대·축소할 수 있는 카메라입니다.",
    why: "카메라 한 대로 넓은 구역을 살피다가 필요한 곳을 당겨 볼 수 있습니다.",
    compare: "PTZ 카메라는 방향과 배율을 원격으로 바꾸고, 고정형 카메라는 설치한 방향만 찍습니다.",
    aliases: ["ptz", "회전형카메라", "스피드돔", "pantiltzoom"],
  },
  {
    term: "PoE",
    fullName: "이더넷 전원 공급(Power over Ethernet, IEEE 802.3af/at/bt)",
    category: "영상 관제 / 현장 장비",
    definition:
      "PoE는 이더넷 케이블 하나로 데이터와 전원을 함께 보내는 방식입니다.",
    why: "카메라마다 전원 공사를 따로 하지 않고 랜선만 끌어 설치할 수 있습니다.",
    compare: "PoE는 랜선으로 전원까지 주고, 일반 이더넷은 데이터만 보내 전원선이 따로 필요합니다.",
    aliases: ["poweroverethernet", "피오이", "poe+", "poe++", "8023af", "8023at", "8023bt", "poe스위치"],
  },
  {
    term: "VMS",
    fullName: "영상 관리 시스템(Video Management System/Software)",
    category: "영상 관제 / 녹화·관리",
    definition:
      "VMS는 여러 카메라의 영상을 받아 녹화·검색·관제·권한 관리를 한곳에서 하는 소프트웨어입니다.",
    why: "카메라가 수백 대를 넘거나 여러 거점에 흩어져 있을 때 한 화면에서 운영하려고 씁니다.",
    compare: "VMS는 서버 여러 대로 늘려 가는 소프트웨어이고, NVR은 채널 수가 정해진 일체형 장비입니다.",
    aliases: ["영상관리시스템", "videomanagementsystem", "영상관리소프트웨어", "브이엠에스", "영상저장·관리"],
  },
  {
    term: "VMS 관리 서버",
    fullName: "VMS 관리 서버(Management Server)",
    category: "영상 관제 / 녹화·관리",
    definition:
      "VMS 관리 서버는 시스템 설정을 저장하고 사용자 인증·권한·규칙을 맡는 VMS 의 중심 서버입니다.",
    why: "카메라·녹화 서버·사용자 설정을 한곳에 두고 다른 구성요소에 나눠 주려고 둡니다.",
    compare: "관리 서버는 설정과 로그인을 맡고, 녹화 서버는 영상을 받고 저장하고 내보냅니다.",
    aliases: ["관리서버", "managementserver", "매니지먼트서버"],
  },
  {
    term: "녹화 서버",
    fullName: "녹화 서버(Recording Server)",
    category: "영상 관제 / 녹화·관리",
    definition:
      "녹화 서버는 카메라에서 영상·음성·메타데이터를 가져와 저장하고 관제 화면에 내주는 서버입니다.",
    why: "카메라와 직접 통신하는 일을 한 서버에 모아 저장과 라이브 열람을 함께 처리합니다.",
    compare: "녹화 서버는 영상을 다루고, 관리 서버는 설정과 권한을 다룹니다.",
    aliases: ["레코딩서버", "recordingserver", "저장서버", "영상저장서버"],
  },
  {
    term: "장애 대비 녹화 서버",
    fullName: "장애 대비 녹화 서버(Failover Recording Server)",
    category: "영상 관제 / 녹화·관리",
    definition:
      "장애 대비 녹화 서버는 녹화 서버가 멈추면 그 녹화 일을 넘겨받는 예비 서버입니다.",
    why: "녹화 서버 고장 때 영상이 비는 시간을 줄이려고 둡니다.",
    compare: "핫 스탠바이는 한 대만 전담해 빨리 넘겨받고, 콜드 스탠바이는 여러 대를 함께 지킵니다.",
    aliases: ["페일오버녹화서버", "failoverrecordingserver", "예비녹화서버"],
  },
  {
    term: "이벤트 서버",
    fullName: "이벤트 서버(Event Server)",
    category: "영상 관제 / 녹화·관리",
    definition:
      "이벤트 서버는 VMS 의 이벤트·알람·지도와 외부 시스템 연동을 한곳에서 처리하는 서버입니다.",
    why: "분석 장비나 출입통제 같은 외부 시스템의 신호를 받아 알람으로 띄우려고 둡니다.",
    compare: "이벤트 서버는 알람과 연동을 맡고, 녹화 서버는 영상을 맡습니다.",
    aliases: ["eventserver", "알람서버"],
  },
  {
    term: "VMS 모바일 서버",
    fullName: "VMS 모바일 서버(Mobile Server)",
    category: "영상 관제 / 녹화·관리",
    definition:
      "VMS 모바일 서버는 녹화 서버의 영상을 받아 웹·모바일 기기에 맞게 바꿔 내보내는 서버입니다.",
    why: "녹화 서버를 인터넷에 직접 내놓지 않고도 밖에서 영상을 보게 하려고 둡니다.",
    compare: "모바일 서버는 웹·모바일 열람용 중계 지점이고, 녹화 서버는 관제 PC 에 영상을 바로 줍니다.",
    aliases: ["모바일서버", "mobileserver", "웹스트리밍서버"],
  },
  {
    term: "영상 저장 스토리지",
    fullName: "영상 저장 스토리지(Video Storage, Media Database)",
    category: "영상 관제 / 녹화·관리",
    definition:
      "영상 저장 스토리지는 녹화 서버가 받은 영상·음성·메타데이터를 쌓아 두는 저장소입니다.",
    why: "보관 기간만큼의 영상을 잃지 않고 두었다가 검색·재생·반출하려고 씁니다.",
    compare: "영상 저장 스토리지는 녹화본을 담고, DB 는 설정·알람·로그를 담습니다.",
    aliases: ["영상스토리지", "녹화스토리지", "미디어데이터베이스", "저장장치"],
  },
  {
    term: "Milestone XProtect",
    fullName: "Milestone XProtect VMS",
    category: "영상 관제 / 녹화·관리",
    definition:
      "Milestone XProtect는 관리 서버·녹화 서버·이벤트 서버와 클라이언트로 이루어진 상용 VMS 제품입니다.",
    why: "",
    compare: "",
    aliases: ["xprotect", "마일스톤", "엑스프로텍트"],
  },
  {
    term: "RTSP",
    fullName: "실시간 스트리밍 프로토콜(Real-Time Streaming Protocol)",
    category: "영상 관제 / 프로토콜",
    definition:
      "RTSP는 영상 스트림을 열고 재생·정지시키는 제어 명령을 주고받는 프로토콜입니다.",
    why: "녹화 서버나 NVR 이 카메라에 어떤 스트림을 어떻게 보낼지 요청할 때 씁니다.",
    compare: "RTSP는 재생을 지시하는 제어 통로이고, 영상 데이터는 RTP 로 실려 옵니다.",
    aliases: ["realtimestreamingprotocol", "알티에스피", "rtsp:"],
  },
  {
    term: "RTSPS",
    fullName: "보안 RTSP(RTSP over TLS)",
    category: "영상 관제 / 프로토콜",
    definition:
      "RTSPS는 RTSP 제어 통신을 TLS 로 암호화해 주고받는 방식입니다.",
    why: "카메라 접속 계정과 스트림 주소가 망에서 그대로 보이지 않게 합니다.",
    compare: "RTSPS는 제어 통신을 암호화하고, SRTP는 영상 데이터 자체를 암호화합니다.",
    aliases: ["securertsp", "rtsps:", "rtspovertls"],
  },
  {
    term: "RTP",
    fullName: "실시간 전송 프로토콜(Real-time Transport Protocol)",
    category: "영상 관제 / 프로토콜",
    definition:
      "RTP는 영상·음성 같은 실시간 데이터를 작은 묶음으로 나눠 네트워크로 실어 나르는 프로토콜입니다.",
    why: "순서 번호와 시간 표시를 붙여 받는 쪽이 끊김 없이 재생하게 합니다.",
    compare: "RTP는 영상 데이터를 나르고, RTSP는 그 전송을 시작하고 멈추게 합니다.",
    aliases: ["realtimetransportprotocol", "알티피"],
  },
  {
    term: "SRTP",
    fullName: "보안 실시간 전송 프로토콜(Secure Real-time Transport Protocol)",
    category: "영상 관제 / 프로토콜",
    definition:
      "SRTP는 RTP 영상·음성 데이터를 암호화하고 변조와 재전송 공격을 막는 프로토콜입니다.",
    why: "영상망을 엿보는 사람이 카메라 영상을 그대로 보지 못하게 합니다.",
    compare: "SRTP는 영상 데이터를 암호화하고, RTSPS는 제어 명령을 암호화합니다.",
    aliases: ["securertp", "에스알티피"],
  },
  {
    term: "ONVIF",
    fullName: "ONVIF(Open Network Video Interface Forum)",
    category: "영상 관제 / 프로토콜",
    definition:
      "ONVIF는 제조사가 다른 IP 카메라와 녹화 장비·VMS 가 서로 통신하게 하는 공통 인터페이스 규격입니다.",
    why: "카메라와 VMS 제조사가 달라도 검색·설정·스트림 요청·PTZ 제어가 되게 합니다.",
    compare: "ONVIF는 장치를 찾고 설정하는 규격이고, 영상 전송은 RTSP 와 RTP 가 맡습니다.",
    aliases: ["온비프", "opennetworkvideointerfaceforum", "onvif프로파일"],
  },
  {
    term: "ONVIF 프로파일 S",
    fullName: "ONVIF Profile S",
    category: "영상 관제 / 프로토콜",
    definition:
      "ONVIF 프로파일 S는 기본 영상 스트리밍과 설정을 다루는 ONVIF 기능 묶음입니다.",
    why: "카메라와 VMS 가 최소한 영상을 주고받을 수 있는지 한 글자로 확인합니다.",
    compare: "프로파일 S는 기본 스트리밍만 다루고, 프로파일 T는 H.265 와 메타데이터까지 다룹니다.",
    aliases: ["profiles", "프로파일s"],
  },
  {
    term: "ONVIF 프로파일 T",
    fullName: "ONVIF Profile T",
    category: "영상 관제 / 프로토콜",
    definition:
      "ONVIF 프로파일 T는 H.264·H.265 스트리밍, 영상 설정, 움직임·훼손 알람, 메타데이터를 다루는 기능 묶음입니다.",
    why: "최신 카메라의 고효율 코덱과 이벤트를 다른 제조사 VMS 에서 쓰려고 확인합니다.",
    compare: "프로파일 T는 영상과 알람을 다루고, 프로파일 M은 분석 메타데이터를 다룹니다.",
    aliases: ["profilet", "프로파일t"],
  },
  {
    term: "ONVIF 프로파일 G",
    fullName: "ONVIF Profile G",
    category: "영상 관제 / 프로토콜",
    definition:
      "ONVIF 프로파일 G는 장치 안이나 네트워크에 영상을 녹화하고 꺼내 오는 기능을 다루는 묶음입니다.",
    why: "카메라 안 저장소나 NVR 의 녹화본을 다른 제조사 VMS 가 찾아 재생하게 합니다.",
    compare: "프로파일 G는 녹화와 꺼내기를 다루고, 프로파일 S·T는 실시간 스트리밍을 다룹니다.",
    aliases: ["profileg", "프로파일g", "엣지스토리지"],
  },
  {
    term: "ONVIF 프로파일 M",
    fullName: "ONVIF Profile M",
    category: "영상 관제 / 프로토콜",
    definition:
      "ONVIF 프로파일 M은 영상 분석 메타데이터와 이벤트를 설정·조회·전송하는 기능 묶음입니다.",
    why: "카메라가 분석한 객체 분류·계수·번호판 결과를 다른 제조사 시스템이 받아 쓰게 합니다.",
    compare: "프로파일 M은 분석 결과를 다루고, 프로파일 T는 영상 스트림 자체를 다룹니다.",
    aliases: ["profilem", "프로파일m"],
  },
  {
    term: "WS-Discovery",
    fullName: "WS-Discovery(Web Services Dynamic Discovery)",
    category: "영상 관제 / 프로토콜",
    definition:
      "WS-Discovery는 같은 망에 있는 ONVIF 장치를 자동으로 찾아내는 검색 프로토콜입니다.",
    why: "카메라 IP 를 일일이 입력하지 않고 NVR·VMS 가 장치를 찾아 등록하게 합니다.",
    compare: "WS-Discovery는 장치를 찾기만 하고, 찾은 뒤 설정과 제어는 ONVIF 서비스가 맡습니다.",
    aliases: ["wsd", "onvif검색", "장치검색"],
  },
  {
    term: "SRT",
    fullName: "SRT(Secure Reliable Transport)",
    category: "영상 관제 / 프로토콜",
    definition:
      "SRT는 UDP 위에서 손실된 영상 묶음을 다시 보내고 암호화해 지연을 낮게 유지하는 전송 프로토콜입니다.",
    why: "인터넷처럼 품질이 고르지 않은 회선으로 거점 사이에 실시간 영상을 보낼 때 씁니다.",
    compare: "SRT는 손실 복구와 암호화가 들어 있고, RTP 는 그런 기능 없이 실어 나르기만 합니다.",
    aliases: ["securereliabletransport", "에스알티"],
  },
  {
    term: "HLS",
    fullName: "HTTP 라이브 스트리밍(HTTP Live Streaming)",
    category: "영상 관제 / 프로토콜",
    definition:
      "HLS는 영상을 짧은 조각 파일로 나누고 재생 목록과 함께 HTTP 로 내려 주는 스트리밍 방식입니다.",
    why: "웹 브라우저와 모바일에서 별도 프로그램 없이 영상을 보게 하고 CDN 캐시도 쓸 수 있습니다.",
    compare: "HLS는 조각을 받아 재생해 몇 초 늦고, WebRTC는 지연이 훨씬 짧습니다.",
    aliases: ["httplivestreaming", "m3u8", "에이치엘에스"],
  },
  {
    term: "미디어 게이트웨이",
    fullName: "미디어 게이트웨이(Media Gateway, 스트림 변환 서버)",
    category: "영상 관제 / 프로토콜",
    definition:
      "미디어 게이트웨이는 한 프로토콜로 들어온 영상 스트림을 다른 프로토콜로 바꿔 내보내는 서버입니다.",
    why: "카메라의 RTSP 영상을 브라우저가 재생할 수 있는 HLS 나 WebRTC 로 바꾸려고 둡니다.",
    compare: "미디어 게이트웨이는 전송 방식을 바꾸고, 트랜스코더는 코덱이나 해상도를 바꿉니다.",
    aliases: ["스트림변환서버", "스트리밍게이트웨이", "미디어프록시", "mediaproxy"],
  },
  {
    term: "MediaMTX",
    fullName: "MediaMTX",
    category: "영상 관제 / 프로토콜",
    definition:
      "MediaMTX는 RTSP·RTMP·HLS·WebRTC·SRT 스트림을 받아 서로 변환해 내보내는 오픈소스 미디어 서버입니다.",
    why: "",
    compare: "",
    aliases: ["rtspsimpleserver"],
  },
  {
    term: "H.264",
    fullName: "H.264 / AVC(Advanced Video Coding)",
    category: "영상 관제 / 코덱·스트림",
    definition:
      "H.264는 ITU-T 가 정한 영상 압축 표준으로 CCTV 와 인터넷 영상에 가장 널리 쓰이는 코덱입니다.",
    why: "거의 모든 카메라·녹화 장비·재생기가 지원해 호환 문제 없이 쓸 수 있습니다.",
    compare: "H.264는 호환성이 넓고, H.265는 같은 화질을 더 적은 용량으로 담습니다.",
    aliases: ["avc", "mpeg4avc", "에이치264"],
  },
  {
    term: "H.265",
    fullName: "H.265 / HEVC(High Efficiency Video Coding)",
    category: "영상 관제 / 코덱·스트림",
    definition:
      "H.265는 ITU-T 가 정한 고효율 영상 압축 표준으로 H.264 의 뒤를 잇는 코덱입니다.",
    why: "고해상도 영상의 전송량과 저장 용량을 줄이려고 씁니다.",
    compare: "H.265는 압축 효율이 높지만 처리 부담이 크고, H.264는 지원하는 기기가 더 많습니다.",
    aliases: ["hevc", "에이치265"],
  },
  {
    term: "영상 메타데이터",
    fullName: "영상 메타데이터(Video Metadata)",
    category: "영상 관제 / 코덱·스트림",
    definition:
      "영상 메타데이터는 영상과 함께 흐르는 분석 결과·PTZ 상태·이벤트 같은 부가 정보입니다.",
    why: "영상을 다시 분석하지 않고도 객체·시간으로 검색하고 알람을 만들 수 있습니다.",
    compare: "메타데이터는 영상에 대한 글자 정보이고, 영상 스트림은 화면 자체입니다.",
    aliases: ["메타데이터스트림", "metadatastream", "분석메타데이터"],
  },
  {
    term: "멀티캐스트 스트리밍",
    fullName: "멀티캐스트 스트리밍(Multicast Streaming)",
    category: "영상 관제 / 코덱·스트림",
    definition:
      "멀티캐스트 스트리밍은 카메라가 영상을 한 번만 보내고 여러 수신자가 같은 주소로 함께 받는 방식입니다.",
    why: "같은 영상을 여러 관제 PC 가 볼 때 카메라와 망의 부담을 줄입니다.",
    compare: "멀티캐스트는 한 번 보낸 것을 여럿이 받고, 유니캐스트는 수신자마다 따로 보냅니다.",
    aliases: ["멀티캐스트", "multicast", "rtp멀티캐스트"],
  },
  {
    term: "지능형 영상 분석",
    fullName: "지능형 영상 분석(Video Analytics)",
    category: "영상 관제 / 영상 분석",
    definition:
      "지능형 영상 분석은 영상에서 사람·차량 같은 대상을 찾아 추적하고 정한 조건이 되면 이벤트를 내는 기술입니다.",
    why: "관제요원이 모든 화면을 계속 볼 수 없으므로 살펴볼 장면을 골라 알려 주려고 씁니다.",
    compare: "영상 분석은 대상과 사건을 찾아 알리고, 움직임 감지는 화면이 변했는지만 봅니다.",
    aliases: ["영상분석", "videoanalytics", "va", "지능형cctv", "ai영상분석"],
  },
  {
    term: "인공지능 기반 관제시스템",
    fullName: "인공지능 기반 관제시스템(단말형·서버형)",
    category: "영상 관제 / 영상 분석",
    definition:
      "인공지능 기반 관제시스템은 인공지능 기술로 영상을 살펴 관제하는 시스템입니다.",
    why: "관제요원 수에 비해 카메라가 많을 때 사람이 볼 화면을 줄이려고 도입합니다.",
    compare: "단말형은 카메라·함체에서 분석하고, 서버형은 통합관제센터 서버에서 모인 영상을 분석합니다.",
    aliases: ["ai관제시스템", "지능형관제", "단말형인공지능관제", "서버형인공지능관제"],
  },
  {
    term: "엣지 영상 분석",
    fullName: "엣지 영상 분석(Edge Analytics, 단말형 분석)",
    category: "영상 관제 / 영상 분석",
    definition:
      "엣지 영상 분석은 카메라나 현장 장비 안에서 영상을 분석해 결과만 센터로 보내는 방식입니다.",
    why: "모든 영상을 센터 GPU 로 보내지 않아 회선과 서버 부담을 줄입니다.",
    compare: "엣지 분석은 현장에서 결과를 만들고, 서버 분석은 센터에 모인 영상을 한꺼번에 봅니다.",
    aliases: ["엣지ai카메라", "온디바이스분석", "edgeanalytics", "ai카메라"],
  },
  {
    term: "영상 분석 서버",
    fullName: "영상 분석 서버(Video Analytics Server)",
    category: "영상 관제 / 영상 분석",
    definition:
      "영상 분석 서버는 카메라나 녹화 서버에서 스트림을 받아 GPU 로 객체 검출·추적을 돌리는 서버입니다.",
    why: "분석 기능이 없는 기존 카메라 영상에도 인공지능 분석을 붙이려고 둡니다.",
    compare: "영상 분석 서버는 영상을 읽어 이벤트를 만들고, 녹화 서버는 영상을 저장하고 내줍니다.",
    aliases: ["분석서버", "ai분석서버", "서버형분석", "videoanalyticsserver"],
  },
  {
    term: "VLM",
    fullName: "시각 언어 모델(Vision Language Model)",
    category: "영상 관제 / 영상 분석",
    definition:
      "VLM은 영상이나 이미지를 보고 그 내용을 글로 설명하거나 질문에 답하는 인공지능 모델입니다.",
    why: "미리 정한 객체 종류 밖의 상황도 글로 물어 확인하고 알림의 진위를 다시 살피려고 씁니다.",
    compare: "VLM은 장면을 글로 풀어 판단하고, 객체 검출 모델은 정해진 종류의 위치만 찾습니다.",
    aliases: ["visionlanguagemodel", "비전언어모델", "시각언어모델", "멀티모달모델"],
  },
  {
    term: "VLM 알림 검증",
    fullName: "VLM 알림 검증(VLM Alert Verification)",
    category: "영상 관제 / 영상 분석",
    definition:
      "VLM 알림 검증은 분석 규칙이 낸 알림의 영상 구간을 VLM 이 다시 보고 맞는지 판정하는 단계입니다.",
    why: "오탐 알림이 관제요원에게 그대로 쏟아지지 않게 걸러 냅니다.",
    compare: "알림 검증은 이미 난 알림을 다시 확인하고, 실시간 VLM 분석은 영상을 계속 읽어 설명을 답니다.",
    aliases: ["알림검증", "alertverification", "오탐검증"],
  },
  {
    term: "NVIDIA VSS",
    fullName: "NVIDIA Blueprint for Video Search and Summarization",
    category: "영상 관제 / 영상 분석",
    definition:
      "NVIDIA VSS는 실시간 영상 분석, 알림 검증, 영상 검색·요약 에이전트를 묶은 NVIDIA 의 참조 구성입니다.",
    why: "",
    compare: "",
    aliases: ["vss", "videosearchandsummarization", "vss블루프린트"],
  },
  {
    term: "NVIDIA DeepStream",
    fullName: "NVIDIA DeepStream SDK",
    category: "영상 관제 / 영상 분석",
    definition:
      "NVIDIA DeepStream은 GStreamer 기반으로 여러 영상 스트림을 GPU 에서 디코딩·추론·추적하는 분석 개발 도구입니다.",
    why: "",
    compare: "",
    aliases: ["deepstream", "딥스트림"],
  },
  {
    term: "움직임 감지",
    fullName: "움직임 감지(Motion Detection)",
    category: "영상 관제 / 영상 분석",
    definition:
      "움직임 감지는 화면에 변화가 생겼는지를 보고 이벤트를 내는 기능입니다.",
    why: "움직임이 있을 때만 녹화하거나 알려 저장 용량과 확인할 영상을 줄입니다.",
    compare: "움직임 감지는 변화 여부만 보고, 지능형 영상 분석은 무엇이 어떻게 움직였는지 가려냅니다.",
    aliases: ["모션감지", "motiondetection", "모션디텍션"],
  },
  {
    term: "영상 이벤트",
    fullName: "영상 이벤트·알람(Video Event / Alarm)",
    category: "영상 관제 / 영상 분석",
    definition:
      "영상 이벤트는 카메라나 분석 장비가 움직임·훼손·규칙 위반을 감지해 내는 신호입니다.",
    why: "관제 화면에 알람을 띄우고 해당 시각의 영상을 바로 찾아 보게 합니다.",
    compare: "이벤트는 장비가 낸 신호이고, 알람은 그중 사람이 확인하고 처리해야 하는 것입니다.",
    aliases: ["이벤트알람", "영상알람", "analyticsevent", "탬퍼링알람"],
  },
  {
    term: "통합관제센터",
    fullName: "영상정보처리기기 통합관제센터(CCTV Integrated Control Center)",
    category: "영상 관제 / 관제실",
    definition:
      "통합관제센터는 지방자치단체가 여러 기관의 CCTV 영상을 한곳에 모아 관제하는 시설입니다.",
    why: "재난과 사고를 미리 막고 빨리 대응하려고 흩어진 카메라를 함께 봅니다.",
    compare: "통합관제센터는 영상을 보고 탐지하고, 재난안전상황실은 상황을 지휘하며 정보를 공유받습니다.",
    aliases: ["cctv통합관제센터", "영상정보처리기기통합관제센터", "관제센터", "도시통합운영센터"],
  },
  {
    term: "관제 PC",
    fullName: "관제 PC(VMS 클라이언트, Operator Workstation)",
    category: "영상 관제 / 관제실",
    definition:
      "관제 PC는 관제요원이 VMS 클라이언트로 라이브·녹화 영상과 알람을 보는 PC 입니다.",
    why: "카메라 선택, PTZ 조작, 재생, 알람 확인을 한자리에서 합니다.",
    compare: "관제 PC는 영상을 보는 자리이고, 관리자 PC는 VMS 설정을 바꾸는 자리입니다.",
    aliases: ["vms클라이언트", "관제단말", "운영자워크스테이션", "smartclient", "관제석", "관제화면"],
  },
  {
    term: "단독망",
    fullName: "단독망(통합관제센터 분리 망)",
    category: "영상 관제 / 망·보안",
    definition:
      "단독망은 통합관제센터 네트워크를 인터넷과 업무·행정망에서 떼어 따로 꾸린 망입니다.",
    why: "개인영상정보가 다른 망을 타고 새거나 바깥에서 들어오는 길을 없애려고 나눕니다.",
    compare: "단독망은 관제센터 망을 따로 두는 원칙이고, 다른 망과 이을 때는 국가 정보보안 기본지침을 따릅니다.",
    aliases: ["통합관제망", "관제망", "관제전용망", "영상단독망"],
  },
  {
    term: "IEEE 802.1X",
    fullName: "IEEE 802.1X 포트 기반 네트워크 접근 통제",
    category: "영상 관제 / 망·보안",
    definition:
      "IEEE 802.1X는 스위치 포트에 꽂은 기기를 인증한 뒤에만 망을 쓰게 하는 접근 통제 표준입니다.",
    why: "현장 카메라 랜선을 뽑아 다른 기기를 꽂아도 영상망에 들어오지 못하게 합니다.",
    compare: "802.1X는 기기를 인증해 포트를 열고, MAC 주소 고정은 주소만 보고 열어 속이기 쉽습니다.",
    aliases: ["8021x", "포트기반인증", "dot1x", "eaptls"],
  },
  {
    term: "영상 마스킹",
    fullName: "영상 마스킹(개인영상정보 비식별 처리)",
    category: "영상 관제 / 망·보안",
    definition:
      "영상 마스킹은 영상에서 요청한 사람 이외의 얼굴 등을 알아볼 수 없게 가리는 처리입니다.",
    why: "열람·반출 때 함께 찍힌 다른 사람의 사생활이 드러나지 않게 합니다.",
    compare: "영상 마스킹은 화면 일부를 가리고, 영상 암호화는 권한 없는 사람이 파일을 열지 못하게 합니다.",
    aliases: ["비식별처리", "모자이크처리", "개인정보비식별처리시스템", "마스킹"],
  },
  {
    term: "고정형 영상정보처리기기",
    fullName: "고정형 영상정보처리기기(개인정보 보호법 제2조 제7호)",
    category: "영상 관제 / 규정·제도",
    definition:
      "고정형 영상정보처리기기는 일정한 공간에 설치돼 사람·사물 영상을 계속 촬영하거나 전송하는 장치입니다.",
    why: "공개된 장소에 설치할 수 있는 경우와 안내판·보관·제공 의무가 이 정의를 기준으로 정해집니다.",
    compare: "고정형은 한자리에 설치한 CCTV·네트워크 카메라이고, 이동형은 몸에 지니거나 차량·드론에 단 장치입니다.",
    aliases: ["영상정보처리기기", "cctv", "폐쇄회로텔레비전", "씨씨티비"],
  },
  {
    term: "개인영상정보",
    fullName: "개인영상정보",
    category: "영상 관제 / 규정·제도",
    definition:
      "개인영상정보는 영상정보처리기기로 찍힌 영상 가운데 개인을 알아볼 수 있는 정보입니다.",
    why: "보관 기간, 목적 외 이용·제공 제한, 열람 요구, 안전조치의 대상이 됩니다.",
    compare: "개인영상정보는 사람을 알아볼 수 있는 영상이고, 영상정보는 찍힌 영상 전체를 말합니다.",
    aliases: ["cctv영상정보"],
  },
  {
    term: "영상 보관 기간",
    fullName: "개인영상정보 보관 기간(수집 후 30일 이내)",
    category: "영상 관제 / 규정·제도",
    definition:
      "영상 보관 기간은 찍은 영상을 지우지 않고 저장해 두는 기간입니다.",
    why: "저장 용량을 정하는 기준이 되고, 기간이 지나면 지체 없이 파기해야 합니다.",
    compare: "보관 기간은 영상을 둘 수 있는 한도이고, 백업 보존 기간은 복구용 사본을 두는 기간입니다.",
    aliases: ["보관일수", "저장기간", "보존기간", "retention"],
  },
  {
    term: "보안기능 확인서",
    fullName: "보안기능 확인서(국가정보원 보안기능 시험제도)",
    category: "영상 관제 / 규정·제도",
    definition:
      "보안기능 확인서는 제품의 보안 기능이 보안요구사항을 충족하는지 시험기관이 시험해 발급하는 확인서입니다.",
    why: "국가·공공기관이 장비를 들일 때 거치는 보안적합성 검증 절차를 줄여 줍니다.",
    compare: "보안기능 확인서는 지정 시험기관이 시험해 발급하고, CC 인증은 국제 공통 평가 기준으로 평가합니다.",
    aliases: ["보안기능시험", "국가용보안요구사항"],
  },
  // ── WebRTC 실시간 영상·음성 ──
  {
    term: "WebRTC",
    fullName: "Web Real-Time Communication",
    category: "WebRTC / 기본",
    definition:
      "WebRTC는 브라우저나 앱끼리 음성·영상·데이터를 실시간으로 주고받게 하는 W3C API와 IETF 프로토콜 묶음입니다.",
    why: "플러그인 없이 브라우저만으로 지연이 짧은 통화와 화상회의를 만들 수 있습니다.",
    compare: "WebRTC는 UDP 위에서 양방향으로 바로 주고받고, HLS는 HTTP로 잘라 둔 영상 조각을 내려받아 봅니다.",
    aliases: ["웹알티씨", "웹rtc", "webrealtimecommunication"],
  },
  {
    term: "시그널링",
    fullName: "시그널링(Signaling)",
    category: "WebRTC / 신호",
    definition:
      "시그널링은 미디어 길과 데이터 길을 만들고 관리하고 제어하려고 주고받는 통신입니다.",
    why: "두 단말이 서로의 주소·코덱·암호화 정보를 알아야 미디어 연결을 시작할 수 있습니다.",
    compare: "시그널링은 서버를 거치는 신호 길이고, 실제 음성·영상은 따로 맺은 미디어 길로 흐릅니다.",
    aliases: ["signaling", "signalling", "신호", "신호교환", "시그널링채널"],
  },
  {
    term: "시그널링 서버",
    fullName: "시그널링 서버(Signaling Server)",
    category: "WebRTC / 신호",
    definition:
      "시그널링 서버는 두 단말이 서로를 찾아 연결을 맺도록 제안·응답과 ICE 후보를 대신 전달해 주는 서버입니다.",
    why: "단말끼리는 연결되기 전이라 서로에게 직접 말할 수 없어 중간에서 전달해 줄 서버가 필요합니다.",
    compare: "시그널링 서버는 연결 정보만 전달하고 음성·영상은 지나가지 않으며, SFU·TURN은 미디어가 지나갑니다.",
    aliases: ["signalingserver", "신호서버", "시그널서버"],
  },
  {
    term: "WebSocket",
    fullName: "The WebSocket Protocol",
    category: "WebRTC / 신호",
    definition:
      "WebSocket은 HTTP 업그레이드로 시작해 TCP 연결 하나 위에서 클라이언트와 서버가 양방향으로 메시지를 주고받는 프로토콜입니다.",
    why: "서버가 먼저 단말에 알림을 보낼 수 있어 시그널링 메시지를 바로 전달할 수 있습니다.",
    compare: "WebSocket은 TCP 위의 신호·메시지용 연결이고, WebRTC 미디어는 주로 UDP 위의 SRTP로 흐릅니다.",
    aliases: ["웹소켓", "ws"],
  },
  {
    term: "SDP(세션 기술)",
    fullName: "Session Description Protocol",
    category: "WebRTC / 신호",
    definition:
      "SDP(Session Description Protocol)는 코덱·해상도·암호화 같은 멀티미디어 세션의 내용을 적는 표준 서식입니다.",
    why: "두 단말이 어떤 코덱과 주소로 미디어를 주고받을지 같은 형식으로 적어 맞춰 볼 수 있습니다.",
    compare: "SDP는 미디어를 설명하는 글일 뿐 미디어 자체가 아니며, 보안 용어 SDP(소프트웨어 정의 경계)와는 다른 말입니다.",
    aliases: ["sessiondescriptionprotocol", "세션기술프로토콜", "세션디스크립션", "sdp오퍼"],
  },
  {
    term: "제안·응답(Offer/Answer)",
    fullName: "SDP Offer/Answer",
    category: "WebRTC / 신호",
    definition:
      "제안·응답은 한쪽이 SDP 제안(offer)을 보내고 상대가 SDP 응답(answer)으로 답해 세션 조건을 맞추는 절차입니다.",
    why: "양쪽이 모두 지원하는 코덱과 전송 조건을 한 번의 왕복으로 정할 수 있습니다.",
    compare: "제안·응답은 세션 조건을 맞추는 일이고, ICE 후보 교환은 실제로 통하는 주소를 찾는 일입니다.",
    aliases: ["offeranswer", "sdpoffer", "sdpanswer", "오퍼앤서", "오퍼", "앤서"],
  },
  {
    term: "JSEP",
    fullName: "JavaScript Session Establishment Protocol",
    category: "WebRTC / 신호",
    definition:
      "JSEP(JavaScript Session Establishment Protocol)는 자바스크립트 앱이 SDP 제안·응답으로 세션을 맺는 방식을 정한 IETF 규격입니다.",
    why: "신호를 어떤 통로로 보낼지는 앱에 맡기고 브라우저는 세션 상태와 미디어만 다루게 합니다.",
    compare: "JSEP은 브라우저 안의 세션 절차를 정하고, 신호를 실어 나르는 통로(WebSocket 등)는 정하지 않습니다.",
    aliases: ["javascriptsessionestablishmentprotocol", "제이셉"],
  },
  {
    term: "RTCPeerConnection",
    fullName: "RTCPeerConnection (WebRTC API)",
    category: "WebRTC / API",
    definition:
      "RTCPeerConnection은 브라우저가 다른 브라우저나 단말과 P2P 통신을 맺고 관리하게 하는 WebRTC API 객체입니다.",
    why: "앱은 이 객체 하나로 제안·응답, ICE, 미디어 송수신을 다룹니다.",
    compare: "RTCPeerConnection은 단말 쪽 연결 객체이고, 연결 상대는 다른 단말일 수도 SFU 같은 서버일 수도 있습니다.",
    aliases: ["peerconnection", "피어커넥션", "피어연결"],
  },
  {
    term: "ICE",
    fullName: "Interactive Connectivity Establishment",
    category: "WebRTC / NAT 통과",
    definition:
      "ICE(Interactive Connectivity Establishment)는 여러 주소·포트 후보를 주고받아 실제로 통하는 짝을 찾아내는 NAT 통과 기법입니다.",
    why: "NAT나 방화벽 뒤의 단말끼리도 가능한 가장 직접적인 길을 자동으로 고를 수 있습니다.",
    compare: "ICE는 길을 찾는 절차 전체이고, STUN과 TURN은 ICE가 그 과정에서 쓰는 도구입니다.",
    aliases: ["interactiveconnectivityestablishment", "아이스", "ice협상"],
  },
  {
    term: "ICE 후보",
    fullName: "ICE Candidate",
    category: "WebRTC / NAT 통과",
    definition:
      "ICE 후보는 단말이 통신에 쓸 수 있다고 내놓는 IP 주소와 포트로, 호스트·서버 반사·피어 반사·릴레이 네 종류로 나뉘는 연결 후보입니다.",
    why: "양쪽이 후보를 맞바꿔 하나씩 연결을 시험해 보고 통하는 짝을 고릅니다.",
    compare: "호스트 후보는 단말 자신의 주소, 서버 반사 후보는 NAT 바깥 주소, 릴레이 후보는 TURN 서버의 주소입니다.",
    aliases: ["icecandidate", "candidate", "후보", "호스트후보", "hostcandidate"],
  },
  {
    term: "서버 반사 후보",
    fullName: "Server-Reflexive Candidate (srflx)",
    category: "WebRTC / NAT 통과",
    definition:
      "서버 반사 후보는 단말이 STUN 서버에 패킷을 보냈을 때 NAT가 할당한 바깥쪽 IP 주소와 포트로 된 ICE 후보입니다.",
    why: "사설 주소를 쓰는 단말이 자신의 공인 주소를 상대에게 알려 직접 연결을 시도할 수 있습니다.",
    compare: "서버 반사 후보는 NAT에 뚫린 주소로 직접 통신하고, 릴레이 후보는 TURN 서버가 대신 받아 넘겨줍니다.",
    aliases: ["serverreflexive", "srflx", "서버리플렉시브", "반사후보"],
  },
  {
    term: "릴레이 후보",
    fullName: "Relayed Candidate (relay)",
    category: "WebRTC / NAT 통과",
    definition:
      "릴레이 후보는 TURN 같은 중계 서버에서 얻은 주소로, 미디어가 그 서버를 거쳐 전달되는 ICE 후보입니다.",
    why: "직접 연결이 되지 않는 망에서도 통화가 끊기지 않게 마지막 수단이 됩니다.",
    compare: "릴레이 후보는 서버 대역폭을 쓰므로 직접 길(호스트·서버 반사)을 찾지 못했을 때만 씁니다.",
    aliases: ["relayedcandidate", "relaycandidate", "중계후보", "릴레이"],
  },
  {
    term: "Trickle ICE",
    fullName: "Trickle ICE (Incremental Provisioning of Candidates)",
    category: "WebRTC / NAT 통과",
    definition:
      "Trickle ICE는 후보를 다 모으기 전에 찾는 대로 하나씩 보내며 연결 시험을 먼저 시작하게 하는 ICE 확장입니다.",
    why: "후보 수집이 끝나기를 기다리지 않아 통화 연결 시간이 짧아집니다.",
    compare: "기본 ICE는 후보를 모두 모아 한 번에 보내고, Trickle ICE는 찾는 대로 시그널링으로 흘려보냅니다.",
    aliases: ["트리클ice", "트리클아이스"],
  },
  {
    term: "ICE-Lite",
    fullName: "ICE-Lite",
    category: "WebRTC / NAT 통과",
    definition:
      "ICE-Lite는 서버가 연결 시험을 먼저 걸지 않고 단말의 시험에 응답만 하는 간소한 ICE 구현 방식입니다.",
    why: "공인 주소로 닿을 수 있는 미디어 서버는 응답만 해도 연결되므로 구현이 단순해집니다.",
    compare: "브라우저는 완전한 ICE를 써야 하고, mediasoup 같은 서버는 ICE-Lite로 ICE 서버 역할만 합니다.",
    aliases: ["아이스라이트"],
  },
  {
    term: "ICE-TCP",
    fullName: "ICE-TCP (TCP Candidates with ICE)",
    category: "WebRTC / NAT 통과",
    definition:
      "ICE-TCP는 UDP가 막힌 망에서 미디어를 TCP 연결로 주고받도록 TCP 주소를 ICE 후보로 쓰는 방식입니다.",
    why: "VPN이나 회사 방화벽처럼 UDP를 막는 환경에서도 미디어 서버에 직접 붙을 수 있습니다.",
    compare: "ICE-TCP는 미디어 서버에 TCP로 직접 붙고, TURN/TCP는 TURN 서버까지만 TCP이고 그 뒤는 중계입니다.",
    aliases: ["tcp후보", "tcpcandidate", "tcp폴백"],
  },
  {
    term: "STUN",
    fullName: "Session Traversal Utilities for NAT",
    category: "WebRTC / NAT 통과",
    definition:
      "STUN(Session Traversal Utilities for NAT)은 단말이 NAT 바깥에서 보이는 자신의 주소와 포트를 알아내는 데 쓰는 프로토콜입니다.",
    why: "사설 주소 단말이 공인 주소를 알아야 상대에게 직접 연결할 주소를 알려 줄 수 있습니다.",
    compare: "STUN은 주소만 알려 주고 미디어는 지나가지 않으며, TURN은 미디어를 대신 받아 넘겨줍니다.",
    aliases: ["sessiontraversalutilitiesfornat", "스턴", "stun서버", "stunserver"],
  },
  {
    term: "TURN",
    fullName: "Traversal Using Relays around NAT",
    category: "WebRTC / NAT 통과",
    definition:
      "TURN(Traversal Using Relays around NAT)은 직접 연결이 안 되는 단말을 위해 중계 서버가 패킷을 대신 주고받아 주는 프로토콜입니다.",
    why: "양쪽 NAT가 직접 연결을 막아도 중계 서버를 거쳐 통화가 이어집니다.",
    compare: "TURN은 미디어를 그대로 중계만 하고, SFU는 여러 참가자의 미디어를 골라 나눠 줍니다.",
    aliases: ["traversalusingrelaysaroundnat", "턴", "turn서버", "turnserver", "중계서버", "릴레이서버"],
  },
  {
    term: "TURN over TLS",
    fullName: "TURN over TLS (TURNS)",
    category: "WebRTC / NAT 통과",
    definition:
      "TURN over TLS는 단말과 TURN 서버 사이를 TLS로 감싼 TCP 연결로 잇고 turns: 주소로 적는 TURN 방식입니다.",
    why: "UDP를 모두 막고 TCP 443만 여는 회사 방화벽에서도 미디어 중계가 가능합니다.",
    compare: "TURN/UDP는 3478로 빠르게 중계하고, TURN over TLS는 5349나 443으로 막힌 망을 통과하는 대신 지연이 늘 수 있습니다.",
    aliases: ["turns", "turntls", "443폴백", "tls폴백", "turntcp"],
  },
  {
    term: "coturn",
    fullName: "coturn TURN server",
    category: "WebRTC / 제품",
    definition:
      "coturn은 TURN과 STUN 서버 기능을 제공하는 오픈소스 서버 소프트웨어입니다.",
    why: "",
    compare: "",
    aliases: ["코턴", "coturnserver"],
  },
  {
    term: "TURN 릴레이 포트 범위",
    fullName: "TURN Relay Port Range",
    category: "WebRTC / NAT 통과",
    definition:
      "TURN 릴레이 포트 범위는 TURN 서버가 중계용 주소를 할당할 때 쓰는 UDP 포트 구간입니다.",
    why: "방화벽에서 이 구간을 열어 두어야 TURN 서버가 상대 단말이나 미디어 서버와 중계 패킷을 주고받습니다.",
    compare: "3478·5349는 단말이 TURN 서버에 붙는 포트이고, 릴레이 포트 범위는 서버가 상대 쪽으로 여는 포트입니다.",
    aliases: ["relayportrange", "릴레이포트", "minport", "maxport", "중계포트범위"],
  },
  {
    term: "NAT 통과",
    fullName: "NAT Traversal",
    category: "WebRTC / NAT 통과",
    definition:
      "NAT 통과는 NAT 뒤에 있어 바깥에서 먼저 닿을 수 없는 단말끼리 통신 길을 여는 기술을 통틀어 이르는 말입니다.",
    why: "대부분의 단말이 사설 주소를 쓰므로 이 과정 없이는 단말끼리 직접 미디어를 주고받기 어렵습니다.",
    compare: "NAT 통과는 목표이고, ICE·STUN·TURN은 그 목표를 이루는 구체적인 절차와 프로토콜입니다.",
    aliases: ["nattraversal", "nat트래버설", "nat우회", "방화벽통과"],
  },
  {
    term: "UDP 홀 펀칭",
    fullName: "UDP Hole Punching",
    category: "WebRTC / NAT 통과",
    definition:
      "UDP 홀 펀칭은 양쪽 단말이 서로에게 UDP 패킷을 보내 NAT에 통로를 만들어 직접 통신 길을 찾는 기법입니다.",
    why: "중계 서버 없이 단말끼리 직접 연결해 지연과 서버 비용을 줄입니다.",
    compare: "홀 펀칭은 양쪽 NAT가 목적지에 따라 매핑을 바꾸는 방식이면 대개 실패하고, 그때는 TURN 중계가 필요합니다.",
    aliases: ["holepunching", "홀펀칭", "udpholepunching"],
  },
  {
    term: "대칭 NAT",
    fullName: "Symmetric NAT (Address- and Port-Dependent Mapping)",
    category: "WebRTC / NAT 통과",
    definition:
      "대칭 NAT은 같은 내부 주소라도 목적지마다 다른 바깥 포트를 배정해 STUN으로 알아낸 주소가 다른 상대에게는 통하지 않는 NAT입니다.",
    why: "이런 NAT 뒤의 단말은 직접 연결이 잘 안 되므로 TURN 중계를 준비해야 한다는 판단 근거가 됩니다.",
    compare: "IETF는 '대칭 NAT' 대신 '주소·포트 의존 매핑'이라는 말을 쓰며 옛 원뿔형·대칭형 분류는 부정확하다고 봅니다.",
    aliases: ["symmetricnat", "시메트릭nat", "주소의존매핑", "addressdependentmapping"],
  },
  {
    term: "공인 IP 알림",
    fullName: "Announced IP / 1:1 NAT Mapping",
    category: "WebRTC / 배치",
    definition:
      "공인 IP 알림은 사설 IP로 동작하는 미디어 서버가 ICE 후보에 자신의 공인 IP를 적어 내보내도록 하는 설정입니다.",
    why: "클라우드 서버는 공인 IP가 사설 IP에 1:1로 매핑돼 있어 이 설정이 없으면 단말이 서버에 닿지 못합니다.",
    compare: "단말은 STUN으로 바깥 주소를 스스로 알아내지만, 미디어 서버는 보통 설정값으로 공인 주소를 알려 줍니다.",
    aliases: ["announcedip", "announcedaddress", "externalip", "nat11", "useexternalip", "공인ip매핑"],
  },
  {
    term: "UDP 포트 다중화",
    fullName: "UDP Mux (Single-Port Media)",
    category: "WebRTC / 배치",
    definition:
      "UDP 포트 다중화는 미디어 서버가 모든 참가자의 미디어를 넓은 포트 범위 대신 UDP 포트 하나로 받는 방식입니다.",
    why: "방화벽에서 수만 개의 UDP 포트 대신 포트 하나만 열면 됩니다.",
    compare: "포트 범위 방식은 참가자마다 포트를 따로 쓰고, 다중화 방식은 포트 하나에서 연결을 구분합니다.",
    aliases: ["udpmux", "단일포트", "webrtcserver", "싱글포트"],
  },
  {
    term: "미디어 경로",
    fullName: "Media Path",
    category: "WebRTC / 미디어",
    definition:
      "미디어 경로는 음성·영상 패킷이 실제로 흐르는 길로, 시그널링이 지나는 길과 따로 맺어지는 통신 경로입니다.",
    why: "신호와 미디어를 나눠야 미디어는 가장 짧은 길로, 신호는 서버를 거쳐 보낼 수 있습니다.",
    compare: "신호 길은 HTTPS·WebSocket(TCP 443)이고, 미디어 길은 주로 UDP 위의 SRTP라 여는 포트와 지나는 장비가 다릅니다.",
    aliases: ["mediapath", "미디어길", "미디어플레인", "mediaplane", "미디어채널"],
  },
  {
    term: "RTCP",
    fullName: "RTP Control Protocol",
    category: "WebRTC / 미디어",
    definition:
      "RTCP(RTP Control Protocol)는 RTP 전달 상태를 살피고 손실 재전송·키프레임 요청 같은 피드백을 주고받는 제어 프로토콜입니다.",
    why: "받는 쪽의 손실과 품질을 보내는 쪽에 알려 화질과 전송량을 조절하게 합니다.",
    compare: "RTCP는 RTP와 같은 포트에 섞어 보낼 수 있어 구성도에서는 보통 미디어 선 하나로 함께 그립니다.",
    aliases: ["rtpcontrolprotocol", "알티씨피", "rtcp피드백"],
  },
  {
    term: "DTLS-SRTP",
    fullName: "DTLS Extension to Establish Keys for SRTP",
    category: "WebRTC / 미디어 보안",
    definition:
      "DTLS-SRTP는 미디어 길 위에서 DTLS 핸드셰이크로 SRTP 암호화 키를 정하는 방식입니다.",
    why: "키가 시그널링 서버를 거치지 않아 신호 서버가 미디어 키를 알 수 없습니다.",
    compare: "DTLS-SRTP는 단말과 미디어 서버 구간을 암호화하므로 SFU는 미디어를 풀 수 있고, 종단간 암호화는 따로 필요합니다.",
    aliases: ["디티엘에스srtp"],
  },
  {
    term: "데이터 채널",
    fullName: "WebRTC Data Channel",
    category: "WebRTC / 데이터",
    definition:
      "데이터 채널은 WebRTC 연결에서 음성·영상이 아닌 임의의 앱 데이터를 DTLS 위의 SCTP로 주고받는 통로입니다.",
    why: "채팅·파일·게임 상태 같은 데이터를 미디어와 같은 연결로 지연 없이 보낼 수 있습니다.",
    compare: "데이터 채널은 순서와 재전송 여부를 채널마다 고를 수 있고, WebSocket은 항상 순서대로 다 전달합니다.",
    aliases: ["datachannel", "rtcdatachannel"],
  },
  {
    term: "SCTP",
    fullName: "Stream Control Transmission Protocol",
    category: "WebRTC / 데이터",
    definition:
      "SCTP(Stream Control Transmission Protocol)는 WebRTC 데이터 채널이 DTLS 위에서 메시지를 나르는 데 쓰는 전송 프로토콜입니다.",
    why: "메시지마다 순서 보장과 재전송 여부를 달리해 보낼 수 있습니다.",
    compare: "WebRTC의 SCTP는 IP 위에 바로 놓이지 않고 UDP·ICE·DTLS 위에 얹혀 방화벽에는 UDP로 보입니다.",
    aliases: ["streamcontroltransmissionprotocol", "에스씨티피", "sctpoverdtls"],
  },
  {
    term: "BUNDLE",
    fullName: "BUNDLE (Multiplexing on a Single 5-Tuple)",
    category: "WebRTC / 미디어",
    definition:
      "BUNDLE은 음성·영상·데이터 채널을 모두 같은 주소·포트 쌍 하나에 실어 보내는 WebRTC 다중화 방식입니다.",
    why: "단말마다 여는 포트와 ICE 연결 수가 줄어 방화벽 통과와 연결 시간이 유리해집니다.",
    compare: "BUNDLE을 쓰면 단말과 서버 사이 미디어 선은 종류별 여러 줄이 아니라 한 줄로 그리면 됩니다.",
    aliases: ["번들", "sdpbundle", "포트묶기"],
  },
  {
    term: "종단간 암호화(SFrame)",
    fullName: "Secure Frame (SFrame) End-to-End Encryption",
    category: "WebRTC / 미디어 보안",
    definition:
      "SFrame은 미디어 프레임을 단말끼리 암호화해 SFU 같은 중앙 미디어 서버가 내용을 볼 수 없게 하는 종단간 암호화 방식입니다.",
    why: "서버를 믿을 수 없어도 통화 내용이 서버에서 노출되지 않습니다.",
    compare: "DTLS-SRTP는 단말과 서버 구간만 지키고, SFrame은 서버가 전달에 필요한 정보만 보게 하고 내용은 가립니다.",
    aliases: ["sframe", "e2ee", "종단간암호화", "endtoendencryption", "secureframe"],
  },
  {
    term: "P2P 메시",
    fullName: "Peer-to-Peer Mesh",
    category: "WebRTC / 구성 방식",
    definition:
      "P2P 메시는 중앙 서버 없이 참가자마다 다른 모든 참가자와 직접 미디어 연결을 맺는 다자 통화 구성입니다.",
    why: "미디어 서버가 필요 없어 1:1이나 아주 작은 통화를 싸고 지연 없이 만들 수 있습니다.",
    compare: "메시는 인원이 늘수록 각 단말의 올리기 부담이 커지고, SFU는 단말이 한 번만 올리면 서버가 나눠 줍니다.",
    aliases: ["mesh", "p2p", "peertopeer", "메시", "풀메시", "피어투피어", "p2pmesh"],
  },
  {
    term: "SFU",
    fullName: "Selective Forwarding Unit",
    category: "WebRTC / 구성 방식",
    definition:
      "SFU(Selective Forwarding Unit)는 참가자가 보낸 음성·영상 스트림을 디코딩하지 않고 골라서 다른 참가자에게 전달하는 미디어 서버입니다.",
    why: "섞거나 다시 인코딩하지 않아 지연과 서버 부하가 작아서 많은 참가자를 감당합니다.",
    compare: "SFU는 스트림을 그대로 여러 개 내려보내고, MCU는 하나로 섞어 내려보냅니다.",
    aliases: ["selectiveforwardingunit", "sfm", "selectiveforwardingmiddlebox", "에스에프유", "sfu서버"],
  },
  {
    term: "MCU",
    fullName: "Multipoint Control Unit",
    category: "WebRTC / 구성 방식",
    definition:
      "MCU(Multipoint Control Unit)는 여러 참가자의 미디어를 디코딩해 하나로 섞고 다시 인코딩해 내려보내는 미디어 서버입니다.",
    why: "단말은 스트림 하나만 받으면 되어 단말 성능과 내려받기 대역폭이 적게 듭니다.",
    compare: "MCU는 서버에서 섞느라 연산과 지연이 크고, SFU는 전달만 해서 가볍지만 단말이 여러 스트림을 디코딩합니다.",
    aliases: ["multipointcontrolunit", "엠씨유", "믹서", "mixer", "mediamixer"],
  },
  {
    term: "미디어 서버",
    fullName: "Media Server",
    category: "WebRTC / 구성 방식",
    definition:
      "미디어 서버는 단말과 미디어 세션을 맺어 음성·영상을 받고 전달·혼합·녹화·변환하는 서버를 통틀어 이르는 말입니다.",
    why: "3명 이상 통화, 녹화, 방송 송출처럼 단말끼리만으로는 어려운 일을 서버가 맡습니다.",
    compare: "미디어 서버는 미디어가 지나가는 서버이고, 시그널링 서버는 연결 정보만 전달합니다.",
    aliases: ["mediaserver", "webrtc서버"],
  },
  {
    term: "시뮬캐스트",
    fullName: "Simulcast",
    category: "WebRTC / 미디어",
    definition:
      "시뮬캐스트는 같은 영상 원본을 화질이 다른 여러 인코딩으로 동시에 보내는 방식입니다.",
    why: "SFU가 받는 사람의 회선 상태에 맞는 화질을 골라 전달할 수 있습니다.",
    compare: "시뮬캐스트는 화질별로 따로 인코딩한 스트림 여러 개이고, SVC는 한 스트림 안에 화질 계층을 쌓습니다.",
    aliases: ["simulcast", "사이멀캐스트", "동시송출", "다중화질"],
  },
  {
    term: "SVC",
    fullName: "Scalable Video Coding",
    category: "WebRTC / 미디어",
    definition:
      "SVC(Scalable Video Coding)는 영상 한 스트림을 해상도·프레임 수 계층으로 나눠 인코딩해 일부 계층만 골라 전달할 수 있게 하는 방식입니다.",
    why: "SFU가 재인코딩 없이 받는 사람의 기기와 대역폭에 맞는 계층만 전달합니다.",
    compare: "SVC는 한 스트림 안의 계층이고, 시뮬캐스트는 화질별로 따로 보낸 스트림 여러 개입니다.",
    aliases: ["scalablevideocoding", "스케일러블비디오코딩", "공간계층", "시간계층", "scalabilitymode"],
  },
  {
    term: "트랜스코딩",
    fullName: "Transcoding",
    category: "WebRTC / 미디어",
    definition:
      "트랜스코딩은 미디어를 디코딩한 뒤 다른 코덱·해상도·비트레이트로 다시 인코딩하는 처리입니다.",
    why: "RTMP로 들어온 영상을 WebRTC 단말이 볼 수 있는 형식으로 바꾸거나 화질을 여러 단계로 만들 때 필요합니다.",
    compare: "트랜스코딩은 CPU를 많이 쓰는 변환이고, SFU의 전달은 변환 없이 패킷을 넘기기만 합니다.",
    aliases: ["transcoding", "트랜스코더", "transcoder", "재인코딩", "인코딩변환"],
  },
  {
    term: "Opus",
    fullName: "Opus Audio Codec",
    category: "WebRTC / 코덱",
    definition:
      "Opus는 WebRTC 단말이 반드시 구현해야 하는 음성 코덱입니다.",
    why: "모든 WebRTC 단말이 지원하므로 변환 없이 서로 음성을 주고받을 수 있습니다.",
    compare: "Opus는 음성 코덱이고, 영상은 VP8과 H.264 Constrained Baseline이 WebRTC 브라우저의 필수 코덱입니다.",
    aliases: ["오퍼스", "opuscodec"],
  },
  {
    term: "WHIP",
    fullName: "WebRTC-HTTP Ingestion Protocol",
    category: "WebRTC / 방송",
    definition:
      "WHIP(WebRTC-HTTP Ingestion Protocol)은 HTTP POST로 SDP 제안·응답을 한 번 주고받아 WebRTC 영상을 송출 서버로 보내는 프로토콜입니다.",
    why: "인코더나 방송 도구가 별도 시그널링 없이 표준 방식으로 WebRTC 송출을 시작할 수 있습니다.",
    compare: "WHIP은 서버로 올리는 송출용이고, WHEP은 서버에서 받아 보는 시청용입니다.",
    aliases: ["webrtchttpingestionprotocol", "윕", "whip인제스트"],
  },
  {
    term: "WHEP",
    fullName: "WebRTC-HTTP Egress Protocol",
    category: "WebRTC / 방송",
    definition:
      "WHEP(WebRTC-HTTP Egress Protocol)은 시청자가 HTTP로 SDP를 주고받아 WebRTC로 영상을 받아 보게 하는 프로토콜 초안입니다.",
    why: "플레이어가 표준 방식으로 지연이 짧은 WebRTC 시청을 시작할 수 있습니다.",
    compare: "WHEP은 WebRTC로 바로 받아 지연이 짧고, HLS는 HTTP 조각을 내려받아 지연이 더 깁니다.",
    aliases: ["webrtchttpegressprotocol", "whep시청", "whep플레이어"],
  },
  {
    term: "RTMP",
    fullName: "Real Time Messaging Protocol",
    category: "WebRTC / 방송",
    definition:
      "RTMP(Real Time Messaging Protocol)는 TCP 같은 전송 위에서 음성·영상·데이터 메시지를 묶어 나르는 어도비의 스트리밍 프로토콜입니다.",
    why: "OBS 같은 방송 도구와 하드웨어 인코더가 송출 서버로 영상을 올릴 때 널리 씁니다.",
    compare: "RTMP는 TCP로 서버에 올리는 송출용으로 주로 쓰이고, WebRTC는 UDP로 양방향 통화에 씁니다.",
    aliases: ["realtimemessagingprotocol", "알티엠피", "rtmps", "rtmp인제스트"],
  },
  {
    term: "인제스트",
    fullName: "Ingest",
    category: "WebRTC / 방송",
    definition:
      "인제스트는 방송 도구나 인코더가 보낸 영상을 서버가 RTMP·SRT·WHIP 같은 프로토콜로 받아들이는 입구 단계입니다.",
    why: "WebRTC가 아닌 송출 장비의 영상도 방이나 방송 시스템 안으로 들여올 수 있습니다.",
    compare: "인제스트는 서버로 들어오는 방향이고, 이그레스는 서버에서 녹화·송출로 나가는 방향입니다.",
    aliases: ["ingest", "인제스트서버", "송출수신"],
  },
  {
    term: "미디어 이그레스",
    fullName: "Media Egress (Recording / Restreaming)",
    category: "WebRTC / 녹화",
    definition:
      "미디어 이그레스는 방의 음성·영상을 서버가 꺼내 파일로 녹화하거나 HLS·RTMP로 내보내는 단계입니다.",
    why: "회의를 저장하거나 유튜브 같은 방송 서비스로 동시에 송출할 수 있습니다.",
    compare: "이그레스는 방에 참가자처럼 들어와 받기만 하는 서버 쪽 구성요소이고, 일반 참가자와 달리 저장소·방송 서버로 내보냅니다.",
    aliases: ["egress", "이그레스", "레코더", "recorder", "녹화", "recording"],
  },
  {
    term: "음성 AI 에이전트",
    fullName: "Voice AI Agent (Realtime Participant)",
    category: "WebRTC / AI 참가자",
    definition:
      "음성 AI 에이전트는 서버에서 도는 프로그램이 방에 참가자로 들어와 음성을 듣고 AI로 답을 만들어 말하는 구성요소입니다.",
    why: "사람 참가자와 같은 WebRTC 길로 붙으므로 단말 쪽을 바꾸지 않고 AI 상담·통역·회의 보조를 넣을 수 있습니다.",
    compare: "AI 에이전트는 단말이 아니라 서버 쪽 참가자라서 구성도에서는 서버 구역에 두고 SFU와 미디어 선으로 잇습니다.",
    aliases: ["voiceagent", "ai에이전트참가자", "봇참가자", "ai봇", "음성봇", "agentparticipant"],
  },
  {
    term: "STT-LLM-TTS 파이프라인",
    fullName: "STT-LLM-TTS Pipeline",
    category: "WebRTC / AI 참가자",
    definition:
      "STT-LLM-TTS 파이프라인은 음성을 글로 바꾸고 언어 모델로 답을 만든 뒤 다시 음성으로 합성하는 음성 AI 처리 순서입니다.",
    why: "글만 다루는 언어 모델로도 실시간 음성 대화를 만들 수 있습니다.",
    compare: "이 파이프라인은 에이전트 안의 처리 순서이고, 에이전트와 방 사이는 WebRTC 미디어로 이어집니다.",
    aliases: ["sttllmtts", "음성파이프라인", "stt", "tts", "음성인식", "음성합성"],
  },
  {
    term: "mediasoup",
    fullName: "mediasoup",
    category: "WebRTC / 제품",
    definition:
      "mediasoup은 Node.js 모듈로 서버 앱에 넣어 쓰는 오픈소스 WebRTC SFU 라이브러리입니다.",
    why: "",
    compare: "",
    aliases: ["미디어수프", "미디어숩"],
  },
  {
    term: "Janus",
    fullName: "Janus WebRTC Server",
    category: "WebRTC / 제품",
    definition:
      "Janus는 Meetecho가 만든 오픈소스 범용 WebRTC 서버로, SFU·음성 혼합·스트리밍 같은 기능을 플러그인으로 붙여 쓰는 소프트웨어입니다.",
    why: "",
    compare: "",
    aliases: ["야누스", "janusgateway", "januswebrtc"],
  },
  {
    term: "LiveKit",
    fullName: "LiveKit",
    category: "WebRTC / 제품",
    definition:
      "LiveKit은 SFU 서버와 녹화(Egress)·인제스트(Ingress)·AI 에이전트 구성요소를 함께 제공하는 오픈소스 WebRTC 플랫폼입니다.",
    why: "",
    compare: "",
    aliases: ["라이브킷", "livekitserver", "livekitcloud"],
  },
  {
    term: "Jitsi Meet",
    fullName: "Jitsi Meet",
    category: "WebRTC / 제품",
    definition:
      "Jitsi Meet은 Jitsi Videobridge를 써서 화상회의를 제공하는 오픈소스 WebRTC 웹 애플리케이션입니다.",
    why: "",
    compare: "",
    aliases: ["지치", "짓시", "jitsi", "지치미트"],
  },
  {
    term: "Jitsi Videobridge",
    fullName: "Jitsi Videobridge (JVB)",
    category: "WebRTC / 제품",
    definition:
      "Jitsi Videobridge(JVB)는 회의 참가자들 사이에 영상 스트림을 전달하는 Jitsi의 WebRTC 미디어 서버입니다.",
    why: "",
    compare: "",
    aliases: ["jvb", "비디오브리지", "지치비디오브리지"],
  },
  {
    term: "Jibri",
    fullName: "Jibri (Jitsi Broadcasting Infrastructure)",
    category: "WebRTC / 제품",
    definition:
      "Jibri는 가상 화면에 크롬을 띄워 Jitsi 회의에 들어간 뒤 화면을 ffmpeg으로 인코딩해 녹화하거나 송출하는 도구입니다.",
    why: "",
    compare: "",
    aliases: ["지브리", "jitsi녹화"],
  },
  // ── LLM 서빙 · AI 에이전트 ──
  {
    term: "LLM",
    fullName: "대규모 언어 모델 (Large Language Model)",
    category: "AI / 모델",
    definition:
      "LLM은 많은 글을 학습해 입력한 글에 이어질 글을 만들어 내는 AI 모델로, 질문에 답하거나 요약·번역하는 데 쓰입니다.",
    why: "사람 말로 된 요청을 이해하고 글을 만들어 주어 챗봇·검색·문서 작업에 붙여 씁니다.",
    compare: "LLM은 글을 만들어 내는 모델이고, 임베딩 모델은 글을 숫자 벡터로 바꾸기만 하는 모델입니다.",
    aliases: ["largelanguagemodel", "대규모언어모델", "거대언어모델", "언어모델", "생성형ai모델"],
  },
  {
    term: "추론 서버",
    fullName: "추론 서버 (Inference Server, Model Server)",
    category: "AI / 모델 서빙",
    definition:
      "추론 서버는 학습이 끝난 AI 모델을 메모리나 GPU에 올려 두고 HTTP·gRPC 요청을 받아 결과를 돌려주는 서버입니다.",
    why: "앱마다 모델을 따로 올리지 않고 한곳에 올려 두고 여러 앱이 함께 호출하려고 씁니다.",
    compare: "추론 서버는 모델을 직접 돌리고, LLM 게이트웨이는 모델을 돌리지 않고 요청을 추론 서버나 외부 API로 넘깁니다.",
    aliases: ["inferenceserver", "modelserver", "모델서버", "모델서빙서버", "서빙서버", "llm서버", "ai모델서버"],
  },
  {
    term: "OpenAI 호환 API",
    fullName: "OpenAI 호환 API (OpenAI-compatible API)",
    category: "AI / 모델 서빙",
    definition:
      "OpenAI 호환 API는 OpenAI의 /v1/chat/completions 같은 경로와 요청 형식을 그대로 따르는 HTTP API입니다.",
    why: "앱 코드를 그대로 두고 주소만 바꿔 외부 API와 사내 모델 서버를 바꿔 낄 수 있습니다.",
    compare: "OpenAI 호환 API는 호출 형식만 같을 뿐, 실제 모델과 서버는 OpenAI와 무관할 수 있습니다.",
    aliases: ["openaicompatibleapi", "openai호환", "오픈ai호환api", "chatcompletionsapi", "v1chatcompletions"],
  },
  {
    term: "SSE",
    fullName: "서버 전송 이벤트 (Server-Sent Events)",
    category: "프로토콜 / 웹",
    definition:
      "SSE는 서버가 HTTP 응답 하나를 끊지 않고 열어 둔 채 text/event-stream 형식으로 이벤트를 계속 내려보내는 방식입니다.",
    why: "LLM이 만든 글을 조각이 나오는 대로 바로 화면에 보여 주려고 씁니다.",
    compare: "SSE는 서버에서 클라이언트 쪽으로만 흐르고, WebSocket은 한 연결에서 양쪽이 주고받습니다.",
    aliases: ["serversentevents", "서버전송이벤트", "서버센트이벤트", "texteventstream"],
  },
  {
    term: "스트리밍 응답",
    fullName: "스트리밍 응답 (Streaming Response, Token Streaming)",
    category: "AI / 모델 서빙",
    definition:
      "스트리밍 응답은 LLM이 답을 다 만든 뒤 한 번에 보내지 않고 만들어지는 조각마다 바로 보내는 응답 방식입니다.",
    why: "긴 답도 첫 글자가 빨리 보여 사용자가 기다리는 느낌이 줄어듭니다.",
    compare: "스트리밍 응답은 연결을 오래 열어 두므로, 중간의 프록시·LB가 버퍼링하거나 시간 초과로 끊지 않게 맞춰야 합니다.",
    aliases: ["streamingresponse", "tokenstreaming", "토큰스트리밍"],
  },
  {
    term: "토큰",
    fullName: "토큰 (Token)",
    category: "AI / 모델",
    definition:
      "토큰은 LLM이 글을 처리하는 단위이자 사용량과 한도를 세는 단위입니다.",
    why: "외부 LLM API의 요금과 분당 한도가 토큰 수로 정해져서 용량과 비용을 토큰으로 계산합니다.",
    compare: "여기서 토큰은 글의 처리 단위이고, 인증에 쓰는 액세스 토큰과는 다른 말입니다.",
    aliases: ["token", "llm토큰", "입력토큰", "출력토큰"],
  },
  {
    term: "TPM·RPM",
    fullName: "분당 토큰 수·분당 요청 수 (Tokens Per Minute, Requests Per Minute)",
    category: "AI / 운영",
    definition:
      "TPM·RPM은 LLM API를 1분 동안 쓸 수 있는 토큰 수와 요청 수의 한도입니다.",
    why: "한 앱이 할당량을 다 써서 다른 앱이 막히지 않도록 키·팀별로 한도를 나눠 겁니다.",
    compare: "TPM은 처리한 글의 양에 거는 한도이고, RPM은 호출 횟수에 거는 한도입니다.",
    aliases: ["rpm", "tokensperminute", "requestsperminute", "분당토큰", "분당요청", "토큰한도"],
  },
  {
    term: "모델 저장소",
    fullName: "모델 저장소 (Model Repository, Model Store)",
    category: "AI / 모델 서빙",
    definition:
      "모델 저장소는 추론 서버가 올릴 모델 파일을 모아 두는 디렉터리나 원격 저장소입니다.",
    why: "크기가 큰 모델 파일을 서버마다 내려받지 않고 한곳에서 읽어 올리려고 씁니다.",
    compare: "모델 저장소는 파일을 두는 곳이고, 모델 레지스트리는 모델의 버전·별칭·이력을 관리하는 목록입니다.",
    aliases: ["modelrepository", "modelstore", "모델리포지토리", "모델스토어", "모델캐시", "가중치저장소"],
  },
  {
    term: "배치 추론",
    fullName: "배치 추론 (Batch Inference, Batch API)",
    category: "AI / 모델 서빙",
    definition:
      "배치 추론은 바로 답이 필요 없는 요청을 한꺼번에 묶어 맡기고 결과를 나중에 받는 비동기 처리 방식입니다.",
    why: "대량 분류·평가처럼 급하지 않은 일을 실시간 요청과 따로 돌리려고 씁니다.",
    compare: "배치 추론은 결과를 나중에 파일로 받고, 스트리밍 응답은 연결을 열어 둔 채 바로 받습니다.",
    aliases: ["batchinference", "batchapi", "배치api", "오프라인추론", "비동기추론"],
  },
  {
    term: "LLM 게이트웨이",
    fullName: "LLM 게이트웨이 (LLM Gateway, AI Gateway, LLM Proxy)",
    category: "AI / 게이트웨이",
    definition:
      "LLM 게이트웨이는 앱과 여러 LLM 사이에서 하나의 주소로 요청을 받아 인증·한도·분산·기록을 맡는 프록시입니다.",
    why: "공급자 키와 사용량을 한곳에서 관리하고, 앱을 고치지 않고 모델을 바꾸려고 씁니다.",
    compare: "API 게이트웨이는 일반 API를 다루고, LLM 게이트웨이는 토큰 한도·모델 분산처럼 LLM에 맞춘 기능을 더합니다.",
    aliases: ["llmgateway", "aigateway", "ai게이트웨이", "llmproxy", "llm프록시", "모델게이트웨이", "genaigateway"],
  },
  {
    term: "가상 키",
    fullName: "가상 키 (Virtual Key)",
    category: "AI / 게이트웨이",
    definition:
      "가상 키는 LLM 게이트웨이가 사용자·팀별로 발급하며 쓸 수 있는 모델·예산·한도를 키마다 정해 두는 API 키입니다.",
    why: "실제 공급자 키를 앱에 나눠 주지 않고도 누가 얼마나 썼는지 나눠 보고 막을 수 있습니다.",
    compare: "가상 키는 게이트웨이 안에서만 통하고, 공급자 키는 게이트웨이만 갖고 외부 API를 부를 때 씁니다.",
    aliases: ["virtualkey", "버추얼키", "게이트웨이키", "프록시키"],
  },
  {
    term: "폴백",
    fullName: "폴백 (Fallback)",
    category: "AI / 게이트웨이",
    definition:
      "폴백은 호출한 모델이나 공급자가 실패하면 미리 정해 둔 다른 모델·배포로 요청을 다시 보내는 동작입니다.",
    why: "한 공급자에 장애나 한도 초과가 나도 서비스가 멈추지 않게 하려고 씁니다.",
    compare: "폴백은 실패한 뒤 다른 곳으로 돌리는 것이고, 부하 분산은 평소에 여러 곳으로 나누는 것입니다.",
    aliases: ["fallback", "모델폴백", "대체모델", "fallbackmodel"],
  },
  {
    term: "시맨틱 캐시",
    fullName: "시맨틱 캐시 (Semantic Cache)",
    category: "AI / 게이트웨이",
    definition:
      "시맨틱 캐시는 프롬프트를 벡터로 바꿔 예전 프롬프트와 충분히 비슷하면 저장해 둔 응답을 돌려주는 캐시입니다.",
    why: "글자가 조금 달라도 뜻이 같은 질문에는 모델을 다시 부르지 않아 비용과 시간이 줄어듭니다.",
    compare: "일반 캐시는 요청이 똑같아야 맞고, 시맨틱 캐시는 뜻이 비슷하면 맞는 것으로 봅니다.",
    aliases: ["semanticcache", "의미캐시", "시맨틱캐싱", "semanticcaching"],
  },
  {
    term: "프롬프트 캐싱",
    fullName: "프롬프트 캐싱 (Prompt Caching)",
    category: "AI / 모델 서빙",
    definition:
      "프롬프트 캐싱은 프롬프트의 앞부분을 공급자 쪽에 저장해 두고 같은 앞부분이 다시 오면 거기서부터 이어 처리하는 기능입니다.",
    why: "긴 지침이나 문서를 매번 붙여 보내는 앱에서 처리 시간과 비용을 줄입니다.",
    compare: "프롬프트 캐싱은 입력의 같은 앞부분을 재사용하고, 시맨틱 캐시는 비슷한 질문에 예전 응답을 돌려줍니다.",
    aliases: ["promptcaching", "promptcache", "프롬프트캐시", "컨텍스트캐싱"],
  },
  {
    term: "가드레일",
    fullName: "가드레일 (Guardrails)",
    category: "AI / 보안",
    definition:
      "가드레일은 LLM에 들어가는 입력과 나오는 응답을 검사해 해로운 내용이나 민감한 정보를 막거나 가리는 장치입니다.",
    why: "내부 정보·개인정보가 프롬프트에 실려 나가거나 부적절한 답이 사용자에게 가는 것을 줄입니다.",
    compare: "WAF는 웹 요청의 공격 패턴을 보고, 가드레일은 프롬프트와 응답의 내용을 봅니다.",
    aliases: ["guardrails", "guardrail", "ai가드레일", "콘텐츠필터", "입출력필터"],
  },
  {
    term: "프롬프트 인젝션",
    fullName: "프롬프트 인젝션 (Prompt Injection)",
    category: "AI / 보안",
    definition:
      "프롬프트 인젝션은 사용자 입력이나 외부 문서에 넣은 지시문으로 LLM의 동작을 의도와 다르게 바꾸는 공격입니다.",
    why: "에이전트가 읽는 웹 페이지·문서에 숨은 지시가 도구 호출로 이어질 수 있어 권한 설계의 전제가 됩니다.",
    compare: "직접 인젝션은 사용자가 입력에 넣고, 간접 인젝션은 모델이 읽어 들이는 외부 자료에 숨겨 둡니다.",
    aliases: ["promptinjection", "프롬프트주입", "간접프롬프트인젝션", "indirectpromptinjection"],
  },
  {
    term: "과도한 권한 위임",
    fullName: "과도한 권한 위임 (Excessive Agency)",
    category: "AI / 보안",
    definition:
      "과도한 권한 위임은 LLM 기반 시스템에 필요 이상의 기능·권한·자율성을 주어 잘못된 출력이 해로운 동작으로 이어지는 취약점입니다.",
    why: "에이전트의 도구와 권한을 꼭 필요한 만큼만 주어야 하는 까닭을 설명할 때 씁니다.",
    compare: "프롬프트 인젝션은 모델을 속이는 방법이고, 과도한 권한 위임은 속았을 때 피해가 커지는 구조입니다.",
    aliases: ["excessiveagency", "과도한에이전시", "과도한자율성", "에이전트과권한"],
  },
  {
    term: "RAG",
    fullName: "검색 증강 생성 (Retrieval-Augmented Generation)",
    category: "AI / RAG",
    definition:
      "RAG는 질문과 관련된 내용을 데이터 저장소에서 찾아 프롬프트에 붙인 뒤 LLM이 그것을 바탕으로 답하게 하는 기법입니다.",
    why: "모델을 다시 학습시키지 않고도 사내 문서 같은 비공개 자료로 답하게 할 수 있습니다.",
    compare: "RAG는 답할 때마다 자료를 찾아 붙이고, 파인튜닝은 자료로 모델 자체를 다시 학습시킵니다.",
    aliases: ["retrievalaugmentedgeneration", "검색증강생성", "래그", "지식기반질의응답"],
  },
  {
    term: "임베딩",
    fullName: "임베딩 (Embedding, Vector Embedding)",
    category: "AI / RAG",
    definition:
      "임베딩은 임베딩 모델이 글 조각을 뜻이 비슷할수록 가까운 값이 되도록 바꿔 놓은 숫자 벡터입니다.",
    why: "글을 숫자로 바꿔야 질문과 뜻이 비슷한 문서를 계산으로 찾을 수 있습니다.",
    compare: "임베딩 모델은 글을 벡터로 바꾸기만 하고, LLM은 글을 만들어 냅니다.",
    aliases: ["embedding", "vectorembedding", "임베딩모델", "embeddingmodel", "벡터임베딩"],
  },
  {
    term: "벡터 DB",
    fullName: "벡터 데이터베이스 (Vector Database, Vector Store)",
    category: "AI / RAG",
    definition:
      "벡터 DB는 임베딩 벡터와 원문 조각을 저장하고 질문 벡터와 가까운 것을 찾아 주는 데이터베이스입니다.",
    why: "RAG에서 질문과 뜻이 비슷한 문서 조각을 빠르게 찾으려고 씁니다.",
    compare: "검색 엔진은 주로 낱말 일치로 찾고, 벡터 DB는 벡터 사이의 거리로 뜻이 비슷한 것을 찾습니다.",
    aliases: ["vectordatabase", "vectordb", "vectorstore", "벡터데이터베이스", "벡터스토어", "벡터저장소", "벡터인덱스"],
  },
  {
    term: "청크",
    fullName: "청크 (Chunk, Chunking)",
    category: "AI / RAG",
    definition:
      "청크는 긴 문서를 검색하고 프롬프트에 넣기 좋게 잘라 놓은 글 조각으로, 이렇게 자르는 일이 청킹입니다.",
    why: "문서를 통째로 넣을 수 없어서 질문과 관련된 조각만 골라 붙이려고 자릅니다.",
    compare: "청크는 문서를 자른 글 조각이고, 토큰은 모델이 글을 세는 단위입니다.",
    aliases: ["chunk", "chunking", "청킹", "문서분할", "텍스트분할"],
  },
  {
    term: "문서 수집 파이프라인",
    fullName: "문서 수집 파이프라인 (Ingestion Pipeline)",
    category: "AI / RAG",
    definition:
      "문서 수집 파이프라인은 문서를 읽어 글로 바꾸고 청크로 잘라 임베딩을 만든 뒤 벡터 DB에 넣는 처리 흐름입니다.",
    why: "문서가 올라올 때마다 검색에 쓸 수 있게 자동으로 준비해 두려고 씁니다.",
    compare: "수집 파이프라인은 미리 돌아가는 비동기 작업이고, 질의 응답 경로는 사용자 요청마다 도는 동기 흐름입니다.",
    aliases: ["ingestionpipeline", "dataingestion", "문서인제스트", "인덱싱파이프라인", "수집파이프라인"],
  },
  {
    term: "리랭커",
    fullName: "리랭커 (Reranker, Rerank Model)",
    category: "AI / RAG",
    definition:
      "리랭커는 질문과 문서 목록을 받아 질문과 관련이 깊은 순서로 문서를 다시 줄 세우는 모델입니다.",
    why: "벡터 검색이 넉넉히 뽑은 후보에서 정말 관련 있는 것만 추려 프롬프트에 넣으려고 씁니다.",
    compare: "임베딩 모델은 글마다 벡터를 따로 만들고, 리랭커는 질문과 문서를 짝지어 관련도를 매깁니다.",
    aliases: ["reranker", "rerank", "리랭크", "재순위화", "rerankmodel", "재정렬모델"],
  },
  {
    term: "하이브리드 검색",
    fullName: "하이브리드 검색 (Hybrid Search)",
    category: "AI / RAG",
    definition:
      "하이브리드 검색은 뜻이 비슷한 것을 찾는 벡터 검색과 낱말이 일치하는 것을 찾는 키워드 검색을 함께 쓰는 검색입니다.",
    why: "질문의 표현이 문서와 달라도 찾고, 제품명·코드처럼 글자가 정확히 맞아야 하는 것도 놓치지 않습니다.",
    compare: "벡터 검색만 쓰면 뜻은 잡지만 고유 낱말을 놓칠 수 있고, 하이브리드 검색은 둘을 합칩니다.",
    aliases: ["hybridsearch", "혼합검색", "하이브리드서치"],
  },
  {
    term: "AI 에이전트",
    fullName: "AI 에이전트 (AI Agent)",
    category: "AI / 에이전트",
    definition:
      "AI 에이전트는 LLM이 지침에 따라 도구를 골라 호출하고 그 결과를 보며 여러 단계의 일을 이어 가는 프로그램입니다.",
    why: "답만 하는 데서 나아가 조회·등록 같은 실제 작업을 사내 시스템에서 수행하게 하려고 씁니다.",
    compare: "챗봇은 답을 돌려주는 데서 끝나고, 에이전트는 도구로 다른 시스템을 읽거나 바꿉니다.",
    aliases: ["aiagent", "agent", "에이전트", "llm에이전트", "에이전틱ai"],
  },
  {
    term: "도구 호출",
    fullName: "도구 호출 (Tool Calling, Function Calling)",
    category: "AI / 에이전트",
    definition:
      "도구 호출은 LLM이 쓸 도구의 이름과 인자를 정해 돌려주면 앱이 그 함수를 실행하고 결과를 다시 모델에 넘기는 방식입니다.",
    why: "모델이 스스로 알 수 없는 사내 데이터 조회나 외부 시스템 작업을 하게 하려고 씁니다.",
    compare: "함수를 실제로 실행하는 쪽은 모델이 아니라 앱이며, 모델은 호출을 요청할 뿐입니다.",
    aliases: ["toolcalling", "functioncalling", "함수호출", "툴콜링", "펑션콜링", "tooluse"],
  },
  {
    term: "MCP",
    fullName: "모델 컨텍스트 프로토콜 (Model Context Protocol)",
    category: "AI / 에이전트 프로토콜",
    definition:
      "MCP는 AI 앱이 도구·자료·프롬프트를 내주는 서버와 JSON-RPC 메시지로 통신하는 방식을 정한 공개 프로토콜입니다.",
    why: "도구를 앱마다 따로 붙이지 않고 한 번 만든 서버를 여러 AI 앱이 같은 방식으로 쓰게 합니다.",
    compare: "도구 호출은 모델과 앱 사이의 약속이고, MCP는 앱과 도구 서버 사이의 통신 규약입니다.",
    aliases: ["modelcontextprotocol", "모델컨텍스트프로토콜", "엠씨피"],
  },
  {
    term: "MCP 호스트",
    fullName: "MCP 호스트 (MCP Host)",
    category: "AI / 에이전트 프로토콜",
    definition:
      "MCP 호스트는 MCP 클라이언트 여러 개를 만들고 관리하며 LLM 연동과 보안 정책·사용자 동의를 맡는 AI 앱입니다.",
    why: "여러 MCP 서버를 한 앱에서 쓰되 서버끼리 서로 들여다보지 못하게 가운데서 통제합니다.",
    compare: "호스트는 사용자가 쓰는 앱 전체이고, 클라이언트는 그 안에서 서버 하나와 이어진 연결 단위입니다.",
    aliases: ["mcphost", "호스트앱", "mcp호스트앱"],
  },
  {
    term: "MCP 클라이언트",
    fullName: "MCP 클라이언트 (MCP Client)",
    category: "AI / 에이전트 프로토콜",
    definition:
      "MCP 클라이언트는 호스트 안에서 만들어져 MCP 서버 하나와 일대일로 통신하는 연결 단위입니다.",
    why: "서버마다 연결을 따로 두어 한 서버가 다른 서버의 내용을 보지 못하게 합니다.",
    compare: "클라이언트 하나는 서버 하나에만 붙고, 서버 여러 개를 쓰려면 호스트가 클라이언트를 여러 개 둡니다.",
    aliases: ["mcpclient", "엠씨피클라이언트"],
  },
  {
    term: "MCP 서버",
    fullName: "MCP 서버 (MCP Server)",
    category: "AI / 에이전트 프로토콜",
    definition:
      "MCP 서버는 도구·자료·프롬프트를 MCP로 내주며 로컬 프로세스나 원격 서비스로 띄우는 프로그램입니다.",
    why: "사내 DB·업무 시스템 같은 대상을 에이전트가 쓸 수 있는 도구로 감싸 내주려고 둡니다.",
    compare: "MCP 서버는 도구를 내주는 쪽이고, 실제 데이터는 그 뒤의 DB나 업무 시스템에 있습니다.",
    aliases: ["mcpserver", "엠씨피서버", "도구서버", "toolserver", "원격mcp서버", "로컬mcp서버", "도구서버(mcp)"],
  },
  {
    term: "stdio 전송",
    fullName: "stdio 전송 (MCP stdio Transport)",
    category: "AI / 에이전트 프로토콜",
    definition:
      "stdio 전송은 MCP 클라이언트가 서버를 자식 프로세스로 띄우고 표준 입력·출력으로 줄 단위 JSON-RPC 메시지를 주고받는 방식입니다.",
    why: "네트워크 포트를 열지 않고 같은 기기 안에서 도구 서버를 붙이려고 씁니다.",
    compare: "stdio 전송은 같은 기기의 프로세스끼리 쓰고, Streamable HTTP는 네트워크 너머 원격 서버와 씁니다.",
    aliases: ["stdio", "stdiotransport", "표준입출력전송", "mcpstdio"],
  },
  {
    term: "Streamable HTTP",
    fullName: "Streamable HTTP (MCP Streamable HTTP Transport)",
    category: "AI / 에이전트 프로토콜",
    definition:
      "Streamable HTTP는 MCP 메시지를 하나의 엔드포인트에 HTTP POST로 보내고 응답을 JSON이나 SSE 스트림으로 받는 전송 방식입니다.",
    why: "MCP 서버를 독립된 원격 서비스로 두고 여러 클라이언트가 네트워크로 붙게 하려고 씁니다.",
    compare: "예전 HTTP+SSE 전송은 폐기 예정이고, Streamable HTTP가 그 자리를 대신합니다.",
    aliases: ["스트리머블http", "mcphttp", "mcp엔드포인트", "httpsse전송"],
  },
  {
    term: "MCP 게이트웨이",
    fullName: "MCP 게이트웨이 (MCP Gateway)",
    category: "AI / 게이트웨이",
    definition:
      "MCP 게이트웨이는 여러 MCP 서버 앞에서 하나의 주소로 요청을 받아 키·팀별 접근 권한을 확인하고 해당 서버로 넘기는 프록시입니다.",
    why: "에이전트가 쓸 수 있는 도구를 한곳에서 허용·차단하고 호출 기록을 모으려고 둡니다.",
    compare: "LLM 게이트웨이는 모델 호출을 중계하고, MCP 게이트웨이는 도구 호출을 중계합니다.",
    aliases: ["mcpgateway", "mcp프록시", "mcpproxy", "도구게이트웨이"],
  },
  {
    term: "A2A",
    fullName: "에이전트 간 프로토콜 (Agent2Agent Protocol)",
    category: "AI / 에이전트 프로토콜",
    definition:
      "A2A는 서로 다른 프레임워크나 회사의 AI 에이전트끼리 일을 맡기고 결과를 주고받는 방식을 정한 공개 프로토콜입니다.",
    why: "에이전트마다 따로 연동을 만들지 않고 같은 방식으로 다른 에이전트를 찾고 부르려고 씁니다.",
    compare: "MCP는 에이전트와 도구 사이를 잇고, A2A는 에이전트와 에이전트 사이를 잇습니다.",
    aliases: ["agent2agent", "agenttoagent", "에이전트간프로토콜", "a2a프로토콜", "에이전트카드", "agentcard"],
  },
  {
    term: "에이전트 런타임",
    fullName: "에이전트 런타임 (Agent Runtime, Agent Orchestrator)",
    category: "AI / 에이전트",
    definition:
      "에이전트 런타임은 모델 호출, 도구 실행, 대화 상태 저장을 순서대로 돌리며 에이전트를 실제로 실행하는 프로그램이나 서비스입니다.",
    why: "여러 단계에 걸친 작업을 중간에 멈추거나 실패해도 이어서 돌릴 수 있게 하려고 씁니다.",
    compare: "LLM 게이트웨이는 모델 호출만 중계하고, 에이전트 런타임은 다음에 무엇을 할지 흐름을 이끕니다.",
    aliases: ["agentruntime", "agentorchestrator", "에이전트오케스트레이터", "오케스트레이터", "에이전트서비스", "에이전트프레임워크"],
  },
  {
    term: "대화 상태 저장소",
    fullName: "대화 상태 저장소 (Conversation State Store, Checkpointer, Agent Memory)",
    category: "AI / 에이전트",
    definition:
      "대화 상태 저장소는 에이전트의 대화 내용과 진행 상태를 저장해 다음 요청이나 재시작 뒤에도 이어 가게 하는 저장소입니다.",
    why: "사람 승인을 기다리며 멈춘 작업이나 긴 대화를 나중에 그대로 이어 가려면 필요합니다.",
    compare: "세션 저장소는 로그인 상태를 담고, 대화 상태 저장소는 주고받은 메시지와 도구 호출 내역을 담습니다.",
    aliases: ["checkpointer", "체크포인터", "에이전트메모리", "agentmemory", "대화이력저장소", "스레드저장소", "메모리저장소"],
  },
  {
    term: "사람 승인 단계",
    fullName: "사람 승인 단계 (Human-in-the-Loop Approval)",
    category: "AI / 에이전트",
    definition:
      "사람 승인 단계는 에이전트가 민감한 도구를 실행하기 전에 멈추고 사람이 허용하거나 거부한 뒤에만 이어 가게 하는 절차입니다.",
    why: "모델이 잘못 판단하거나 속았을 때 되돌리기 어려운 작업이 그대로 실행되는 것을 막습니다.",
    compare: "가드레일은 내용을 자동으로 걸러 내고, 사람 승인 단계는 실행 여부를 사람이 정합니다.",
    aliases: ["humanintheloop", "hitl", "휴먼인더루프", "사람승인", "승인게이트", "도구실행승인"],
  },
  {
    term: "샌드박스 실행 환경",
    fullName: "샌드박스 실행 환경 (Sandbox, Sandboxed Execution)",
    category: "AI / 에이전트",
    definition:
      "샌드박스 실행 환경은 에이전트가 만든 코드나 도구 서버를 파일·네트워크 권한을 좁힌 격리된 공간에서 돌리는 환경입니다.",
    why: "믿을 수 없는 코드나 도구가 호스트의 파일과 사내 망에 닿는 범위를 줄입니다.",
    compare: "금융규제 샌드박스는 규제를 한시적으로 풀어 주는 제도로, 실행을 격리하는 이 샌드박스와 다른 말입니다.",
    aliases: ["sandbox", "샌드박스", "코드실행샌드박스", "격리실행환경", "sandboxedexecution"],
  },
  {
    term: "토큰 패스스루",
    fullName: "토큰 패스스루 (Token Passthrough)",
    category: "AI / 보안",
    definition:
      "토큰 패스스루는 MCP 서버가 클라이언트에게 받은 토큰을 자기 앞으로 발급된 것인지 확인하지 않고 뒤쪽 API에 그대로 넘기는 잘못된 방식입니다.",
    why: "누가 호출했는지 추적이 끊기고 뒤쪽 시스템의 통제를 건너뛰게 되므로 MCP 사양이 금지합니다.",
    compare: "올바른 방식은 MCP 서버가 자기 앞으로 발급된 토큰만 받고, 뒤쪽 시스템에는 따로 받은 자격으로 접속하는 것입니다.",
    aliases: ["tokenpassthrough", "토큰전달", "토큰그대로넘기기"],
  },
  {
    term: "이그레스 통제",
    fullName: "이그레스 통제 (Egress Control, Outbound Filtering)",
    category: "네트워크 / 보안",
    definition:
      "이그레스 통제는 안에서 밖으로 나가는 통신을 방화벽이나 프록시에서 허용한 목적지로만 제한하는 것입니다.",
    why: "에이전트나 앱이 프롬프트에 실린 내부 정보를 허용하지 않은 외부 주소로 보내는 것을 막습니다.",
    compare: "인그레스 통제는 밖에서 들어오는 접속을 막고, 이그레스 통제는 안에서 나가는 통신을 막습니다.",
    aliases: ["egresscontrol", "egressfiltering", "아웃바운드통제", "아웃바운드필터링", "이그레스필터링", "egressproxy", "이그레스프록시"],
  },
  {
    term: "LLM 관측",
    fullName: "LLM 관측 (LLM Observability, LLM Tracing)",
    category: "AI / 운영",
    definition:
      "LLM 관측은 모델 호출마다 프롬프트·응답·토큰 사용량·검색과 도구 호출 단계를 추적 기록으로 남겨 살펴보는 일입니다.",
    why: "답이 왜 그렇게 나왔는지 따라가고 비용이 어디서 나가는지 보려고 씁니다.",
    compare: "APM은 요청의 속도와 오류를 보고, LLM 관측은 거기에 프롬프트 내용과 토큰 사용량을 더해 봅니다.",
    aliases: ["llmobservability", "llmtracing", "llm트레이싱", "llm모니터링", "llmops", "토큰사용량추적"],
  },
  {
    term: "LLM 평가",
    fullName: "LLM 평가 (LLM Evaluation, Evals)",
    category: "AI / 운영",
    definition:
      "LLM 평가는 정해 둔 질문 묶음이나 실제 기록에 대해 응답의 정확성·관련성 같은 품질을 점수로 매기는 일입니다.",
    why: "프롬프트나 모델을 바꿨을 때 품질이 나아졌는지 떨어졌는지 숫자로 확인하려고 씁니다.",
    compare: "LLM 관측은 일어난 일을 기록하고, LLM 평가는 그 결과가 좋은지 점수를 매깁니다.",
    aliases: ["llmevaluation", "evals", "이밸", "모델평가", "품질평가", "llmasajudge"],
  },
  {
    term: "모델 레지스트리",
    fullName: "모델 레지스트리 (Model Registry)",
    category: "AI / 운영",
    definition:
      "모델 레지스트리는 모델을 이름으로 등록하고 버전·별칭·만들어진 이력을 한곳에서 관리하는 저장소입니다.",
    why: "어떤 버전이 운영에 올라가 있는지와 그 모델이 어디서 나왔는지 추적하려고 씁니다.",
    compare: "컨테이너 레지스트리는 컨테이너 이미지를 담고, 모델 레지스트리는 모델과 그 버전 정보를 담습니다.",
    aliases: ["modelregistry", "모델등록소", "모델버전관리"],
  },
  {
    term: "vLLM",
    fullName: "vLLM",
    category: "AI / 모델 서빙 제품",
    definition:
      "vLLM은 LLM을 GPU에 올려 OpenAI 호환 HTTP API로 내주는 오픈소스 추론 서버입니다.",
    why: "",
    compare: "",
    aliases: ["브이엘엘엠", "vllmserve"],
  },
  {
    term: "Ollama",
    fullName: "Ollama",
    category: "AI / 모델 서빙 제품",
    definition:
      "Ollama는 LLM을 내려받아 한 대의 PC나 서버에서 돌리고 HTTP API로 내주는 오픈소스 실행 도구입니다.",
    why: "",
    compare: "",
    aliases: ["올라마"],
  },
  {
    term: "llama.cpp 서버",
    fullName: "llama.cpp 서버 (llama-server)",
    category: "AI / 모델 서빙 제품",
    definition:
      "llama.cpp 서버는 llama.cpp 프로젝트가 제공하며 OpenAI 호환 경로를 내주는 가벼운 C/C++ HTTP 추론 서버입니다.",
    why: "",
    compare: "",
    aliases: ["llamacpp", "llamaserver", "라마cpp"],
  },
  {
    term: "TGI",
    fullName: "Text Generation Inference",
    category: "AI / 모델 서빙 제품",
    definition:
      "TGI는 SSE 토큰 스트리밍과 연속 배칭을 지원하는 허깅페이스의 LLM 배포·서빙 도구입니다.",
    why: "",
    compare: "",
    aliases: ["textgenerationinference", "huggingfacetgi", "티지아이"],
  },
  {
    term: "Triton Inference Server",
    fullName: "NVIDIA Triton Inference Server",
    category: "AI / 모델 서빙 제품",
    definition:
      "Triton Inference Server는 모델 저장소의 여러 모델을 올려 HTTP와 gRPC로 추론을 내주는 NVIDIA의 추론 서버입니다.",
    why: "",
    compare: "",
    aliases: ["triton", "tritonserver", "트라이톤", "nvidiatriton", "트리톤"],
  },
  {
    term: "KServe",
    fullName: "KServe",
    category: "AI / 모델 서빙 제품",
    definition:
      "KServe는 쿠버네티스에서 InferenceService라는 리소스로 AI 모델의 배포와 확장을 관리하는 오픈소스 서빙 플랫폼입니다.",
    why: "",
    compare: "",
    aliases: ["케이서브", "inferenceservice"],
  },
  {
    term: "LiteLLM",
    fullName: "LiteLLM AI Gateway (LiteLLM Proxy)",
    category: "AI / 게이트웨이 제품",
    definition:
      "LiteLLM은 여러 LLM 공급자를 하나의 OpenAI 호환 주소로 묶고 가상 키·예산·한도·분산을 맡는 자체 호스팅 게이트웨이입니다.",
    why: "",
    compare: "",
    aliases: ["litellmproxy", "라이트엘엘엠", "litellmgateway"],
  },
  {
    term: "Milvus",
    fullName: "Milvus",
    category: "AI / 벡터 DB 제품",
    definition:
      "Milvus는 대량의 벡터에서 비슷한 것을 빠르게 찾도록 만든 오픈소스 분산 벡터 데이터베이스입니다.",
    why: "",
    compare: "",
    aliases: ["밀버스"],
  },
  {
    term: "Qdrant",
    fullName: "Qdrant",
    category: "AI / 벡터 DB 제품",
    definition:
      "Qdrant는 HTTP와 gRPC 인터페이스로 벡터 검색을 내주는 오픈소스 벡터 데이터베이스입니다.",
    why: "",
    compare: "",
    aliases: ["큐드란트", "쿼드런트"],
  },
  {
    term: "pgvector",
    fullName: "pgvector",
    category: "AI / 벡터 DB 제품",
    definition:
      "pgvector는 PostgreSQL에 벡터 자료형과 유사도 검색을 더해 주는 오픈소스 확장입니다.",
    why: "",
    compare: "",
    aliases: ["피지벡터", "postgres벡터"],
  },
  {
    term: "Weaviate",
    fullName: "Weaviate",
    category: "AI / 벡터 DB 제품",
    definition:
      "Weaviate는 데이터와 임베딩을 함께 저장하고 벡터 검색과 하이브리드 검색을 내주는 오픈소스 벡터 데이터베이스입니다.",
    why: "",
    compare: "",
    aliases: ["위비에이트"],
  },
  {
    term: "Langfuse",
    fullName: "Langfuse",
    category: "AI / 운영 제품",
    definition:
      "Langfuse는 LLM 호출 추적, 프롬프트 관리, 평가를 한데 제공하고 자체 설치도 되는 오픈소스 플랫폼입니다.",
    why: "",
    compare: "",
    aliases: ["랭퓨즈"],
  },
  {
    term: "Amazon Bedrock",
    fullName: "Amazon Bedrock",
    category: "AI / 클라우드 서비스",
    definition:
      "Amazon Bedrock은 여러 회사의 파운데이션 모델을 API로 호출하게 해 주는 AWS의 관리형 생성형 AI 서비스입니다.",
    why: "",
    compare: "",
    aliases: ["bedrock", "awsbedrock", "베드록", "아마존베드록"],
  },
  {
    term: "Hugging Face Hub",
    fullName: "Hugging Face Hub",
    category: "AI / 모델 저장소 제품",
    definition:
      "Hugging Face Hub는 모델과 데이터셋 파일을 저장소 단위로 올리고 내려받는 온라인 저장소 서비스입니다.",
    why: "",
    compare: "",
    aliases: ["huggingface", "허깅페이스", "허깅페이스허브", "hfhub"],
  },
  {
    term: "N²SF",
    fullName: "국가 망 보안체계 (National Network Security Framework)",
    category: "보안 / 국내 규정",
    definition:
      "N²SF는 국가·공공기관의 업무 정보를 기밀·민감·공개 등급으로 나누고 등급에 따라 보안 통제를 달리 적용하는 망 보안 체계입니다.",
    why: "일률적인 망분리를 고쳐 공공기관이 생성형 AI·클라우드를 업무에 쓸 길을 열려고 만들었습니다.",
    compare: "기존 망분리는 업무망과 인터넷을 통째로 나누고, N²SF는 정보 등급에 따라 통제 수준을 달리합니다.",
    aliases: ["n2sf", "국가망보안체계", "국가망보안체계가이드라인", "nationalnetworksecurityframework", "cso등급"],
  },
  {
    term: "혁신금융서비스",
    fullName: "혁신금융서비스 (금융규제 샌드박스)",
    category: "보안 / 국내 규정",
    definition:
      "혁신금융서비스는 금융위원회가 규제 특례를 주어 정해진 조건 아래 새로운 금융 서비스를 허용하는 금융규제 샌드박스 제도입니다.",
    why: "금융위 망분리 개선 로드맵은 금융사의 생성형 AI 이용을 이 제도의 규제 특례로 허용했습니다.",
    compare: "여기서 샌드박스는 규제를 한시적으로 풀어 주는 제도이고, 코드를 격리해 돌리는 샌드박스와 다릅니다.",
    aliases: ["금융규제샌드박스", "규제샌드박스", "혁신금융", "금융샌드박스"],
  },
];
