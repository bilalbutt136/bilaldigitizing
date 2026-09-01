import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '../../../../src/lib/supabase/admin';

export const dynamic = 'force-dynamic';

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

  // Handle checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const metadata = session.metadata || {};

    // Extract offer_id and thread_id
    const offerId = metadata.offer_id || metadata.offerId || null;
    const threadId = metadata.thread_id || metadata.threadId || metadata.conversation_id || metadata.conversationId || null;
    const clientEmail = (metadata.clientEmail || session.customer_details?.email || '').toLowerCase().trim();
    const clientName = session.customer_details?.name || metadata.client_name || 'Client';
    const amountInDollars = parseFloat(((session.amount_total || 0) / 100).toFixed(2));
    const nowIso = new Date().toISOString();

    try {
      // 1. Fetch existing offer details if available
      let matchedOffer = null;
      if (offerId) {
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
      }

      // 2. Generate new production order ID
      const rawOrderNum = Math.random().toString(36).substring(2, 7).toUpperCase();
      const generatedOrderId = `ORD-${Date.now().toString().slice(-4)}${rawOrderNum}`;

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

      try {
        await supabase.from('orders').insert([orderPayload]);
      } catch (ordErr) {
        console.warn('[Stripe Webhook] Order insert notice:', ordErr.message);
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
          id: `msg-stripe-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          conversation_id: effectiveThreadId,
          thread_id: effectiveThreadId,
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

      console.log(`[Stripe Webhook] Successfully processed session ${session.id} for offer ${offerId}`);
    } catch (processErr) {
      console.error('[Stripe Webhook] Processing error:', processErr);
      return NextResponse.json({ error: 'Webhook processing error', details: processErr.message }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true, status: 'success' }, { status: 200 });
}

