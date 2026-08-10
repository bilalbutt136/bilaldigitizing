import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin, hasServiceRole } from '../../../../src/lib/supabaseAdmin';

export async function POST(request) {
  try {
    if (!hasServiceRole || !supabaseAdmin) {
      return NextResponse.json({ success: false, error: 'Server misconfiguration' }, { status: 500 });
    }

    // Fetch webhook secret from site_config
    const { data: configRow } = await supabaseAdmin
      .from('site_config')
      .select('value')
      .eq('key', 'boltpayouts_config')
      .maybeSingle();

    const boltConfig = configRow?.value || {};
    const webhookSecret = boltConfig.webhookSecret;

    if (!webhookSecret) {
      return NextResponse.json({ success: false, error: 'Webhook secret not configured' }, { status: 503 });
    }

    const sig = request.headers.get('x-boltpayouts-signature');
    const raw = await request.text();
    
    if (!sig) {
      return NextResponse.json({ success: false, error: 'Missing signature' }, { status: 401 });
    }

    const expected = crypto
      .createHmac('sha256', webhookSecret)
      .update(raw)
      .digest('hex');

    if (sig !== expected) {
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 403 });
    }

    let payload;
    try {
      payload = JSON.parse(raw);
    } catch (e) {
      return NextResponse.json({ success: false, error: 'Invalid JSON payload' }, { status: 400 });
    }

    // Process the verified webhook
    // Assuming payload has { event: 'payment.success', orderId: '...' }
    // based on typical webhook designs since docs didn't specify exactly.
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

      // 3. Deposit funds to wallet via RPC
      const { error: depositError } = await supabaseAdmin.rpc('deposit_funds', {
        p_user_id: invoice.user_id,
        p_amount: invoice.amount
      });

      let transactionId = null;

      if (!depositError) {
        // 4. Log deposit transaction
        const { data: depositTx } = await supabaseAdmin
          .from('transactions')
          .insert([{
            user_id: invoice.user_id,
            client_email: invoice.client_email,
            type: 'deposit',
            amount: invoice.amount,
            payment_method: `BoltPayouts (${invoice.payment_method || 'unknown'})`,
            description: `Wallet Deposit (+ $${parseFloat(invoice.amount).toFixed(2)})`
          }])
          .select()
          .single();
          
        if (depositTx) {
          transactionId = depositTx.id;
        }

        // If this invoice was specifically for an order, instantly deduct the balance and mark paid!
        if (invoice.order_id) {
            const { error: deductError } = await supabaseAdmin.rpc('deduct_wallet_balance', {
              p_user_id: invoice.user_id,
              p_amount: invoice.amount
            });
            
            if (!deductError) {
              // Log deduction transaction
              await supabaseAdmin
                .from('transactions')
                .insert([{
                  user_id: invoice.user_id,
                  client_email: invoice.client_email,
                  type: 'order_payment',
                  amount: -parseFloat(invoice.amount),
                  payment_method: `Studio Wallet Credit`,
                  description: `Order Brief Payment (- $${parseFloat(invoice.amount).toFixed(2)})`
                }]);
                
              // Update the order itself atomically
              await supabaseAdmin
                .from('orders')
                .update({ 
                  status: 'in_progress', 
                  payment_status: 'paid',
                  updated_at: new Date().toISOString()
                })
                .eq('id', invoice.order_id);
            }
        }
      }

      // 5. Generate receipt
      await supabaseAdmin
        .from('receipts')
        .insert([{
          invoice_id: invoice.id,
          user_id: invoice.user_id,
          client_email: invoice.client_email,
          amount: invoice.amount,
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
