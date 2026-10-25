import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { normalizePublicCatalog } from '../lib/catalog/normalizePublicCatalog.js';
import { getActiveMobileOffer } from '../utils/mobileOffer.js';

const read = name => fs.readFileSync(name, 'utf8');
const active = {
  id: 'vip-actual', name: 'VIP Studio', status: 'active', discountPercent: 10,
  serviceDiscounts: { embroidery: 10, vector: 10, patch: 0 },
  serviceStatus: { embroidery: true, vector: true, patch: false }
};
const catalog = announcement => normalizePublicCatalog({ site_config: [
  { key: 'site_settings', value: {
    promotionsEnabled: true, promotions: [active], mobileOfferBanner: { enabled: true },
    announcement
  }}
] }).siteSettings;

test('VIP discount banner remains eligible while header moving ticker is turned OFF', () => {
  const settings = catalog({ enabled: false, autoSync: true, text: 'Legacy special!' });
  assert.equal(settings.announcement.enabled, false);
  assert.equal(settings.announcement.text, 'Legacy special!');
  assert.equal(getActiveMobileOffer(settings)?.percent, 10);
});

test('admin can independently enable a custom top line without an active campaign', () => {
  const settings = normalizePublicCatalog({ site_config: [{
    key: 'site_settings', value: {
      promotionsEnabled: false, promotions: [],
      announcement: { enabled: true, autoSync: false, text: 'New service launched', badge: 'NEWS' },
      mobileOfferBanner: { enabled: true }
    }
  }] }).siteSettings;
  assert.equal(settings.announcement.enabled, true);
  assert.equal(settings.announcement.text, 'New service launched');
  assert.equal(getActiveMobileOffer(settings), null);
});

test('public running line reads uncached explicit flag, independent of promotionsEnabled', () => {
  const component = read('src/components/public/AnnouncementBar.jsx');
  const endpoint = read('app/api/promotions/active/route.js');
  assert.match(component, /useLivePromotion\(\)/);
  assert.match(component, /rawAnnouncement\?\.enabled === true/);
  assert.doesNotMatch(component, /siteSettings\?\.promotionsEnabled !== true/);
  assert.match(component, /autoSync === true/);
  assert.match(endpoint, /announcement: ticker/);
  assert.match(endpoint, /ticker\.enabled = tickerConfig\?\.enabled === true/);
});

test('admin has a separate control and promotion actions cannot overwrite the running line', () => {
  const manager = read('src/components/admin/PromotionsManager.jsx');
  const editor = read('src/components/admin/RunningTickerEditor.jsx');
  const vip = read('src/components/admin/MobileOfferBannerEditor.jsx');
  assert.match(manager, /<RunningTickerEditor/);
  assert.match(manager, /<MobileOfferBannerEditor/);
  assert.doesNotMatch(manager, /buildDynamicAnnouncement/);
  assert.doesNotMatch(manager, /announcement:\s*\{/);
  assert.match(editor, /Show the running top line/);
  assert.match(editor, /autoSync: draft\.autoSync === true/);
  assert.match(editor, /updateSiteSettings\(\{\s*announcement:/);
  assert.doesNotMatch(editor, /promotionsEnabled:/);
  assert.doesNotMatch(editor, /mobileOfferBanner:/);
  assert.match(vip, /mobileOfferBanner: next/);
});

test('public ticker does not advertise a pretend resetting countdown', () => {
  const component = read('src/components/public/AnnouncementBar.jsx');
  assert.match(component, /showCountdown: false/);
});
