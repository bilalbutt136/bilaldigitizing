import { withApiObservability } from '../../../src/lib/observability/apiObservability.js';
import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache';
import { createAdminClient } from '../../../src/lib/supabase/admin';
import { getServerAuthUser } from '../../../src/lib/supabase/serverAuth';
import crypto from 'crypto';
import { PUBLIC_SITE_CONFIG_KEYS } from '../../../src/lib/catalog/publicCatalogConfig.js';

export const dynamic = 'force-dynamic';

const ALLOWED_TABLES = [
  'services', 'pricing_cards', 'patch_cards', 'store_products',
  'pricing_tiers', 'portfolio', 'sew_outs', 'hero_slides',
  'digitizers', 'site_config', 'faqs', 'testimonials'
];

function revalidateAllSitePages() {
  try {
    revalidatePath('/', 'layout');
    revalidatePath('/', 'page');
    revalidatePath('/portfolio', 'page');
    revalidatePath('/portfolio', 'layout');
    revalidatePath('/pricing', 'page');
    revalidatePath('/services/embroidery-digitizing', 'page');
    revalidatePath('/services/vector-tracing', 'page');
    revalidatePath('/custom-patches', 'page');
    revalidatePath('/api/catalog');
    revalidateTag('portfolio', 'max');
    revalidateTag('catalog', 'max');
  } catch (e) {
    console.warn('[Revalidate Error]:', e);
  }
}

const fetchPublicCatalogBundle = unstable_cache(
  async () => {
    const supabase = createAdminClient();
    const results = await Promise.all([
      supabase.from('services').select('*').order('sort_order', { ascending: true }),
      supabase.from('pricing_cards').select('*').order('sort_order', { ascending: true }),
      supabase.from('patch_cards').select('*').order('sort_order', { ascending: true }),
      supabase.from('store_products').select('*').order('sort_order', { ascending: true }),
      supabase.from('pricing_tiers').select('*').order('display_order', { ascending: true }),
      supabase.from('portfolio').select('*').order('sort_order', { ascending: true }),
      supabase.from('sew_outs').select('*').order('sort_order', { ascending: true }),
      supabase.from('hero_slides').select('*').order('sort_order', { ascending: true }),
      supabase.from('digitizers').select('*').order('sort_order', { ascending: true }),
      supabase.from('site_config').select('key, value').in('key', PUBLIC_SITE_CONFIG_KEYS),
      supabase.from('faqs').select('*').order('sort_order', { ascending: true }),
      supabase.from('testimonials').select('*').order('created_at', { ascending: false }),
      supabase.from('customer_reviews')
        .select('id, display_name, rating, review_text, service_category, published_at, submitted_at')
        .eq('is_published', true)
        .eq('moderation_status', 'published')
        .order('published_at', { ascending: false })
        .limit(24),
      supabase.from('site_branding')
        .select('id, app_icon_url, favicon_url, header_logo_url, footer_logo_url, og_image_url, theme_color, updated_at')
        .eq('id', 1)
        .maybeSingle()
    ]);

    const firstError = results.slice(0, -1).find(result => result.error)?.error;
    if (firstError) throw firstError;

    const [
      services,
      pricing_cards,
      patch_cards,
      store_products,
      pricing_tiers,
      portfolio,
      sew_outs,
      hero_slides,
      digitizers,
      site_config,
      faqs,
      testimonials,
      customerReviews,
      siteBranding
    ] = results.map(result => result.data || []);

    const publishedCustomerTestimonials = (customerReviews || []).map(review => ({
      id: `customer-review-${review.id}`,
      client_name: review.display_name || 'Verified Customer',
      role: 'Verified Customer',
      rating: Number(review.rating) || 5,
      review_text: review.review_text || '',
      service_category: review.service_category || 'Embroidery',
      is_active: true,
      verified_order_review: true,
      created_at: review.published_at || review.submitted_at
    }));

    const combinedTestimonials = [
      ...publishedCustomerTestimonials,
      ...(testimonials || [])
    ];

    return {
      services,
      pricing_cards,
      patch_cards,
      store_products,
      pricing_tiers,
      portfolio,
      sew_outs,
      hero_slides,
      digitizers,
      site_config,
      site_branding: siteBranding && !Array.isArray(siteBranding) ? siteBranding : null,
      faqs,
      testimonials: combinedTestimonials
    };
  },
  ['public-catalog-bundle-v4'],
  { revalidate: 300, tags: ['catalog', 'portfolio', 'site-branding'] }
);

async function GET_impl(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'fetchAll') {
      const catalog = await fetchPublicCatalogBundle();
      return NextResponse.json(catalog, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
        }
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[Catalog API GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function POST_impl(request) {
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
          const { id: _id, ...rest } = item;
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

export const GET = withApiObservability(GET_impl);
export const POST = withApiObservability(POST_impl);
