import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../src/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const chatId = searchParams.get('chatId');
    const supabase = createAdminClient();

    if (action === 'fetchConversations') {
      const { data: convData, error: convError } = await supabase.from('conversations').select('*').order('updated_at', { ascending: false });
      if (convError) throw convError;

      const { data: messagesData, error: msgError } = await supabase.from('messages').select('*').order('created_at', { ascending: true });
      if (msgError) throw msgError;

      const conversations = (convData || []).map(conv => {
        const mappedMessages = (messagesData || [])
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
      const { data, error } = await supabase.from('messages').select('*').eq('conversation_id', chatId).order('created_at', { ascending: true });
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
    const data = await request.json();
    const { action, payload } = data;
    const supabase = createAdminClient();

    if (action === 'upsertConversation') {
      const dbPayload = {
        id: payload.id,
        client_name: payload.clientName || payload.client_name,
        client_email: payload.clientEmail || payload.client_email,
        client_company: payload.company || payload.client_company,
        order_id: payload.orderId || payload.order_id,
        order_title: payload.orderTitle || payload.order_title,
        avatar: payload.avatar,
        status: payload.status,
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
      const isOrder = convId.startsWith('order-') || Boolean(payload.order_id);
      const rawOrderId = payload.order_id || (convId.startsWith('order-') ? convId.replace('order-', '') : null);

      // Upsert conversation to prevent Foreign Key constraint violations without corrupting customer name or titles
      try {
        const { data: existingConv } = await supabase.from('conversations').select('*').eq('id', convId).maybeSingle();

        if (!existingConv) {
          let orderInfo = null;
          if (rawOrderId) {
            const { data: o } = await supabase.from('orders').select('title, client_name, client_email, notes').eq('id', rawOrderId).maybeSingle();
            orderInfo = o;
          }

          const finalClientName = (payload.sender === 'client' ? (payload.sender_name || payload.senderName) : null) || orderInfo?.client_name || 'Client';
          const finalClientEmail = payload.client_email || payload.clientEmail || orderInfo?.client_email || 'client@studio.com';
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

      const dbPayload = {
        id: payload.id || `msg-${Date.now()}`,
        conversation_id: convId,
        sender: payload.sender || 'client',
        sender_name: payload.sender_name || payload.senderName || 'Client',
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
            sender_role: dbPayload.sender === 'client' ? 'client' : 'admin',
            is_staff: dbPayload.sender !== 'client',
            message: dbPayload.text,
            attachment: dbPayload.attachment
          }]);
        } catch (omErr) {
          console.warn('order_messages mirror notice:', omErr);
        }
      }

      // Update the conversation's updated_at and unread count
      if (payload.sender === 'client') {
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
