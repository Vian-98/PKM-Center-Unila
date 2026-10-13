#!/usr/bin/env bash
#
# Auto-deploy PKM-Center Unila.
# Dipanggil oleh systemd timer "pkm-autodeploy.timer" setiap 2 menit.
#
# Alur:
#   1. git fetch ringan ke origin/<branch>.
#   2. Bandingkan HEAD lokal vs origin. Jika sama -> keluar (hampir tanpa beban).
#   3. Jika ada commit baru -> git pull --ff-only, lalu rebuild & restart container.
#
# Variabel opsional:
#   PKM_REPO   path repo   (default /home/ubuntu/PKM-Center-Unila)
#   PKM_BRANCH branch      (default main)
#   FORCE=1    paksa rebuild walau tidak ada commit baru (untuk pengujian)
#
set -euo pipefail

REPO="${PKM_REPO:-/home/ubuntu/PKM-Center-Unila}"
BRANCH="${PKM_BRANCH:-main}"
LOCK_FILE="/tmp/pkm-autodeploy.lock"

log() { printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"; }

# Cegah dua proses deploy berjalan bersamaan.
exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  log "deploy lain sedang berjalan; dilewati."
  exit 0
fi

cd "$REPO"

if ! git fetch --quiet origin "$BRANCH"; then
  log "GAGAL git fetch (jaringan?). Coba lagi pada jadwal berikutnya."
  exit 1
fi

LOCAL="$(git rev-parse HEAD)"
REMOTE="$(git rev-parse "origin/$BRANCH")"

if [ "${FORCE:-0}" != "1" ] && [ "$LOCAL" = "$REMOTE" ]; then
  exit 0
fi

log "commit baru terdeteksi: ${LOCAL:0:8} -> ${REMOTE:0:8}"
git pull --ff-only origin "$BRANCH"

log "rebuild & restart container..."
docker compose up -d --build

log "membersihkan image lama (dangling)..."
docker image prune -f >/dev/null 2>&1 || true

log "deploy selesai pada commit $(git rev-parse --short HEAD)."
