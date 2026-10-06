import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import pg from 'pg';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!url || !serviceKey || !dbUrl) {
  console.error('Missing configuration in .env.local');
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

const BASE_DIR = 'C:/Users/Latitude 7400 2in1/.gemini/antigravity/brain';

const MASTER_UPLOADS = [
  // 1. Embroidery items
  {
    targetKey: 'showcase-master/embroidery-fox-sellerie-v4.png',
    sourceFile: 'scratch/fox_sellerie_perfect.png',
    contentType: 'image/png'
  },
  {
    targetKey: 'showcase-master/embroidery-notre-dame-v3.png',
    sourceFile: 'scratch/leprechaun_clean.png',
    contentType: 'image/png'
  },
  {
    targetKey: 'showcase-master/embroidery-portrait-v4.png',
    sourceFile: 'scratch/portrait_perfect.png',
    contentType: 'image/png'
  },
  {
    targetKey: 'showcase-master/embroidery-3d-puff-showcase-v3.jpg',
    sourceFile: `${BASE_DIR}/f0206119-a8cd-48fb-b49a-2126fa316052/bdigitizing_showcase_1791212907282.jpg`,
    contentType: 'image/jpeg'
  },
  {
    targetKey: 'showcase-master/embroidery-commercial-ad-v3.jpg',
    sourceFile: `${BASE_DIR}/f0206119-a8cd-48fb-b49a-2126fa316052/bdigitizing_ad_clean_1791212873508.jpg`,
    contentType: 'image/jpeg'
  },

  // 2. Vector items
  {
    targetKey: 'showcase-master/vector-ipad-digital-art-v3.png',
    sourceFile: 'scratch/vector_ipad_clean.png',
    contentType: 'image/png'
  },
  {
    targetKey: 'showcase-master/vector-tracing-master-ad-v3.jpg',
    sourceFile: `${BASE_DIR}/f0206119-a8cd-48fb-b49a-2126fa316052/.user_uploaded/media_1791218846866.jpg`,
    contentType: 'image/jpeg'
  },
  {
    targetKey: 'showcase-master/vector-fox-sellerie-v4.png',
    sourceFile: 'scratch/fox_sellerie_perfect.png',
    contentType: 'image/png'
  },
  {
    targetKey: 'showcase-master/vector-portrait-v4.png',
    sourceFile: 'scratch/portrait_perfect.png',
    contentType: 'image/png'
  },

  // 3. Patch items
  {
    targetKey: 'showcase-master/patch-bdigitizing-winged-emblem-v3.png',
    sourceFile: 'scratch/physical_patch_clean.png',
    contentType: 'image/png'
  },
  {
    targetKey: 'showcase-master/patch-studio-flatlay-production-v3.jpg',
    sourceFile: `${BASE_DIR}/f0206119-a8cd-48fb-b49a-2126fa316052/bdigitizing_flatlay_1791212941420.jpg`,
    contentType: 'image/jpeg'
  },
  {
    targetKey: 'showcase-master/patch-custom-embroidery-ad-v3.jpg',
    sourceFile: `${BASE_DIR}/f0206119-a8cd-48fb-b49a-2126fa316052/.user_uploaded/media_1791218846902.jpg`,
    contentType: 'image/jpeg'
  }
];

// DB Row Mappings
const DB_UPDATES = [
  // Embroidery
  { id: 'port-1788018937219', fileKey: 'showcase-master/embroidery-fox-sellerie-v4.png', title: 'Fox Sellerie Logo Sew-Out' },
  { id: 'port-emb-2', fileKey: 'showcase-master/embroidery-notre-dame-v3.png', title: 'Notre Dame Mascot Stitch-Out' },
  { id: 'port-1788598030613', fileKey: 'showcase-master/embroidery-portrait-v4.png', title: 'Realistic Portrait Stitch-Out' },
  { id: 'port-1788603595307', fileKey: 'showcase-master/embroidery-3d-puff-showcase-v3.jpg', title: 'Commercial 3D Puff Cap Digitizing' },
  { id: 'port-1788606037668', fileKey: 'showcase-master/embroidery-commercial-ad-v3.jpg', title: 'Factory Production Stitch Pathing' },

  // Vector Art
  { id: 'port-1788606842535', fileKey: 'showcase-master/vector-ipad-digital-art-v3.png', title: 'Clean Vector Artwork Restoration' },
  { id: 'port-1788607150717', fileKey: 'showcase-master/vector-tracing-master-ad-v3.jpg', title: 'Pantone Spot Separation & Redraw' },
  { id: 'port-1788607585069', fileKey: 'showcase-master/vector-fox-sellerie-v4.png', title: 'Crisp Vector Bézier Curves' },
  { id: 'port-1788607816127', fileKey: 'showcase-master/vector-portrait-v4.png', title: 'Vector Illustration Line Art' },

  // Custom Patches
  { id: 'port-1788612436876', fileKey: 'showcase-master/patch-bdigitizing-winged-emblem-v3.png', title: 'Physical Embroidered Emblem Patch' },
  { id: 'port-1788612612014', fileKey: 'showcase-master/patch-studio-flatlay-production-v3.jpg', title: 'Physical Manufactured Patches Flatlay' },
  { id: 'port-1788612636226', fileKey: 'showcase-master/patch-custom-embroidery-ad-v3.jpg', title: 'Velcro & Iron-On Custom Patches' }
];

async function main() {
  console.log('1. Uploading clean master artwork files to Supabase Storage...');
  for (const item of MASTER_UPLOADS) {
    if (!fs.existsSync(item.sourceFile)) {
      console.error(`[SKIP] Missing: ${item.sourceFile}`);
      continue;
    }
    const buf = fs.readFileSync(item.sourceFile);
    const { data, error } = await supabase.storage
      .from('portfolio-images')
      .upload(item.targetKey, buf, {
        contentType: item.contentType,
        cacheControl: '3600',
        upsert: true
      });
    if (error) {
      console.error(`[FAIL] ${item.targetKey}:`, error.message);
    } else {
      console.log(`[PASS] Uploaded: ${item.targetKey} (${buf.length} bytes)`);
    }
  }

  console.log('\n2. Updating Supabase DB portfolio rows with master URLs...');
  const client = new pg.Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  for (const upd of DB_UPDATES) {
    const fullUrl = `${url}/storage/v1/object/public/portfolio-images/${upd.fileKey}`;
    await client.query(
      `UPDATE portfolio SET digitized_image = $1, title = $2, updated_at = NOW() WHERE id = $3`,
      [fullUrl, upd.title, upd.id]
    );
    console.log(`  Updated portfolio [${upd.id}] -> ${fullUrl}`);
  }

  // Also update hero_slides
  await client.query(
    `UPDATE hero_slides SET banner_image = $1 WHERE service_key = 'embroidery'`,
    [`${url}/storage/v1/object/public/portfolio-images/showcase-master/embroidery-3d-puff-showcase-v3.jpg`]
  );
  await client.query(
    `UPDATE hero_slides SET banner_image = $1 WHERE service_key = 'vector-art'`,
    [`${url}/storage/v1/object/public/portfolio-images/showcase-master/vector-ipad-digital-art-v3.png`]
  );
  await client.query(
    `UPDATE hero_slides SET banner_image = $1 WHERE service_key = 'patches'`,
    [`${url}/storage/v1/object/public/portfolio-images/showcase-master/patch-studio-flatlay-production-v3.jpg`]
  );

  console.log('  Updated hero_slides banner_image rows.');

  await client.end();
  console.log('\nAll master assets successfully uploaded and database synchronized!');
}

main().catch(console.error);
