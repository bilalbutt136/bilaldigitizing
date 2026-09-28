import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { resolveAuthoritativePayment, PaymentAuthorizationError } from '../lib/payments/paymentAuthorization.js';
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
});
