import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../../src/lib/supabase/admin';

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

    const { data, error } = await supabase
      .from('home_page_settings')
      .upsert(records, { onConflict: 'key' })
      .select();

    if (error) {
      console.error('[CMS API POST]', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[CMS API POST EXCEPTION]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


