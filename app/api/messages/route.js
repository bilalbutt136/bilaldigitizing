import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../src/lib/supabase/admin';
import { getServerAuthUser } from '../../../src/lib/supabase/serverAuth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { user, isAdmin } = await getServerAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const chatId = searchParams.get('chatId');
    const supabase = createAdminClient();
    const cleanUserEmail = user.email.toLowerCase().trim();

    if (action === 'fetchConversations') {
      let convQuery = supabase.from('conversations').select('*').order('updated_at', { ascending: false });
      
      // If not an admin, filter conversations strictly to this customer's email
      if (!isAdmin) {
        convQuery = convQuery.ilike('client_email', cleanUserEmail);
      }

      const { data: convData, error: convError } = await convQuery;
      if (convError) throw convError;

      const conversationIds = (convData || []).map(c => c.id);
      
      let messagesData = [];
      if (conversationIds.length > 0) {
        const { data: mData, error: msgError } = await supabase
          .from('messages')
          .select('*')
          .in('conversation_id', conversationIds)
          .order('created_at', { ascending: true });
        if (msgError) throw msgError;
        messagesData = mData || [];
      }

      const conversations = (convData || []).map(conv => {
        const mappedMessages = messagesData
          .filter(m => m.conversation_id === conv.id)
          .map(m => ({
            id: m.id,
            sender: m.sender,
            senderName: m.sender_name,
            sender_name: m.sender_name,
            text: m.text,
            attachment: m.attachment,
            timestamp: m.timestamp || m.created_at
          }));

        return {
          id: conv.id,
          clientName: conv.client_name,
          clientEmail: conv.client_email,
          company: conv.client_company,
          orderId: conv.order_id,
          orderTitle: conv.order_title,
          avatar: conv.avatar,
          status: conv.status,
          unreadCount: conv.unread_count,
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

      // Check ownership if not admin
      if (!isAdmin) {
        const { data: convCheck } = await supabase
          .from('conversations')
          .select('client_email')
          .eq('id', chatId)
          .maybeSingle();

        if (convCheck && convCheck.client_email?.toLowerCase().trim() !== cleanUserEmail) {
          return NextResponse.json({ error: 'Forbidden: Access to this conversation is restricted.' }, { status: 403 });
        }
      }

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', chatId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      
      const mappedMessages = (data || []).map(m => ({
        id: m.id,
        sender: m.sender,
        senderName: m.sender_name,
        sender_name: m.sender_name,
        text: m.text,
        attachment: m.attachment,
        timestamp: m.timestamp || m.created_at
      }));
      
      return NextResponse.json({ messages: mappedMessages });
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
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }

    const cleanUserEmail = user.email.toLowerCase().trim();
    const data = await request.json();
    const { action, payload } = data;
    const supabase = createAdminClient();

    if (action === 'upsertConversation') {
      const clientEmail = (payload.clientEmail || payload.client_email || cleanUserEmail).toLowerCase().trim();
      
      // Non-admins can only create/update their own conversation
      if (!isAdmin && clientEmail !== cleanUserEmail) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const dbPayload = {
        id: payload.id,
        client_name: payload.clientName || payload.client_name,
        client_email: clientEmail,
        client_company: payload.company || payload.client_company,
        order_id: payload.orderId || payload.order_id,
        order_title: payload.orderTitle || payload.order_title,
        avatar: payload.avatar,
        status: payload.status || 'online',
        unread_count: payload.unreadCount || payload.unread_count || 0
      };

      const { data: convData, error } = await supabase.from('conversations').upsert([dbPayload]).select();
      if (error) throw error;
      
      const conv = convData[0];
      const mappedConv = {
        id: conv.id,
        clientName: conv.client_name,
        clientEmail: conv.client_email,
        company: conv.client_company,
        orderId: conv.order_id,
        orderTitle: conv.order_title,
        avatar: conv.avatar,
        status: conv.status,
        unreadCount: conv.unread_count,
        createdAt: conv.created_at,
        updatedAt: conv.updated_at,
        messages: payload.messages || []
      };

      return NextResponse.json({ success: true, conversation: mappedConv });
    }
    
    if (action === 'insertMessage') {
      const convId = payload.conversation_id || 'general-support';
      const rawOrderId = payload.order_id || (convId.startsWith('order-') ? convId.replace('order-', '') : null);
      const isOrder = Boolean(rawOrderId);

      // Verify conversation ownership if caller is client
      if (!isAdmin) {
        const { data: convRecord } = await supabase.from('conversations').select('client_email').eq('id', convId).maybeSingle();
        if (convRecord && convRecord.client_email?.toLowerCase().trim() !== cleanUserEmail) {
          return NextResponse.json({ error: 'Forbidden: Cannot post to another client conversation.' }, { status: 403 });
        }
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

          const finalClientName = (isAdmin ? 'Admin' : (payload.sender_name || payload.senderName || user.user_metadata?.full_name || 'Client'));
          const finalClientEmail = isAdmin ? (orderInfo?.client_email || 'client@studio.com') : cleanUserEmail;
          const finalOrderTitle = orderInfo?.title || payload.order_title || payload.orderTitle || (isOrder ? `Order #${rawOrderId}` : 'Direct Support');

          await supabase.from('conversations').insert([{
            id: convId,
            order_id: rawOrderId,
            order_title: finalOrderTitle,
            client_name: finalClientName,
            client_email: finalClientEmail,
            client_company: payload.company || 'Studio Client',
            status: 'online',
            unread_count: 0,
            updated_at: new Date().toISOString()
          }]);
        }
      } catch (convUpsertErr) {
        console.warn('Conversation upsert notice:', convUpsertErr);
      }

      // Determine sender role safely on the server
      const actualSender = isAdmin ? 'admin' : 'client';
      const actualSenderName = isAdmin 
        ? (payload.sender_name || 'Studio Administrator')
        : (user.user_metadata?.full_name || payload.sender_name || 'Client');

      const dbPayload = {
        id: payload.id || `msg-${Date.now()}`,
        conversation_id: convId,
        sender: actualSender,
        sender_name: actualSenderName,
        text: payload.text || '',
        attachment: payload.attachment || null,
        timestamp: payload.timestamp || new Date().toISOString()
      };
      
      const { error } = await supabase.from('messages').insert([dbPayload]);
      if (error) {
        console.error('[Messages API insert error]:', error);
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
            attachment: dbPayload.attachment
          }]);
        } catch (omErr) {
          console.warn('order_messages mirror notice:', omErr);
        }
      }

      // Update the conversation's updated_at and unread count
      if (!isAdmin) {
        const { data: convData } = await supabase.from('conversations').select('unread_count').eq('id', convId).single();
        const newCount = convData ? (convData.unread_count || 0) + 1 : 1;
        await supabase.from('conversations')
          .update({ updated_at: new Date().toISOString(), unread_count: newCount })
          .eq('id', convId);
      } else {
        await supabase.from('conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', convId);
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'markAsRead') {
      const { conversation_id } = payload;
      
      if (conversation_id) {
        const { error } = await supabase.from('conversations')
          .update({ unread_count: 0 })
          .eq('id', conversation_id);
        if (error) {
          console.warn('[Messages API markAsRead warning]:', error);
        }
      }
      
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[Messages API POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
