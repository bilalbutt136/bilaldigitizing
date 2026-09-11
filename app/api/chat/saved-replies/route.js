import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../../src/lib/supabase/admin';
import { getServerAuthUser } from '../../../../src/lib/supabase/serverAuth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data: replies, error } = await supabase
      .from('saved_replies')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('[Saved Replies GET Notice]:', error.message);
      return NextResponse.json({ replies: [] });
    }

    return NextResponse.json({ replies: replies || [] });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { isAdmin } = await getServerAuthUser(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const body = await request.json();
    const { title, content, shortcut, category = 'general' } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required.' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const id = `reply-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const { data, error } = await supabase
      .from('saved_replies')
      .insert([{
        id,
        title: title.trim(),
        content: content.trim(),
        shortcut: shortcut ? shortcut.trim() : null,
        category: category || 'general',
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, reply: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { isAdmin } = await getServerAuthUser(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing reply id' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from('saved_replies').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
