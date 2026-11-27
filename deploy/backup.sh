#!/bin/sh
# 백업 컨테이너(postgres:16) 안에서 돈다. PGHOST·PGUSER·PGPASSWORD·PGDATABASE 로 db 에 붙는다.
#   sh /backup.sh           매일 BACKUP_AT(기본 03:00)에 백업. 켤 때 24시간 안의 백업이 없으면 바로 한 번 뜬다.
#   sh /backup.sh once      지금 한 번 뜬다(배포 전 백업).
#   sh /backup.sh check F   백업 F 를 임시 DB 에 복구해 표마다 행 수를 찍고 지운다(복구 연습). F 는 /backups 안 이름이나 경로.
set -eu

DIR=/backups
AT="${BACKUP_AT:-03:00}"
KEEP="${BACKUP_KEEP_DAYS:-7}"
CHECK_DB=infrasketch_restore_check

log() { echo "[backup] $(date '+%F %T') $*"; }

dump() {
  out="$DIR/infrasketch-$(date +%Y%m%d-%H%M%S).dump"
  # 다 쓴 뒤에 이름을 바꾼다: 도중에 멈춘 파일이 백업으로 보이지 않게.
  pg_dump -Fc -f "$out.part"
  mv "$out.part" "$out"
  log "만듦 $out ($(du -h "$out" | cut -f1))"
  # KEEP 일 지난 백업을 지운다(KEEP=7 이면 -mtime +6, 곧 7일 이상 지난 것).
  find "$DIR" -maxdepth 1 -name 'infrasketch-*.dump' -mtime +"$((KEEP - 1))" -print -delete | while read -r f; do log "지움 $f"; done
  find "$DIR" -maxdepth 1 -name 'infrasketch-*.dump.part' -mmin +60 -delete
}

recent() { find "$DIR" -maxdepth 1 -name 'infrasketch-*.dump' -mmin -1440 | grep -q .; }

seconds_until_next() {
  now=$(date +%s)
  t=$(date -d "today $AT" +%s)
  [ "$t" -gt "$now" ] || t=$(date -d "tomorrow $AT" +%s)
  echo $((t - now))
}

check() {
  f="$1"
  [ -f "$f" ] || f="$DIR/$1"
  [ -f "$f" ] || { echo "[backup] 백업 파일이 없다: $1" >&2; exit 1; }
  dropdb --if-exists "$CHECK_DB"
  createdb "$CHECK_DB"
  trap 'dropdb --if-exists "$CHECK_DB"' EXIT
  pg_restore --no-owner --exit-on-error -d "$CHECK_DB" "$f"
  log "복구함 $f → $CHECK_DB (끝나면 지운다)"
  echo "마이그레이션 $(psql -d "$CHECK_DB" -Atc 'select count(*) from drizzle.__drizzle_migrations')개"
  psql -d "$CHECK_DB" -At -F ' ' -f - <<'SQL'
select format('select %L, count(*) from public.%I', table_name, table_name)
from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE' order by table_name
\gexec
SQL
}

mkdir -p "$DIR"
case "${1:-loop}" in
  once) dump ;;
  check) check "${2:?백업 파일 이름을 주세요}" ;;
  loop)
    trap 'exit 0' TERM INT
    log "매일 $AT 에 백업, ${KEEP}일 보관"
    recent || dump || log "백업 실패"
    while true; do
      sleep "$(seconds_until_next)" &
      wait $!
      dump || log "백업 실패"
    done
    ;;
  *) echo "쓰는 법: backup.sh [once | check <파일>]" >&2; exit 2 ;;
esac
