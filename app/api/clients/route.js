import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../src/lib/supabase/admin';
import { getServerAuthUser } from '../../../src/lib/supabase/serverAuth';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const supabase = createAdminClient();

    if (action === 'fetchAll') {
      const { user, isAdmin } = await getServerAuthUser(request);
      if (!user || !isAdmin) {
        return NextResponse.json({ clients: [] });
      }
      
      const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return NextResponse.json({ clients: data || [] });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[Clients API GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { action, payload } = data;
    const supabase = createAdminClient();

    if (action === 'upsert') {
      const { user, isAdmin } = await getServerAuthUser(request);
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
      }
      
      const targetEmail = (payload?.email || user.email).toLowerCase().trim();
      
      if (!isAdmin && targetEmail !== user.email.toLowerCase().trim()) {
        return NextResponse.json({ error: 'Forbidden: Cannot modify another client profile.' }, { status: 403 });
      }

      // Sanitize fields: regular customers cannot overwrite wallet_balance or role
      let updatePayload = {
        email: targetEmail,
        name: payload.name || payload.full_name || user.user_metadata?.full_name || 'Client',
        full_name: payload.full_name || payload.name || user.user_metadata?.full_name || 'Client',
        phone: payload.phone || null,
        company: payload.company || null,
        avatar_url: payload.avatar_url || payload.avatar || null,
        updated_at: new Date().toISOString()
      };

      if (isAdmin) {
        if (payload.wallet_balance !== undefined) updatePayload.wallet_balance = parseFloat(payload.wallet_balance || 0);
        if (payload.role !== undefined) updatePayload.role = payload.role;
        if (payload.orders_count !== undefined) updatePayload.orders_count = parseInt(payload.orders_count || 0);
      }

      const { error } = await supabase
        .from('clients')
        .upsert(updatePayload, { onConflict: 'email' });
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[Clients API POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
