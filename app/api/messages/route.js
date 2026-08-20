import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../src/lib/supabase/admin';
import { getServerAuthUser } from '../../../src/lib/supabase/serverAuth';

export const dynamic = 'force-dynamic';

const normalizeEmail = (e) => {
  if (!e) return '';
  const str = String(e).toLowerCase().trim();
  if (str === 'client@studio.com' || str.includes('guest@bdigitizing.pro')) return '';
  return str;
};

const getCanonicalChatId = (email) => {
  const clean = normalizeEmail(email);
  return clean ? `chat-${clean}` : 'chat-guest';
};

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
    const emailParam = normalizeEmail(searchParams.get('clientEmail') || searchParams.get('email') || '');
    const supabase = createAdminClient();

    if (action === 'fetchConversations') {
      const cleanUserEmail = normalizeEmail(user?.email || emailParam || '');

      // 1. Fetch all messages
      const { data: allMessages, error: msgErr } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });
      const rawMessages = allMessages || [];

      // 2. Fetch all orders (to map client names, emails, and order discussions)
      const { data: allOrders } = await supabase
        .from('orders')
        .select('id, title, client_name, client_email, service_category, service_type, status, price, created_at');
      const rawOrders = allOrders || [];

      // 3. Fetch all clients (for real customer profile names)
      const { data: allClients } = await supabase
        .from('clients')
        .select('name, full_name, email, company, role');
      const rawClients = allClients || [];

      // 4. Fetch all conversations table records
      const { data: allConvs } = await supabase
        .from('conversations')
        .select('*');
      const rawConvs = allConvs || [];

      // Map helper for orders by email
      const ordersByEmail = new Map();
      const orderToEmailMap = new Map();
      rawOrders.forEach(ord => {
        const ordEmail = normalizeEmail(ord.client_email);
        if (ordEmail) {
          if (!ordersByEmail.has(ordEmail)) ordersByEmail.set(ordEmail, []);
          ordersByEmail.get(ordEmail).push(ord);
          orderToEmailMap.set(String(ord.id).toLowerCase(), ordEmail);
          orderToEmailMap.set(`order-${String(ord.id).toLowerCase()}`, ordEmail);
        }
      });

      // Map helper for client profiles
      const clientsByEmail = new Map();
      rawClients.forEach(c => {
        const cEmail = normalizeEmail(c.email);
        if (cEmail) clientsByEmail.set(cEmail, c);
      });

      // Group all customer threads: Map<customerEmail, { info, messages } >
      const customerThreadsMap = new Map();

      const getOrCreateCustomerThread = (email, fallbackName = 'Customer') => {
        const cleanEmail = normalizeEmail(email);
        const key = cleanEmail || 'guest';
        if (!customerThreadsMap.has(key)) {
          const clientProfile = cleanEmail ? clientsByEmail.get(cleanEmail) : null;
          const clientOrders = cleanEmail ? (ordersByEmail.get(cleanEmail) || []) : [];
          
          let resolvedName = clientProfile?.name || clientProfile?.full_name;
          if (!resolvedName && clientOrders.length > 0) {
            resolvedName = clientOrders[0].client_name;
          }
          if (!resolvedName && cleanEmail) {
            resolvedName = cleanEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          }
          if (!resolvedName) resolvedName = fallbackName || 'Guest Visitor';

          customerThreadsMap.set(key, {
            id: cleanEmail ? `chat-${cleanEmail}` : 'chat-guest',
            clientEmail: cleanEmail,
            clientName: resolvedName,
            company: clientProfile?.company || 'Studio Client',
            status: 'online',
            avatar: null,
            orders: clientOrders,
            messages: [],
            adminUnreadCount: 0,
            clientUnreadCount: 0,
            unreadCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
        return customerThreadsMap.get(key);
      };

      // Seed from existing conversations table
      rawConvs.forEach(conv => {
        const convEmail = normalizeEmail(conv.client_email) || (conv.id?.startsWith('chat-') ? normalizeEmail(conv.id.replace('chat-', '')) : (conv.id?.startsWith('inbox-') ? normalizeEmail(conv.id.replace('inbox-', '')) : (conv.id?.startsWith('support-') ? normalizeEmail(conv.id.replace('support-', '')) : '')));
        const thread = getOrCreateCustomerThread(convEmail, conv.client_name);
        if (conv.client_name && conv.client_name !== 'Customer' && conv.client_name !== 'Client' && conv.client_name !== 'Guest Client') {
          thread.clientName = conv.client_name;
        }
        if (conv.admin_unread_count) thread.adminUnreadCount = Math.max(thread.adminUnreadCount, conv.admin_unread_count);
        if (conv.client_unread_count) thread.clientUnreadCount = Math.max(thread.clientUnreadCount, conv.client_unread_count);
      });

      // Distribute all messages into their respective single customer thread
      rawMessages.forEach(m => {
        let matchedEmail = '';

        // Check if conversation_id has email embedded
        const cId = String(m.conversation_id || '').toLowerCase();
        if (cId.startsWith('chat-')) matchedEmail = normalizeEmail(cId.replace('chat-', ''));
        else if (cId.startsWith('inbox-')) matchedEmail = normalizeEmail(cId.replace('inbox-', ''));
        else if (cId.startsWith('support-')) matchedEmail = normalizeEmail(cId.replace('support-', ''));
        else if (cId.startsWith('direct-')) matchedEmail = normalizeEmail(cId.replace('direct-', ''));
        else if (cId.startsWith('order-') || orderToEmailMap.has(cId)) {
          matchedEmail = orderToEmailMap.get(cId) || '';
        }

        // Check message level email
        if (!matchedEmail && m.client_email) {
          matchedEmail = normalizeEmail(m.client_email);
        }

        const thread = getOrCreateCustomerThread(matchedEmail, m.sender_name);

        const mappedMsg = {
          id: m.id,
          conversation_id: thread.id,
          sender: m.sender,
          senderName: m.sender_name || (m.sender === 'admin' ? 'Support' : thread.clientName),
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
        };

        thread.messages.push(mappedMsg);
      });

      // Finalize customer threads
      const conversationList = Array.from(customerThreadsMap.values()).map(thread => {
        thread.messages.sort((a, b) => parseMessageTime(a) - parseMessageTime(b));
        const lastMsg = thread.messages[thread.messages.length - 1];
        const lastTime = lastMsg ? parseMessageTime(lastMsg) : new Date(thread.updatedAt).getTime();
        
        // Count unread for admin
        const unreadForAdmin = thread.messages.filter(m => m.sender === 'client' && !m.is_read).length;
        const unreadForClient = thread.messages.filter(m => m.sender === 'admin' && !m.is_read).length;

        return {
          ...thread,
          unreadCount: isAdmin ? unreadForAdmin : unreadForClient,
          adminUnreadCount: unreadForAdmin,
          clientUnreadCount: unreadForClient,
          lastMessageTime: lastTime,
          updatedAt: lastMsg?.timestamp || thread.updatedAt
        };
      });

      // Filter based on requester role
      if (!isAdmin) {
        if (cleanUserEmail) {
          const userThread = conversationList.find(c => c.clientEmail === cleanUserEmail) || {
            id: `chat-${cleanUserEmail}`,
            clientEmail: cleanUserEmail,
            clientName: user?.user_metadata?.full_name || cleanUserEmail.split('@')[0],
            company: 'Studio Client',
            status: 'online',
            avatar: null,
            orders: ordersByEmail.get(cleanUserEmail) || [],
            messages: [],
            unreadCount: 0,
            adminUnreadCount: 0,
            clientUnreadCount: 0,
            lastMessageTime: Date.now(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          return NextResponse.json({ conversations: [userThread] });
        } else {
          // Guest visitor
          const guestThread = conversationList.find(c => c.id === 'chat-guest') || {
            id: 'chat-guest',
            clientEmail: '',
            clientName: 'Guest Visitor',
            company: 'Guest',
            status: 'online',
            avatar: null,
            orders: [],
            messages: [],
            unreadCount: 0,
            adminUnreadCount: 0,
            clientUnreadCount: 0,
            lastMessageTime: Date.now(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          return NextResponse.json({ conversations: [guestThread] });
        }
      }

      // For Admin: sort all customer chats by newest message time at top (WhatsApp style)
      conversationList.sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));

      return NextResponse.json({ conversations: conversationList });
    }

    if (action === 'fetchMessages') {
      if (!chatId) {
        return NextResponse.json({ error: 'Missing chatId' }, { status: 400 });
      }

      const cleanUserEmail = normalizeEmail(user?.email || emailParam || '');
      let targetEmail = cleanUserEmail;
      
      const cId = String(chatId).toLowerCase();
      if (cId.startsWith('chat-')) targetEmail = normalizeEmail(cId.replace('chat-', ''));
      else if (cId.startsWith('inbox-')) targetEmail = normalizeEmail(cId.replace('inbox-', ''));
      else if (cId.startsWith('support-')) targetEmail = normalizeEmail(cId.replace('support-', ''));
      else if (cId.startsWith('direct-')) targetEmail = normalizeEmail(cId.replace('direct-', ''));

      // Collect all possible conversation IDs matching this customer
      const targetIds = new Set([chatId, `chat-${targetEmail}`, `inbox-${targetEmail}`, `support-${targetEmail}`, `direct-${targetEmail}`]);
      if (!targetEmail) {
        targetIds.add('chat-guest');
        targetIds.add('general-support');
      }

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .in('conversation_id', Array.from(targetIds))
        .order('created_at', { ascending: true });
        
      const mappedMessages = (data || []).map(m => ({
        id: m.id,
        conversation_id: targetEmail ? `chat-${targetEmail}` : (m.conversation_id || 'chat-guest'),
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

      mappedMessages.sort((a, b) => parseMessageTime(a) - parseMessageTime(b));
      
      return NextResponse.json({ messages: mappedMessages });
    }

    if (action === 'fetchNotifications') {
      const cleanUserEmail = normalizeEmail(user?.email || emailParam || '');
      let notifQuery = supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50);

      if (!isAdmin) {
        if (cleanUserEmail) {
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
    const cleanUserEmail = normalizeEmail(user?.email || payload.clientEmail || payload.client_email || '');

    if (action === 'upsertConversation') {
      const clientEmail = normalizeEmail(payload.clientEmail || payload.client_email || cleanUserEmail);
      const canonicalId = getCanonicalChatId(clientEmail);

      const dbPayload = {
        id: canonicalId,
        client_name: payload.clientName || payload.client_name || 'Client',
        client_email: clientEmail,
        client_company: payload.company || payload.client_company || 'Studio Client',
        order_id: null,
        order_title: 'Direct WhatsApp Chat',
        avatar: payload.avatar || null,
        status: payload.status || 'online',
        unread_count: payload.unreadCount || payload.unread_count || 0,
        admin_unread_count: payload.adminUnreadCount ?? (isAdmin ? 0 : 1),
        client_unread_count: payload.clientUnreadCount ?? (isAdmin ? 1 : 0),
        updated_at: new Date().toISOString()
      };

      try {
        await supabase.from('conversations').upsert([dbPayload]);
      } catch (err) {
        console.warn('Upsert conversation error:', err.message);
      }
      
      const mappedConv = {
        id: canonicalId,
        clientName: dbPayload.client_name,
        clientEmail: dbPayload.client_email,
        company: dbPayload.client_company,
        avatar: dbPayload.avatar,
        status: dbPayload.status,
        unreadCount: isAdmin ? dbPayload.admin_unread_count : dbPayload.client_unread_count,
        adminUnreadCount: dbPayload.admin_unread_count,
        clientUnreadCount: dbPayload.client_unread_count,
        createdAt: new Date().toISOString(),
        updatedAt: dbPayload.updated_at,
        messages: payload.messages || []
      };

      return NextResponse.json({ success: true, conversation: mappedConv });
    }
    
    if (action === 'insertMessage') {
      let passedId = payload.conversation_id || '';
      let targetEmail = normalizeEmail(payload.client_email || payload.clientEmail || cleanUserEmail);
      
      if (!targetEmail) {
        const idLower = String(passedId).toLowerCase();
        if (idLower.startsWith('chat-')) targetEmail = normalizeEmail(idLower.replace('chat-', ''));
        else if (idLower.startsWith('inbox-')) targetEmail = normalizeEmail(idLower.replace('inbox-', ''));
        else if (idLower.startsWith('support-')) targetEmail = normalizeEmail(idLower.replace('support-', ''));
        else if (idLower.startsWith('direct-')) targetEmail = normalizeEmail(idLower.replace('direct-', ''));
      }

      const canonicalConvId = getCanonicalChatId(targetEmail);

      const fallbackName = user?.user_metadata?.full_name || (targetEmail ? targetEmail.split('@')[0] : 'Client');
      const finalClientName = isAdmin ? (payload.client_name || payload.clientName || 'Customer') : (payload.sender_name || payload.senderName || fallbackName);

      // Upsert conversation to keep presence synced
      try {
        await supabase.from('conversations').upsert([{
          id: canonicalConvId,
          client_name: finalClientName,
          client_email: targetEmail,
          client_company: payload.company || 'Studio Client',
          status: 'online',
          admin_unread_count: isAdmin ? 0 : 1,
          client_unread_count: isAdmin ? 1 : 0,
          updated_at: new Date().toISOString()
        }]);
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
        conversation_id: canonicalConvId,
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
      
      let finalInsertedMsg = dbPayload;
      const { data: insData, error: insError } = await supabase.from('messages').insert([dbPayload]).select();
      if (insError) {
        console.warn('[Messages API insert notice]:', insError.message, '- inserting standard core columns');
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

      // Update the conversation's updated_at and dual role unread counts
      try {
        const { data: convData } = await supabase.from('conversations').select('admin_unread_count, client_unread_count, unread_count').eq('id', canonicalConvId).maybeSingle();
        
        if (isAdmin) {
          const newClientCount = (convData?.client_unread_count || 0) + 1;
          await supabase.from('conversations')
            .update({ 
              updated_at: nowIso, 
              client_unread_count: newClientCount,
              admin_unread_count: 0,
              unread_count: 0 
            })
            .eq('id', canonicalConvId);
        } else {
          const newAdminCount = (convData?.admin_unread_count || convData?.unread_count || 0) + 1;
          await supabase.from('conversations')
            .update({ 
              updated_at: nowIso, 
              admin_unread_count: newAdminCount,
              unread_count: newAdminCount,
              client_unread_count: 0 
            })
            .eq('id', canonicalConvId);
        }
      } catch (cntErr) {
        console.warn('Conversation unread_count update notice:', cntErr.message);
      }

      return NextResponse.json({
        success: true,
        message: {
          id: finalInsertedMsg.id,
          conversation_id: canonicalConvId,
          sender: finalInsertedMsg.sender,
          senderName: finalInsertedMsg.sender_name,
          sender_name: finalInsertedMsg.sender_name,
          text: finalInsertedMsg.text,
          attachment: finalInsertedMsg.attachment,
          attachment_url: finalInsertedMsg.attachment_url || null,
          attachment_name: finalInsertedMsg.attachment_name || finalInsertedMsg.attachment || null,
          attachment_size: finalInsertedMsg.attachment_size || null,
          attachment_type: finalInsertedMsg.attachment_type || null,
          reply_to: finalInsertedMsg.reply_to || null,
          offer_id: finalInsertedMsg.offer_id || null,
          offer_data: finalInsertedMsg.offer_data || null,
          is_read: false,
          timestamp: finalInsertedMsg.timestamp || finalInsertedMsg.created_at
        }
      });
    }

    if (action === 'markAsRead') {
      const { conversation_id, role, clientEmail, client_email } = payload;
      
      if (conversation_id) {
        const nowIso = new Date().toISOString();
        let targetEmail = normalizeEmail(clientEmail || client_email || '');
        if (!targetEmail) {
          targetEmail = normalizeEmail(conversation_id.replace('chat-', '').replace('inbox-', '').replace('support-', '').replace('direct-', ''));
        }

        // Include any related order conversation IDs
        let orderIds = [];
        if (targetEmail) {
          try {
            const { data: customerOrders } = await supabase.from('orders').select('id').ilike('client_email', targetEmail);
            if (Array.isArray(customerOrders)) {
              orderIds = customerOrders.map(o => `order-${o.id}`);
            }
          } catch {}
        }

        const targetIds = Array.from(new Set([
          conversation_id,
          targetEmail ? `chat-${targetEmail}` : '',
          targetEmail ? `inbox-${targetEmail}` : '',
          targetEmail ? `support-${targetEmail}` : '',
          targetEmail ? `direct-${targetEmail}` : '',
          ...orderIds
        ].filter(Boolean)));

        const isUserAdmin = Boolean(
          isAdmin || 
          role === 'admin' || 
          payload.senderRole === 'admin' ||
          (user?.email && ['bilalbutt136@gmail.com', 'bilaldigitizing@gmail.com'].includes(user.email.toLowerCase()))
        );

        if (isUserAdmin) {
          // Admin read client's messages
          await supabase.from('conversations')
            .update({ admin_unread_count: 0, unread_count: 0, updated_at: nowIso })
            .in('id', targetIds);
          
          await supabase.from('messages')
            .update({ is_read: true })
            .in('conversation_id', targetIds)
            .neq('sender', 'admin');

          if (targetEmail) {
            await supabase.from('messages')
              .update({ is_read: true })
              .ilike('client_email', targetEmail)
              .neq('sender', 'admin');
          }
        } else {
          // Client read admin/support's messages
          await supabase.from('conversations')
            .update({ client_unread_count: 0, updated_at: nowIso })
            .in('id', targetIds);
          
          await supabase.from('messages')
            .update({ is_read: true })
            .in('conversation_id', targetIds)
            .eq('sender', 'admin');

          if (targetEmail) {
            await supabase.from('messages')
              .update({ is_read: true })
              .ilike('client_email', targetEmail)
              .eq('sender', 'admin');
          }
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
