import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '../../../../src/lib/supabase/admin';

export const dynamic = 'force-dynamic';

function toCents(value) {
  const normalized = String(value ?? '').replace(/[^0-9.-]/g, '');
  const amount = Number.parseFloat(normalized);
  return Number.isFinite(amount) ? Math.round(amount * 100) : NaN;
}

async function claimWebhookEvent(supabase, event) {
  const nowIso = new Date().toISOString();
  const { error } = await supabase.from('payment_webhook_events').insert([{
    event_id: event.id,
    provider: 'stripe',
    event_type: event.type,
    status: 'processing',
    attempts: 1,
    updated_at: nowIso
  }]);

  if (!error) return true;
  if (error.code !== '23505') throw error;

  const { data: existing } = await supabase
    .from('payment_webhook_events')
    .select('status, attempts, updated_at')
    .eq('event_id', event.id)
    .maybeSingle();

  const updatedAt = existing?.updated_at ? new Date(existing.updated_at).getTime() : 0;
  const staleProcessing = existing?.status === 'processing' && Date.now() - updatedAt > 10 * 60 * 1000;
  if (existing?.status === 'failed' || staleProcessing) {
    const { error: retryError } = await supabase
      .from('payment_webhook_events')
      .update({
        status: 'processing',
        attempts: Number(existing?.attempts || 1) + 1,
        last_error: null,
        updated_at: nowIso
      })
      .eq('event_id', event.id);
    if (retryError) throw retryError;
    return true;
  }

  return false;
}

async function markWebhookEvent(supabase, eventId, status, lastError = null) {
  await supabase
    .from('payment_webhook_events')
    .update({
      status,
      last_error: lastError ? String(lastError).slice(0, 2000) : null,
      updated_at: new Date().toISOString()
    })
    .eq('event_id', eventId);
}

async function verifyCheckoutAmount(supabase, session) {
  const metadata = session.metadata || {};
  const paidCents = Number(session.amount_total || 0);
  if (!Number.isSafeInteger(paidCents) || paidCents <= 0) {
    throw new Error('Stripe session has an invalid paid amount.');
  }

  const expectedMetadataCents = Number(metadata.expectedAmountCents);
  if (Number.isSafeInteger(expectedMetadataCents) && expectedMetadataCents > 0) {
    if (paidCents !== expectedMetadataCents) {
      throw new Error('Stripe paid amount does not match the server-authorized amount.');
    }
    return;
  }

  const offerId = metadata.offer_id || metadata.offerId || null;
  const orderId = metadata.orderId || metadata.order_id || null;
  const clientEmail = String(metadata.clientEmail || session.customer_details?.email || '').toLowerCase().trim();

  if (offerId) {
    const { data: offer, error } = await supabase
      .from('custom_offers')
      .select('client_email, price, final_price')
      .eq('id', offerId)
      .maybeSingle();
    if (error || !offer) throw new Error('Unable to verify the custom offer amount.');
    if (clientEmail && offer.client_email && String(offer.client_email).toLowerCase().trim() !== clientEmail) {
      throw new Error('Stripe customer does not match the custom offer owner.');
    }
    if (paidCents !== toCents(offer.final_price ?? offer.price)) {
      throw new Error('Stripe paid amount does not match the custom offer price.');
    }
    return;
  }

  if (orderId && metadata.type !== 'deposit') {
    const raw = String(orderId).trim();
    const clean = raw.replace(/^#+/, '');
    const candidates = Array.from(new Set([raw, clean, clean ? `#${clean}` : ''])).filter(Boolean);
    const { data: order, error } = await supabase
      .from('orders')
      .select('client_email, price, cost')
      .in('id', candidates)
      .maybeSingle();
    if (error || !order) throw new Error('Unable to verify the order amount.');
    if (clientEmail && order.client_email && String(order.client_email).toLowerCase().trim() !== clientEmail) {
      throw new Error('Stripe customer does not match the order owner.');
    }
    if (paidCents !== toCents(order.price ?? order.cost)) {
      throw new Error('Stripe paid amount does not match the order price.');
    }
    return;
  }

  if (metadata.type !== 'deposit') {
    throw new Error('Stripe checkout session is missing an authoritative payment reference.');
  }
}

export async function POST(req) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey || !webhookSecret) {
    console.error('[Stripe Webhook] Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET in environment variables');
    return NextResponse.json({ error: 'Stripe configuration missing' }, { status: 500 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event;

  try {
    // Read raw body for Next.js App Router webhook verification
    const rawBody = await req.text();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error(`[Stripe Webhook] Signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook signature verification failed: ${err.message}` }, { status: 400 });
  }

  let supabase;
  try {
    supabase = createAdminClient();
  } catch (dbErr) {
    console.error('[Stripe Webhook] Database admin client initialization error:', dbErr.message);
    return NextResponse.json({ error: 'Database client initialization error' }, { status: 500 });
  }

  let claimed;
  try {
    claimed = await claimWebhookEvent(supabase, event);
  } catch (claimError) {
    console.error('[Stripe Webhook] Idempotency claim failed:', claimError.message);
    return NextResponse.json({ error: 'Webhook idempotency check failed' }, { status: 500 });
  }

  if (!claimed) {
    return NextResponse.json({ received: true, status: 'duplicate_ignored' }, { status: 200 });
  }

  // Handle checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const metadata = session.metadata || {};

    try {
      await verifyCheckoutAmount(supabase, session);
    } catch (verificationError) {
      await markWebhookEvent(supabase, event.id, 'failed', verificationError.message);
      console.error('[Stripe Webhook] Payment verification failed:', verificationError.message);
      return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
    }

    // Extract offer_id, order_id, type and thread_id
    const offerId = metadata.offer_id || metadata.offerId || null;
    const orderId = metadata.orderId || metadata.order_id || null;
    const type = metadata.type || null;
    const threadId = metadata.thread_id || metadata.threadId || metadata.conversation_id || metadata.conversationId || null;
    const clientEmail = (metadata.clientEmail || session.customer_details?.email || '').toLowerCase().trim();
    const clientName = session.customer_details?.name || metadata.client_name || 'Client';
    const amountInDollars = parseFloat(((session.amount_total || 0) / 100).toFixed(2));
    const nowIso = new Date().toISOString();

    try {
      if (offerId) {
        // 1. Fetch existing offer details if available
        let matchedOffer = null;
        try {
          const { data: offData } = await supabase
            .from('custom_offers')
            .select('*')
            .or(`id.eq.${offerId},stripe_session_id.eq.${session.id}`)
            .maybeSingle();
          if (offData) matchedOffer = offData;
        } catch {}

        if (!matchedOffer) {
          try {
            const { data: msgData } = await supabase
              .from('messages')
              .select('*')
              .or(`offer_id.eq.${offerId},id.eq.${offerId}`)
              .maybeSingle();
            if (msgData?.offer_data) {
              matchedOffer = typeof msgData.offer_data === 'string' ? JSON.parse(msgData.offer_data) : msgData.offer_data;
            }
          } catch {}
        }

        // 2. Reuse an already-created order or derive a stable ID from the Stripe session.
        // A deterministic ID prevents duplicate production orders after partial webhook retries.
        const stableSessionSuffix = String(session.id || event.id)
          .replace(/[^a-zA-Z0-9]/g, '')
          .slice(-14)
          .toUpperCase();
        const generatedOrderId = matchedOffer?.order_id || `ORD-ST-${stableSessionSuffix}`;
        const shouldCreateOrder = !matchedOffer?.order_id;

      const offerTitle = matchedOffer?.title || metadata.title || 'Custom Design Order';
      const svcCategory = matchedOffer?.service_type || 'Embroidery Digitizing';
      const svcType = svcCategory.toLowerCase().includes('vector') ? 'vector' : (svcCategory.toLowerCase().includes('patch') ? 'patches' : 'digitizing');

      const orderPayload = {
        id: generatedOrderId,
        title: offerTitle,
        client_name: clientName,
        client_email: clientEmail,
        service_category: svcCategory,
        service_type: svcType,
        price: amountInDollars,
        cost: amountInDollars,
        status: 'in_progress',
        payment_status: 'paid',
        turnaround_time: matchedOffer?.delivery_time_text || `${matchedOffer?.delivery_days || 1} Day`,
        is_rush: (matchedOffer?.delivery_time_text || '').toLowerCase().includes('express') || (matchedOffer?.delivery_time_text || '').toLowerCase().includes('12 hour'),
        revisions_allowed: String(matchedOffer?.revisions_allowed || '2'),
        notes: JSON.stringify({
          source: 'custom_offer_stripe',
          offer_id: offerId,
          stripe_session_id: session.id,
          description: matchedOffer?.description
        }),
        created_at: nowIso,
        updated_at: nowIso
      };

      if (shouldCreateOrder) {
        const { error: orderInsertError } = await supabase.from('orders').insert([orderPayload]);
        if (orderInsertError && orderInsertError.code !== '23505') {
          throw new Error(`Unable to create paid custom-offer order: ${orderInsertError.message}`);
        }
      }

      // 3. Update custom_offers table: status = 'paid', stripe_session_id = session.id, updated_at = now()
      const effectiveOfferId = offerId || matchedOffer?.id || `off-${Date.now()}`;
      const effectiveThreadId = threadId || matchedOffer?.conversation_id || matchedOffer?.thread_id || 'general-support';

      try {
        await supabase.from('custom_offers').upsert([{
          id: effectiveOfferId,
          thread_id: effectiveThreadId,
          conversation_id: effectiveThreadId,
          order_id: generatedOrderId,
          created_by: matchedOffer?.created_by || 'admin',
          client_name: clientName,
          client_email: clientEmail,
          title: offerTitle,
          description: matchedOffer?.description || '',
          service_type: svcCategory,
          price: amountInDollars,
          final_price: amountInDollars,
          delivery_time_text: matchedOffer?.delivery_time_text || `${matchedOffer?.delivery_days || 1} Day`,
          delivery_days: parseInt(matchedOffer?.delivery_days, 10) || 1,
          revisions_allowed: String(matchedOffer?.revisions_allowed || '2'),
          status: 'paid',
          payment_status: 'paid',
          stripe_session_id: session.id,
          payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : null,
          accepted_at: nowIso,
          updated_at: nowIso
        }]);
      } catch (offErr) {
        console.warn('[Stripe Webhook] custom_offers upsert notice:', offErr.message);
      }

      // 4. Update offer card in messages table
      if (offerId || matchedOffer?.id) {
        const targetOfferId = offerId || matchedOffer?.id;
        const updatedOfferData = {
          ...(matchedOffer || {}),
          id: targetOfferId,
          status: 'paid',
          payment_status: 'paid',
          stripe_session_id: session.id,
          order_id: generatedOrderId,
          accepted_at: nowIso,
          updated_at: nowIso
        };

        try {
          await supabase.from('messages').update({
            offer_data: updatedOfferData,
            attachment: JSON.stringify(updatedOfferData),
            text: `📋 Custom Offer: ${offerTitle} ($${amountInDollars.toFixed(2)})\n\n[OFFER_DATA:${JSON.stringify(updatedOfferData)}]`
          }).or(`offer_id.eq.${targetOfferId},id.eq.${targetOfferId}`);
        } catch (msgUpdateErr) {
          console.warn('[Stripe Webhook] messages offer update notice:', msgUpdateErr.message);
        }
      }

      // 5. Insert automated confirmation message into chat thread: sender = 'admin', type = 'system'
      if (effectiveThreadId) {
        const confirmMessage = {
          id: `msg-stripe-${session.id}`,
          conversation_id: effectiveThreadId,
          thread_id: effectiveThreadId,
          client_email: clientEmail,
          sender: 'admin',
          sender_name: 'Studio Support',
          type: 'system',
          text: '🎉 Payment confirmed! Your order is now active and in production.',
          timestamp: nowIso,
          created_at: nowIso,
          is_read: false
        };

        try {
          const { error: msgErr } = await supabase.from('messages').insert([confirmMessage]);
          if (msgErr) {
            // Fallback without type column if schema not yet migrated
            const { type: _type, ...standardMsg } = confirmMessage;
            await supabase.from('messages').insert([standardMsg]);
          }
        } catch (msgErr) {
          console.warn('[Stripe Webhook] Chat message insertion notice:', msgErr.message);
        }
      }

      // 6. Trigger guaranteed email notification to admin & client
      try {
        const { sendNotificationEmail } = await import('../../../../src/lib/emailService');
        await sendNotificationEmail({
          type: 'NEW_ORDER',
          orderId: generatedOrderId,
          clientEmail: clientEmail,
          clientName: clientName,
          serviceName: svcCategory,
          amount: amountInDollars,
          orderDetails: {
            id: generatedOrderId,
            title: offerTitle,
            instructions: matchedOffer?.description || '',
            price: amountInDollars,
            turnaround: matchedOffer?.delivery_time_text || '1 Day'
          }
        });
      } catch (emailErr) {
        console.warn('[Stripe Webhook] Email notification notice:', emailErr?.message);
      }

        console.log(`[Stripe Webhook] Successfully processed session ${session.id} for offer ${offerId}`);
      } else if (orderId && type !== 'deposit') {
        // Direct standard order payment
        const rawOrdId = String(orderId).trim();
        const cleanOrdId = rawOrdId.replace(/^#+/, '');
        const withHash = `#${cleanOrdId}`;
        const candidateOrdIds = Array.from(new Set([rawOrdId, cleanOrdId, withHash])).filter(Boolean);

        // Fetch existing order to never regress terminal statuses (delivered, completed)
        const { data: currentOrd } = await supabase
          .from('orders')
          .select('id, status, payment_status, paid_at')
          .in('id', candidateOrdIds)
          .maybeSingle();

        const targetStatus = (currentOrd?.status === 'delivered' || currentOrd?.status === 'completed')
          ? currentOrd.status
          : 'in_progress';

        const { error: ordUpdateErr } = await supabase
          .from('orders')
          .update({
            payment_status: 'paid',
            status: targetStatus,
            paid_at: currentOrd?.paid_at || nowIso,
            updated_at: nowIso
          })
          .in('id', candidateOrdIds);

        if (ordUpdateErr) {
          console.error('[Stripe Webhook] Error updating order status:', ordUpdateErr.message);
          throw ordUpdateErr;
        }

        // Log transaction
        await supabase.from('transactions').insert([{
          client_email: clientEmail,
          type: 'order_payment',
          amount: amountInDollars,
          payment_method: 'Stripe Card',
          provider_reference: `stripe:${session.id}:order`,
          description: `Stripe Direct Order Payment for Order #${String(orderId).slice(0, 8)} ($${amountInDollars.toFixed(2)})`
        }]);

        console.log(`[Stripe Webhook] Successfully marked order ${orderId} as Paid.`);
      } else if (type === 'deposit' && clientEmail && amountInDollars > 0) {
        // Studio Wallet deposit top-up
        const { data: clientRow } = await supabase
          .from('clients')
          .select('id, wallet_balance')
          .ilike('email', clientEmail)
          .maybeSingle();

        if (clientRow) {
          const providerReference = `stripe:${session.id}:deposit`;
          const { data: existingDeposit } = await supabase
            .from('transactions')
            .select('id')
            .eq('provider_reference', providerReference)
            .maybeSingle();

          if (!existingDeposit) {
            const newBal = parseFloat((parseFloat(clientRow.wallet_balance || 0) + amountInDollars).toFixed(2));
            await supabase
              .from('clients')
              .update({ wallet_balance: newBal, updated_at: nowIso })
              .eq('id', clientRow.id);

            const { error: depositLogError } = await supabase.from('transactions').insert([{
              user_id: clientRow.id,
              client_email: clientEmail,
              type: 'deposit',
              amount: amountInDollars,
              payment_method: 'Stripe Card',
              provider_reference: providerReference,
              description: `Studio Wallet Deposit Top-up via Stripe (+ $${amountInDollars.toFixed(2)})`
            }]);

            if (depositLogError) throw depositLogError;
            console.log(`[Stripe Webhook] Credited $${amountInDollars} to wallet for ${clientEmail}. New balance: $${newBal}`);
          }
        } else {
          console.warn(`[Stripe Webhook] Client not found for deposit: ${clientEmail}`);
        }
      }
    } catch (processErr) {
      await markWebhookEvent(supabase, event.id, 'failed', processErr.message);
      console.error('[Stripe Webhook] Processing error:', processErr);
      return NextResponse.json({ error: 'Webhook processing error' }, { status: 500 });
    }
  }

  await markWebhookEvent(supabase, event.id, 'processed');
  return NextResponse.json({ received: true, status: 'success' }, { status: 200 });
}

