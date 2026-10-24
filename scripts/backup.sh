#!/usr/bin/env bash
#
# Daily PostgreSQL backup (spec §5, §11).
#
# This is real health data for a live pilot partner: run it from day one.
# Install as a cron entry, e.g. 03:15 every night:
#
#   15 3 * * * /path/to/wizzapp/scripts/backup.sh >> /var/log/wizzapp-backup.log 2>&1
#
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
COMPOSE_SERVICE="${COMPOSE_SERVICE:-postgres}"

# shellcheck source=/dev/null
[ -f "$ROOT_DIR/.env" ] && set -a && source "$ROOT_DIR/.env" && set +a

: "${POSTGRES_USER:?POSTGRES_USER is not set}"
: "${POSTGRES_DB:?POSTGRES_DB is not set}"

mkdir -p "$BACKUP_DIR"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
TARGET="$BACKUP_DIR/wizzapp-$STAMP.sql.gz"

echo "[$(date -u +%FT%TZ)] Backing up $POSTGRES_DB → $TARGET"

# --clean --if-exists makes the dump safe to restore over an existing database.
docker compose -f "$ROOT_DIR/docker-compose.yml" exec -T "$COMPOSE_SERVICE" \
  pg_dump --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" --clean --if-exists \
  | gzip > "$TARGET.partial"

# Only publish the final name once the dump completed, so a crashed run never
# leaves a truncated file that looks like a valid backup.
mv "$TARGET.partial" "$TARGET"

SIZE="$(du -h "$TARGET" | cut -f1)"
echo "[$(date -u +%FT%TZ)] Database backup complete ($SIZE)"

# ── Uploaded exercise videos ──────────────────────────────────────────────
# These live on a volume, not in Postgres, so pg_dump does not cover them.
# Without this the trainer would restore a database full of video references
# pointing at files that no longer exist.
VIDEO_TARGET="$BACKUP_DIR/uploads-$STAMP.tar.gz"
echo "[$(date -u +%FT%TZ)] Backing up uploaded videos → $VIDEO_TARGET"

if docker compose -f "$ROOT_DIR/docker-compose.yml" ps --status running --services 2>/dev/null | grep -qx api; then
  # Stream the volume out of the container so the host needs no access to it.
  docker compose -f "$ROOT_DIR/docker-compose.yml" exec -T api \
    tar -czf - -C /app uploads > "$VIDEO_TARGET.partial" && mv "$VIDEO_TARGET.partial" "$VIDEO_TARGET"
elif [ -d "$ROOT_DIR/${UPLOAD_DIR:-uploads}" ]; then
  # Running outside Docker: archive the directory directly.
  tar -czf "$VIDEO_TARGET.partial" -C "$ROOT_DIR" "${UPLOAD_DIR:-uploads}" \
    && mv "$VIDEO_TARGET.partial" "$VIDEO_TARGET"
else
  echo "[$(date -u +%FT%TZ)] No upload directory found — skipping video backup"
fi

if [ -f "$VIDEO_TARGET" ]; then
  echo "[$(date -u +%FT%TZ)] Video backup complete ($(du -h "$VIDEO_TARGET" | cut -f1))"
fi

# A backup that has never been restored is not a backup. Verify quarterly —
# and restore BOTH halves, or the videos will be missing:
#   gunzip -c backups/wizzapp-<stamp>.sql.gz | docker compose exec -T postgres psql -U "$POSTGRES_USER" -d wizzapp_restore_test
#   docker compose exec -T api tar -xzf - -C /app < backups/uploads-<stamp>.tar.gz

DELETED="$(find "$BACKUP_DIR" \( -name 'wizzapp-*.sql.gz' -o -name 'uploads-*.tar.gz' \) \
  -mtime "+$RETENTION_DAYS" -print -delete | wc -l | tr -d ' ')"
echo "[$(date -u +%FT%TZ)] Pruned $DELETED backup(s) older than $RETENTION_DAYS days"
