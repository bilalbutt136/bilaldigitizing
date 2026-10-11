import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');

test('the narrow web header uses the canonical white-background brand mark', () => {
  const header = read('src/components/HeaderNav.jsx');
  const url = read('src/lib/branding/whiteBrandMark.js');
  const css = read('src/index.css');
  assert.match(url, /MOBILE_WHITE_BRAND_MARK_URL = '\/logo\.png\?v=white-header-\d+'/);
  assert.match(header, /<source media="\(max-width: 768px\)" srcSet=\{MOBILE_WHITE_BRAND_MARK_URL\}/);
  assert.match(header, /siteSettings\?\.headerLogoUrl/, 'Desktop keeps the configured header logo');
  assert.match(css, /\.site-header-logo-frame/);
  assert.match(css, /\.site-header-brand-picture/);
});

test('mobile app top bars use the same white brand mark instead of an independently set app icon', () => {
  const mobile = read('src/components/mobile/BDigitizingMobileApp.jsx');
  assert.equal((mobile.match(/src=\{MOBILE_WHITE_BRAND_MARK_URL\}/g) || []).length, 2);
  assert.match(mobile, /mobileAppIconUrl = siteSettings\?\.appIconUrl/, 'Installable app icon remains configurable');
});

test('PWA service worker requests brand logo artwork from the network first', () => {
  const sw = read('public/sw.js');
  assert.match(sw, /const CACHE_VERSION = 'bdigi-pwa-v4\.5'/);
  for (const filename of ['/logo.png','/logo-icon.png','/logo-small.png','/pwa-icon-source.png']) {
    assert.ok(sw.includes("requestUrl.pathname === '"+filename+"'"), filename+' must bypass stale cache');
  }
  assert.match(sw,/event\.respondWith\(networkFirst\(\)\)/);
});
