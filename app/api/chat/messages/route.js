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

    // Fetch live custom offers for this conversation to ensure latest status is synced
    let syncedMessages = messages || [];
    if (conversationId) {
      try {
        const { data: offers } = await supabase
          .from('custom_offers')
          .select('*')
          .eq('conversation_id', conversationId);

        if (offers && offers.length > 0) {
          const offerMap = new Map();
          offers.forEach(off => {
            offerMap.set(off.id, off);
          });

          syncedMessages = syncedMessages.map(msg => {
            if (msg.offer_id && offerMap.has(msg.offer_id)) {
              return {
                ...msg,
                offer_data: offerMap.get(msg.offer_id)
              };
            }
            return msg;
          });
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
        await supabase.from('conversations').insert([{
          id: conversation_id,
          client_email: cleanEmail,
          client_name: effectiveSender === 'client' ? effectiveSenderName : cleanEmail.split('@')[0],
          status: 'online',
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

    // 4. Send notification if sender is admin and recipient is client
    if (effectiveSender === 'admin' && cleanEmail && cleanEmail !== 'client@studio.com') {
      try {
        await supabase.from('notifications').insert([{
          id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          recipient_role: 'client',
          recipient_email: cleanEmail,
          title: offer_id ? 'New Custom Offer' : 'New Message from Support',
          message: text ? text.substring(0, 140) : (offer_id ? `Support sent you a custom offer: "${offer_data?.title || 'Digitizing'}"` : 'You received new production files from Bilal Digitizing.'),
          type: offer_id ? 'offer' : 'chat',
          link: '/client-portal?tab=chat',
          read: false,
          created_at: nowIso
        }]);
      } catch (notifErr) {
        console.warn('[Chat Notification Notice]:', notifErr.message);
      }
    }

    return NextResponse.json({ success: true, message: insertedMsg });
  } catch (err) {
    console.error('[Chat Messages POST Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
