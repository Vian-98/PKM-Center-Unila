#!/usr/bin/env bash
<<<<<<< HEAD
set -e

# 9router database import/export CLI
# Supports Dockerized (pkm_9router) or local standalone installations

ACTION="$1"
TARGET_FILE="$2"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENGINE_PATH="$SCRIPT_DIR/9router-db-engine.mjs"

if [ -z "$ACTION" ] || [ -z "$TARGET_FILE" ]; then
  echo "Penggunaan: scripts/9router-db.sh <export|import> <nama_file.json>"
  exit 1
fi

CONTAINER_NAME="pkm_9router"
DOCKER_CMD="docker"
if ! $DOCKER_CMD ps >/dev/null 2>&1 && command -v docker.exe >/dev/null 2>&1; then
  DOCKER_CMD="docker.exe"
fi

if $DOCKER_CMD ps --format '{{.Names}}' 2>/dev/null | grep -q "^${CONTAINER_NAME}$"; then
  echo "[9router-db] Terdeteksi container Docker aktif: $CONTAINER_NAME"
  if [ "$ACTION" = "export" ]; then
    echo "[9router-db] Mengekspor database dari container..."
    cat "$ENGINE_PATH" | $DOCKER_CMD exec -i "$CONTAINER_NAME" node --input-type=module - export /root/.9router/db/data.sqlite /tmp/9r-export.json
    $DOCKER_CMD cp "${CONTAINER_NAME}:/tmp/9r-export.json" "$TARGET_FILE"
    echo "[9router-db] Selesai! File backup tersimpan di: $TARGET_FILE"
  elif [ "$ACTION" = "import" ]; then
    if [ ! -f "$TARGET_FILE" ]; then
      echo "[9router-db] Error: File $TARGET_FILE tidak ditemukan!"
      exit 1
    fi
    echo "[9router-db] Mengunggah $TARGET_FILE ke container..."
    $DOCKER_CMD cp "$TARGET_FILE" "${CONTAINER_NAME}:/tmp/9r-import.json"
    cat "$ENGINE_PATH" | $DOCKER_CMD exec -i "$CONTAINER_NAME" node --input-type=module - import /root/.9router/db/data.sqlite /tmp/9r-import.json
    echo "[9router-db] Me-restart container 9router untuk memuat data baru..."
    $DOCKER_CMD restart "$CONTAINER_NAME"
    echo "[9router-db] Selesai! Database 9router berhasil diimpor."

  else
    echo "[9router-db] Aksi tidak dikenal: $ACTION. Gunakan 'export' atau 'import'."
    exit 1
  fi
else
  # Mode Standalone / Non-Docker
  DB_PATH="${DATA_DIR:-$HOME/.9router}/db/data.sqlite"
  if [ ! -f "$DB_PATH" ]; then
    echo "[9router-db] Error: Database SQLite tidak ditemukan di $DB_PATH dan container $CONTAINER_NAME tidak berjalan."
    exit 1
  fi
  node "$ENGINE_PATH" "$ACTION" "$DB_PATH" "$TARGET_FILE"
fi
=======
#
# Export / import konfigurasi 9Router (provider, combo, API key, settings).
# Berguna untuk memindahkan konfigurasi dari mesin local ke server, karena
# konfigurasi 9Router TIDAK tersimpan di git melainkan di volume Docker.
#
# Pemakaian:
#   scripts/9router-db.sh export 9router-backup.json
#   scripts/9router-db.sh import 9router-backup.json
#
# Variabel opsional:
#   NINEROUTER_CONTAINER  nama container (default pkm_9router)
#
set -euo pipefail

CONTAINER="${NINEROUTER_CONTAINER:-pkm_9router}"
ACTION="${1:-}"
FILE="${2:-}"

usage() {
  echo "Pemakaian: $0 export <file.json> | $0 import <file.json>" >&2
  exit 1
}

[ -n "$ACTION" ] && [ -n "$FILE" ] || usage

read -r -d '' NODE_SCRIPT <<'EOF' || true
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const dataDir = path.join(process.env.HOME || "/root", ".9router");
const machineId = fs.readFileSync(path.join(dataDir, "machine-id"), "utf8").trim();
const secret = fs.readFileSync(path.join(dataDir, "auth", "cli-secret"), "utf8").trim();
const token = crypto.createHash("sha256").update(machineId + "9r-cli-auth" + secret).digest("hex").substring(0, 16);
const url = `http://127.0.0.1:${process.env.PORT || 20128}/api/settings/database`;

(async () => {
  if (process.env.MODE === "export") {
    const res = await fetch(url, { headers: { "x-9r-cli-token": token } });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    process.stdout.write(await res.text());
  } else {
    const body = fs.readFileSync(0, "utf8");
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-9r-cli-token": token },
      body,
    });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    console.log("[9router] import berhasil");
  }
})().catch((err) => {
  console.error(`[9router] gagal: ${err.message}`);
  process.exit(1);
});
EOF

case "$ACTION" in
  export)
    docker exec -e MODE=export "$CONTAINER" node -e "$NODE_SCRIPT" > "$FILE"
    echo "[9router] konfigurasi diekspor ke $FILE"
    ;;
  import)
    docker exec -i -e MODE=import "$CONTAINER" node -e "$NODE_SCRIPT" < "$FILE"
    ;;
  *)
    usage
    ;;
esac
>>>>>>> 9ae6ce7e963bc04e68a93bb0e134dce10d52833a
