import { withApiObservability } from '../../../../src/lib/observability/apiObservability.js';
import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../../src/lib/supabase/admin';
import { getServerAuthUser } from '../../../../src/lib/supabase/serverAuth';
import { canAccessConversation } from '../../../../src/lib/chat/authorization';
import { enforceApiBurstLimit } from '../../../../src/lib/apiBurstGuard.js';

export const dynamic = 'force-dynamic';

async function GET_impl(request) {
  const burstResponse = enforceApiBurstLimit(request, 'chat-conversations-get', 120, 60_000);
  if (burstResponse) return burstResponse;

  try {
    const { user, isAdmin } = await getServerAuthUser(request);
    if (!user?.email) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').toLowerCase().trim();
    const filter = searchParams.get('filter') || 'all';
    const rawChatType = (searchParams.get('channel') || searchParams.get('chat_type') || 'inbox').toLowerCase().trim();
    const chatType = rawChatType === 'support' ? 'support' : 'inbox';
    const requestedEmail = searchParams.get('email')?.toLowerCase().trim();

    const supabase = createAdminClient();
    let query = supabase
      .from('conversations')
      .select('*')
      .order('last_message_at', { ascending: false })
      .limit(500);

    if (isAdmin) {
      if (requestedEmail) query = query.ilike('client_email', requestedEmail);
    } else {
      query = query.ilike('client_email', user.email.toLowerCase().trim());
    }

    if (filter === 'starred') {
      query = query.eq('is_starred', true);
    } else if (filter === 'unread') {
      query = isAdmin
        ? query.gt('unread_admin_count', 0)
        : query.gt('unread_client_count', 0);
    }

    let { data: conversations, error } = await query;
    if (error) {
      console.warn('[Chat Conversations GET] Error:', error.message);
      conversations = [];
    }

    // Admin-only bootstrap from existing studio orders when the inbox is empty.
    if (isAdmin && !requestedEmail && (!conversations || conversations.length === 0)) {
      try {
        const { data: recentOrders } = await supabase
          .from('orders')
          .select('id, client_name, client_email, client_company, service_name, created_at, status')
          .order('created_at', { ascending: false })
          .limit(10);

        if (recentOrders?.length) {
          const uniqueEmails = new Map();
          for (const ord of recentOrders) {
            const email = (ord.client_email || '').toLowerCase().trim();
            if (email && !uniqueEmails.has(email)) uniqueEmails.set(email, ord);
          }

          const syncRows = [];
          for (const [email, ord] of uniqueEmails.entries()) {
            syncRows.push({
              id: `inbox-${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
              client_email: email,
              client_name: ord.client_name || email.split('@')[0] || 'Client',
              client_company: ord.client_company || '',
              order_id: ord.id ? String(ord.id) : null,
              order_title: ord.service_name || 'Embroidery Digitizing Project',
              status: 'offline',
              tags: ['inbox'],
              last_message: `Order #${String(ord.id).replace(/^#+/, '')} placed for ${ord.service_name || 'Embroidery Services'}.`,
              last_message_at: ord.created_at || new Date().toISOString(),
              unread_admin_count: 0,
              unread_client_count: 0,
              is_starred: false,
              created_at: ord.created_at || new Date().toISOString(),
              last_seen_at: ord.created_at || new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }

          if (syncRows.length) {
            await supabase.from('conversations').upsert(syncRows, { onConflict: 'id' });
            const { data: refreshed } = await supabase
              .from('conversations')
              .select('*')
              .order('last_message_at', { ascending: false })
              .limit(500);
            if (refreshed) conversations = refreshed;
          }
        }
      } catch (syncErr) {
        console.warn('[Chat Auto-Sync Notice]:', syncErr.message);
      }
    }

    let results = conversations || [];
    if (chatType === 'support') {
      results = results.filter(c =>
        (c.id || '').startsWith('support-') ||
        c.id === 'general-support' ||
        c.id === 'help-support' ||
        (Array.isArray(c.tags) && c.tags.includes('support')) ||
        (c.order_title || '').toLowerCase().includes('support')
      );
    } else {
      results = results.filter(c =>
        !(c.id || '').startsWith('support-') &&
        c.id !== 'general-support' &&
        c.id !== 'help-support' &&
        (!Array.isArray(c.tags) || !c.tags.includes('support')) &&
        !(c.order_title || '').toLowerCase().includes('support')
      );
    }

    const seenEmails = new Set();
    const deduplicatedResults = [];
    for (const c of results) {
      const email = (c.client_email || '').toLowerCase().trim();
      if (!email || !seenEmails.has(email)) {
        if (email) seenEmails.add(email);
        deduplicatedResults.push(c);
      }
    }
    results = deduplicatedResults;

    if (q) {
      results = results.filter(c =>
        (c.client_name || '').toLowerCase().includes(q) ||
        (c.client_email || '').toLowerCase().includes(q) ||
        (c.last_message || '').toLowerCase().includes(q) ||
        (c.order_title || '').toLowerCase().includes(q) ||
        (c.order_id || '').toLowerCase().includes(q)
      );
    }

    const nowMs = Date.now();
    const sanitizedResults = results.map(c => {
      let isOnline = c.status === 'online';
      if (isOnline) {
        const lastActiveTime = c.last_seen_at || c.last_message_at || c.updated_at;
        if (!lastActiveTime || nowMs - new Date(lastActiveTime).getTime() > 2.5 * 60 * 1000) {
          isOnline = false;
        }
      }
      return { ...c, status: isOnline ? 'online' : 'offline', is_online: isOnline };
    });

    return NextResponse.json({ conversations: sanitizedResults });
  } catch (err) {
    console.error('[Chat Conversations API Error]:', err);
    return NextResponse.json({ error: 'Unable to load conversations.' }, { status: 500 });
  }
}

async function POST_impl(request) {
  const burstResponse = enforceApiBurstLimit(request, 'chat-conversations-post', 60, 60_000);
  if (burstResponse) return burstResponse;

  try {
    const { user, isAdmin } = await getServerAuthUser(request);
    if (!user?.email) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const {
      action,
      conversationId,
      isStarred,
      clientEmail,
      clientName,
      clientCompany,
      orderId,
      orderTitle
    } = body;

    const supabase = createAdminClient();

    if (action === 'toggleStar') {
      if (!isAdmin) {
        return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
      }
      if (!conversationId) {
        return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('conversations')
        .update({ is_starred: Boolean(isStarred), updated_at: new Date().toISOString() })
        .eq('id', conversationId)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true, conversation: data });
    }

    if (action === 'markRead') {
      if (!conversationId) {
        return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 });
      }

      if (!(await canAccessConversation(supabase, { user, isAdmin }, conversationId))) {
        return NextResponse.json({ error: 'Conversation access denied.' }, { status: 403 });
      }

      const updateData = { updated_at: new Date().toISOString() };
      if (isAdmin) updateData.unread_admin_count = 0;
      else updateData.unread_client_count = 0;

      await supabase.from('conversations').update(updateData).eq('id', conversationId);

      let markMsgQuery = supabase
        .from('messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId);

      markMsgQuery = isAdmin
        ? markMsgQuery.eq('sender', 'client')
        : markMsgQuery.eq('sender', 'admin');
      await markMsgQuery;

      return NextResponse.json({ success: true });
    }

    if (action === 'getOrCreate') {
      const authEmail = user.email.toLowerCase().trim();
      const requestedClientEmail = String(clientEmail || '').toLowerCase().trim();

      if (!isAdmin && requestedClientEmail && requestedClientEmail !== authEmail) {
        return NextResponse.json({ error: 'Cannot create a conversation for another account.' }, { status: 403 });
      }

      const email = isAdmin ? requestedClientEmail : authEmail;
      if (!email) {
        return NextResponse.json({ error: 'Client email is required.' }, { status: 400 });
      }

      const reqChatType = String(
        body.chatType ||
        body.chat_type ||
        (conversationId?.startsWith('support-') ? 'support' : 'inbox')
      ).toLowerCase();
      const isSupport = reqChatType === 'support';
      const defaultPrefix = isSupport ? 'support' : 'inbox';
      const expectedClientConversationId = `${defaultPrefix}-${email.replace(/[^a-zA-Z0-9]/g, '_')}`;

      if (!isAdmin && conversationId && conversationId !== expectedClientConversationId) {
        return NextResponse.json({ error: 'Conversation access denied.' }, { status: 403 });
      }

      const convId = isAdmin
        ? (conversationId || expectedClientConversationId)
        : expectedClientConversationId;

      const { data: existing, error: existingError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', convId)
        .maybeSingle();

      if (existingError) {
        return NextResponse.json({ error: 'Unable to check conversation.' }, { status: 500 });
      }

      if (existing) {
        if (!isAdmin && String(existing.client_email || '').toLowerCase().trim() !== authEmail) {
          return NextResponse.json({ error: 'Conversation access denied.' }, { status: 403 });
        }
        return NextResponse.json({ success: true, conversation: existing });
      }

      const newConv = {
        id: convId,
        client_email: email,
        client_name: clientName || email.split('@')[0] || 'Client',
        client_company: clientCompany || '',
        order_id: isAdmin ? (orderId || null) : null,
        order_title: isAdmin && orderTitle
          ? orderTitle
          : (isSupport ? '24/7 Customer Support Desk' : 'Direct Studio Communication & Offers'),
        status: 'offline',
        tags: isSupport ? ['support'] : ['inbox'],
        last_message: isSupport
          ? 'Customer support request initiated with BDigitizing 24/7 Desk.'
          : 'Conversation started with BDigitizing Studio.',
        last_message_at: new Date().toISOString(),
        unread_admin_count: 0,
        unread_client_count: 0,
        is_starred: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: created, error: createErr } = await supabase
        .from('conversations')
        .insert([newConv])
        .select()
        .single();

      if (createErr) {
        return NextResponse.json({ error: createErr.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, conversation: created });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('[Chat Conversations POST Error]:', err);
    return NextResponse.json({ error: 'Unable to update conversation.' }, { status: 500 });
  }
}

export const GET = withApiObservability(GET_impl);
export const POST = withApiObservability(POST_impl);
