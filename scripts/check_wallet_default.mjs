import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import pg from 'pg';

async function main() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  const res = await client.query(`
    SELECT proname, pg_get_functiondef(oid) as def
    FROM pg_proc 
    WHERE proname = 'handle_new_user'
  `);
  console.log('handle_new_user def:', res.rows[0]?.def);

  await client.end();
}

main().catch(console.error);
