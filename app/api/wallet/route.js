import { NextResponse } from 'next/server';
import { supabaseAdmin, hasServiceRole } from '../../../src/lib/supabaseAdmin';
import { getServerAuthUser } from '../../../src/lib/supabase/serverAuth';

// POST /api/wallet { action: 'deposit' | 'deduct', amount, orderId, paymentMethod }
// Server-side wallet ledger updates so wallet_balance can never be
// spoofed from the client. Operates strictly on the authenticated user's record.
export async function POST(request) {
  try {
    if (!hasServiceRole || !supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Wallet service is unavailable. Supabase service role is not configured.' },
        { status: 503 }
      );
    }

    const { user, isAdmin, error: authError } = await getServerAuthUser(request);
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
      // Regular customers must use BoltPayouts or Stripe webhooks.
      if (!isAdmin) {
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

    let newBalance = 0;

    if (action === 'deduct') {
      // Try Postgres RPC for atomic deduction and concurrency lock
      const { data: rpcBal, error: rpcErr } = await supabaseAdmin.rpc('deduct_wallet_balance', {
        p_client_email: email,
        p_amount: amount,
        p_order_id: String(orderId || '')
      });

      if (!rpcErr && rpcBal !== null) {
        newBalance = parseFloat(rpcBal);
      } else {
        // Fallback atomic balance check and update
        const currentBalance = parseFloat(clientData.wallet_balance || 0);
        if (currentBalance < amount) {
          return NextResponse.json({ 
            success: false, 
            error: `Insufficient wallet balance. You have $${currentBalance.toFixed(2)} but order total is $${amount.toFixed(2)}.` 
          }, { status: 400 });
        }

        newBalance = parseFloat(Math.max(0, currentBalance - amount).toFixed(2));
        const { error: updateErr } = await supabaseAdmin
          .from('clients')
          .update({
            wallet_balance: newBalance,
            updated_at: new Date().toISOString()
          })
          .eq('id', clientData.id);

        if (updateErr) {
          return NextResponse.json({ success: false, error: 'Failed to update wallet ledger: ' + updateErr.message }, { status: 500 });
        }

        // Record transaction in ledger
        const txDesc = orderId
          ? `Studio Wallet Payment for Order #${String(orderId).slice(0, 8)} (- $${amount.toFixed(2)})`
          : `Studio Wallet Order Payment (- $${amount.toFixed(2)})`;

        await supabaseAdmin.from('transactions').insert([{
          user_id: user.id,
          client_email: email,
          type: 'order_payment',
          amount: -amount,
          payment_method: body?.paymentMethod || 'Studio Wallet Credit',
          description: txDesc,
          created_at: new Date().toISOString()
        }]);
      }

      // Always ensure the order is marked as paid and in_progress in the live database
      if (orderId) {
        const rawId = String(orderId).trim();
        const cleanId = rawId.replace(/^#+/, '');
        const withHash = `#${cleanId}`;
        const candidateIds = Array.from(new Set([rawId, cleanId, withHash])).filter(Boolean);

        const updatePayload = {
          status: 'in_progress',
          payment_status: 'paid',
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // 1. Direct match by candidate IDs
        const { data: matchedRows } = await supabaseAdmin
          .from('orders')
          .select('id')
          .in('id', candidateIds);

        if (matchedRows && matchedRows.length > 0) {
          for (const row of matchedRows) {
            await supabaseAdmin
              .from('orders')
              .update(updatePayload)
              .eq('id', row.id);
          }
        } else {
          // 2. Search by partial ID or client email
          let query = supabaseAdmin
            .from('orders')
            .select('id')
            .ilike('client_email', email);

          if (cleanId.length >= 3) {
            query = query.ilike('id', `%${cleanId}%`);
          }

          const { data: fallbackRows } = await query;
          if (fallbackRows && fallbackRows.length > 0) {
            for (const row of fallbackRows) {
              await supabaseAdmin
                .from('orders')
                .update(updatePayload)
                .eq('id', row.id);
            }
          }
        }
      }
    } else if (action === 'deposit') {
      // Manual Admin deposit
      const currentBalance = parseFloat(clientData.wallet_balance || 0);
      newBalance = parseFloat((currentBalance + amount).toFixed(2));

      const { error: updateErr } = await supabaseAdmin
        .from('clients')
        .update({
          wallet_balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientData.id);

      if (updateErr) {
        return NextResponse.json({ success: false, error: 'Failed to deposit: ' + updateErr.message }, { status: 500 });
      }

      await supabaseAdmin.from('transactions').insert([{
        user_id: user.id,
        client_email: email,
        type: 'deposit',
        amount: amount,
        payment_method: body?.paymentMethod || 'Admin Credit / Manual',
        description: `Admin Studio Wallet Credit (+ $${amount.toFixed(2)})`,
        created_at: new Date().toISOString()
      }]);
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
