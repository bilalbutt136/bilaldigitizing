import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testUpsert() {
  const { data, error } = await supabase.from('clients').upsert([
    {
      user_id: '7656aaf4-a938-48f1-bd24-2341e7f4577f', // an existing user id from auth.users (the bilal one)
      name: 'test',
      email: 'test_upsert@example.com'
    }
  ], { onConflict: 'email' });
  
  console.log("Upsert Data:", data);
  console.log("Upsert Error:", error);
}

testUpsert();
