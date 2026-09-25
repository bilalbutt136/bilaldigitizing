#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TOKEN   = process.argv[2] || process.env.VERCEL_TOKEN || '';
const PROJECT = 'prj_GxDM7vIa6xMSjRWFkaSWZXLegjly';
const TEAM    = 'team_QFyM9LJlAyhsXrT4dJWBTuUK';
const BASE    = 'https://api.vercel.com';
const HDR     = { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

const SKIP = new Set(['VERCEL_OIDC_TOKEN', 'VERCEL_TOKEN']);

function parseEnv(filePath) {
  const vars = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    if (key && val) vars[key] = val;
  }
  return vars;
}

async function listExisting() {
  const r = await fetch(`${BASE}/v9/projects/${PROJECT}/env?teamId=${TEAM}&limit=100`, { headers: HDR });
  const d = await r.json();
  if (!r.ok) throw new Error(`List failed: ${JSON.stringify(d)}`);
  return d.envs || [];
}

async function del(id) {
  await fetch(`${BASE}/v9/projects/${PROJECT}/env/${id}?teamId=${TEAM}`, { method: 'DELETE', headers: HDR });
}

async function create(key, value) {
  const r = await fetch(`${BASE}/v10/projects/${PROJECT}/env?teamId=${TEAM}`, {
    method: 'POST', headers: HDR,
    body: JSON.stringify({ key, value, target: ['production', 'preview', 'development'], type: 'plain' })
  });
  const d = await r.json();
  if (!r.ok) throw new Error(JSON.stringify(d));
  return d;
}

async function main() {
  console.log('\n🔄 Vercel Full Environment Sync\n');
  const vars     = parseEnv(path.join(__dirname, '..', '.env.local'));
  const existing = await listExisting();
  console.log(`📋 .env.local has ${Object.keys(vars).length} vars | Vercel has ${existing.length} vars\n`);

  let ok = 0, skip = 0, fail = 0;

  for (const [key, value] of Object.entries(vars)) {
    if (SKIP.has(key) || !value || value.includes('your-')) {
      console.log(`⏭️  SKIP  ${key}`); skip++; continue;
    }
    for (const m of existing.filter(e => e.key === key)) await del(m.id);
    try {
      await create(key, value);
      console.log(`✅ SET   ${key} = ${value.length > 55 ? value.slice(0,55)+'…' : value}`);
      ok++;
    } catch (e) {
      console.error(`❌ FAIL  ${key}: ${e.message}`); fail++;
    }
  }

  console.log(`\n📊 ${ok} updated | ${skip} skipped | ${fail} errors`);
  console.log('🎉 Done! All variables synced to Vercel.\n');
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
