// Public site_config keys safe and necessary for unauthenticated catalog delivery.
// Never expose server secrets, push subscription stores, webhook secrets, or large
// admin-only CMS blobs through the public catalog payload.
export const PUBLIC_SITE_CONFIG_KEYS = [
  'site_settings',
  'announcement',
  'promotionalBanner',
  'promoCodes',
  'promotions',
  'service_discounts',
  'serviceDiscounts',
  'hero_slides',
  'hero_global_settings',
  'hero_service_text',
  'pricing',
  'contactInfo',
  'meta_pixel_id',
  'metaPixelId',
  'google_analytics_id',
  'googleAnalyticsId',
  'tiktok_pixel_id',
  'tiktokPixelId',
  'custom_header_script',
  'customHeaderScript',
  'trust_features',
  'why_choose_us_steps',
  'vector_format_options',
  'portfolio_categories',
  'order_wizard_formats',
  'admin_notification_email',
  'admin_notification_emails',
  'notification_settings',
  'notification_sound_settings',
  'notification_sound_url'
];

const PUBLIC_SITE_CONFIG_KEY_SET = new Set(PUBLIC_SITE_CONFIG_KEYS);

export function filterPublicSiteConfig(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.filter(row => row?.key && PUBLIC_SITE_CONFIG_KEY_SET.has(row.key));
}
