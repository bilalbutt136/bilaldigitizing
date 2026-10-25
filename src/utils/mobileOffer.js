// A mobile offer is only shown when the admin has an active, eligible live promotion.
// Never promise an unconfigured discount or invent a deadline.
export const DEFAULT_MOBILE_OFFER_BANNER = Object.freeze({
  enabled: true,
  eyebrow: 'STUDIO SAVINGS',
  headline: 'Make your next design stand out',
  description: 'Explore the current savings on eligible studio services.',
  ctaText: 'Explore discounted services'
});

export function getActiveMobileOffer(settings, today = new Date()) {
  if (settings?.promotionsEnabled !== true || settings?.mobileOfferBanner?.enabled === false) return null;

  const date = today.toISOString().slice(0, 10);
  const promotion = (Array.isArray(settings?.promotions) ? settings.promotions : [])
    .find(p => p?.status === 'active' &&
      (!p.startDate || p.startDate <= date) &&
      (!p.endDate || p.endDate >= date));
  if (!promotion) return null;

  const serviceRates = promotion.serviceDiscounts;
  const rates = serviceRates
    ? ['embroidery', 'vector', 'patch'].filter(service => promotion.serviceStatus?.[service] !== false)
      .map(service => Number(serviceRates[service] ?? 0))
    : [Number(promotion.discountPercent ?? 0)];
  const highest = Math.max(0, ...rates.filter(Number.isFinite));
  if (highest <= 0) return null;

  return { percent: Math.min(100, highest), promotion };
}
