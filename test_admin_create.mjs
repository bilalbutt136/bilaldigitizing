import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testAdminCreate() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: `test_${Date.now()}@example.com`,
    password: 'password123',
    email_confirm: true
  });
  
  console.log("Admin Create User Data:", data);
  console.log("Admin Create User Error:", error);
}

testAdminCreate();
