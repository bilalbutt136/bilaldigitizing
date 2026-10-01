import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = relativePath => fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

describe('Service Worker & Image Layout Stability', () => {
  test('service worker never intercepts cross-origin resources and always returns a Response on handled failures', () => {
    const sw = read('public/sw.js');

    assert.match(sw, /const CACHE_VERSION = 'bdigi-pwa-v4\.4'/);
    assert.match(sw, /requestUrl\.origin !== self\.location\.origin/);
    assert.match(sw, /requestUrl\.pathname\.startsWith\('\/api\/'\)/);
    assert.match(sw, /requestUrl\.pathname\.startsWith\('\/_next\/'\)/);
    assert.match(sw, /request\.headers\.has\('range'\)/);
    assert.match(sw, /return new Response\('', \{/);
    assert.match(sw, /offlineHtmlResponse/);
    assert.equal(sw.includes('.catch(() => cachedResponse)'), false);
  });

  test('PWA registrar checks for the newest service worker without HTTP cache interference', () => {
    const registrar = read('src/components/common/PWARegistrar.jsx');

    assert.match(registrar, /register\('\/sw\.js', \{ updateViaCache: 'none' \}\)/);
    assert.match(registrar, /reg\.update\(\)\.catch/);
  });

  test('built-in UI fallbacks are local and do not depend on Unsplash network availability', () => {
    const componentFiles = [
      'src/components/admin/AddProductModal.jsx',
      'src/components/admin/HeroServicesEditor.jsx',
      'src/components/admin/OrderManagementTable.jsx',
      'src/components/admin/ServiceManagementEditor.jsx',
      'src/components/admin/StoreManagementEditor.jsx',
      'src/components/common/ArtworkLightboxModal.jsx',
      'src/components/customer/OrderTrackerDrawer.jsx',
      'src/components/customer/StoreOrderModal.jsx',
      'src/components/mobile/BDigitizingMobileApp.jsx',
      'src/components/public/StructuredServicesSection.jsx',
      'src/components/worker/WorkerDashboard.jsx',
      'src/components/worker/WorkerOrderWorkspaceModal.jsx'
    ];

    for (const file of componentFiles) {
      const source = read(file);
      assert.equal(
        source.includes('images.unsplash.com'),
        false,
        `${file} should not contain a built-in Unsplash fallback`
      );
    }

    assert.match(read('src/components/customer/OrderTrackerDrawer.jsx'), /\/artwork-placeholder\.svg/);
    assert.match(read('src/components/public/StructuredServicesSection.jsx'), /\/service-preview-placeholder\.svg/);
    assert.match(read('src/components/admin/AddProductModal.jsx'), /\/product-placeholder\.svg/);
  });

  test('local placeholder assets reserve deterministic intrinsic geometry', () => {
    const assets = [
      ['public/artwork-placeholder.svg', /width="600" height="600"/],
      ['public/service-preview-placeholder.svg', /width="1200" height="800"/],
      ['public/product-placeholder.svg', /width="800" height="800"/]
    ];

    for (const [file, geometry] of assets) {
      const source = read(file);
      assert.match(source, geometry);
      assert.match(source, /viewBox=/);
    }
  });

  test('CSP transition allows legacy Unsplash requests while old service workers are being replaced', () => {
    const nextConfig = read('next.config.js');

    assert.match(nextConfig, /connect-src[^\n]*https:\/\/images\.unsplash\.com/);
    assert.match(nextConfig, /img-src 'self' data: blob: https:/);
  });

  test('saved theme is applied before hydration to prevent first-paint color flashing', () => {
    const layout = read('app/layout.jsx');

    assert.match(layout, /localStorage\.getItem\('bdigi_theme'\)/);
    assert.match(layout, /root\.setAttribute\('data-theme'/);
    assert.match(layout, /root\.classList\.add\('dark', 'dark-mode'\)/);
    assert.match(layout, /root\.style\.colorScheme/);
  });
});
