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

// POST /api/wallet { action: 'deposit' | 'deduct', amount, orderId, paymentMethod }
// Server-side wallet ledger updates so wallet_balance can never be
// spoofed from the client. Operates on the authenticated user's record.
export async function POST(request) {
  try {
    if (!hasServiceRole || !supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Wallet service is unavailable. Supabase service role is not configured.' },
        { status: 503 }
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
    const orderId = body?.orderId;
    const email = (user.email || '').toLowerCase().trim();

    if (!action || !['deposit', 'deduct'].includes(action)) {
      return NextResponse.json({ success: false, error: 'Invalid wallet action.' }, { status: 400 });
    }

    if (action === 'deposit') {
      // Secure deposits: only admins can manually deposit through this route.
      // Regular customers must use BoltPayouts webhooks.
      const { data: adminData } = await supabaseAdmin
        .from('admins')
        .select('email')
        .eq('email', email)
        .maybeSingle();

      if (!adminData) {
        return NextResponse.json({ success: false, error: 'Direct deposits are disabled. Please use the checkout portal.' }, { status: 403 });
      }
    }

    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ success: false, error: 'Amount must be a positive number.' }, { status: 400 });
    }

    // 1. Locate or create client record by ID or Email
    let clientData = null;
    const { data: byId } = await supabaseAdmin
      .from('clients')
      .select('id, email, wallet_balance, name')
      .eq('id', user.id)
      .maybeSingle();

    if (byId) {
      clientData = byId;
    } else {
      const { data: byEmail } = await supabaseAdmin
        .from('clients')
        .select('id, email, wallet_balance, name')
        .ilike('email', email)
        .maybeSingle();

      if (byEmail) {
        clientData = byEmail;
      }
    }

    if (!clientData) {
      // Auto-create client record for this authenticated user
      const clientName = user.user_metadata?.full_name || user.user_metadata?.name || email.split('@')[0];
      const { data: created, error: insertErr } = await supabaseAdmin
        .from('clients')
        .insert({
          id: user.id,
          email,
          name: clientName,
          full_name: clientName,
          company: user.user_metadata?.company || `${clientName}'s Studio`,
          wallet_balance: 0,
          orders_count: 0
        })
        .select()
        .single();

      if (insertErr) {
        return NextResponse.json({ success: false, error: 'Failed to initialize wallet client: ' + insertErr.message }, { status: 500 });
      }
      clientData = created;
    }

    const currentBalance = parseFloat(clientData.wallet_balance || 0);

    if (action === 'deduct' && currentBalance < amount) {
      return NextResponse.json({ 
        success: false, 
        error: `Insufficient wallet balance. You have $${currentBalance.toFixed(2)} but order total is $${amount.toFixed(2)}.` 
      }, { status: 400 });
    }

    const newBalance = action === 'deposit' 
      ? parseFloat((currentBalance + amount).toFixed(2))
      : parseFloat(Math.max(0, currentBalance - amount).toFixed(2));

    // 2. Perform balance update on clients table
    const { error: updateErr } = await supabaseAdmin
      .from('clients')
      .update({
        wallet_balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientData.id);

    if (updateErr) {
      // Try fallback by email if id mismatch
      const { error: updateByEmailErr } = await supabaseAdmin
        .from('clients')
        .update({
          wallet_balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .ilike('email', email);

      if (updateByEmailErr) {
        return NextResponse.json({ success: false, error: 'Failed to update wallet ledger: ' + updateByEmailErr.message }, { status: 500 });
      }
    }

    // 3. Record transaction in ledger
    const txDesc = action === 'deposit'
      ? `Studio Wallet Deposit Top-up (+ $${amount.toFixed(2)})`
      : orderId
        ? `Studio Wallet Payment for Order #${String(orderId).slice(0, 8)} (- $${amount.toFixed(2)})`
        : `Studio Wallet Order Payment (- $${amount.toFixed(2)})`;

    try {
      await supabaseAdmin.from('transactions').insert({
        user_id: user.id,
        client_email: email,
        type: action === 'deposit' ? 'deposit' : 'order_payment',
        amount: action === 'deposit' ? amount : -amount,
        payment_method: body?.paymentMethod || (action === 'deposit' ? 'Card / Manual' : 'Studio Wallet Credit'),
        description: txDesc,
        created_at: new Date().toISOString()
      });
    } catch (txErr) {
      console.warn('Transaction ledger insert notice:', txErr);
    }

    // 4. Update order status if orderId is provided
    if (action === 'deduct' && orderId) {
      try {
        await supabaseAdmin
          .from('orders')
          .update({ 
            status: 'in_progress', 
            payment_status: 'paid',
            paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId);
      } catch (orderErr) {
        console.error('Order status update notice:', orderErr);
      }
    }

    return NextResponse.json({ 
      success: true, 
      balance: newBalance,
      message: `Successfully ${action === 'deposit' ? 'deposited' : 'paid'} $${amount.toFixed(2)} via Studio Wallet.`
    });
  } catch (err) {
    console.error('Wallet POST Exception:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Wallet operation failed.' },
      { status: 500 }
    );
  }
}
