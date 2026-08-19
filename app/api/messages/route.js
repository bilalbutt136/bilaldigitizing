import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../src/lib/supabase/admin';
import { getServerAuthUser } from '../../../src/lib/supabase/serverAuth';

export const dynamic = 'force-dynamic';

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
      if (isAdmin) {
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
              const orderIds = userOrders.map(o => o.id);
              const threadIds = userOrders.map(o => `order-${o.id}`);
              
              const { data: byOrderIds } = await supabase
                .from('conversations')
                .select('*')
                .in('order_id', orderIds);
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
      const conversationIdSet = new Set((convData || []).map(c => c.id));
      conversationIdSet.add('general-support');
      if (cleanUserEmail && cleanUserEmail !== 'client@studio.com') {
        conversationIdSet.add(`support-${cleanUserEmail}`);
      }

      const conversationIds = Array.from(conversationIdSet);

      let messagesData = [];
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

      // Ensure any conversation that has messages exists in convData
      const existingConvIds = new Set((convData || []).map(c => c.id));
      messagesData.forEach(m => {
        if (m.conversation_id && !existingConvIds.has(m.conversation_id)) {
          const cId = m.conversation_id;
          const isOrder = cId.startsWith('order-');
          const rawId = isOrder ? cId.replace('order-', '') : null;
          convData.push({
            id: cId,
            client_name: user?.user_metadata?.full_name || 'Client',
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
        const mappedMessages = messagesData
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
            is_read: m.is_read || false,
            timestamp: m.timestamp || m.created_at
          }));

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
          messages: mappedMessages
        };
      });

      return NextResponse.json({ conversations });
    }

    if (action === 'fetchMessages') {
      if (!chatId) {
        return NextResponse.json({ error: 'Missing chatId' }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', chatId)
        .order('created_at', { ascending: true });
        
      if (error) {
        console.error('[Messages API fetchMessages error]:', error.message);
        return NextResponse.json({ messages: [] });
      }
      
      const mappedMessages = (data || []).map(m => ({
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
        is_read: m.is_read || false,
        timestamp: m.timestamp || m.created_at
      }));
      
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

      const { data: convData, error } = await supabase.from('conversations').upsert([dbPayload]).select();
      if (error) {
        console.error('[Messages API upsertConversation error]:', error.message);
        throw error;
      }
      
      const conv = convData ? convData[0] : dbPayload;
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

      // Upsert conversation to prevent Foreign Key constraint violations
      try {
        const { data: existingConv } = await supabase.from('conversations').select('*').eq('id', convId).maybeSingle();

        if (!existingConv) {
          let orderInfo = null;
          if (rawOrderId) {
            const { data: o } = await supabase.from('orders').select('title, client_name, client_email, notes').eq('id', rawOrderId).maybeSingle();
            orderInfo = o;
          }

          const fallbackName = user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : 'Client');
          const finalClientName = isAdmin ? (orderInfo?.client_name || 'Client') : (payload.sender_name || payload.senderName || fallbackName);
          const finalClientEmail = isAdmin ? (orderInfo?.client_email || 'client@studio.com') : (payload.client_email || cleanUserEmail);
          const finalOrderTitle = orderInfo?.title || payload.order_title || payload.orderTitle || (isOrder ? `Order #${rawOrderId}` : 'Live Support');

          await supabase.from('conversations').insert([{
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
          }]);
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
        is_read: false,
        timestamp: payload.timestamp || nowIso,
        created_at: nowIso
      };
      
      const { error } = await supabase.from('messages').insert([dbPayload]);
      if (error) {
        console.error('[Messages API insert error]:', error.message);
        throw error;
      }
      
      // Mirror to order_messages if an order ID is present
      if (rawOrderId) {
        try {
          await supabase.from('order_messages').insert([{
            order_id: rawOrderId,
            sender_name: dbPayload.sender_name,
            sender_role: actualSender,
            is_staff: isAdmin,
            message: dbPayload.text,
            attachment: dbPayload.attachment,
            attachment_url: dbPayload.attachment_url,
            attachment_name: dbPayload.attachment_name,
            attachment_size: dbPayload.attachment_size,
            reply_to: dbPayload.reply_to,
            is_read: false,
            created_at: nowIso
          }]);
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
          await supabase.from('conversations')
            .update({ 
              updated_at: nowIso, 
              client_unread_count: newClientCount,
              admin_unread_count: 0,
              unread_count: 0 
            })
            .eq('id', convId);
        } else {
          // Client replied -> Increment admin unread, reset client unread
          const newAdminCount = (convData?.admin_unread_count || convData?.unread_count || 0) + 1;
          await supabase.from('conversations')
            .update({ 
              updated_at: nowIso, 
              admin_unread_count: newAdminCount,
              unread_count: newAdminCount,
              client_unread_count: 0 
            })
            .eq('id', convId);
        }
      } catch (cntErr) {
        console.warn('Conversation unread_count update notice:', cntErr.message);
      }

      return NextResponse.json({ success: true, message: dbPayload });
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
