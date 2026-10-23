import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeGoogleAdsTagId,
  normalizeGoogleAdsConversionLabel,
  buildGoogleAdsSendTo,
  trackGoogleAdsPurchase
} from '../utils/googleAdsTracking.js';

test('Google Ads conversion tracking helpers', async (t) => {
  await t.test('normalizes Google Ads IDs and labels', () => {
    assert.equal(normalizeGoogleAdsTagId('AW-18530865014'), 'AW-18530865014');
    assert.equal(normalizeGoogleAdsTagId('tag: aw-18530865014'), 'AW-18530865014');
    assert.equal(normalizeGoogleAdsConversionLabel('4kJNCIbctqcdEPaemoRF'), '4kJNCIbctqcdEPaemoRF');
    assert.equal(
      normalizeGoogleAdsConversionLabel('AW-18530865014/4kJNCIbctqcdEPaemoRF'),
      '4kJNCIbctqcdEPaemoRF'
    );
    assert.equal(
      buildGoogleAdsSendTo('AW-18530865014', '4kJNCIbctqcdEPaemoRF'),
      'AW-18530865014/4kJNCIbctqcdEPaemoRF'
    );
  });

  await t.test('fires one purchase conversion per transaction in a browser session', () => {
    const events = [];
    const store = new Map();
    global.window = {
      gtag: (...args) => events.push(args),
      sessionStorage: {
        getItem: (key) => store.get(key) || null,
        setItem: (key, value) => store.set(key, value)
      }
    };

    const payload = {
      tagId: 'AW-18530865014',
      conversionLabel: '4kJNCIbctqcdEPaemoRF',
      value: 25.5,
      currency: 'USD',
      transactionId: 'ORDER-123'
    };

    assert.equal(trackGoogleAdsPurchase(payload), true);
    assert.equal(trackGoogleAdsPurchase(payload), false);
    assert.equal(events.length, 1);
    assert.deepEqual(events[0], [
      'event',
      'conversion',
      {
        send_to: 'AW-18530865014/4kJNCIbctqcdEPaemoRF',
        value: 25.5,
        currency: 'USD',
        transaction_id: 'ORDER-123'
      }
    ]);

    delete global.window;
  });

  await t.test('does not fire without a transaction id', () => {
    const events = [];
    global.window = {
      gtag: (...args) => events.push(args),
      sessionStorage: { getItem: () => null, setItem: () => {} }
    };

    assert.equal(trackGoogleAdsPurchase({
      tagId: 'AW-18530865014',
      conversionLabel: '4kJNCIbctqcdEPaemoRF',
      value: 10,
      currency: 'USD'
    }), false);
    assert.equal(events.length, 0);

    delete global.window;
  });
});
