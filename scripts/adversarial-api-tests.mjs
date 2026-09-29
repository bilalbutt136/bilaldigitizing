import { spawn } from 'child_process';
import { createRequire } from 'module';
import net from 'net';

const require = createRequire(import.meta.url);
const nextBin = require.resolve('next/dist/bin/next');

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : null;
      server.close(() => resolve(port));
    });
  });
}

function base64Url(value) {
  return Buffer.from(JSON.stringify(value))
    .toString('base64url');
}

function makeForgedJwt() {
  const header = base64Url({ alg: 'HS256', typ: 'JWT' });
  const payload = base64Url({
    sub: '00000000-0000-0000-0000-000000000001',
    email: 'attacker@example.com',
    role: 'authenticated',
    app_metadata: { role: 'admin', is_admin: true },
    user_metadata: { role: 'admin', worker_status: 'active' },
    exp: Math.floor(Date.now() / 1000) + 3600
  });
  return `${header}.${payload}.invalid-signature`;
}

async function waitForServer(baseUrl, timeoutMs = 45_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError = null;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/api/health`, {
        cache: 'no-store'
      });
      if (response.status < 500) return;
    } catch (error) {
      lastError = error;
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  throw new Error(
    `Next server did not become ready within ${timeoutMs}ms${lastError ? `: ${lastError.message}` : ''}`
  );
}

async function request(baseUrl, testCase) {
  const response = await fetch(`${baseUrl}${testCase.path}`, {
    method: testCase.method || 'GET',
    headers: {
      ...(testCase.body ? { 'content-type': 'application/json' } : {}),
      ...(testCase.headers || {})
    },
    body: testCase.body ? JSON.stringify(testCase.body) : undefined,
    cache: 'no-store',
    redirect: 'manual'
  });

  const text = await response.text();
  return { response, text };
}

function assertStatus(name, actual, expected) {
  const allowed = Array.isArray(expected) ? expected : [expected];
  if (!allowed.includes(actual)) {
    throw new Error(`${name}: expected HTTP ${allowed.join(' or ')}, received ${actual}`);
  }
}

async function run() {
  const port = await getFreePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const forgedJwt = makeForgedJwt();

  const server = spawn(process.execPath, [nextBin, 'start', '-p', String(port), '-H', '127.0.0.1'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_ENV: 'production'
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true
  });

  let stderr = '';
  server.stderr?.on('data', chunk => {
    stderr += String(chunk);
  });

  try {
    await waitForServer(baseUrl);

    const unauthenticatedCases = [
      {
        name: 'chat conversations list rejects anonymous callers',
        path: '/api/chat/conversations',
        expected: 401
      },
      {
        name: 'chat conversations ignore forged victim email from anonymous caller',
        path: '/api/chat/conversations?email=victim@example.com',
        expected: 401
      },
      {
        name: 'chat conversation mutation rejects anonymous callers',
        path: '/api/chat/conversations',
        method: 'POST',
        body: { action: 'markRead', conversationId: 'inbox-victim_example_com' },
        expected: 401
      },
      {
        name: 'offers list rejects anonymous callers',
        path: '/api/offers?action=fetchOffers',
        expected: 401
      },
      {
        name: 'offer lookup rejects anonymous callers',
        path: '/api/offers?action=getOffer&offerId=forged-offer-id',
        expected: 401
      },
      {
        name: 'offer mutation rejects anonymous callers',
        path: '/api/offers',
        method: 'POST',
        body: { action: 'acceptOffer', payload: { offerId: 'forged-offer-id' } },
        expected: 401
      },
      {
        name: 'orders fetchAll rejects anonymous caller with forged email',
        path: '/api/orders?action=fetchAll&email=victim@example.com',
        expected: 401
      },
      {
        name: 'worker session rejects anonymous callers',
        path: '/api/worker/session',
        expected: 401
      }
    ];

    const forgedCases = [
      {
        name: 'chat conversations reject forged admin JWT',
        path: '/api/chat/conversations',
        expected: 401
      },
      {
        name: 'offers reject forged admin JWT',
        path: '/api/offers?action=fetchOffers',
        expected: 401
      },
      {
        name: 'orders reject forged admin JWT',
        path: '/api/orders?action=fetchAll',
        expected: 401
      },
      {
        name: 'worker session rejects forged worker/admin JWT metadata',
        path: '/api/worker/session',
        expected: 401
      }
    ].map(testCase => ({
      ...testCase,
      headers: {
        Authorization: `Bearer ${forgedJwt}`
      }
    }));

    const allCases = [...unauthenticatedCases, ...forgedCases];

    for (const testCase of allCases) {
      const { response, text } = await request(baseUrl, testCase);
      assertStatus(testCase.name, response.status, testCase.expected);
      console.log(`✓ ${testCase.name} -> ${response.status}`);

      if (/victim@example\.com|forged-offer-id/.test(text) && response.status < 400) {
        throw new Error(`${testCase.name}: response reflected attacker-controlled private identifier`);
      }
    }

    const customerToken = process.env.SECURITY_TEST_CUSTOMER_TOKEN;
    if (customerToken) {
      const protectedCases = [
        {
          name: 'authenticated customer cannot create conversation for another account',
          path: '/api/chat/conversations',
          method: 'POST',
          headers: { Authorization: `Bearer ${customerToken}` },
          body: {
            action: 'getOrCreate',
            clientEmail: 'victim@example.com',
            chatType: 'inbox'
          },
          expected: 403
        },
        {
          name: 'normal customer cannot enter worker portal session',
          path: '/api/worker/session',
          headers: { Authorization: `Bearer ${customerToken}` },
          expected: 403
        }
      ];

      for (const testCase of protectedCases) {
        const { response } = await request(baseUrl, testCase);
        assertStatus(testCase.name, response.status, testCase.expected);
        console.log(`✓ ${testCase.name} -> ${response.status}`);
      }

      const foreignOfferId = process.env.SECURITY_TEST_FOREIGN_OFFER_ID;
      if (foreignOfferId) {
        const { response } = await request(baseUrl, {
          name: 'customer cannot retrieve another account offer',
          path: `/api/offers?action=getOffer&offerId=${encodeURIComponent(foreignOfferId)}`,
          headers: { Authorization: `Bearer ${customerToken}` }
        });
        assertStatus('customer cannot retrieve another account offer', response.status, 403);
        console.log('✓ customer cannot retrieve another account offer -> 403');
      }
    } else {
      console.log(
        'ℹ SECURITY_TEST_CUSTOMER_TOKEN not set; authenticated cross-account 403 probes were skipped.'
      );
    }

    console.log(`✓ Adversarial API integration suite passed (${allCases.length} mandatory probes).`);
  } finally {
    if (!server.killed) {
      server.kill('SIGTERM');
    }

    await new Promise(resolve => {
      const timer = setTimeout(resolve, 3000);
      server.once('exit', () => {
        clearTimeout(timer);
        resolve();
      });
    });

    if (server.exitCode && server.exitCode !== 0 && stderr) {
      console.warn('[Adversarial API Test] Next server stderr:', stderr.slice(-2000));
    }
  }
}

run().catch(error => {
  console.error('✗ Adversarial API integration suite failed:', error.message);
  process.exitCode = 1;
});
