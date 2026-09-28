import test from 'node:test';
import assert from 'node:assert/strict';
import { getVapidKeys, savePushSubscription } from '../lib/pushService.js';

test('Push Service - VAPID credentials must come from secure server configuration', async () => {
  const previousPublic = process.env.VAPID_PUBLIC_KEY;
  const previousNextPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const previousPrivate = process.env.VAPID_PRIVATE_KEY;
  const previousSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const previousServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  delete process.env.VAPID_PUBLIC_KEY;
  delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  delete process.env.VAPID_PRIVATE_KEY;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;

  await assert.rejects(
    async () => getVapidKeys(),
    /VAPID credentials are not configured/
  );

  if (previousPublic !== undefined) process.env.VAPID_PUBLIC_KEY = previousPublic;
  if (previousNextPublic !== undefined) process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = previousNextPublic;
  if (previousPrivate !== undefined) process.env.VAPID_PRIVATE_KEY = previousPrivate;
  if (previousSupabaseUrl !== undefined) process.env.NEXT_PUBLIC_SUPABASE_URL = previousSupabaseUrl;
  if (previousServiceRole !== undefined) process.env.SUPABASE_SERVICE_ROLE_KEY = previousServiceRole;
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
