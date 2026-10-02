import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { resolveAuthoritativePayment, PaymentAuthorizationError } from '../lib/payments/paymentAuthorization.js';
import { formatBoltAmount } from '../lib/payments/boltPayouts.js';
import { canAccessConversation } from '../lib/chat/authorization.js';
import { sanitizeCmsHtml } from '../lib/sanitizeHtml.js';

function makeSingleRowClient(tableRows) {
  return {
    from(table) {
      const row = tableRows[table] ?? null;
      const query = {
        select() { return query; },
        eq() { return query; },
        in() { return query; },
        maybeSingle: async () => ({ data: row, error: null })
      };
      return query;
    }
  };
}

describe('Security Hardening Regression Coverage', () => {
  test('Stripe/order payment amount is derived from the database, not the request body', async () => {
    const supabase = makeSingleRowClient({
      orders: {
        id: 'ORD-SEC-1',
        client_email: 'client@example.com',
        user_id: 'user-1',
        title: 'Secure order',
        price: 42.75,
        cost: 10,
        payment_status: 'pending',
        status: 'submitted'
      }
    });

    const payment = await resolveAuthoritativePayment({
      supabase,
      user: { id: 'user-1', email: 'client@example.com' },
      body: { type: 'order_payment', orderId: 'ORD-SEC-1', amount: 0.01 }
    });

    assert.equal(payment.amount, 42.75);
    assert.equal(payment.amountCents, 4275);
  });

  test('a user cannot pay another customer order', async () => {
    const supabase = makeSingleRowClient({
      orders: {
        id: 'ORD-SEC-2',
        client_email: 'owner@example.com',
        user_id: 'owner-id',
        price: 25,
        payment_status: 'pending',
        status: 'submitted'
      }
    });

    await assert.rejects(
      () => resolveAuthoritativePayment({
        supabase,
        user: { id: 'attacker-id', email: 'attacker@example.com' },
        body: { type: 'order_payment', orderId: 'ORD-SEC-2' }
      }),
      error => error instanceof PaymentAuthorizationError && error.status === 403
    );
  });

  test('custom offer payment derives the final price and enforces ownership', async () => {
    const supabase = makeSingleRowClient({
      custom_offers: {
        id: 'OFFER-SEC-1',
        client_email: 'client@example.com',
        customer_id: 'user-1',
        title: 'Logo digitizing',
        service_type: 'Embroidery Digitizing',
        price: 50,
        final_price: 37.5,
        status: 'pending',
        payment_status: 'pending',
        conversation_id: 'conv-1',
        order_id: null
      }
    });

    const payment = await resolveAuthoritativePayment({
      supabase,
      user: { id: 'user-1', email: 'client@example.com' },
      body: { type: 'custom_offer', offerId: 'OFFER-SEC-1', amount: 1 }
    });

    assert.equal(payment.amountCents, 3750);
    assert.equal(payment.conversationId, 'conv-1');
  });

  test('wallet deposits are bounded and identity comes from the authenticated user', async () => {
    const user = { id: 'user-1', email: 'client@example.com' };
    const payment = await resolveAuthoritativePayment({
      supabase: makeSingleRowClient({}),
      user,
      body: { type: 'deposit', amount: 100, clientEmail: 'other@example.com' },
      allowDeposit: true
    });
    assert.equal(payment.targetEmail, user.email);
    assert.equal(payment.amountCents, 10000);

    await assert.rejects(
      () => resolveAuthoritativePayment({
        supabase: makeSingleRowClient({}),
        user,
        body: { type: 'deposit', amount: 5001 },
        allowDeposit: true
      }),
      error => error instanceof PaymentAuthorizationError && error.status === 400
    );
  });

  test('conversation access is restricted to the owning customer unless admin', async () => {
    const supabase = makeSingleRowClient({
      conversations: { id: 'conv-sec', client_email: 'owner@example.com' }
    });

    assert.equal(await canAccessConversation(
      supabase,
      { user: { email: 'owner@example.com' }, isAdmin: false },
      'conv-sec'
    ), true);

    assert.equal(await canAccessConversation(
      supabase,
      { user: { email: 'other@example.com' }, isAdmin: false },
      'conv-sec'
    ), false);

    assert.equal(await canAccessConversation(
      supabase,
      { user: { email: 'admin@example.com' }, isAdmin: true },
      'conv-sec'
    ), true);
  });

  test('CMS sanitizer neutralizes executable markup before React rendering', () => {
    const dirty = '<h1>Terms</h1><script>alert(1)</script><a href="javascript:alert(1)">Click</a><br>Safe';
    const clean = sanitizeCmsHtml(dirty);
    assert.equal(clean.includes('<script'), false);
    assert.equal(clean.includes('javascript:'), false);
    assert.ok(clean.includes('Terms'));
    assert.ok(clean.includes('Safe'));
  });

  test('legacy Stripe webhook path delegates to one canonical handler', () => {
    const legacy = fs.readFileSync('app/api/checkout/webhook/route.js', 'utf8');
    assert.match(legacy, /canonicalStripeWebhook/);
    assert.match(legacy, /from\s*['"]\.\.\/\.\.\/webhooks\/stripe\/route['"]/);
    assert.equal(legacy.includes('constructEvent'), false);
  });

  test('privileged Supabase client never falls back to the public anon key', () => {
    const adminClientSource = fs.readFileSync('src/lib/supabase/admin.js', 'utf8');
    assert.match(adminClientSource, /SUPABASE_SERVICE_ROLE_KEY/);
    assert.equal(adminClientSource.includes('|| process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY'), false);
  });

  test('Google sign-in verifies the Google credential server-side instead of trusting profile JSON', () => {
    const source = fs.readFileSync('app/api/auth/google/route.js', 'utf8');
    assert.match(source, /oauth2\.googleapis\.com\/tokeninfo/);
    assert.match(source, /tokenAudience/);
    assert.match(source, /accessToken/);
    assert.equal(source.includes('const { userInfo } ='), false);
    assert.match(source, /checkDistributedRateLimit/);
  });

  test('AI polish requires authentication and never accepts browser-controlled Gemini secrets', () => {
    const source = fs.readFileSync('app/api/chat/ai-polish/route.js', 'utf8');
    assert.match(source, /getServerAuthUser/);
    assert.match(source, /checkDistributedRateLimit/);
    assert.match(source, /private_server_config/);
    assert.equal(source.includes('customKey'), false);
    assert.equal(source.includes('NEXT_PUBLIC_GEMINI_API_KEY'), false);
  });

  test('Gemini admin configuration stores secrets privately and never uses public env keys', () => {
    const source = fs.readFileSync('app/api/admin/gemini-status/route.js', 'utf8');
    assert.match(source, /private_server_config/);
    assert.equal(source.includes('NEXT_PUBLIC_GEMINI_API_KEY'), false);
    const migration = fs.readFileSync('supabase/migrations/20260928000002_private_gemini_secret.sql', 'utf8');
    assert.match(migration, /DELETE FROM public\.site_config/);
    assert.match(migration, /private_server_config/);
  });

  test('worker registration cannot overwrite an existing Auth password or self-promote to worker', () => {
    const source = fs.readFileSync('app/api/worker/register/route.js', 'utf8');
    assert.match(source, /auth\.signUp/);
    assert.match(source, /worker_applicant/);
    assert.equal(source.includes('auth.admin.updateUserById'), false);
    assert.equal(source.includes('email_confirm: true'), false);
    assert.match(source, /checkDistributedRateLimit/);
  });

  test('public auth and telemetry entry points use shared rate limiting', () => {
    for (const file of [
      'app/api/auth/google/route.js',
      'app/api/auth/reset-password/route.js',
      'app/api/worker/login/route.js',
      'app/api/worker/register/route.js',
      'app/api/tracking/route.js'
    ]) {
      const source = fs.readFileSync(file, 'utf8');
      assert.match(source, /checkDistributedRateLimit/, `${file} must use distributed rate limiting`);
    }
  });

  test('tracking hashes user identifiers before forwarding them to Meta CAPI', () => {
    const source = fs.readFileSync('app/api/tracking/route.js', 'utf8');
    assert.match(source, /createHash\('sha256'\)/);
    assert.equal(source.includes('em: fullTelemetry.userEmail ? [fullTelemetry.userEmail]'), false);
  });

  test('private and legacy downloads require authentication and non-admin callers stay RLS scoped', () => {
    const source = fs.readFileSync('app/api/download/route.js', 'utf8');
    assert.match(source, /getServerAuthUser/);
    assert.match(source, /createServerSupabaseClient/);
    assert.match(source, /Authentication required for private file resolution/);
    assert.match(source, /isAdmin \? createAdminClient\(\) : await createServerSupabaseClient\(\)/);
  });

  test('public health output does not disclose secret configuration or raw database errors', () => {
    const source = fs.readFileSync('app/api/health/route.js', 'utf8');
    assert.equal(source.includes('SUPABASE_SERVICE_ROLE_KEY'), false);
    assert.equal(source.includes('STRIPE_SECRET_KEY'), false);
    assert.equal(source.includes('RESEND_API_KEY'), false);
    assert.equal(source.includes('dbError'), false);
  });
  test('final hardening removes public secrets and anonymous access to private account data', () => {
    const migration = fs.readFileSync('supabase/migrations/20261002000002_final_security_hardening.sql', 'utf8');
    assert.match(migration, /WHERE key IN \('notification_webhook_secret', 'boltpayouts_config'\)/);
    assert.match(migration, /'vapid_private_key'/);
    assert.match(migration, /REVOKE ALL ON public\.admins FROM anon, authenticated/);
    assert.match(migration, /DROP POLICY IF EXISTS "Allow public and service access to notifications"/);
    assert.match(migration, /REVOKE ALL ON public\.email_notification_logs FROM anon, authenticated/);
    assert.match(migration, /CREATE POLICY "site_config_public_read"/);
  });

  test('wallet settlement RPCs are service-only and provider deposits are idempotent', () => {
    const migration = fs.readFileSync('supabase/migrations/20261002000002_final_security_hardening.sql', 'utf8');
    assert.match(migration, /CREATE OR REPLACE FUNCTION public\.settle_wallet_deposit_once/);
    assert.match(migration, /ON CONFLICT \(provider_reference\).*DO NOTHING/s);
    assert.match(migration, /REVOKE ALL ON FUNCTION public\.deposit_funds\(text, numeric, text\)[\s\S]*FROM PUBLIC, anon, authenticated/);
    assert.match(migration, /GRANT EXECUTE ON FUNCTION public\.deduct_wallet_balance\(text, numeric, text\) TO service_role/);
  });

  test('Bolt provider receives the exact server-authoritative amount without .99 price mutation', () => {
    assert.equal(formatBoltAmount(37.5), 37.5);
    assert.equal(formatBoltAmount(16), 16);
    assert.equal(formatBoltAmount(19.99), 19.99);
    assert.equal(Number.isNaN(formatBoltAmount(0)), true);
  });

  test('Bolt payments use private configuration, authenticated status lookup and idempotent settlement', () => {
    const createRoute = fs.readFileSync('app/api/boltpayouts/create/route.js', 'utf8');
    const statusRoute = fs.readFileSync('app/api/boltpayouts/status/route.js', 'utf8');
    const webhookRoute = fs.readFileSync('app/api/boltpayouts/webhook/route.js', 'utf8');
    const helper = fs.readFileSync('src/lib/payments/boltPayouts.js', 'utf8');

    assert.match(createRoute, /getBoltPayoutsConfig/);
    assert.equal(createRoute.includes("from('site_config')"), false);
    assert.match(statusRoute, /getServerAuthUser/);
    assert.match(statusRoute, /Authentication required/);
    assert.equal(statusRoute.includes("from('site_config')"), false);
    assert.match(webhookRoute, /timingSafeEqual/);
    assert.equal(webhookRoute.includes("from('site_config')"), false);
    assert.match(helper, /privateServerConfig/);
    assert.match(helper, /settle_wallet_deposit_once/);
    assert.match(helper, /provider_reference/);
  });

});
