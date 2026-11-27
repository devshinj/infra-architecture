#!/usr/bin/env bash
# 앱을 직전 배포 이미지로 되돌린다. DB(마이그레이션)는 되돌리지 않는다.
# 새 마이그레이션이 옛 앱과 맞지 않으면 배포 전 백업으로 복구한다(docs/deploy.md 「DB 까지 되돌리기」).
set -euo pipefail
cd "$(dirname "$0")"
# Windows Git Bash 에서 돌릴 때 컨테이너 안 경로(/backup.sh)를 C:/Program Files/Git/... 로 바꾸지 않게 한다. 리눅스에서는 아무 일도 하지 않는다.
export MSYS_NO_PATHCONV=1

docker image inspect infrasketch-app:previous >/dev/null 2>&1 || { echo "[rollback] 되돌릴 이미지(infrasketch-app:previous)가 없다" >&2; exit 1; }

# 되돌리는 이미지는 원인을 볼 수 있게 :rolled-back 으로 남긴다.
docker image tag infrasketch-app:latest infrasketch-app:rolled-back
docker image tag infrasketch-app:previous infrasketch-app:latest
docker compose up -d --no-build --wait --wait-timeout 120 app
echo "[rollback] 앱을 직전 이미지로 되돌렸다. 고친 뒤 다시 ./deploy.sh"
docker compose ps app
