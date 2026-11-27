# 운영 배포

서버 한 대에서 `deploy/` 의 Docker compose 로 DB·앱·HTTPS 프록시·백업을 함께 띄웁니다. 명령은 모두 서버의 `deploy/` 폴더에서 실행합니다.

| 서비스 | 하는 일 |
| --- | --- |
| `db` | PostgreSQL 16. 포트를 밖으로 열지 않습니다. 데이터는 `db_data` 볼륨에 있습니다. |
| `app` | InfraSketch(Next.js standalone). `/api/health` 로 헬스체크합니다. |
| `caddy` | 80·443 을 열고 앱으로 넘깁니다. 공인 DNS 이름이면 HTTPS 인증서를 자동으로 받습니다. |
| `backup` | 매일 03:00 `pg_dump`, 7일 보관. 26시간 안의 백업이 없으면 unhealthy 로 보입니다. |
| `tools` | 마이그레이션과 일회성 스크립트. 늘 떠 있지 않고 `docker compose run --rm tools` 로만 씁니다. |

저장소 맨 위의 `docker-compose.yml` 은 개발용입니다. 운영에 쓰지 마세요.

## 준비물

- Docker Engine 과 Docker Compose v2.20 이상(`docker compose version`)
- git, 그리고 서버에서 이 저장소를 받을 수 있는 권한
- 메모리 2GB 이상(이미지를 서버에서 빌드합니다)

## 처음 세우기

```bash
git clone <저장소 주소> infrasketch && cd infrasketch/deploy
cp .env.example .env
```

`.env` 를 채웁니다. 꼭 넣어야 하는 값은 넷입니다.

| 값 | 넣을 것 |
| --- | --- |
| `SITE_ADDRESS` | 사람들이 여는 주소. 공인 DNS 이름(`sketch.example.com`)이면 HTTPS, 사내 이름·IP 는 `http://sketch.intra` 처럼 `http://` 를 붙입니다. |
| `APP_URL` | 같은 주소를 `https://` 나 `http://` 로. 재설정 메일·MCP 응답의 링크와 로그인 이동 주소(compose 가 `AUTH_URL` 로 넘김)에 쓰입니다. |
| `POSTGRES_PASSWORD` | 영문·숫자만. `openssl rand -hex 24` |
| `AUTH_SECRET` | 32자 이상. `openssl rand -hex 32`. 짧으면 앱이 켜지지 않습니다. |

메일 서버가 없으면 `RESET_LINK_LOG=1` 을 넣어야 비밀번호 재설정 링크를 앱 로그에서 볼 수 있습니다. AI 서버 값은 비워 두면 AI 기능만 꺼집니다.

```bash
./deploy.sh
curl -fsS https://sketch.example.com/api/health   # {"status":"ok"}
```

옛 운영 DB 가 있으면 `./deploy.sh` 전에 아래 「옛 서버에서 옮기기」를 먼저 합니다.

## 옛 서버에서 옮기기

1. 옛 앱을 멈춥니다(덤프하는 동안 들어온 쓰기는 빠집니다).
2. 옛 DB 를 덤프합니다.

   ```bash
   pg_dump -Fc -h <옛 DB 주소> -U <사용자> -d infrasketch -f old.dump
   ```

3. 새 서버에서 DB 만 켜고 덤프를 넣습니다. `BACKUP_DIR`(기본 `deploy/backups`)에 파일을 두면 백업 컨테이너에서 보입니다.

   ```bash
   docker compose up -d --wait db
   docker compose up -d backup
   cp old.dump backups/
   docker compose exec backup pg_restore --no-owner --exit-on-error -d infrasketch /backups/old.dump
   ```

4. `./deploy.sh` 로 앱을 띄웁니다. 옛 DB 에 없던 마이그레이션은 이때 적용됩니다.
5. 옛 서버에서 `npm run backfill:commands -- --apply` 를 돌린 적이 없다면 한 번 돌립니다. 먼저 미리보기로 개수를 보고, 여러 번 돌려도 결과는 같습니다.

   ```bash
   docker compose run --rm tools npx tsx scripts/backfill-message-commands.ts
   docker compose run --rm tools npx tsx scripts/backfill-message-commands.ts --apply
   ```

## 새 버전 배포

```bash
git pull
./deploy.sh
```

`deploy.sh` 가 하는 일입니다.

1. 지금 앱 이미지를 `infrasketch-app:previous` 로 남깁니다.
2. 앱·도구 이미지를 빌드합니다. 몇 분 걸리고, 그동안 지금 앱은 그대로 돕니다.
3. 배포 전 백업을 한 번 뜹니다.
4. 마이그레이션을 적용합니다(`drizzle-kit migrate`). 실패하면 여기서 멈추고 지금 앱은 그대로 돕니다.
5. 앱을 새 이미지로 바꾸고 헬스체크가 통과할 때까지 최대 120초 기다립니다. 바꾸는 동안 몇 초 접속이 끊깁니다.

배포하기 전에 `deploy/` 나 `Dockerfile` 이 바뀌었는지 `git log -p -- deploy Dockerfile` 로 확인하세요. `.env.example` 에 새 값이 생겼으면 `.env` 에도 넣습니다.

## 되돌리기

앱만 직전 이미지로 돌립니다.

```bash
./rollback.sh
```

되돌린 이미지는 `infrasketch-app:rolled-back` 으로 남아 원인을 볼 수 있습니다. 마이그레이션은 전진만 있어서 DB 는 그대로입니다. 지금까지의 마이그레이션은 모두 표·열을 더하는 것이라 옛 앱이 새 DB 에서 돕니다.

### DB 까지 되돌리기

새 마이그레이션이 옛 앱과 맞지 않을 때만 합니다. 배포 전 백업 뒤에 들어온 쓰기는 사라집니다.

```bash
ls -t backups | head -3                       # 배포 시각 직전 파일을 고른다
docker compose stop app
docker compose exec backup pg_restore --clean --if-exists --no-owner --exit-on-error -d infrasketch /backups/<배포 전 파일>
./rollback.sh
```

## 백업

- 파일: `BACKUP_DIR`(기본 `deploy/backups`)의 `infrasketch-YYYYMMDD-HHMMSS.dump`(pg_dump 사용자 지정 형식)
- 일정: 매일 `BACKUP_AT`(기본 03:00, Asia/Seoul). `BACKUP_KEEP_DAYS`(기본 7)일 지난 파일은 지웁니다. 배포 전 백업도 같은 규칙으로 지워집니다.
- 상태: `docker compose ps backup` 이 unhealthy 면 26시간 동안 백업이 없었다는 뜻입니다. `docker compose logs backup` 으로 원인을 봅니다.
- 지금 한 번: `docker compose exec backup sh /backup.sh once`

백업 파일은 같은 서버 디스크에 있습니다. 서버째 잃는 경우에 대비하려면 `BACKUP_DIR` 을 다른 디스크나 NAS 경로로 두세요.

### 복구 연습

백업이 실제로 복구되는지 임시 DB 에 풀어 봅니다. 운영 DB 는 건드리지 않고, 끝나면 임시 DB 를 지웁니다.

```bash
docker compose exec backup sh /backup.sh check $(ls -t backups | head -1)
```

마이그레이션 수와 표마다 행 수가 나오면 됩니다. 처음 세운 뒤 한 번, 그 뒤로는 분기마다 한 번 해 보기를 권합니다.

## 자주 쓰는 명령

```bash
docker compose ps                         # 상태(헬스 포함)
docker compose logs -f app                # 앱 로그. 재설정 링크([reset-link])와 시작 검사([env])도 여기
docker compose restart app
docker compose exec db psql -U infrasketch # DB 셸
```

## 설정 메모

- **HTTPS**: `SITE_ADDRESS` 가 공인 DNS 이름이고 80·443 이 밖에서 닿으면 Caddy 가 인증서를 받습니다. 사내 이름은 `http://` 로 열거나, `Caddyfile` 블록에 `tls internal` 을 넣고 사용자 브라우저가 Caddy 루트 인증서를 믿게 합니다. HTTPS 로만 쓰게 되면 `Strict-Transport-Security` 헤더를 더하는 것을 검토하세요.
- **접속 IP**: Caddy 는 들어온 `x-forwarded-for` 를 버리고 접속한 주소로 새로 씁니다. 그래서 `TRUSTED_PROXY_HOPS=1` 입니다. Caddy 앞에 사내 프록시가 하나 더 있으면, 이 값을 바꾸지 말고 `Caddyfile` 에 `trusted_proxies` 로 그 프록시 주소를 넣습니다. 그러지 않으면 모든 사용자가 프록시 IP 하나로 세어져 로그인·가입 횟수 제한에 함께 걸립니다.
- **DB 비밀번호 바꾸기**: `.env` 만 바꾸면 이미 만들어진 DB 와 맞지 않습니다. `docker compose exec db psql -U infrasketch -c "alter user infrasketch password '<새 값>'"` 뒤에 `.env` 를 바꾸고 `docker compose up -d` 합니다.
- **AUTH_SECRET 바꾸기**: 모든 사용자가 로그아웃됩니다.
- **DB 연결 수**: 앱은 공용 10 + 구성도 잠금 최대 20(`DB_LOCK_POOL_MAX`)개를 씁니다. Postgres 기본 한도(100) 안입니다.

## 문제 해결

| 증상 | 볼 곳 |
| --- | --- |
| `deploy.sh` 가 앱 교체에서 시간 초과 | `docker compose logs app`. `[env]` 줄이 있으면 `.env` 값(AUTH_SECRET 길이, APP_URL)을 고칩니다. |
| 브라우저에 502 | 앱이 아직 뜨는 중이거나 죽었습니다. `docker compose ps app` |
| `/api/health` 가 503 | 앱이 DB 에 닿지 않습니다. `docker compose ps db`, `docker compose logs db` |
| 로그인했는데 로그인 화면이 보임 | DB 가 끊기면 세션을 확인하지 못해 로그인 화면을 보입니다. 세션은 지워지지 않아 DB 가 돌아오면 그대로 이어집니다. `/api/health` 로 DB 상태를 봅니다. |
| 로그인 뒤 `0.0.0.0:3000` 으로 이동 | `APP_URL` 이 비었거나 틀렸습니다. compose 는 이 값을 `AUTH_URL` 로 넘깁니다. |
| 인증서를 못 받음 | `docker compose logs caddy`. DNS 가 이 서버를 가리키는지, 80·443 이 밖에서 열려 있는지 |
