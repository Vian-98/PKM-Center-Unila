#!/usr/bin/env bash
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
