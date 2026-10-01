import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = relative => fs.readFileSync(path.join(process.cwd(), relative), 'utf8');

describe('Project-wide mobile layout stability regression', () => {
  test('root layout uses self-hosted Next fonts and a server-preloaded public catalog', () => {
    const source = read('app/layout.jsx');
    assert.match(source, /next\/font\/google/);
    assert.match(source, /fetchPublicCatalogServer/);
    assert.match(source, /StateProvider initialCatalog=\{catalogWithBranding\}/);
    assert.match(source, /brandingToSiteSettings/);
    assert.match(source, /Promise\.all\(\[\s*fetchPublicCatalogServer\(\),\s*getSiteBranding\(\)/);
    assert.equal(source.includes('fonts.googleapis.com/css2'), false);
  });

  test('state provider first render is deterministic for auth, app mode and CMS data', () => {
    const source = read('src/context/StateContext.jsx');
    assert.match(source, /useState\('public'\)/);
    assert.match(source, /useState\('website'\)/);
    assert.match(source, /initialCatalog\?\.pricingCards/);
    assert.match(source, /initialCatalog\?\.siteSettings/);
    assert.match(source, /initialCatalog\?\.homePageConfig/);
    assert.equal(source.includes('getInitialAuth'), false);
    assert.equal(source.includes('getInitialMobileMode'), false);
  });

  test('announcement occupies its fixed slot on first render instead of mounting late', () => {
    const source = read('src/components/public/AnnouncementBar.jsx');
    assert.equal(source.includes('const [mounted, setMounted]'), false);
    assert.match(source, /height: '38px'/);
    assert.match(source, /minHeight: '38px'/);
    assert.match(source, /maxHeight: '38px'/);
  });

  test('mobile site and auth shells reserve stable first-paint geometry', () => {
    const css = read('src/index.css');
    assert.match(css, /MOBILE LAYOUT STABILITY SYSTEM/);
    assert.match(css, /\.website-header-zone \{ min-height: 101px; \}/);
    assert.match(css, /\.auth-route-shell \.website-header-zone \{ min-height: 63px; \}/);
    assert.match(css, /100svh/);
  });

  test('installed app route and tab can be rendered from server-known query state', () => {
    const page = read('app/page.jsx');
    const home = read('src/components/public/HomePageClient.jsx');
    const app = read('src/components/mobile/BDigitizingMobileApp.jsx');
    assert.match(page, /initialAppMode/);
    assert.match(page, /initialAppTab/);
    assert.match(home, /BDigitizingMobileApp initialTab=\{initialAppTab\}/);
    assert.match(app, /safeInitialTab/);
  });

  test('standalone auth uses stable mobile viewport units', () => {
    const source = read('src/components/auth/AuthModal.jsx');
    assert.match(source, /calc\(100svh - 63px\)/);
    assert.match(source, /auth-form-panel/);
  });
});
