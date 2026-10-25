import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(path, 'utf8');

test('VIP website has separate compact desktop offer without changing mobile markup', () => {
  const offer = read('src/components/mobile/MobileWelcomeOffer.jsx');
  const styles = read('src/index.css');
  assert.match(offer, /className="bdigi-vip-mobile-offer"/);
  assert.match(offer, /className="bdigi-vip-desktop-offer"/);
  assert.match(offer, /className="bdigi-vip-desktop-claim"/);
  assert.match(styles, /@media \(min-width: 769px\)/);
  assert.match(styles, /\.bdigi-vip-website-slot \.bdigi-vip-mobile-offer\s*\{\s*display: none !important/);
  assert.match(styles, /@media \(max-width: 768px\)\s*\{\s*\.bdigi-vip-desktop-offer\s*\{ display: none !important/);
  assert.match(styles, /min-height: 54px/);
});

test('VIP banner remains a link to a separate order page, while Get Started remains popup', () => {
  const homepage = read('src/components/public/HomePageClient.jsx');
  const header = read('src/components/HeaderNav.jsx');
  const modal = read('src/components/customer/OrderWizardModal.jsx');
  assert.match(homepage, /href="\/order\?source=vip_offer"/);
  assert.match(header, /openOrderWizard\(\{ type: 'all' \}\)/);
  assert.match(modal, /<StreamlinedOrderFlow/);
});

test('both entry flows record an attempted order for admin tracking without counting it as a purchase', () => {
  const flow = read('src/components/customer/StreamlinedOrderFlow.jsx');
  const visitorActivity = read('src/components/admin/tracking/GoogleAdsVisitorActivityPanel.jsx');
  assert.match(flow, /trackMetaEvent\('OrderStarted'/);
  assert.match(flow, /get_started_popup/);
  assert.match(flow, /vip_promotion_page/);
  assert.match(flow, /separate_page/);
  assert.match(visitorActivity, /\['OrderStarted', 'InitiateCheckout', 'AddPaymentInfo'\]/);
});
