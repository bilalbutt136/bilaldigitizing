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
      if (error) {
        console.error('[Clients API GET fetchAll error]', error.message);
        return NextResponse.json({ clients: [] });
      }
      return NextResponse.json({ clients: data || [] });
    }

    // Default GET: Return current authenticated user client profile
    const { user } = await getServerAuthUser(request);
    if (!user) {
      return NextResponse.json({ client: null });
    }

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('email', user.email.toLowerCase().trim())
      .maybeSingle();

    if (error) {
      console.warn('[Clients API GET profile warning]', error.message);
      return NextResponse.json({ client: null });
    }

    return NextResponse.json({ client: data || null });
  } catch (error) {
    console.error('[Clients API GET]', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch client profile' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    let body = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const action = body.action || 'upsert';
    const payload = body.payload || body;
    const supabase = createAdminClient();

    if (action === 'upsert') {
      const { user, isAdmin } = await getServerAuthUser(request);
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
      }
      
      const targetEmail = (payload?.email || user.email || '').toLowerCase().trim();
      if (!targetEmail) {
        return NextResponse.json({ error: 'Client email is required.' }, { status: 400 });
      }
      
      if (!isAdmin && targetEmail !== user.email.toLowerCase().trim()) {
        return NextResponse.json({ error: 'Forbidden: Cannot modify another client profile.' }, { status: 403 });
      }

      const clientName = payload.name || payload.full_name || user.user_metadata?.full_name || user.email.split('@')[0] || 'Client';

      // Primary payload with all optional fields
      let updatePayload = {
        email: targetEmail,
        name: clientName,
        full_name: payload.full_name || clientName,
        phone: payload.phone || null,
        company: payload.company || payload.company_name || null,
        company_name: payload.company_name || payload.company || null,
        avatar_url: payload.avatar_url || payload.avatar || null,
        updated_at: new Date().toISOString()
      };

      if (isAdmin) {
        if (payload.wallet_balance !== undefined) updatePayload.wallet_balance = parseFloat(payload.wallet_balance || 0);
        if (payload.role !== undefined) updatePayload.role = payload.role;
        if (payload.orders_count !== undefined) updatePayload.orders_count = parseInt(payload.orders_count || 0);
      }

      try {
        const { error } = await supabase
          .from('clients')
          .upsert(updatePayload, { onConflict: 'email' });
        if (error) throw error;
      } catch (upsertErr) {
        console.warn('[Clients API Upsert fallback to core fields]:', upsertErr.message);
        // Fallback with only guaranteed base columns
        const corePayload = {
          email: targetEmail,
          name: clientName,
          full_name: clientName,
          company: payload.company || null,
          updated_at: new Date().toISOString()
        };
        const { error: coreErr } = await supabase
          .from('clients')
          .upsert(corePayload, { onConflict: 'email' });
        if (coreErr) throw coreErr;
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[Clients API POST]', error);
    return NextResponse.json({ error: error.message || 'Failed to update client profile' }, { status: 500 });
  }
}
