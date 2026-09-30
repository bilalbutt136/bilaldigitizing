import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = relativePath => fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

describe('Proxy Authentication Resilience', () => {
  test('auth verification uses a production-safe timeout instead of the previous 1.5 second cutoff', () => {
    const proxy = read('proxy.js');

    assert.match(proxy, /const AUTH_VERIFY_TIMEOUT_MS = 5000/);
    assert.match(proxy, /const ROLE_LOOKUP_TIMEOUT_MS = 3500/);
    assert.match(proxy, /Supabase authentication verification/);
    assert.equal(proxy.includes('timeoutMs = 1500'), false);
  });

  test('temporary auth failures fail closed without exposing raw JSON to customers', () => {
    const proxy = read('proxy.js');

    assert.match(proxy, /function getAuthUnavailableResponse/);
    assert.match(proxy, /unavailableUrl\.pathname = '\/auth-unavailable'/);
    assert.match(proxy, /Retry-After', '5'/);
    assert.match(proxy, /return getAuthUnavailableResponse\(request\)/);
    assert.equal(
      proxy.includes("{ error: 'Authentication verification is temporarily unavailable.' }"),
      false
    );
  });

  test('auth unavailable route is public and preserves only a safe internal retry target', () => {
    const proxy = read('proxy.js');
    const page = read('app/auth-unavailable/page.jsx');

    assert.match(proxy, /'\/auth-unavailable'/);
    assert.match(page, /redirect\.startsWith\('\/'\)/);
    assert.match(page, /redirect\.startsWith\('\/\/'\)/);
    assert.match(page, /redirect\.startsWith\('\/auth-unavailable'\)/);
    assert.match(page, /We could not verify your session/);
    assert.match(page, /Your account has not been signed out/);
    assert.match(page, />\s*Try again\s*</);
  });

  test('authorization lookup errors are treated as temporary verification failures rather than false denials', () => {
    const proxy = read('proxy.js');

    assert.match(proxy, /if \(adminResult\?\.error\)/);
    assert.match(proxy, /Worker authorization lookup failed/);
    assert.match(proxy, /const lookupFailed = Boolean/);
    assert.match(proxy, /if \(!isAuthorized && lookupFailed\)/);
  });

  test('shared client shell treats the auth outage page as a compact auth route', () => {
    const shell = read('src/components/layout/ClientLayoutShell.jsx');

    assert.match(shell, /'\/auth-unavailable'/);
  });
});
