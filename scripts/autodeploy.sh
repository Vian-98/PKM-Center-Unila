#!/usr/bin/env bash
#
# Auto-deploy PKM-Center Unila.
# Dipanggil oleh systemd timer "pkm-autodeploy.timer" setiap 2 menit.
#
# Alur:
#   1. git fetch ringan ke origin/<branch>.
#   2. Bandingkan HEAD lokal vs origin. Jika sama -> keluar (hampir tanpa beban).
#   3. Jika ada commit baru -> git pull --ff-only.
#   4. Rebuild & restart container HANYA bila perubahan menyentuh aplikasi
#      (backend/, frontend/, docker-compose.yml); perubahan dokumen/skrip
#      cukup di-pull tanpa rebuild.
#   5. Bila berkas dependensi (frontend/package*.json, backend/go.mod|sum)
#      berubah, rebuild memakai --renew-anon-volumes agar node_modules /
#      modul Go di dalam container ikut diperbarui.
#
# Variabel opsional:
#   PKM_REPO          path repo   (default /home/ubuntu/PKM-Center-Unila)
#   PKM_BRANCH        branch      (default main)
#   PKM_BUILD_PATTERN regex path pemicu rebuild
#                     (default ^(backend/|frontend/|9router-app/)|^docker-compose[.]yml$)
#   FORCE=1           paksa rebuild walau tidak ada commit baru (untuk pengujian)
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

# Filter path: rebuild hanya bila ada perubahan yang menyentuh aplikasi.
# Default: backend/, frontend/, atau docker-compose.yml.
BUILD_PATTERN="${PKM_BUILD_PATTERN:-^(backend/|frontend/|9router-app/)|^docker-compose[.]yml$}"
CHANGED="$(git diff --name-only "$LOCAL" "$REMOTE" || true)"
NEED_REBUILD=1
if [ "${FORCE:-0}" != "1" ] && ! printf '%s\n' "$CHANGED" | grep -qE "$BUILD_PATTERN"; then
  NEED_REBUILD=0
fi

git pull --ff-only origin "$BRANCH"

if [ "$NEED_REBUILD" != "1" ]; then
  log "hanya perubahan non-aplikasi (dokumen/skrip); repo diperbarui tanpa rebuild."
  log "selesai pada commit $(git rev-parse --short HEAD)."
  exit 0
fi

# Bila berkas dependensi berubah, segarkan juga isi anonymous volume
# (mis. volume /app/node_modules pada frontend) memakai --renew-anon-volumes,
# agar paket baru benar-benar terpasang di container.
if printf '%s\n' "$CHANGED" | grep -qE '^(frontend/package(-lock)?[.]json|backend/go[.](mod|sum))$'; then
  log "perubahan dependensi terdeteksi; rebuild + segarkan volume (--renew-anon-volumes)..."
  docker compose up -d --build -V
else
  log "perubahan aplikasi terdeteksi; rebuild & restart container..."
  docker compose up -d --build
fi

log "membersihkan image lama (dangling)..."
docker image prune -f >/dev/null 2>&1 || true

log "deploy selesai pada commit $(git rev-parse --short HEAD)."
