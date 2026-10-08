import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  sendNotificationEmail,
  checkAndSetEmailDedup,
  emailNotificationDedupCache,
  RESEND_VERIFIED_FALLBACK_EMAIL
} from '../lib/emailService.js';
import { sendOrderNotification } from '../lib/email.js';

describe('Order Email Deduplication & Single-Alert Guarantee', () => {
  const originalApiKey = process.env.RESEND_API_KEY;

  beforeEach(() => {
    emailNotificationDedupCache.clear();
  });

  test('1. checkAndSetEmailDedup sets key on first call and flags duplicate on second call', () => {
    const key = 'NEW_ORDER:test-ord-123';
    assert.equal(checkAndSetEmailDedup(key), false, 'First call must not be a duplicate');
    assert.equal(checkAndSetEmailDedup(key), true, 'Second call must be flagged as duplicate');
  });

  test('2. Two consecutive sendNotificationEmail calls for same NEW_ORDER suppress the second dispatch', async () => {
    process.env.RESEND_API_KEY = 're_mock_test_key_123';
    const originalFetch = globalThis.fetch;
    const sentRequests = [];

    globalThis.fetch = async (url, options) => {
      if (String(url).includes('resend.com')) {
        const body = JSON.parse(options.body);
        sentRequests.push(body);
        return new Response(JSON.stringify({ id: `mock_email_${sentRequests.length}` }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        });
      }
      return originalFetch(url, options);
    };

    try {
      const orderPayload = {
        type: 'NEW_ORDER',
        orderId: 'DEDUP-9001',
        serviceName: 'Custom Digitizing',
        clientEmail: 'customer9001@example.com',
        clientName: 'Jane Customer',
        amount: 25.00,
        orderDetails: {
          id: 'DEDUP-9001',
          price: 25.00
        }
      };

      // First dispatch: should succeed and send emails
      const firstResult = await sendNotificationEmail(orderPayload);
      assert.equal(firstResult.success, true);
      assert.equal(Boolean(firstResult.duplicateSuppressed), false);

      const requestCountAfterFirst = sentRequests.length;
      assert.ok(requestCountAfterFirst >= 1, 'First dispatch must have sent emails');

      // Second dispatch with same order ID: MUST be suppressed!
      const secondResult = await sendNotificationEmail(orderPayload);
      assert.equal(secondResult.success, true);
      assert.equal(secondResult.duplicateSuppressed, true);
      assert.ok(secondResult.message.includes('suppressed'));

      // No new requests should have been made to Resend
      assert.equal(sentRequests.length, requestCountAfterFirst, 'Duplicate call must NOT make additional Resend API calls');
    } finally {
      globalThis.fetch = originalFetch;
      process.env.RESEND_API_KEY = originalApiKey;
    }
  });

  test('3. Placing an order where clientEmail is also adminEmail dispatches exactly ONE email to that address', async () => {
    process.env.RESEND_API_KEY = 're_mock_test_key_123';
    const originalFetch = globalThis.fetch;
    const sentRecipients = [];

    globalThis.fetch = async (url, options) => {
      if (String(url).includes('resend.com')) {
        const body = JSON.parse(options.body);
        sentRecipients.push(body.to);
        return new Response(JSON.stringify({ id: `mock_ord_${sentRecipients.length}` }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        });
      }
      return originalFetch(url, options);
    };

    try {
      // The admin orders using their own email
      const result = await sendNotificationEmail({
        type: 'NEW_ORDER',
        orderId: 'SELF-TEST-100',
        serviceName: 'Embroidery Digitizing',
        clientEmail: 'admin@bdigitizing.com',
        adminEmails: ['admin@bdigitizing.com'],
        orderDetails: {
          id: 'SELF-TEST-100',
          price: 15.00
        }
      });

      assert.equal(result.success, true);
      // Exactly 1 email to admin@bdigitizing.com (the admin alert), NOT two!
      assert.equal(sentRecipients.length, 1);
      assert.equal(sentRecipients[0], 'admin@bdigitizing.com');
    } finally {
      globalThis.fetch = originalFetch;
      process.env.RESEND_API_KEY = originalApiKey;
    }
  });

  test('4. Client confirmation delivery failure (e.g. sandbox restriction) suppresses fallback to admin inbox', async () => {
    process.env.RESEND_API_KEY = 're_mock_test_key_123';
    const originalFetch = globalThis.fetch;
    const sentPayloads = [];

    globalThis.fetch = async (url, options) => {
      if (String(url).includes('resend.com')) {
        const body = JSON.parse(options.body);
        sentPayloads.push(body);

        // If sent to unverified client, simulate Resend sandbox 403
        if (body.to === 'unverified_client@somedomain.com') {
          return new Response(JSON.stringify({
            statusCode: 403,
            message: `You can only send testing emails to your own email address (${RESEND_VERIFIED_FALLBACK_EMAIL})`,
            name: 'validation_error'
          }), {
            status: 403,
            headers: { 'content-type': 'application/json' }
          });
        }

        // Admin email delivery succeeds
        return new Response(JSON.stringify({ id: 'mock_admin_notif_ok' }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        });
      }
      return originalFetch(url, options);
    };

    try {
      const result = await sendNotificationEmail({
        type: 'NEW_ORDER',
        orderId: 'SANDBOX-TEST-200',
        serviceName: 'Cap Digitizing',
        clientEmail: 'unverified_client@somedomain.com',
        adminEmails: [RESEND_VERIFIED_FALLBACK_EMAIL],
        orderDetails: {
          id: 'SANDBOX-TEST-200',
          price: 20.00
        }
      });

      assert.equal(result.success, true);

      // The admin inbox should have received ONLY 1 email: the admin alert.
      // It should NOT receive a second "[STUDIO ALERT] 🌟 Order Confirmation" fallback!
      const toFallbackCount = sentPayloads.filter(p => p.to === RESEND_VERIFIED_FALLBACK_EMAIL).length;
      assert.equal(toFallbackCount, 1, 'Admin inbox must receive exactly 1 email, not a duplicate fallback');
      assert.ok(sentPayloads[0].subject.includes('New Order #SANDBOX-TEST-200'));
    } finally {
      globalThis.fetch = originalFetch;
      process.env.RESEND_API_KEY = originalApiKey;
    }
  });

  test('5. sendOrderNotification in email.js deduplicates repeated calls for same order', async () => {
    const result1 = await sendOrderNotification({
      orderId: 'DUP-ORDER-777',
      clientEmail: 'other@example.com',
      targetRole: 'both'
    });

    const result2 = await sendOrderNotification({
      orderId: 'DUP-ORDER-777',
      clientEmail: 'other@example.com',
      targetRole: 'both'
    });

    assert.equal(result2.duplicateSuppressed, true);
    assert.equal(result2.success, true);
  });
});
