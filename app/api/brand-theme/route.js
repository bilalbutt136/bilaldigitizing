import { NextResponse } from 'next/server';
import { withApiObservability } from '../../../src/lib/observability/apiObservability.js';
import { createAdminClient } from '../../../src/lib/supabase/admin.js';
import { isValidBrandPreset } from '../../../src/utils/themePresets.js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Public read exposes ONLY the brand presentation fields, never site settings,
// emails, tracking tokens, integrations, or admin configuration.
async function GET_impl() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from('site_config')
      .select('value').eq('key', 'site_settings').maybeSingle();
    if (error) throw error;
    let value = {};
    try { value = typeof data?.value === 'string' ? JSON.parse(data.value) : data?.value || {}; }
    catch { value = {}; }
    const safeColor = color => /^#[0-9a-f]{6}$/i.test(String(color || '')) ? color : undefined;
    const custom = value?.customBrandColors;
    const colors = custom && typeof custom === 'object'
      ? { primary:safeColor(custom.primary), secondary:safeColor(custom.secondary), accent:safeColor(custom.accent) }
      : null;
    return NextResponse.json({
      themePreset: isValidBrandPreset(value?.themePreset) ? value.themePreset : 'studio-orange',
      themeFinish: value?.themeFinish === 'solid' ? 'solid' : 'gradient',
      customBrandColors: colors && Object.values(colors).some(Boolean) ? colors : null
    }, { headers: { 'Cache-Control': 'no-store, private, max-age=0' } });
  } catch (error) {
    console.warn('[Public brand theme] sync notice:', error?.message);
    return NextResponse.json({ error:'Unable to refresh branding.' },
      { status:503, headers:{ 'Cache-Control':'no-store' } });
  }
}

export const GET = withApiObservability(GET_impl);
