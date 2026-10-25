import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { getActiveMobileOffer, getLiveStudioDiscountPercent } from '../utils/mobileOffer.js';
import { calculatePackageQuote } from '../utils/livePricing.js';

const read = p => fs.readFileSync(p, 'utf8');

test('mobile and desktop homepages mount a live-offer component independently of cached SSR settings', () => {
  const homepage = read('src/components/public/HomePageClient.jsx');
  const banner = read('src/components/mobile/MobileWelcomeOffer.jsx');
  assert.match(homepage, /bdigi-vip-website-slot/);
  assert.doesNotMatch(homepage, /getActiveMobileOffer\(siteSettings\) &&/);
  assert.match(banner, /useLivePromotion\(\)/);
  assert.match(banner, /getActiveMobileOffer\(currentSettings\)/);
});

test('public promotion snapshot is uncached, allowlisted and independent of SSR catalog', () => {
  const endpoint = read('app/api/promotions/active/route.js');
  const hook = read('src/hooks/useLivePromotion.js');
  assert.match(endpoint, /createAdminClient/);
  assert.match(endpoint, /from '\.\.\/\.\.\/\.\.\/\.\.\/src\/lib\/supabase\/admin\.js'/);
  assert.match(endpoint, /Cache-Control.*no-store/);
  assert.match(endpoint, /withApiObservability/);
  assert.doesNotMatch(endpoint, /NextResponse\.json\(settings/);
  assert.match(hook, /cache: 'no-store'/);
  assert.match(hook, /visibilitychange/);
});

test('admin unrelated settings edits do not overwrite active campaign fields from stale cached state', () => {
  const state = read('src/context/StateContext.jsx');
  const api = read('app/api/admin/homepage/route.js');
  assert.match(state, /patchSiteSettingsToSupabase\(newSettings\)/);
  assert.doesNotMatch(state, /\.\.\.previous, \.\.\.newSettings/);
  assert.match(api, /siteSettingsPatch/);
  assert.match(api, /\.\.\.previous/);
  assert.match(api, /\.\.\.allowedPatch/);
  assert.match(api, /revalidateAllSitePages\(\)/);
});

test('eligible order quotes match the live campaign and paused ones do not reduce totals', () => {
  const campaign = { status: 'active', serviceDiscounts: { embroidery: 10, vector: 10, patch: 0 }, serviceStatus: { embroidery: true, vector: true, patch: false } };
  const settings = { promotionsEnabled: true, promotions: [campaign], mobileOfferBanner: { enabled: true } };
  assert.equal(getActiveMobileOffer(settings)?.percent, 10);
  const tier = { id: 'a', service_type: 'embroidery', price: 25, is_active: true };
  const activeQuote = calculatePackageQuote({ tier, service: 'embroidery', quantity: 1, discountPercent: getLiveStudioDiscountPercent(settings, 'embroidery') });
  assert.equal(activeQuote.total, 22.5);
  assert.equal(activeQuote.discountAmount, 2.5);
  const paused = { ...settings, promotions: [{ ...campaign, status: 'paused' }] };
  assert.equal(getActiveMobileOffer(paused), null);
  const pausedQuote = calculatePackageQuote({ tier, service: 'embroidery', quantity: 1, discountPercent: getLiveStudioDiscountPercent(paused, 'embroidery') });
  assert.equal(pausedQuote.total, 25);
});
