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

      const conversations = convData.map(conv => {
        const mappedMessages = messagesData
          .filter(m => m.conversation_id === conv.id)
          .map(m => ({
            id: m.id,
            sender: m.sender,
            senderName: m.sender_name,
            text: m.text,
            attachment: m.attachment,
            timestamp: m.timestamp
          }));

        return {
          id: conv.id,
          clientName: conv.client_name,
          clientEmail: conv.client_email,
          company: conv.client_company,
          orderId: conv.order_id,
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
      
      const mappedMessages = data.map(m => ({
        id: m.id,
        sender: m.sender,
        senderName: m.sender_name,
        text: m.text,
        attachment: m.attachment,
        timestamp: m.timestamp
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
        client_name: payload.clientName,
        client_email: payload.clientEmail,
        client_company: payload.company,
        order_id: payload.orderId,
        avatar: payload.avatar,
        status: payload.status,
        unread_count: payload.unreadCount
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
      const dbPayload = {
        id: payload.id,
        conversation_id: payload.conversation_id,
        sender: payload.sender,
        sender_name: payload.senderName,
        text: payload.text,
        attachment: payload.attachment,
        timestamp: payload.timestamp
      };
      
      const { error } = await supabase.from('messages').insert([dbPayload]);
      if (error) throw error;
      
      // Update the conversation's updated_at so it bumps to the top
      if (payload.sender === 'client') {
        const { data: convData } = await supabase.from('conversations').select('unread_count').eq('id', payload.conversation_id).single();
        const newCount = convData ? (convData.unread_count || 0) + 1 : 1;
        await supabase.from('conversations')
          .update({ updated_at: new Date().toISOString(), unread_count: newCount })
          .eq('id', payload.conversation_id);
      } else {
        await supabase.from('conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', payload.conversation_id);
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[Messages API POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
