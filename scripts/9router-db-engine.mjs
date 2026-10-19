import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';

const mode = process.argv[2]; // 'export' or 'import'
const dbPath = process.argv[3] || '/root/.9router/db/data.sqlite';
const targetFile = process.argv[4] || null;

if (!['export', 'import'].includes(mode)) {
  console.error("Usage: node 9router-db-engine.mjs <export|import> <dbPath> [targetFile]");
  process.exit(1);
}

const db = new DatabaseSync(dbPath);

function safeParse(str, fallback = null) {
  if (null == str) return fallback;
  if (typeof str !== 'string') return str;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

function cleanAllow(arr) {
  if (!Array.isArray(arr)) return [];
  const s = new Set();
  const res = [];
  for (const item of arr) {
    if (typeof item !== 'string') continue;
    const t = item.trim();
    if (!t) continue;
    const l = t.toLowerCase();
    if (!s.has(l)) {
      s.add(l);
      res.push(t);
    }
  }
  return res;
}

function parseAccess(restricted, allow) {
  if (restricted !== 1 && restricted !== true) {
    return { restricted: false, allow: [] };
  }
  let parsed = [];
  if (typeof allow === 'string' && allow) {
    try {
      parsed = JSON.parse(allow);
    } catch {
      parsed = [];
    }
  }
  return { restricted: true, allow: cleanAllow(parsed) };
}

if (mode === 'export') {
  const settingsRow = db.prepare('SELECT data FROM settings WHERE id = 1').get();
  const settings = settingsRow ? safeParse(settingsRow.data, {}) : {};

  const providerConnections = db.prepare('SELECT * FROM providerConnections').all().map(a => ({
    ...safeParse(a.data, {}),
    id: a.id,
    provider: a.provider,
    authType: a.authType,
    name: a.name,
    email: a.email,
    priority: a.priority,
    isActive: a.isActive === 1,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt
  }));

  const providerNodes = db.prepare('SELECT * FROM providerNodes').all().map(a => ({
    ...safeParse(a.data, {}),
    id: a.id,
    type: a.type,
    name: a.name,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt
  }));

  const proxyPools = db.prepare('SELECT * FROM proxyPools').all().map(a => ({
    ...safeParse(a.data, {}),
    id: a.id,
    isActive: a.isActive === 1,
    testStatus: a.testStatus,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt
  }));

  const apiKeys = db.prepare('SELECT * FROM apiKeys').all().map(a => ({
    id: a.id,
    key: a.key,
    name: a.name,
    machineId: a.machineId,
    isActive: a.isActive === 1,
    createdAt: a.createdAt,
    access: parseAccess(a.accessRestricted, a.accessAllow)
  }));

  const combos = db.prepare('SELECT * FROM combos').all().map(a => ({
    id: a.id,
    name: a.name,
    kind: a.kind,
    models: safeParse(a.models, []),
    createdAt: a.createdAt,
    updatedAt: a.updatedAt
  }));

  const modelAliases = {};
  const customModels = [];
  const mitmAlias = {};
  const pricing = {};

  for (const b of db.prepare("SELECT key, value FROM kv WHERE scope = 'modelAliases'").all()) {
    modelAliases[b.key] = safeParse(b.value);
  }
  for (const b of db.prepare("SELECT key, value FROM kv WHERE scope = 'customModels'").all()) {
    customModels.push(safeParse(b.value));
  }
  for (const b of db.prepare("SELECT key, value FROM kv WHERE scope = 'mitmAlias'").all()) {
    mitmAlias[b.key] = safeParse(b.value);
  }
  for (const b of db.prepare("SELECT key, value FROM kv WHERE scope = 'pricing'").all()) {
    pricing[b.key] = safeParse(b.value);
  }

  const backup = {
    settings,
    providerConnections,
    providerNodes,
    proxyPools,
    apiKeys,
    combos,
    modelAliases,
    customModels,
    mitmAlias,
    pricing
  };

  const jsonStr = JSON.stringify(backup, null, 2);

  if (targetFile) {
    fs.writeFileSync(targetFile, jsonStr, 'utf8');
    console.log(`[9router-db] Exported backup to ${targetFile}`);
  } else {
    process.stdout.write(jsonStr);
  }
} else if (mode === 'import') {
  if (!targetFile || !fs.existsSync(targetFile)) {
    console.error(`[9router-db] Import file not found: ${targetFile}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(targetFile, 'utf8');
  const payload = JSON.parse(raw);

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('Invalid database backup payload');
  }

  db.exec('BEGIN TRANSACTION;');
  try {
    db.exec("DELETE FROM settings;");
    db.exec("DELETE FROM providerConnections;");
    db.exec("DELETE FROM providerNodes;");
    db.exec("DELETE FROM proxyPools;");
    db.exec("DELETE FROM apiKeys;");
    db.exec("DELETE FROM combos;");
    db.exec("DELETE FROM kv WHERE scope IN ('modelAliases', 'customModels', 'mitmAlias', 'pricing');");

    if (payload.settings) {
      db.prepare("INSERT INTO settings(id, data) VALUES(1, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data").run(JSON.stringify(payload.settings));
    }

    const insConn = db.prepare("INSERT OR REPLACE INTO providerConnections(id, provider, authType, name, email, priority, isActive, data, createdAt, updatedAt) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    for (const c of (payload.providerConnections || [])) {
      const { id, provider, authType, name, email, priority, isActive, createdAt, updatedAt, ...rest } = c;
      insConn.run(
        id,
        provider,
        authType || "oauth",
        name || null,
        email || null,
        priority || null,
        +(isActive !== false),
        JSON.stringify(rest),
        createdAt || new Date().toISOString(),
        updatedAt || new Date().toISOString()
      );
    }

    const insNode = db.prepare("INSERT OR REPLACE INTO providerNodes(id, type, name, data, createdAt, updatedAt) VALUES(?, ?, ?, ?, ?, ?)");
    for (const c of (payload.providerNodes || [])) {
      const { id, type, name, createdAt, updatedAt, ...rest } = c;
      insNode.run(
        id,
        type || null,
        name || null,
        JSON.stringify(rest),
        createdAt || new Date().toISOString(),
        updatedAt || new Date().toISOString()
      );
    }

    const insPool = db.prepare("INSERT OR REPLACE INTO proxyPools(id, isActive, testStatus, data, createdAt, updatedAt) VALUES(?, ?, ?, ?, ?, ?)");
    for (const c of (payload.proxyPools || [])) {
      const { id, isActive, testStatus, createdAt, updatedAt, ...rest } = c;
      insPool.run(
        id,
        +(isActive !== false),
        testStatus || "unknown",
        JSON.stringify(rest),
        createdAt || new Date().toISOString(),
        updatedAt || new Date().toISOString()
      );
    }

    const insKey = db.prepare("INSERT OR REPLACE INTO apiKeys(id, key, name, machineId, isActive, createdAt, accessRestricted, accessAllow) VALUES(?, ?, ?, ?, ?, ?, ?, ?)");
    for (const c of (payload.apiKeys || [])) {
      const aAccess = c.access || { restricted: false, allow: [] };
      const accRestricted = +(!!aAccess.restricted);
      const accAllow = JSON.stringify(aAccess.restricted && Array.isArray(aAccess.allow) ? cleanAllow(aAccess.allow) : []);
      insKey.run(
        c.id,
        c.key,
        c.name || null,
        c.machineId || null,
        +(c.isActive !== false),
        c.createdAt || new Date().toISOString(),
        accRestricted,
        accAllow
      );
    }

    const insCombo = db.prepare("INSERT OR REPLACE INTO combos(id, name, kind, models, createdAt, updatedAt) VALUES(?, ?, ?, ?, ?, ?)");
    for (const c of (payload.combos || [])) {
      insCombo.run(
        c.id,
        c.name,
        c.kind || null,
        JSON.stringify(c.models || []),
        c.createdAt || new Date().toISOString(),
        c.updatedAt || new Date().toISOString()
      );
    }

    const insKv = db.prepare("INSERT OR REPLACE INTO kv(scope, key, value) VALUES(?, ?, ?)");
    for (const [k, v] of Object.entries(payload.modelAliases || {})) {
      insKv.run('modelAliases', k, JSON.stringify(v));
    }
    for (const m of (payload.customModels || [])) {
      const key = `${m.providerAlias || ''}|${m.id || ''}|${m.type || 'llm'}`;
      insKv.run('customModels', key, JSON.stringify(m));
    }
    for (const [k, v] of Object.entries(payload.mitmAlias || {})) {
      insKv.run('mitmAlias', k, JSON.stringify(v || {}));
    }
    for (const [k, v] of Object.entries(payload.pricing || {})) {
      insKv.run('pricing', k, JSON.stringify(v || {}));
    }

    db.exec('COMMIT;');
    console.log(`[9router-db] Successfully imported backup from ${targetFile}`);
  } catch (err) {
    db.exec('ROLLBACK;');
    console.error(`[9router-db] Failed to import backup:`, err);
    process.exit(1);
  }
}
