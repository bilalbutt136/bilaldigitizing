const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const srcPath = 'C:/Users/Latitude 7400 2in1/.gemini/antigravity/brain/eac5f6e2-c599-4d02-9399-f6e519816927/.user_uploaded/media_1790247741277.png';

async function createBmpIco(sizes, src) {
  const images = [];
  for (const size of sizes) {
    const { data } = await sharp(src)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const bih = Buffer.alloc(40);
    bih.writeUInt32LE(40, 0); // biSize
    bih.writeInt32LE(size, 4); // biWidth
    bih.writeInt32LE(size * 2, 8); // biHeight (doubled for XOR + AND)
    bih.writeUInt16LE(1, 12); // biPlanes
    bih.writeUInt16LE(32, 14); // biBitCount
    bih.writeUInt32LE(0, 16); // biCompression (BI_RGB)
    bih.writeUInt32LE(size * size * 4, 20); // biSizeImage
    bih.writeInt32LE(0, 24); // biXPelsPerMeter
    bih.writeInt32LE(0, 28); // biYPelsPerMeter
    bih.writeUInt32LE(0, 32); // biClrUsed
    bih.writeUInt32LE(0, 36); // biClrImportant

    const xorMask = Buffer.alloc(size * size * 4);
    const andRowBytes = Math.ceil(size / 32) * 4;
    const andMask = Buffer.alloc(andRowBytes * size, 0);

    for (let y = 0; y < size; y++) {
      const srcY = size - 1 - y; // bottom-up
      for (let x = 0; x < size; x++) {
        const srcIdx = (srcY * size + x) * 4;
        const dstIdx = (y * size + x) * 4;
        const r = data[srcIdx];
        const g = data[srcIdx + 1];
        const b = data[srcIdx + 2];
        const a = data[srcIdx + 3];

        xorMask[dstIdx] = b;
        xorMask[dstIdx + 1] = g;
        xorMask[dstIdx + 2] = r;
        xorMask[dstIdx + 3] = a;

        if (a === 0) {
          const byteIdx = y * andRowBytes + Math.floor(x / 8);
          const bitPos = 7 - (x % 8);
          andMask[byteIdx] |= (1 << bitPos);
        }
      }
    }

    const imgData = Buffer.concat([bih, xorMask, andMask]);
    images.push({ size, imgData });
  }

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2); // 1 = ICO
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

async function main() {
  console.log('Reading source image:', srcPath);
  const originalRaw = fs.readFileSync(srcPath);
  const base64Data = originalRaw.toString('base64');

  // 1. Generate SVG with base64 data URL
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
  <image href="data:image/png;base64,${base64Data}" x="4" y="0" width="40" height="48" />
</svg>
`;

  fs.writeFileSync(path.join(__dirname, '../public/favicon.svg'), svgContent, 'utf8');
  fs.writeFileSync(path.join(__dirname, '../app/icon.svg'), svgContent, 'utf8');
  console.log('Updated public/favicon.svg and app/icon.svg');

  // 2. Generate ICO with 16, 32, 48 sizes
  const icoBuf = await createBmpIco([16, 32, 48], srcPath);
  fs.writeFileSync(path.join(__dirname, '../public/favicon.ico'), icoBuf);
  fs.writeFileSync(path.join(__dirname, '../app/favicon.ico'), icoBuf);
  console.log('Updated public/favicon.ico and app/favicon.ico');

  // 3. Generate square PNG icons
  const p48 = await sharp(srcPath)
    .resize(48, 48, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(__dirname, '../public/favicon.png'), p48);
  fs.writeFileSync(path.join(__dirname, '../app/icon.png'), p48);
  console.log('Updated public/favicon.png and app/icon.png');

  const p192 = await sharp(srcPath)
    .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(__dirname, '../public/icon-192.png'), p192);
  console.log('Updated public/icon-192.png');

  const p512 = await sharp(srcPath)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(__dirname, '../public/icon-512.png'), p512);
  console.log('Updated public/icon-512.png');

  // Apple touch icon: 180x180, centered on #0f172a background for crisp native display
  const innerB = await sharp(srcPath)
    .resize(120, 144, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const pApple = await sharp({
    create: {
      width: 180,
      height: 180,
      channels: 4,
      background: { r: 15, g: 23, b: 42, alpha: 1 } // #0f172a
    }
  })
    .composite([{ input: innerB, top: 18, left: 30 }])
    .png()
    .toBuffer();

  fs.writeFileSync(path.join(__dirname, '../public/apple-touch-icon.png'), pApple);
  fs.writeFileSync(path.join(__dirname, '../app/apple-icon.png'), pApple);
  console.log('Updated public/apple-touch-icon.png and app/apple-icon.png');

  console.log('All favicon and icon assets generated successfully!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
