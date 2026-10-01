const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const BRAND_SOURCE = path.join(PUBLIC_DIR, 'logo.png');

const SAFE_PADDING_RATIO = 0.20; // 20% on every edge.
const CONTENT_RATIO = 1 - (SAFE_PADDING_RATIO * 2); // central 60%
const MASTER_SIZE = 1024;

async function createBmpIco(sizes, src) {
  const images = [];

  for (const size of sizes) {
    const { data } = await sharp(src)
      .resize(size, size, { fit: 'contain', background: '#ffffff' })
      .removeAlpha()
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const bih = Buffer.alloc(40);
    bih.writeUInt32LE(40, 0);
    bih.writeInt32LE(size, 4);
    bih.writeInt32LE(size * 2, 8);
    bih.writeUInt16LE(1, 12);
    bih.writeUInt16LE(32, 14);
    bih.writeUInt32LE(0, 16);
    bih.writeUInt32LE(size * size * 4, 20);

    const xorMask = Buffer.alloc(size * size * 4);
    const andRowBytes = Math.ceil(size / 32) * 4;
    const andMask = Buffer.alloc(andRowBytes * size, 0);

    for (let y = 0; y < size; y++) {
      const srcY = size - 1 - y;
      for (let x = 0; x < size; x++) {
        const srcIdx = (srcY * size + x) * 4;
        const dstIdx = (y * size + x) * 4;
        xorMask[dstIdx] = data[srcIdx + 2];
        xorMask[dstIdx + 1] = data[srcIdx + 1];
        xorMask[dstIdx + 2] = data[srcIdx];
        xorMask[dstIdx + 3] = data[srcIdx + 3];
      }
    }

    images.push({ size, imgData: Buffer.concat([bih, xorMask, andMask]) });
  }

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  let offset = 6 + images.length * 16;
  const dirEntries = [];
  const dataChunks = [];

  for (const img of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.size >= 256 ? 0 : img.size, 0);
    entry.writeUInt8(img.size >= 256 ? 0 : img.size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(img.imgData.length, 8);
    entry.writeUInt32LE(offset, 12);

    dirEntries.push(entry);
    dataChunks.push(img.imgData);
    offset += img.imgData.length;
  }

  return Buffer.concat([header, ...dirEntries, ...dataChunks]);
}

async function extractEmblem(sourcePath) {
  const meta = await sharp(sourcePath).metadata();
  if (!meta.width || !meta.height) throw new Error('Brand source dimensions could not be read.');

  // The final full brand artwork includes the black Digitizing wordmark at the bottom.
  // PWA/favicon icons intentionally use only the embroidered B + pink needle mark,
  // because wordmarks become unreadable at launcher/favicon sizes.
  const cropHeight = Math.round(meta.height * 0.82);
  const { data, info } = await sharp(sourcePath)
    .extract({ left: 0, top: 0, width: meta.width, height: cropHeight })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // The checked-in full logo currently has a dark flattened background.
  // Recover the colored emblem by keeping only the green embroidery and pink needle.
  // This preserves the authoritative brand mark without carrying the black box into icons.
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const isGreen = g >= 18 && g >= r + 5 && g >= b + 2;
    const isPink = r >= 55 && r >= g + 10 && b >= g + 4;
    data[i + 3] = (isGreen || isPink) ? 255 : 0;
  }

  return sharp(data, { raw: info })
    .png()
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
}

async function buildSafeSquare(emblemBuffer, size) {
  const maxContent = Math.round(size * CONTENT_RATIO);

  const fitted = await sharp(emblemBuffer)
    .resize(maxContent, maxContent, {
      fit: 'inside',
      withoutEnlargement: false,
      kernel: sharp.kernel.lanczos3
    })
    .png()
    .toBuffer();

  const fittedMeta = await sharp(fitted).metadata();
  const left = Math.floor((size - fittedMeta.width) / 2);
  const top = Math.floor((size - fittedMeta.height) / 2);

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: '#ffffff'
    }
  })
    .composite([{ input: fitted, left, top }])
    .flatten({ background: '#ffffff' })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
}

async function writePng(filePath, buffer) {
  fs.writeFileSync(filePath, buffer);
  const meta = await sharp(buffer).metadata();
  console.log(`  ✓ ${path.relative(ROOT, filePath)} (${meta.width}x${meta.height})`);
}

async function main() {
  if (!fs.existsSync(BRAND_SOURCE)) {
    throw new Error(`Missing brand source: ${BRAND_SOURCE}`);
  }

  console.log('Generating BDigitizing install-safe branding assets');
  console.log(`Source: ${path.relative(ROOT, BRAND_SOURCE)}`);
  console.log(`Safe padding: ${SAFE_PADDING_RATIO * 100}% per edge; content max: ${CONTENT_RATIO * 100}%`);

  const emblem = await extractEmblem(BRAND_SOURCE);
  const master = await buildSafeSquare(emblem, MASTER_SIZE);

  await writePng(path.join(PUBLIC_DIR, 'pwa-icon-source.png'), master);

  const p512 = await buildSafeSquare(emblem, 512);
  const p192 = await buildSafeSquare(emblem, 192);
  const p180 = await buildSafeSquare(emblem, 180);
  const p96 = await buildSafeSquare(emblem, 96);
  const p48 = await buildSafeSquare(emblem, 48);

  // Canonical filenames requested by the manifest.
  await writePng(path.join(PUBLIC_DIR, 'icon-512x512.png'), p512);
  await writePng(path.join(PUBLIC_DIR, 'icon-192x192.png'), p192);
  await writePng(path.join(PUBLIC_DIR, 'apple-touch-icon.png'), p180);
  await writePng(path.join(PUBLIC_DIR, 'favicon.png'), p48);

  // Backward-compatible aliases for push payloads / already-installed clients.
  await writePng(path.join(PUBLIC_DIR, 'icon-512.png'), p512);
  await writePng(path.join(PUBLIC_DIR, 'icon-192.png'), p192);
  await writePng(path.join(PUBLIC_DIR, 'logo-icon.png'), p96);
  await writePng(path.join(PUBLIC_DIR, 'logo-small.png'), p96);

  // Keep fallbacks in /public only. Do NOT write app/icon.png, app/apple-icon.png,
  // or app/favicon.ico: Next file-based metadata would override database branding.
  const icoBuf = await createBmpIco([16, 32, 48], p512);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.ico'), icoBuf);
  console.log('  ✓ public/favicon.ico (16/32/48 multi-size)');

  console.log('All PWA, Apple, and favicon assets generated with a white background and safe padding.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
