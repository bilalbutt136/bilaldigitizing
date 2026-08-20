import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../src/lib/supabase/admin';
import { getServerAuthUser } from '../../../src/lib/supabase/serverAuth';

export const dynamic = 'force-dynamic';

const parseMessageTime = (msg) => {
  if (!msg) return 0;
  const raw = msg.timestamp || msg.created_at || msg.createdAt || msg.time;
  if (!raw) return 0;
  if (typeof raw === 'number') return raw;
  const parsed = new Date(raw).getTime();
  return isNaN(parsed) ? 0 : parsed;
};

export async function GET(request) {
  try {
    const { user, isAdmin } = await getServerAuthUser(request);
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const chatId = searchParams.get('chatId');
    const emailParam = (searchParams.get('clientEmail') || searchParams.get('email') || '').toLowerCase().trim();
    const supabase = createAdminClient();

    if (action === 'fetchConversations') {
      const cleanUserEmail = (user?.email || emailParam || '').toLowerCase().trim();
      
      let convData = [];
      let userOrderIds = [];

      if (isAdmin) {
        // Admin gets all conversations
        const { data, error } = await supabase
          .from('conversations')
          .select('*')
          .order('updated_at', { ascending: false });
        if (!error && data) convData = data;
      } else {
        const collectedMap = new Map();

        // 1. Fetch conversations by client email
        if (cleanUserEmail && cleanUserEmail !== 'client@studio.com' && !cleanUserEmail.includes('guest@bdigitizing.pro')) {
          try {
            const { data: byEmail } = await supabase
              .from('conversations')
              .select('*')
              .ilike('client_email', cleanUserEmail);
            (byEmail || []).forEach(c => collectedMap.set(c.id, c));
          } catch {}

          try {
            const { data: bySupportId } = await supabase
              .from('conversations')
              .select('*')
              .or(`id.eq.general-support,id.ilike.support-${cleanUserEmail}%,id.ilike.support-guest%`);
            (bySupportId || []).forEach(c => collectedMap.set(c.id, c));
          } catch {}

          // 2. Fetch conversations associated with client's orders
          try {
            const { data: userOrders } = await supabase
              .from('orders')
              .select('id, title, client_name, client_email')
              .ilike('client_email', cleanUserEmail);
            
            if (userOrders && userOrders.length > 0) {
              userOrderIds = userOrders.map(o => o.id);
              const threadIds = userOrders.map(o => `order-${o.id}`);
              
              const { data: byOrderIds } = await supabase
                .from('conversations')
                .select('*')
                .in('order_id', userOrderIds);
              (byOrderIds || []).forEach(c => collectedMap.set(c.id, c));

              const { data: byThreadIds } = await supabase
                .from('conversations')
                .select('*')
                .in('id', threadIds);
              (byThreadIds || []).forEach(c => collectedMap.set(c.id, c));
            }
          } catch {}
        } else {
          try {
            const { data: generalConvs } = await supabase
              .from('conversations')
              .select('*')
              .or(`id.eq.general-support,id.ilike.support-guest%`);
            (generalConvs || []).forEach(c => collectedMap.set(c.id, c));
          } catch {}
        }

        convData = Array.from(collectedMap.values());
      }

      // Build target list of conversation IDs for messages lookup
      let messagesData = [];
      if (isAdmin) {
        // Admin fetches all messages to guarantee zero history loss
        const { data: mData, error: msgError } = await supabase
          .from('messages')
          .select('*')
          .order('created_at', { ascending: true });
        if (!msgError && mData) {
          messagesData = mData;
        }
      } else {
        const conversationIdSet = new Set((convData || []).map(c => c.id));
        conversationIdSet.add('general-support');
        if (cleanUserEmail && cleanUserEmail !== 'client@studio.com') {
          conversationIdSet.add(`support-${cleanUserEmail}`);
        }
        userOrderIds.forEach(id => {
          conversationIdSet.add(`order-${id}`);
          conversationIdSet.add(id);
        });

        const conversationIds = Array.from(conversationIdSet);

        if (conversationIds.length > 0) {
          const { data: mData, error: msgError } = await supabase
            .from('messages')
            .select('*')
            .in('conversation_id', conversationIds)
            .order('created_at', { ascending: true });
          if (!msgError && mData) {
            messagesData = mData;
          }
        }
      }

      // Also retrieve order_messages for all involved order IDs to ensure zero history loss
      let orderMessagesData = [];
      const orderIdsToFetch = isAdmin
        ? []
        : (userOrderIds.length > 0 
            ? userOrderIds 
            : (convData || []).filter(c => c.order_id || c.id?.startsWith('order-')).map(c => c.order_id || c.id.replace('order-', '')));

      if (isAdmin) {
        try {
          const { data: allOmData } = await supabase
            .from('order_messages')
            .select('*')
            .order('created_at', { ascending: true });
          if (allOmData) orderMessagesData = allOmData;
        } catch {}
      } else if (orderIdsToFetch.length > 0) {
        try {
          const { data: omData } = await supabase
            .from('order_messages')
            .select('*')
            .in('order_id', orderIdsToFetch)
            .order('created_at', { ascending: true });
          if (omData) orderMessagesData = omData;
        } catch {}
      }

      // Ensure any conversation that has messages exists in convData
      const existingConvIds = new Set((convData || []).map(c => c.id));
      messagesData.forEach(m => {
        if (m.conversation_id && !existingConvIds.has(m.conversation_id)) {
          const cId = m.conversation_id;
          const isOrder = cId.startsWith('order-');
          const rawId = isOrder ? cId.replace('order-', '') : null;
          convData.push({
            id: cId,
            client_name: m.sender_name || (isAdmin ? 'Customer' : 'Client'),
            client_email: cleanUserEmail || 'client@studio.com',
            client_company: 'Studio Client',
            order_id: rawId,
            order_title: isOrder ? `Order #${rawId}` : 'Live Support',
            status: 'online',
            admin_unread_count: 0,
            client_unread_count: 0,
            unread_count: 0,
            created_at: m.created_at || new Date().toISOString(),
            updated_at: m.created_at || new Date().toISOString()
          });
          existingConvIds.add(cId);
        }
      });

      const conversations = (convData || []).map(conv => {
        const rawOrdId = conv.order_id || (conv.id?.startsWith('order-') ? conv.id.replace('order-', '') : null);

        const convDirectMsgs = messagesData
          .filter(m => m.conversation_id === conv.id)
          .map(m => ({
            id: m.id,
            conversation_id: m.conversation_id,
            sender: m.sender,
            senderName: m.sender_name || (m.sender === 'admin' ? 'Support' : conv.client_name || 'Client'),
            sender_name: m.sender_name,
            text: m.text,
            attachment: m.attachment,
            attachment_url: m.attachment_url || null,
            attachment_name: m.attachment_name || m.attachment || null,
            attachment_size: m.attachment_size || null,
            attachment_type: m.attachment_type || null,
            reply_to: m.reply_to || null,
            offer_id: m.offer_id || m.offerId || null,
            offer_data: m.offer_data || m.offerData || null,
            is_read: m.is_read || false,
            timestamp: m.timestamp || m.created_at
          }));

        // Merge order_messages if this is an order conversation
        if (rawOrdId && orderMessagesData.length > 0) {
          const matchingOrderMsgs = orderMessagesData.filter(om => om.order_id === rawOrdId);
          matchingOrderMsgs.forEach(om => {
            const mapped = {
              id: String(om.id),
              conversation_id: conv.id,
              sender: om.sender_role === 'admin' ? 'admin' : (om.sender === 'admin' ? 'admin' : 'client'),
              senderName: om.sender_name || (om.sender_role === 'admin' ? 'Support' : conv.client_name || 'Client'),
              sender_name: om.sender_name,
              text: om.message || om.text || '',
              attachment: om.attachment || om.attachment_name || null,
              attachment_url: om.attachment_url || null,
              attachment_name: om.attachment_name || om.attachment || null,
              attachment_size: om.attachment_size || null,
              attachment_type: om.attachment_type || null,
              reply_to: om.reply_to || null,
              offer_id: om.offer_id || om.offerId || null,
              offer_data: om.offer_data || om.offerData || null,
              is_read: om.is_read || false,
              timestamp: om.created_at
            };
            if (!convDirectMsgs.some(m => m.id === mapped.id || (m.text === mapped.text && Math.abs(new Date(m.timestamp) - new Date(mapped.timestamp)) < 5000))) {
              convDirectMsgs.push(mapped);
            }
          });
        }

        convDirectMsgs.sort((a, b) => parseMessageTime(a) - parseMessageTime(b));

        // Compute role-appropriate unread count
        const unreadCount = isAdmin 
          ? (conv.admin_unread_count ?? conv.unread_count ?? 0)
          : (conv.client_unread_count ?? 0);

        return {
          id: conv.id,
          clientName: conv.client_name,
          clientEmail: conv.client_email,
          company: conv.client_company,
          orderId: conv.order_id,
          orderTitle: conv.order_title,
          avatar: conv.avatar,
          status: conv.status || 'online',
          unreadCount: unreadCount,
          adminUnreadCount: conv.admin_unread_count ?? conv.unread_count ?? 0,
          clientUnreadCount: conv.client_unread_count ?? 0,
          createdAt: conv.created_at,
          updatedAt: conv.updated_at,
          messages: convDirectMsgs
        };
      });

      return NextResponse.json({ conversations });
    }

    if (action === 'fetchMessages') {
      if (!chatId) {
        return NextResponse.json({ error: 'Missing chatId' }, { status: 400 });
      }

      const cleanUserEmail = (user?.email || emailParam || '').toLowerCase().trim();
      const rawOrderId = chatId.startsWith('order-') ? chatId.replace('order-', '') : (chatId.match(/^[A-Z0-9-]+$/i) ? chatId : null);

      let targetIds = [chatId];
      if (chatId === 'general-support' || chatId.startsWith('support-')) {
        targetIds = ['general-support'];
        if (cleanUserEmail && cleanUserEmail !== 'client@studio.com') {
          targetIds.push(`support-${cleanUserEmail}`);
        }
      }

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .in('conversation_id', targetIds)
        .order('created_at', { ascending: true });
        
      let mappedMessages = (data || []).map(m => ({
        id: m.id,
        conversation_id: m.conversation_id,
        sender: m.sender,
        senderName: m.sender_name || (m.sender === 'admin' ? 'Support' : 'Client'),
        sender_name: m.sender_name,
        text: m.text,
        attachment: m.attachment,
        attachment_url: m.attachment_url || null,
        attachment_name: m.attachment_name || m.attachment || null,
        attachment_size: m.attachment_size || null,
        attachment_type: m.attachment_type || null,
        reply_to: m.reply_to || null,
        offer_id: m.offer_id || m.offerId || null,
        offer_data: m.offer_data || m.offerData || null,
        is_read: m.is_read || false,
        timestamp: m.timestamp || m.created_at
      }));

      // If order thread, also query order_messages
      if (rawOrderId) {
        try {
          const { data: omData } = await supabase
            .from('order_messages')
            .select('*')
            .eq('order_id', rawOrderId)
            .order('created_at', { ascending: true });

          if (omData && omData.length > 0) {
            omData.forEach(om => {
              const mapped = {
                id: String(om.id),
                conversation_id: chatId,
                sender: om.sender_role === 'admin' ? 'admin' : (om.sender === 'admin' ? 'admin' : 'client'),
                senderName: om.sender_name || (om.sender_role === 'admin' ? 'Support' : 'Client'),
                sender_name: om.sender_name,
                text: om.message || om.text || '',
                attachment: om.attachment || om.attachment_name || null,
                attachment_url: om.attachment_url || null,
                attachment_name: om.attachment_name || om.attachment || null,
                attachment_size: om.attachment_size || null,
                attachment_type: om.attachment_type || null,
                reply_to: om.reply_to || null,
                offer_id: om.offer_id || om.offerId || null,
                offer_data: om.offer_data || om.offerData || null,
                is_read: om.is_read || false,
                timestamp: om.created_at
              };
              if (!mappedMessages.some(m => m.id === mapped.id || (m.text === mapped.text && Math.abs(new Date(m.timestamp) - new Date(mapped.timestamp)) < 5000))) {
                mappedMessages.push(mapped);
              }
            });
          }
        } catch {}
      }

      mappedMessages.sort((a, b) => parseMessageTime(a) - parseMessageTime(b));
      
      return NextResponse.json({ messages: mappedMessages });
    }

    if (action === 'fetchNotifications') {
      const cleanUserEmail = (user?.email || emailParam || '').toLowerCase().trim();
      let notifQuery = supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50);

      if (!isAdmin) {
        if (cleanUserEmail && cleanUserEmail !== 'client@studio.com') {
          notifQuery = notifQuery.or(`recipient_email.ilike.${cleanUserEmail},recipient_role.eq.client,recipient_role.eq.all`);
        } else {
          notifQuery = notifQuery.or(`recipient_role.eq.client,recipient_role.eq.all`);
        }
      } else {
        notifQuery = notifQuery.or(`recipient_role.eq.admin,recipient_role.eq.all`);
      }

      const { data: notifData, error: notifErr } = await notifQuery;
      if (notifErr) {
        console.warn('[Messages API fetchNotifications notice]:', notifErr.message);
        return NextResponse.json({ notifications: [] });
      }

      return NextResponse.json({ notifications: notifData || [] });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[Messages API GET]', error);
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
    const cleanUserEmail = user ? user.email.toLowerCase().trim() : (payload.clientEmail || payload.client_email || 'guest@bdigitizing.pro').toLowerCase().trim();

    if (action === 'upsertConversation') {
      const clientEmail = (payload.clientEmail || payload.client_email || cleanUserEmail).toLowerCase().trim();

      const dbPayload = {
        id: payload.id,
        client_name: payload.clientName || payload.client_name || 'Client',
        client_email: clientEmail,
        client_company: payload.company || payload.client_company || 'Studio Client',
        order_id: payload.orderId || payload.order_id || null,
        order_title: payload.orderTitle || payload.order_title || 'Direct Support',
        avatar: payload.avatar || null,
        status: payload.status || 'online',
        unread_count: payload.unreadCount || payload.unread_count || 0,
        admin_unread_count: payload.adminUnreadCount ?? (isAdmin ? 0 : 1),
        client_unread_count: payload.clientUnreadCount ?? (isAdmin ? 1 : 0),
        updated_at: new Date().toISOString()
      };

      let conv = dbPayload;
      const { data: convData, error } = await supabase.from('conversations').upsert([dbPayload]).select();
      if (error) {
        console.warn('[Messages API upsertConversation warning]:', error.message, '- retrying with core columns');
        const corePayload = {
          id: dbPayload.id,
          client_name: dbPayload.client_name,
          client_email: dbPayload.client_email,
          client_company: dbPayload.client_company,
          order_id: dbPayload.order_id,
          order_title: dbPayload.order_title,
          avatar: dbPayload.avatar,
          status: dbPayload.status,
          unread_count: dbPayload.unread_count,
          updated_at: dbPayload.updated_at
        };
        const { data: fallbackData } = await supabase.from('conversations').upsert([corePayload]).select();
        if (fallbackData && fallbackData[0]) conv = fallbackData[0];
      } else if (convData && convData[0]) {
        conv = convData[0];
      }
      
      const mappedConv = {
        id: conv.id,
        clientName: conv.client_name,
        clientEmail: conv.client_email,
        company: conv.client_company,
        orderId: conv.order_id,
        orderTitle: conv.order_title,
        avatar: conv.avatar,
        status: conv.status,
        unreadCount: isAdmin ? (conv.admin_unread_count ?? conv.unread_count ?? 0) : (conv.client_unread_count ?? 0),
        adminUnreadCount: conv.admin_unread_count ?? conv.unread_count ?? 0,
        clientUnreadCount: conv.client_unread_count ?? 0,
        createdAt: conv.created_at,
        updatedAt: conv.updated_at,
        messages: payload.messages || []
      };

      return NextResponse.json({ success: true, conversation: mappedConv });
    }
    
    if (action === 'insertMessage') {
      // Use exact conversation_id passed by client, or resolve cleanly
      let convId = payload.conversation_id;
      const rawOrderId = payload.order_id || (convId && convId.startsWith('order-') ? convId.replace('order-', '') : null);
      const isOrder = Boolean(rawOrderId);

      if (!convId) {
        convId = isOrder 
          ? `order-${rawOrderId}` 
          : (cleanUserEmail && cleanUserEmail !== 'client@studio.com' ? `support-${cleanUserEmail}` : 'general-support');
      }

      // Upsert conversation to prevent Foreign Key constraint violations and ensure persistent existence
      try {
        let orderInfo = null;
        if (rawOrderId) {
          const { data: o } = await supabase.from('orders').select('title, client_name, client_email, notes').eq('id', rawOrderId).maybeSingle();
          orderInfo = o;
        }

        const fallbackName = user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : 'Client');
        const finalClientName = isAdmin ? (orderInfo?.client_name || 'Client') : (payload.sender_name || payload.senderName || fallbackName);
        const finalClientEmail = isAdmin ? (orderInfo?.client_email || 'client@studio.com') : (payload.client_email || cleanUserEmail);
        const finalOrderTitle = orderInfo?.title || payload.order_title || payload.orderTitle || (isOrder ? `Order #${rawOrderId}` : 'Live Support');

        const { data: existingConv } = await supabase.from('conversations').select('*').eq('id', convId).maybeSingle();

        if (!existingConv) {
          const fullConvPayload = {
            id: convId,
            order_id: rawOrderId,
            order_title: finalOrderTitle,
            client_name: finalClientName,
            client_email: finalClientEmail,
            client_company: payload.company || 'Studio Client',
            status: 'online',
            unread_count: isAdmin ? 0 : 1,
            admin_unread_count: isAdmin ? 0 : 1,
            client_unread_count: isAdmin ? 1 : 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          const { error: convErr } = await supabase.from('conversations').insert([fullConvPayload]);
          if (convErr) {
            await supabase.from('conversations').insert([{
              id: convId,
              order_id: rawOrderId,
              order_title: finalOrderTitle,
              client_name: finalClientName,
              client_email: finalClientEmail,
              client_company: payload.company || 'Studio Client',
              status: 'online',
              unread_count: 1,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }]);
          }
        } else {
          try {
            await supabase.from('conversations').update({
              client_name: existingConv.client_name === 'Guest Client' && finalClientName !== 'Guest Client' ? finalClientName : existingConv.client_name,
              client_email: (existingConv.client_email === 'guest@bdigitizing.pro' || !existingConv.client_email) && finalClientEmail !== 'guest@bdigitizing.pro' ? finalClientEmail : existingConv.client_email,
              updated_at: new Date().toISOString()
            }).eq('id', convId);
          } catch {}
        }
      } catch (convUpsertErr) {
        console.warn('Conversation upsert notice:', convUpsertErr.message);
      }

      // Determine sender role safely
      const actualSender = isAdmin ? 'admin' : (payload.sender === 'admin' && !isAdmin ? 'client' : (payload.sender || 'client'));
      const actualSenderName = isAdmin 
        ? (payload.sender_name || 'Support')
        : (payload.sender_name || payload.senderName || (user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : 'Client')));

      const nowIso = new Date().toISOString();
      const dbPayload = {
        id: payload.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        conversation_id: convId,
        sender: actualSender,
        sender_name: actualSenderName,
        text: payload.text || '',
        attachment: payload.attachment || payload.attachment_name || null,
        attachment_url: payload.attachment_url || payload.attachmentUrl || null,
        attachment_name: payload.attachment_name || payload.attachmentName || payload.attachment || null,
        attachment_size: payload.attachment_size || payload.attachmentSize || null,
        attachment_type: payload.attachment_type || payload.attachmentType || null,
        reply_to: payload.reply_to || payload.replyTo || null,
        offer_id: payload.offer_id || payload.offerId || null,
        offer_data: payload.offer_data || payload.offerData || null,
        is_read: false,
        timestamp: payload.timestamp || nowIso,
        created_at: nowIso
      };
      
      // Resilient message insertion with fallback to guaranteed core columns
      let finalInsertedMsg = dbPayload;
      const { data: insData, error: insError } = await supabase.from('messages').insert([dbPayload]).select();
      if (insError) {
        console.warn('[Messages API primary insert notice]:', insError.message, '- retrying with core columns');
        const corePayload = {
          id: dbPayload.id,
          conversation_id: dbPayload.conversation_id,
          sender: dbPayload.sender,
          sender_name: dbPayload.sender_name,
          text: dbPayload.text || '',
          attachment: dbPayload.attachment || dbPayload.attachment_url || null,
          timestamp: dbPayload.timestamp,
          created_at: dbPayload.created_at
        };
        const { data: coreInsData, error: coreError } = await supabase.from('messages').insert([corePayload]).select();
        if (coreError) {
          console.error('[Messages API fallback insert error]:', coreError.message);
          throw coreError;
        }
        if (coreInsData && coreInsData[0]) finalInsertedMsg = { ...dbPayload, ...coreInsData[0] };
      } else if (insData && insData[0]) {
        finalInsertedMsg = insData[0];
      }
      
      // Mirror to order_messages if an order ID is present
      if (rawOrderId) {
        try {
          const omPayload = {
            order_id: rawOrderId,
            sender: actualSender,
            sender_name: dbPayload.sender_name || (isAdmin ? 'Support' : 'Client'),
            sender_role: actualSender,
            is_internal: false,
            message: dbPayload.text || '',
            attachment: dbPayload.attachment || dbPayload.attachment_url || null,
            created_at: nowIso
          };
          await supabase.from('order_messages').insert([omPayload]);
        } catch (omErr) {
          console.warn('order_messages mirror notice:', omErr.message);
        }
      }

      // Update the conversation's updated_at and dual role unread counts
      try {
        const { data: convData } = await supabase.from('conversations').select('admin_unread_count, client_unread_count, unread_count').eq('id', convId).maybeSingle();
        
        if (isAdmin) {
          // Admin replied -> Increment client unread, reset admin unread
          const newClientCount = (convData?.client_unread_count || 0) + 1;
          const { error: updErr } = await supabase.from('conversations')
            .update({ 
              updated_at: nowIso, 
              client_unread_count: newClientCount,
              admin_unread_count: 0,
              unread_count: 0 
            })
            .eq('id', convId);
          if (updErr) {
            await supabase.from('conversations').update({ updated_at: nowIso, unread_count: 0 }).eq('id', convId);
          }
        } else {
          // Client replied -> Increment admin unread, reset client unread
          const newAdminCount = (convData?.admin_unread_count || convData?.unread_count || 0) + 1;
          const { error: updErr } = await supabase.from('conversations')
            .update({ 
              updated_at: nowIso, 
              admin_unread_count: newAdminCount,
              unread_count: newAdminCount,
              client_unread_count: 0 
            })
            .eq('id', convId);
          if (updErr) {
            await supabase.from('conversations').update({ updated_at: nowIso, unread_count: newAdminCount }).eq('id', convId);
          }
        }
      } catch (cntErr) {
        console.warn('Conversation unread_count update notice:', cntErr.message);
      }

      return NextResponse.json({ success: true, message: finalInsertedMsg });
    }

    if (action === 'markAsRead') {
      const { conversation_id } = payload;
      
      if (conversation_id) {
        const nowIso = new Date().toISOString();
        if (isAdmin) {
          // Admin marks conversation read
          await supabase.from('conversations')
            .update({ admin_unread_count: 0, unread_count: 0, updated_at: nowIso })
            .eq('id', conversation_id);
          
          await supabase.from('messages')
            .update({ is_read: true })
            .eq('conversation_id', conversation_id)
            .neq('sender', 'admin');
        } else {
          // Client marks conversation read
          await supabase.from('conversations')
            .update({ client_unread_count: 0, updated_at: nowIso })
            .eq('id', conversation_id);
          
          await supabase.from('messages')
            .update({ is_read: true })
            .eq('conversation_id', conversation_id)
            .eq('sender', 'admin');
        }

        const rawOrderId = conversation_id.startsWith('order-') ? conversation_id.replace('order-', '') : null;
        if (rawOrderId) {
          await supabase.from('order_messages')
            .update({ is_read: true })
            .eq('order_id', rawOrderId)
            .eq('is_staff', !isAdmin);
        }
      }
      
      return NextResponse.json({ success: true });
    }

    if (action === 'createNotification') {
      const notif = payload;
      const nowIso = new Date().toISOString();
      const notifRow = {
        id: notif.id || `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        user_id: user?.id || null,
        recipient_role: notif.recipient_role || notif.recipientRole || (isAdmin ? 'admin' : 'client'),
        recipient_email: notif.recipient_email || notif.recipientEmail || null,
        title: notif.title || 'System Notification',
        message: notif.message || '',
        type: notif.type || 'info',
        link: notif.link || null,
        order_id: notif.order_id || notif.orderId || null,
        read: false,
        created_at: nowIso,
        updated_at: nowIso
      };

      const { data: insertedNotif, error: notifInsertErr } = await supabase
        .from('notifications')
        .insert([notifRow])
        .select();

      if (notifInsertErr) {
        console.warn('createNotification DB notice:', notifInsertErr.message);
      }

      return NextResponse.json({ success: true, notification: insertedNotif ? insertedNotif[0] : notifRow });
    }

    if (action === 'markNotificationRead') {
      const { notification_id, id } = payload;
      const targetId = notification_id || id;
      if (targetId) {
        await supabase
          .from('notifications')
          .update({ read: true, updated_at: new Date().toISOString() })
          .eq('id', targetId);
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'markAllNotificationsRead') {
      const cleanUserEmail = (user?.email || payload.clientEmail || '').toLowerCase().trim();
      const nowIso = new Date().toISOString();

      if (isAdmin) {
        await supabase
          .from('notifications')
          .update({ read: true, updated_at: nowIso })
          .or('recipient_role.eq.admin,recipient_role.eq.all');
      } else if (cleanUserEmail) {
        await supabase
          .from('notifications')
          .update({ read: true, updated_at: nowIso })
          .or(`recipient_email.ilike.${cleanUserEmail},recipient_role.eq.client,recipient_role.eq.all`);
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[Messages API POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
