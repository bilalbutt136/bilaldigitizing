import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { normalizeBoltMethod } from '../lib/payments/boltPayouts.js';

describe('Payment Methods VIP Enhancements & Admin Controls', () => {
  it('1. normalizeBoltMethod resolves apple_pay and aliases with fallback to card', () => {
    const res1 = normalizeBoltMethod('apple_pay');
    assert.equal(res1.requestedMethod, 'apple_pay');
    assert.equal(res1.providerMethod, 'apple_pay');
    assert.equal(res1.fallbackMethod, 'card');

    const res2 = normalizeBoltMethod('applepay');
    assert.equal(res2.requestedMethod, 'applepay');
    assert.equal(res2.providerMethod, 'apple_pay');

    const res3 = normalizeBoltMethod('google_pay');
    assert.equal(res3.requestedMethod, 'google_pay');
    assert.equal(res3.providerMethod, 'google_pay');
    assert.equal(res3.fallbackMethod, 'card');
  });

  it('2. CheckoutModal.jsx has removed the 2-step Solana address copy/paste flow', () => {
    const code = fs.readFileSync('src/components/customer/CheckoutModal.jsx', 'utf8');

    // Verify removed text
    assert.equal(code.includes('Complete in 2 Easy Steps'), false, 'Should not contain "Complete in 2 Easy Steps"');
    assert.equal(code.includes('Copy Your Receiving Address:'), false, 'Should not contain "Copy Your Receiving Address:"');
    assert.equal(code.includes('Paste on Checkout Portal:'), false, 'Should not contain "Paste on Checkout Portal:"');

    // Verify Apple Pay is present
    assert.equal(code.includes('ApplePayBrandIcon'), true, 'Should include ApplePayBrandIcon');
    assert.equal(code.includes('apple_pay'), true, 'Should support apple_pay');

    // Verify direct portal checkout
    assert.equal(code.includes('Proceed to Card Portal'), true, 'Should feature direct Proceed to Card Portal action');
  });

  it('3. DepositModal.jsx has removed the 2-step Solana address copy/paste flow', () => {
    const code = fs.readFileSync('src/components/customer/DepositModal.jsx', 'utf8');

    // Verify removed text
    assert.equal(code.includes('Complete in 2 Easy Steps'), false, 'Should not contain "Complete in 2 Easy Steps"');
    assert.equal(code.includes('Copy Your Receiving Address:'), false, 'Should not contain "Copy Your Receiving Address:"');
    assert.equal(code.includes('Paste on Checkout Portal:'), false, 'Should not contain "Paste on Checkout Portal:"');

    // Verify Apple Pay is present
    assert.equal(code.includes('ApplePayBrandIcon'), true, 'Should include ApplePayBrandIcon');
    assert.equal(code.includes('apple_pay'), true, 'Should support apple_pay');

    // Verify direct portal deposit
    assert.equal(code.includes('Proceed to Card Portal'), true, 'Should feature direct Proceed to Card Portal action');
  });

  it('4. PaymentMethodSettings admin component exists and binds to siteSettings and updateSiteSettings', () => {
    const code = fs.readFileSync('src/components/admin/settings/PaymentMethodSettings.jsx', 'utf8');

    assert.equal(code.includes('updateSiteSettings'), true);
    assert.equal(code.includes('paymentMethods'), true);
    assert.equal(code.includes('apple_pay'), true);
    assert.equal(code.includes('google_pay'), true);
    assert.equal(code.includes('paypal'), true);
    assert.equal(code.includes('cashapp'), true);
  });

  it('5. SystemSettingsManager registers the Payment Gateways & Methods tab', () => {
    const code = fs.readFileSync('src/components/admin/SystemSettingsManager.jsx', 'utf8');

    assert.equal(code.includes('PaymentMethodSettings'), true);
    assert.equal(code.includes('Payment Gateways & Methods'), true);
    assert.equal(code.includes("currentTab === 'payments'"), true);
  });
});
