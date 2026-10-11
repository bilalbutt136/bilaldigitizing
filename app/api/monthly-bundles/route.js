import { NextResponse } from 'next/server';
import { withApiObservability } from '../../../src/lib/observability/apiObservability.js';
import { createAdminClient } from '../../../src/lib/supabase/admin';
import { getServerAuthUser } from '../../../src/lib/supabase/serverAuth';
import {
  MONTHLY_BUNDLE_CONFIG_KEY, normalizeMonthlyBundleConfig, normalizeMonthlyBundle
} from '../../../src/utils/monthlyBundles.js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
const headers = { 'Cache-Control': 'private, no-store, max-age=0' };

async function readConfig(db) {
  const { data, error } = await db.from('site_config').select('value').eq('key', MONTHLY_BUNDLE_CONFIG_KEY).maybeSingle();
  if (error) throw error;
  return normalizeMonthlyBundleConfig(data?.value);
}

async function GET_impl(request) {
  try {
    const db = createAdminClient();
    const plans = await readConfig(db);
    const wantsAdmin = new URL(request.url).searchParams.get('admin') === '1';
    if (wantsAdmin) {
      const { user, isAdmin } = await getServerAuthUser(request);
      if (!user || !isAdmin) return NextResponse.json({ error: 'Admin access required.' }, { status: 403, headers });
      return NextResponse.json({ plans }, { headers });
    }
    return NextResponse.json({
      plans: plans.filter(item => item.active)
    }, { headers });
  } catch (error) {
    console.error('[Monthly bundles] read failed:', error?.message);
    return NextResponse.json({ error: 'Monthly plan catalog unavailable.' }, { status: 503, headers });
  }
}

async function POST_impl(request) {
  try {
    const { user, isAdmin } = await getServerAuthUser(request);
    if (!user || !isAdmin) return NextResponse.json({ error: 'Admin access required.' }, { status: 403, headers });
    const payload = await request.json();
    if (!Array.isArray(payload?.plans) || payload.plans.length !== 8) {
      return NextResponse.json({ error: 'Expected all eight monthly plans.' }, { status: 400, headers });
    }
    const plans = payload.plans.map(normalizeMonthlyBundle);
    if (plans.some(item => !item) || new Set(plans.map(item => item.id)).size !== 8) {
      return NextResponse.json({ error: 'Invalid or duplicate service and quota.' }, { status: 400, headers });
    }
    if (payload.plans.some((raw, i) => raw.active && !plans[i].active)) {
      return NextResponse.json({ error: 'Enabled plans require a valid price greater than zero (two decimals maximum).' }, { status: 400, headers });
    }
    const db = createAdminClient();
    const { error } = await db.from('site_config').upsert({
      key: MONTHLY_BUNDLE_CONFIG_KEY,
      value: { plans, updated_at: new Date().toISOString() },
      updated_at: new Date().toISOString()
    }, { onConflict: 'key' });
    if (error) throw error;
    return NextResponse.json({ success: true, plans }, { headers });
  } catch (error) {
    console.error('[Monthly bundles] save failed:', error?.message);
    return NextResponse.json({ error: 'Could not save monthly plan settings.' }, { status: 503, headers });
  }
}

export const GET = withApiObservability(GET_impl);
export const POST = withApiObservability(POST_impl);
