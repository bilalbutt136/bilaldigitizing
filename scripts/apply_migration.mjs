import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import fs from 'node:fs';
import pg from 'pg';

async function main() {
  const sqlFile = 'supabase/migrations/20261006000001_fix_clients_zero_wallet_balance_default.sql';
  const sql = fs.readFileSync(sqlFile, 'utf8');

  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  console.log('Applying migration:', sqlFile);
  await client.query(sql);
  console.log('Migration applied successfully!');

  // Verify clients table column default
  const colRes = await client.query(`
    SELECT table_name, column_name, column_default, data_type
    FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'wallet_balance'
  `);
  console.log('\nColumn default check:');
  console.log(colRes.rows);

  // Verify clients rows
  const clientsRes = await client.query(`
    SELECT id, name, email, role, wallet_balance, created_at
    FROM public.clients
    ORDER BY created_at DESC
  `);
  console.log('\nAll clients in DB after migration:');
  console.log(clientsRes.rows);

  await client.end();
}

main().catch(console.error);
