export function parseCatalogConfigValue(value) {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export function normalizePublicCatalog(data = {}) {
  const siteConfig = Array.isArray(data.site_config) ? data.site_config : [];
  const configMap = {};

  for (const item of siteConfig) {
    if (item?.key) configMap[item.key] = parseCatalogConfigValue(item.value);
  }

  const rawSettings = typeof configMap.site_settings === 'object' && configMap.site_settings
    ? configMap.site_settings
    : {};
  const parsedAnnouncement = typeof configMap.announcement === 'object' && configMap.announcement
    ? configMap.announcement
    : (typeof rawSettings.announcement === 'object' ? rawSettings.announcement : null);
  const parsedPromoCodes = Array.isArray(configMap.promoCodes)
    ? configMap.promoCodes
    : (Array.isArray(rawSettings.promoCodes) ? rawSettings.promoCodes : []);
  const parsedPromotions = Array.isArray(configMap.promotions)
    ? configMap.promotions
    : (Array.isArray(rawSettings.promotions) ? rawSettings.promotions : []);

  const currentActivePromo = parsedPromotions.find(p => p?.status === 'active');
  const parsedServiceDiscounts =
    configMap.service_discounts ||
    configMap.serviceDiscounts ||
    currentActivePromo?.serviceDiscounts ||
    { embroidery: 20, vector: 10, patch: 5, enabled: true };

  const serviceDiscounts = currentActivePromo?.serviceDiscounts || {};
  const hasGranular = Boolean(
    currentActivePromo?.serviceDiscounts &&
    (
      serviceDiscounts.embroidery !== serviceDiscounts.vector ||
      serviceDiscounts.vector !== serviceDiscounts.patch
    )
  );

  const maxPromoDiscount = currentActivePromo
    ? (currentActivePromo.serviceDiscounts
      ? Math.max(
          Number(serviceDiscounts.embroidery) || 0,
          Number(serviceDiscounts.vector) || 0,
          Number(serviceDiscounts.patch) || 0,
          Number(currentActivePromo.discountPercent) || 0
        )
      : Number(currentActivePromo.discountPercent) || 0)
    : 0;

  const promoTitleText = currentActivePromo
    ? (hasGranular
      ? `Special Studio Promo: ${serviceDiscounts.embroidery || 20}% OFF Digitizing, ${serviceDiscounts.vector || 10}% OFF Vector, ${serviceDiscounts.patch || 5}% OFF Patches!`
      : `Get ${currentActivePromo.discountPercent}% OFF on All Custom Embroidery Digitizing & Vector Art Orders!`)
    : '';

  const dynamicAnnouncement = currentActivePromo
    ? {
        enabled: parsedAnnouncement?.enabled !== false,
        badge: (currentActivePromo.name || 'SALE').toUpperCase(),
        text: promoTitleText,
        linkText: `Claim ${maxPromoDiscount}% Off`,
        linkUrl: parsedAnnouncement?.linkUrl || '/order',
        promoCode: currentActivePromo.promoCode || `SAVE${currentActivePromo.discountPercent || maxPromoDiscount}`,
        theme: parsedAnnouncement?.theme === 'emerald' ? 'orange' : (parsedAnnouncement?.theme || 'orange'),
        bgColor: parsedAnnouncement?.bgColor && !parsedAnnouncement.bgColor.includes('065f46')
          ? parsedAnnouncement.bgColor
          : 'linear-gradient(90deg, #ea580c 0%, #f97316 50%, #ea580c 100%)',
        textColor: '#ffffff',
        showCodeBadge: true,
        showCountdown: true,
        countdownHours: 24,
        discountValue: maxPromoDiscount
      }
    : (parsedAnnouncement
      ? {
          ...parsedAnnouncement,
          theme: parsedAnnouncement.theme === 'emerald' ? 'orange' : (parsedAnnouncement.theme || 'orange'),
          bgColor: parsedAnnouncement.bgColor && !parsedAnnouncement.bgColor.includes('065f46')
            ? parsedAnnouncement.bgColor
            : 'linear-gradient(90deg, #ea580c 0%, #f97316 50%, #ea580c 100%)'
        }
      : {
          enabled: false,
          badge: '',
          text: '',
          promoCode: '',
          linkText: '',
          linkUrl: '/order'
        });

  return {
    services: data.services || [],
    pricing_tiers: data.pricing_tiers || [],
    patch_cards: data.patch_cards || [],
    store_products: data.store_products || [],
    portfolio: data.portfolio || [],
    sew_outs: data.sew_outs || [],
    hero_slides: data.hero_slides || [],
    digitizers: data.digitizers || [],
    pricing_cards: data.pricing_cards || [],
    site_config: siteConfig,
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
      admin_notification_email: configMap.admin_notification_email || rawSettings.admin_notification_email || null,
      admin_notification_emails: configMap.admin_notification_emails || rawSettings.admin_notification_emails || null,
      notification_settings: configMap.notification_settings || rawSettings.notification_settings || null,
      notification_sound_settings: configMap.notification_sound_settings || rawSettings.notification_sound_settings || null,
      metaPixelId: rawSettings.metaPixelId || configMap.meta_pixel_id || configMap.metaPixelId || null,
      googleAnalyticsId: rawSettings.googleAnalyticsId || configMap.google_analytics_id || configMap.googleAnalyticsId || null,
      tiktokPixelId: rawSettings.tiktokPixelId || configMap.tiktok_pixel_id || configMap.tiktokPixelId || null,
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
      promoCodes: parsedPromoCodes
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
