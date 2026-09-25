import { NextResponse } from 'next/server';
import { supabaseAdmin, hasServiceRole } from '../../../../src/lib/supabaseAdmin';
import { getServerAuthUser } from '../../../../src/lib/supabase/serverAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request) {
  try {
    const { user, isAdmin } = await getServerAuthUser(request);

    if (!hasServiceRole || !supabaseAdmin) {
      return NextResponse.json({ success: false, error: 'Server misconfiguration: Database service client unavailable' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const invoiceIdParam = searchParams.get('invoiceId');
    const orderIdParam = searchParams.get('orderId');
    const idParam = searchParams.get('id');

    const lookupKey = invoiceIdParam || orderIdParam || idParam;

    if (!lookupKey) {
      return NextResponse.json({ success: false, error: 'Missing invoiceId or orderId parameter' }, { status: 400 });
    }

    const cleanLookup = String(lookupKey).trim();
    const cleanNoHash = cleanLookup.replace(/^#+/, '');
    const cleanUserEmail = user?.email ? user.email.toLowerCase().trim() : null;

    // 1. Find matching invoices by UUID, bolt_order_id, or order_id
    let query = supabaseAdmin
      .from('invoices')
      .select('*');

    if (orderIdParam) {
      const rawO = String(orderIdParam).trim();
      const cleanO = rawO.replace(/^#+/, '');
      query = query.or(`order_id.eq.${rawO},order_id.eq.#${cleanO},order_id.eq.${cleanO},id.eq.${rawO},bolt_order_id.eq.${rawO}`);
    } else {
      query = query.or(`id.eq.${cleanLookup},bolt_order_id.eq.${cleanLookup},order_id.eq.${cleanLookup},order_id.eq.#${cleanNoHash}`);
    }

    // Filter by client email only if not admin and not public order check
    if (!isAdmin && cleanUserEmail && !orderIdParam) {
      query = query.ilike('client_email', cleanUserEmail);
    }

    const { data: invoices, error: invFetchErr } = await query.order('created_at', { ascending: false });

    if (invFetchErr || !invoices || invoices.length === 0) {
      // If invoice not found by ID, but orderId is provided, also check if order itself is already paid
      if (orderIdParam) {
        const rawO = String(orderIdParam).trim();
        const cleanO = rawO.replace(/^#+/, '');
        const { data: ord } = await supabaseAdmin
          .from('orders')
          .select('id, status, payment_status, price')
          .or(`id.eq.${rawO},id.eq.#${cleanO},id.eq.${cleanO}`)
          .maybeSingle();

        if (ord && (ord.payment_status === 'paid' || ord.status === 'in_progress' || ord.status === 'delivered' || ord.status === 'completed')) {
          return NextResponse.json({
            success: true,
            status: 'paid',
            orderId: ord.id,
            amount: ord.price
          });
        }
      }
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    // Check if any invoice is ALREADY marked paid in our database
    const alreadyPaidInvoice = invoices.find(i => i.status === 'paid' || i.status === 'completed');
    if (alreadyPaidInvoice) {
      // Ensure order status is in sync
      if (alreadyPaidInvoice.order_id) {
        await settleOrderPayment(alreadyPaidInvoice.order_id, alreadyPaidInvoice.client_email);
      }
      return NextResponse.json({
        success: true,
        status: 'paid',
        amount: alreadyPaidInvoice.amount,
        payment_method: alreadyPaidInvoice.payment_method || alreadyPaidInvoice.method,
        invoice: alreadyPaidInvoice
      });
    }

    // 2. Fetch BoltPayouts API Key
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

    // 3. For any pending invoices, query BoltPayouts check-status with ?id=
    for (const inv of invoices) {
      if ((inv.status === 'pending' || inv.status === 'unpaid') && inv.bolt_order_id && apiKey) {
        try {
          // CRITICAL FIX: BoltPayouts expects ?id=, not ?orderId=!
          let boltCheckData = null;
          try {
            const boltRes = await fetch(`https://www.boltpayouts.xyz/api/check-status?id=${inv.bolt_order_id}`, {
              headers: { 'x-api-key': apiKey },
              cache: 'no-store'
            });
            boltCheckData = await boltRes.json().catch(() => ({}));
          } catch (e1) {
            // Secondary fallback attempt
            const boltRes2 = await fetch(`https://www.boltpayouts.xyz/api/check-status?orderId=${inv.bolt_order_id}`, {
              headers: { 'x-api-key': apiKey },
              cache: 'no-store'
            });
            boltCheckData = await boltRes2.json().catch(() => ({}));
          }

          const isPaidOnBolt = boltCheckData && (
            boltCheckData.status === 'paid' || 
            boltCheckData.status === 'completed' || 
            boltCheckData.status === 'success' ||
            boltCheckData.paid === true
          );

          if (isPaidOnBolt) {
            // Mark invoice as paid
            const nowIso = new Date().toISOString();
            await supabaseAdmin
              .from('invoices')
              .update({
                status: 'paid',
                paid_at: nowIso,
                updated_at: nowIso
              })
              .eq('id', inv.id);

            const clientEmail = (inv.client_email || cleanUserEmail || '').toLowerCase().trim();
            const amount = parseFloat(inv.amount || 0);

            // Settle order if attached
            if (inv.order_id) {
              await settleOrderPayment(inv.order_id, clientEmail);
            } else {
              // Wallet deposit
              await settleWalletDeposit(clientEmail, amount, inv);
            }

            return NextResponse.json({
              success: true,
              status: 'paid',
              amount: inv.amount,
              payment_method: inv.payment_method || inv.method,
              method: inv.method || inv.payment_method,
              invoice: {
                ...inv,
                status: 'paid',
                paid_at: nowIso
              }
            });
          }
        } catch (checkErr) {
          console.warn('[Bolt Status] Live status check notice:', checkErr.message);
        }
      }
    }

    // Default response with latest invoice status
    const latestInvoice = invoices[0];
    return NextResponse.json({
      success: true,
      status: latestInvoice.status || 'pending',
      amount: latestInvoice.amount,
      payment_method: latestInvoice.payment_method || latestInvoice.method,
      method: latestInvoice.method || latestInvoice.payment_method,
      invoice: latestInvoice
    });

  } catch (err) {
    console.error('Bolt status exception:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

async function settleOrderPayment(orderId, clientEmail) {
  try {
    const rawOrdId = String(orderId).trim();
    const cleanOrdId = rawOrdId.replace(/^#+/, '');
    const withHash = `#${cleanOrdId}`;
    const candidateOrdIds = Array.from(new Set([rawOrdId, cleanOrdId, withHash])).filter(Boolean);

    // Fetch existing order to avoid overriding terminal statuses (delivered, completed)
    const { data: existingOrd } = await supabaseAdmin
      .from('orders')
      .select('id, status, payment_status, client_email, paid_at')
      .in('id', candidateOrdIds)
      .maybeSingle();

    const targetStatus = (existingOrd?.status === 'delivered' || existingOrd?.status === 'completed')
      ? existingOrd.status
      : 'in_progress';

    const nowIso = new Date().toISOString();
    await supabaseAdmin
      .from('orders')
      .update({
        status: targetStatus,
        payment_status: 'paid',
        paid_at: existingOrd?.paid_at || nowIso,
        updated_at: nowIso
      })
      .in('id', candidateOrdIds);

    // If client email exists, also update custom_offers if this was a custom offer
    const { data: offerRow } = await supabaseAdmin
      .from('custom_offers')
      .select('id, status')
      .or(`id.eq.${cleanOrdId},id.eq.${rawOrdId}`)
      .maybeSingle();

    if (offerRow) {
      await supabaseAdmin
        .from('custom_offers')
        .update({
          status: 'accepted',
          payment_status: 'paid',
          updated_at: nowIso
        })
        .eq('id', offerRow.id);
    }
  } catch (err) {
    console.error('[settleOrderPayment] error:', err);
  }
}

async function settleWalletDeposit(clientEmail, amount, invoice) {
  if (!clientEmail || !amount) return;
  try {
    const depositMethod = `BoltPayouts (${invoice.payment_method || invoice.method || 'online'})`;
    
    // 1. Try RPC
    const { error: rpcErr } = await supabaseAdmin.rpc('deposit_funds', {
      p_client_email: clientEmail,
      p_amount: amount,
      p_payment_method: depositMethod
    });

    if (rpcErr) {
      // 2. Direct ledger update fallback
      const { data: clientRow } = await supabaseAdmin
        .from('clients')
        .select('id, wallet_balance')
        .eq('email', clientEmail)
        .maybeSingle();

      if (clientRow) {
        const newBal = parseFloat((parseFloat(clientRow.wallet_balance || 0) + amount).toFixed(2));
        await supabaseAdmin
          .from('clients')
          .update({ wallet_balance: newBal, updated_at: new Date().toISOString() })
          .eq('id', clientRow.id);
      }
    }

    // 3. Log transaction
    await supabaseAdmin
      .from('transactions')
      .insert([{
        user_id: invoice.user_id || null,
        client_email: clientEmail,
        type: 'deposit',
        amount: amount,
        payment_method: depositMethod,
        description: `Studio Wallet Deposit Top-up (+ $${amount.toFixed(2)})`
      }])
      .catch(() => {});
  } catch (err) {
    console.error('[settleWalletDeposit] error:', err);
  }
}
