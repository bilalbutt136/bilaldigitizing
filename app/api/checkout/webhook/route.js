import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '../../../../src/lib/supabase/admin';

export async function POST(req) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe configuration missing' }, { status: 500 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });
  const signature = req.headers.get('stripe-signature');

  try {
    const rawBody = await req.text();
    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

    const supabase = createAdminClient();

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      const { orderId, type, clientEmail } = session.metadata || {};
      const targetEmail = (clientEmail || session.customer_details?.email || '').toLowerCase().trim();
      const amountInDollars = parseFloat(((session.amount_total || 0) / 100).toFixed(2));

      if (type === 'custom_offer') {
        const { offerId, conversationId } = session.metadata || {};
        const nowIso = new Date().toISOString();

        // 1. Fetch current offer from custom_offers table
        let offer = null;
        if (offerId) {
          try {
            const { data: offData } = await supabase.from('custom_offers').select('*').eq('id', offerId).maybeSingle();
            offer = offData;
          } catch {}
        }

        // 2. Generate authoritative order
        const rawOrderNum = Math.random().toString(36).substring(2, 7).toUpperCase();
        const generatedOrderId = `ORD-${Date.now().toString().slice(-4)}${rawOrderNum}`;

        const offerTitle = offer?.title || session.metadata?.title || 'Custom Design Order';
        const svcCategory = offer?.service_type || 'Embroidery Digitizing';
        const svcType = svcCategory.toLowerCase().includes('vector') ? 'vector' : (svcCategory.toLowerCase().includes('patch') ? 'patches' : 'digitizing');
        const clientName = offer?.client_name || session.customer_details?.name || 'Client';

        const orderPayload = {
          id: generatedOrderId,
          title: offerTitle,
          client_name: clientName,
          client_email: targetEmail,
          service_category: svcCategory,
          service_type: svcType,
          price: amountInDollars,
          cost: amountInDollars,
          status: 'in_progress',
          payment_status: 'paid',
          turnaround_time: offer?.delivery_time_text || `${offer?.delivery_days || 1} Day`,
          is_rush: (offer?.delivery_time_text || '').toLowerCase().includes('express') || (offer?.delivery_time_text || '').toLowerCase().includes('12 hour'),
          revisions_allowed: offer?.revisions_allowed || '2',
          notes: JSON.stringify({
            source: 'custom_offer_stripe',
            offer_id: offerId,
            stripe_session_id: session.id,
            description: offer?.description
          }),
          created_at: nowIso,
          updated_at: nowIso
        };

        try {
          await supabase.from('orders').insert([orderPayload]);
        } catch (ordErr) {
          console.error('[Stripe Webhook] Order creation error for custom offer:', ordErr.message);
        }

        // 3. Update custom_offers table
        if (offerId) {
          try {
            await supabase.from('custom_offers').update({
              status: 'paid',
              accepted_at: nowIso,
              order_id: generatedOrderId,
              stripe_session_id: session.id,
              updated_at: nowIso
            }).eq('id', offerId);
          } catch (coErr) {
            console.warn('[Stripe Webhook] custom_offers update notice:', coErr.message);
          }
        }

        // 4. Update offer_data in messages table
        const updatedOfferData = {
          ...(offer || {}),
          status: 'paid',
          accepted_at: nowIso,
          order_id: generatedOrderId,
          stripe_session_id: session.id
        };

        if (offerId) {
          try {
            await supabase.from('messages').update({
              offer_data: updatedOfferData,
              attachment: JSON.stringify(updatedOfferData),
              text: `📋 Custom Offer: ${offerTitle} ($${amountInDollars.toFixed(2)})\n\n[OFFER_DATA:${JSON.stringify(updatedOfferData)}]`
            }).or(`offer_id.eq.${offerId},id.eq.${offerId}`);
          } catch (mErr) {
            console.warn('[Stripe Webhook] messages offer_data update notice:', mErr.message);
          }
        }

        // 5. Post confirmation message in chat thread
        const targetChatId = conversationId || offer?.conversation_id || offer?.thread_id;
        if (targetChatId) {
          const confirmMsgId = `msg-stripe-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
          const confirmMessage = {
            id: confirmMsgId,
            conversation_id: targetChatId,
            sender: 'admin',
            sender_name: 'Studio System',
            text: `🎉 Custom Offer Paid ($${amountInDollars.toFixed(2)}) via Stripe! Order #${generatedOrderId} is now active and in production.`,
            timestamp: nowIso,
            created_at: nowIso,
            is_read: false
          };
          try {
            await supabase.from('messages').insert([confirmMessage]);
          } catch {}
        }

        // 6. Log transaction
        await supabase.from('transactions').insert([{
          client_email: targetEmail,
          type: 'order_payment',
          amount: amountInDollars,
          payment_method: 'Stripe Card',
          description: `Stripe Custom Offer Payment for "${offerTitle}" (Order #${generatedOrderId})`
        }]);

        // 7. Notify Admin
        try {
          await supabase.from('notifications').insert([{
            id: `notif-stripe-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            recipient_role: 'admin',
            title: 'Custom Offer Paid via Stripe!',
            message: `${clientName} paid $${amountInDollars.toFixed(2)} for offer "${offerTitle}". Order #${generatedOrderId} is in production.`,
            type: 'success',
            order_id: generatedOrderId,
            link: `/admin-portal?tab=chat&chatId=${targetChatId || ''}`,
            read: false,
            created_at: nowIso
          }]);
        } catch {}

        console.log(`[Stripe Webhook] Successfully processed custom offer payment for ${offerId} -> Order ${generatedOrderId}`);
      } else if (orderId && type !== 'deposit') {
        // Update Order Status to Paid
        const { error } = await supabase
          .from('orders')
          .update({ 
            payment_status: 'paid',
            status: 'in_progress',
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId);

        if (error) {
          console.error('[Stripe Webhook] Error updating order status:', error);
          throw error;
        }

        // Log transaction
        await supabase.from('transactions').insert([{
          client_email: targetEmail,
          type: 'order_payment',
          amount: amountInDollars,
          payment_method: 'Stripe Card',
          description: `Stripe Direct Order Payment for Order #${String(orderId).slice(0, 8)} ($${amountInDollars.toFixed(2)})`
        }]);
        
        console.log(`[Stripe Webhook] Successfully marked order ${orderId} as Paid.`);
      } else if (type === 'deposit' && targetEmail && amountInDollars > 0) {
        // 1. Locate client record
        const { data: clientRow } = await supabase
          .from('clients')
          .select('id, wallet_balance')
          .ilike('email', targetEmail)
          .maybeSingle();

        if (clientRow) {
          const newBal = parseFloat((parseFloat(clientRow.wallet_balance || 0) + amountInDollars).toFixed(2));
          await supabase
            .from('clients')
            .update({ wallet_balance: newBal, updated_at: new Date().toISOString() })
            .eq('id', clientRow.id);

          // 2. Log transaction
          await supabase.from('transactions').insert([{
            user_id: clientRow.id,
            client_email: targetEmail,
            type: 'deposit',
            amount: amountInDollars,
            payment_method: 'Stripe Card',
            description: `Studio Wallet Deposit Top-up via Stripe (+ $${amountInDollars.toFixed(2)})`
          }]);

          console.log(`[Stripe Webhook] Credited $${amountInDollars} to wallet for ${targetEmail}. New balance: $${newBal}`);
        } else {
          console.warn(`[Stripe Webhook] Client not found for deposit: ${targetEmail}`);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error(`[Stripe Webhook Error]`, err.message);
    return NextResponse.json({ error: 'Webhook Error: ' + err.message }, { status: 400 });
  }
}
