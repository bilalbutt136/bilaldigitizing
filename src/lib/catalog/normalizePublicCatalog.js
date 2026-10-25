import { filterPublicSiteConfig } from './publicCatalogConfig.js';

export function parseCatalogConfigValue(value) {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export function normalizePublicCatalog(data = {}) {
  const siteConfig = filterPublicSiteConfig(data.site_config);
  const configMap = {};

  for (const item of siteConfig) {
    if (item?.key) configMap[item.key] = parseCatalogConfigValue(item.value);
  }

  const rawSettings = typeof configMap.site_settings === 'object' && configMap.site_settings
    ? configMap.site_settings
    : {};
  const brandingRow = Array.isArray(data.site_branding)
    ? (data.site_branding[0] || null)
    : (data.site_branding || null);
  const headerLogoUrl = brandingRow?.header_logo_url || rawSettings.headerLogoUrl || rawSettings.logoUrl || '/logo.png';
  const footerLogoUrl = brandingRow?.footer_logo_url || rawSettings.footerLogoUrl || rawSettings.logoUrl || '/logo.png';
  const faviconUrl = brandingRow?.favicon_url || rawSettings.faviconUrl || '/favicon.png';
  const appIconUrl = brandingRow?.app_icon_url || rawSettings.appIconUrl || '/icon-512x512.png';
  const ogImageUrl = brandingRow?.og_image_url || rawSettings.ogImageUrl || appIconUrl;
  const brandingThemeColor = brandingRow?.theme_color || rawSettings.themeColor || '#ffffff';
  // Prefer the canonical admin settings even when no legacy flat row exists.
  const parsedAnnouncement = rawSettings.announcement && typeof rawSettings.announcement === 'object'
    ? rawSettings.announcement
    : (configMap.announcement && typeof configMap.announcement === 'object' ? configMap.announcement : null);
  const parsedPromoCodes = Array.isArray(rawSettings.promoCodes)
    ? rawSettings.promoCodes
    : (Array.isArray(configMap.promoCodes) ? configMap.promoCodes : []);
  const parsedPromotions = Array.isArray(rawSettings.promotions)
    ? rawSettings.promotions
    : (Array.isArray(configMap.promotions) ? configMap.promotions : []);

  // No promotion runs unless the administrator explicitly enables the master switch.
  const promotionsEnabled = rawSettings.promotionsEnabled === true;
  const currentActivePromo = promotionsEnabled ? parsedPromotions.find(p => p?.status === 'active') : null;
  const parsedServiceDiscounts = !promotionsEnabled
    ? { embroidery: 0, vector: 0, patch: 0, enabled: false }
    :
    rawSettings.service_discounts ||
    rawSettings.serviceDiscounts ||
    configMap.service_discounts ||
    configMap.serviceDiscounts ||
    currentActivePromo?.serviceDiscounts ||
    { embroidery: 20, vector: 10, patch: 5, enabled: true };

  // Canonical admin ticker settings take precedence over old flat rows.
  // Discount campaigns control pricing only, not the top running message.
  const dynamicAnnouncement = {
    ...(parsedAnnouncement || {}),
    enabled: parsedAnnouncement?.enabled === true,
    autoSync: parsedAnnouncement?.autoSync === true,
    theme: parsedAnnouncement?.theme || 'orange',
    linkUrl: parsedAnnouncement?.linkUrl || '/order',
    showCountdown: false
  };

  return {
    // Keep only the canonical frontend shape. Raw snake_case collections and
    // site_config used to duplicate hundreds of KB in every RSC payload.
    digitizers: data.digitizers || [],
    faqs: data.faqs || [],
    testimonials: data.testimonials || [],

    servicesList: data.services || [],
    dynamicPricingTiers: data.pricing_tiers || [],
    patchCards: data.patch_cards || [],
    storeProducts: data.store_products || [],
    portfolioSamples: data.portfolio || [],
    sewOuts: data.sew_outs || [],
    heroSlides: Array.isArray(configMap.hero_slides) && configMap.hero_slides.length > 0
      ? configMap.hero_slides
      : (data.hero_slides || []),
    pricingCards: data.pricing_cards || [],
    heroGlobalSettings: configMap.hero_global_settings || null,
    heroServiceText: configMap.hero_service_text || null,
    siteSettings: {
      ...rawSettings,
      enableAppInstallPrompt: Boolean(rawSettings.enableAppInstallPrompt),
      logoUrl: headerLogoUrl,
      headerLogoUrl,
      footerLogoUrl,
      faviconUrl,
      appIconUrl,
      ogImageUrl,
      themeColor: brandingThemeColor,
      admin_notification_email: configMap.admin_notification_email || rawSettings.admin_notification_email || null,
      admin_notification_emails: configMap.admin_notification_emails || rawSettings.admin_notification_emails || null,
      notification_settings: configMap.notification_settings || rawSettings.notification_settings || null,
      notification_sound_settings: configMap.notification_sound_settings || rawSettings.notification_sound_settings || null,
      metaPixelId: rawSettings.metaPixelId || configMap.meta_pixel_id || configMap.metaPixelId || null,
      googleAnalyticsId: rawSettings.googleAnalyticsId || configMap.google_analytics_id || configMap.googleAnalyticsId || null,
      tiktokPixelId: rawSettings.tiktokPixelId || configMap.tiktok_pixel_id || configMap.tiktokPixelId || null,
      customHeaderScript: rawSettings.customHeaderScript || configMap.custom_header_script || configMap.customHeaderScript || null,
      promotionsEnabled,
      promotions: parsedPromotions,
      service_discounts: parsedServiceDiscounts,
      serviceDiscounts: parsedServiceDiscounts,
      announcement: dynamicAnnouncement,
      promotionalBanner: {
        enabled: false,
        title: '',
        description: '',
        promoCode: '',
        ctaText: 'Claim Offer',
        ctaLink: '/order'
      },
      promoCodes: promotionsEnabled ? parsedPromoCodes : parsedPromoCodes.map(code => ({ ...code, isActive: false }))
    },
    pricing: configMap.pricing || null,
    serviceCms: {
      trust_features: configMap.trust_features || [],
      why_choose_us_steps: configMap.why_choose_us_steps || [],
      vector_format_options: configMap.vector_format_options || [],
      portfolio_categories: configMap.portfolio_categories || [],
      order_wizard_formats: configMap.order_wizard_formats || []
    }
  };
}
