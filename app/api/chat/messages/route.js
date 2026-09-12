import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../../src/lib/supabase/admin';
import { getServerAuthUser } from '../../../../src/lib/supabase/serverAuth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { user, isAdmin } = await getServerAuthUser(request);
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId') || searchParams.get('conversation_id');
    const clientEmail = searchParams.get('clientEmail')?.toLowerCase().trim();

    if (!conversationId && !clientEmail) {
      return NextResponse.json({ error: 'Missing conversationId or clientEmail' }, { status: 400 });
    }

    const supabase = createAdminClient();

    let query = supabase.from('messages').select('*').order('created_at', { ascending: true });

    if (conversationId) {
      query = query.eq('conversation_id', conversationId);
    } else if (clientEmail) {
      query = query.ilike('client_email', clientEmail);
    }

    // Security check: non-admin clients can only access their own messages
    if (!isAdmin) {
      const authEmail = user?.email?.toLowerCase().trim();
      if (authEmail) {
        query = query.ilike('client_email', authEmail);
      }
    }

    const { data: messages, error } = await query;
    if (error) {
      console.warn('[Chat Messages GET Error]:', error.message);
      return NextResponse.json({ messages: [] });
    }

    // Fetch live custom offers for this conversation or client to ensure latest status is synced
    let syncedMessages = messages || [];
    if (conversationId || clientEmail) {
      try {
        let offerQuery = supabase.from('custom_offers').select('*');
        if (conversationId && clientEmail) {
          offerQuery = offerQuery.or(`conversation_id.eq.${conversationId},client_email.ilike.${clientEmail}`);
        } else if (conversationId) {
          offerQuery = offerQuery.eq('conversation_id', conversationId);
        } else if (clientEmail) {
          offerQuery = offerQuery.ilike('client_email', clientEmail);
        }

        const { data: offers } = await offerQuery;

        if (offers && offers.length > 0) {
          const offerMap = new Map();
          offers.forEach(off => {
            offerMap.set(off.id, off);
          });

          // 1. Sync offer_data on existing messages
          const seenOfferIds = new Set();
          syncedMessages = syncedMessages.map(msg => {
            if (msg.offer_id && offerMap.has(msg.offer_id)) {
              seenOfferIds.add(msg.offer_id);
              return {
                ...msg,
                type: 'custom_offer',
                offer_data: offerMap.get(msg.offer_id)
              };
            }
            return msg;
          });

          // 2. Synthesize missing offer messages for any custom_offer not yet in messages
          // This guarantees custom offers always show on both sender and receiver sides!
          const missingOffers = offers.filter(off => !seenOfferIds.has(off.id));
          for (const off of missingOffers) {
            const synthesizedMsg = {
              id: `msg-offer-${off.id}`,
              conversation_id: conversationId || off.conversation_id,
              client_email: off.client_email || clientEmail,
              sender: 'admin',
              sender_name: 'Bilal Digitizing Support',
              sender_email: off.created_by || 'support@bilaldigitizing.com',
              text: `Custom Offer: ${off.title}`,
              type: 'custom_offer',
              offer_id: off.id,
              offer_data: off,
              attachments: [],
              is_read: false,
              created_at: off.created_at || new Date().toISOString()
            };
            syncedMessages.push(synthesizedMsg);

            // Safely backfill into messages table asynchronously
            supabase.from('messages').insert([synthesizedMsg]).then(() => {}).catch(() => {});
          }

          // Sort messages by created_at ascending
          syncedMessages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        }
      } catch (offErr) {
        console.warn('[Chat Offers Sync Notice]:', offErr.message);
      }
    }

    return NextResponse.json({ messages: syncedMessages });
  } catch (err) {
    console.error('[Chat Messages API GET Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { user, isAdmin } = await getServerAuthUser(request);
    const body = await request.json();

    const {
      conversation_id,
      client_email,
      sender = 'admin',
      sender_name,
      sender_email,
      text = '',
      type = 'text',
      attachments = [],
      attachment_url = null,
      attachment_name = null,
      attachment_size = null,
      attachment_type = null,
      offer_id = null,
      offer_data = null
    } = body;

    if (!conversation_id) {
      return NextResponse.json({ error: 'Missing conversation_id' }, { status: 400 });
    }

    const cleanEmail = (client_email || user?.email || '').toLowerCase().trim();
    if (!cleanEmail) {
      return NextResponse.json({ error: 'Missing client_email' }, { status: 400 });
    }

    // Role enforcement
    const effectiveSender = isAdmin ? (sender || 'admin') : 'client';
    const effectiveSenderName = sender_name || (effectiveSender === 'admin' ? 'Bilal Digitizing Support' : (user?.name || cleanEmail.split('@')[0] || 'Client'));
    const effectiveSenderEmail = sender_email || user?.email || (effectiveSender === 'admin' ? 'support@bilaldigitizing.com' : cleanEmail);

    const supabase = createAdminClient();
    const nowIso = new Date().toISOString();

    // 1. Ensure conversation thread exists in conversations table
    try {
      const { data: convExists } = await supabase
        .from('conversations')
        .select('id, client_name')
        .eq('id', conversation_id)
        .maybeSingle();

      if (!convExists) {
        const isSupportThread = conversation_id.startsWith('support-') || conversation_id === 'general-support';
        await supabase.from('conversations').insert([{
          id: conversation_id,
          client_email: cleanEmail,
          client_name: effectiveSender === 'client' ? effectiveSenderName : cleanEmail.split('@')[0],
          order_title: isSupportThread ? '24/7 Customer Support Desk' : 'Direct Studio Communication & Offers',
          status: 'online',
          tags: isSupportThread ? ['support'] : ['inbox'],
          last_message: text || (attachments.length > 0 ? `Sent ${attachments.length} attachment(s)` : 'New message'),
          last_message_at: nowIso,
          unread_admin_count: effectiveSender === 'client' ? 1 : 0,
          unread_client_count: effectiveSender === 'admin' ? 1 : 0,
          is_starred: false,
          created_at: nowIso,
          updated_at: nowIso
        }]);
      }
    } catch (cErr) {
      console.warn('[Chat Auto-Create Conversation Notice]:', cErr.message);
    }

    // 2. Prepare message record
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const normalizedAttachments = Array.isArray(attachments) ? attachments : (attachment_url ? [{
      name: attachment_name || 'attachment',
      url: attachment_url,
      size: attachment_size || '',
      type: attachment_type || 'application/octet-stream'
    }] : []);

    const messageRow = {
      id: messageId,
      conversation_id,
      client_email: cleanEmail,
      sender: effectiveSender,
      sender_name: effectiveSenderName,
      sender_email: effectiveSenderEmail,
      text: (text || '').trim(),
      type: offer_id ? 'custom_offer' : (normalizedAttachments.length > 0 && !text ? 'attachment' : type),
      attachments: normalizedAttachments,
      attachment_url: attachment_url || (normalizedAttachments[0]?.url || null),
      attachment_name: attachment_name || (normalizedAttachments[0]?.name || null),
      attachment_size: attachment_size || (normalizedAttachments[0]?.size || null),
      attachment_type: attachment_type || (normalizedAttachments[0]?.type || null),
      offer_id: offer_id || null,
      offer_data: offer_data || null,
      is_read: false,
      created_at: nowIso
    };

    const { data: insertedMsg, error: msgErr } = await supabase
      .from('messages')
      .insert([messageRow])
      .select()
      .single();

    if (msgErr) {
      console.error('[Chat Messages Insert Error]:', msgErr);
      return NextResponse.json({ error: msgErr.message }, { status: 500 });
    }

    // 3. Update conversation last_message snippet and increment unread counter
    try {
      let snippet = (text || '').trim();
      if (!snippet && offer_id) snippet = `Custom Offer: ${offer_data?.title || 'Special Digitizing Offer'}`;
      if (!snippet && normalizedAttachments.length > 0) snippet = `📎 Attachment: ${normalizedAttachments[0].name}`;
      if (!snippet) snippet = 'New message';

      const updatePayload = {
        last_message: snippet.substring(0, 180),
        last_message_at: nowIso,
        updated_at: nowIso
      };

      if (effectiveSender === 'client') {
        // Increment unread count for admin
        const { data: cData } = await supabase.from('conversations').select('unread_admin_count').eq('id', conversation_id).maybeSingle();
        updatePayload.unread_admin_count = (cData?.unread_admin_count || 0) + 1;
      } else {
        // Increment unread count for client
        const { data: cData } = await supabase.from('conversations').select('unread_client_count').eq('id', conversation_id).maybeSingle();
        updatePayload.unread_client_count = (cData?.unread_client_count || 0) + 1;
      }

      await supabase.from('conversations').update(updatePayload).eq('id', conversation_id);
    } catch (updErr) {
      console.warn('[Chat Conversation Update Notice]:', updErr.message);
    }

    // NOTE: Rule #3 enforced: Chat messages do NOT trigger notification alerts.
    // Notifications are reserved strictly for order lifecycle events (placed, delivered, etc.).

    return NextResponse.json({ success: true, message: insertedMsg });
  } catch (err) {
    console.error('[Chat Messages POST Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
