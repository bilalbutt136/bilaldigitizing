import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env manually
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    envVars[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

console.log('--- TESTING NEW SUPABASE CONNECTION ---');
console.log('Project URL:', supabaseUrl);
console.log('Anon Key length:', supabaseAnonKey ? supabaseAnonKey.length : 0);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('ERROR: Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAllTables() {
  try {
    const { data: clients, error: cErr } = await supabase.from('clients').select('*').limit(3);
    console.log('1. clients table:', cErr ? `Notice: ${cErr.message}` : `Success (${clients?.length} records found)`);

    const { data: orders, error: oErr } = await supabase.from('orders').select('*').limit(3);
    console.log('2. orders table:', oErr ? `Notice: ${oErr.message}` : `Success (${orders?.length} records found)`);

    const { data: orderFiles, error: fErr } = await supabase.from('order_files').select('*').limit(3);
    console.log('3. order_files table:', fErr ? `Notice: ${fErr.message}` : `Success (${orderFiles?.length} records found)`);

    console.log('--- VERIFICATION COMPLETE ---');
  } catch (err) {
    console.error('Database connection exception:', err.message);
  }
}

testAllTables();
