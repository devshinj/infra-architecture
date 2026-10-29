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
   AUTH_SECRET=아주-긴-무작위-문자열   # `npx auth secret` 으로 만들거나 긴 임의 문자열 사용

   # 권장
   APP_URL=http://localhost:3000
   # 프록시 뒤에서 실행할 때만
   # AUTH_URL=https://example.com

   # 선택: 메일 발송(비밀번호 재설정). 비워 두면 재설정 링크가 서버 로그에 출력됩니다.
   # SMTP_HOST=
   # SMTP_PORT=
   # SMTP_USER=
   # SMTP_PASS=
   # SMTP_FROM=
   ```

   `DATABASE_URL` 과 `AUTH_SECRET` 이 없으면 앱이 시작되지 않습니다.

4. 데이터베이스 마이그레이션

   ```bash
   npm run db:migrate
   ```

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

### 실제 AI 서버 점검

```bash
npm run smoke:llm
```

`.env` 의 실제 키로 상태 확인, 샘플 시나리오 2개의 구조 생성(첫 명령까지 시간·전체 시간·적용/건너뜀·노드/연결 수), Clef 의도 분류 8문장 정답률을 표로 출력합니다. DB 를 쓰지 않으며 `npm test`·CI 에는 포함되지 않습니다. 키는 출력하지 않고, 연결 실패나 설정 누락이 있으면 0 이 아닌 코드로 끝납니다.

## 테스트

| 명령 | 설명 | 사전 준비 |
| --- | --- | --- |
| `npm test` | 단위 테스트 | 없음 |
| `npm run test:int` | 통합 테스트 | `docker compose up -d db_test` (5433 포트) |
| `npm run test:e2e` | 브라우저 E2E | `npx playwright install chromium` |
