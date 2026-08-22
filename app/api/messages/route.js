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

const isSupportConversation = (id) => {
  if (!id) return false;
  const lower = String(id).toLowerCase().trim();
  return lower === 'general-support' || lower === 'support-guest' || lower === 'help-support' || lower.startsWith('support-');
};

const getCanonicalInboxId = (email) => {
  const clean = normalizeEmail(email);
  return clean ? `inbox-${clean}` : 'inbox-guest';
};

const getCanonicalSupportId = (email) => {
  const clean = normalizeEmail(email);
  return clean ? `support-${clean}` : 'support-guest';
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
    const channelParam = searchParams.get('channel'); // 'inbox' | 'support'
    const emailParam = normalizeEmail(searchParams.get('clientEmail') || searchParams.get('email') || '');
    const supabase = createAdminClient();

    if (action === 'fetchConversations') {
      const cleanUserEmail = normalizeEmail(user?.email || emailParam || '');

      // 1. Fetch all messages
      const { data: allMessages } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });
      const rawMessages = allMessages || [];

      // 2. Fetch all orders (for mapping client details & order discussions)
      const { data: allOrders } = await supabase
        .from('orders')
        .select('id, title, client_name, client_email, service_category, service_type, status, price, created_at');
      const rawOrders = allOrders || [];

      // 3. Fetch all client profiles
      const { data: allClients } = await supabase
        .from('clients')
        .select('name, full_name, email, company, role');
      const rawClients = allClients || [];

      // 4. Fetch existing conversations table records
      const { data: allConvs } = await supabase
        .from('conversations')
        .select('*');
      const rawConvs = allConvs || [];

      // Map helpers
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

      const clientsByEmail = new Map();
      rawClients.forEach(c => {
        const cEmail = normalizeEmail(c.email);
        if (cEmail) clientsByEmail.set(cEmail, c);
      });

      // ----------------------------------------------------
      // A. BUILD STRICT INBOX CONVERSATIONS (One per customer)
      // ----------------------------------------------------
      const inboxThreadsMap = new Map();

      const getOrCreateInboxThread = (email, fallbackName = 'Customer') => {
        const cleanEmail = normalizeEmail(email);
        const key = cleanEmail || 'guest';
        if (!inboxThreadsMap.has(key)) {
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

          inboxThreadsMap.set(key, {
            id: cleanEmail ? `inbox-${cleanEmail}` : 'inbox-guest',
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
            isSupport: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
        return inboxThreadsMap.get(key);
      };

      // ----------------------------------------------------
      // B. BUILD STRICT SUPPORT CONVERSATIONS (Support Queue)
      // ----------------------------------------------------
      const supportThreadsMap = new Map();

      const getOrCreateSupportThread = (email, fallbackName = 'Support User') => {
        const cleanEmail = normalizeEmail(email);
        const key = cleanEmail || 'support-guest';
        if (!supportThreadsMap.has(key)) {
          const clientProfile = cleanEmail ? clientsByEmail.get(cleanEmail) : null;
          const clientOrders = cleanEmail ? (ordersByEmail.get(cleanEmail) || []) : [];
          
          let resolvedName = clientProfile?.name || clientProfile?.full_name;
          if (!resolvedName && clientOrders.length > 0) {
            resolvedName = clientOrders[0].client_name;
          }
          if (!resolvedName && cleanEmail) {
            resolvedName = cleanEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          }
          if (!resolvedName) resolvedName = fallbackName || (cleanEmail ? 'Customer' : 'Guest Visitor');

          supportThreadsMap.set(key, {
            id: cleanEmail ? `support-${cleanEmail}` : 'support-guest',
            clientEmail: cleanEmail,
            clientName: resolvedName,
            company: clientProfile?.company || 'Help & Support',
            status: 'online',
            avatar: null,
            orders: clientOrders,
            messages: [],
            adminUnreadCount: 0,
            clientUnreadCount: 0,
            unreadCount: 0,
            isSupport: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
        return supportThreadsMap.get(key);
      };

      // Seed threads from existing conversations table
      rawConvs.forEach(conv => {
        const convEmail = normalizeEmail(conv.client_email) || (conv.id?.startsWith('inbox-') ? normalizeEmail(conv.id.replace('inbox-', '')) : (conv.id?.startsWith('support-') ? normalizeEmail(conv.id.replace('support-', '')) : (conv.id?.startsWith('chat-') ? normalizeEmail(conv.id.replace('chat-', '')) : '')));
        if (isSupportConversation(conv.id)) {
          const thread = getOrCreateSupportThread(convEmail, conv.client_name);
          if (conv.client_name && !['Customer', 'Client', 'Guest Client'].includes(conv.client_name)) {
            thread.clientName = conv.client_name;
          }
        } else {
          const thread = getOrCreateInboxThread(convEmail, conv.client_name);
          if (conv.client_name && !['Customer', 'Client', 'Guest Client'].includes(conv.client_name)) {
            thread.clientName = conv.client_name;
          }
        }
      });

      // Distribute messages strictly according to their channel
      rawMessages.forEach(m => {
        const cId = String(m.conversation_id || '').toLowerCase();
        const isSupport = isSupportConversation(cId);

        let matchedEmail = '';
        if (cId.startsWith('inbox-')) matchedEmail = normalizeEmail(cId.replace('inbox-', ''));
        else if (cId.startsWith('support-')) matchedEmail = normalizeEmail(cId.replace('support-', ''));
        else if (cId.startsWith('direct-')) matchedEmail = normalizeEmail(cId.replace('direct-', ''));
        else if (cId.startsWith('chat-')) matchedEmail = normalizeEmail(cId.replace('chat-', ''));
        else if (cId.startsWith('order-') || orderToEmailMap.has(cId)) {
          matchedEmail = orderToEmailMap.get(cId) || '';
        }

        if (!matchedEmail && m.client_email) {
          matchedEmail = normalizeEmail(m.client_email);
        }

        const thread = isSupport 
          ? getOrCreateSupportThread(matchedEmail, m.sender_name)
          : getOrCreateInboxThread(matchedEmail, m.sender_name);

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
          is_read: m.is_read === true || m.is_read === 'true',
          timestamp: m.timestamp || m.created_at
        };

        thread.messages.push(mappedMsg);
      });

      // Finalize and sort lists
      const finalizeThreads = (threadsMap) => {
        return Array.from(threadsMap.values()).map(thread => {
          thread.messages.sort((a, b) => parseMessageTime(a) - parseMessageTime(b));
          const lastMsg = thread.messages[thread.messages.length - 1];
          const lastTime = lastMsg ? parseMessageTime(lastMsg) : new Date(thread.updatedAt).getTime();
          
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
        }).sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));
      };

      const inboxConversations = finalizeThreads(inboxThreadsMap);
      const supportConversations = finalizeThreads(supportThreadsMap);

      // Return per-user or admin data
      if (!isAdmin) {
        if (cleanUserEmail) {
          const userInbox = inboxConversations.find(c => c.clientEmail === cleanUserEmail) || getOrCreateInboxThread(cleanUserEmail);
          const userSupport = supportConversations.find(c => c.clientEmail === cleanUserEmail) || getOrCreateSupportThread(cleanUserEmail);
          
          if (channelParam === 'support') {
            return NextResponse.json({ conversations: [userSupport], inboxConversations: [userInbox], supportConversations: [userSupport] });
          } else if (channelParam === 'inbox') {
            return NextResponse.json({ conversations: [userInbox], inboxConversations: [userInbox], supportConversations: [userSupport] });
          }
          return NextResponse.json({ conversations: [userInbox, userSupport], inboxConversations: [userInbox], supportConversations: [userSupport] });
        } else {
          const guestSupport = supportConversations.find(c => c.id === 'support-guest') || getOrCreateSupportThread('');
          return NextResponse.json({ conversations: [guestSupport], inboxConversations: [], supportConversations: [guestSupport] });
        }
      }

      // For Admin
      let combinedList = [...inboxConversations, ...supportConversations];
      if (channelParam === 'inbox') combinedList = inboxConversations;
      else if (channelParam === 'support') combinedList = supportConversations;

      return NextResponse.json({
        conversations: combinedList,
        inboxConversations,
        supportConversations
      });
    }

    if (action === 'fetchMessages') {
      if (!chatId) {
        return NextResponse.json({ error: 'Missing chatId' }, { status: 400 });
      }

      const cleanUserEmail = normalizeEmail(user?.email || emailParam || '');
      let targetEmail = cleanUserEmail;
      
      const cId = String(chatId).toLowerCase();
      const isSupport = isSupportConversation(cId);

      if (cId.startsWith('support-')) targetEmail = normalizeEmail(cId.replace('support-', ''));
      else if (cId.startsWith('inbox-')) targetEmail = normalizeEmail(cId.replace('inbox-', ''));
      else if (cId.startsWith('direct-')) targetEmail = normalizeEmail(cId.replace('direct-', ''));
      else if (cId.startsWith('chat-')) targetEmail = normalizeEmail(cId.replace('chat-', ''));

      let orderIds = [];
      if (targetEmail) {
        try {
          const { data: customerOrders } = await supabase.from('orders').select('id').ilike('client_email', targetEmail);
          if (Array.isArray(customerOrders)) {
            orderIds = customerOrders.map(o => `order-${o.id}`);
          }
        } catch {}
      }

      // Query all related conversation IDs for this customer
      const targetIds = Array.from(new Set([
        chatId,
        targetEmail ? `support-${targetEmail}` : '',
        targetEmail ? `inbox-${targetEmail}` : '',
        targetEmail ? `direct-${targetEmail}` : '',
        targetEmail ? `chat-${targetEmail}` : '',
        'general-support',
        'support-guest',
        'inbox-guest',
        'inbox-client',
        ...orderIds
      ].filter(Boolean)));

      let msgQuery = supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (targetEmail) {
        msgQuery = msgQuery.or(`conversation_id.in.(${targetIds.map(id => `"${id}"`).join(',')}),client_email.ilike.${targetEmail}`);
      } else {
        msgQuery = msgQuery.in('conversation_id', targetIds);
      }

      const { data } = await msgQuery;

      const mappedMessages = (data || []).map(m => ({
        id: m.id,
        conversation_id: m.conversation_id || (isSupport ? (targetEmail ? `support-${targetEmail}` : 'support-guest') : (targetEmail ? `inbox-${targetEmail}` : 'inbox-client')),
        client_email: m.client_email || targetEmail || null,
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
        is_read: m.is_read === true || m.is_read === 'true',
        timestamp: m.timestamp || m.created_at
      }));

      mappedMessages.sort((a, b) => parseMessageTime(a) - parseMessageTime(b));
      
      return NextResponse.json({ messages: mappedMessages });
    }

    if (action === 'fetchNotifications') {
      const cleanUserEmail = normalizeEmail(user?.email || emailParam || '');
      let notifQuery = supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(60);

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

      const mappedNotifications = (notifData || []).map(n => ({
        id: n.id,
        title: n.title || 'Notification',
        message: n.message || n.description || '',
        type: n.type || 'info',
        link: n.link || null,
        order_id: n.order_id || n.orderId || null,
        orderId: n.order_id || n.orderId || null,
        recipient_role: n.recipient_role || 'client',
        recipient_email: n.recipient_email || null,
        read: n.read === true || n.is_read === true,
        is_read: n.read === true || n.is_read === true,
        timestamp: n.created_at || n.timestamp || new Date().toISOString(),
        created_at: n.created_at || n.timestamp || new Date().toISOString()
      }));

      return NextResponse.json({ notifications: mappedNotifications });
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
      const isSupport = isSupportConversation(payload.id);
      const canonicalId = isSupport ? getCanonicalSupportId(clientEmail) : getCanonicalInboxId(clientEmail);

      const dbPayload = {
        id: canonicalId,
        client_name: payload.clientName || payload.client_name || 'Client',
        client_email: clientEmail,
        client_company: payload.company || payload.client_company || 'Studio Client',
        order_id: null,
        order_title: isSupport ? 'Live Customer Support' : 'Customer Inbox',
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
        isSupport,
        createdAt: new Date().toISOString(),
        updatedAt: dbPayload.updated_at,
        messages: payload.messages || []
      };

      return NextResponse.json({ success: true, conversation: mappedConv });
    }
    
    if (action === 'insertMessage') {
      let passedId = payload.conversation_id || '';
      const isSupport = isSupportConversation(passedId) || payload.isSupport === true || payload.channel === 'support';
      
      let targetEmail = normalizeEmail(payload.client_email || payload.clientEmail || cleanUserEmail);
      
      if (!targetEmail) {
        const idLower = String(passedId).toLowerCase();
        if (idLower.startsWith('support-')) targetEmail = normalizeEmail(idLower.replace('support-', ''));
        else if (idLower.startsWith('inbox-')) targetEmail = normalizeEmail(idLower.replace('inbox-', ''));
        else if (idLower.startsWith('direct-')) targetEmail = normalizeEmail(idLower.replace('direct-', ''));
        else if (idLower.startsWith('chat-')) targetEmail = normalizeEmail(idLower.replace('chat-', ''));
      }

      const canonicalConvId = isSupport ? getCanonicalSupportId(targetEmail) : getCanonicalInboxId(targetEmail);

      const fallbackName = user?.user_metadata?.full_name || (targetEmail ? targetEmail.split('@')[0] : 'Client');
      const finalClientName = isAdmin ? (payload.client_name || payload.clientName || 'Customer') : (payload.sender_name || payload.senderName || fallbackName);

      // Upsert conversation to keep presence synced
      try {
        await supabase.from('conversations').upsert([{
          id: canonicalConvId,
          client_name: finalClientName,
          client_email: targetEmail,
          client_company: payload.company || (isSupport ? 'Customer Support' : 'Studio Client'),
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
        client_email: targetEmail || null,
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
          isSupport,
          timestamp: finalInsertedMsg.timestamp || finalInsertedMsg.created_at
        }
      });
    }

    if (action === 'markAsRead') {
      const { conversation_id, role, clientEmail, client_email } = payload;
      
      if (conversation_id) {
        const nowIso = new Date().toISOString();
        const isSupport = isSupportConversation(conversation_id);
        let targetEmail = normalizeEmail(clientEmail || client_email || '');
        if (!targetEmail) {
          targetEmail = normalizeEmail(conversation_id.replace('support-', '').replace('inbox-', '').replace('direct-', '').replace('chat-', ''));
        }

        let targetIds = [];

        if (isSupport) {
          targetIds = Array.from(new Set([
            conversation_id,
            targetEmail ? `support-${targetEmail}` : '',
            'general-support',
            'support-guest'
          ].filter(Boolean)));
        } else {
          let orderIds = [];
          if (targetEmail) {
            try {
              const { data: customerOrders } = await supabase.from('orders').select('id').ilike('client_email', targetEmail);
              if (Array.isArray(customerOrders)) {
                orderIds = customerOrders.map(o => `order-${o.id}`);
              }
            } catch {}
          }

          targetIds = Array.from(new Set([
            conversation_id,
            targetEmail ? `inbox-${targetEmail}` : '',
            targetEmail ? `direct-${targetEmail}` : '',
            targetEmail ? `chat-${targetEmail}` : '',
            ...orderIds
          ].filter(Boolean)));
        }

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
        } else {
          // Client read admin/support's messages
          await supabase.from('conversations')
            .update({ client_unread_count: 0, updated_at: nowIso })
            .in('id', targetIds);
          
          await supabase.from('messages')
            .update({ is_read: true })
            .in('conversation_id', targetIds)
            .eq('sender', 'admin');
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
      const targetId = payload.notification_id || payload.id || payload.notificationId;
      if (targetId) {
        const nowIso = new Date().toISOString();
        try {
          await supabase
            .from('notifications')
            .update({ read: true, is_read: true, updated_at: nowIso })
            .eq('id', targetId);
        } catch {
          try {
            await supabase
              .from('notifications')
              .update({ read: true, updated_at: nowIso })
              .eq('id', targetId);
          } catch {}
        }
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'markAllNotificationsRead') {
      const cleanUserEmail = normalizeEmail(user?.email || payload.clientEmail || payload.client_email || '');
      const nowIso = new Date().toISOString();

      try {
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
        } else {
          await supabase
            .from('notifications')
            .update({ read: true, updated_at: nowIso })
            .eq('recipient_role', 'client');
        }
      } catch (err) {
        console.warn('markAllNotificationsRead DB notice:', err.message);
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[Messages API POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
