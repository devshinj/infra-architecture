# C) WebRTC 실시간 영상·음성 통신 — 구성 지식

조사일 2026-11-11~12. 아래에서 [n] 은 6장 출처 번호다. "확인"은 해당 페이지를 실제로 열어 본문에서 읽은 것이고, "추론"·"미확인"은 따로 표시했다.
범위 밖: SIP·IP-PBX·콜센터, CCTV(RTSP·ONVIF), BLE·IoT, LLM 서빙.

---

## 1. 전형적인 구성

모든 구성에 공통인 사실(확인):
- WebRTC 는 **신호 길**과 **미디어 길**이 따로다. RFC 8825 §3 은 신호 길("high path")은 서버를 거치고 미디어 길("low path")은 브라우저 사이를 직접 간다고 그린다 [1]. 신호 프로토콜은 표준 범위 밖이라 앱이 정한다 [1][11][21].
- 미디어는 SRTP 필수, 평문 RTP 금지. 키는 DTLS-SRTP 로 미디어 길 위에서 정한다. 데이터 채널은 DTLS 위 SCTP [2][3][4][20].
- 단말은 ICE 필수, TURN/TCP 와 TURN over TLS 도 지원 필수(UDP 를 다 막는 방화벽 대비) [3].

### 구성 1 — 1:1 통화 (P2P, 가장 작은 것)

구성요소: 단말 A, 단말 B, 웹/시그널링 서버, STUN 서버, TURN 서버(coturn 등).

- 단말 A·B → 웹 서버 : HTTPS 443/TCP, 단말이 시작, 웹 페이지·앱 코드
- 단말 A·B ↔ 시그널링 서버 : WSS(WebSocket over TLS) 443/TCP, 단말이 연결을 열고 양방향, SDP 제안·응답과 ICE 후보(미디어는 흐르지 않음) [12][22]
- 단말 A·B → STUN 서버 : STUN 3478/UDP, 단말이 시작, 자기 바깥 주소 조회(미디어 없음) [6]
- 단말 A ↔ 단말 B : SRTP/DTLS over UDP(포트는 ICE 가 고른 임의 포트), 양방향, 음성·영상·데이터 채널 — **직접 길이 될 때**
- 단말 A ↔ TURN 서버 ↔ 단말 B : 단말→TURN 은 3478/UDP·TCP 또는 5349/TLS(막힌 망은 443), TURN→상대는 항상 UDP(릴레이 포트 범위), 양방향, 암호화된 미디어 중계 — **직접 길이 안 될 때만** [7][13][18]

메모: TURN 은 미디어를 풀지 않고 그대로 중계한다(DTLS-SRTP 는 양 끝 단말 사이). 시그널링 서버는 내용을 해석할 필요가 없다 [12].

### 구성 2 — 소규모 화상회의 (SFU 한 대, 온프레미스·단일 서버)

구성요소: 단말 N 대, 리버스 프록시/웹 서버, 시그널링(Jitsi 는 Prosody+Jicofo, LiveKit 은 서버 내장), SFU(JVB·LiveKit·mediasoup·Janus VideoRoom), TURN(coturn 또는 내장), 녹화기(Jibri·LiveKit Egress), 녹화 저장소.

- 단말 → 리버스 프록시 : HTTPS/WSS 443/TCP, 단말이 시작, 웹 앱 + 시그널링 [16][18]
- 리버스 프록시 → 시그널링 서버 : HTTP/WS(내부 포트. LiveKit 7880) [16]
- 단말 ↔ SFU : SRTP/DTLS over UDP, 단말이 먼저 보냄(ICE), 양방향, 참가자별 음성·영상
  - Jitsi JVB 10000/UDP [18][19] · LiveKit 50000~60000/UDP 또는 7882/UDP 단일 포트 [16] · mediasoup 는 설정한 포트 범위(옛 기본 10000~59999) 또는 WebRtcServer 단일 포트 [15]
- 단말 ↔ SFU (UDP 막힘) : ICE-TCP (LiveKit 7881/TCP) [16]
- 단말 ↔ TURN ↔ SFU : 단말→TURN 5349/TCP(TLS) 또는 443, TURN→SFU UDP, UDP 가 막힌 단말의 미디어 중계 [16][18][26]
- 시그널링(Jicofo) ↔ SFU(JVB) : XMPP 5222/TCP (JVB 가 Prosody 로 붙음), 회의 제어 [19]
- 녹화기 → SFU : 일반 참가자처럼 WebRTC 로 붙어 받기만 함, 방의 음성·영상 [17][23]
- 녹화기 → 녹화 저장소 : 파일 쓰기 또는 오브젝트 스토리지 업로드(S3·Azure·GCP), MP4·HLS 조각 [24]

메모: Jitsi 는 2명일 때 JVB 를 건너뛰는 P2P 로 통화하고, 그때 직접 길이 없으면 TURN 이 중계한다 [26].

### 구성 3 — 대규모·클라우드 (SFU 여러 대 + 녹화 + AI 참가자)

구성요소: 단말, L7 로드밸런서(TLS 종료), SFU 노드 여러 대(각자 공인 IP), Redis(방→노드 배정·노드 간 메시지), TURN(L4 로드밸런서 뒤), Egress 워커, Ingress 워커, AI 에이전트 서버, 오브젝트 스토리지, (AI 에이전트가 부르는) STT·LLM·TTS.

- 단말 → L7 LB → SFU 노드 : WSS 443 → 내부 7880, 시그널링. 아무 노드에나 붙을 수 있다 [16]
- 단말 ↔ SFU 노드 : UDP 미디어를 **로드밸런서를 거치지 않고 노드 공인 주소로 직접** [16][27][28]
- 단말 → L4 LB → TURN : TURN/TLS 443(5349), UDP 가 막힌 단말용 [16][27]
- SFU 노드 ↔ Redis : 방이 어느 노드에 있는지 기록, 노드 간 메시지. 다중 노드에 필수 [14]
- Egress 워커 ↔ Redis / → SFU : Redis 큐로 일감을 받고, WebSocket URL 로 SFU 에 참가자처럼 붙음 [24]
- Egress 워커 → 오브젝트 스토리지 : 녹화 파일 업로드. → 외부 방송 서비스 : RTMP 송출 [23][24]
- 방송 도구(OBS 등) → Ingress 워커 : RTMP 1935/TCP, WHIP 8080/TCP(+7885/UDP) → 트랜스코딩 → SFU 로 게시 [25][29]
- AI 에이전트 서버 ↔ SFU : WebRTC 미디어(참가자로 입장). 에이전트 → 자기 백엔드·모델 : HTTP·WebSocket [30]

메모(확인): LiveKit 쿠버네티스 문서는 호스트 네트워킹이 필요하고 노드당 파드 하나로 제한되며, "프라이빗 클러스터는 NAT 층이 더 있어 WebRTC 트래픽에 맞지 않다"고 적는다 [28]. 자체 구축은 방 하나가 노드 하나에 들어가야 한다 [14].

### 구성 4 — 방송형 (송출 1 → 시청 다수)

구성요소: 송출자(인코더·OBS·브라우저), 인제스트 서버, 트랜스코더/패키저, 오리진(HLS 조각 저장), CDN, 시청자. 또는 저지연이면 WebRTC 미디어 서버 + WHEP.

- 송출자 → 인제스트 : RTMP(TCP, 관행 1935) 또는 SRT(UDP) 또는 WHIP(HTTPS POST 로 SDP 교환 → SRTP/UDP), 한 방향 올리기 [8][9][10][29]
- 인제스트 → 트랜스코더/패키저 : 내부, 화질 단계별 재인코딩과 조각 내기
- 패키저 → 오리진/오브젝트 스토리지 : HLS 재생목록(m3u8)과 조각 파일 [31]
- 시청자 → CDN → 오리진 : HTTPS 443/TCP, 시청자가 당겨 받음, HLS 조각 [31]
- (저지연) 시청자 ↔ 미디어 서버 : WHEP(HTTPS 로 SDP 교환) → SRTP/UDP, 서버→시청자 한 방향 [32]

**헷갈리는 점**
| | WebRTC(통화·WHIP/WHEP) | RTMP/SRT 인제스트 → HLS |
|---|---|---|
| 전송 | UDP 위 SRTP(막히면 TCP/TLS 폴백) | 올릴 때 RTMP=TCP, SRT=UDP / 내릴 때 HTTP(TCP 443) |
| 방향 | 양방향(WHIP·WHEP 은 한 방향) | 한 방향(올리기와 내리기가 다른 프로토콜) |
| 시청자와 닿는 것 | 미디어 서버(SFU)와 직접 | CDN(캐시된 파일) |
| CDN | 일반 HTTP CDN 을 지나지 못함(파일이 아님) | CDN 으로 배포 |
| 구성도 선 | 단말↔미디어 서버 "미디어" 선 | 시청자→CDN "요청" 선 |

지연 시간 수치(WebRTC 는 1초 미만, HLS 는 수 초~수십 초 등)는 흔히 인용되지만 이번에 연 1차 출처에서는 수치를 확인하지 못했다. RFC 7667 이 SFM 은 "지연이 매우 낮다"고만 적는다 [5].

### 인원수에 따른 선택 (확인된 범위)

- 2명: P2P. Jitsi 도 2명은 P2P 로 돌린다 [26].
- 3명 이상: LiveKit 문서는 P2P 가 "2~3명까지 잘 동작"하고 그 이상은 클라이언트-서버 모델이 필요하다고 적는다(올리는 대역폭이 인원에 비례) [14]. 표준 문서에는 인원 기준이 없다.
- SFU: 디코딩·섞기 없이 골라 전달, 지연이 매우 낮고 많은 동시 사용자로 확장 가능. 대신 단말이 여러 스트림을 디코딩 [5].
- MCU: 디코딩→섞기→재인코딩이라 미디어 처리 자원과 지연이 크다. 단말·회선 부담은 작다 [5][14].

---

## 2. 구성요소 사전

| 요소 | 역할 한 줄 | 보통 놓이는 곳 | 구성도에 적을 속성 |
|---|---|---|---|
| 단말(브라우저·모바일 앱) | 카메라·마이크를 잡아 보내고 받는 WebRTC 끝점 | 인터넷, 사무망 등 NAT 뒤 | 브라우저/앱, 코덱 |
| 웹 서버 / 리버스 프록시 | 웹 앱 제공, TLS 종료, 시그널링 중계 | DMZ·퍼블릭 서브넷 | 443/TCP, 도메인·인증서 |
| 시그널링 서버 | 제안·응답·ICE 후보 전달, 방·참가자 관리 | DMZ 또는 LB 뒤 내부 구역 | 프로토콜(WSS/HTTPS/XMPP), 포트, sw |
| STUN 서버 | 단말의 NAT 바깥 주소를 알려 줌(미디어 안 지나감) | 인터넷에서 닿는 곳 | 3478/UDP |
| TURN 서버 | 직접 길이 없을 때 미디어를 중계 | 공인 IP 가 있는 DMZ·퍼블릭 서브넷 | 3478/UDP·TCP, 5349(또는 443)/TLS, 릴레이 UDP 범위, sw(coturn), 대역폭 |
| SFU | 참가자 스트림을 골라 전달 | 공인 IP 로 직접 닿는 DMZ·퍼블릭 서브넷 | sw(LiveKit·JVB·mediasoup·Janus), UDP 포트(범위/단일), 노드 수, CPU 코어, 동시 참가자 |
| MCU(믹서) | 스트림을 섞어 하나로 내려보냄 | SFU 와 같음 | sw, CPU(·GPU), 동시 회의 수 |
| 녹화기(Egress·Jibri) | 방에 참가자처럼 들어가 파일 녹화·RTMP 송출 | 내부 구역(SFU 옆) | sw, 동시 녹화 수, CPU(LiveKit 방 합성 2~6 코어), 출력(MP4/HLS/RTMP) |
| 녹화 저장소 | 녹화 파일 보관 | 내부 구역·오브젝트 스토리지 | 종류(S3 등), 용량, 보존 기간 |
| 인제스트 서버(Ingress) | RTMP·SRT·WHIP 으로 들어온 송출을 받아 방·방송 시스템으로 넣음 | DMZ·퍼블릭 서브넷 | 1935/TCP(RTMP), WHIP 포트, 트랜스코딩 여부, CPU |
| 트랜스코더·패키저 | 코덱·화질 변환, HLS 조각 생성 | 내부 구역 | CPU/GPU, 화질 단계 |
| CDN | HLS 조각을 시청자에게 배포 | 외부 서비스 | 사업자 |
| Redis(조정 저장소) | 방→노드 배정, 노드·워커 간 메시지 | 내부 구역 | 버전, 이중화 |
| AI 에이전트 서버 | 방에 참가자로 들어가 듣고 말하는 프로그램 | 내부 구역(앱 서버 계층) | 프레임워크, 연결 모델(STT·LLM·TTS) |
| 자막·전사 서비스 | 음성을 글로 바꿔 화면·회의록으로 | 내부 구역 또는 외부 API | 엔진, 언어 (구조 근거 미확인) |

배치 근거(확인): "WebRTC 서버는 UDP 포트를 쓰고 자기 공인 IP 를 알아야 해서 배포가 까다롭다" [27], mediasoup 는 `announcedAddress` 로 공인 IP 를 알리고 포트 범위를 호스트로 넘기라고 안내 [33], Jitsi 는 JVB 의 10000/UDP 를 "world" 에 열라고 안내 [19], TURN 은 "인터넷에 고대역폭 연결이 필요" [7].

---

## 3. 망·보안 관점

### 열어야 하는 포트 (출처별, 모두 확인)

| 용도 | 포트 | 근거 |
|---|---|---|
| 웹·시그널링 | 443/TCP (HTTPS, WSS) | RFC 6455 §3(wss 기본 443) [22], Jitsi [18], LiveKit(LB 뒤 7880) [16] |
| STUN / TURN | 3478 UDP·TCP | RFC 8489 §8.1 [6], RFC 8656 §4.1 [7], coturn [13] |
| TURN over TLS·DTLS | 5349 (막힌 망 대응으로 443 에 올리기도) | RFC 8489 §8.1 [6], RFC 8656 §4.1 [7], Jitsi TURN [26], LiveKit("LB 없으면 443") [16] |
| TURN 릴레이 | 49152~65535/UDP (coturn 기본) | coturn README [13] |
| SFU 미디어 | Jitsi 10000/UDP · LiveKit 50000~60000/UDP 또는 7882/UDP · mediasoup 옛 기본 10000~59999 | [18][19][16][15] |
| SFU ICE-TCP 폴백 | LiveKit 7881/TCP | [16] |
| 인제스트 | RTMP 1935/TCP, WHIP 8080/TCP + 7885/UDP (LiveKit Ingress 기본) | [29] |
| 관리형 예시 | Amazon IVS: UDP 3478, UDP 443, TCP 3478·443(폴백) | [34] |

폴백 순서의 근거: RFC 8835 §3.4 — "UDP 를 모두 막는 방화벽에 대응하려면 TURN/TCP 를 지원해야 하고 TURN over TLS 도 지원해야 한다", ICE-TCP 후보도 지원 필수 [3]. Jitsi — "TCP 443 만 허용하는 회사 망이 있어 TURN 을 443/TLS 로 듣게 할 수 있다" [26].

### 대칭 NAT 과 TURN

- RFC 8656 §1: 양쪽 NAT 이 "주소 의존 매핑"(또는 주소·포트 의존 매핑)이면 홀 펀칭은 대개 실패하고 중계 호스트가 필요하다. 중계는 제공자에게 비용이 크므로 직접 길을 못 찾을 때만 쓴다 [7].
- "대칭 NAT"은 옛 용어(RFC 3489)이고 RFC 4787 은 혼란을 이유로 쓰지 않는다 [35]. MDN 은 여전히 "Symmetric NAT" 이라 쓰고 TURN 이 이를 우회한다고 설명한다 [11]. 사전에는 "대칭 NAT"으로 싣고 정식 이름을 병기했다.
- SFU 구성에서는 서버가 공인 주소로 닿으므로 단말의 NAT 종류와 상관없이 단말이 먼저 보낸 UDP 로 연결된다. TURN 이 필요한 것은 주로 **UDP 자체가 막힌 망**이다(추론. 근거: mediasoup 가 ICE-Lite 로 응답만 한다는 점 [33], LiveKit·Jitsi 가 TURN/TLS 를 "UDP 로 못 붙는 단말" 용으로 설명 [16][18]).

### 어느 망에 두나

- 확인: 미디어 서버와 TURN 은 **인터넷에서 공인 IP·UDP 로 직접 닿아야** 한다 [27][28][33][19][7]. 이 요건을 만족하는 자리는 DMZ·퍼블릭 서브넷이다.
- **근거 못 찾음**: "DMZ 에 둔다"는 문구 자체는 위 공식 문서들에 없다(퍼블릭 IP·방화벽 포트 개방으로만 서술). DMZ 배치는 요건에서 끌어낸 추론이다.
- 시그널링은 LB·리버스 프록시 뒤 내부 구역에 둘 수 있다(LiveKit 7880 은 "노출하지 말고 TLS 를 끝내는 LB 뒤에") [16]. 미디어 UDP 는 L7 LB 를 지날 수 없어 LB 를 우회한다(추론 + [28] 호스트 네트워킹 요구).
- Redis·녹화 저장소·AI 에이전트·Egress 는 인터넷에서 들어올 필요가 없어 내부 구역(추론. Egress·Ingress 가 Redis 와 WebSocket 으로 서버에 붙는다는 점은 확인 [24][29]).

### 망분리 환경 (내부망 ↔ 인터넷)

- **근거 못 찾음.** 망분리 환경에서 WebRTC·실시간 미디어가 망연계 장비를 지날 수 있는지, 화상회의를 어떻게 두라는지를 다룬 국가정보원·금융보안원·KISA 문서를 웹 검색 2회로 찾지 못했다(검색 결과는 일반 WebRTC 소개와 IP 카메라 자료뿐). 조문·문서명을 댈 수 없다.
- 이 프로젝트의 기존 조사 `docs/research/2026-11-11-network-glossary/01-public.md` 136행에 망연계의 "스트림 연계(서버 간 실시간 데이터 전송)"가 업계 기사 근거로 적혀 있다. 이번 조사에서 다시 확인하지는 않았다.
- 추론(출처 없음, 지침에 넣는다면 "예상" 표시 필요): 미디어는 단말↔서버 사이에서 DTLS-SRTP 로 암호화되고 [2] UDP 임의 포트를 쓰므로 [3], 내용을 풀어 검사·재조립해 넘기는 방식의 자료 전송 장비와는 맞지 않을 가능성이 높다. 그래서 흔한 설계는 (가) 회의 시스템 전체를 한 망 안에 두거나, (나) 내부망 전용 SFU 와 인터넷망 전용 SFU 를 따로 두는 것으로 알려져 있으나 근거 문서는 없다.

### 보안에서 확인된 것

- 시그널링 서버는 신뢰 모델 안에 있다. 인증됐다고 신뢰되는 것은 아니고 중간자 공격을 걸 수 있는 위치다(RFC 8827 §3.1, §4.3, §9.1) [2].
- HTTP 출처에는 카메라·마이크 권한을 주지 않는다 → 웹·시그널링은 HTTPS 필수(RFC 8827 §6.2) [2].
- SFU 는 DTLS-SRTP 의 끝점이라 미디어를 풀 수 있다. 서버가 못 보게 하려면 SFrame 같은 종단간 암호화가 필요하다(RFC 9605) [36].
- TURN 은 장기 자격증명이 필요하다(coturn `--lt-cred-mech` "WebRTC 에 필요", 시간 제한 자격증명 `--use-auth-secret`) [13]. Jitsi 는 고정 자격증명을 클라이언트 설정에 넣는 방식을 권하지 않는다 [26].

### 흔한 실수 (근거 표시)

1. 시그널링 443 만 열고 미디어 UDP 를 안 엶 → 접속은 되는데 소리·영상이 안 나옴(Jitsi: "참가자가 서로 보이지 않으면 방화벽·NAT 규칙을 확인") [18].
2. 미디어 서버를 사설 IP 로만 띄우고 공인 IP 알림을 빼먹음 [33][27][18].
3. 미디어 UDP 를 L7 로드밸런서·인그레스 뒤에 둠, 쿠버네티스에서 호스트 네트워킹 없이 띄움 [28].
4. TURN 을 3478/UDP 만 열어 둠 → UDP 가 막힌 회사 망 단말이 못 붙음. TLS(5349/443) 폴백 필요 [3][26].
5. STUN 만 두고 TURN 을 안 둠(STUN 은 그 자체로 NAT 통과 해법이 아님) [6].
6. 시그널링 서버에 미디어가 지나가는 것처럼 그림 [1][12].
7. HLS 시청자를 SFU 에 붙이거나 WebRTC 미디어를 CDN 에 태워 그림 [31].
8. 녹화기·AI 에이전트를 단말 쪽에 그림(서버 쪽 참가자다) [23][30].

---

## 4. 구성도를 그리는 AI 에게 줄 지침 후보

1. 단말과 시그널링 서버는 HTTPS/WSS 443(TCP) 신호 선으로 잇고, 그 선에는 음성·영상이 흐른다고 적지 않는다.
2. 단말과 SFU·MCU 는 신호 선과 별도로 "미디어(SRTP/UDP)" 선으로 직접 잇는다. 이 선은 L7 로드밸런서·WAF·API 게이트웨이·CDN 을 거치지 않는다.
3. 1:1 통화는 단말↔단말 P2P 미디어 선을 그리고, 3명 이상이면 단말끼리 잇지 않고 각 단말을 SFU 에 잇는다.
4. TURN 은 "직접 길이 막혔을 때의 우회로"로 그린다. 단말→TURN→(상대 단말 또는 SFU) 선을 기본 미디어 선과 구분되는 대체 경로(점선 등)로 표시한다.
5. STUN 은 단말에서 나가는 조회 선만 그리고 미디어 선을 잇지 않는다.
6. SFU·MCU·TURN·인제스트 서버는 공인 IP 로 닿는 구역(DMZ·퍼블릭 서브넷)에 두고, 방화벽에 미디어 UDP 포트(범위 또는 단일 포트)와 TURN 3478·5349(또는 443)를 적는다.
7. 시그널링 서버는 로드밸런서·리버스 프록시 뒤에 둘 수 있고, Redis·녹화 저장소·녹화기·AI 에이전트는 내부 구역에 둔다.
8. 녹화기와 음성 AI 에이전트는 SFU 에 미디어 선으로 붙는 서버 쪽 참가자로 그리고, 녹화기에서 저장소로 가는 파일 저장 선을 따로 그린다.
9. SFU 가 여러 대면 방 배정용 조정 저장소(Redis 등)를 함께 그리고, 단말의 미디어 선은 노드에 직접 잇는다.
10. 방송형은 "송출자 → 인제스트(RTMP·SRT·WHIP) → 트랜스코더 → 오리진 → CDN → 시청자(HLS, HTTPS)"로 그리고, 시청자를 SFU 에 잇지 않는다. 저지연 시청(WHEP)일 때만 시청자를 미디어 서버에 잇는다.
11. 망분리 대상 내부망의 단말을 인터넷 쪽 SFU·TURN 에 미디어 선으로 바로 잇지 않는다. 필요하면 "기관 규정 확인 필요"로 표시한다(근거 문서 없음 — 예상 수준의 경고).
12. 미디어 선에는 "암호화됨(DTLS-SRTP)"이 기본이라 TLS 종료 지점을 따로 그리지 않는다. SFU 는 미디어를 풀 수 있는 지점으로 본다.

### "신호 / 미디어 / P2P" 세 선을 구분하는 법 (요약)

| 선 | 양 끝 | 프로토콜·포트 | 방향 | 지나는 것 | 흐르는 것 |
|---|---|---|---|---|---|
| 신호 | 단말 ↔ 시그널링 서버 | HTTPS·WSS 443/TCP | 단말이 열고 양방향 | 방화벽, LB, 리버스 프록시 | SDP 제안·응답, ICE 후보, 방 제어 |
| 미디어(서버 경유) | 단말 ↔ SFU/MCU, 또는 단말 ↔ TURN ↔ 상대 | SRTP/DTLS over UDP (폴백: ICE-TCP, TURN/TLS 443·5349) | 단말이 먼저 보내고 양방향 | 방화벽만(LB·CDN 안 거침) | 음성·영상·데이터 채널 |
| 미디어(P2P) | 단말 ↔ 단말 | SRTP/DTLS over UDP, 포트 임의 | 양방향 | 양쪽 NAT | 음성·영상·데이터 채널 |

기존 선 종류(catalog.ts EDGE_KINDS: request / async / replication / aux)에는 "미디어" 선이 없고, 노드 종류(NODE_KINDS)에도 미디어 서버·TURN·시그널링 서버가 없다. 반영 방법은 여러 가지라 결정이 필요하다(코드는 건드리지 않았다):
- (가) 선 종류에 "미디어(실시간 스트림)" 를 새로 추가 / (나) 기존 `request` 에 프로토콜 라벨만 "SRTP/UDP" 로 적기 / (다) `async` 재사용.
- 노드: (가) `media_server`·`turn_server`·`signaling_server` 종류 추가 / (나) `app_server`·`generic` 에 sw 속성으로 구분.

---

## 5. 확인하지 못한 것·출처가 갈리는 것

- **망분리·망연계와 실시간 미디어**: 국내 규정·가이드 근거 못 찾음(3장).
- **"DMZ 에 둔다"는 직접 문구**: 못 찾음. 공인 IP·UDP 개방 요건만 확인.
- **지연 시간 수치**(WebRTC·HLS·LL-HLS 비교): 1차 출처에서 수치 미확인. Apple LL-HLS 문서는 본문을 받지 못함(페이지 제목만 수신) → LL-HLS 는 verified=false.
- **RTMP 기본 포트 1935**: Adobe 규격에는 예시 URL(`rtmp://localhost:1935/...`)로만 나온다. "기본 포트"라는 문장은 규격에서 못 찾았고, LiveKit Ingress 기본값이 1935 임은 확인 [29].
- **SRT**: 근거가 만료된 개인 Internet-Draft(Haivision, 2021). IETF 표준이 아니고 기본 포트 미확인.
- **WHEP**: 아직 RFC 아님(draft-ietf-wish-whep-05, IESG 평가 단계). WHIP 은 RFC 9725(2025-03).
- **JSEP**: RFC 8829 는 RFC 9429(2024-04)로 대체됨. 출처는 9429 로 달았다.
- **SFU 명칭**: IETF 는 SFM(Selective Forwarding Middlebox), 업계·제품 문서는 SFU.
- **대칭 NAT**: IETF 는 이 용어를 버렸고 MDN·업계는 계속 쓴다.
- **인원 기준**: "P2P 는 2~3명까지"는 LiveKit 문서 한 곳의 서술. 표준에는 없다. SFU 한 대의 수용 인원 수치는 확인한 문서에 없다.
- **DTLS / SCTP / BUNDLE / ICE-Lite 본 규격**(RFC 9147·9260·9143·8445 §2.5)은 직접 열지 않았고 WebRTC 문서 속 쓰임으로만 확인. DTLS 는 verified=false 로 뒀다.
- **UDP 홀 펀칭**: RFC 8656 §1 의 "언제 실패하나" 서술만 확인, 기법 정의 원문(RFC 5128)은 열지 않음.
- **실시간 자막**: 구조를 설명하는 1차 출처 미열람 → verified=false. LiveKit Agents 문서는 전사(transcripts)를 관측 기능으로만 언급.
- **mediasoup 기능**(시뮬캐스트·SVC·PipeTransport 로 호스트 간 확장): 개요·FAQ·API 앞부분만 읽혀 해당 절은 확인 못 함. API 문서의 `rtcMinPort/rtcMaxPort` 는 "deprecated" 로 표시돼 있다.
- **Janus**: README 에 포트 기본값이 없다(8088/8188 등 미확인). Unix 소켓 전송은 문서 색인 제목에만 보임.
- **용어 충돌**: 기존 사전의 `SDP`(Software Defined Perimeter), `인그레스`(K8s), `이그레스 VPC` 와 약어·alias 가 겹친다 → 표제어를 "SDP(세션 기술)", "인제스트", "미디어 이그레스"로 달리했지만 alias 정리 필요.
- **중복 가능**: STT·TTS 는 D 분야(LLM 서빙), H.264·코덱 일반은 B 분야(CCTV)와 겹칠 수 있어 개별 표제어로 내지 않았다.

접속이 막히거나 본문을 못 받은 출처: `rtmp.veovera.org`(DNS 실패 → `veovera.org/docs/legacy/…pdf` 로 받아 텍스트를 직접 추출해 확인), Apple LL-HLS 문서(본문 없음), mediasoup v3 design 페이지(그림뿐), Janus 플러그인 목록(이름만).

---

## 6. 출처 목록

| # | 제목 | 기관 | URL | 열람 |
|---|---|---|---|---|
| 1 | RFC 8825 Overview: Real-Time Protocols for Browser-Based Applications | IETF | https://www.rfc-editor.org/rfc/rfc8825.html | 열람 |
| 2 | RFC 8827 WebRTC Security Architecture | IETF | https://www.rfc-editor.org/rfc/rfc8827.html | 열람 |
| 3 | RFC 8835 Transports for WebRTC | IETF | https://www.rfc-editor.org/rfc/rfc8835.html | 열람 |
| 4 | RFC 8831 WebRTC Data Channels | IETF | https://www.rfc-editor.org/rfc/rfc8831.html | 열람 |
| 5 | RFC 7667 RTP Topologies | IETF | https://www.rfc-editor.org/rfc/rfc7667.html | 열람(앞 100k자) |
| 6 | RFC 8489 STUN | IETF | https://www.rfc-editor.org/rfc/rfc8489.html | 열람(앞 100k자) |
| 7 | RFC 8656 TURN | IETF | https://www.rfc-editor.org/rfc/rfc8656.html | 열람(앞 100k자) |
| 8 | Adobe RTMP 1.0 specification (2012-12-21) | Adobe | https://veovera.org/docs/legacy/rtmp-v1-0-spec.pdf | 열람(PDF 텍스트 추출) |
| 9 | draft-sharabayko-srt-01 The SRT Protocol (만료 초안) | Haivision 외 | https://datatracker.ietf.org/doc/html/draft-sharabayko-srt | 열람 |
| 10 | RFC 9725 WHIP | IETF | https://www.rfc-editor.org/rfc/rfc9725.html | 열람 |
| 11 | Introduction to WebRTC protocols | MDN | https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Protocols | 열람 |
| 12 | Signaling and video calling | MDN | https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Signaling_and_video_calling | 열람 |
| 13 | coturn README.turnserver | coturn | https://raw.githubusercontent.com/coturn/coturn/master/README.turnserver | 열람 |
| 14 | LiveKit SFU internals | LiveKit | https://docs.livekit.io/reference/internals/livekit-sfu/ | 열람 |
| 15 | mediasoup v3 API | mediasoup | https://mediasoup.org/documentation/v3/mediasoup/api/ | 열람(앞 100k자) |
| 16 | LiveKit Ports and firewall | LiveKit | https://docs.livekit.io/home/self-hosting/ports-firewall/ | 열람 |
| 17 | Jibri README | Jitsi | https://github.com/jitsi/jibri/blob/master/README.md | 열람 |
| 18 | Jitsi Self-Hosting Guide (Debian/Ubuntu) | Jitsi | https://jitsi.github.io/handbook/docs/devops-guide/devops-guide-quickstart/ | 열람 |
| 19 | Jitsi Scalable setup | Jitsi | https://jitsi.github.io/handbook/docs/devops-guide/devops-guide-scalable/ | 열람 |
| 20 | RFC 5764 DTLS-SRTP / RFC 3711 SRTP | IETF | https://www.rfc-editor.org/rfc/rfc5764.html · https://www.rfc-editor.org/rfc/rfc3711.html | 열람 |
| 21 | WebRTC: Real-Time Communication in Browsers (Recommendation 2025-03-13) | W3C | https://www.w3.org/TR/webrtc/ | 열람(앞 100k자) |
| 22 | RFC 6455 The WebSocket Protocol | IETF | https://www.rfc-editor.org/rfc/rfc6455.html | 열람 |
| 23 | LiveKit Egress overview | LiveKit | https://docs.livekit.io/home/egress/overview/ | 열람 |
| 24 | LiveKit self-hosting Egress | LiveKit | https://docs.livekit.io/home/self-hosting/egress/ | 열람 |
| 25 | LiveKit Ingress overview | LiveKit | https://docs.livekit.io/home/ingress/overview/ | 열람 |
| 26 | Jitsi Setting up TURN | Jitsi | https://jitsi.github.io/handbook/docs/devops-guide/turn/ | 열람 |
| 27 | LiveKit Deployment | LiveKit | https://docs.livekit.io/home/self-hosting/deployment/ | 열람 |
| 28 | LiveKit Kubernetes | LiveKit | https://docs.livekit.io/home/self-hosting/kubernetes/ | 열람 |
| 29 | LiveKit self-hosting Ingress | LiveKit | https://docs.livekit.io/home/self-hosting/ingress/ | 열람 |
| 30 | LiveKit Agents | LiveKit | https://docs.livekit.io/agents/ | 열람 |
| 31 | RFC 8216 HTTP Live Streaming (Informational) | IETF | https://www.rfc-editor.org/rfc/rfc8216.html | 열람(앞 100k자) |
| 32 | draft-ietf-wish-whep-05 WHEP | IETF | https://datatracker.ietf.org/doc/draft-ietf-wish-whep/ | 열람 |
| 33 | mediasoup FAQ / Overview | mediasoup | https://mediasoup.org/faq/ · https://mediasoup.org/documentation/overview/ | 열람 |
| 34 | Amazon IVS Real-Time Streaming Network Requirements | AWS | https://docs.aws.amazon.com/ivs/latest/RealTimeUserGuide/real-time-network-requirements.html | 열람 |
| 35 | RFC 4787 NAT Behavioral Requirements for Unicast UDP | IETF | https://www.rfc-editor.org/rfc/rfc4787.html | 열람 |
| 36 | RFC 9605 SFrame | IETF | https://www.rfc-editor.org/rfc/rfc9605.html | 열람 |
| 37 | RFC 8445 ICE | IETF | https://www.rfc-editor.org/rfc/rfc8445.html | 열람(앞 100k자) |
| 38 | RFC 9429 JSEP (RFC 8829 대체) / RFC 8829 | IETF | https://www.rfc-editor.org/rfc/rfc9429.html | 열람 |
| 39 | RFC 8838 Trickle ICE · RFC 8834 RTP in WebRTC · RFC 8853 Simulcast · RFC 3550 RTP · RFC 8866 SDP · RFC 7742 · RFC 7874 | IETF | https://www.rfc-editor.org/rfc/rfc8838.html 외 | 열람 |
| 40 | Scalable Video Coding (SVC) Extension for WebRTC (Working Draft 2026-09-14) | W3C | https://www.w3.org/TR/webrtc-svc/ | 열람 |
| 41 | Janus README · VideoRoom · AudioBridge 문서 | Meetecho | https://raw.githubusercontent.com/meetecho/janus-gateway/master/README.md · https://janus.conf.meetecho.com/docs/videoroom.html · https://janus.conf.meetecho.com/docs/audiobridge.html | 열람 |
| 42 | Jitsi Handbook Architecture | Jitsi | https://jitsi.github.io/handbook/docs/architecture/ | 열람(포트는 그림이라 못 읽음) |
| 43 | Enabling Low-Latency HLS | Apple | https://developer.apple.com/documentation/http-live-streaming/enabling-low-latency-http-live-streaming-hls | 본문 못 받음 |
| 44 | mediasoup v3 Design | mediasoup | https://mediasoup.org/documentation/v3/mediasoup/design/ | 열람(그림뿐) |

열람은 WebFetch 요약 모델을 거쳤다. 긴 RFC 는 앞 10만 자까지만 읽혔으므로 뒤쪽 절의 내용은 인용하지 않았다.
