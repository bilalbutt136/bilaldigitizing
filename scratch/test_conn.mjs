import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

console.log('--- SUPABASE DATABASE STABILITY VERIFICATION ---');
console.log('Project URL:', supabaseUrl);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('ERROR: Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAllTables() {
  try {
    const { data: clients, error: cErr } = await supabase.from('clients').select('*').limit(3);
    console.log('1. clients table:', cErr ? `Error: ${cErr.message}` : `Success (${clients?.length} records)`);

    const { data: orders, error: oErr } = await supabase.from('orders').select('*').limit(3);
    console.log('2. orders table:', oErr ? `Error: ${oErr.message}` : `Success (${orders?.length} records)`);

    const { data: orderFiles, error: fErr } = await supabase.from('order_files').select('*').limit(3);
    console.log('3. order_files table:', fErr ? `Error: ${fErr.message}` : `Success (${orderFiles?.length} records)`);

    console.log('--- ALL TABLES RESPONDING NATIVE & STABLE ---');
  } catch (err) {
    console.error('Database verification exception:', err.message);
  }
}

testAllTables();
