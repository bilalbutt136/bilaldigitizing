import { NextResponse } from 'next/server';
import { withApiObservability } from '../../../../src/lib/observability/apiObservability.js';
import { createAdminClient } from '../../../src/lib/supabase/admin.js';
import { getActiveMobileOffer } from '../../../src/utils/mobileOffer.js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store'
};

// Public read-only offer snapshot: do not expose the complete admin site_settings.
async function GET_impl() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from('site_config')
      .select('value').eq('key', 'site_settings').maybeSingle();
    if (error) throw error;
    let settings = data?.value || {};
    if (typeof settings === 'string') settings = JSON.parse(settings);

    const live = getActiveMobileOffer({ ...settings, mobileOfferBanner: { enabled: true } });
    const rates = live?.promotion?.serviceDiscounts;
    const allowed = ['embroidery', 'vector', 'patch'];
    const discounts = Object.fromEntries(allowed.map(service => [
      service,
      live && live.promotion?.serviceStatus?.[service] !== false
        ? Math.max(0, Math.min(100, Number(rates?.[service] ?? live.promotion?.discountPercent ?? 0) || 0))
        : 0
    ]));
    const rawBanner = settings?.mobileOfferBanner || {};
    const banner = Object.fromEntries(['enabled', 'eyebrow', 'headline', 'description', 'ctaText']
      .filter(key => typeof rawBanner[key] === 'string' || (key === 'enabled' && typeof rawBanner[key] === 'boolean'))
      .map(key => [key, rawBanner[key]]));

    return NextResponse.json({
      promotionsEnabled: Boolean(live),
      promotions: live ? [{
        status: 'active',
        discountPercent: live.percent,
        serviceDiscounts: discounts,
        serviceStatus: Object.fromEntries(allowed.map(service => [service, discounts[service] > 0]))
      }] : [],
      mobileOfferBanner: banner
    }, { headers: NO_CACHE });
  } catch (error) {
    console.error('[Active Public Promotion]', error?.message || error);
    return NextResponse.json({ error: 'Current promotion unavailable.' }, { status: 503, headers: NO_CACHE });
  }
}

export const GET = withApiObservability(GET_impl);
