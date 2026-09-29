import 'server-only';

import { unstable_cache } from 'next/cache';
import { createAdminClient } from '../supabase/admin';
import { normalizePublicCatalog } from './normalizePublicCatalog';

async function loadPublicCatalogRows() {
  try {
    const supabase = createAdminClient();
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
      { data: testimonials },
      { data: homePageSettings },
      { data: trustStats },
      { data: trustFeatures },
      { data: workflowSteps },
      { data: pricingStaticCards }
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
      supabase.from('testimonials').select('*').order('created_at', { ascending: false }),
      supabase.from('home_page_settings').select('*'),
      supabase.from('trust_stats').select('*').order('sort_order', { ascending: true }),
      supabase.from('trust_features').select('*').order('sort_order', { ascending: true }),
      supabase.from('workflow_steps').select('*').order('sort_order', { ascending: true }),
      supabase.from('pricing_static_cards').select('*').order('sort_order', { ascending: true })
    ]);

    const formattedHomeSettings = {};
    for (const item of homePageSettings || []) {
      if (!item?.key) continue;
      try {
        formattedHomeSettings[item.key] = typeof item.value === 'string' ? JSON.parse(item.value) : item.value;
      } catch {
        formattedHomeSettings[item.key] = item.value;
      }
    }

    const catalog = normalizePublicCatalog({
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
      testimonials
    });

    return {
      ...catalog,
      homePageConfig: {
        settings: formattedHomeSettings,
        trustStats: trustStats || [],
        trustFeatures: trustFeatures || [],
        workflowSteps: workflowSteps || [],
        pricingStaticCards: pricingStaticCards || [],
        pricingTiers: pricing_tiers || []
      }
    };
  } catch (error) {
    console.warn('[serverCatalog] Unable to preload public catalog:', error?.message || error);
    return null;
  }
}

export const fetchPublicCatalogServer = unstable_cache(
  loadPublicCatalogRows,
  ['bdigitizing-public-catalog-v1'],
  {
    revalidate: 300,
    tags: ['catalog', 'homepage', 'portfolio']
  }
);
