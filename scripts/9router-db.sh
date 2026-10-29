#!/usr/bin/env bash
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
