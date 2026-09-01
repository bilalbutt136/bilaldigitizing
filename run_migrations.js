import fs from 'fs';
import path from 'path';
import pkg from 'pg';
import dotenv from 'dotenv';
const { Client } = pkg;

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function runMigrations() {
  const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;
  if (!dbUrl) {
    console.warn("[Notice] No DATABASE_URL or SUPABASE_DATABASE_URL found in .env.local; skipping direct pg execution.");
    return;
  }

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("✓ Connected to Supabase PostgreSQL.");

    const dirs = [
      path.resolve(process.cwd(), 'database', 'migrations'),
      path.resolve(process.cwd(), 'supabase', 'migrations')
    ];

    for (const migrationsDir of dirs) {
      if (fs.existsSync(migrationsDir)) {
        const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
        for (const file of files) {
          const filePath = path.join(migrationsDir, file);
          const sql = fs.readFileSync(filePath, 'utf8');
          console.log(`Executing migration (${path.basename(migrationsDir)}): ${file}...`);
          await client.query(sql);
          console.log(`✓ Migration ${file} applied successfully.`);
        }
      }
    }

    console.log("✓ All migrations executed successfully.");
  } catch (err) {
    console.error("Migration execution notice:", err.message);
  } finally {
    try {
      await client.end();
    } catch {}
  }
}

runMigrations();
