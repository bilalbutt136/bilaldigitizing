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

const extractAndHydrateOffer = (m, offersMap) => {
  if (!m) return { offerId: null, offerData: null };

  let offerData = m.offer_data || m.offerData || null;
  if (typeof offerData === 'string') {
    try { offerData = JSON.parse(offerData); } catch { offerData = null; }
  }

  // 1. Check metadata
  if (!offerData && m.metadata) {
    const meta = typeof m.metadata === 'string' ? (() => { try { return JSON.parse(m.metadata); } catch { return null; } })() : m.metadata;
    if (meta?.offer_data) offerData = meta.offer_data;
    else if (meta?.offer) offerData = meta.offer;
    else if (meta?.id && String(meta.id).startsWith('off-')) offerData = meta;
  }

  // 2. Check embedded [OFFER_DATA:...] in text
  if (!offerData && m.text && m.text.includes('[OFFER_DATA:')) {
    try {
      const match = m.text.match(/\[OFFER_DATA:(\{.*?\})\]/s);
      if (match && match[1]) {
        offerData = JSON.parse(match[1]);
      }
    } catch {}
  }

  // 3. Check serialized JSON in attachment
  if (!offerData && m.attachment && typeof m.attachment === 'string') {
    const trimmed = m.attachment.trim();
    if (trimmed.startsWith('{') && (trimmed.includes('"title"') || trimmed.includes('"price"'))) {
      try {
        offerData = JSON.parse(trimmed);
      } catch {}
    }
  }

  // 4. Fallback offerId search
  let offerId = m.offer_id || m.offerId || offerData?.id || null;
  if (!offerId && m.text && m.text.includes('Custom Offer:')) {
    const idMatch = m.text.match(/off-[0-9a-z_-]+/i);
    if (idMatch) offerId = idMatch[0];
  }

  // 5. Authoritative hydration from custom_offers table
  if (offerId && offersMap && offersMap.has(offerId)) {
    const authOffer = offersMap.get(offerId);
    offerData = {
      ...(typeof offerData === 'object' && offerData ? offerData : {}),
      ...authOffer
    };
  }

  // 6. Check auto-expiry if still in pending/sent/viewed state
  if (offerData && (offerData.status === 'sent' || offerData.status === 'viewed' || offerData.status === 'pending')) {
    if (offerData.expires_at && new Date(offerData.expires_at).getTime() < Date.now()) {
      offerData.status = 'expired';
    }
  }

  return {
    offerId: offerId || offerData?.id || null,
    offerData: offerData || null
  };
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
      // Strict auth isolation: unauthenticated visitors can never access email-based threads
      const cleanUserEmail = isAdmin 
        ? normalizeEmail(emailParam || user?.email || '')
        : (user?.email ? normalizeEmail(user.email) : '');

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

      // 5. Fetch custom offers to ensure authoritative status (accepted, declined, etc.) is never overwritten
      const { data: allCustomOffers } = await supabase
        .from('custom_offers')
        .select('*');
      const rawCustomOffers = allCustomOffers || [];
      const offersMap = new Map();
      rawCustomOffers.forEach(off => {
        if (off?.id) offersMap.set(off.id, off);
      });

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

      // Helper to resolve canonical thread key and ID
      const resolveThreadKeyAndId = (convId, email, isSupport) => {
        const clean = normalizeEmail(email);
        if (clean) {
          return {
            key: `user_${clean}`,
            id: isSupport ? `support-${clean}` : `inbox-${clean}`,
            isGuest: false,
            email: clean
          };
        }

        const idStr = String(convId || '').toLowerCase().trim();
        if (idStr.startsWith('support-guest_') || idStr.startsWith('inbox-guest_')) {
          const guestSessionId = idStr.replace('support-', '').replace('inbox-', '');
          return {
            key: `guest_${guestSessionId}`,
            id: isSupport ? `support-${guestSessionId}` : `inbox-${guestSessionId}`,
            isGuest: true,
            email: ''
          };
        }

        return {
          key: isSupport ? 'support_general' : 'inbox_general',
          id: isSupport ? 'general-support' : 'inbox-guest',
          isGuest: true,
          email: ''
        };
      };

      // ----------------------------------------------------
      // A. THREAD MAPS (Strictly One Thread Per User / Guest Session)
      // ----------------------------------------------------
      const inboxThreadsMap = new Map();
      const supportThreadsMap = new Map();

      const getOrCreateThread = (convId, email, isSupport, fallbackClientName = null) => {
        const { key, id, isGuest, email: resolvedEmail } = resolveThreadKeyAndId(convId, email, isSupport);
        const targetMap = isSupport ? supportThreadsMap : inboxThreadsMap;

        if (!targetMap.has(key)) {
          const clientProfile = resolvedEmail ? clientsByEmail.get(resolvedEmail) : null;
          const clientOrders = resolvedEmail ? (ordersByEmail.get(resolvedEmail) || []) : [];

          let resolvedName = clientProfile?.name || clientProfile?.full_name;
          if (!resolvedName && clientOrders.length > 0) {
            resolvedName = clientOrders[0].client_name;
          }
          if (!resolvedName && resolvedEmail) {
            resolvedName = resolvedEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          }
          if (!resolvedName && fallbackClientName && !['Support', 'Admin', 'Studio Support', 'Master Digitizer Support'].includes(fallbackClientName)) {
            resolvedName = fallbackClientName;
          }
          if (!resolvedName) {
            resolvedName = isGuest ? 'Guest Client' : 'Customer';
          }

          targetMap.set(key, {
            id,
            clientEmail: resolvedEmail || '',
            clientName: resolvedName,
            company: clientProfile?.company || (isSupport ? 'Live Support' : 'Studio Client'),
            status: 'online',
            avatar: null,
            orders: clientOrders,
            messages: [],
            adminUnreadCount: 0,
            clientUnreadCount: 0,
            unreadCount: 0,
            isSupport,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }

        const thread = targetMap.get(key);
        // If thread currently has generic name, and we now have a real customer name, update it
        if (fallbackClientName && (!thread.clientName || thread.clientName === 'Guest Client' || thread.clientName === 'Customer') && !['Support', 'Admin', 'Studio Support', 'Master Digitizer Support'].includes(fallbackClientName)) {
          thread.clientName = fallbackClientName;
        }
        return thread;
      };

      // Seed threads from existing conversations table
      rawConvs.forEach(conv => {
        const convEmail = normalizeEmail(conv.client_email);
        const isSupport = isSupportConversation(conv.id);
        const convClientName = (!conv.client_name || ['Support', 'Admin', 'Studio Support'].includes(conv.client_name)) ? null : conv.client_name;
        getOrCreateThread(conv.id, convEmail, isSupport, convClientName);
      });

      // Distribute messages strictly to unified conversation threads
      rawMessages.forEach(m => {
        const cId = String(m.conversation_id || m.thread_id || '').toLowerCase().trim();
        const isSupport = isSupportConversation(cId);

        let matchedEmail = '';
        if (cId.startsWith('inbox-') && !cId.startsWith('inbox-guest_')) {
          matchedEmail = normalizeEmail(cId.replace('inbox-', ''));
        } else if (cId.startsWith('support-') && !cId.startsWith('support-guest_')) {
          matchedEmail = normalizeEmail(cId.replace('support-', ''));
        } else if (cId.startsWith('direct-')) {
          matchedEmail = normalizeEmail(cId.replace('direct-', ''));
        } else if (cId.startsWith('chat-')) {
          matchedEmail = normalizeEmail(cId.replace('chat-', ''));
        } else if (cId.startsWith('order-') || orderToEmailMap.has(cId)) {
          matchedEmail = orderToEmailMap.get(cId) || '';
        }

        if (!matchedEmail && m.client_email) {
          matchedEmail = normalizeEmail(m.client_email);
        }

        const clientSenderName = (m.sender !== 'admin' && m.sender_name && !['Support', 'Admin', 'Studio Support'].includes(m.sender_name))
          ? m.sender_name 
          : null;

        const thread = getOrCreateThread(cId, matchedEmail, isSupport, clientSenderName);

        const { offerId: resolvedOfferId, offerData: resolvedOfferData } = extractAndHydrateOffer(m, offersMap);

        const mappedMsg = {
          id: m.id,
          conversation_id: thread.id,
          thread_id: thread.id,
          type: m.type || (resolvedOfferId || resolvedOfferData ? 'custom_offer' : 'text'),
          metadata: resolvedOfferData ? { ...m.metadata, offer_id: resolvedOfferId, offer_data: resolvedOfferData } : (m.metadata || {}),
          sender: m.sender,
          senderName: m.sender === 'admin' ? 'Support' : (m.sender_name || thread.clientName),
          sender_name: m.sender_name,
          text: resolvedOfferData ? `📋 Custom Offer: ${resolvedOfferData.title} ($${parseFloat(resolvedOfferData.final_price || resolvedOfferData.price || 0).toFixed(2)})\n\n[OFFER_DATA:${JSON.stringify(resolvedOfferData)}]` : m.text,
          attachment: resolvedOfferData ? JSON.stringify(resolvedOfferData) : m.attachment,
          attachment_url: m.attachment_url || null,
          attachment_name: m.attachment_name || (resolvedOfferData ? `Custom Offer: ${resolvedOfferData.title}` : m.attachment) || null,
          attachment_size: m.attachment_size || null,
          attachment_type: resolvedOfferData ? 'custom_offer' : (m.attachment_type || null),
          reply_to: m.reply_to || null,
          offer_id: resolvedOfferId,
          offer_data: resolvedOfferData,
          is_read: m.is_read === true || m.is_read === 'true',
          timestamp: m.timestamp || m.created_at
        };

        // Deduplicate messages within thread using Map by ID
        const existingMsgIdx = thread.messages.findIndex(ex => 
          (ex.id && mappedMsg.id && ex.id === mappedMsg.id) ||
          (ex.text && mappedMsg.text && ex.text === mappedMsg.text && ex.sender === mappedMsg.sender && Math.abs(parseMessageTime(ex) - parseMessageTime(mappedMsg)) < 5000)
        );

        if (existingMsgIdx >= 0) {
          thread.messages[existingMsgIdx] = { ...thread.messages[existingMsgIdx], ...mappedMsg };
        } else {
          thread.messages.push(mappedMsg);
        }
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
          const userInbox = inboxConversations.find(c => c.clientEmail === cleanUserEmail) || getOrCreateThread('', cleanUserEmail, false);
          const userSupport = supportConversations.find(c => c.clientEmail === cleanUserEmail) || getOrCreateThread('', cleanUserEmail, true);
          
          if (channelParam === 'support') {
            return NextResponse.json({ conversations: [userSupport], inboxConversations: [userInbox], supportConversations: [userSupport] });
          } else if (channelParam === 'inbox') {
            return NextResponse.json({ conversations: [userInbox], inboxConversations: [userInbox], supportConversations: [userSupport] });
          }
          return NextResponse.json({ conversations: [userInbox, userSupport], inboxConversations: [userInbox], supportConversations: [userSupport] });
        } else {
          const guestSessionParam = searchParams.get('sessionId') || searchParams.get('chatId') || '';
          let guestSupport = null;
          if (guestSessionParam) {
            guestSupport = supportConversations.find(c => c.id === guestSessionParam || c.id.includes(guestSessionParam));
          }
          if (!guestSupport) {
            guestSupport = supportConversations.find(c => c.id === 'general-support') || getOrCreateThread('', '', true);
          }
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

      const cId = String(chatId).toLowerCase().trim();
      const isSupport = isSupportConversation(cId);

      let targetEmail = '';
      if (cId.startsWith('support-') && !cId.startsWith('support-guest_')) {
        targetEmail = normalizeEmail(cId.replace('support-', ''));
      } else if (cId.startsWith('inbox-') && !cId.startsWith('inbox-guest_')) {
        targetEmail = normalizeEmail(cId.replace('inbox-', ''));
      } else if (cId.startsWith('direct-')) {
        targetEmail = normalizeEmail(cId.replace('direct-', ''));
      } else if (cId.startsWith('chat-')) {
        targetEmail = normalizeEmail(cId.replace('chat-', ''));
      }

      // Security verification: non-admins cannot access other users' conversations
      if (!isAdmin) {
        if (!user) {
          const isGuestThread = cId.startsWith('support-guest_') || cId.startsWith('inbox-guest_') || cId === 'general-support' || cId === 'support-guest';
          if (!isGuestThread) {
            return NextResponse.json({ error: 'Unauthorized: Authentication required to view client messages.' }, { status: 401 });
          }
        } else {
          const authEmail = normalizeEmail(user.email);
          if (targetEmail && targetEmail !== authEmail) {
            return NextResponse.json({ error: 'Forbidden: Cannot access another user\'s messages.' }, { status: 403 });
          }
          if (!targetEmail) {
            targetEmail = authEmail;
          }
        }
      }

      let orderIds = [];
      if (targetEmail) {
        try {
          const { data: customerOrders } = await supabase.from('orders').select('id').ilike('client_email', targetEmail);
          if (Array.isArray(customerOrders)) {
            customerOrders.forEach(o => {
              const raw = String(o.id || '');
              const clean = raw.replace(/^#+/, '').replace(/^order-/, '');
              orderIds.push(raw);
              orderIds.push(`order-${raw}`);
              orderIds.push(`order-${clean}`);
              orderIds.push(`ord-${clean}`);
              orderIds.push(`#${clean}`);
            });
          }
        } catch {}
      }

      let targetIds = [chatId];
      if (targetEmail) {
        targetIds = Array.from(new Set([
          chatId,
          `support-${targetEmail}`,
          `inbox-${targetEmail}`,
          `direct-${targetEmail}`,
          `chat-${targetEmail}`,
          ...orderIds
        ]));
      } else if (cId === 'general-support' || cId === 'support-guest') {
        targetIds = ['general-support', 'support-guest'];
      }

      let rawMessages = [];
      try {
        if (targetEmail) {
          const { data: convMsgs } = await supabase
            .from('messages')
            .select('*')
            .in('conversation_id', targetIds)
            .order('created_at', { ascending: true });

          let emailMsgs = [];
          try {
            const { data: em } = await supabase
              .from('messages')
              .select('*')
              .ilike('client_email', targetEmail)
              .order('created_at', { ascending: true });
            emailMsgs = em || [];
          } catch {}

          // Also check custom offers belonging to this client to ensure offer messages are always retained
          let offerMsgList = [];
          try {
            const { data: clientOffers } = await supabase
              .from('custom_offers')
              .select('id')
              .ilike('client_email', targetEmail);
            
            if (Array.isArray(clientOffers) && clientOffers.length > 0) {
              const offerIds = clientOffers.map(o => o.id);
              const { data: offMsgs } = await supabase
                .from('messages')
                .select('*')
                .in('offer_id', offerIds);
              offerMsgList = offMsgs || [];
            }
          } catch {}

          const msgMap = new Map();
          for (const m of [...(convMsgs || []), ...emailMsgs, ...offerMsgList]) {
            // Filter out soft-deleted messages
            if (m && m.id && !m.deleted_at) msgMap.set(m.id, m);
          }
          rawMessages = Array.from(msgMap.values());
        } else {
          const { data } = await supabase
            .from('messages')
            .select('*')
            .in('conversation_id', targetIds)
            .order('created_at', { ascending: true });
          rawMessages = (data || []).filter(m => !m.deleted_at);
        }
      } catch (err) {
        console.error('[fetchMessages query error]:', err);
      }

      // Fetch custom offers to hydrate offer_data authoritatively
      let convCustomOffers = [];
      try {
        const { data: cco } = await supabase
          .from('custom_offers')
          .select('*');
        convCustomOffers = cco || [];
      } catch {}
      const convOffersMap = new Map();
      (convCustomOffers || []).forEach(off => {
        if (off?.id) convOffersMap.set(off.id, off);
      });

      const mappedMessages = (rawMessages || []).map(m => {
        const { offerId: resolvedOfferId, offerData: resolvedOfferData } = extractAndHydrateOffer(m, convOffersMap);

        // Safely parse serialized attachment if stored as JSON or direct URL
        let attachUrl = m.attachment_url || null;
        let attachName = m.attachment_name || m.attachment || null;
        let attachSize = m.attachment_size || null;
        let attachType = m.attachment_type || null;

        if (m.attachment && typeof m.attachment === 'string' && !resolvedOfferData) {
          const trimmed = m.attachment.trim();
          if (trimmed.startsWith('{') && (trimmed.includes('"url"') || trimmed.includes('"name"'))) {
            try {
              const parsed = JSON.parse(trimmed);
              if (parsed.url) attachUrl = parsed.url;
              if (parsed.name) attachName = parsed.name;
              if (parsed.size) attachSize = parsed.size;
              if (parsed.type || parsed.format) attachType = parsed.type || parsed.format;
            } catch {}
          } else if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
            attachUrl = trimmed;
            if (!attachName || attachName === trimmed) {
              attachName = decodeURIComponent(trimmed.split('/').pop()?.split('?')[0] || 'file');
            }
          }
        }

        return {
          id: m.id,
          conversation_id: m.conversation_id || m.thread_id || chatId,
          thread_id: m.thread_id || m.conversation_id || chatId,
          type: m.type || (resolvedOfferId || resolvedOfferData ? 'custom_offer' : 'text'),
          metadata: resolvedOfferData ? { ...m.metadata, offer_id: resolvedOfferId, offer_data: resolvedOfferData } : (m.metadata || {}),
          client_email: m.client_email || targetEmail || null,
          sender: m.sender,
          senderName: m.sender === 'admin' ? 'Support' : (m.sender_name || 'Client'),
          sender_name: m.sender_name,
          text: resolvedOfferData ? `📋 Custom Offer: ${resolvedOfferData.title} ($${parseFloat(resolvedOfferData.final_price || resolvedOfferData.price || 0).toFixed(2)})\n\n[OFFER_DATA:${JSON.stringify(resolvedOfferData)}]` : m.text,
          attachment: resolvedOfferData ? JSON.stringify(resolvedOfferData) : m.attachment,
          attachment_url: attachUrl,
          attachment_name: attachName || (resolvedOfferData ? `Custom Offer: ${resolvedOfferData.title}` : m.attachment) || null,
          attachment_size: attachSize,
          attachment_type: resolvedOfferData ? 'custom_offer' : (attachType || m.attachment_type || null),
          reply_to: m.reply_to || null,
          offer_id: resolvedOfferId,
          offer_data: resolvedOfferData,
          is_read: m.is_read === true || m.is_read === 'true',
          timestamp: m.timestamp || m.created_at
        };
      });

      // Ensure any custom offers for this conversation or client are always represented in messages
      const existingOfferIds = new Set(mappedMessages.map(m => m.offer_id).filter(Boolean));
      for (const [offId, authOffer] of convOffersMap.entries()) {
        if (!existingOfferIds.has(offId)) {
          const offEmail = normalizeEmail(authOffer.client_email);
          const offConvId = String(authOffer.conversation_id || authOffer.thread_id || '').toLowerCase().trim();
          const targetChatIdLower = String(chatId || '').toLowerCase().trim();
          const matchesTarget = (targetEmail && offEmail === targetEmail) ||
                                (offConvId === targetChatIdLower) ||
                                (targetIds.some(tId => tId && (offConvId === String(tId).toLowerCase().trim() || offConvId.includes(String(tId).toLowerCase().trim()))));
          if (matchesTarget) {
            const price = parseFloat(authOffer.final_price || authOffer.price || 0);
            const offerText = `📋 Custom Offer: ${authOffer.title} ($${price.toFixed(2)})\n\n[OFFER_DATA:${JSON.stringify(authOffer)}]`;
            mappedMessages.push({
              id: `msg-${offId}`,
              conversation_id: chatId,
              thread_id: chatId,
              type: 'custom_offer',
              metadata: {
                offer_id: offId,
                offer_data: authOffer
              },
              client_email: offEmail || targetEmail || null,
              sender: 'admin',
              senderName: 'Support',
              sender_name: 'Support',
              text: offerText,
              attachment: JSON.stringify(authOffer),
              attachment_name: `Custom Offer: ${authOffer.title}`,
              attachment_type: 'custom_offer',
              reply_to: null,
              offer_id: offId,
              offer_data: authOffer,
              is_read: true,
              timestamp: authOffer.created_at || new Date().toISOString()
            });
            existingOfferIds.add(offId);
          }
        }
      }

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
      let passedId = payload.conversation_id || payload.thread_id || '';
      const isSupport = isSupportConversation(passedId) || payload.isSupport === true || payload.channel === 'support';
      
      let targetEmail = normalizeEmail(payload.client_email || payload.clientEmail || (!isAdmin ? cleanUserEmail : ''));
      
      if (!targetEmail) {
        const idLower = String(passedId).toLowerCase();
        if (idLower.startsWith('support-')) targetEmail = normalizeEmail(idLower.replace('support-', ''));
        else if (idLower.startsWith('inbox-')) targetEmail = normalizeEmail(idLower.replace('inbox-', ''));
        else if (idLower.startsWith('direct-')) targetEmail = normalizeEmail(idLower.replace('direct-', ''));
        else if (idLower.startsWith('chat-')) targetEmail = normalizeEmail(idLower.replace('chat-', ''));
        else if (idLower.startsWith('order-') || idLower.startsWith('ord-')) {
          const cleanOrdId = passedId.replace(/^order-/, '').replace(/^#+/, '').trim();
          try {
            const { data: matchedOrd } = await supabase.from('orders').select('client_email').or(`id.eq.${cleanOrdId},id.eq.#${cleanOrdId}`).maybeSingle();
            if (matchedOrd?.client_email) targetEmail = normalizeEmail(matchedOrd.client_email);
          } catch {}
        }
      }

      let canonicalConvId = passedId;
      if (!canonicalConvId || canonicalConvId === 'inbox' || canonicalConvId === 'help-support' || canonicalConvId === 'support') {
        canonicalConvId = isSupport ? getCanonicalSupportId(targetEmail) : getCanonicalInboxId(targetEmail);
      }

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

      // 1. Check idempotency if idempotency_key is provided
      if (payload.idempotency_key) {
        try {
          const { data: existingMsg } = await supabase
            .from('messages')
            .select('*')
            .eq('idempotency_key', payload.idempotency_key)
            .maybeSingle();
          if (existingMsg) {
            return NextResponse.json({ success: true, is_duplicate: true, message: existingMsg });
          }
        } catch {}
      }

      // 2. Check if message with same ID already exists to prevent duplicate inserts
      if (payload.id) {
        try {
          const { data: existingMsg } = await supabase
            .from('messages')
            .select('*')
            .eq('id', payload.id)
            .maybeSingle();
          if (existingMsg) {
            return NextResponse.json({ success: true, is_duplicate: true, message: existingMsg });
          }
        } catch {}
      }

      const nowIso = new Date().toISOString();
      const dbPayload = {
        id: payload.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        idempotency_key: payload.idempotency_key || null,
        conversation_id: canonicalConvId,
        thread_id: canonicalConvId,
        type: payload.type || (payload.offer_id || payload.offer_data ? 'custom_offer' : 'text'),
        metadata: payload.metadata || {},
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
        let coreAttachment = dbPayload.attachment || dbPayload.attachment_url || null;
        if (dbPayload.attachment_url && (!coreAttachment || (typeof coreAttachment === 'string' && !coreAttachment.startsWith('http') && !coreAttachment.startsWith('{')))) {
          coreAttachment = JSON.stringify({
            url: dbPayload.attachment_url,
            name: dbPayload.attachment_name || dbPayload.attachment || 'file',
            size: dbPayload.attachment_size || null,
            type: dbPayload.attachment_type || null
          });
        }
        const corePayload = {
          id: dbPayload.id,
          conversation_id: dbPayload.conversation_id,
          sender: dbPayload.sender,
          sender_name: dbPayload.sender_name,
          text: dbPayload.text || '',
          attachment: coreAttachment,
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
          
          if (targetEmail) {
            await supabase.from('conversations')
              .update({ admin_unread_count: 0, unread_count: 0, updated_at: nowIso })
              .ilike('client_email', targetEmail);
          }
          
          await supabase.from('messages')
            .update({ is_read: true })
            .in('conversation_id', targetIds)
            .neq('sender', 'admin');

          if (targetEmail) {
            try {
              await supabase.from('messages')
                .update({ is_read: true })
                .ilike('client_email', targetEmail)
                .neq('sender', 'admin');
            } catch {}
          }
        } else {
          // Client read admin/support's messages
          await supabase.from('conversations')
            .update({ client_unread_count: 0, updated_at: nowIso })
            .in('id', targetIds);

          if (targetEmail) {
            await supabase.from('conversations')
              .update({ client_unread_count: 0, updated_at: nowIso })
              .ilike('client_email', targetEmail);
          }
          
          await supabase.from('messages')
            .update({ is_read: true })
            .in('conversation_id', targetIds)
            .eq('sender', 'admin');

          if (targetEmail) {
            try {
              await supabase.from('messages')
                .update({ is_read: true })
                .ilike('client_email', targetEmail)
                .eq('sender', 'admin');
            } catch {}
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
        recipient_email: notif.recipient_email || notif.recipientEmail || notif.client_email || notif.clientEmail || null,
        title: notif.title || 'Notification',
        message: notif.message || notif.text || '',
        type: notif.type || 'info',
        link: notif.link || notif.url || null,
        order_id: notif.order_id || notif.orderId || null,
        read: false,
        created_at: nowIso
      };

      try {
        await supabase.from('notifications').insert([notifRow]);
      } catch (err) {
        console.warn('Create notification notice:', err.message);
      }

      return NextResponse.json({ success: true, notification: notifRow });
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

    if (action === 'deleteMessage' || action === 'softDeleteMessage') {
      const { messageId } = payload;
      if (!messageId) {
        return NextResponse.json({ error: 'Missing messageId' }, { status: 400 });
      }

      const nowIso = new Date().toISOString();
      let query = supabase.from('messages').update({ deleted_at: nowIso }).eq('id', messageId);
      if (!isAdmin && user?.email) {
        query = query.eq('sender', 'client');
      }

      const { error: delErr } = await query;
      if (delErr) {
        return NextResponse.json({ error: delErr.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, messageId, deleted_at: nowIso });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[Messages API POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
