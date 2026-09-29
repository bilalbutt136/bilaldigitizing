import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { withApiObservability } from '../lib/observability/apiObservability.js';
import {
  logServerInfo
} from '../lib/observability/serverLogger.js';
import {
  createRequestContext,
  runWithRequestContext
} from '../lib/observability/requestContext.js';

function walkRoutes(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkRoutes(target, out);
    } else if (entry.name === 'route.js') {
      out.push(target.replaceAll('\\', '/'));
    }
  }
  return out;
}

describe('P2 Observability Regression Coverage', () => {
  test('all concrete API route handlers are wrapped with request observability', () => {
    const routes = walkRoutes('app/api');
    assert.ok(routes.length >= 40);

    for (const file of routes) {
      const source = fs.readFileSync(file, 'utf8');
      const pureReExport = /export\s*\{[^}]+\}\s*from\s*['"]/.test(source) &&
        !/export\s+(?:async\s+function|const)\s+(?:GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)/.test(source);

      if (pureReExport) continue;

      assert.match(
        source,
        /withApiObservability/,
        `Expected ${file} to use withApiObservability`
      );
    }
  });

  test('request IDs and latency metrics are returned on API responses', async () => {
    const originalLog = console.log;
    const logs = [];
    console.log = line => logs.push(String(line));

    try {
      const handler = withApiObservability(async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        });
      });

      const requestId = 'test-request-12345678';
      const response = await handler(new Request('http://localhost/api/health', {
        headers: { 'x-request-id': requestId }
      }));

      assert.equal(response.status, 200);
      assert.equal(response.headers.get('x-request-id'), requestId);

      const duration = Number(response.headers.get('x-response-time-ms'));
      assert.ok(Number.isFinite(duration));
      assert.ok(duration >= 0);
      assert.match(response.headers.get('server-timing') || '', /^app;dur=/);

      const record = JSON.parse(logs.at(-1));
      assert.equal(record.event, 'api.request.completed');
      assert.equal(record.requestId, requestId);
      assert.equal(record.method, 'GET');
      assert.equal(record.route, '/api/health');
      assert.equal(record.statusCode, 200);
      assert.ok(Number.isFinite(record.durationMs));
    } finally {
      console.log = originalLog;
    }
  });

  test('invalid incoming request IDs are replaced with generated safe IDs', async () => {
    const originalLog = console.log;
    console.log = () => {};

    try {
      const handler = withApiObservability(async () => new Response(null, { status: 204 }));
      const response = await handler(new Request('http://localhost/api/health', {
        headers: { 'x-request-id': 'bad request id with spaces' }
      }));

      const requestId = response.headers.get('x-request-id');
      assert.ok(requestId);
      assert.notEqual(requestId, 'bad request id with spaces');
      assert.match(requestId, /^[a-zA-Z0-9._:-]{8,128}$/);
    } finally {
      console.log = originalLog;
    }
  });

  test('structured logs redact authentication secrets and personal identifiers', () => {
    const originalLog = console.log;
    const logs = [];
    console.log = line => logs.push(String(line));

    try {
      const request = new Request('http://localhost/api/test', {
        headers: { 'x-request-id': 'redaction-test-1234' }
      });
      const context = createRequestContext(request);

      runWithRequestContext(context, () => {
        logServerInfo('observability.redaction_probe', {
          authorization: 'Bearer super-secret',
          password: 'password123',
          apiKey: 'secret-key',
          email: 'customer@example.com',
          safeField: 'visible'
        });
      });

      const record = JSON.parse(logs.at(-1));
      assert.equal(record.authorization, '[REDACTED]');
      assert.equal(record.password, '[REDACTED]');
      assert.equal(record.apiKey, '[REDACTED]');
      assert.equal(record.email, '[REDACTED]');
      assert.equal(record.safeField, 'visible');
      assert.equal(record.requestId, 'redaction-test-1234');
    } finally {
      console.log = originalLog;
    }
  });

  test('operational promise rejections are not silently swallowed', () => {
    const roots = ['app/api', 'src/server'];
    for (const root of roots) {
      for (const file of walkJs(root)) {
        const source = fs.readFileSync(file, 'utf8');
        assert.equal(
          source.includes('.catch(() => {})'),
          false,
          `Silent promise rejection remains in ${file}`
        );
      }
    }
  });
});

function walkJs(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkJs(target, out);
    } else if (/\.(js|jsx|mjs)$/.test(entry.name)) {
      out.push(target.replaceAll('\\', '/'));
    }
  }
  return out;
}
