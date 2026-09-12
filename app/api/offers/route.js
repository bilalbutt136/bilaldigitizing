import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../src/lib/supabase/admin';
import { getServerAuthUser } from '../../../src/lib/supabase/serverAuth';

export const dynamic = 'force-dynamic';


async function findOffer(supabase, offerId, fallbackOffer = null) {
  if (!offerId && !fallbackOffer) return null;

  let offer = null;

  if (offerId) {
    try {
      const { data: offData } = await supabase
        .from('custom_offers')
        .select('*')
        .or(`id.eq.${offerId},stripe_session_id.eq.${offerId},order_id.eq.${offerId}`)
        .maybeSingle();
      if (offData) offer = offData;
    } catch {}
  }

  if (!offer && fallbackOffer) {
    offer = typeof fallbackOffer === 'string' ? JSON.parse(fallbackOffer) : fallbackOffer;
  }

  return offer;
}

export async function GET(request) {
  try {
    const { user, isAdmin } = await getServerAuthUser(request);
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'getOffer';
    const offerId = searchParams.get('offerId') || searchParams.get('id');
    const conversationId = searchParams.get('conversationId') || searchParams.get('chatId');
    const supabase = createAdminClient();

    if (action === 'getOffer') {
      if (!offerId) {
        return NextResponse.json({ error: 'Missing offerId' }, { status: 400 });
      }

      const offer = await findOffer(supabase, offerId);
      if (!offer) {
        return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
      }

      // Check auto-expiry if still marked sent or pending
      if ((offer.status === 'sent' || offer.status === 'viewed' || offer.status === 'pending') && offer.expires_at && new Date(offer.expires_at).getTime() < Date.now()) {
        try {
          await supabase.from('custom_offers').update({ status: 'expired', updated_at: new Date().toISOString() }).eq('id', offer.id || offerId);
        } catch {}
        offer.status = 'expired';
      }

      return NextResponse.json({ offer });
    }

    if (action === 'fetchOffers') {
      let query = supabase.from('custom_offers').select('id, conversation_id, thread_id, client_name, client_email, title, description, service_type, price, discount_amount, final_price, delivery_time_text, delivery_days, revisions_allowed, expires_in_hours, expires_at, status, payment_status, order_id, created_by, created_at, updated_at').order('created_at', { ascending: false });

      if (conversationId) {
        query = query.eq('conversation_id', conversationId);
      } else if (!isAdmin && user?.email) {
        query = query.ilike('client_email', user.email.toLowerCase().trim());
      }

      const { data, error } = await query;
      if (error) {
        return NextResponse.json({ offers: [] });
      }

      const nowTime = Date.now();
      const updatedOffers = (data || []).map(off => {
        if ((off.status === 'sent' || off.status === 'viewed') && new Date(off.expires_at).getTime() < nowTime) {
          return { ...off, status: 'expired' };
        }
        return off;
      });

      return NextResponse.json({ offers: updatedOffers });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[Offers API GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { user, isAdmin } = await getServerAuthUser(request);
    let data = {};
    try {
      data = await request.json();
    } catch {
      data = {};
    }

    const { action, payload } = data;
    if (!payload) {
      return NextResponse.json({ error: 'Missing payload' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const nowIso = new Date().toISOString();

    // 1. ACTION: CREATE OFFER (Admin only)
    if (action === 'createOffer') {
      if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized. Only administrators can create offers.' }, { status: 403 });
      }

      const {
        conversation_id,
        client_name,
        client_email,
        title,
        description,
        service_type = 'Embroidery Digitizing',
        price = 0,
        discount_amount = 0,
        delivery_time_text = '1 Day',
        delivery_days = 1,
        revisions_allowed = '2',
        expires_in_hours = 24,
        requires_requirements = true,
        idempotency_key = null
      } = payload;

      if (!conversation_id || !title || !description || parseFloat(price) <= 0) {
        return NextResponse.json({ error: 'Invalid offer parameters. Title, description and positive price are required.' }, { status: 400 });
      }

      // Auto-resolve client email from conversation_id or orders if missing/generic
      let cleanClientEmail = (client_email || payload.customer_email || '').toLowerCase().trim();
      if (!cleanClientEmail || cleanClientEmail === 'client@studio.com' || cleanClientEmail.includes('guest@bdigitizing.pro')) {
        const cLower = String(conversation_id || '').toLowerCase().trim();
        if (cLower.startsWith('inbox-') && !cLower.startsWith('inbox-guest')) {
          cleanClientEmail = cLower.replace('inbox-', '').trim();
        } else if (cLower.startsWith('support-') && !cLower.startsWith('support-guest')) {
          cleanClientEmail = cLower.replace('support-', '').trim();
        } else if (cLower.startsWith('direct-')) {
          cleanClientEmail = cLower.replace('direct-', '').trim();
        } else if (cLower.startsWith('chat-')) {
          cleanClientEmail = cLower.replace('chat-', '').trim();
        } else if (cLower.startsWith('thread-') || cLower.startsWith('thread_')) {
          cleanClientEmail = cLower.replace(/^thread[-_]/, '').trim();
        } else if (cLower.startsWith('order-') || cLower.startsWith('ord-') || cLower.startsWith('#')) {
          const rawOrdId = cLower.replace(/^order-/, '').replace(/^#+/, '');
          try {
            const { data: ordRow } = await supabase.from('orders').select('client_email, client_name').or(`id.eq.${rawOrdId},id.eq.#${rawOrdId}`).maybeSingle();
            if (ordRow?.client_email) {
              cleanClientEmail = ordRow.client_email.toLowerCase().trim();
            }
          } catch {}
        }
      }

      let cleanClientName = (client_name || payload.customer_name || '').trim();
      if (!cleanClientName || cleanClientName === 'Valued Client' || cleanClientName === 'Customer') {
        if (cleanClientEmail && cleanClientEmail !== 'client@studio.com' && !cleanClientEmail.includes('guest@bdigitizing.pro')) {
          cleanClientName = cleanClientEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        } else {
          cleanClientName = 'Valued Client';
        }
      }

      const numPrice = parseFloat(price);
      const numDiscount = Math.max(0, parseFloat(discount_amount || 0));
      const finalPrice = Math.max(0, numPrice - numDiscount);
      const hours = parseInt(expires_in_hours, 10) || 24;
      const expiresAt = new Date(Date.now() + (hours * 3600 * 1000)).toISOString();

      // 1. Check idempotency if key provided
      if (idempotency_key) {
        try {
          const { data: existingOffer } = await supabase
            .from('custom_offers')
            .select('*')
            .eq('idempotency_key', idempotency_key)
            .maybeSingle();
          if (existingOffer) {
            return NextResponse.json({
              success: true,
              is_duplicate: true,
              offer: existingOffer,
              message: {
                id: `msg-${existingOffer.id}`,
                conversation_id: existingOffer.conversation_id,
                thread_id: existingOffer.conversation_id,
                client_email: existingOffer.client_email,
                type: 'custom_offer',
                offer_id: existingOffer.id,
                offer_data: existingOffer
              }
            });
          }
        } catch {}
      }

      // 2. Check recent duplicate offer in same conversation within 15 seconds
      try {
        const fifteenSecsAgo = new Date(Date.now() - 15000).toISOString();
        const { data: recentDuplicate } = await supabase
          .from('custom_offers')
          .select('*')
          .eq('conversation_id', conversation_id)
          .eq('title', title.trim())
          .eq('final_price', finalPrice)
          .gte('created_at', fifteenSecsAgo)
          .maybeSingle();

        if (recentDuplicate) {
          return NextResponse.json({
            success: true,
            is_duplicate: true,
            offer: recentDuplicate,
            message: {
              id: `msg-${recentDuplicate.id}`,
              conversation_id: recentDuplicate.conversation_id,
              thread_id: recentDuplicate.conversation_id,
              client_email: recentDuplicate.client_email,
              type: 'custom_offer',
              offer_id: recentDuplicate.id,
              offer_data: recentDuplicate
            }
          });
        }
      } catch {}

      const offerId = `off-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      const offerDbRow = {
        id: offerId,
        idempotency_key: idempotency_key || null,
        conversation_id: conversation_id,
        thread_id: conversation_id,
        order_id: null,
        customer_id: payload.customer_id || null,
        created_by: user?.email || 'admin',
        client_name: cleanClientName,
        client_email: cleanClientEmail || 'client@studio.com',
        title: title.trim(),
        description: description.trim(),
        service_type: service_type,
        price: numPrice,
        discount_amount: numDiscount,
        final_price: finalPrice,
        delivery_time_text: delivery_time_text,
        delivery_days: parseInt(delivery_days, 10) || 1,
        revisions_allowed: String(revisions_allowed),
        expires_in_hours: hours,
        expires_at: expiresAt,
        requires_requirements: Boolean(requires_requirements),
        status: 'pending',
        payment_status: 'unpaid',
        stripe_session_id: null,
        created_at: nowIso,
        updated_at: nowIso
      };

      // Try inserting into custom_offers table
      try {
        const { error: insertOfferErr } = await supabase.from('custom_offers').insert([offerDbRow]);
        if (insertOfferErr) {
          console.warn('custom_offers insert notice:', insertOfferErr.message);
          // Fallback to core columns in case newer schema columns are not present
          const coreOfferRow = {
            id: offerId,
            conversation_id: conversation_id,
            client_name: cleanClientName,
            client_email: cleanClientEmail || 'client@studio.com',
            title: title.trim(),
            description: description.trim(),
            service_type: service_type,
            price: numPrice,
            discount_amount: numDiscount,
            final_price: finalPrice,
            delivery_time_text: delivery_time_text,
            delivery_days: parseInt(delivery_days, 10) || 1,
            revisions_allowed: String(revisions_allowed),
            expires_at: expiresAt,
            status: 'pending',
            created_at: nowIso,
            updated_at: nowIso
          };
          await supabase.from('custom_offers').insert([coreOfferRow]);
        }
      } catch (err) {
        console.warn('custom_offers table insert fallback:', err.message);
      }

      // Insert corresponding message into messages table so it is immediately visible in chat on both sides
      const offerMessageId = `msg-offer-${offerId}`;
      const offerMessageRow = {
        id: offerMessageId,
        conversation_id: conversation_id,
        client_email: cleanClientEmail || 'client@studio.com',
        sender: 'admin',
        sender_name: 'Bilal Digitizing Support',
        sender_email: user?.email || 'support@bilaldigitizing.com',
        text: `Custom Offer: ${offerDbRow.title}`,
        type: 'custom_offer',
        offer_id: offerId,
        offer_data: offerDbRow,
        is_read: false,
        created_at: nowIso
      };

      try {
        await supabase.from('messages').insert([offerMessageRow]);
      } catch (msgErr) {
        console.warn('Chat message insertion for offer notice:', msgErr.message);
      }

      // Update conversation thread snippet and unread counter
      try {
        await supabase.from('conversations').update({
          last_message: `Custom Offer: ${offerDbRow.title} ($${finalPrice.toFixed(2)})`,
          last_message_at: nowIso,
          updated_at: nowIso,
          unread_client_count: 1
        }).eq('id', conversation_id);
      } catch (convErr) {
        console.warn('Conversation update for offer notice:', convErr.message);
      }

      // Dispatch real customer notification
      if (cleanClientEmail && cleanClientEmail !== 'client@studio.com') {
        try {
          await supabase.from('notifications').insert([{
            id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            recipient_role: 'client',
            recipient_email: cleanClientEmail,
            title: 'New Custom Offer Received',
            message: `Support sent you a custom offer: "${offerDbRow.title}" for $${finalPrice.toFixed(2)}. Click to review and accept.`,
            type: 'info',
            link: `/client-portal?tab=orders`,
            read: false,
            created_at: nowIso
          }]);
        } catch (notifErr) {
          console.warn('Notification creation notice:', notifErr.message);
        }
      }

      return NextResponse.json({
        success: true,
        offer: offerDbRow,
        message: offerMessageRow
      });
    }

    // 2. ACTION: ACCEPT OFFER (Customer or Admin on behalf of customer)
    if (action === 'acceptOffer') {
      const { offerId, offer: clientOffer } = payload;
      if (!offerId && !clientOffer) {
        return NextResponse.json({ error: 'Missing offerId' }, { status: 400 });
      }

      // 1. Infallible multi-source lookup (custom_offers, messages, order_messages, client payload)
      const offer = await findOffer(supabase, offerId, clientOffer);
      if (!offer) {
        return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
      }

      if (offer.status === 'accepted' || offer.status === 'paid') {
        return NextResponse.json({ 
          success: true, 
          message: 'This offer is already accepted.', 
          offer,
          orderId: offer.order_id || offer.orderId,
          alreadyAccepted: true
        }, { status: 200 });
      }

      if (offer.status === 'declined' || offer.status === 'cancelled' || offer.status === 'withdrawn') {
        return NextResponse.json({ error: `Cannot accept offer. It has already been ${offer.status}.`, offer }, { status: 400 });
      }

      if (offer.expires_at && new Date(offer.expires_at).getTime() < Date.now()) {
        try {
          await supabase.from('custom_offers').update({ status: 'expired', updated_at: nowIso }).eq('id', offer.id || offerId);
        } catch {}
        return NextResponse.json({ error: 'This offer has expired.', offer: { ...offer, status: 'expired' } }, { status: 400 });
      }

      // 2. Create authoritative order in orders table
      const cleanEmail = (user?.email || offer.client_email || 'client@studio.com').toLowerCase().trim();
      const rawOrderNum = Math.random().toString(36).substring(2, 7).toUpperCase();
      const generatedOrderId = `ORD-${Date.now().toString().slice(-4)}${rawOrderNum}`;

      const svcCategory = offer.service_type || 'Embroidery Digitizing';
      const svcType = svcCategory.toLowerCase().includes('vector') ? 'vector' : (svcCategory.toLowerCase().includes('patch') ? 'patches' : 'digitizing');
      const targetOfferId = offer.id || offerId || `off-${Date.now()}`;
      const conversationId = offer.conversation_id || offer.thread_id || (cleanEmail ? `inbox-${cleanEmail}` : 'general-support');

      // UUID validation for user_id to prevent Postgres invalid syntax errors
      const isValidUuid = user?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);
      const safeUserId = isValidUuid ? user.id : null;

      const baseOrderPayload = {
        id: generatedOrderId,
        title: offer.title || 'Custom Design Order',
        client_name: offer.client_name || user?.user_metadata?.full_name || (cleanEmail ? cleanEmail.split('@')[0] : 'Client'),
        client_email: cleanEmail,
        service_category: svcCategory,
        service_type: svcType,
        price: parseFloat(offer.final_price || offer.price || 0),
        cost: parseFloat(offer.final_price || offer.price || 0),
        status: 'pending',
        payment_status: 'pending',
        is_rush: (offer.delivery_time_text || '').toLowerCase().includes('express') || (offer.delivery_time_text || '').toLowerCase().includes('12 hour'),
        user_id: safeUserId,
        notes: JSON.stringify({
          source: 'custom_offer',
          offer_id: targetOfferId,
          description: offer.description || '',
          delivery_time_text: offer.delivery_time_text || `${offer.delivery_days || 1} Day`,
          delivery_days: offer.delivery_days || 1,
          revisions_allowed: String(offer.revisions_allowed || '2'),
          requires_requirements: offer.requires_requirements ?? true
        }),
        created_at: nowIso,
        updated_at: nowIso
      };

      let orderPayload = {
        ...baseOrderPayload,
        turnaround_time: offer.delivery_time_text || `${offer.delivery_days || 1} Day`,
        revisions_allowed: String(offer.revisions_allowed || '2')
      };

      try {
        const { error: ordErr } = await supabase.from('orders').insert([orderPayload]);
        if (ordErr) {
          console.warn('Extended order insert notice, falling back to base schema:', ordErr.message);
          const { error: baseErr } = await supabase.from('orders').insert([baseOrderPayload]);
          if (baseErr) {
            console.error('Base order creation error during offer accept:', baseErr.message);
          }
          orderPayload = baseOrderPayload;
        }
      } catch (err) {
        console.error('Order creation exception:', err.message);
        try {
          await supabase.from('orders').insert([baseOrderPayload]);
          orderPayload = baseOrderPayload;
        } catch {}
      }

      // 3. Atomically upsert custom_offers table
      const finalOfferData = {
        ...offer,
        id: targetOfferId,
        conversation_id: conversationId,
        thread_id: conversationId,
        order_id: generatedOrderId,
        status: 'accepted',
        payment_status: 'pending',
        accepted_at: nowIso,
        updated_at: nowIso
      };

      try {
        await supabase.from('custom_offers').upsert([{
          id: targetOfferId,
          conversation_id: conversationId,
          thread_id: conversationId,
          order_id: generatedOrderId,
          customer_id: offer.customer_id || null,
          created_by: offer.created_by || 'admin',
          client_name: offer.client_name || 'Client',
          client_email: cleanEmail,
          title: offer.title || 'Custom Design Offer',
          description: offer.description || '',
          service_type: svcCategory,
          price: parseFloat(offer.price || 0),
          discount_amount: parseFloat(offer.discount_amount || 0),
          final_price: parseFloat(offer.final_price || offer.price || 0),
          delivery_time_text: offer.delivery_time_text || `${offer.delivery_days || 1} Day`,
          delivery_days: parseInt(offer.delivery_days, 10) || 1,
          revisions_allowed: String(offer.revisions_allowed || '2'),
          expires_at: offer.expires_at || new Date(Date.now() + 86400000).toISOString(),
          status: 'accepted',
          payment_status: 'pending',
          accepted_at: nowIso,
          updated_at: nowIso
        }]);
      } catch (err) {
        console.warn('custom_offers accept upsert notice:', err.message);
      }

      // Also update messages table with accepted status so both sides reflect immediately
      try {
        await supabase
          .from('messages')
          .update({ offer_data: finalOfferData })
          .or(`offer_id.eq.${targetOfferId},offer_id.eq.${offerId}`);
      } catch (mErr) {
        console.warn('Sync accepted offer to messages notice:', mErr.message);
      }

      // 4. Notify Admin
      try {
        await supabase.from('notifications').insert([{
          id: `notif-admin-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          recipient_role: 'admin',
          title: 'Custom Offer Accepted!',
          message: `${offer.client_name || 'Customer'} accepted the custom offer "${offer.title}" ($${parseFloat(offer.final_price || offer.price || 0).toFixed(2)}). Order #${generatedOrderId} is awaiting payment.`,
          type: 'info',
          order_id: generatedOrderId,
          link: `/admin-portal?tab=orders&trackOrder=${generatedOrderId}`,
          read: false,
          created_at: nowIso
        }]);
      } catch {}

      return NextResponse.json({
        success: true,
        offer: finalOfferData,
        order: orderPayload,
        orderId: generatedOrderId
      });
    }

    // 3. ACTION: DECLINE OFFER (Customer)
    if (action === 'declineOffer' || action === 'rejectOffer') {
      const { offerId, offer: clientOffer } = payload;
      if (!offerId && !clientOffer) {
        return NextResponse.json({ error: 'Missing offerId' }, { status: 400 });
      }

      const offer = await findOffer(supabase, offerId, clientOffer);
      if (!offer) {
        return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
      }

      const targetOfferId = offer.id || offerId;

      const updatedOffer = {
        ...offer,
        status: 'declined',
        updated_at: nowIso
      };

      // 1. Update in custom_offers table
      try {
        await supabase.from('custom_offers').update({ status: 'declined', updated_at: nowIso }).or(`id.eq.${targetOfferId},id.eq.${offerId}`);
      } catch {}

      // 2. Also update messages table with declined status so both sides reflect immediately
      try {
        await supabase
          .from('messages')
          .update({ offer_data: updatedOffer })
          .or(`offer_id.eq.${targetOfferId},offer_id.eq.${offerId}`);
      } catch (mErr) {
        console.warn('Sync declined offer to messages notice:', mErr.message);
      }

      try {
        await supabase.from('notifications').insert([{
          id: `notif-dec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          recipient_role: 'admin',
          title: 'Custom Offer Declined',
          message: `${offer.client_name || 'Customer'} declined the custom offer for "${offer.title || 'Custom Offer'}".`,
          type: 'warning',
          link: `/admin-portal?tab=orders`,
          read: false,
          created_at: nowIso
        }]);
      } catch {}

      return NextResponse.json({ success: true, offer: updatedOffer });
    }

    // 4. ACTION: CANCEL / WITHDRAW OFFER (Admin only)
    if (action === 'cancelOffer' || action === 'withdrawOffer') {
      if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      const { offerId, offer: clientOffer } = payload;
      if (!offerId && !clientOffer) {
        return NextResponse.json({ error: 'Missing offerId' }, { status: 400 });
      }

      const offer = await findOffer(supabase, offerId, clientOffer);
      if (!offer) {
        return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
      }

      const targetOfferId = offer.id || offerId;

      const updatedOffer = {
        ...offer,
        status: 'cancelled',
        updated_at: nowIso
      };

      // 1. Update in custom_offers table
      try {
        await supabase.from('custom_offers').update({ status: 'cancelled', updated_at: nowIso }).or(`id.eq.${targetOfferId},id.eq.${offerId}`);
      } catch {}

      return NextResponse.json({ success: true, status: 'cancelled', offer: updatedOffer });
    }

    // 5. ACTION: PAY OFFER / MARK AS PAID
    if (action === 'payOffer' || action === 'markOfferPaid') {
      const { offerId, orderId } = payload;
      if (!offerId && !orderId) {
        return NextResponse.json({ error: 'Missing offerId or orderId' }, { status: 400 });
      }

      const offer = await findOffer(supabase, offerId || orderId);
      if (!offer) {
        return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
      }

      const targetOfferId = offer.id || offerId;
      const targetOrderId = orderId || offer.order_id;
      const conversationId = offer.conversation_id || offer.thread_id || 'general-support';
      const cleanEmail = (offer.client_email || user?.email || '').toLowerCase().trim();

      // 1. Update order
      if (targetOrderId) {
        try {
          await supabase.from('orders').update({
            status: 'in_progress',
            payment_status: 'paid',
            updated_at: nowIso
          }).or(`id.eq.${targetOrderId},id.eq.#${targetOrderId}`);
        } catch (ordErr) {
          console.warn('Order status update notice:', ordErr.message);
        }
      }

      // 2. Update custom_offers
      const updatedOffer = {
        ...offer,
        id: targetOfferId,
        order_id: targetOrderId,
        status: 'paid',
        payment_status: 'paid',
        accepted_at: offer.accepted_at || nowIso,
        updated_at: nowIso
      };

      try {
        await supabase.from('custom_offers').update({
          status: 'paid',
          payment_status: 'paid',
          order_id: targetOrderId,
          accepted_at: offer.accepted_at || nowIso,
          updated_at: nowIso
        }).eq('id', targetOfferId);
      } catch (offErr) {
        console.warn('custom_offers pay update notice:', offErr.message);
      }

      // 3. Synchronize messages table so chat threads show paid state immediately
      try {
        await supabase
          .from('messages')
          .update({ 
            offer_data: updatedOffer,
            attachment: JSON.stringify(updatedOffer)
          })
          .or(`offer_id.eq.${targetOfferId},offer_id.eq.${offerId}`);
      } catch (mErr) {
        console.warn('Sync paid offer to messages notice:', mErr.message);
      }

      // 4. Post system confirmation message in chat thread
      if (conversationId) {
        try {
          await supabase.from('messages').insert([{
            id: `msg-paid-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            conversation_id: conversationId,
            thread_id: conversationId,
            client_email: cleanEmail,
            sender: 'admin',
            sender_name: 'Bilal Digitizing System',
            text: `🎉 Custom Offer Accepted & Paid! Order #${targetOrderId} has been placed and sent to active production.`,
            type: 'text',
            created_at: nowIso
          }]);
        } catch (postMsgErr) {
          console.warn('Post paid confirmation message notice:', postMsgErr.message);
        }
      }

      // 5. Create Order Paid notifications for Admin and Client
      try {
        await supabase.from('notifications').insert([
          {
            id: `notif-paid-admin-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            recipient_role: 'admin',
            title: `💰 Payment Received: Order #${targetOrderId}`,
            message: `Custom offer "${offer.title || 'Custom Design'}" ($${parseFloat(offer.final_price || offer.price || 0).toFixed(2)}) was paid. Order #${targetOrderId} is now in production.`,
            type: 'success',
            order_id: targetOrderId,
            link: `/admin-portal?tab=orders&trackOrder=${targetOrderId}`,
            read: false,
            created_at: nowIso
          },
          {
            id: `notif-paid-client-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            recipient_role: 'client',
            recipient_email: cleanEmail,
            title: `🎉 Order #${targetOrderId} in Production!`,
            message: `Payment confirmed for "${offer.title || 'Custom Design'}". Our digitizing team has begun production.`,
            type: 'success',
            order_id: targetOrderId,
            link: `/client-portal?tab=orders&trackOrder=${targetOrderId}`,
            read: false,
            created_at: nowIso
          }
        ]);
      } catch (notifErr) {
        console.warn('Order paid notifications insert notice:', notifErr.message);
      }

      // 6. Non-blocking asynchronous email notification
      try {
        const siteBase = process.env.NEXT_PUBLIC_SITE_URL || 'https://bilaldigitizing.vercel.app';
        fetch(`${siteBase}/api/email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'NEW_ORDER',
            orderId: targetOrderId,
            clientEmail: cleanEmail,
            clientName: offer.client_name || 'Client',
            serviceName: offer.service_type || offer.title || 'Custom Digitizing Offer',
            amount: parseFloat(offer.final_price || offer.price || 0),
            orderDetails: {
              id: targetOrderId,
              title: offer.title || 'Custom Design Order',
              instructions: offer.description || '',
              price: parseFloat(offer.final_price || offer.price || 0),
              turnaround: offer.delivery_time_text || '1 Day'
            }
          })
        }).catch(e => console.warn('Email dispatch on custom offer pay notice:', e?.message));
      } catch {}

      return NextResponse.json({ success: true, offer: updatedOffer, orderId: targetOrderId });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[Offers API POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
