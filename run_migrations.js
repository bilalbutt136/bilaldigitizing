import fs from 'fs';
import path from 'path';
import pkg from 'pg';
import dotenv from 'dotenv';
const { Client } = pkg;

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function runMigration() {
  const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;
  if (!dbUrl) {
    console.error("No DATABASE_URL or SUPABASE_DATABASE_URL found in .env.local!");
    process.exit(1);
  }

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected to Supabase PostgreSQL.");

    const sqlPath = path.resolve(process.cwd(), 'database', 'cms_migrations.sql');
    const sqlScript = fs.readFileSync(sqlPath, 'utf8');

    console.log("Executing SQL migration...");
    await client.query(sqlScript);

    console.log("Migration executed successfully.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await client.end();
  }
}

runMigration();
