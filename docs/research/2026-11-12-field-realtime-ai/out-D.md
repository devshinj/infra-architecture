# D) LLM 서빙·AI 에이전트를 서비스에 결합하는 구성

조사일 2026-11-11~12. 아래 내용은 "출처 목록"에서 열람 표시가 있는 페이지 본문을 읽고 적은 것이다. 출처에 없는 내용은 **(조사자 의견)** 으로 따로 표시했다. 제품 버전과 성능 수치는 적지 않았다. 포트는 각 공식 문서의 기본값·예시값이다.

---

## 1. 전형적인 구성 4가지

### 구성 1 — 앱이 외부 LLM API 를 직접 부른다 (가장 작은 구성)

구성요소: 클라이언트, 앱 서버, (선택) 이그레스 방화벽·프록시, 외부 LLM API(공급자).

- 클라이언트 → 앱 서버 : HTTPS, 요청 방향. 사용자 질문이 올라가고, 답은 SSE 스트림(`text/event-stream`)으로 내려온다.
- 앱 서버 → 외부 LLM API : HTTPS 443, 앱 서버가 먼저 건다(아웃바운드). 프롬프트(사용자 입력 + 붙인 내부 자료)가 나가고 응답 토큰이 SSE 로 돌아온다. OpenAI 문서는 스트리밍을 "HTTP streaming (`stream=true`) over server-sent events"라고 적는다.
- 앱 서버 → 외부 LLM API (배치) : HTTPS, 비동기. 요청을 파일로 묶어 맡기고 결과를 나중에 받는다(Batch API).
- 클라우드 변형: 앱 서버(VPC 프라이빗 서브넷) → 프라이빗 엔드포인트 → 관리형 LLM 서비스. AWS 문서는 Amazon Bedrock 을 인터페이스 VPC 엔드포인트(PrivateLink)로 "인터넷 게이트웨이, NAT 장치, VPN, Direct Connect 없이" 부를 수 있다고 적는다. 이 경우 선은 인터넷으로 나가지 않는다.

### 구성 2 — 앱 → LLM 게이트웨이 → 사내 모델 서버(GPU) (온프레미스 자체 서빙)

구성요소: 앱 서버, LLM 게이트웨이, 게이트웨이용 DB(PostgreSQL)·캐시(Redis), L7 로드밸런서, 모델 서버 여러 대(GPU), 모델 저장소, 관측 도구.

- 앱 서버 → LLM 게이트웨이 : HTTP(S), OpenAI 호환 API(`/v1/chat/completions` 등), 가상 키로 인증. LiteLLM 기본 포트 4000.
- LLM 게이트웨이 → PostgreSQL : DB 접속. 가상 키·사용량 기록 저장(LiteLLM 가상 키는 PostgreSQL 이 필요하다).
- LLM 게이트웨이 → Redis : 캐시·한도 공유 상태. 게이트웨이를 여러 대 둘 때 쿨다운·TPM/RPM 한도를 함께 쓰려면 필요하다.
- LLM 게이트웨이 → 로드밸런서 → 모델 서버 : HTTP, OpenAI 호환 API, 응답은 SSE. vLLM 문서 예시는 nginx 가 `least_conn` 으로 vLLM 컨테이너 두 대(각 8000)에 나눈다.
  - vLLM: 기본 `http://localhost:8000`, `--api-key` 는 선택.
  - Ollama: 기본 `127.0.0.1:11434` 에만 붙는다. 다른 기기에서 부르려면 `OLLAMA_HOST` 를 바꿔야 한다. 로컬 서버는 API 키를 확인하지 않는다.
  - llama.cpp 서버: README 기본값은 `127.0.0.1`, 포트 9931(도커 예시는 8080).
  - Triton: 8000(HTTP), 8001(gRPC), 8002(메트릭). HTTP/REST 와 gRPC 는 KServe 표준 추론 프로토콜 기반.
- 모델 서버 → 모델 저장소 : 파일 읽기(로컬 디스크·공유 파일 스토리지·오브젝트 스토리지). Triton 은 "모델 저장소는 서빙할 모델을 두는 디렉터리"라고 정의한다. vLLM 은 기본으로 Hugging Face Hub 에서 내려받고, Ollama 는 HTTPS 로만 모델을 받는다(`HTTPS_PROXY` 사용 가능).
- 모델 서버·게이트웨이 → 관측 도구 : 메트릭(Prometheus 형식)·추적(OpenTelemetry). 보조 선.
- (게이트웨이가 외부 공급자도 함께 중계하는 경우) LLM 게이트웨이 → 외부 LLM API : HTTPS 443. 공급자 키는 게이트웨이만 가진다. 실패 시 다른 배포로 폴백.

쿠버네티스 변형: 모델 서버를 파드로 두고 GPU 는 디바이스 플러그인이 노출하는 `nvidia.com/gpu` 자원을 `limits` 로 요청한다. KServe 는 InferenceService 리소스로 배포·오토스케일(0 까지 축소 포함)을 맡는다.

### 구성 3 — RAG (검색 증강 생성)

AWS·GCP 문서 모두 **미리 돌아가는 수집 흐름**과 **요청마다 도는 응답 흐름**을 나눠 그린다.

수집(비동기):
- 문서 원본 저장소(오브젝트 스토리지) → 큐 → 수집 작업자 : 이벤트. GCP 참조 구조는 Cloud Storage → Pub/Sub → Cloud Run 함수.
- 수집 작업자 → 임베딩 모델 : HTTP. 문서를 글로 바꾸고 청크로 자른 뒤 임베딩을 요청.
- 수집 작업자 → 벡터 DB : 쓰기. 임베딩과 청크(원문 조각)를 저장하고 원본 문서와의 대응을 유지.

응답(동기):
- 앱 서버 → 임베딩 모델 : HTTP. 질문을 벡터로 바꾼다(수집 때와 같은 모델).
- 앱 서버 → 벡터 DB : 유사도 검색. 관련 청크를 받는다.
- (선택) 앱 서버 → 리랭커 : HTTP. 후보를 관련도 순으로 다시 줄 세운다(vLLM·llama.cpp 서버에 rerank 경로가 있다).
- 앱 서버 → LLM(게이트웨이 경유) : 질문 + 찾은 청크를 붙인 프롬프트를 보내고 답을 받는다.
- 앱 서버 → 로깅·평가 : 요청·응답 기록, 품질 평가(GCP 구조는 별도의 "품질 평가 하위 시스템").

벡터 DB 예: Milvus(프록시 → 코디네이터·워커, 메타는 etcd, 데이터는 오브젝트 스토리지), Qdrant(HTTP·gRPC), pgvector(PostgreSQL 확장), Weaviate.

### 구성 4 — 에이전트 → 도구(MCP 서버) → 사내 시스템

구성요소: 사용자 화면, 에이전트 런타임(MCP 호스트 역할), LLM(게이트웨이 경유), 대화 상태 저장소, MCP 서버들, 인가 서버(OAuth), 사내 시스템(DB·업무 API), 사람 승인 단계, 이그레스 방화벽.

- 사용자 → 에이전트 런타임 : HTTPS(+SSE). 요청과 진행 상황.
- 에이전트 런타임 → LLM 게이트웨이/모델 : HTTP. 도구 정의를 함께 보내고, 모델은 "도구 호출"(이름+인자)을 돌려준다. **함수를 실제로 실행하는 쪽은 앱(런타임)이다**(OpenAI 문서).
- 에이전트 런타임(MCP 클라이언트) → 원격 MCP 서버 : Streamable HTTP. 요청마다 MCP 엔드포인트 하나에 HTTP POST, 응답은 JSON 한 건 또는 그 요청에 딸린 SSE 스트림. `Authorization: Bearer` 토큰을 요청마다 싣는다.
- 에이전트 런타임(MCP 클라이언트) → 로컬 MCP 서버 : stdio. 클라이언트가 서버를 자식 프로세스로 띄우고 표준 입출력으로 줄 단위 JSON-RPC 를 주고받는다. **네트워크 선이 아니다.**
- MCP 클라이언트 → 인가 서버 : OAuth 2.1. MCP 서버는 리소스 서버 역할이고 토큰은 인가 서버가 발급한다.
- MCP 서버 → 사내 시스템 : 그 시스템의 원래 프로토콜(JDBC, REST 등)과 **MCP 서버 자신의 자격**으로 접속. 클라이언트에게 받은 토큰을 그대로 넘기지 않는다(토큰 패스스루 금지).
- 에이전트 런타임 → 대화 상태 저장소 : DB 접속. 대화·도구 호출 내역·체크포인트 저장(Azure 기준 구조는 Cosmos DB, LangGraph 는 Postgres 체크포인터).
- 에이전트 런타임 → 승인자 : 민감한 도구 실행 전 멈춤 → 사람이 허용/거부 → 재개.
- 에이전트 → 다른 에이전트 : A2A(JSON-RPC over HTTP(S), gRPC, HTTP+JSON). 에이전트 카드는 `/.well-known/agent-card.json`.
- 에이전트의 외부 통신 → 이그레스 방화벽 → 인터넷 : Azure 기준 구조는 "에이전트의 아웃바운드는 Azure Firewall 을 거친다", "사설 MCP 서버는 가상 네트워크 안에 둔다"고 적는다.
- (선택) 에이전트 런타임 → MCP 게이트웨이 → MCP 서버들 : 도구 접근을 키·팀별로 한곳에서 통제.

---

## 2. 구성요소 사전

| 요소 | 역할 한 줄 | 보통 놓이는 곳 | 구성도에 적을 속성 |
|---|---|---|---|
| 외부 LLM API | 공급자가 운영하는 모델을 HTTPS 로 호출 | 기관 밖(인터넷·외부 서비스). 클라우드면 프라이빗 엔드포인트 뒤 | 공급자, 모델 이름, 연동 방식(인터넷/프라이빗 엔드포인트), 스트리밍 여부 |
| LLM 게이트웨이 | 하나의 주소로 받아 인증·한도·분산·폴백·기록·가드레일 | 앱 서버와 모델 사이. 외부 API 를 부르면 출구에 가까운 구역 | 제품, 포트, 뒤에 붙은 모델 목록, 키·한도 정책, 캐시 종류 |
| 모델 서버(추론 서버) | 모델을 GPU 에 올려 HTTP/gRPC 로 추론 | 내부 서버 구역(서버팜·프라이빗 서브넷). 인터넷에서 직접 닿지 않게 | 제품(vLLM 등), 모델 이름, GPU 수·종류, 대수, 포트, API 형식 |
| GPU 노드 | 모델 서버가 올라가는 서버·쿠버네티스 노드 | 내부 서버 구역 | GPU 수, 노드 수 |
| 모델 저장소 | 모델 파일 보관 | 모델 서버와 같은 구역의 디스크·파일/오브젝트 스토리지 | 저장 방식, 반입 경로(직접 내려받기/수동 반입) |
| 임베딩 모델 | 글 → 벡터 | 모델 서버와 같은 구역(또는 외부 API) | 모델 이름, 서빙 제품 |
| 벡터 DB | 벡터·청크 저장과 유사도 검색 | 데이터 구역(원본 문서와 같은 수준으로 보호) | 제품, 포트, 인증·TLS 여부, 복제 |
| 문서 수집 파이프라인 | 문서 → 청크 → 임베딩 → 벡터 DB | 내부 구역, 큐 뒤의 작업자 | 대상 문서 저장소, 주기/이벤트 |
| 리랭커 | 후보 문서를 관련도 순으로 재정렬 | 모델 서버와 같은 구역 | 모델 이름 |
| 가드레일 | 입력·출력 내용 검사, 민감 정보 차단·가림 | 게이트웨이 안이나 앱과 모델 사이 | 검사 시점(호출 전/후), 대상(PII 등) |
| 에이전트 런타임 | 모델 호출·도구 실행·상태 저장 흐름을 돌림 | 앱 서버 구역 | 프레임워크/서비스, 쓰는 도구 목록, 승인 필요 여부 |
| MCP 서버 | 사내 시스템을 도구로 감싸 MCP 로 내줌 | 원격: 대상 시스템과 가까운 내부 구역. 로컬: 에이전트와 같은 기기 | 전송(stdio/Streamable HTTP), 내주는 도구, 인증(OAuth), 대상 시스템 |
| MCP 게이트웨이 | 여러 MCP 서버 앞에서 접근 통제 | 에이전트와 MCP 서버 사이 | 제품, 허용 도구 |
| 대화 상태 저장소 | 대화·체크포인트 저장 | 데이터 구역 | DB 종류 |
| 샌드박스 실행 환경 | 생성된 코드·도구를 격리 실행 | 별도 격리 구역(아웃바운드 제한) | 격리 방식(컨테이너 등), 네트워크 허용 범위 |
| 사람 승인 단계 | 민감 작업 전 사람 확인 | 에이전트 흐름 안(화면·메신저) | 승인 대상 도구 |
| 관측·평가 | 추적·토큰 사용량·품질 점수 | 관리/모니터링 구역 | 제품, 프롬프트 원문 저장 여부 |
| 모델 레지스트리 | 모델 버전·별칭·이력 | 관리 구역 | 제품 |
| 이그레스 방화벽·프록시 | 나가는 통신을 허용 목적지로 제한 | 내부 구역과 인터넷 사이 | 허용 FQDN 목록 |

---

## 3. 망·보안 관점

### 3.1 어디에 두고 무엇으로 잇나

| 짝 | 잇는 방법 | 근거·메모 |
|---|---|---|
| 일반 사내망(사무망·서버팜) 앱 → 외부 LLM API | 방화벽(아웃바운드 허용 목적지 제한) 또는 이그레스 프록시 | Azure 기준 구조: 아웃바운드는 방화벽의 FQDN 규칙을 거친다. |
| 망분리 대상 내부망(업무망·금융 전산망 등) 앱 → 외부 LLM API | 원칙은 직접 잇지 않음. 규정이 허용한 경우에만 조건부(망연계·허용 서비스·규제 특례) | 금융: 2024-08-13 금융위 로드맵이 샌드박스(혁신금융서비스)로 "인터넷 활용 제한 등에 대한 규제 특례"를 주고 보안대책을 조건으로 붙였다. 공공: N²SF 정보서비스 모델에 "업무환경에서 생성형 AI 활용"이 있다(기사로만 확인). |
| 클라우드 프라이빗 서브넷 앱 → 관리형 LLM 서비스 | 프라이빗 엔드포인트(직접, 인터넷 미경유) | AWS Bedrock VPC 인터페이스 엔드포인트. 엔드포인트 정책으로 허용 동작을 좁힐 수 있다. |
| 앱 → LLM 게이트웨이 → 사내 모델 서버 | 같은 내부 구역이면 직접, 구역이 다르면 방화벽(필요 포트만) | 모델 서버는 인터넷 연결이 필요 없다(모델 반입 때만 예외). |
| 모델 서버 → 인터넷(모델 내려받기) | 폐쇄망은 잇지 않고 수동 반입, 그 외는 프록시 경유 | Ollama 는 HTTPS 로만 받고 `HTTPS_PROXY` 를 쓴다. vLLM 은 기본으로 Hugging Face Hub 에서 받는다. 폐쇄망 반입 절차는 (조사자 의견). |
| 에이전트 → 원격 MCP 서버(사내) | 내부 구역 안에서 직접 또는 방화벽, OAuth 토큰 필수 | Azure: 사설 MCP 서버는 가상 네트워크 안에 둔다. MCP: 서버는 Origin 헤더를 검증하고 인증을 구현해야 한다. |
| 에이전트 → 인터넷의 MCP 서버·웹 도구 | 이그레스 방화벽·프록시 경유, 허용 목록 | MCP 보안 문서는 서버 측 MCP 클라이언트에 이그레스 프록시 사용을 권한다(SSRF 방지). |
| MCP 서버 → 사내 시스템 | 대상 시스템의 기존 접근 통제(방화벽·DB 계정) 그대로 | OWASP: 권한 판단은 LLM 이 아니라 뒤쪽 시스템에서 강제한다. |

### 3.2 외부 API 구성과 자체 서빙 구성의 차이

- **프롬프트가 어디로 가나**: 외부 API 구성은 프롬프트(사용자 입력, RAG 로 붙인 사내 문서 조각, 도구 결과)가 기관 밖으로 나간다. 자체 서빙은 모델 서버까지 내부에 머문다. Ollama 문서는 로컬 실행 시 프롬프트와 데이터를 Ollama 측이 보지 않는다고 적는다.
- **필요한 자원**: 자체 서빙은 GPU 서버·모델 저장소·모델 반입 경로·서빙 SW 운영이 추가된다. 외부 API 는 출구 통제(방화벽·프록시·게이트웨이·가드레일)가 핵심이다.
- **선의 방향**: 두 구성 모두 앱이 먼저 건다(아웃바운드). 외부 공급자가 사내로 먼저 들어오는 선은 없다.
- **섞어 쓰는 구성**: LLM 게이트웨이 하나가 사내 모델 서버와 외부 API 를 함께 중계할 수 있다(LiteLLM, Azure APIM 모두 자체 호스팅 모델과 외부 공급자를 같이 다룬다). 이때 "어떤 요청이 밖으로 나가는가"를 게이트웨이의 키·모델 권한으로 나눈다.

### 3.3 국내 규정·가이드 (확인 수준을 함께 적음)

- **금융위원회 「금융분야 망분리 개선 로드맵」(2024-08-13 보도자료) — 원문 열람.** "금융회사 등의 생성형 AI 활용을 허용한다", "샌드박스를 통해 인터넷 활용 제한 등에 대한 규제 특례를 허용한다", "예상되는 리스크에 대한 보안대책을 조건으로 부과"한다고 적는다. SaaS 이용 범위 확대(보안관리·고객관리 등), 연구·개발 환경 개선도 함께 담겼다. 1단계는 가명정보까지, 성과가 검증되면 2단계에서 개인신용정보까지 넓히는 계획이며, 장기적으로 "자율보안-결과책임" 원칙의 별도 법을 검토한다고 했다. **이후 실제 제도화·규정 개정 결과는 확인하지 못했다.**
- **개인정보보호위원회 「생성형 인공지능(AI) 개발·활용을 위한 개인정보 처리 안내서」(2025-08-06 공개) — 보도자료 열람, 안내서 본문 PDF 는 미열람.** 생애주기 4단계(목적 설정 → 전략 수립 → 학습 및 개발 → 적용 및 관리)와 CPO 중심 거버넌스를 제시한다. 개발·활용 방식을 서비스형 LLM 활용(예: ChatGPT API 연계), 기성 LLM 활용(예: Llama 오픈소스 모델), 자체 개발(예: SLM)로 유형화하고 유형별 법적 기준과 안전성 확보 기준을 제시했다고 밝힌다. AI 에이전트 관리 방안도 포함했다고 한다. 이 유형 구분은 이 문서의 "외부 API / 자체 서빙" 구분과 맞닿는다.
- **개인정보보호위원회 「공공 AX 프라이버시 보호 안내서」(2026.7.) — 게시물 열람.** 공공기관이 인공지능 전환 과정에서 개인정보를 처리할 때 준수할 사항을 안내한다고 적혀 있다. 본문은 미열람.
- **국가정보원 N²SF(국가 망 보안체계) 보안 가이드라인 — 국정원(NCSC) 원문 접속 실패.** KISA 공고문(열람)은 N²SF 를 "국가·공공기관에서 적용 중인 망 분리 정책을 대상으로, 효율적인 업무 환경과 고도화된 사이버보안 수준을 동시에 확보하기 위해" 나온 체계로 소개하고, KISA 는 2026-04-13 「N2SF 실증 사례집」을 게시했다(게시물 열람, PDF 미열람). 기사(보조)에 따르면 업무정보를 기밀(C)·민감(S)·공개(O)로 나누고, 2025-01 초안의 정보서비스 모델 8개 중 하나가 "업무환경에서 생성형 AI 활용", 다른 하나가 "공공데이터의 외부 AI 융합"이며, 2025-09-30 정식판(1.0)에서 모델이 11개로 늘었다. **모델별 구성 요건(어떤 구간을 무엇으로 잇는지)은 확인하지 못했다.**
- **국가정보원 「챗GPT 등 생성형 AI 활용 보안 가이드라인」(2023.6) — 원문 접속 실패.** 기사(보조)에 따르면 2025-12-10 국가인공지능안보센터가 이를 개정한 「AI 보안 가이드북」을 배포했고 생성형·에이전틱·피지컬 AI 를 다룬다. 망 구성 권고 내용은 확인하지 못했다.

### 3.4 흔한 실수

1. **모델 서버를 인증 없이 망 전체에 노출.** Ollama 는 기본으로 127.0.0.1 에만 붙고 로컬 서버는 키를 확인하지 않는다. `0.0.0.0` 으로 바꾸면 그 망의 누구나 부를 수 있다. vLLM 의 API 키도 선택 사항이다. → 게이트웨이나 리버스 프록시 뒤에 두고 방화벽으로 호출자를 제한한다.
2. **벡터 DB 를 기본 설정으로 둠.** Qdrant 문서: "기본적으로 자체 배포한 인스턴스는 안전하지 않다", 연결은 기본으로 암호화되지 않는다. 벡터 DB 에는 임베딩뿐 아니라 원문 조각(청크)이 들어 있으므로 원본 문서와 같은 수준으로 보호해야 한다(뒷부분은 조사자 의견).
3. **스트리밍 응답이 프록시·LB 에서 끊기거나 뭉쳐서 옴.** nginx 는 `proxy_buffering` 기본값이 on 이고 `proxy_read_timeout` 기본값이 60초(두 번의 읽기 사이 간격 기준)다. 응답 헤더 `X-Accel-Buffering: no` 로 버퍼링을 끌 수 있고 MCP 사양도 SSE 를 열 때 이 헤더를 권한다. AWS ALB 의 연결 유휴 시간 초과 기본값도 60초이며 HTTP/2 PING 은 이를 갱신하지 않는다. WHATWG 는 오래된 프록시가 짧은 시간 뒤 연결을 끊을 수 있으니 15초쯤마다 주석 줄(`:`)을 보내라고 권한다.
4. **앱이 공급자 키를 직접 들고 있음.** 게이트웨이의 가상 키를 쓰면 공급자 키는 게이트웨이만 갖고 키·팀별 예산·TPM/RPM 한도를 걸 수 있다.
5. **MCP 서버가 받은 토큰을 뒤 시스템에 그대로 넘김(토큰 패스스루).** MCP 사양이 금지한다. MCP 서버는 자기 앞으로 발급된 토큰만 받아야 한다.
6. **에이전트에 넓은 권한과 무제한 아웃바운드.** OWASP 는 도구를 필요한 것만, 권한은 최소로(예: 읽기 전용 DB 계정), 영향이 큰 작업은 사람 승인, 권한 판단은 뒤쪽 시스템에서 강제하라고 권한다. Azure 기준 구조는 에이전트 아웃바운드를 방화벽에 통과시키되 "웹 검색 도구는 이그레스 서브넷을 우회한다"는 예외를 적어 두었다(내장 도구별로 확인 필요).
7. **로컬(stdio) MCP 서버를 네트워크 선으로 그림.** stdio 서버는 에이전트와 같은 기기의 자식 프로세스다. 클라이언트와 같은 권한으로 돌므로 MCP 보안 문서는 샌드박스에서 최소 권한으로 띄우라고 권한다.
8. **관측 기록을 등급 낮은 곳에 모음.** 추적 기록에는 프롬프트·응답 원문이 남는다(Azure APIM, Langfuse 모두 프롬프트·응답을 기록한다). 기록 저장소의 위치를 따져야 한다(조사자 의견).
9. **예전 MCP 동작을 가정.** 사양 개정판 2026-07-28 에서 프로토콜이 상태 없음으로 바뀌어 `initialize` 핸드셰이크, 세션(`Mcp-Session-Id`), GET 으로 여는 독립 SSE 스트림, 서버가 먼저 보내는 요청이 빠졌다. 예전 HTTP+SSE 전송은 폐기 예정이다. "MCP 는 세션 고정이 필요하다"는 식의 설명은 이전 개정판 기준이다.

---

## 4. 구성도를 그리는 AI 에게 줄 지침 후보

1. 외부 LLM API 는 기관·VPC 바깥의 "외부 서비스" 묶음에 `external_api` 로 그리고, 선은 앱 서버(또는 LLM 게이트웨이)에서 밖으로 향하는 동기 요청으로 긋는다. 공급자에서 안으로 들어오는 선은 긋지 않는다.
2. 망분리 대상 내부망에 있는 앱에서 외부 LLM API 로 가는 선은 바로 긋지 않는다. 사용자가 허용 근거(규제 특례, N²SF 모델 등)를 말하지 않았으면 "예상: 직접 잇지 못함"으로 경고하고 망연계나 허용된 출구를 거치게 한다.
3. 사내 자체 서빙은 "앱 서버 → LLM 게이트웨이 → (로드밸런서) → 모델 서버" 순으로 그린다. 모델 서버는 내부 구역에 두고 인터넷과 잇지 않는다.
4. 모델 서버에는 모델 이름, GPU 수, 대수, 포트를 속성으로 적는다. GPU 는 별도 노드로 떼지 말고 모델 서버(또는 그 서버가 올라간 GPU 노드)의 속성으로 적는다.
5. 앱 → LLM, 게이트웨이 → 모델 서버 선은 "동기 요청"으로 긋고 라벨에 `HTTPS · SSE 스트리밍`을 적는다. 사이에 프록시·LB 가 끼면 버퍼링·유휴 시간 초과 설정을 확인하라는 메모를 붙인다.
6. RAG 는 선을 두 갈래로 나눈다. 문서 저장소 → 큐 → 수집 작업자 → 임베딩 모델 → 벡터 DB 는 "비동기"로, 앱 → 임베딩 모델 → 벡터 DB → (리랭커) → LLM 은 "동기 요청"으로 긋는다.
7. 벡터 DB 는 데이터 계열 노드로 원본 문서 저장소와 같은 구역에 두고, 인터넷이나 DMZ 에 두지 않는다.
8. 에이전트는 "에이전트 런타임 → LLM" 선과 "에이전트 런타임 → MCP 서버 → 사내 시스템" 선을 따로 긋는다. LLM 에서 MCP 서버나 사내 시스템으로 직접 가는 선은 긋지 않는다(도구를 실행하는 쪽은 런타임이다).
9. 원격 MCP 서버는 별도 노드로 그리고 선 라벨에 `Streamable HTTP(POST, SSE) · OAuth`를 적는다. 로컬(stdio) MCP 서버는 에이전트와 같은 호스트 상자 안에 두고 네트워크 선 대신 "stdio(자식 프로세스)"로 표시한다.
10. MCP 서버에서 사내 시스템으로 가는 선은 그 시스템의 원래 프로토콜(JDBC, HTTPS 등)로 긋고, 망 경계를 넘으면 기존 망 규칙(방화벽·망연계)을 그대로 적용한다.
11. 에이전트가 인터넷의 도구·MCP 서버를 쓰면 이그레스 방화벽이나 프록시를 거쳐 나가게 긋는다. 쓰기·삭제·송금 같은 도구가 있으면 "사람 승인 단계"를 에이전트와 도구 사이에 표시한다.
12. 관측(추적·토큰 사용량)·평가·모델 레지스트리로 가는 선은 "보조" 선으로 긋는다. 게이트웨이의 PostgreSQL·Redis 는 게이트웨이 옆 데이터 노드로 그린다.

### "세 가지 그림"을 구분하는 법 (요약)

| 구분 | 끝 노드의 위치 | 가운데 노드 | 선 라벨 | 눈여겨볼 경계 |
|---|---|---|---|---|
| 앱 → LLM(외부 API) | 기관 밖 외부 서비스 | (선택) 이그레스 방화벽·프록시, LLM 게이트웨이 | HTTPS 443 · SSE | 내부망 → 인터넷. 프롬프트가 밖으로 나감 |
| 앱 → 게이트웨이 → 사내 모델 서버(GPU) | 기관 안 내부 구역 | LLM 게이트웨이, 로드밸런서 | HTTP · OpenAI 호환 · SSE(또는 gRPC) | 경계를 넘지 않음. 모델 반입 경로만 따로 |
| 에이전트 → 도구(MCP 서버) → 사내 시스템 | 사내 DB·업무 시스템 | MCP 서버(원격/로컬), 인가 서버, 승인 단계 | Streamable HTTP · OAuth / stdio, 그 뒤는 시스템 고유 프로토콜 | 에이전트의 권한 범위와 아웃바운드 |

### 현재 노드 종류(catalog.ts)로 옮겨 그릴 때 (조사자 의견)

- 외부 LLM API → `external_api`(integration 에 공급자·모델).
- LLM 게이트웨이·MCP 게이트웨이 → `api_gateway`.
- 모델 서버·임베딩 모델·리랭커·에이전트 런타임·MCP 서버 → `app_server` 또는 `k8s_pod`(sw 에 제품명). 전용 종류가 없어 구분이 흐려진다. 전용 종류 후보: `llm_gateway`, `model_server`(속성 model·gpu·replicas), `vector_db`, `agent`, `mcp_server`(속성 transport).
- 벡터 DB → `db_nosql` 또는 `search`. 대화 상태 저장소 → `db_rdb`/`db_nosql`. 게이트웨이 캐시 → `cache`.
- 모델 저장소 → `object_storage`/`file_storage`. 수집 큐 → `queue`. 관측 → `monitoring`/`logging`.
- 선 종류는 기존 4개(동기 요청·비동기·복제·보조)로 충분하다. 스트리밍은 "동기 요청"에 라벨로 적는다.

---

## 5. 확인하지 못한 것·출처가 갈리는 것

- **국정원(NCSC) 원문 전부**: `ncsc.go.kr` 이 임시 페이지로 열리고 게시판 주소는 404 였다. 「챗GPT 등 생성형 AI 활용 보안 가이드라인」(2023.6), 「AI 보안 가이드북」(2025.12), N²SF 가이드라인 1.0 본문과 정보서비스 모델 해설서를 열지 못했다. N²SF 의 생성형 AI 활용 모델이 요구하는 구간별 통제(무엇으로 잇는지)는 미확인이다.
- **N²SF 정보서비스 모델 수**: 2025-01 기사는 8개, 2025-09 기사는 11개로 적는다(초안 → 정식판 차이로 보이나 원문 미확인). 11개의 이름은 확인하지 못했다.
- **금융 로드맵 이후**: 2단계 샌드박스, 전자금융감독규정 개정, 별도 법 제정이 실제로 어떻게 됐는지 확인하지 못했다. 2024-08-13 보도자료 내용만 확인했다.
- **개인정보위 안내서 본문**: 보도자료만 열었다. 유형별 구체 기준(국외 이전·처리위탁 등)은 미확인이다.
- **NVIDIA NIM**: 공식 문서 페이지 세 곳이 빈 내용으로 열려 확인하지 못했다(용어 후보는 verified=false).
- **llama.cpp 서버 기본 포트**: 현재 README 옵션 표는 9931, 같은 문서의 도커 예시는 8080 이다. 구성도에는 "설정값 확인"으로 다루는 편이 안전하다.
- **Qdrant·Milvus 클라이언트 포트**: Qdrant 는 내부 클러스터용 6335 만 문서에서 확인했다(REST·gRPC 포트는 확인한 페이지에 없었다). Milvus 클라이언트 포트도 확인한 페이지에 없었다.
- **vLLM 메트릭 문서**: 해당 주소가 404 였다. Prometheus 형식 메트릭은 llama.cpp 서버(`--metrics`)·TGI·TEI·Triton(8002) 문서에서만 확인했다.
- **OpenTelemetry GenAI 규약**: 별도 저장소로 옮겨졌고 스팬·메트릭·이벤트·MCP 를 다룬다는 것만 확인했다. 속성 이름과 안정화 단계는 미확인이다.
- **TGI**: 공식 문서가 유지보수 모드라고 밝힌다. 새 구성의 기본 예시로 쓰기에는 맞지 않다.
- **MCP 개정판**: 이 문서는 2026-07-28 개정판 기준이다. 현장에는 이전 개정판(세션·GET 스트림 있음) 구현이 섞여 있을 수 있다.
- **A2A 운영 주체**: 사양 페이지에서 Agentic AI Foundation 합류 공지를 봤다. 그 밖의 연혁은 확인하지 않았다.
- **조사자 의견으로 표시한 것**: 벡터 DB 의 보호 수준, 관측 기록 저장 위치, 폐쇄망 모델 반입 절차, catalog.ts 대응은 출처 문장이 아니라 출처 내용을 바탕으로 한 판단이다.

---

## 6. 출처 목록

열람 = 페이지를 실제로 열어 본문을 읽음. 실패 = 접속했으나 본문을 얻지 못함.

### 사양·표준
| 제목 | 기관 | URL | 열람 |
|---|---|---|---|
| MCP Specification (2026-07-28) – Architecture | Model Context Protocol | https://modelcontextprotocol.io/specification/latest/architecture | 열람 |
| MCP – Transports (개요) | 〃 | https://modelcontextprotocol.io/specification/latest/basic/transports | 열람 |
| MCP – Streamable HTTP | 〃 | https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http | 열람 |
| MCP – stdio | 〃 | https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/stdio | 열람 |
| MCP – Authorization | 〃 | https://modelcontextprotocol.io/specification/latest/basic/authorization | 열람 |
| MCP – Tools | 〃 | https://modelcontextprotocol.io/specification/latest/server/tools | 열람 |
| MCP – Security Best Practices | 〃 | https://modelcontextprotocol.io/specification/latest/basic/security_best_practices | 열람 |
| A2A Protocol Specification | A2A Project | https://a2a-protocol.org/latest/specification/ | 열람(앞부분만) |
| A2A – Agent Discovery | 〃 | https://a2a-protocol.org/latest/topics/agent-discovery/ | 열람 |
| HTML Standard – Server-sent events | WHATWG | https://html.spec.whatwg.org/multipage/server-sent-events.html | 열람 |
| OWASP LLM01:2025 Prompt Injection | OWASP | https://genai.owasp.org/llmrisk/llm01-prompt-injection/ | 열람 |
| OWASP LLM06:2025 Excessive Agency | OWASP | https://genai.owasp.org/llmrisk/llm062025-excessive-agency/ | 열람 |
| OpenTelemetry GenAI semantic conventions (저장소) | OpenTelemetry | https://github.com/open-telemetry/semantic-conventions-genai | 열람(개요만) |

### 모델 서빙
| 제목 | 기관 | URL | 열람 |
|---|---|---|---|
| vLLM – Online Serving | vLLM Project | https://docs.vllm.ai/en/latest/serving/online_serving/ | 열람 |
| vLLM – Quickstart | 〃 | https://docs.vllm.ai/en/latest/getting_started/quickstart.html | 열람 |
| vLLM – Using Nginx | 〃 | https://docs.vllm.ai/en/latest/deployment/nginx.html | 열람 |
| vLLM – Tool Calling | 〃 | https://docs.vllm.ai/en/latest/features/tool_calling.html | 열람 |
| vLLM – Metrics | 〃 | https://docs.vllm.ai/en/latest/serving/online_serving/metrics/ | 실패(404) |
| Ollama API – Introduction | Ollama | https://docs.ollama.com/api | 열람 |
| Ollama – FAQ | 〃 | https://docs.ollama.com/faq | 열람 |
| Ollama – OpenAI compatibility | 〃 | https://docs.ollama.com/api/openai-compatibility | 열람 |
| Triton – Quickstart | NVIDIA | https://docs.nvidia.com/deeplearning/triton-inference-server/user-guide/docs/getting_started/quick_start.html | 열람 |
| Triton – Inference Protocols and APIs | NVIDIA | https://docs.nvidia.com/deeplearning/triton-inference-server/user-guide/docs/customization_guide/inference_protocols.html | 열람 |
| NVIDIA NIM for LLMs (introduction / getting-started / index) | NVIDIA | https://docs.nvidia.com/nim/large-language-models/latest/introduction.html | 실패(빈 내용) |
| Text Generation Inference | Hugging Face | https://huggingface.co/docs/text-generation-inference/index | 열람 |
| Text Embeddings Inference | Hugging Face | https://huggingface.co/docs/text-embeddings-inference/index | 열람 |
| huggingface_hub – Download files from the Hub | Hugging Face | https://huggingface.co/docs/huggingface_hub/guides/download | 열람 |
| llama.cpp – tools/server README | ggml-org | https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md | 열람 |
| KServe – Introduction | KServe | https://kserve.github.io/website/docs/intro | 열람 |
| Schedule GPUs | Kubernetes | https://kubernetes.io/docs/tasks/manage-gpus/scheduling-gpus/ | 열람 |
| OpenAI API – Function calling / Streaming / Batch | OpenAI | https://developers.openai.com/api/docs/guides/function-calling | 열람(3쪽) |
| Prompt caching | Anthropic | https://platform.claude.com/docs/en/build-with-claude/prompt-caching | 열람(앞부분) |

### 게이트웨이·프록시
| 제목 | 기관 | URL | 열람 |
|---|---|---|---|
| LiteLLM AI Gateway (Proxy) | LiteLLM | https://docs.litellm.ai/docs/simple_proxy | 열람 |
| LiteLLM – Virtual Keys / Caching / Routing / Guardrails / MCP Gateway | LiteLLM | https://docs.litellm.ai/docs/proxy/virtual_keys | 열람(5쪽) |
| AI gateway capabilities in Azure API Management | Microsoft | https://learn.microsoft.com/en-us/azure/api-management/genai-gateway-capabilities | 열람 |
| ngx_http_proxy_module | nginx.org | https://nginx.org/en/docs/http/ngx_http_proxy_module.html | 열람 |
| Edit attributes for your Application Load Balancer | AWS | https://docs.aws.amazon.com/elasticloadbalancing/latest/application/edit-load-balancer-attributes.html | 열람 |
| Amazon Bedrock Guardrails | AWS | https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html | 열람 |
| NeMo Guardrails | NVIDIA | https://docs.nvidia.com/nemo/guardrails/latest/index.html | 열람 |

### RAG·벡터 DB
| 제목 | 기관 | URL | 열람 |
|---|---|---|---|
| How Amazon Bedrock knowledge bases work | AWS | https://docs.aws.amazon.com/bedrock/latest/userguide/kb-how-it-works.html | 열람 |
| RAG-capable generative AI application (reference architecture) | Google Cloud | https://docs.cloud.google.com/architecture/rag-capable-gen-ai-app-using-vertex-ai | 열람 |
| Milvus Architecture Overview | Milvus | https://milvus.io/docs/architecture_overview.md | 열람 |
| Qdrant – Security / Overview | Qdrant | https://qdrant.tech/documentation/security/ | 열람 |
| pgvector README | pgvector | https://github.com/pgvector/pgvector | 열람 |
| Weaviate Database documentation | Weaviate | https://docs.weaviate.io/weaviate | 열람 |
| Chroma – Introduction | Chroma | https://docs.trychroma.com/docs/overview/introduction | 열람 |
| Rerank overview | Cohere | https://docs.cohere.com/docs/rerank-overview | 열람 |

### 클라우드 참조 구조·에이전트·운영
| 제목 | 기관 | URL | 열람 |
|---|---|---|---|
| Baseline Microsoft Foundry chat reference architecture | Microsoft | https://learn.microsoft.com/en-us/azure/architecture/ai-ml/architecture/baseline-microsoft-foundry-chat | 열람(끝부분 일부 제외) |
| Use interface VPC endpoints (AWS PrivateLink) with Amazon Bedrock | AWS | https://docs.aws.amazon.com/bedrock/latest/userguide/vpc-interface-endpoints.html | 열람 |
| LangGraph – Interrupts / Persistence | LangChain | https://docs.langchain.com/oss/python/langgraph/interrupts | 열람(2쪽) |
| Langfuse Documentation | Langfuse | https://langfuse.com/docs | 열람 |
| MLflow Model Registry | MLflow | https://mlflow.org/docs/latest/ml/model-registry/ | 열람 |

### 국내 규정·가이드
| 제목 | 기관 | URL | 열람 |
|---|---|---|---|
| 「금융분야 망분리 개선 로드맵」 발표 (2024-08-13 보도자료) | 금융위원회 | https://www.fsc.go.kr/po010101/82885 | 열람 |
| 생성형 인공지능(AI) 개발·활용 위한 개인정보 처리 기준 제시한다 (2025-08-06 보도자료) | 개인정보보호위원회 | https://pipc.go.kr/np/cop/bbs/selectBoardArticle.do?bbsId=BS074&mCode=C020010000&nttId=11410 | 열람(안내서 PDF 미열람) |
| 공공 AX 프라이버시 보호 안내서(2026.7.) 게시물 | 개인정보보호위원회 | https://www.pipc.go.kr/np/cop/bbs/selectBoardArticle.do?bbsId=BS217&mCode=D010030000&nttId=12436 | 열람(PDF 미열람) |
| 2026년 국가 망 보안체계(N2SF) 도입 지원사업 모집 공고 | 한국인터넷진흥원 | https://www.kisa.or.kr/401/form?postSeq=3626 | 열람(모델 목록은 이미지라 못 읽음) |
| 국가 망 보안체계(N2SF) 실증 사례집 게시물 (2026-04-13) | 한국인터넷진흥원 | https://kisa.or.kr/20604/form?lang_type=KO&page=&postSeq=23171 | 열람(PDF 미열람) |
| 챗GPT 등 생성형 AI 활용 보안 가이드라인 (2023.6) | 국가정보원 국가사이버안보센터 | https://www.ncsc.go.kr:4018/main/cop/bbs/selectBoardArticle.do?bbsId=InstructionGuide_main&nttId=54340&pageIndex=1 | 실패(404) |
| 국가사이버안보센터 누리집(지침·가이드) | 국가정보원 | https://www.ncsc.go.kr/ | 실패(임시 페이지) |
| (보조) 국정원, N²SF 가이드라인 1.0 정식 버전 공개 (2025-09-30) | 바이라인네트워크 | https://byline.network/2025/09/30-445/ | 열람 |
| (보조) 국정원, '국가 망 보안체계' 정책 제시...N²SF 가이드라인 발표 (2025-01-23) | 보안뉴스 | http://www.boannews.com/news/articleView.html?idxno=135736 | 열람 |
| (보조) 국정원 AI 보안 가이드북 배포 (2025-12-10) | CIO Korea | https://www.cio.com/article/4103809/ | 열람 |
