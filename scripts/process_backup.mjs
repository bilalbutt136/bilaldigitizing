import fs from 'fs';
import path from 'path';

const BACKUP_DIR = path.resolve(process.cwd(), 'backup');
const rawFile = path.join(BACKUP_DIR, 'raw_dump.json');

if (!fs.existsSync(rawFile)) {
  console.error('raw_dump.json not found!');
  process.exit(1);
}

let rawText = fs.readFileSync(rawFile, 'utf16le');
if (!rawText.includes('{')) {
  rawText = fs.readFileSync(rawFile, 'utf8');
}
const firstBrace = rawText.indexOf('{');
if (firstBrace === -1) {
  console.error('No JSON object found in raw_dump.json');
  process.exit(1);
}

const parsedRoot = JSON.parse(rawText.slice(firstBrace));
const fullBackup = parsedRoot.rows[0].full_backup;

const TABLES_ORDER = [
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
  'clients',
  'workers',
  'worker_profiles',
  'worker_earnings',
  'payouts',
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
  'media_assets'
];

const ARRAY_COLUMNS = new Set([
  'orders.requested_formats',
  'conversations.tags'
]);

function escapeSqlValue(tableName, columnName, value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'NULL';

  const colKey = `${tableName}.${columnName}`;

  if (ARRAY_COLUMNS.has(colKey)) {
    if (Array.isArray(value)) {
      if (value.length === 0) return "'{}'::text[]";
      const escapedItems = value.map(item => `'${String(item).replace(/'/g, "''")}'`).join(', ');
      return `ARRAY[${escapedItems}]::text[]`;
    }
    const str = String(value).trim();
    if (str.startsWith('{') && str.endsWith('}')) {
      return `'${str.replace(/'/g, "''")}'::text[]`;
    }
    if (str.startsWith('[') && str.endsWith(']')) {
      try {
        const arr = JSON.parse(str);
        if (Array.isArray(arr)) {
          if (arr.length === 0) return "'{}'::text[]";
          const escaped = arr.map(i => `'${String(i).replace(/'/g, "''")}'`).join(', ');
          return `ARRAY[${escaped}]::text[]`;
        }
      } catch {}
    }
    return `ARRAY['${str.replace(/'/g, "''")}']::text[]`;
  }

  const isJson = 
    (tableName === 'site_config' && columnName === 'value') ||
    (tableName === 'cms_content' && columnName === 'value') ||
    (tableName === 'home_page_settings' && columnName === 'data') ||
    (tableName === 'home_page_settings' && columnName === 'value') ||
    (tableName === 'email_campaigns' && columnName === 'stats') ||
    (tableName === 'pricing_cards' && (columnName === 'features' || columnName === 'turnaround_options')) ||
    (tableName === 'pricing_static_cards' && (columnName === 'features' || columnName === 'turnaround_options')) ||
    (tableName === 'store_products' && columnName === 'formats') ||
    (tableName === 'custom_offers' && columnName === 'details') ||
    (tableName === 'orders' && (columnName === 'details' || columnName === 'workflow_steps' || columnName === 'extra_options')) ||
    (tableName === 'messages' && (columnName === 'attachments' || columnName === 'metadata')) ||
    (tableName === 'notifications' && columnName === 'metadata') ||
    (tableName === 'push_subscriptions' && (columnName === 'subscription' || columnName === 'keys')) ||
    (tableName === 'tracking_events' && columnName === 'metadata') ||
    (tableName === 'media_assets' && columnName === 'metadata');

  if (isJsonCol) {
    if (typeof value === 'object') {
      return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
    }
    const str = String(value).trim();
    try {
      JSON.parse(str);
      return `'${str.replace(/'/g, "''")}'::jsonb`;
    } catch {
      return `to_jsonb('${str.replace(/'/g, "''")}'::text)`;
    }
  }

  if (typeof value === 'object') {
    return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
  }
  const str = String(value);
  return `'${str.replace(/'/g, "''")}'`;
}

const sqlLines = [];
sqlLines.push('-- ========================================================');
sqlLines.push('-- Supabase Production Database Complete Restore Script');
sqlLines.push(`-- Generated: ${new Date().toISOString()}`);
sqlLines.push('-- ========================================================\n');
sqlLines.push('BEGIN;\n');
sqlLines.push('-- Temporarily disable foreign key checks during batch insertion');
sqlLines.push('SET session_replication_role = replica;\n');

let totalRows = 0;
const tableCounts = {};

for (const tableName of TABLES_ORDER) {
  const rows = fullBackup[tableName] || [];
  tableCounts[tableName] = rows.length;
  totalRows += rows.length;

  if (rows.length > 0) {
    sqlLines.push(`-- Table: public.${tableName} (${rows.length} rows)`);
    for (const row of rows) {
      const columns = Object.keys(row);
      const colList = columns.map(c => `"${c}"`).join(', ');
      const valList = columns.map(c => escapeSqlValue(tableName, c, row[c])).join(', ');
      sqlLines.push(
        `INSERT INTO public.${tableName} (${colList}) VALUES (${valList}) ON CONFLICT DO NOTHING;`
      );
    }
    sqlLines.push('');
  }
}

sqlLines.push('-- Re-enable normal constraints and triggers');
sqlLines.push('SET session_replication_role = DEFAULT;\n');
sqlLines.push('COMMIT;\n');

// 1. Write clean JSON backup
const cleanJsonPath = path.join(BACKUP_DIR, 'supabase_data_backup.json');
fs.writeFileSync(cleanJsonPath, JSON.stringify(fullBackup, null, 2), 'utf8');

// 2. Write SQL restore script
const sqlPath = path.join(BACKUP_DIR, 'supabase_data_restore.sql');
fs.writeFileSync(sqlPath, sqlLines.join('\n'), 'utf8');

// 3. Remove temporary raw dump
try {
  fs.unlinkSync(rawFile);
} catch {}

// 4. Create detailed Markdown Summary
const summaryMd = `# Supabase Production Backup Summary

**Backup Timestamp:** ${new Date().toISOString()}  
**Source Project:** \`bilaldigitizing\` (\`qkgvgrscjlijajuzouke\`)  
**Total Tables:** ${TABLES_ORDER.length}  
**Total Rows Exported:** ${totalRows}  

## Row Counts Per Table:

| Table Name | Row Count |
| :--- | :--- |
${TABLES_ORDER.filter(t => tableCounts[t] > 0).map(t => `| \`public.${t}\` | **${tableCounts[t]}** |`).join('\n')}
${TABLES_ORDER.filter(t => tableCounts[t] === 0).map(t => `| \`public.${t}\` | 0 |`).join('\n')}

## Backup Files Created:
1. **[\`supabase_data_restore.sql\`](./supabase_data_restore.sql)**: Complete SQL migration & insert script.
2. **[\`supabase_data_backup.json\`](./supabase_data_backup.json)**: Structured JSON representation of all tables and rows.
3. **[\`RESTORE_GUIDE.md\`](./RESTORE_GUIDE.md)**: Easy instructions to migrate everything into a new Supabase project.
`;

fs.writeFileSync(path.join(BACKUP_DIR, 'BACKUP_SUMMARY.md'), summaryMd, 'utf8');

console.log('✓ Successfully processed backup!');
console.log(`✓ Total tables: ${TABLES_ORDER.length}`);
console.log(`✓ Total rows: ${totalRows}`);
console.log(`✓ Saved clean JSON to: ${cleanJsonPath}`);
console.log(`✓ Saved SQL script to: ${sqlPath}`);
