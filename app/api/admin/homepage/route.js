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
    // Return empty arrays on error (like if tables don't exist yet)
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

export async function POST(request) {
  try {
    const { action, payload } = await request.json();
    const supabase = createAdminClient();

    if (action === 'updateSettings') {
      // payload should be an array of {key, value}
      const upsertData = payload.map(item => ({
        key: item.key,
        value: JSON.stringify(item.value),
        updated_at: new Date().toISOString()
      }));
      
      const { error } = await supabase.from('home_page_settings').upsert(upsertData, { onConflict: 'key' });
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === 'upsertTableRow') {
      const { table, data } = payload;
      // Allow specific tables only
      const allowedTables = ['trust_stats', 'trust_features', 'workflow_steps', 'pricing_static_cards', 'pricing_tiers'];
      if (!allowedTables.includes(table)) throw new Error('Invalid table');

      // Add timestamps if new
      const rowData = { ...data };
      if (!rowData.id) {
        // Supabase will generate UUID if not provided and it's omitted
        delete rowData.id;
      }
      
      const { error } = await supabase.from(table).upsert(rowData);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === 'deleteTableRow') {
      const { table, id } = payload;
      const allowedTables = ['trust_stats', 'trust_features', 'workflow_steps', 'pricing_static_cards', 'pricing_tiers'];
      if (!allowedTables.includes(table)) throw new Error('Invalid table');

      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[CMS API POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
