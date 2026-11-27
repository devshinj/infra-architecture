#!/usr/bin/env bash
# 배포. 먼저 git pull(또는 배포할 커밋 checkout)을 한 뒤 이 폴더에서 ./deploy.sh
#   지금 앱 이미지를 :previous 로 남김 → 빌드 → DB·백업 켜기 → 배포 전 백업 → 마이그레이션 → 앱·Caddy 교체 → 헬스 확인
# 되돌리기는 ./rollback.sh (docs/deploy.md)
set -euo pipefail
cd "$(dirname "$0")"
# Windows Git Bash 에서 돌릴 때 컨테이너 안 경로(/backup.sh)를 C:/Program Files/Git/... 로 바꾸지 않게 한다. 리눅스에서는 아무 일도 하지 않는다.
export MSYS_NO_PATHCONV=1

log() { printf '\n[deploy] %s\n' "$*"; }

[ -f .env ] || { echo "[deploy] deploy/.env 가 없다. .env.example 을 복사해 채워 주세요." >&2; exit 1; }

if docker image inspect infrasketch-app:latest >/dev/null 2>&1; then
  log "지금 앱 이미지를 infrasketch-app:previous 로 남긴다"
  docker image tag infrasketch-app:latest infrasketch-app:previous
fi

log "이미지 빌드 ($(git rev-parse --short HEAD 2>/dev/null || echo '커밋 모름'))"
docker compose build app tools

log "DB·백업 켜기"
docker compose up -d --wait db
docker compose up -d backup

log "배포 전 백업"
docker compose exec -T backup sh /backup.sh once

log "마이그레이션"
docker compose run --rm tools

log "앱·Caddy 교체(헬스체크가 통과할 때까지 기다린다)"
docker compose up -d --wait --wait-timeout 120 app
docker compose up -d caddy

log "끝. 상태: docker compose ps   되돌리기: ./rollback.sh"
docker compose ps
