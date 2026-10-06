import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

const BACKUP_DIR = path.resolve(process.cwd(), 'backup');
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Ordered table list to respect foreign key constraints during restore
const TABLES_IN_ORDER = [
  // 1. Core Config & Independent Catalog Tables
  'admins',
  'admin_security_settings',
  'site_branding',
  'site_config',
  'home_page_settings',
  'hero_slides',
  'home_page_slides',
  'services',
  'pricing_tiers',
  'pricing_cards',
  'pricing_static_cards',
  'patch_cards',
  'store_products',
  'portfolio',
  'sew_outs',
  'digitizers',
  'faqs',
  'testimonials',
  'trust_features',
  'trust_stats',
  'workflow_steps',
  'vector_format_options',
  'private_server_config',
  'cms_content',
  'saved_replies',
  'blogs',

  // 2. Client & Worker Identity Tables
  'clients',
  'workers',
  'worker_profiles',
  'worker_earnings',
  'payouts',

  // 3. Operational & Communication Tables
  'conversations',
  'orders',
  'custom_offers',
  'messages',
  'order_files',
  'revisions',
  'invoices',
  'receipts',
  'transactions',
  'customer_reviews',
  'notifications',
  'push_subscriptions',
  'email_campaigns',
  'email_notification_logs',
  'payment_webhook_events',
  'tracking_events',
  'distributed_rate_limits',
  'user_presence_sessions',
  'media_assets'
];

function runSupabaseQuery(sql) {
  const result = spawnSync('supabase', ['db', 'query', '--linked', sql], {
    cwd: process.cwd(),
    encoding: 'utf8',
    windowsHide: true,
    shell: true,
    maxBuffer: 50 * 1024 * 1024
  });

  if (result.error) {
    throw result.error;
  }

  const stdout = result.stdout || '';
  const firstBrace = stdout.indexOf('{');
  if (firstBrace === -1) {
    throw new Error(`Failed to parse query output: ${stdout || result.stderr}`);
  }

  const jsonStr = stdout.slice(firstBrace);
  try {
    return JSON.parse(jsonStr);
  } catch (err) {
    throw new Error(`JSON parse error on query response: ${err.message}`);
  }
}

function escapeSqlValue(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'NULL';
  if (typeof value === 'object') {
    return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
  }
  const str = String(value);
  return `'${str.replace(/'/g, "''")}'`;
}

async function backupDatabase() {
  console.log('====================================================');
  console.log(' Starting Complete Supabase Data Backup...');
  console.log(' Target Directory:', BACKUP_DIR);
  console.log('====================================================\n');

  const fullDump = {};
  const sqlStatements = [];

  sqlStatements.push('-- ========================================================');
  sqlStatements.push('-- Supabase Data Restore Script');
  sqlStatements.push(`-- Generated: ${new Date().toISOString()}`);
  sqlStatements.push('-- ========================================================\n');
  sqlStatements.push('BEGIN;\n');
  sqlStatements.push('-- Temporarily disable triggers and foreign key checks for clean load');
  sqlStatements.push('SET session_replication_role = replica;\n');

  let totalRowsCount = 0;

  for (const tableName of TABLES_IN_ORDER) {
    process.stdout.write(`Dumping [public.${tableName}]... `);
    try {
      const query = `SELECT json_agg(t) as data FROM public.${tableName} t;`;
      const response = runSupabaseQuery(query);
      const rows = response?.rows?.[0]?.data || [];

      fullDump[tableName] = rows;
      totalRowsCount += rows.length;
      console.log(`✓ ${rows.length} rows`);

      if (rows.length > 0) {
        sqlStatements.push(`-- Table: public.${tableName} (${rows.length} rows)`);
        for (const row of rows) {
          const columns = Object.keys(row);
          const colList = columns.map(c => `"${c}"`).join(', ');
          const valList = columns.map(c => escapeSqlValue(row[c])).join(', ');
          sqlStatements.push(
            `INSERT INTO public.${tableName} (${colList}) VALUES (${valList}) ON CONFLICT DO NOTHING;`
          );
        }
        sqlStatements.push('');
      }
    } catch (err) {
      console.log(`⚠️ Warning: Could not dump public.${tableName}: ${err.message}`);
      fullDump[tableName] = [];
    }
  }

  sqlStatements.push('-- Restore triggers and foreign key verification');
  sqlStatements.push('SET session_replication_role = DEFAULT;\n');
  sqlStatements.push('COMMIT;\n');

  // 1. Write JSON dump
  const jsonPath = path.join(BACKUP_DIR, 'supabase_data_backup.json');
  fs.writeFileSync(jsonPath, JSON.stringify(fullDump, null, 2), 'utf8');

  // 2. Write SQL restore script
  const sqlPath = path.join(BACKUP_DIR, 'supabase_data_restore.sql');
  fs.writeFileSync(sqlPath, sqlStatements.join('\n'), 'utf8');

  // 3. Write summary
  const summaryPath = path.join(BACKUP_DIR, 'BACKUP_SUMMARY.json');
  const summary = {
    createdAt: new Date().toISOString(),
    totalTables: Object.keys(fullDump).length,
    totalRows: totalRowsCount,
    tableCounts: Object.fromEntries(
      Object.entries(fullDump).map(([k, v]) => [k, v.length])
    )
  };
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf8');

  console.log('\n====================================================');
  console.log('✓ Backup Completed Successfully!');
  console.log(`✓ Total Tables Backed Up: ${Object.keys(fullDump).length}`);
  console.log(`✓ Total Rows Backed Up:   ${totalRowsCount}`);
  console.log(`✓ JSON Dump:             ${jsonPath}`);
  console.log(`✓ SQL Restore Script:    ${sqlPath}`);
  console.log(`✓ Summary File:          ${summaryPath}`);
  console.log('====================================================\n');
}

backupDatabase().catch(err => {
  console.error('Fatal backup error:', err);
  process.exit(1);
});
