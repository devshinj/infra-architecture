---
sidebar_position: 2
title: 시작하기
---

# 시작하기

## 준비물

- Node.js 22
- Docker (PostgreSQL 실행용)

## 실행 방법

1. 의존성을 설치합니다.

   ```bash
   npm install
   ```

2. 데이터베이스를 실행합니다.

   ```bash
   docker compose up -d db
   ```

3. 프로젝트 루트에 `.env` 파일을 만들고 값을 채웁니다. 자세한 항목은 `.env.example` 을 참고하세요.

   ```env
   # 필수
   DATABASE_URL=postgres://postgres:postgres@localhost:5432/infrasketch
   AUTH_SECRET=아주-긴-무작위-문자열

   # 권장
   APP_URL=http://localhost:3000
   ```

   `DATABASE_URL` 과 `AUTH_SECRET` 이 없으면 앱이 시작되지 않습니다.

4. 데이터베이스 마이그레이션을 실행합니다. 새 버전을 받은 뒤에도 다시 실행해야 합니다.

   ```bash
   npm run db:migrate
   ```

5. 개발 서버를 실행하고 http://localhost:3000 에 접속합니다.

   ```bash
   npm run dev
   ```

## AI 서버 설정 (선택)

AI 값을 모두 비워 두어도 앱은 시작됩니다. 이 경우 AI 대화 기능만 꺼집니다. 키는 `.env` 에만 넣고 저장소에 올리지 마세요.

| 변수 | 용도 |
| --- | --- |
| `QWEN_CODER_KEY`, `QWEN_MODEL`, `QWEN_API_URL` | 생성 모델 (OpenAI 호환 서버) |
| `CLEF_API_KEY`, `CLEF_API_URL`, `CLEF_MAX_CONCURRENCY` | 의도 분류 등 판정 모델 |

로그인한 상태에서 `GET /api/llm/health` 로 연결 상태를 확인할 수 있습니다. 각 항목은 `ok`, `missing`, `down` 중 하나이며 결과는 60초 동안 캐시됩니다.

실제 AI 서버를 점검하려면 다음 명령을 실행합니다. DB 를 쓰지 않고, 키는 출력하지 않습니다.

```bash
npm run smoke:llm
```

## 테스트

| 명령 | 설명 | 사전 준비 |
| --- | --- | --- |
| `npm test` | 단위 테스트 | 없음 |
| `npm run test:int` | 통합 테스트 | `docker compose up -d db_test` (5433 포트) |
| `npm run test:e2e` | 브라우저 E2E | `npx playwright install chromium` |
