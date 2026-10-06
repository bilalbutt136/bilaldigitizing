import { executeSqlQuery } from './pg_exec.mjs';

const tables = [
  'portfolio', 'hero_slides', 'order_files', 'orders', 'messages',
  'site_branding', 'site_config', 'home_page_settings'
];

async function check() {
  console.log('Verifying all tables in uoflzpbhwhgooeeehnta...');
  let totalOld = 0;

  for (const t of tables) {
    const res = await executeSqlQuery(`SELECT * FROM public.${t};`);
    let matches = 0;
    res.rows.forEach(r => {
      const s = JSON.stringify(r);
      if (s.includes('qkgvgrscjlijajuzouke')) matches++;
    });
    console.log(`Table [${t}]: ${matches} old refs (Total: ${res.rows.length} rows)`);
    totalOld += matches;
  }

  console.log(`\nVerification complete. Total rows with old ref: ${totalOld}`);
}

check().catch(console.error);
