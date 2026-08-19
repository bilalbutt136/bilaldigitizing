import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../src/lib/supabase/admin';

export async function POST(request) {
  try {
    const data = await request.json().catch(() => ({}));
    const { action, payload } = data;
    const supabase = createAdminClient();

    if (action === 'logEvent' && payload && typeof payload === 'object') {
      const sanitizedRecord = {
        event_name: String(payload.event_name || payload.eventName || 'PageView').slice(0, 100),
        user_role: String(payload.user_role || payload.userRole || 'Guest Visitor').slice(0, 100),
        source: String(payload.source || 'Visitor browser').slice(0, 100),
        traffic_source: String(payload.traffic_source || payload.trafficSource || 'Direct').slice(0, 200),
        value: String(payload.value !== undefined ? payload.value : '—').slice(0, 100),
        page_path: String(payload.page_path || payload.pagePath || payload.path || payload.url || '/').slice(0, 500),
        event_time: new Date().toISOString()
      };

      const { error } = await supabase.from('tracking_events').insert([sanitizedRecord]);
      if (error) {
        console.warn('[Tracking API POST] Supabase insert warning:', error.message);
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid tracking event payload' }, { status: 400 });
  } catch (error) {
    console.error('[Tracking API POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
