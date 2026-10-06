import pg from 'pg';
import fs from 'node:fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

export const PG_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
if (!PG_URL) {
  throw new Error('DATABASE_URL is not set in environment or .env.local');
}

export async function executeSqlFile(filePath) {
  console.log(`Executing SQL file: ${filePath}...`);
  const sql = fs.readFileSync(filePath, 'utf8');
  const client = new pg.Client({
    connectionString: PG_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  try {
    await client.query(sql);
    console.log(`Successfully executed: ${filePath}`);
  } catch (err) {
    console.error(`Error executing ${filePath}:`, err.message);
    throw err;
  } finally {
    await client.end();
  }
}

export async function executeSqlQuery(sql) {
  const client = new pg.Client({
    connectionString: PG_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  try {
    const res = await client.query(sql);
    return res;
  } finally {
    await client.end();
  }
}

if (process.argv[1] && process.argv[1].endsWith('pg_exec.mjs') && process.argv[2]) {
  try {
    const res = await executeSqlQuery(process.argv[2]);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
