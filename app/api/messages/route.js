import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../src/lib/supabase/admin';

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

      const conversations = convData.map(conv => ({
        ...conv,
        messages: messagesData.filter(m => m.conversation_id === conv.id)
      }));

      return NextResponse.json({ conversations });
    }

    if (action === 'fetchMessages') {
      const { data, error } = await supabase.from('messages').select('*').eq('conversation_id', chatId).order('created_at', { ascending: true });
      if (error) throw error;
      return NextResponse.json({ messages: data });
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
      const { data: convData, error } = await supabase.from('conversations').upsert([payload]).select();
      if (error) throw error;
      return NextResponse.json({ success: true, conversation: convData[0] });
    }
    
    if (action === 'insertMessage') {
      const { error } = await supabase.from('messages').insert([payload]);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[Messages API POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
