import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_MOBILE_OFFER_BANNER, getActiveMobileOffer } from '../utils/mobileOffer.js';

const current = new Date('2026-10-25T12:00:00.000Z');
const active = {
  status: 'active',
  name: 'Autumn Savings',
  startDate: '2026-10-01',
  endDate: '2026-10-31',
  serviceDiscounts: { embroidery: 15, vector: 25, patch: 5 },
  serviceStatus: { embroidery: true, vector: true, patch: true }
};
const settings = overrides => ({
  promotionsEnabled: true,
  mobileOfferBanner: { ...DEFAULT_MOBILE_OFFER_BANNER },
  promotions: [active],
  ...overrides
});

test('mobile banner reads the maximum real discount from the active promotion', () => {
  const result = getActiveMobileOffer(settings(), current);
  assert.equal(result?.percent, 25);
  assert.equal(result?.promotion.name, 'Autumn Savings');
});

test('promotions switch OFF, banner OFF, or no active campaign never advertise a discount', () => {
  assert.equal(getActiveMobileOffer(settings({ promotionsEnabled: false }), current), null);
  assert.equal(getActiveMobileOffer(settings({ mobileOfferBanner: { enabled: false } }), current), null);
  assert.equal(getActiveMobileOffer(settings({ promotions: [{ ...active, status: 'paused' }] }), current), null);
  assert.equal(getActiveMobileOffer(settings({ promotions: [] }), current), null);
});

test('expired or not-yet-active promotions cannot show an offer', () => {
  assert.equal(getActiveMobileOffer(settings({ promotions: [{ ...active, endDate: '2026-10-24' }] }), current), null);
  assert.equal(getActiveMobileOffer(settings({ promotions: [{ ...active, startDate: '2026-10-26' }] }), current), null);
});

test('disabled service rates are excluded and zero discounts remain hidden', () => {
  const excluded = { ...active, serviceStatus: { embroidery: true, vector: false, patch: true } };
  assert.equal(getActiveMobileOffer(settings({ promotions: [excluded] }), current)?.percent, 15);
  assert.equal(getActiveMobileOffer(settings({ promotions: [{
    ...active, serviceDiscounts: { embroidery: 0, vector: 0, patch: 0 }
  }] }), current), null);
});

test('legacy uniform-rate promotions still produce the correct headline percentage', () => {
  assert.equal(getActiveMobileOffer(settings({ promotions: [{ status: 'active', discountPercent: 12 }] }), current)?.percent, 12);
});
