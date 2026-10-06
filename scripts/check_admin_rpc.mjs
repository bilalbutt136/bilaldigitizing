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
    WHERE proname in ('resolve_trusted_user_access', 'admin_mfa_required')
  `);
  for (const row of res.rows) {
    console.log(`=== Function: ${row.proname} ===`);
    console.log(row.def);
  }

  // Update clients role to admin
  const updateRes = await client.query(`
    UPDATE clients 
    SET role = 'admin' 
    WHERE email IN ('shahidbutt59191@gmail.com', 'bilalsadiq612@gmail.com')
    RETURNING id, name, email, role
  `);
  console.log('=== Updated clients to admin ===');
  console.log(updateRes.rows);

  await client.end();
}

main().catch(console.error);
