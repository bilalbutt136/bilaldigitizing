import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { 
  SERVICE_KEYS,
  DEFAULT_SERVICE_DISCOUNTS,
  normalizeServiceKey, 
  getServiceDisplayName, 
  getActivePromotion, 
  getServiceDiscountPercent, 
  calculateOrderPricing,
  formatServiceDiscountsSummary
} from '../utils/promoUtils.js';

describe('Granular Service-Specific Promotional Discounts Engine', () => {
  describe('Service Key Normalization', () => {
    test('normalizes various aliases to canonical service keys', () => {
      assert.equal(normalizeServiceKey('embroidery'), SERVICE_KEYS.EMBROIDERY);
      assert.equal(normalizeServiceKey('digitizing'), SERVICE_KEYS.EMBROIDERY);
      assert.equal(normalizeServiceKey('Embroidery Digitizing'), SERVICE_KEYS.EMBROIDERY);
      assert.equal(normalizeServiceKey('Cap 3D Puff Digitizing'), SERVICE_KEYS.EMBROIDERY);
      assert.equal(normalizeServiceKey(''), SERVICE_KEYS.EMBROIDERY);
      assert.equal(normalizeServiceKey(null), SERVICE_KEYS.EMBROIDERY);

      assert.equal(normalizeServiceKey('vector'), SERVICE_KEYS.VECTOR);
      assert.equal(normalizeServiceKey('vector-art'), SERVICE_KEYS.VECTOR);
      assert.equal(normalizeServiceKey('vector_art'), SERVICE_KEYS.VECTOR);
      assert.equal(normalizeServiceKey('Vector Tracing'), SERVICE_KEYS.VECTOR);
      assert.equal(normalizeServiceKey('line_art'), SERVICE_KEYS.VECTOR);

      assert.equal(normalizeServiceKey('patch'), SERVICE_KEYS.PATCH);
      assert.equal(normalizeServiceKey('patches'), SERVICE_KEYS.PATCH);
      assert.equal(normalizeServiceKey('custom_patches'), SERVICE_KEYS.PATCH);
      assert.equal(normalizeServiceKey('Embroidered Patch'), SERVICE_KEYS.PATCH);
      assert.equal(normalizeServiceKey('Emblem Crest'), SERVICE_KEYS.PATCH);
    });

    test('retrieves friendly human display names', () => {
      assert.equal(getServiceDisplayName('embroidery'), 'Embroidery Digitizing');
      assert.equal(getServiceDisplayName('vector'), 'Vector Art / Tracing');
      assert.equal(getServiceDisplayName('patch'), 'Custom Patches');
    });
  });

  describe('Active Promotion Resolution', () => {
    test('identifies active promotion from list', () => {
      const promotions = [
        { id: 'p1', name: 'Old Promo', status: 'paused', discountPercent: 10 },
        { id: 'p2', name: 'Spring Promo', status: 'active', discountPercent: 20, serviceDiscounts: { embroidery: 25, vector: 15, patch: 10 } },
        { id: 'p3', name: 'Draft Promo', status: 'draft', discountPercent: 5 }
      ];

      const active = getActivePromotion(promotions);
      assert.ok(active);
      assert.equal(active.id, 'p2');
      assert.equal(active.serviceDiscounts.embroidery, 25);
    });

    test('returns null when no active promotion exists', () => {
      const promotions = [
        { id: 'p1', name: 'Paused', status: 'paused' }
      ];
      assert.equal(getActivePromotion(promotions), null);
      assert.equal(getActivePromotion([]), null);
      assert.equal(getActivePromotion(null), null);
    });
  });

  describe('Granular Service Discount Percent Resolution', () => {
    test('resolves service-specific discount percentages correctly', () => {
      const activePromo = {
        id: 'promo_live',
        status: 'active',
        name: 'Spring Launch',
        discountPercent: 20,
        serviceDiscounts: {
          embroidery: 20,
          vector: 10,
          patch: 5
        }
      };

      // Embroidery gets 20%
      assert.equal(getServiceDiscountPercent('embroidery', activePromo), 20);
      assert.equal(getServiceDiscountPercent('digitizing', activePromo), 20);

      // Vector gets 10%
      assert.equal(getServiceDiscountPercent('vector', activePromo), 10);
      assert.equal(getServiceDiscountPercent('vector-art', activePromo), 10);

      // Patches get 5%
      assert.equal(getServiceDiscountPercent('patch', activePromo), 5);
      assert.equal(getServiceDiscountPercent('custom_patches', activePromo), 5);
    });

    test('respects siteSettings service_discounts overrides', () => {
      const siteSettings = {
        service_discounts: {
          embroidery: 30,
          vector: 15,
          patch: 8,
          enabled: true
        }
      };

      assert.equal(getServiceDiscountPercent('embroidery', null, siteSettings), 30);
      assert.equal(getServiceDiscountPercent('vector', null, siteSettings), 15);
      assert.equal(getServiceDiscountPercent('patch', null, siteSettings), 8);
    });

    test('returns 0 when service is explicitly disabled in promotion', () => {
      const activePromo = {
        id: 'promo_partial',
        status: 'active',
        serviceDiscounts: { embroidery: 20, vector: 10, patch: 5 },
        serviceStatus: { embroidery: true, vector: false, patch: true }
      };

      assert.equal(getServiceDiscountPercent('embroidery', activePromo), 20);
      assert.equal(getServiceDiscountPercent('vector', activePromo), 0);
      assert.equal(getServiceDiscountPercent('patch', activePromo), 5);
    });

    test('falls back to flat discountPercent if granular discounts are not specified', () => {
      const flatPromo = {
        id: 'flat_promo',
        status: 'active',
        discountPercent: 15
      };

      assert.equal(getServiceDiscountPercent('embroidery', flatPromo), 15);
      assert.equal(getServiceDiscountPercent('vector', flatPromo), 15);
      assert.equal(getServiceDiscountPercent('patch', flatPromo), 15);
    });

    test('returns default rates when active promo exists without rates', () => {
      const minimalPromo = {
        id: 'min_promo',
        status: 'active'
      };

      assert.equal(getServiceDiscountPercent('embroidery', minimalPromo), DEFAULT_SERVICE_DISCOUNTS.embroidery);
      assert.equal(getServiceDiscountPercent('vector', minimalPromo), DEFAULT_SERVICE_DISCOUNTS.vector);
      assert.equal(getServiceDiscountPercent('patch', minimalPromo), DEFAULT_SERVICE_DISCOUNTS.patch);
    });
  });

  describe('End-to-End Order Pricing Calculations', () => {
    const activePromo = {
      id: 'promo_live',
      status: 'active',
      serviceDiscounts: {
        embroidery: 20,
        vector: 10,
        patch: 5
      }
    };

    test('calculates accurate pricing for single embroidery order with 20% promo', () => {
      const pricing = calculateOrderPricing({
        service: 'embroidery',
        unitPrice: 10.00,
        quantity: 1,
        isRush: false,
        activePromo
      });

      assert.equal(pricing.baseSubtotal, 10.00);
      assert.equal(pricing.volumeDiscountAmount, 0.00);
      assert.equal(pricing.promoDiscountPercent, 20);
      assert.equal(pricing.promoDiscountAmount, 2.00);
      assert.equal(pricing.rushFee, 0.00);
      assert.equal(pricing.totalPrice, 8.00);
      assert.equal(pricing.totalDiscount, 2.00);
    });

    test('calculates accurate pricing for single vector order with 10% promo and express rush', () => {
      const pricing = calculateOrderPricing({
        service: 'vector',
        unitPrice: 15.00,
        quantity: 1,
        isRush: true,
        activePromo
      });

      assert.equal(pricing.baseSubtotal, 15.00);
      assert.equal(pricing.promoDiscountPercent, 10);
      assert.equal(pricing.promoDiscountAmount, 1.50);
      assert.equal(pricing.rushFee, 10.00);
      // 15 - 1.50 + 10 = 23.50
      assert.equal(pricing.totalPrice, 23.50);
    });

    test('calculates accurate pricing for 100 custom patches with 5% promo and volume tier', () => {
      const pricing = calculateOrderPricing({
        service: 'patch',
        unitPrice: 2.50,
        quantity: 100,
        isRush: false,
        activePromo
      });

      // Base subtotal = 100 * 2.50 = 250.00
      assert.equal(pricing.baseSubtotal, 250.00);
      // Volume tier for 100 patches = 5%
      assert.equal(pricing.volumeDiscountPercent, 5);
      assert.equal(pricing.volumeDiscountAmount, 12.50); // 5% of 250
      // Subtotal after volume = 237.50
      // Promo discount: 5% of 237.50 = 11.88
      assert.equal(pricing.promoDiscountPercent, 5);
      assert.equal(pricing.promoDiscountAmount, 11.88);
      // Final total = 237.50 - 11.88 = 225.62
      assert.equal(pricing.totalPrice, 225.62);
    });

    test('formats service discount summary accurately', () => {
      const summary = formatServiceDiscountsSummary({
        embroidery: 20,
        vector: 10,
        patch: 5
      });
      assert.equal(summary, 'Embroidery: 20% | Vector: 10% | Patches: 5%');
    });
  });
});
