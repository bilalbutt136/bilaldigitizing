import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../../src/lib/supabase/admin';
import { getServerAuthUser } from '../../../../src/lib/supabase/serverAuth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { user, isAdmin } = await getServerAuthUser(request);
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').toLowerCase().trim();
    const filter = searchParams.get('filter') || 'all'; // 'all' | 'unread' | 'starred'
    const rawChatType = (searchParams.get('channel') || searchParams.get('chat_type') || 'inbox').toLowerCase().trim();
    const chatType = rawChatType === 'support' ? 'support' : 'inbox'; // Strict isolation: only 'inbox' or 'support'
    const requestedEmail = searchParams.get('email')?.toLowerCase().trim();

    const supabase = createAdminClient();

    let query = supabase
      .from('conversations')
      .select('*')
      .order('last_message_at', { ascending: false });

    if (!isAdmin) {
      const authEmail = user?.email?.toLowerCase().trim();
      const clientTargetEmail = requestedEmail || authEmail;
      if (!clientTargetEmail) {
        return NextResponse.json({ conversations: [] });
      }
      query = query.ilike('client_email', clientTargetEmail);
    }

    if (filter === 'starred') {
      query = query.eq('is_starred', true);
    } else if (filter === 'unread') {
      if (isAdmin) {
        query = query.gt('unread_admin_count', 0);
      } else {
        query = query.gt('unread_client_count', 0);
      }
    }

    let { data: conversations, error } = await query;
    if (error) {
      console.warn('[Chat Conversations GET] Error:', error.message);
      conversations = [];
    }

    // If admin has no conversations yet, auto-sync from real recent orders and client directory (NO MOCK DATA)
    if (isAdmin && (!conversations || conversations.length === 0)) {
      try {
        const { data: recentOrders } = await supabase
          .from('orders')
          .select('id, client_name, client_email, client_company, service_name, created_at, status')
          .order('created_at', { ascending: false })
          .limit(10);

        if (recentOrders && recentOrders.length > 0) {
          const uniqueEmails = new Map();
          for (const ord of recentOrders) {
            const email = (ord.client_email || '').toLowerCase().trim();
            if (email && !uniqueEmails.has(email)) {
              uniqueEmails.set(email, ord);
            }
          }

          const syncRows = [];
          for (const [email, ord] of uniqueEmails.entries()) {
            const convId = `inbox-${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
            syncRows.push({
              id: convId,
              client_email: email,
              client_name: ord.client_name || email.split('@')[0] || 'Client',
              client_company: ord.client_company || '',
              order_id: ord.id ? String(ord.id) : null,
              order_title: ord.service_name || 'Embroidery Digitizing Project',
              status: 'online',
              tags: ['inbox'],
              last_message: `Order #${String(ord.id).replace(/^#+/, '')} placed for ${ord.service_name || 'Embroidery Services'}.`,
              last_message_at: ord.created_at || new Date().toISOString(),
              unread_admin_count: 0,
              unread_client_count: 0,
              is_starred: false,
              created_at: ord.created_at || new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }

          if (syncRows.length > 0) {
            await supabase.from('conversations').upsert(syncRows, { onConflict: 'id' });
            const { data: refreshed } = await supabase
              .from('conversations')
              .select('*')
              .order('last_message_at', { ascending: false });
            if (refreshed) conversations = refreshed;
          }
        }
      } catch (syncErr) {
        console.warn('[Chat Auto-Sync Notice]:', syncErr.message);
      }
    }

    // Strict channel isolation: 'support' vs 'inbox' (no 'all')
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
      // Strictly 'inbox' (inbox inquiries, order communications, custom offers)
      results = results.filter(c => 
        !(c.id || '').startsWith('support-') && 
        c.id !== 'general-support' && 
        c.id !== 'help-support' &&
        (!Array.isArray(c.tags) || !c.tags.includes('support')) &&
        !(c.order_title || '').toLowerCase().includes('support')
      );
    }

    // Deduplicate conversations by client_email so that a client never appears twice in the same channel
    const seenEmails = new Set();
    const deduplicatedResults = [];
    for (const c of results) {
      const email = (c.client_email || '').toLowerCase().trim();
      if (email) {
        if (!seenEmails.has(email)) {
          seenEmails.add(email);
          deduplicatedResults.push(c);
        }
      } else {
        deduplicatedResults.push(c);
      }
    }
    results = deduplicatedResults;

    // Apply client-side search query filtering if provided
    if (q) {
      results = results.filter(c => 
        (c.client_name || '').toLowerCase().includes(q) ||
        (c.client_email || '').toLowerCase().includes(q) ||
        (c.last_message || '').toLowerCase().includes(q) ||
        (c.order_title || '').toLowerCase().includes(q) ||
        (c.order_id || '').toLowerCase().includes(q)
      );
    }

    return NextResponse.json({ conversations: results });
  } catch (err) {
    console.error('[Chat Conversations API Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { user, isAdmin } = await getServerAuthUser(request);
    const body = await request.json();
    const { action, conversationId, isStarred, clientEmail, clientName, clientCompany, orderId, orderTitle } = body;

    const supabase = createAdminClient();

    // 1. Action: Toggle Starred Conversation
    if (action === 'toggleStar') {
      if (!conversationId) {
        return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('conversations')
        .update({ is_starred: Boolean(isStarred), updated_at: new Date().toISOString() })
        .eq('id', conversationId)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ success: true, conversation: data });
    }

    // 2. Action: Mark Conversation As Read
    if (action === 'markRead') {
      if (!conversationId) {
        return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 });
      }

      const updateData = { updated_at: new Date().toISOString() };
      if (isAdmin) {
        updateData.unread_admin_count = 0;
      } else {
        updateData.unread_client_count = 0;
      }

      await supabase.from('conversations').update(updateData).eq('id', conversationId);

      // Also mark messages as read
      const markMsgQuery = supabase
        .from('messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId);

      if (isAdmin) {
        markMsgQuery.eq('sender', 'client');
      } else {
        markMsgQuery.eq('sender', 'admin');
      }
      await markMsgQuery;

      return NextResponse.json({ success: true });
    }

    // 3. Action: Get or Create Conversation
    if (action === 'getOrCreate') {
      const email = (clientEmail || user?.email || '').toLowerCase().trim();
      if (!email) {
        return NextResponse.json({ error: 'Email is required to establish conversation thread.' }, { status: 400 });
      }

      const reqChatType = (body.chatType || body.chat_type || (conversationId && conversationId.startsWith('support-') ? 'support' : 'inbox')).toLowerCase();
      const isSupport = reqChatType === 'support' || (conversationId && (conversationId.startsWith('support-') || conversationId === 'general-support'));
      const defaultPrefix = isSupport ? 'support' : 'inbox';
      const convId = conversationId || `${defaultPrefix}-${email.replace(/[^a-zA-Z0-9]/g, '_')}`;

      // Check existing
      const { data: existing } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', convId)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ success: true, conversation: existing });
      }

      const newConv = {
        id: convId,
        client_email: email,
        client_name: clientName || email.split('@')[0] || 'Client',
        client_company: clientCompany || '',
        order_id: orderId || null,
        order_title: orderTitle || (isSupport ? '24/7 Customer Support Desk' : 'Direct Studio Communication & Offers'),
        status: 'online',
        tags: isSupport ? ['support'] : ['inbox'],
        last_message: isSupport 
          ? 'Customer support request initiated with Bilal Digitizing 24/7 Desk.'
          : 'Conversation started with Bilal Digitizing Studio.',
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
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
