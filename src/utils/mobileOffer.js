import { getServiceDiscountPercent } from './promoUtils.js';

// Campaign eligibility is shared between the VIP banner and the real checkout quote.
// A hidden marketing banner must not switch off an otherwise active promotion.
export const DEFAULT_MOBILE_OFFER_BANNER = Object.freeze({
  enabled: true,
  eyebrow: 'VIP STUDIO OFFER',
  headline: 'Digitizing & Vector Art',
  description: 'Save on eligible studio services.',
  ctaText: 'Claim deal'
});

function resolveLiveOffer(settings, today) {
  if (settings?.promotionsEnabled !== true) return null;
  const date = today.toISOString().slice(0, 10);
  const promotion = (Array.isArray(settings?.promotions) ? settings.promotions : [])
    .find(p => p?.status === 'active' &&
      (!p.startDate || p.startDate <= date) &&
      (!p.endDate || p.endDate >= date));
  if (!promotion) return null;

  const serviceRates = promotion.serviceDiscounts;
  const rates = serviceRates
    ? ['embroidery', 'vector', 'patch']
      .filter(service => promotion.serviceStatus?.[service] !== false)
      .map(service => Number(serviceRates[service] ?? 0))
    : [Number(promotion.discountPercent ?? 0)];
  const highest = Math.max(0, ...rates.filter(Number.isFinite));
  if (highest <= 0) return null;
  return { percent: Math.min(100, highest), promotion };
}

export function getActiveMobileOffer(settings, today = new Date()) {
  if (settings?.mobileOfferBanner?.enabled === false) return null;
  return resolveLiveOffer(settings, today);
}

export function getLiveStudioDiscountPercent(settings, service, today = new Date()) {
  const offer = resolveLiveOffer(settings, today);
  if (!offer) return 0;
  return getServiceDiscountPercent(service, offer.promotion, settings);
}
