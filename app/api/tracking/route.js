import { NextResponse } from 'next/server';
import { createAdminClient } from '/supabase/admin';

export async function POST(request) {
  try {
    const data = await request.json();
    const { action, payload } = data;
    const supabase = createAdminClient();

    if (action === 'logEvent') {
      const { error } = await supabase.from('tracking_events').insert([payload]);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[Tracking API POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
