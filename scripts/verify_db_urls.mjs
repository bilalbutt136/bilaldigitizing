import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const tablesToCheck = [
  'hero_slides',
  'home_page_settings',
  'messages',
  'order_files',
  'orders',
  'portfolio',
  'site_branding',
  'site_config',
  'worker_profiles'
];

async function check() {
  console.log(`Checking database at ${supabaseUrl}...`);
  let totalMatches = 0;

  for (const table of tablesToCheck) {
    const { data, error } = await supabase.from(table).select('*');
    if (error) {
      console.error(`Error querying ${table}:`, error.message);
      continue;
    }

    let tableMatches = 0;
    (data || []).forEach(row => {
      const str = JSON.stringify(row);
      if (str.includes('qkgvgrscjlijajuzouke')) {
        tableMatches++;
        totalMatches++;
      }
    });

    console.log(`Table [${table}]: ${tableMatches} rows with old ref (total rows: ${data?.length || 0})`);
  }

  console.log(`\nVerification complete. Total rows with old ref: ${totalMatches}`);
}

check();
