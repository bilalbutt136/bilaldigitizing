import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../../src/lib/supabase/admin';
import { getServerAuthUser } from '../../../../src/lib/supabase/serverAuth';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const supabase = createAdminClient();

    // Fetch from site_config and hero_slides table concurrently
    const [
      { data: configData },
      { data: tableSlides }
    ] = await Promise.all([
      supabase.from('site_config').select('*').eq('key', 'hero_slides').maybeSingle(),
      supabase.from('hero_slides').select('*').order('sort_order', { ascending: true })
    ]);

    let slides = [];
    if (configData?.value) {
      slides = typeof configData.value === 'string' ? JSON.parse(configData.value) : configData.value;
    } else if (tableSlides && tableSlides.length > 0) {
      slides = tableSlides;
    }

    return NextResponse.json({
      success: true,
      slides
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('[Admin Services GET Error]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { isAdmin, user } = await getServerAuthUser(request);
    if (!user || !isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin privileges required.' }, { status: 403 });
    }

    const supabase = createAdminClient();

    const body = await request.json();
    const { serviceData, allSlides } = body;


    if (!serviceData && (!Array.isArray(allSlides) || allSlides.length === 0)) {
      return NextResponse.json({ success: false, error: 'Invalid service payload' }, { status: 400 });
    }

    // 1. Fetch current slides from site_config
    const { data: currentConfig } = await supabase
      .from('site_config')
      .select('value')
      .eq('key', 'hero_slides')
      .maybeSingle();

    let existingSlides = [];
    if (currentConfig?.value) {
      existingSlides = typeof currentConfig.value === 'string' ? JSON.parse(currentConfig.value) : currentConfig.value;
    }

    let updatedSlides = [];
    if (Array.isArray(allSlides) && allSlides.length > 0) {
      updatedSlides = allSlides;
    } else if (serviceData) {
      const sKey = (serviceData.id || serviceData.serviceKey || '').toLowerCase();
      const existingIdx = existingSlides.findIndex(
        s => (s.id || s.serviceKey || '').toLowerCase() === sKey
      );

      const cleanedServiceData = {
        ...serviceData,
        id: sKey,
        serviceKey: sKey,
        updated_at: new Date().toISOString()
      };

      if (existingIdx >= 0) {
        updatedSlides = existingSlides.map((s, i) => i === existingIdx ? cleanedServiceData : s);
      } else {
        updatedSlides = [...existingSlides, cleanedServiceData];
      }
    }

    // 2. Persist to site_config (Key-Value master store)
    const { error: siteConfigError } = await supabase
      .from('site_config')
      .upsert({
        key: 'hero_slides',
        value: updatedSlides,
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });

    if (siteConfigError) {
      console.error('[Site Config Save Error]', siteConfigError);
      throw siteConfigError;
    }

    // 3. Also persist to home_page_settings for redundancy
    try {
      await supabase
        .from('home_page_settings')
        .upsert({
          key: 'hero_slides',
          value: updatedSlides,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });
    } catch (hpErr) {
      console.warn('[Home Page Settings Sync Warning]', hpErr);
    }

    // 4. Map and upsert to public.hero_slides table
    try {
      const tablePayload = updatedSlides.map((slide, idx) => ({
        id: slide.id || slide.serviceKey,
        service_key: slide.serviceKey || slide.id,
        badge: slide.badge || '',
        title: slide.title || '',
        highlight: slide.highlight || '',
        description: slide.description || '',
        rate_label: slide.rate_label || '',
        primary_cta: slide.primary_cta || slide.primaryCta || '',
        secondary_cta: slide.secondary_cta || slide.secondaryCta || '',
        banner_image: slide.afterImg || slide.banner_image || (slide.showcase_images?.[0]?.after_image_url) || '',
        trust_points: [
          {
            stats: slide.stats || [],
            features: slide.features || [],
            packages: slide.packages || [],
            previewTitle: slide.previewTitle || '',
            previewBefore: slide.beforeImg || '',
            previewTag: slide.beforeTag || 'Raw Artwork',
            previewTagAfter: slide.afterTag || 'Finished Production',
            primaryBtnAction: slide.primary_btn_action || '',
            secondaryBtnAction: slide.secondary_btn_action || '',
            showcase_images: slide.showcase_images || slide.showcaseImages || [],
            slideshow_interval: slide.slideshow_interval || 5
          }
        ],
        sort_order: idx,
        is_active: true,
        updated_at: new Date().toISOString()
      }));

      await supabase.from('hero_slides').upsert(tablePayload, { onConflict: 'id' });
    } catch (tableErr) {
      console.warn('[Hero Slides Table Sync Warning]', tableErr);
    }

    // 5. Invalidate Next.js cache for the home page
    try {
      revalidatePath('/');
      revalidatePath('/pricing');
      revalidatePath('/services/embroidery-digitizing');
      revalidatePath('/services/vector-tracing');
      revalidatePath('/custom-patches');
    } catch (cacheErr) {
      console.warn('[Cache Revalidation Warning]', cacheErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Service updated successfully.',
      data: serviceData || updatedSlides[0],
      allSlides: updatedSlides
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    });
  } catch (error) {
    console.error('[Admin Services POST Error]', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Unable to save service. Please try again.'
    }, { status: 500 });
  }
}
