import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testInsert() {
  const { data, error } = await supabase.from('clients').insert([
    {
      user_id: '00000000-0000-0000-0000-000000000000',
      name: 'test',
      full_name: 'test full',
      email: 'test_insert@example.com',
      company: 'test co',
      company_name: 'test co name',
      wallet_balance: 0
    }
  ]);
  
  console.log("Insert Data:", data);
  console.log("Insert Error:", error);
}

testInsert();
