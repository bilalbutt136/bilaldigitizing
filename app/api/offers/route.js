import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../src/lib/supabase/admin';
import { getServerAuthUser } from '../../../src/lib/supabase/serverAuth';

export const dynamic = 'force-dynamic';

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

      const { data, error } = await supabase
        .from('custom_offers')
        .select('*')
        .eq('id', offerId)
        .maybeSingle();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      if (!data) {
        return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
      }

      // Check auto-expiry if still marked sent
      if ((data.status === 'sent' || data.status === 'viewed') && new Date(data.expires_at).getTime() < Date.now()) {
        await supabase.from('custom_offers').update({ status: 'expired', updated_at: new Date().toISOString() }).eq('id', offerId);
        data.status = 'expired';
      }

      return NextResponse.json({ offer: data });
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
        order_id: null,
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
        status: 'sent',
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

      // Create rich offer chat message
      const msgId = `msg-offer-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const messageDbRow = {
        id: msgId,
        conversation_id: conversation_id,
        sender: 'admin',
        sender_name: 'Studio Support',
        text: `📋 Custom Offer: ${offerDbRow.title} ($${finalPrice.toFixed(2)})`,
        offer_id: offerId,
        offer_data: offerDbRow,
        timestamp: nowIso,
        created_at: nowIso,
        is_read: false
      };

      const { error: msgErr } = await supabase.from('messages').insert([messageDbRow]);
      if (msgErr) {
        console.error('Failed to insert offer message:', msgErr.message);
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
            message: messageDbRow.text,
            offer_id: offerId,
            offer_data: offerDbRow,
            created_at: nowIso
          }]);
        } catch (omErr) {
          console.warn('order_messages offer mirror notice:', omErr.message);
        }
      }

      // Update conversation timestamp & client unread count
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
            link: `/client-portal?tab=chat&chatId=${conversation_id}`,
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
        message: messageDbRow
      });
    }

    // 2. ACTION: ACCEPT OFFER (Customer or Admin on behalf of customer)
    if (action === 'acceptOffer') {
      const { offerId } = payload;
      if (!offerId) {
        return NextResponse.json({ error: 'Missing offerId' }, { status: 400 });
      }

      // 1. Fetch current offer state
      let offer = null;
      try {
        const { data: offData } = await supabase.from('custom_offers').select('*').eq('id', offerId).maybeSingle();
        offer = offData;
      } catch {}

      // Fallback: check offer_data in messages table if table query failed
      if (!offer) {
        const { data: msgWithOffer } = await supabase.from('messages').select('offer_data').eq('offer_id', offerId).maybeSingle();
        offer = msgWithOffer?.offer_data;
      }

      if (!offer) {
        return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
      }

      if (offer.status === 'accepted') {
        return NextResponse.json({ error: 'This offer has already been accepted.', offer }, { status: 400 });
      }

      if (offer.status === 'declined' || offer.status === 'cancelled') {
        return NextResponse.json({ error: `Cannot accept offer. It has already been ${offer.status}.`, offer }, { status: 400 });
      }

      if (new Date(offer.expires_at).getTime() < Date.now()) {
        try {
          await supabase.from('custom_offers').update({ status: 'expired', updated_at: nowIso }).eq('id', offerId);
        } catch {}
        return NextResponse.json({ error: 'This offer has expired.', offer: { ...offer, status: 'expired' } }, { status: 400 });
      }

      // 2. Create authoritative order in orders table
      const cleanEmail = (user?.email || offer.client_email || 'client@studio.com').toLowerCase().trim();
      const rawOrderNum = Math.random().toString(36).substring(2, 7).toUpperCase();
      const generatedOrderId = `ORD-${Date.now().toString().slice(-4)}${rawOrderNum}`;

      const svcCategory = offer.service_type || 'Embroidery Digitizing';
      const svcType = svcCategory.toLowerCase().includes('vector') ? 'vector' : (svcCategory.toLowerCase().includes('patch') ? 'patches' : 'digitizing');

      const orderPayload = {
        id: generatedOrderId,
        title: offer.title,
        client_name: offer.client_name || user?.user_metadata?.full_name || 'Client',
        client_email: cleanEmail,
        service_category: svcCategory,
        service_type: svcType,
        price: parseFloat(offer.final_price || offer.price || 0),
        cost: parseFloat(offer.final_price || offer.price || 0),
        status: 'in_progress',
        payment_status: 'paid',
        turnaround_time: offer.delivery_time_text || '1 Day',
        is_rush: (offer.delivery_time_text || '').toLowerCase().includes('express') || (offer.delivery_time_text || '').toLowerCase().includes('12 hour'),
        revisions_allowed: offer.revisions_allowed || '2',
        notes: JSON.stringify({
          source: 'custom_offer',
          offer_id: offer.id,
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

      // 3. Update offer status to accepted
      const updatedOffer = {
        ...offer,
        status: 'accepted',
        order_id: generatedOrderId,
        updated_at: nowIso
      };

      try {
        await supabase.from('custom_offers').update({
          status: 'accepted',
          order_id: generatedOrderId,
          updated_at: nowIso
        }).eq('id', offerId);
      } catch {}

      // 4. Update messages containing this offer_id
      try {
        await supabase.from('messages').update({
          offer_data: updatedOffer
        }).eq('offer_id', offerId);
      } catch {}

      // 5. Post system confirmation message into the chat
      const confirmMsgId = `msg-sys-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const confirmMessage = {
        id: confirmMsgId,
        conversation_id: offer.conversation_id,
        sender: 'admin',
        sender_name: 'Studio System',
        text: `🎉 Custom Offer Accepted! Order #${generatedOrderId} has been created and assigned to our master digitizers. Delivery: ${offer.delivery_time_text}.`,
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
          message: `${offer.client_name} accepted the custom offer "${offer.title}" ($${parseFloat(offer.final_price || offer.price).toFixed(2)}). Order #${generatedOrderId} is now in progress.`,
          type: 'success',
          order_id: generatedOrderId,
          link: `/admin-portal?tab=chat&chatId=${offer.conversation_id}`,
          read: false,
          created_at: nowIso
        }]);
      } catch {}

      return NextResponse.json({
        success: true,
        offer: updatedOffer,
        order: orderPayload,
        message: confirmMessage
      });
    }

    // 3. ACTION: DECLINE OFFER (Customer)
    if (action === 'declineOffer') {
      const { offerId } = payload;
      if (!offerId) {
        return NextResponse.json({ error: 'Missing offerId' }, { status: 400 });
      }

      let offer = null;
      try {
        const { data: offData } = await supabase.from('custom_offers').select('*').eq('id', offerId).maybeSingle();
        offer = offData;
      } catch {}

      const updatedOffer = {
        ...(offer || {}),
        status: 'declined',
        updated_at: nowIso
      };

      try {
        await supabase.from('custom_offers').update({ status: 'declined', updated_at: nowIso }).eq('id', offerId);
      } catch {}

      try {
        await supabase.from('messages').update({ offer_data: updatedOffer }).eq('offer_id', offerId);
      } catch {}

      if (offer?.conversation_id) {
        const declineMsg = {
          id: `msg-dec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          conversation_id: offer.conversation_id,
          sender: 'client',
          sender_name: offer.client_name || user?.user_metadata?.full_name || 'Client',
          text: `Declined custom offer: "${offer.title}".`,
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
            message: `${offer.client_name || 'Customer'} declined the custom offer for "${offer.title}".`,
            type: 'warning',
            link: `/admin-portal?tab=chat&chatId=${offer.conversation_id}`,
            read: false,
            created_at: nowIso
          }]);
        } catch {}
      }

      return NextResponse.json({ success: true, offer: updatedOffer });
    }

    // 4. ACTION: CANCEL OFFER (Admin only)
    if (action === 'cancelOffer') {
      if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      const { offerId } = payload;
      if (!offerId) {
        return NextResponse.json({ error: 'Missing offerId' }, { status: 400 });
      }

      const updatedOffer = {
        status: 'cancelled',
        updated_at: nowIso
      };

      try {
        await supabase.from('custom_offers').update({ status: 'cancelled', updated_at: nowIso }).eq('id', offerId);
      } catch {}

      try {
        await supabase.from('messages').update({ 'offer_data->status': 'cancelled' }).eq('offer_id', offerId);
      } catch {}

      return NextResponse.json({ success: true, status: 'cancelled' });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[Offers API POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
