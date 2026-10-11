import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { getAvailableTiers, getServiceStartingPrice, calculatePackageQuote, formatUSD } from '../utils/livePricing.js';

const active = (id, service_type, price, display_order = 1) => ({ id, service_type, price, display_order, title: id, is_active: true });

test('starting prices come from active administrator tiers, never hard-coded defaults', () => {
  const tiers = [
    active('emb-st', 'embroidery', 15, 2),
    active('emb-basic', 'embroidery', 5, 1),
    active('vec-basic', 'vector_art', 15),
    active('pat-basic', 'patches', 3.50),
    { ...active('old', 'embroidery', 1), is_active: false }
  ];
  assert.equal(getServiceStartingPrice(tiers, 'embroidery'), 5);
  assert.equal(getServiceStartingPrice(tiers, 'vector'), 15);
  assert.equal(getServiceStartingPrice(tiers, 'patch'), 3.5);
  assert.deepEqual(getAvailableTiers(tiers, 'embroidery').map(t => t.id), ['emb-basic', 'emb-st']);
  assert.equal(getServiceStartingPrice([], 'embroidery'), null);
  assert.equal(formatUSD(null), 'Pricing unavailable');
  assert.equal(formatUSD(5), '$5.00');
});

test('quote has consistent quantity, subtotal, rush and patch minimum', () => {
  const emb = active('emb-basic', 'embroidery', 5);
  assert.deepEqual(calculatePackageQuote({ tier: emb, service: 'embroidery', quantity: 2, isRush: true }), {
    unitPrice: 5, subtotal: 10, rush: 10, total: 20, quantity: 2, patchPieces: undefined, tierTitle: 'emb-basic'
  });
  const patch = active('pat-basic', 'patches', 3.5);
  assert.equal(calculatePackageQuote({ tier: patch, service: 'patch', quantity: 50, isRush: true }).total, 200);
  assert.equal(calculatePackageQuote({ tier: patch, service: 'patch', quantity: 49 }), null);
  assert.equal(calculatePackageQuote({ tier: emb, service: 'embroidery', quantity: -2 }), null);
  assert.equal(calculatePackageQuote({ tier: emb, service: 'patch', quantity: 50 }), null);
  assert.equal(calculatePackageQuote({ tier: null, service: 'embroidery', quantity: 1 }), null);
});

test('direct order flow and server enforce canonical pricing rather than browser totals', () => {
  const flow = fs.readFileSync('src/components/customer/StreamlinedOrderFlow.jsx', 'utf8');
  const server = fs.readFileSync('src/server/orders/handlers/post/createOrder.js', 'utf8');
  const mobile = fs.readFileSync('src/components/mobile/BDigitizingMobileApp.jsx', 'utf8');
  assert.match(flow, /getServiceStartingPrice\(dynamicPricingTiers, 'embroidery'\)/);
  assert.doesNotMatch(flow, />\$10\.00<\/span>/);
  assert.match(flow, /source: 'direct_order_desk'/);
  assert.match(flow, /package_id: currentTier.id/);
  assert.match(flow, /disabled=\{isSubmitting \|\| isUploading \|\| !hasValidLivePrice\}/);
  assert.doesNotMatch(flow, /URL\.createObjectURL\(file\)/);
  assert.match(server, /\.from\('pricing_tiers'\)/);
  assert.match(server, /calculatePackageQuote/);
  assert.match(server, /matchesMoney\(primaryDbRow\.price, quote\.total\)/);
  assert.match(mobile, /mobileStartingPrice\('embroidery'\)/);
});


test('pricing-page selection reaches the wizard by live package ID', () => {
  const page = fs.readFileSync('app/pricing/page.jsx', 'utf8');
  const modal = fs.readFileSync('src/components/customer/OrderWizardModal.jsx', 'utf8');
  const store = fs.readFileSync('src/components/customer/StoreOrderModal.jsx', 'utf8');
  assert.match(page, /handleOrder\(pkg\.serviceType, pkg\.title, pkg\.price, pkg\.id\)/);
  assert.match(page, /getAvailableTiers\(dynamicPricingTiers, activeTab\)/);
  assert.match(modal, /initialPackage=\{orderWizardInitialData\?\.selectedPackage \|\| orderWizardInitialData\?\.package_id/);
  assert.match(store, /const hasValidPrice = Number\.isFinite\(unitPrice\) && unitPrice > 0/);
  assert.doesNotMatch(store, /selectedStoreItem\.price \|\| '\$10\.00'/);
});
