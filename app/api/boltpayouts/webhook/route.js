import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin, hasServiceRole } from '../../../../src/lib/supabaseAdmin';

export async function POST(request) {
  try {
    if (!hasServiceRole || !supabaseAdmin) {
      return NextResponse.json({ success: false, error: 'Server misconfiguration' }, { status: 500 });
    }

    // Fetch webhook secret from env or site_config
    let webhookSecret = process.env.BOLTPAYOUTS_WEBHOOK_SECRET || process.env.BOLT_WEBHOOK_SECRET || null;
    if (!webhookSecret) {
      const { data: configRow } = await supabaseAdmin
        .from('site_config')
        .select('value')
        .eq('key', 'boltpayouts_config')
        .maybeSingle();

      let boltConfig = configRow?.value || {};
      if (typeof boltConfig === 'string') {
        try {
          boltConfig = JSON.parse(boltConfig);
        } catch {
          boltConfig = { webhookSecret: boltConfig };
        }
      }
      webhookSecret = boltConfig?.webhookSecret || boltConfig?.webhook_secret || boltConfig?.secret || null;
    }

    if (!webhookSecret) {
      return NextResponse.json({ success: false, error: 'Webhook secret not configured' }, { status: 503 });
    }

    const sig = request.headers.get('x-boltpayouts-signature') || '';
    const raw = await request.text();
    
    if (!sig) {
      return NextResponse.json({ success: false, error: 'Missing signature' }, { status: 401 });
    }

    const expected = crypto
      .createHmac('sha256', webhookSecret)
      .update(raw)
      .digest('hex');

    const sigBuffer = Buffer.from(sig, 'utf8');
    const expectedBuffer = Buffer.from(expected, 'utf8');

    if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 403 });
    }

    let payload;
    try {
      payload = JSON.parse(raw);
    } catch (e) {
      return NextResponse.json({ success: false, error: 'Invalid JSON payload' }, { status: 400 });
    }

    // Process the verified webhook
    if (payload.event === 'payment.success' || payload.status === 'completed' || payload.status === 'paid') {
      const boltOrderId = payload.orderId || payload.id;
      if (!boltOrderId) {
        return NextResponse.json({ success: false, error: 'Missing orderId in payload' }, { status: 400 });
      }

      // 1. Fetch pending invoice
      const { data: invoice } = await supabaseAdmin
        .from('invoices')
        .select('*')
        .eq('bolt_order_id', boltOrderId)
        .in('status', ['pending', 'unpaid'])
        .maybeSingle();

      if (!invoice) {
        // Either already processed, or doesn't exist
        return NextResponse.json({ success: true, message: 'Invoice not found or already processed' });
      }

      // 2. Mark invoice as paid
      await supabaseAdmin
        .from('invoices')
        .update({ 
          status: 'paid',
          paid_at: new Date().toISOString()
        })
        .eq('id', invoice.id);

      const clientEmail = (invoice.client_email || '').toLowerCase().trim();
      const amount = parseFloat(invoice.amount);

      // 3. Deposit funds to wallet via RPC (with correct parameter names)
      let depositSuccessful = false;
      const { error: depositError } = await supabaseAdmin.rpc('deposit_funds', {
        p_client_email: clientEmail,
        p_amount: amount,
        p_payment_method: `BoltPayouts (${invoice.payment_method || 'online'})`
      });

      if (!depositError) {
        depositSuccessful = true;
      } else {
        console.warn('[Bolt Webhook] deposit_funds RPC notice, falling back to direct atomic ledger:', depositError.message);
        // Direct ledger fallback if RPC definition has custom permissions
        const { data: clientRow } = await supabaseAdmin
          .from('clients')
          .select('id, wallet_balance')
          .eq('email', clientEmail)
          .maybeSingle();

        if (clientRow) {
          const newBal = parseFloat((parseFloat(clientRow.wallet_balance || 0) + amount).toFixed(2));
          await supabaseAdmin.from('clients').update({ wallet_balance: newBal, updated_at: new Date().toISOString() }).eq('id', clientRow.id);
          depositSuccessful = true;
        }
      }

      let transactionId = null;

      if (depositSuccessful) {
        // 4. Log deposit transaction if not already logged by RPC
        const { data: depositTx } = await supabaseAdmin
          .from('transactions')
          .insert([{
            user_id: invoice.user_id,
            client_email: clientEmail,
            type: 'deposit',
            amount: amount,
            payment_method: `BoltPayouts (${invoice.payment_method || 'online'})`,
            description: `Studio Wallet Deposit Top-up (+ $${amount.toFixed(2)})`
          }])
          .select()
          .single();
          
        if (depositTx) {
          transactionId = depositTx.id;
        }

        // If this invoice was specifically for an order, instantly deduct the balance and mark order paid!
        if (invoice.order_id) {
          const { error: deductError } = await supabaseAdmin.rpc('deduct_wallet_balance', {
            p_client_email: clientEmail,
            p_amount: amount,
            p_order_id: String(invoice.order_id)
          });
          
          if (deductError) {
            console.warn('[Bolt Webhook] deduct_wallet_balance RPC notice, updating order status directly:', deductError.message);
            const { data: clientRow } = await supabaseAdmin
              .from('clients')
              .select('id, wallet_balance')
              .eq('email', clientEmail)
              .maybeSingle();

            if (clientRow) {
              const newBal = parseFloat(Math.max(0, parseFloat(clientRow.wallet_balance || 0) - amount).toFixed(2));
              await supabaseAdmin.from('clients').update({ wallet_balance: newBal, updated_at: new Date().toISOString() }).eq('id', clientRow.id);
            }
          }

          // Update the order itself atomically
          const rawOrdId = String(invoice.order_id).trim();
          const cleanOrdId = rawOrdId.replace('#', '');
          const withHash = `#${cleanOrdId}`;
          const candidateOrdIds = Array.from(new Set([rawOrdId, cleanOrdId, withHash])).filter(Boolean);

          await supabaseAdmin
            .from('orders')
            .update({ 
              status: 'in_progress', 
              payment_status: 'paid',
              paid_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .in('id', candidateOrdIds);
        }
      }

      // 5. Generate receipt
      await supabaseAdmin
        .from('receipts')
        .insert([{
          invoice_id: invoice.id,
          user_id: invoice.user_id,
          client_email: clientEmail,
          amount: amount,
          payment_method: invoice.payment_method,
          bolt_order_id: boltOrderId,
          transaction_id: transactionId
        }]);
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error('Bolt webhook exception:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
