import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const sb = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await sb
    .from('orders')
    .select('id, client_email, status, notes, price, service_category, created_at, order_files(*)')
    .or('id.eq.#1208,id.eq.1208')
    .maybeSingle();

  console.log('QUERY RESULT:', { error, data: data ? {
    id: data.id,
    client_email: data.client_email,
    status: data.status,
    notes: data.notes,
    filesCount: data.order_files?.length
  } : null });
}

check().catch(console.error);
