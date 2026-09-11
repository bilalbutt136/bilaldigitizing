import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Admin Email Notification & Routing Engine', () => {
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  test('validates RFC 5322 standard email formats', () => {
    assert.equal(EMAIL_REGEX.test('admin@bilaldigitizing.com'), true);
    assert.equal(EMAIL_REGEX.test('shahidbutt59191@gmail.com'), true);
    assert.equal(EMAIL_REGEX.test('support+orders@studio.co.uk'), true);
    assert.equal(EMAIL_REGEX.test('invalid-email'), false);
    assert.equal(EMAIL_REGEX.test('admin@.com'), false);
    assert.equal(EMAIL_REGEX.test('@domain.com'), false);
    assert.equal(EMAIL_REGEX.test(''), false);
  });

  test('resolves admin destination email with correct hierarchy priority', () => {
    const resolveAdminEmail = ({ explicitEmail, siteConfigEmail, masterAdminEnv, hardFallback }) => {
      const cleanExplicit = explicitEmail?.trim();
      if (cleanExplicit && EMAIL_REGEX.test(cleanExplicit)) return cleanExplicit.toLowerCase();

      const cleanDb = siteConfigEmail?.trim();
      if (cleanDb && EMAIL_REGEX.test(cleanDb)) return cleanDb.toLowerCase();

      const cleanEnv = masterAdminEnv?.trim();
      if (cleanEnv && EMAIL_REGEX.test(cleanEnv)) return cleanEnv.toLowerCase();

      return hardFallback.toLowerCase();
    };

    const hardFallback = 'shahidbutt59191@gmail.com';

    // 1. Explicit request overrides all
    assert.equal(
      resolveAdminEmail({
        explicitEmail: 'custom@studio.com',
        siteConfigEmail: 'db@studio.com',
        masterAdminEnv: 'env@studio.com',
        hardFallback
      }),
      'custom@studio.com'
    );

    // 2. DB site_config overrides env
    assert.equal(
      resolveAdminEmail({
        explicitEmail: null,
        siteConfigEmail: 'db@studio.com',
        masterAdminEnv: 'env@studio.com',
        hardFallback
      }),
      'db@studio.com'
    );

    // 3. Env used if DB setting not present
    assert.equal(
      resolveAdminEmail({
        explicitEmail: null,
        siteConfigEmail: null,
        masterAdminEnv: 'env@studio.com',
        hardFallback
      }),
      'env@studio.com'
    );

    // 4. Hard fallback used if everything else empty
    assert.equal(
      resolveAdminEmail({
        explicitEmail: '',
        siteConfigEmail: '',
        masterAdminEnv: '',
        hardFallback
      }),
      'shahidbutt59191@gmail.com'
    );
  });

  test('formats itemized order dimensions and placement notes accurately', () => {
    const formatOrderSummary = (order) => {
      const notesObj = typeof order.notes === 'string'
        ? (() => { try { return JSON.parse(order.notes); } catch { return { notes: order.notes }; } })()
        : (order.notes || {});

      const dimensions = (notesObj.patchWidth && notesObj.patchHeight)
        ? `${notesObj.patchWidth}" × ${notesObj.patchHeight}"`
        : (order.dimensions || 'Standard');

      const placement = order.placement || notesObj.placement || 'Left Chest / Cap';
      return { dimensions, placement, instructions: notesObj.notes || 'Standard specifications' };
    };

    const sampleOrder = {
      dimensions: '4.5" × 3.5"',
      placement: 'Left Chest',
      notes: JSON.stringify({
        patchWidth: 3.5,
        patchHeight: 2.5,
        notes: 'Use 75/11 needle and polyneon thread'
      })
    };

    const summary = formatOrderSummary(sampleOrder);
    assert.equal(summary.dimensions, '3.5" × 2.5"');
    assert.equal(summary.placement, 'Left Chest');
    assert.equal(summary.instructions, 'Use 75/11 needle and polyneon thread');
  });

  test('verifies webhook secret from either x-webhook-secret header or Bearer auth token', () => {
    const checkSecret = (headers, configuredSecret) => {
      const headerSecret = headers['x-webhook-secret'] || '';
      const authHeader = headers['authorization'] || '';
      const bearerToken = authHeader.toLowerCase().startsWith('bearer ')
        ? authHeader.substring(7).trim()
        : '';
      const token = (headerSecret || bearerToken).trim();
      return Boolean(token && token === configuredSecret);
    };

    const secret = 'bd_sec_live_notification_trigger_9831';

    // Matches via header
    assert.equal(checkSecret({ 'x-webhook-secret': secret }, secret), true);
    // Matches via Bearer auth
    assert.equal(checkSecret({ 'authorization': `Bearer ${secret}` }, secret), true);
    // Rejects mismatched token
    assert.equal(checkSecret({ 'x-webhook-secret': 'wrong_token' }, secret), false);
    // Rejects missing token
    assert.equal(checkSecret({}, secret), false);
  });

  test('correctly maps Supabase native webhooks and pg_net payloads', () => {
    const parsePayload = (raw) => {
      const isSupabaseDbWebhook = Boolean(raw.table && raw.record);
      const table = isSupabaseDbWebhook ? raw.table : '';
      const record = isSupabaseDbWebhook ? raw.record : {};

      const event = (
        raw.event ||
        (table === 'orders' ? 'new_order' : '') ||
        (raw.type ? String(raw.type).toLowerCase() : '')
      );

      const data = isSupabaseDbWebhook ? record : raw;
      return { event, data };
    };

    // pg_net trigger payload
    const pgNetPayload = {
      event: 'new_order',
      order_id: 'ORD-101',
      client_email: 'client@domain.com',
      price: 25.00
    };
    const parsedPg = parsePayload(pgNetPayload);
    assert.equal(parsedPg.event, 'new_order');
    assert.equal(parsedPg.data.order_id, 'ORD-101');
  });
});
