import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '../../../../src/lib/supabase/admin';
import { getServerAuthUser } from '../../../../src/lib/supabase/serverAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function revalidateAllSitePages() {
  try {
    revalidatePath('/', 'layout');
    revalidatePath('/pricing');
    revalidatePath('/services/embroidery-digitizing');
    revalidatePath('/services/vector-tracing');
    revalidatePath('/custom-patches');
    revalidatePath('/portfolio');
    revalidatePath('/');
  } catch (e) {
    console.warn('[Revalidate Error]:', e);
  }
}

export async function GET() {
  try {
    const supabase = createAdminClient();

    // Fetch all components concurrently
    const [
      { data: settings },
      { data: trustStats },
      { data: trustFeatures },
      { data: workflowSteps },
      { data: pricingStaticCards },
      { data: pricingTiers }
    ] = await Promise.all([
      supabase.from('home_page_settings').select('*'),
      supabase.from('trust_stats').select('*').order('sort_order', { ascending: true }),
      supabase.from('trust_features').select('*').order('sort_order', { ascending: true }),
      supabase.from('workflow_steps').select('*').order('sort_order', { ascending: true }),
      supabase.from('pricing_static_cards').select('*').order('sort_order', { ascending: true }),
      supabase.from('pricing_tiers').select('*').order('sort_order', { ascending: true })
    ]);

    // Format settings into a simple key-value object
    const formattedSettings = {};
    if (settings) {
      settings.forEach(s => {
        try {
          formattedSettings[s.key] = typeof s.value === 'string' ? JSON.parse(s.value) : s.value;
        } catch(e) {
          formattedSettings[s.key] = s.value;
        }
      });
    }

    return NextResponse.json({
      settings: formattedSettings,
      trustStats: trustStats || [],
      trustFeatures: trustFeatures || [],
      workflowSteps: workflowSteps || [],
      pricingStaticCards: pricingStaticCards || [],
      pricingTiers: pricingTiers || []
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    });
  } catch (error) {
    console.error('[CMS API GET]', error);
    return NextResponse.json({
      settings: {},
      trustStats: [],
      trustFeatures: [],
      workflowSteps: [],
      pricingStaticCards: [],
      pricingTiers: [],
      error: error.message
    });
  }
}

export async function POST(req) {
  try {
    const { user, isAdmin } = await getServerAuthUser(req);
    if (!user || !isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin privileges required.' }, { status: 403 });
    }

    const supabase = createAdminClient();
    const body = await req.json();
    const { settings = [] } = body;

    if (!Array.isArray(settings) || settings.length === 0) {
      return NextResponse.json({ error: 'Invalid settings payload' }, { status: 400 });
    }

    const records = settings.map(s => ({
      key: s.key,
      value: typeof s.value === 'object' ? JSON.stringify(s.value) : String(s.value),
      updated_at: new Date().toISOString()
    }));

    // Upsert to both site_config and home_page_settings with admin privileges
    await Promise.allSettled([
      supabase.from('site_config').upsert(records, { onConflict: 'key' }),
      supabase.from('home_page_settings').upsert(records, { onConflict: 'key' })
    ]);

    revalidateAllSitePages();

    return NextResponse.json({ success: true, data: records }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    });
  } catch (error) {
    console.error('[CMS API POST EXCEPTION]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
