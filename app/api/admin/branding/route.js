import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { withApiObservability } from '../../../../src/lib/observability/apiObservability.js';
import { createAdminClient } from '../../../../src/lib/supabase/admin';
import { getServerAuthUser } from '../../../../src/lib/supabase/serverAuth';
import {
  DEFAULT_SITE_BRANDING,
  SITE_BRANDING_TAG,
  getSiteBranding,
  normalizeSiteBranding
} from '../../../../src/lib/branding/serverBranding';

export const dynamic = 'force-dynamic';

const ASSET_FIELDS = [
  'app_icon_url',
  'favicon_url',
  'header_logo_url',
  'footer_logo_url',
  'og_image_url'
];

function normalizeAssetUrl(value, fallback) {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value !== 'string') throw new Error('Asset URL must be a string.');

  const trimmed = value.trim();
  if (!trimmed) return fallback;

  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed;

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error('Asset URL must be an absolute HTTPS URL or a root-relative path.');
  }

  if (parsed.protocol !== 'https:') {
    throw new Error('Branding asset URLs must use HTTPS.');
  }

  return parsed.toString();
}

function buildBrandingPayload(body = {}) {
  const payload = { id: 1 };

  for (const field of ASSET_FIELDS) {
    payload[field] = normalizeAssetUrl(
      body[field],
      DEFAULT_SITE_BRANDING[field]
    );
  }

  const themeColor = String(body.theme_color || DEFAULT_SITE_BRANDING.theme_color).trim();
  if (!/^#[0-9a-f]{6}$/i.test(themeColor)) {
    throw new Error('Theme color must be a six-digit hex value such as #ffffff.');
  }

  payload.theme_color = themeColor.toLowerCase();
  payload.updated_at = new Date().toISOString();

  return payload;
}

async function GET_impl(request) {
  const { user, isAdmin } = await getServerAuthUser(request);
  if (!user || !isAdmin) {
    return NextResponse.json(
      { success: false, error: 'Admin access required.' },
      { status: 403 }
    );
  }

  const branding = await getSiteBranding();
  return NextResponse.json(
    { success: true, branding },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

async function PUT_impl(request) {
  try {
    const { user, isAdmin } = await getServerAuthUser(request);
    if (!user || !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Admin access required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const payload = buildBrandingPayload(body);
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('site_branding')
      .upsert(payload, { onConflict: 'id' })
      .select('id, app_icon_url, favicon_url, header_logo_url, footer_logo_url, og_image_url, theme_color, updated_at')
      .single();

    if (error) throw error;

    revalidateTag(SITE_BRANDING_TAG, 'max');
    revalidateTag('catalog', 'max');
    revalidatePath('/', 'layout');
    revalidatePath('/manifest.webmanifest');
    revalidatePath('/admin-portal');

    return NextResponse.json(
      {
        success: true,
        branding: normalizeSiteBranding(data)
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    const message = error?.message || 'Failed to save branding settings.';
    const status = /URL|Theme color|string/i.test(message) ? 400 : 500;
    console.error('[Branding API PUT]', error);
    return NextResponse.json(
      { success: false, error: message },
      { status }
    );
  }
}

export const GET = withApiObservability(GET_impl);
export const PUT = withApiObservability(PUT_impl);
