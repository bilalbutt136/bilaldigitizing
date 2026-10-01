import 'server-only';

import { unstable_cache } from 'next/cache';
import { createAdminClient } from '../supabase/admin';

export const SITE_BRANDING_TAG = 'site-branding';

export const DEFAULT_SITE_BRANDING = Object.freeze({
  id: 1,
  app_icon_url: '/icon-512x512.png',
  favicon_url: '/favicon.png',
  header_logo_url: '/logo.png',
  footer_logo_url: '/logo.png',
  og_image_url: '/icon-512x512.png',
  theme_color: '#ffffff',
  updated_at: null
});

function cleanString(value, fallback = null) {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

export function normalizeSiteBranding(row = null) {
  return {
    id: 1,
    app_icon_url: cleanString(row?.app_icon_url, DEFAULT_SITE_BRANDING.app_icon_url),
    favicon_url: cleanString(row?.favicon_url, DEFAULT_SITE_BRANDING.favicon_url),
    header_logo_url: cleanString(row?.header_logo_url, DEFAULT_SITE_BRANDING.header_logo_url),
    footer_logo_url: cleanString(row?.footer_logo_url, DEFAULT_SITE_BRANDING.footer_logo_url),
    og_image_url: cleanString(row?.og_image_url, DEFAULT_SITE_BRANDING.og_image_url),
    theme_color: /^#[0-9a-f]{6}$/i.test(String(row?.theme_color || ''))
      ? row.theme_color
      : DEFAULT_SITE_BRANDING.theme_color,
    updated_at: row?.updated_at || null
  };
}

async function loadSiteBranding() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('site_branding')
      .select('id, app_icon_url, favicon_url, header_logo_url, footer_logo_url, og_image_url, theme_color, updated_at')
      .eq('id', 1)
      .maybeSingle();

    if (error) {
      // Keep production boot-safe during a rolling deployment before the migration lands.
      console.warn('[siteBranding] Falling back to checked-in assets:', error.message);
      return DEFAULT_SITE_BRANDING;
    }

    return normalizeSiteBranding(data);
  } catch (error) {
    console.warn('[siteBranding] Unable to load branding:', error?.message || error);
    return DEFAULT_SITE_BRANDING;
  }
}

export const getSiteBranding = unstable_cache(
  loadSiteBranding,
  ['site-branding-singleton-v1'],
  {
    revalidate: 300,
    tags: [SITE_BRANDING_TAG]
  }
);

export function brandingToSiteSettings(branding) {
  const normalized = normalizeSiteBranding(branding);
  return {
    appIconUrl: normalized.app_icon_url,
    faviconUrl: normalized.favicon_url,
    headerLogoUrl: normalized.header_logo_url,
    footerLogoUrl: normalized.footer_logo_url,
    ogImageUrl: normalized.og_image_url,
    themeColor: normalized.theme_color,
    // Backward compatibility for existing components that still read logoUrl.
    logoUrl: normalized.header_logo_url
  };
}
