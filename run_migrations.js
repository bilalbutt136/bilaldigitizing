import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { pathToFileURL } from 'url';
import pkg from 'pg';
import dotenv from 'dotenv';

const { Client } = pkg;

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

export const MIGRATIONS_DIR = path.resolve(process.cwd(), 'supabase', 'migrations');
export const LEGACY_MIGRATIONS_DIR = path.resolve(process.cwd(), 'database', 'migrations');

const DEFAULT_LOCK_WAIT_MS = 15_000;
const DEFAULT_COMMAND_TIMEOUT_MS = 180_000;
const ADVISORY_LOCK_KEY = 2909202601;

const TRANSACTION_INCOMPATIBLE_PATTERNS = [
  /\bCREATE\s+(?:UNIQUE\s+)?INDEX\s+CONCURRENTLY\b/i,
  /\bREINDEX\b[\s\S]*\bCONCURRENTLY\b/i,
  /\bVACUUM\b/i,
  /\bALTER\s+SYSTEM\b/i,
  /\bCREATE\s+DATABASE\b/i,
  /\bDROP\s+DATABASE\b/i
];

export function listCanonicalMigrations(migrationsDir = MIGRATIONS_DIR) {
  if (!fs.existsSync(migrationsDir)) return [];

  return fs.readdirSync(migrationsDir)
    .filter(file => /^\d{14}_.+\.sql$/i.test(file))
    .sort((a, b) => a.localeCompare(b));
}

export function validateMigrationSql(fileName, sql) {
  if (!sql || !String(sql).trim()) {
    throw new Error(`Migration ${fileName} is empty.`);
  }

  for (const pattern of TRANSACTION_INCOMPATIBLE_PATTERNS) {
    if (pattern.test(sql)) {
      throw new Error(
        `Migration ${fileName} contains a statement that is unsafe for transactional deployment. ` +
        'Move that operation to an explicitly reviewed deployment step.'
      );
    }
  }
}

export function validateCanonicalMigrationDirectory(migrationsDir = MIGRATIONS_DIR) {
  const files = listCanonicalMigrations(migrationsDir);
  if (files.length === 0) {
    throw new Error('No canonical Supabase migrations were found.');
  }

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    validateMigrationSql(file, sql);
  }

  return files;
}

function getNumericEnv(name, fallback) {
  const raw = Number(process.env[name]);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : fallback;
}

function quoteWindowsArg(value) {
  const text = String(value);
  if (!/[\s"]/u.test(text)) return text;
  return '"' + text.replace(/"/g, '""') + '"';
}

function getSupabaseSpawnSpec(args) {
  if (process.platform === 'win32') {
    const commandLine = ['npx', 'supabase', ...args].map(quoteWindowsArg).join(' ');
    return {
      command: process.env.ComSpec || 'cmd.exe',
      args: ['/d', '/s', '/c', commandLine],
      shell: false
    };
  }

  return {
    command: 'npx',
    args: ['supabase', ...args],
    shell: false
  };
}

export function runSupabaseCommand(args, {
  timeoutMs = getNumericEnv('MIGRATION_COMMAND_TIMEOUT_MS', DEFAULT_COMMAND_TIMEOUT_MS),
  stdio = 'inherit'
} = {}) {
  const spawnSpec = getSupabaseSpawnSpec(args);
  const result = spawnSync(spawnSpec.command, spawnSpec.args, {
    cwd: process.cwd(),
    env: process.env,
    stdio,
    encoding: stdio === 'pipe' ? 'utf8' : undefined,
    timeout: timeoutMs,
    shell: spawnSpec.shell,
    windowsHide: true
  });

  if (result.error) {
    if (result.error.code === 'ETIMEDOUT') {
      throw new Error(`Supabase CLI timed out after ${timeoutMs}ms.`);
    }
    throw result.error;
  }

  if (result.status !== 0) {
    const stderr = typeof result.stderr === 'string' ? result.stderr.trim() : '';
    throw new Error(
      `Supabase CLI exited with code ${result.status}.${stderr ? ` ${stderr}` : ''}`
    );
  }

  return result;
}

async function acquireMigrationLock(client, timeoutMs) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const { rows } = await client.query(
      'select pg_try_advisory_lock($1::bigint) as acquired',
      [ADVISORY_LOCK_KEY]
    );

    if (rows?.[0]?.acquired === true) return true;
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return false;
}

async function withOptionalDatabaseLock(callback) {
  const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;
  if (!dbUrl) {
    console.warn(
      '[Migration Runner] DATABASE_URL/SUPABASE_DATABASE_URL is not configured; ' +
      'continuing with Supabase CLI history/locking only.'
    );
    return callback();
  }

  const lockWaitMs = getNumericEnv('MIGRATION_LOCK_WAIT_MS', DEFAULT_LOCK_WAIT_MS);
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: Math.min(lockWaitMs, 10_000),
    query_timeout: lockWaitMs
  });

  await client.connect();

  try {
    const acquired = await acquireMigrationLock(client, lockWaitMs);
    if (!acquired) {
      throw new Error(
        `Could not acquire the migration advisory lock within ${lockWaitMs}ms. ` +
        'Another migration process may still be running.'
      );
    }

    try {
      return await callback();
    } finally {
      await client.query('select pg_advisory_unlock($1::bigint)', [ADVISORY_LOCK_KEY]);
    }
  } finally {
    await client.end().catch(() => {});
  }
}

export async function runMigrations() {
  const files = validateCanonicalMigrationDirectory();

  if (fs.existsSync(LEGACY_MIGRATIONS_DIR)) {
    console.warn(
      '[Migration Runner] Ignoring legacy database/migrations. ' +
      'supabase/migrations is the single canonical migration source.'
    );
  }

  console.log(`[Migration Runner] Validated ${files.length} canonical migration files.`);

  await withOptionalDatabaseLock(async () => {
    console.log('[Migration Runner] Checking remote migration plan...');
    runSupabaseCommand(['db', 'push', '--dry-run'], { stdio: 'inherit' });

    console.log('[Migration Runner] Applying pending migrations...');
    runSupabaseCommand(['db', 'push', '--yes'], { stdio: 'inherit' });

    console.log('[Migration Runner] Verifying local/remote migration parity...');
    runSupabaseCommand(['migration', 'list'], { stdio: 'inherit' });
  });

  console.log('✓ Migration deployment completed successfully.');
}

function isDirectExecution() {
  const entry = process.argv[1];
  if (!entry) return false;

  try {
    return import.meta.url === pathToFileURL(path.resolve(entry)).href;
  } catch {
    return false;
  }
}

if (isDirectExecution()) {
  runMigrations().catch(error => {
    console.error('[Migration Runner] Fatal migration failure:', error?.message || error);
    process.exitCode = 1;
  });
}
