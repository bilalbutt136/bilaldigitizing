import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../src/lib/supabase/admin';

export async function POST(request) {
  try {
    const data = await request.json().catch(() => ({}));
    const { action, payload } = data;
    const supabase = createAdminClient();

    if (action === 'logEvent' && payload && typeof payload === 'object') {
      const sanitizedRecord = {
        event_name: String(payload.event_name || payload.eventName || 'page_view').slice(0, 100),
        event_data: typeof payload.event_data === 'object' ? payload.event_data : (payload.data || {}),
        path: String(payload.path || payload.url || '').slice(0, 500),
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from('tracking_events').insert([sanitizedRecord]);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid tracking event payload' }, { status: 400 });
  } catch (error) {
    console.error('[Tracking API POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
