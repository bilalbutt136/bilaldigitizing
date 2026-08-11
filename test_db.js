import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing DB credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Try to select from information_schema to see tables
    const { data, error } = await supabase.rpc('get_tables'); // Or just a simple query if RPC doesn't exist
    
    // Let's just try to fetch a single row from a common table like 'profiles' or 'users' or 'orders'
    const { data: orders, error: ordersErr } = await supabase.from('orders').select('*').limit(1);
    
    if (ordersErr) {
      console.log("Connection successful, but 'orders' table might not exist or permission denied:", ordersErr.message);
    } else {
      console.log("Connection successful! Fetched from 'orders' table.");
    }
  } catch (err) {
    console.error("Error connecting to database:", err);
  }
}

testConnection();
