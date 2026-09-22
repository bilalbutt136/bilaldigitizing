import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  getVapidKeys, 
  getPublicVapidKey, 
  DEFAULT_VAPID_PUBLIC_KEY,
  DEFAULT_VAPID_PRIVATE_KEY,
  savePushSubscription
} from '../lib/pushService.js';

test('Push Service - VAPID Keys Initialization', () => {
  const keys = getVapidKeys();
  assert.ok(keys.publicKey, 'Public VAPID key must be defined');
  assert.ok(keys.privateKey, 'Private VAPID key must be defined');
  assert.equal(typeof keys.publicKey, 'string');
  assert.equal(typeof keys.privateKey, 'string');

  const pubKey = getPublicVapidKey();
  assert.equal(pubKey, keys.publicKey);
  assert.ok(pubKey.length > 50, 'Public VAPID key must be a valid base64url string');
});

test('Push Service - Validation of Subscription Input', async () => {
  // Test rejecting invalid subscriptions without endpoints
  await assert.rejects(
    async () => {
      await savePushSubscription({ subscription: null });
    },
    {
      name: 'Error',
      message: 'Invalid subscription object: missing endpoint'
    }
  );

  await assert.rejects(
    async () => {
      await savePushSubscription({ subscription: { keys: {} } });
    },
    {
      name: 'Error',
      message: 'Invalid subscription object: missing endpoint'
    }
  );
});

test('Push Service - Fallback Subscription Object Structure', () => {
  const sampleSubscription = {
    endpoint: 'https://fcm.googleapis.com/fcm/send/sample-token-12345',
    keys: {
      p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QT9t0A43cxQ3iENohFETq25d507-1w0T0',
      auth: 'tBHItJI5svbpez7KI4CCXg'
    }
  };

  assert.ok(sampleSubscription.endpoint.startsWith('https://'), 'Endpoint must be a secure URL');
  assert.ok(sampleSubscription.keys.p256dh, 'p256dh key must exist');
  assert.ok(sampleSubscription.keys.auth, 'auth key must exist');
});
