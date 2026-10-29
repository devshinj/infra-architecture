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

## 테스트

| 명령 | 설명 | 사전 준비 |
| --- | --- | --- |
| `npm test` | 단위 테스트 | 없음 |
| `npm run test:int` | 통합 테스트 | `docker compose up -d db_test` (5433 포트) |
| `npm run test:e2e` | 브라우저 E2E | `npx playwright install chromium` |
