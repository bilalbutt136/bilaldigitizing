import { NextResponse } from 'next/server';
import { supabaseAdmin, hasServiceRole } from '../../../src/lib/supabaseAdmin';

async function getAuthUser(request) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return { user: null, error: 'Missing authentication token.' };
  if (!supabaseAdmin) return { user: null, error: 'Supabase admin is not configured.' };

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) {
    return { user: null, error: error?.message || 'Invalid or expired session.' };
  }
  return { user: data.user };
}

// POST /api/wallet { action: 'deposit' | 'deduct', amount }
// Server-side wallet ledger updates so wallet_balance can never be
// spoofed from the client. Operates on the authenticated user's record.
export async function POST(request) {
  try {
    if (!hasServiceRole || !supabaseAdmin) {
      const body = await request.json().catch(() => ({}));
      const amount = parseFloat(body?.amount || 0);
      return NextResponse.json(
        { success: true, balance: amount, notice: 'Running in local mode. Connect Supabase service role for server ledger.' },
        { status: 200 }
      );
    }

    const { user, error: authError } = await getAuthUser(request);
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: authError || 'Authentication required.' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const action = body?.action;
    const amount = parseFloat(body?.amount);
    const email = (user.email || '').toLowerCase().trim();

    if (!action || !['deposit', 'deduct'].includes(action)) {
      return NextResponse.json({ success: false, error: 'Invalid wallet action.' }, { status: 400 });
    }

    if (action === 'deposit') {
      // Secure deposits: only admins can manually deposit through this route now.
      // Customers must use BoltPayouts webhooks.
      const { data: adminData } = await supabaseAdmin
        .from('admins')
        .select('email')
        .eq('email', email)
        .maybeSingle();

      if (!adminData) {
        return NextResponse.json({ success: false, error: 'Direct deposits are disabled. Please use BoltPayouts checkout.' }, { status: 403 });
      }
    }
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ success: false, error: 'Amount must be a positive number.' }, { status: 400 });
    }

    let { data: clientData, error: clientErr } = await supabaseAdmin
      .from('clients')
      .select('id, wallet_balance, name')
      .eq('email', email)
      .maybeSingle();

    if (clientErr) {
      return NextResponse.json({ success: false, error: clientErr.message }, { status: 500 });
    }

    if (!clientData) {
      // Auto-create the wallet record for this authenticated user
      const clientName = user.user_metadata?.full_name || user.user_metadata?.name || email.split('@')[0];
      const { data: created, error: insertErr } = await supabaseAdmin
        .from('clients')
        .insert({
          user_id: user.id,
          email,
          name: clientName,
          full_name: clientName,
          company: user.user_metadata?.company || `${clientName}'s Apparel`,
          role: 'customer',
          wallet_balance: 0,
          orders_count: 0
        })
        .select()
        .single();

      if (insertErr) {
        return NextResponse.json({ success: false, error: insertErr.message }, { status: 500 });
      }
      clientData = created;
    }

    const currentBalance = parseFloat(clientData.wallet_balance || 0);
    const newBalance =
      action === 'deposit' ? currentBalance + amount : Math.max(0, currentBalance - amount);

    const { error: updateErr } = await supabaseAdmin
      .from('clients')
      .update({ wallet_balance: newBalance, updated_at: new Date().toISOString() })
      .eq('id', clientData.id);

    if (updateErr) {
      return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
    }

    const { error: txErr } = await supabaseAdmin.from('transactions').insert({
      user_id: user.id,
      client_email: email,
      type: action === 'deposit' ? 'deposit' : 'order_payment',
      amount: action === 'deposit' ? amount : -amount,
      payment_method: body?.paymentMethod || (action === 'deposit' ? 'Card / Manual' : 'Studio Wallet Credit'),
      description:
        action === 'deposit'
          ? `Studio Wallet Deposit Top-up (+ $${amount.toFixed(2)})`
          : `Order Brief Payment (- $${amount.toFixed(2)})`
    });

    if (txErr) {
      return NextResponse.json({ success: false, error: txErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, balance: newBalance });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message || 'Wallet operation failed.' },
      { status: 500 }
    );
  }
}
