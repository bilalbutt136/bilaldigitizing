import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await sb.from('notifications')
    .select('*')
    .eq('recipient_email', 'testtest@gmail.com')
    .order('created_at', { ascending: false })
    .limit(5);

  console.log('NOTIFICATIONS FOR testtest@gmail.com:');
  data?.forEach(n => {
    console.log({
      id: n.id,
      title: n.title,
      link: n.link,
      order_id: n.order_id,
      metadata: n.metadata
    });
  });
}

check().catch(console.error);
