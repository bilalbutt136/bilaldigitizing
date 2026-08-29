import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '../../../src/lib/supabase/admin';
import { getServerAuthUser } from '../../../src/lib/supabase/serverAuth';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ALLOWED_TABLES = [
  'services', 'pricing_cards', 'patch_cards', 'store_products',
  'pricing_tiers', 'portfolio', 'sew_outs', 'hero_slides',
  'digitizers', 'site_config', 'faqs', 'testimonials'
];

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

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const supabase = createAdminClient();

    if (action === 'fetchAll') {
      const [
        { data: services },
        { data: pricing_cards },
        { data: patch_cards },
        { data: store_products },
        { data: pricing_tiers },
        { data: portfolio },
        { data: sew_outs },
        { data: hero_slides },
        { data: digitizers },
        { data: site_config },
        { data: faqs },
        { data: testimonials }
      ] = await Promise.all([
        supabase.from('services').select('*').order('sort_order', { ascending: true }),
        supabase.from('pricing_cards').select('*').order('sort_order', { ascending: true }),
        supabase.from('patch_cards').select('*').order('sort_order', { ascending: true }),
        supabase.from('store_products').select('*').order('sort_order', { ascending: true }),
        supabase.from('pricing_tiers').select('*').order('display_order', { ascending: true }),
        supabase.from('portfolio').select('*').order('sort_order', { ascending: true }),
        supabase.from('sew_outs').select('*').order('sort_order', { ascending: true }),
        supabase.from('hero_slides').select('*').order('sort_order', { ascending: true }),
        supabase.from('digitizers').select('*').order('sort_order', { ascending: true }),
        supabase.from('site_config').select('key, value'),
        supabase.from('faqs').select('*').order('sort_order', { ascending: true }),
        supabase.from('testimonials').select('*').order('created_at', { ascending: false })
      ]);
      return NextResponse.json({ 
        services, pricing_cards, patch_cards, store_products, pricing_tiers,
        portfolio, sew_outs, hero_slides, digitizers, site_config, faqs, testimonials
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
        }
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[Catalog API GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { action, payload, tableName } = data;
    const supabase = createAdminClient();
    
    const { user, isAdmin } = await getServerAuthUser(request);
    if (!user || !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required.' }, { status: 403 });
    }
    
    if (!ALLOWED_TABLES.includes(tableName)) {
      return NextResponse.json({ error: 'Invalid table name' }, { status: 400 });
    }

    if (action === 'upsert') {
      let upsertPayload = { ...payload };

      // Ensure pricing_tiers has an ID and correctly resolves existing rows
      if (tableName === 'pricing_tiers') {
        const validFields = [
          'id', 'service_type', 'title', 'subtitle', 'badge_text', 'price',
          'original_price', 'price_unit', 'turnaround_time', 'features',
          'button_text', 'is_popular', 'display_order', 'updated_at'
        ];
        const cleaned = {};
        for (const field of validFields) {
          if (upsertPayload[field] !== undefined) {
            cleaned[field] = upsertPayload[field];
          }
        }
        if (!cleaned.id || typeof cleaned.id !== 'string' || cleaned.id.length < 10) {
          const { data: existing } = await supabase
            .from('pricing_tiers')
            .select('id')
            .eq('service_type', cleaned.service_type)
            .eq('display_order', cleaned.display_order)
            .maybeSingle();

          if (existing?.id) {
            cleaned.id = existing.id;
          } else {
            cleaned.id = crypto.randomUUID();
          }
        }
        cleaned.updated_at = new Date().toISOString();
        upsertPayload = cleaned;
      }

      const conflictTarget = tableName === 'site_config' ? 'key' : 'id';
      const { data: savedData, error } = await supabase.from(tableName).upsert(upsertPayload, { onConflict: conflictTarget }).select().single();
      if (error) {
        console.error(`[Catalog API upsert error on ${tableName}]:`, error);
        throw error;
      }
      
      revalidateAllSitePages();
      return NextResponse.json({ success: true, data: savedData });
    }
    
    if (action === 'delete') {
      const { error } = await supabase.from(tableName).delete().eq('id', payload.id);
      if (error) throw error;
      revalidateAllSitePages();
      return NextResponse.json({ success: true });
    }

    if (action === 'upsertMany') {
      await supabase.from(tableName).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (payload && payload.length > 0) {
        const cleanData = payload.map(item => {
          const { id, ...rest } = item;
          return rest;
        });
        const { error } = await supabase.from(tableName).insert(cleanData);
        if (error) throw error;
      }
      revalidateAllSitePages();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[Catalog API POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
