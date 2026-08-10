require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testSignup() {
  const { data, error } = await supabase.auth.signUp({
    email: 'test@example.com',
    password: 'Password123!',
  });
  console.log("Error:", error);
  console.log("Error stringified:", JSON.stringify(error));
  console.log("Message:", error?.message);
}

testSignup();
