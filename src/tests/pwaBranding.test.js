import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();

async function pngMeta(relativePath) {
  return sharp(path.join(root, relativePath)).metadata();
}

async function nonWhiteBounds(relativePath) {
  const { data, info } = await sharp(path.join(root, relativePath))
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let minX = info.width;
  let minY = info.height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const i = (y * info.width + x) * info.channels;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (r < 245 || g < 245 || b < 245) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  return { minX, minY, maxX, maxY, width: info.width, height: info.height };
}

test('PWA manifest is database-backed and exposes any + maskable app icons', () => {
  const manifestSource = fs.readFileSync(path.join(root, 'app/manifest.js'), 'utf8');

  assert.match(manifestSource, /getSiteBranding/);
  assert.match(manifestSource, /branding\.app_icon_url/);
  assert.match(manifestSource, /purpose: 'any'/);
  assert.match(manifestSource, /purpose: 'maskable'/);
  assert.match(manifestSource, /background_color: '#ffffff'/);
  assert.match(manifestSource, /theme_color: branding\.theme_color/);
  assert.equal(fs.existsSync(path.join(root, 'public/manifest.json')), false);
});

test('public fallback PWA and favicon assets keep the required dimensions', async () => {
  const expectations = [
    ['public/pwa-icon-source.png', 1024, 1024],
    ['public/icon-192x192.png', 192, 192],
    ['public/icon-512x512.png', 512, 512],
    ['public/apple-touch-icon.png', 180, 180],
    ['public/favicon.png', 48, 48]
  ];

  for (const [file, width, height] of expectations) {
    const meta = await pngMeta(file);
    assert.equal(meta.width, width, `${file} width`);
    assert.equal(meta.height, height, `${file} height`);
  }

  assert.equal(fs.existsSync(path.join(root, 'app/icon.png')), false);
  assert.equal(fs.existsSync(path.join(root, 'app/apple-icon.png')), false);
  assert.equal(fs.existsSync(path.join(root, 'app/favicon.ico')), false);
});

test('fallback 512 PWA icon keeps essential artwork inside the 20 percent safe area', async () => {
  const bounds = await nonWhiteBounds('public/icon-512x512.png');
  const minSafe = Math.floor(512 * 0.20) - 3;
  const maxSafe = Math.ceil(512 * 0.80) + 3;

  assert.ok(bounds.minX >= minSafe, `left artwork edge ${bounds.minX} must stay inside safe area`);
  assert.ok(bounds.minY >= minSafe, `top artwork edge ${bounds.minY} must stay inside safe area`);
  assert.ok(bounds.maxX <= maxSafe, `right artwork edge ${bounds.maxX} must stay inside safe area`);
  assert.ok(bounds.maxY <= maxSafe, `bottom artwork edge ${bounds.maxY} must stay inside safe area`);
});

test('fallback generator never recreates file-based Next metadata icons', () => {
  const source = fs.readFileSync(path.join(root, 'scripts/generateFavicon.cjs'), 'utf8');

  assert.equal(source.includes("path.join(APP_DIR, 'icon.png')"), false);
  assert.equal(source.includes("path.join(APP_DIR, 'apple-icon.png')"), false);
  assert.equal(source.includes("path.join(APP_DIR, 'favicon.ico')"), false);
  assert.match(source, /file-based metadata would override database branding/);
});

test('favicon runtime updater never replaces Apple touch icon', () => {
  const source = fs.readFileSync(
    path.join(root, 'src/components/layout/DynamicFavicon.jsx'),
    'utf8'
  );

  assert.equal(source.includes('apple-touch-icon'), false);
});
