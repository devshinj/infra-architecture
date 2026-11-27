# InfraSketch

대화로 서비스를 설명하면 인프라 구성도를 그려 주고, 변경 이력과 버전 비교까지 보여 주는 인프라 구성도 시각화 도구입니다.

## 준비물

- Node.js 22
- Docker (PostgreSQL 실행용)

## 실행 방법

1. 의존성 설치

   ```bash
   npm install
   ```

2. 데이터베이스 실행

   ```bash
   docker compose up -d db
   ```

3. 프로젝트 루트에 `.env` 파일을 만들고 아래 값을 채웁니다. (`.env.example` 참고)

   ```env
   # 필수
   DATABASE_URL=postgres://postgres:postgres@localhost:5432/infrasketch
   AUTH_SECRET=아주-긴-무작위-문자열   # `npx auth secret` 으로 만들거나 32자 이상의 임의 문자열 사용

   # 권장 (운영에서는 필수)
   APP_URL=http://localhost:3000
   # 프록시 뒤에서 실행할 때만
   # AUTH_URL=https://example.com
   # 앞단 프록시 수. 한 겹이면 1, 프록시 없이 바로 열면 0. 비워 두면 x-forwarded-for 의 첫 값을 믿습니다.
   # TRUSTED_PROXY_HOPS=1

   # 선택: 메일 발송(비밀번호 재설정). 비워 두면 개발 서버에서는 재설정 링크가 서버 로그에 출력됩니다.
   # SMTP_HOST=
   # SMTP_PORT=
   # SMTP_USER=
   # SMTP_PASS=
   # SMTP_FROM=
   # 운영에서 메일 서버 없이 쓸 때만: 재설정 링크를 서버 로그에 남깁니다.
   # RESET_LINK_LOG=1
   # 선택: 구성도 잠금 전용 DB 연결 수의 천장(기본 20). 공용 풀 10개와 합쳐 DB 의 max_connections 안이어야 합니다.
   # DB_LOCK_POOL_MAX=20
   ```

   `DATABASE_URL` 과 `AUTH_SECRET` 이 없으면 앱이 시작되지 않습니다.

   운영(`next start`)으로 켤 때는 더 엄격합니다. `AUTH_SECRET` 이 32자 미만이거나 `APP_URL` 이 없으면 이유를 적고 켜지 않습니다. `SMTP_HOST`·`TRUSTED_PROXY_HOPS` 가 없으면 경고만 남깁니다. 운영에서는 `SMTP_HOST` 가 없어도 재설정 링크를 로그에 남기지 않습니다(`RESET_LINK_LOG=1` 로 켠 때만).

   `docker-compose.yml` 의 DB 는 개발용입니다. 비밀번호가 고정이라 이 컴퓨터(`127.0.0.1`)에서만 붙을 수 있게 열려 있습니다.

4. 데이터베이스 마이그레이션

   ```bash
   npm run db:migrate
   ```

   새 버전을 받은 뒤에도 `npm run db:migrate` 를 다시 실행하세요. 빠뜨리면 새 테이블이 없어 화면이 500 오류를 낼 수 있습니다. 이 명령은 `.env` 를 읽으며, `.env` 파일이 없으면 오류로 끝납니다.

5. 개발 서버 실행 후 http://localhost:3000 접속

   ```bash
   npm run dev
   ```

## AI 서버 설정

AI 대화 기능에 쓰는 선택 값입니다. 모두 비워 두어도 앱은 시작되며, 이 경우 AI 기능만 꺼집니다. 키는 `.env` 에만 넣고 저장소에 올리지 마세요.

```env
# 생성 모델 (OpenAI 호환 서버)
QWEN_CODER_KEY=발급받은-키
QWEN_MODEL=qwen3.8-flash-next
# 내부망 예: 192.168.102.107:8000/v1   외부 예: https://open-llm.cudo.co.kr:8877/v1
# 끝의 /chat/completions 나 /, 스킴 생략은 자동으로 정리됩니다.
QWEN_API_URL=192.168.102.107:8000/v1

# 의도 분류 (Clef, 선택)
CLEF_API_KEY=발급받은-키
CLEF_API_URL=http://192.168.102.105:30000
CLEF_MAX_CONCURRENCY=2
```

로그인한 상태에서 `GET /api/llm/health` 로 연결 상태를 확인할 수 있습니다. 각 항목은 `ok`(정상), `missing`(설정 없음), `down`(연결 실패) 중 하나이며 결과는 60초 동안 캐시됩니다.

대화로 구성도를 그릴 때 사이드바의 **망 지식**(계정 공통 망 종류·기관 연결 규칙)을 보고, 서로 다른 망 사이에 망연계가 필요할 것 같으면 "망연계 필요 예상"으로 안내하거나 `AI 추정` 망연계를 넣어 그립니다(맞아요·아니에요로 확인). 판정이 아니라 예상이니 기관 규정과 방화벽 담당자에게 확인하세요.

### 실제 AI 서버 점검

```bash
npm run smoke:llm
```

`.env` 의 실제 키로 상태 확인, 샘플 시나리오 2개의 구조 생성(첫 명령까지 시간·전체 시간·적용/건너뜀·노드/연결 수), Clef 의도 분류 8문장 정답률을 표로 출력합니다. DB 를 쓰지 않으며 `npm test`·CI 에는 포함되지 않습니다. 키는 출력하지 않고, 연결 실패나 설정 누락이 있으면 0 이 아닌 코드로 끝납니다.

### 의도 분류·명령 점검

```bash
npm run eval:intent              # Clef 판정 + 그 뒤 Qwen 명령
npm run eval:intent -- --clef-only   # 의도 분류만(빠름)
npm run eval:intent -- --repeat 3    # Qwen 을 문장마다 3번(통과 횟수)
npm run eval:intent -- --update      # 지금 결과를 기준으로 저장
```

점검 구성도(`tests/fixtures/intent/diagram.json`, 업무망·인터넷망·흐름 3개)에 `cases.json` 의 문장들을 대화 한 차례와 같은 순서(빠진 정보·참조 노드 → Clef 분류 → 의도에 맞는 지시문 → Qwen 명령)로 돌려, 의도가 기대와 같은지와 Qwen 이 기대한 명령(흐름·구성·연결 값·노드 속성, 질문엔 명령 없음)을 냈는지 표로 보여 줍니다. `baseline.json` 보다 나빠진 문장이 있으면 따로 보여 주고 0 이 아닌 코드로 끝납니다. Clef·Qwen 프롬프트를 고친 뒤에 돌리세요. `npm test`·CI 에는 포함되지 않습니다.

## MCP 연결 (Claude Code·Cursor 등)

MCP 를 쓰는 도구(Claude Code·Cursor 등)에서 내 구성도를 읽고 고치게 할 수 있습니다. 앱이 `/api/mcp` 로 MCP 서버(Streamable HTTP)를 열어 두고, 키로 누구의 구성도인지 가립니다. 이 길은 Qwen·Clef 를 부르지 않습니다.

1. 앱에 로그인해 왼쪽 아래 계정 영역(사이드바가 접혀 있으면 "계정" 버튼)의 **MCP 연결**(`/mcp`, 예전 주소 `/claude-code` 는 이리로 옮겨 줍니다)로 갑니다.
2. 키 이름을 적고 **키 만들기**를 누릅니다. 키(`isk_...`)는 **만들 때 한 번만** 보입니다. 닫으면 다시 볼 수 없으니 바로 복사하세요. 잃어버리면 지우고 새로 만드세요.
3. 화면 오른쪽 「연결 방법」에 주소·헤더와 예가 있습니다. Claude Code 는 터미널에서 아래 명령을(「명령 복사」), 설정 파일을 쓰는 도구는 `mcpServers` 설정을(「설정 복사」) 씁니다. 키를 막 만들었으면 키가 채워져 있습니다.

   ```bash
   claude mcp add --transport http infrasketch <앱 주소>/api/mcp --header "Authorization: Bearer <키>"
   ```

   키를 지웠거나 "키가 맞지 않아요" 오류가 나면 새 키를 만들고, `claude mcp remove infrasketch` 를 실행한 뒤 위 명령을 새 키로 다시 실행하세요.

열어 둔 구성도는 연결한 도구가 바꾼 것을 몇 초 안에 보여 주고, 이력에는 "MCP로"로 남습니다.

도구 10개:

- `get_guide`: 구성도를 그리는 법을 알려 줍니다. 처음 그리기 전에 읽게 됩니다.
- `list_projects`: 내 프로젝트 목록
- `create_project`: 프로젝트 만들기 (첫 구성도 이름은 `diagram_name`)
- `list_diagrams`: 프로젝트의 구성도 목록
- `create_diagram`: 구성도 만들기
- `get_diagram`: 구성도의 지금 내용과 버전 읽기
- `list_versions`: 버전 이력 보기
- `apply_commands`: 명령 적용. 전부 적용하거나 하나도 적용하지 않고, `dry_run` 으로 검사만 할 수 있습니다.
- `restore_version`: 예전 버전으로 되돌리기
- `lookup_terms`: 요청 글에 나온 말을 내 용어 사전에서 찾기

일부러 넣지 않은 것: 프로젝트·구성도 삭제, 망 지식 편집, 계정 설정, Qwen 을 쓰는 기능(대화 생성·설명 만들기 등). 되돌리기 어려운 일은 브라우저에서만 하도록 뺐습니다.

## 테스트

| 명령 | 설명 | 사전 준비 |
| --- | --- | --- |
| `npm test` | 단위 테스트 | 없음 |
| `npm run test:int` | 통합 테스트 | `docker compose up -d db_test` (5433 포트) |
| `npm run test:e2e` | 브라우저 E2E | `npx playwright install chromium`, `docker compose up -d db_test` |

통합·E2E 테스트는 폴더(worktree)마다 따로 DB 를 씁니다. `DATABASE_URL_TEST`(비우면 5433 의 `infrasketch_test`) 서버에, 이름 끝 `_test` 앞에 폴더 이름과 경로 해시를 붙인 DB(예: `infrasketch_infra_hardening_6ecd16_test`)를 처음 돌릴 때 만듭니다. 그래서 다른 worktree 의 테스트가 데이터를 지우지 않습니다. 이름이 `_test` 로 끝나지 않는 DB 주소는 거절합니다. 두 worktree 에서 E2E 를 함께 돌리려면 `E2E_PORT`(기본 3100)·`E2E_FAKE_PORT`(기본 3199)를 바꿉니다.

PR 과 main push 마다 GitHub Actions(`.github/workflows/ci.yml`)가 lint·단위·빌드·타입·통합 테스트와 운영 Docker 이미지 빌드를 돌립니다. E2E 는 넣지 않았습니다.

## 운영 배포

서버 한 대에서 `deploy/` 의 Docker compose 로 DB·앱·HTTPS 프록시(Caddy)·매일 백업을 띄웁니다. 처음 세우기, 옛 서버에서 옮기기, 배포·되돌리기, 백업 복구 연습은 [docs/deploy.md](docs/deploy.md) 에 있습니다.

```bash
cd deploy && cp .env.example .env   # 값을 채운다
./deploy.sh                          # 빌드 → 배포 전 백업 → 마이그레이션 → 교체 → 헬스 확인
./rollback.sh                        # 앱을 직전 이미지로
```

앱은 로그인 없이 `GET /api/health` 로 상태를 알려 줍니다(DB 에 닿으면 200 `{"status":"ok"}`, 아니면 503).
