/**
 * Centralized Promotional Discount Engine for Bilal Digitizing
 * Provides service-level discount resolution, volume tier calculations,
 * and deterministic pricing logic across all order channels.
 */

export const SERVICE_KEYS = {
  EMBROIDERY: 'embroidery',
  VECTOR: 'vector',
  PATCH: 'patch'
};

export const DEFAULT_SERVICE_DISCOUNTS = {
  embroidery: 20, // 20% OFF Embroidery Digitizing
  vector: 10,     // 10% OFF Vector Art & Tracing
  patch: 5        // 5% OFF Custom Patches
};

/**
 * Normalizes any service title, category, or order type to one of the 3 core keys
 */
export function normalizeServiceKey(service) {
  if (!service) return SERVICE_KEYS.EMBROIDERY;
  const s = String(service).toLowerCase().trim();
  
  if (s.includes('vec') || s.includes('trace') || s.includes('line_art')) {
    return SERVICE_KEYS.VECTOR;
  }
  if (s.includes('patch') || s.includes('emblem') || s.includes('crest')) {
    return SERVICE_KEYS.PATCH;
  }
  return SERVICE_KEYS.EMBROIDERY;
}

/**
 * Formats a clean human-readable name for a service key
 */
export function getServiceDisplayName(service) {
  const key = normalizeServiceKey(service);
  switch (key) {
    case SERVICE_KEYS.VECTOR:
      return 'Vector Art / Tracing';
    case SERVICE_KEYS.PATCH:
      return 'Custom Patches';
    case SERVICE_KEYS.EMBROIDERY:
    default:
      return 'Embroidery Digitizing';
  }
}

/**
 * Resolves the currently active promotion from an array of promotions
 */
export function getActivePromotion(promotions) {
  if (!Array.isArray(promotions) || promotions.length === 0) return null;
  
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  return promotions.find(p => {
    if (p.status !== 'active') return false;
    // Check start and end dates if provided
    if (p.startDate && p.startDate > todayStr) return false;
    if (p.endDate && p.endDate < todayStr) return false;
    return true;
  }) || promotions.find(p => p.status === 'active') || null;
}

/**
 * Resolves the specific discount percentage for a given service.
 * Respects granular service discounts, siteSettings overrides, and falls back to flat promo discount.
 */
export function getServiceDiscountPercent(service, activePromo = null, siteSettings = null) {
  const normKey = normalizeServiceKey(service);

  // 1. Check if active promotion defines granular serviceDiscounts
  if (activePromo && activePromo.status === 'active') {
    // Check if this specific service was explicitly disabled in the promo
    if (activePromo.serviceStatus && activePromo.serviceStatus[normKey] === false) {
      return 0;
    }

    if (activePromo.serviceDiscounts && typeof activePromo.serviceDiscounts[normKey] === 'number') {
      return Math.max(0, Math.min(100, activePromo.serviceDiscounts[normKey]));
    }
  }

  // 2. Check siteSettings.service_discounts or siteSettings.serviceDiscounts
  const siteServiceDiscounts = siteSettings?.service_discounts || siteSettings?.serviceDiscounts;
  if (siteServiceDiscounts && typeof siteServiceDiscounts[normKey] === 'number') {
    if (siteServiceDiscounts.enabled !== false) {
      return Math.max(0, Math.min(100, siteServiceDiscounts[normKey]));
    }
  }

  // 3. Fall back to activePromo flat discountPercent if present
  if (activePromo && activePromo.status === 'active' && typeof activePromo.discountPercent === 'number') {
    return Math.max(0, Math.min(100, activePromo.discountPercent));
  }

  // 4. Default fallback if active promo is present with default rates
  if (activePromo && activePromo.status === 'active') {
    return DEFAULT_SERVICE_DISCOUNTS[normKey] || 10;
  }

  return 0;
}

/**
 * Calculates complete itemized order pricing including volume discount,
 * service-specific promo discount, and rush fees.
 */
export function calculateOrderPricing({
  service = 'embroidery',
  unitPrice = 15,
  quantity = 1,
  isRush = false,
  activePromo = null,
  siteSettings = null,
  customPromoPercent = null
}) {
  const serviceKey = normalizeServiceKey(service);
  const serviceName = getServiceDisplayName(serviceKey);
  const qty = Math.max(1, Number(quantity) || 1);
  const unit = Math.max(0, parseFloat(unitPrice) || 0);
  const baseSubtotal = parseFloat((unit * qty).toFixed(2));

  // Volume discount tiers
  let volumeDiscountPercent = 0;
  if (serviceKey !== SERVICE_KEYS.PATCH) {
    if (qty >= 25) volumeDiscountPercent = 25;
    else if (qty >= 10) volumeDiscountPercent = 15;
    else if (qty >= 5) volumeDiscountPercent = 10;
    else if (qty >= 3) volumeDiscountPercent = 5;
  } else {
    // Custom patches bulk discount
    if (qty >= 500) volumeDiscountPercent = 20;
    else if (qty >= 250) volumeDiscountPercent = 12;
    else if (qty >= 100) volumeDiscountPercent = 5;
  }

  const volumeDiscountAmount = parseFloat(((baseSubtotal * volumeDiscountPercent) / 100).toFixed(2));
  const subtotalAfterVolumeDiscount = Math.max(0, baseSubtotal - volumeDiscountAmount);

  // Promotional discount resolution
  let promoDiscountPercent = 0;
  const hasGranularRates = activePromo && activePromo.status === 'active' && activePromo.serviceDiscounts && typeof activePromo.serviceDiscounts[serviceKey] === 'number';

  if (customPromoPercent !== null && customPromoPercent !== undefined && !isNaN(customPromoPercent) && !hasGranularRates) {
    promoDiscountPercent = Math.max(0, Math.min(100, Number(customPromoPercent)));
  } else {
    promoDiscountPercent = getServiceDiscountPercent(serviceKey, activePromo, siteSettings);
  }

  const promoDiscountAmount = parseFloat(((subtotalAfterVolumeDiscount * promoDiscountPercent) / 100).toFixed(2));
  const rushFee = isRush ? (serviceKey === SERVICE_KEYS.PATCH ? 25.00 : 10.00) : 0.00;

  const totalPrice = Math.max(0, parseFloat((subtotalAfterVolumeDiscount - promoDiscountAmount + rushFee).toFixed(2)));
  const totalDiscount = parseFloat((volumeDiscountAmount + promoDiscountAmount).toFixed(2));

  return {
    serviceKey,
    serviceName,
    unitPrice: unit,
    quantity: qty,
    baseSubtotal,
    volumeDiscountPercent,
    volumeDiscountAmount,
    promoDiscountPercent,
    promoDiscountAmount,
    rushFee,
    totalPrice,
    totalDiscount
  };
}

/**
 * Formats a clean summary string of service discounts for UI display
 */
export function formatServiceDiscountsSummary(serviceDiscounts) {
  if (!serviceDiscounts || typeof serviceDiscounts !== 'object') {
    return 'Embroidery: 20% | Vector: 10% | Patches: 5%';
  }
  const emb = serviceDiscounts.embroidery ?? 20;
  const vec = serviceDiscounts.vector ?? 10;
  const pch = serviceDiscounts.patch ?? 5;
  return `Embroidery: ${emb}% | Vector: ${vec}% | Patches: ${pch}%`;
}
