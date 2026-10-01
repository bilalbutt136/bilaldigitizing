import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const readJson = relativePath => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));

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

test('PWA manifest uses dedicated white-background install icons', () => {
  const manifest = readJson('public/manifest.json');

  assert.equal(manifest.background_color, '#ffffff');
  assert.equal(manifest.theme_color, '#ffffff');

  assert.deepEqual(manifest.icons, [
    {
      src: '/icon-192x192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any'
    },
    {
      src: '/icon-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable any'
    }
  ]);
});

test('PWA, Apple and favicon assets have the required dimensions', async () => {
  const expectations = [
    ['public/pwa-icon-source.png', 1024, 1024],
    ['public/icon-192x192.png', 192, 192],
    ['public/icon-512x512.png', 512, 512],
    ['public/apple-touch-icon.png', 180, 180],
    ['public/favicon.png', 48, 48],
    ['app/icon.png', 512, 512],
    ['app/apple-icon.png', 180, 180]
  ];

  for (const [file, width, height] of expectations) {
    const meta = await pngMeta(file);
    assert.equal(meta.width, width, `${file} width`);
    assert.equal(meta.height, height, `${file} height`);
  }

  assert.equal(fs.existsSync(path.join(root, 'app/icon.svg')), false);
  assert.equal(fs.existsSync(path.join(root, 'public/favicon.svg')), false);
});

test('512 PWA icon keeps essential artwork inside the requested 20 percent safe area', async () => {
  const bounds = await nonWhiteBounds('public/icon-512x512.png');
  const minSafe = Math.floor(512 * 0.20) - 3;
  const maxSafe = Math.ceil(512 * 0.80) + 3;

  assert.ok(bounds.minX >= minSafe, `left artwork edge ${bounds.minX} must stay inside safe area`);
  assert.ok(bounds.minY >= minSafe, `top artwork edge ${bounds.minY} must stay inside safe area`);
  assert.ok(bounds.maxX <= maxSafe, `right artwork edge ${bounds.maxX} must stay inside safe area`);
  assert.ok(bounds.maxY <= maxSafe, `bottom artwork edge ${bounds.maxY} must stay inside safe area`);
});

test('admin branding settings documents the PWA safe-area contract', () => {
  const source = fs.readFileSync(
    path.join(root, 'src/components/admin/settings/ThemeBrandingSettings.jsx'),
    'utf8'
  );

  assert.match(source, /PWA App Icon/);
  assert.match(source, /1024×1024 master/);
  assert.match(source, /central 60%/);
  assert.match(source, /20% padding on every edge/);
  assert.match(source, /Build-managed/);
});

test('favicon runtime updater never replaces Apple touch icon', () => {
  const source = fs.readFileSync(
    path.join(root, 'src/components/layout/DynamicFavicon.jsx'),
    'utf8'
  );

  assert.equal(source.includes('apple-touch-icon'), false);
});
