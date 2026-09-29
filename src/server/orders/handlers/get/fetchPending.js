import { NextResponse } from 'next/server';

export async function handleFetchPending(context) {
  const { supabase, isAdmin } = context;
      if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const { data, error } = await supabase.from('orders').select('id, title, client_name, client_email, service_category, price, status, payment_status, is_rush, artwork_url, image_url, notes, created_at').eq('status', 'pending').order('created_at', { ascending: false });
      if (error) throw error;
      return NextResponse.json({ orders: data }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
}
