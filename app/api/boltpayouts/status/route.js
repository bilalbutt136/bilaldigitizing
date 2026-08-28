import { NextResponse } from 'next/server';
import { supabaseAdmin, hasServiceRole } from '../../../../src/lib/supabaseAdmin';
import { getServerAuthUser } from '../../../../src/lib/supabase/serverAuth';

export async function GET(request) {
  try {
    const { user, isAdmin } = await getServerAuthUser(request);

    if (!hasServiceRole || !supabaseAdmin) {
      return NextResponse.json({ success: false, error: 'Server misconfiguration' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get('invoiceId');

    if (!invoiceId) {
      return NextResponse.json({ success: false, error: 'Missing invoiceId' }, { status: 400 });
    }

    const cleanInvoiceId = String(invoiceId).trim();
    const cleanUserEmail = user?.email ? user.email.toLowerCase().trim() : null;

    let query = supabaseAdmin
      .from('invoices')
      .select('*')
      .or(`id.eq.${cleanInvoiceId},bolt_order_id.eq.${cleanInvoiceId}`);

    if (!isAdmin && cleanUserEmail) {
      query = query.ilike('client_email', cleanUserEmail);
    }

    const { data: invoice } = await query.maybeSingle();

    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    let currentStatus = invoice.status;

    // If still pending, actively check BoltPayouts live status API for instant settlement
    if ((currentStatus === 'pending' || currentStatus === 'unpaid') && invoice.bolt_order_id) {
      try {
        let apiKey = process.env.BOLTPAYOUTS_API_KEY || process.env.BOLT_API_KEY || null;
        if (!apiKey) {
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
              boltConfig = { apiKey: boltConfig };
            }
          }
          apiKey = boltConfig?.apiKey || boltConfig?.api_key || boltConfig?.key || (typeof boltConfig === 'string' ? boltConfig : null);
        }
        if (apiKey) {
          const boltCheckRes = await fetch(`https://www.boltpayouts.xyz/api/check-status?orderId=${invoice.bolt_order_id}`, {
            headers: { 'x-api-key': apiKey }
          });
          const boltCheckData = await boltCheckRes.json().catch(() => ({}));
          
          if (boltCheckData && (boltCheckData.status === 'paid' || boltCheckData.status === 'completed' || boltCheckData.paid === true)) {
            currentStatus = 'paid';
            
            // Mark invoice paid
            await supabaseAdmin
              .from('invoices')
              .update({ 
                status: 'paid', 
                paid_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', invoice.id);

            const amount = parseFloat(invoice.amount || 0);

            // Deposit to wallet
            await supabaseAdmin.rpc('deposit_funds', {
              p_client_email: cleanUserEmail,
              p_amount: amount,
              p_payment_method: `BoltPayouts (${invoice.payment_method || invoice.method || 'online'})`
            }).catch(() => null);

            // If attached to an order, deduct and update order status
            if (invoice.order_id) {
              const rawOrdId = String(invoice.order_id).trim();
              const cleanOrdId = rawOrdId.replace('#', '');
              const withHash = `#${cleanOrdId}`;

              await supabaseAdmin.rpc('deduct_wallet_balance', {
                p_client_email: cleanUserEmail,
                p_amount: amount,
                p_order_id: rawOrdId
              }).catch(() => null);

              const candidateOrdIds = Array.from(new Set([rawOrdId, cleanOrdId, withHash])).filter(Boolean);
              await supabaseAdmin
                .from('orders')
                .update({ 
                  status: 'in_progress', 
                  payment_status: 'paid',
                  updated_at: new Date().toISOString()
                })
                .in('id', candidateOrdIds);
            }
          }
        }
      } catch (checkErr) {
        console.warn('[Bolt Status] Active status check notice:', checkErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      status: currentStatus,
      amount: invoice.amount,
      payment_method: invoice.payment_method || invoice.method,
      method: invoice.method || invoice.payment_method,
      invoice: {
        ...invoice,
        status: currentStatus
      }
    });

  } catch (err) {
    console.error('Bolt status exception:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
