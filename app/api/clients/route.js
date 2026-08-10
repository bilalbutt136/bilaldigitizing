import { NextResponse } from 'next/server';
import { createClient } from '../../../src/lib/supabase/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const supabase = await createClient();

    if (action === 'fetchAll') {
      const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return NextResponse.json({ clients: data });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[Clients API GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { action, payload } = data;
    const supabase = await createClient();

    if (action === 'upsert') {
      const { email, ...rest } = payload;
      const { error } = await supabase
        .from('clients')
        .upsert({ email, ...rest, updated_at: new Date().toISOString() }, { onConflict: 'email' });
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[Clients API POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
