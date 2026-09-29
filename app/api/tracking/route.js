import { withApiObservability, logServerCaughtError } from '../../../src/lib/observability/apiObservability.js';
import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../src/lib/supabase/admin';
import { checkDistributedRateLimit, getClientIp, getRateLimitHeaders } from '../../../src/lib/rateLimit';
import { createHash } from 'node:crypto';

async function POST_impl(request) {
  try {
    const ip = getClientIp(request);
    const rateLimit = await checkDistributedRateLimit(`tracking:${ip}`, 120, 60 * 1000);
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: rateLimit.unavailable ? 'Tracking service is temporarily unavailable.' : 'Too many tracking events.' },
        { status: rateLimit.unavailable ? 503 : 429, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > 64 * 1024) {
      return NextResponse.json({ error: 'Tracking payload is too large.' }, { status: 413 });
    }

    const data = await request.json().catch(() => ({}));
    const { action, payload } = data;
    if (payload && JSON.stringify(payload).length > 32 * 1024) {
      return NextResponse.json({ error: 'Tracking payload is too large.' }, { status: 413 });
    }

    const supabase = createAdminClient();

    if (action === 'logEvent' && payload && typeof payload === 'object') {
      // 1. Extract high-fidelity server headers (Client IP, Geo, User Agent, Referer)
      const headers = request.headers;
      const forwardedFor = headers.get('x-forwarded-for') || '';
      const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : (
        headers.get('x-real-ip') || 
        headers.get('cf-connecting-ip') || 
        'Unknown IP'
      );
      const country = headers.get('x-vercel-ip-country') || 'Unknown';
      const city = decodeURIComponent(headers.get('x-vercel-ip-city') || '') || 'Unknown';
      const region = headers.get('x-vercel-ip-country-region') || '';
      const latitude = headers.get('x-vercel-ip-latitude') || '';
      const longitude = headers.get('x-vercel-ip-longitude') || '';
      const serverUserAgent = headers.get('user-agent') || '';
      const serverReferer = headers.get('referer') || '';

      // 2. Synthesize complete technical, attribution, geo, and visitor telemetry
      const clientDetails = (payload.details && typeof payload.details === 'object') ? payload.details : {};
      const fullTelemetry = {
        ...clientDetails,
        ip: clientIp !== 'Unknown IP' ? clientIp : (clientDetails.ip || 'Unknown IP'),
        city: city !== 'Unknown' ? city : (clientDetails.city || 'Unknown'),
        country: country !== 'Unknown' ? country : (clientDetails.country || 'Unknown'),
        region: region || clientDetails.region || '',
        latitude: latitude || clientDetails.latitude || '',
        longitude: longitude || clientDetails.longitude || '',
        serverUserAgent: serverUserAgent || clientDetails.userAgent || '',
        serverReferer: serverReferer || clientDetails.referrer || '',
        serverReceivedAt: new Date().toISOString()
      };

      const eventName = String(payload.eventName || payload.event_name || fullTelemetry.eventName || 'PageView').slice(0, 100);
      const userRole = String(payload.userRole || payload.user_role || fullTelemetry.userRole || 'Guest Visitor').slice(0, 100);
      const sourceStr = String(payload.source || `${fullTelemetry.browser || 'Browser'} on ${fullTelemetry.os || 'OS'} (${fullTelemetry.deviceType || 'Device'})`).slice(0, 150);
      const valueStr = String(payload.value !== undefined ? payload.value : '—').slice(0, 100);
      const pagePath = String(payload.pagePath || payload.page_path || payload.path || fullTelemetry.pagePath || '/').slice(0, 500);
      const nowIso = new Date().toISOString();

      // Full JSON payload stored in traffic_source for 100% database compatibility
      const baseRecord = {
        event_name: eventName,
        user_role: userRole,
        source: sourceStr,
        traffic_source: JSON.stringify(fullTelemetry),
        value: valueStr,
        page_path: pagePath,
        event_time: nowIso
      };

      // 3. Insert record (trying with metadata JSONB column first; gracefully falling back if column not yet applied)
      let { error } = await supabase.from('tracking_events').insert([{
        ...baseRecord,
        metadata: fullTelemetry
      }]);

      if (error && (error.code === '42703' || error.message?.includes('metadata'))) {
        const fallback = await supabase.from('tracking_events').insert([baseRecord]);
        error = fallback.error;
      }

      if (error) {
        console.warn('[Tracking API POST] Supabase insert notice:', error.message);
      }

      // 4. Meta Conversions API (CAPI) Dispatcher (Server-side tracking when access token is configured)
      try {
        const metaToken = process.env.META_CONVERSIONS_API_TOKEN;
        const metaPixelId = fullTelemetry.metaPixelId || process.env.NEXT_PUBLIC_META_PIXEL_ID;
        if (metaToken && metaPixelId) {
          const capiPayload = {
            data: [{
              event_name: eventName,
              event_time: Math.floor(Date.now() / 1000),
              event_id: fullTelemetry.eventId || payload.eventId,
              event_source_url: fullTelemetry.pageUrl || `https://bdigitizing.com${pagePath}`,
              action_source: 'website',
              user_data: {
                client_ip_address: clientIp !== 'Unknown IP' ? clientIp : undefined,
                client_user_agent: serverUserAgent || undefined,
                em: fullTelemetry.userEmail
                  ? [createHash('sha256').update(String(fullTelemetry.userEmail).trim().toLowerCase()).digest('hex')]
                  : undefined,
                external_id: fullTelemetry.userId
                  ? [createHash('sha256').update(String(fullTelemetry.userId).trim()).digest('hex')]
                  : undefined,
                fbc: fullTelemetry.fbclid ? `fb.1.${Date.now()}.${fullTelemetry.fbclid}` : undefined
              }
            }]
          };
          fetch(`https://graph.facebook.com/v19.0/${metaPixelId}/events?access_token=${metaToken}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(capiPayload)
          }).catch((error) => { logServerCaughtError(error, { operation: 'tracking.meta_capi_fetch_failed' }); });
        }
      } catch (error) { logServerCaughtError(error, { operation: 'tracking.meta_capi_dispatch_failed' }); }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid tracking event payload' }, { status: 400 });
  } catch (error) {
    console.error('[Tracking API POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const POST = withApiObservability(POST_impl);
