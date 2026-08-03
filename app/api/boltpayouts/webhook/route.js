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
        .eq('status', 'pending')
        .maybeSingle();

      if (!invoice) {
        // Either already processed, or doesn't exist
        return NextResponse.json({ success: true, message: 'Invoice not found or already processed' });
      }

      // 2. Mark invoice as paid
      await supabaseAdmin
        .from('invoices')
        .update({ status: 'paid' })
        .eq('id', invoice.id);

      // 3. Fetch client wallet
      const { data: client } = await supabaseAdmin
        .from('clients')
        .select('id, wallet_balance')
        .eq('email', invoice.client_email)
        .maybeSingle();

      let transactionId = null;

      if (client) {
        const newBalance = parseFloat(client.wallet_balance || 0) + parseFloat(invoice.amount);
        
        await supabaseAdmin
          .from('clients')
          .update({ wallet_balance: newBalance })
          .eq('id', client.id);

        // 4. Log transaction
        const { data: tx } = await supabaseAdmin
          .from('transactions')
          .insert([{
            user_id: invoice.user_id,
            client_email: invoice.client_email,
            type: 'deposit',
            amount: invoice.amount,
            payment_method: `BoltPayouts (${invoice.method})`,
            description: `Wallet Deposit (+ $${parseFloat(invoice.amount).toFixed(2)})`
          }])
          .select()
          .single();
          
        if (tx) {
          transactionId = tx.id;
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
          method: invoice.method,
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
