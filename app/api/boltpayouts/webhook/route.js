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
              updated_at: new Date().toISOString()
            })
            .in('id', candidateOrdIds);
        }

        // Custom Offer fulfillment
        const potentialOfferId = invoice.order_id;
        let matchedOffer = null;
        if (potentialOfferId || boltOrderId) {
          try {
            const { data: offRow } = await supabaseAdmin
              .from('custom_offers')
              .select('*')
              .or(`id.eq.${potentialOfferId},stripe_session_id.eq.${boltOrderId},payment_intent_id.eq.${boltOrderId}`)
              .maybeSingle();
            if (offRow) matchedOffer = offRow;
          } catch {}

          if (!matchedOffer && potentialOfferId) {
            try {
              const { data: msgRow } = await supabaseAdmin
                .from('messages')
                .select('*')
                .or(`offer_id.eq.${potentialOfferId},id.eq.${potentialOfferId}`)
                .maybeSingle();
              if (msgRow?.offer_data) {
                matchedOffer = typeof msgRow.offer_data === 'string' ? JSON.parse(msgRow.offer_data) : msgRow.offer_data;
              }
            } catch {}
          }
        }

        if (matchedOffer) {
          const rawOrderNum = Math.random().toString(36).substring(2, 7).toUpperCase();
          const generatedOrderId = `ORD-${Date.now().toString().slice(-4)}${rawOrderNum}`;
          const nowIso = new Date().toISOString();

          const offerTitle = matchedOffer.title || 'Custom Design Order';
          const svcCategory = matchedOffer.service_type || 'Embroidery Digitizing';
          const svcType = svcCategory.toLowerCase().includes('vector') ? 'vector' : (svcCategory.toLowerCase().includes('patch') ? 'patches' : 'digitizing');
          const clientName = matchedOffer.client_name || 'Client';

          const orderPayload = {
            id: generatedOrderId,
            title: offerTitle,
            client_name: clientName,
            client_email: clientEmail,
            service_category: svcCategory,
            service_type: svcType,
            price: amount,
            cost: amount,
            status: 'in_progress',
            payment_status: 'paid',
            turnaround_time: matchedOffer.delivery_time_text || `${matchedOffer.delivery_days || 1} Day`,
            is_rush: (matchedOffer.delivery_time_text || '').toLowerCase().includes('express') || (matchedOffer.delivery_time_text || '').toLowerCase().includes('12 hour'),
            revisions_allowed: String(matchedOffer.revisions_allowed || '2'),
            notes: JSON.stringify({
              source: 'custom_offer_boltpayouts',
              offer_id: matchedOffer.id || potentialOfferId,
              bolt_order_id: boltOrderId,
              description: matchedOffer.description
            }),
            created_at: nowIso,
            updated_at: nowIso
          };

          try {
            await supabaseAdmin.from('orders').insert([orderPayload]);
          } catch (ordErr) {
            console.error('[Bolt Webhook] Custom offer order insert notice:', ordErr.message);
          }

          // Upsert custom_offers table
          const targetOfferId = matchedOffer.id || potentialOfferId || `off-${Date.now()}`;
          const targetChatId = matchedOffer.conversation_id || matchedOffer.thread_id;
          try {
            await supabaseAdmin.from('custom_offers').upsert([{
              id: targetOfferId,
              conversation_id: targetChatId || 'general-support',
              thread_id: targetChatId || 'general-support',
              order_id: generatedOrderId,
              created_by: matchedOffer.created_by || 'admin',
              client_name: clientName,
              client_email: clientEmail,
              title: offerTitle,
              description: matchedOffer.description || '',
              service_type: svcCategory,
              price: amount,
              final_price: amount,
              delivery_time_text: matchedOffer.delivery_time_text || `${matchedOffer.delivery_days || 1} Day`,
              delivery_days: parseInt(matchedOffer.delivery_days, 10) || 1,
              revisions_allowed: String(matchedOffer.revisions_allowed || '2'),
              status: 'paid',
              payment_status: 'paid',
              stripe_session_id: boltOrderId,
              payment_intent_id: boltOrderId,
              accepted_at: nowIso,
              updated_at: nowIso
            }]);
          } catch (coErr) {
            console.warn('[Bolt Webhook] custom_offers upsert notice:', coErr.message);
          }

          // Update messages table
          const updatedOfferData = {
            ...matchedOffer,
            status: 'paid',
            payment_status: 'paid',
            accepted_at: nowIso,
            order_id: generatedOrderId,
            bolt_order_id: boltOrderId
          };

          try {
            await supabaseAdmin.from('messages').update({
              offer_data: updatedOfferData,
              attachment: JSON.stringify(updatedOfferData),
              text: `📋 Custom Offer: ${offerTitle} ($${amount.toFixed(2)})\n\n[OFFER_DATA:${JSON.stringify(updatedOfferData)}]`
            }).or(`offer_id.eq.${targetOfferId},id.eq.${targetOfferId},offer_id.eq.${potentialOfferId},id.eq.${potentialOfferId}`);
          } catch {}

          // Post confirmation message in chat thread
          if (targetChatId) {
            const confirmMsg = {
              id: `msg-bolt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              conversation_id: targetChatId,
              thread_id: targetChatId,
              client_email: clientEmail,
              sender: 'admin',
              sender_name: 'Studio System',
              text: `🎉 Custom Offer Paid ($${amount.toFixed(2)}) via BoltPayouts! Order #${generatedOrderId} is now active and in production.`,
              timestamp: nowIso,
              created_at: nowIso,
              is_read: false
            };
            try {
              await supabaseAdmin.from('messages').insert([confirmMsg]);
            } catch {}
          }
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
