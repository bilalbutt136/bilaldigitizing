import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  getVapidConfig,
  getVapidPublicKey,
  formatChatMessagePush,
  formatOrderPush,
  savePushSubscription
} from '../lib/pushService.js';

describe('Native Web Push Notification Engine', () => {
  it('1. Successfully resolves VAPID public and private keys', async () => {
    const config = await getVapidConfig();
    assert.ok(config, 'VAPID config should be returned');
    assert.ok(typeof config.publicKey === 'string' && config.publicKey.length > 20, 'Public key must be valid base64url string');
    assert.ok(typeof config.privateKey === 'string' && config.privateKey.length > 10, 'Private key must be valid');
    assert.ok(config.subject.startsWith('mailto:'), 'Subject must be mailto URI');
  });

  it('2. getVapidPublicKey returns valid applicationServerKey string', async () => {
    const pubKey = await getVapidPublicKey();
    assert.ok(pubKey, 'Public key must not be empty');
    assert.strictEqual(typeof pubKey, 'string');
    assert.ok(pubKey.length >= 65, 'VAPID P-256 public key should be at least 65 chars base64url');
  });

  it('3. formatChatMessagePush generates native mobile notification payload with WhatsApp haptics', () => {
    const payload = formatChatMessagePush({
      senderName: 'John Doe',
      messageText: 'Can you please check the cap stitch file density?',
      conversationId: 'conv_123',
      isSupport: false,
      targetRole: 'admin'
    });

    assert.strictEqual(payload.title, '💬 John Doe');
    assert.strictEqual(payload.body, 'Can you please check the cap stitch file density?');
    assert.strictEqual(payload.tag, 'chat-conv_123');
    assert.ok(Array.isArray(payload.vibrate), 'Must specify vibration array for haptics');
    assert.deepStrictEqual(payload.vibrate, [200, 100, 200, 100, 200]);
    assert.strictEqual(payload.url, '/admin-portal?tab=inbox');
    assert.ok(payload.actions.length >= 2, 'Must provide interactive action buttons');
    assert.strictEqual(payload.actions[0].action, 'open');
  });

  it('4. formatOrderPush generates distinct native payloads for admin and client', () => {
    // Admin payload
    const adminNotif = formatOrderPush({
      orderId: '2280',
      clientName: 'Sarah Smith',
      serviceName: 'Embroidery Digitizing',
      status: 'Received',
      targetRole: 'admin'
    });

    assert.strictEqual(adminNotif.title, '🎉 New Order #2280');
    assert.ok(adminNotif.body.includes('Sarah Smith'));
    assert.ok(adminNotif.url.includes('/admin-portal'));

    // Client payload
    const clientNotif = formatOrderPush({
      orderId: '2280',
      clientName: 'Sarah Smith',
      serviceName: 'Embroidery Digitizing',
      status: 'Confirmed',
      targetRole: 'client'
    });

    assert.strictEqual(clientNotif.title, '✅ Order #2280 Confirmed');
    assert.ok(clientNotif.body.includes('received and queued'));
    assert.ok(clientNotif.url.includes('/client'));
  });

  it('5. savePushSubscription rejects invalid subscription objects missing keys or endpoint', async () => {
    await assert.rejects(
      async () => {
        await savePushSubscription({ subscription: null });
      },
      /Invalid push subscription/
    );

    await assert.rejects(
      async () => {
        await savePushSubscription({
          subscription: { endpoint: 'https://example.com' }
        });
      },
      /Invalid push subscription/
    );
  });
});
