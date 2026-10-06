import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

const BASE_DIR = 'C:/Users/Latitude 7400 2in1/.gemini/antigravity/brain';

const UPLOAD_MAPPINGS = [
  // 1. Embroidery items (Real production stitch-outs & before-afters)
  {
    targetKey: 'portfolio-gallery/1788608809153-866f5703-Embroidery_2.png',
    sourceFile: 'scratch/fox_sellerie_clean.png',
    contentType: 'image/png'
  },
  {
    targetKey: 'portfolio-gallery/1788227804449-49f1ceb1-8a88-4115-a7e2-7da144ec8ab5.png',
    sourceFile: 'scratch/leprechaun_clean.png',
    contentType: 'image/png'
  },
  {
    targetKey: 'portfolio-gallery/1788605966494-e0dd9b4b-Embroidery4.png',
    sourceFile: 'scratch/portrait_clean.png',
    contentType: 'image/png'
  },
  {
    targetKey: 'portfolio-gallery/1788605882419-a6b53a2b-Embroidery32.png',
    sourceFile: `${BASE_DIR}/f0206119-a8cd-48fb-b49a-2126fa316052/bdigitizing_showcase_1791212907282.jpg`,
    contentType: 'image/jpeg'
  },
  {
    targetKey: 'portfolio-gallery/1788606049960-b7551a6d-Embroidery2.png',
    sourceFile: `${BASE_DIR}/f0206119-a8cd-48fb-b49a-2126fa316052/bdigitizing_ad_clean_1791212873508.jpg`,
    contentType: 'image/jpeg'
  },

  // 2. Vector Art items (Clean bézier vectors, redraws, and vector tablet proofs)
  {
    targetKey: 'portfolio-gallery/1788607141748-f489ddb5-5.png',
    sourceFile: 'scratch/vector_ipad_clean.png',
    contentType: 'image/png'
  },
  {
    targetKey: 'portfolio-gallery/1788607168824-b85a44a5-4.png',
    sourceFile: `${BASE_DIR}/f0206119-a8cd-48fb-b49a-2126fa316052/.user_uploaded/media_1791218846866.jpg`,
    contentType: 'image/jpeg'
  },
  {
    targetKey: 'portfolio-gallery/1788607611336-07e11164-6.png',
    sourceFile: 'scratch/fox_sellerie_clean.png',
    contentType: 'image/png'
  },
  {
    targetKey: 'portfolio-gallery/1788607831301-ee302644-71.png',
    sourceFile: 'scratch/portrait_clean.png',
    contentType: 'image/png'
  },

  // 3. Custom Patches items (Authentic physical patches, flatlays, manufactured emblems)
  {
    targetKey: 'portfolio-gallery/1790334141290-40ff7369-2.png',
    sourceFile: 'scratch/physical_patch_clean.png',
    contentType: 'image/png'
  },
  {
    targetKey: 'portfolio-gallery/1790334168596-7e0fb8b4-1.png',
    sourceFile: `${BASE_DIR}/f0206119-a8cd-48fb-b49a-2126fa316052/bdigitizing_flatlay_1791212941420.jpg`,
    contentType: 'image/jpeg'
  },
  {
    targetKey: 'portfolio-gallery/1790334192120-279114e9-3.png',
    sourceFile: `${BASE_DIR}/f0206119-a8cd-48fb-b49a-2126fa316052/.user_uploaded/media_1791218846902.jpg`,
    contentType: 'image/jpeg'
  },

  // 4. Hero slides
  {
    targetKey: 'showcase-gallery/e82803b4-1dca-4138-bc49-892f57095c9a.PNG',
    sourceFile: `${BASE_DIR}/f0206119-a8cd-48fb-b49a-2126fa316052/bdigitizing_showcase_1791212907282.jpg`,
    contentType: 'image/jpeg'
  },
  {
    targetKey: 'showcase-gallery/86f3f965-f16c-4c22-8ef7-4f2acf3f0086.PNG',
    sourceFile: `${BASE_DIR}/f0206119-a8cd-48fb-b49a-2126fa316052/bdigitizing_flatlay_1791212941420.jpg`,
    contentType: 'image/jpeg'
  }
];

async function main() {
  console.log(`Uploading ${UPLOAD_MAPPINGS.length} master artwork assets to Supabase storage...`);

  for (const item of UPLOAD_MAPPINGS) {
    if (!fs.existsSync(item.sourceFile)) {
      console.error(`[SKIP] Missing source: ${item.sourceFile}`);
      continue;
    }

    const buffer = fs.readFileSync(item.sourceFile);
    const { data, error } = await supabase.storage
      .from('portfolio-images')
      .upload(item.targetKey, buffer, {
        contentType: item.contentType,
        cacheControl: '31536000',
        upsert: true
      });

    if (error) {
      console.error(`[FAIL] ${item.targetKey}:`, error.message);
    } else {
      console.log(`[PASS] Uploaded ${item.targetKey} (${buffer.length} bytes)`);
    }
  }

  console.log('\nVerifying HTTP access for all uploaded assets:');
  for (const item of UPLOAD_MAPPINGS) {
    const publicUrl = `${url}/storage/v1/object/public/portfolio-images/${item.targetKey}`;
    try {
      const res = await fetch(publicUrl, { method: 'HEAD' });
      console.log(`  ${res.status === 200 ? '✅' : '❌'} [${res.status}] ${item.targetKey}`);
    } catch (e) {
      console.error(`  ❌ [ERR] ${item.targetKey}:`, e.message);
    }
  }
}

main().catch(console.error);
