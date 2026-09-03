import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../src/lib/supabase/admin';
import { getServerAuthUser } from '../../../src/lib/supabase/serverAuth';

export const dynamic = 'force-dynamic';

async function findOffer(supabase, offerId, fallbackOffer = null) {
  if (!offerId && !fallbackOffer) return null;

  let offer = null;

  if (offerId) {
    // 1. Check custom_offers table by id, stripe_session_id, or order_id
    try {
      const { data: offData } = await supabase
        .from('custom_offers')
        .select('*')
        .or(`id.eq.${offerId},stripe_session_id.eq.${offerId},order_id.eq.${offerId}`)
        .maybeSingle();
      if (offData) offer = offData;
    } catch {}

    // 2. Check messages table by offer_id, id, or embedded [OFFER_DATA:...] JSON
    if (!offer) {
      try {
        const { data: msgRow } = await supabase
          .from('messages')
          .select('*')
          .or(`offer_id.eq.${offerId},id.eq.${offerId}`)
          .maybeSingle();
        if (msgRow?.offer_data) {
          offer = typeof msgRow.offer_data === 'string' ? JSON.parse(msgRow.offer_data) : msgRow.offer_data;
          if (!offer.conversation_id && msgRow.conversation_id) {
            offer.conversation_id = msgRow.conversation_id;
          }
        } else if (msgRow?.text && msgRow.text.includes('[OFFER_DATA:')) {
          const match = msgRow.text.match(/\[OFFER_DATA:(\{.*?\})\]/s);
          if (match && match[1]) {
            offer = JSON.parse(match[1]);
            if (!offer.conversation_id && msgRow.conversation_id) {
              offer.conversation_id = msgRow.conversation_id;
            }
          }
        }
      } catch {}
    }

    // 3. Check order_messages table
    if (!offer) {
      try {
        const { data: ordMsg } = await supabase
          .from('order_messages')
          .select('*')
          .or(`offer_id.eq.${offerId},id.eq.${offerId}`)
          .maybeSingle();
        if (ordMsg?.offer_data) {
          offer = typeof ordMsg.offer_data === 'string' ? JSON.parse(ordMsg.offer_data) : ordMsg.offer_data;
        }
      } catch {}
    }
  }

  // 4. Fallback from client payload object
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
      let query = supabase.from('custom_offers').select('*').order('created_at', { ascending: false });

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
        requires_requirements = true
      } = payload;

      if (!conversation_id || !title || !description || parseFloat(price) <= 0) {
        return NextResponse.json({ error: 'Invalid offer parameters. Title, description and positive price are required.' }, { status: 400 });
      }

      const cleanClientEmail = (client_email || '').toLowerCase().trim();
      const cleanClientName = client_name || 'Valued Client';
      const numPrice = parseFloat(price);
      const numDiscount = Math.max(0, parseFloat(discount_amount || 0));
      const finalPrice = Math.max(0, numPrice - numDiscount);
      const hours = parseInt(expires_in_hours, 10) || 24;
      const expiresAt = new Date(Date.now() + (hours * 3600 * 1000)).toISOString();

      const offerId = `off-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      const offerDbRow = {
        id: offerId,
        conversation_id: conversation_id,
        thread_id: conversation_id,
        order_id: null,
        customer_id: payload.customer_id || null,
        created_by: user?.email || 'admin',
        client_name: cleanClientName,
        client_email: cleanClientEmail,
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
        stripe_session_id: null,
        created_at: nowIso,
        updated_at: nowIso
      };

      // Try inserting into custom_offers table
      try {
        const { error: insertOfferErr } = await supabase.from('custom_offers').insert([offerDbRow]);
        if (insertOfferErr) {
          console.warn('custom_offers insert notice:', insertOfferErr.message);
        }
      } catch (err) {
        console.warn('custom_offers table insert fallback:', err.message);
      }

      // Create rich offer chat message with embedded offer data
      const msgId = `msg-offer-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const offerSerialized = JSON.stringify(offerDbRow);
      const textWithOffer = `📋 Custom Offer: ${offerDbRow.title} ($${finalPrice.toFixed(2)})\n\n[OFFER_DATA:${offerSerialized}]`;

      const standardMessageRow = {
        id: msgId,
        conversation_id: conversation_id,
        thread_id: conversation_id,
        sender: 'admin',
        sender_name: 'Studio Support',
        text: textWithOffer,
        attachment: offerSerialized,
        timestamp: nowIso,
        created_at: nowIso,
        is_read: false
      };

      // Try inserting with offer columns (type, metadata, offer_id, offer_data) first, fallback to standard text/attachment
      let insertedMessage = { 
        ...standardMessageRow, 
        thread_id: conversation_id,
        type: 'custom_offer',
        metadata: offerDbRow,
        offer_id: offerId, 
        offer_data: offerDbRow 
      };
      try {
        const { error: msgErr } = await supabase.from('messages').insert([insertedMessage]);
        if (msgErr) {
          console.warn('Full offer message insert fallback:', msgErr.message);
          const { error: stdErr } = await supabase.from('messages').insert([standardMessageRow]);
          if (stdErr) console.error('Standard offer message insert failed:', stdErr.message);
          insertedMessage = standardMessageRow;
        }
      } catch {
        await supabase.from('messages').insert([standardMessageRow]);
        insertedMessage = standardMessageRow;
      }

      // Mirror to order_messages if this is an order conversation
      if (conversation_id.startsWith('order-')) {
        const rawOrdId = conversation_id.replace('order-', '');
        try {
          await supabase.from('order_messages').insert([{
            order_id: rawOrdId,
            sender: 'admin',
            sender_role: 'admin',
            sender_name: 'Studio Support',
            message: textWithOffer,
            offer_id: offerId,
            offer_data: offerDbRow,
            created_at: nowIso
          }]);
        } catch (omErr) {
          try {
            await supabase.from('order_messages').insert([{
              order_id: rawOrdId,
              sender: 'admin',
              sender_role: 'admin',
              sender_name: 'Studio Support',
              message: textWithOffer,
              created_at: nowIso
            }]);
          } catch {}
        }
      }



      // Update primary conversation timestamp & client unread count
      try {
        const { data: cData } = await supabase.from('conversations').select('client_unread_count').eq('id', conversation_id).maybeSingle();
        const nextClientUnread = (cData?.client_unread_count || 0) + 1;
        await supabase.from('conversations').update({
          updated_at: nowIso,
          client_unread_count: nextClientUnread,
          admin_unread_count: 0
        }).eq('id', conversation_id);
      } catch {}

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
            link: `/client-portal?tab=inbox&chatId=${conversation_id}`,
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
        message: {
          ...insertedMessage,
          offer_data: offerDbRow,
          offer_id: offerId
        }
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
        return NextResponse.json({ success: true, message: 'This offer is already accepted.', offer }, { status: 200 });
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
      const conversationId = offer.conversation_id || offer.thread_id || 'general-support';

      const orderPayload = {
        id: generatedOrderId,
        title: offer.title || 'Custom Design Order',
        client_name: offer.client_name || user?.user_metadata?.full_name || 'Client',
        client_email: cleanEmail,
        service_category: svcCategory,
        service_type: svcType,
        price: parseFloat(offer.final_price || offer.price || 0),
        cost: parseFloat(offer.final_price || offer.price || 0),
        status: 'in_progress',
        payment_status: 'paid',
        turnaround_time: offer.delivery_time_text || `${offer.delivery_days || 1} Day`,
        is_rush: (offer.delivery_time_text || '').toLowerCase().includes('express') || (offer.delivery_time_text || '').toLowerCase().includes('12 hour'),
        revisions_allowed: String(offer.revisions_allowed || '2'),
        notes: JSON.stringify({
          source: 'custom_offer',
          offer_id: targetOfferId,
          description: offer.description,
          requires_requirements: offer.requires_requirements
        }),
        user_id: user?.id || null,
        created_at: nowIso,
        updated_at: nowIso
      };

      try {
        await supabase.from('orders').insert([orderPayload]);
      } catch (ordErr) {
        console.error('Order creation error during offer accept:', ordErr.message);
      }

      // 3. Atomically upsert custom_offers table
      const finalOfferData = {
        ...offer,
        id: targetOfferId,
        conversation_id: conversationId,
        thread_id: conversationId,
        order_id: generatedOrderId,
        status: 'accepted',
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
          accepted_at: nowIso,
          updated_at: nowIso
        }]);
      } catch (err) {
        console.warn('custom_offers accept upsert notice:', err.message);
      }

      // 4. Update messages containing this offer_id or serialized JSON
      try {
        await supabase.from('messages').update({
          offer_data: finalOfferData,
          attachment: JSON.stringify(finalOfferData),
          text: `📋 Custom Offer: ${finalOfferData.title} ($${parseFloat(finalOfferData.final_price || finalOfferData.price || 0).toFixed(2)})\n\n[OFFER_DATA:${JSON.stringify(finalOfferData)}]`
        }).or(`offer_id.eq.${targetOfferId},id.eq.${targetOfferId},offer_id.eq.${offerId},id.eq.${offerId}`);
      } catch (mErr) {
        console.warn('messages offer_data update notice:', mErr.message);
      }

      // Also update order_messages if this is an order thread
      try {
        await supabase.from('order_messages').update({
          offer_data: finalOfferData
        }).or(`offer_id.eq.${targetOfferId},offer_id.eq.${offerId}`);
      } catch {}

      // 5. Post system confirmation message into the chat
      const confirmMsgId = `msg-sys-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const confirmMessage = {
        id: confirmMsgId,
        conversation_id: conversationId,
        sender: 'admin',
        sender_name: 'Studio System',
        text: `🎉 Custom Offer Accepted! Order #${generatedOrderId} has been created and assigned to our master digitizers. Delivery: ${offer.delivery_time_text || '1 Day'}.`,
        timestamp: nowIso,
        created_at: nowIso,
        is_read: false
      };

      try {
        await supabase.from('messages').insert([confirmMessage]);
      } catch {}

      // 6. Notify Admin
      try {
        await supabase.from('notifications').insert([{
          id: `notif-admin-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          recipient_role: 'admin',
          title: 'Custom Offer Accepted!',
          message: `${offer.client_name || 'Customer'} accepted the custom offer "${offer.title}" ($${parseFloat(offer.final_price || offer.price || 0).toFixed(2)}). Order #${generatedOrderId} is now in progress.`,
          type: 'success',
          order_id: generatedOrderId,
          link: `/admin-portal?tab=chat&chatId=${conversationId}`,
          read: false,
          created_at: nowIso
        }]);
      } catch {}

      return NextResponse.json({
        success: true,
        offer: finalOfferData,
        order: orderPayload,
        message: confirmMessage
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
      const conversationId = offer.conversation_id || offer.thread_id;

      const updatedOffer = {
        ...offer,
        status: 'declined',
        updated_at: nowIso
      };

      // 1. Update in custom_offers table
      try {
        await supabase.from('custom_offers').update({ status: 'declined', updated_at: nowIso }).or(`id.eq.${targetOfferId},id.eq.${offerId}`);
      } catch {}

      // 2. Update in messages table
      try {
        await supabase.from('messages').update({ offer_data: updatedOffer }).or(`offer_id.eq.${targetOfferId},id.eq.${targetOfferId},offer_id.eq.${offerId},id.eq.${offerId}`);
      } catch {}

      // 3. Update in order_messages table if applicable
      try {
        await supabase.from('order_messages').update({ offer_data: updatedOffer }).or(`offer_id.eq.${targetOfferId},offer_id.eq.${offerId}`);
      } catch {}

      let declineMsg = null;
      if (conversationId) {
        declineMsg = {
          id: `msg-dec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          conversation_id: conversationId,
          sender: 'client',
          sender_name: offer.client_name || user?.user_metadata?.full_name || 'Client',
          text: `❌ Declined custom offer: "${offer.title || 'Custom Offer'}".`,
          timestamp: nowIso,
          created_at: nowIso,
          is_read: false
        };
        try {
          await supabase.from('messages').insert([declineMsg]);
        } catch {}

        try {
          await supabase.from('notifications').insert([{
            id: `notif-dec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            recipient_role: 'admin',
            title: 'Custom Offer Declined',
            message: `${offer.client_name || 'Customer'} declined the custom offer for "${offer.title || 'Custom Offer'}".`,
            type: 'warning',
            link: `/admin-portal?tab=chat&chatId=${conversationId}`,
            read: false,
            created_at: nowIso
          }]);
        } catch {}
      }

      return NextResponse.json({ success: true, offer: updatedOffer, message: declineMsg });
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
      const conversationId = offer.conversation_id || offer.thread_id;

      const updatedOffer = {
        ...offer,
        status: 'cancelled',
        updated_at: nowIso
      };

      // 1. Update in custom_offers table
      try {
        await supabase.from('custom_offers').update({ status: 'cancelled', updated_at: nowIso }).or(`id.eq.${targetOfferId},id.eq.${offerId}`);
      } catch {}

      // 2. Update offer_data in messages table
      try {
        await supabase.from('messages').update({ offer_data: updatedOffer }).or(`offer_id.eq.${targetOfferId},id.eq.${targetOfferId},offer_id.eq.${offerId},id.eq.${offerId}`);
      } catch {}

      // 3. Update in order_messages table if applicable
      try {
        await supabase.from('order_messages').update({ offer_data: updatedOffer }).or(`offer_id.eq.${targetOfferId},offer_id.eq.${offerId}`);
      } catch {}

      // 4. Post announcement in conversation that offer was withdrawn
      if (conversationId) {
        const cancelMsg = {
          id: `msg-can-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          conversation_id: conversationId,
          sender: 'admin',
          sender_name: 'Studio Support',
          text: `🚫 Offer "${offer.title || 'Custom Offer'}" was withdrawn by Studio Support.`,
          timestamp: nowIso,
          created_at: nowIso,
          is_read: false
        };
        try {
          await supabase.from('messages').insert([cancelMsg]);
        } catch {}
      }

      return NextResponse.json({ success: true, status: 'cancelled', offer: updatedOffer });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[Offers API POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
