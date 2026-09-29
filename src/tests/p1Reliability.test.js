import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  listCanonicalMigrations,
  validateMigrationSql,
  validateCanonicalMigrationDirectory
} from '../../run_migrations.js';

describe('P1 Production Reliability Regression Coverage', () => {
  test('presence API uses distributed database sessions instead of process-local memory', () => {
    const route = fs.readFileSync('app/api/chat/presence/route.js', 'utf8');
    const service = fs.readFileSync('src/services/presenceService.js', 'utf8');
    const migration = fs.readFileSync(
      'supabase/migrations/20260929000003_distributed_presence_sessions.sql',
      'utf8'
    );

    assert.equal(route.includes('activePresenceMap'), false);
    assert.match(route, /from\('user_presence_sessions'\)/);
    assert.match(route, /onConflict: 'user_id,session_id'/);
    assert.match(route, /gt\('expires_at', nowIso\)/);

    assert.match(service, /sessionStorage\.getItem\('bdigi_presence_session_id'\)/);
    assert.match(service, /presenceChannel\.track/);
    assert.match(service, /restOnlineEmails = nextRestPresence/);
    assert.match(service, /sessionId/);

    assert.match(migration, /PRIMARY KEY \(user_id, session_id\)/);
    assert.match(migration, /REVOKE ALL ON TABLE public\.user_presence_sessions FROM authenticated/);
  });

  test('migration runner only considers canonical timestamped Supabase migrations', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bdigi-migrations-'));

    try {
      fs.writeFileSync(path.join(tmp, '20260929000001_first.sql'), 'select 1;');
      fs.writeFileSync(path.join(tmp, '20260929000002_second.sql'), 'select 2;');
      fs.writeFileSync(path.join(tmp, '29_legacy.sql'), 'select 3;');
      fs.writeFileSync(path.join(tmp, 'README.md'), 'ignored');

      assert.deepEqual(listCanonicalMigrations(tmp), [
        '20260929000001_first.sql',
        '20260929000002_second.sql'
      ]);

      assert.deepEqual(validateCanonicalMigrationDirectory(tmp), [
        '20260929000001_first.sql',
        '20260929000002_second.sql'
      ]);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('migration runner rejects statements unsafe for transactional deployment', () => {
    assert.throws(
      () => validateMigrationSql('bad.sql', 'CREATE INDEX CONCURRENTLY idx_x ON t(id);'),
      /unsafe for transactional deployment/
    );

    assert.throws(
      () => validateMigrationSql('bad.sql', 'VACUUM public.orders;'),
      /unsafe for transactional deployment/
    );

    assert.throws(
      () => validateMigrationSql('empty.sql', '   '),
      /is empty/
    );

    assert.doesNotThrow(() => {
      validateMigrationSql(
        'good.sql',
        'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS reliability_probe text;'
      );
    });
  });

  test('migration runner is fail-closed and never swallows fatal migration errors', () => {
    const source = fs.readFileSync('run_migrations.js', 'utf8');

    assert.match(source, /process\.exitCode = 1/);
    assert.match(source, /pg_try_advisory_lock/);
    assert.match(source, /Could not acquire the migration advisory lock/);
    assert.match(source, /db', 'push', '--dry-run/);
    assert.match(source, /db', 'push', '--yes/);
    assert.equal(source.includes("path.resolve(process.cwd(), 'database', 'migrations'),"), false);
  });

  test('adversarial API suite probes anonymous and forged-token requests over HTTP', () => {
    const source = fs.readFileSync('scripts/adversarial-api-tests.mjs', 'utf8');

    assert.match(source, /chat conversations reject forged admin JWT/);
    assert.match(source, /offers reject forged admin JWT/);
    assert.match(source, /orders reject forged admin JWT/);
    assert.match(source, /worker session rejects forged worker\/admin JWT metadata/);
    assert.match(source, /expected: 401/);
    assert.match(source, /expected: 403/);
  });
});
