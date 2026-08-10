import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.rpc('get_duplicate_emails'); // Wait, we can't do this.
  // Instead, just select all clients and group in JS.
  const { data: clients, error: err } = await supabase.from('clients').select('email');
  
  if (err) {
    console.error(err);
    return;
  }
  
  const counts = {};
  clients.forEach(c => {
    counts[c.email] = (counts[c.email] || 0) + 1;
  });
  
  const dups = Object.keys(counts).filter(k => counts[k] > 1);
  console.log("Duplicate emails:", dups);
}

check();
