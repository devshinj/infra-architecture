# 운영 안전망 (묶음 B) 설계

2026-11-27. 서비스 검토 뒤 개선 묶음 A~F 중 B. A(보안 작은 고침)·C(자원 한도)와 같은 브랜치 `fix/security-hardening` 에 담는다.

## 왜

- 운영 서버를 다시 세우는 방법이 사람의 기억에만 있다. Dockerfile·배포 문서·백업·헬스체크가 없다.
- CI 가 없어서 통합 테스트를 잊고 합치면 잠금·권한 회귀가 그대로 운영에 들어간다.
- DB 가 잠깐 끊기거나 남의 구성도 주소를 열면 Next 기본 오류 화면(영어, 안내 없음)이 뜬다.
- worktree 가 여럿인데 통합·E2E 가 같은 테스트 DB(`infrasketch_test`)를 쓴다. 한쪽 실행이 다른 쪽 데이터를 지운다.

## 목표

- 서버 한 대에서 `deploy/` 의 compose 하나로 DB·앱·HTTPS 프록시·백업을 띄운다.
- 배포는 스크립트 하나(빌드 → 배포 전 백업 → 마이그레이션 → 교체 → 헬스 확인)이고, 되돌리기는 명령 한 줄이다.
- 매일 백업하고 7일 보관한다. 복구 연습을 명령 하나로 할 수 있다.
- PR 과 main push 마다 lint·단위·빌드·타입·통합 테스트와 Docker 빌드를 돌린다.
- 오류·없는 화면이 한국어 안내와 돌아갈 길을 보인다.
- worktree 마다 테스트 DB 가 따로다.

## 하지 않는 것

- 이미지 레지스트리, 여러 서버, 무중단 배포(교체 중 몇 초 끊김은 받아들인다).
- 컨테이너가 켜질 때 자동 마이그레이션.
- E2E 를 CI 에서 돌리기(느리다. 수동 실행으로 시작한다).
- 오류 알림(메일·메신저). 실패 관측은 묶음 D.

## 사용자가 정한 것 (2026-11-27, "추천대로")

| 항목 | 고른 것 |
|---|---|
| 앞단 프록시 | compose 에 Caddy 를 넣는다 |
| 이미지 빌드 | 서버에서 `git pull` 뒤 `docker compose build` |
| 백업 | compose 의 백업 컨테이너(매일 `pg_dump`, 7일 보관) |
| 마이그레이션 | 배포 절차에서 명령으로 따로 돌린다 |

검토 때 정한 범위: CI 는 GitHub Actions(lint·타입·단위·통합, PR 과 main push), 공개 `/api/health` 는 DB 연결만 확인, 오류 화면은 `not-found`·`error`·`global-error`, worktree 마다 테스트 DB 이름을 다르게, 고정 200ms 대기 6곳을 조건 대기로.

## 접근

| 갈래 | 고른 것 | 다른 길과 이유 |
|---|---|---|
| 앱 이미지 | Next `output: "standalone"` 을 Docker 빌드 때만 켠다(`NEXT_OUTPUT=standalone`) | 늘 켜면 E2E·로컬의 `next start` 가 경고를 낸다. 전체 `node_modules` 를 싣는 이미지는 1GB 를 넘는다. |
| 마이그레이션 도구 | 같은 Dockerfile 의 `tools` 단계(전체 의존성 + 소스)를 `profiles: [tools]` 로 둔다 | standalone 이미지에는 drizzle-kit·tsx 가 없다. 따로 스크립트를 쓰면 `db:migrate` 와 두 갈래가 된다. |
| 되돌리기 | 배포 스크립트가 빌드 전에 지금 이미지를 `:previous` 로 꼬리표 붙인다 | 커밋 해시 꼬리표는 `.env` 를 고쳐야 하고, 다시 빌드하면 몇 분 걸린다. |
| 백업 일정 | `postgres:16` 컨테이너 안 셸 반복(다음 03:00 까지 잠든다) | cron 이미지를 따로 만들 필요가 없다. 같은 pg_dump 버전이 보장된다. |
| 테스트 DB | `DATABASE_URL_TEST`(없으면 5433 의 `infrasketch_test`)의 이름에 폴더 이름·경로 해시를 붙이고, 없으면 만든다 | 설정으로 나누면 worktree 마다 `.env` 를 손봐야 하고, 잊으면 다시 섞인다. |

## 세부

### 헬스체크
- `GET /api/health`: 로그인 없이 연다. DB 에 `select 1` 을 3초 안에 못 하면 503 `{status:"down"}`, 되면 200 `{status:"ok"}`. 오류 내용은 내보내지 않는다. 캐시하지 않는다.
- AI 서버 상태는 넣지 않는다(꺼져 있어도 앱은 뜬다, 로그인한 사람용 `/api/llm/health` 가 따로 있다).

### 오류 화면
- 한 부품(`src/ui/StatusScreen.tsx`): 점 격자 바탕 위 가운데 판(눈금 테두리), 로고 마크, 화면 제목, 설명, 동작 단추.
- 루트 `not-found`: "찾는 화면이 없어요" + 「내 구성도로」.
- 구성도 경로 `not-found`(셸 안): "없거나 볼 수 없는 구성도예요" + 계정 확인 안내 + 「내 구성도로」. 인수인계 받은 주소를 다른 계정으로 연 사람이 이 화면을 본다.
- `(app)/error`(셸 안)·루트 `error`·`global-error`: "화면을 불러오지 못했어요" + 「다시 시도」(연두 하나) + 「내 구성도로」 + 오류 번호(digest, 서버 로그와 맞춰 보는 값).

### Docker·compose (`deploy/`)
- 서비스: `db`(포트를 밖으로 열지 않음), `app`(standalone, node 사용자, 헬스체크), `caddy`(80·443, `SITE_ADDRESS`, ndjson 스트림을 바로 흘림), `backup`, `tools`(profile).
- `DATABASE_URL` 은 compose 가 `POSTGRES_PASSWORD` 로 만든다. `TRUSTED_PROXY_HOPS` 기본 1(Caddy 는 들어온 x-forwarded-for 를 버리고 제 값을 쓴다).
- 비밀값은 `deploy/.env`(저장소에 올리지 않음). 예시는 `deploy/env.example`.

### 배포 절차 (`deploy/deploy.sh`)
1. (사람이) `git pull`
2. 지금 앱 이미지를 `:previous` 로 꼬리표
3. `app`·`tools` 빌드
4. DB·백업 켜기 → 배포 전 백업 한 번
5. `tools` 로 `drizzle-kit migrate`
6. 앱·Caddy 교체 → `/api/health` 가 200 이 될 때까지 최대 90초 기다림

되돌리기: `deploy/rollback.sh`(`:previous` 를 `:latest` 로 다시 붙이고 앱만 교체). 마이그레이션은 전진만 있으므로, 새 마이그레이션이 옛 앱과 맞지 않으면 배포 전 백업으로 복구한다.

### 백업
- 매일 `BACKUP_AT`(기본 03:00, Asia/Seoul)에 `pg_dump -Fc`, `BACKUP_KEEP_DAYS`(기본 7)일 지난 파일을 지운다. 켤 때 24시간 안의 백업이 없으면 바로 한 번 뜬다.
- 헬스체크: 26시간 안의 백업 파일이 없으면 unhealthy(`docker compose ps` 로 보인다).
- `backup.sh check <파일>`: 임시 DB 에 복구해 표마다 행 수를 찍고 지운다(복구 연습).

### CI (`.github/workflows/ci.yml`)
- `check` 작업: Postgres 16 서비스, `npm ci` → lint → 단위 → `next build`(가짜 비밀값) → `tsc` → 통합.
- `docker` 작업: `docker build --target runner`(올리지 않음).

### 테스트 격리
- `tests/test-db.ts`: 폴더별 테스트 DB 주소와 "없으면 만들기".
- 통합 setup·E2E global-setup·playwright 설정이 이것을 쓴다. E2E 는 서버를 켜기 전에 DB 를 만들고 마이그레이션한다(Playwright 는 webServer 를 globalSetup 보다 먼저 켠다).
- E2E 포트는 `E2E_PORT`·`E2E_FAKE_PORT` 로 바꿀 수 있다(기본 3100·3199).
- 잠금을 쥔 채 200ms 를 자는 6곳은 "잠금 안에 들어왔다"를 기다리는 도우미로 바꾼다.

## 확인

- 헬스 라우트·공개 경로·오류 화면·테스트 DB 이름은 단위 테스트, 헬스 DB 확인은 통합 테스트.
- 이 컴퓨터에서 `deploy/` compose 를 다른 프로젝트 이름·포트로 실제로 띄워 배포 스크립트·헬스·백업·복구 연습·되돌리기를 돌려 본다.

## 배포할 때 볼 것

- 지금 운영이 어떻게 떠 있는지 모른다. 옮길 때는 옛 DB 를 `pg_dump` 해서 새 `db` 에 `pg_restore` 한다(`docs/deploy.md`).
- `SITE_ADDRESS` 가 공인 DNS 이름이면 Caddy 가 인증서를 받는다. 사내 이름이면 `http://` 로 두거나 Caddyfile 에 `tls internal` 을 넣는다.
- Caddy 앞에 사내 프록시가 하나 더 있으면 `TRUSTED_PROXY_HOPS=2` 가 아니라 Caddy `trusted_proxies` 를 설정해야 한다(Caddy 는 믿지 않는 x-forwarded-for 를 버린다).
- 백업 파일은 같은 서버 디스크에 있다. 서버째 잃는 경우를 막으려면 `BACKUP_DIR` 을 다른 디스크·NAS 로 둔다.

## 빌더에게 남긴 것

화면 문구 세부, 헬스체크 간격, Caddy 압축 설정.
