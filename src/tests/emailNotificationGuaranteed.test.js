import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { 
  RESEND_VERIFIED_FALLBACK_EMAIL, 
  resolveAdminNotificationConfig,
  sendNotificationEmail 
} from '../lib/emailService.js';

describe('Guaranteed Admin Email Notification & Auto-Failover System', () => {
  const originalApiKey = process.env.RESEND_API_KEY;

  test('1. Verified sandbox fallback email is locked to Resend account owner bilalsadiq612@gmail.com', () => {
    assert.equal(RESEND_VERIFIED_FALLBACK_EMAIL, 'bilalsadiq612@gmail.com');
  });

  test('2. resolveAdminNotificationConfig returns configured email and preferences', async () => {
    const configDefault = await resolveAdminNotificationConfig();
    assert.ok(configDefault.adminEmail.includes('@'));
    assert.equal(typeof configDefault.notificationPrefs, 'object');
    assert.equal(configDefault.notificationPrefs.orderAlerts, true);
    assert.equal(configDefault.notificationPrefs.messageAlerts, true);
  });

  test('3. NEW_MESSAGE notification builds full customer context and deep link', async () => {
    process.env.RESEND_API_KEY = 're_mock_test_key_123';
    const originalFetch = globalThis.fetch;
    let capturedBody = null;

    globalThis.fetch = async (url, options) => {
      if (String(url).includes('resend.com')) {
        capturedBody = JSON.parse(options.body);
        return new Response(JSON.stringify({ id: 'mock_msg_email_123' }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        });
      }
      return originalFetch(url, options);
    };

    try {
      const result = await sendNotificationEmail({
        type: 'NEW_MESSAGE',
        senderName: 'John Doe (StitchCraft LLC)',
        clientEmail: 'john@stitchcraft.com',
        messageText: 'Can you please digitize this logo at 3.5 inches for a flexfit cap?',
        channel: 'Inbox (#ORD-8821)',
        orderId: 'ORD-8821',
        attachments: [{ name: 'logo_stitchcraft.png', size: 24000 }]
      });

      assert.equal(result.success, true);
      assert.ok(capturedBody);
      assert.ok(capturedBody.subject.includes('New Customer Message: John Doe (StitchCraft LLC)'));
      assert.ok(capturedBody.subject.includes('ORD-8821'));
      assert.ok(capturedBody.html.includes('Can you please digitize this logo'));
      assert.ok(capturedBody.html.includes('john@stitchcraft.com'));
      assert.ok(capturedBody.html.includes('logo_stitchcraft.png'));
      assert.ok(capturedBody.html.includes('tab=chat'));
    } finally {
      globalThis.fetch = originalFetch;
      process.env.RESEND_API_KEY = originalApiKey;
    }
  });

  test('4. NEW_ORDER notification formats all production specifications', async () => {
    process.env.RESEND_API_KEY = 're_mock_test_key_123';
    const originalFetch = globalThis.fetch;
    const capturedRequests = [];

    globalThis.fetch = async (url, options) => {
      if (String(url).includes('resend.com')) {
        const body = JSON.parse(options.body);
        capturedRequests.push(body);
        return new Response(JSON.stringify({ id: `mock_ord_${capturedRequests.length}` }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        });
      }
      return originalFetch(url, options);
    };

    try {
      const result = await sendNotificationEmail({
        type: 'NEW_ORDER',
        orderId: 'ORD-PROD-7701',
        serviceName: 'Embroidery Digitizing',
        orderDetails: {
          orderId: 'ORD-PROD-7701',
          serviceCategory: 'Embroidery Digitizing',
          tier: 'Left Chest & Cap',
          price: 35.00,
          fabricType: 'Heavy Pique Knit',
          requiredFormat: 'DST, EMB, PDF',
          turnaround: 'Rush 4-6 Hours',
          clientNotes: 'Keep stitch density standard, sharp underlay required.'
        },
        clientEmail: 'production@apparelpro.com'
      });

      assert.equal(result.success, true);
      assert.equal(capturedRequests.length, 2); // Admin notification + Client confirmation
      
      const adminEmailBody = capturedRequests[0];
      assert.ok(adminEmailBody.subject.includes('New Order #ORD-PROD-7701'));
      assert.ok(adminEmailBody.subject.includes('$35.00'));
      assert.ok(adminEmailBody.html.includes('Embroidery Digitizing'));
      assert.ok(adminEmailBody.html.includes('Heavy Pique Knit'));
      assert.ok(adminEmailBody.html.includes('DST, EMB, PDF'));
      assert.ok(adminEmailBody.html.includes('Rush 4-6 Hours'));
      assert.ok(adminEmailBody.html.includes('tab=orders'));

      const clientEmailBody = capturedRequests[1];
      assert.ok(clientEmailBody.subject.includes('Order Confirmation: #ORD-PROD-7701'));
    } finally {
      globalThis.fetch = originalFetch;
      process.env.RESEND_API_KEY = originalApiKey;
    }
  });

  test('5. Automatic sandbox failover rescues unverified recipient (403 validation error)', async () => {
    process.env.RESEND_API_KEY = 're_mock_test_key_123';
    const originalFetch = globalThis.fetch;
    const calls = [];

    globalThis.fetch = async (url, options) => {
      if (String(url).includes('resend.com')) {
        const body = JSON.parse(options.body);
        calls.push(body);

        // First attempt to an unverified email fails with Resend 403
        if (body.to === 'unverified_admin@externaldomain.com' || (Array.isArray(body.to) && body.to[0] === 'unverified_admin@externaldomain.com')) {
          return new Response(JSON.stringify({
            statusCode: 403,
            message: 'You can only send testing emails to your own email address (bilalsadiq612@gmail.com)',
            name: 'validation_error'
          }), {
            status: 403,
            headers: { 'content-type': 'application/json' }
          });
        }

        // Retry to verified fallback succeeds
        if (body.to === 'bilalsadiq612@gmail.com' || (Array.isArray(body.to) && body.to[0] === 'bilalsadiq612@gmail.com')) {
          return new Response(JSON.stringify({ id: 'fallback_success_789' }), {
            status: 200,
            headers: { 'content-type': 'application/json' }
          });
        }
      }
      return originalFetch(url, options);
    };

    try {
      const result = await sendNotificationEmail({
        type: 'NEW_MESSAGE',
        adminEmail: 'unverified_admin@externaldomain.com',
        senderName: 'Test Client',
        messageText: 'Testing failover'
      });

      // The call must succeed via fallback!
      assert.equal(result.success, true);
      assert.equal(result.fallbackApplied, true);
      assert.equal(result.recipient, 'bilalsadiq612@gmail.com');
      assert.equal(calls.length, 2);
    } finally {
      globalThis.fetch = originalFetch;
      process.env.RESEND_API_KEY = originalApiKey;
    }
  });

  test('6. Non-blocking error containment never throws unhandled exceptions', async () => {
    process.env.RESEND_API_KEY = 're_mock_test_key_123';
    const originalFetch = globalThis.fetch;

    globalThis.fetch = async () => {
      throw new Error('Simulated upstream network timeout or DNS failure');
    };

    try {
      // Must return { success: false } safely without crashing callers
      const result = await sendNotificationEmail({
        type: 'NEW_ORDER',
        orderDetails: { orderId: 'ORD-CRASH-TEST', price: 10 }
      });

      assert.equal(result.success, false);
      assert.ok(result.error);
    } finally {
      globalThis.fetch = originalFetch;
      process.env.RESEND_API_KEY = originalApiKey;
    }
  });

  test('7. Multiple admin notification emails dispatch in parallel to all recipients', async () => {
    process.env.RESEND_API_KEY = 're_mock_test_key_123';
    const originalFetch = globalThis.fetch;
    const capturedRecipients = [];

    globalThis.fetch = async (url, options) => {
      if (String(url).includes('resend.com')) {
        const body = JSON.parse(options.body);
        capturedRecipients.push(body.to);
        return new Response(JSON.stringify({ id: `mock_multi_${capturedRecipients.length}` }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        });
      }
      return originalFetch(url, options);
    };

    try {
      const result = await sendNotificationEmail({
        type: 'NEW_ORDER',
        orderId: 'ORD-MULTI-999',
        serviceName: 'Vector Art & Digitizing',
        adminEmails: ['bilalsadiq612@gmail.com', 'partner@bdigitizing.com', 'manager@bdigitizing.com'],
        orderDetails: {
          orderId: 'ORD-MULTI-999',
          price: 45.00
        },
        clientEmail: 'client@apparel.com'
      });

      assert.equal(result.success, true);
      assert.deepEqual(result.recipients, ['bilalsadiq612@gmail.com', 'partner@bdigitizing.com', 'manager@bdigitizing.com']);
      // 3 admin recipients + 1 client confirmation
      assert.equal(capturedRecipients.length, 4);
      assert.ok(capturedRecipients.includes('bilalsadiq612@gmail.com'));
      assert.ok(capturedRecipients.includes('partner@bdigitizing.com'));
      assert.ok(capturedRecipients.includes('manager@bdigitizing.com'));
      assert.ok(capturedRecipients.includes('client@apparel.com'));
    } finally {
      globalThis.fetch = originalFetch;
      process.env.RESEND_API_KEY = originalApiKey;
    }
  });

  test('8. TEST_EMAIL dispatches to all configured admin recipients with accurate diagnostics', async () => {
    process.env.RESEND_API_KEY = 're_mock_test_key_123';
    const originalFetch = globalThis.fetch;
    const sentSubjects = [];
    const sentTo = [];

    globalThis.fetch = async (url, options) => {
      if (String(url).includes('resend.com')) {
        const body = JSON.parse(options.body);
        sentSubjects.push(body.subject);
        sentTo.push(body.to);
        return new Response(JSON.stringify({ id: `mock_test_${sentTo.length}` }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        });
      }
      return originalFetch(url, options);
    };

    try {
      const result = await sendNotificationEmail({
        type: 'TEST_EMAIL',
        adminEmails: ['admin1@bdigitizing.com', 'admin2@bdigitizing.com']
      });

      assert.equal(result.success, true);
      assert.equal(sentTo.length, 2);
      assert.deepEqual(sentTo, ['admin1@bdigitizing.com', 'admin2@bdigitizing.com']);
      assert.ok(sentSubjects[0].includes('Test Notification: BDigitizing System Alerts'));
    } finally {
      globalThis.fetch = originalFetch;
      process.env.RESEND_API_KEY = originalApiKey;
    }
  });
});
