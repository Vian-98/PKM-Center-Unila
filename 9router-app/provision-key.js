const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DATA_DIR = process.env.DATA_DIR || path.join(process.env.HOME || "/root", ".9router");
const SHARED_FILE = process.env.SHARED_API_KEY_FILE || "/shared/9router-api-key";
const BASE_URL = process.env.NINEROUTER_BASE_URL || `http://127.0.0.1:${process.env.PORT || 20128}`;

function cliToken() {
  const machineId = fs.readFileSync(path.join(DATA_DIR, "machine-id"), "utf8").trim();
  const secret = fs.readFileSync(path.join(DATA_DIR, "auth", "cli-secret"), "utf8").trim();
  return crypto.createHash("sha256").update(machineId + "9r-cli-auth" + secret).digest("hex").substring(0, 16);
}

async function api(method, endpoint, token, body) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-9r-cli-token": token,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    throw new Error(`${method} ${endpoint} -> ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function waitForServer(timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE_URL}/api/health`);
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("9router server tidak merespons");
}

async function writeShared(key) {
  fs.mkdirSync(path.dirname(SHARED_FILE), { recursive: true });
  const tmp = `${SHARED_FILE}.tmp`;
  fs.writeFileSync(tmp, key, { mode: 0o644 });
  fs.renameSync(tmp, SHARED_FILE);
}

async function main() {
  await waitForServer();
  const token = cliToken();
  let keys = (await api("GET", "/api/keys", token)).keys || [];
  if (keys.length === 0) {
    const created = await api("POST", "/api/keys", token, { name: "pkm-center-backend" });
    keys = [created];
    console.log(`[provision] API key dibuat: ${created.name}`);
  }
  const active = keys.find((k) => k.isActive) || keys[0];
  await writeShared(active.key);
  console.log(`[provision] API key siap ditulis ke ${SHARED_FILE}`);
}

main().catch((err) => {
  console.error(`[provision] gagal: ${err.message}`);
  process.exit(1);
});
