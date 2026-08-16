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

      // Upsert conversation to prevent Foreign Key constraint violations
      try {
        await supabase.from('conversations').upsert({
          id: convId,
          order_id: rawOrderId,
          order_title: payload.order_title || payload.orderTitle || (isOrder ? `Order #${rawOrderId}` : 'General Inquiries'),
          client_name: payload.sender_name || payload.senderName || 'Client',
          client_email: payload.client_email || payload.clientEmail || 'client@studio.com',
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
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
      
      // Fetch the conversation to get the client_email
      const { data: convData } = await supabase.from('conversations')
        .select('client_email')
        .eq('id', conversation_id)
        .single();
        
      if (convData && convData.client_email) {
        // Mark all conversations from this client as read to support deduplicated grouping
        const { error } = await supabase.from('conversations')
          .update({ unread_count: 0 })
          .eq('client_email', convData.client_email);
        if (error) throw error;
      } else {
        // Fallback to just the id if email is not found
        const { error } = await supabase.from('conversations')
          .update({ unread_count: 0 })
          .eq('id', conversation_id);
        if (error) throw error;
      }
      
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[Messages API POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
