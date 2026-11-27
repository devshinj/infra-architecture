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

   # 권장 (운영에서는 필수)
   APP_URL=http://localhost:3000
   # 앞단 프록시 수. 한 겹이면 1, 프록시 없이 바로 열면 0. 비워 두면 x-forwarded-for 의 첫 값을 믿습니다.
   # TRUSTED_PROXY_HOPS=1
   # 운영에서 메일 서버 없이 쓸 때만: 재설정 링크를 서버 로그에 남깁니다.
   # RESET_LINK_LOG=1
   # 구성도 잠금 전용 DB 연결 수의 천장(기본 20)
   # DB_LOCK_POOL_MAX=20
   ```

   `DATABASE_URL` 과 `AUTH_SECRET` 이 없으면 앱이 시작되지 않습니다.

   운영(`next start`)으로 켤 때는 더 엄격합니다. `AUTH_SECRET` 이 32자 미만이거나 `APP_URL` 이 없으면 이유를 적고 켜지 않습니다. `SMTP_HOST`·`TRUSTED_PROXY_HOPS` 가 없으면 경고만 남깁니다. 운영에서는 `SMTP_HOST` 가 없어도 재설정 링크를 로그에 남기지 않습니다(`RESET_LINK_LOG=1` 로 켠 때만).

   저장소 맨 위 `docker-compose.yml` 의 DB 는 개발용입니다. 비밀번호가 고정이라 이 컴퓨터(`127.0.0.1`)에서만 붙을 수 있습니다.

4. 데이터베이스 마이그레이션을 실행합니다.

   ```bash
   npm run db:migrate
   ```

   새 버전을 받은 뒤에도 다시 실행해야 합니다. 빠뜨리면 새 테이블이 없어 화면이 500 오류를 낼 수 있습니다(예: 용어 사전·설명 테이블을 추가한 `0002` 마이그레이션). 이 명령은 `.env` 를 읽으며, `.env` 파일이 없으면 오류로 끝납니다.

   이미 쓰던 DB 라면 대화 기록 재생용 명령도 한 번 채워 둡니다. 차례마다 적용한 명령을 저장하기 전에 만든 AI 답에, 버전 차이로 되살린 명령을 넣습니다(“아키텍처 › 대화 기록 재생” 참고). 기본은 미리보기이고, 여러 번 돌려도 결과가 같습니다.

   ```bash
   npm run backfill:commands              # 미리보기(개수만)
   npm run backfill:commands -- --apply   # 적용
   ```

5. 개발 서버를 실행하고 http://localhost:3000 에 접속합니다.

   ```bash
   npm run dev
   ```

   개발 서버는 `.next-dev` 폴더에 빌드합니다. `npm run build` 는 `.next`, E2E 는 `.next-e2e` 를 써서, 개발 서버를 띄운 채 빌드나 E2E 를 돌려도 서로의 폴더를 덮어쓰지 않습니다(`next.config.ts` 의 `distDir`).

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

Clef·Qwen 프롬프트를 고친 뒤에는 의도 분류와 그 뒤 Qwen 명령을 점검합니다. 점검 구성도(`tests/fixtures/intent/diagram.json`)에 `cases.json` 의 문장들을 대화 한 차례와 같은 순서로 돌리고, 기준 파일(`baseline.json`)보다 나빠진 문장이 있으면 0 이 아닌 코드로 끝납니다.

```bash
npm run eval:intent                  # Clef 판정 + 그 뒤 Qwen 명령
npm run eval:intent -- --clef-only   # 의도 분류만(빠름)
npm run eval:intent -- --repeat 3    # Qwen 을 문장마다 3번(통과 횟수)
npm run eval:intent -- --update      # 지금 결과를 기준으로 저장
npm run eval:intent -- --only a,b --dump out.jsonl   # 고른 문장만, 모델이 낸 명령을 파일로(원인 조사용)
```

학습 모드 대본이나 단계 판정(`domain/guides/judge.ts`, `server/guide/judge.ts`)을 고친 뒤에는 단계 판정을 점검합니다. 주제별 평가 문장을 실제 Clef 로 판정해 기준 파일(`tests/fixtures/guide/baseline.json`)보다 나빠진 문장이 있으면 0 이 아닌 코드로 끝납니다. DB 를 쓰지 않고 `npm test` 에는 들어가지 않습니다.

```bash
npm run eval:guide                     # 전체 문장을 한 번씩
npm run eval:guide -- --repeat 3       # 문장마다 3번(모두 기대와 같아야 맞음)
npm run eval:guide -- --only a,b       # 고른 문장만
npm run eval:guide -- --threshold 0.5  # 다른 판정 기준으로 돌려 보기(저장하지 않음)
npm run eval:guide -- --repeat 3 --update   # 지금 결과를 기준으로 저장(나빠진 문장이 있으면 --force 도 필요)
```

학습 모드는 `guide_runs` 테이블이 필요하므로 마이그레이션(`0011`, `0012`)을 먼저 실행해 두세요.

## Claude Code 연결 (선택)

Claude Code 에서 내 구성도를 읽고 고치게 할 수 있습니다. 앱에 로그인해 사이드바 아래 계정 영역의 **Claude Code 연결**(`/claude-code`)에서 키(`isk_...`)를 만듭니다. 키는 만들 때 한 번만 보이니 바로 복사하세요. 그다음 Claude Code 터미널에서 실행합니다.

```bash
claude mcp add --transport http infrasketch <앱 주소>/api/mcp --header "Authorization: Bearer <키>"
```

“키가 맞지 않아요” 오류가 나면 새 키를 만들고 `claude mcp remove infrasketch` 뒤에 위 명령을 새 키로 다시 실행합니다. 새 테이블(`mcp_keys`)이 필요하므로 마이그레이션(`0008`)을 먼저 실행해 두세요. 자세한 동작은 [아키텍처](./architecture.md) 의 “Claude Code 연동”을 참고하세요.

## 테스트

| 명령 | 설명 | 사전 준비 |
| --- | --- | --- |
| `npm test` | 단위 테스트 | 없음 |
| `npm run test:int` | 통합 테스트 | `docker compose up -d db_test` (5433 포트) |
| `npm run test:e2e` | 브라우저 E2E | `npx playwright install chromium`, `docker compose up -d db_test` |

E2E 는 앱을 `.next-e2e` 에 따로 빌드한 뒤 띄웁니다.

통합·E2E 테스트는 폴더(worktree)마다 따로 DB 를 씁니다. `DATABASE_URL_TEST`(비우면 5433 의 `infrasketch_test`) 서버에, 이름 끝 `_test` 앞에 폴더 이름과 경로 해시를 붙인 DB(예: `infrasketch_infra_hardening_6ecd16_test`)를 처음 돌릴 때 만듭니다(`tests/test-db.ts`). 그래서 다른 worktree 의 테스트가 데이터를 지우지 않습니다. 두 worktree 에서 E2E 를 함께 돌리려면 `E2E_PORT`(기본 3100)·`E2E_FAKE_PORT`(기본 3199)를 바꿉니다.

PR 과 main push 마다 GitHub Actions(`.github/workflows/ci.yml`)가 lint·단위·빌드·타입·통합 테스트와 운영 Docker 이미지 빌드를 돌립니다. E2E 는 넣지 않았습니다.

## 운영 배포

서버 한 대에서 `deploy/` 의 Docker compose 로 DB·앱·HTTPS 프록시(Caddy)·매일 백업을 띄웁니다. 처음 세우기, 옛 서버에서 옮기기, 배포·되돌리기, 백업 복구 연습은 저장소의 `docs/deploy.md` 에 있습니다.

```bash
cd deploy && cp .env.example .env   # 값을 채운다
./deploy.sh                          # 빌드 → 배포 전 백업 → 마이그레이션 → 교체 → 헬스 확인
./rollback.sh                        # 앱을 직전 이미지로
```

앱은 로그인 없이 `GET /api/health` 로 상태를 알려 줍니다(DB 에 닿으면 200 `{"status":"ok"}`, 아니면 503).
